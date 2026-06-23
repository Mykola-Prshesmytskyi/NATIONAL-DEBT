import { DEFAULT_DAILY_ALLOWANCE } from "../constants";
import type { DailyLimit } from "../types";
import { isDateKey } from "../utils/date";
import { coerceNumber } from "../utils/number";

export function getDailyLimitFromList(
  limits: unknown,
  dateKey: string,
  fallbackAmount: number,
): number {
  const normalized = normalizeDailyLimitRows(limits);
  if (!normalized.length) return Math.max(0, coerceNumber(fallbackAmount, 0));

  let activeAmount = normalized[0].amount;
  for (const limit of normalized) {
    if (limit.fromDate > dateKey) break;
    activeAmount = limit.amount;
  }

  return activeAmount;
}

export function normalizeDailyLimits(
  input: unknown,
  startDate: string,
  fallbackAmount: number,
): DailyLimit[] {
  const fallback = Math.max(0, coerceNumber(fallbackAmount, DEFAULT_DAILY_ALLOWANCE));
  const limits = normalizeDailyLimitRows(input);
  const seededLimits = limits.length ? limits : [{ fromDate: startDate, amount: fallback }];

  if (!seededLimits.some((limit) => limit.fromDate <= startDate)) {
    seededLimits.push({ fromDate: startDate, amount: fallback });
  }

  return compactDailyLimits(seededLimits);
}

export function normalizeDailyLimitRows(input: unknown): DailyLimit[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((limit) => ({
      fromDate: isDateKey(limit?.fromDate) ? limit.fromDate : "",
      amount: Math.max(0, coerceNumber(limit?.amount, 0)),
    }))
    .filter((limit): limit is DailyLimit => Boolean(limit.fromDate))
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate));
}

export function compactDailyLimits(input: unknown): DailyLimit[] {
  const byDate = new Map<string, number>();
  for (const limit of normalizeDailyLimitRows(input)) {
    byDate.set(limit.fromDate, limit.amount);
  }

  const compacted: DailyLimit[] = [];
  for (const [fromDate, amount] of [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const previous = compacted[compacted.length - 1];
    if (previous && previous.amount === amount) continue;
    compacted.push({ fromDate, amount });
  }

  return compacted;
}

export function getLatestDailyLimit(limits: unknown, fallbackAmount: number): number {
  const normalized = normalizeDailyLimitRows(limits);
  return normalized.length
    ? normalized[normalized.length - 1].amount
    : Math.max(0, coerceNumber(fallbackAmount, DEFAULT_DAILY_ALLOWANCE));
}

