export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function gainToneClass(gain: number | null): string {
  if (gain === null) return "text-slate-600";
  if (gain > 0) return "text-emerald-400";
  if (gain < 0) return "text-rose-400";
  return "text-slate-400";
}

export function gainLabel(gain: number | null): string {
  return gain === null ? "—" : `${gain > 0 ? "+" : ""}${formatCurrency(gain)}`;
}
