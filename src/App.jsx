import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { supabase }       from "./lib/supabase";
import { fetchTenants }   from "./lib/api";
import Header             from "./components/Header";
import KPICards           from "./components/KPICards";
import WinRateChart       from "./components/WinRateChart";
import POCTable           from "./components/POCTable";
import AdminPanel         from "./components/AdminPanel";

export default function App() {
  const [data, setData]           = useState(null);
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const exResult = await supabase.from("tenant_exclusions").select("tenant_id");
      const excluded = new Set((exResult.data || []).map(e => e.tenant_id));
      if (exResult.error) console.warn("tenant_exclusions load:", exResult.error.message);

      const [zohoData, ovResult] = await Promise.all([
        fetchTenants(excluded),
        supabase.from("poc_overrides").select("*"),
      ]);
      if (ovResult.error) {
        console.error("poc_overrides load failed:", ovResult.error);
        throw new Error(`Overrides yüklenemedi: ${ovResult.error.message}`);
      }
      setData(zohoData);
      const ovMap = {};
      (ovResult.data || []).forEach(o => { ovMap[o.tenant_id] = o; });
      setOverrides(ovMap);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleExclude(tenantId) {
    setData(d => d ? { ...d, tenants: d.tenants.filter(t => t.tenantName !== tenantId) } : d);
  }

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header lastSync={data?.fetchedAt} />

      <main className="px-6 py-6 max-w-screen-xl mx-auto">
        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16}/> {error}
          </div>
        )}

        <div className="flex justify-end mb-4">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Refresh
          </button>
        </div>

        {loading && !data && (
          <div className="flex items-center justify-center h-64 text-gray-600">
            Loading tenant data…
          </div>
        )}

        {data && (
          <>
            <KPICards   tenants={data.tenants} overrides={overrides} />
            <WinRateChart tenants={data.tenants} overrides={overrides} />
            <POCTable
              tenants={data.tenants}
              overrides={overrides}
              setOverrides={setOverrides}
              onExclude={handleExclude}
            />
            <AdminPanel />
          </>
        )}
      </main>
    </div>
  );
}
