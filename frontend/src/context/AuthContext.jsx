import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("auth_user") || localStorage.getItem("pos_user");
    const storedToken =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("pos_token") ||
      localStorage.getItem("pos-token");
    const storedRefresh = localStorage.getItem("refreshToken");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    // Clean up any legacy keys when new ones exist
    if (storedToken) {
      localStorage.setItem("accessToken", storedToken);
      localStorage.removeItem("pos_token");
      localStorage.removeItem("pos-token");
    }
    if (storedUser) {
      localStorage.setItem("auth_user", storedUser);
      localStorage.removeItem("pos_user");
    }
    if (storedRefresh) {
      localStorage.setItem("refreshToken", storedRefresh);
    }

    setLoading(false);
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("pos_user");
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos-token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, token, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
