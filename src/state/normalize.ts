import {
  ACCOUNT_KIND_LABELS,
  APP_VERSION,
  BASE_CURRENCY,
  LEGACY_ACCOUNT_LABELS,
  TYPE_META,
} from "../constants";
import { getDebtWriteOffAmount } from "../domain/debt";
import { normalizeLanguage } from "../i18n";
import type {
  Account,
  AppSettings,
  AppState,
  DebtSettlement,
  Entry,
  Receipt,
  TurnoverInvestor,
  TurnoverInvestorRepayment,
  TurnoverParticipant,
  TurnoverParticipantContribution,
  TurnoverProject,
} from "../types";
import { isDateKey, todayKey } from "../utils/date";
import { makeFuelDetail } from "../utils/format";
import { coerceNumber, roundMoney } from "../utils/number";
import { normalizeCurrency, normalizeFuelType } from "../utils/sanitize";
import { makeId } from "../utils/async";
import { createDefaultState } from "./defaultState";
import { getLatestDailyLimit, normalizeDailyLimits } from "./dailyLimits";

type LegacyMap = Record<string, string>;

export function normalizeState(input: unknown): AppState {
  const fallback = createDefaultState();
  const source = input && typeof input === "object" ? (input as Record<string, any>) : {};

  if (isEmptyLegacyState(source)) return fallback;

  const migration = normalizeAccounts(source.accounts, source.entries);
  const settings: AppSettings = {
    startDate: isDateKey(source.settings?.startDate)
      ? source.settings.startDate
      : fallback.settings.startDate,
    dailyAllowance: Math.max(
      0,
      coerceNumber(source.settings?.dailyAllowance, fallback.settings.dailyAllowance),
    ),
    subscriptionBudget: Math.max(
      0,
      coerceNumber(source.settings?.subscriptionBudget, fallback.settings.subscriptionBudget),
    ),
    dailyLimitEnabled: source.settings?.dailyLimitEnabled !== false,
    language: normalizeLanguage(source.settings?.language),
    dailyLimits: [],
  };
  settings.dailyLimits = normalizeDailyLimits(
    source.settings?.dailyLimits,
    settings.startDate,
    settings.dailyAllowance,
  );
  settings.dailyAllowance = getLatestDailyLimit(settings.dailyLimits, settings.dailyAllowance);

  const accounts = migration.accounts;
  const accountIds = new Set(accounts.map((account) => account.id));
  const entries = Array.isArray(source.entries)
    ? source.entries
        .map((entry: unknown) => normalizeEntry(entry, migration.legacyMap, accountIds, accounts))
        .filter((entry): entry is Entry => Boolean(entry))
    : [];
  const turnoverProjects = Array.isArray(source.turnoverProjects)
    ? source.turnoverProjects
        .map((project: unknown) => normalizeTurnoverProject(project))
        .filter((project): project is TurnoverProject => Boolean(project))
    : [];

  return {
    ...fallback,
    ...source,
    version: APP_VERSION,
    settings,
    accounts,
    entries,
    turnoverProjects,
  };
}

function normalizeAccounts(
  accountsInput: unknown,
  entriesInput: unknown,
): { accounts: Account[]; legacyMap: LegacyMap } {
  const legacyMap: LegacyMap = {};

  if (Array.isArray(accountsInput)) {
    const accounts = accountsInput
      .map((account) => normalizeAccount(account))
      .filter((account): account is Account => Boolean(account));
    return { accounts: dedupeAccounts(accounts), legacyMap };
  }

  if (!accountsInput || typeof accountsInput !== "object") {
    return { accounts: [], legacyMap };
  }

  const referenced = new Set(
    Array.isArray(entriesInput)
      ? entriesInput.map((entry: any) => entry.account).filter(Boolean)
      : [],
  );

  const accounts = Object.entries(accountsInput)
    .map(([legacyKey, account]): Account | null => {
      const source = account as Record<string, any> | null;
      const initial = coerceNumber(source?.initial, 0);
      if (!referenced.has(legacyKey) && initial === 0) return null;

      const id = `acct_${legacyKey}`;
      legacyMap[legacyKey] = id;
      return {
        id,
        name: String(source?.label || LEGACY_ACCOUNT_LABELS[legacyKey] || legacyKey),
        kind: legacyKey.toLowerCase().includes("cash") ? "cash" : "card",
        currency: normalizeCurrency(source?.currency || BASE_CURRENCY),
        initial,
        createdAt: source?.createdAt || new Date().toISOString(),
      } satisfies Account;
    })
    .filter((account): account is Account => Boolean(account));

  return { accounts, legacyMap };
}

