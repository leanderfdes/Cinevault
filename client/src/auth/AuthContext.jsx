import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http } from "../api/http";

const AuthContext = createContext(null);

const STORAGE_KEY = "cinevault_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [user, setUser] = useState(null); // optional: decode later if you want

  // keep axios Authorization header in sync
  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
      http.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem(STORAGE_KEY);
      delete http.defaults.headers.common.Authorization;
    }
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthed: Boolean(token),
      setUser,
      login: (newToken) => setToken(newToken),
      logout: () => {
        setToken("");
        setUser(null);
      },
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
