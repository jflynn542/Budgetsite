const STORAGE_KEY = "budgetTrackerFullLocalData";
const LEGACY_INCOME_KEY = "budgetIncome";
const LEGACY_EXPENSES_KEY = "budgetExpenses";
const CURRENCY_SETTINGS_KEY = "budgetCurrencySettings";

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const currentDate = new Date();
let selectedPeriod = getPeriodKey(currentDate.getFullYear(), currentDate.getMonth() + 1);
let selectedYear = String(currentDate.getFullYear());
let budgetData = loadBudgetData();
let currencySettings = loadCurrencySettings();

const periodSelect = document.getElementById("periodSelect");
const yearSelect = document.getElementById("yearSelect");
const todayBtn = document.getElementById("todayBtn");
const currencySelect = document.getElementById("currencySelect");
const gbpRateInput = document.getElementById("gbpRateInput");

const incomeName = document.getElementById("incomeName");
const incomeAmount = document.getElementById("incomeAmount");
const addIncomeBtn = document.getElementById("addIncomeBtn");
const expenseName = document.getElementById("expenseName");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");
const addExpenseBtn = document.getElementById("addExpenseBtn");

const incomeDisplay = document.getElementById("incomeDisplay");
const expenseDisplay = document.getElementById("expenseDisplay");
const balanceDisplay = document.getElementById("balanceDisplay");
const profitMarginDisplay = document.getElementById("profitMarginDisplay");
const incomeList = document.getElementById("incomeList");
const expenseList = document.getElementById("expenseList");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const warningMessage = document.getElementById("warningMessage");
const clearIncomeBtn = document.getElementById("clearIncomeBtn");
const clearExpensesBtn = document.getElementById("clearExpensesBtn");

const assetName = document.getElementById("assetName");
const assetAmount = document.getElementById("assetAmount");
const addAssetBtn = document.getElementById("addAssetBtn");
const liabilityName = document.getElementById("liabilityName");
const liabilityAmount = document.getElementById("liabilityAmount");
const addLiabilityBtn = document.getElementById("addLiabilityBtn");
const assetsDisplay = document.getElementById("assetsDisplay");
const liabilitiesDisplay = document.getElementById("liabilitiesDisplay");
const netWorthDisplay = document.getElementById("netWorthDisplay");
const reserveChangeDisplay = document.getElementById("reserveChangeDisplay");
const assetList = document.getElementById("assetList");
const liabilityList = document.getElementById("liabilityList");
const clearAssetsBtn = document.getElementById("clearAssetsBtn");
const clearLiabilitiesBtn = document.getElementById("clearLiabilitiesBtn");

const overviewTableBody = document.getElementById("overviewTableBody");
const clearAllBtn = document.getElementById("clearAllBtn");

const plannerName = document.getElementById("plannerName");
const plannerAmount = document.getElementById("plannerAmount");
const plannerType = document.getElementById("plannerType");
const addPlannerBtn = document.getElementById("addPlannerBtn");
const plannerList = document.getElementById("plannerList");
const clearPlannerBtn = document.getElementById("clearPlannerBtn");
const plannedIncomeDisplay = document.getElementById("plannedIncomeDisplay");
const plannedExpenseDisplay = document.getElementById("plannedExpenseDisplay");
const plannedAssetDisplay = document.getElementById("plannedAssetDisplay");
const plannedLiabilityDisplay = document.getElementById("plannedLiabilityDisplay");


function defaultCurrencySettings() {
    return {
        activeCurrency: "EUR",
        gbpToEur: 1.17
    };
}

function loadCurrencySettings() {
    const saved = localStorage.getItem(CURRENCY_SETTINGS_KEY);
    if (!saved) {
        return defaultCurrencySettings();
    }

    try {
        const parsed = JSON.parse(saved);
        const defaults = defaultCurrencySettings();
        return {
            activeCurrency: parsed.activeCurrency === "GBP" ? "GBP" : defaults.activeCurrency,
            gbpToEur: Number(parsed.gbpToEur) > 0 ? Number(parsed.gbpToEur) : defaults.gbpToEur
        };
    } catch (error) {
        console.warn("Currency settings error", error);
        return defaultCurrencySettings();
    }
}

function saveCurrencySettings() {
    localStorage.setItem(CURRENCY_SETTINGS_KEY, JSON.stringify(currencySettings));
}

function currencySymbol(currency) {
    return currency === "GBP" ? "£" : "€";
}

