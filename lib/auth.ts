import type { Role } from "./domain";

export type Session = { userId: string; tenantId: string | null; roles: Role[] };
export function requireRole(session: Session | null, allowed: Role[]): Session { if (!session || !session.roles.some(role => allowed.includes(role))) throw new Error("FORBIDDEN"); return session; }
export function assertTenantAccess(session: Session, resourceTenantId: string): void { if (!session.roles.some(role => role.startsWith("PLATFORM_")) && session.tenantId !== resourceTenantId) throw new Error("TENANT_ACCESS_DENIED"); }
// The request adapter is intentionally server-only. Replace this with YAHBASE auth/session validation.
export function sessionFromHeaders(headers: Headers): Session | null { const userId = headers.get("x-me2u-user"); const tenantId = headers.get("x-me2u-tenant"); const roles = (headers.get("x-me2u-roles") ?? "").split(",").filter(Boolean) as Role[]; return userId ? { userId, tenantId, roles } : null; }
