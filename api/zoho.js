const TOKEN_URL = "https://accounts.zoho.eu/oauth/v2/token";
const CRM_BASE  = "https://www.zohoapis.eu/crm/v2";
const EXCLUDED_PARTNERS = new Set([
  "nuevo.alo-tech.com",
  "teneo.alo-tech.com",
  "flowdesk.alo-tech.com",
]);

async function getToken() {
  const r = await fetch(
    `${TOKEN_URL}?refresh_token=${process.env.ZOHO_REFRESH_TOKEN}` +
    `&client_id=${process.env.ZOHO_CLIENT_ID}` +
    `&client_secret=${process.env.ZOHO_CLIENT_SECRET}` +
    `&grant_type=refresh_token`,
    { method: "POST" }
  );
  const d = await r.json();
  if (!d.access_token) throw new Error("Token fail: " + JSON.stringify(d));
  return d.access_token;
}

async function fetchAll(url, token) {
  let page = 1, out = [];
  while (true) {
    const r = await fetch(`${url}&page=${page}&per_page=200`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });
    const j = await r.json();
    if (!j.data) break;
    out = out.concat(j.data);
    if (!j.info?.more_records) break;
    page++;
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const token   = await getToken();
    const tenants = await fetchAll(
      `${CRM_BASE}/Account_Tenants?fields=id,Name,Active,Created_Time,Last_Activity_Time,Account_Name,Created_By,Telephony_Cluster`,
      token
    );
    const enriched = tenants
      .filter(t => !EXCLUDED_PARTNERS.has(t.Name))
      .map(t => ({
      id:          t.id,
      tenantName:  t.Name,
      accountName: t.Account_Name?.name ?? "—",
      active:      t.Active,
      createdTime: t.Created_Time,
      lastActivity:t.Last_Activity_Time,
      createdBy:   t.Created_By?.name ?? "—",
      cluster:     t.Telephony_Cluster ?? "—",
      platform:    t.Name?.includes("callcenterstudio") ? "ccs" : "alotech",
    }));
    res.status(200).json({ tenants: enriched, fetchedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
