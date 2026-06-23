import type { TelegramStorage, TelegramWebApp } from "../types";

export interface TelegramContext {
  tg: TelegramWebApp | null;
  isRuntime: boolean;
  deviceStorage: TelegramStorage | null;
  cloudStorage: TelegramStorage | null;
}

export function getTelegramContext(): TelegramContext {
  const tg = window.Telegram?.WebApp || null;
  const isRuntime = Boolean(tg?.initData);

  return {
    tg,
    isRuntime,
    deviceStorage: isRuntime ? tg?.DeviceStorage || null : null,
    cloudStorage: isRuntime ? tg?.CloudStorage || null : null,
  };
}

export function initTelegramShell(context: TelegramContext): void {
  callTelegramMethod(context, "ready");
  callTelegramMethod(context, "expand");
  callTelegramMethod(context, "enableClosingConfirmation", "6.2");
  callTelegramMethod(context, "setHeaderColor", "6.1", "#eef4f8");
  callTelegramMethod(context, "setBackgroundColor", "6.1", "#eef4f8");
}

export function notifyTelegramSuccess(context: TelegramContext): void {
  const { tg } = context;
  if (!canUseTelegramNestedMethod(context, tg?.HapticFeedback, "notificationOccurred", "6.1")) {
    return;
  }

  try {
    tg?.HapticFeedback?.notificationOccurred("success");
  } catch {
    // Older Telegram WebViews may expose methods before they are actually usable.
  }
}

export function confirmAction(context: TelegramContext, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const { tg } = context;
    if (canUseTelegramMethod(context, "showConfirm", "6.2")) {
      try {
        tg?.showConfirm?.(message, resolve);
        return;
      } catch {
        resolve(window.confirm(message));
        return;
      }
    }

    resolve(window.confirm(message));
  });
}

function callTelegramMethod(
  context: TelegramContext,
  methodName: keyof TelegramWebApp,
  minVersion?: string,
  ...args: unknown[]
): boolean {
  const { tg } = context;
  if (!canUseTelegramMethod(context, methodName, minVersion)) return false;

  try {
    (tg?.[methodName] as (...args: unknown[]) => void)(...args);
    return true;
  } catch {
    return false;
  }
}

function canUseTelegramMethod(
  context: TelegramContext,
  methodName: keyof TelegramWebApp,
  minVersion?: string,
): boolean {
  const { tg } = context;
  if (!tg || typeof tg[methodName] !== "function") return false;

  if (minVersion && typeof tg.isVersionAtLeast === "function") {
    try {
      return tg.isVersionAtLeast(minVersion);
    } catch {
      return false;
    }
  }

  return true;
}

function canUseTelegramNestedMethod(
  context: TelegramContext,
  target: unknown,
  methodName: string,
  minVersion?: string,
): boolean {
  const { tg } = context;
  if (!target || typeof (target as Record<string, unknown>)[methodName] !== "function") {
    return false;
  }

  if (minVersion && typeof tg?.isVersionAtLeast === "function") {
    try {
      return tg.isVersionAtLeast(minVersion);
    } catch {
      return false;
    }
  }

  return true;
}

