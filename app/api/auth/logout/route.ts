import { NextResponse } from "next/server";
export function POST() { const response=NextResponse.json({authenticated:false}); response.headers.set("set-cookie","me2u_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"); return response; }
