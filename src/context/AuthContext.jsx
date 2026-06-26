import { createContext, useContext } from "react";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const isLocal = window.location.hostname === "localhost";

  return (
    <Ctx.Provider value={{
      user:    isLocal ? { email: "umut.gunaydin@alo-tech.com" } : null,
      role:    isLocal ? "admin" : "viewer",
      loading: false,
      signIn:  () => {},
      signOut: () => {},
    }}>
      {children}
    </Ctx.Provider>
  );
}
