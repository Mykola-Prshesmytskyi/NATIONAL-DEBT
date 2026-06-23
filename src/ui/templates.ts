import { ACCOUNT_KIND_LABELS, BASE_CURRENCY, DEBT_DIRECTION_META, TYPE_META } from "../constants";
import { findAccount, getEntryBudgetAmount } from "../domain/calculations";
import {
  getDebtRemainingAmount,
  getDebtSettlementTotal,
  getDebtSettlements,
  getDebtWriteOffAmount,
  isDebtClosed,
} from "../domain/debt";
import { tText } from "../i18n";
import type { Account, AppState, Entry, Receipt } from "../types";
import {
  formatDateHuman,
  formatFuelLiters,
  formatInputNumber,
  formatMoney,
  formatSignedMoney,
  makeExchangeRateLabel,
  makeFuelDetail,
} from "../utils/format";
import { coerceNumber } from "../utils/number";
import { escapeAttribute, escapeHtml, normalizeFuelType } from "../utils/sanitize";

export function renderEntry(state: AppState, entry: Entry): string {
  const language = state.settings.language || "uk";
  if (entry.type === "exchange") return renderExchangeEntry(state, entry);
  if (entry.type === "debt") return renderDebtEntry(state, entry);
  if (entry.type === "fuel") return renderFuelEntry(state, entry);

  const account = findAccount(state, entry.accountId);
  const meta = TYPE_META[entry.type] || TYPE_META.expense;
  const signedAmount = meta.sign * Number(entry.amount || 0);
  const amountClass = signedAmount >= 0 ? "is-positive" : "is-negative";
  const accountLabel = account?.name || tText(language, "Рахунок видалено");
  const currency = entry.currency || account?.currency || BASE_CURRENCY;
  const budgetNote =
    entry.type !== "income" && currency !== BASE_CURRENCY
      ? ` · ${tText(language, "ліміт")} ${formatMoney(getEntryBudgetAmount(state, entry), BASE_CURRENCY, language)}`
      : "";

  return `
    <article class="entry-item is-${entry.type}">
      <span class="entry-mark" aria-hidden="true"></span>
      <div class="entry-main">
        <strong>${escapeHtml(entry.detail)}</strong>
        <span>${tText(language, meta.label)} · ${formatDateHuman(entry.date, language)} · ${escapeHtml(
          accountLabel,
        )}${budgetNote}</span>
      </div>
      <div class="entry-amount ${amountClass}">
        ${formatSignedMoney(signedAmount, currency, language)}
      </div>
      <button class="entry-delete" type="button" data-delete-id="${escapeHtml(
        entry.id,
      )}" aria-label="${escapeAttribute(tText(language, "Видалити"))}">×</button>
    </article>
  `;
}

function renderFuelEntry(state: AppState, entry: Entry): string {
  const language = state.settings.language || "uk";
  const account = findAccount(state, entry.accountId);
  const currency = entry.currency || account?.currency || BASE_CURRENCY;
  const amount = Number(entry.amount || 0);
  const liters = Math.max(0, coerceNumber(entry.fuelLiters, 0));
  const fuelType = normalizeFuelType(entry.fuelType);
  const pricePerLiter =
    liters > 0 ? `<span class="fuel-chip">${formatMoney(amount / liters, currency, language)}/L</span>` : "";

  return `
    <article class="entry-item is-fuel">
      <span class="entry-mark" aria-hidden="true"></span>
      <div class="entry-main">
        <strong>${escapeHtml(entry.detail || makeFuelDetail(fuelType, liters, language))}</strong>
        <span>${tText(language, "Пальне")} · ${formatDateHuman(entry.date, language)} · ${escapeHtml(
          account?.name || tText(language, "Рахунок видалено"),
        )}</span>
      </div>
      <div class="entry-amount is-negative">
        ${formatSignedMoney(-amount, currency, language)}
      </div>
      <button class="entry-delete" type="button" data-delete-id="${escapeHtml(
        entry.id,
      )}" aria-label="${escapeAttribute(tText(language, "Видалити"))}">×</button>
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
        <span class="fuel-chip fuel-chip--budget">${tText(language, "не в денному ліміті")}</span>
      </div>
    </article>
  `;
}

function renderExchangeEntry(state: AppState, entry: Entry): string {
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
    language,
  );

  return `
    <article class="entry-item is-exchange">
      <span class="entry-mark" aria-hidden="true"></span>
      <div class="entry-main">
        <strong>${escapeHtml(entry.detail || tText(language, "Обмін валюти"))}</strong>
        <span>${formatDateHuman(entry.date, language)} · ${escapeHtml(
          fromAccount?.name || tText(language, "Рахунок"),
        )} → ${escapeHtml(toAccount?.name || tText(language, "Рахунок"))} · ${rateLabel}</span>
      </div>
      <div class="entry-amount entry-amount--exchange">
        <span>-${formatMoney(Number(entry.fromAmount || 0), fromCurrency, language)}</span>
        <span>+${formatMoney(Number(entry.toAmount || 0), toCurrency, language)}</span>
      </div>
      <button class="entry-delete" type="button" data-delete-id="${escapeHtml(
        entry.id,
      )}" aria-label="${escapeAttribute(tText(language, "Видалити"))}">×</button>
    </article>
  `;
}

