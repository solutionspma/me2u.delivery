import { describe,expect,it } from "vitest";
import { networkContract } from "../lib/network-contracts";
import { AuthorizeNetAdapter } from "../lib/authorize-net";
describe("Phase 4 contracts",()=>{
  it("keeps network mappings versioned and source-owned",()=>{expect(networkContract.version).toBe("v1");expect(networkContract.rules).toContain("No direct cross-application database access");});
  it("fails closed without Authorize.Net credentials",async()=>{await expect(new AuthorizeNetAdapter().authorize({amountCents:100,currency:"USD",reference:"test"})).rejects.toThrow("AUTHORIZE_NET_CREDENTIALS_NOT_CONFIGURED");});
});
