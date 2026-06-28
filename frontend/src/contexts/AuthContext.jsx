import { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || "");

  async function authenticate(username, password) {
    const data = await loginUser(username, password);
    localStorage.setItem("access_token", data.access_token);
    setToken(data.access_token);
    return data;
  }

  async function createAccount(username, password) {
    return registerUser(username, password);
  }

  function logout() {
    localStorage.removeItem("access_token");
    setToken("");
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: Boolean(token),
        authenticate,
        createAccount,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
