/* =====================================================
   BudgetBee
===================================================== */
const API_URL = "http://localhost:8080/api/transactions";

/* ================= DATA ================= */

let transactions =
    JSON.parse(localStorage.getItem("transactions")) || [];

let budget =
    Number(localStorage.getItem("budget")) || 0;

let goals =
    JSON.parse(localStorage.getItem("goals")) || [];


/* ================= CHARTS ================= */

let financeChart;
let categoryChart;
let weeklyChart;


/* ================= PAGE NAVIGATION ================= */

function showLogin() {

    document.getElementById("welcomePage").classList.remove("active");

    document.getElementById("loginPage").classList.add("active");
}


function login(event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    if (!email) return;

    localStorage.setItem("userEmail", email);

    document.getElementById("profileEmail").textContent =
        email;

    document.getElementById("profileName").textContent =
        email.split("@")[0];

    document.getElementById("loginPage").classList.remove("active");

    document.getElementById("dashboardPage").style.display =
        "flex";

    updateAll();
}


function logout() {

    document.getElementById("dashboardPage").style.display =
        "none";

    document.getElementById("welcomePage").classList.add("active");
}


/* ================= SECTIONS ================= */

function showSection(sectionId, button = null) {

    document.querySelectorAll(".content-section")
        .forEach(section => {
            section.classList.remove("active-section");
        });

    const section =
        document.getElementById(sectionId);

    if (section) {
        section.classList.add("active-section");
    }


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
        reports: "Weekly Report",
        goals: "Savings Goals"
    };

    document.getElementById("sectionTitle").textContent =
        titles[sectionId] || "Dashboard";
}


/* ================= TRANSACTION MODAL ================= */

function openTransactionModal(type) {

    const modal =
        document.getElementById("transactionModal");

    modal.classList.add("show");

    document.getElementById("transactionType").value =
        type;

    document.getElementById("modalTitle").textContent =
        type === "income"
            ? "Add Income"
            : "Add Expense";


    document.getElementById("category").value = "";

    document.getElementById("description").value = "";

    document.getElementById("amount").value = "";

    document.getElementById("transactionDate").value =
        new Date().toISOString().split("T")[0];
}


function closeTransactionModal() {

    document.getElementById("transactionModal")
        .classList.remove("show");
}


/* ================= ADD TRANSACTION ================= */

async function addTransaction(event) {

    event.preventDefault();

    const type =
        document.getElementById("transactionType").value;

    const amount =
        Number(document.getElementById("amount").value);

    const category =
        document.getElementById("category").value;

    const paymentMethod =
        document.getElementById("paymentMethod").value;

    const description =
        document.getElementById("description").value.trim();

    const date =
        document.getElementById("transactionDate").value;


    if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }


    const transaction = {
        type: type,
        amount: amount,
        category: category,
        paymentMethod: paymentMethod,
        description: description,
        date: date
    };


    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(transaction)

        });


        if (!response.ok) {
            throw new Error("Failed to save transaction");
        }


        const savedTransaction =
            await response.json();


        transactions.push(savedTransaction);

        saveData();

        closeTransactionModal();

        updateAll();


        if (type === "expense" && budget > 0) {

            const expenses = getTotalExpenses();

            if (expenses > budget) {

                alert(
                    "⚠️ Your monthly budget has been exceeded!"
                );

            } else if (expenses >= budget * 0.8) {

                alert(
                    "⚠️ You have used more than 80% of your budget."
                );

            }
        }


    } catch (error) {

        console.error(error);

        alert(
            "Unable to save transaction. Make sure the Java backend is running."
        );

    }

}


/* ================= DELETE ================= */

async function deleteTransaction(id) {

    const confirmed =
        confirm("Delete this transaction?");

    if (!confirmed) return;

    try {

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to delete transaction");
        }

        transactions =
            transactions.filter(
                transaction => transaction.id !== id
            );

        saveData();

        updateAll();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete transaction. Make sure the Java backend is running."
        );

    }
}


