import { authenticateRequest } from "../../../../lib/auth";
import { responseError, responseOk } from "../../../../lib/api";
export async function GET(request:Request){try{const session=await authenticateRequest(request);return responseOk({userId:session.userId,tenantId:session.tenantId,roles:session.roles});}catch(error){return responseError(error);}}
