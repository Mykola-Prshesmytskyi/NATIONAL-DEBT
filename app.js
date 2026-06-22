(() => {
  const STORAGE_KEY = "national_debt_state_v1";
  const DEVICE_KEY = "national_debt_device_v1";
  const CLOUD_PREFIX = "national_debt_v1";
  const CLOUD_META_KEY = `${CLOUD_PREFIX}_meta`;
  const CLOUD_CHUNK_SIZE = 3800;
  const APP_VERSION = 4;
  const BASE_CURRENCY = "UAH";
  const DEFAULT_DAILY_ALLOWANCE = 500;
  const STORAGE_TIMEOUT_MS = 4500;
  const SYNC_TIMEOUT_MS = 6000;
  const RECEIPT_MAX_SIZE = 1280;
  const RECEIPT_QUALITY = 0.78;

  const ACCOUNT_KIND_LABELS = {
    card: "Картка",
    cash: "Готівка",
    savings: "Накопичення",
    other: "Інше",
  };

  const LEGACY_ACCOUNT_LABELS = {
    card: "Карта",
    cash: "Готівка",
    usdCash: "Готівка USD",
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

  const DEBT_DIRECTION_META = {
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

  const tg = window.Telegram?.WebApp;
  const isTelegramRuntime = Boolean(tg?.initData);
  const tgDeviceStorage = isTelegramRuntime ? tg?.DeviceStorage : null;
  const tgCloudStorage = isTelegramRuntime ? tg?.CloudStorage : null;

  let state = createDefaultState();
  let activeFilter = "all";
  let activeChartRange = 7;
  let activeDebtId = "";
  let syncTimer = 0;
  let els = {};

  document.addEventListener("DOMContentLoaded", boot);

  function boot() {
    els = {
      syncStatus: document.querySelector("#sync-status"),
      startLine: document.querySelector("#start-line"),
      openSettings: document.querySelector("#open-settings"),
      openSettingsSecondary: document.querySelector("#open-settings-secondary"),
      closeSettings: document.querySelector("#close-settings"),
      settingsModal: document.querySelector("#settings-modal"),
      dailyRemaining: document.querySelector("#daily-remaining"),
      dailyAccrued: document.querySelector("#daily-accrued"),
      dailySpent: document.querySelector("#daily-spent"),
      dailyRate: document.querySelector("#daily-rate"),
      dailyProgress: document.querySelector("#daily-progress"),
      daysCount: document.querySelector("#days-count"),
      subsRemaining: document.querySelector("#subs-remaining"),
      subsBudget: document.querySelector("#subs-budget"),
      subsSpent: document.querySelector("#subs-spent"),
      subsProgress: document.querySelector("#subs-progress"),
      accountsSummary: document.querySelector("#accounts-summary"),
      currencyStrip: document.querySelector("#currency-strip"),
      accountsList: document.querySelector("#accounts-list"),
      chartSummary: document.querySelector("#chart-summary"),
      expenseChart: document.querySelector("#expense-chart"),
      chartButtons: document.querySelectorAll("[data-chart-range]"),
      form: document.querySelector("#entry-form"),
      normalFields: document.querySelector("#normal-fields"),
      exchangeFields: document.querySelector("#exchange-fields"),
      amount: document.querySelector("#entry-amount"),
      account: document.querySelector("#entry-account"),
      entryBudgetAmount: document.querySelector("#entry-budget-amount"),
      budgetEquivalentField: document.querySelector("#budget-equivalent-field"),
      debtOptions: document.querySelector("#debt-options"),
      debtReceiptField: document.querySelector("#debt-receipt-field"),
      debtReceipt: document.querySelector("#debt-receipt"),
      debtReceiptName: document.querySelector("#debt-receipt-name"),
      date: document.querySelector("#entry-date"),
      detail: document.querySelector("#entry-detail"),
      detailLabel: document.querySelector("#detail-label"),
      currencyBadge: document.querySelector("#form-currency-badge"),
      formMessage: document.querySelector("#form-message"),
      exchangeFromAccount: document.querySelector("#exchange-from-account"),
      exchangeFromAmount: document.querySelector("#exchange-from-amount"),
      exchangeToAccount: document.querySelector("#exchange-to-account"),
      exchangeToAmount: document.querySelector("#exchange-to-amount"),
      exchangeDate: document.querySelector("#exchange-date"),
      exchangeDetail: document.querySelector("#exchange-detail"),
      exchangeRatePreview: document.querySelector("#exchange-rate-preview"),
      swapExchange: document.querySelector("#swap-exchange"),
      settingsForm: document.querySelector("#settings-form"),
      settingStartDate: document.querySelector("#setting-start-date"),
      settingDaily: document.querySelector("#setting-daily"),
      settingSubscriptions: document.querySelector("#setting-subscriptions"),
      accountName: document.querySelector("#account-name"),
      accountKind: document.querySelector("#account-kind"),
      accountCurrency: document.querySelector("#account-currency"),
      accountInitial: document.querySelector("#account-initial"),
      addAccount: document.querySelector("#add-account"),
      settingsAccountsList: document.querySelector("#settings-accounts-list"),
      settingsMessage: document.querySelector("#settings-message"),
      entriesList: document.querySelector("#entries-list"),
      filterButtons: document.querySelectorAll("[data-filter]"),
      exportButton: document.querySelector("#export-data"),
      importButton: document.querySelector("#import-data"),
      importFile: document.querySelector("#import-file"),
      debtModal: document.querySelector("#debt-modal"),
      closeDebtModal: document.querySelector("#close-debt-modal"),
      debtModalTitle: document.querySelector("#debt-modal-title"),
      debtModalSummary: document.querySelector("#debt-modal-summary"),
      debtSettlementForm: document.querySelector("#debt-settlement-form"),
      debtSettlementAmountLabel: document.querySelector("#debt-settlement-amount-label"),
      debtSettlementAmount: document.querySelector("#debt-settlement-amount"),
      debtSettlementAccount: document.querySelector("#debt-settlement-account"),
      debtSettlementDate: document.querySelector("#debt-settlement-date"),
      debtSettlementNote: document.querySelector("#debt-settlement-note"),
      debtSettlementMessage: document.querySelector("#debt-settlement-message"),
    };

    initTelegramShell();
    bindEvents();
    els.date.value = todayKey();
    els.exchangeDate.value = todayKey();
    els.debtSettlementDate.value = todayKey();
    render();
    loadPersistedState();
  }

  function initTelegramShell() {
    if (!tg) return;

    callTelegramMethod("ready");
    callTelegramMethod("expand");
    callTelegramMethod("enableClosingConfirmation", "6.2");
    callTelegramMethod("setHeaderColor", "6.1", "#eef4f8");
    callTelegramMethod("setBackgroundColor", "6.1", "#eef4f8");
  }

  function bindEvents() {
    els.openSettings.addEventListener("click", openSettingsModal);
    els.openSettingsSecondary.addEventListener("click", openSettingsModal);
    els.closeSettings.addEventListener("click", closeSettingsModal);
    els.closeDebtModal.addEventListener("click", closeDebtModal);
    els.settingsModal.addEventListener("click", (event) => {
      if (event.target === els.settingsModal) closeSettingsModal();
    });
    els.debtModal.addEventListener("click", (event) => {
      if (event.target === els.debtModal) closeDebtModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.settingsModal.hidden) closeSettingsModal();
      if (event.key === "Escape" && !els.debtModal.hidden) closeDebtModal();
    });

    els.form.addEventListener("submit", handleSubmit);
    els.debtSettlementForm.addEventListener("submit", handleDebtSettlementSubmit);
    els.settingsForm.addEventListener("submit", handleSettingsSubmit);
    els.addAccount.addEventListener("click", handleAddAccount);
    els.account.addEventListener("change", renderFormHints);
    els.debtReceipt.addEventListener("change", renderDebtReceiptName);
    els.exchangeFromAccount.addEventListener("change", renderExchangePreview);
    els.exchangeToAccount.addEventListener("change", renderExchangePreview);
    els.exchangeFromAmount.addEventListener("input", renderExchangePreview);
    els.exchangeToAmount.addEventListener("input", renderExchangePreview);
    els.swapExchange.addEventListener("click", swapExchangeDirection);

    document.querySelectorAll('input[name="entry-type"]').forEach((input) => {
      input.addEventListener("change", renderFormHints);
    });
    document.querySelectorAll('input[name="debt-direction"]').forEach((input) => {
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

    els.chartButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeChartRange = Number(button.dataset.chartRange);
        els.chartButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        renderChart();
      });
    });

    els.entriesList.addEventListener("click", async (event) => {
      const debtButton = event.target.closest("[data-settle-debt]");
      if (debtButton) {
        openDebtModal(debtButton.dataset.settleDebt);
        return;
      }

      const debtCard = event.target.closest("[data-debt-id]");
      if (debtCard && !event.target.closest("button, a")) {
        openDebtModal(debtCard.dataset.debtId);
        return;
      }

      const button = event.target.closest("[data-delete-id]");
      if (!button) return;

      const ok = await confirmAction("Видалити цю операцію?");
      if (!ok) return;

      state.entries = state.entries.filter((entry) => entry.id !== button.dataset.deleteId);
      commitState("Операцію видалено");
    });

    els.settingsAccountsList.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-delete-account]");
      if (!button) return;

      const accountId = button.dataset.deleteAccount;
      if (accountHasEntries(accountId)) {
        showSettingsMessage("Цей рахунок вже має історію, його не можна видалити", true);
        return;
      }

      const ok = await confirmAction("Видалити рахунок?");
      if (!ok) return;

      state.accounts = state.accounts.filter((account) => account.id !== accountId);
      commitState("Рахунок видалено", "settings");
    });

    els.exportButton.addEventListener("click", exportState);
    els.importButton.addEventListener("click", () => els.importFile.click());
    els.importFile.addEventListener("change", importState);
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

  async function handleSubmit(event) {
    event.preventDefault();

    const type = getSelectedType();
    if (type === "exchange") {
      handleExchangeSubmit();
      return;
    }
    if (type === "debt") {
      await handleDebtSubmit();
      return;
    }

    const account = getAccount(els.account.value);
    const amount = parseAmount(els.amount.value);
    const detail = els.detail.value.trim();
    const date = els.date.value || todayKey();

    if (!account) {
      showFormMessage("Спочатку додай рахунок", true);
      return;
    }

    if (!amount || amount <= 0) {
      showFormMessage("Вкажи суму більше нуля", true);
      return;
    }

    if (!detail) {
      showFormMessage(type === "income" ? "Вкажи звідки кошти" : "Вкажи деталі", true);
      return;
    }

    const budgetAmount = getBudgetAmountFromForm(type, account, amount);
    if (budgetAmount === null) return;

    state.entries.push({
      id: makeId("entry"),
      type,
      accountId: account.id,
      amount,
      currency: account.currency,
      budgetAmount,
      detail,
      date,
      createdAt: new Date().toISOString(),
    });

    els.amount.value = "";
    els.entryBudgetAmount.value = "";
    els.detail.value = "";
    els.date.value = todayKey();
    commitState("Збережено");
  }

  function handleExchangeSubmit() {
    const fromAccount = getAccount(els.exchangeFromAccount.value);
    const toAccount = getAccount(els.exchangeToAccount.value);
    const fromAmount = parseAmount(els.exchangeFromAmount.value);
    const toAmount = parseAmount(els.exchangeToAmount.value);
    const date = els.exchangeDate.value || todayKey();
    const detail = els.exchangeDetail.value.trim();

    if (!fromAccount || !toAccount) {
      showFormMessage("Обери рахунки для обміну", true);
      return;
    }

    if (fromAccount.id === toAccount.id) {
      showFormMessage("Рахунки мають бути різні", true);
      return;
    }

    if (!fromAmount || !toAmount || fromAmount <= 0 || toAmount <= 0) {
      showFormMessage("Вкажи скільки віддав і скільки отримав", true);
      return;
    }

    state.entries.push({
      id: makeId("exchange"),
      type: "exchange",
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      fromAmount,
      toAmount,
      fromCurrency: fromAccount.currency,
      toCurrency: toAccount.currency,
      detail: detail || `Обмін ${fromAccount.name} → ${toAccount.name}`,
      date,
      createdAt: new Date().toISOString(),
    });

    els.exchangeFromAmount.value = "";
    els.exchangeToAmount.value = "";
    els.exchangeDetail.value = "";
    els.exchangeDate.value = todayKey();
    renderExchangePreview();
    commitState("Обмін збережено");
  }

  async function handleDebtSubmit() {
    const account = getAccount(els.account.value);
    const amount = parseAmount(els.amount.value);
    const detail = els.detail.value.trim();
    const date = els.date.value || todayKey();
    const debtDirection = getSelectedDebtDirection();

    if (!account) {
      showFormMessage("Спочатку додай рахунок", true);
      return;
    }

    if (!amount || amount <= 0) {
      showFormMessage("Вкажи суму боргу більше нуля", true);
      return;
    }

    if (!detail) {
      showFormMessage("Вкажи хто і за що винен", true);
      return;
    }

    const receipt = await readDebtReceipt();
    if (receipt === false) return;

    state.entries.push({
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
      createdAt: new Date().toISOString(),
    });

    els.amount.value = "";
    els.entryBudgetAmount.value = "";
    els.detail.value = "";
    els.debtReceipt.value = "";
    renderDebtReceiptName();
    els.date.value = todayKey();
    commitState("Борг збережено");
  }

  function handleDebtSettlementSubmit(event) {
    event.preventDefault();

    const debt = getDebtEntry(activeDebtId);
    const settlementAccount = getAccount(els.debtSettlementAccount.value);
    const settlementAmount = parseSettingAmount(els.debtSettlementAmount.value);
    const settlementDate = els.debtSettlementDate.value || todayKey();

    if (!debt || isDebtClosed(debt)) {
      showDebtSettlementMessage("Цей борг вже закрито", true);
      return;
    }

    if (!settlementAccount) {
      showDebtSettlementMessage("Обери рахунок для розрахунку", true);
      return;
    }

    if (settlementAccount.currency !== debt.currency) {
      showDebtSettlementMessage("Для боргу обери рахунок у тій самій валюті", true);
      return;
    }

    if (settlementAmount === null || settlementAmount < 0) {
      showDebtSettlementMessage("Сума має бути числом від нуля", true);
      return;
    }

    if (!isDateKey(settlementDate)) {
      showDebtSettlementMessage("Вкажи дату розрахунку", true);
      return;
    }

    debt.status = "closed";
    debt.settlementAmount = roundMoney(settlementAmount);
    debt.settlementAccountId = settlementAccount.id;
    debt.settlementDate = settlementDate;
    debt.writeOffBudgetAmount = getDebtWriteOffAmount(debt);
    debt.settledAt = new Date().toISOString();

    closeDebtModal();
    commitState("Борг закрито");
  }

  function handleSettingsSubmit(event) {
    event.preventDefault();

    const settings = readSettingsFields();
    if (!settings) return;

    const initials = readAccountInitialInputs();
    if (!initials) return;

    applySettings(settings);
    state.accounts = state.accounts.map((account) => ({
      ...account,
      initial: initials[account.id] ?? account.initial,
    }));

    commitState("Налаштування збережено", "settings");
    closeSettingsModal();
  }

  function handleAddAccount() {
    const settings = readSettingsFields();
    if (!settings) return;

    const initials = readAccountInitialInputs();
    if (!initials) return;

    const name = els.accountName.value.trim();
    const kind = els.accountKind.value;
    const currency = normalizeCurrency(els.accountCurrency.value || BASE_CURRENCY);
    const initial = parseSettingAmount(els.accountInitial.value);

    if (!name) {
      showSettingsMessage("Вкажи назву рахунку", true);
      return;
    }

    if (!currency) {
      showSettingsMessage("Вкажи валюту рахунку", true);
      return;
    }

    if (initial === null) {
      showSettingsMessage("Стартовий баланс має бути числом", true);
      return;
    }

    applySettings(settings);
    state.accounts = state.accounts.map((account) => ({
      ...account,
      initial: initials[account.id] ?? account.initial,
    }));
    state.accounts.push({
      id: makeId("acct"),
      name,
      kind: ACCOUNT_KIND_LABELS[kind] ? kind : "other",
      currency,
      initial,
      createdAt: new Date().toISOString(),
    });

    els.accountName.value = "";
    els.accountCurrency.value = BASE_CURRENCY;
    els.accountInitial.value = "";
    commitState("Рахунок додано", "settings");
  }

  function readSettingsFields() {
    const startDate = els.settingStartDate.value || todayKey();
    const dailyAllowance = parseSettingAmount(els.settingDaily.value);
    const subscriptionBudget = parseSettingAmount(els.settingSubscriptions.value);

    if (!isDateKey(startDate)) {
      showSettingsMessage("Вкажи дату старту", true);
      return null;
    }

    if (dailyAllowance === null || subscriptionBudget === null) {
      showSettingsMessage("У сумах мають бути тільки числа", true);
      return null;
    }

    if (dailyAllowance < 0 || subscriptionBudget < 0) {
      showSettingsMessage("Бюджети не можуть бути мінусовими", true);
      return null;
    }

    return { startDate, dailyAllowance, subscriptionBudget };
  }

  function readAccountInitialInputs() {
    const values = {};
    const inputs = els.settingsAccountsList.querySelectorAll("[data-account-initial]");

    for (const input of inputs) {
      const value = parseSettingAmount(input.value);
      if (value === null) {
        showSettingsMessage("Стартові баланси мають бути числами", true);
        return null;
      }
      values[input.dataset.accountInitial] = value;
    }

    return values;
  }

  function applySettings(settings) {
    const previousDailyLimit = getDailyLimitForDate(todayKey());

    state.settings.startDate = settings.startDate;
    state.settings.subscriptionBudget = settings.subscriptionBudget;
    state.settings.dailyLimits = normalizeDailyLimits(
      state.settings.dailyLimits,
      state.settings.startDate,
      previousDailyLimit,
    );
    setDailyLimitForDate(getDailyLimitChangeDate(), settings.dailyAllowance);
  }

  function render() {
    renderHeader();
    renderAccountSelectors();
    renderBalances();
    renderBudgets();
    renderChart();
    renderFormHints();
    renderSettingsForm();
    renderEntries();
  }

  function renderHeader() {
    els.startLine.textContent = `Старт: ${formatDateHuman(state.settings.startDate)}`;
  }

  function renderAccountSelectors() {
    const options = state.accounts.length
      ? state.accounts.map(renderAccountOption).join("")
      : `<option value="">Додай рахунок у налаштуваннях</option>`;

    const currentAccount = els.account.value;
    const currentFrom = els.exchangeFromAccount.value;
    const currentTo = els.exchangeToAccount.value;
    const currentSettlementAccount = els.debtSettlementAccount.value;

    els.account.innerHTML = options;
    els.exchangeFromAccount.innerHTML = options;
    els.exchangeToAccount.innerHTML = options;
    els.debtSettlementAccount.innerHTML = options;

    restoreSelectValue(els.account, currentAccount);
    restoreSelectValue(els.exchangeFromAccount, currentFrom);
    restoreSelectValue(els.exchangeToAccount, currentTo, state.accounts[1]?.id);
    restoreSelectValue(els.debtSettlementAccount, currentSettlementAccount);
  }

  function renderBalances() {
    const balances = calculateBalances();
    const totals = getCurrencyTotals(balances);
    const currencyCount = totals.length;

    els.accountsSummary.textContent = state.accounts.length
      ? `${state.accounts.length} рах. · ${currencyCount} валют`
      : "Додай картки, готівку або валютні рахунки";

    els.currencyStrip.innerHTML = totals.length
      ? totals.map(([currency, amount]) => renderCurrencyPill(currency, amount)).join("")
      : `<div class="empty-state">Поки немає рахунків</div>`;

    els.accountsList.innerHTML = state.accounts.length
      ? state.accounts.map((account) => renderAccountCard(account, balances[account.id] || 0)).join("")
      : `<div class="empty-state">Натисни “Додати рахунок”, щоб почати</div>`;
  }

  function renderBudgets() {
    const days = elapsedBudgetDays();
    const todayLimit = getDailyLimitForDate(todayKey());
    const dailyAccrued = calculateDailyAccruedBudget();
    const dailySpent = sumEntries(
      (entry) => isInBudgetPeriodByDate(getDailyBudgetDate(entry)) && getDailyBudgetAmount(entry) > 0,
      getDailyBudgetAmount,
    );
    const subsSpent = sumEntries(
      (entry) => isInBudgetPeriod(entry) && entry.type === "subscription",
      getEntryBudgetAmount,
    );
    const dailyRemaining = dailyAccrued - dailySpent;
    const subsRemaining = state.settings.subscriptionBudget - subsSpent;

    els.daysCount.textContent = days > 0 ? `День ${days}` : "До старту";
    els.dailyRemaining.textContent = formatMoney(dailyRemaining, BASE_CURRENCY);
    els.dailyAccrued.textContent = formatMoney(dailyAccrued, BASE_CURRENCY);
    els.dailySpent.textContent = formatMoney(dailySpent, BASE_CURRENCY);
    els.dailyRate.textContent = formatMoney(todayLimit, BASE_CURRENCY);
    els.subsRemaining.textContent = formatMoney(subsRemaining, BASE_CURRENCY);
    els.subsBudget.textContent = formatMoney(state.settings.subscriptionBudget, BASE_CURRENCY);
    els.subsSpent.textContent = formatMoney(subsSpent, BASE_CURRENCY);

    setProgress(els.dailyProgress, dailySpent, Math.max(dailyAccrued, todayLimit));
    setProgress(els.subsProgress, subsSpent, state.settings.subscriptionBudget);
  }

  function renderChart() {
    const series = buildExpenseSeries(activeChartRange);
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
      const x = left + (series.length === 1 ? 0 : (index / (series.length - 1)) * graphWidth);
      const y = top + graphHeight - (item.amount / max) * graphHeight;
      return { ...item, x, y };
    });
    const line = points.map((point) => `${point.x},${point.y}`).join(" ");
    const area = `${left},${top + graphHeight} ${line} ${left + graphWidth},${top + graphHeight}`;
    const bars = points
      .map((point) => {
        const barHeight = Math.max(2, top + graphHeight - point.y);
        const barWidth = Math.max(2, Math.min(16, graphWidth / series.length - 2));
        return `<rect x="${point.x - barWidth / 2}" y="${point.y}" width="${barWidth}" height="${barHeight}" rx="3"></rect>`;
      })
      .join("");

    const first = series[0]?.date || todayKey();
    const last = series[series.length - 1]?.date || todayKey();
    els.chartSummary.textContent = `${formatMoney(total, BASE_CURRENCY)} за ${chartRangeLabel(
      activeChartRange,
    )}`;

    els.expenseChart.innerHTML = `
      <defs>
        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f766e" stop-opacity="0.28"></stop>
          <stop offset="100%" stop-color="#0f766e" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
      <line class="chart-grid-line" x1="${left}" y1="${top + graphHeight}" x2="${
        left + graphWidth
      }" y2="${top + graphHeight}"></line>
      <polygon class="chart-area" points="${area}"></polygon>
      <g class="chart-bars">${bars}</g>
      <polyline class="chart-line" points="${line}"></polyline>
      <text class="chart-label" x="${left}" y="${height - 8}">${formatDateShort(first)}</text>
      <text class="chart-label chart-label--end" x="${left + graphWidth}" y="${
        height - 8
      }">${formatDateShort(last)}</text>
      <text class="chart-value" x="${left}" y="18">${formatMoney(rawMax, BASE_CURRENCY)}</text>
    `;
  }

  function renderFormHints() {
    const type = getSelectedType();
    const account = getAccount(els.account.value);
    const isExchange = type === "exchange";
    const isDebt = type === "debt";
    const meta = TYPE_META[type] || TYPE_META.expense;
    const debtMeta = DEBT_DIRECTION_META[getSelectedDebtDirection()] || DEBT_DIRECTION_META.to_me;

    els.normalFields.hidden = isExchange;
    els.exchangeFields.hidden = !isExchange;
    els.debtOptions.hidden = !isDebt;
    els.debtReceiptField.hidden = !isDebt;

    if (isExchange) {
      els.currencyBadge.textContent = "Обмін";
      renderExchangePreview();
      return;
    }

    els.detailLabel.textContent = isDebt ? debtMeta.detailLabel : meta.detailLabel;
    els.detail.placeholder = isDebt ? debtMeta.placeholder : meta.placeholder;
    els.currencyBadge.textContent = isDebt ? "Борг" : account?.currency || BASE_CURRENCY;

    const needsBudgetEquivalent =
      account &&
      account.currency !== BASE_CURRENCY &&
      (type === "expense" || type === "subscription");
    els.budgetEquivalentField.hidden = !needsBudgetEquivalent;
  }

  function renderSettingsForm() {
    els.settingStartDate.value = state.settings.startDate;
    els.settingDaily.value = formatInputNumber(getDailyLimitForDate(todayKey()));
    els.settingSubscriptions.value = formatInputNumber(state.settings.subscriptionBudget);
    els.settingsAccountsList.innerHTML = state.accounts.length
      ? state.accounts.map(renderSettingsAccountRow).join("")
      : `<div class="empty-state">Рахунків ще немає</div>`;
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

  function renderExchangePreview() {
    const fromAccount = getAccount(els.exchangeFromAccount.value);
    const toAccount = getAccount(els.exchangeToAccount.value);
    const fromAmount = parseAmount(els.exchangeFromAmount.value);
    const toAmount = parseAmount(els.exchangeToAmount.value);

    if (!fromAccount || !toAccount || !fromAmount || !toAmount) {
      els.exchangeRatePreview.textContent = "Курс зʼявиться після сум";
      return;
    }

    els.exchangeRatePreview.textContent = makeExchangeRateLabel(
      fromAmount,
      fromAccount.currency,
      toAmount,
      toAccount.currency,
    );
  }

  function renderEntry(entry) {
    if (entry.type === "exchange") return renderExchangeEntry(entry);
    if (entry.type === "debt") return renderDebtEntry(entry);

    const account = getAccount(entry.accountId);
    const meta = TYPE_META[entry.type] || TYPE_META.expense;
    const signedAmount = meta.sign * Number(entry.amount || 0);
    const amountClass = signedAmount >= 0 ? "is-positive" : "is-negative";
    const accountLabel = account?.name || "Рахунок видалено";
    const currency = entry.currency || account?.currency || BASE_CURRENCY;
    const budgetNote =
      entry.type !== "income" && currency !== BASE_CURRENCY
        ? ` · ліміт ${formatMoney(getEntryBudgetAmount(entry), BASE_CURRENCY)}`
        : "";

    return `
      <article class="entry-item is-${entry.type}">
        <span class="entry-mark" aria-hidden="true"></span>
        <div class="entry-main">
          <strong>${escapeHtml(entry.detail)}</strong>
          <span>${meta.label} · ${formatDateHuman(entry.date)} · ${escapeHtml(
            accountLabel,
          )}${budgetNote}</span>
        </div>
        <div class="entry-amount ${amountClass}">
          ${formatSignedMoney(signedAmount, currency)}
        </div>
        <button class="entry-delete" type="button" data-delete-id="${escapeHtml(
          entry.id,
        )}" aria-label="Видалити">×</button>
      </article>
    `;
  }

  function renderExchangeEntry(entry) {
    const fromAccount = getAccount(entry.fromAccountId);
    const toAccount = getAccount(entry.toAccountId);
    const fromCurrency = entry.fromCurrency || fromAccount?.currency || BASE_CURRENCY;
    const toCurrency = entry.toCurrency || toAccount?.currency || BASE_CURRENCY;
    const rateLabel = makeExchangeRateLabel(
      entry.fromAmount,
      fromCurrency,
      entry.toAmount,
      toCurrency,
    );

    return `
      <article class="entry-item is-exchange">
        <span class="entry-mark" aria-hidden="true"></span>
        <div class="entry-main">
          <strong>${escapeHtml(entry.detail || "Обмін валюти")}</strong>
          <span>${formatDateHuman(entry.date)} · ${escapeHtml(
            fromAccount?.name || "Рахунок",
          )} → ${escapeHtml(toAccount?.name || "Рахунок")} · ${rateLabel}</span>
        </div>
        <div class="entry-amount entry-amount--exchange">
          <span>-${formatMoney(entry.fromAmount, fromCurrency)}</span>
          <span>+${formatMoney(entry.toAmount, toCurrency)}</span>
        </div>
        <button class="entry-delete" type="button" data-delete-id="${escapeHtml(
          entry.id,
        )}" aria-label="Видалити">×</button>
      </article>
    `;
  }

  function renderDebtEntry(entry) {
    const account = getAccount(entry.accountId);
    const settlementAccount = getAccount(entry.settlementAccountId);
    const directionMeta =
      DEBT_DIRECTION_META[entry.debtDirection] || DEBT_DIRECTION_META.to_me;
    const isClosed = isDebtClosed(entry);
    const amount = Number(entry.amount || 0);
    const settlementAmount = Number(entry.settlementAmount || 0);
    const writeOffAmount = getDebtWriteOffAmount(entry);
    const remainingAmount = isClosed ? 0 : amount;
    const signedAmount = entry.debtDirection === "by_me" ? amount : -amount;
    const statusText = isClosed
      ? `Закрито · ${formatDateHuman(entry.settlementDate || entry.date)}`
      : `Відкрито · залишок ${formatMoney(remainingAmount, entry.currency)}`;
    const settlementText = isClosed
      ? ` · розрахунок ${formatMoney(settlementAmount, entry.currency)}${
          settlementAccount ? ` · ${escapeHtml(settlementAccount.name)}` : ""
        }`
      : "";
    const writeOffText = writeOffAmount
      ? `<span class="debt-status is-writeoff">Ліміт: -${formatMoney(
          writeOffAmount,
          BASE_CURRENCY,
        )}</span>`
      : "";
    const receipt = renderReceiptPreview(entry.receipt);
    const action = !isClosed
      ? `<button class="secondary-button debt-settle-button" type="button" data-settle-debt="${escapeHtml(
          entry.id,
        )}">Розрахувались</button>`
      : `<span class="debt-status is-closed">Закрито</span>`;

    return `
      <article class="entry-item is-debt ${
        isClosed ? "is-closed" : "is-open"
      }" data-debt-id="${escapeHtml(entry.id)}">
        <span class="entry-mark" aria-hidden="true"></span>
        <div class="entry-main">
          <strong>${escapeHtml(entry.detail)}</strong>
          <span>${directionMeta.label} · ${formatDateHuman(entry.date)} · ${escapeHtml(
            account?.name || "Рахунок видалено",
          )}${settlementText}</span>
        </div>
        <div class="entry-amount ${signedAmount >= 0 ? "is-positive" : "is-negative"}">
          ${formatSignedMoney(signedAmount, entry.currency)}
        </div>
        <button class="entry-delete" type="button" data-delete-id="${escapeHtml(
          entry.id,
        )}" aria-label="Видалити">×</button>
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
    return `<option value="${escapeHtml(account.id)}">${escapeHtml(account.name)} · ${escapeHtml(
      account.currency,
    )}</option>`;
  }

  function renderReceiptPreview(receipt) {
    if (!receipt?.dataUrl) return "";

    const name = receipt.name || "Фото чека";
    return `
      <a class="debt-receipt" href="${escapeAttribute(receipt.dataUrl)}" target="_blank" rel="noreferrer" aria-label="${escapeAttribute(
        name,
      )}">
        <img src="${escapeAttribute(receipt.dataUrl)}" alt="${escapeAttribute(name)}" />
      </a>
    `;
  }

  function renderCurrencyPill(currency, amount) {
    return `
      <article class="currency-pill">
        <span>${escapeHtml(currency)}</span>
        <strong>${formatMoney(amount, currency)}</strong>
      </article>
    `;
  }

  function renderAccountCard(account, balance) {
    return `
      <article class="account-card">
        <div>
          <span>${escapeHtml(ACCOUNT_KIND_LABELS[account.kind] || ACCOUNT_KIND_LABELS.other)}</span>
          <strong>${escapeHtml(account.name)}</strong>
        </div>
        <div>
          <b>${formatMoney(balance, account.currency)}</b>
          <small>Старт: ${formatMoney(account.initial, account.currency)}</small>
        </div>
      </article>
    `;
  }

  function renderSettingsAccountRow(account) {
    return `
      <article class="settings-account-row">
        <div>
          <strong>${escapeHtml(account.name)}</strong>
          <span>${escapeHtml(ACCOUNT_KIND_LABELS[account.kind] || ACCOUNT_KIND_LABELS.other)} · ${escapeHtml(
            account.currency,
          )}</span>
        </div>
        <label class="field">
          <span>Старт</span>
          <input data-account-initial="${escapeHtml(account.id)}" type="text" inputmode="decimal" value="${escapeHtml(
            formatInputNumber(account.initial),
          )}" />
        </label>
        <button class="entry-delete" type="button" data-delete-account="${escapeHtml(
          account.id,
        )}" aria-label="Видалити рахунок">×</button>
      </article>
    `;
  }

  function swapExchangeDirection() {
    const fromAccount = els.exchangeFromAccount.value;
    const toAccount = els.exchangeToAccount.value;
    const fromAmount = els.exchangeFromAmount.value;
    const toAmount = els.exchangeToAmount.value;

    els.exchangeFromAccount.value = toAccount;
    els.exchangeToAccount.value = fromAccount;
    els.exchangeFromAmount.value = toAmount;
    els.exchangeToAmount.value = fromAmount;
    renderExchangePreview();
  }

  function getBudgetAmountFromForm(type, account, amount) {
    if (type === "income") return 0;
    if (account.currency === BASE_CURRENCY) return amount;

    const budgetAmount = parseSettingAmount(els.entryBudgetAmount.value);
    if (!budgetAmount || budgetAmount <= 0) {
      showFormMessage("Для валютної витрати вкажи еквівалент у грн", true);
      return null;
    }

    return budgetAmount;
  }

  function calculateBalances() {
    const balances = Object.fromEntries(
      state.accounts.map((account) => [account.id, Number(account.initial) || 0]),
    );

    for (const entry of state.entries) {
      if (entry.type === "exchange") {
        if (balances[entry.fromAccountId] !== undefined) {
          balances[entry.fromAccountId] -= Number(entry.fromAmount || 0);
        }
        if (balances[entry.toAccountId] !== undefined) {
          balances[entry.toAccountId] += Number(entry.toAmount || 0);
        }
        continue;
      }

      if (entry.type === "debt") {
        applyDebtToBalances(entry, balances);
        continue;
      }

      const account = getAccount(entry.accountId);
      const meta = TYPE_META[entry.type];
      if (!account || !meta) continue;
      balances[account.id] = (balances[account.id] || 0) + meta.sign * Number(entry.amount || 0);
    }

    return balances;
  }

  function applyDebtToBalances(entry, balances) {
    const amount = Number(entry.amount || 0);
    const settlementAmount = isDebtClosed(entry) ? Number(entry.settlementAmount || 0) : 0;
    const account = getAccount(entry.accountId);
    const settlementAccount = getAccount(entry.settlementAccountId);

    if (account && balances[account.id] !== undefined) {
      balances[account.id] += entry.debtDirection === "by_me" ? amount : -amount;
    }

    if (settlementAccount && balances[settlementAccount.id] !== undefined) {
      balances[settlementAccount.id] +=
        entry.debtDirection === "by_me" ? -settlementAmount : settlementAmount;
    }
  }

  function getCurrencyTotals(balances) {
    const totals = new Map();
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

  function buildExpenseSeries(range) {
    const end = parseDateKey(todayKey());
    const byDate = new Map();
    const series = [];

    for (let index = range - 1; index >= 0; index -= 1) {
      const date = new Date(end);
      date.setDate(end.getDate() - index);
      const key = dateKeyFromDate(date);
      byDate.set(key, 0);
      series.push({ date: key, amount: 0 });
    }

    for (const entry of state.entries) {
      const amount = getChartBudgetAmount(entry);
      const date = getChartBudgetDate(entry);
      if (!amount || !byDate.has(date)) continue;
      byDate.set(date, byDate.get(date) + amount);
    }

    return series.map((item) => ({ ...item, amount: byDate.get(item.date) || 0 }));
  }

  function sumEntries(predicate, valueGetter) {
    return state.entries.reduce((total, entry) => {
      if (!predicate(entry)) return total;
      return total + valueGetter(entry);
    }, 0);
  }

  function getEntryBudgetAmount(entry) {
    const stored = Number(entry.budgetAmount);
    if (Number.isFinite(stored)) return stored;

    const account = getAccount(entry.accountId);
    if (account?.currency === BASE_CURRENCY) return Number(entry.amount || 0);
    return 0;
  }

  function getDailyBudgetAmount(entry) {
    if (entry.type === "expense") return getEntryBudgetAmount(entry);
    if (entry.type === "debt") return getDebtWriteOffAmount(entry);
    return 0;
  }

  function getDailyBudgetDate(entry) {
    if (entry.type === "debt") return entry.settlementDate || entry.date;
    return entry.date;
  }

  function getChartBudgetAmount(entry) {
    if (entry.type === "expense" || entry.type === "subscription") {
      return getEntryBudgetAmount(entry);
    }
    if (entry.type === "debt") return getDebtWriteOffAmount(entry);
    return 0;
  }

  function getChartBudgetDate(entry) {
    return entry.type === "debt" ? entry.settlementDate || entry.date : entry.date;
  }

  function getDebtWriteOffAmount(entry) {
    if (!isDebtClosed(entry)) return 0;

    const amount = Number(entry.amount || 0);
    const settlementAmount = Number(entry.settlementAmount || 0);
    const computed =
      entry.debtDirection === "by_me"
        ? Math.max(0, settlementAmount - amount)
        : Math.max(0, amount - settlementAmount);

    return roundMoney(coerceNumber(entry.writeOffBudgetAmount, computed));
  }

  function getSelectedType() {
    return document.querySelector('input[name="entry-type"]:checked')?.value || "expense";
  }

  function getSelectedDebtDirection() {
    return document.querySelector('input[name="debt-direction"]:checked')?.value || "to_me";
  }

  function getAccount(accountId) {
    return state.accounts.find((account) => account.id === accountId) || null;
  }

  function getDebtEntry(entryId) {
    return state.entries.find((entry) => entry.id === entryId && entry.type === "debt") || null;
  }

  function isDebtClosed(entry) {
    return entry?.type === "debt" && entry.status === "closed";
  }

  function accountHasEntries(accountId) {
    return state.entries.some(
      (entry) =>
        entry.accountId === accountId ||
        entry.settlementAccountId === accountId ||
        entry.fromAccountId === accountId ||
        entry.toAccountId === accountId,
    );
  }

  function commitState(message, messageTarget = "form") {
    state.version = APP_VERSION;
    state.updatedAt = new Date().toISOString();
    saveLocalState();
    render();

    if (messageTarget === "settings") {
      showSettingsMessage(message || "Збережено", false);
    } else {
      showFormMessage(message || "Збережено", false);
    }

    notifyTelegramSuccess();
    scheduleTelegramSync();
  }

  function createDefaultState() {
    const now = new Date().toISOString();
    return {
      version: APP_VERSION,
      settings: {
        startDate: todayKey(),
        dailyAllowance: DEFAULT_DAILY_ALLOWANCE,
        dailyLimits: [{ fromDate: todayKey(), amount: DEFAULT_DAILY_ALLOWANCE }],
        subscriptionBudget: 0,
      },
      accounts: [],
      entries: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  function normalizeState(input) {
    const fallback = createDefaultState();
    const source = input && typeof input === "object" ? input : {};

    if (isEmptyLegacyState(source)) return fallback;

    const migration = normalizeAccounts(source.accounts, source.entries);
    const settings = {
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
          .map((entry) => normalizeEntry(entry, migration.legacyMap, accountIds, accounts))
          .filter(Boolean)
      : [];

    return {
      ...fallback,
      ...source,
      version: APP_VERSION,
      settings,
      accounts,
      entries,
    };
  }

  function normalizeAccounts(accountsInput, entriesInput) {
    const legacyMap = {};

    if (Array.isArray(accountsInput)) {
      const accounts = accountsInput.map(normalizeAccount).filter(Boolean);
      return { accounts: dedupeAccounts(accounts), legacyMap };
    }

    if (!accountsInput || typeof accountsInput !== "object") {
      return { accounts: [], legacyMap };
    }

    const referenced = new Set(
      Array.isArray(entriesInput)
        ? entriesInput.map((entry) => entry.account).filter(Boolean)
        : [],
    );

    const accounts = Object.entries(accountsInput)
      .map(([legacyKey, account]) => {
        const initial = coerceNumber(account?.initial, 0);
        if (!referenced.has(legacyKey) && initial === 0) return null;

        const id = `acct_${legacyKey}`;
        legacyMap[legacyKey] = id;
        return {
          id,
          name: String(account?.label || LEGACY_ACCOUNT_LABELS[legacyKey] || legacyKey),
          kind: legacyKey.toLowerCase().includes("cash") ? "cash" : "card",
          currency: normalizeCurrency(account?.currency || BASE_CURRENCY),
          initial,
          createdAt: account?.createdAt || new Date().toISOString(),
        };
      })
      .filter(Boolean);

    return { accounts, legacyMap };
  }

  function normalizeAccount(account) {
    if (!account || typeof account !== "object") return null;
    const name = String(account.name || account.label || "").trim();
    const currency = normalizeCurrency(account.currency || BASE_CURRENCY);
    if (!name || !currency) return null;

    return {
      id: String(account.id || makeId("acct")),
      name,
      kind: ACCOUNT_KIND_LABELS[account.kind] ? account.kind : "other",
      currency,
      initial: coerceNumber(account.initial, 0),
      createdAt: account.createdAt || new Date().toISOString(),
    };
  }

  function normalizeReceipt(receipt) {
    if (!receipt || typeof receipt !== "object" || !String(receipt.dataUrl || "").startsWith("data:image/")) {
      return null;
    }

    return {
      name: String(receipt.name || "Фото чека"),
      type: String(receipt.type || "image/jpeg"),
      dataUrl: String(receipt.dataUrl),
      createdAt: receipt.createdAt || new Date().toISOString(),
    };
  }

  function normalizeEntry(entry, legacyMap, accountIds, accounts) {
    if (!entry || typeof entry !== "object") return null;

    if (entry.type === "debt") {
      const amount = Number(entry.amount);
      const accountId = String(entry.accountId || legacyMap[entry.account] || entry.account || "");
      const account = accounts.find((item) => item.id === accountId);
      const debtDirection = entry.debtDirection === "by_me" ? "by_me" : "to_me";
      const settlementAccountId = String(entry.settlementAccountId || "");
      const settlementAccount = accounts.find((item) => item.id === settlementAccountId);
      const settlementAmount = Math.max(0, coerceNumber(entry.settlementAmount, 0));
      const isClosed = entry.status === "closed";

      if (!account || !Number.isFinite(amount) || amount <= 0) return null;

      const normalized = {
        id: String(entry.id || makeId("debt")),
        type: "debt",
        debtDirection,
        accountId,
        amount: roundMoney(amount),
        currency: normalizeCurrency(entry.currency || account.currency),
        budgetAmount: 0,
        detail: String(entry.detail || "Борг"),
        date: isDateKey(entry.date) ? entry.date : todayKey(),
        status: isClosed ? "closed" : "open",
        receipt: normalizeReceipt(entry.receipt),
        createdAt: entry.createdAt || new Date().toISOString(),
      };

      if (isClosed) {
        normalized.settlementAmount = settlementAmount;
        normalized.settlementAccountId = settlementAccount?.id || accountId;
        normalized.settlementDate = isDateKey(entry.settlementDate) ? entry.settlementDate : todayKey();
        normalized.writeOffBudgetAmount = Math.max(
          0,
          coerceNumber(entry.writeOffBudgetAmount, getDebtWriteOffAmount(normalized)),
        );
        normalized.settledAt = entry.settledAt || entry.updatedAt || new Date().toISOString();
      }

      return normalized;
    }

    if (entry.type === "exchange") {
      const fromAccountId = String(entry.fromAccountId || "");
      const toAccountId = String(entry.toAccountId || "");
      const fromAmount = Number(entry.fromAmount);
      const toAmount = Number(entry.toAmount);
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
        id: String(entry.id || makeId("exchange")),
        type: "exchange",
        fromAccountId,
        toAccountId,
        fromAmount: roundMoney(fromAmount),
        toAmount: roundMoney(toAmount),
        fromCurrency: normalizeCurrency(entry.fromCurrency || fromAccount?.currency || BASE_CURRENCY),
        toCurrency: normalizeCurrency(entry.toCurrency || toAccount?.currency || BASE_CURRENCY),
        detail: String(entry.detail || "Обмін валюти"),
        date: isDateKey(entry.date) ? entry.date : todayKey(),
        createdAt: entry.createdAt || new Date().toISOString(),
      };
    }

    const amount = Number(entry.amount);
    const type = TYPE_META[entry.type] && entry.type !== "exchange" ? entry.type : "expense";
    const accountId = String(entry.accountId || legacyMap[entry.account] || entry.account || "");
    const account = accounts.find((item) => item.id === accountId);

    if (!account || !Number.isFinite(amount) || amount <= 0) return null;

    const fallbackBudget =
      account.currency === BASE_CURRENCY && (type === "expense" || type === "subscription")
        ? amount
        : 0;

    return {
      id: String(entry.id || makeId("entry")),
      type,
      accountId,
      amount: roundMoney(amount),
      currency: normalizeCurrency(entry.currency || account.currency),
      budgetAmount: Math.max(0, coerceNumber(entry.budgetAmount, fallbackBudget)),
      detail: String(entry.detail || "Без опису"),
      date: isDateKey(entry.date) ? entry.date : todayKey(),
      createdAt: entry.createdAt || new Date().toISOString(),
    };
  }

  function isEmptyLegacyState(source) {
    if (!source || Number(source.version || 1) >= APP_VERSION) return false;
    const entries = Array.isArray(source.entries) ? source.entries : [];
    if (entries.length > 0) return false;

    if (Array.isArray(source.accounts)) return source.accounts.length === 0;
    if (!source.accounts || typeof source.accounts !== "object") return true;

    return Object.values(source.accounts).every(
      (account) => coerceNumber(account?.initial, 0) === 0,
    );
  }

  function dedupeAccounts(accounts) {
    const seen = new Set();
    return accounts.map((account) => {
      let id = account.id;
      while (seen.has(id)) id = makeId("acct");
      seen.add(id);
      return { ...account, id };
    });
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
    const results = await Promise.allSettled(
      jobs.map((job) => withTimeout(job, SYNC_TIMEOUT_MS, false)),
    );
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
      const parsed = parseJson(String(reader.result));
      if (!parsed) {
        showFormMessage("Файл backup не вдалося прочитати", true);
        return;
      }

      const imported = normalizeState(parsed);
      const ok = await confirmAction("Замінити поточні дані імпортом?");
      if (!ok) return;

      state = imported;
      commitState("Імпортовано");
      els.importFile.value = "";
    };
    reader.readAsText(file);
  }

  function openSettingsModal() {
    renderSettingsForm();
    els.settingsMessage.textContent = "";
    els.settingsModal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => els.settingStartDate.focus(), 40);
  }

  function closeSettingsModal() {
    els.settingsModal.hidden = true;
    if (els.debtModal.hidden) document.body.classList.remove("modal-open");
  }

  function openDebtModal(debtId) {
    const debt = getDebtEntry(debtId);
    if (!debt) return;

    if (isDebtClosed(debt)) {
      showFormMessage("Цей борг вже закрито", false);
      return;
    }

    if (!state.accounts.length) {
      showFormMessage("Спочатку додай рахунок для розрахунку", true);
      return;
    }

    const meta = DEBT_DIRECTION_META[debt.debtDirection] || DEBT_DIRECTION_META.to_me;
    const account = getAccount(debt.accountId);

    activeDebtId = debt.id;
    els.debtModalTitle.textContent =
      debt.debtDirection === "by_me" ? "Я розрахувався" : "Зі мною розрахувались";
    els.debtModalSummary.textContent = `${meta.label}: ${formatMoney(
      debt.amount,
      debt.currency,
    )} · ${debt.detail} · ${account?.name || "Рахунок видалено"}`;
    els.debtSettlementAmountLabel.textContent = meta.amountLabel;
    els.debtSettlementAmount.value = formatInputNumber(debt.amount);
    els.debtSettlementDate.value = todayKey();
    els.debtSettlementNote.textContent = meta.modalNote;
    els.debtSettlementMessage.textContent = "";
    els.debtSettlementMessage.classList.remove("is-error");
    renderAccountSelectors();
    restoreSelectValue(els.debtSettlementAccount, debt.accountId, state.accounts[0]?.id);

    els.debtModal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => els.debtSettlementAmount.focus(), 40);
  }

  function closeDebtModal() {
    activeDebtId = "";
    els.debtModal.hidden = true;
    if (els.settingsModal.hidden) document.body.classList.remove("modal-open");
  }

  function renderDebtReceiptName() {
    const file = els.debtReceipt.files?.[0];
    els.debtReceiptName.textContent = file
      ? `Обрано: ${file.name}`
      : "Можна додати фото або скрін чека";
  }

  async function readDebtReceipt() {
    const file = els.debtReceipt.files?.[0];
    if (!file) return null;

    if (!file.type.startsWith("image/")) {
      showFormMessage("Чек має бути зображенням", true);
      return false;
    }

    try {
      return await compressReceiptFile(file);
    } catch {
      showFormMessage("Фото чека не вдалося прочитати", true);
      return false;
    }
  }

  async function compressReceiptFile(file) {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    const scale = Math.min(1, RECEIPT_MAX_SIZE / Math.max(naturalWidth, naturalHeight));
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(image, 0, 0, width, height);

    return {
      name: file.name,
      type: "image/jpeg",
      dataUrl: canvas.toDataURL("image/jpeg", RECEIPT_QUALITY),
      createdAt: new Date().toISOString(),
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

  function calculateDailyAccruedBudget() {
    const start = parseDateKey(state.settings.startDate);
    const today = parseDateKey(todayKey());
    if (today < start) return 0;

    let total = 0;
    const cursor = new Date(start);

    while (cursor <= today) {
      total += getDailyLimitForDate(dateKeyFromDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return roundMoney(total);
  }

  function getDailyLimitForDate(dateKey) {
    return getDailyLimitFromList(
      state.settings.dailyLimits,
      dateKey,
      state.settings.dailyAllowance || DEFAULT_DAILY_ALLOWANCE,
    );
  }

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

  function setDailyLimitForDate(fromDate, amount) {
    const changeDate = isDateKey(fromDate) ? fromDate : todayKey();
    const cleanAmount = Math.max(0, coerceNumber(amount, DEFAULT_DAILY_ALLOWANCE));
    const withoutSameDate = normalizeDailyLimits(
      state.settings.dailyLimits,
      state.settings.startDate,
      state.settings.dailyAllowance,
    ).filter((limit) => limit.fromDate !== changeDate);

    withoutSameDate.push({ fromDate: changeDate, amount: cleanAmount });
    state.settings.dailyLimits = compactDailyLimits(withoutSameDate);
    state.settings.dailyAllowance = getDailyLimitForDate(todayKey());
  }

  function getDailyLimitChangeDate() {
    const today = todayKey();
    return today < state.settings.startDate ? state.settings.startDate : today;
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

    return input
      .map((limit) => ({
        fromDate: isDateKey(limit?.fromDate) ? limit.fromDate : "",
        amount: Math.max(0, coerceNumber(limit?.amount, 0)),
      }))
      .filter((limit) => limit.fromDate)
      .sort((a, b) => a.fromDate.localeCompare(b.fromDate));
  }

  function compactDailyLimits(input) {
    const byDate = new Map();
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
    return normalized.length
      ? normalized[normalized.length - 1].amount
      : Math.max(0, coerceNumber(fallbackAmount, DEFAULT_DAILY_ALLOWANCE));
  }

  function isInBudgetPeriod(entry) {
    return String(entry.date) >= String(state.settings.startDate);
  }

  function isInBudgetPeriodByDate(dateKey) {
    return String(dateKey || "") >= String(state.settings.startDate);
  }

  function setProgress(element, spent, total) {
    const percent = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
    element.style.width = `${Math.max(percent, 0)}%`;
    element.classList.toggle("is-over", spent > total);
  }

  function restoreSelectValue(select, preferredValue, fallbackValue) {
    const values = [...select.options].map((option) => option.value);
    if (values.includes(preferredValue)) {
      select.value = preferredValue;
      return;
    }
    if (fallbackValue && values.includes(fallbackValue)) {
      select.value = fallbackValue;
    }
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

  function coerceNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? roundMoney(number) : fallback;
  }

  function roundMoney(value) {
    return Math.round(value * 100) / 100;
  }

  function formatInputNumber(value) {
    const number = coerceNumber(value, 0);
    return Number.isInteger(number) ? String(number) : String(number).replace(".", ",");
  }

  function formatMoney(value, currency) {
    const normalizedCurrency = normalizeCurrency(currency) || BASE_CURRENCY;

    try {
      return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: normalizedCurrency,
        maximumFractionDigits: 2,
      })
        .format(value)
        .replace(",00", "");
    } catch {
      return `${new Intl.NumberFormat("uk-UA", {
        maximumFractionDigits: 2,
      }).format(value)} ${normalizedCurrency}`;
    }
  }

  function formatSignedMoney(value, currency) {
    const sign = value > 0 ? "+" : "";
    return `${sign}${formatMoney(value, currency)}`;
  }

  function makeExchangeRateLabel(fromAmount, fromCurrency, toAmount, toCurrency) {
    if (!fromAmount || !toAmount) return "Курс не пораховано";

    if (fromCurrency === BASE_CURRENCY && toCurrency !== BASE_CURRENCY) {
      return `1 ${toCurrency} = ${formatPlainNumber(fromAmount / toAmount)} ${BASE_CURRENCY}`;
    }

    if (toCurrency === BASE_CURRENCY && fromCurrency !== BASE_CURRENCY) {
      return `1 ${fromCurrency} = ${formatPlainNumber(toAmount / fromAmount)} ${BASE_CURRENCY}`;
    }

    return `1 ${fromCurrency} = ${formatPlainNumber(toAmount / fromAmount)} ${toCurrency}`;
  }

  function formatPlainNumber(value) {
    return new Intl.NumberFormat("uk-UA", {
      maximumFractionDigits: 4,
    }).format(value);
  }

  function chartRangeLabel(range) {
    if (range === 7) return "тиждень";
    if (range === 30) return "місяць";
    return "пів року";
  }

  function formatDateHuman(dateKey) {
    return new Intl.DateTimeFormat("uk-UA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parseDateKey(dateKey));
  }

  function formatDateShort(dateKey) {
    return new Intl.DateTimeFormat("uk-UA", {
      day: "2-digit",
      month: "2-digit",
    }).format(parseDateKey(dateKey));
  }

  function todayKey() {
    return dateKeyFromDate(new Date());
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
    const time = Date.parse(value || "");
    return Number.isFinite(time) ? time : 0;
  }

  function normalizeCurrency(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
  }

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

      Promise.resolve(promise)
        .then((value) => {
          window.clearTimeout(timer);
          finish(value);
        })
        .catch(() => {
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

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function showFormMessage(message, isError) {
    els.formMessage.textContent = message;
    els.formMessage.classList.toggle("is-error", Boolean(isError));
  }

  function showSettingsMessage(message, isError) {
    els.settingsMessage.textContent = message;
    els.settingsMessage.classList.toggle("is-error", Boolean(isError));
  }

  function showDebtSettlementMessage(message, isError) {
    els.debtSettlementMessage.textContent = message;
    els.debtSettlementMessage.classList.toggle("is-error", Boolean(isError));
  }

  function setSyncStatus(message, tone) {
    els.syncStatus.textContent = message;
    els.syncStatus.classList.toggle("is-ok", tone === "ok");
    els.syncStatus.classList.toggle("is-warn", tone === "warn");
  }

  function notifyTelegramSuccess() {
    if (!canUseTelegramNestedMethod(tg?.HapticFeedback, "notificationOccurred", "6.1")) return;

    try {
      tg.HapticFeedback.notificationOccurred("success");
    } catch {
      // Older Telegram WebViews may expose methods before they are actually usable.
    }
  }

  function confirmAction(message) {
    return new Promise((resolve) => {
      if (canUseTelegramMethod("showConfirm", "6.2")) {
        try {
          tg.showConfirm(message, resolve);
          return;
        } catch {
          resolve(window.confirm(message));
          return;
        }
      }

      resolve(window.confirm(message));
    });
  }

  function callTelegramMethod(methodName, minVersion, ...args) {
    if (!canUseTelegramMethod(methodName, minVersion)) return false;

    try {
      tg[methodName](...args);
      return true;
    } catch {
      return false;
    }
  }

  function canUseTelegramMethod(methodName, minVersion) {
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

  function canUseTelegramNestedMethod(target, methodName, minVersion) {
    if (!target || typeof target[methodName] !== "function") return false;

    if (minVersion && typeof tg?.isVersionAtLeast === "function") {
      try {
        return tg.isVersionAtLeast(minVersion);
      } catch {
        return false;
      }
    }

    return true;
  }
})();
