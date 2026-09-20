import { createHash } from "crypto";
import { responseError, responseOk } from "../../../../../lib/api";
import { db } from "../../../../../lib/db";
export async function GET(request:Request,{params}:{params:Promise<{token:string}>}) { try { const token=(await params).token; const result=await db().query("SELECT d.id,d.delivery_number,d.state,d.requested_at,d.updated_at FROM tracking_token t JOIN delivery d ON d.id=t.delivery_id AND d.tenant_id=t.tenant_id WHERE t.token_hash=$1 AND t.revoked_at IS NULL AND (t.expires_at IS NULL OR t.expires_at>now())",[createHash("sha256").update(token).digest("hex")]); if(!result.rows[0]) return responseError(new Error("NOT_FOUND")); return responseOk(result.rows[0]); } catch(error) { return responseError(error); } }