/* ================= DISPLAY TRANSACTIONS ================= */

function displayTransactions() {

    const container =
        document.getElementById("transactionHistory");

    if (!container) return;


    const type =
        document.getElementById("filterType").value;

    const category =
        document.getElementById("filterCategory").value;

    const search =
        document.getElementById("searchTransaction")
            .value
            .toLowerCase();


    let filtered =
        [...transactions];


    if (type !== "all") {

        filtered =
            filtered.filter(
                transaction =>
                    transaction.type === type
            );

    }


    if (category !== "all") {

        filtered =
            filtered.filter(
                transaction =>
                    transaction.category === category
            );

    }


    if (search) {

        filtered =
            filtered.filter(transaction =>

                transaction.category
                    .toLowerCase()
                    .includes(search)

                ||

                transaction.description
                    .toLowerCase()
                    .includes(search)

                ||

                transaction.paymentMethod
                    .toLowerCase()
                    .includes(search)

            );

    }


    filtered.sort(
        (a, b) =>
            new Date(b.date) - new Date(a.date)
    );


    if (filtered.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No transactions found</h3>
                <p>Try changing your filters.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        filtered.map(transaction => {

            const isIncome =
                transaction.type === "income";


            return `

                <div class="transaction-item">

                    <div class="transaction-left">

                        <div class="transaction-icon">
                            ${isIncome ? "💰" : "💸"}
                        </div>

                        <div class="transaction-info">

                            <strong>
                                ${escapeHTML(
                                    transaction.category
                                )}
                            </strong>

                            <small>
                                ${formatDate(transaction.date)}
                                •
                                ${escapeHTML(
                                    transaction.paymentMethod
                                )}

                                ${
                                    transaction.description
                                    ? " • " +
                                      escapeHTML(
                                        transaction.description
                                      )
                                    : ""
                                }

                            </small>

                        </div>

                    </div>


                    <div>

                        <span class="${
                            isIncome
                                ? "income-amount"
                                : "expense-amount"
                        }">

                            ${isIncome ? "+" : "-"}
                            ${formatCurrency(
                                transaction.amount
                            )}

                        </span>

                        <button
                            class="delete-btn"
                            onclick="deleteTransaction(
                                ${transaction.id}
                            )">

                            🗑️

                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


/* ================= RECENT TRANSACTIONS ================= */

function displayRecentTransactions() {

    const container =
        document.getElementById("recentTransactions");

    if (!container) return;


    const recent =
        [...transactions]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <p>No transactions yet.</p>
                <p>Add your first income or expense.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        recent.map(transaction => {

            const isIncome =
                transaction.type === "income";

            return `

                <div class="transaction-item">

                    <div class="transaction-left">

                        <div class="transaction-icon">
                            ${isIncome ? "💰" : "💸"}
                        </div>

                        <div class="transaction-info">

                            <strong>
                                ${escapeHTML(
                                    transaction.category
                                )}
                            </strong>

                            <small>
                                ${formatDate(transaction.date)}
                            </small>

                        </div>

                    </div>


                    <span class="${
                        isIncome
                            ? "income-amount"
                            : "expense-amount"
                    }">

                        ${isIncome ? "+" : "-"}
                        ${formatCurrency(
                            transaction.amount
                        )}

                    </span>

                </div>

            `;

        }).join("");
}


/* ================= TOTALS ================= */

function getTotalIncome() {

    return transactions

        .filter(
            transaction =>
                transaction.type === "income"
        )

        .reduce(
            (total, transaction) =>
                total + Number(transaction.amount),
            0
        );
}


function getTotalExpenses() {

    return transactions

        .filter(
            transaction =>
                transaction.type === "expense"
        )

        .reduce(
            (total, transaction) =>
                total + Number(transaction.amount),
            0
        );
}


/* ================= DASHBOARD ================= */

function updateDashboard() {

    const income =
        getTotalIncome();

    const expenses =
        getTotalExpenses();

    const balance =
        income - expenses;

    const budgetLeft =
        budget - expenses;


    document.getElementById("totalIncome")
        .textContent =
        formatCurrency(income);

    document.getElementById("totalExpense")
        .textContent =
        formatCurrency(expenses);

    document.getElementById("netBalance")
        .textContent =
        formatCurrency(balance);

    document.getElementById("budgetLeft")
        .textContent =
        formatCurrency(
            Math.max(budgetLeft, 0)
        );


    document.getElementById("welcomeBalance")
        .textContent =
        formatCurrency(balance);


    updateInsight();

}


/* ================= SMART INSIGHT ================= */

function updateInsight() {

    const insight =
        document.getElementById("smartInsight");

    if (!insight) return;


    const expenses =
        getTotalExpenses();

    const income =
        getTotalIncome();


    if (transactions.length === 0) {

        insight.textContent =
            "Add some transactions to receive spending insights.";

        return;

    }


    if (income === 0 && expenses > 0) {

        insight.textContent =
            "You have recorded expenses but no income yet. Add your income to get a clearer financial picture.";

        return;

    }


    if (expenses > income) {

        insight.textContent =
            "Your expenses are currently higher than your income. Consider reviewing your spending categories.";

        return;

    }


    if (
        budget > 0 &&
        expenses >= budget * 0.8
    ) {

        insight.textContent =
            "You have used more than 80% of your monthly budget. Keep an eye on your remaining expenses.";

        return;

    }


    const categoryTotals =
        getCategoryTotals();

    const categories =
        Object.entries(categoryTotals);


    if (categories.length > 0) {

        categories.sort(
            (a, b) => b[1] - a[1]
        );

        const topCategory =
            categories[0][0];

        insight.textContent =
            `Your highest spending category is ${topCategory}. Keep tracking it to understand your spending habits.`;

        return;

    }


    insight.textContent =
        "Your finances are being tracked successfully.";
}


/* ================= CATEGORY TOTALS ================= */

function getCategoryTotals() {

    const totals = {};

    transactions

        .filter(
            transaction =>
                transaction.type === "expense"
        )

        .forEach(transaction => {

            if (!totals[transaction.category]) {
                totals[transaction.category] = 0;
            }

            totals[transaction.category] +=
                Number(transaction.amount);

        });


    return totals;
}


/* ================= FINANCE CHART ================= */

function createFinanceChart() {

    const canvas =
        document.getElementById("financeChart");

    if (!canvas) return;


    if (financeChart) {
        financeChart.destroy();
    }


    financeChart =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: [
                    "Income",
                    "Expenses",
                    "Balance"
                ],

                datasets: [{

                    label: "Amount",

                    data: [
                        getTotalIncome(),
                        getTotalExpenses(),
                        getTotalIncome() -
                        getTotalExpenses()
                    ]

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }

                }

            }

        });

}


/* ================= CATEGORY CHART ================= */

function createCategoryChart() {

    const canvas =
        document.getElementById("categoryChart");

    if (!canvas) return;


    if (categoryChart) {
        categoryChart.destroy();
    }


    const categoryTotals =
        getCategoryTotals();


    const labels =
        Object.keys(categoryTotals);

    const values =
        Object.values(categoryTotals);


    categoryChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels,

                datasets: [{

                    data: values

                }]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {
                        position: "bottom"
                    }

                }

            }

        });

}


/* ================= BUDGET ================= */

function setBudget() {

    const value =
        Number(
            document.getElementById("budgetInput")
                .value
        );


    if (!value || value <= 0) {

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

    alert(
        "Monthly budget updated successfully!"
    );
}


function updateBudget() {

    const expenses =
        getTotalExpenses();


    if (budget <= 0) {

        document.getElementById(
            "budgetPercentage"
        ).textContent = "0%";

        document.getElementById(
            "budgetText"
        ).textContent =
            "Set a budget to see your overview.";

        return;

    }


    const percentage =
        Math.min(
            Math.round(
                (expenses / budget) * 100
            ),
            100
        );


    document.getElementById(
        "budgetPercentage"
    ).textContent =
        percentage + "%";


    document.getElementById(
        "budgetText"
    ).textContent =
        `${formatCurrency(expenses)} spent of ${formatCurrency(budget)}`;


    const circle =
        document.querySelector(".budget-circle");


    if (circle) {

        circle.style.background =
            `conic-gradient(
                var(--primary)
                ${percentage * 3.6}deg,
                var(--primary-light)
                ${percentage * 3.6}deg
            )`;

    }


    updateBudgetCategories();
}


/* ================= CATEGORY BUDGET ================= */

function updateBudgetCategories() {

    const container =
        document.getElementById(
            "budgetCategories"
        );

    if (!container) return;


    const totals =
        getCategoryTotals();


    const entries =
        Object.entries(totals);


    if (entries.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No expense categories yet.
            </div>
        `;

        return;

    }


    container.innerHTML =
        entries.map(([category, amount]) => {

            const percentage =
                budget > 0
                    ? Math.min(
                        (amount / budget) * 100,
                        100
                    )
                    : 0;


            return `

                <div class="category-budget">

                    <div class="category-budget-header">

                        <strong>
                            ${escapeHTML(category)}
                        </strong>

                        <span>
                            ${formatCurrency(amount)}
                        </span>

                    </div>

                    <div class="progress">

                        <div
                            class="progress-bar"
                            style="width:${percentage}%">
                        </div>

                    </div>

                </div>

            `;

        }).join("");
}


/* ================= WEEKLY REPORT ================= */

function updateWeeklyReport() {

    const today =
        new Date();

    const sevenDaysAgo =
        new Date();

    sevenDaysAgo.setDate(
        today.getDate() - 6
    );


    const weekly =
        transactions.filter(transaction => {

            const date =
                new Date(
                    transaction.date
                );

            return date >= sevenDaysAgo &&
                   date <= today;

        });


    const income =
        weekly

            .filter(
                transaction =>
                    transaction.type === "income"
            )

            .reduce(
                (sum, transaction) =>
                    sum + Number(transaction.amount),
                0
            );


    const expense =
        weekly

            .filter(
                transaction =>
                    transaction.type === "expense"
            )

            .reduce(
                (sum, transaction) =>
                    sum + Number(transaction.amount),
                0
            );


    document.getElementById("weeklyIncome")
        .textContent =
        formatCurrency(income);


    document.getElementById("weeklyExpense")
        .textContent =
        formatCurrency(expense);


    document.getElementById("weeklyProfit")
        .textContent =
        formatCurrency(
            income - expense
        );


    createWeeklyChart();

}


/* ================= WEEKLY CHART ================= */

function createWeeklyChart() {

    const canvas =
        document.getElementById(
            "weeklyChart"
        );

    if (!canvas) return;


    if (weeklyChart) {
        weeklyChart.destroy();
    }


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


        transactions.forEach(
            transaction => {

                if (
                    transaction.date ===
                    dateString
                ) {

                    if (
                        transaction.type ===
                        "income"
                    ) {

                        income +=
                            Number(
                                transaction.amount
                            );

                    } else {

                        expense +=
                            Number(
                                transaction.amount
                            );

                    }

                }

            }
        );


        incomeData.push(income);

        expenseData.push(expense);

    }


    weeklyChart =
        new Chart(canvas, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label: "Income",
                        data: incomeData,
                        tension: 0.3
                    },

                    {
                        label: "Expenses",
                        data: expenseData,
                        tension: 0.3
                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false

            }

        });

}


