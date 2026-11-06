export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function badRequest(message: string): ApiError {
  return new ApiError(400, "BAD_REQUEST", message);
}
export function unauthorized(message = "Not authenticated"): ApiError {
  return new ApiError(401, "UNAUTHORIZED", message);
}
export function forbidden(message = "Forbidden"): ApiError {
  return new ApiError(403, "FORBIDDEN", message);
}
export function notFound(message = "Not found"): ApiError {
  return new ApiError(404, "NOT_FOUND", message);
}
export function conflict(message: string): ApiError {
  return new ApiError(409, "CONFLICT", message);
}
export function unprocessable(message: string): ApiError {
  return new ApiError(422, "UNPROCESSABLE", message);
}

export function toErrorResponse(err: unknown): { status: number; body: Record<string, unknown> } {
  if (err instanceof ApiError) {
    return { status: err.status, body: { ok: false, error: { code: err.code, message: err.message } } };
  }
  if (err instanceof Error) {
    // Zod errors
    const maybeZod = err as unknown as { issues?: Array<{ path: unknown[]; message: string }> };
    if (Array.isArray(maybeZod.issues)) {
      return {
        status: 400,
        body: {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: maybeZod.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
          },
        },
      };
    }
    // Defensive: honor a numeric HTTP status + code attached to a plain Error
    // (e.g. from a helper that predates ApiError) instead of masking it as 500.
    const maybeStatus = err as unknown as { status?: unknown; code?: unknown };
    if (
      typeof maybeStatus.status === "number" &&
      maybeStatus.status >= 400 &&
      maybeStatus.status < 600 &&
      typeof maybeStatus.code === "string"
    ) {
      return { status: maybeStatus.status, body: { ok: false, error: { code: maybeStatus.code, message: err.message } } };
    }
    console.error("[api]", err);
    return { status: 500, body: { ok: false, error: { code: "INTERNAL", message: "Internal server error" } } };
  }
  console.error("[api] unknown error", err);
  return { status: 500, body: { ok: false, error: { code: "INTERNAL", message: "Internal server error" } } };
}
