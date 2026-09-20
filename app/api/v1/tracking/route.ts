import { z } from "zod";
import { authenticateRequest, requireRole } from "../../../../lib/auth";
import { appendTracking } from "../../../../lib/repository";
import { responseError, responseOk } from "../../../../lib/api";
const schema=z.object({deliveryId:z.string().uuid(),latitude:z.number(),longitude:z.number(),accuracy:z.number().nonnegative().optional(),heading:z.number().optional(),speed:z.number().nonnegative().optional(),capturedAt:z.string().datetime(),deviceRef:z.string().max(200).optional()});
export async function POST(request:Request) { try { const session=await authenticateRequest(request); requireRole(session,["COURIER"]); return responseOk(await appendTracking(session,schema.parse(await request.json())),202,session.correlationId); } catch(error) { return responseError(error); } }