function normalizeAccount(account: unknown): Account | null {
  if (!account || typeof account !== "object") return null;
  const source = account as Record<string, any>;
  const name = String(source.name || source.label || "").trim();
  const currency = normalizeCurrency(source.currency || BASE_CURRENCY);
  if (!name || !currency) return null;

  return {
    id: String(source.id || makeId("acct")),
    name,
    kind: ACCOUNT_KIND_LABELS[source.kind as keyof typeof ACCOUNT_KIND_LABELS]
      ? source.kind
      : "other",
    currency,
    initial: coerceNumber(source.initial, 0),
    createdAt: source.createdAt || new Date().toISOString(),
  };
}

function normalizeReceipt(receipt: unknown): Receipt | null {
  if (
    !receipt ||
    typeof receipt !== "object" ||
    !String((receipt as Record<string, any>).dataUrl || "").startsWith("data:image/")
  ) {
    return null;
  }

  const source = receipt as Record<string, any>;
  return {
    name: String(source.name || "Фото чека"),
    type: String(source.type || "image/jpeg"),
    dataUrl: String(source.dataUrl),
    createdAt: source.createdAt || new Date().toISOString(),
  };
}

function normalizeEntry(
  entry: unknown,
  legacyMap: LegacyMap,
  accountIds: Set<string>,
  accounts: Account[],
): Entry | null {
  if (!entry || typeof entry !== "object") return null;
  const source = entry as Record<string, any>;

  if (source.type === "debt") {
    const amount = Number(source.amount);
    const accountId = String(source.accountId || legacyMap[source.account] || source.account || "");
    const account = accounts.find((item) => item.id === accountId);
    const debtDirection = source.debtDirection === "by_me" ? "by_me" : "to_me";
    const isClosed = source.status === "closed";

    if (!account || !Number.isFinite(amount) || amount <= 0) return null;

    const normalized: Entry = {
      id: String(source.id || makeId("debt")),
      type: "debt",
      debtDirection,
      accountId,
      amount: roundMoney(amount),
      currency: normalizeCurrency(source.currency || account.currency),
      budgetAmount: 0,
      detail: String(source.detail || "Борг"),
      date: isDateKey(source.date) ? source.date : todayKey(),
      status: isClosed ? "closed" : "open",
      receipt: normalizeReceipt(source.receipt),
      createdAt: source.createdAt || new Date().toISOString(),
    };
    const debtSettlements = normalizeDebtSettlements(source, accounts, normalized);
    const totalSettlementAmount = debtSettlements.reduce(
      (total, settlement) => total + settlement.amount,
      0,
    );

    if (debtSettlements.length) {
      normalized.debtSettlements = debtSettlements;
      normalized.settlementAmount = roundMoney(totalSettlementAmount);
      normalized.settlementAccountId = debtSettlements[0].accountId;
      normalized.settlementDate = debtSettlements[debtSettlements.length - 1].date;
    }

    if (isClosed) {
      normalized.writeOffBudgetAmount = Math.max(
        0,
        coerceNumber(source.writeOffBudgetAmount, getDebtWriteOffAmount(normalized)),
      );
      normalized.settledAt = source.settledAt || source.updatedAt || new Date().toISOString();
    }

    return normalized;
  }

  if (source.type === "exchange") {
    const fromAccountId = String(source.fromAccountId || "");
    const toAccountId = String(source.toAccountId || "");
    const fromAmount = Number(source.fromAmount);
    const toAmount = Number(source.toAmount);
    if (
      !accountIds.has(fromAccountId) ||
      !accountIds.has(toAccountId) ||
      !Number.isFinite(fromAmount) ||
      !Number.isFinite(toAmount) ||
      fromAmount <= 0 ||
      toAmount <= 0
    ) {
      return null;
    }

    const fromAccount = accounts.find((account) => account.id === fromAccountId);
    const toAccount = accounts.find((account) => account.id === toAccountId);
    return {
      id: String(source.id || makeId("exchange")),
      type: "exchange",
      fromAccountId,
      toAccountId,
      fromAmount: roundMoney(fromAmount),
      toAmount: roundMoney(toAmount),
      fromCurrency: normalizeCurrency(source.fromCurrency || fromAccount?.currency || BASE_CURRENCY),
      toCurrency: normalizeCurrency(source.toCurrency || toAccount?.currency || BASE_CURRENCY),
      detail: String(source.detail || "Обмін валюти"),
      date: isDateKey(source.date) ? source.date : todayKey(),
      createdAt: source.createdAt || new Date().toISOString(),
    };
  }

  const amount = Number(source.amount);
  const type = TYPE_META[source.type as keyof typeof TYPE_META] && source.type !== "exchange"
    ? source.type
    : "expense";
  const accountId = String(source.accountId || legacyMap[source.account] || source.account || "");
  const account = accounts.find((item) => item.id === accountId);

  if (!account || !Number.isFinite(amount) || amount <= 0) return null;

  const fallbackBudget =
    account.currency === BASE_CURRENCY && (type === "expense" || type === "subscription")
      ? amount
      : 0;

  const normalized: Entry = {
    id: String(source.id || makeId("entry")),
    type,
    accountId,
    amount: roundMoney(amount),
    currency: normalizeCurrency(source.currency || account.currency),
    budgetAmount:
      type === "fuel" ? 0 : Math.max(0, coerceNumber(source.budgetAmount, fallbackBudget)),
    detail: String(source.detail || "Без опису"),
    date: isDateKey(source.date) ? source.date : todayKey(),
    createdAt: source.createdAt || new Date().toISOString(),
  };

  if (type === "fuel") {
    normalized.fuelType = normalizeFuelType(source.fuelType);
    normalized.fuelLiters = Math.max(0, coerceNumber(source.fuelLiters, 0));
    if (!source.detail) {
      normalized.detail = makeFuelDetail(normalized.fuelType, normalized.fuelLiters);
    }
  }

  return normalized;
}

