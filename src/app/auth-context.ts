import { createContext, useContext } from "react";
import type { Session, User } from "../types/api";
export interface AuthState {
  session: Session | null;
  user: User | null;
  canEdit: boolean;
  checking: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
}
export const AuthContext = createContext<AuthState | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing.");
  return value;
}
