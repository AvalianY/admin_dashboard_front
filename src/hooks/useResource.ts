import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../app/auth-context";
import type { Meta } from "../types/api";
export function useResource<T>(path: string | null) {
  const { session } = useAuth();
  const token = session?.accessToken;
  const [revision, setRevision] = useState(0);
  const key = `${path}:${revision}`;
  const [result, setResult] = useState<{
    key: string;
    data: T | null;
    meta?: Meta;
    error: string | null;
  }>({ key: "", data: null, error: null });
  useEffect(() => {
    if (!path || !token) return;
    const controller = new AbortController();
    api<T>(path, { token, signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setResult({ key, ...response, error: null });
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setResult({ key, data: null, error: error.message });
      });
    return () => controller.abort();
  }, [path, key, token]);
  const current = result.key === key;
  return {
    data: current ? result.data : null,
    meta: current ? result.meta : undefined,
    error: current ? result.error : null,
    loading: !!path && !!token && !current,
    reload: () => setRevision((value) => value + 1),
  };
}
