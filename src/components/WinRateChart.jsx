import { useEffect, useRef, useState } from "react";
import { DASHBOARD_YEAR, MONTH_LABELS_2026 } from "../lib/config";

export default function WinRateChart({ tenants, overrides }) {
  const ref = useRef();
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const months = {};
    for (let m = 0; m < 12; m++) {
      months[`${DASHBOARD_YEAR}-${String(m + 1).padStart(2, "0")}`] = { won: 0, lost: 0 };
    }

    tenants.forEach(t => {
      const ov = overrides[t.tenantName];
      const st = ov?.status;
      if (!st || st === "active" || st === "waiting") return;
      if (st !== "won" && st !== "lost") return;

      const when = t.createdTime ? new Date(t.createdTime) : null;
      const key = when && when.getFullYear() === DASHBOARD_YEAR
        ? `${DASHBOARD_YEAR}-${String(when.getMonth() + 1).padStart(2, "0")}`
        : null;
      if (!key || !months[key]) return;
      months[key][st]++;
    });

    const keys = Object.keys(months).sort();
    const labels = keys.map(k => {
      const monthIdx = parseInt(k.split("-")[1], 10) - 1;
      return MONTH_LABELS_2026[monthIdx];
    });
    const rates = keys.map(k => {
      const { won, lost } = months[k];
      return won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;
    });

    const concluded = rates.some(r => r !== null);
    setHasData(concluded);

    if (!ref.current) return;

    import("https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js").then(() => {
      const ctx = ref.current.getContext("2d");
      if (ref.current._chart) ref.current._chart.destroy();
      ref.current._chart = new window.Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Win Rate %",
            data: rates,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.15)",
            fill: true,
            tension: 0.4,
            pointRadius: rates.map(r => r === null ? 0 : 5),
            pointBackgroundColor: "#6366f1",
            spanGaps: true,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 100, ticks: { color: "#6b7280", callback: v => v + "%" }, grid: { color: "#1f2937" } },
            x: { ticks: { color: "#6b7280" }, grid: { color: "#1f2937" } },
          },
        },
      });
    });
  }, [tenants, overrides]);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 mb-6">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
        Win Rate Trend — {DASHBOARD_YEAR}
      </h2>
      <div style={{ height: 180 }}>
        <canvas ref={ref} role="img" aria-label={`${DASHBOARD_YEAR} monthly win rate trend chart`} />
      </div>
      {!hasData && (
        <p className="text-center text-gray-600 text-sm mt-4">
          {DASHBOARD_YEAR} için henüz sonuçlanmış POC yok — Won/Lost atayın
        </p>
      )}
    </div>
  );
}
