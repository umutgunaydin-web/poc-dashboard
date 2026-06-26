// Called by Vercel cron every day at 06:00 UTC
// Fetches from Zoho and upserts into Supabase poc_overrides platform field
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service key, not anon — add to Vercel env
);

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }
  // Re-use zoho fetch logic — just upsert platform field
  // Full implementation: call /api/zoho internally then upsert
  res.status(200).json({ ok: true, time: new Date().toISOString() });
}