function convertToEur(amount, currency) {
    const numericAmount = Number(amount) || 0;
    if (currency === "GBP") {
        return numericAmount * currencySettings.gbpToEur;
    }
    return numericAmount;
}

function convertFromEur(amountInEur, currency) {
    const numericAmount = Number(amountInEur) || 0;
    if (currency === "GBP") {
        return numericAmount / currencySettings.gbpToEur;
    }
    return numericAmount;
}

function getEntryAmountInEur(item) {
    if (item.amountEUR !== undefined) {
        return Number(item.amountEUR || 0);
    }
    return Number(item.amount || 0);
}

function normalizeEntryAmounts(data) {
    Object.keys(data.periods || {}).forEach(function (periodKey) {
        const period = data.periods[periodKey];
        ["income", "expenses", "assets", "liabilities"].forEach(function (listName) {
            period[listName] = period[listName] || [];
            period[listName].forEach(function (item) {
                if (item.amountEUR === undefined) {
                    item.amountEUR = Number(item.amount || 0);
                    item.originalAmount = Number(item.amount || 0);
                    item.currency = item.currency || "EUR";
                }
            });
        });
    });

    data.planner = data.planner || [];
    data.planner.forEach(function (item) {
        if (item.amountEUR === undefined) {
            item.amountEUR = Number(item.amount || 0);
            item.originalAmount = Number(item.amount || 0);
            item.currency = item.currency || "EUR";
        }
    });
}

function defaultData() {
    return {
        periods: {},
        planner: []
    };
}

function defaultPeriod() {
    return {
        income: [],
        expenses: [],
        assets: [],
        liabilities: []
    };
}

function loadBudgetData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            parsed.periods = parsed.periods || {};
            parsed.planner = parsed.planner || [];
            normalizeEntryAmounts(parsed);
            return parsed;
        } catch (error) {
            console.warn("Error", error);
        }
    }

    const data = defaultData();
    const oldIncome = Number(localStorage.getItem(LEGACY_INCOME_KEY)) || 0;
    const oldExpenses = JSON.parse(localStorage.getItem(LEGACY_EXPENSES_KEY) || "[]");

    if (oldIncome > 0 || oldExpenses.length > 0) {
        const period = defaultPeriod();
        if (oldIncome > 0) {
            period.income.push(createEntry("Monthly income", oldIncome, "Income", "EUR"));
        }
        period.expenses = oldExpenses.map(function (expense) {
            return createEntry(expense.name, Number(expense.amount), expense.category || "Other", "EUR");
        });
        data.periods[selectedPeriod] = period;
    }

    normalizeEntryAmounts(data);
    return data;
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgetData));
    saveCurrencySettings();
}

function getPeriodKey(year, month) {
    return year + "-" + String(month).padStart(2, "0");
}

function splitPeriodKey(periodKey) {
    const parts = periodKey.split("-");
    return {
        year: Number(parts[0]),
        month: Number(parts[1])
    };
}

function getPeriodLabel(periodKey) {
    const period = splitPeriodKey(periodKey);
    return monthNames[period.month - 1] + " " + period.year;
}

function ensurePeriod(periodKey) {
    if (!budgetData.periods[periodKey]) {
        budgetData.periods[periodKey] = defaultPeriod();
    }
    return budgetData.periods[periodKey];
}

function getPreviousPeriodKey(periodKey) {
    const period = splitPeriodKey(periodKey);
    let previousMonth = period.month - 1;
    let previousYear = period.year;

    if (previousMonth === 0) {
        previousMonth = 12;
        previousYear -= 1;
    }

    return getPeriodKey(previousYear, previousMonth);
}

function createEntry(name, amount, category, currency) {
    const entryCurrency = currency || currencySettings.activeCurrency;
    const originalAmount = Number(amount);
    const amountEUR = convertToEur(originalAmount, entryCurrency);

    return {
        id: Date.now() + Math.random().toString(16).slice(2),
        name: name,
        amount: amountEUR,
        amountEUR: amountEUR,
        originalAmount: originalAmount,
        currency: entryCurrency,
        category: category || "Other"
    };
}

function formatMoney(amountInEur) {
    const convertedAmount = convertFromEur(amountInEur, currencySettings.activeCurrency);
    const sign = convertedAmount < 0 ? "-" : "";
    return sign + currencySymbol(currencySettings.activeCurrency) + Math.abs(convertedAmount).toFixed(2);
}

function formatOriginalMoney(item) {
    const originalCurrency = item.currency || "EUR";
    const originalAmount = item.originalAmount !== undefined ? Number(item.originalAmount) : getEntryAmountInEur(item);
    const sign = originalAmount < 0 ? "-" : "";
    return sign + currencySymbol(originalCurrency) + Math.abs(originalAmount).toFixed(2);
}