function renderDebtEntry(state: AppState, entry: Entry): string {
  const language = state.settings.language || "uk";
  const account = findAccount(state, entry.accountId);
  const directionMeta =
    DEBT_DIRECTION_META[entry.debtDirection || "to_me"] || DEBT_DIRECTION_META.to_me;
  const closed = isDebtClosed(entry);
  const settlementAmount = getDebtSettlementTotal(entry);
  const writeOffAmount = getDebtWriteOffAmount(entry);
  const remainingAmount = getDebtRemainingAmount(entry);
  const cardAmount =
    entry.debtDirection === "by_me" && settlementAmount > 0
      ? settlementAmount
      : closed && entry.debtDirection === "to_me"
        ? writeOffAmount
        : remainingAmount;
  const signedAmount = cardAmount > 0 ? -cardAmount : 0;
  const amountClass =
    signedAmount < 0 && (entry.debtDirection === "to_me" || settlementAmount > 0)
      ? "is-negative"
      : "is-neutral";
  const currency = entry.currency || account?.currency || BASE_CURRENCY;
  const settlementAccounts = getDebtSettlements(entry)
    .map((settlement) => findAccount(state, settlement.accountId)?.name)
    .filter((name): name is string => Boolean(name));
  const settlementAccountLabel = [...new Set(settlementAccounts)].join(", ");
  const statusText = closed
    ? `${tText(language, "Закрито")} · ${formatDateHuman(entry.settlementDate || entry.date, language)}`
    : `${tText(language, "Відкрито")} · ${tText(language, "залишок")} ${formatMoney(
        remainingAmount,
        currency,
        language,
      )}`;
  const settlementText = settlementAmount
    ? ` · ${tText(language, "розрахунок")} ${formatMoney(settlementAmount, currency, language)}${
        settlementAccountLabel ? ` · ${escapeHtml(settlementAccountLabel)}` : ""
      }`
    : "";
  const writeOffText = writeOffAmount
    ? `<span class="debt-status is-writeoff">${tText(language, "Ліміт")}: -${formatMoney(
        writeOffAmount,
        BASE_CURRENCY,
        language,
      )}</span>`
    : "";
  const receipt = renderReceiptPreview(entry.receipt, language);
  const action = !closed
    ? `<button class="secondary-button debt-settle-button" type="button" data-settle-debt="${escapeHtml(
        entry.id,
      )}">${tText(language, "Розрахувались")}</button>`
    : `<span class="debt-status is-closed">${tText(language, "Закрито")}</span>`;

  return `
    <article class="entry-item is-debt ${
      closed ? "is-closed" : "is-open"
    }" data-debt-id="${escapeHtml(entry.id)}">
      <span class="entry-mark" aria-hidden="true"></span>
      <div class="entry-main">
        <strong>${escapeHtml(entry.detail)}</strong>
        <span>${tText(language, directionMeta.label)} · ${formatDateHuman(entry.date, language)} · ${escapeHtml(
          account?.name || tText(language, "Рахунок видалено"),
        )}${settlementText}</span>
      </div>
      <div class="entry-amount ${amountClass}">
        ${formatSignedMoney(signedAmount, currency, language)}
      </div>
      <button class="entry-delete" type="button" data-delete-id="${escapeHtml(
        entry.id,
      )}" aria-label="${escapeAttribute(tText(language, "Видалити"))}">×</button>
      <div class="debt-extra">
        <span class="debt-status">${statusText}</span>
        ${writeOffText}
        ${receipt}
        ${action}
      </div>
    </article>
  `;
}

export function renderAccountOption(account: Account): string {
  return `<option value="${escapeHtml(account.id)}">${escapeHtml(account.name)} · ${escapeHtml(
    account.currency,
  )}</option>`;
}

export function renderReceiptPreview(receipt?: Receipt | null, language = "uk"): string {
  if (!receipt?.dataUrl) return "";

  const name = receipt.name || tText(language, "Фото чека");
  return `
    <a class="debt-receipt" href="${escapeAttribute(receipt.dataUrl)}" target="_blank" rel="noreferrer" aria-label="${escapeAttribute(
      name,
    )}">
      <img src="${escapeAttribute(receipt.dataUrl)}" alt="${escapeAttribute(name)}" />
    </a>
  `;
}

export function renderCurrencyPill(currency: string, amount: number, language = "uk"): string {
  return `
    <article class="currency-pill">
      <span>${escapeHtml(currency)}</span>
      <strong>${formatMoney(amount, currency, language)}</strong>
    </article>
  `;
}

export function renderAccountCard(account: Account, balance: number, language = "uk"): string {
  return `
    <article class="account-card">
      <div>
        <span>${escapeHtml(tText(language, ACCOUNT_KIND_LABELS[account.kind] || ACCOUNT_KIND_LABELS.other))}</span>
        <strong>${escapeHtml(account.name)}</strong>
      </div>
      <div>
        <b>${formatMoney(balance, account.currency, language)}</b>
        <small>${tText(language, "Старт")}: ${formatMoney(account.initial, account.currency, language)}</small>
      </div>
    </article>
  `;
}

export function renderSettingsAccountRow(account: Account, language = "uk"): string {
  return `
    <article class="settings-account-row">
      <div>
        <strong>${escapeHtml(account.name)}</strong>
        <span>${escapeHtml(tText(language, ACCOUNT_KIND_LABELS[account.kind] || ACCOUNT_KIND_LABELS.other))} · ${escapeHtml(
          account.currency,
        )}</span>
      </div>
      <label class="field">
        <span>${tText(language, "Старт")}</span>
        <input data-account-initial="${escapeHtml(account.id)}" type="text" inputmode="decimal" value="${escapeHtml(
          formatInputNumber(account.initial),
        )}" />
      </label>
      <button class="entry-delete" type="button" data-delete-account="${escapeHtml(
        account.id,
      )}" aria-label="${escapeAttribute(tText(language, "Видалити рахунок"))}">×</button>
    </article>
  `;
}
