import { useState } from "react";
import { ChevronUp, ChevronDown, Edit2, Check, X, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { isLocalDev } from "../lib/config";

const OWNERS   = ["Gülsüm Ügüt", "Eren Şirin", "Ali Kahya", "Bertuğ Demir"];
const STATUSES = ["active", "waiting", "won", "lost"];

const OWNER_FILTERS = [
  { id: "all",          label: "Tümü" },
  { id: "Gülsüm Ügüt",  label: "Gülsüm", cls: "bg-rose-900/60 text-rose-300 border-rose-800" },
  { id: "Eren Şirin",   label: "Eren",   cls: "bg-teal-900/60 text-teal-300 border-teal-800" },
  { id: "Ali Kahya",    label: "Ali",    cls: "bg-orange-900/60 text-orange-300 border-orange-800" },
];

function resolveOwner(tenant, overrides) {
  return overrides[tenant.tenantName]?.poc_owner || tenant.pocOwner || "";
}

const STATUS_CFG = {
  active:   { label: "Active",    cls: "bg-blue-900/60 text-blue-300 border-blue-800" },
  waiting:  { label: "Waiting",   cls: "bg-amber-900/60 text-amber-300 border-amber-800" },
  won:      { label: "Won",       cls: "bg-emerald-900/60 text-emerald-300 border-emerald-800" },
  lost:     { label: "Lost",      cls: "bg-red-900/60 text-red-300 border-red-800" },
};

const PLATFORM_CFG = {
  alotech: { label: "AloTech", cls: "bg-blue-900/60 text-blue-300 border border-blue-800",   bar: "border-l-2 border-l-blue-700" },
  ccs:     { label: "CCS",     cls: "bg-purple-900/60 text-purple-300 border border-purple-800", bar: "border-l-2 border-l-purple-700" },
};

function PlatformBadge({ platform }) {
  const cfg = PLATFORM_CFG[platform] || PLATFORM_CFG.alotech;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function EditableCell({ value, onSave, type = "text", options, placeholder = "—" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value ?? "");
  const { role }              = useAuth();
  const canEdit = role === "editor" || role === "admin";

  const display = type === "date" && value
    ? new Date(value).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "2-digit" })
    : value;

  if (!canEdit) return (
    <span className="text-sm text-gray-400">
      {display || <span className="text-gray-700">—</span>}
    </span>
  );

  if (!editing) return (
    <button
      onClick={() => { setVal(value ?? ""); setEditing(true); }}
      className="group flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors text-left"
    >
      {display
        ? <span>{display}</span>
        : <span className="text-gray-600 italic text-xs">{placeholder}</span>
      }
      <Edit2 size={11} className="opacity-0 group-hover:opacity-40 shrink-0" />
    </button>
  );

  return (
    <div className="flex items-center gap-1">
      {options ? (
        <select
          value={val}
          onChange={e => setVal(e.target.value)}
          autoFocus
          className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-indigo-500"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={val}
          onChange={e => setVal(e.target.value)}
          autoFocus
          className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-indigo-500 w-36"
        />
      )}
      <button onClick={() => { onSave(val); setEditing(false); }} className="text-emerald-400 hover:text-emerald-300"><Check size={14}/></button>
      <button onClick={() => setEditing(false)} className="text-red-500 hover:text-red-400"><X size={14}/></button>
    </div>
  );
}

