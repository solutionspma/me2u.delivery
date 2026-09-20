import { z } from "zod";
import { authenticateRequest, requireRole } from "../../../../../../lib/auth";
import { assignCourier } from "../../../../../../lib/repository";
import { responseError, responseOk } from "../../../../../../lib/api";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) { try { const session=await authenticateRequest(request); requireRole(session,["PLATFORM_ADMIN","PLATFORM_OPERATIONS","DISPATCHER"]); const body=z.object({courierId:z.string().uuid()}).parse(await request.json()); return responseOk(await assignCourier(session,(await params).id,body.courierId),200,session.correlationId); } catch(error) { return responseError(error); } }