/* ================= SAVINGS GOALS ================= */

function openGoalModal() {

    document.getElementById(
        "goalModal"
    ).classList.add("show");

}


function closeGoalModal() {

    document.getElementById(
        "goalModal"
    ).classList.remove("show");

}


function addGoal(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "goalName"
        ).value.trim();


    const target =
        Number(
            document.getElementById(
                "goalTarget"
            ).value
        );


    const saved =
        Number(
            document.getElementById(
                "goalSaved"
            ).value
        ) || 0;


    if (!name || target <= 0) {

        alert(
            "Please enter valid goal details."
        );

        return;

    }


    if (saved > target) {

        alert(
            "Saved amount cannot be greater than target amount."
        );

        return;

    }


    goals.push({

        id: Date.now(),

        name,

        target,

        saved

    });


    saveData();

    closeGoalModal();

    displayGoals();

    event.target.reset();

}


function deleteGoal(id) {

    goals =
        goals.filter(
            goal => goal.id !== id
        );

    saveData();

    displayGoals();

}


function displayGoals() {

    const container =
        document.getElementById(
            "goalsContainer"
        );

    if (!container) return;


    if (goals.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No savings goals yet</h3>
                <p>Create your first savings goal.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        goals.map(goal => {

            const percentage =
                Math.min(
                    Math.round(
                        (goal.saved /
                        goal.target) * 100
                    ),
                    100
                );


            return `

                <div class="goal-card">

                    <h3>
                        🎯 ${escapeHTML(goal.name)}
                    </h3>

                    <p>
                        ${formatCurrency(goal.saved)}
                        saved of
                        ${formatCurrency(goal.target)}
                    </p>

                    <div class="goal-progress">

                        <div
                            style="width:${percentage}%">
                        </div>

                    </div>

                    <strong>
                        ${percentage}% completed
                    </strong>

                    <br><br>

                    <button
                        class="delete-btn"
                        onclick="deleteGoal(${goal.id})">

                        Delete

                    </button>

                </div>

            `;

        }).join("");
}


/* ================= THEME ================= */

function toggleTheme() {

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark")
    );

}


