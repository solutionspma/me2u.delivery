import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { authenticateRequest, requireRole } from "../../../../../lib/auth";
import { responseError, responseOk } from "../../../../../lib/api";
import { db, withTransaction } from "../../../../../lib/db";
import { configuredDiscoveryProviders } from "../../../../../lib/merchant-discovery";

const actionSchema = z.object({ action: z.literal("INVITE"), candidateId: z.string().uuid() });

export async function GET(request: Request) {
  try {
    const session = await authenticateRequest(request);
    requireRole(session, ["PLATFORM_ADMIN", "PLATFORM_OPERATIONS"]);
    const query = new URL(request.url).searchParams.get("q")?.trim();
    if (!query) {
      const rows = await db().query("SELECT d.*, COALESCE(json_agg(jsonb_build_object('provider',s.provider,'sourceRecordId',s.source_record_id,'confidence',s.confidence,'retrievedAt',s.retrieved_at)) FILTER (WHERE s.id IS NOT NULL),'[]') AS sources FROM discovered_business d LEFT JOIN discovery_source s ON s.discovered_business_id=d.id GROUP BY d.id ORDER BY d.updated_at DESC LIMIT 100");
      return responseOk({ candidates: rows.rows, providers: configuredDiscoveryProviders().map((provider) => provider.name) }, 200, session.correlationId);
    }
    const providers = configuredDiscoveryProviders();
    if (!providers.length) throw new Error("DISCOVERY_PROVIDER_NOT_CONFIGURED");
    const discovered = (await Promise.all(providers.map((provider) => provider.searchBusinesses(query)))).flat();
    const candidates = await withTransaction(async (client) => {
      const result = [];
      for (const item of discovered) {
        const existing = await client.query("SELECT id FROM discovered_business WHERE normalized_name=$1 AND COALESCE(address->>'formatted','')=COALESCE($2,'') LIMIT 1", [item.normalizedName, item.address.formatted ?? null]);
        const candidate = existing.rows[0] ?? (await client.query("INSERT INTO discovered_business(display_name,normalized_name,phone,website,address,latitude,longitude,category,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'DISCOVERED') RETURNING id", [item.displayName,item.normalizedName,item.phone ?? null,item.website ?? null,JSON.stringify(item.address),item.latitude ?? null,item.longitude ?? null,item.category ?? null])).rows[0];
        const source = await client.query("INSERT INTO discovery_source(discovered_business_id,source_type,provider,source_record_id,source_url,payload,confidence) VALUES($1,'BUSINESS_PROVIDER',$2,$3,$4,$5,$6) ON CONFLICT(provider,source_record_id) DO UPDATE SET payload=EXCLUDED.payload,confidence=EXCLUDED.confidence,retrieved_at=now() RETURNING id", [candidate.id,item.provider,item.sourceRecordId,item.sourceUrl ?? null,JSON.stringify(item.raw),item.confidence]);
        await client.query("INSERT INTO discovery_observation(discovered_business_id,field_name,value,source_id,authority,confidence) VALUES($1,'business_name',$2,$3,'TRUSTED_PROVIDER',$4)", [candidate.id,JSON.stringify(item.displayName),source.rows[0]?.id ?? null,item.confidence]);
        result.push({ ...item, id: candidate.id });
      }
      return result;
    });
    return responseOk({ candidates, providers: providers.map((provider) => provider.name), query }, 200, session.correlationId);
  } catch (error) { return responseError(error); }
}

export async function POST(request: Request) {
  try {
    const session = await authenticateRequest(request);
    requireRole(session, ["PLATFORM_ADMIN", "PLATFORM_OPERATIONS"]);
    const input = actionSchema.parse(await request.json());
    const result = await withTransaction(async (client) => {
      const candidate = await client.query("SELECT display_name FROM discovered_business WHERE id=$1", [input.candidateId]);
      if (!candidate.rows[0]) throw new Error("NOT_FOUND");
      const rawToken = randomBytes(32).toString("base64url");
      const invitation = await client.query("INSERT INTO merchant_invitation(email,business_name,token_hash,status,invited_by,expires_at) VALUES($1,$2,$3,'INVITED',$4,now()+interval '30 days') RETURNING id,expires_at", ["",candidate.rows[0].display_name,createHash("sha256").update(rawToken).digest("hex"),session.userId]);
      await client.query("UPDATE discovered_business SET status='READY_FOR_REVIEW',updated_at=now() WHERE id=$1", [input.candidateId]);
      await client.query("INSERT INTO audit_event(tenant_id,actor_id,action,resource_type,resource_id,correlation_id,metadata) VALUES($1,$2,'merchant.discovery_invited','discovered_business',$3,$4,$5)",[session.tenantId,session.userId,input.candidateId,session.correlationId,JSON.stringify({businessName:candidate.rows[0].display_name})]);
      return { invitationId: invitation.rows[0].id, expiresAt: invitation.rows[0].expires_at, inviteToken: rawToken };
    });
    return responseOk(result, 201, session.correlationId);
  } catch (error) { return responseError(error); }
}
