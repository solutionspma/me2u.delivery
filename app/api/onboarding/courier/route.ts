import { z } from "zod";
import { responseError, responseOk } from "../../../../lib/api";
import { provisionCourier, registerIdentity } from "../../../../lib/registration";
const schema=z.object({name:z.string().min(2).max(120),email:z.string().email(),password:z.string().min(8),phone:z.string().min(7).max(40),market:z.string().min(2).max(120)});
export async function POST(request:Request){try{const input=schema.parse(await request.json());const identity=await registerIdentity({email:input.email,password:input.password,name:input.name,orgName:`Me2U Courier ${input.name}`});const application=await provisionCourier({userId:identity.user!.id,email:input.email,name:input.name,contact:{phone:input.phone,market:input.market}});const response=responseOk({application},201);response.headers.append("set-cookie",`me2u_session=${identity.token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);return response;}catch(error){return responseError(error);}}
