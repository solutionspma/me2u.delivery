import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ ok:true, service:"me2u.delivery", environment:process.env.NEXT_PUBLIC_APP_ENV ?? "development", timestamp:new Date().toISOString() }); }
