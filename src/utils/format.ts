export const unknown = "—";
export function formatAmount(value: string | null | undefined, currency?: string): string {
  if (value === null || value === undefined) return unknown;
  const [whole, fraction] = value.split(".");
  return (
    (currency ? currency + " " : "") +
    whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    (fraction === undefined ? "" : "." + fraction)
  );
}
export function formatDate(value: string | null | undefined): string {
  if (!value) return unknown;
  const date = new Date(value.length === 10 ? value + "T00:00:00Z" : value);
  if (!Number.isFinite(date.getTime())) return unknown;
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
export function pageWindow(page: number, total: number): number[] {
  const start = Math.max(1, Math.min(page - 2, total - 4));
  return Array.from({ length: Math.min(5, Math.max(0, total)) }, (_, index) => start + index);
}