function total(items) {
    return items.reduce(function (sum, item) {
        return sum + getEntryAmountInEur(item);
    }, 0);
}

function getPeriodTotals(periodKey) {
    const period = ensurePeriod(periodKey);
    const income = total(period.income);
    const expenses = total(period.expenses);
    const assets = total(period.assets);
    const liabilities = total(period.liabilities);

    return {
        income: income,
        expenses: expenses,
        profit: income - expenses,
        assets: assets,
        liabilities: liabilities,
        reserves: assets - liabilities
    };
}

function populatePeriodSelect() {
    const selected = selectedPeriod;
    periodSelect.innerHTML = "";

    const selectedDate = splitPeriodKey(selectedPeriod);
    for (let year = selectedDate.year - 2; year <= selectedDate.year + 2; year++) {
        for (let month = 1; month <= 12; month++) {
            const key = getPeriodKey(year, month);
            const option = document.createElement("option");
            option.value = key;
            option.textContent = getPeriodLabel(key);
            periodSelect.appendChild(option);
        }
    }

    periodSelect.value = selected;
}

function populateYearSelect() {
    const years = new Set([String(currentDate.getFullYear()), selectedYear]);
    Object.keys(budgetData.periods).forEach(function (periodKey) {
        years.add(periodKey.slice(0, 4));
    });

    yearSelect.innerHTML = "";
    Array.from(years).sort().forEach(function (year) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    yearSelect.value = selectedYear;
}

function renderEntryList(container, items, type) {
    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = '<p class="empty-text">Nothings added yet.</p>';
        return;
    }

    items.forEach(function (item) {
        const row = document.createElement("div");
        row.className = "entry-item";
        row.innerHTML = `
            <div class="entry-info">
                <h4>${escapeHTML(item.name)}</h4>
                <p>${escapeHTML(item.category || type)} · Logged as ${formatOriginalMoney(item)}</p>
            </div>
            <div class="entry-actions">
                <span>${formatMoney(getEntryAmountInEur(item))}</span>
                <button class="small-btn delete-btn" data-type="${type}" data-id="${item.id}">Delete</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#039;",
            '"': "&quot;"
        }[character];
    });
}

function updateMonthlyPL() {
    const period = ensurePeriod(selectedPeriod);
    const totals = getPeriodTotals(selectedPeriod);
    const margin = totals.income > 0 ? (totals.profit / totals.income) * 100 : 0;

    incomeDisplay.textContent = formatMoney(totals.income);
    expenseDisplay.textContent = formatMoney(totals.expenses);
    balanceDisplay.textContent = formatMoney(totals.profit);
    profitMarginDisplay.textContent = margin.toFixed(1) + "%";

    renderEntryList(incomeList, period.income, "income");
    renderEntryList(expenseList, period.expenses, "expenses");
    updateProgress(totals.income, totals.expenses, totals.profit);
}

function updateProgress(income, expenses, profit) {
    if (income <= 0) {
        progressFill.style.width = "0%";
        progressFill.className = "";
        progressText.textContent = "0% of income used";
        warningMessage.textContent = "Add something to begin.";
        return;
    }

    const exactPercent = (expenses / income) * 100;
    const barPercent = Math.min(exactPercent, 100);
    progressFill.style.width = barPercent + "%";
    progressText.textContent = exactPercent.toFixed(1) + "% of income used";

    progressFill.className = "";
    if (exactPercent < 60) {
        progressFill.classList.add("good-fill");
        warningMessage.textContent = "Within budget";
    } else if (exactPercent < 85) {
        progressFill.classList.add("middle-fill");
        warningMessage.textContent = "Almost used up.";
    } else if (profit >= 0) {
        progressFill.classList.add("danger-fill");
        warningMessage.textContent = "Almost used up";
    } else {
        progressFill.classList.add("danger-fill");
        warningMessage.textContent = "OVERBUDGET NIGGA";
    }
}

function updateReserves() {
    const period = ensurePeriod(selectedPeriod);
    const totals = getPeriodTotals(selectedPeriod);
    const previousTotals = getPeriodTotals(getPreviousPeriodKey(selectedPeriod));
    const change = totals.reserves - previousTotals.reserves;

    assetsDisplay.textContent = formatMoney(totals.assets);
    liabilitiesDisplay.textContent = formatMoney(totals.liabilities);
    netWorthDisplay.textContent = formatMoney(totals.reserves);
    reserveChangeDisplay.textContent = formatMoney(change);
    reserveChangeDisplay.className = change >= 0 ? "positive-text" : "negative-text";

    renderEntryList(assetList, period.assets, "assets");
    renderEntryList(liabilityList, period.liabilities, "liabilities");
}

function updateOverview() {
    overviewTableBody.innerHTML = "";

    const periods = Object.keys(budgetData.periods)
        .filter(function (periodKey) {
            return periodKey.startsWith(selectedYear);
        })
        .sort();

    if (periods.length === 0) {
        overviewTableBody.innerHTML = '<tr><td colspan="8" class="empty-row">No saved data for this year yet</td></tr>';
        return;
    }

    periods.forEach(function (periodKey) {
        const totals = getPeriodTotals(periodKey);
        const previousTotals = getPeriodTotals(getPreviousPeriodKey(periodKey));
        const reserveChange = totals.reserves - previousTotals.reserves;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${getPeriodLabel(periodKey)}</td>
            <td>${formatMoney(totals.income)}</td>
            <td>${formatMoney(totals.expenses)}</td>
            <td class="${totals.profit >= 0 ? "positive-text" : "negative-text"}">${formatMoney(totals.profit)}</td>
            <td>${formatMoney(totals.assets)}</td>
            <td>${formatMoney(totals.liabilities)}</td>
            <td>${formatMoney(totals.reserves)}</td>
            <td class="${reserveChange >= 0 ? "positive-text" : "negative-text"}">${reserveChange >= 0 ? "+" : ""}${formatMoney(reserveChange)}</td>
        `;
        overviewTableBody.appendChild(row);
    });
}

