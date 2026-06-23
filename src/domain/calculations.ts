import { BASE_CURRENCY, DEFAULT_DAILY_ALLOWANCE, TYPE_META } from "../constants";
import { getDebtBudgetEvents, getDebtSettlements } from "./debt";
import type { Account, AppSettings, AppState, Entry } from "../types";
import { dateKeyFromDate, parseDateKey, todayKey } from "../utils/date";
import { coerceNumber, roundMoney } from "../utils/number";
import { getDailyLimitFromList } from "../state/dailyLimits";

export type Balances = Record<string, number>;

export function findAccount(state: AppState, accountId?: string): Account | null {
  return state.accounts.find((account) => account.id === accountId) || null;
}

export function calculateBalances(state: AppState): Balances {
  const balances = Object.fromEntries(
    state.accounts.map((account) => [account.id, Number(account.initial) || 0]),
  );

  for (const entry of state.entries) {
    if (entry.type === "exchange") {
      if (entry.fromAccountId && balances[entry.fromAccountId] !== undefined) {
        balances[entry.fromAccountId] -= Number(entry.fromAmount || 0);
      }
      if (entry.toAccountId && balances[entry.toAccountId] !== undefined) {
        balances[entry.toAccountId] += Number(entry.toAmount || 0);
      }
      continue;
    }

    if (entry.type === "debt") {
      applyDebtToBalances(state, entry, balances);
      continue;
    }

    const account = findAccount(state, entry.accountId);
    const meta = TYPE_META[entry.type];
    if (!account || !meta) continue;
    balances[account.id] = (balances[account.id] || 0) + meta.sign * Number(entry.amount || 0);
  }

  return balances;
}

function applyDebtToBalances(state: AppState, entry: Entry, balances: Balances): void {
  const amount = Number(entry.amount || 0);
  const account = findAccount(state, entry.accountId);

  if (entry.debtDirection === "to_me" && account && balances[account.id] !== undefined) {
    balances[account.id] -= amount;
  }

  for (const settlement of getDebtSettlements(entry)) {
    const settlementAccount = findAccount(state, settlement.accountId);
    if (!settlementAccount || balances[settlementAccount.id] === undefined) continue;
    balances[settlementAccount.id] +=
      entry.debtDirection === "by_me"
        ? -Number(settlement.amount || 0)
        : Number(settlement.amount || 0);
  }
}

export function getCurrencyTotals(state: AppState, balances: Balances): [string, number][] {
  const totals = new Map<string, number>();
  for (const account of state.accounts) {
    const current = totals.get(account.currency) || 0;
    totals.set(account.currency, current + (balances[account.id] || 0));
  }

  return [...totals.entries()].sort(([currencyA], [currencyB]) => {
    if (currencyA === BASE_CURRENCY) return -1;
    if (currencyB === BASE_CURRENCY) return 1;
    return currencyA.localeCompare(currencyB);
  });
}

export function buildExpenseSeries(state: AppState, range: number): { date: string; amount: number }[] {
  const end = parseDateKey(todayKey());
  const byDate = new Map<string, number>();
  const series: { date: string; amount: number }[] = [];

  for (let index = range - 1; index >= 0; index -= 1) {
    const date = new Date(end);
    date.setDate(end.getDate() - index);
    const key = dateKeyFromDate(date);
    byDate.set(key, 0);
    series.push({ date: key, amount: 0 });
  }

  for (const entry of state.entries) {
    if (entry.type === "debt") {
      for (const event of getDebtBudgetEvents(entry)) {
        if (!event.amount || !byDate.has(event.date)) continue;
        byDate.set(event.date, (byDate.get(event.date) || 0) + event.amount);
      }
      continue;
    }

    const amount = getChartBudgetAmount(state, entry);
    const date = getChartBudgetDate(entry);
    if (!amount || !byDate.has(date)) continue;
    byDate.set(date, (byDate.get(date) || 0) + amount);
  }

  return series.map((item) => ({ ...item, amount: byDate.get(item.date) || 0 }));
}

export function sumEntries(
  state: AppState,
  predicate: (entry: Entry) => boolean,
  valueGetter: (entry: Entry) => number,
): number {
  return state.entries.reduce((total, entry) => {
    if (!predicate(entry)) return total;
    return total + valueGetter(entry);
  }, 0);
}

export function getEntryBudgetAmount(state: AppState, entry: Entry): number {
  const stored = Number(entry.budgetAmount);
  if (Number.isFinite(stored)) return stored;

  const account = findAccount(state, entry.accountId);
  if (account?.currency === BASE_CURRENCY) return Number(entry.amount || 0);
  return 0;
}

export function getDailyBudgetAmount(state: AppState, entry: Entry): number {
  if (entry.type === "expense") return getEntryBudgetAmount(state, entry);
  if (entry.type === "debt") {
    return getDebtBudgetEvents(entry).reduce((total, event) => total + event.amount, 0);
  }
  return 0;
}

export function getDailyBudgetDate(entry: Entry): string {
  if (entry.type === "debt") {
    const events = getDebtBudgetEvents(entry);
    return events[events.length - 1]?.date || entry.settlementDate || entry.date;
  }
  return entry.date;
}

export function getChartBudgetAmount(state: AppState, entry: Entry): number {
  if (entry.type === "expense" || entry.type === "subscription") {
    return getEntryBudgetAmount(state, entry);
  }
  if (entry.type === "fuel") return getFuelChartAmount(state, entry);
  if (entry.type === "debt") {
    return getDebtBudgetEvents(entry).reduce((total, event) => total + event.amount, 0);
  }
  return 0;
}

function getFuelChartAmount(state: AppState, entry: Entry): number {
  const account = findAccount(state, entry.accountId);
  const currency = entry.currency || account?.currency || BASE_CURRENCY;
  return currency === BASE_CURRENCY ? Number(entry.amount || 0) : 0;
}

export function getChartBudgetDate(entry: Entry): string {
  if (entry.type !== "debt") return entry.date;
  const events = getDebtBudgetEvents(entry);
  return events[events.length - 1]?.date || entry.settlementDate || entry.date;
}

export function sortedEntries(state: AppState): Entry[] {
  return [...state.entries].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate) return byDate;
    return Date.parse(b.createdAt || "") - Date.parse(a.createdAt || "");
  });
}

export function elapsedBudgetDays(settings: AppSettings): number {
  const start = parseDateKey(settings.startDate);
  const today = parseDateKey(todayKey());
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return Math.max(0, diff + 1);
}

export function calculateDailyAccruedBudget(settings: AppSettings): number {
  if (!settings.dailyLimitEnabled) return 0;

  const start = parseDateKey(settings.startDate);
  const today = parseDateKey(todayKey());
  if (today < start) return 0;

  let total = 0;
  const cursor = new Date(start);

  while (cursor <= today) {
    total += getDailyLimitForDate(settings, dateKeyFromDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return roundMoney(total);
}

export function getDailyLimitForDate(settings: AppSettings, dateKey: string): number {
  return getDailyLimitFromList(
    settings.dailyLimits,
    dateKey,
    settings.dailyAllowance || DEFAULT_DAILY_ALLOWANCE,
  );
}

export function isInBudgetPeriod(settings: AppSettings, entry: Entry): boolean {
  return String(entry.date) >= String(settings.startDate);
}

export function isInBudgetPeriodByDate(settings: AppSettings, dateKey: string): boolean {
  return String(dateKey || "") >= String(settings.startDate);
}

export function getCleanDailyLimitAmount(value: unknown): number {
  return Math.max(0, coerceNumber(value, DEFAULT_DAILY_ALLOWANCE));
}
