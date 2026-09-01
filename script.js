/* =========================================
   PEACOCK EXPENSE TRACKER
========================================= */

let transactions =
    JSON.parse(localStorage.getItem("transactions")) || [];

let budget =
    Number(localStorage.getItem("budget")) || 0;

let financeChart;
let categoryChart;
let weeklyChart;


/* =========================================
   PAGE NAVIGATION
========================================= */

function showLogin() {

    document.getElementById("welcomePage")
        .classList.remove("active");

    document.getElementById("loginPage")
        .classList.add("active");
}


function login(event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    localStorage.setItem("userEmail", email);

    document.getElementById("welcomePage")
        .classList.remove("active");

    document.getElementById("loginPage")
        .classList.remove("active");

    document.getElementById("dashboardPage")
        .classList.add("active");

    document.getElementById("profileEmail")
        .textContent = email;

    document.getElementById("profileName")
        .textContent =
        email.split("@")[0];

    updateDashboard();
}


function logout() {

    document.getElementById("dashboardPage")
        .classList.remove("active");

    document.getElementById("welcomePage")
        .classList.add("active");
}


/* =========================================
   SECTION NAVIGATION
========================================= */

function showSection(sectionId, button = null) {

    document.querySelectorAll(".content-section")
        .forEach(section => {
            section.classList.remove("active-section");
        });

    document.getElementById(sectionId)
        .classList.add("active-section");


    document.querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.remove("active");
        });

    if (button) {
        button.classList.add("active");
    }


    const titles = {
        dashboard: "Dashboard",
        transactions: "Transaction History",
        budget: "Budget",
        reports: "Weekly Report"
    };

    document.getElementById("sectionTitle")
        .textContent =
        titles[sectionId];


    if (sectionId === "reports") {
        updateWeeklyReport();
    }

    if (sectionId === "budget") {
        updateBudget();
    }

    if (sectionId === "transactions") {
        displayTransactions();
    }
}


/* =========================================
   MODAL
========================================= */

function openTransactionModal(type) {

    const modal =
        document.getElementById("transactionModal");

    modal.classList.add("show");

    document.getElementById("transactionType")
        .value = type;

    document.getElementById("modalTitle")
        .textContent =
        type === "income"
            ? "Add Income"
            : "Add Expense";

    document.getElementById("transactionDate")
        .valueAsDate = new Date();
}


function closeTransactionModal() {

    document.getElementById("transactionModal")
        .classList.remove("show");
}


/* =========================================
   ADD TRANSACTION
========================================= */

function addTransaction(event) {

    event.preventDefault();

    const type =
        document.getElementById("transactionType").value;

    const amount =
        Number(document.getElementById("amount").value);

    const category =
        document.getElementById("category").value;

    const description =
        document.getElementById("description").value;

    const date =
        document.getElementById("transactionDate").value;


    const transaction = {

        id: Date.now(),

        type: type,

        amount: amount,

        category: category,

        description:
            description || category,

        date: date

    };


    transactions.push(transaction);

    saveTransactions();

    closeTransactionModal();

    document.querySelector(
        "#transactionModal form"
    ).reset();

    updateDashboard();

    alert(
        type === "income"
            ? "Income added successfully!"
            : "Expense added successfully!"
    );
}


/* =========================================
   LOCAL STORAGE
========================================= */

function saveTransactions() {

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}


/* =========================================
   CALCULATIONS
========================================= */

function calculateTotals() {

    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {

        if (transaction.type === "income") {

            income += transaction.amount;

        } else {

            expense += transaction.amount;

        }

    });

    return {
        income,
        expense,
        balance: income - expense
    };
}


/* =========================================
   DASHBOARD
========================================= */

function updateDashboard() {

    const totals =
        calculateTotals();


    document.getElementById("totalIncome")
        .textContent =
        formatCurrency(totals.income);


    document.getElementById("totalExpense")
        .textContent =
        formatCurrency(totals.expense);


    document.getElementById("netBalance")
        .textContent =
        formatCurrency(totals.balance);


    const budgetRemaining =
        budget - totals.expense;

    document.getElementById("budgetLeft")
        .textContent =
        formatCurrency(
            Math.max(budgetRemaining, 0)
        );


    displayRecentTransactions();

    createCharts();

    updateBudget();

    updateWeeklyReport();
}


/* =========================================
   CURRENCY
========================================= */

function formatCurrency(amount) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(amount);
}


/* =========================================
   RECENT TRANSACTIONS
========================================= */