function updatePlanner() {
    const totals = {
        plannedIncome: 0,
        plannedExpense: 0,
        plannedAsset: 0,
        plannedLiability: 0
    };

    budgetData.planner.forEach(function (item) {
        totals[item.type] += getEntryAmountInEur(item);
    });

    plannedIncomeDisplay.textContent = formatMoney(totals.plannedIncome);
    plannedExpenseDisplay.textContent = formatMoney(totals.plannedExpense);
    plannedAssetDisplay.textContent = formatMoney(totals.plannedAsset);
    plannedLiabilityDisplay.textContent = formatMoney(totals.plannedLiability);

    plannerList.innerHTML = "";
    if (budgetData.planner.length === 0) {
        plannerList.innerHTML = '<p class="empty-text">No items added yet</p>';
        return;
    }

    budgetData.planner.forEach(function (item) {
        const row = document.createElement("div");
        row.className = "entry-item";
        row.innerHTML = `
            <div class="entry-info">
                <h4>${escapeHTML(item.name)}</h4>
                <p>${formatPlannerType(item.type)} · Logged as ${formatOriginalMoney(item)}</p>
            </div>
            <div class="entry-actions">
                <span>${formatMoney(getEntryAmountInEur(item))}</span>
                <button class="small-btn delete-btn" data-type="planner" data-id="${item.id}">Delete</button>
            </div>
        `;
        plannerList.appendChild(row);
    });
}

function formatPlannerType(type) {
    const labels = {
        plannedIncome: "Planned Income",
        plannedExpense: "Planned Expense",
        plannedAsset: "Asset",
        plannedLiability: "Liability"
    };
    return labels[type] || type;
}

function updateCurrencyControls() {
    if (currencySelect) {
        currencySelect.value = currencySettings.activeCurrency;
    }
    if (gbpRateInput) {
        gbpRateInput.value = currencySettings.gbpToEur;
    }

    const symbol = currencySymbol(currencySettings.activeCurrency);
    [
        [incomeAmount, "Amount"],
        [expenseAmount, "Amount"],
        [assetAmount, "Value"],
        [liabilityAmount, "Amount owed"],
        [plannerAmount, "Amount"]
    ].forEach(function (field) {
        if (field[0]) {
            field[0].placeholder = field[1] + " (" + symbol + ")";
        }
    });
}

function updateEverything() {
    ensurePeriod(selectedPeriod);
    updateCurrencyControls();
    populatePeriodSelect();
    populateYearSelect();
    updateMonthlyPL();
    updateReserves();
    updateOverview();
    updatePlanner();
    saveData();
}

function addMonthlyItem(listName, nameInput, amountInput, categoryValue) {
    const name = nameInput.value.trim();
    const amount = Number(amountInput.value);

    if (name === "" || amount <= 0) {
        alert("Enter a valid name and amount");
        return;
    }

    const period = ensurePeriod(selectedPeriod);
    period[listName].push(createEntry(name, amount, categoryValue, currencySettings.activeCurrency));

    nameInput.value = "";
    amountInput.value = "";
    updateEverything();
}

