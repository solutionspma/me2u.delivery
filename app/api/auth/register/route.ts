import { z } from "zod";
import { responseError, responseOk } from "../../../../lib/api";
import { provisionCustomer, registerIdentity } from "../../../../lib/registration";
const schema=z.object({firstName:z.string().min(1).max(80),lastName:z.string().min(1).max(80),email:z.string().email(),password:z.string().min(8),phone:z.string().max(40).optional()});
export async function POST(request:Request){try{const input=schema.parse(await request.json());const name=`${input.firstName} ${input.lastName}`;const identity=await registerIdentity({email:input.email,password:input.password,name,orgName:`Me2U customer ${name}`});await provisionCustomer({userId:identity.user!.id,email:input.email,name});const response=responseOk({authenticated:true},201);response.headers.append("set-cookie",`me2u_session=${identity.token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);return response;}catch(error){return responseError(error);}}
