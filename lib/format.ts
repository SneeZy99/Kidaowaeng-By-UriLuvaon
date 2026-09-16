export function formatMoney(value: number): string {
  return new Intl.NumberFormat("th-TH").format(Math.round(value));
}

export function formatDateTime(value: number | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
