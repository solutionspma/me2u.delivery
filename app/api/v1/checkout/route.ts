import { z } from "zod";
import { authenticateRequest, requireRole } from "../../../../lib/auth";
import { checkoutCart } from "../../../../lib/repository";
import { responseError, responseOk } from "../../../../lib/api";
const schema=z.object({merchantId:z.string().uuid(),address:z.record(z.unknown()),instructions:z.string().max(2000).optional(),tipCents:z.number().int().nonnegative(),deliveryFeeCents:z.number().int().nonnegative(),serviceFeeCents:z.number().int().nonnegative(),taxCents:z.number().int().nonnegative()});
export async function POST(request:Request){try{const session=await authenticateRequest(request);requireRole(session,["CUSTOMER"]);return responseOk(await checkoutCart(session,schema.parse(await request.json())),201,session.correlationId);}catch(error){return responseError(error);}}
