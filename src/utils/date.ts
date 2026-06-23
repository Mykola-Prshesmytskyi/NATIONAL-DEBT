export function todayKey(): string {
  return dateKeyFromDate(new Date());
}

export function dateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isDateKey(value: unknown): value is string {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value));
}

export function dateValue(value: unknown): number {
  const time = Date.parse(String(value || ""));
  return Number.isFinite(time) ? time : 0;
}

