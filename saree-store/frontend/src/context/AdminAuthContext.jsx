import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/adminApi";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  // Starts as null ("haven't checked yet") rather than false, so
  // ProtectedRoute can show a loader instead of briefly flashing a
  // redirect-to-login before the session check has even completed.
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [email, setEmail] = useState(null);

  // On load, ask the backend whether the httpOnly session cookie (if any)
  // is still valid — this replaces reading a token out of localStorage,
  // since the token is no longer accessible to JavaScript at all.
  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((res) => {
        if (!active) return;
        setIsAuthenticated(true);
        setEmail(res.data.email);
      })
      .catch(() => {
        if (active) setIsAuthenticated(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = async (emailInput, password) => {
    const res = await authApi.login(emailInput, password);
    setIsAuthenticated(true);
    setEmail(res.data.email);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setIsAuthenticated(false);
      setEmail(null);
    }
  };

  const value = { isAuthenticated, email, login, logout };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