/* ================= STORAGE ================= */

function saveData() {

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );

    localStorage.setItem(
        "budget",
        budget
    );

    localStorage.setItem(
        "goals",
        JSON.stringify(goals)
    );

}

/* ================= LOAD TRANSACTIONS ================= */

async function loadTransactions() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load transactions");
        }

        transactions = await response.json();

        saveData();

        updateAll();

    } catch (error) {

        console.error("Error loading transactions:", error);

        updateAll();

    }
}
/* ================= UPDATE EVERYTHING ================= */

function updateAll() {

    updateDashboard();

    displayTransactions();

    displayRecentTransactions();

    updateBudget();

    updateWeeklyReport();

    displayGoals();

    createFinanceChart();

    createCategoryChart();

}


/* ================= HELPERS ================= */

function formatCurrency(amount) {

    return "₹" +
        Number(amount || 0)
            .toLocaleString("en-IN", {
                maximumFractionDigits: 2
            });

}


function formatDate(date) {

    if (!date) return "";

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ================= INITIAL LOAD ================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const savedEmail =
            localStorage.getItem("userEmail");

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


        if (
            localStorage.getItem("darkMode")
            === "true"
        ) {

            document.body.classList.add("dark");

        }


        document.getElementById(
            "dashboardPage"
        ).style.display = "none";


        loadTransactions();

    }
);


/* ================= CLOSE MODAL WHEN CLICKING OUTSIDE ================= */

window.addEventListener(
    "click",
    function(event) {

        const transactionModal =
            document.getElementById(
                "transactionModal"
            );

        const goalModal =
            document.getElementById(
                "goalModal"
            );


        if (
            event.target ===
            transactionModal
        ) {

            closeTransactionModal();

        }


        if (
            event.target ===
            goalModal
        ) {

            closeGoalModal();

        }

    }
);