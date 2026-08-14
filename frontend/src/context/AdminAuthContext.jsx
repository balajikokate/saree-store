import { createContext, useContext, useEffect, useState } from "react";

const AdminAuthContext = createContext(null);
const TOKEN_KEY = "ovee_admin_token";

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  const value = {
    token,
    isAuthenticated: !!token,
    login: (newToken) => setToken(newToken),
    logout: () => setToken(null),
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export { TOKEN_KEY };
