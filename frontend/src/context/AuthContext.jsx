import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "../api/resources";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cams_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.profile()
      .then((response) => setUser(response.data))
      .catch(() => localStorage.removeItem("cams_token"))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(payload) {
      const response = await authApi.login(payload);
      localStorage.setItem("cams_token", response.data.access_token);
      const profile = await authApi.profile();
      setUser(profile.data);
    },
    async register(payload) {
      await authApi.register(payload);
    },
    logout() {
      localStorage.removeItem("cams_token");
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
