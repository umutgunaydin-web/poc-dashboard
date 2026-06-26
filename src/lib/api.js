import localData from "../data/tenants.json";
import { inDashboardPeriod, DASHBOARD_YEAR } from "./config";

const EXCLUDED_PARTNERS = new Set([
  "nuevo.alo-tech.com",
  "teneo.alo-tech.com",
  "flowdesk.alo-tech.com",
  "lesacall.alo-tech.com",
]);

function withPlatform(tenants, excluded = new Set()) {
  return tenants
    .filter(t => !EXCLUDED_PARTNERS.has(t.tenantName))
    .filter(t => !excluded.has(t.tenantName))
    .filter(t => inDashboardPeriod(t.createdTime))
    .map(t => ({
    ...t,
    platform: t.platform ?? (t.tenantName?.includes("callcenterstudio") ? "ccs" : "alotech"),
  }));
}

function loadLocal(excluded = new Set()) {
  return {
    tenants: withPlatform(localData.tenants, excluded),
    fetchedAt: new Date().toISOString(),
    source: localData.source,
    year: localData.year ?? DASHBOARD_YEAR,
  };
}

export async function fetchTenants(excluded = new Set()) {
  // Local dev: Excel export (Zoho requires vercel dev on :3001)
  if (import.meta.env.DEV && import.meta.env.VITE_USE_ZOHO !== "true") {
    return loadLocal(excluded);
  }

  try {
    const r = await fetch("/api/zoho");
    if (!r.ok) throw new Error("Zoho API error " + r.status);
    const data = await r.json();
    return { ...data, tenants: withPlatform(data.tenants, excluded), source: "Zoho CRM" };
  } catch {
    return loadLocal(excluded);
  }
}
