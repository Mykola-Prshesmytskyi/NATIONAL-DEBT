(() => {
  const STORAGE_KEY = "national_debt_state_v1";
  const DEVICE_KEY = "national_debt_device_v1";
  const CLOUD_PREFIX = "national_debt_v1";
  const CLOUD_META_KEY = `${CLOUD_PREFIX}_meta`;
  const CLOUD_CHUNK_SIZE = 3800;
  const APP_VERSION = 2;

  const ACCOUNT_DEFAULTS = {
    card: { label: "Карта", currency: "UAH", initial: 0 },
    cash: { label: "Готівка", currency: "UAH", initial: 0 },
    usdCash: { label: "Готівка USD", currency: "USD", initial: 0 },
  };

  const TYPE_META = {
    expense: {
      label: "Витрата",
      detailLabel: "На що витрачено",
      placeholder: "Продукти, кава, таксі",
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
  };

  const moneyFormatters = {
    UAH: new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
      maximumFractionDigits: 2,
    }),
    USD: new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }),
  };

  const tg = window.Telegram?.WebApp;
  const isTelegramRuntime = Boolean(tg?.initData);
  const tgDeviceStorage = isTelegramRuntime ? tg?.DeviceStorage : null;
  const tgCloudStorage = isTelegramRuntime ? tg?.CloudStorage : null;

  let state = createDefaultState();
  let activeFilter = "all";
  let syncTimer = 0;
  let els = {};

  document.addEventListener("DOMContentLoaded", boot);

  function boot() {
    els = {
      syncStatus: document.querySelector("#sync-status"),
      startLine: document.querySelector("#start-line"),
      balanceUah: document.querySelector("#balance-uah"),
      balanceCard: document.querySelector("#balance-card"),
      balanceCash: document.querySelector("#balance-cash"),
      balanceUsd: document.querySelector("#balance-usd"),
      startCardLabel: document.querySelector("#start-card-label"),
      startCashLabel: document.querySelector("#start-cash-label"),
      startUsdLabel: document.querySelector("#start-usd-label"),
      daysCount: document.querySelector("#days-count"),
      dailyRemaining: document.querySelector("#daily-remaining"),
      dailyAccrued: document.querySelector("#daily-accrued"),
      dailySpent: document.querySelector("#daily-spent"),
      dailyProgress: document.querySelector("#daily-progress"),
      subsRemaining: document.querySelector("#subs-remaining"),
      subsBudget: document.querySelector("#subs-budget"),
      subsSpent: document.querySelector("#subs-spent"),
      subsProgress: document.querySelector("#subs-progress"),
      form: document.querySelector("#entry-form"),
      amount: document.querySelector("#entry-amount"),
      account: document.querySelector("#entry-account"),
      date: document.querySelector("#entry-date"),
      detail: document.querySelector("#entry-detail"),
      detailLabel: document.querySelector("#detail-label"),
      currencyBadge: document.querySelector("#form-currency-badge"),
      formMessage: document.querySelector("#form-message"),
      settingsForm: document.querySelector("#settings-form"),
      settingStartDate: document.querySelector("#setting-start-date"),
      settingDaily: document.querySelector("#setting-daily"),
      settingSubscriptions: document.querySelector("#setting-subscriptions"),
      settingCard: document.querySelector("#setting-card"),
      settingCash: document.querySelector("#setting-cash"),
      settingUsd: document.querySelector("#setting-usd"),
      settingsMessage: document.querySelector("#settings-message"),
      entriesList: document.querySelector("#entries-list"),
      filterButtons: document.querySelectorAll(".filter-button"),
      exportButton: document.querySelector("#export-data"),
      importButton: document.querySelector("#import-data"),
      importFile: document.querySelector("#import-file"),
    };

    initTelegramShell();
    bindEvents();
    els.date.value = todayKey();
    render();
    loadPersistedState();
  }

  function initTelegramShell() {
    if (!tg) return;

    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation?.();
    tg.setHeaderColor?.("#f4f7fb");
    tg.setBackgroundColor?.("#f4f7fb");
  }

  function bindEvents() {
    els.form.addEventListener("submit", handleSubmit);
    els.settingsForm.addEventListener("submit", handleSettingsSubmit);
    els.account.addEventListener("change", renderFormHints);

    document.querySelectorAll('input[name="entry-type"]').forEach((input) => {
      input.addEventListener("change", renderFormHints);
    });

    els.filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        els.filterButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        renderEntries();
      });
    });

    els.entriesList.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-delete-id]");
      if (!button) return;

      const ok = await confirmAction("Видалити цю операцію?");
      if (!ok) return;

      state.entries = state.entries.filter((entry) => entry.id !== button.dataset.deleteId);
      commitState("Операцію видалено");
    });

    els.exportButton.addEventListener("click", exportState);
    els.importButton.addEventListener("click", () => els.importFile.click());
    els.importFile.addEventListener("change", importState);
  }

  function handleSettingsSubmit(event) {
    event.preventDefault();

    const startDate = els.settingStartDate.value || todayKey();
    const dailyAllowance = parseSettingAmount(els.settingDaily.value);
    const subscriptionBudget = parseSettingAmount(els.settingSubscriptions.value);
    const cardInitial = parseSettingAmount(els.settingCard.value);
    const cashInitial = parseSettingAmount(els.settingCash.value);
    const usdInitial = parseSettingAmount(els.settingUsd.value);

    if (!isDateKey(startDate)) {
      showSettingsMessage("Вкажи дату старту", true);
      return;
    }

    if (
      [dailyAllowance, subscriptionBudget, cardInitial, cashInitial, usdInitial].some(
        (value) => value === null,
      )
    ) {
      showSettingsMessage("У сумах мають бути тільки числа", true);
      return;
    }

    if (dailyAllowance < 0 || subscriptionBudget < 0) {
      showSettingsMessage("Бюджети не можуть бути мінусовими", true);
      return;
    }

    state.settings.startDate = startDate;
    state.settings.dailyAllowance = dailyAllowance;
    state.settings.subscriptionBudget = subscriptionBudget;
    state.accounts.card.initial = cardInitial;
    state.accounts.cash.initial = cashInitial;
    state.accounts.usdCash.initial = usdInitial;

    commitState("Стартові налаштування збережено", "settings");
  }

  async function loadPersistedState() {
    setSyncStatus("Завантаження...", "warn");

    const localState = loadLocalState();
    const [deviceState, cloudState] = await Promise.all([
      loadDeviceState(),
      loadCloudState(),
    ]);

    const bestState = [localState, deviceState, cloudState]
      .filter(Boolean)
      .sort((a, b) => dateValue(b.updatedAt) - dateValue(a.updatedAt))[0];

    state = normalizeState(bestState || createDefaultState());
    saveLocalState();
    render();
    scheduleTelegramSync(20);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const type = getSelectedType();
    const amount = parseAmount(els.amount.value);
    const account = els.account.value;
    const detail = els.detail.value.trim();
    const date = els.date.value || todayKey();

    if (!amount || amount <= 0) {
      showFormMessage("Вкажи суму більше нуля", true);
      return;
    }

    if (!ACCOUNT_DEFAULTS[account]) {
      showFormMessage("Обери рахунок", true);
      return;
    }

    if (!detail) {
      showFormMessage(type === "income" ? "Вкажи звідки кошти" : "Вкажи деталі", true);
      return;
    }

    state.entries.push({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      amount,
      account,
      detail,
      date,
      createdAt: new Date().toISOString(),
    });

    els.amount.value = "";
    els.detail.value = "";
    els.date.value = todayKey();
    commitState("Збережено");
  }

  function render() {
    renderHeader();
    renderBalances();
    renderBudgets();
    renderSettingsForm();
    renderFormHints();
    renderEntries();
  }

  function renderHeader() {
    els.startLine.textContent = `Старт: ${formatDateHuman(state.settings.startDate)}`;
  }

  function renderBalances() {
    const balances = calculateBalances();
    const uahBalance = balances.card + balances.cash;

    els.balanceUah.textContent = formatMoney(uahBalance, "UAH");
    els.balanceCard.textContent = formatMoney(balances.card, "UAH");
    els.balanceCash.textContent = formatMoney(balances.cash, "UAH");
    els.balanceUsd.textContent = formatMoney(balances.usdCash, "USD");
    els.startCardLabel.textContent = `Старт: ${formatMoney(
      state.accounts.card.initial,
      "UAH",
    )}`;
    els.startCashLabel.textContent = `Старт: ${formatMoney(
      state.accounts.cash.initial,
      "UAH",
    )}`;
    els.startUsdLabel.textContent = `Старт: ${formatMoney(
      state.accounts.usdCash.initial,
      "USD",
    )}`;
  }

  function renderBudgets() {
    const days = elapsedBudgetDays();
    const dailyAccrued = days * state.settings.dailyAllowance;
    const dailySpent = sumEntries(
      (entry) =>
        isInBudgetPeriod(entry) && entry.type === "expense" && entryCurrency(entry) === "UAH",
    );
    const subsSpent = sumEntries(
      (entry) =>
        isInBudgetPeriod(entry) &&
        entry.type === "subscription" &&
        entryCurrency(entry) === "UAH",
    );
    const dailyRemaining = dailyAccrued - dailySpent;
    const subsRemaining = state.settings.subscriptionBudget - subsSpent;

    els.daysCount.textContent = days > 0 ? `День ${days}` : "До старту";
    els.dailyRemaining.textContent = formatMoney(dailyRemaining, "UAH");
    els.dailyAccrued.textContent = formatMoney(dailyAccrued, "UAH");
    els.dailySpent.textContent = formatMoney(dailySpent, "UAH");
    els.subsRemaining.textContent = formatMoney(subsRemaining, "UAH");
    els.subsBudget.textContent = formatMoney(state.settings.subscriptionBudget, "UAH");
    els.subsSpent.textContent = formatMoney(subsSpent, "UAH");

    setProgress(els.dailyProgress, dailySpent, Math.max(dailyAccrued, state.settings.dailyAllowance));
    setProgress(els.subsProgress, subsSpent, state.settings.subscriptionBudget);
  }

  function renderFormHints() {
    const type = getSelectedType();
    const account = ACCOUNT_DEFAULTS[els.account.value] || ACCOUNT_DEFAULTS.card;
    const meta = TYPE_META[type];

    els.detailLabel.textContent = meta.detailLabel;
    els.detail.placeholder = meta.placeholder;
    els.currencyBadge.textContent = account.currency;
  }

  function renderSettingsForm() {
    els.settingStartDate.value = state.settings.startDate;
    els.settingDaily.value = formatInputNumber(state.settings.dailyAllowance);
    els.settingSubscriptions.value = formatInputNumber(state.settings.subscriptionBudget);
    els.settingCard.value = formatInputNumber(state.accounts.card.initial);
    els.settingCash.value = formatInputNumber(state.accounts.cash.initial);
    els.settingUsd.value = formatInputNumber(state.accounts.usdCash.initial);
  }

  function renderEntries() {
    const entries = sortedEntries().filter(
      (entry) => activeFilter === "all" || entry.type === activeFilter,
    );

    if (!entries.length) {
      els.entriesList.innerHTML = `<div class="empty-state">Операцій ще немає</div>`;
      return;
    }

    els.entriesList.innerHTML = entries.map(renderEntry).join("");
  }

  function renderEntry(entry) {
    const meta = TYPE_META[entry.type] || TYPE_META.expense;
    const account = state.accounts[entry.account] || ACCOUNT_DEFAULTS.card;
    const signedAmount = meta.sign * entry.amount;
    const amountClass = signedAmount >= 0 ? "is-positive" : "is-negative";
    const itemClass = `entry-item is-${entry.type}`;
    const dateLabel = formatDateHuman(entry.date);
    const accountLabel = account.label || ACCOUNT_DEFAULTS[entry.account]?.label || "Рахунок";

    return `
      <article class="${itemClass}">
        <span class="entry-mark" aria-hidden="true"></span>
        <div class="entry-main">
          <strong>${escapeHtml(entry.detail)}</strong>
          <span>${meta.label} · ${dateLabel} · ${accountLabel}</span>
        </div>
        <div class="entry-amount ${amountClass}">
          ${formatSignedMoney(signedAmount, account.currency)}
        </div>
        <button class="entry-delete" type="button" data-delete-id="${escapeHtml(entry.id)}" aria-label="Видалити">×</button>
      </article>
    `;
  }

  function calculateBalances() {
    const balances = Object.fromEntries(
      Object.entries(state.accounts).map(([key, account]) => [key, Number(account.initial) || 0]),
    );

    for (const entry of state.entries) {
      const account = state.accounts[entry.account];
      const meta = TYPE_META[entry.type];
      if (!account || !meta) continue;
      balances[entry.account] = (balances[entry.account] || 0) + meta.sign * entry.amount;
    }

    return balances;
  }

  function sumEntries(predicate) {
    return state.entries.reduce((total, entry) => {
      if (!predicate(entry)) return total;
      return total + Number(entry.amount || 0);
    }, 0);
  }

  function entryCurrency(entry) {
    return (state.accounts[entry.account] || ACCOUNT_DEFAULTS.card).currency;
  }

  function commitState(message, messageTarget = "form") {
    state.updatedAt = new Date().toISOString();
    saveLocalState();
    render();
    if (messageTarget === "settings") {
      showSettingsMessage(message || "Збережено", false);
    } else {
      showFormMessage(message || "Збережено", false);
    }
    tg?.HapticFeedback?.notificationOccurred?.("success");
    scheduleTelegramSync();
  }

  function createDefaultState() {
    const now = new Date().toISOString();
    return {
      version: APP_VERSION,
      settings: {
        startDate: todayKey(),
        dailyAllowance: 0,
        subscriptionBudget: 0,
      },
      accounts: clone(ACCOUNT_DEFAULTS),
      entries: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  function normalizeState(input) {
    const fallback = createDefaultState();
    const source = input && typeof input === "object" ? input : {};
    if (isLegacyDefaultState(source)) return fallback;

    const accounts = Object.fromEntries(
      Object.entries(ACCOUNT_DEFAULTS).map(([key, account]) => [
        key,
        {
          ...account,
          initial: coerceNumber(source.accounts?.[key]?.initial, account.initial),
        },
      ]),
    );
    const settings = {
      startDate: isDateKey(source.settings?.startDate)
        ? source.settings.startDate
        : fallback.settings.startDate,
      dailyAllowance: Math.max(0, coerceNumber(source.settings?.dailyAllowance, 0)),
      subscriptionBudget: Math.max(0, coerceNumber(source.settings?.subscriptionBudget, 0)),
    };

    return {
      ...fallback,
      ...source,
      version: APP_VERSION,
      settings,
      accounts,
      entries: Array.isArray(source.entries)
        ? source.entries.map(normalizeEntry).filter(Boolean)
        : [],
    };
  }

  function normalizeEntry(entry) {
    if (!entry || typeof entry !== "object") return null;
    const amount = Number(entry.amount);
    const type = TYPE_META[entry.type] ? entry.type : "expense";
    const account = ACCOUNT_DEFAULTS[entry.account] ? entry.account : "card";

    if (!Number.isFinite(amount) || amount <= 0) return null;

    return {
      id: String(entry.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      type,
      amount,
      account,
      detail: String(entry.detail || "Без опису"),
      date: isDateKey(entry.date) ? entry.date : todayKey(),
      createdAt: entry.createdAt || new Date().toISOString(),
    };
  }

  function isLegacyDefaultState(source) {
    if (!source || Number(source.version || 1) >= APP_VERSION) return false;
    return !Array.isArray(source.entries) || source.entries.length === 0;
  }

  function coerceNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? roundMoney(number) : fallback;
  }

  function loadLocalState() {
    try {
      return parseState(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  async function loadDeviceState() {
    if (!tgDeviceStorage) return null;
    const raw = await storageGet(tgDeviceStorage, DEVICE_KEY);
    return parseState(raw);
  }

  async function loadCloudState() {
    if (!tgCloudStorage) return null;

    const meta = parseJson(await storageGet(tgCloudStorage, CLOUD_META_KEY));
    if (!meta?.chunks) return null;

    const keys = Array.from({ length: Number(meta.chunks) }, (_, index) =>
      cloudChunkKey(index),
    );
    const chunks = await Promise.all(keys.map((key) => storageGet(tgCloudStorage, key)));
    return parseState(chunks.join(""));
  }

  function saveLocalState() {
    try {
      localStorage.setItem(STORAGE_KEY, serializeState());
    } catch {
      setSyncStatus("Локальне сховище недоступне", "warn");
    }
  }

  function scheduleTelegramSync(delay = 250) {
    clearTimeout(syncTimer);
    syncTimer = window.setTimeout(syncTelegramStores, delay);
  }

  async function syncTelegramStores() {
    const serialized = serializeState();
    const jobs = [];

    if (tgDeviceStorage) jobs.push(storageSet(tgDeviceStorage, DEVICE_KEY, serialized));
    if (tgCloudStorage) jobs.push(saveCloudState(serialized));

    if (!jobs.length) {
      setSyncStatus("Локально збережено", "ok");
      return;
    }

    setSyncStatus("Синхронізація...", "warn");
    const results = await Promise.allSettled(jobs);
    const hasSuccess = results.some((result) => result.status === "fulfilled" && result.value);
    setSyncStatus(hasSuccess ? "Збережено" : "Локально збережено", hasSuccess ? "ok" : "warn");
  }

  async function saveCloudState(serialized) {
    const chunks = chunkText(serialized, CLOUD_CHUNK_SIZE);
    const oldMeta = parseJson(await storageGet(tgCloudStorage, CLOUD_META_KEY));
    const oldChunkCount = Number(oldMeta?.chunks || 0);

    const chunkResults = await Promise.all(
      chunks.map((chunk, index) => storageSet(tgCloudStorage, cloudChunkKey(index), chunk)),
    );
    if (chunkResults.some((ok) => !ok)) return false;

    const staleKeys = [];
    for (let index = chunks.length; index < oldChunkCount; index += 1) {
      staleKeys.push(cloudChunkKey(index));
    }
    await Promise.all(staleKeys.map((key) => storageRemove(tgCloudStorage, key)));

    return storageSet(
      tgCloudStorage,
      CLOUD_META_KEY,
      JSON.stringify({ chunks: chunks.length, updatedAt: state.updatedAt }),
    );
  }

  function storageGet(storage, key) {
    return new Promise((resolve) => {
      try {
        storage.getItem(key, (error, value) => {
          resolve(error ? "" : value || "");
        });
      } catch {
        resolve("");
      }
    });
  }

  function storageSet(storage, key, value) {
    return new Promise((resolve) => {
      try {
        storage.setItem(key, value, (error, ok) => {
          resolve(!error && ok !== false);
        });
      } catch {
        resolve(false);
      }
    });
  }

  function storageRemove(storage, key) {
    return new Promise((resolve) => {
      try {
        storage.removeItem(key, (error, ok) => {
          resolve(!error && ok !== false);
        });
      } catch {
        resolve(false);
      }
    });
  }

  function exportState() {
    state.updatedAt = new Date().toISOString();
    saveLocalState();

    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `national-debt-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showFormMessage("Backup створено", false);
  }

  function importState(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const imported = normalizeState(parseJson(String(reader.result)));
      const ok = await confirmAction("Замінити поточні дані імпортом?");
      if (!ok) return;

      state = imported;
      commitState("Імпортовано");
      els.importFile.value = "";
    };
    reader.readAsText(file);
  }

  function parseState(raw) {
    const parsed = parseJson(raw);
    return parsed ? normalizeState(parsed) : null;
  }

  function parseJson(raw) {
    if (!raw || typeof raw !== "string") return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function serializeState() {
    return JSON.stringify(state);
  }

  function sortedEntries() {
    return [...state.entries].sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate) return byDate;
      return dateValue(b.createdAt) - dateValue(a.createdAt);
    });
  }

  function elapsedBudgetDays() {
    const start = parseDateKey(state.settings.startDate);
    const today = parseDateKey(todayKey());
    const diff = Math.floor((today - start) / 86400000);
    return Math.max(0, diff + 1);
  }

  function isInBudgetPeriod(entry) {
    return String(entry.date) >= String(state.settings.startDate);
  }

  function setProgress(element, spent, total) {
    const percent = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
    element.style.width = `${Math.max(percent, 0)}%`;
    element.classList.toggle("is-over", spent > total);
  }

  function getSelectedType() {
    return document.querySelector('input[name="entry-type"]:checked')?.value || "expense";
  }

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

  function roundMoney(value) {
    return Math.round(value * 100) / 100;
  }

  function formatInputNumber(value) {
    const number = coerceNumber(value, 0);
    return Number.isInteger(number) ? String(number) : String(number).replace(".", ",");
  }

  function formatMoney(value, currency) {
    const formatter = moneyFormatters[currency] || moneyFormatters.UAH;
    return formatter.format(value).replace(",00", "");
  }

  function formatSignedMoney(value, currency) {
    const sign = value > 0 ? "+" : "";
    return `${sign}${formatMoney(value, currency)}`;
  }

  function formatDateHuman(dateKey) {
    return new Intl.DateTimeFormat("uk-UA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parseDateKey(dateKey));
  }

  function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
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
    const time = Date.parse(value || "");
    return Number.isFinite(time) ? time : 0;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function chunkText(text, size) {
    const chunks = [];
    for (let index = 0; index < text.length; index += size) {
      chunks.push(text.slice(index, index + size));
    }
    return chunks.length ? chunks : [""];
  }

  function cloudChunkKey(index) {
    return `${CLOUD_PREFIX}_${index}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showFormMessage(message, isError) {
    els.formMessage.textContent = message;
    els.formMessage.classList.toggle("is-error", Boolean(isError));
  }

  function showSettingsMessage(message, isError) {
    els.settingsMessage.textContent = message;
    els.settingsMessage.classList.toggle("is-error", Boolean(isError));
  }

  function setSyncStatus(message, tone) {
    els.syncStatus.textContent = message;
    els.syncStatus.classList.toggle("is-ok", tone === "ok");
    els.syncStatus.classList.toggle("is-warn", tone === "warn");
  }

  function confirmAction(message) {
    return new Promise((resolve) => {
      if (tg?.showConfirm) {
        tg.showConfirm(message, resolve);
        return;
      }
      resolve(window.confirm(message));
    });
  }
})();
