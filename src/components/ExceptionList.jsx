export default function ExceptionList({ tenants }) {
  const issues = [];

  tenants.forEach(t => {
    if (!t.createdBy || t.createdBy === "—")
      issues.push({ tenant: t.tenantName, issue: "Missing POC Owner" });
    if (!t.active && t.active !== false)
      issues.push({ tenant: t.tenantName, issue: "Active status undefined" });
  });

  const ccsCount = tenants.filter(t => t.accountName === "Call Center Studio").length;
  const aloCount = tenants.filter(t => t.accountName === "AloTech").length;

  const globalIssues = [
    "Stage field (Demo / Technical / Proposal) not present in source module — Expected Win Date cannot be calculated.",
    "Won/Lost result field missing — May Win Rate cannot be computed.",
  ];

  if (ccsCount > 0)
    globalIssues.push(
      `${ccsCount} CCS tenant${ccsCount > 1 ? "s" : ""} have Account Name = 'Call Center Studio' — real customer name unconfirmed.`
    );
  if (aloCount > 0)
    globalIssues.push(
      `${aloCount} AloTech tenant${aloCount > 1 ? "s" : ""} have Account Name = 'AloTech' — real customer name unconfirmed.`
    );

  return (
    <div className="mt-6 rounded-xl border border-amber-900 bg-amber-950/40 p-5">
      <h2 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wider">
        Data Exceptions — Action Required
      </h2>
      <ul className="space-y-2">
        {globalIssues.map((issue, i) => (
          <li key={i} className="flex gap-2 text-sm text-amber-200">
            <span className="mt-0.5 text-amber-500">⚠</span> {issue}
          </li>
        ))}
        {issues.map((item, i) => (
          <li key={`r-${i}`} className="flex gap-2 text-sm text-red-300">
            <span className="mt-0.5 text-red-500">✕</span>
            <span><span className="font-mono text-xs">{item.tenant}</span> — {item.issue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
