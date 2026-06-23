export type Language = "uk" | "en" | "pl";

type TranslationMap = Record<Language, string>;

export const SUPPORTED_LANGUAGES: Language[] = ["uk", "en", "pl"];

const TRANSLATIONS: Record<string, Partial<TranslationMap>> = {
  "Telegram Mini App": { en: "Telegram Mini App", pl: "Miniaplikacja Telegram" },
  "Старт": { en: "Start", pl: "Start" },
  "Старт: сьогодні": { en: "Start: today", pl: "Start: dzisiaj" },
  "Рахунки": { en: "Accounts", pl: "Konta" },
  "Завантаження...": { en: "Loading...", pl: "Ladowanie..." },
  "Сьогодні": { en: "Today", pl: "Dzisiaj" },
  "Швидкий контроль бюджету": { en: "Quick budget control", pl: "Szybka kontrola budzetu" },
  "Огляд бюджету": { en: "Budget overview", pl: "Przeglad budzetu" },
  "День 1": { en: "Day 1", pl: "Dzien 1" },
  "День {count}": { en: "Day {count}", pl: "Dzien {count}" },
  "До старту": { en: "Before start", pl: "Przed startem" },
  "Без ліміту": { en: "No limit", pl: "Bez limitu" },
  "Вимкнено": { en: "Off", pl: "Wylaczone" },
  "Загальний денний ліміт": { en: "Total daily limit", pl: "Calkowity limit dzienny" },
  "Денний ліміт вимкнено": { en: "Daily limit is off", pl: "Limit dzienny wylaczony" },
  "Нараховано": { en: "Accrued", pl: "Naliczone" },
  "Витрачено": { en: "Spent", pl: "Wydano" },
  "Щодня": { en: "Daily", pl: "Dziennie" },
  "Підписки": { en: "Subscriptions", pl: "Subskrypcje" },
  "Бюджет": { en: "Budget", pl: "Budzet" },
  "Нова операція": { en: "New transaction", pl: "Nowa transakcja" },
  "Тип операції": { en: "Transaction type", pl: "Typ transakcji" },
  "Витрата": { en: "Expense", pl: "Wydatek" },
  "Витрати": { en: "Expenses", pl: "Wydatki" },
  "Пальне": { en: "Fuel", pl: "Paliwo" },
  "АЗС або нотатка": { en: "Gas station or note", pl: "Stacja albo notatka" },
  "ОККО, WOG, траса": { en: "OKKO, WOG, highway", pl: "OKKO, WOG, trasa" },
  "Дохід": { en: "Income", pl: "Przychod" },
  "Доходи": { en: "Income", pl: "Przychody" },
  "Звідки кошти": { en: "Where the money came from", pl: "Skad pochodza srodki" },
  "Зарплата, повернення боргу": { en: "Salary, debt repayment", pl: "Pensja, zwrot dlugu" },
  "Підписка": { en: "Subscription", pl: "Subskrypcja" },
  "Назва підписки": { en: "Subscription name", pl: "Nazwa subskrypcji" },
  "YouTube, Spotify, хостинг": { en: "YouTube, Spotify, hosting", pl: "YouTube, Spotify, hosting" },
  "Обмін": { en: "Exchange", pl: "Wymiana" },
  "Обміни": { en: "Exchanges", pl: "Wymiany" },
  "Борг": { en: "Debt", pl: "Dlug" },
  "Борги": { en: "Debts", pl: "Dlugi" },
  "Хто і за що": { en: "Who and what for", pl: "Kto i za co" },
  "Імʼя, чек, за що борг": { en: "Name, receipt, what the debt is for", pl: "Imie, paragon, za co dlug" },
  "Напрям боргу": { en: "Debt direction", pl: "Kierunek dlugu" },
  "Мені винні": { en: "Owed to me", pl: "Ktos mi winien" },
  "Я винен": { en: "I owe", pl: "Ja jestem winien" },
  "Вид палива": { en: "Fuel type", pl: "Rodzaj paliwa" },
  "А-95, дизель, газ": { en: "A-95, diesel, gas", pl: "A-95, diesel, gaz" },
  "Залито, л": { en: "Filled, L", pl: "Zatankowano, l" },
  "Пальне не знімається з денного ліміту": {
    en: "Fuel does not reduce the daily limit",
    pl: "Paliwo nie zmniejsza limitu dziennego",
  },
  "Заплатив": { en: "Paid", pl: "Zaplacono" },
  "Сума": { en: "Amount", pl: "Kwota" },
  "Рахунок": { en: "Account", pl: "Konto" },
  "Для ліміту, грн": { en: "For limit, UAH", pl: "Do limitu, UAH" },
  "Дата": { en: "Date", pl: "Data" },
  "На що витрачено": { en: "What was it for", pl: "Na co wydano" },
  "Продукти, кава, таксі": { en: "Groceries, coffee, taxi", pl: "Zakupy, kawa, taxi" },
  "Фото чека": { en: "Receipt photo", pl: "Zdjecie paragonu" },
  "Додати фото": { en: "Add photo", pl: "Dodaj zdjecie" },
  "Можна додати фото або скрін чека": {
    en: "You can add a receipt photo or screenshot",
    pl: "Mozesz dodac zdjecie albo zrzut paragonu",
  },
  "Віддав з": { en: "Sent from", pl: "Wydano z" },
  "Отримав на": { en: "Received to", pl: "Otrzymano na" },
  "Деталі": { en: "Details", pl: "Szczegoly" },
  "Обмін, переказ між рахунками": {
    en: "Exchange, transfer between accounts",
    pl: "Wymiana, przelew miedzy kontami",
  },
  "Поміняти напрям": { en: "Swap direction", pl: "Zmien kierunek" },
  "Курс зʼявиться після сум": {
    en: "Rate appears after amounts",
    pl: "Kurs pojawi sie po wpisaniu kwot",
  },
  "Додати": { en: "Add", pl: "Dodaj" },
  "Останні операції": { en: "Recent transactions", pl: "Ostatnie transakcje" },
  "Фільтр операцій": { en: "Transaction filter", pl: "Filtr transakcji" },
  "Усі": { en: "All", pl: "Wszystkie" },
  "Назад": { en: "Back", pl: "Wstecz" },
  "Далі": { en: "Next", pl: "Dalej" },
  "Сторінка {page} з {total}": { en: "Page {page} of {total}", pl: "Strona {page} z {total}" },
  "Ліміти, баланси і валюти": { en: "Limits, balances and currencies", pl: "Limity, salda i waluty" },
  "Мої гроші": { en: "My money", pl: "Moje pieniadze" },
  "Додай картки, готівку або валютні рахунки": {
    en: "Add cards, cash or currency accounts",
    pl: "Dodaj karty, gotowke albo konta walutowe",
  },
  "Додати рахунок": { en: "Add account", pl: "Dodaj konto" },
  "Ліміти": { en: "Limits", pl: "Limity" },
  "Старт бюджету, денний ліміт і бюджет підписок": {
    en: "Budget start, daily limit and subscription budget",
    pl: "Start budzetu, limit dzienny i budzet subskrypcji",
  },
  "Дата старту": { en: "Start date", pl: "Data startu" },
  "Денний ліміт, грн": { en: "Daily limit, UAH", pl: "Limit dzienny, UAH" },
  "Підписки, грн": { en: "Subscriptions, UAH", pl: "Subskrypcje, UAH" },
  "Вести денний ліміт": { en: "Track daily limit", pl: "Sledz limit dzienny" },
  "Коли вимкнено, апка не рахує залишок на день, але операції зберігаються.": {
    en: "When off, the app does not calculate daily remaining, but transactions are saved.",
    pl: "Gdy wylaczone, aplikacja nie liczy dziennej reszty, ale zapisuje transakcje.",
  },
  "Новий рахунок": { en: "New account", pl: "Nowe konto" },
  "Картка, готівка або будь-яка валюта": {
    en: "Card, cash or any currency",
    pl: "Karta, gotowka albo dowolna waluta",
  },
  "Назва": { en: "Name", pl: "Nazwa" },
  "Тип": { en: "Type", pl: "Typ" },
  "Картка": { en: "Card", pl: "Karta" },
  "Готівка": { en: "Cash", pl: "Gotowka" },
  "Накопичення": { en: "Savings", pl: "Oszczednosci" },
  "Інше": { en: "Other", pl: "Inne" },
  "Валюта": { en: "Currency", pl: "Waluta" },
  "Стартовий баланс": { en: "Starting balance", pl: "Saldo poczatkowe" },
  "Список рахунків": { en: "Account list", pl: "Lista kont" },
  "Можна змінити стартовий баланс або видалити порожній рахунок": {
    en: "You can edit starting balance or delete an empty account",
    pl: "Mozesz zmienic saldo poczatkowe albo usunac puste konto",
  },
  "Зберегти": { en: "Save", pl: "Zapisz" },
  "Аналітика": { en: "Analytics", pl: "Analityka" },
  "Що і скільки було витрачено": {
    en: "What was spent and how much",
    pl: "Co i ile zostalo wydane",
  },
  "Підсумки витрат": { en: "Expense summary", pl: "Podsumowanie wydatkow" },
  "Всього за період": { en: "Total for period", pl: "Razem za okres" },
  "Звичайні витрати": { en: "Regular expenses", pl: "Zwykle wydatki" },
  "Графік витрат": { en: "Expense chart", pl: "Wykres wydatkow" },
  "Без обмінів, у грн еквіваленті": {
    en: "Excluding exchanges, in UAH equivalent",
    pl: "Bez wymian, w ekwiwalencie UAH",
  },
  "Період графіка": { en: "Chart period", pl: "Okres wykresu" },
  "Тиждень": { en: "Week", pl: "Tydzien" },
  "Місяць": { en: "Month", pl: "Miesiac" },
  "Пів року": { en: "Half year", pl: "Pol roku" },
  "Оборот": { en: "Turnover", pl: "Obrot" },
  "Пропозиції, внески та інвестори": {
    en: "Proposals, contributions and investors",
    pl: "Propozycje, skladki i inwestorzy",
  },
  "Нова пропозиція": { en: "New proposal", pl: "Nowa propozycja" },
  "Сума, люди, частки внеску та інвесторські кошти": {
    en: "Amount, people, contribution shares and investor funds",
    pl: "Kwota, osoby, udzialy i srodki inwestorow",
  },
  "Що купуємо": { en: "What are we buying", pl: "Co kupujemy" },
  "2 фулл сета тренірувального комплекту": {
    en: "2 full training kit sets",
    pl: "2 pelne zestawy treningowe",
  },
  "Потрібна сума": { en: "Required amount", pl: "Potrzebna kwota" },
  "Люди": { en: "People", pl: "Osoby" },
  "Антон, Максим, Іра": { en: "Anton, Maksym, Ira", pl: "Anton, Maksym, Ira" },
  "Створити пропозицію": { en: "Create proposal", pl: "Utworz propozycje" },
  "Пропозицій ще немає": { en: "No proposals yet", pl: "Brak propozycji" },
  "Потрібно": { en: "Needed", pl: "Potrzeba" },
  "Потрібно: {amount}": { en: "Needed: {amount}", pl: "Potrzeba: {amount}" },
  "Покрито": { en: "Covered", pl: "Pokryto" },
  "Інвестовано": { en: "Funded", pl: "Zainwestowano" },
  "Зібрано": { en: "Collected", pl: "Zebrano" },
  "Зібрано: {amount}": { en: "Collected: {amount}", pl: "Zebrano: {amount}" },
  "Не вистачає": { en: "Missing", pl: "Brakuje" },
  "Не вистачає: {amount}": { en: "Missing: {amount}", pl: "Brakuje: {amount}" },
  "Частки зараз {percent}%": {
    en: "Shares are {percent}%",
    pl: "Udzialy wynosza {percent}%",
  },
  "Учасники": { en: "Participants", pl: "Uczestnicy" },
  "Імʼя учасника": { en: "Participant name", pl: "Imie uczestnika" },
  "Додати людину": { en: "Add person", pl: "Dodaj osobe" },
  "Вніс {paid} із {target}": {
    en: "Paid {paid} of {target}",
    pl: "Wplacono {paid} z {target}",
  },
  "Частка": { en: "Share", pl: "Udzial" },
  "Внесків ще немає": { en: "No contributions yet", pl: "Brak wplat" },
  "Внесок": { en: "Contribution", pl: "Wplata" },
  "Інвестору {name}": { en: "To investor {name}", pl: "Inwestorowi {name}" },
  "Записати внесок": { en: "Record contribution", pl: "Zapisz wplate" },
  "{name}: сплатив {paid}, ще {remaining}": {
    en: "{name}: paid {paid}, still owes {remaining}",
    pl: "{name}: zaplacono {paid}, jeszcze {remaining}",
  },
  "Інвестори": { en: "Investors", pl: "Inwestorzy" },
  "Повернено {amount}": { en: "{amount} returned", pl: "Zwrocono {amount}" },
  "Інвесторів ще немає": { en: "No investors yet", pl: "Brak inwestorow" },
  "Імʼя інвестора": { en: "Investor name", pl: "Imie inwestora" },
  "Додати інвестора": { en: "Add investor", pl: "Dodaj inwestora" },
  "Повернень ще немає": { en: "No repayments yet", pl: "Brak zwrotow" },
  "Дав {amount}": { en: "Funded {amount}", pl: "Dal {amount}" },
  "Залишок {amount}": { en: "{amount} left", pl: "Pozostalo {amount}" },
  "Записати повернення": { en: "Record repayment", pl: "Zapisz zwrot" },
  "{name}: дав {amount}, повернулось {returned}, ще {remaining}": {
    en: "{name}: funded {amount}, returned {returned}, left {remaining}",
    pl: "{name}: dal {amount}, zwrocono {returned}, zostalo {remaining}",
  },
  "немає": { en: "none", pl: "brak" },
  "Підсумок для копіювання": { en: "Copyable summary", pl: "Podsumowanie do skopiowania" },
  "Хто скільки заплатив, скільки ще винен, інвестори та повернення": {
    en: "Who paid what, what is still owed, investors and repayments",
    pl: "Kto ile zaplacil, ile jeszcze winien, inwestorzy i zwroty",
  },
  "Копіювати": { en: "Copy", pl: "Kopiuj" },
  "Налаштування": { en: "Settings", pl: "Ustawienia" },
  "Мова, дані і резервна копія": { en: "Language, data and backup", pl: "Jezyk, dane i kopia" },
  "Інтерфейс": { en: "Interface", pl: "Interfejs" },
  "Мову збережемо в налаштуваннях застосунку": {
    en: "Language is saved in app settings",
    pl: "Jezyk zapiszemy w ustawieniach aplikacji",
  },
  "Мова додатка": { en: "App language", pl: "Jezyk aplikacji" },
  "Українська": { en: "Ukrainian", pl: "Ukrainski" },
  "Резервна копія": { en: "Backup", pl: "Kopia zapasowa" },
  "Локально, Telegram Storage і JSON backup": {
    en: "Local, Telegram Storage and JSON backup",
    pl: "Lokalnie, Telegram Storage i kopia JSON",
  },
  "Експорт": { en: "Export", pl: "Eksport" },
  "Імпорт": { en: "Import", pl: "Import" },
  "Основна навігація": { en: "Main navigation", pl: "Glowna nawigacja" },
  "Головна": { en: "Home", pl: "Start" },
  "Меню": { en: "Menu", pl: "Menu" },
  "Розрахунок": { en: "Settlement", pl: "Rozliczenie" },
  "Закрити": { en: "Close", pl: "Zamknij" },
  "Закрити борг": { en: "Close debt", pl: "Zamknij dlug" },
  "Зберегти розрахунок": { en: "Save settlement", pl: "Zapisz rozliczenie" },
  "Додати ще рахунок": { en: "Add another account", pl: "Dodaj kolejne konto" },
  "Списати з рахунку": { en: "Pay from account", pl: "Zaplac z konta" },
  "Зарахувати на рахунок": { en: "Receive to account", pl: "Przyjmij na konto" },
  "Позначити борг закритим": { en: "Mark debt as closed", pl: "Oznacz dlug jako zamkniety" },
  "Якщо вимкнено, сума буде записана, але борг лишиться відкритим.": {
    en: "When off, the amount is saved but the debt stays open.",
    pl: "Gdy wylaczone, kwota zostanie zapisana, ale dlug pozostanie otwarty.",
  },
  "Кому винен і за що": { en: "Who you owe and why", pl: "Komu i za co jestes winien" },
  "Хто винен і за що": { en: "Who owes and why", pl: "Kto i za co jest winien" },
  "Імʼя, чек, за що тобі винні": {
    en: "Name, receipt, what they owe for",
    pl: "Imie, paragon, za co ktos jest winien",
  },
  "Імʼя, за що ти винен": { en: "Name, what you owe for", pl: "Imie, za co jestes winien" },
  "Скільки повернули": { en: "How much was returned", pl: "Ile zwrocono" },
  "Скільки віддав": { en: "How much you paid", pl: "Ile oddales" },
  "Хто повернув": { en: "Who returned it", pl: "Kto zwrocil" },
  "Кому віддав": { en: "Who you paid", pl: "Komu oddales" },
  "Імʼя або нотатка": { en: "Name or note", pl: "Imie albo notatka" },
  "Історія розрахунків": { en: "Settlement history", pl: "Historia rozliczen" },
  "Повернув": { en: "Returned", pl: "Zwrocono" },
  "Віддав": { en: "Paid", pl: "Oddano" },
  "Якщо повернули менше за борг, різниця спишеться з денного ліміту на дату розрахунку.": {
    en: "If less than the debt was returned, the difference is deducted from the daily limit on settlement date.",
    pl: "Jesli zwrocono mniej niz dlug, roznica trafi do limitu dziennego w dniu rozliczenia.",
  },
  "Основна сума боргу денний ліміт не чіпає. Переплата понад борг спишеться з денного ліміту.": {
    en: "The principal debt does not affect the daily limit. Any overpayment is deducted from the daily limit.",
    pl: "Glowna kwota dlugu nie rusza limitu dziennego. Nadplata trafi do limitu dziennego.",
  },
  "Рахунок видалено": { en: "Account deleted", pl: "Konto usuniete" },
  "ліміт": { en: "limit", pl: "limit" },
  "не в денному ліміті": { en: "not in daily limit", pl: "poza limitem dziennym" },
  "Обмін валюти": { en: "Currency exchange", pl: "Wymiana waluty" },
  "Розрахувались": { en: "Settled", pl: "Rozliczono" },
  "Закрито": { en: "Closed", pl: "Zamkniete" },
  "Відкрито": { en: "Open", pl: "Otwarte" },
  "залишок": { en: "remaining", pl: "pozostalo" },
  "розрахунок": { en: "settlement", pl: "rozliczenie" },
  "Вже розраховано": { en: "Already settled", pl: "Juz rozliczono" },
  "Ліміт": { en: "Limit", pl: "Limit" },
  "Видалити": { en: "Delete", pl: "Usun" },
  "Видалити рахунок": { en: "Delete account", pl: "Usun konto" },
  "Операцій ще немає": { en: "No transactions yet", pl: "Brak transakcji" },
  "Рахунків ще немає": { en: "No accounts yet", pl: "Brak kont" },
  "Поки немає рахунків": { en: "No accounts yet", pl: "Brak kont" },
  "Натисни “Додати рахунок”, щоб почати": {
    en: "Tap “Add account” to start",
    pl: "Nacisnij „Dodaj konto”, aby zaczac",
  },
  "Додай рахунок у налаштуваннях": {
    en: "Add an account in settings",
    pl: "Dodaj konto w ustawieniach",
  },
  "{accounts} рах. · {currencies} валют": {
    en: "{accounts} acc. · {currencies} currencies",
    pl: "{accounts} kont · {currencies} walut",
  },
  "За {period}: {amount}": { en: "{amount} for {period}", pl: "{amount} za {period}" },
  "тиждень": { en: "week", pl: "tydzien" },
  "місяць": { en: "month", pl: "miesiac" },
  "пів року": { en: "half year", pl: "pol roku" },
  "Пальне: {fuelType}, {liters} л": {
    en: "Fuel: {fuelType}, {liters} L",
    pl: "Paliwo: {fuelType}, {liters} l",
  },
  "Курс не пораховано": { en: "Rate not calculated", pl: "Kurs nie obliczony" },
  "1 {toCurrency} = {rate} UAH": { en: "1 {toCurrency} = {rate} UAH", pl: "1 {toCurrency} = {rate} UAH" },
  "1 {fromCurrency} = {rate} UAH": { en: "1 {fromCurrency} = {rate} UAH", pl: "1 {fromCurrency} = {rate} UAH" },
  "1 {fromCurrency} = {rate} {toCurrency}": {
    en: "1 {fromCurrency} = {rate} {toCurrency}",
    pl: "1 {fromCurrency} = {rate} {toCurrency}",
  },
  "Локальне сховище недоступне": { en: "Local storage is unavailable", pl: "Pamiec lokalna niedostepna" },
  "Спочатку додай рахунок": { en: "Add an account first", pl: "Najpierw dodaj konto" },
  "Вкажи суму більше нуля": { en: "Enter an amount greater than zero", pl: "Wpisz kwote wieksza od zera" },
  "Вкажи звідки кошти": { en: "Enter where the money came from", pl: "Wpisz skad pochodza srodki" },
  "Вкажи деталі": { en: "Enter details", pl: "Wpisz szczegoly" },
  "Збережено": { en: "Saved", pl: "Zapisano" },
  "Обери рахунки для обміну": { en: "Choose accounts for exchange", pl: "Wybierz konta do wymiany" },
  "Рахунки мають бути різні": { en: "Accounts must be different", pl: "Konta musza byc rozne" },
  "Вкажи скільки віддав і скільки отримав": {
    en: "Enter how much you sent and received",
    pl: "Wpisz ile wydales i ile otrzymales",
  },
  "Обмін збережено": { en: "Exchange saved", pl: "Wymiana zapisana" },
  "Вкажи суму боргу більше нуля": {
    en: "Enter debt amount greater than zero",
    pl: "Wpisz kwote dlugu wieksza od zera",
  },
  "Вкажи хто і за що винен": { en: "Enter who owes and why", pl: "Wpisz kto i za co jest winien" },
  "Борг збережено": { en: "Debt saved", pl: "Dlug zapisany" },
  "Цей борг вже закрито": { en: "This debt is already closed", pl: "Ten dlug jest juz zamkniety" },
  "Обери рахунок для розрахунку": { en: "Choose settlement account", pl: "Wybierz konto rozliczenia" },
  "Для боргу обери рахунок у тій самій валюті": {
    en: "Choose an account in the same currency for this debt",
    pl: "Wybierz konto w tej samej walucie dla dlugu",
  },
  "Сума має бути числом від нуля": {
    en: "Amount must be a number from zero",
    pl: "Kwota musi byc liczba od zera",
  },
  "Вкажи дату розрахунку": { en: "Enter settlement date", pl: "Wpisz date rozliczenia" },
  "Борг закрито": { en: "Debt closed", pl: "Dlug zamkniety" },
  "Розрахунок збережено": { en: "Settlement saved", pl: "Rozliczenie zapisane" },
  "Вкажи суму або познач борг закритим": {
    en: "Enter an amount or mark the debt as closed",
    pl: "Wpisz kwote albo oznacz dlug jako zamkniety",
  },
  "Налаштування збережено": { en: "Settings saved", pl: "Ustawienia zapisane" },
  "Вкажи назву рахунку": { en: "Enter account name", pl: "Wpisz nazwe konta" },
  "Вкажи валюту рахунку": { en: "Enter account currency", pl: "Wpisz walute konta" },
  "Стартовий баланс має бути числом": {
    en: "Starting balance must be a number",
    pl: "Saldo poczatkowe musi byc liczba",
  },
  "Рахунок додано": { en: "Account added", pl: "Konto dodane" },
  "Вкажи назву пропозиції": {
    en: "Enter proposal title",
    pl: "Wpisz nazwe propozycji",
  },
  "Вкажи потрібну суму більше нуля": {
    en: "Enter a required amount greater than zero",
    pl: "Wpisz potrzebna kwote wieksza od zera",
  },
  "Вкажи валюту": { en: "Enter currency", pl: "Wpisz walute" },
  "Додай хоча б одну людину": {
    en: "Add at least one person",
    pl: "Dodaj przynajmniej jedna osobe",
  },
  "Пропозицію створено": { en: "Proposal created", pl: "Propozycja utworzona" },
  "Частку оновлено": { en: "Share updated", pl: "Udzial zaktualizowany" },
  "Видалити цю пропозицію?": {
    en: "Delete this proposal?",
    pl: "Usunac te propozycje?",
  },
  "Пропозицію видалено": { en: "Proposal deleted", pl: "Propozycja usunieta" },
  "Вкажи імʼя учасника": {
    en: "Enter participant name",
    pl: "Wpisz imie uczestnika",
  },
  "Учасника додано": { en: "Participant added", pl: "Uczestnik dodany" },
  "Вкажи імʼя інвестора": {
    en: "Enter investor name",
    pl: "Wpisz imie inwestora",
  },
  "Вкажи суму інвестора більше нуля": {
    en: "Enter investor amount greater than zero",
    pl: "Wpisz kwote inwestora wieksza od zera",
  },
  "Інвестора додано": { en: "Investor added", pl: "Inwestor dodany" },
  "Вкажи хто повернув інвестору": {
    en: "Enter who repaid the investor",
    pl: "Wpisz kto zwrocil inwestorowi",
  },
  "Обери хто повернув інвестору": {
    en: "Choose who repaid the investor",
    pl: "Wybierz kto zwrocil inwestorowi",
  },
  "Вкажи суму повернення більше нуля": {
    en: "Enter repayment amount greater than zero",
    pl: "Wpisz kwote zwrotu wieksza od zera",
  },
  "Вкажи дату повернення": {
    en: "Enter repayment date",
    pl: "Wpisz date zwrotu",
  },
  "Повернення записано": { en: "Repayment recorded", pl: "Zwrot zapisany" },
  "Вкажи суму внеску більше нуля": {
    en: "Enter contribution amount greater than zero",
    pl: "Wpisz kwote wplaty wieksza od zera",
  },
  "Вкажи дату внеску": { en: "Enter contribution date", pl: "Wpisz date wplaty" },
  "Внесок записано": { en: "Contribution recorded", pl: "Wplata zapisana" },
  "Немає що копіювати": { en: "Nothing to copy", pl: "Nie ma czego kopiowac" },
  "Підсумок скопійовано": { en: "Summary copied", pl: "Podsumowanie skopiowane" },
  "Не вдалося скопіювати": { en: "Could not copy", pl: "Nie udalo sie skopiowac" },
  "Вкажи дату старту": { en: "Enter start date", pl: "Wpisz date startu" },
  "У сумах мають бути тільки числа": {
    en: "Amounts must contain numbers only",
    pl: "Kwoty musza zawierac tylko liczby",
  },
  "Бюджети не можуть бути мінусовими": {
    en: "Budgets cannot be negative",
    pl: "Budzety nie moga byc ujemne",
  },
  "Стартові баланси мають бути числами": {
    en: "Starting balances must be numbers",
    pl: "Salda poczatkowe musza byc liczbami",
  },
  "Для валютної витрати вкажи еквівалент у грн": {
    en: "For foreign-currency expense, enter UAH equivalent",
    pl: "Dla wydatku walutowego wpisz ekwiwalent w UAH",
  },
  "Вкажи вид палива": { en: "Enter fuel type", pl: "Wpisz rodzaj paliwa" },
  "Вкажи скільки літрів залито": { en: "Enter how many liters were filled", pl: "Wpisz ile litrow zatankowano" },
  "Синхронізація...": { en: "Syncing...", pl: "Synchronizacja..." },
  "Локально збережено": { en: "Saved locally", pl: "Zapisano lokalnie" },
  "Backup створено": { en: "Backup created", pl: "Kopia utworzona" },
  "Файл backup не вдалося прочитати": {
    en: "Could not read backup file",
    pl: "Nie udalo sie odczytac kopii",
  },
  "Замінити поточні дані імпортом?": {
    en: "Replace current data with import?",
    pl: "Zastapic obecne dane importem?",
  },
  "Імпортовано": { en: "Imported", pl: "Zaimportowano" },
  "Спочатку додай рахунок для розрахунку": {
    en: "Add an account for settlement first",
    pl: "Najpierw dodaj konto do rozliczenia",
  },
  "Чек має бути зображенням": { en: "Receipt must be an image", pl: "Paragon musi byc obrazem" },
  "Фото чека не вдалося прочитати": {
    en: "Could not read receipt photo",
    pl: "Nie udalo sie odczytac zdjecia paragonu",
  },
  "Обрано: {name}": { en: "Selected: {name}", pl: "Wybrano: {name}" },
  "Видалити цю операцію?": { en: "Delete this transaction?", pl: "Usunac te transakcje?" },
  "Операцію видалено": { en: "Transaction deleted", pl: "Transakcja usunieta" },
  "Цей рахунок вже має історію, його не можна видалити": {
    en: "This account already has history and cannot be deleted",
    pl: "To konto ma juz historie i nie mozna go usunac",
  },
  "Видалити рахунок?": { en: "Delete account?", pl: "Usunac konto?" },
  "Я розрахувався": { en: "I settled", pl: "Rozliczylem sie" },
  "Зі мною розрахувались": { en: "Settled with me", pl: "Rozliczono sie ze mna" },
};

