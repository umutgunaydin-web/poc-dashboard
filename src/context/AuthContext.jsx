import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [role, setRole]   = useState(null);  // 'pending'|'editor'|'admin'|null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) fetchRole(data.session.user.email);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.email);
      else { setRole(null); setLoading(false); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchRole(email) {
    // Supabase RLS bypass — servis key yerine direkt sorgu
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("email", email)
      .maybeSingle();

    console.log("fetchRole result:", email, data, error);

    if (!data) {
      await supabase.from("user_roles").upsert(
        { email, role: "pending" },
        { onConflict: "email", ignoreDuplicates: true }
      );
      setRole("pending");
    } else {
      setRole(data.role);
    }
    setLoading(false);
  }

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { hd: "alo-tech.com callcenterstudio.com" },
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <Ctx.Provider value={{ user, role, loading, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
