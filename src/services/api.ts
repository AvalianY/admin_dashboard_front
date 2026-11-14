import type { Envelope } from "../types/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
interface Options {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
  signal?: AbortSignal;
}
export const expiredSessionEvent = "epharmacy:session-expired";
export async function api<T>(path: string, options: Options = {}): Promise<Envelope<T>> {
  const base = import.meta.env.VITE_API_BASE_URL ?? "/api";
  if (base !== "/api" || !path.startsWith("/") || path.startsWith("//"))
    throw new ApiError(0, "CONFIGURATION_ERROR", "The API must use the local /api route.");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(base + path, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
      credentials: "omit",
    });
  } catch (error) {
    if (options.signal?.aborted || (error instanceof DOMException && error.name === "AbortError"))
      throw error;
    throw new ApiError(0, "NETWORK_ERROR", "The server could not be reached. Please try again.");
  }
  if (response.status === 401 && options.token && typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent(expiredSessionEvent, { detail: options.token }));
  if (response.status === 204) return { data: undefined as T };
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "The service returned an unreadable response. Please try again.",
    );
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "The service returned an incomplete response.",
    );
  const body = parsed as Envelope<T> & {
    error?: { code: string; message: string; details?: unknown };
  };
  if (!response.ok)
    throw new ApiError(
      response.status,
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.message ?? "The request could not be completed.",
      body.error?.details,
    );
  if (!("data" in body))
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "The service returned an incomplete response.",
    );
  return body;
}
export function validationMessages(details: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!details || typeof details !== "object") return result;
  if (Array.isArray(details)) {
    for (const issue of details)
      if (issue && typeof issue.message === "string") {
        const field =
          typeof issue.path === "string"
            ? issue.path.split(".")[0]
            : Array.isArray(issue.path)
              ? issue.path[0]
              : undefined;
        if (typeof field === "string" && field) result[field] = issue.message;
      }
  } else if (
    "fieldErrors" in details &&
    details.fieldErrors &&
    typeof details.fieldErrors === "object"
  ) {
    for (const [field, errors] of Object.entries(details.fieldErrors))
      if (Array.isArray(errors) && typeof errors[0] === "string") result[field] = errors[0];
  }
  return result;
}