function displayRecentTransactions() {

    const container =
        document.getElementById(
            "recentTransactions"
        );

    const recent =
        [...transactions]
        .sort((a, b) =>
            new Date(b.date) -
            new Date(a.date)
        )
        .slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML =
            `<p class="empty">
                No transactions yet.
            </p>`;

        return;
    }


    container.innerHTML =
        recent.map(
            createTransactionHTML
        ).join("");
}


/* =========================================
   HISTORY
========================================= */

function displayTransactions() {

    const container =
        document.getElementById(
            "transactionHistory"
        );

    const filter =
        document.getElementById(
            "filterType"
        ).value;


    let list =
        [...transactions]
        .sort((a, b) =>
            new Date(b.date) -
            new Date(a.date)
        );


    if (filter !== "all") {

        list =
            list.filter(
                item =>
                    item.type === filter
            );
    }


    if (list.length === 0) {

        container.innerHTML =
            `<p>No transactions found.</p>`;

        return;
    }


    container.innerHTML =
        list.map(
            createTransactionHTML
        ).join("");
}


function createTransactionHTML(transaction) {

    const isIncome =
        transaction.type === "income";


    return `

        <div class="transaction">

            <div class="transaction-left">

                <div class="
                    transaction-icon
                    ${transaction.type}
                ">
                    ${isIncome ? "↑" : "↓"}
                </div>

                <div class="transaction-info">

                    <strong>
                        ${transaction.category}
                    </strong>

                    <small>
                        ${transaction.description}
                        • ${formatDate(transaction.date)}
                    </small>

                </div>

            </div>


            <div>

                <span class="
                    transaction-amount
                    ${isIncome
                        ? "amount-income"
                        : "amount-expense"}
                ">

                    ${isIncome ? "+" : "-"}
                    ${formatCurrency(transaction.amount)}

                </span>

                <button
                    class="delete-btn"
                    onclick="deleteTransaction(${transaction.id})">

                    🗑

                </button>

            </div>

        </div>

    `;
}


/* =========================================
   DELETE
========================================= */

function deleteTransaction(id) {

    if (
        !confirm(
            "Delete this transaction?"
        )
    ) {
        return;
    }


    transactions =
        transactions.filter(
            item =>
                item.id !== id
        );


    saveTransactions();

    updateDashboard();

    displayTransactions();
}


/* =========================================
   DATE
========================================= */

function formatDate(date) {

    return new Date(date)
        .toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
}


/* =========================================
   CHARTS
========================================= */

function createCharts() {

    const totals =
        calculateTotals();


    if (financeChart) {
        financeChart.destroy();
    }


    financeChart =
        new Chart(
            document.getElementById(
                "financeChart"
            ),
            {

                type: "bar",

                data: {

                    labels: [
                        "Income",
                        "Expenses",
                        "Balance"
                    ],

                    datasets: [

                        {
                            label:
                                "Amount",

                            data: [
                                totals.income,
                                totals.expense,
                                totals.balance
                            ],

                            borderWidth: 1
                        }

                    ]

                },

                options: {

                    responsive: true,

                    plugins: {
                        legend: {
                            display: false
                        }
                    }

                }

            }
        );


    createCategoryChart();
}


/* =========================================
   CATEGORY CHART
========================================= */

function createCategoryChart() {

    const categoryTotals = {};


    transactions
        .filter(
            item =>
                item.type === "expense"
        )
        .forEach(item => {

            categoryTotals[item.category] =
                (categoryTotals[item.category] || 0)
                + item.amount;

        });


    const labels =
        Object.keys(categoryTotals);

    const data =
        Object.values(categoryTotals);


    if (categoryChart) {
        categoryChart.destroy();
    }


    categoryChart =
        new Chart(
            document.getElementById(
                "categoryChart"
            ),
            {

                type: "doughnut",

                data: {

                    labels: labels,

                    datasets: [

                        {
                            data: data
                        }

                    ]

                },

                options: {
                    responsive: true
                }

            }
        );
}


/* =========================================
   BUDGET
========================================= */

function setBudget() {

    const value =
        Number(
            document.getElementById(
                "budgetInput"
            ).value
        );


    if (value <= 0) {

        alert(
            "Please enter a valid budget."
        );

        return;
    }


    budget = value;

    localStorage.setItem(
        "budget",
        budget
    );


    updateBudget();

    updateDashboard();
}


