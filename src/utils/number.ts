export function parseAmount(value: unknown): number {
  const amount = parseDecimal(value);
  return amount === null ? 0 : amount;
}

export function parseSettingAmount(value: unknown): number | null {
  const normalized = String(value).trim();
  if (!normalized) return 0;
  return parseDecimal(normalized);
}

export function parseDecimal(value: unknown): number | null {
  const normalized = String(value).replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d*(\.\d*)?$/.test(normalized) || normalized === "-" || normalized === ".") {
    return null;
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) ? roundMoney(amount) : null;
}

export function coerceNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? roundMoney(number) : fallback;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

