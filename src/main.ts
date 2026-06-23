import { ACCOUNT_KIND_LABELS, APP_VERSION, BASE_CURRENCY, DEBT_DIRECTION_META, DEFAULT_DAILY_ALLOWANCE, TYPE_META } from "./constants";
import {
  buildExpenseSeries,
  calculateBalances,
  calculateDailyAccruedBudget,
  elapsedBudgetDays,
  findAccount,
  getCleanDailyLimitAmount,
  getCurrencyTotals,
  getDailyBudgetAmount,
  getDailyBudgetDate,
  getDailyLimitForDate,
  getEntryBudgetAmount,
  isInBudgetPeriodByDate,
  sortedEntries,
  sumEntries,
} from "./domain/calculations";
import {
  getDebtBudgetEvents,
  getDebtRemainingAmount,
  getDebtSettlementTotal,
  getDebtSettlements,
  getDebtWriteOffAmount,
  isDebtClosed,
} from "./domain/debt";
import { compressReceiptFile } from "./infrastructure/receipts";
import {
  loadCloudState,
  loadDeviceState,
  loadLocalState,
  parseJson,
  saveLocalState,
  syncTelegramStores,
} from "./infrastructure/storage";
import {
  confirmAction,
  getTelegramContext,
  initTelegramShell,
  notifyTelegramSuccess,
  type TelegramContext,
} from "./infrastructure/telegram";
import { normalizeLanguage, tText, translateDocument, type Language } from "./i18n";
import { createDefaultState } from "./state/defaultState";
import { compactDailyLimits, normalizeDailyLimits } from "./state/dailyLimits";
import { normalizeState } from "./state/normalize";
import type {
  Account,
  AppState,
  DebtDirection,
  Entry,
  EntryType,
  Receipt,
  TurnoverInvestor,
  TurnoverParticipant,
  TurnoverProject,
} from "./types";
import { getAppElements, type AppElements } from "./ui/elements";
import { restoreSelectValue, setProgress } from "./ui/dom";
import {
  renderAccountCard,
  renderAccountOption,
  renderCurrencyPill,
  renderEntry,
  renderSettingsAccountRow,
} from "./ui/templates";
import { makeId } from "./utils/async";
import { dateValue, isDateKey, todayKey } from "./utils/date";
import {
  chartRangeLabel,
  formatDateHuman,
  formatDateShort,
  formatInputNumber,
  formatMoney,
  makeExchangeRateLabel,
  makeFuelDetail,
} from "./utils/format";
import { parseAmount, parseSettingAmount, roundMoney } from "./utils/number";
import { escapeAttribute, escapeHtml, normalizeCurrency, normalizeFuelType } from "./utils/sanitize";

type ActiveFilter = "all" | EntryType;
type AppTab = "home" | "accounts" | "analytics" | "turnover" | "settings";

const HISTORY_PAGE_SIZE = 10;

interface SettingsFormInput {
  startDate: string;
  dailyAllowance: number;
  subscriptionBudget: number;
  dailyLimitEnabled: boolean;
}

interface FuelFields {
  fuelType: string;
  fuelLiters: number;
  budgetAmount: number;
}

interface DebtSettlementInput {
  accountId: string;
  amount: number;
  note?: string;
}

class NationalDebtApp {
  private state: AppState = createDefaultState();
  private activeFilter: ActiveFilter = "all";
  private activeTab: AppTab = "home";
  private activeChartRange = 7;
  private activeDebtId = "";
  private historyPage = 1;
  private syncTimer = 0;
  private readonly els: AppElements;
  private readonly telegram: TelegramContext;

  constructor() {
    this.els = getAppElements();
    this.telegram = getTelegramContext();
  }

  private get language(): Language {
    return normalizeLanguage(this.state.settings.language);
  }

  private tr(text: string, values: Record<string, string | number> = {}): string {
    return tText(this.language, text, values);
  }

  boot(): void {
    initTelegramShell(this.telegram);
    this.bindEvents();
    this.els.date.value = todayKey();
    this.els.exchangeDate.value = todayKey();
    this.els.debtSettlementDate.value = todayKey();
    this.els.turnoverCurrency.value = BASE_CURRENCY;
    this.render();
    void this.loadPersistedState();
  }