function normalizeDebtSettlements(
  source: Record<string, any>,
  accounts: Account[],
  debt: Entry,
): DebtSettlement[] {
  const settlements = Array.isArray(source.debtSettlements)
    ? source.debtSettlements
        .map((settlement: unknown) => normalizeDebtSettlement(settlement, accounts))
        .filter((settlement): settlement is DebtSettlement => Boolean(settlement))
    : [];

  if (settlements.length) return settlements;

  const amount = Math.max(0, coerceNumber(source.settlementAmount, 0));
  if (!amount) return [];

  const accountId = String(source.settlementAccountId || debt.accountId || "");
  const settlementAccount = accounts.find((account) => account.id === accountId);
  if (!settlementAccount) return [];

  return [
    {
      accountId: settlementAccount.id,
      amount: roundMoney(amount),
      date: isDateKey(source.settlementDate) ? source.settlementDate : debt.date,
      note: String(source.settlementNote || "").trim() || undefined,
      createdAt: source.settledAt || source.updatedAt || debt.createdAt || new Date().toISOString(),
    },
  ];
}

function normalizeDebtSettlement(
  settlement: unknown,
  accounts: Account[],
): DebtSettlement | null {
  if (!settlement || typeof settlement !== "object") return null;
  const source = settlement as Record<string, any>;
  const accountId = String(source.accountId || "");
  const account = accounts.find((item) => item.id === accountId);
  const amount = Math.max(0, coerceNumber(source.amount, 0));
  const date = isDateKey(source.date) ? source.date : "";

  if (!account || !amount || !date) return null;

  return {
    accountId: account.id,
    amount: roundMoney(amount),
    date,
    note: String(source.note || source.name || "").trim() || undefined,
    createdAt: source.createdAt || new Date().toISOString(),
  };
}

