import { describe, expect, it } from "vitest";
import { transition, sumCents } from "../lib/domain";
describe("delivery invariants", () => {
  it("blocks delivery completion without required verification", () => expect(() => transition("ARRIVED_DROPOFF","DELIVERED",{required:true,passed:false})).toThrow());
  it("allows verified regulated completion", () => expect(transition("VERIFICATION_REQUIRED","DELIVERED",{required:true,passed:true})).toBe("DELIVERED"));
  it("keeps money in integer cents", () => expect(sumCents(1299,250,300)).toBe(1849));
});