export default function POCTable({ tenants, overrides, setOverrides, onExclude }) {
  const [platform, setPlatform] = useState("all");
  const [status, setStatus]     = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [search, setSearch]     = useState("");
  const [sortField, setSortField] = useState("start");
  const [sortAsc, setSortAsc]     = useState(false);
  const [saveError, setSaveError] = useState(null);
  const { user, role } = useAuth();
  const canEdit = role === "editor" || role === "admin";
  const showTenant = isLocalDev();

  async function saveField(tenantId, field, value) {
    if (!user?.email) {
      setSaveError("Oturum bulunamadı — tekrar giriş yapın.");
      return;
    }

    const existing = overrides[tenantId] || {};
    const tenant = tenants.find(t => t.tenantName === tenantId);
    const old = existing[field];
    const now = new Date().toISOString();
    const row = {
      tenant_id: tenantId,
      poc_owner: existing.poc_owner ?? tenant?.pocOwner ?? null,
      status: existing.status ?? "active",
      expected_win: existing.expected_win ?? null,
      notes: existing.notes ?? null,
      [field]: value === "" ? null : value,
      updated_by: user.email,
      updated_at: now,
    };

    const { error: upsertError } = await supabase
      .from("poc_overrides")
      .upsert(row, { onConflict: "tenant_id" });

    if (upsertError) {
      console.error("poc_overrides upsert failed:", upsertError);
      setSaveError(`Kaydedilemedi: ${upsertError.message}`);
      return;
    }

    const { error: auditError } = await supabase.from("poc_audit").insert({
      tenant_id: tenantId,
      field,
      old_val: String(old ?? ""),
      new_val: String(value ?? ""),
      changed_by: user.email,
    });
    if (auditError) console.warn("poc_audit insert failed:", auditError);

    setSaveError(null);
    setOverrides(prev => ({
      ...prev,
      [tenantId]: { ...prev[tenantId], ...row },
    }));
  }

  async function hideTenant(tenant) {
    if (!user?.email) {
      setSaveError("Oturum bulunamadı — tekrar giriş yapın.");
      return;
    }
    const msg = `"${tenant.accountName}" (${tenant.tenantName}) listeden kaldırılsın mı?`;
    if (!window.confirm(msg)) return;

    const { error } = await supabase.from("tenant_exclusions").insert({
      tenant_id: tenant.tenantName,
      reason: "Dashboard'dan kaldırıldı",
      excluded_by: user.email,
    });

    if (error) {
      console.error("tenant_exclusions insert failed:", error);
      setSaveError(`Silinemedi: ${error.message}. Supabase'de tenant-exclusions.sql çalıştırın.`);
      return;
    }

    setSaveError(null);
    onExclude?.(tenant.tenantName);
  }

  function toggleSort(field) {
    if (sortField === field) setSortAsc(a => !a);
    else {
      setSortField(field);
      setSortAsc(field === "start" ? false : true);
    }
  }

  const filtered = tenants
    .filter(t => platform === "all" || t.platform === platform)
    .filter(t => {
      const st = overrides[t.tenantName]?.status || "active";
      return status === "all" || st === status;
    })
    .filter(t => ownerFilter === "all" || resolveOwner(t, overrides) === ownerFilter)
    .filter(t =>
      t.accountName.toLowerCase().includes(search.toLowerCase()) ||
      (showTenant && t.tenantName.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      let va, vb;
      if (sortField === "owner") {
        va = overrides[a.tenantName]?.poc_owner || a.pocOwner || "zzz";
        vb = overrides[b.tenantName]?.poc_owner || b.pocOwner || "zzz";
      } else if (sortField === "start") {
        va = a.createdTime || "";
        vb = b.createdTime || "";
      } else if (sortField === "expected") {
        va = overrides[a.tenantName]?.expected_win || "9999";
        vb = overrides[b.tenantName]?.expected_win || "9999";
      }
      const cmp = String(va).localeCompare(String(vb));
      return sortAsc ? cmp : -cmp;
    });

  const SortTh = ({ field, label }) => (
    <th
      className="text-left px-4 py-3 cursor-pointer hover:text-white select-none transition-colors"
      onClick={() => toggleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortField === field
          ? sortAsc ? <ChevronUp size={11}/> : <ChevronDown size={11}/>
          : <ChevronUp size={11} className="opacity-20"/>
        }
      </span>
    </th>
  );

  const today = new Date();
  function isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < today;
  }

  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden">
      {saveError && (
        <div className="px-4 py-2 bg-red-950/60 border-b border-red-800 text-sm text-red-300">
          {saveError}
        </div>
      )}
      <div className="flex flex-wrap gap-3 items-center px-4 py-3 bg-gray-900 border-b border-gray-800">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Müşteri veya tenant ara…"
          className="bg-gray-800 text-sm text-gray-200 rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-indigo-500 w-48"
        />

        <div className="flex gap-1">
          {["all","alotech","ccs"].map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                platform === p
                  ? p === "ccs"     ? "bg-purple-700 border-purple-600 text-white"
                  : p === "alotech" ? "bg-blue-700 border-blue-600 text-white"
                  : "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
              }`}>
              {p === "all" ? "Tümü" : p === "alotech" ? "AloTech" : "CCS"}
            </button>
          ))}
        </div>

        <div className="flex gap-1 flex-wrap">
          {OWNER_FILTERS.map(o => (
            <button key={o.id} onClick={() => setOwnerFilter(o.id)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                ownerFilter === o.id
                  ? o.cls ? `border ${o.cls}` : "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-500 hover:text-white"
              }`}>
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 flex-wrap">
          {["all", ...STATUSES].map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} onClick={() => setStatus(s)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  status === s
                    ? cfg ? `border ${cfg.cls}` : "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-500 hover:text-white"
                }`}>
                {cfg ? cfg.label : "Tümü"}
              </button>
            );
          })}
        </div>

        <span className="ml-auto text-xs text-gray-600">{filtered.length} kayıt</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/80 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 w-20">Platform</th>
              <th className="text-left px-4 py-3">Müşteri</th>
              {showTenant && <th className="text-left px-4 py-3">Tenant</th>}
              <SortTh field="owner"    label="POC Owner" />
              <th className="text-left px-4 py-3">Durum</th>
              <SortTh field="start"    label="POC Başlangıç" />
              <SortTh field="expected" label="Tahmini Bitiş" />
              <th className="text-left px-4 py-3">Not</th>
              {canEdit && <th className="text-left px-4 py-3 w-12"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.map(t => {
              const ov  = overrides[t.tenantName] || {};
              const plt = PLATFORM_CFG[t.platform] || PLATFORM_CFG.alotech;
              const overdue = ov.status === "active" && isOverdue(ov.expected_win);

              return (
                <tr key={t.id} className={`hover:bg-gray-900/40 transition-colors ${plt.bar} ${overdue ? "bg-red-950/10" : ""}`}>
                  <td className="px-4 py-3">
                    <PlatformBadge platform={t.platform} />
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    {t.accountName}
                  </td>
                  {showTenant && (
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      {t.tenantName}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <EditableCell
                      value={ov.poc_owner || t.pocOwner || null}
                      options={OWNERS}
                      placeholder="Ata"
                      onSave={v => saveField(t.tenantName, "poc_owner", v)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <EditableCell
                      value={ov.status || "active"}
                      options={STATUSES}
                      onSave={v => saveField(t.tenantName, "status", v)}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {t.createdTime
                      ? new Date(t.createdTime).toLocaleDateString("tr-TR", { day:"2-digit", month:"short", year:"2-digit" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className={overdue ? "text-red-400" : ""}>
                      <EditableCell
                        value={ov.expected_win || null}
                        type="date"
                        placeholder="Tarih gir"
                        onSave={v => saveField(t.tenantName, "expected_win", v)}
                      />
                    </div>
                    {overdue && <span className="text-xs text-red-500">Geçti</span>}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <EditableCell
                      value={ov.notes || null}
                      placeholder="Not ekle"
                      onSave={v => saveField(t.tenantName, "notes", v)}
                    />
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => hideTenant(t)}
                        title="Listeden kaldır"
                        className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