function normalizeTurnoverProject(project: unknown): TurnoverProject | null {
  if (!project || typeof project !== "object") return null;
  const source = project as Record<string, any>;
  const title = String(source.title || "").trim();
  const targetAmount = Math.max(0, coerceNumber(source.targetAmount, 0));
  const currency = normalizeCurrency(source.currency || BASE_CURRENCY);

  if (!title || !targetAmount || !currency) return null;

  const participants = Array.isArray(source.participants)
    ? source.participants
        .map((participant: unknown) => normalizeTurnoverParticipant(participant))
        .filter((participant): participant is TurnoverParticipant => Boolean(participant))
    : [];
  const investors = Array.isArray(source.investors)
    ? source.investors
        .map((investor: unknown) => normalizeTurnoverInvestor(investor))
        .filter((investor): investor is TurnoverInvestor => Boolean(investor))
    : [];

  return {
    id: String(source.id || makeId("turnover")),
    title,
    targetAmount: roundMoney(targetAmount),
    currency,
    participants,
    investors,
    createdAt: source.createdAt || new Date().toISOString(),
    updatedAt: source.updatedAt || source.createdAt || new Date().toISOString(),
  };
}

function normalizeTurnoverParticipant(participant: unknown): TurnoverParticipant | null {
  if (!participant || typeof participant !== "object") return null;
  const source = participant as Record<string, any>;
  const name = String(source.name || "").trim();
  if (!name) return null;
  const contributions = Array.isArray(source.contributions)
    ? source.contributions
        .map((contribution: unknown) => normalizeTurnoverContribution(contribution))
        .filter((contribution): contribution is TurnoverParticipantContribution =>
          Boolean(contribution),
        )
    : [];

  return {
    id: String(source.id || makeId("person")),
    name,
    percent: Math.min(100, Math.max(0, coerceNumber(source.percent, 0))),
    contributions,
  };
}

function normalizeTurnoverContribution(
  contribution: unknown,
): TurnoverParticipantContribution | null {
  if (!contribution || typeof contribution !== "object") return null;
  const source = contribution as Record<string, any>;
  const amount = Math.max(0, coerceNumber(source.amount, 0));
  const date = isDateKey(source.date) ? source.date : todayKey();
  if (!amount) return null;

  return {
    id: String(source.id || makeId("contribution")),
    amount: roundMoney(amount),
    date,
    createdAt: source.createdAt || new Date().toISOString(),
  };
}

function normalizeTurnoverInvestor(investor: unknown): TurnoverInvestor | null {
  if (!investor || typeof investor !== "object") return null;
  const source = investor as Record<string, any>;
  const name = String(source.name || "").trim();
  const amount = Math.max(0, coerceNumber(source.amount, 0));
  if (!name || !amount) return null;

  const repayments = Array.isArray(source.repayments)
    ? source.repayments
        .map((repayment: unknown) => normalizeTurnoverRepayment(repayment))
        .filter((repayment): repayment is TurnoverInvestorRepayment => Boolean(repayment))
    : [];

  return {
    id: String(source.id || makeId("investor")),
    name,
    amount: roundMoney(amount),
    repayments,
    createdAt: source.createdAt || new Date().toISOString(),
  };
}

function normalizeTurnoverRepayment(repayment: unknown): TurnoverInvestorRepayment | null {
  if (!repayment || typeof repayment !== "object") return null;
  const source = repayment as Record<string, any>;
  const participantId = String(source.participantId || "").trim();
  const fromName = String(source.fromName || source.name || "").trim();
  const amount = Math.max(0, coerceNumber(source.amount, 0));
  const date = isDateKey(source.date) ? source.date : todayKey();
  if (!fromName || !amount) return null;

  return {
    id: String(source.id || makeId("repay")),
    participantId: participantId || undefined,
    fromName,
    amount: roundMoney(amount),
    date,
    createdAt: source.createdAt || new Date().toISOString(),
  };
}

function isEmptyLegacyState(source: Record<string, any>): boolean {
  if (!source || Number(source.version || 1) >= APP_VERSION) return false;
  const entries = Array.isArray(source.entries) ? source.entries : [];
  if (entries.length > 0) return false;

  if (Array.isArray(source.accounts)) return source.accounts.length === 0;
  if (!source.accounts || typeof source.accounts !== "object") return true;

  return Object.values(source.accounts).every(
    (account: any) => coerceNumber(account?.initial, 0) === 0,
  );
}

function dedupeAccounts(accounts: Account[]): Account[] {
  const seen = new Set<string>();
  return accounts.map((account) => {
    let id = account.id;
    while (seen.has(id)) id = makeId("acct");
    seen.add(id);
    return { ...account, id };
  });
}
