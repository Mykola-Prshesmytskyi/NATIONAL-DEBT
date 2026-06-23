export type AccountKind = "card" | "cash" | "savings" | "other";
export type EntryType = "expense" | "fuel" | "income" | "subscription" | "exchange" | "debt";
export type DebtDirection = "to_me" | "by_me";
export type DebtStatus = "open" | "closed";
export type DateKey = string;

export interface DailyLimit {
  fromDate: DateKey;
  amount: number;
}

export interface AppSettings {
  startDate: DateKey;
  dailyAllowance: number;
  dailyLimits: DailyLimit[];
  subscriptionBudget: number;
  dailyLimitEnabled: boolean;
  language: string;
}

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  currency: string;
  initial: number;
  createdAt: string;
}

export interface Receipt {
  name: string;
  type: string;
  dataUrl: string;
  createdAt: string;
}

export interface DebtSettlement {
  accountId: string;
  amount: number;
  date: DateKey;
  note?: string;
  createdAt: string;
}

export interface TurnoverParticipantContribution {
  id: string;
  amount: number;
  date: DateKey;
  createdAt: string;
}

export interface TurnoverParticipant {
  id: string;
  name: string;
  percent: number;
  contributions: TurnoverParticipantContribution[];
}

export interface TurnoverInvestorRepayment {
  id: string;
  participantId?: string;
  fromName: string;
  amount: number;
  date: DateKey;
  createdAt: string;
}

export interface TurnoverInvestor {
  id: string;
  name: string;
  amount: number;
  repayments: TurnoverInvestorRepayment[];
  createdAt: string;
}

export interface TurnoverProject {
  id: string;
  title: string;
  targetAmount: number;
  currency: string;
  participants: TurnoverParticipant[];
  investors: TurnoverInvestor[];
  createdAt: string;
  updatedAt?: string;
}

export interface Entry {
  id: string;
  type: EntryType;
  detail: string;
  date: DateKey;
  createdAt: string;
  accountId?: string;
  amount?: number;
  currency?: string;
  budgetAmount?: number;
  fuelType?: string;
  fuelLiters?: number;
  fromAccountId?: string;
  toAccountId?: string;
  fromAmount?: number;
  toAmount?: number;
  fromCurrency?: string;
  toCurrency?: string;
  debtDirection?: DebtDirection;
  status?: DebtStatus;
  receipt?: Receipt | null;
  debtSettlements?: DebtSettlement[];
  settlementAmount?: number;
  settlementAccountId?: string;
  settlementDate?: DateKey;
  writeOffBudgetAmount?: number;
  settledAt?: string;
  updatedAt?: string;
}

export interface AppState {
  version: number;
  settings: AppSettings;
  accounts: Account[];
  entries: Entry[];
  turnoverProjects: TurnoverProject[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface TypeMeta {
  label: string;
  detailLabel?: string;
  placeholder?: string;
  sign: number;
}

export interface DebtDirectionMeta {
  label: string;
  amountLabel: string;
  detailLabel: string;
  placeholder: string;
  modalNote: string;
}

export interface TelegramStorage {
  getItem(key: string, callback: (error: unknown, value?: string) => void): void;
  setItem(key: string, value: string, callback: (error: unknown, ok?: boolean) => void): void;
  removeItem(key: string, callback: (error: unknown, ok?: boolean) => void): void;
}

export interface TelegramWebApp {
  initData?: string;
  DeviceStorage?: TelegramStorage;
  CloudStorage?: TelegramStorage;
  HapticFeedback?: {
    notificationOccurred(type: "success" | "warning" | "error"): void;
  };
  ready?: () => void;
  expand?: () => void;
  enableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  showConfirm?: (message: string, callback: (ok: boolean) => void) => void;
  isVersionAtLeast?: (version: string) => boolean;
  [methodName: string]: unknown;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
