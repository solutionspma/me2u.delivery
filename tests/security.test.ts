import { describe, expect, it } from "vitest";
import { assertTenantAccess, requireRole, type Session } from "../lib/auth";
import { transition } from "../lib/domain";

const merchant:Session={userId:"u",tenantId:"tenant-a",organizationId:null,roles:["MERCHANT_USER"],correlationId:"c"};
describe("server authorization invariants",()=>{
  it("denies cross-tenant resource access",()=>expect(()=>assertTenantAccess(merchant,"tenant-b")).toThrow("TENANT_ACCESS_DENIED"));
  it("does not let merchants act as dispatchers",()=>expect(()=>requireRole(merchant,["DISPATCHER"])).toThrow("FORBIDDEN"));
  it("rejects invalid transitions",()=>expect(()=>transition("REQUESTED","DELIVERED",{required:false,passed:false})).toThrow());
  it("keeps failed verification from satisfying the completion gate",()=>expect(()=>transition("VERIFICATION_REQUIRED","DELIVERED",{required:true,passed:false})).toThrow());
});
