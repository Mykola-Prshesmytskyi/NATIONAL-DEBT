const debts = [
  {
    creditor: "Антон",
    headline: "Антону винні",
    card: "-",
    line: "Валік Антону винен 1090, Микола - 557, я - 231",
    items: [
      { debtor: "Валік", amount: 1090 },
      { debtor: "Микола", amount: 557 },
      { debtor: "Я", amount: 231 },
    ],
  },
  {
    creditor: "мені",
    headline: "Мені винні",
    card: "4441111039119668",
    line: "Микола винен мені 1358, Валік - 265",
    items: [
      { debtor: "Микола", amount: 1358 },
      { debtor: "Валік", amount: 265 },
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

function getGroupTotal(group) {
  return group.items.reduce((sum, item) => sum + item.amount, 0);
}

function getTotalDebt() {
  return debts.reduce((sum, group) => sum + getGroupTotal(group), 0);
}

function makeTickerText() {
  return debts
    .flatMap((group) =>
      group.items.map((item) => `${item.debtor} -> ${group.creditor}: ${plainMoney.format(item.amount)} грн`)
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
  const debtors = new Set(debts.flatMap((group) => group.items.map((item) => item.debtor)));
  const summary = [
    ["Всього", `${money.format(getTotalDebt())} грн`],
    ["Кому винні", `${debts.length}`],
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
    cardLine.innerHTML = `<span></span><strong></strong>`;
    cardLine.querySelector("span").textContent = "Картка";
    cardLine.querySelector("strong").textContent = formatCard(group.card);

    article.innerHTML = `
      <div class="group-header">
        <h3></h3>
        <div class="group-total"></div>
      </div>
    `;
    article.querySelector("h3").textContent = group.headline;
    article.querySelector(".group-total").textContent = `${money.format(getGroupTotal(group))} грн`;
    article.append(list, cardLine, quoteLine);
    debtGroupsEl.append(article);
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
    tg.setHeaderColor?.("#050504");
    tg.setBackgroundColor?.("#050504");
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
render();