function deleteItem(type, id) {
    if (type === "planner") {
        budgetData.planner = budgetData.planner.filter(function (item) {
            return item.id !== id;
        });
        updateEverything();
        return;
    }

    const period = ensurePeriod(selectedPeriod);
    period[type] = period[type].filter(function (item) {
        return item.id !== id;
    });
    updateEverything();
}

function clearList(listName) {
    const period = ensurePeriod(selectedPeriod);
    period[listName] = [];
    updateEverything();
}

function setActiveTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(function (button) {
        button.classList.toggle("active", button.dataset.tab === tabId);
    });

    document.querySelectorAll(".tab-panel").forEach(function (panel) {
        panel.classList.toggle("active", panel.id === tabId);
    });
}

periodSelect.addEventListener("change", function () {
    selectedPeriod = periodSelect.value;
    selectedYear = selectedPeriod.slice(0, 4);
    updateEverything();
});

yearSelect.addEventListener("change", function () {
    selectedYear = yearSelect.value;
    updateEverything();
});

todayBtn.addEventListener("click", function () {
    selectedPeriod = getPeriodKey(currentDate.getFullYear(), currentDate.getMonth() + 1);
    selectedYear = String(currentDate.getFullYear());
    updateEverything();
});

currencySelect.addEventListener("change", function () {
    currencySettings.activeCurrency = currencySelect.value;
    updateEverything();
});

gbpRateInput.addEventListener("change", function () {
    const rate = Number(gbpRateInput.value);
    if (rate <= 0) {
        alert("Enter a valid conversion rate");
        updateCurrencyControls();
        return;
    }
    currencySettings.gbpToEur = rate;
    updateEverything();
});

document.querySelectorAll(".tab-btn").forEach(function (button) {
    button.addEventListener("click", function () {
        setActiveTab(button.dataset.tab);
    });
});

addIncomeBtn.addEventListener("click", function () {
    addMonthlyItem("income", incomeName, incomeAmount, "Income");
});

addExpenseBtn.addEventListener("click", function () {
    const category = expenseCategory.value;
    if (category === "") {
        alert("Choose an expense category");
        return;
    }
    addMonthlyItem("expenses", expenseName, expenseAmount, category);
    expenseCategory.value = "";
});

addAssetBtn.addEventListener("click", function () {
    addMonthlyItem("assets", assetName, assetAmount, "Asset");
});

addLiabilityBtn.addEventListener("click", function () {
    addMonthlyItem("liabilities", liabilityName, liabilityAmount, "Liability");
});

addPlannerBtn.addEventListener("click", function () {
    const name = plannerName.value.trim();
    const amount = Number(plannerAmount.value);

    if (name === "" || amount <= 0) {
        alert("Enter a valid item and amount");
        return;
    }

    const amountEUR = convertToEur(amount, currencySettings.activeCurrency);
    budgetData.planner.push({
        id: Date.now() + Math.random().toString(16).slice(2),
        name: name,
        amount: amountEUR,
        amountEUR: amountEUR,
        originalAmount: amount,
        currency: currencySettings.activeCurrency,
        type: plannerType.value
    });

    plannerName.value = "";
    plannerAmount.value = "";
    updateEverything();
});

[incomeList, expenseList, assetList, liabilityList, plannerList].forEach(function (container) {
    container.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-btn")) {
            deleteItem(event.target.dataset.type, event.target.dataset.id);
        }
    });
});

clearIncomeBtn.addEventListener("click", function () {
    clearList("income");
});

clearExpensesBtn.addEventListener("click", function () {
    clearList("expenses");
});

clearAssetsBtn.addEventListener("click", function () {
    clearList("assets");
});

clearLiabilitiesBtn.addEventListener("click", function () {
    clearList("liabilities");
});

clearPlannerBtn.addEventListener("click", function () {
    budgetData.planner = [];
    updateEverything();
});

clearAllBtn.addEventListener("click", function () {
    const confirmed = confirm("U sure u wanna delete all local budget data?");
    if (!confirmed) {
        return;
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_INCOME_KEY);
    localStorage.removeItem(LEGACY_EXPENSES_KEY);
    localStorage.removeItem(CURRENCY_SETTINGS_KEY);
    budgetData = defaultData();
    currencySettings = defaultCurrencySettings();
    updateEverything();
});

updateEverything();
