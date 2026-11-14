import type { Session } from "../types/api";
export const sessionKey = "epharmacy.session";
export function readSession(
  storage: Pick<Storage, "getItem" | "removeItem"> = sessionStorage,
  now = Date.now(),
): Session | null {
  try {
    const raw = storage.getItem(sessionKey);
    if (!raw) return null;
    const value: Session = JSON.parse(raw);
    if (
      typeof value.accessToken !== "string" ||
      !value.accessToken ||
      value.tokenType !== "Bearer" ||
      !value.user ||
      typeof value.user.id !== "string" ||
      !Number.isFinite(Date.parse(value.expiresAt)) ||
      Date.parse(value.expiresAt) <= now
    ) {
      storage.removeItem(sessionKey);
      return null;
    }
    return value;
  } catch {
    try {
      storage.removeItem(sessionKey);
    } catch {
      /* Unavailable storage cannot be cleaned. */
    }
    return null;
  }
}
export function saveSession(value: Session) {
  sessionStorage.setItem(sessionKey, JSON.stringify(value));
}
export function removeSession() {
  try {
    sessionStorage.removeItem(sessionKey);
  } catch {
    /* Storage may be unavailable in a restricted browser context. */
  }
}
