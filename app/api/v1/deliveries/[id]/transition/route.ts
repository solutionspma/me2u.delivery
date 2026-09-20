import { NextResponse } from "next/server";
import { z } from "zod";
import { transition, type DeliveryState } from "../../../../../../lib/domain";
import { sessionFromHeaders, requireRole } from "../../../../../../lib/auth";

const schema=z.object({ from:z.string(), to:z.string(), verification:z.object({required:z.boolean(),passed:z.boolean(),provider:z.string().optional(),reference:z.string().optional()}) });
export async function POST(request:Request) { try { requireRole(sessionFromHeaders(request.headers), ["PLATFORM_ADMIN","PLATFORM_OPERATIONS","DISPATCHER","COURIER"]); const body=schema.parse(await request.json()); const state=transition(body.from as DeliveryState, body.to as DeliveryState, body.verification); return NextResponse.json({ id:"transition-recorded", state, event:`delivery.${body.to.toLowerCase()}` }); } catch(error) { const message=error instanceof Error?error.message:"INVALID_REQUEST"; return NextResponse.json({error:message}, {status:message==="FORBIDDEN"?403:422}); } }
