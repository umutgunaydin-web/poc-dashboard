export const DASHBOARD_YEAR = 2026;
export const PERIOD_START = `${DASHBOARD_YEAR}-01-01`;
export const PERIOD_END = `${DASHBOARD_YEAR + 1}-01-01`;

export function inDashboardPeriod(isoDate) {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  return d >= new Date(PERIOD_START) && d < new Date(PERIOD_END);
}

export const MONTH_LABELS_2026 = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];