const originalTextNodes = new WeakMap<Text, string>();

export function normalizeLanguage(value: unknown): Language {
  const language = String(value || "uk").trim().toLowerCase();
  return SUPPORTED_LANGUAGES.includes(language as Language) ? (language as Language) : "uk";
}

export function localeForLanguage(language: unknown): string {
  const normalized = normalizeLanguage(language);
  if (normalized === "en") return "en-US";
  if (normalized === "pl") return "pl-PL";
  return "uk-UA";
}

export function tText(language: unknown, text: string, values: Record<string, string | number> = {}): string {
  const normalized = normalizeLanguage(language);
  const template = normalized === "uk" ? text : TRANSLATIONS[text]?.[normalized] || text;
  return template.replace(/\{(\w+)\}/g, (_match, key) => String(values[key] ?? ""));
}

export function translateDocument(language: unknown, root: ParentNode = document): void {
  translateTextNodes(language, root);
  translateAttributes(language, root);
}

function translateTextNodes(language: unknown, root: ParentNode): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

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

function translateAttributes(language: unknown, root: ParentNode): void {
  const elements = root.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title], option");
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

function translateAttribute(language: unknown, element: HTMLElement, attribute: string): void {
  const value = element.getAttribute(attribute);
  if (!value) return;

  const dataKey = `i18nOriginal${attribute
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
  const dataset = element.dataset as Record<string, string | undefined>;
  const original = dataset[dataKey] || value;

  if (!TRANSLATIONS[original]) return;

  dataset[dataKey] = original;
  element.setAttribute(attribute, tText(language, original));
}
