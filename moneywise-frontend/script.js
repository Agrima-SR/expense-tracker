/* =====================================================
   BudgetBee
===================================================== */
const API_URL = "https://budgetbee-wg5e.onrender.com/api/transactions";
function getCurrentUserEmail() {
    return localStorage.getItem("userEmail");
}

/* ================= DATA ================= */

let transactions = [];

let budget = 0;

let goals = [];


/* ================= CHARTS ================= */

let financeChart;
let categoryChart;
let weeklyChart;
let calendarDate = new Date();

/* ================= PAGE NAVIGATION ================= */

function showLogin() {

    document.getElementById("welcomePage").classList.remove("active");

    document.getElementById("loginPage").classList.add("active");
}


function login(event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();
        const name = document.getElementById("name").value.trim();

    if (!email || !name) return;

    localStorage.setItem("userEmail", email);
    localStorage.setItem("userName", name);
    const userKey = encodeURIComponent(email);

transactions =
    JSON.parse(
        localStorage.getItem(`transactions_${userKey}`)
    ) || [];

budget =
    Number(
        localStorage.getItem(`budget_${userKey}`)
    ) || 0;

goals =
    JSON.parse(
        localStorage.getItem(`goals_${userKey}`)
    ) || [];

    document.getElementById("profileEmail").textContent = email;
    document.getElementById("profileName").textContent = name;

    document.getElementById("welcomeMessage").textContent =
        `Welcome back, ${name}! 👋`;

    document.getElementById("loginPage").classList.remove("active");
    document.getElementById("dashboardPage").style.display = "flex";

    loadTransactions();

    /* =================================
   ANIMATED DASHBOARD NUMBERS
================================= */

function animateNumber(element, target, duration = 1000) {

    if (!element) return;

    target = Number(target) || 0;

    const start = Number(
        element.dataset.value || 0
    );

    const difference = target - start;
    const startTime = performance.now();

    function update(currentTime) {

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth animation
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentValue =
            start + difference * ease;

        element.textContent =
            formatCurrency(currentValue);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent =
                formatCurrency(target);

            element.dataset.value = target;
        }
    }

    requestAnimationFrame(update);
}

    updateAll();
}


