import { z } from "zod";
import { authenticateRequest, requireRole } from "../../../../../lib/auth";
import { responseError, responseOk } from "../../../../../lib/api";
import { withTransaction } from "../../../../../lib/db";

const schema = z.object({ candidateIds: z.array(z.string().uuid()).min(1).max(50) });

export async function POST(request: Request) {
  try {
    const session = authenticateRequest(request);
    const resolved = await session;
    requireRole(resolved, ["MERCHANT_OWNER", "MERCHANT_MANAGER"]);
    const input = schema.parse(await request.json());
    const result = await withTransaction(async (client) => {
      const candidates = await client.query("SELECT id FROM discovered_business WHERE id = ANY($1::uuid[]) AND status NOT IN ('REJECTED','STALE')", [input.candidateIds]);
      if (candidates.rows.length !== input.candidateIds.length) throw new Error("NOT_FOUND");
      const claim = await client.query("INSERT INTO merchant_claim(applicant_user_id,tenant_id,status) VALUES($1,$2,'CLAIMED') RETURNING id,status", [resolved.userId, resolved.tenantId]);
      for (const candidate of candidates.rows) await client.query("INSERT INTO merchant_claim_location(claim_id,discovered_business_id,relationship) VALUES($1,$2,'POSSIBLE_RELATED_LOCATION')", [claim.rows[0].id, candidate.id]);
      await client.query("UPDATE discovered_business SET status='CLAIMED',updated_at=now() WHERE id=ANY($1::uuid[])", [input.candidateIds]);
      await client.query("INSERT INTO audit_event(tenant_id,actor_id,action,resource_type,resource_id,correlation_id,metadata) VALUES($1,$2,'merchant.discovery_claimed','merchant_claim',$3,$4,$5)", [resolved.tenantId,resolved.userId,claim.rows[0].id,resolved.correlationId,JSON.stringify({candidateIds:input.candidateIds,operatorRelationship:'UNVERIFIED'})]);
      return claim.rows[0];
    });
    return responseOk(result, 201, resolved.correlationId);
  } catch (error) { return responseError(error); }
}
