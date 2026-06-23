import type { AccountKind, DebtDirection, DebtDirectionMeta, EntryType, TypeMeta } from "./types";

export const STORAGE_KEY = "national_debt_state_v1";
export const DEVICE_KEY = "national_debt_device_v1";
export const CLOUD_PREFIX = "national_debt_v1";
export const CLOUD_META_KEY = `${CLOUD_PREFIX}_meta`;
export const CLOUD_CHUNK_SIZE = 3800;
export const APP_VERSION = 8;
export const BASE_CURRENCY = "UAH";
export const DEFAULT_DAILY_ALLOWANCE = 500;
export const STORAGE_TIMEOUT_MS = 4500;
export const SYNC_TIMEOUT_MS = 6000;
export const RECEIPT_MAX_SIZE = 1280;
export const RECEIPT_QUALITY = 0.78;

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  card: "Картка",
  cash: "Готівка",
  savings: "Накопичення",
  other: "Інше",
};

export const LEGACY_ACCOUNT_LABELS: Record<string, string> = {
  card: "Карта",
  cash: "Готівка",
  usdCash: "Готівка USD",
};

export const TYPE_META: Record<EntryType, TypeMeta> = {
  expense: {
    label: "Витрата",
    detailLabel: "На що витрачено",
    placeholder: "Продукти, кава, таксі",
    sign: -1,
  },
  fuel: {
    label: "Пальне",
    detailLabel: "АЗС або нотатка",
    placeholder: "ОККО, WOG, траса",
    sign: -1,
  },
  income: {
    label: "Дохід",
    detailLabel: "Звідки кошти",
    placeholder: "Зарплата, повернення боргу",
    sign: 1,
  },
  subscription: {
    label: "Підписка",
    detailLabel: "Назва підписки",
    placeholder: "YouTube, Spotify, хостинг",
    sign: -1,
  },
  exchange: {
    label: "Обмін",
    sign: 0,
  },
  debt: {
    label: "Борг",
    detailLabel: "Хто і за що",
    placeholder: "Імʼя, чек, за що борг",
    sign: 0,
  },
};

export const DEBT_DIRECTION_META: Record<DebtDirection, DebtDirectionMeta> = {
  to_me: {
    label: "Мені винні",
    amountLabel: "Скільки повернули",
    detailLabel: "Хто винен і за що",
    placeholder: "Імʼя, чек, за що тобі винні",
    modalNote:
      "Якщо повернули менше за борг, різниця спишеться з денного ліміту на дату розрахунку.",
  },
  by_me: {
    label: "Я винен",
    amountLabel: "Скільки віддав",
    detailLabel: "Кому винен і за що",
    placeholder: "Імʼя, за що ти винен",
    modalNote:
      "Основна сума боргу денний ліміт не чіпає. Переплата понад борг спишеться з денного ліміту.",
  },
};