function updateBudget() {

    if (!budget) {

        document.getElementById(
            "budgetText"
        ).textContent =
            "Set a budget to see your overview.";

        return;
    }


    const expense =
        calculateTotals().expense;


    const percentage =
        Math.min(
            (expense / budget) * 100,
            100
        );


    document.getElementById(
        "budgetPercentage"
    ).textContent =
        Math.round(percentage) + "%";


    document.getElementById(
        "budgetText"
    ).textContent =
        `${formatCurrency(expense)}
        spent from
        ${formatCurrency(budget)}`;


    createBudgetCategories();
}


function createBudgetCategories() {

    const container =
        document.getElementById(
            "budgetCategories"
        );


    const categoryTotals = {};


    transactions
        .filter(
            item =>
                item.type === "expense"
        )
        .forEach(item => {

            categoryTotals[item.category] =
                (categoryTotals[item.category] || 0)
                + item.amount;

        });


    const totalExpense =
        calculateTotals().expense;


    if (
        Object.keys(categoryTotals).length === 0
    ) {

        container.innerHTML =
            "<p>No expenses recorded yet.</p>";

        return;
    }


    container.innerHTML =
        Object.entries(categoryTotals)
            .map(
                ([category, amount]) => {

                    const percent =
                        totalExpense
                            ? (amount / totalExpense) * 100
                            : 0;

                    return `

                        <div class="budget-category">

                            <div class="category-info">

                                <strong>
                                    ${category}
                                </strong>

                                <span>
                                    ${formatCurrency(amount)}
                                </span>

                            </div>

                            <div class="progress">

                                <div
                                    style="
                                        width:${percent}%
                                    ">
                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");
}


/* =========================================
   WEEKLY REPORT
========================================= */

function updateWeeklyReport() {

    const today =
        new Date();


    const sevenDaysAgo =
        new Date();

    sevenDaysAgo.setDate(
        today.getDate() - 6
    );


    const weeklyTransactions =
        transactions.filter(item => {

            const date =
                new Date(item.date);

            return (
                date >= sevenDaysAgo &&
                date <= today
            );

        });


    let income = 0;
    let expense = 0;


    weeklyTransactions.forEach(item => {

        if (item.type === "income") {

            income += item.amount;

        } else {

            expense += item.amount;

        }

    });


    document.getElementById(
        "weeklyIncome"
    ).textContent =
        formatCurrency(income);


    document.getElementById(
        "weeklyExpense"
    ).textContent =
        formatCurrency(expense);


    document.getElementById(
        "weeklyProfit"
    ).textContent =
        formatCurrency(
            income - expense
        );


    createWeeklyChart();
}


/* =========================================
   WEEKLY CHART
========================================= */

function createWeeklyChart() {

    const labels = [];

    const incomeData = [];

    const expenseData = [];


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const date =
            new Date();

        date.setDate(
            date.getDate() - i
        );


        const dateString =
            date.toISOString()
                .split("T")[0];


        labels.push(
            date.toLocaleDateString(
                "en-IN",
                {
                    weekday: "short"
                }
            )
        );


        let income = 0;
        let expense = 0;


        transactions.forEach(item => {

            if (item.date === dateString) {

                if (
                    item.type === "income"
                ) {

                    income += item.amount;

                } else {

                    expense += item.amount;

                }

            }

        });


        incomeData.push(income);

        expenseData.push(expense);

    }


    if (weeklyChart) {
        weeklyChart.destroy();
    }


    weeklyChart =
        new Chart(
            document.getElementById(
                "weeklyChart"
            ),
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {
                            label: "Income",

                            data: incomeData,

                            tension: .4,

                            fill: false
                        },

                        {
                            label: "Expenses",

                            data: expenseData,

                            tension: .4,

                            fill: false
                        }

                    ]

                },

                options: {
                    responsive: true
                }

            }
        );
}


/* =========================================
   THEME
========================================= */

function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "theme",
        isDark ? "dark" : "light"
    );
}


/* =========================================
   LOAD SAVED THEME
========================================= */

function loadTheme() {

    const theme =
        localStorage.getItem("theme");


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );
    }
}


/* =========================================
   INITIALIZE
========================================= */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        loadTheme();

        const savedEmail =
            localStorage.getItem(
                "userEmail"
            );


        if (savedEmail) {

            document.getElementById(
                "profileEmail"
            ).textContent =
                savedEmail;

            document.getElementById(
                "profileName"
            ).textContent =
                savedEmail.split("@")[0];
        }

    }
);