function logout() {

    document.getElementById("dashboardPage").style.display = "none";
    document.getElementById("welcomePage").classList.add("active");

    transactions = [];
    budget = 0;
    goals = [];
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
    goals: "Savings Goals",
    calendar: "Spending Calendar"
};

    document.getElementById("sectionTitle").textContent =
        titles[sectionId] || "Dashboard";
        window.scrollTo({
    top: 0,
    behavior: "smooth"
});
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
    getLocalDateString();
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

        const response = await fetch(
    `${API_URL}?userEmail=${encodeURIComponent(getCurrentUserEmail())}`, {

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

    console.error("Transaction error:", error);

    alert(
        "Transaction error: " + error.message
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
    `${API_URL}/${id}?userEmail=${encodeURIComponent(getCurrentUserEmail())}`,
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


    animateNumber(
    document.getElementById("totalIncome"),
    income
);

animateNumber(
    document.getElementById("totalExpense"),
    expenses
);

animateNumber(
    document.getElementById("netBalance"),
    balance
);

animateNumber(
    document.getElementById("budgetLeft"),
    Math.max(budgetLeft, 0)
);

animateNumber(
    document.getElementById("welcomeBalance"),
    balance
);


    updateFinancialHealth();
updateInsight();

}
/* ================= FINANCIAL HEALTH SCORE ================= */

function updateFinancialHealth() {

    const income = getTotalIncome();
    const expenses = getTotalExpenses();

    let incomeScore = 0;
    let budgetScore = 0;
    let expenseScore = 0;

    // Income vs Expenses
    if (income > 0) {

        const savingRate =
            ((income - expenses) / income) * 100;

        incomeScore =
            Math.max(0, Math.min(100, Math.round(savingRate + 50)));

    }

    // Budget Management
    if (budget > 0) {

        const budgetUsage =
            (expenses / budget) * 100;

        if (budgetUsage <= 50) {
            budgetScore = 100;
        } else if (budgetUsage <= 70) {
            budgetScore = 85;
        } else if (budgetUsage <= 80) {
            budgetScore = 70;
        } else if (budgetUsage <= 100) {
            budgetScore = 50;
        } else {
            budgetScore = 25;
        }

    }

    // Expense Control
    if (income > 0) {

        const expenseRate =
            (expenses / income) * 100;

        if (expenseRate <= 50) {
            expenseScore = 100;
        } else if (expenseRate <= 70) {
            expenseScore = 85;
        } else if (expenseRate <= 80) {
            expenseScore = 70;
        } else if (expenseRate <= 100) {
            expenseScore = 50;
        } else {
            expenseScore = 25;
        }

    }

    let score;

    if (income === 0 && expenses === 0) {

        score = 0;

    } else if (income === 0) {

        score = 20;

    } else if (budget === 0) {

        score =
            Math.round(
                (incomeScore + expenseScore) / 2
            );

    } else {

        score =
            Math.round(
                (incomeScore +
                 budgetScore +
                 expenseScore) / 3
            );

    }

    // Update main score
    document.getElementById("healthScore")
        .textContent = score;


    // Update individual percentages
    document.getElementById("incomeHealth")
        .textContent = incomeScore + "%";

    document.getElementById("budgetHealth")
        .textContent = budgetScore + "%";

    document.getElementById("expenseHealth")
        .textContent = expenseScore + "%";


    // Update progress bars
    document.getElementById("incomeHealthBar")
        .style.width = incomeScore + "%";

    document.getElementById("budgetHealthBar")
        .style.width = budgetScore + "%";

    document.getElementById("expenseHealthBar")
        .style.width = expenseScore + "%";


    // Status message
    const status =
        document.getElementById("healthStatus");

    if (score === 0) {

        status.textContent =
            "Add income and expenses to calculate your financial health.";

    } else if (score >= 80) {

        status.textContent =
            "🌟 Excellent! You're managing your money very well.";

    } else if (score >= 60) {

        status.textContent =
            "👍 Good! Your finances are on a healthy track.";

    } else if (score >= 40) {

        status.textContent =
            "⚠️ Fair. A little more control over spending could help.";

    } else {

        status.textContent =
            "🔎 Your spending needs attention. Review your budget and expenses.";

    }

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

    const userEmail = getCurrentUserEmail();
const userKey = encodeURIComponent(userEmail);

localStorage.setItem(
    `budget_${userKey}`,
    budget
);

    updateBudget();

    updateDashboard();

    alert(
        "Monthly budget updated successfully!"
    );
}


function updateBudget() {

    /* ================= BUDGET FORECAST ================= */

function updateBudgetForecast() {

    const forecastText =
        document.getElementById("forecastText");

    if (!forecastText) return;

    const expenses =
        getTotalExpenses();


    if (budget <= 0) {

        forecastText.textContent =
            "Set a monthly budget to see your spending forecast.";

        return;

    }


    if (expenses === 0) {

        forecastText.textContent =
            "Add some expenses to predict your month-end spending.";

        return;

    }


    const today = new Date();

    const currentDay =
        today.getDate();

    const daysInMonth =
        new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
        ).getDate();


    // Calculate average spending per day
    const averageDailySpending =
        expenses / currentDay;


    // Predict total spending by the end of the month
    const predictedExpense =
        Math.round(
            averageDailySpending * daysInMonth
        );


    const difference =
        predictedExpense - budget;


    if (difference > 0) {

        forecastText.innerHTML =
            `⚠️ At your current spending rate, you may spend <strong>${formatCurrency(predictedExpense)}</strong> this month and exceed your budget by approximately <strong>${formatCurrency(difference)}</strong>.`;

    } else {

        const remaining =
            budget - predictedExpense;

        forecastText.innerHTML =
            `✅ At your current spending rate, you are predicted to spend approximately <strong>${formatCurrency(predictedExpense)}</strong> this month and stay within your budget with around <strong>${formatCurrency(remaining)}</strong> remaining.`;

    }

}

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

updateBudgetForecast();

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
                const remaining = Math.max(goal.target - goal.saved, 0);

const monthlySaving = Math.max(
    Math.round((getTotalIncome() - getTotalExpenses()) * 0.20),
    0
);

let estimatedMonths = 0;

if (monthlySaving > 0 && remaining > 0) {
    estimatedMonths = Math.ceil(remaining / monthlySaving);
}


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

<p class="goal-smart-info">
    💰 Suggested monthly saving:
    <strong>${formatCurrency(monthlySaving)}</strong>
</p>

<p class="goal-smart-info">
    📅 ${
        remaining === 0
            ? "🎉 Goal completed!"
            : estimatedMonths > 0
                ? `Estimated time: ${estimatedMonths} month${estimatedMonths > 1 ? "s" : ""}`
                : "Add income and expenses to estimate your goal time."
    }
</p>

<br>

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

    const userEmail = getCurrentUserEmail();

    if (!userEmail) return;

    const userKey = encodeURIComponent(userEmail);

    localStorage.setItem(
        `transactions_${userKey}`,
        JSON.stringify(transactions)
    );

    localStorage.setItem(
        `budget_${userKey}`,
        budget
    );

    localStorage.setItem(
        `goals_${userKey}`,
        JSON.stringify(goals)
    );
}

/* ================= LOAD TRANSACTIONS ================= */

async function loadTransactions() {

    const userEmail = getCurrentUserEmail();

    if (!userEmail) {
        transactions = [];
        updateAll();
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}?userEmail=${encodeURIComponent(userEmail)}`
        );

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
function animateNumber(element, target, duration = 1000) {

    if (!element) return;

    target = Number(target) || 0;

    const start = Number(element.dataset.value || 0);
    const difference = target - start;
    const startTime = performance.now();

    function update(currentTime) {

        const elapsed = currentTime - startTime;

        const progress =
            Math.min(elapsed / duration, 1);

        const ease =
            1 - Math.pow(1 - progress, 3);

        const currentValue =
            start + difference * ease;

        element.textContent =
            formatCurrency(currentValue);

        if (progress < 1) {

            requestAnimationFrame(update);

        } else {

            element.textContent =
                formatCurrency(target);

            element.dataset.value = target;
        }
    }

    requestAnimationFrame(update);
}
function updateAll() {

    updateDashboard();

    displayTransactions();

    displayRecentTransactions();

    updateBudget();

    updateWeeklyReport();

    displayGoals();

    createFinanceChart();

    createCategoryChart();
    renderCalendar();

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

document.addEventListener("DOMContentLoaded", () => {

    const savedEmail = localStorage.getItem("userEmail");
    const savedName = localStorage.getItem("userName");

    if (savedEmail && savedName) {

        const userKey = encodeURIComponent(savedEmail);

        transactions =
            JSON.parse(
                localStorage.getItem(`transactions_${userKey}`)
            ) || [];

        budget =
            Number(
                localStorage.getItem(`budget_${userKey}`)
            ) || 0;

        goals =
            JSON.parse(
                localStorage.getItem(`goals_${userKey}`)
            ) || [];

        document.getElementById("profileEmail").textContent =
            savedEmail;

        document.getElementById("profileName").textContent =
            savedName;

        document.getElementById("welcomeMessage").textContent =
            `Welcome back, ${savedName}! 👋`;

        loadTransactions();
    }

    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }

    document.getElementById("dashboardPage").style.display = "none";
});

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
/* ================= SPENDING CALENDAR ================= */

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function renderCalendar() {

    const calendarGrid =
        document.getElementById("calendarGrid");

    const calendarMonthYear =
        document.getElementById("calendarMonthYear");

    if (!calendarGrid || !calendarMonthYear) return;


    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();


    const monthName =
        calendarDate.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
        });


    calendarMonthYear.textContent = monthName;


    calendarGrid.innerHTML = "";


    /*
       JavaScript:
       Sunday = 0
       Monday = 1
       ...
       Saturday = 6

       We want Monday as the first day.
    */

    const firstDay =
        new Date(year, month, 1).getDay();

    const startingDay =
        firstDay === 0 ? 6 : firstDay - 1;


    const daysInMonth =
        new Date(year, month + 1, 0).getDate();


    // Empty boxes before the first day
    for (let i = 0; i < startingDay; i++) {

        const emptyDay =
            document.createElement("div");

        emptyDay.className =
            "calendar-day empty";

        calendarGrid.appendChild(emptyDay);
    }


    // Create each date
    for (let day = 1; day <= daysInMonth; day++) {

        const dateObject =
            new Date(year, month, day);

        const dateString =
            getLocalDateString(dateObject);


        const dayTransactions =
            transactions.filter(
                transaction =>
                    transaction.date === dateString
            );


        const expenses =
            dayTransactions
                .filter(t => t.type === "expense")
                .reduce(
                    (total, t) =>
                        total + Number(t.amount),
                    0
                );


        const income =
            dayTransactions
                .filter(t => t.type === "income")
                .reduce(
                    (total, t) =>
                        total + Number(t.amount),
                    0
                );


        const dayElement =
            document.createElement("div");

        dayElement.className =
            "calendar-day";


        // Highlight today
        if (dateString === getLocalDateString()) {
            dayElement.classList.add("today");
        }


        let content = `
            <div class="calendar-date-number">
                ${day}
            </div>
        `;


        if (expenses > 0) {

            content += `
                <div class="calendar-expense">
                    💸 ${formatCurrency(expenses)}
                </div>
            `;

        } else {

            content += `
                <div class="calendar-no-spending">
                    No spending
                </div>
            `;
        }


        if (income > 0) {

            content += `
                <div class="calendar-income">
                    💰 ${formatCurrency(income)}
                </div>
            `;
        }


        dayElement.innerHTML = content;


        dayElement.addEventListener(
            "click",
            () => showDayTransactions(dateString)
        );


        calendarGrid.appendChild(dayElement);
    }
}
function changeCalendarMonth(change) {

    calendarDate.setMonth(
        calendarDate.getMonth() + change
    );

    renderCalendar();

    document.getElementById(
        "selectedDayDetails"
    ).innerHTML = "";
}


function goToToday() {

    calendarDate = new Date();

    renderCalendar();

    document.getElementById(
        "selectedDayDetails"
    ).innerHTML = "";
}
function showDayTransactions(dateString) {

    const details =
        document.getElementById(
            "selectedDayDetails"
        );

    const dayTransactions =
        transactions.filter(
            transaction =>
                transaction.date === dateString
        );


    const dateObject =
        new Date(
            Number(dateString.substring(0, 4)),
            Number(dateString.substring(5, 7)) - 1,
            Number(dateString.substring(8, 10))
        );


    const formattedDate =
        dateObject.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });


    let html = `
        <h3>${formattedDate}</h3>
    `;


    if (dayTransactions.length === 0) {

        html += `
            <p class="empty-state">
                No transactions on this day.
            </p>
        `;

        details.innerHTML = html;
        return;
    }


    dayTransactions.forEach(transaction => {

        const isIncome =
            transaction.type === "income";


        const amountClass =
            isIncome
                ? "selected-income"
                : "selected-expense";


        const sign =
            isIncome ? "+" : "-";


        html += `
            <div class="selected-transaction">

                <div>
                    <strong>
                        ${escapeHTML(
                            transaction.description ||
                            transaction.category ||
                            "Transaction"
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            transaction.category || ""
                        )}
                    </small>
                </div>

                <span class="${amountClass}">
                    ${sign}${formatCurrency(
                        transaction.amount
                    )}
                </span>

            </div>
        `;
    });


    details.innerHTML = html;
}