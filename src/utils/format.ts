import { BASE_CURRENCY } from "../constants";
import { localeForLanguage, tText } from "../i18n";
import { coerceNumber } from "./number";
import { parseDateKey } from "./date";
import { normalizeCurrency, normalizeFuelType } from "./sanitize";

export function formatInputNumber(value: unknown): string {
  const number = coerceNumber(value, 0);
  return Number.isInteger(number) ? String(number) : String(number).replace(".", ",");
}

export function formatMoney(value: number, currency?: string, language = "uk"): string {
  const normalizedCurrency = normalizeCurrency(currency) || BASE_CURRENCY;
  const locale = localeForLanguage(language);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    }).format(value)} ${normalizedCurrency}`;
  }
}

export function formatSignedMoney(value: number, currency?: string, language = "uk"): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatMoney(value, currency, language)}`;
}

export function makeExchangeRateLabel(
  fromAmount: number,
  fromCurrency: string,
  toAmount: number,
  toCurrency: string,
  language = "uk",
): string {
  if (!fromAmount || !toAmount) return tText(language, "Курс не пораховано");

  if (fromCurrency === BASE_CURRENCY && toCurrency !== BASE_CURRENCY) {
    return tText(language, "1 {toCurrency} = {rate} UAH", {
      toCurrency,
      rate: formatPlainNumber(fromAmount / toAmount, language),
    });
  }

  if (toCurrency === BASE_CURRENCY && fromCurrency !== BASE_CURRENCY) {
    return tText(language, "1 {fromCurrency} = {rate} UAH", {
      fromCurrency,
      rate: formatPlainNumber(toAmount / fromAmount, language),
    });
  }

  return tText(language, "1 {fromCurrency} = {rate} {toCurrency}", {
    fromCurrency,
    toCurrency,
    rate: formatPlainNumber(toAmount / fromAmount, language),
  });
}

export function formatPlainNumber(value: number, language = "uk"): string {
  return new Intl.NumberFormat(localeForLanguage(language), {
    maximumFractionDigits: 4,
  }).format(value);
}

export function formatFuelLiters(value: number, language = "uk"): string {
  return new Intl.NumberFormat(localeForLanguage(language), {
    maximumFractionDigits: 2,
  }).format(value);
}

export function makeFuelDetail(fuelType: string | undefined, liters: number, language = "uk"): string {
  return tText(language, "Пальне: {fuelType}, {liters} л", {
    fuelType: normalizeFuelType(fuelType),
    liters: formatFuelLiters(liters, language),
  });
}

export function chartRangeLabel(range: number, language = "uk"): string {
  if (range === 7) return tText(language, "тиждень");
  if (range === 30) return tText(language, "місяць");
  return tText(language, "пів року");
}

export function formatDateHuman(dateKey: string, language = "uk"): string {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseDateKey(dateKey));
}

export function formatDateShort(dateKey: string, language = "uk"): string {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    day: "2-digit",
    month: "2-digit",
  }).format(parseDateKey(dateKey));
}
