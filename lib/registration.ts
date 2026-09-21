import { db, withTransaction } from "./db";
import { randomUUID } from "crypto";
import { ApiError } from "./api";

type IdentityResponse = { token?: string; user?: { id: string; email: string; name?: string; full_name?: string }; error?: string };

export async function registerIdentity(input:{email:string;password:string;name:string;orgName:string}) {
  const base = process.env.YAHBASE_API_BASE ?? "https://yahbase.com";
  const upstream = await fetch(`${base}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // YAHBASE's public contract uses snake_case for organization creation.
    body: JSON.stringify({ email: input.email, password: input.password, name: input.name, org_name: input.orgName }),
    cache: "no-store",
  });
  const body = await upstream.json().catch(() => ({})) as IdentityResponse;
  if (upstream.status === 409) throw new ApiError("EXISTING_ACCOUNT_LOGIN_REQUIRED", 409);
  if (!upstream.ok) throw new ApiError("IDENTITY_PROVIDER_ERROR", upstream.status >= 500 ? 502 : 422);
  if (!body.token || !body.user?.id) throw new ApiError("IDENTITY_PROVIDER_ERROR", 502);
  return body as IdentityResponse & { token: string; user: { id: string; email: string; name?: string; full_name?: string } };
}
export async function provisionCustomer(input:{userId:string;email:string;name:string}){return withTransaction(async client=>{const orgId=randomUUID(),tenantId=randomUUID();await client.query("INSERT INTO app_user(id,external_auth_id,email,display_name) VALUES($1,$2,$3,$4) ON CONFLICT(external_auth_id) DO NOTHING",[input.userId,input.userId,input.email,input.name]);await client.query("INSERT INTO organization(id,name,slug) VALUES($1,$2,$3)",[orgId,`Me2U customer ${input.email}`,`customer-${input.userId}`]);await client.query("INSERT INTO tenant(id,organization_id,name,slug,environment) VALUES($1,$2,$3,$4,'production')",[tenantId,orgId,"Me2U Customer",`customer-${input.userId}`]);await client.query("INSERT INTO membership(tenant_id,user_id,role) VALUES($1,$2,'CUSTOMER') ON CONFLICT DO NOTHING",[tenantId,input.userId]);await client.query("INSERT INTO customer(tenant_id,user_id,display_name,contact) VALUES($1,$2,$3,'{}') ON CONFLICT DO NOTHING",[tenantId,input.userId,input.name]);return {tenantId};});}
export async function provisionMerchant(input:{userId:string;email:string;name:string;businessName:string;contact:Record<string,unknown>}) {
  let step = "start";
  try {
    return await withTransaction(async client => {
      const orgId = randomUUID(), tenantId = randomUUID();
      step = "app_user";
      await client.query("INSERT INTO app_user(id,external_auth_id,email,display_name) VALUES($1,$2,$3,$4) ON CONFLICT(external_auth_id) DO NOTHING", [input.userId, input.userId, input.email, input.name]);
      step = "organization";
      await client.query("INSERT INTO organization(id,name,slug) VALUES($1,$2,$3)", [orgId, input.businessName, `merchant-${input.userId}`]);
      step = "tenant";
      await client.query("INSERT INTO tenant(id,organization_id,name,slug,environment) VALUES($1,$2,$3,$4,'production')", [tenantId, input.businessName, `merchant-${input.userId}`]);
      step = "membership";
      await client.query("INSERT INTO membership(tenant_id,user_id,role) VALUES($1,$2,'MERCHANT_OWNER') ON CONFLICT DO NOTHING", [tenantId, input.userId]);
      step = "merchant_application";
      const application = await client.query("INSERT INTO merchant_application(tenant_id,applicant_user_id,business_name,contact,status) VALUES($1,$2,$3,$4,'DRAFT') RETURNING id,status", [tenantId, input.userId, input.businessName, JSON.stringify(input.contact)]);
      return application.rows[0];
    });
  } catch (error) {
    const databaseError = error as { code?: string; constraint?: string; table?: string; column?: string; message?: string; detail?: string; where?: string };
    console.error("[merchant-provision-failed]", { step, code: databaseError.code, constraint: databaseError.constraint, table: databaseError.table, column: databaseError.column, message: databaseError.message, detail: databaseError.detail, where: databaseError.where });
    throw new ApiError("DATABASE_ERROR", 500);
  }
}
export async function provisionCourier(input:{userId:string;email:string;name:string;contact:Record<string,unknown>}){return withTransaction(async client=>{const orgId=randomUUID(),tenantId=randomUUID();await client.query("INSERT INTO app_user(id,external_auth_id,email,display_name) VALUES($1,$2,$3,$4) ON CONFLICT(external_auth_id) DO NOTHING",[input.userId,input.userId,input.email,input.name]);await client.query("INSERT INTO organization(id,name,slug) VALUES($1,$2,$3)",[orgId,`Me2U Courier ${input.email}`,`courier-${input.userId}`]);await client.query("INSERT INTO tenant(id,organization_id,name,slug,environment) VALUES($1,$2,$3,$4,'production')",[tenantId,orgId,"Me2U Courier",`courier-${input.userId}`]);await client.query("INSERT INTO membership(tenant_id,user_id,role) VALUES($1,$2,'COURIER') ON CONFLICT DO NOTHING",[tenantId,input.userId]);const application=await client.query("INSERT INTO courier_application(tenant_id,applicant_user_id,contact,status) VALUES($1,$2,$3,'DRAFT') RETURNING id,status",[tenantId,input.userId,JSON.stringify(input.contact)]);return application.rows[0];});}
