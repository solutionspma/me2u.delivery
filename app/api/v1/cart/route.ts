import { z } from "zod";
import { authenticateRequest, requireRole } from "../../../../lib/auth";
import { addCartItem, getCustomerCart } from "../../../../lib/repository";
import { responseError, responseOk } from "../../../../lib/api";
const schema=z.object({merchantId:z.string().uuid(),productId:z.string().uuid(),quantity:z.number().int().positive(),modifiers:z.array(z.unknown()).default([]),specialInstructions:z.string().max(1000).optional()});
export async function GET(request:Request){try{const session=await authenticateRequest(request);requireRole(session,["CUSTOMER"]);return responseOk(await getCustomerCart(session),200,session.correlationId);}catch(error){return responseError(error);}}
export async function POST(request:Request){try{const session=await authenticateRequest(request);requireRole(session,["CUSTOMER"]);return responseOk(await addCartItem(session,schema.parse(await request.json())),201,session.correlationId);}catch(error){return responseError(error);}}
