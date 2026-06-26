export default function Header({ lastSync }) {
  const sync = lastSync
    ? new Date(lastSync).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          POC Portfolio Dashboard <span className="text-gray-600 text-sm font-normal">2026</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Presales · Zoho CRM · {sync}
        </p>
      </div>
    </header>
  );
}
