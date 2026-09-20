export const ROLES = ["PLATFORM_ADMIN","PLATFORM_OPERATIONS","TENANT_ADMIN","DISPATCHER","MERCHANT_OWNER","MERCHANT_ADMIN","MERCHANT_MANAGER","MERCHANT_USER","MERCHANT_STAFF","COURIER","CUSTOMER","COMPLIANCE_REVIEWER","SUPPORT"] as const;
export type Role = typeof ROLES[number];
export const DELIVERY_STATES = ["REQUESTED","AWAITING_DISPATCH","ASSIGNED","COURIER_EN_ROUTE_TO_PICKUP","ARRIVED_PICKUP","PICKED_UP","IN_TRANSIT","ARRIVED_DROPOFF","VERIFICATION_REQUIRED","DELIVERED","CANCELLED","FAILED","REFUSED","RETURN_REQUIRED","RETURNING","RETURNED"] as const;
export type DeliveryState = typeof DELIVERY_STATES[number];
export type Verification = { required: boolean; passed: boolean; provider?: string; reference?: string; ageThreshold?: number; recipientMatch?: boolean };
export type DeliveryClass = "STANDARD" | "REGULATED" | "ERRAND";
const transitions: Record<DeliveryState, DeliveryState[]> = {
  REQUESTED:["AWAITING_DISPATCH","CANCELLED"], AWAITING_DISPATCH:["ASSIGNED","CANCELLED"], ASSIGNED:["COURIER_EN_ROUTE_TO_PICKUP","CANCELLED"], COURIER_EN_ROUTE_TO_PICKUP:["ARRIVED_PICKUP","FAILED"], ARRIVED_PICKUP:["PICKED_UP","FAILED"], PICKED_UP:["IN_TRANSIT","RETURN_REQUIRED"], IN_TRANSIT:["ARRIVED_DROPOFF","FAILED"], ARRIVED_DROPOFF:["VERIFICATION_REQUIRED","DELIVERED","REFUSED"], VERIFICATION_REQUIRED:["DELIVERED","REFUSED","RETURN_REQUIRED"], DELIVERED:[], CANCELLED:[], FAILED:["RETURN_REQUIRED"], REFUSED:["RETURN_REQUIRED"], RETURN_REQUIRED:["RETURNING"], RETURNING:["RETURNED"], RETURNED:[]
};
export function canTransition(from: DeliveryState, to: DeliveryState, verification: Verification): boolean { if (to === "DELIVERED" && verification.required && !verification.passed) return false; return transitions[from].includes(to); }
export function transition(from: DeliveryState, to: DeliveryState, verification: Verification): DeliveryState { if (!canTransition(from,to,verification)) throw new Error(`Invalid delivery transition: ${from} -> ${to}`); return to; }
export function cents(amount: number): number { if (!Number.isInteger(amount) || amount < 0) throw new Error("Money must be a non-negative integer number of cents"); return amount; }
export function sumCents(...amounts: number[]): number { return amounts.reduce((sum, amount) => sum + cents(amount), 0); }
