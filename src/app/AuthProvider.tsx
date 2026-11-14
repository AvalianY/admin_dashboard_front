import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { api, expiredSessionEvent } from "../services/api";
import { readSession, saveSession, removeSession } from "../services/session";
import type { Session, User } from "../types/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => ({
    session: readSession(),
    verified: null as string | null,
    error: null as string | null,
  }));
  const [attempt, setAttempt] = useState(0);
  const clear = useCallback(() => {
    removeSession();
    setState({ session: null, verified: null, error: null });
  }, []);
  const { session, verified } = state;
  useEffect(() => {
    if (!session || verified === session.accessToken) return;
    const controller = new AbortController();
    api<User>("/user/user-info", { token: session.accessToken, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        const restored = { ...session, user: result.data };
        saveSession(restored);
        setState((current) =>
          current.session?.accessToken === session.accessToken
            ? { session: restored, verified: session.accessToken, error: null }
            : current,
        );
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted)
          setState((current) =>
            current.session?.accessToken === session.accessToken
              ? { ...current, error: error.message }
              : current,
          );
      });
    return () => controller.abort();
  }, [session, verified, attempt]);
  useEffect(() => {
    const expired = (event: Event) => {
      if ((event as CustomEvent<string>).detail === session?.accessToken) clear();
    };
    window.addEventListener(expiredSessionEvent, expired);
    if (!session) return () => window.removeEventListener(expiredSessionEvent, expired);
    const timer = window.setTimeout(clear, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(expiredSessionEvent, expired);
    };
  }, [session, clear]);
  const login = async (email: string, password: string) => {
    const result = await api<Session>("/user/login", { method: "POST", body: { email, password } });
    try {
      const profile = await api<User>("/user/user-info", { token: result.data.accessToken });
      const value = { ...result.data, user: profile.data };
      saveSession(value);
      setState({ session: value, verified: value.accessToken, error: null });
    } catch (error) {
      await api<void>("/user/logout", { token: result.data.accessToken }).catch(() => undefined);
      throw error;
    }
  };
  const logout = async () => {
    try {
      if (session) await api<void>("/user/logout", { token: session.accessToken });
    } finally {
      clear();
    }
  };
  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        checking: !!session && verified !== session.accessToken,
        error: state.error,
        login,
        logout,
        retry: () => {
          setState((current) => ({ ...current, error: null }));
          setAttempt((value) => value + 1);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
