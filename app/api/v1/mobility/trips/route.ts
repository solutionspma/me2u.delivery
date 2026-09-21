import { z } from "zod";
import { authenticateRequest, requireRole } from "../../../../../lib/auth";
import { responseError, responseOk } from "../../../../../lib/api";
import { createMobilityTrip } from "../../../../../lib/phase4";
const schema=z.object({deliveryId:z.string().uuid()});
export async function POST(request:Request){try{const session=await authenticateRequest(request);requireRole(session,["PLATFORM_OPERATIONS","TENANT_ADMIN","DISPATCHER","MERCHANT_OWNER","MERCHANT_MANAGER","MERCHANT_STAFF"]);return responseOk(await createMobilityTrip(session,schema.parse(await request.json()).deliveryId),201,session.correlationId);}catch(error){return responseError(error);}}
