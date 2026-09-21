import { NextResponse } from "next/server";
import { ZodError } from "zod";
export class ApiError extends Error { constructor(public code:string, public status:number, message=code) { super(message); } }
export function responseError(error: unknown, correlationId?: string) {
  const code = error instanceof ApiError ? error.code : error instanceof ZodError ? "INVALID_REQUEST" : error instanceof Error ? error.message : "INTERNAL_ERROR";
  const status = error instanceof ApiError ? error.status
    : code === "UNAUTHENTICATED" ? 401
    : ["FORBIDDEN", "TENANT_ACCESS_DENIED"].includes(code) ? 403
    : ["NOT_FOUND", "CONFLICT", "EXISTING_ACCOUNT_LOGIN_REQUIRED", "APPLICATION_ALREADY_EXISTS"].includes(code) ? (code === "NOT_FOUND" ? 404 : 409)
    : ["INVALID_REQUEST", "INVALID_TRANSITION", "VERIFICATION_REQUIRED", "POD_REQUIRED"].includes(code) ? 422
    : ["DISCOVERY_PROVIDER_NOT_CONFIGURED", "LOCATION_PROVIDER_NOT_CONFIGURED", "DISCOVERY_PROVIDER_UNAVAILABLE", "LOCATION_UNAVAILABLE"].includes(code) ? 503
    : code === "IDENTITY_PROVIDER_ERROR" ? 502
    : 500;
  const publicCode = status === 500 ? "INTERNAL_ERROR" : code;
  return NextResponse.json({ error: { code: publicCode, message: status === 500 ? "Internal server error" : publicCode }, correlationId }, { status, headers: { "x-request-id": correlationId ?? crypto.randomUUID() } });
}
export function responseOk<T>(body:T, status=200, correlationId?:string) { return NextResponse.json(body, {status, headers:{"x-request-id":correlationId ?? crypto.randomUUID()}}); }
