import { z } from "zod";
import { authenticateRequest, requireRole } from "../../../../lib/auth";
import { checkoutCart } from "../../../../lib/repository";
import { responseError, responseOk } from "../../../../lib/api";
import { StripeTestProvider } from "../../../../lib/stripe";
import { recordPayment } from "../../../../lib/phase4";
const schema=z.object({merchantId:z.string().uuid(),address:z.record(z.unknown()),instructions:z.string().max(2000).optional(),tipCents:z.number().int().nonnegative(),deliveryFeeCents:z.number().int().nonnegative(),serviceFeeCents:z.number().int().nonnegative(),taxCents:z.number().int().nonnegative(),paymentMethodId:z.string().min(3),idempotencyKey:z.string().min(8).max(200)});
export async function POST(request:Request){try{const session=await authenticateRequest(request);requireRole(session,["CUSTOMER"]);const input=schema.parse(await request.json());const order=await checkoutCart(session,input);const paymentResult=await new StripeTestProvider().authorizeWithPaymentMethod({amountCents:Number(order.total_cents),currency:"USD",reference:order.id,paymentMethodId:input.paymentMethodId});const payment=await recordPayment(session,{orderId:order.id,deliveryId:order.delivery_id,provider:"STRIPE_TEST",providerTransactionRef:paymentResult.providerReference,idempotencyKey:input.idempotencyKey,amountCents:Number(order.total_cents),status:paymentResult.status});return responseOk({...order,payment:{id:payment.id,status:paymentResult.status,clientSecret:paymentResult.clientSecret}},201,session.correlationId);}catch(error){return responseError(error);}}
