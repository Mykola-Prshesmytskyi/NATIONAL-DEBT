import type { DebtSettlement, Entry } from "../types";
import { coerceNumber, roundMoney } from "../utils/number";

export function isDebtClosed(entry?: Entry | null): boolean {
  return entry?.type === "debt" && entry.status === "closed";
}

export function getDebtSettlements(entry: Entry): DebtSettlement[] {
  if (Array.isArray(entry.debtSettlements) && entry.debtSettlements.length) {
    return entry.debtSettlements;
  }

  const amount = Math.max(0, coerceNumber(entry.settlementAmount, 0));
  const accountId = String(entry.settlementAccountId || "");
  const date = String(entry.settlementDate || entry.date || "");
  const legacyNote = (entry as { settlementNote?: unknown }).settlementNote;
  if (!amount || !accountId || !date) return [];

  return [
    {
      accountId,
      amount,
      date,
      note: typeof legacyNote === "string" ? legacyNote : undefined,
      createdAt: entry.settledAt || entry.updatedAt || entry.createdAt || new Date().toISOString(),
    },
  ];
}

export function getDebtSettlementTotal(entry: Entry): number {
  return roundMoney(
    getDebtSettlements(entry).reduce((total, settlement) => {
      return total + Math.max(0, coerceNumber(settlement.amount, 0));
    }, 0),
  );
}

export function getDebtRemainingAmount(entry: Entry): number {
  return roundMoney(Math.max(0, Number(entry.amount || 0) - getDebtSettlementTotal(entry)));
}

export function getDebtWriteOffAmount(entry: Entry): number {
  if (!isDebtClosed(entry)) return 0;
  if (entry.debtDirection === "by_me") return 0;

  const amount = Number(entry.amount || 0);
  const settlementAmount = getDebtSettlementTotal(entry);
  const computed = Math.max(0, amount - settlementAmount);
  const stored = Number(entry.writeOffBudgetAmount);

  return roundMoney(Number.isFinite(stored) && stored > 0 ? stored : computed);
}

export function getDebtBudgetEvents(entry: Entry): { date: string; amount: number }[] {
  if (entry.debtDirection === "by_me") {
    return getDebtSettlements(entry)
      .map((settlement) => ({
        date: settlement.date,
        amount: Math.max(0, coerceNumber(settlement.amount, 0)),
      }))
      .filter((event) => event.date && event.amount > 0);
  }

  const writeOffAmount = getDebtWriteOffAmount(entry);
  if (!writeOffAmount) return [];
  const settlements = getDebtSettlements(entry);

  return [
    {
      date:
        entry.settlementDate ||
        settlements[settlements.length - 1]?.date ||
        entry.date,
      amount: writeOffAmount,
    },
  ];
}
