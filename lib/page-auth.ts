import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateRequest, requireRole, type Session } from "./auth";
import type { Role } from "./domain";
export async function pageSession():Promise<Session|null> { const incoming=await headers(); const forwarded=new Headers(); for(const name of ["authorization","cookie","x-request-id"]) { const value=incoming.get(name); if(value) forwarded.set(name,value); } try { return await authenticateRequest(new Request("https://me2u.delivery",{headers:forwarded})); } catch { return null; } }
export async function requirePageRole(allowed:Role[], nextPath:string):Promise<Session> { const session=await pageSession(); if(!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`); try { return requireRole(session,allowed); } catch { redirect("/app"); } }
