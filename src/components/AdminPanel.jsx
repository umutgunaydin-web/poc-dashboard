import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Shield } from "lucide-react";

export default function AdminPanel() {
  const { role } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (role !== "admin") return;
    supabase.from("user_roles").select("*").order("created_at").then(({ data }) => setUsers(data || []));
  }, [role]);

  async function setUserRole(email, newRole) {
    await supabase.from("user_roles")
      .update({ role: newRole, approved_at: new Date().toISOString() })
      .eq("email", email);
    setUsers(prev => prev.map(u => u.email === email ? { ...u, role: newRole } : u));
  }

  if (role !== "admin") return null;

  return (
    <div className="mt-6 rounded-xl border border-amber-900 bg-amber-950/20 p-5">
      <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Shield size={14}/> Admin — User Access Control
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 uppercase">
            <th className="text-left pb-2">Email</th>
            <th className="text-left pb-2">Current Role</th>
            <th className="text-left pb-2">Actions</th>
            <th className="text-left pb-2">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {users.map(u => (
            <tr key={u.email}>
              <td className="py-2 text-gray-300">{u.email}</td>
              <td className="py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  u.role === "admin"  ? "bg-amber-900 text-amber-300" :
                  u.role === "editor" ? "bg-emerald-900 text-emerald-300" :
                  "bg-gray-700 text-gray-400"
                }`}>{u.role}</span>
              </td>
              <td className="py-2 flex gap-2">
                {["pending","editor","admin"].map(r => (
                  <button
                    key={r}
                    onClick={() => setUserRole(u.email, r)}
                    disabled={u.role === r}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      u.role === r
                        ? "border-gray-700 text-gray-600 cursor-default"
                        : "border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-white"
                    }`}
                  >
                    → {r}
                  </button>
                ))}
              </td>
              <td className="py-2 text-gray-600 text-xs">
                {new Date(u.created_at).toLocaleDateString("en-GB")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
