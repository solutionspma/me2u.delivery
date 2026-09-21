import { z } from "zod";
import { authenticateRequest } from "../../../../../lib/auth";
import { responseError, responseOk } from "../../../../../lib/api";
import { geocodeAddress } from "../../../../../lib/location";
export async function POST(request:Request){try{await authenticateRequest(request).catch(()=>null);const input=z.object({query:z.string().min(3).max(300)}).parse(await request.json());return responseOk(await geocodeAddress(input.query));}catch(error){return responseError(error);}}
