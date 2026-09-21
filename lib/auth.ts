import { ROLES, type Role } from "./domain";
import { db } from "./db";
import { yahbase } from "./yahbase";

export type Session = { userId: string; tenantId: string | null; organizationId: string | null; roles: Role[]; correlationId: string };
type YahbaseUser = { id: string; org_id: string; role?: string; email?: string; full_name?: string };
const platformRoles = new Set<Role>(["PLATFORM_ADMIN", "PLATFORM_OPERATIONS"]);
const mapRole = (role: string | undefined): Role | null => { const normalized = String(role ?? "").toUpperCase(); const aliases: Record<string, Role> = { ADMIN:"PLATFORM_ADMIN", STAFF:"PLATFORM_OPERATIONS", OWNER:"TENANT_ADMIN", MERCHANT:"MERCHANT_USER" }; return (ROLES.includes(normalized as Role) ? normalized as Role : aliases[normalized] ?? null); };
export async function authenticateRequest(request: Request): Promise<Session> {
  const correlationId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const demoCookie=request.headers.get("cookie")?.match(/(?:^|;\s*)me2u_demo=(customer|merchant|courier)/)?.[1];
  if (process.env.NODE_ENV !== "production" && process.env.ME2U_DEMO_MODE === "true" && demoCookie) return demoSession(demoCookie as "customer"|"merchant"|"courier",correlationId);
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? request.headers.get("cookie")?.match(/(?:^|;\s*)me2u_session=([^;]+)/)?.[1];
  if (!bearer) {
    if (process.env.NODE_ENV !== "production" && process.env.ME2U_TEST_AUTH === "true") return testSession(request.headers, correlationId);
    throw new Error("UNAUTHENTICATED");
  }
  const user = await yahbaseWithBearer<YahbaseUser>("/auth/me", bearer);
  const memberships = await db().query<{ tenant_id:string; role:Role }>("SELECT tenant_id, role FROM membership WHERE user_id=$1", [user.id]);
  const roles = [...new Set([mapRole(user.role), ...memberships.rows.map(row => row.role)].filter((value): value is Role => Boolean(value)))];
  const tenantId = memberships.rows[0]?.tenant_id ?? user.org_id ?? null;
  if (!roles.length || !tenantId) throw new Error("NO_ME2U_MEMBERSHIP");
  return { userId:user.id, tenantId, organizationId:user.org_id ?? null, roles, correlationId };
}
function demoSession(kind:"customer"|"merchant"|"courier",correlationId:string):Session { const map={customer:{userId:"00000000-0000-4000-8000-000000000010",roles:["CUSTOMER"] as Role[]},merchant:{userId:"00000000-0000-4000-8000-000000000011",roles:["MERCHANT_ADMIN"] as Role[]},courier:{userId:"00000000-0000-4000-8000-000000000012",roles:["COURIER"] as Role[]}} as const; return {userId:map[kind].userId,tenantId:"00000000-0000-4000-8000-000000000002",organizationId:"00000000-0000-4000-8000-000000000001",roles:map[kind].roles,correlationId}; }
async function yahbaseWithBearer<T>(path: string, token: string): Promise<T> { const base=process.env.YAHBASE_API_BASE ?? "https://yahbase.com"; const response=await fetch(`${base}${path}`, { headers:{ authorization:`Bearer ${token}` }, cache:"no-store" }); if (!response.ok) throw new Error("UNAUTHENTICATED"); return response.json() as Promise<T>; }
function testSession(headers: Headers, correlationId: string): Session { const userId=headers.get("x-me2u-user"); const tenantId=headers.get("x-me2u-tenant"); const roles=(headers.get("x-me2u-roles") ?? "").split(",").map(mapRole).filter((value): value is Role => Boolean(value)); if (!userId || !tenantId || !roles.length) throw new Error("UNAUTHENTICATED"); return { userId, tenantId, organizationId:null, roles, correlationId }; }
export function requireRole(session: Session, allowed: Role[]): Session { if (!session.roles.some(role => allowed.includes(role) || platformRoles.has(role))) throw new Error("FORBIDDEN"); return session; }
export function assertTenantAccess(session: Session, resourceTenantId: string): void { if (!session.roles.some(role => platformRoles.has(role)) && session.tenantId !== resourceTenantId) throw new Error("TENANT_ACCESS_DENIED"); }
export function isPlatform(session: Session): boolean { return session.roles.some(role => platformRoles.has(role)); }
