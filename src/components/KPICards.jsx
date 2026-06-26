import { TrendingUp, Users, Clock } from "lucide-react";

function Card({ label, value, sub, icon: Icon, accent = "bg-gray-900 border-gray-800" }) {
  return (
    <div className={`rounded-xl p-5 border flex flex-col gap-2 ${accent}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 uppercase tracking-widest">{label}</span>
        {Icon && <Icon size={16} className="text-gray-600" />}
      </div>
      <span className="text-3xl font-semibold text-white">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

export default function KPICards({ tenants, overrides }) {
  const statusOf = t => overrides[t.tenantName]?.status || "active";

  const statusCount = tenants.reduce((acc, t) => {
    const s = statusOf(t);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const alotech = tenants.filter(t => statusOf(t) === "active" && t.platform === "alotech");
  const ccs     = tenants.filter(t => statusOf(t) === "active" && t.platform === "ccs");

  const concluded = tenants.filter(t => {
    const s = statusOf(t);
    return s === "won" || s === "lost";
  });
  const won = concluded.filter(t => statusOf(t) === "won");
  const winRate = concluded.length > 0
    ? Math.round((won.length / concluded.length) * 100) + "%"
    : "N/A";

  const ownerActive = ["Gülsüm Ügüt", "Eren Şirin", "Ali Kahya"].map(name => ({
    name,
    short: name.split(" ")[0],
    count: tenants.filter(t => {
      const st = overrides[t.tenantName]?.status || "active";
      const owner = overrides[t.tenantName]?.poc_owner;
      return owner === name && st === "active";
    }).length,
  }));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3 mb-6">
      <Card label="Active POCs" value={statusCount.active || 0} icon={Clock} accent="bg-indigo-950 border-indigo-800" />
      <Card label="Win Rate" value={winRate} icon={TrendingUp}
        sub={`${won.length} won / ${concluded.length} concluded`}
        accent={winRate === "N/A" ? "bg-amber-950 border-amber-900" : "bg-emerald-950 border-emerald-800"} />
      <Card label="AloTech" value={alotech.length} icon={Users} sub="status active" accent="bg-blue-950 border-blue-900" />
      <Card label="CCS" value={ccs.length} icon={Users} sub="status active" accent="bg-purple-950 border-purple-900" />
      {ownerActive.map(o => (
        <Card
          key={o.name}
          label={o.short + " — Active"}
          value={o.count}
          sub="aktif POC"
          accent="bg-gray-900 border-gray-700"
        />
      ))}
      <Card label="Waiting" value={statusCount.waiting || 0} sub="beklemede" accent="bg-amber-950 border-amber-900" />
      <Card label="Won" value={statusCount.won || 0} sub="kazanıldı" accent="bg-emerald-950 border-emerald-900" />
    </div>
  );
}
