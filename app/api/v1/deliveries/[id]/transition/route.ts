import { z } from "zod";
import { authenticateRequest, requireRole } from "../../../../../../lib/auth";
import { transitionDelivery } from "../../../../../../lib/repository";
import { responseError, responseOk } from "../../../../../../lib/api";
const schema=z.object({ to:z.enum(["REQUESTED","AWAITING_DISPATCH","ASSIGNED","COURIER_EN_ROUTE_TO_PICKUP","ARRIVED_PICKUP","PICKED_UP","IN_TRANSIT","ARRIVED_DROPOFF","VERIFICATION_REQUIRED","DELIVERED","CANCELLED","FAILED","REFUSED","RETURN_REQUIRED","RETURNING","RETURNED"]), verification:z.object({required:z.boolean(),passed:z.boolean(),provider:z.string().optional(),reference:z.string().optional(),recipientMatch:z.boolean().optional()}), reason:z.string().max(500).optional() });
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) { try { const session=await authenticateRequest(request); requireRole(session,["PLATFORM_ADMIN","PLATFORM_OPERATIONS","DISPATCHER","COURIER"]); const body=schema.parse(await request.json()); return responseOk(await transitionDelivery(session,(await params).id,body.to,body.verification,body.reason),200,session.correlationId); } catch(error) { return responseError(error); } }
