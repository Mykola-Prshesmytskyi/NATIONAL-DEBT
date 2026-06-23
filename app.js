"use strict";
(() => {
  // src/constants.ts
  var STORAGE_KEY = "national_debt_state_v1";
  var DEVICE_KEY = "national_debt_device_v1";
  var CLOUD_PREFIX = "national_debt_v1";
  var CLOUD_META_KEY = `${CLOUD_PREFIX}_meta`;
  var CLOUD_CHUNK_SIZE = 3800;
  var APP_VERSION = 8;
  var BASE_CURRENCY = "UAH";
  var DEFAULT_DAILY_ALLOWANCE = 500;
  var STORAGE_TIMEOUT_MS = 4500;
  var SYNC_TIMEOUT_MS = 6e3;
  var RECEIPT_MAX_SIZE = 1280;
  var RECEIPT_QUALITY = 0.78;
  var ACCOUNT_KIND_LABELS = {
    card: "\u041A\u0430\u0440\u0442\u043A\u0430",
    cash: "\u0413\u043E\u0442\u0456\u0432\u043A\u0430",
    savings: "\u041D\u0430\u043A\u043E\u043F\u0438\u0447\u0435\u043D\u043D\u044F",
    other: "\u0406\u043D\u0448\u0435"
  };
  var LEGACY_ACCOUNT_LABELS = {
    card: "\u041A\u0430\u0440\u0442\u0430",
    cash: "\u0413\u043E\u0442\u0456\u0432\u043A\u0430",
    usdCash: "\u0413\u043E\u0442\u0456\u0432\u043A\u0430 USD"
  };
  var TYPE_META = {
    expense: {
      label: "\u0412\u0438\u0442\u0440\u0430\u0442\u0430",
      detailLabel: "\u041D\u0430 \u0449\u043E \u0432\u0438\u0442\u0440\u0430\u0447\u0435\u043D\u043E",
      placeholder: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442\u0438, \u043A\u0430\u0432\u0430, \u0442\u0430\u043A\u0441\u0456",
      sign: -1
    },
    fuel: {
      label: "\u041F\u0430\u043B\u044C\u043D\u0435",
      detailLabel: "\u0410\u0417\u0421 \u0430\u0431\u043E \u043D\u043E\u0442\u0430\u0442\u043A\u0430",
      placeholder: "\u041E\u041A\u041A\u041E, WOG, \u0442\u0440\u0430\u0441\u0430",
      sign: -1
    },
    income: {
      label: "\u0414\u043E\u0445\u0456\u0434",
      detailLabel: "\u0417\u0432\u0456\u0434\u043A\u0438 \u043A\u043E\u0448\u0442\u0438",
      placeholder: "\u0417\u0430\u0440\u043F\u043B\u0430\u0442\u0430, \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043D\u044F \u0431\u043E\u0440\u0433\u0443",
      sign: 1
    },
    subscription: {
      label: "\u041F\u0456\u0434\u043F\u0438\u0441\u043A\u0430",
      detailLabel: "\u041D\u0430\u0437\u0432\u0430 \u043F\u0456\u0434\u043F\u0438\u0441\u043A\u0438",
      placeholder: "YouTube, Spotify, \u0445\u043E\u0441\u0442\u0438\u043D\u0433",
      sign: -1
    },
    exchange: {
      label: "\u041E\u0431\u043C\u0456\u043D",
      sign: 0
    },
    debt: {
      label: "\u0411\u043E\u0440\u0433",
      detailLabel: "\u0425\u0442\u043E \u0456 \u0437\u0430 \u0449\u043E",
      placeholder: "\u0406\u043C\u02BC\u044F, \u0447\u0435\u043A, \u0437\u0430 \u0449\u043E \u0431\u043E\u0440\u0433",
      sign: 0
    }
  };
  var DEBT_DIRECTION_META = {
    to_me: {
      label: "\u041C\u0435\u043D\u0456 \u0432\u0438\u043D\u043D\u0456",
      amountLabel: "\u0421\u043A\u0456\u043B\u044C\u043A\u0438 \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u043B\u0438",
      detailLabel: "\u0425\u0442\u043E \u0432\u0438\u043D\u0435\u043D \u0456 \u0437\u0430 \u0449\u043E",
      placeholder: "\u0406\u043C\u02BC\u044F, \u0447\u0435\u043A, \u0437\u0430 \u0449\u043E \u0442\u043E\u0431\u0456 \u0432\u0438\u043D\u043D\u0456",
      modalNote: "\u042F\u043A\u0449\u043E \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u043B\u0438 \u043C\u0435\u043D\u0448\u0435 \u0437\u0430 \u0431\u043E\u0440\u0433, \u0440\u0456\u0437\u043D\u0438\u0446\u044F \u0441\u043F\u0438\u0448\u0435\u0442\u044C\u0441\u044F \u0437 \u0434\u0435\u043D\u043D\u043E\u0433\u043E \u043B\u0456\u043C\u0456\u0442\u0443 \u043D\u0430 \u0434\u0430\u0442\u0443 \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043A\u0443."
    },
    by_me: {
      label: "\u042F \u0432\u0438\u043D\u0435\u043D",
      amountLabel: "\u0421\u043A\u0456\u043B\u044C\u043A\u0438 \u0432\u0456\u0434\u0434\u0430\u0432",
      detailLabel: "\u041A\u043E\u043C\u0443 \u0432\u0438\u043D\u0435\u043D \u0456 \u0437\u0430 \u0449\u043E",
      placeholder: "\u0406\u043C\u02BC\u044F, \u0437\u0430 \u0449\u043E \u0442\u0438 \u0432\u0438\u043D\u0435\u043D",
      modalNote: "\u041E\u0441\u043D\u043E\u0432\u043D\u0430 \u0441\u0443\u043C\u0430 \u0431\u043E\u0440\u0433\u0443 \u0434\u0435\u043D\u043D\u0438\u0439 \u043B\u0456\u043C\u0456\u0442 \u043D\u0435 \u0447\u0456\u043F\u0430\u0454. \u041F\u0435\u0440\u0435\u043F\u043B\u0430\u0442\u0430 \u043F\u043E\u043D\u0430\u0434 \u0431\u043E\u0440\u0433 \u0441\u043F\u0438\u0448\u0435\u0442\u044C\u0441\u044F \u0437 \u0434\u0435\u043D\u043D\u043E\u0433\u043E \u043B\u0456\u043C\u0456\u0442\u0443."
    }
  };

  // src/utils/number.ts
  function parseAmount(value) {
    const amount = parseDecimal(value);
    return amount === null ? 0 : amount;
  }
  function parseSettingAmount(value) {
    const normalized = String(value).trim();
    if (!normalized) return 0;
    return parseDecimal(normalized);
  }
  function parseDecimal(value) {
    const normalized = String(value).replace(/\s/g, "").replace(",", ".");
    if (!/^-?\d*(\.\d*)?$/.test(normalized) || normalized === "-" || normalized === ".") {
      return null;
    }
    const amount = Number(normalized);
    return Number.isFinite(amount) ? roundMoney(amount) : null;
  }
  function coerceNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? roundMoney(number) : fallback;
  }
  function roundMoney(value) {
    return Math.round(value * 100) / 100;
  }

  // src/domain/debt.ts
  function isDebtClosed(entry) {
    return entry?.type === "debt" && entry.status === "closed";
  }
  function getDebtSettlements(entry) {
    if (Array.isArray(entry.debtSettlements) && entry.debtSettlements.length) {
      return entry.debtSettlements;
    }
    const amount = Math.max(0, coerceNumber(entry.settlementAmount, 0));
    const accountId = String(entry.settlementAccountId || "");
    const date = String(entry.settlementDate || entry.date || "");
    const legacyNote = entry.settlementNote;
    if (!amount || !accountId || !date) return [];
    return [
      {
        accountId,
        amount,
        date,
        note: typeof legacyNote === "string" ? legacyNote : void 0,
        createdAt: entry.settledAt || entry.updatedAt || entry.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
  }
  function getDebtSettlementTotal(entry) {
    return roundMoney(
      getDebtSettlements(entry).reduce((total, settlement) => {
        return total + Math.max(0, coerceNumber(settlement.amount, 0));
      }, 0)
    );
  }
  function getDebtRemainingAmount(entry) {
    return roundMoney(Math.max(0, Number(entry.amount || 0) - getDebtSettlementTotal(entry)));
  }
  function getDebtWriteOffAmount(entry) {
    if (!isDebtClosed(entry)) return 0;
    if (entry.debtDirection === "by_me") return 0;
    const amount = Number(entry.amount || 0);
    const settlementAmount = getDebtSettlementTotal(entry);
    const computed = Math.max(0, amount - settlementAmount);
    const stored = Number(entry.writeOffBudgetAmount);
    return roundMoney(Number.isFinite(stored) && stored > 0 ? stored : computed);
  }
  function getDebtBudgetEvents(entry) {
    if (entry.debtDirection === "by_me") {
      return getDebtSettlements(entry).map((settlement) => ({
        date: settlement.date,
        amount: Math.max(0, coerceNumber(settlement.amount, 0))
      })).filter((event) => event.date && event.amount > 0);
    }
    const writeOffAmount = getDebtWriteOffAmount(entry);
    if (!writeOffAmount) return [];
    const settlements = getDebtSettlements(entry);
    return [
      {
        date: entry.settlementDate || settlements[settlements.length - 1]?.date || entry.date,
        amount: writeOffAmount
      }
    ];
  }

  // src/utils/date.ts
  function todayKey() {
    return dateKeyFromDate(/* @__PURE__ */ new Date());
  }
  function dateKeyFromDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function parseDateKey(dateKey) {
    const [year, month, day] = String(dateKey).split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  function isDateKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value));
  }
  function dateValue(value) {
    const time = Date.parse(String(value || ""));
    return Number.isFinite(time) ? time : 0;
  }

  // src/state/dailyLimits.ts
  function getDailyLimitFromList(limits, dateKey, fallbackAmount) {
    const normalized = normalizeDailyLimitRows(limits);
    if (!normalized.length) return Math.max(0, coerceNumber(fallbackAmount, 0));
    let activeAmount = normalized[0].amount;
    for (const limit of normalized) {
      if (limit.fromDate > dateKey) break;
      activeAmount = limit.amount;
    }
    return activeAmount;
  }
  function normalizeDailyLimits(input, startDate, fallbackAmount) {
    const fallback = Math.max(0, coerceNumber(fallbackAmount, DEFAULT_DAILY_ALLOWANCE));
    const limits = normalizeDailyLimitRows(input);
    const seededLimits = limits.length ? limits : [{ fromDate: startDate, amount: fallback }];
    if (!seededLimits.some((limit) => limit.fromDate <= startDate)) {
      seededLimits.push({ fromDate: startDate, amount: fallback });
    }
    return compactDailyLimits(seededLimits);
  }
  function normalizeDailyLimitRows(input) {
    if (!Array.isArray(input)) return [];
    return input.map((limit) => ({
      fromDate: isDateKey(limit?.fromDate) ? limit.fromDate : "",
      amount: Math.max(0, coerceNumber(limit?.amount, 0))
    })).filter((limit) => Boolean(limit.fromDate)).sort((a, b) => a.fromDate.localeCompare(b.fromDate));
  }
  function compactDailyLimits(input) {
    const byDate = /* @__PURE__ */ new Map();
    for (const limit of normalizeDailyLimitRows(input)) {
      byDate.set(limit.fromDate, limit.amount);
    }
    const compacted = [];
    for (const [fromDate, amount] of [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const previous = compacted[compacted.length - 1];
      if (previous && previous.amount === amount) continue;
      compacted.push({ fromDate, amount });
    }
    return compacted;
  }
  function getLatestDailyLimit(limits, fallbackAmount) {
    const normalized = normalizeDailyLimitRows(limits);
    return normalized.length ? normalized[normalized.length - 1].amount : Math.max(0, coerceNumber(fallbackAmount, DEFAULT_DAILY_ALLOWANCE));
  }

  // src/domain/calculations.ts
  function findAccount(state, accountId) {
    return state.accounts.find((account) => account.id === accountId) || null;
  }
  function calculateBalances(state) {
    const balances = Object.fromEntries(
      state.accounts.map((account) => [account.id, Number(account.initial) || 0])
    );
    for (const entry of state.entries) {
      if (entry.type === "exchange") {
        if (entry.fromAccountId && balances[entry.fromAccountId] !== void 0) {
          balances[entry.fromAccountId] -= Number(entry.fromAmount || 0);
        }
        if (entry.toAccountId && balances[entry.toAccountId] !== void 0) {
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
  function applyDebtToBalances(state, entry, balances) {
    const amount = Number(entry.amount || 0);
    const account = findAccount(state, entry.accountId);
    if (entry.debtDirection === "to_me" && account && balances[account.id] !== void 0) {
      balances[account.id] -= amount;
    }
    for (const settlement of getDebtSettlements(entry)) {
      const settlementAccount = findAccount(state, settlement.accountId);
      if (!settlementAccount || balances[settlementAccount.id] === void 0) continue;
      balances[settlementAccount.id] += entry.debtDirection === "by_me" ? -Number(settlement.amount || 0) : Number(settlement.amount || 0);
    }
  }
  function getCurrencyTotals(state, balances) {
    const totals = /* @__PURE__ */ new Map();
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
  function buildExpenseSeries(state, range) {
    const end = parseDateKey(todayKey());
    const byDate = /* @__PURE__ */ new Map();
    const series = [];
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
  function sumEntries(state, predicate, valueGetter) {
    return state.entries.reduce((total, entry) => {
      if (!predicate(entry)) return total;
      return total + valueGetter(entry);
    }, 0);
  }
  function getEntryBudgetAmount(state, entry) {
    const stored = Number(entry.budgetAmount);
    if (Number.isFinite(stored)) return stored;
    const account = findAccount(state, entry.accountId);
    if (account?.currency === BASE_CURRENCY) return Number(entry.amount || 0);
    return 0;
  }
  function getDailyBudgetAmount(state, entry) {
    if (entry.type === "expense") return getEntryBudgetAmount(state, entry);
    if (entry.type === "debt") {
      return getDebtBudgetEvents(entry).reduce((total, event) => total + event.amount, 0);
    }
    return 0;
  }
  function getDailyBudgetDate(entry) {
    if (entry.type === "debt") {
      const events = getDebtBudgetEvents(entry);
      return events[events.length - 1]?.date || entry.settlementDate || entry.date;
    }
    return entry.date;
  }
  function getChartBudgetAmount(state, entry) {
    if (entry.type === "expense" || entry.type === "subscription") {
      return getEntryBudgetAmount(state, entry);
    }
    if (entry.type === "fuel") return getFuelChartAmount(state, entry);
    if (entry.type === "debt") {
      return getDebtBudgetEvents(entry).reduce((total, event) => total + event.amount, 0);
    }
    return 0;
  }
  function getFuelChartAmount(state, entry) {
    const account = findAccount(state, entry.accountId);
    const currency = entry.currency || account?.currency || BASE_CURRENCY;
    return currency === BASE_CURRENCY ? Number(entry.amount || 0) : 0;
  }
  function getChartBudgetDate(entry) {
    if (entry.type !== "debt") return entry.date;
    const events = getDebtBudgetEvents(entry);
    return events[events.length - 1]?.date || entry.settlementDate || entry.date;
  }
  function sortedEntries(state) {
    return [...state.entries].sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate) return byDate;
      return Date.parse(b.createdAt || "") - Date.parse(a.createdAt || "");
    });
  }
  function elapsedBudgetDays(settings) {
    const start = parseDateKey(settings.startDate);
    const today = parseDateKey(todayKey());
    const diff = Math.floor((today.getTime() - start.getTime()) / 864e5);
    return Math.max(0, diff + 1);
  }
  function calculateDailyAccruedBudget(settings) {
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
  function getDailyLimitForDate(settings, dateKey) {
    return getDailyLimitFromList(
      settings.dailyLimits,
      dateKey,
      settings.dailyAllowance || DEFAULT_DAILY_ALLOWANCE
    );
  }
  function isInBudgetPeriodByDate(settings, dateKey) {
    return String(dateKey || "") >= String(settings.startDate);
  }
  function getCleanDailyLimitAmount(value) {
    return Math.max(0, coerceNumber(value, DEFAULT_DAILY_ALLOWANCE));
  }

  // src/infrastructure/receipts.ts
  async function compressReceiptFile(file) {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    const scale = Math.min(1, RECEIPT_MAX_SIZE / Math.max(naturalWidth, naturalHeight));
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context is unavailable");
    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);
    return {
      name: file.name,
      type: "image/jpeg",
      dataUrl: canvas.toDataURL("image/jpeg", RECEIPT_QUALITY),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  // src/utils/async.ts
  function makeId(prefix) {
    if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
  function once(callback) {
    let called = false;
    return (value) => {
      if (called) return;
      called = true;
      callback(value);
    };
  }
  function withTimeout(promise, timeoutMs, fallbackValue) {
    return new Promise((resolve) => {
      const finish = once(resolve);
      const timer = window.setTimeout(() => finish(fallbackValue), timeoutMs);
      Promise.resolve(promise).then((value) => {
        window.clearTimeout(timer);
        finish(value);
      }).catch(() => {
        window.clearTimeout(timer);
        finish(fallbackValue);
      });
    });
  }
  function chunkText(text, size) {
    const chunks = [];
    for (let index = 0; index < text.length; index += size) {
      chunks.push(text.slice(index, index + size));
    }
    return chunks.length ? chunks : [""];
  }

  // src/i18n.ts
  var SUPPORTED_LANGUAGES = ["uk", "en", "pl"];
  var TRANSLATIONS = {
    "Telegram Mini App": { en: "Telegram Mini App", pl: "Miniaplikacja Telegram" },
    "\u0421\u0442\u0430\u0440\u0442": { en: "Start", pl: "Start" },
    "\u0421\u0442\u0430\u0440\u0442: \u0441\u044C\u043E\u0433\u043E\u0434\u043D\u0456": { en: "Start: today", pl: "Start: dzisiaj" },
    "\u0420\u0430\u0445\u0443\u043D\u043A\u0438": { en: "Accounts", pl: "Konta" },
    "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F...": { en: "Loading...", pl: "Ladowanie..." },
    "\u0421\u044C\u043E\u0433\u043E\u0434\u043D\u0456": { en: "Today", pl: "Dzisiaj" },
    "\u0428\u0432\u0438\u0434\u043A\u0438\u0439 \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u0431\u044E\u0434\u0436\u0435\u0442\u0443": { en: "Quick budget control", pl: "Szybka kontrola budzetu" },
    "\u041E\u0433\u043B\u044F\u0434 \u0431\u044E\u0434\u0436\u0435\u0442\u0443": { en: "Budget overview", pl: "Przeglad budzetu" },
    "\u0414\u0435\u043D\u044C 1": { en: "Day 1", pl: "Dzien 1" },
    "\u0414\u0435\u043D\u044C {count}": { en: "Day {count}", pl: "Dzien {count}" },
    "\u0414\u043E \u0441\u0442\u0430\u0440\u0442\u0443": { en: "Before start", pl: "Przed startem" },
    "\u0411\u0435\u0437 \u043B\u0456\u043C\u0456\u0442\u0443": { en: "No limit", pl: "Bez limitu" },
    "\u0412\u0438\u043C\u043A\u043D\u0435\u043D\u043E": { en: "Off", pl: "Wylaczone" },
    "\u0417\u0430\u0433\u0430\u043B\u044C\u043D\u0438\u0439 \u0434\u0435\u043D\u043D\u0438\u0439 \u043B\u0456\u043C\u0456\u0442": { en: "Total daily limit", pl: "Calkowity limit dzienny" },
    "\u0414\u0435\u043D\u043D\u0438\u0439 \u043B\u0456\u043C\u0456\u0442 \u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E": { en: "Daily limit is off", pl: "Limit dzienny wylaczony" },
    "\u041D\u0430\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u043E": { en: "Accrued", pl: "Naliczone" },
    "\u0412\u0438\u0442\u0440\u0430\u0447\u0435\u043D\u043E": { en: "Spent", pl: "Wydano" },
    "\u0429\u043E\u0434\u043D\u044F": { en: "Daily", pl: "Dziennie" },
    "\u041F\u0456\u0434\u043F\u0438\u0441\u043A\u0438": { en: "Subscriptions", pl: "Subskrypcje" },
    "\u0411\u044E\u0434\u0436\u0435\u0442": { en: "Budget", pl: "Budzet" },
    "\u041D\u043E\u0432\u0430 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u044F": { en: "New transaction", pl: "Nowa transakcja" },
    "\u0422\u0438\u043F \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0457": { en: "Transaction type", pl: "Typ transakcji" },
    "\u0412\u0438\u0442\u0440\u0430\u0442\u0430": { en: "Expense", pl: "Wydatek" },
    "\u0412\u0438\u0442\u0440\u0430\u0442\u0438": { en: "Expenses", pl: "Wydatki" },
    "\u041F\u0430\u043B\u044C\u043D\u0435": { en: "Fuel", pl: "Paliwo" },
    "\u0410\u0417\u0421 \u0430\u0431\u043E \u043D\u043E\u0442\u0430\u0442\u043A\u0430": { en: "Gas station or note", pl: "Stacja albo notatka" },
    "\u041E\u041A\u041A\u041E, WOG, \u0442\u0440\u0430\u0441\u0430": { en: "OKKO, WOG, highway", pl: "OKKO, WOG, trasa" },
    "\u0414\u043E\u0445\u0456\u0434": { en: "Income", pl: "Przychod" },
    "\u0414\u043E\u0445\u043E\u0434\u0438": { en: "Income", pl: "Przychody" },
    "\u0417\u0432\u0456\u0434\u043A\u0438 \u043A\u043E\u0448\u0442\u0438": { en: "Where the money came from", pl: "Skad pochodza srodki" },
    "\u0417\u0430\u0440\u043F\u043B\u0430\u0442\u0430, \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043D\u044F \u0431\u043E\u0440\u0433\u0443": { en: "Salary, debt repayment", pl: "Pensja, zwrot dlugu" },
    "\u041F\u0456\u0434\u043F\u0438\u0441\u043A\u0430": { en: "Subscription", pl: "Subskrypcja" },
    "\u041D\u0430\u0437\u0432\u0430 \u043F\u0456\u0434\u043F\u0438\u0441\u043A\u0438": { en: "Subscription name", pl: "Nazwa subskrypcji" },
    "YouTube, Spotify, \u0445\u043E\u0441\u0442\u0438\u043D\u0433": { en: "YouTube, Spotify, hosting", pl: "YouTube, Spotify, hosting" },
    "\u041E\u0431\u043C\u0456\u043D": { en: "Exchange", pl: "Wymiana" },
    "\u041E\u0431\u043C\u0456\u043D\u0438": { en: "Exchanges", pl: "Wymiany" },
    "\u0411\u043E\u0440\u0433": { en: "Debt", pl: "Dlug" },
    "\u0411\u043E\u0440\u0433\u0438": { en: "Debts", pl: "Dlugi" },
    "\u0425\u0442\u043E \u0456 \u0437\u0430 \u0449\u043E": { en: "Who and what for", pl: "Kto i za co" },
    "\u0406\u043C\u02BC\u044F, \u0447\u0435\u043A, \u0437\u0430 \u0449\u043E \u0431\u043E\u0440\u0433": { en: "Name, receipt, what the debt is for", pl: "Imie, paragon, za co dlug" },
    "\u041D\u0430\u043F\u0440\u044F\u043C \u0431\u043E\u0440\u0433\u0443": { en: "Debt direction", pl: "Kierunek dlugu" },
    "\u041C\u0435\u043D\u0456 \u0432\u0438\u043D\u043D\u0456": { en: "Owed to me", pl: "Ktos mi winien" },
    "\u042F \u0432\u0438\u043D\u0435\u043D": { en: "I owe", pl: "Ja jestem winien" },
    "\u0412\u0438\u0434 \u043F\u0430\u043B\u0438\u0432\u0430": { en: "Fuel type", pl: "Rodzaj paliwa" },
    "\u0410-95, \u0434\u0438\u0437\u0435\u043B\u044C, \u0433\u0430\u0437": { en: "A-95, diesel, gas", pl: "A-95, diesel, gaz" },
    "\u0417\u0430\u043B\u0438\u0442\u043E, \u043B": { en: "Filled, L", pl: "Zatankowano, l" },
    "\u041F\u0430\u043B\u044C\u043D\u0435 \u043D\u0435 \u0437\u043D\u0456\u043C\u0430\u0454\u0442\u044C\u0441\u044F \u0437 \u0434\u0435\u043D\u043D\u043E\u0433\u043E \u043B\u0456\u043C\u0456\u0442\u0443": {
      en: "Fuel does not reduce the daily limit",
      pl: "Paliwo nie zmniejsza limitu dziennego"
    },
    "\u0417\u0430\u043F\u043B\u0430\u0442\u0438\u0432": { en: "Paid", pl: "Zaplacono" },
    "\u0421\u0443\u043C\u0430": { en: "Amount", pl: "Kwota" },
    "\u0420\u0430\u0445\u0443\u043D\u043E\u043A": { en: "Account", pl: "Konto" },
    "\u0414\u043B\u044F \u043B\u0456\u043C\u0456\u0442\u0443, \u0433\u0440\u043D": { en: "For limit, UAH", pl: "Do limitu, UAH" },
    "\u0414\u0430\u0442\u0430": { en: "Date", pl: "Data" },
    "\u041D\u0430 \u0449\u043E \u0432\u0438\u0442\u0440\u0430\u0447\u0435\u043D\u043E": { en: "What was it for", pl: "Na co wydano" },
    "\u041F\u0440\u043E\u0434\u0443\u043A\u0442\u0438, \u043A\u0430\u0432\u0430, \u0442\u0430\u043A\u0441\u0456": { en: "Groceries, coffee, taxi", pl: "Zakupy, kawa, taxi" },
    "\u0424\u043E\u0442\u043E \u0447\u0435\u043A\u0430": { en: "Receipt photo", pl: "Zdjecie paragonu" },
    "\u0414\u043E\u0434\u0430\u0442\u0438 \u0444\u043E\u0442\u043E": { en: "Add photo", pl: "Dodaj zdjecie" },
    "\u041C\u043E\u0436\u043D\u0430 \u0434\u043E\u0434\u0430\u0442\u0438 \u0444\u043E\u0442\u043E \u0430\u0431\u043E \u0441\u043A\u0440\u0456\u043D \u0447\u0435\u043A\u0430": {
      en: "You can add a receipt photo or screenshot",
      pl: "Mozesz dodac zdjecie albo zrzut paragonu"
    },
    "\u0412\u0456\u0434\u0434\u0430\u0432 \u0437": { en: "Sent from", pl: "Wydano z" },
    "\u041E\u0442\u0440\u0438\u043C\u0430\u0432 \u043D\u0430": { en: "Received to", pl: "Otrzymano na" },
    "\u0414\u0435\u0442\u0430\u043B\u0456": { en: "Details", pl: "Szczegoly" },
    "\u041E\u0431\u043C\u0456\u043D, \u043F\u0435\u0440\u0435\u043A\u0430\u0437 \u043C\u0456\u0436 \u0440\u0430\u0445\u0443\u043D\u043A\u0430\u043C\u0438": {
      en: "Exchange, transfer between accounts",
      pl: "Wymiana, przelew miedzy kontami"
    },
    "\u041F\u043E\u043C\u0456\u043D\u044F\u0442\u0438 \u043D\u0430\u043F\u0440\u044F\u043C": { en: "Swap direction", pl: "Zmien kierunek" },
    "\u041A\u0443\u0440\u0441 \u0437\u02BC\u044F\u0432\u0438\u0442\u044C\u0441\u044F \u043F\u0456\u0441\u043B\u044F \u0441\u0443\u043C": {
      en: "Rate appears after amounts",
      pl: "Kurs pojawi sie po wpisaniu kwot"
    },
    "\u0414\u043E\u0434\u0430\u0442\u0438": { en: "Add", pl: "Dodaj" },
    "\u041E\u0441\u0442\u0430\u043D\u043D\u0456 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0457": { en: "Recent transactions", pl: "Ostatnie transakcje" },
    "\u0424\u0456\u043B\u044C\u0442\u0440 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0439": { en: "Transaction filter", pl: "Filtr transakcji" },
    "\u0423\u0441\u0456": { en: "All", pl: "Wszystkie" },
    "\u041D\u0430\u0437\u0430\u0434": { en: "Back", pl: "Wstecz" },
    "\u0414\u0430\u043B\u0456": { en: "Next", pl: "Dalej" },
    "\u0421\u0442\u043E\u0440\u0456\u043D\u043A\u0430 {page} \u0437 {total}": { en: "Page {page} of {total}", pl: "Strona {page} z {total}" },
    "\u041B\u0456\u043C\u0456\u0442\u0438, \u0431\u0430\u043B\u0430\u043D\u0441\u0438 \u0456 \u0432\u0430\u043B\u044E\u0442\u0438": { en: "Limits, balances and currencies", pl: "Limity, salda i waluty" },
    "\u041C\u043E\u0457 \u0433\u0440\u043E\u0448\u0456": { en: "My money", pl: "Moje pieniadze" },
    "\u0414\u043E\u0434\u0430\u0439 \u043A\u0430\u0440\u0442\u043A\u0438, \u0433\u043E\u0442\u0456\u0432\u043A\u0443 \u0430\u0431\u043E \u0432\u0430\u043B\u044E\u0442\u043D\u0456 \u0440\u0430\u0445\u0443\u043D\u043A\u0438": {
      en: "Add cards, cash or currency accounts",
      pl: "Dodaj karty, gotowke albo konta walutowe"
    },
    "\u0414\u043E\u0434\u0430\u0442\u0438 \u0440\u0430\u0445\u0443\u043D\u043E\u043A": { en: "Add account", pl: "Dodaj konto" },
    "\u041B\u0456\u043C\u0456\u0442\u0438": { en: "Limits", pl: "Limity" },
    "\u0421\u0442\u0430\u0440\u0442 \u0431\u044E\u0434\u0436\u0435\u0442\u0443, \u0434\u0435\u043D\u043D\u0438\u0439 \u043B\u0456\u043C\u0456\u0442 \u0456 \u0431\u044E\u0434\u0436\u0435\u0442 \u043F\u0456\u0434\u043F\u0438\u0441\u043E\u043A": {
      en: "Budget start, daily limit and subscription budget",
      pl: "Start budzetu, limit dzienny i budzet subskrypcji"
    },
    "\u0414\u0430\u0442\u0430 \u0441\u0442\u0430\u0440\u0442\u0443": { en: "Start date", pl: "Data startu" },
    "\u0414\u0435\u043D\u043D\u0438\u0439 \u043B\u0456\u043C\u0456\u0442, \u0433\u0440\u043D": { en: "Daily limit, UAH", pl: "Limit dzienny, UAH" },
    "\u041F\u0456\u0434\u043F\u0438\u0441\u043A\u0438, \u0433\u0440\u043D": { en: "Subscriptions, UAH", pl: "Subskrypcje, UAH" },
    "\u0412\u0435\u0441\u0442\u0438 \u0434\u0435\u043D\u043D\u0438\u0439 \u043B\u0456\u043C\u0456\u0442": { en: "Track daily limit", pl: "Sledz limit dzienny" },
    "\u041A\u043E\u043B\u0438 \u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E, \u0430\u043F\u043A\u0430 \u043D\u0435 \u0440\u0430\u0445\u0443\u0454 \u0437\u0430\u043B\u0438\u0448\u043E\u043A \u043D\u0430 \u0434\u0435\u043D\u044C, \u0430\u043B\u0435 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0457 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u044E\u0442\u044C\u0441\u044F.": {
      en: "When off, the app does not calculate daily remaining, but transactions are saved.",
      pl: "Gdy wylaczone, aplikacja nie liczy dziennej reszty, ale zapisuje transakcje."
    },
    "\u041D\u043E\u0432\u0438\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A": { en: "New account", pl: "Nowe konto" },
    "\u041A\u0430\u0440\u0442\u043A\u0430, \u0433\u043E\u0442\u0456\u0432\u043A\u0430 \u0430\u0431\u043E \u0431\u0443\u0434\u044C-\u044F\u043A\u0430 \u0432\u0430\u043B\u044E\u0442\u0430": {
      en: "Card, cash or any currency",
      pl: "Karta, gotowka albo dowolna waluta"
    },
    "\u041D\u0430\u0437\u0432\u0430": { en: "Name", pl: "Nazwa" },
    "\u0422\u0438\u043F": { en: "Type", pl: "Typ" },
    "\u041A\u0430\u0440\u0442\u043A\u0430": { en: "Card", pl: "Karta" },
    "\u0413\u043E\u0442\u0456\u0432\u043A\u0430": { en: "Cash", pl: "Gotowka" },
    "\u041D\u0430\u043A\u043E\u043F\u0438\u0447\u0435\u043D\u043D\u044F": { en: "Savings", pl: "Oszczednosci" },
    "\u0406\u043D\u0448\u0435": { en: "Other", pl: "Inne" },
    "\u0412\u0430\u043B\u044E\u0442\u0430": { en: "Currency", pl: "Waluta" },
    "\u0421\u0442\u0430\u0440\u0442\u043E\u0432\u0438\u0439 \u0431\u0430\u043B\u0430\u043D\u0441": { en: "Starting balance", pl: "Saldo poczatkowe" },
    "\u0421\u043F\u0438\u0441\u043E\u043A \u0440\u0430\u0445\u0443\u043D\u043A\u0456\u0432": { en: "Account list", pl: "Lista kont" },
    "\u041C\u043E\u0436\u043D\u0430 \u0437\u043C\u0456\u043D\u0438\u0442\u0438 \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u0438\u0439 \u0431\u0430\u043B\u0430\u043D\u0441 \u0430\u0431\u043E \u0432\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u043F\u043E\u0440\u043E\u0436\u043D\u0456\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A": {
      en: "You can edit starting balance or delete an empty account",
      pl: "Mozesz zmienic saldo poczatkowe albo usunac puste konto"
    },
    "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438": { en: "Save", pl: "Zapisz" },
    "\u0410\u043D\u0430\u043B\u0456\u0442\u0438\u043A\u0430": { en: "Analytics", pl: "Analityka" },
    "\u0429\u043E \u0456 \u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u0431\u0443\u043B\u043E \u0432\u0438\u0442\u0440\u0430\u0447\u0435\u043D\u043E": {
      en: "What was spent and how much",
      pl: "Co i ile zostalo wydane"
    },
    "\u041F\u0456\u0434\u0441\u0443\u043C\u043A\u0438 \u0432\u0438\u0442\u0440\u0430\u0442": { en: "Expense summary", pl: "Podsumowanie wydatkow" },
    "\u0412\u0441\u044C\u043E\u0433\u043E \u0437\u0430 \u043F\u0435\u0440\u0456\u043E\u0434": { en: "Total for period", pl: "Razem za okres" },
    "\u0417\u0432\u0438\u0447\u0430\u0439\u043D\u0456 \u0432\u0438\u0442\u0440\u0430\u0442\u0438": { en: "Regular expenses", pl: "Zwykle wydatki" },
    "\u0413\u0440\u0430\u0444\u0456\u043A \u0432\u0438\u0442\u0440\u0430\u0442": { en: "Expense chart", pl: "Wykres wydatkow" },
    "\u0411\u0435\u0437 \u043E\u0431\u043C\u0456\u043D\u0456\u0432, \u0443 \u0433\u0440\u043D \u0435\u043A\u0432\u0456\u0432\u0430\u043B\u0435\u043D\u0442\u0456": {
      en: "Excluding exchanges, in UAH equivalent",
      pl: "Bez wymian, w ekwiwalencie UAH"
    },
    "\u041F\u0435\u0440\u0456\u043E\u0434 \u0433\u0440\u0430\u0444\u0456\u043A\u0430": { en: "Chart period", pl: "Okres wykresu" },
    "\u0422\u0438\u0436\u0434\u0435\u043D\u044C": { en: "Week", pl: "Tydzien" },
    "\u041C\u0456\u0441\u044F\u0446\u044C": { en: "Month", pl: "Miesiac" },
    "\u041F\u0456\u0432 \u0440\u043E\u043A\u0443": { en: "Half year", pl: "Pol roku" },
    "\u041E\u0431\u043E\u0440\u043E\u0442": { en: "Turnover", pl: "Obrot" },
    "\u041F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u0457, \u0432\u043D\u0435\u0441\u043A\u0438 \u0442\u0430 \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0438": {
      en: "Proposals, contributions and investors",
      pl: "Propozycje, skladki i inwestorzy"
    },
    "\u041D\u043E\u0432\u0430 \u043F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u044F": { en: "New proposal", pl: "Nowa propozycja" },
    "\u0421\u0443\u043C\u0430, \u043B\u044E\u0434\u0438, \u0447\u0430\u0441\u0442\u043A\u0438 \u0432\u043D\u0435\u0441\u043A\u0443 \u0442\u0430 \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0441\u044C\u043A\u0456 \u043A\u043E\u0448\u0442\u0438": {
      en: "Amount, people, contribution shares and investor funds",
      pl: "Kwota, osoby, udzialy i srodki inwestorow"
    },
    "\u0429\u043E \u043A\u0443\u043F\u0443\u0454\u043C\u043E": { en: "What are we buying", pl: "Co kupujemy" },
    "2 \u0444\u0443\u043B\u043B \u0441\u0435\u0442\u0430 \u0442\u0440\u0435\u043D\u0456\u0440\u0443\u0432\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0443": {
      en: "2 full training kit sets",
      pl: "2 pelne zestawy treningowe"
    },
    "\u041F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 \u0441\u0443\u043C\u0430": { en: "Required amount", pl: "Potrzebna kwota" },
    "\u041B\u044E\u0434\u0438": { en: "People", pl: "Osoby" },
    "\u0410\u043D\u0442\u043E\u043D, \u041C\u0430\u043A\u0441\u0438\u043C, \u0406\u0440\u0430": { en: "Anton, Maksym, Ira", pl: "Anton, Maksym, Ira" },
    "\u0421\u0442\u0432\u043E\u0440\u0438\u0442\u0438 \u043F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u044E": { en: "Create proposal", pl: "Utworz propozycje" },
    "\u041F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u0439 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454": { en: "No proposals yet", pl: "Brak propozycji" },
    "\u041F\u043E\u0442\u0440\u0456\u0431\u043D\u043E": { en: "Needed", pl: "Potrzeba" },
    "\u041F\u043E\u043A\u0440\u0438\u0442\u043E": { en: "Covered", pl: "Pokryto" },
    "\u0406\u043D\u0432\u0435\u0441\u0442\u043E\u0432\u0430\u043D\u043E": { en: "Funded", pl: "Zainwestowano" },
    "\u0417\u0456\u0431\u0440\u0430\u043D\u043E": { en: "Collected", pl: "Zebrano" },
    "\u041D\u0435 \u0432\u0438\u0441\u0442\u0430\u0447\u0430\u0454": { en: "Missing", pl: "Brakuje" },
    "\u0427\u0430\u0441\u0442\u043A\u0438 \u0437\u0430\u0440\u0430\u0437 {percent}%": {
      en: "Shares are {percent}%",
      pl: "Udzialy wynosza {percent}%"
    },
    "\u0423\u0447\u0430\u0441\u043D\u0438\u043A\u0438": { en: "Participants", pl: "Uczestnicy" },
    "\u0406\u043C\u02BC\u044F \u0443\u0447\u0430\u0441\u043D\u0438\u043A\u0430": { en: "Participant name", pl: "Imie uczestnika" },
    "\u0414\u043E\u0434\u0430\u0442\u0438 \u043B\u044E\u0434\u0438\u043D\u0443": { en: "Add person", pl: "Dodaj osobe" },
    "\u0412\u043D\u0456\u0441 {paid} \u0456\u0437 {target}": {
      en: "Paid {paid} of {target}",
      pl: "Wplacono {paid} z {target}"
    },
    "\u0427\u0430\u0441\u0442\u043A\u0430": { en: "Share", pl: "Udzial" },
    "\u0412\u043D\u0435\u0441\u043A\u0456\u0432 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454": { en: "No contributions yet", pl: "Brak wplat" },
    "\u0412\u043D\u0435\u0441\u043E\u043A": { en: "Contribution", pl: "Wplata" },
    "\u0406\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0443 {name}": { en: "To investor {name}", pl: "Inwestorowi {name}" },
    "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u0438 \u0432\u043D\u0435\u0441\u043E\u043A": { en: "Record contribution", pl: "Zapisz wplate" },
    "\u0406\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0438": { en: "Investors", pl: "Inwestorzy" },
    "\u041F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043E {amount}": { en: "{amount} returned", pl: "Zwrocono {amount}" },
    "\u0406\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0456\u0432 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454": { en: "No investors yet", pl: "Brak inwestorow" },
    "\u0406\u043C\u02BC\u044F \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0430": { en: "Investor name", pl: "Imie inwestora" },
    "\u0414\u043E\u0434\u0430\u0442\u0438 \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0430": { en: "Add investor", pl: "Dodaj inwestora" },
    "\u041F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u044C \u0449\u0435 \u043D\u0435\u043C\u0430\u0454": { en: "No repayments yet", pl: "Brak zwrotow" },
    "\u0414\u0430\u0432 {amount}": { en: "Funded {amount}", pl: "Dal {amount}" },
    "\u0417\u0430\u043B\u0438\u0448\u043E\u043A {amount}": { en: "{amount} left", pl: "Pozostalo {amount}" },
    "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u0438 \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043D\u044F": { en: "Record repayment", pl: "Zapisz zwrot" },
    "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F": { en: "Settings", pl: "Ustawienia" },
    "\u041C\u043E\u0432\u0430, \u0434\u0430\u043D\u0456 \u0456 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0430 \u043A\u043E\u043F\u0456\u044F": { en: "Language, data and backup", pl: "Jezyk, dane i kopia" },
    "\u0406\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441": { en: "Interface", pl: "Interfejs" },
    "\u041C\u043E\u0432\u0443 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043C\u043E \u0432 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445 \u0437\u0430\u0441\u0442\u043E\u0441\u0443\u043D\u043A\u0443": {
      en: "Language is saved in app settings",
      pl: "Jezyk zapiszemy w ustawieniach aplikacji"
    },
    "\u041C\u043E\u0432\u0430 \u0434\u043E\u0434\u0430\u0442\u043A\u0430": { en: "App language", pl: "Jezyk aplikacji" },
    "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430": { en: "Ukrainian", pl: "Ukrainski" },
    "\u0420\u0435\u0437\u0435\u0440\u0432\u043D\u0430 \u043A\u043E\u043F\u0456\u044F": { en: "Backup", pl: "Kopia zapasowa" },
    "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u043E, Telegram Storage \u0456 JSON backup": {
      en: "Local, Telegram Storage and JSON backup",
      pl: "Lokalnie, Telegram Storage i kopia JSON"
    },
    "\u0415\u043A\u0441\u043F\u043E\u0440\u0442": { en: "Export", pl: "Eksport" },
    "\u0406\u043C\u043F\u043E\u0440\u0442": { en: "Import", pl: "Import" },
    "\u041E\u0441\u043D\u043E\u0432\u043D\u0430 \u043D\u0430\u0432\u0456\u0433\u0430\u0446\u0456\u044F": { en: "Main navigation", pl: "Glowna nawigacja" },
    "\u0413\u043E\u043B\u043E\u0432\u043D\u0430": { en: "Home", pl: "Start" },
    "\u041C\u0435\u043D\u044E": { en: "Menu", pl: "Menu" },
    "\u0420\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043E\u043A": { en: "Settlement", pl: "Rozliczenie" },
    "\u0417\u0430\u043A\u0440\u0438\u0442\u0438": { en: "Close", pl: "Zamknij" },
    "\u0417\u0430\u043A\u0440\u0438\u0442\u0438 \u0431\u043E\u0440\u0433": { en: "Close debt", pl: "Zamknij dlug" },
    "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043E\u043A": { en: "Save settlement", pl: "Zapisz rozliczenie" },
    "\u0414\u043E\u0434\u0430\u0442\u0438 \u0449\u0435 \u0440\u0430\u0445\u0443\u043D\u043E\u043A": { en: "Add another account", pl: "Dodaj kolejne konto" },
    "\u0421\u043F\u0438\u0441\u0430\u0442\u0438 \u0437 \u0440\u0430\u0445\u0443\u043D\u043A\u0443": { en: "Pay from account", pl: "Zaplac z konta" },
    "\u0417\u0430\u0440\u0430\u0445\u0443\u0432\u0430\u0442\u0438 \u043D\u0430 \u0440\u0430\u0445\u0443\u043D\u043E\u043A": { en: "Receive to account", pl: "Przyjmij na konto" },
    "\u041F\u043E\u0437\u043D\u0430\u0447\u0438\u0442\u0438 \u0431\u043E\u0440\u0433 \u0437\u0430\u043A\u0440\u0438\u0442\u0438\u043C": { en: "Mark debt as closed", pl: "Oznacz dlug jako zamkniety" },
    "\u042F\u043A\u0449\u043E \u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E, \u0441\u0443\u043C\u0430 \u0431\u0443\u0434\u0435 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u0430, \u0430\u043B\u0435 \u0431\u043E\u0440\u0433 \u043B\u0438\u0448\u0438\u0442\u044C\u0441\u044F \u0432\u0456\u0434\u043A\u0440\u0438\u0442\u0438\u043C.": {
      en: "When off, the amount is saved but the debt stays open.",
      pl: "Gdy wylaczone, kwota zostanie zapisana, ale dlug pozostanie otwarty."
    },
    "\u041A\u043E\u043C\u0443 \u0432\u0438\u043D\u0435\u043D \u0456 \u0437\u0430 \u0449\u043E": { en: "Who you owe and why", pl: "Komu i za co jestes winien" },
    "\u0425\u0442\u043E \u0432\u0438\u043D\u0435\u043D \u0456 \u0437\u0430 \u0449\u043E": { en: "Who owes and why", pl: "Kto i za co jest winien" },
    "\u0406\u043C\u02BC\u044F, \u0447\u0435\u043A, \u0437\u0430 \u0449\u043E \u0442\u043E\u0431\u0456 \u0432\u0438\u043D\u043D\u0456": {
      en: "Name, receipt, what they owe for",
      pl: "Imie, paragon, za co ktos jest winien"
    },
    "\u0406\u043C\u02BC\u044F, \u0437\u0430 \u0449\u043E \u0442\u0438 \u0432\u0438\u043D\u0435\u043D": { en: "Name, what you owe for", pl: "Imie, za co jestes winien" },
    "\u0421\u043A\u0456\u043B\u044C\u043A\u0438 \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u043B\u0438": { en: "How much was returned", pl: "Ile zwrocono" },
    "\u0421\u043A\u0456\u043B\u044C\u043A\u0438 \u0432\u0456\u0434\u0434\u0430\u0432": { en: "How much you paid", pl: "Ile oddales" },
    "\u0425\u0442\u043E \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0432": { en: "Who returned it", pl: "Kto zwrocil" },
    "\u041A\u043E\u043C\u0443 \u0432\u0456\u0434\u0434\u0430\u0432": { en: "Who you paid", pl: "Komu oddales" },
    "\u0406\u043C\u02BC\u044F \u0430\u0431\u043E \u043D\u043E\u0442\u0430\u0442\u043A\u0430": { en: "Name or note", pl: "Imie albo notatka" },
    "\u0406\u0441\u0442\u043E\u0440\u0456\u044F \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043A\u0456\u0432": { en: "Settlement history", pl: "Historia rozliczen" },
    "\u041F\u043E\u0432\u0435\u0440\u043D\u0443\u0432": { en: "Returned", pl: "Zwrocono" },
    "\u0412\u0456\u0434\u0434\u0430\u0432": { en: "Paid", pl: "Oddano" },
    "\u042F\u043A\u0449\u043E \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u043B\u0438 \u043C\u0435\u043D\u0448\u0435 \u0437\u0430 \u0431\u043E\u0440\u0433, \u0440\u0456\u0437\u043D\u0438\u0446\u044F \u0441\u043F\u0438\u0448\u0435\u0442\u044C\u0441\u044F \u0437 \u0434\u0435\u043D\u043D\u043E\u0433\u043E \u043B\u0456\u043C\u0456\u0442\u0443 \u043D\u0430 \u0434\u0430\u0442\u0443 \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043A\u0443.": {
      en: "If less than the debt was returned, the difference is deducted from the daily limit on settlement date.",
      pl: "Jesli zwrocono mniej niz dlug, roznica trafi do limitu dziennego w dniu rozliczenia."
    },
    "\u041E\u0441\u043D\u043E\u0432\u043D\u0430 \u0441\u0443\u043C\u0430 \u0431\u043E\u0440\u0433\u0443 \u0434\u0435\u043D\u043D\u0438\u0439 \u043B\u0456\u043C\u0456\u0442 \u043D\u0435 \u0447\u0456\u043F\u0430\u0454. \u041F\u0435\u0440\u0435\u043F\u043B\u0430\u0442\u0430 \u043F\u043E\u043D\u0430\u0434 \u0431\u043E\u0440\u0433 \u0441\u043F\u0438\u0448\u0435\u0442\u044C\u0441\u044F \u0437 \u0434\u0435\u043D\u043D\u043E\u0433\u043E \u043B\u0456\u043C\u0456\u0442\u0443.": {
      en: "The principal debt does not affect the daily limit. Any overpayment is deducted from the daily limit.",
      pl: "Glowna kwota dlugu nie rusza limitu dziennego. Nadplata trafi do limitu dziennego."
    },
    "\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E": { en: "Account deleted", pl: "Konto usuniete" },
    "\u043B\u0456\u043C\u0456\u0442": { en: "limit", pl: "limit" },
    "\u043D\u0435 \u0432 \u0434\u0435\u043D\u043D\u043E\u043C\u0443 \u043B\u0456\u043C\u0456\u0442\u0456": { en: "not in daily limit", pl: "poza limitem dziennym" },
    "\u041E\u0431\u043C\u0456\u043D \u0432\u0430\u043B\u044E\u0442\u0438": { en: "Currency exchange", pl: "Wymiana waluty" },
    "\u0420\u043E\u0437\u0440\u0430\u0445\u0443\u0432\u0430\u043B\u0438\u0441\u044C": { en: "Settled", pl: "Rozliczono" },
    "\u0417\u0430\u043A\u0440\u0438\u0442\u043E": { en: "Closed", pl: "Zamkniete" },
    "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u043E": { en: "Open", pl: "Otwarte" },
    "\u0437\u0430\u043B\u0438\u0448\u043E\u043A": { en: "remaining", pl: "pozostalo" },
    "\u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043E\u043A": { en: "settlement", pl: "rozliczenie" },
    "\u0412\u0436\u0435 \u0440\u043E\u0437\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u043E": { en: "Already settled", pl: "Juz rozliczono" },
    "\u041B\u0456\u043C\u0456\u0442": { en: "Limit", pl: "Limit" },
    "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438": { en: "Delete", pl: "Usun" },
    "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u0440\u0430\u0445\u0443\u043D\u043E\u043A": { en: "Delete account", pl: "Usun konto" },
    "\u041E\u043F\u0435\u0440\u0430\u0446\u0456\u0439 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454": { en: "No transactions yet", pl: "Brak transakcji" },
    "\u0420\u0430\u0445\u0443\u043D\u043A\u0456\u0432 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454": { en: "No accounts yet", pl: "Brak kont" },
    "\u041F\u043E\u043A\u0438 \u043D\u0435\u043C\u0430\u0454 \u0440\u0430\u0445\u0443\u043D\u043A\u0456\u0432": { en: "No accounts yet", pl: "Brak kont" },
    "\u041D\u0430\u0442\u0438\u0441\u043D\u0438 \u201C\u0414\u043E\u0434\u0430\u0442\u0438 \u0440\u0430\u0445\u0443\u043D\u043E\u043A\u201D, \u0449\u043E\u0431 \u043F\u043E\u0447\u0430\u0442\u0438": {
      en: "Tap \u201CAdd account\u201D to start",
      pl: "Nacisnij \u201EDodaj konto\u201D, aby zaczac"
    },
    "\u0414\u043E\u0434\u0430\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0443 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445": {
      en: "Add an account in settings",
      pl: "Dodaj konto w ustawieniach"
    },
    "{accounts} \u0440\u0430\u0445. \xB7 {currencies} \u0432\u0430\u043B\u044E\u0442": {
      en: "{accounts} acc. \xB7 {currencies} currencies",
      pl: "{accounts} kont \xB7 {currencies} walut"
    },
    "\u0417\u0430 {period}: {amount}": { en: "{amount} for {period}", pl: "{amount} za {period}" },
    "\u0442\u0438\u0436\u0434\u0435\u043D\u044C": { en: "week", pl: "tydzien" },
    "\u043C\u0456\u0441\u044F\u0446\u044C": { en: "month", pl: "miesiac" },
    "\u043F\u0456\u0432 \u0440\u043E\u043A\u0443": { en: "half year", pl: "pol roku" },
    "\u041F\u0430\u043B\u044C\u043D\u0435: {fuelType}, {liters} \u043B": {
      en: "Fuel: {fuelType}, {liters} L",
      pl: "Paliwo: {fuelType}, {liters} l"
    },
    "\u041A\u0443\u0440\u0441 \u043D\u0435 \u043F\u043E\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u043E": { en: "Rate not calculated", pl: "Kurs nie obliczony" },
    "1 {toCurrency} = {rate} UAH": { en: "1 {toCurrency} = {rate} UAH", pl: "1 {toCurrency} = {rate} UAH" },
    "1 {fromCurrency} = {rate} UAH": { en: "1 {fromCurrency} = {rate} UAH", pl: "1 {fromCurrency} = {rate} UAH" },
    "1 {fromCurrency} = {rate} {toCurrency}": {
      en: "1 {fromCurrency} = {rate} {toCurrency}",
      pl: "1 {fromCurrency} = {rate} {toCurrency}"
    },
    "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0435 \u0441\u0445\u043E\u0432\u0438\u0449\u0435 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0435": { en: "Local storage is unavailable", pl: "Pamiec lokalna niedostepna" },
    "\u0421\u043F\u043E\u0447\u0430\u0442\u043A\u0443 \u0434\u043E\u0434\u0430\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A": { en: "Add an account first", pl: "Najpierw dodaj konto" },
    "\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F": { en: "Enter an amount greater than zero", pl: "Wpisz kwote wieksza od zera" },
    "\u0412\u043A\u0430\u0436\u0438 \u0437\u0432\u0456\u0434\u043A\u0438 \u043A\u043E\u0448\u0442\u0438": { en: "Enter where the money came from", pl: "Wpisz skad pochodza srodki" },
    "\u0412\u043A\u0430\u0436\u0438 \u0434\u0435\u0442\u0430\u043B\u0456": { en: "Enter details", pl: "Wpisz szczegoly" },
    "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E": { en: "Saved", pl: "Zapisano" },
    "\u041E\u0431\u0435\u0440\u0438 \u0440\u0430\u0445\u0443\u043D\u043A\u0438 \u0434\u043B\u044F \u043E\u0431\u043C\u0456\u043D\u0443": { en: "Choose accounts for exchange", pl: "Wybierz konta do wymiany" },
    "\u0420\u0430\u0445\u0443\u043D\u043A\u0438 \u043C\u0430\u044E\u0442\u044C \u0431\u0443\u0442\u0438 \u0440\u0456\u0437\u043D\u0456": { en: "Accounts must be different", pl: "Konta musza byc rozne" },
    "\u0412\u043A\u0430\u0436\u0438 \u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u0432\u0456\u0434\u0434\u0430\u0432 \u0456 \u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u043E\u0442\u0440\u0438\u043C\u0430\u0432": {
      en: "Enter how much you sent and received",
      pl: "Wpisz ile wydales i ile otrzymales"
    },
    "\u041E\u0431\u043C\u0456\u043D \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E": { en: "Exchange saved", pl: "Wymiana zapisana" },
    "\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u0431\u043E\u0440\u0433\u0443 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F": {
      en: "Enter debt amount greater than zero",
      pl: "Wpisz kwote dlugu wieksza od zera"
    },
    "\u0412\u043A\u0430\u0436\u0438 \u0445\u0442\u043E \u0456 \u0437\u0430 \u0449\u043E \u0432\u0438\u043D\u0435\u043D": { en: "Enter who owes and why", pl: "Wpisz kto i za co jest winien" },
    "\u0411\u043E\u0440\u0433 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E": { en: "Debt saved", pl: "Dlug zapisany" },
    "\u0426\u0435\u0439 \u0431\u043E\u0440\u0433 \u0432\u0436\u0435 \u0437\u0430\u043A\u0440\u0438\u0442\u043E": { en: "This debt is already closed", pl: "Ten dlug jest juz zamkniety" },
    "\u041E\u0431\u0435\u0440\u0438 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0434\u043B\u044F \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043A\u0443": { en: "Choose settlement account", pl: "Wybierz konto rozliczenia" },
    "\u0414\u043B\u044F \u0431\u043E\u0440\u0433\u0443 \u043E\u0431\u0435\u0440\u0438 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0443 \u0442\u0456\u0439 \u0441\u0430\u043C\u0456\u0439 \u0432\u0430\u043B\u044E\u0442\u0456": {
      en: "Choose an account in the same currency for this debt",
      pl: "Wybierz konto w tej samej walucie dla dlugu"
    },
    "\u0421\u0443\u043C\u0430 \u043C\u0430\u0454 \u0431\u0443\u0442\u0438 \u0447\u0438\u0441\u043B\u043E\u043C \u0432\u0456\u0434 \u043D\u0443\u043B\u044F": {
      en: "Amount must be a number from zero",
      pl: "Kwota musi byc liczba od zera"
    },
    "\u0412\u043A\u0430\u0436\u0438 \u0434\u0430\u0442\u0443 \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043A\u0443": { en: "Enter settlement date", pl: "Wpisz date rozliczenia" },
    "\u0411\u043E\u0440\u0433 \u0437\u0430\u043A\u0440\u0438\u0442\u043E": { en: "Debt closed", pl: "Dlug zamkniety" },
    "\u0420\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E": { en: "Settlement saved", pl: "Rozliczenie zapisane" },
    "\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u0430\u0431\u043E \u043F\u043E\u0437\u043D\u0430\u0447 \u0431\u043E\u0440\u0433 \u0437\u0430\u043A\u0440\u0438\u0442\u0438\u043C": {
      en: "Enter an amount or mark the debt as closed",
      pl: "Wpisz kwote albo oznacz dlug jako zamkniety"
    },
    "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E": { en: "Settings saved", pl: "Ustawienia zapisane" },
    "\u0412\u043A\u0430\u0436\u0438 \u043D\u0430\u0437\u0432\u0443 \u0440\u0430\u0445\u0443\u043D\u043A\u0443": { en: "Enter account name", pl: "Wpisz nazwe konta" },
    "\u0412\u043A\u0430\u0436\u0438 \u0432\u0430\u043B\u044E\u0442\u0443 \u0440\u0430\u0445\u0443\u043D\u043A\u0443": { en: "Enter account currency", pl: "Wpisz walute konta" },
    "\u0421\u0442\u0430\u0440\u0442\u043E\u0432\u0438\u0439 \u0431\u0430\u043B\u0430\u043D\u0441 \u043C\u0430\u0454 \u0431\u0443\u0442\u0438 \u0447\u0438\u0441\u043B\u043E\u043C": {
      en: "Starting balance must be a number",
      pl: "Saldo poczatkowe musi byc liczba"
    },
    "\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0434\u043E\u0434\u0430\u043D\u043E": { en: "Account added", pl: "Konto dodane" },
    "\u0412\u043A\u0430\u0436\u0438 \u043D\u0430\u0437\u0432\u0443 \u043F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u0457": {
      en: "Enter proposal title",
      pl: "Wpisz nazwe propozycji"
    },
    "\u0412\u043A\u0430\u0436\u0438 \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0443 \u0441\u0443\u043C\u0443 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F": {
      en: "Enter a required amount greater than zero",
      pl: "Wpisz potrzebna kwote wieksza od zera"
    },
    "\u0412\u043A\u0430\u0436\u0438 \u0432\u0430\u043B\u044E\u0442\u0443": { en: "Enter currency", pl: "Wpisz walute" },
    "\u0414\u043E\u0434\u0430\u0439 \u0445\u043E\u0447\u0430 \u0431 \u043E\u0434\u043D\u0443 \u043B\u044E\u0434\u0438\u043D\u0443": {
      en: "Add at least one person",
      pl: "Dodaj przynajmniej jedna osobe"
    },
    "\u041F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u044E \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043E": { en: "Proposal created", pl: "Propozycja utworzona" },
    "\u0427\u0430\u0441\u0442\u043A\u0443 \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043E": { en: "Share updated", pl: "Udzial zaktualizowany" },
    "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u0446\u044E \u043F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u044E?": {
      en: "Delete this proposal?",
      pl: "Usunac te propozycje?"
    },
    "\u041F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u044E \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E": { en: "Proposal deleted", pl: "Propozycja usunieta" },
    "\u0412\u043A\u0430\u0436\u0438 \u0456\u043C\u02BC\u044F \u0443\u0447\u0430\u0441\u043D\u0438\u043A\u0430": {
      en: "Enter participant name",
      pl: "Wpisz imie uczestnika"
    },
    "\u0423\u0447\u0430\u0441\u043D\u0438\u043A\u0430 \u0434\u043E\u0434\u0430\u043D\u043E": { en: "Participant added", pl: "Uczestnik dodany" },
    "\u0412\u043A\u0430\u0436\u0438 \u0456\u043C\u02BC\u044F \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0430": {
      en: "Enter investor name",
      pl: "Wpisz imie inwestora"
    },
    "\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0430 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F": {
      en: "Enter investor amount greater than zero",
      pl: "Wpisz kwote inwestora wieksza od zera"
    },
    "\u0406\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0430 \u0434\u043E\u0434\u0430\u043D\u043E": { en: "Investor added", pl: "Inwestor dodany" },
    "\u0412\u043A\u0430\u0436\u0438 \u0445\u0442\u043E \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0432 \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0443": {
      en: "Enter who repaid the investor",
      pl: "Wpisz kto zwrocil inwestorowi"
    },
    "\u041E\u0431\u0435\u0440\u0438 \u0445\u0442\u043E \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0432 \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0443": {
      en: "Choose who repaid the investor",
      pl: "Wybierz kto zwrocil inwestorowi"
    },
    "\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043D\u044F \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F": {
      en: "Enter repayment amount greater than zero",
      pl: "Wpisz kwote zwrotu wieksza od zera"
    },
    "\u0412\u043A\u0430\u0436\u0438 \u0434\u0430\u0442\u0443 \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043D\u044F": {
      en: "Enter repayment date",
      pl: "Wpisz date zwrotu"
    },
    "\u041F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043D\u044F \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043E": { en: "Repayment recorded", pl: "Zwrot zapisany" },
    "\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u0432\u043D\u0435\u0441\u043A\u0443 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F": {
      en: "Enter contribution amount greater than zero",
      pl: "Wpisz kwote wplaty wieksza od zera"
    },
    "\u0412\u043A\u0430\u0436\u0438 \u0434\u0430\u0442\u0443 \u0432\u043D\u0435\u0441\u043A\u0443": { en: "Enter contribution date", pl: "Wpisz date wplaty" },
    "\u0412\u043D\u0435\u0441\u043E\u043A \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043E": { en: "Contribution recorded", pl: "Wplata zapisana" },
    "\u0412\u043A\u0430\u0436\u0438 \u0434\u0430\u0442\u0443 \u0441\u0442\u0430\u0440\u0442\u0443": { en: "Enter start date", pl: "Wpisz date startu" },
    "\u0423 \u0441\u0443\u043C\u0430\u0445 \u043C\u0430\u044E\u0442\u044C \u0431\u0443\u0442\u0438 \u0442\u0456\u043B\u044C\u043A\u0438 \u0447\u0438\u0441\u043B\u0430": {
      en: "Amounts must contain numbers only",
      pl: "Kwoty musza zawierac tylko liczby"
    },
    "\u0411\u044E\u0434\u0436\u0435\u0442\u0438 \u043D\u0435 \u043C\u043E\u0436\u0443\u0442\u044C \u0431\u0443\u0442\u0438 \u043C\u0456\u043D\u0443\u0441\u043E\u0432\u0438\u043C\u0438": {
      en: "Budgets cannot be negative",
      pl: "Budzety nie moga byc ujemne"
    },
    "\u0421\u0442\u0430\u0440\u0442\u043E\u0432\u0456 \u0431\u0430\u043B\u0430\u043D\u0441\u0438 \u043C\u0430\u044E\u0442\u044C \u0431\u0443\u0442\u0438 \u0447\u0438\u0441\u043B\u0430\u043C\u0438": {
      en: "Starting balances must be numbers",
      pl: "Salda poczatkowe musza byc liczbami"
    },
    "\u0414\u043B\u044F \u0432\u0430\u043B\u044E\u0442\u043D\u043E\u0457 \u0432\u0438\u0442\u0440\u0430\u0442\u0438 \u0432\u043A\u0430\u0436\u0438 \u0435\u043A\u0432\u0456\u0432\u0430\u043B\u0435\u043D\u0442 \u0443 \u0433\u0440\u043D": {
      en: "For foreign-currency expense, enter UAH equivalent",
      pl: "Dla wydatku walutowego wpisz ekwiwalent w UAH"
    },
    "\u0412\u043A\u0430\u0436\u0438 \u0432\u0438\u0434 \u043F\u0430\u043B\u0438\u0432\u0430": { en: "Enter fuel type", pl: "Wpisz rodzaj paliwa" },
    "\u0412\u043A\u0430\u0436\u0438 \u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u043B\u0456\u0442\u0440\u0456\u0432 \u0437\u0430\u043B\u0438\u0442\u043E": { en: "Enter how many liters were filled", pl: "Wpisz ile litrow zatankowano" },
    "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0456\u0437\u0430\u0446\u0456\u044F...": { en: "Syncing...", pl: "Synchronizacja..." },
    "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u043E \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E": { en: "Saved locally", pl: "Zapisano lokalnie" },
    "Backup \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043E": { en: "Backup created", pl: "Kopia utworzona" },
    "\u0424\u0430\u0439\u043B backup \u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438": {
      en: "Could not read backup file",
      pl: "Nie udalo sie odczytac kopii"
    },
    "\u0417\u0430\u043C\u0456\u043D\u0438\u0442\u0438 \u043F\u043E\u0442\u043E\u0447\u043D\u0456 \u0434\u0430\u043D\u0456 \u0456\u043C\u043F\u043E\u0440\u0442\u043E\u043C?": {
      en: "Replace current data with import?",
      pl: "Zastapic obecne dane importem?"
    },
    "\u0406\u043C\u043F\u043E\u0440\u0442\u043E\u0432\u0430\u043D\u043E": { en: "Imported", pl: "Zaimportowano" },
    "\u0421\u043F\u043E\u0447\u0430\u0442\u043A\u0443 \u0434\u043E\u0434\u0430\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0434\u043B\u044F \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043A\u0443": {
      en: "Add an account for settlement first",
      pl: "Najpierw dodaj konto do rozliczenia"
    },
    "\u0427\u0435\u043A \u043C\u0430\u0454 \u0431\u0443\u0442\u0438 \u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u043D\u044F\u043C": { en: "Receipt must be an image", pl: "Paragon musi byc obrazem" },
    "\u0424\u043E\u0442\u043E \u0447\u0435\u043A\u0430 \u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438": {
      en: "Could not read receipt photo",
      pl: "Nie udalo sie odczytac zdjecia paragonu"
    },
    "\u041E\u0431\u0440\u0430\u043D\u043E: {name}": { en: "Selected: {name}", pl: "Wybrano: {name}" },
    "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u0446\u044E \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u044E?": { en: "Delete this transaction?", pl: "Usunac te transakcje?" },
    "\u041E\u043F\u0435\u0440\u0430\u0446\u0456\u044E \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E": { en: "Transaction deleted", pl: "Transakcja usunieta" },
    "\u0426\u0435\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0432\u0436\u0435 \u043C\u0430\u0454 \u0456\u0441\u0442\u043E\u0440\u0456\u044E, \u0439\u043E\u0433\u043E \u043D\u0435 \u043C\u043E\u0436\u043D\u0430 \u0432\u0438\u0434\u0430\u043B\u0438\u0442\u0438": {
      en: "This account already has history and cannot be deleted",
      pl: "To konto ma juz historie i nie mozna go usunac"
    },
    "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u0440\u0430\u0445\u0443\u043D\u043E\u043A?": { en: "Delete account?", pl: "Usunac konto?" },
    "\u042F \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u0432\u0430\u0432\u0441\u044F": { en: "I settled", pl: "Rozliczylem sie" },
    "\u0417\u0456 \u043C\u043D\u043E\u044E \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u0432\u0430\u043B\u0438\u0441\u044C": { en: "Settled with me", pl: "Rozliczono sie ze mna" }
  };
  var originalTextNodes = /* @__PURE__ */ new WeakMap();
  function normalizeLanguage(value) {
    const language = String(value || "uk").trim().toLowerCase();
    return SUPPORTED_LANGUAGES.includes(language) ? language : "uk";
  }
  function localeForLanguage(language) {
    const normalized = normalizeLanguage(language);
    if (normalized === "en") return "en-US";
    if (normalized === "pl") return "pl-PL";
    return "uk-UA";
  }
  function tText(language, text, values = {}) {
    const normalized = normalizeLanguage(language);
    const template = normalized === "uk" ? text : TRANSLATIONS[text]?.[normalized] || text;
    return template.replace(/\{(\w+)\}/g, (_match, key) => String(values[key] ?? ""));
  }
  function translateDocument(language, root = document) {
    translateTextNodes(language, root);
    translateAttributes(language, root);
  }
  function translateTextNodes(language, root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const trimmed = node.nodeValue?.trim();
      const original = originalTextNodes.get(node) || trimmed;
      if (!original || !TRANSLATIONS[original]) continue;
      const leading = node.nodeValue?.match(/^\s*/)?.[0] || "";
      const trailing = node.nodeValue?.match(/\s*$/)?.[0] || "";
      originalTextNodes.set(node, original);
      node.nodeValue = `${leading}${tText(language, original)}${trailing}`;
    }
  }
  function translateAttributes(language, root) {
    const elements = root.querySelectorAll("[placeholder], [aria-label], [title], option");
    for (const element of elements) {
      translateAttribute(language, element, "placeholder");
      translateAttribute(language, element, "aria-label");
      translateAttribute(language, element, "title");
      if (element.tagName === "OPTION") {
        const original = element.dataset.i18nOriginalText || element.textContent?.trim() || "";
        if (!original || !TRANSLATIONS[original]) continue;
        element.dataset.i18nOriginalText = original;
        element.textContent = tText(language, original);
      }
    }
  }
  function translateAttribute(language, element, attribute) {
    const value = element.getAttribute(attribute);
    if (!value) return;
    const dataKey = `i18nOriginal${attribute.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")}`;
    const dataset = element.dataset;
    const original = dataset[dataKey] || value;
    if (!TRANSLATIONS[original]) return;
    dataset[dataKey] = original;
    element.setAttribute(attribute, tText(language, original));
  }

  // src/utils/sanitize.ts
  function normalizeCurrency(value) {
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  }
  function normalizeFuelType(value) {
    return String(value || "\u041F\u0430\u043B\u044C\u043D\u0435").trim().slice(0, 40) || "\u041F\u0430\u043B\u044C\u043D\u0435";
  }
  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  // src/utils/format.ts
  function formatInputNumber(value) {
    const number = coerceNumber(value, 0);
    return Number.isInteger(number) ? String(number) : String(number).replace(".", ",");
  }
  function formatMoney(value, currency, language = "uk") {
    const normalizedCurrency = normalizeCurrency(currency) || BASE_CURRENCY;
    const locale = localeForLanguage(language);
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: normalizedCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value);
    } catch {
      return `${new Intl.NumberFormat(locale, {
        maximumFractionDigits: 2
      }).format(value)} ${normalizedCurrency}`;
    }
  }
  function formatSignedMoney(value, currency, language = "uk") {
    const sign = value > 0 ? "+" : "";
    return `${sign}${formatMoney(value, currency, language)}`;
  }
  function makeExchangeRateLabel(fromAmount, fromCurrency, toAmount, toCurrency, language = "uk") {
    if (!fromAmount || !toAmount) return tText(language, "\u041A\u0443\u0440\u0441 \u043D\u0435 \u043F\u043E\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u043E");
    if (fromCurrency === BASE_CURRENCY && toCurrency !== BASE_CURRENCY) {
      return tText(language, "1 {toCurrency} = {rate} UAH", {
        toCurrency,
        rate: formatPlainNumber(fromAmount / toAmount, language)
      });
    }
    if (toCurrency === BASE_CURRENCY && fromCurrency !== BASE_CURRENCY) {
      return tText(language, "1 {fromCurrency} = {rate} UAH", {
        fromCurrency,
        rate: formatPlainNumber(toAmount / fromAmount, language)
      });
    }
    return tText(language, "1 {fromCurrency} = {rate} {toCurrency}", {
      fromCurrency,
      toCurrency,
      rate: formatPlainNumber(toAmount / fromAmount, language)
    });
  }
  function formatPlainNumber(value, language = "uk") {
    return new Intl.NumberFormat(localeForLanguage(language), {
      maximumFractionDigits: 4
    }).format(value);
  }
  function formatFuelLiters(value, language = "uk") {
    return new Intl.NumberFormat(localeForLanguage(language), {
      maximumFractionDigits: 2
    }).format(value);
  }
  function makeFuelDetail(fuelType, liters, language = "uk") {
    return tText(language, "\u041F\u0430\u043B\u044C\u043D\u0435: {fuelType}, {liters} \u043B", {
      fuelType: normalizeFuelType(fuelType),
      liters: formatFuelLiters(liters, language)
    });
  }
  function chartRangeLabel(range, language = "uk") {
    if (range === 7) return tText(language, "\u0442\u0438\u0436\u0434\u0435\u043D\u044C");
    if (range === 30) return tText(language, "\u043C\u0456\u0441\u044F\u0446\u044C");
    return tText(language, "\u043F\u0456\u0432 \u0440\u043E\u043A\u0443");
  }
  function formatDateHuman(dateKey, language = "uk") {
    return new Intl.DateTimeFormat(localeForLanguage(language), {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(parseDateKey(dateKey));
  }
  function formatDateShort(dateKey, language = "uk") {
    return new Intl.DateTimeFormat(localeForLanguage(language), {
      day: "2-digit",
      month: "2-digit"
    }).format(parseDateKey(dateKey));
  }

  // src/state/defaultState.ts
  function createDefaultState() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      version: APP_VERSION,
      settings: {
        startDate: todayKey(),
        dailyAllowance: DEFAULT_DAILY_ALLOWANCE,
        dailyLimits: [{ fromDate: todayKey(), amount: DEFAULT_DAILY_ALLOWANCE }],
        subscriptionBudget: 0,
        dailyLimitEnabled: true,
        language: "uk"
      },
      accounts: [],
      entries: [],
      turnoverProjects: [],
      createdAt: now,
      updatedAt: now
    };
  }

  // src/state/normalize.ts
  function normalizeState(input) {
    const fallback = createDefaultState();
    const source = input && typeof input === "object" ? input : {};
    if (isEmptyLegacyState(source)) return fallback;
    const migration = normalizeAccounts(source.accounts, source.entries);
    const settings = {
      startDate: isDateKey(source.settings?.startDate) ? source.settings.startDate : fallback.settings.startDate,
      dailyAllowance: Math.max(
        0,
        coerceNumber(source.settings?.dailyAllowance, fallback.settings.dailyAllowance)
      ),
      subscriptionBudget: Math.max(
        0,
        coerceNumber(source.settings?.subscriptionBudget, fallback.settings.subscriptionBudget)
      ),
      dailyLimitEnabled: source.settings?.dailyLimitEnabled !== false,
      language: normalizeLanguage(source.settings?.language),
      dailyLimits: []
    };
    settings.dailyLimits = normalizeDailyLimits(
      source.settings?.dailyLimits,
      settings.startDate,
      settings.dailyAllowance
    );
    settings.dailyAllowance = getLatestDailyLimit(settings.dailyLimits, settings.dailyAllowance);
    const accounts = migration.accounts;
    const accountIds = new Set(accounts.map((account) => account.id));
    const entries = Array.isArray(source.entries) ? source.entries.map((entry) => normalizeEntry(entry, migration.legacyMap, accountIds, accounts)).filter((entry) => Boolean(entry)) : [];
    const turnoverProjects = Array.isArray(source.turnoverProjects) ? source.turnoverProjects.map((project) => normalizeTurnoverProject(project)).filter((project) => Boolean(project)) : [];
    return {
      ...fallback,
      ...source,
      version: APP_VERSION,
      settings,
      accounts,
      entries,
      turnoverProjects
    };
  }
  function normalizeAccounts(accountsInput, entriesInput) {
    const legacyMap = {};
    if (Array.isArray(accountsInput)) {
      const accounts2 = accountsInput.map((account) => normalizeAccount(account)).filter((account) => Boolean(account));
      return { accounts: dedupeAccounts(accounts2), legacyMap };
    }
    if (!accountsInput || typeof accountsInput !== "object") {
      return { accounts: [], legacyMap };
    }
    const referenced = new Set(
      Array.isArray(entriesInput) ? entriesInput.map((entry) => entry.account).filter(Boolean) : []
    );
    const accounts = Object.entries(accountsInput).map(([legacyKey, account]) => {
      const source = account;
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
        createdAt: source?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      };
    }).filter((account) => Boolean(account));
    return { accounts, legacyMap };
  }
  function normalizeAccount(account) {
    if (!account || typeof account !== "object") return null;
    const source = account;
    const name = String(source.name || source.label || "").trim();
    const currency = normalizeCurrency(source.currency || BASE_CURRENCY);
    if (!name || !currency) return null;
    return {
      id: String(source.id || makeId("acct")),
      name,
      kind: ACCOUNT_KIND_LABELS[source.kind] ? source.kind : "other",
      currency,
      initial: coerceNumber(source.initial, 0),
      createdAt: source.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function normalizeReceipt(receipt) {
    if (!receipt || typeof receipt !== "object" || !String(receipt.dataUrl || "").startsWith("data:image/")) {
      return null;
    }
    const source = receipt;
    return {
      name: String(source.name || "\u0424\u043E\u0442\u043E \u0447\u0435\u043A\u0430"),
      type: String(source.type || "image/jpeg"),
      dataUrl: String(source.dataUrl),
      createdAt: source.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function normalizeEntry(entry, legacyMap, accountIds, accounts) {
    if (!entry || typeof entry !== "object") return null;
    const source = entry;
    if (source.type === "debt") {
      const amount2 = Number(source.amount);
      const accountId2 = String(source.accountId || legacyMap[source.account] || source.account || "");
      const account2 = accounts.find((item) => item.id === accountId2);
      const debtDirection = source.debtDirection === "by_me" ? "by_me" : "to_me";
      const isClosed = source.status === "closed";
      if (!account2 || !Number.isFinite(amount2) || amount2 <= 0) return null;
      const normalized2 = {
        id: String(source.id || makeId("debt")),
        type: "debt",
        debtDirection,
        accountId: accountId2,
        amount: roundMoney(amount2),
        currency: normalizeCurrency(source.currency || account2.currency),
        budgetAmount: 0,
        detail: String(source.detail || "\u0411\u043E\u0440\u0433"),
        date: isDateKey(source.date) ? source.date : todayKey(),
        status: isClosed ? "closed" : "open",
        receipt: normalizeReceipt(source.receipt),
        createdAt: source.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      };
      const debtSettlements = normalizeDebtSettlements(source, accounts, normalized2);
      const totalSettlementAmount = debtSettlements.reduce(
        (total, settlement) => total + settlement.amount,
        0
      );
      if (debtSettlements.length) {
        normalized2.debtSettlements = debtSettlements;
        normalized2.settlementAmount = roundMoney(totalSettlementAmount);
        normalized2.settlementAccountId = debtSettlements[0].accountId;
        normalized2.settlementDate = debtSettlements[debtSettlements.length - 1].date;
      }
      if (isClosed) {
        normalized2.writeOffBudgetAmount = Math.max(
          0,
          coerceNumber(source.writeOffBudgetAmount, getDebtWriteOffAmount(normalized2))
        );
        normalized2.settledAt = source.settledAt || source.updatedAt || (/* @__PURE__ */ new Date()).toISOString();
      }
      return normalized2;
    }
    if (source.type === "exchange") {
      const fromAccountId = String(source.fromAccountId || "");
      const toAccountId = String(source.toAccountId || "");
      const fromAmount = Number(source.fromAmount);
      const toAmount = Number(source.toAmount);
      if (!accountIds.has(fromAccountId) || !accountIds.has(toAccountId) || !Number.isFinite(fromAmount) || !Number.isFinite(toAmount) || fromAmount <= 0 || toAmount <= 0) {
        return null;
      }
      const fromAccount = accounts.find((account2) => account2.id === fromAccountId);
      const toAccount = accounts.find((account2) => account2.id === toAccountId);
      return {
        id: String(source.id || makeId("exchange")),
        type: "exchange",
        fromAccountId,
        toAccountId,
        fromAmount: roundMoney(fromAmount),
        toAmount: roundMoney(toAmount),
        fromCurrency: normalizeCurrency(source.fromCurrency || fromAccount?.currency || BASE_CURRENCY),
        toCurrency: normalizeCurrency(source.toCurrency || toAccount?.currency || BASE_CURRENCY),
        detail: String(source.detail || "\u041E\u0431\u043C\u0456\u043D \u0432\u0430\u043B\u044E\u0442\u0438"),
        date: isDateKey(source.date) ? source.date : todayKey(),
        createdAt: source.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const amount = Number(source.amount);
    const type = TYPE_META[source.type] && source.type !== "exchange" ? source.type : "expense";
    const accountId = String(source.accountId || legacyMap[source.account] || source.account || "");
    const account = accounts.find((item) => item.id === accountId);
    if (!account || !Number.isFinite(amount) || amount <= 0) return null;
    const fallbackBudget = account.currency === BASE_CURRENCY && (type === "expense" || type === "subscription") ? amount : 0;
    const normalized = {
      id: String(source.id || makeId("entry")),
      type,
      accountId,
      amount: roundMoney(amount),
      currency: normalizeCurrency(source.currency || account.currency),
      budgetAmount: type === "fuel" ? 0 : Math.max(0, coerceNumber(source.budgetAmount, fallbackBudget)),
      detail: String(source.detail || "\u0411\u0435\u0437 \u043E\u043F\u0438\u0441\u0443"),
      date: isDateKey(source.date) ? source.date : todayKey(),
      createdAt: source.createdAt || (/* @__PURE__ */ new Date()).toISOString()
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
  function normalizeDebtSettlements(source, accounts, debt) {
    const settlements = Array.isArray(source.debtSettlements) ? source.debtSettlements.map((settlement) => normalizeDebtSettlement(settlement, accounts)).filter((settlement) => Boolean(settlement)) : [];
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
        note: String(source.settlementNote || "").trim() || void 0,
        createdAt: source.settledAt || source.updatedAt || debt.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
  }
  function normalizeDebtSettlement(settlement, accounts) {
    if (!settlement || typeof settlement !== "object") return null;
    const source = settlement;
    const accountId = String(source.accountId || "");
    const account = accounts.find((item) => item.id === accountId);
    const amount = Math.max(0, coerceNumber(source.amount, 0));
    const date = isDateKey(source.date) ? source.date : "";
    if (!account || !amount || !date) return null;
    return {
      accountId: account.id,
      amount: roundMoney(amount),
      date,
      note: String(source.note || source.name || "").trim() || void 0,
      createdAt: source.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function normalizeTurnoverProject(project) {
    if (!project || typeof project !== "object") return null;
    const source = project;
    const title = String(source.title || "").trim();
    const targetAmount = Math.max(0, coerceNumber(source.targetAmount, 0));
    const currency = normalizeCurrency(source.currency || BASE_CURRENCY);
    if (!title || !targetAmount || !currency) return null;
    const participants = Array.isArray(source.participants) ? source.participants.map((participant) => normalizeTurnoverParticipant(participant)).filter((participant) => Boolean(participant)) : [];
    const investors = Array.isArray(source.investors) ? source.investors.map((investor) => normalizeTurnoverInvestor(investor)).filter((investor) => Boolean(investor)) : [];
    return {
      id: String(source.id || makeId("turnover")),
      title,
      targetAmount: roundMoney(targetAmount),
      currency,
      participants,
      investors,
      createdAt: source.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: source.updatedAt || source.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function normalizeTurnoverParticipant(participant) {
    if (!participant || typeof participant !== "object") return null;
    const source = participant;
    const name = String(source.name || "").trim();
    if (!name) return null;
    const contributions = Array.isArray(source.contributions) ? source.contributions.map((contribution) => normalizeTurnoverContribution(contribution)).filter(
      (contribution) => Boolean(contribution)
    ) : [];
    return {
      id: String(source.id || makeId("person")),
      name,
      percent: Math.min(100, Math.max(0, coerceNumber(source.percent, 0))),
      contributions
    };
  }
  function normalizeTurnoverContribution(contribution) {
    if (!contribution || typeof contribution !== "object") return null;
    const source = contribution;
    const amount = Math.max(0, coerceNumber(source.amount, 0));
    const date = isDateKey(source.date) ? source.date : todayKey();
    if (!amount) return null;
    return {
      id: String(source.id || makeId("contribution")),
      amount: roundMoney(amount),
      date,
      createdAt: source.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function normalizeTurnoverInvestor(investor) {
    if (!investor || typeof investor !== "object") return null;
    const source = investor;
    const name = String(source.name || "").trim();
    const amount = Math.max(0, coerceNumber(source.amount, 0));
    if (!name || !amount) return null;
    const repayments = Array.isArray(source.repayments) ? source.repayments.map((repayment) => normalizeTurnoverRepayment(repayment)).filter((repayment) => Boolean(repayment)) : [];
    return {
      id: String(source.id || makeId("investor")),
      name,
      amount: roundMoney(amount),
      repayments,
      createdAt: source.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function normalizeTurnoverRepayment(repayment) {
    if (!repayment || typeof repayment !== "object") return null;
    const source = repayment;
    const participantId = String(source.participantId || "").trim();
    const fromName = String(source.fromName || source.name || "").trim();
    const amount = Math.max(0, coerceNumber(source.amount, 0));
    const date = isDateKey(source.date) ? source.date : todayKey();
    if (!fromName || !amount) return null;
    return {
      id: String(source.id || makeId("repay")),
      participantId: participantId || void 0,
      fromName,
      amount: roundMoney(amount),
      date,
      createdAt: source.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function isEmptyLegacyState(source) {
    if (!source || Number(source.version || 1) >= APP_VERSION) return false;
    const entries = Array.isArray(source.entries) ? source.entries : [];
    if (entries.length > 0) return false;
    if (Array.isArray(source.accounts)) return source.accounts.length === 0;
    if (!source.accounts || typeof source.accounts !== "object") return true;
    return Object.values(source.accounts).every(
      (account) => coerceNumber(account?.initial, 0) === 0
    );
  }
  function dedupeAccounts(accounts) {
    const seen = /* @__PURE__ */ new Set();
    return accounts.map((account) => {
      let id = account.id;
      while (seen.has(id)) id = makeId("acct");
      seen.add(id);
      return { ...account, id };
    });
  }

  // src/infrastructure/storage.ts
  function loadLocalState() {
    try {
      return parseState(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }
  async function loadDeviceState(storage) {
    if (!storage) return null;
    const raw = await storageGet(storage, DEVICE_KEY);
    return parseState(raw);
  }
  async function loadCloudState(storage) {
    if (!storage) return null;
    const meta = parseJson(await storageGet(storage, CLOUD_META_KEY));
    if (!meta?.chunks) return null;
    const keys = Array.from({ length: Number(meta.chunks) }, (_, index) => cloudChunkKey(index));
    const chunks = await Promise.all(keys.map((key) => storageGet(storage, key)));
    return parseState(chunks.join(""));
  }
  function saveLocalState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, serializeState(state));
      return true;
    } catch {
      return false;
    }
  }
  async function syncTelegramStores(state, targets) {
    const serialized = serializeState(state);
    const jobs = [];
    if (targets.deviceStorage) jobs.push(storageSet(targets.deviceStorage, DEVICE_KEY, serialized));
    if (targets.cloudStorage) jobs.push(saveCloudState(targets.cloudStorage, serialized, state.updatedAt));
    if (!jobs.length) return "local";
    const results = await Promise.allSettled(
      jobs.map((job) => withTimeout(job, SYNC_TIMEOUT_MS, false))
    );
    const hasSuccess = results.some((result) => result.status === "fulfilled" && result.value);
    return hasSuccess ? "synced" : "failed";
  }
  function parseJson(raw) {
    if (!raw || typeof raw !== "string") return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  function serializeState(state) {
    return JSON.stringify(state);
  }
  function parseState(raw) {
    const parsed = parseJson(raw);
    return parsed ? normalizeState(parsed) : null;
  }
  async function saveCloudState(storage, serialized, updatedAt) {
    const chunks = chunkText(serialized, CLOUD_CHUNK_SIZE);
    const oldMeta = parseJson(await storageGet(storage, CLOUD_META_KEY));
    const oldChunkCount = Number(oldMeta?.chunks || 0);
    const chunkResults = await Promise.all(
      chunks.map((chunk, index) => storageSet(storage, cloudChunkKey(index), chunk))
    );
    if (chunkResults.some((ok) => !ok)) return false;
    const staleKeys = [];
    for (let index = chunks.length; index < oldChunkCount; index += 1) {
      staleKeys.push(cloudChunkKey(index));
    }
    await Promise.all(staleKeys.map((key) => storageRemove(storage, key)));
    return storageSet(storage, CLOUD_META_KEY, JSON.stringify({ chunks: chunks.length, updatedAt }));
  }
  function storageGet(storage, key) {
    return new Promise((resolve) => {
      const finish = once(resolve);
      const timer = window.setTimeout(() => finish(""), STORAGE_TIMEOUT_MS);
      try {
        storage.getItem(key, (error, value) => {
          window.clearTimeout(timer);
          finish(error ? "" : value || "");
        });
      } catch {
        window.clearTimeout(timer);
        finish("");
      }
    });
  }
  function storageSet(storage, key, value) {
    return new Promise((resolve) => {
      const finish = once(resolve);
      const timer = window.setTimeout(() => finish(false), STORAGE_TIMEOUT_MS);
      try {
        storage.setItem(key, value, (error, ok) => {
          window.clearTimeout(timer);
          finish(!error && ok !== false);
        });
      } catch {
        window.clearTimeout(timer);
        finish(false);
      }
    });
  }
  function storageRemove(storage, key) {
    return new Promise((resolve) => {
      const finish = once(resolve);
      const timer = window.setTimeout(() => finish(false), STORAGE_TIMEOUT_MS);
      try {
        storage.removeItem(key, (error, ok) => {
          window.clearTimeout(timer);
          finish(!error && ok !== false);
        });
      } catch {
        window.clearTimeout(timer);
        finish(false);
      }
    });
  }
  function cloudChunkKey(index) {
    return `${CLOUD_PREFIX}_${index}`;
  }

  // src/infrastructure/telegram.ts
  function getTelegramContext() {
    const tg = window.Telegram?.WebApp || null;
    const isRuntime = Boolean(tg?.initData);
    return {
      tg,
      isRuntime,
      deviceStorage: isRuntime ? tg?.DeviceStorage || null : null,
      cloudStorage: isRuntime ? tg?.CloudStorage || null : null
    };
  }
  function initTelegramShell(context) {
    callTelegramMethod(context, "ready");
    callTelegramMethod(context, "expand");
    callTelegramMethod(context, "enableClosingConfirmation", "6.2");
    callTelegramMethod(context, "setHeaderColor", "6.1", "#eef4f8");
    callTelegramMethod(context, "setBackgroundColor", "6.1", "#eef4f8");
  }
  function notifyTelegramSuccess(context) {
    const { tg } = context;
    if (!canUseTelegramNestedMethod(context, tg?.HapticFeedback, "notificationOccurred", "6.1")) {
      return;
    }
    try {
      tg?.HapticFeedback?.notificationOccurred("success");
    } catch {
    }
  }
  function confirmAction(context, message) {
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
  function callTelegramMethod(context, methodName, minVersion, ...args) {
    const { tg } = context;
    if (!canUseTelegramMethod(context, methodName, minVersion)) return false;
    try {
      (tg?.[methodName])(...args);
      return true;
    } catch {
      return false;
    }
  }
  function canUseTelegramMethod(context, methodName, minVersion) {
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
  function canUseTelegramNestedMethod(context, target, methodName, minVersion) {
    const { tg } = context;
    if (!target || typeof target[methodName] !== "function") {
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

  // src/ui/dom.ts
  function queryRequired(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Missing required element: ${selector}`);
    return element;
  }
  function setProgress(element, spent, total) {
    const percent = total > 0 ? Math.min(spent / total * 100, 100) : 0;
    element.style.width = `${Math.max(percent, 0)}%`;
    element.classList.toggle("is-over", spent > total);
  }
  function restoreSelectValue(select, preferredValue, fallbackValue) {
    const values = [...select.options].map((option) => option.value);
    if (preferredValue && values.includes(preferredValue)) {
      select.value = preferredValue;
      return;
    }
    if (fallbackValue && values.includes(fallbackValue)) {
      select.value = fallbackValue;
    }
  }

  // src/ui/elements.ts
  function getAppElements() {
    return {
      syncStatus: queryRequired("#sync-status"),
      startLine: queryRequired("#start-line"),
      openSettings: queryRequired("#open-settings"),
      openSettingsSecondary: queryRequired("#open-settings-secondary"),
      tabButtons: document.querySelectorAll("[data-tab-target]"),
      tabPanels: document.querySelectorAll("[data-tab-panel]"),
      dailyRemaining: queryRequired("#daily-remaining"),
      dailyAccrued: queryRequired("#daily-accrued"),
      dailySpent: queryRequired("#daily-spent"),
      dailyRate: queryRequired("#daily-rate"),
      dailyTitle: queryRequired("#daily-title"),
      dailyProgress: queryRequired("#daily-progress"),
      daysCount: queryRequired("#days-count"),
      subsRemaining: queryRequired("#subs-remaining"),
      subsBudget: queryRequired("#subs-budget"),
      subsSpent: queryRequired("#subs-spent"),
      subsProgress: queryRequired("#subs-progress"),
      accountsSummary: queryRequired("#accounts-summary"),
      currencyStrip: queryRequired("#currency-strip"),
      accountsList: queryRequired("#accounts-list"),
      chartSummary: queryRequired("#chart-summary"),
      expenseChart: queryRequired("#expense-chart"),
      chartButtons: document.querySelectorAll("[data-chart-range]"),
      form: queryRequired("#entry-form"),
      normalFields: queryRequired("#normal-fields"),
      exchangeFields: queryRequired("#exchange-fields"),
      fuelOptions: queryRequired("#fuel-options"),
      fuelType: queryRequired("#fuel-type"),
      fuelLiters: queryRequired("#fuel-liters"),
      amount: queryRequired("#entry-amount"),
      amountLabel: queryRequired("#amount-label"),
      account: queryRequired("#entry-account"),
      entryBudgetAmount: queryRequired("#entry-budget-amount"),
      budgetEquivalentField: queryRequired("#budget-equivalent-field"),
      debtOptions: queryRequired("#debt-options"),
      debtReceiptField: queryRequired("#debt-receipt-field"),
      debtReceipt: queryRequired("#debt-receipt"),
      debtReceiptName: queryRequired("#debt-receipt-name"),
      date: queryRequired("#entry-date"),
      detail: queryRequired("#entry-detail"),
      detailLabel: queryRequired("#detail-label"),
      currencyBadge: queryRequired("#form-currency-badge"),
      formMessage: queryRequired("#form-message"),
      exchangeFromAccount: queryRequired("#exchange-from-account"),
      exchangeFromAmount: queryRequired("#exchange-from-amount"),
      exchangeToAccount: queryRequired("#exchange-to-account"),
      exchangeToAmount: queryRequired("#exchange-to-amount"),
      exchangeDate: queryRequired("#exchange-date"),
      exchangeDetail: queryRequired("#exchange-detail"),
      exchangeRatePreview: queryRequired("#exchange-rate-preview"),
      swapExchange: queryRequired("#swap-exchange"),
      settingsForm: queryRequired("#settings-form"),
      settingStartDate: queryRequired("#setting-start-date"),
      settingDaily: queryRequired("#setting-daily"),
      settingDailyEnabled: queryRequired("#setting-daily-enabled"),
      settingSubscriptions: queryRequired("#setting-subscriptions"),
      accountName: queryRequired("#account-name"),
      accountKind: queryRequired("#account-kind"),
      accountCurrency: queryRequired("#account-currency"),
      accountInitial: queryRequired("#account-initial"),
      addAccount: queryRequired("#add-account"),
      settingsAccountsList: queryRequired("#settings-accounts-list"),
      settingsMessage: queryRequired("#settings-message"),
      entriesList: queryRequired("#entries-list"),
      historyPagination: queryRequired("#history-pagination"),
      historyPrev: queryRequired("#history-prev"),
      historyNext: queryRequired("#history-next"),
      historyPageInfo: queryRequired("#history-page-info"),
      filterButtons: document.querySelectorAll("[data-filter]"),
      exportButton: queryRequired("#export-data"),
      importButton: queryRequired("#import-data"),
      importFile: queryRequired("#import-file"),
      analyticsTotal: queryRequired("#analytics-total"),
      analyticsExpenses: queryRequired("#analytics-expenses"),
      analyticsSubscriptions: queryRequired("#analytics-subscriptions"),
      analyticsFuel: queryRequired("#analytics-fuel"),
      turnoverForm: queryRequired("#turnover-form"),
      turnoverTitle: queryRequired("#turnover-title"),
      turnoverTarget: queryRequired("#turnover-target"),
      turnoverCurrency: queryRequired("#turnover-currency"),
      turnoverPeople: queryRequired("#turnover-people"),
      turnoverMessage: queryRequired("#turnover-message"),
      turnoverList: queryRequired("#turnover-list"),
      preferencesForm: queryRequired("#preferences-form"),
      appLanguage: queryRequired("#app-language"),
      preferencesMessage: queryRequired("#preferences-message"),
      debtModal: queryRequired("#debt-modal"),
      closeDebtModal: queryRequired("#close-debt-modal"),
      debtModalTitle: queryRequired("#debt-modal-title"),
      debtModalSummary: queryRequired("#debt-modal-summary"),
      debtSettlementHistory: queryRequired("#debt-settlement-history"),
      debtSettlementForm: queryRequired("#debt-settlement-form"),
      debtSettlementRows: queryRequired("#debt-settlement-rows"),
      debtSettlementAmountLabel: queryRequired("#debt-settlement-amount-label"),
      debtSettlementAccountLabel: queryRequired("#debt-settlement-account-label"),
      debtSettlementAmount: queryRequired("#debt-settlement-amount"),
      debtSettlementAccount: queryRequired("#debt-settlement-account"),
      addDebtSettlementRow: queryRequired("#add-debt-settlement-row"),
      debtCloseToggle: queryRequired("#debt-close-toggle"),
      debtSettlementDate: queryRequired("#debt-settlement-date"),
      debtSettlementNote: queryRequired("#debt-settlement-note"),
      debtSettlementMessage: queryRequired("#debt-settlement-message")
    };
  }

  // src/ui/templates.ts
  function renderEntry(state, entry) {
    const language = state.settings.language || "uk";
    if (entry.type === "exchange") return renderExchangeEntry(state, entry);
    if (entry.type === "debt") return renderDebtEntry(state, entry);
    if (entry.type === "fuel") return renderFuelEntry(state, entry);
    const account = findAccount(state, entry.accountId);
    const meta = TYPE_META[entry.type] || TYPE_META.expense;
    const signedAmount = meta.sign * Number(entry.amount || 0);
    const amountClass = signedAmount >= 0 ? "is-positive" : "is-negative";
    const accountLabel = account?.name || tText(language, "\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E");
    const currency = entry.currency || account?.currency || BASE_CURRENCY;
    const budgetNote = entry.type !== "income" && currency !== BASE_CURRENCY ? ` \xB7 ${tText(language, "\u043B\u0456\u043C\u0456\u0442")} ${formatMoney(getEntryBudgetAmount(state, entry), BASE_CURRENCY, language)}` : "";
    return `
    <article class="entry-item is-${entry.type}">
      <span class="entry-mark" aria-hidden="true"></span>
      <div class="entry-main">
        <strong>${escapeHtml(entry.detail)}</strong>
        <span>${tText(language, meta.label)} \xB7 ${formatDateHuman(entry.date, language)} \xB7 ${escapeHtml(
      accountLabel
    )}${budgetNote}</span>
      </div>
      <div class="entry-amount ${amountClass}">
        ${formatSignedMoney(signedAmount, currency, language)}
      </div>
      <button class="entry-delete" type="button" data-delete-id="${escapeHtml(
      entry.id
    )}" aria-label="${escapeAttribute(tText(language, "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438"))}">\xD7</button>
    </article>
  `;
  }
  function renderFuelEntry(state, entry) {
    const language = state.settings.language || "uk";
    const account = findAccount(state, entry.accountId);
    const currency = entry.currency || account?.currency || BASE_CURRENCY;
    const amount = Number(entry.amount || 0);
    const liters = Math.max(0, coerceNumber(entry.fuelLiters, 0));
    const fuelType = normalizeFuelType(entry.fuelType);
    const pricePerLiter = liters > 0 ? `<span class="fuel-chip">${formatMoney(amount / liters, currency, language)}/L</span>` : "";
    return `
    <article class="entry-item is-fuel">
      <span class="entry-mark" aria-hidden="true"></span>
      <div class="entry-main">
        <strong>${escapeHtml(entry.detail || makeFuelDetail(fuelType, liters, language))}</strong>
        <span>${tText(language, "\u041F\u0430\u043B\u044C\u043D\u0435")} \xB7 ${formatDateHuman(entry.date, language)} \xB7 ${escapeHtml(
      account?.name || tText(language, "\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E")
    )}</span>
      </div>
      <div class="entry-amount is-negative">
        ${formatSignedMoney(-amount, currency, language)}
      </div>
      <button class="entry-delete" type="button" data-delete-id="${escapeHtml(
      entry.id
    )}" aria-label="${escapeAttribute(tText(language, "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438"))}">\xD7</button>
      <div class="fuel-extra">
        <span class="fuel-chip">
          <svg class="ui-icon" aria-hidden="true"><use href="#icon-fuel"></use></svg>
          ${escapeHtml(fuelType)}
        </span>
        <span class="fuel-chip">
          <svg class="ui-icon" aria-hidden="true"><use href="#icon-droplet"></use></svg>
          ${formatFuelLiters(liters, language)} L
        </span>
        ${pricePerLiter}
        <span class="fuel-chip fuel-chip--budget">${tText(language, "\u043D\u0435 \u0432 \u0434\u0435\u043D\u043D\u043E\u043C\u0443 \u043B\u0456\u043C\u0456\u0442\u0456")}</span>
      </div>
    </article>
  `;
  }
  function renderExchangeEntry(state, entry) {
    const language = state.settings.language || "uk";
    const fromAccount = findAccount(state, entry.fromAccountId);
    const toAccount = findAccount(state, entry.toAccountId);
    const fromCurrency = entry.fromCurrency || fromAccount?.currency || BASE_CURRENCY;
    const toCurrency = entry.toCurrency || toAccount?.currency || BASE_CURRENCY;
    const rateLabel = makeExchangeRateLabel(
      Number(entry.fromAmount || 0),
      fromCurrency,
      Number(entry.toAmount || 0),
      toCurrency,
      language
    );
    return `
    <article class="entry-item is-exchange">
      <span class="entry-mark" aria-hidden="true"></span>
      <div class="entry-main">
        <strong>${escapeHtml(entry.detail || tText(language, "\u041E\u0431\u043C\u0456\u043D \u0432\u0430\u043B\u044E\u0442\u0438"))}</strong>
        <span>${formatDateHuman(entry.date, language)} \xB7 ${escapeHtml(
      fromAccount?.name || tText(language, "\u0420\u0430\u0445\u0443\u043D\u043E\u043A")
    )} \u2192 ${escapeHtml(toAccount?.name || tText(language, "\u0420\u0430\u0445\u0443\u043D\u043E\u043A"))} \xB7 ${rateLabel}</span>
      </div>
      <div class="entry-amount entry-amount--exchange">
        <span>-${formatMoney(Number(entry.fromAmount || 0), fromCurrency, language)}</span>
        <span>+${formatMoney(Number(entry.toAmount || 0), toCurrency, language)}</span>
      </div>
      <button class="entry-delete" type="button" data-delete-id="${escapeHtml(
      entry.id
    )}" aria-label="${escapeAttribute(tText(language, "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438"))}">\xD7</button>
    </article>
  `;
  }
  function renderDebtEntry(state, entry) {
    const language = state.settings.language || "uk";
    const account = findAccount(state, entry.accountId);
    const directionMeta = DEBT_DIRECTION_META[entry.debtDirection || "to_me"] || DEBT_DIRECTION_META.to_me;
    const closed = isDebtClosed(entry);
    const settlementAmount = getDebtSettlementTotal(entry);
    const writeOffAmount = getDebtWriteOffAmount(entry);
    const remainingAmount = getDebtRemainingAmount(entry);
    const cardAmount = entry.debtDirection === "by_me" && settlementAmount > 0 ? settlementAmount : closed && entry.debtDirection === "to_me" ? writeOffAmount : remainingAmount;
    const signedAmount = cardAmount > 0 ? -cardAmount : 0;
    const amountClass = signedAmount < 0 && (entry.debtDirection === "to_me" || settlementAmount > 0) ? "is-negative" : "is-neutral";
    const currency = entry.currency || account?.currency || BASE_CURRENCY;
    const settlementAccounts = getDebtSettlements(entry).map((settlement) => findAccount(state, settlement.accountId)?.name).filter((name) => Boolean(name));
    const settlementAccountLabel = [...new Set(settlementAccounts)].join(", ");
    const statusText = closed ? `${tText(language, "\u0417\u0430\u043A\u0440\u0438\u0442\u043E")} \xB7 ${formatDateHuman(entry.settlementDate || entry.date, language)}` : `${tText(language, "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u043E")} \xB7 ${tText(language, "\u0437\u0430\u043B\u0438\u0448\u043E\u043A")} ${formatMoney(
      remainingAmount,
      currency,
      language
    )}`;
    const settlementText = settlementAmount ? ` \xB7 ${tText(language, "\u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043E\u043A")} ${formatMoney(settlementAmount, currency, language)}${settlementAccountLabel ? ` \xB7 ${escapeHtml(settlementAccountLabel)}` : ""}` : "";
    const writeOffText = writeOffAmount ? `<span class="debt-status is-writeoff">${tText(language, "\u041B\u0456\u043C\u0456\u0442")}: -${formatMoney(
      writeOffAmount,
      BASE_CURRENCY,
      language
    )}</span>` : "";
    const receipt = renderReceiptPreview(entry.receipt, language);
    const action = !closed ? `<button class="secondary-button debt-settle-button" type="button" data-settle-debt="${escapeHtml(
      entry.id
    )}">${tText(language, "\u0420\u043E\u0437\u0440\u0430\u0445\u0443\u0432\u0430\u043B\u0438\u0441\u044C")}</button>` : `<span class="debt-status is-closed">${tText(language, "\u0417\u0430\u043A\u0440\u0438\u0442\u043E")}</span>`;
    return `
    <article class="entry-item is-debt ${closed ? "is-closed" : "is-open"}" data-debt-id="${escapeHtml(entry.id)}">
      <span class="entry-mark" aria-hidden="true"></span>
      <div class="entry-main">
        <strong>${escapeHtml(entry.detail)}</strong>
        <span>${tText(language, directionMeta.label)} \xB7 ${formatDateHuman(entry.date, language)} \xB7 ${escapeHtml(
      account?.name || tText(language, "\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E")
    )}${settlementText}</span>
      </div>
      <div class="entry-amount ${amountClass}">
        ${formatSignedMoney(signedAmount, currency, language)}
      </div>
      <button class="entry-delete" type="button" data-delete-id="${escapeHtml(
      entry.id
    )}" aria-label="${escapeAttribute(tText(language, "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438"))}">\xD7</button>
      <div class="debt-extra">
        <span class="debt-status">${statusText}</span>
        ${writeOffText}
        ${receipt}
        ${action}
      </div>
    </article>
  `;
  }
  function renderAccountOption(account) {
    return `<option value="${escapeHtml(account.id)}">${escapeHtml(account.name)} \xB7 ${escapeHtml(
      account.currency
    )}</option>`;
  }
  function renderReceiptPreview(receipt, language = "uk") {
    if (!receipt?.dataUrl) return "";
    const name = receipt.name || tText(language, "\u0424\u043E\u0442\u043E \u0447\u0435\u043A\u0430");
    return `
    <a class="debt-receipt" href="${escapeAttribute(receipt.dataUrl)}" target="_blank" rel="noreferrer" aria-label="${escapeAttribute(
      name
    )}">
      <img src="${escapeAttribute(receipt.dataUrl)}" alt="${escapeAttribute(name)}" />
    </a>
  `;
  }
  function renderCurrencyPill(currency, amount, language = "uk") {
    return `
    <article class="currency-pill">
      <span>${escapeHtml(currency)}</span>
      <strong>${formatMoney(amount, currency, language)}</strong>
    </article>
  `;
  }
  function renderAccountCard(account, balance, language = "uk") {
    return `
    <article class="account-card">
      <div>
        <span>${escapeHtml(tText(language, ACCOUNT_KIND_LABELS[account.kind] || ACCOUNT_KIND_LABELS.other))}</span>
        <strong>${escapeHtml(account.name)}</strong>
      </div>
      <div>
        <b>${formatMoney(balance, account.currency, language)}</b>
        <small>${tText(language, "\u0421\u0442\u0430\u0440\u0442")}: ${formatMoney(account.initial, account.currency, language)}</small>
      </div>
    </article>
  `;
  }
  function renderSettingsAccountRow(account, language = "uk") {
    return `
    <article class="settings-account-row">
      <div>
        <strong>${escapeHtml(account.name)}</strong>
        <span>${escapeHtml(tText(language, ACCOUNT_KIND_LABELS[account.kind] || ACCOUNT_KIND_LABELS.other))} \xB7 ${escapeHtml(
      account.currency
    )}</span>
      </div>
      <label class="field">
        <span>${tText(language, "\u0421\u0442\u0430\u0440\u0442")}</span>
        <input data-account-initial="${escapeHtml(account.id)}" type="text" inputmode="decimal" value="${escapeHtml(
      formatInputNumber(account.initial)
    )}" />
      </label>
      <button class="entry-delete" type="button" data-delete-account="${escapeHtml(
      account.id
    )}" aria-label="${escapeAttribute(tText(language, "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u0440\u0430\u0445\u0443\u043D\u043E\u043A"))}">\xD7</button>
    </article>
  `;
  }

  // src/main.ts
  var HISTORY_PAGE_SIZE = 10;
  var NationalDebtApp = class {
    constructor() {
      this.state = createDefaultState();
      this.activeFilter = "all";
      this.activeTab = "home";
      this.activeChartRange = 7;
      this.activeDebtId = "";
      this.historyPage = 1;
      this.syncTimer = 0;
      this.els = getAppElements();
      this.telegram = getTelegramContext();
    }
    get language() {
      return normalizeLanguage(this.state.settings.language);
    }
    tr(text, values = {}) {
      return tText(this.language, text, values);
    }
    boot() {
      initTelegramShell(this.telegram);
      this.bindEvents();
      this.els.date.value = todayKey();
      this.els.exchangeDate.value = todayKey();
      this.els.debtSettlementDate.value = todayKey();
      this.els.turnoverCurrency.value = BASE_CURRENCY;
      this.render();
      void this.loadPersistedState();
    }
    bindEvents() {
      this.els.openSettings.addEventListener("click", () => this.switchTab("accounts"));
      this.els.openSettingsSecondary.addEventListener("click", () => {
        this.switchTab("accounts");
        window.setTimeout(() => this.els.accountName.focus(), 40);
      });
      this.els.closeDebtModal.addEventListener("click", () => this.closeDebtModal());
      this.els.addDebtSettlementRow.addEventListener("click", () => this.addDebtSettlementRow());
      this.els.debtModal.addEventListener("click", (event) => {
        if (event.target === this.els.debtModal) this.closeDebtModal();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !this.els.debtModal.hidden) this.closeDebtModal();
      });
      this.els.tabButtons.forEach((button) => {
        button.addEventListener(
          "click",
          () => this.switchTab(button.dataset.tabTarget || "home")
        );
      });
      this.els.form.addEventListener("submit", (event) => void this.handleSubmit(event));
      this.els.debtSettlementForm.addEventListener(
        "submit",
        (event) => this.handleDebtSettlementSubmit(event)
      );
      this.els.settingsForm.addEventListener("submit", (event) => this.handleSettingsSubmit(event));
      this.els.turnoverForm.addEventListener("submit", (event) => this.handleTurnoverSubmit(event));
      this.els.preferencesForm.addEventListener(
        "submit",
        (event) => this.handlePreferencesSubmit(event)
      );
      this.els.appLanguage.addEventListener("change", () => {
        this.state.settings.language = normalizeLanguage(this.els.appLanguage.value);
        this.render();
      });
      this.els.addAccount.addEventListener("click", () => this.handleAddAccount());
      this.els.settingDailyEnabled.addEventListener("change", () => this.renderDailyLimitToggle());
      this.els.account.addEventListener("change", () => this.renderFormHints());
      this.els.debtReceipt.addEventListener("change", () => this.renderDebtReceiptName());
      this.els.exchangeFromAccount.addEventListener("change", () => this.renderExchangePreview());
      this.els.exchangeToAccount.addEventListener("change", () => this.renderExchangePreview());
      this.els.exchangeFromAmount.addEventListener("input", () => this.renderExchangePreview());
      this.els.exchangeToAmount.addEventListener("input", () => this.renderExchangePreview());
      this.els.swapExchange.addEventListener("click", () => this.swapExchangeDirection());
      document.querySelectorAll('input[name="entry-type"]').forEach((input) => {
        input.addEventListener("change", () => this.renderFormHints());
      });
      document.querySelectorAll('input[name="debt-direction"]').forEach((input) => {
        input.addEventListener("change", () => this.renderFormHints());
      });
      this.els.filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
          this.activeFilter = button.dataset.filter || "all";
          this.historyPage = 1;
          this.els.filterButtons.forEach((item) => item.classList.remove("is-active"));
          button.classList.add("is-active");
          this.renderEntries();
        });
      });
      this.els.historyPrev.addEventListener("click", () => {
        this.historyPage = Math.max(1, this.historyPage - 1);
        this.renderEntries();
      });
      this.els.historyNext.addEventListener("click", () => {
        this.historyPage += 1;
        this.renderEntries();
      });
      this.els.chartButtons.forEach((button) => {
        button.addEventListener("click", () => {
          this.activeChartRange = Number(button.dataset.chartRange || 7);
          this.els.chartButtons.forEach((item) => item.classList.remove("is-active"));
          button.classList.add("is-active");
          this.renderChart();
          this.renderAnalyticsSummary();
        });
      });
      this.els.entriesList.addEventListener("click", (event) => void this.handleEntriesClick(event));
      this.els.settingsAccountsList.addEventListener(
        "click",
        (event) => void this.handleSettingsAccountsClick(event)
      );
      this.els.turnoverList.addEventListener(
        "change",
        (event) => this.handleTurnoverListChange(event)
      );
      this.els.turnoverList.addEventListener(
        "click",
        (event) => void this.handleTurnoverListClick(event)
      );
      this.els.exportButton.addEventListener("click", () => this.exportState());
      this.els.importButton.addEventListener("click", () => this.els.importFile.click());
      this.els.importFile.addEventListener("change", (event) => void this.importState(event));
    }
    switchTab(tab) {
      this.activeTab = tab;
      this.els.tabPanels.forEach((panel) => {
        const isActive = panel.dataset.tabPanel === tab;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
      });
      this.els.tabButtons.forEach((button) => {
        const isActive = button.dataset.tabTarget === tab;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    async loadPersistedState() {
      this.setSyncStatus("\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F...", "warn");
      const localState = loadLocalState();
      const [deviceState, cloudState] = await Promise.all([
        loadDeviceState(this.telegram.deviceStorage),
        loadCloudState(this.telegram.cloudStorage)
      ]);
      const bestState = [localState, deviceState, cloudState].filter((item) => Boolean(item)).sort((a, b) => dateValue(b.updatedAt) - dateValue(a.updatedAt))[0];
      this.state = normalizeState(bestState || createDefaultState());
      if (!saveLocalState(this.state)) this.setSyncStatus("\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0435 \u0441\u0445\u043E\u0432\u0438\u0449\u0435 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0435", "warn");
      this.render();
      this.scheduleTelegramSync(20);
    }
    async handleSubmit(event) {
      event.preventDefault();
      const type = this.getSelectedType();
      if (type === "exchange") {
        this.handleExchangeSubmit();
        return;
      }
      if (type === "debt") {
        await this.handleDebtSubmit();
        return;
      }
      const account = this.getAccount(this.els.account.value);
      const amount = parseAmount(this.els.amount.value);
      const detail = this.els.detail.value.trim();
      const date = this.els.date.value || todayKey();
      let fuelData = null;
      if (!account) {
        this.showFormMessage("\u0421\u043F\u043E\u0447\u0430\u0442\u043A\u0443 \u0434\u043E\u0434\u0430\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A", true);
        return;
      }
      if (!amount || amount <= 0) {
        this.showFormMessage("\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F", true);
        return;
      }
      if (!detail && type !== "fuel") {
        this.showFormMessage(type === "income" ? "\u0412\u043A\u0430\u0436\u0438 \u0437\u0432\u0456\u0434\u043A\u0438 \u043A\u043E\u0448\u0442\u0438" : "\u0412\u043A\u0430\u0436\u0438 \u0434\u0435\u0442\u0430\u043B\u0456", true);
        return;
      }
      if (type === "fuel") {
        fuelData = this.readFuelFields();
        if (!fuelData) return;
      }
      const budgetAmount = this.getBudgetAmountFromForm(type, account, amount);
      if (budgetAmount === null) return;
      const entryDetail = type === "fuel" && !detail ? makeFuelDetail(fuelData?.fuelType, fuelData?.fuelLiters || 0, this.language) : detail;
      this.state.entries.push({
        id: makeId("entry"),
        type,
        accountId: account.id,
        amount,
        currency: account.currency,
        budgetAmount,
        detail: entryDetail,
        ...fuelData || {},
        date,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.els.amount.value = "";
      this.els.entryBudgetAmount.value = "";
      this.els.detail.value = "";
      if (type === "fuel") {
        this.els.fuelType.value = "";
        this.els.fuelLiters.value = "";
      }
      this.els.date.value = todayKey();
      this.historyPage = 1;
      this.commitState("\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E");
    }
    handleExchangeSubmit() {
      const fromAccount = this.getAccount(this.els.exchangeFromAccount.value);
      const toAccount = this.getAccount(this.els.exchangeToAccount.value);
      const fromAmount = parseAmount(this.els.exchangeFromAmount.value);
      const toAmount = parseAmount(this.els.exchangeToAmount.value);
      const date = this.els.exchangeDate.value || todayKey();
      const detail = this.els.exchangeDetail.value.trim();
      if (!fromAccount || !toAccount) {
        this.showFormMessage("\u041E\u0431\u0435\u0440\u0438 \u0440\u0430\u0445\u0443\u043D\u043A\u0438 \u0434\u043B\u044F \u043E\u0431\u043C\u0456\u043D\u0443", true);
        return;
      }
      if (fromAccount.id === toAccount.id) {
        this.showFormMessage("\u0420\u0430\u0445\u0443\u043D\u043A\u0438 \u043C\u0430\u044E\u0442\u044C \u0431\u0443\u0442\u0438 \u0440\u0456\u0437\u043D\u0456", true);
        return;
      }
      if (!fromAmount || !toAmount || fromAmount <= 0 || toAmount <= 0) {
        this.showFormMessage("\u0412\u043A\u0430\u0436\u0438 \u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u0432\u0456\u0434\u0434\u0430\u0432 \u0456 \u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u043E\u0442\u0440\u0438\u043C\u0430\u0432", true);
        return;
      }
      this.state.entries.push({
        id: makeId("exchange"),
        type: "exchange",
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        fromAmount,
        toAmount,
        fromCurrency: fromAccount.currency,
        toCurrency: toAccount.currency,
        detail: detail || `\u041E\u0431\u043C\u0456\u043D ${fromAccount.name} \u2192 ${toAccount.name}`,
        date,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.els.exchangeFromAmount.value = "";
      this.els.exchangeToAmount.value = "";
      this.els.exchangeDetail.value = "";
      this.els.exchangeDate.value = todayKey();
      this.renderExchangePreview();
      this.historyPage = 1;
      this.commitState("\u041E\u0431\u043C\u0456\u043D \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E");
    }
    async handleDebtSubmit() {
      const account = this.getAccount(this.els.account.value);
      const amount = parseAmount(this.els.amount.value);
      const detail = this.els.detail.value.trim();
      const date = this.els.date.value || todayKey();
      const debtDirection = this.getSelectedDebtDirection();
      if (!account) {
        this.showFormMessage("\u0421\u043F\u043E\u0447\u0430\u0442\u043A\u0443 \u0434\u043E\u0434\u0430\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A", true);
        return;
      }
      if (!amount || amount <= 0) {
        this.showFormMessage("\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u0431\u043E\u0440\u0433\u0443 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F", true);
        return;
      }
      if (!detail) {
        this.showFormMessage("\u0412\u043A\u0430\u0436\u0438 \u0445\u0442\u043E \u0456 \u0437\u0430 \u0449\u043E \u0432\u0438\u043D\u0435\u043D", true);
        return;
      }
      const receipt = await this.readDebtReceipt();
      if (receipt === false) return;
      this.state.entries.push({
        id: makeId("debt"),
        type: "debt",
        debtDirection,
        accountId: account.id,
        amount,
        currency: account.currency,
        budgetAmount: 0,
        detail,
        date,
        status: "open",
        receipt,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.els.amount.value = "";
      this.els.entryBudgetAmount.value = "";
      this.els.detail.value = "";
      this.els.debtReceipt.value = "";
      this.renderDebtReceiptName();
      this.els.date.value = todayKey();
      this.historyPage = 1;
      this.commitState("\u0411\u043E\u0440\u0433 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E");
    }
    handleDebtSettlementSubmit(event) {
      event.preventDefault();
      const debt = this.getDebtEntry(this.activeDebtId);
      const settlementDate = this.els.debtSettlementDate.value || todayKey();
      const shouldClose = this.els.debtCloseToggle.checked;
      if (!debt || isDebtClosed(debt)) {
        this.showDebtSettlementMessage("\u0426\u0435\u0439 \u0431\u043E\u0440\u0433 \u0432\u0436\u0435 \u0437\u0430\u043A\u0440\u0438\u0442\u043E", true);
        return;
      }
      if (!isDateKey(settlementDate)) {
        this.showDebtSettlementMessage("\u0412\u043A\u0430\u0436\u0438 \u0434\u0430\u0442\u0443 \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043A\u0443", true);
        return;
      }
      const settlements = this.readDebtSettlementRows(debt);
      if (!settlements) return;
      if (!settlements.length && !shouldClose) {
        this.showDebtSettlementMessage("\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u0430\u0431\u043E \u043F\u043E\u0437\u043D\u0430\u0447 \u0431\u043E\u0440\u0433 \u0437\u0430\u043A\u0440\u0438\u0442\u0438\u043C", true);
        return;
      }
      const createdAt = (/* @__PURE__ */ new Date()).toISOString();
      debt.debtSettlements = [
        ...getDebtSettlements(debt),
        ...settlements.map((settlement) => ({
          ...settlement,
          date: settlementDate,
          createdAt
        }))
      ];
      debt.settlementAmount = getDebtSettlementTotal(debt);
      debt.settlementAccountId = debt.debtSettlements[0]?.accountId;
      debt.settlementDate = settlementDate;
      debt.status = shouldClose ? "closed" : "open";
      debt.writeOffBudgetAmount = shouldClose ? getDebtWriteOffAmount(debt) : 0;
      debt.settledAt = shouldClose ? createdAt : void 0;
      debt.updatedAt = createdAt;
      this.closeDebtModal();
      this.commitState(shouldClose ? "\u0411\u043E\u0440\u0433 \u0437\u0430\u043A\u0440\u0438\u0442\u043E" : "\u0420\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E");
    }
    handleSettingsSubmit(event) {
      event.preventDefault();
      const settings = this.readSettingsFields();
      if (!settings) return;
      const initials = this.readAccountInitialInputs();
      if (!initials) return;
      this.applySettings(settings);
      this.state.accounts = this.state.accounts.map((account) => ({
        ...account,
        initial: initials[account.id] ?? account.initial
      }));
      this.commitState("\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E", "settings");
    }
    handlePreferencesSubmit(event) {
      event.preventDefault();
      this.state.settings.language = normalizeLanguage(this.els.appLanguage.value);
      this.commitState("\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E", "preferences");
    }
    handleTurnoverSubmit(event) {
      event.preventDefault();
      const title = this.els.turnoverTitle.value.trim();
      const targetAmount = parseSettingAmount(this.els.turnoverTarget.value);
      const currency = normalizeCurrency(this.els.turnoverCurrency.value || BASE_CURRENCY);
      const names = this.parseNameList(this.els.turnoverPeople.value);
      if (!title) {
        this.showTurnoverMessage("\u0412\u043A\u0430\u0436\u0438 \u043D\u0430\u0437\u0432\u0443 \u043F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u0457", true);
        return;
      }
      if (!targetAmount || targetAmount <= 0) {
        this.showTurnoverMessage("\u0412\u043A\u0430\u0436\u0438 \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0443 \u0441\u0443\u043C\u0443 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F", true);
        return;
      }
      if (!currency) {
        this.showTurnoverMessage("\u0412\u043A\u0430\u0436\u0438 \u0432\u0430\u043B\u044E\u0442\u0443", true);
        return;
      }
      if (!names.length) {
        this.showTurnoverMessage("\u0414\u043E\u0434\u0430\u0439 \u0445\u043E\u0447\u0430 \u0431 \u043E\u0434\u043D\u0443 \u043B\u044E\u0434\u0438\u043D\u0443", true);
        return;
      }
      this.state.turnoverProjects.unshift({
        id: makeId("turnover"),
        title,
        targetAmount: roundMoney(targetAmount),
        currency,
        participants: this.makeTurnoverParticipants(names),
        investors: [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.els.turnoverTitle.value = "";
      this.els.turnoverTarget.value = "";
      this.els.turnoverCurrency.value = BASE_CURRENCY;
      this.els.turnoverPeople.value = "";
      this.commitState("\u041F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u044E \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043E", "turnover");
    }
    handleAddAccount() {
      const settings = this.readSettingsFields();
      if (!settings) return;
      const initials = this.readAccountInitialInputs();
      if (!initials) return;
      const name = this.els.accountName.value.trim();
      const kind = this.els.accountKind.value;
      const currency = normalizeCurrency(this.els.accountCurrency.value || BASE_CURRENCY);
      const initial = parseSettingAmount(this.els.accountInitial.value);
      if (!name) {
        this.showSettingsMessage("\u0412\u043A\u0430\u0436\u0438 \u043D\u0430\u0437\u0432\u0443 \u0440\u0430\u0445\u0443\u043D\u043A\u0443", true);
        return;
      }
      if (!currency) {
        this.showSettingsMessage("\u0412\u043A\u0430\u0436\u0438 \u0432\u0430\u043B\u044E\u0442\u0443 \u0440\u0430\u0445\u0443\u043D\u043A\u0443", true);
        return;
      }
      if (initial === null) {
        this.showSettingsMessage("\u0421\u0442\u0430\u0440\u0442\u043E\u0432\u0438\u0439 \u0431\u0430\u043B\u0430\u043D\u0441 \u043C\u0430\u0454 \u0431\u0443\u0442\u0438 \u0447\u0438\u0441\u043B\u043E\u043C", true);
        return;
      }
      this.applySettings(settings);
      this.state.accounts = this.state.accounts.map((account) => ({
        ...account,
        initial: initials[account.id] ?? account.initial
      }));
      this.state.accounts.push({
        id: makeId("acct"),
        name,
        kind: ACCOUNT_KIND_LABELS[kind] ? kind : "other",
        currency,
        initial,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.els.accountName.value = "";
      this.els.accountCurrency.value = BASE_CURRENCY;
      this.els.accountInitial.value = "";
      this.commitState("\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0434\u043E\u0434\u0430\u043D\u043E", "settings");
    }
    readSettingsFields() {
      const startDate = this.els.settingStartDate.value || todayKey();
      const dailyAllowance = parseSettingAmount(this.els.settingDaily.value);
      const subscriptionBudget = parseSettingAmount(this.els.settingSubscriptions.value);
      const dailyLimitEnabled = this.els.settingDailyEnabled.checked;
      if (!isDateKey(startDate)) {
        this.showSettingsMessage("\u0412\u043A\u0430\u0436\u0438 \u0434\u0430\u0442\u0443 \u0441\u0442\u0430\u0440\u0442\u0443", true);
        return null;
      }
      if (dailyAllowance === null || subscriptionBudget === null) {
        this.showSettingsMessage("\u0423 \u0441\u0443\u043C\u0430\u0445 \u043C\u0430\u044E\u0442\u044C \u0431\u0443\u0442\u0438 \u0442\u0456\u043B\u044C\u043A\u0438 \u0447\u0438\u0441\u043B\u0430", true);
        return null;
      }
      if (dailyAllowance < 0 || subscriptionBudget < 0) {
        this.showSettingsMessage("\u0411\u044E\u0434\u0436\u0435\u0442\u0438 \u043D\u0435 \u043C\u043E\u0436\u0443\u0442\u044C \u0431\u0443\u0442\u0438 \u043C\u0456\u043D\u0443\u0441\u043E\u0432\u0438\u043C\u0438", true);
        return null;
      }
      return { startDate, dailyAllowance, subscriptionBudget, dailyLimitEnabled };
    }
    readAccountInitialInputs() {
      const values = {};
      const inputs = this.els.settingsAccountsList.querySelectorAll(
        "[data-account-initial]"
      );
      for (const input of inputs) {
        const value = parseSettingAmount(input.value);
        if (value === null) {
          this.showSettingsMessage("\u0421\u0442\u0430\u0440\u0442\u043E\u0432\u0456 \u0431\u0430\u043B\u0430\u043D\u0441\u0438 \u043C\u0430\u044E\u0442\u044C \u0431\u0443\u0442\u0438 \u0447\u0438\u0441\u043B\u0430\u043C\u0438", true);
          return null;
        }
        values[input.dataset.accountInitial || ""] = value;
      }
      return values;
    }
    applySettings(settings) {
      const previousDailyLimit = getDailyLimitForDate(this.state.settings, todayKey());
      this.state.settings.startDate = settings.startDate;
      this.state.settings.subscriptionBudget = settings.subscriptionBudget;
      this.state.settings.dailyLimitEnabled = settings.dailyLimitEnabled;
      this.state.settings.dailyLimits = normalizeDailyLimits(
        this.state.settings.dailyLimits,
        this.state.settings.startDate,
        previousDailyLimit
      );
      this.setDailyLimitForDate(this.getDailyLimitChangeDate(), settings.dailyAllowance);
    }
    render() {
      this.renderHeader();
      this.renderAccountSelectors();
      this.renderBalances();
      this.renderBudgets();
      this.renderChart();
      this.renderFormHints();
      this.renderSettingsForm();
      this.renderPreferencesForm();
      this.renderAnalyticsSummary();
      this.renderTurnover();
      this.renderEntries();
      this.translateUi();
    }
    renderHeader() {
      this.els.startLine.textContent = `${this.tr("\u0421\u0442\u0430\u0440\u0442")}: ${formatDateHuman(
        this.state.settings.startDate,
        this.language
      )}`;
    }
    renderAccountSelectors() {
      const options = this.state.accounts.length ? this.state.accounts.map(renderAccountOption).join("") : `<option value="">${this.tr("\u0414\u043E\u0434\u0430\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0443 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445")}</option>`;
      const currentAccount = this.els.account.value;
      const currentFrom = this.els.exchangeFromAccount.value;
      const currentTo = this.els.exchangeToAccount.value;
      const currentSettlementAccount = this.els.debtSettlementAccount.value;
      this.els.account.innerHTML = options;
      this.els.exchangeFromAccount.innerHTML = options;
      this.els.exchangeToAccount.innerHTML = options;
      this.els.debtSettlementAccount.innerHTML = options;
      restoreSelectValue(this.els.account, currentAccount);
      restoreSelectValue(this.els.exchangeFromAccount, currentFrom);
      restoreSelectValue(this.els.exchangeToAccount, currentTo, this.state.accounts[1]?.id);
      restoreSelectValue(this.els.debtSettlementAccount, currentSettlementAccount);
    }
    renderBalances() {
      const balances = calculateBalances(this.state);
      const totals = getCurrencyTotals(this.state, balances);
      const currencyCount = totals.length;
      this.els.accountsSummary.textContent = this.state.accounts.length ? this.tr("{accounts} \u0440\u0430\u0445. \xB7 {currencies} \u0432\u0430\u043B\u044E\u0442", {
        accounts: this.state.accounts.length,
        currencies: currencyCount
      }) : this.tr("\u0414\u043E\u0434\u0430\u0439 \u043A\u0430\u0440\u0442\u043A\u0438, \u0433\u043E\u0442\u0456\u0432\u043A\u0443 \u0430\u0431\u043E \u0432\u0430\u043B\u044E\u0442\u043D\u0456 \u0440\u0430\u0445\u0443\u043D\u043A\u0438");
      this.els.currencyStrip.innerHTML = totals.length ? totals.map(([currency, amount]) => renderCurrencyPill(currency, amount, this.language)).join("") : `<div class="empty-state">${this.tr("\u041F\u043E\u043A\u0438 \u043D\u0435\u043C\u0430\u0454 \u0440\u0430\u0445\u0443\u043D\u043A\u0456\u0432")}</div>`;
      this.els.accountsList.innerHTML = this.state.accounts.length ? this.state.accounts.map((account) => renderAccountCard(account, balances[account.id] || 0, this.language)).join("") : `<div class="empty-state">${this.tr("\u041D\u0430\u0442\u0438\u0441\u043D\u0438 \u201C\u0414\u043E\u0434\u0430\u0442\u0438 \u0440\u0430\u0445\u0443\u043D\u043E\u043A\u201D, \u0449\u043E\u0431 \u043F\u043E\u0447\u0430\u0442\u0438")}</div>`;
    }
    renderBudgets() {
      const days = elapsedBudgetDays(this.state.settings);
      const todayLimit = getDailyLimitForDate(this.state.settings, todayKey());
      const dailyAccrued = calculateDailyAccruedBudget(this.state.settings);
      const dailySpent = sumEntries(
        this.state,
        (entry) => {
          if (entry.type === "debt") {
            return getDebtBudgetEvents(entry).some(
              (event) => isInBudgetPeriodByDate(this.state.settings, event.date)
            );
          }
          return isInBudgetPeriodByDate(this.state.settings, getDailyBudgetDate(entry)) && getDailyBudgetAmount(this.state, entry) > 0;
        },
        (entry) => {
          if (entry.type === "debt") {
            return getDebtBudgetEvents(entry).filter((event) => isInBudgetPeriodByDate(this.state.settings, event.date)).reduce((total, event) => total + event.amount, 0);
          }
          return getDailyBudgetAmount(this.state, entry);
        }
      );
      const subsSpent = sumEntries(
        this.state,
        (entry) => entry.type === "subscription" && this.isInCurrentMonth(entry.date),
        (entry) => getEntryBudgetAmount(this.state, entry)
      );
      const dailyRemaining = dailyAccrued - dailySpent;
      const subsRemaining = this.state.settings.subscriptionBudget - subsSpent;
      const dailyLimitEnabled = this.state.settings.dailyLimitEnabled;
      this.els.daysCount.textContent = dailyLimitEnabled ? days > 0 ? this.tr("\u0414\u0435\u043D\u044C {count}", { count: days }) : this.tr("\u0414\u043E \u0441\u0442\u0430\u0440\u0442\u0443") : this.tr("\u0411\u0435\u0437 \u043B\u0456\u043C\u0456\u0442\u0443");
      this.els.dailyTitle.textContent = dailyLimitEnabled ? this.tr("\u0417\u0430\u0433\u0430\u043B\u044C\u043D\u0438\u0439 \u0434\u0435\u043D\u043D\u0438\u0439 \u043B\u0456\u043C\u0456\u0442") : this.tr("\u0414\u0435\u043D\u043D\u0438\u0439 \u043B\u0456\u043C\u0456\u0442 \u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E");
      this.els.dailyRemaining.textContent = dailyLimitEnabled ? formatMoney(dailyRemaining, BASE_CURRENCY, this.language) : this.tr("\u0411\u0435\u0437 \u043B\u0456\u043C\u0456\u0442\u0443");
      this.els.dailyAccrued.textContent = dailyLimitEnabled ? formatMoney(dailyAccrued, BASE_CURRENCY, this.language) : this.tr("\u0412\u0438\u043C\u043A\u043D\u0435\u043D\u043E");
      this.els.dailySpent.textContent = formatMoney(dailySpent, BASE_CURRENCY, this.language);
      this.els.dailyRate.textContent = dailyLimitEnabled ? formatMoney(todayLimit, BASE_CURRENCY, this.language) : this.tr("\u0412\u0438\u043C\u043A\u043D\u0435\u043D\u043E");
      this.els.subsRemaining.textContent = formatMoney(subsRemaining, BASE_CURRENCY, this.language);
      this.els.subsBudget.textContent = formatMoney(
        this.state.settings.subscriptionBudget,
        BASE_CURRENCY,
        this.language
      );
      this.els.subsSpent.textContent = formatMoney(subsSpent, BASE_CURRENCY, this.language);
      setProgress(
        this.els.dailyProgress,
        dailyLimitEnabled ? dailySpent : 0,
        dailyLimitEnabled ? Math.max(dailyAccrued, todayLimit) : 0
      );
      setProgress(this.els.subsProgress, subsSpent, this.state.settings.subscriptionBudget);
    }
    renderChart() {
      const series = buildExpenseSeries(this.state, this.activeChartRange);
      const total = series.reduce((sum, item) => sum + item.amount, 0);
      const rawMax = Math.max(...series.map((item) => item.amount), 0);
      const max = rawMax || 1;
      const width = 720;
      const height = 260;
      const left = 26;
      const right = 20;
      const top = 26;
      const bottom = 34;
      const graphWidth = width - left - right;
      const graphHeight = height - top - bottom;
      const points = series.map((item, index) => {
        const x = left + (series.length === 1 ? 0 : index / (series.length - 1) * graphWidth);
        const y = top + graphHeight - item.amount / max * graphHeight;
        return { ...item, x, y };
      });
      const line = points.map((point) => `${point.x},${point.y}`).join(" ");
      const area = `${left},${top + graphHeight} ${line} ${left + graphWidth},${top + graphHeight}`;
      const bars = points.map((point) => {
        const barHeight = Math.max(2, top + graphHeight - point.y);
        const barWidth = Math.max(2, Math.min(16, graphWidth / series.length - 2));
        return `<rect x="${point.x - barWidth / 2}" y="${point.y}" width="${barWidth}" height="${barHeight}" rx="3"></rect>`;
      }).join("");
      const first = series[0]?.date || todayKey();
      const last = series[series.length - 1]?.date || todayKey();
      this.els.chartSummary.textContent = this.tr("\u0417\u0430 {period}: {amount}", {
        period: chartRangeLabel(this.activeChartRange, this.language),
        amount: formatMoney(total, BASE_CURRENCY, this.language)
      });
      this.els.expenseChart.innerHTML = `
      <defs>
        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f766e" stop-opacity="0.28"></stop>
          <stop offset="100%" stop-color="#0f766e" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
      <line class="chart-grid-line" x1="${left}" y1="${top + graphHeight}" x2="${left + graphWidth}" y2="${top + graphHeight}"></line>
      <polygon class="chart-area" points="${area}"></polygon>
      <g class="chart-bars">${bars}</g>
      <polyline class="chart-line" points="${line}"></polyline>
      <text class="chart-label" x="${left}" y="${height - 8}">${formatDateShort(
        first,
        this.language
      )}</text>
      <text class="chart-label chart-label--end" x="${left + graphWidth}" y="${height - 8}">${formatDateShort(last, this.language)}</text>
      <text class="chart-value" x="${left}" y="18">${formatMoney(
        rawMax,
        BASE_CURRENCY,
        this.language
      )}</text>
    `;
    }
    renderFormHints() {
      const type = this.getSelectedType();
      const account = this.getAccount(this.els.account.value);
      const isExchange = type === "exchange";
      const isDebt = type === "debt";
      const isFuel = type === "fuel";
      const meta = TYPE_META[type] || TYPE_META.expense;
      const debtMeta = DEBT_DIRECTION_META[this.getSelectedDebtDirection()] || DEBT_DIRECTION_META.to_me;
      this.els.normalFields.hidden = isExchange;
      this.els.exchangeFields.hidden = !isExchange;
      this.els.debtOptions.hidden = !isDebt;
      this.els.debtReceiptField.hidden = !isDebt;
      this.els.fuelOptions.hidden = !isFuel;
      this.els.amountLabel.textContent = isFuel ? this.tr("\u0417\u0430\u043F\u043B\u0430\u0442\u0438\u0432") : this.tr("\u0421\u0443\u043C\u0430");
      if (isExchange) {
        this.els.currencyBadge.textContent = this.tr("\u041E\u0431\u043C\u0456\u043D");
        this.renderExchangePreview();
        return;
      }
      this.els.detailLabel.textContent = this.tr(
        isDebt ? debtMeta.detailLabel : meta.detailLabel || ""
      );
      this.els.detail.placeholder = this.tr(isDebt ? debtMeta.placeholder : meta.placeholder || "");
      this.els.currencyBadge.textContent = isDebt ? this.tr("\u0411\u043E\u0440\u0433") : isFuel ? this.tr("\u041F\u0430\u043B\u044C\u043D\u0435") : account?.currency || BASE_CURRENCY;
      const needsBudgetEquivalent = account && account.currency !== BASE_CURRENCY && (type === "expense" || type === "subscription");
      this.els.budgetEquivalentField.hidden = !needsBudgetEquivalent;
    }
    renderSettingsForm() {
      this.els.settingStartDate.value = this.state.settings.startDate;
      this.els.settingDaily.value = formatInputNumber(
        getDailyLimitForDate(this.state.settings, todayKey())
      );
      this.els.settingDailyEnabled.checked = this.state.settings.dailyLimitEnabled;
      this.els.settingSubscriptions.value = formatInputNumber(this.state.settings.subscriptionBudget);
      this.renderDailyLimitToggle();
      this.els.settingsAccountsList.innerHTML = this.state.accounts.length ? this.state.accounts.map((account) => renderSettingsAccountRow(account, this.language)).join("") : `<div class="empty-state">${this.tr("\u0420\u0430\u0445\u0443\u043D\u043A\u0456\u0432 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454")}</div>`;
    }
    renderPreferencesForm() {
      this.els.appLanguage.value = this.language;
    }
    renderDailyLimitToggle() {
      this.els.settingDaily.disabled = !this.els.settingDailyEnabled.checked;
    }
    renderAnalyticsSummary() {
      const series = buildExpenseSeries(this.state, this.activeChartRange);
      const startDate = series[0]?.date || todayKey();
      const endDate = series[series.length - 1]?.date || todayKey();
      const inRange = (entry) => entry.date >= startDate && entry.date <= endDate;
      const total = series.reduce((sum, item) => sum + item.amount, 0);
      const expenses = sumEntries(
        this.state,
        (entry) => entry.type === "expense" && inRange(entry),
        (entry) => getEntryBudgetAmount(this.state, entry)
      );
      const subscriptions = sumEntries(
        this.state,
        (entry) => entry.type === "subscription" && inRange(entry),
        (entry) => getEntryBudgetAmount(this.state, entry)
      );
      const fuel = sumEntries(
        this.state,
        (entry) => entry.type === "fuel" && inRange(entry),
        (entry) => {
          const account = this.getAccount(entry.accountId);
          const currency = entry.currency || account?.currency || BASE_CURRENCY;
          return currency === BASE_CURRENCY ? Number(entry.amount || 0) : 0;
        }
      );
      this.els.analyticsTotal.textContent = formatMoney(total, BASE_CURRENCY, this.language);
      this.els.analyticsExpenses.textContent = formatMoney(expenses, BASE_CURRENCY, this.language);
      this.els.analyticsSubscriptions.textContent = formatMoney(
        subscriptions,
        BASE_CURRENCY,
        this.language
      );
      this.els.analyticsFuel.textContent = formatMoney(fuel, BASE_CURRENCY, this.language);
    }
    renderTurnover() {
      const projects = this.state.turnoverProjects || [];
      if (!projects.length) {
        this.els.turnoverList.innerHTML = `<div class="empty-state">${this.tr(
          "\u041F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u0439 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454"
        )}</div>`;
        return;
      }
      this.els.turnoverList.innerHTML = projects.map((project) => this.renderTurnoverProject(project)).join("");
    }
    renderTurnoverProject(project) {
      const participantPercent = project.participants.reduce(
        (total, participant) => total + Number(participant.percent || 0),
        0
      );
      const investorTotal = project.investors.reduce(
        (total, investor) => total + Number(investor.amount || 0),
        0
      );
      const directContributionTotal = project.participants.reduce(
        (total, participant) => total + this.getTurnoverParticipantDirectContributed(participant),
        0
      );
      const investorReturned = project.investors.reduce(
        (total, investor) => total + this.getTurnoverInvestorReturned(investor),
        0
      );
      const fundedTotal = roundMoney(investorTotal + directContributionTotal);
      const progress = project.targetAmount > 0 ? Math.min(fundedTotal / project.targetAmount * 100, 100) : 0;
      const missing = Math.max(0, project.targetAmount - fundedTotal);
      const percentWarning = Math.round(participantPercent) === 100 ? "" : `<span class="turnover-warning">${this.tr("\u0427\u0430\u0441\u0442\u043A\u0438 \u0437\u0430\u0440\u0430\u0437 {percent}%", {
        percent: Math.round(participantPercent)
      })}</span>`;
      return `
      <article class="turnover-card" data-turnover-project="${escapeAttribute(project.id)}">
        <div class="turnover-card-head">
          <div>
            <span class="panel-kicker">${formatDateHuman(project.createdAt.slice(0, 10), this.language)}</span>
            <h3>${escapeHtml(project.title)}</h3>
          </div>
          <button class="entry-delete" type="button" data-delete-turnover-project aria-label="${escapeAttribute(
        this.tr("\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438")
      )}">\xD7</button>
        </div>

        <div class="turnover-metrics">
          <div>
            <span>${this.tr("\u041F\u043E\u0442\u0440\u0456\u0431\u043D\u043E")}</span>
            <strong>${formatMoney(project.targetAmount, project.currency, this.language)}</strong>
          </div>
          <div>
            <span>${this.tr("\u0417\u0456\u0431\u0440\u0430\u043D\u043E")}</span>
            <strong>${formatMoney(fundedTotal, project.currency, this.language)}</strong>
          </div>
          <div>
            <span>${this.tr("\u041D\u0435 \u0432\u0438\u0441\u0442\u0430\u0447\u0430\u0454")}</span>
            <strong>${formatMoney(missing, project.currency, this.language)}</strong>
          </div>
        </div>
        <div class="progress-track" aria-hidden="true">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>

        <section class="turnover-section">
          <div class="turnover-subhead">
            <h4>${this.tr("\u0423\u0447\u0430\u0441\u043D\u0438\u043A\u0438")}</h4>
            ${percentWarning}
          </div>
          <div class="turnover-participants">
            ${project.participants.map((participant) => this.renderTurnoverParticipant(project, participant)).join("")}
          </div>
          <div class="turnover-inline-form">
            <input data-turnover-person-name type="text" placeholder="${escapeAttribute(this.tr("\u0406\u043C\u02BC\u044F \u0443\u0447\u0430\u0441\u043D\u0438\u043A\u0430"))}" />
            <button class="secondary-button" type="button" data-add-turnover-person>${this.tr("\u0414\u043E\u0434\u0430\u0442\u0438 \u043B\u044E\u0434\u0438\u043D\u0443")}</button>
          </div>
        </section>

        <section class="turnover-section">
          <div class="turnover-subhead">
            <h4>${this.tr("\u0406\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0438")}</h4>
            <span>${this.tr("\u041F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043E {amount}", {
        amount: formatMoney(investorReturned, project.currency, this.language)
      })}</span>
          </div>
          <div class="turnover-investors">
            ${project.investors.length ? project.investors.map((investor) => this.renderTurnoverInvestor(project, investor)).join("") : `<div class="empty-state">${this.tr("\u0406\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0456\u0432 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454")}</div>`}
          </div>
          <div class="turnover-inline-form turnover-inline-form--investor">
            <input data-turnover-investor-name type="text" placeholder="${escapeAttribute(this.tr("\u0406\u043C\u02BC\u044F \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0430"))}" />
            <input data-turnover-investor-amount type="text" inputmode="decimal" placeholder="16000" />
            <button class="secondary-button" type="button" data-add-turnover-investor>${this.tr("\u0414\u043E\u0434\u0430\u0442\u0438 \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0430")}</button>
          </div>
        </section>
      </article>
    `;
    }
    renderTurnoverParticipant(project, participant) {
      const amount = this.getTurnoverParticipantAmount(project, participant);
      const paid = this.getTurnoverParticipantPaid(project, participant);
      const remaining = Math.max(0, amount - paid);
      const paidProgress = amount > 0 ? Math.min(paid / amount * 100, 100) : 0;
      const directContributions = participant.contributions.map(
        (contribution) => `
        <article class="turnover-contribution-row">
          <span>${this.tr("\u0412\u043D\u0435\u0441\u043E\u043A")} \xB7 ${formatDateHuman(contribution.date, this.language)}</span>
          <b>${formatMoney(contribution.amount, project.currency, this.language)}</b>
        </article>
      `
      );
      const repaymentContributions = this.getTurnoverParticipantInvestorRepayments(project, participant).map(
        (repayment) => `
        <article class="turnover-contribution-row">
          <span>${this.tr("\u0406\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0443 {name}", {
          name: repayment.investorName
        })} \xB7 ${formatDateHuman(repayment.date, this.language)}</span>
          <b>${formatMoney(repayment.amount, project.currency, this.language)}</b>
        </article>
      `
      );
      const contributionHistory = [...directContributions, ...repaymentContributions].join("");
      return `
      <article class="turnover-participant-row" data-turnover-participant="${escapeAttribute(participant.id)}">
        <div class="turnover-participant-head">
          <span>
            <strong>${escapeHtml(participant.name)}</strong>
            <small>${this.tr("\u0412\u043D\u0456\u0441 {paid} \u0456\u0437 {target}", {
        paid: formatMoney(paid, project.currency, this.language),
        target: formatMoney(amount, project.currency, this.language)
      })}</small>
          </span>
          <b>${this.tr("\u0417\u0430\u043B\u0438\u0448\u0438\u043B\u043E\u0441\u044C {amount}", {
        amount: formatMoney(remaining, project.currency, this.language)
      })}</b>
        </div>
        <div class="turnover-paid-track" aria-hidden="true">
          <div class="turnover-paid-bar" style="width: ${paidProgress}%"></div>
        </div>
        <label class="turnover-share-control">
          <span>${this.tr("\u0427\u0430\u0441\u0442\u043A\u0430")}</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value="${escapeAttribute(String(Math.round(participant.percent)))}"
            data-turnover-percent="${escapeAttribute(participant.id)}"
          />
          <b>${Math.round(participant.percent)}%</b>
        </label>
        <div class="turnover-contributions">
          ${contributionHistory || `<div class="empty-state">${this.tr("\u0412\u043D\u0435\u0441\u043A\u0456\u0432 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454")}</div>`}
        </div>
        <div class="turnover-inline-form turnover-inline-form--contribution">
          <input data-turnover-contribution-amount type="text" inputmode="decimal" placeholder="0" />
          <input data-turnover-contribution-date type="date" value="${todayKey()}" />
          <button class="ghost-button" type="button" data-add-turnover-contribution>${this.tr("\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u0438 \u0432\u043D\u0435\u0441\u043E\u043A")}</button>
        </div>
      </article>
    `;
    }
    renderTurnoverInvestor(project, investor) {
      const returned = this.getTurnoverInvestorReturned(investor);
      const remaining = Math.max(0, investor.amount - returned);
      const repayments = investor.repayments.length ? investor.repayments.map(
        (repayment) => `
              <article class="turnover-repayment-row">
                <span>${escapeHtml(this.getTurnoverRepaymentName(project, repayment))} \xB7 ${formatDateHuman(repayment.date, this.language)}</span>
                <b>${formatMoney(repayment.amount, project.currency, this.language)}</b>
              </article>
            `
      ).join("") : `<div class="empty-state">${this.tr("\u041F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u044C \u0449\u0435 \u043D\u0435\u043C\u0430\u0454")}</div>`;
      return `
      <article class="turnover-investor" data-turnover-investor="${escapeAttribute(investor.id)}">
        <div class="turnover-investor-head">
          <div>
            <strong>${escapeHtml(investor.name)}</strong>
            <span>${this.tr("\u0414\u0430\u0432 {amount}", {
        amount: formatMoney(investor.amount, project.currency, this.language)
      })}</span>
          </div>
          <b>${this.tr("\u0417\u0430\u043B\u0438\u0448\u043E\u043A {amount}", {
        amount: formatMoney(remaining, project.currency, this.language)
      })}</b>
        </div>
        <div class="turnover-repayments">${repayments}</div>
        <div class="turnover-inline-form turnover-inline-form--repay">
          <select data-turnover-repay-person>
            ${this.renderTurnoverParticipantOptions(project)}
          </select>
          <input data-turnover-repay-amount type="text" inputmode="decimal" placeholder="0" />
          <input data-turnover-repay-date type="date" value="${todayKey()}" />
          <button class="ghost-button" type="button" data-add-turnover-repayment>${this.tr("\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u0438 \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043D\u044F")}</button>
        </div>
      </article>
    `;
    }
    renderEntries() {
      const entries = sortedEntries(this.state).filter(
        (entry) => this.activeFilter === "all" || entry.type === this.activeFilter
      );
      const totalPages = Math.max(1, Math.ceil(entries.length / HISTORY_PAGE_SIZE));
      this.historyPage = Math.min(Math.max(this.historyPage, 1), totalPages);
      const pageStart = (this.historyPage - 1) * HISTORY_PAGE_SIZE;
      const pageEntries = entries.slice(pageStart, pageStart + HISTORY_PAGE_SIZE);
      if (!entries.length) {
        this.els.entriesList.innerHTML = `<div class="empty-state">${this.tr(
          "\u041E\u043F\u0435\u0440\u0430\u0446\u0456\u0439 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454"
        )}</div>`;
        this.els.historyPagination.hidden = true;
        return;
      }
      this.els.entriesList.innerHTML = pageEntries.map((entry) => renderEntry(this.state, entry)).join("");
      this.els.historyPagination.hidden = entries.length <= HISTORY_PAGE_SIZE;
      this.els.historyPageInfo.textContent = this.tr("\u0421\u0442\u043E\u0440\u0456\u043D\u043A\u0430 {page} \u0437 {total}", {
        page: this.historyPage,
        total: totalPages
      });
      this.els.historyPrev.disabled = this.historyPage <= 1;
      this.els.historyNext.disabled = this.historyPage >= totalPages;
    }
    renderExchangePreview() {
      const fromAccount = this.getAccount(this.els.exchangeFromAccount.value);
      const toAccount = this.getAccount(this.els.exchangeToAccount.value);
      const fromAmount = parseAmount(this.els.exchangeFromAmount.value);
      const toAmount = parseAmount(this.els.exchangeToAmount.value);
      if (!fromAccount || !toAccount || !fromAmount || !toAmount) {
        this.els.exchangeRatePreview.textContent = this.tr("\u041A\u0443\u0440\u0441 \u0437\u02BC\u044F\u0432\u0438\u0442\u044C\u0441\u044F \u043F\u0456\u0441\u043B\u044F \u0441\u0443\u043C");
        return;
      }
      this.els.exchangeRatePreview.textContent = makeExchangeRateLabel(
        fromAmount,
        fromAccount.currency,
        toAmount,
        toAccount.currency,
        this.language
      );
    }
    swapExchangeDirection() {
      const fromAccount = this.els.exchangeFromAccount.value;
      const toAccount = this.els.exchangeToAccount.value;
      const fromAmount = this.els.exchangeFromAmount.value;
      const toAmount = this.els.exchangeToAmount.value;
      this.els.exchangeFromAccount.value = toAccount;
      this.els.exchangeToAccount.value = fromAccount;
      this.els.exchangeFromAmount.value = toAmount;
      this.els.exchangeToAmount.value = fromAmount;
      this.renderExchangePreview();
    }
    handleTurnoverListChange(event) {
      const input = event.target?.closest(
        "[data-turnover-percent]"
      );
      if (!input) return;
      const card = input.closest("[data-turnover-project]");
      const project = this.getTurnoverProject(card?.dataset.turnoverProject);
      const participant = project?.participants.find(
        (item) => item.id === input.dataset.turnoverPercent
      );
      if (!project || !participant) return;
      this.redistributeTurnoverShares(project, participant.id, Number(input.value) || 0);
      project.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.commitState("\u0427\u0430\u0441\u0442\u043A\u0443 \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043E", "turnover");
    }
    async handleTurnoverListClick(event) {
      const target = event.target;
      const card = target?.closest("[data-turnover-project]");
      const project = this.getTurnoverProject(card?.dataset.turnoverProject);
      if (!target || !card || !project) return;
      if (target.closest("[data-delete-turnover-project]")) {
        const ok = await this.confirm("\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u0446\u044E \u043F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u044E?");
        if (!ok) return;
        this.state.turnoverProjects = this.state.turnoverProjects.filter(
          (item) => item.id !== project.id
        );
        this.commitState("\u041F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u044E \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E", "turnover");
        return;
      }
      if (target.closest("[data-add-turnover-person]")) {
        this.addTurnoverPerson(project, card);
        return;
      }
      const participantNode = target.closest("[data-turnover-participant]");
      if (target.closest("[data-add-turnover-contribution]") && participantNode) {
        const participant = project.participants.find(
          (item) => item.id === participantNode.dataset.turnoverParticipant
        );
        if (participant) this.addTurnoverContribution(project, participant, participantNode);
        return;
      }
      if (target.closest("[data-add-turnover-investor]")) {
        this.addTurnoverInvestor(project, card);
        return;
      }
      const investorNode = target.closest("[data-turnover-investor]");
      if (target.closest("[data-add-turnover-repayment]") && investorNode) {
        const investor = project.investors.find(
          (item) => item.id === investorNode.dataset.turnoverInvestor
        );
        if (investor) this.addTurnoverRepayment(project, investor, investorNode);
      }
    }
    addTurnoverPerson(project, card) {
      const input = card.querySelector("[data-turnover-person-name]");
      const name = input?.value.trim() || "";
      if (!name) {
        this.showTurnoverMessage("\u0412\u043A\u0430\u0436\u0438 \u0456\u043C\u02BC\u044F \u0443\u0447\u0430\u0441\u043D\u0438\u043A\u0430", true);
        return;
      }
      project.participants.push({
        id: makeId("person"),
        name,
        percent: 0,
        contributions: []
      });
      project.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (input) input.value = "";
      this.commitState("\u0423\u0447\u0430\u0441\u043D\u0438\u043A\u0430 \u0434\u043E\u0434\u0430\u043D\u043E", "turnover");
    }
    addTurnoverContribution(project, participant, participantNode) {
      const amountInput = participantNode.querySelector(
        "[data-turnover-contribution-amount]"
      );
      const dateInput = participantNode.querySelector(
        "[data-turnover-contribution-date]"
      );
      const amount = parseSettingAmount(amountInput?.value || "");
      const date = dateInput?.value || todayKey();
      if (!amount || amount <= 0) {
        this.showTurnoverMessage("\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u0432\u043D\u0435\u0441\u043A\u0443 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F", true);
        return;
      }
      if (!isDateKey(date)) {
        this.showTurnoverMessage("\u0412\u043A\u0430\u0436\u0438 \u0434\u0430\u0442\u0443 \u0432\u043D\u0435\u0441\u043A\u0443", true);
        return;
      }
      participant.contributions.push({
        id: makeId("contribution"),
        amount: roundMoney(amount),
        date,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      project.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (amountInput) amountInput.value = "";
      if (dateInput) dateInput.value = todayKey();
      this.commitState("\u0412\u043D\u0435\u0441\u043E\u043A \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043E", "turnover");
    }
    addTurnoverInvestor(project, card) {
      const nameInput = card.querySelector("[data-turnover-investor-name]");
      const amountInput = card.querySelector("[data-turnover-investor-amount]");
      const name = nameInput?.value.trim() || "";
      const amount = parseSettingAmount(amountInput?.value || "");
      if (!name) {
        this.showTurnoverMessage("\u0412\u043A\u0430\u0436\u0438 \u0456\u043C\u02BC\u044F \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0430", true);
        return;
      }
      if (!amount || amount <= 0) {
        this.showTurnoverMessage("\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0430 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F", true);
        return;
      }
      project.investors.push({
        id: makeId("investor"),
        name,
        amount: roundMoney(amount),
        repayments: [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      project.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (nameInput) nameInput.value = "";
      if (amountInput) amountInput.value = "";
      this.commitState("\u0406\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0430 \u0434\u043E\u0434\u0430\u043D\u043E", "turnover");
    }
    addTurnoverRepayment(project, investor, investorNode) {
      const participantSelect = investorNode.querySelector(
        "[data-turnover-repay-person]"
      );
      const amountInput = investorNode.querySelector("[data-turnover-repay-amount]");
      const dateInput = investorNode.querySelector("[data-turnover-repay-date]");
      const participant = project.participants.find(
        (item) => item.id === (participantSelect?.value || "")
      );
      const amount = parseSettingAmount(amountInput?.value || "");
      const date = dateInput?.value || todayKey();
      if (!participant) {
        this.showTurnoverMessage("\u041E\u0431\u0435\u0440\u0438 \u0445\u0442\u043E \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0432 \u0456\u043D\u0432\u0435\u0441\u0442\u043E\u0440\u0443", true);
        return;
      }
      if (!amount || amount <= 0) {
        this.showTurnoverMessage("\u0412\u043A\u0430\u0436\u0438 \u0441\u0443\u043C\u0443 \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043D\u044F \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F", true);
        return;
      }
      if (!isDateKey(date)) {
        this.showTurnoverMessage("\u0412\u043A\u0430\u0436\u0438 \u0434\u0430\u0442\u0443 \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043D\u044F", true);
        return;
      }
      investor.repayments.push({
        id: makeId("repay"),
        participantId: participant.id,
        fromName: participant.name,
        amount: roundMoney(amount),
        date,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      project.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (participantSelect) participantSelect.value = "";
      if (amountInput) amountInput.value = "";
      if (dateInput) dateInput.value = todayKey();
      this.commitState("\u041F\u043E\u0432\u0435\u0440\u043D\u0435\u043D\u043D\u044F \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043E", "turnover");
    }
    getBudgetAmountFromForm(type, account, amount) {
      if (type === "fuel") return 0;
      if (type === "income") return 0;
      if (account.currency === BASE_CURRENCY) return amount;
      const budgetAmount = parseSettingAmount(this.els.entryBudgetAmount.value);
      if (!budgetAmount || budgetAmount <= 0) {
        this.showFormMessage("\u0414\u043B\u044F \u0432\u0430\u043B\u044E\u0442\u043D\u043E\u0457 \u0432\u0438\u0442\u0440\u0430\u0442\u0438 \u0432\u043A\u0430\u0436\u0438 \u0435\u043A\u0432\u0456\u0432\u0430\u043B\u0435\u043D\u0442 \u0443 \u0433\u0440\u043D", true);
        return null;
      }
      return budgetAmount;
    }
    getSelectedType() {
      return document.querySelector('input[name="entry-type"]:checked')?.value || "expense";
    }
    getSelectedDebtDirection() {
      return document.querySelector('input[name="debt-direction"]:checked')?.value || "to_me";
    }
    readFuelFields() {
      const rawFuelType = this.els.fuelType.value.trim();
      const fuelType = normalizeFuelType(rawFuelType);
      const fuelLiters = parseSettingAmount(this.els.fuelLiters.value);
      if (!rawFuelType) {
        this.showFormMessage("\u0412\u043A\u0430\u0436\u0438 \u0432\u0438\u0434 \u043F\u0430\u043B\u0438\u0432\u0430", true);
        return null;
      }
      if (!fuelLiters || fuelLiters <= 0) {
        this.showFormMessage("\u0412\u043A\u0430\u0436\u0438 \u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u043B\u0456\u0442\u0440\u0456\u0432 \u0437\u0430\u043B\u0438\u0442\u043E", true);
        return null;
      }
      return {
        fuelType,
        fuelLiters,
        budgetAmount: 0
      };
    }
    readDebtSettlementRows(debt) {
      const settlements = [];
      const rows = this.els.debtSettlementRows.querySelectorAll(
        "[data-debt-settlement-row]"
      );
      for (const row of rows) {
        const noteInput = row.querySelector("[data-debt-settlement-note]");
        const amountInput = row.querySelector("[data-debt-settlement-amount]");
        const accountSelect = row.querySelector("[data-debt-settlement-account]");
        const note = noteInput?.value.trim();
        const amount = parseSettingAmount(amountInput?.value || "");
        if (amount === null || amount < 0) {
          this.showDebtSettlementMessage("\u0421\u0443\u043C\u0430 \u043C\u0430\u0454 \u0431\u0443\u0442\u0438 \u0447\u0438\u0441\u043B\u043E\u043C \u0432\u0456\u0434 \u043D\u0443\u043B\u044F", true);
          return null;
        }
        if (!amount) continue;
        const account = this.getAccount(accountSelect?.value);
        if (!account) {
          this.showDebtSettlementMessage("\u041E\u0431\u0435\u0440\u0438 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0434\u043B\u044F \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043A\u0443", true);
          return null;
        }
        if (account.currency !== debt.currency) {
          this.showDebtSettlementMessage("\u0414\u043B\u044F \u0431\u043E\u0440\u0433\u0443 \u043E\u0431\u0435\u0440\u0438 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0443 \u0442\u0456\u0439 \u0441\u0430\u043C\u0456\u0439 \u0432\u0430\u043B\u044E\u0442\u0456", true);
          return null;
        }
        settlements.push({
          accountId: account.id,
          amount: roundMoney(amount),
          note: note || void 0
        });
      }
      return settlements;
    }
    addDebtSettlementRow() {
      const debt = this.getDebtEntry(this.activeDebtId);
      if (!debt) return;
      const meta = DEBT_DIRECTION_META[debt.debtDirection || "to_me"] || DEBT_DIRECTION_META.to_me;
      const noteLabel = debt.debtDirection === "by_me" ? this.tr("\u041A\u043E\u043C\u0443 \u0432\u0456\u0434\u0434\u0430\u0432") : this.tr("\u0425\u0442\u043E \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0432");
      const accountLabel = debt.debtDirection === "by_me" ? this.tr("\u0421\u043F\u0438\u0441\u0430\u0442\u0438 \u0437 \u0440\u0430\u0445\u0443\u043D\u043A\u0443") : this.tr("\u0417\u0430\u0440\u0430\u0445\u0443\u0432\u0430\u0442\u0438 \u043D\u0430 \u0440\u0430\u0445\u0443\u043D\u043E\u043A");
      const row = document.createElement("div");
      row.className = "debt-settlement-row";
      row.dataset.debtSettlementRow = "";
      row.innerHTML = `
      <label class="field debt-settlement-note-field">
        <span>${noteLabel}</span>
        <input data-debt-settlement-note type="text" placeholder="${this.tr("\u0406\u043C\u02BC\u044F \u0430\u0431\u043E \u043D\u043E\u0442\u0430\u0442\u043A\u0430")}" />
      </label>
      <label class="field">
        <span>${this.tr(meta.amountLabel)}</span>
        <input data-debt-settlement-amount type="text" inputmode="decimal" placeholder="0" />
      </label>
      <label class="field">
        <span>${accountLabel}</span>
        <select data-debt-settlement-account>${this.getDebtSettlementAccountOptions(debt)}</select>
      </label>
      <button class="entry-delete" type="button" data-remove-debt-settlement-row aria-label="${this.tr(
        "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438"
      )}">\xD7</button>
    `;
      row.querySelector("[data-remove-debt-settlement-row]")?.addEventListener("click", () => row.remove());
      this.els.debtSettlementRows.append(row);
      row.querySelector("[data-debt-settlement-note]")?.focus();
    }
    renderDebtSettlementRows(debt) {
      this.els.debtSettlementRows.querySelectorAll(".debt-settlement-row:not(:first-child)").forEach((row) => row.remove());
      const remaining = getDebtRemainingAmount(debt);
      const meta = DEBT_DIRECTION_META[debt.debtDirection || "to_me"] || DEBT_DIRECTION_META.to_me;
      const options = this.getDebtSettlementAccountOptions(debt);
      const defaultAccountId = this.getDefaultSettlementAccountId(debt);
      const noteLabel = this.els.debtSettlementRows.querySelector(
        "#debt-settlement-note-label"
      );
      const noteInput = this.els.debtSettlementRows.querySelector(
        "#debt-settlement-note-input"
      );
      if (noteLabel) {
        noteLabel.textContent = debt.debtDirection === "by_me" ? this.tr("\u041A\u043E\u043C\u0443 \u0432\u0456\u0434\u0434\u0430\u0432") : this.tr("\u0425\u0442\u043E \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0432");
      }
      if (noteInput) {
        noteInput.value = "";
        noteInput.placeholder = this.tr("\u0406\u043C\u02BC\u044F \u0430\u0431\u043E \u043D\u043E\u0442\u0430\u0442\u043A\u0430");
      }
      this.els.debtSettlementAmountLabel.textContent = this.tr(meta.amountLabel);
      this.els.debtSettlementAccountLabel.textContent = debt.debtDirection === "by_me" ? this.tr("\u0421\u043F\u0438\u0441\u0430\u0442\u0438 \u0437 \u0440\u0430\u0445\u0443\u043D\u043A\u0443") : this.tr("\u0417\u0430\u0440\u0430\u0445\u0443\u0432\u0430\u0442\u0438 \u043D\u0430 \u0440\u0430\u0445\u0443\u043D\u043E\u043A");
      this.els.debtSettlementAmount.value = formatInputNumber(remaining);
      this.els.debtSettlementAccount.innerHTML = options;
      restoreSelectValue(this.els.debtSettlementAccount, defaultAccountId);
      this.els.addDebtSettlementRow.hidden = false;
      this.els.debtCloseToggle.checked = false;
    }
    renderDebtSettlementHistory(debt) {
      const settlements = getDebtSettlements(debt);
      if (!settlements.length) {
        this.els.debtSettlementHistory.hidden = true;
        this.els.debtSettlementHistory.innerHTML = "";
        return;
      }
      const actionLabel = debt.debtDirection === "by_me" ? this.tr("\u0412\u0456\u0434\u0434\u0430\u0432") : this.tr("\u041F\u043E\u0432\u0435\u0440\u043D\u0443\u0432");
      const rows = settlements.map((settlement) => {
        const account = this.getAccount(settlement.accountId);
        const note = settlement.note?.trim() || actionLabel;
        return `
          <article class="debt-history-row">
            <div>
              <strong>${escapeHtml(note)}</strong>
              <span>${formatDateHuman(settlement.date, this.language)} \xB7 ${escapeHtml(
          account?.name || this.tr("\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E")
        )}</span>
            </div>
            <b>${formatMoney(settlement.amount, debt.currency, this.language)}</b>
          </article>
        `;
      }).join("");
      this.els.debtSettlementHistory.hidden = false;
      this.els.debtSettlementHistory.innerHTML = `
      <h3>${this.tr("\u0406\u0441\u0442\u043E\u0440\u0456\u044F \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043A\u0456\u0432")}</h3>
      <div class="debt-history-list">${rows}</div>
    `;
    }
    getDebtSettlementAccountOptions(debt) {
      const accounts = this.state.accounts.filter((account) => account.currency === debt.currency);
      return accounts.length ? accounts.map(renderAccountOption).join("") : `<option value="">${this.tr("\u0414\u043E\u0434\u0430\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0443 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445")}</option>`;
    }
    getDefaultSettlementAccountId(debt) {
      const sameCurrencyAccounts = this.state.accounts.filter(
        (account) => account.currency === debt.currency
      );
      if (debt.debtDirection === "to_me" && sameCurrencyAccounts.some((item) => item.id === debt.accountId)) {
        return debt.accountId || "";
      }
      return sameCurrencyAccounts[0]?.id || "";
    }
    parseNameList(value) {
      return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
    }
    makeTurnoverParticipants(names) {
      const basePercent = names.length ? Math.floor(100 / names.length * 100) / 100 : 0;
      let usedPercent = 0;
      return names.map((name, index) => {
        const isLast = index === names.length - 1;
        const percent = isLast ? roundMoney(100 - usedPercent) : basePercent;
        usedPercent = roundMoney(usedPercent + percent);
        return {
          id: makeId("person"),
          name,
          percent,
          contributions: []
        };
      });
    }
    renderTurnoverParticipantOptions(project) {
      return [
        `<option value="">${this.tr("\u0425\u0442\u043E \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0432")}</option>`,
        ...project.participants.map((participant) => {
          const amount = this.getTurnoverParticipantAmount(project, participant);
          return `<option value="${escapeAttribute(participant.id)}">${escapeHtml(
            `${participant.name} \xB7 ${formatMoney(amount, project.currency, this.language)}`
          )}</option>`;
        })
      ].join("");
    }
    getTurnoverProject(projectId) {
      return this.state.turnoverProjects.find((project) => project.id === projectId) || null;
    }
    getTurnoverParticipantAmount(project, participant) {
      return roundMoney(project.targetAmount * Number(participant.percent || 0) / 100);
    }
    getTurnoverInvestorReturned(investor) {
      return roundMoney(
        investor.repayments.reduce((total, repayment) => total + Number(repayment.amount || 0), 0)
      );
    }
    getTurnoverParticipantDirectContributed(participant) {
      return roundMoney(
        participant.contributions.reduce(
          (total, contribution) => total + Number(contribution.amount || 0),
          0
        )
      );
    }
    getTurnoverParticipantInvestorRepayments(project, participant) {
      return project.investors.flatMap(
        (investor) => investor.repayments.filter((repayment) => this.isTurnoverRepaymentByParticipant(project, repayment, participant)).map((repayment) => ({
          investorName: investor.name,
          amount: Number(repayment.amount || 0),
          date: repayment.date
        }))
      );
    }
    getTurnoverParticipantPaid(project, participant) {
      const investorRepayments = this.getTurnoverParticipantInvestorRepayments(
        project,
        participant
      ).reduce((total, repayment) => total + Number(repayment.amount || 0), 0);
      return roundMoney(
        this.getTurnoverParticipantDirectContributed(participant) + investorRepayments
      );
    }
    getTurnoverRepaymentName(project, repayment) {
      return this.getTurnoverRepaymentParticipant(project, repayment)?.name || repayment.fromName;
    }
    getTurnoverRepaymentParticipant(project, repayment) {
      if (repayment.participantId) {
        return project.participants.find((participant) => participant.id === repayment.participantId) || null;
      }
      return project.participants.find((participant) => participant.name === repayment.fromName) || null;
    }
    isTurnoverRepaymentByParticipant(project, repayment, participant) {
      if (repayment.participantId) return repayment.participantId === participant.id;
      return this.getTurnoverRepaymentParticipant(project, repayment)?.id === participant.id;
    }
    redistributeTurnoverShares(project, participantId, nextPercent) {
      const participant = project.participants.find((item) => item.id === participantId);
      if (!participant) return;
      if (project.participants.length === 1) {
        participant.percent = 100;
        return;
      }
      const cleanPercent = roundMoney(Math.min(100, Math.max(0, nextPercent)));
      const others = project.participants.filter((item) => item.id !== participantId);
      const remainingPercent = roundMoney(100 - cleanPercent);
      const currentOtherTotal = others.reduce(
        (total, item) => total + Math.max(0, Number(item.percent || 0)),
        0
      );
      participant.percent = cleanPercent;
      let usedPercent = 0;
      others.forEach((item, index) => {
        const isLast = index === others.length - 1;
        const nextValue = isLast ? roundMoney(remainingPercent - usedPercent) : currentOtherTotal > 0 ? roundMoney(remainingPercent * Math.max(0, Number(item.percent || 0)) / currentOtherTotal) : roundMoney(remainingPercent / others.length);
        item.percent = Math.max(0, nextValue);
        usedPercent = roundMoney(usedPercent + item.percent);
      });
    }
    getAccount(accountId) {
      return findAccount(this.state, accountId);
    }
    getDebtEntry(entryId) {
      return this.state.entries.find((entry) => entry.id === entryId && entry.type === "debt") || null;
    }
    accountHasEntries(accountId) {
      return this.state.entries.some(
        (entry) => entry.accountId === accountId || entry.settlementAccountId === accountId || getDebtSettlements(entry).some((settlement) => settlement.accountId === accountId) || entry.fromAccountId === accountId || entry.toAccountId === accountId
      );
    }
    commitState(message, messageTarget = "form") {
      this.state.version = APP_VERSION;
      this.state.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (!saveLocalState(this.state)) this.setSyncStatus("\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0435 \u0441\u0445\u043E\u0432\u0438\u0449\u0435 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0435", "warn");
      this.render();
      if (messageTarget === "settings") {
        this.showSettingsMessage(message || "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E", false);
      } else if (messageTarget === "turnover") {
        this.showTurnoverMessage(message || "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E", false);
      } else if (messageTarget === "preferences") {
        this.showPreferencesMessage(message || "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E", false);
      } else {
        this.showFormMessage(message || "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E", false);
      }
      notifyTelegramSuccess(this.telegram);
      this.scheduleTelegramSync();
    }
    scheduleTelegramSync(delay = 250) {
      clearTimeout(this.syncTimer);
      this.syncTimer = window.setTimeout(() => void this.syncStores(), delay);
    }
    async syncStores() {
      if (this.telegram.deviceStorage || this.telegram.cloudStorage) {
        this.setSyncStatus("\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0456\u0437\u0430\u0446\u0456\u044F...", "warn");
      }
      const result = await syncTelegramStores(this.state, {
        deviceStorage: this.telegram.deviceStorage,
        cloudStorage: this.telegram.cloudStorage
      });
      if (result === "failed") {
        this.setSyncStatus("\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u043E \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E", "warn");
        return;
      }
      this.setSyncStatus(result === "synced" ? "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E" : "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u043E \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E", "ok");
    }
    exportState() {
      this.state.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      saveLocalState(this.state);
      const blob = new Blob([JSON.stringify(this.state, null, 2)], {
        type: "application/json"
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `master-of-coin-${todayKey()}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      this.showPreferencesMessage("Backup \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043E", false);
    }
    async importState(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const parsed = parseJson(String(reader.result));
        if (!parsed) {
          this.showPreferencesMessage("\u0424\u0430\u0439\u043B backup \u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438", true);
          return;
        }
        const imported = normalizeState(parsed);
        const ok = await this.confirm("\u0417\u0430\u043C\u0456\u043D\u0438\u0442\u0438 \u043F\u043E\u0442\u043E\u0447\u043D\u0456 \u0434\u0430\u043D\u0456 \u0456\u043C\u043F\u043E\u0440\u0442\u043E\u043C?");
        if (!ok) return;
        this.state = imported;
        this.commitState("\u0406\u043C\u043F\u043E\u0440\u0442\u043E\u0432\u0430\u043D\u043E", "preferences");
        this.els.importFile.value = "";
      };
      reader.readAsText(file);
    }
    openDebtModal(debtId) {
      const debt = this.getDebtEntry(debtId || "");
      if (!debt) return;
      const closed = isDebtClosed(debt);
      if (!closed && !this.state.accounts.length) {
        this.showFormMessage("\u0421\u043F\u043E\u0447\u0430\u0442\u043A\u0443 \u0434\u043E\u0434\u0430\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0434\u043B\u044F \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u043D\u043A\u0443", true);
        return;
      }
      const meta = DEBT_DIRECTION_META[debt.debtDirection || "to_me"] || DEBT_DIRECTION_META.to_me;
      const account = this.getAccount(debt.accountId);
      const settlementTotal = getDebtSettlementTotal(debt);
      const remaining = getDebtRemainingAmount(debt);
      this.activeDebtId = debt.id;
      this.els.debtModalTitle.textContent = closed ? this.tr("\u0411\u043E\u0440\u0433 \u0437\u0430\u043A\u0440\u0438\u0442\u043E") : debt.debtDirection === "by_me" ? this.tr("\u042F \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u0432\u0430\u0432\u0441\u044F") : this.tr("\u0417\u0456 \u043C\u043D\u043E\u044E \u0440\u043E\u0437\u0440\u0430\u0445\u0443\u0432\u0430\u043B\u0438\u0441\u044C");
      this.els.debtModalSummary.textContent = `${this.tr(meta.label)}: ${formatMoney(
        Number(debt.amount || 0),
        debt.currency,
        this.language
      )} \xB7 ${this.tr("\u0412\u0436\u0435 \u0440\u043E\u0437\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u043E")}: ${formatMoney(
        settlementTotal,
        debt.currency,
        this.language
      )} \xB7 ${this.tr("\u0437\u0430\u043B\u0438\u0448\u043E\u043A")} ${formatMoney(remaining, debt.currency, this.language)} \xB7 ${debt.detail} \xB7 ${account?.name || this.tr("\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E")}`;
      this.els.debtSettlementDate.value = todayKey();
      this.els.debtSettlementNote.textContent = this.tr(meta.modalNote);
      this.els.debtSettlementMessage.textContent = "";
      this.els.debtSettlementMessage.classList.remove("is-error");
      this.renderAccountSelectors();
      this.renderDebtSettlementRows(debt);
      this.renderDebtSettlementHistory(debt);
      this.els.debtSettlementForm.hidden = closed;
      this.els.debtModal.hidden = false;
      document.body.classList.add("modal-open");
      if (!closed) window.setTimeout(() => this.els.debtSettlementAmount.focus(), 40);
    }
    closeDebtModal() {
      this.activeDebtId = "";
      this.els.debtModal.hidden = true;
      this.els.debtSettlementForm.hidden = false;
      document.body.classList.remove("modal-open");
    }
    renderDebtReceiptName() {
      const file = this.els.debtReceipt.files?.[0];
      this.els.debtReceiptName.textContent = file ? this.tr("\u041E\u0431\u0440\u0430\u043D\u043E: {name}", { name: file.name }) : this.tr("\u041C\u043E\u0436\u043D\u0430 \u0434\u043E\u0434\u0430\u0442\u0438 \u0444\u043E\u0442\u043E \u0430\u0431\u043E \u0441\u043A\u0440\u0456\u043D \u0447\u0435\u043A\u0430");
    }
    async readDebtReceipt() {
      const file = this.els.debtReceipt.files?.[0];
      if (!file) return null;
      if (!file.type.startsWith("image/")) {
        this.showFormMessage("\u0427\u0435\u043A \u043C\u0430\u0454 \u0431\u0443\u0442\u0438 \u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u043D\u044F\u043C", true);
        return false;
      }
      try {
        return await compressReceiptFile(file);
      } catch {
        this.showFormMessage("\u0424\u043E\u0442\u043E \u0447\u0435\u043A\u0430 \u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438", true);
        return false;
      }
    }
    async handleEntriesClick(event) {
      const target = event.target;
      const debtButton = target?.closest("[data-settle-debt]");
      if (debtButton) {
        this.openDebtModal(debtButton.dataset.settleDebt);
        return;
      }
      const debtCard = target?.closest("[data-debt-id]");
      if (debtCard && !target?.closest("button, a")) {
        this.openDebtModal(debtCard.dataset.debtId);
        return;
      }
      const button = target?.closest("[data-delete-id]");
      if (!button) return;
      const ok = await this.confirm("\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u0446\u044E \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u044E?");
      if (!ok) return;
      this.state.entries = this.state.entries.filter((entry) => entry.id !== button.dataset.deleteId);
      this.commitState("\u041E\u043F\u0435\u0440\u0430\u0446\u0456\u044E \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E");
    }
    async handleSettingsAccountsClick(event) {
      const target = event.target;
      const button = target?.closest("[data-delete-account]");
      if (!button) return;
      const accountId = button.dataset.deleteAccount || "";
      if (this.accountHasEntries(accountId)) {
        this.showSettingsMessage("\u0426\u0435\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A \u0432\u0436\u0435 \u043C\u0430\u0454 \u0456\u0441\u0442\u043E\u0440\u0456\u044E, \u0439\u043E\u0433\u043E \u043D\u0435 \u043C\u043E\u0436\u043D\u0430 \u0432\u0438\u0434\u0430\u043B\u0438\u0442\u0438", true);
        return;
      }
      const ok = await this.confirm("\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u0440\u0430\u0445\u0443\u043D\u043E\u043A?");
      if (!ok) return;
      this.state.accounts = this.state.accounts.filter((account) => account.id !== accountId);
      this.commitState("\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E", "settings");
    }
    setDailyLimitForDate(fromDate, amount) {
      const changeDate = isDateKey(fromDate) ? fromDate : todayKey();
      const cleanAmount = getCleanDailyLimitAmount(amount);
      const withoutSameDate = normalizeDailyLimits(
        this.state.settings.dailyLimits,
        this.state.settings.startDate,
        this.state.settings.dailyAllowance
      ).filter((limit) => limit.fromDate !== changeDate);
      withoutSameDate.push({ fromDate: changeDate, amount: cleanAmount });
      this.state.settings.dailyLimits = compactDailyLimits(withoutSameDate);
      this.state.settings.dailyAllowance = getDailyLimitForDate(this.state.settings, todayKey());
    }
    getDailyLimitChangeDate() {
      const today = todayKey();
      return today < this.state.settings.startDate ? this.state.settings.startDate : today;
    }
    isInCurrentMonth(dateKey) {
      return dateKey.slice(0, 7) === todayKey().slice(0, 7);
    }
    translateUi() {
      document.documentElement.lang = this.language;
      translateDocument(this.language);
    }
    confirm(message) {
      return confirmAction(this.telegram, this.tr(message));
    }
    showFormMessage(message, isError) {
      this.els.formMessage.textContent = this.tr(message);
      this.els.formMessage.classList.toggle("is-error", Boolean(isError));
    }
    showSettingsMessage(message, isError) {
      this.els.settingsMessage.textContent = this.tr(message);
      this.els.settingsMessage.classList.toggle("is-error", Boolean(isError));
    }
    showTurnoverMessage(message, isError) {
      this.els.turnoverMessage.textContent = this.tr(message);
      this.els.turnoverMessage.classList.toggle("is-error", Boolean(isError));
    }
    showPreferencesMessage(message, isError) {
      this.els.preferencesMessage.textContent = this.tr(message);
      this.els.preferencesMessage.classList.toggle("is-error", Boolean(isError));
    }
    showDebtSettlementMessage(message, isError) {
      this.els.debtSettlementMessage.textContent = this.tr(message);
      this.els.debtSettlementMessage.classList.toggle("is-error", Boolean(isError));
    }
    setSyncStatus(message, tone) {
      this.els.syncStatus.textContent = this.tr(message);
      this.els.syncStatus.classList.toggle("is-ok", tone === "ok");
      this.els.syncStatus.classList.toggle("is-warn", tone === "warn");
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    new NationalDebtApp().boot();
  });
})();
