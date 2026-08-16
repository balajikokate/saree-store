import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api";

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  // null = "haven't checked session yet" (distinct from false) — lets pages
  // avoid flashing a "log in" prompt before the initial check completes.
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((res) => {
        if (active) setUser(res.data);
      })
      .catch(() => {
        // Not logged in — completely normal for a guest browsing the site.
      })
      .finally(() => {
        if (active) setChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    setUser(res.data);
  };

  const signup = async (data) => {
    const res = await authApi.signup(data);
    setUser(res.data);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const updateUser = (patch) => setUser((u) => (u ? { ...u, ...patch } : u));

  const value = {
    user,
    isAuthenticated: !!user,
    checked, // true once the initial session check has resolved
    login,
    signup,
    logout,
    updateUser,
  };

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  return ctx;
}
