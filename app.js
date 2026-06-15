const debts = [
  {
    creditor: "мені",
    headline: "Казна Кольчина",
    card: "4441111039119668",
    line: "Микола винен мені 2417, Валік - 2608. Борги тільки мені.",
    items: [
      { debtor: "Микола", amount: 2417 },
      { debtor: "Валік", amount: 2608 },
    ],
  },
];

const money = new Intl.NumberFormat("uk-UA");
const plainMoney = new Intl.NumberFormat("uk-UA", { useGrouping: false });

const totalDebtEl = document.querySelector("#totalDebt");
const summaryGridEl = document.querySelector("#summaryGrid");
const debtGroupsEl = document.querySelector("#debtGroups");
const tickerTrackEl = document.querySelector("#tickerTrack");
const todayStampEl = document.querySelector("#todayStamp");
const copyResetTimers = new WeakMap();

function getGroupTotal(group) {
  return group.items.reduce((sum, item) => sum + item.amount, 0);
}

function getTotalDebt() {
  return debts.reduce((sum, group) => sum + getGroupTotal(group), 0);
}

function makeTickerText() {
  return debts
    .flatMap((group) =>
      group.items.map(
        (item) =>
          `${item.debtor} -> ${group.creditor}: ${plainMoney.format(item.amount)} грн`,
      ),
    )
    .join("   |   ");
}

function renderHero() {
  totalDebtEl.textContent = money.format(getTotalDebt());
  todayStampEl.textContent = new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  const tickerText = makeTickerText();
  tickerTrackEl.innerHTML = "";

  for (let i = 0; i < 2; i += 1) {
    const span = document.createElement("span");
    span.textContent = tickerText;
    tickerTrackEl.append(span);
  }
}

function renderSummary() {
  const debtors = new Set(
    debts.flatMap((group) => group.items.map((item) => item.debtor)),
  );
  const summary = [
    ["До казни", `${money.format(getTotalDebt())} грн`],
    ["Кредиторів", `${debts.length}`],
    ["Боржників", `${debtors.size}`],
    ["Записів", `${debts.reduce((sum, group) => sum + group.items.length, 0)}`],
  ];

  summaryGridEl.innerHTML = "";

  summary.forEach(([label, value]) => {
    const card = document.createElement("article");
    card.className = "summary-card";
    card.innerHTML = `<b></b><strong></strong>`;
    card.querySelector("b").textContent = label;
    card.querySelector("strong").textContent = value;
    summaryGridEl.append(card);
  });
}

function renderDebtGroups() {
  debtGroupsEl.innerHTML = "";

  debts.forEach((group) => {
    const article = document.createElement("article");
    article.className = "debt-group";

    const list = document.createElement("ul");
    list.className = "debt-list";

    group.items.forEach((item) => {
      const row = document.createElement("li");
      row.className = "debt-row";

      const person = document.createElement("div");
      person.className = "debtor";
      person.textContent = item.debtor;

      const owesTo = document.createElement("span");
      owesTo.className = "owes-to";
      owesTo.textContent = `винен ${group.creditor}`;
      person.append(owesTo);

      const amount = document.createElement("div");
      amount.className = "amount";
      amount.textContent = `${money.format(item.amount)} грн`;

      row.append(person, amount);
      list.append(row);
    });

    const quoteLine = document.createElement("p");
    quoteLine.className = "quote-line";
    quoteLine.textContent = group.line;

    const cardLine = document.createElement("div");
    cardLine.className = "card-line";
    cardLine.innerHTML = `
      <span></span>
      <strong></strong>
      <button class="copy-card-button" type="button"></button>
    `;
    cardLine.querySelector("span").textContent = "Картка для переказу";
    cardLine.querySelector("strong").textContent = formatCard(group.card);

    const copyButton = cardLine.querySelector(".copy-card-button");
    copyButton.textContent = "Копіювати";
    copyButton.dataset.copyValue = group.card;
    copyButton.disabled = !group.card || group.card === "-";

    article.innerHTML = `
      <div class="group-header">
        <h3></h3>
        <div class="group-total"></div>
      </div>
    `;
    article.querySelector("h3").textContent = group.headline;
    article.querySelector(".group-total").textContent =
      `${money.format(getGroupTotal(group))} грн`;
    article.append(list, cardLine, quoteLine);
    debtGroupsEl.append(article);
  });
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("Copy command failed");
    }
  } finally {
    textarea.remove();
  }
}

function setupCopyButtons() {
  debtGroupsEl.addEventListener("click", async (event) => {
    const button = event.target.closest(".copy-card-button");

    if (!button || button.disabled) {
      return;
    }

    try {
      await copyToClipboard(button.dataset.copyValue);
      button.textContent = "Скопійовано";
      button.classList.add("is-copied");
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");

      window.clearTimeout(copyResetTimers.get(button));
      const resetTimer = window.setTimeout(() => {
        button.textContent = "Копіювати";
        button.classList.remove("is-copied");
      }, 1800);
      copyResetTimers.set(button, resetTimer);
    } catch {
      button.textContent = "Не скопійовано";
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("error");
    }
  });
}

function formatCard(card) {
  if (!card || card === "-") {
    return "-";
  }

  return card.replace(/\d{4}(?=\d)/g, "$& ");
}

function setupTelegramShell() {
  const tg = window.Telegram?.WebApp;

  if (!tg) {
    return;
  }

  try {
    tg.ready?.();
    tg.expand?.();
    tg.setHeaderColor?.("#060708");
    tg.setBackgroundColor?.("#060708");
  } catch {
    // The page should still work as a normal GitHub Pages site.
  }
}

function render() {
  renderHero();
  renderSummary();
  renderDebtGroups();
}

setupTelegramShell();
setupCopyButtons();
render();
