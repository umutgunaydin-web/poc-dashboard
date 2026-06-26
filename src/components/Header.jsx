import { LogIn, LogOut, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DASHBOARD_YEAR } from "../lib/config";

const ROLE_BADGE = {
  admin:   "bg-amber-900 text-amber-300",
  editor:  "bg-emerald-900 text-emerald-300",
  pending: "bg-gray-700 text-gray-400",
};

export default function Header() {
  const { user, role, signIn, signOut } = useAuth();

  return (
    <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          POC Portfolio Dashboard
          <span className="ml-2 text-sm font-normal text-indigo-400">{DASHBOARD_YEAR}</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-2">
              <img src={user.user_metadata?.avatar_url} className="w-7 h-7 rounded-full" alt="" />
              <span className="text-sm text-gray-300">{user.user_metadata?.name}</span>
              {role && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[role] || ""}`}>
                  {role}
                </span>
              )}
            </div>
            {role === "pending" && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <Shield size={12}/> Awaiting admin approval
              </span>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={14}/> Sign out
            </button>
          </>
        ) : (
          <button
            onClick={signIn}
            className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <LogIn size={14}/> Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}
