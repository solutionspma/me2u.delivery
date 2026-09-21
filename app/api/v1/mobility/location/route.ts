import { z } from "zod";
import { authenticateRequest, requireRole } from "../../../../../lib/auth";
import { responseError, responseOk } from "../../../../../lib/api";
import { appendTracking } from "../../../../../lib/repository";
const schema=z.object({deliveryId:z.string().uuid(),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),accuracy:z.number().nonnegative().optional(),heading:z.number().optional(),speed:z.number().nonnegative().optional(),capturedAt:z.string().datetime(),deviceRef:z.string().max(200).optional()});
export async function POST(request:Request){try{const session=await authenticateRequest(request);requireRole(session,["COURIER"]);return responseOk(await appendTracking(session,schema.parse(await request.json())),202,session.correlationId);}catch(error){return responseError(error);}}