  private bindEvents(): void {
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
      button.addEventListener("click", () =>
        this.switchTab((button.dataset.tabTarget || "home") as AppTab),
      );
    });

    this.els.form.addEventListener("submit", (event) => void this.handleSubmit(event));
    this.els.debtSettlementForm.addEventListener("submit", (event) =>
      this.handleDebtSettlementSubmit(event),
    );
    this.els.settingsForm.addEventListener("submit", (event) => this.handleSettingsSubmit(event));
    this.els.turnoverForm.addEventListener("submit", (event) => this.handleTurnoverSubmit(event));
    this.els.turnoverCopySummary.addEventListener("click", () =>
      void this.copyTurnoverSummary(),
    );
    this.els.preferencesForm.addEventListener("submit", (event) =>
      this.handlePreferencesSubmit(event),
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

    document.querySelectorAll<HTMLInputElement>('input[name="entry-type"]').forEach((input) => {
      input.addEventListener("change", () => this.renderFormHints());
    });
    document.querySelectorAll<HTMLInputElement>('input[name="debt-direction"]').forEach((input) => {
      input.addEventListener("change", () => this.renderFormHints());
    });

    this.els.filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.activeFilter = (button.dataset.filter || "all") as ActiveFilter;
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
      (event) => void this.handleSettingsAccountsClick(event),
    );
    this.els.turnoverList.addEventListener("change", (event) =>
      this.handleTurnoverListChange(event),
    );
    this.els.turnoverList.addEventListener("click", (event) =>
      void this.handleTurnoverListClick(event),
    );

    this.els.exportButton.addEventListener("click", () => this.exportState());
    this.els.importButton.addEventListener("click", () => this.els.importFile.click());
    this.els.importFile.addEventListener("change", (event) => void this.importState(event));
  }

  private switchTab(tab: AppTab): void {
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

  private async loadPersistedState(): Promise<void> {
    this.setSyncStatus("Завантаження...", "warn");

    const localState = loadLocalState();
    const [deviceState, cloudState] = await Promise.all([
      loadDeviceState(this.telegram.deviceStorage),
      loadCloudState(this.telegram.cloudStorage),
    ]);

    const bestState = [localState, deviceState, cloudState]
      .filter((item): item is AppState => Boolean(item))
      .sort((a, b) => dateValue(b.updatedAt) - dateValue(a.updatedAt))[0];

    this.state = normalizeState(bestState || createDefaultState());
    if (!saveLocalState(this.state)) this.setSyncStatus("Локальне сховище недоступне", "warn");
    this.render();
    this.scheduleTelegramSync(20);
  }

  private async handleSubmit(event: SubmitEvent): Promise<void> {
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
    let fuelData: FuelFields | null = null;

    if (!account) {
      this.showFormMessage("Спочатку додай рахунок", true);
      return;
    }

    if (!amount || amount <= 0) {
      this.showFormMessage("Вкажи суму більше нуля", true);
      return;
    }

    if (!detail && type !== "fuel") {
      this.showFormMessage(type === "income" ? "Вкажи звідки кошти" : "Вкажи деталі", true);
      return;
    }

    if (type === "fuel") {
      fuelData = this.readFuelFields();
      if (!fuelData) return;
    }

    const budgetAmount = this.getBudgetAmountFromForm(type, account, amount);
    if (budgetAmount === null) return;
    const entryDetail =
      type === "fuel" && !detail
        ? makeFuelDetail(fuelData?.fuelType, fuelData?.fuelLiters || 0, this.language)
        : detail;

    this.state.entries.push({
      id: makeId("entry"),
      type,
      accountId: account.id,
      amount,
      currency: account.currency,
      budgetAmount,
      detail: entryDetail,
      ...(fuelData || {}),
      date,
      createdAt: new Date().toISOString(),
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
    this.commitState("Збережено");
  }

  private handleExchangeSubmit(): void {
    const fromAccount = this.getAccount(this.els.exchangeFromAccount.value);
    const toAccount = this.getAccount(this.els.exchangeToAccount.value);
    const fromAmount = parseAmount(this.els.exchangeFromAmount.value);
    const toAmount = parseAmount(this.els.exchangeToAmount.value);
    const date = this.els.exchangeDate.value || todayKey();
    const detail = this.els.exchangeDetail.value.trim();

    if (!fromAccount || !toAccount) {
      this.showFormMessage("Обери рахунки для обміну", true);
      return;
    }

    if (fromAccount.id === toAccount.id) {
      this.showFormMessage("Рахунки мають бути різні", true);
      return;
    }

    if (!fromAmount || !toAmount || fromAmount <= 0 || toAmount <= 0) {
      this.showFormMessage("Вкажи скільки віддав і скільки отримав", true);
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
      detail: detail || `Обмін ${fromAccount.name} → ${toAccount.name}`,
      date,
      createdAt: new Date().toISOString(),
    });

    this.els.exchangeFromAmount.value = "";
    this.els.exchangeToAmount.value = "";
    this.els.exchangeDetail.value = "";
    this.els.exchangeDate.value = todayKey();
    this.renderExchangePreview();
    this.historyPage = 1;
    this.commitState("Обмін збережено");
  }

  private async handleDebtSubmit(): Promise<void> {
    const account = this.getAccount(this.els.account.value);
    const amount = parseAmount(this.els.amount.value);
    const detail = this.els.detail.value.trim();
    const date = this.els.date.value || todayKey();
    const debtDirection = this.getSelectedDebtDirection();

    if (!account) {
      this.showFormMessage("Спочатку додай рахунок", true);
      return;
    }

    if (!amount || amount <= 0) {
      this.showFormMessage("Вкажи суму боргу більше нуля", true);
      return;
    }

    if (!detail) {
      this.showFormMessage("Вкажи хто і за що винен", true);
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
      createdAt: new Date().toISOString(),
    });

    this.els.amount.value = "";
    this.els.entryBudgetAmount.value = "";
    this.els.detail.value = "";
    this.els.debtReceipt.value = "";
    this.renderDebtReceiptName();
    this.els.date.value = todayKey();
    this.historyPage = 1;
    this.commitState("Борг збережено");
  }

  private handleDebtSettlementSubmit(event: SubmitEvent): void {
    event.preventDefault();

    const debt = this.getDebtEntry(this.activeDebtId);
    const settlementDate = this.els.debtSettlementDate.value || todayKey();
    const shouldClose = this.els.debtCloseToggle.checked;

    if (!debt || isDebtClosed(debt)) {
      this.showDebtSettlementMessage("Цей борг вже закрито", true);
      return;
    }

    if (!isDateKey(settlementDate)) {
      this.showDebtSettlementMessage("Вкажи дату розрахунку", true);
      return;
    }

    const settlements = this.readDebtSettlementRows(debt);
    if (!settlements) return;

    if (!settlements.length && !shouldClose) {
      this.showDebtSettlementMessage("Вкажи суму або познач борг закритим", true);
      return;
    }

    const createdAt = new Date().toISOString();
    debt.debtSettlements = [
      ...getDebtSettlements(debt),
      ...settlements.map((settlement) => ({
        ...settlement,
        date: settlementDate,
        createdAt,
      })),
    ];
    debt.settlementAmount = getDebtSettlementTotal(debt);
    debt.settlementAccountId = debt.debtSettlements[0]?.accountId;
    debt.settlementDate = settlementDate;
    debt.status = shouldClose ? "closed" : "open";
    debt.writeOffBudgetAmount = shouldClose ? getDebtWriteOffAmount(debt) : 0;
    debt.settledAt = shouldClose ? createdAt : undefined;
    debt.updatedAt = createdAt;

    this.closeDebtModal();
    this.commitState(shouldClose ? "Борг закрито" : "Розрахунок збережено");
  }

  private handleSettingsSubmit(event: SubmitEvent): void {
    event.preventDefault();

    const settings = this.readSettingsFields();
    if (!settings) return;

    const initials = this.readAccountInitialInputs();
    if (!initials) return;

    this.applySettings(settings);
    this.state.accounts = this.state.accounts.map((account) => ({
      ...account,
      initial: initials[account.id] ?? account.initial,
    }));

    this.commitState("Налаштування збережено", "settings");
  }

  private handlePreferencesSubmit(event: SubmitEvent): void {
    event.preventDefault();

    this.state.settings.language = normalizeLanguage(this.els.appLanguage.value);
    this.commitState("Налаштування збережено", "preferences");
  }

  private handleTurnoverSubmit(event: SubmitEvent): void {
    event.preventDefault();

    const title = this.els.turnoverTitle.value.trim();
    const targetAmount = parseSettingAmount(this.els.turnoverTarget.value);
    const currency = normalizeCurrency(this.els.turnoverCurrency.value || BASE_CURRENCY);
    const names = this.parseNameList(this.els.turnoverPeople.value);

    if (!title) {
      this.showTurnoverMessage("Вкажи назву пропозиції", true);
      return;
    }

    if (!targetAmount || targetAmount <= 0) {
      this.showTurnoverMessage("Вкажи потрібну суму більше нуля", true);
      return;
    }

    if (!currency) {
      this.showTurnoverMessage("Вкажи валюту", true);
      return;
    }

    if (!names.length) {
      this.showTurnoverMessage("Додай хоча б одну людину", true);
      return;
    }

    this.state.turnoverProjects.unshift({
      id: makeId("turnover"),
      title,
      targetAmount: roundMoney(targetAmount),
      currency,
      participants: this.makeTurnoverParticipants(names),
      investors: [],
      createdAt: new Date().toISOString(),
    });

    this.els.turnoverTitle.value = "";
    this.els.turnoverTarget.value = "";
    this.els.turnoverCurrency.value = BASE_CURRENCY;
    this.els.turnoverPeople.value = "";
    this.commitState("Пропозицію створено", "turnover");
  }

  private handleAddAccount(): void {
    const settings = this.readSettingsFields();
    if (!settings) return;

    const initials = this.readAccountInitialInputs();
    if (!initials) return;

    const name = this.els.accountName.value.trim();
    const kind = this.els.accountKind.value;
    const currency = normalizeCurrency(this.els.accountCurrency.value || BASE_CURRENCY);
    const initial = parseSettingAmount(this.els.accountInitial.value);

    if (!name) {
      this.showSettingsMessage("Вкажи назву рахунку", true);
      return;
    }

    if (!currency) {
      this.showSettingsMessage("Вкажи валюту рахунку", true);
      return;
    }

    if (initial === null) {
      this.showSettingsMessage("Стартовий баланс має бути числом", true);
      return;
    }

    this.applySettings(settings);
    this.state.accounts = this.state.accounts.map((account) => ({
      ...account,
      initial: initials[account.id] ?? account.initial,
    }));
    this.state.accounts.push({
      id: makeId("acct"),
      name,
      kind: ACCOUNT_KIND_LABELS[kind as keyof typeof ACCOUNT_KIND_LABELS] ? (kind as Account["kind"]) : "other",
      currency,
      initial,
      createdAt: new Date().toISOString(),
    });

    this.els.accountName.value = "";
    this.els.accountCurrency.value = BASE_CURRENCY;
    this.els.accountInitial.value = "";
    this.commitState("Рахунок додано", "settings");
  }

  private readSettingsFields(): SettingsFormInput | null {
    const startDate = this.els.settingStartDate.value || todayKey();
    const dailyAllowance = parseSettingAmount(this.els.settingDaily.value);
    const subscriptionBudget = parseSettingAmount(this.els.settingSubscriptions.value);
    const dailyLimitEnabled = this.els.settingDailyEnabled.checked;

    if (!isDateKey(startDate)) {
      this.showSettingsMessage("Вкажи дату старту", true);
      return null;
    }

    if (dailyAllowance === null || subscriptionBudget === null) {
      this.showSettingsMessage("У сумах мають бути тільки числа", true);
      return null;
    }

    if (dailyAllowance < 0 || subscriptionBudget < 0) {
      this.showSettingsMessage("Бюджети не можуть бути мінусовими", true);
      return null;
    }

    return { startDate, dailyAllowance, subscriptionBudget, dailyLimitEnabled };
  }

  private readAccountInitialInputs(): Record<string, number> | null {
    const values: Record<string, number> = {};
    const inputs = this.els.settingsAccountsList.querySelectorAll<HTMLInputElement>(
      "[data-account-initial]",
    );

    for (const input of inputs) {
      const value = parseSettingAmount(input.value);
      if (value === null) {
        this.showSettingsMessage("Стартові баланси мають бути числами", true);
        return null;
      }
      values[input.dataset.accountInitial || ""] = value;
    }

    return values;
  }

  private applySettings(settings: SettingsFormInput): void {
    const previousDailyLimit = getDailyLimitForDate(this.state.settings, todayKey());

    this.state.settings.startDate = settings.startDate;
    this.state.settings.subscriptionBudget = settings.subscriptionBudget;
    this.state.settings.dailyLimitEnabled = settings.dailyLimitEnabled;
    this.state.settings.dailyLimits = normalizeDailyLimits(
      this.state.settings.dailyLimits,
      this.state.settings.startDate,
      previousDailyLimit,
    );
    this.setDailyLimitForDate(this.getDailyLimitChangeDate(), settings.dailyAllowance);
  }

  private render(): void {
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

  private renderHeader(): void {
    this.els.startLine.textContent = `${this.tr("Старт")}: ${formatDateHuman(
      this.state.settings.startDate,
      this.language,
    )}`;
  }

  private renderAccountSelectors(): void {
    const options = this.state.accounts.length
      ? this.state.accounts.map(renderAccountOption).join("")
      : `<option value="">${this.tr("Додай рахунок у налаштуваннях")}</option>`;

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

  private renderBalances(): void {
    const balances = calculateBalances(this.state);
    const totals = getCurrencyTotals(this.state, balances);
    const currencyCount = totals.length;

    this.els.accountsSummary.textContent = this.state.accounts.length
      ? this.tr("{accounts} рах. · {currencies} валют", {
          accounts: this.state.accounts.length,
          currencies: currencyCount,
        })
      : this.tr("Додай картки, готівку або валютні рахунки");

    this.els.currencyStrip.innerHTML = totals.length
      ? totals
          .map(([currency, amount]) => renderCurrencyPill(currency, amount, this.language))
          .join("")
      : `<div class="empty-state">${this.tr("Поки немає рахунків")}</div>`;

    this.els.accountsList.innerHTML = this.state.accounts.length
      ? this.state.accounts
          .map((account) => renderAccountCard(account, balances[account.id] || 0, this.language))
          .join("")
      : `<div class="empty-state">${this.tr("Натисни “Додати рахунок”, щоб почати")}</div>`;
  }

  private renderBudgets(): void {
    const days = elapsedBudgetDays(this.state.settings);
    const todayLimit = getDailyLimitForDate(this.state.settings, todayKey());
    const dailyAccrued = calculateDailyAccruedBudget(this.state.settings);
    const dailySpent = sumEntries(
      this.state,
      (entry) => {
        if (entry.type === "debt") {
          return getDebtBudgetEvents(entry).some((event) =>
            isInBudgetPeriodByDate(this.state.settings, event.date),
          );
        }

        return (
          isInBudgetPeriodByDate(this.state.settings, getDailyBudgetDate(entry)) &&
          getDailyBudgetAmount(this.state, entry) > 0
        );
      },
      (entry) => {
        if (entry.type === "debt") {
          return getDebtBudgetEvents(entry)
            .filter((event) => isInBudgetPeriodByDate(this.state.settings, event.date))
            .reduce((total, event) => total + event.amount, 0);
        }

        return getDailyBudgetAmount(this.state, entry);
      },
    );
    const subsSpent = sumEntries(
      this.state,
      (entry) => entry.type === "subscription" && this.isInCurrentMonth(entry.date),
      (entry) => getEntryBudgetAmount(this.state, entry),
    );
    const dailyRemaining = dailyAccrued - dailySpent;
    const subsRemaining = this.state.settings.subscriptionBudget - subsSpent;
    const dailyLimitEnabled = this.state.settings.dailyLimitEnabled;

    this.els.daysCount.textContent = dailyLimitEnabled
      ? days > 0
        ? this.tr("День {count}", { count: days })
        : this.tr("До старту")
      : this.tr("Без ліміту");
    this.els.dailyTitle.textContent = dailyLimitEnabled
      ? this.tr("Загальний денний ліміт")
      : this.tr("Денний ліміт вимкнено");
    this.els.dailyRemaining.textContent = dailyLimitEnabled
      ? formatMoney(dailyRemaining, BASE_CURRENCY, this.language)
      : this.tr("Без ліміту");
    this.els.dailyAccrued.textContent = dailyLimitEnabled
      ? formatMoney(dailyAccrued, BASE_CURRENCY, this.language)
      : this.tr("Вимкнено");
    this.els.dailySpent.textContent = formatMoney(dailySpent, BASE_CURRENCY, this.language);
    this.els.dailyRate.textContent = dailyLimitEnabled
      ? formatMoney(todayLimit, BASE_CURRENCY, this.language)
      : this.tr("Вимкнено");
    this.els.subsRemaining.textContent = formatMoney(subsRemaining, BASE_CURRENCY, this.language);
    this.els.subsBudget.textContent = formatMoney(
      this.state.settings.subscriptionBudget,
      BASE_CURRENCY,
      this.language,
    );
    this.els.subsSpent.textContent = formatMoney(subsSpent, BASE_CURRENCY, this.language);

    setProgress(
      this.els.dailyProgress,
      dailyLimitEnabled ? dailySpent : 0,
      dailyLimitEnabled ? Math.max(dailyAccrued, todayLimit) : 0,
    );
    setProgress(this.els.subsProgress, subsSpent, this.state.settings.subscriptionBudget);
  }

  private renderChart(): void {
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
    this.els.chartSummary.textContent = this.tr("За {period}: {amount}", {
      period: chartRangeLabel(this.activeChartRange, this.language),
      amount: formatMoney(total, BASE_CURRENCY, this.language),
    });

    this.els.expenseChart.innerHTML = `
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
      <text class="chart-label" x="${left}" y="${height - 8}">${formatDateShort(
        first,
        this.language,
      )}</text>
      <text class="chart-label chart-label--end" x="${left + graphWidth}" y="${
        height - 8
      }">${formatDateShort(last, this.language)}</text>
      <text class="chart-value" x="${left}" y="18">${formatMoney(
        rawMax,
        BASE_CURRENCY,
        this.language,
      )}</text>
    `;
  }

  private renderFormHints(): void {
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
    this.els.amountLabel.textContent = isFuel ? this.tr("Заплатив") : this.tr("Сума");

    if (isExchange) {
      this.els.currencyBadge.textContent = this.tr("Обмін");
      this.renderExchangePreview();
      return;
    }

    this.els.detailLabel.textContent = this.tr(
      isDebt ? debtMeta.detailLabel : meta.detailLabel || "",
    );
    this.els.detail.placeholder = this.tr(isDebt ? debtMeta.placeholder : meta.placeholder || "");
    this.els.currencyBadge.textContent = isDebt
      ? this.tr("Борг")
      : isFuel
        ? this.tr("Пальне")
        : account?.currency || BASE_CURRENCY;

    const needsBudgetEquivalent =
      account &&
      account.currency !== BASE_CURRENCY &&
      (type === "expense" || type === "subscription");
    this.els.budgetEquivalentField.hidden = !needsBudgetEquivalent;
  }

  private renderSettingsForm(): void {
    this.els.settingStartDate.value = this.state.settings.startDate;
    this.els.settingDaily.value = formatInputNumber(
      getDailyLimitForDate(this.state.settings, todayKey()),
    );
    this.els.settingDailyEnabled.checked = this.state.settings.dailyLimitEnabled;
    this.els.settingSubscriptions.value = formatInputNumber(this.state.settings.subscriptionBudget);
    this.renderDailyLimitToggle();
    this.els.settingsAccountsList.innerHTML = this.state.accounts.length
      ? this.state.accounts
          .map((account) => renderSettingsAccountRow(account, this.language))
          .join("")
      : `<div class="empty-state">${this.tr("Рахунків ще немає")}</div>`;
  }

  private renderPreferencesForm(): void {
    this.els.appLanguage.value = this.language;
  }

  private renderDailyLimitToggle(): void {
    this.els.settingDaily.disabled = !this.els.settingDailyEnabled.checked;
  }

  private renderAnalyticsSummary(): void {
    const series = buildExpenseSeries(this.state, this.activeChartRange);
    const startDate = series[0]?.date || todayKey();
    const endDate = series[series.length - 1]?.date || todayKey();
    const inRange = (entry: Entry) => entry.date >= startDate && entry.date <= endDate;
    const total = series.reduce((sum, item) => sum + item.amount, 0);
    const expenses = sumEntries(
      this.state,
      (entry) => entry.type === "expense" && inRange(entry),
      (entry) => getEntryBudgetAmount(this.state, entry),
    );
    const subscriptions = sumEntries(
      this.state,
      (entry) => entry.type === "subscription" && inRange(entry),
      (entry) => getEntryBudgetAmount(this.state, entry),
    );
    const fuel = sumEntries(
      this.state,
      (entry) => entry.type === "fuel" && inRange(entry),
      (entry) => {
        const account = this.getAccount(entry.accountId);
        const currency = entry.currency || account?.currency || BASE_CURRENCY;
        return currency === BASE_CURRENCY ? Number(entry.amount || 0) : 0;
      },
    );

    this.els.analyticsTotal.textContent = formatMoney(total, BASE_CURRENCY, this.language);
    this.els.analyticsExpenses.textContent = formatMoney(expenses, BASE_CURRENCY, this.language);
    this.els.analyticsSubscriptions.textContent = formatMoney(
      subscriptions,
      BASE_CURRENCY,
      this.language,
    );
    this.els.analyticsFuel.textContent = formatMoney(fuel, BASE_CURRENCY, this.language);
  }

  private renderTurnover(): void {
    const projects = this.state.turnoverProjects || [];
    this.els.turnoverCopySummary.disabled = !projects.length;
    if (!projects.length) {
      this.els.turnoverList.innerHTML = `<div class="empty-state">${this.tr(
        "Пропозицій ще немає",
      )}</div>`;
      return;
    }

    this.els.turnoverList.innerHTML = projects
      .map((project) => this.renderTurnoverProject(project))
      .join("");
  }

  private async copyTurnoverSummary(): Promise<void> {
    const projects = this.state.turnoverProjects || [];
    if (!projects.length) {
      this.showTurnoverMessage("Немає що копіювати", true);
      return;
    }

    const ok = await this.copyTextToClipboard(this.makeTurnoverClipboardSummary(projects));
    this.showTurnoverMessage(ok ? "Підсумок скопійовано" : "Не вдалося скопіювати", !ok);
  }

  private renderTurnoverProject(project: TurnoverProject): string {
    const participantPercent = project.participants.reduce(
      (total, participant) => total + Number(participant.percent || 0),
      0,
    );
    const investorTotal = project.investors.reduce(
      (total, investor) => total + Number(investor.amount || 0),
      0,
    );
    const directContributionTotal = project.participants.reduce(
      (total, participant) => total + this.getTurnoverParticipantDirectContributed(participant),
      0,
    );
    const investorReturned = project.investors.reduce(
      (total, investor) => total + this.getTurnoverInvestorReturned(investor),
      0,
    );
    const fundedTotal = roundMoney(investorTotal + directContributionTotal);
    const progress = project.targetAmount > 0 ? Math.min((fundedTotal / project.targetAmount) * 100, 100) : 0;
    const missing = Math.max(0, project.targetAmount - fundedTotal);
    const percentWarning =
      Math.round(participantPercent) === 100
        ? ""
        : `<span class="turnover-warning">${this.tr("Частки зараз {percent}%", {
            percent: Math.round(participantPercent),
          })}</span>`;

    return `
      <article class="turnover-card" data-turnover-project="${escapeAttribute(project.id)}">
        <div class="turnover-card-head">
          <div>
            <span class="panel-kicker">${formatDateHuman(project.createdAt.slice(0, 10), this.language)}</span>
            <h3>${escapeHtml(project.title)}</h3>
          </div>
          <button class="entry-delete" type="button" data-delete-turnover-project aria-label="${escapeAttribute(
            this.tr("Видалити"),
          )}">×</button>
        </div>

        <div class="turnover-metrics">
          <div>
            <span>${this.tr("Потрібно")}</span>
            <strong>${formatMoney(project.targetAmount, project.currency, this.language)}</strong>
          </div>
          <div>
            <span>${this.tr("Зібрано")}</span>
            <strong>${formatMoney(fundedTotal, project.currency, this.language)}</strong>
          </div>
          <div>
            <span>${this.tr("Не вистачає")}</span>
            <strong>${formatMoney(missing, project.currency, this.language)}</strong>
          </div>
        </div>
        <div class="progress-track" aria-hidden="true">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>

        <section class="turnover-section">
          <div class="turnover-subhead">
            <h4>${this.tr("Учасники")}</h4>
            ${percentWarning}
          </div>
          <div class="turnover-participants">
            ${project.participants.map((participant) => this.renderTurnoverParticipant(project, participant)).join("")}
          </div>
          <div class="turnover-inline-form">
            <input data-turnover-person-name type="text" placeholder="${escapeAttribute(this.tr("Імʼя учасника"))}" />
            <button class="secondary-button" type="button" data-add-turnover-person>${this.tr("Додати людину")}</button>
          </div>
        </section>

        <section class="turnover-section">
          <div class="turnover-subhead">
            <h4>${this.tr("Інвестори")}</h4>
            <span>${this.tr("Повернено {amount}", {
              amount: formatMoney(investorReturned, project.currency, this.language),
            })}</span>
          </div>
          <div class="turnover-investors">
            ${
              project.investors.length
                ? project.investors.map((investor) => this.renderTurnoverInvestor(project, investor)).join("")
                : `<div class="empty-state">${this.tr("Інвесторів ще немає")}</div>`
            }
          </div>
          <div class="turnover-inline-form turnover-inline-form--investor">
            <input data-turnover-investor-name type="text" placeholder="${escapeAttribute(this.tr("Імʼя інвестора"))}" />
            <input data-turnover-investor-amount type="text" inputmode="decimal" placeholder="16000" />
            <button class="secondary-button" type="button" data-add-turnover-investor>${this.tr("Додати інвестора")}</button>
          </div>
        </section>
      </article>
    `;
  }

  private renderTurnoverParticipant(project: TurnoverProject, participant: TurnoverParticipant): string {
    const amount = this.getTurnoverParticipantAmount(project, participant);
    const paid = this.getTurnoverParticipantPaid(project, participant);
    const remaining = Math.max(0, amount - paid);
    const paidProgress = amount > 0 ? Math.min((paid / amount) * 100, 100) : 0;
    const directContributions = participant.contributions.map(
      (contribution) => `
        <article class="turnover-contribution-row">
          <span>${this.tr("Внесок")} · ${formatDateHuman(contribution.date, this.language)}</span>
          <b>${formatMoney(contribution.amount, project.currency, this.language)}</b>
        </article>
      `,
    );
    const repaymentContributions = this.getTurnoverParticipantInvestorRepayments(project, participant).map(
      (repayment) => `
        <article class="turnover-contribution-row">
          <span>${this.tr("Інвестору {name}", {
            name: repayment.investorName,
          })} · ${formatDateHuman(repayment.date, this.language)}</span>
          <b>${formatMoney(repayment.amount, project.currency, this.language)}</b>
        </article>
      `,
    );
    const contributionHistory = [...directContributions, ...repaymentContributions].join("");

    return `
      <article class="turnover-participant-row" data-turnover-participant="${escapeAttribute(participant.id)}">
        <div class="turnover-participant-head">
          <span>
            <strong>${escapeHtml(participant.name)}</strong>
            <small>${this.tr("Вніс {paid} із {target}", {
              paid: formatMoney(paid, project.currency, this.language),
              target: formatMoney(amount, project.currency, this.language),
            })}</small>
          </span>
          <b>${this.tr("Залишилось {amount}", {
            amount: formatMoney(remaining, project.currency, this.language),
          })}</b>
        </div>
        <div class="turnover-paid-track" aria-hidden="true">
          <div class="turnover-paid-bar" style="width: ${paidProgress}%"></div>
        </div>
        <label class="turnover-share-control">
          <span>${this.tr("Частка")}</span>
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
          ${contributionHistory || `<div class="empty-state">${this.tr("Внесків ще немає")}</div>`}
        </div>
        <div class="turnover-inline-form turnover-inline-form--contribution">
          <input data-turnover-contribution-amount type="text" inputmode="decimal" placeholder="0" />
          <input data-turnover-contribution-date type="date" value="${todayKey()}" />
          <button class="ghost-button" type="button" data-add-turnover-contribution>${this.tr("Записати внесок")}</button>
        </div>
      </article>
    `;
  }

  private renderTurnoverInvestor(project: TurnoverProject, investor: TurnoverInvestor): string {
    const returned = this.getTurnoverInvestorReturned(investor);
    const remaining = Math.max(0, investor.amount - returned);
    const repayments = investor.repayments.length
      ? investor.repayments
          .map(
            (repayment) => `
              <article class="turnover-repayment-row">
                <span>${escapeHtml(this.getTurnoverRepaymentName(project, repayment))} · ${formatDateHuman(repayment.date, this.language)}</span>
                <b>${formatMoney(repayment.amount, project.currency, this.language)}</b>
              </article>
            `,
          )
          .join("")
      : `<div class="empty-state">${this.tr("Повернень ще немає")}</div>`;

    return `
      <article class="turnover-investor" data-turnover-investor="${escapeAttribute(investor.id)}">
        <div class="turnover-investor-head">
          <div>
            <strong>${escapeHtml(investor.name)}</strong>
            <span>${this.tr("Дав {amount}", {
              amount: formatMoney(investor.amount, project.currency, this.language),
            })}</span>
          </div>
          <b>${this.tr("Залишок {amount}", {
            amount: formatMoney(remaining, project.currency, this.language),
          })}</b>
        </div>
        <div class="turnover-repayments">${repayments}</div>
        <div class="turnover-inline-form turnover-inline-form--repay">
          <select data-turnover-repay-person>
            ${this.renderTurnoverParticipantOptions(project)}
          </select>
          <input data-turnover-repay-amount type="text" inputmode="decimal" placeholder="0" />
          <input data-turnover-repay-date type="date" value="${todayKey()}" />
          <button class="ghost-button" type="button" data-add-turnover-repayment>${this.tr("Записати повернення")}</button>
        </div>
      </article>
    `;
  }

  private renderEntries(): void {
    const entries = sortedEntries(this.state).filter(
      (entry) => this.activeFilter === "all" || entry.type === this.activeFilter,
    );
    const totalPages = Math.max(1, Math.ceil(entries.length / HISTORY_PAGE_SIZE));
    this.historyPage = Math.min(Math.max(this.historyPage, 1), totalPages);
    const pageStart = (this.historyPage - 1) * HISTORY_PAGE_SIZE;
    const pageEntries = entries.slice(pageStart, pageStart + HISTORY_PAGE_SIZE);

    if (!entries.length) {
      this.els.entriesList.innerHTML = `<div class="empty-state">${this.tr(
        "Операцій ще немає",
      )}</div>`;
      this.els.historyPagination.hidden = true;
      return;
    }

    this.els.entriesList.innerHTML = pageEntries.map((entry) => renderEntry(this.state, entry)).join("");
    this.els.historyPagination.hidden = entries.length <= HISTORY_PAGE_SIZE;
    this.els.historyPageInfo.textContent = this.tr("Сторінка {page} з {total}", {
      page: this.historyPage,
      total: totalPages,
    });
    this.els.historyPrev.disabled = this.historyPage <= 1;
    this.els.historyNext.disabled = this.historyPage >= totalPages;
  }

  private renderExchangePreview(): void {
    const fromAccount = this.getAccount(this.els.exchangeFromAccount.value);
    const toAccount = this.getAccount(this.els.exchangeToAccount.value);
    const fromAmount = parseAmount(this.els.exchangeFromAmount.value);
    const toAmount = parseAmount(this.els.exchangeToAmount.value);

    if (!fromAccount || !toAccount || !fromAmount || !toAmount) {
      this.els.exchangeRatePreview.textContent = this.tr("Курс зʼявиться після сум");
      return;
    }

    this.els.exchangeRatePreview.textContent = makeExchangeRateLabel(
      fromAmount,
      fromAccount.currency,
      toAmount,
      toAccount.currency,
      this.language,
    );
  }

  private swapExchangeDirection(): void {
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

  private handleTurnoverListChange(event: Event): void {
    const input = (event.target as Element | null)?.closest<HTMLInputElement>(
      "[data-turnover-percent]",
    );
    if (!input) return;

    const card = input.closest<HTMLElement>("[data-turnover-project]");
    const project = this.getTurnoverProject(card?.dataset.turnoverProject);
    const participant = project?.participants.find(
      (item) => item.id === input.dataset.turnoverPercent,
    );
    if (!project || !participant) return;

    this.redistributeTurnoverShares(project, participant.id, Number(input.value) || 0);
    project.updatedAt = new Date().toISOString();
    this.commitState("Частку оновлено", "turnover");
  }

  private async handleTurnoverListClick(event: MouseEvent): Promise<void> {
    const target = event.target as Element | null;
    const card = target?.closest<HTMLElement>("[data-turnover-project]");
    const project = this.getTurnoverProject(card?.dataset.turnoverProject);
    if (!target || !card || !project) return;

    if (target.closest("[data-delete-turnover-project]")) {
      const ok = await this.confirm("Видалити цю пропозицію?");
      if (!ok) return;
      this.state.turnoverProjects = this.state.turnoverProjects.filter(
        (item) => item.id !== project.id,
      );
      this.commitState("Пропозицію видалено", "turnover");
      return;
    }

    if (target.closest("[data-add-turnover-person]")) {
      this.addTurnoverPerson(project, card);
      return;
    }

    const participantNode = target.closest<HTMLElement>("[data-turnover-participant]");
    if (target.closest("[data-add-turnover-contribution]") && participantNode) {
      const participant = project.participants.find(
        (item) => item.id === participantNode.dataset.turnoverParticipant,
      );
      if (participant) this.addTurnoverContribution(project, participant, participantNode);
      return;
    }

    if (target.closest("[data-add-turnover-investor]")) {
      this.addTurnoverInvestor(project, card);
      return;
    }

    const investorNode = target.closest<HTMLElement>("[data-turnover-investor]");
    if (target.closest("[data-add-turnover-repayment]") && investorNode) {
      const investor = project.investors.find(
        (item) => item.id === investorNode.dataset.turnoverInvestor,
      );
      if (investor) this.addTurnoverRepayment(project, investor, investorNode);
    }
  }

  private addTurnoverPerson(project: TurnoverProject, card: HTMLElement): void {
    const input = card.querySelector<HTMLInputElement>("[data-turnover-person-name]");
    const name = input?.value.trim() || "";
    if (!name) {
      this.showTurnoverMessage("Вкажи імʼя учасника", true);
      return;
    }

    project.participants.push({
      id: makeId("person"),
      name,
      percent: 0,
      contributions: [],
    });
    project.updatedAt = new Date().toISOString();
    if (input) input.value = "";
    this.commitState("Учасника додано", "turnover");
  }

  private addTurnoverContribution(
    project: TurnoverProject,
    participant: TurnoverParticipant,
    participantNode: HTMLElement,
  ): void {
    const amountInput = participantNode.querySelector<HTMLInputElement>(
      "[data-turnover-contribution-amount]",
    );
    const dateInput = participantNode.querySelector<HTMLInputElement>(
      "[data-turnover-contribution-date]",
    );
    const amount = parseSettingAmount(amountInput?.value || "");
    const date = dateInput?.value || todayKey();

    if (!amount || amount <= 0) {
      this.showTurnoverMessage("Вкажи суму внеску більше нуля", true);
      return;
    }

    if (!isDateKey(date)) {
      this.showTurnoverMessage("Вкажи дату внеску", true);
      return;
    }

    participant.contributions.push({
      id: makeId("contribution"),
      amount: roundMoney(amount),
      date,
      createdAt: new Date().toISOString(),
    });
    project.updatedAt = new Date().toISOString();
    if (amountInput) amountInput.value = "";
    if (dateInput) dateInput.value = todayKey();
    this.commitState("Внесок записано", "turnover");
  }

  private addTurnoverInvestor(project: TurnoverProject, card: HTMLElement): void {
    const nameInput = card.querySelector<HTMLInputElement>("[data-turnover-investor-name]");
    const amountInput = card.querySelector<HTMLInputElement>("[data-turnover-investor-amount]");
    const name = nameInput?.value.trim() || "";
    const amount = parseSettingAmount(amountInput?.value || "");

    if (!name) {
      this.showTurnoverMessage("Вкажи імʼя інвестора", true);
      return;
    }

    if (!amount || amount <= 0) {
      this.showTurnoverMessage("Вкажи суму інвестора більше нуля", true);
      return;
    }

    project.investors.push({
      id: makeId("investor"),
      name,
      amount: roundMoney(amount),
      repayments: [],
      createdAt: new Date().toISOString(),
    });
    project.updatedAt = new Date().toISOString();
    if (nameInput) nameInput.value = "";
    if (amountInput) amountInput.value = "";
    this.commitState("Інвестора додано", "turnover");
  }

  private addTurnoverRepayment(
    project: TurnoverProject,
    investor: TurnoverInvestor,
    investorNode: HTMLElement,
  ): void {
    const participantSelect = investorNode.querySelector<HTMLSelectElement>(
      "[data-turnover-repay-person]",
    );
    const amountInput = investorNode.querySelector<HTMLInputElement>("[data-turnover-repay-amount]");
    const dateInput = investorNode.querySelector<HTMLInputElement>("[data-turnover-repay-date]");
    const participant = project.participants.find(
      (item) => item.id === (participantSelect?.value || ""),
    );
    const amount = parseSettingAmount(amountInput?.value || "");
    const date = dateInput?.value || todayKey();

    if (!participant) {
      this.showTurnoverMessage("Обери хто повернув інвестору", true);
      return;
    }

    if (!amount || amount <= 0) {
      this.showTurnoverMessage("Вкажи суму повернення більше нуля", true);
      return;
    }

    if (!isDateKey(date)) {
      this.showTurnoverMessage("Вкажи дату повернення", true);
      return;
    }

    investor.repayments.push({
      id: makeId("repay"),
      participantId: participant.id,
      fromName: participant.name,
      amount: roundMoney(amount),
      date,
      createdAt: new Date().toISOString(),
    });
    project.updatedAt = new Date().toISOString();
    if (participantSelect) participantSelect.value = "";
    if (amountInput) amountInput.value = "";
    if (dateInput) dateInput.value = todayKey();
    this.commitState("Повернення записано", "turnover");
  }

  private getBudgetAmountFromForm(type: EntryType, account: Account, amount: number): number | null {
    if (type === "fuel") return 0;
    if (type === "income") return 0;
    if (account.currency === BASE_CURRENCY) return amount;

    const budgetAmount = parseSettingAmount(this.els.entryBudgetAmount.value);
    if (!budgetAmount || budgetAmount <= 0) {
      this.showFormMessage("Для валютної витрати вкажи еквівалент у грн", true);
      return null;
    }

    return budgetAmount;
  }

  private getSelectedType(): EntryType {
    return (
      document.querySelector<HTMLInputElement>('input[name="entry-type"]:checked')?.value ||
      "expense"
    ) as EntryType;
  }

  private getSelectedDebtDirection(): DebtDirection {
    return (
      document.querySelector<HTMLInputElement>('input[name="debt-direction"]:checked')?.value ||
      "to_me"
    ) as DebtDirection;
  }

  private readFuelFields(): FuelFields | null {
    const rawFuelType = this.els.fuelType.value.trim();
    const fuelType = normalizeFuelType(rawFuelType);
    const fuelLiters = parseSettingAmount(this.els.fuelLiters.value);

    if (!rawFuelType) {
      this.showFormMessage("Вкажи вид палива", true);
      return null;
    }

    if (!fuelLiters || fuelLiters <= 0) {
      this.showFormMessage("Вкажи скільки літрів залито", true);
      return null;
    }

    return {
      fuelType,
      fuelLiters,
      budgetAmount: 0,
    };
  }

  private readDebtSettlementRows(debt: Entry): DebtSettlementInput[] | null {
    const settlements: DebtSettlementInput[] = [];
    const rows = this.els.debtSettlementRows.querySelectorAll<HTMLElement>(
      "[data-debt-settlement-row]",
    );

    for (const row of rows) {
      const noteInput = row.querySelector<HTMLInputElement>("[data-debt-settlement-note]");
      const amountInput = row.querySelector<HTMLInputElement>("[data-debt-settlement-amount]");
      const accountSelect = row.querySelector<HTMLSelectElement>("[data-debt-settlement-account]");
      const note = noteInput?.value.trim();
      const amount = parseSettingAmount(amountInput?.value || "");

      if (amount === null || amount < 0) {
        this.showDebtSettlementMessage("Сума має бути числом від нуля", true);
        return null;
      }

      if (!amount) continue;

      const account = this.getAccount(accountSelect?.value);
      if (!account) {
        this.showDebtSettlementMessage("Обери рахунок для розрахунку", true);
        return null;
      }

      if (account.currency !== debt.currency) {
        this.showDebtSettlementMessage("Для боргу обери рахунок у тій самій валюті", true);
        return null;
      }

      settlements.push({
        accountId: account.id,
        amount: roundMoney(amount),
        note: note || undefined,
      });
    }

    return settlements;
  }

  private addDebtSettlementRow(): void {
    const debt = this.getDebtEntry(this.activeDebtId);
    if (!debt) return;

    const meta = DEBT_DIRECTION_META[debt.debtDirection || "to_me"] || DEBT_DIRECTION_META.to_me;
    const noteLabel = debt.debtDirection === "by_me" ? this.tr("Кому віддав") : this.tr("Хто повернув");
    const accountLabel =
      debt.debtDirection === "by_me"
        ? this.tr("Списати з рахунку")
        : this.tr("Зарахувати на рахунок");
    const row = document.createElement("div");
    row.className = "debt-settlement-row";
    row.dataset.debtSettlementRow = "";
    row.innerHTML = `
      <label class="field debt-settlement-note-field">
        <span>${noteLabel}</span>
        <input data-debt-settlement-note type="text" placeholder="${this.tr("Імʼя або нотатка")}" />
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
        "Видалити",
      )}">×</button>
    `;
    row
      .querySelector("[data-remove-debt-settlement-row]")
      ?.addEventListener("click", () => row.remove());

    this.els.debtSettlementRows.append(row);
    row.querySelector<HTMLInputElement>("[data-debt-settlement-note]")?.focus();
  }

  private renderDebtSettlementRows(debt: Entry): void {
    this.els.debtSettlementRows
      .querySelectorAll(".debt-settlement-row:not(:first-child)")
      .forEach((row) => row.remove());

    const remaining = getDebtRemainingAmount(debt);
    const meta = DEBT_DIRECTION_META[debt.debtDirection || "to_me"] || DEBT_DIRECTION_META.to_me;
    const options = this.getDebtSettlementAccountOptions(debt);
    const defaultAccountId = this.getDefaultSettlementAccountId(debt);
    const noteLabel = this.els.debtSettlementRows.querySelector<HTMLElement>(
      "#debt-settlement-note-label",
    );
    const noteInput = this.els.debtSettlementRows.querySelector<HTMLInputElement>(
      "#debt-settlement-note-input",
    );

    if (noteLabel) {
      noteLabel.textContent =
        debt.debtDirection === "by_me" ? this.tr("Кому віддав") : this.tr("Хто повернув");
    }
    if (noteInput) {
      noteInput.value = "";
      noteInput.placeholder = this.tr("Імʼя або нотатка");
    }
    this.els.debtSettlementAmountLabel.textContent = this.tr(meta.amountLabel);
    this.els.debtSettlementAccountLabel.textContent =
      debt.debtDirection === "by_me"
        ? this.tr("Списати з рахунку")
        : this.tr("Зарахувати на рахунок");
    this.els.debtSettlementAmount.value = formatInputNumber(remaining);
    this.els.debtSettlementAccount.innerHTML = options;
    restoreSelectValue(this.els.debtSettlementAccount, defaultAccountId);
    this.els.addDebtSettlementRow.hidden = false;
    this.els.debtCloseToggle.checked = false;
  }

  private renderDebtSettlementHistory(debt: Entry): void {
    const settlements = getDebtSettlements(debt);
    if (!settlements.length) {
      this.els.debtSettlementHistory.hidden = true;
      this.els.debtSettlementHistory.innerHTML = "";
      return;
    }

    const actionLabel = debt.debtDirection === "by_me" ? this.tr("Віддав") : this.tr("Повернув");
    const rows = settlements
      .map((settlement) => {
        const account = this.getAccount(settlement.accountId);
        const note = settlement.note?.trim() || actionLabel;
        return `
          <article class="debt-history-row">
            <div>
              <strong>${escapeHtml(note)}</strong>
              <span>${formatDateHuman(settlement.date, this.language)} · ${escapeHtml(
                account?.name || this.tr("Рахунок видалено"),
              )}</span>
            </div>
            <b>${formatMoney(settlement.amount, debt.currency, this.language)}</b>
          </article>
        `;
      })
      .join("");

    this.els.debtSettlementHistory.hidden = false;
    this.els.debtSettlementHistory.innerHTML = `
      <h3>${this.tr("Історія розрахунків")}</h3>
      <div class="debt-history-list">${rows}</div>
    `;
  }

  private getDebtSettlementAccountOptions(debt: Entry): string {
    const accounts = this.state.accounts.filter((account) => account.currency === debt.currency);
    return accounts.length
      ? accounts.map(renderAccountOption).join("")
      : `<option value="">${this.tr("Додай рахунок у налаштуваннях")}</option>`;
  }

  private getDefaultSettlementAccountId(debt: Entry): string {
    const sameCurrencyAccounts = this.state.accounts.filter(
      (account) => account.currency === debt.currency,
    );
    if (debt.debtDirection === "to_me" && sameCurrencyAccounts.some((item) => item.id === debt.accountId)) {
      return debt.accountId || "";
    }

    return sameCurrencyAccounts[0]?.id || "";
  }

  private parseNameList(value: string): string[] {
    return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
  }

  private makeTurnoverParticipants(names: string[]): TurnoverParticipant[] {
    const basePercent = names.length ? Math.floor((100 / names.length) * 100) / 100 : 0;
    let usedPercent = 0;

    return names.map((name, index) => {
      const isLast = index === names.length - 1;
      const percent = isLast ? roundMoney(100 - usedPercent) : basePercent;
      usedPercent = roundMoney(usedPercent + percent);

      return {
        id: makeId("person"),
        name,
        percent,
        contributions: [],
      };
    });
  }

  private renderTurnoverParticipantOptions(project: TurnoverProject): string {
    return [
      `<option value="">${this.tr("Хто повернув")}</option>`,
      ...project.participants.map((participant) => {
        const amount = this.getTurnoverParticipantAmount(project, participant);
        return `<option value="${escapeAttribute(participant.id)}">${escapeHtml(
          `${participant.name} · ${formatMoney(amount, project.currency, this.language)}`,
        )}</option>`;
      }),
    ].join("");
  }

  private makeTurnoverClipboardSummary(projects: TurnoverProject[]): string {
    return projects
      .map((project) => {
        const directContributionTotal = project.participants.reduce(
          (total, participant) => total + this.getTurnoverParticipantDirectContributed(participant),
          0,
        );
        const investorTotal = project.investors.reduce(
          (total, investor) => total + Number(investor.amount || 0),
          0,
        );
        const fundedTotal = roundMoney(directContributionTotal + investorTotal);
        const missing = Math.max(0, project.targetAmount - fundedTotal);
        const lines = [
          project.title,
          this.tr("Потрібно: {amount}", {
            amount: formatMoney(project.targetAmount, project.currency, this.language),
          }),
          this.tr("Зібрано: {amount}", {
            amount: formatMoney(fundedTotal, project.currency, this.language),
          }),
          this.tr("Не вистачає: {amount}", {
            amount: formatMoney(missing, project.currency, this.language),
          }),
          "",
          `${this.tr("Учасники")}:`,
          ...project.participants.map((participant) => {
            const target = this.getTurnoverParticipantAmount(project, participant);
            const paid = this.getTurnoverParticipantPaid(project, participant);
            const remaining = Math.max(0, target - paid);
            return this.tr("{name}: сплатив {paid}, ще {remaining}", {
              name: participant.name,
              paid: formatMoney(paid, project.currency, this.language),
              remaining: formatMoney(remaining, project.currency, this.language),
            });
          }),
          "",
          `${this.tr("Інвестори")}:`,
        ];

        if (project.investors.length) {
          lines.push(
            ...project.investors.map((investor) => {
              const returned = this.getTurnoverInvestorReturned(investor);
              const remaining = Math.max(0, investor.amount - returned);
              return this.tr("{name}: дав {amount}, повернулось {returned}, ще {remaining}", {
                name: investor.name,
                amount: formatMoney(investor.amount, project.currency, this.language),
                returned: formatMoney(returned, project.currency, this.language),
                remaining: formatMoney(remaining, project.currency, this.language),
              });
            }),
          );
        } else {
          lines.push(this.tr("немає"));
        }

        return lines.join("\n");
      })
      .join("\n\n")
      .replace(/\u00a0/g, " ");
  }

  private async copyTextToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to the textarea fallback.
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.append(textarea);
    textarea.select();

    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  }

  private getTurnoverProject(projectId?: string): TurnoverProject | null {
    return this.state.turnoverProjects.find((project) => project.id === projectId) || null;
  }

  private getTurnoverParticipantAmount(
    project: TurnoverProject,
    participant: TurnoverParticipant,
  ): number {
    return roundMoney((project.targetAmount * Number(participant.percent || 0)) / 100);
  }

  private getTurnoverInvestorReturned(investor: TurnoverInvestor): number {
    return roundMoney(
      investor.repayments.reduce((total, repayment) => total + Number(repayment.amount || 0), 0),
    );
  }

  private getTurnoverParticipantDirectContributed(participant: TurnoverParticipant): number {
    return roundMoney(
      participant.contributions.reduce(
        (total, contribution) => total + Number(contribution.amount || 0),
        0,
      ),
    );
  }

  private getTurnoverParticipantInvestorRepayments(
    project: TurnoverProject,
    participant: TurnoverParticipant,
  ): Array<{ investorName: string; amount: number; date: string }> {
    return project.investors.flatMap((investor) =>
      investor.repayments
        .filter((repayment) => this.isTurnoverRepaymentByParticipant(project, repayment, participant))
        .map((repayment) => ({
          investorName: investor.name,
          amount: Number(repayment.amount || 0),
          date: repayment.date,
        })),
    );
  }

  private getTurnoverParticipantPaid(
    project: TurnoverProject,
    participant: TurnoverParticipant,
  ): number {
    const investorRepayments = this.getTurnoverParticipantInvestorRepayments(
      project,
      participant,
    ).reduce((total, repayment) => total + Number(repayment.amount || 0), 0);

    return roundMoney(
      this.getTurnoverParticipantDirectContributed(participant) + investorRepayments,
    );
  }

  private getTurnoverRepaymentName(
    project: TurnoverProject,
    repayment: { participantId?: string; fromName: string },
  ): string {
    return this.getTurnoverRepaymentParticipant(project, repayment)?.name || repayment.fromName;
  }

  private getTurnoverRepaymentParticipant(
    project: TurnoverProject,
    repayment: { participantId?: string; fromName: string },
  ): TurnoverParticipant | null {
    if (repayment.participantId) {
      return project.participants.find((participant) => participant.id === repayment.participantId) || null;
    }

    return (
      project.participants.find((participant) => participant.name === repayment.fromName) || null
    );
  }

  private isTurnoverRepaymentByParticipant(
    project: TurnoverProject,
    repayment: { participantId?: string; fromName: string },
    participant: TurnoverParticipant,
  ): boolean {
    if (repayment.participantId) return repayment.participantId === participant.id;
    return this.getTurnoverRepaymentParticipant(project, repayment)?.id === participant.id;
  }

  private redistributeTurnoverShares(
    project: TurnoverProject,
    participantId: string,
    nextPercent: number,
  ): void {
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
      0,
    );

    participant.percent = cleanPercent;

    let usedPercent = 0;
    others.forEach((item, index) => {
      const isLast = index === others.length - 1;
      const nextValue =
        isLast
          ? roundMoney(remainingPercent - usedPercent)
          : currentOtherTotal > 0
            ? roundMoney((remainingPercent * Math.max(0, Number(item.percent || 0))) / currentOtherTotal)
            : roundMoney(remainingPercent / others.length);

      item.percent = Math.max(0, nextValue);
      usedPercent = roundMoney(usedPercent + item.percent);
    });
  }

  private getAccount(accountId?: string): Account | null {
    return findAccount(this.state, accountId);
  }

  private getDebtEntry(entryId: string): Entry | null {
    return this.state.entries.find((entry) => entry.id === entryId && entry.type === "debt") || null;
  }

  private accountHasEntries(accountId: string): boolean {
    return this.state.entries.some(
      (entry) =>
        entry.accountId === accountId ||
        entry.settlementAccountId === accountId ||
        getDebtSettlements(entry).some((settlement) => settlement.accountId === accountId) ||
        entry.fromAccountId === accountId ||
        entry.toAccountId === accountId,
    );
  }

  private commitState(
    message: string,
    messageTarget: "form" | "settings" | "turnover" | "preferences" = "form",
  ): void {
    this.state.version = APP_VERSION;
    this.state.updatedAt = new Date().toISOString();
    if (!saveLocalState(this.state)) this.setSyncStatus("Локальне сховище недоступне", "warn");
    this.render();

    if (messageTarget === "settings") {
      this.showSettingsMessage(message || "Збережено", false);
    } else if (messageTarget === "turnover") {
      this.showTurnoverMessage(message || "Збережено", false);
    } else if (messageTarget === "preferences") {
      this.showPreferencesMessage(message || "Збережено", false);
    } else {
      this.showFormMessage(message || "Збережено", false);
    }

    notifyTelegramSuccess(this.telegram);
    this.scheduleTelegramSync();
  }

  private scheduleTelegramSync(delay = 250): void {
    clearTimeout(this.syncTimer);
    this.syncTimer = window.setTimeout(() => void this.syncStores(), delay);
  }

  private async syncStores(): Promise<void> {
    if (this.telegram.deviceStorage || this.telegram.cloudStorage) {
      this.setSyncStatus("Синхронізація...", "warn");
    }

    const result = await syncTelegramStores(this.state, {
      deviceStorage: this.telegram.deviceStorage,
      cloudStorage: this.telegram.cloudStorage,
    });

    if (result === "failed") {
      this.setSyncStatus("Локально збережено", "warn");
      return;
    }

    this.setSyncStatus(result === "synced" ? "Збережено" : "Локально збережено", "ok");
  }

  private exportState(): void {
    this.state.updatedAt = new Date().toISOString();
    saveLocalState(this.state);

    const blob = new Blob([JSON.stringify(this.state, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `master-of-coin-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    this.showPreferencesMessage("Backup створено", false);
  }

  private async importState(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const parsed = parseJson(String(reader.result));
      if (!parsed) {
        this.showPreferencesMessage("Файл backup не вдалося прочитати", true);
        return;
      }

      const imported = normalizeState(parsed);
      const ok = await this.confirm("Замінити поточні дані імпортом?");
      if (!ok) return;

      this.state = imported;
      this.commitState("Імпортовано", "preferences");
      this.els.importFile.value = "";
    };
    reader.readAsText(file);
  }

  private openDebtModal(debtId?: string): void {
    const debt = this.getDebtEntry(debtId || "");
    if (!debt) return;
    const closed = isDebtClosed(debt);

    if (!closed && !this.state.accounts.length) {
      this.showFormMessage("Спочатку додай рахунок для розрахунку", true);
      return;
    }

    const meta = DEBT_DIRECTION_META[debt.debtDirection || "to_me"] || DEBT_DIRECTION_META.to_me;
    const account = this.getAccount(debt.accountId);
    const settlementTotal = getDebtSettlementTotal(debt);
    const remaining = getDebtRemainingAmount(debt);

    this.activeDebtId = debt.id;
    this.els.debtModalTitle.textContent =
      closed
        ? this.tr("Борг закрито")
        : debt.debtDirection === "by_me"
          ? this.tr("Я розрахувався")
          : this.tr("Зі мною розрахувались");
    this.els.debtModalSummary.textContent = `${this.tr(meta.label)}: ${formatMoney(
      Number(debt.amount || 0),
      debt.currency,
      this.language,
    )} · ${this.tr("Вже розраховано")}: ${formatMoney(
      settlementTotal,
      debt.currency,
      this.language,
    )} · ${this.tr("залишок")} ${formatMoney(remaining, debt.currency, this.language)} · ${
      debt.detail
    } · ${account?.name || this.tr("Рахунок видалено")}`;
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

  private closeDebtModal(): void {
    this.activeDebtId = "";
    this.els.debtModal.hidden = true;
    this.els.debtSettlementForm.hidden = false;
    document.body.classList.remove("modal-open");
  }

  private renderDebtReceiptName(): void {
    const file = this.els.debtReceipt.files?.[0];
    this.els.debtReceiptName.textContent = file
      ? this.tr("Обрано: {name}", { name: file.name })
      : this.tr("Можна додати фото або скрін чека");
  }

  private async readDebtReceipt(): Promise<Receipt | null | false> {
    const file = this.els.debtReceipt.files?.[0];
    if (!file) return null;

    if (!file.type.startsWith("image/")) {
      this.showFormMessage("Чек має бути зображенням", true);
      return false;
    }

    try {
      return await compressReceiptFile(file);
    } catch {
      this.showFormMessage("Фото чека не вдалося прочитати", true);
      return false;
    }
  }

  private async handleEntriesClick(event: MouseEvent): Promise<void> {
    const target = event.target as Element | null;
    const debtButton = target?.closest<HTMLElement>("[data-settle-debt]");
    if (debtButton) {
      this.openDebtModal(debtButton.dataset.settleDebt);
      return;
    }

    const debtCard = target?.closest<HTMLElement>("[data-debt-id]");
    if (debtCard && !target?.closest("button, a")) {
      this.openDebtModal(debtCard.dataset.debtId);
      return;
    }

    const button = target?.closest<HTMLElement>("[data-delete-id]");
    if (!button) return;

    const ok = await this.confirm("Видалити цю операцію?");
    if (!ok) return;

    this.state.entries = this.state.entries.filter((entry) => entry.id !== button.dataset.deleteId);
    this.commitState("Операцію видалено");
  }

  private async handleSettingsAccountsClick(event: MouseEvent): Promise<void> {
    const target = event.target as Element | null;
    const button = target?.closest<HTMLElement>("[data-delete-account]");
    if (!button) return;

    const accountId = button.dataset.deleteAccount || "";
    if (this.accountHasEntries(accountId)) {
      this.showSettingsMessage("Цей рахунок вже має історію, його не можна видалити", true);
      return;
    }

    const ok = await this.confirm("Видалити рахунок?");
    if (!ok) return;

    this.state.accounts = this.state.accounts.filter((account) => account.id !== accountId);
    this.commitState("Рахунок видалено", "settings");
  }

  private setDailyLimitForDate(fromDate: string, amount: number): void {
    const changeDate = isDateKey(fromDate) ? fromDate : todayKey();
    const cleanAmount = getCleanDailyLimitAmount(amount);
    const withoutSameDate = normalizeDailyLimits(
      this.state.settings.dailyLimits,
      this.state.settings.startDate,
      this.state.settings.dailyAllowance,
    ).filter((limit) => limit.fromDate !== changeDate);

    withoutSameDate.push({ fromDate: changeDate, amount: cleanAmount });
    this.state.settings.dailyLimits = compactDailyLimits(withoutSameDate);
    this.state.settings.dailyAllowance = getDailyLimitForDate(this.state.settings, todayKey());
  }

  private getDailyLimitChangeDate(): string {
    const today = todayKey();
    return today < this.state.settings.startDate ? this.state.settings.startDate : today;
  }

  private isInCurrentMonth(dateKey: string): boolean {
    return dateKey.slice(0, 7) === todayKey().slice(0, 7);
  }

  private translateUi(): void {
    document.documentElement.lang = this.language;
    translateDocument(this.language);
  }

  private confirm(message: string): Promise<boolean> {
    return confirmAction(this.telegram, this.tr(message));
  }

  private showFormMessage(message: string, isError: boolean): void {
    this.els.formMessage.textContent = this.tr(message);
    this.els.formMessage.classList.toggle("is-error", Boolean(isError));
  }

  private showSettingsMessage(message: string, isError: boolean): void {
    this.els.settingsMessage.textContent = this.tr(message);
    this.els.settingsMessage.classList.toggle("is-error", Boolean(isError));
  }

  private showTurnoverMessage(message: string, isError: boolean): void {
    this.els.turnoverMessage.textContent = this.tr(message);
    this.els.turnoverMessage.classList.toggle("is-error", Boolean(isError));
  }

  private showPreferencesMessage(message: string, isError: boolean): void {
    this.els.preferencesMessage.textContent = this.tr(message);
    this.els.preferencesMessage.classList.toggle("is-error", Boolean(isError));
  }

  private showDebtSettlementMessage(message: string, isError: boolean): void {
    this.els.debtSettlementMessage.textContent = this.tr(message);
    this.els.debtSettlementMessage.classList.toggle("is-error", Boolean(isError));
  }

  private setSyncStatus(message: string, tone: "ok" | "warn"): void {
    this.els.syncStatus.textContent = this.tr(message);
    this.els.syncStatus.classList.toggle("is-ok", tone === "ok");
    this.els.syncStatus.classList.toggle("is-warn", tone === "warn");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new NationalDebtApp().boot();
});
