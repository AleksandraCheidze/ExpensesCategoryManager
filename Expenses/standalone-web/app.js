// Global variables
let categories = [];
let expenses = [];

// API configuration
const API_BASE_URL = 'http://localhost:8080/api';
const API_ENDPOINTS = {
    GET_EXPENSES: `${API_BASE_URL}/expenses`,
    ADD_EXPENSE: `${API_BASE_URL}/expenses`,
    GET_CATEGORIES: `${API_BASE_URL}/categories`,
    ADD_CATEGORY: `${API_BASE_URL}/categories`,
    DELETE_CATEGORY: `${API_BASE_URL}/categories`,
    GET_REPORT: `${API_BASE_URL}/reports`
};

// Flag to determine if we're using the API or local storage
const USE_API = true; // Set to false to use local storage instead

// Debug flag
const DEBUG = true;

// DOM elements
let navLinks;
let sections;
const expenseForm = document.getElementById('expense-form');
let expenseCategorySelect = document.getElementById('expense-category');
let expensesTable; // Will be initialized after DOM is loaded
const reportTypeSelect = document.getElementById('report-type');
const categorySelection = document.getElementById('category-selection');
let reportCategorySelect = document.getElementById('report-category');
const reportStartDate = document.getElementById('report-start-date');
const reportEndDate = document.getElementById('report-end-date');
const generateReportBtn = document.getElementById('generate-report');
const reportResults = document.getElementById('report-results');
const reportChart = document.getElementById('report-chart');
const reportSummary = document.getElementById('report-summary');
const newCategoryInput = document.getElementById('new-category');
const addCategoryBtn = document.getElementById('add-category');
let categoriesList = document.getElementById('categories-list');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements that might not be available at the top level
    try {
        // Initialize navigation elements
        navLinks = document.querySelectorAll('nav a');
        sections = document.querySelectorAll('main section');

        if (DEBUG) {
            console.log('Navigation links:', navLinks);
            console.log('Sections:', sections);
        }
        // Initialize expenses table
        expensesTable = document.querySelector('#expenses-table tbody');
        if (!expensesTable) {
            console.error('Expenses table not found in the DOM!');
            // Try to find the table and get the tbody
            const table = document.getElementById('expenses-table');
            if (table) {
                expensesTable = table.querySelector('tbody');
                if (!expensesTable) {
                    console.error('Expenses table tbody not found!');
                } else if (DEBUG) {
                    console.log('Expenses table initialized:', expensesTable);
                }
            }
        } else if (DEBUG) {
            console.log('Expenses table initialized:', expensesTable);
        }

        // Force English locale for the application
        if (DEBUG) console.log('Setting locale to en-US');
        document.documentElement.lang = 'en-US';

        // Initialize custom datepickers
        initDatepickers();
    } catch (e) {
        console.error('Error initializing DOM elements:', e);
    }

    // Set up navigation
    setupNavigation();

    // Load initial data
    loadCategories();
    loadExpenses();

    // Set up event listeners
    setupEventListeners();

    // Set default dates for reports
    setDefaultDates();

    // Initialize theme
    initTheme();
});

// Navigation setup
function setupNavigation() {
    if (DEBUG) console.log('Setting up navigation');

    // Инициализируем элементы навигации, если они еще не инициализированы
    if (!navLinks || navLinks.length === 0) {
        navLinks = document.querySelectorAll('nav a');
        if (DEBUG) console.log('Re-initialized navigation links:', navLinks);
    }
    
    if (!sections || sections.length === 0) {
        sections = document.querySelectorAll('main section');
        if (DEBUG) console.log('Re-initialized sections:', sections);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            if (DEBUG) console.log('Navigation link clicked:', link.id);

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            link.classList.add('active');

            // Hide all sections
            sections.forEach(section => {
                section.classList.remove('active-section');
            });

            // Show corresponding section
            const sectionId = link.id.replace('nav-', '') + '-section';
            const targetSection = document.getElementById(sectionId);

            if (targetSection) {
                targetSection.classList.add('active-section');
                if (DEBUG) console.log('Showing section:', sectionId);
            } else {
                console.error('Target section not found:', sectionId);
            }
        });
    });
    
    // Активируем по умолчанию секцию расходов
    document.getElementById('nav-expenses').click();
}

// Load categories from API or local storage
function loadCategories() {
    if (USE_API) {
        // Load from API
        if (DEBUG) console.log('Fetching categories from API...');
        fetch(API_ENDPOINTS.GET_CATEGORIES)
            .then(response => {
                if (DEBUG) console.log('Categories API response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (DEBUG) console.log('Categories data received:', data);

                // Make sure we have categories
                if (!data || data.length === 0) {
                    if (DEBUG) console.log('No categories received from API, using defaults');
                    categories = ['Food', 'Clothing', 'Transport', 'Rent', 'Other', 'Cosmetic'];
                } else {
                    categories = data;
                }

                updateCategorySelects();
            })
            .catch(error => {
                console.error('Error loading categories:', error);
                showError('Failed to load categories. Please try again later.');
                // Fall back to local storage if API fails
                loadCategoriesFromLocalStorage();
            });
    } else {
        // Load from local storage
        loadCategoriesFromLocalStorage();
    }
}

// Load categories from local storage
function loadCategoriesFromLocalStorage() {
    if (DEBUG) console.log('Loading categories from local storage');

    const storedCategories = localStorage.getItem('categories');

    if (storedCategories) {
        try {
            categories = JSON.parse(storedCategories);
            if (DEBUG) console.log('Categories loaded from localStorage:', categories);

            // Categories are already in English
        } catch (e) {
            console.error('Error parsing categories from localStorage:', e);
            categories = ['Food', 'Clothing', 'Transport', 'Rent', 'Other', 'Cosmetic'];
            localStorage.setItem('categories', JSON.stringify(categories));
        }
    } else {
        // Default categories
        categories = ['Food', 'Clothing', 'Transport', 'Rent', 'Other', 'Cosmetic'];
        localStorage.setItem('categories', JSON.stringify(categories));
        if (DEBUG) console.log('No categories in localStorage, using defaults');
    }

    updateCategorySelects();
}

// Update all category select elements
function updateCategorySelects() {
    if (DEBUG) {
        console.log('Updating category selects with categories:', categories);
    }

    // Make sure categories is an array
    if (!Array.isArray(categories)) {
        console.error('Categories is not an array:', categories);
        categories = ['Food', 'Clothing', 'Transport', 'Rent', 'Other', 'Cosmetic'];
    }

    // Check if DOM elements exist
    if (!expenseCategorySelect) {
        console.error('Expense category select element not found!');
        expenseCategorySelect = document.getElementById('expense-category');
        if (!expenseCategorySelect) {
            console.error('Could not find expense category select element!');
            return;
        }
    }

    if (!reportCategorySelect) {
        console.error('Report category select element not found!');
        reportCategorySelect = document.getElementById('report-category');
        if (!reportCategorySelect) {
            console.error('Could not find report category select element!');
            // Continue anyway to update other elements
        }
    }

    if (!categoriesList) {
        console.error('Categories list element not found!');
        categoriesList = document.getElementById('categories-list');
        if (!categoriesList) {
            console.error('Could not find categories list element!');
            // Continue anyway to update other elements
        }
    }

    // Update expense form category select
    if (expenseCategorySelect) {
        expenseCategorySelect.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            expenseCategorySelect.appendChild(option);
        });
    }

    // Update report category select
    if (reportCategorySelect) {
        reportCategorySelect.innerHTML = '<option value="all">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            reportCategorySelect.appendChild(option);
        });
    }

    // Update categories list
    if (categoriesList) {
        categoriesList.innerHTML = '';
        categories.forEach(category => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${category}
                <button class="delete-category" data-category="${category}">Delete</button>
            `;
            categoriesList.appendChild(li);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-category').forEach(button => {
            button.addEventListener('click', () => {
                const category = button.getAttribute('data-category');
                deleteCategory(category);
            });
        });
    }
}

// Load expenses from API or local storage
function loadExpenses() {
    if (USE_API) {
        // Load from API
        if (DEBUG) console.log('Fetching expenses from API...');
        fetch(API_ENDPOINTS.GET_EXPENSES)
            .then(response => {
                if (DEBUG) console.log('Expenses API response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (DEBUG) console.log('Expenses data received:', data);
                expenses = data;
                updateExpensesTable();
            })
            .catch(error => {
                console.error('Error loading expenses:', error);
                showError('Failed to load expenses. Please try again later.');
                // Fall back to local storage if API fails
                loadExpensesFromLocalStorage();
            });
    } else {
        // Load from local storage
        loadExpensesFromLocalStorage();
    }
}

// Load expenses from local storage
function loadExpensesFromLocalStorage() {
    if (DEBUG) console.log('Loading expenses from local storage');

    const storedExpenses = localStorage.getItem('expenses');

    if (storedExpenses) {
        try {
            expenses = JSON.parse(storedExpenses);
            if (DEBUG) console.log('Expenses loaded from localStorage:', expenses);

            // Expenses categories are already in English
        } catch (e) {
            console.error('Error parsing expenses from localStorage:', e);
            expenses = getDefaultExpenses();
            localStorage.setItem('expenses', JSON.stringify(expenses));
        }
    } else {
        // Default expenses
        expenses = getDefaultExpenses();
        localStorage.setItem('expenses', JSON.stringify(expenses));
        if (DEBUG) console.log('No expenses in localStorage, using defaults');
    }

    updateExpensesTable();
}

// Get default expenses with English categories
function getDefaultExpenses() {
    return [
        { category: 'Food', amount: 12.0, date: '2023-09-10' },
        { category: 'Clothing', amount: 45.0, date: '2023-10-17' },
        { category: 'Transport', amount: 18.0, date: '2023-10-27' },
        { category: 'Rent', amount: 167.0, date: '2023-03-15' },
        { category: 'Other', amount: 12.0, date: '2023-04-30' },
        { category: 'Cosmetic', amount: 88.0, date: '2023-01-03' },
        { category: 'Food', amount: 11.0, date: '2022-11-11' },
        { category: 'Clothing', amount: 33.0, date: '2022-08-09' },
        { category: 'Rent', amount: 124.0, date: '2022-08-09' },
        { category: 'Other', amount: 99.0, date: '2023-08-08' },
        { category: 'Cosmetic', amount: 7.0, date: '2022-03-19' },
        { category: 'Food', amount: 14.0, date: '2023-08-12' }
    ];
}

// Update expenses table
function updateExpensesTable() {
    if (DEBUG) {
        console.log('Updating expenses table');
        console.log('Expenses table element:', expensesTable);
        console.log('Current expenses:', expenses);
    }

    // Try to get the table if it's not already initialized
    if (!expensesTable) {
        expensesTable = document.querySelector('#expenses-table tbody');
        if (!expensesTable) {
            console.error('Expenses table not found! Trying to create it...');

            // Try to find the table and create tbody if needed
            const table = document.getElementById('expenses-table');
            if (table) {
                let tbody = table.querySelector('tbody');
                if (!tbody) {
                    tbody = document.createElement('tbody');
                    table.appendChild(tbody);
                }
                expensesTable = tbody;
            } else {
                console.error('Could not find expenses table element!');
                return;
            }
        }
    }

    expensesTable.innerHTML = '';

    // Add animation class to table
    expensesTable.classList.add('animated-table');

    // Sort expenses by date (newest first)
    if (DEBUG) {
        console.log('Expenses before sorting:', expenses);
    }

    if (!expenses || expenses.length === 0) {
        if (DEBUG) console.log('No expenses to display');
        expensesTable.innerHTML = '<tr><td colspan="3" class="text-center">No expenses to display</td></tr>';
        return;
    }

    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => {
        // Parse dates correctly, handling both YYYY-MM-DD and DD.MM.YYYY formats
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);

        if (DEBUG) {
            console.log(`Date A: ${a.date} parsed as ${dateA}`);
            console.log(`Date B: ${b.date} parsed as ${dateB}`);
        }

        if (DEBUG) {
            console.log(`Comparing dates: ${a.date} (${dateA}) vs ${b.date} (${dateB})`);
        }

        return dateB - dateA;
    });

    if (DEBUG) {
        console.log('Sorted expenses:', sortedExpenses);
    }

    // Display only the 10 most recent expenses
    const recentExpenses = sortedExpenses.slice(0, 10);

    recentExpenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td><span class="category-badge">${expense.category}</span></td>
        <td><span class="amount">${expense.amount.toFixed(2)}</span></td>
        <td><span class="date">${formatDate(expense.date)}</span></td>
    `;
        expensesTable.appendChild(row);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Expense form submission
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addExpense();
    });

    // Report type change
    reportTypeSelect.addEventListener('change', () => {
        const reportType = reportTypeSelect.value;

        // Show/hide category selection based on report type
        if (reportType === 'category') {
            categorySelection.style.display = 'block';
            reportStartDate.parentElement.style.display = 'inline-block';
            reportEndDate.parentElement.style.display = 'inline-block';
        } else {
            categorySelection.style.display = 'none';

            if (reportType === 'month-comparison') {
                // For month comparison, we don't need date inputs
                reportStartDate.parentElement.style.display = 'none';
                reportEndDate.parentElement.style.display = 'none';
            } else {
                // For year comparison, we don't need date inputs
                reportStartDate.parentElement.style.display = 'none';
                reportEndDate.parentElement.style.display = 'none';
            }
        }
    });

    // Generate report button
    generateReportBtn.addEventListener('click', generateReport);

    // Add category button
    addCategoryBtn.addEventListener('click', () => {
        const newCategory = newCategoryInput.value.trim();
        if (newCategory) {
            addCategory(newCategory);
        }
    });

    // Theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                // Switch to light theme
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if (DEBUG) console.log('Switched to light theme');
            } else {
                // Switch to dark theme
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if (DEBUG) console.log('Switched to dark theme');
            }
        });
    } else {
        console.error('Theme toggle button not found!');
    }
}

// Add a new expense
function addExpense() {
    const category = expenseCategorySelect.value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;

    if (!category || isNaN(amount) || !date) {
        showError('Please fill in all fields correctly.');
        return;
    }

    const newExpense = {
        category,
        amount,
        date
    };

    if (DEBUG) {
        console.log('Adding new expense:', newExpense);
        console.log('JSON payload:', JSON.stringify(newExpense));
    }

    if (USE_API) {
        // Add via API
        if (DEBUG) console.log('Using API endpoint:', API_ENDPOINTS.ADD_EXPENSE);

        fetch(API_ENDPOINTS.ADD_EXPENSE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newExpense)
        })
            .then(response => {
                if (DEBUG) console.log('Response status:', response.status);
                return response.json();
            })
            .then(data => {
                if (DEBUG) console.log('Response data:', data);

                if (data.success) {
                    // Add to local expenses array
                    expenses.push(newExpense);

                    // Update UI
                    updateExpensesTable();

                    // Reset form
                    expenseForm.reset();

                    // Show success message
                    showSuccess('Expense added successfully!');

                    if (DEBUG) console.log('Expense added successfully, current expenses:', expenses);
                } else {
                    showError(data.message || 'Failed to add expense.');
                    console.error('Server returned error:', data);
                }
            })
            .catch(error => {
                console.error('Error adding expense:', error);
                showError('Failed to add expense. Please try again.');

                // Fall back to local storage if API fails
                if (DEBUG) console.log('Falling back to local storage');
                addExpenseToLocalStorage(newExpense);
            });
    } else {
        // Add to local storage
        addExpenseToLocalStorage(newExpense);
    }
}

// Add expense to local storage
function addExpenseToLocalStorage(newExpense) {
    // Add to expenses array
    expenses.push(newExpense);

    // Save to local storage
    localStorage.setItem('expenses', JSON.stringify(expenses));

    // Update UI
    updateExpensesTable();

    // Reset form
    expenseForm.reset();

    // Show success message
    showSuccess('Expense added successfully!');
}

// Generate a report based on selected options
function generateReport() {
    const reportType = reportTypeSelect.value;
    let reportData = {};

    if (reportType === 'category') {
        const category = reportCategorySelect.value;
        const startDate = reportStartDate.value ? reportStartDate.value : null;
        const endDate = reportEndDate.value ? reportEndDate.value : null;

        if (!startDate || !endDate) {
            showError('Please select start and end dates.');
            return;
        }

        reportData = {
            type: 'category',
            category,
            startDate,
            endDate
        };
    } else if (reportType === 'month-comparison') {
        reportData = {
            type: 'month-comparison'
        };
    } else if (reportType === 'year-comparison') {
        reportData = {
            type: 'year-comparison'
        };
    }

    if (USE_API) {
        // Generate report via API
        fetch(API_ENDPOINTS.GET_REPORT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success === false) {
                    showError(data.message || 'Failed to generate report.');
                } else {
                    displayReport(data);
                }
            })
            .catch(error => {
                console.error('Error generating report:', error);
                showError('Failed to generate report. Please try again.');

                // Fall back to local processing if API fails
                generateReportLocally(reportType, reportData);
            });
    } else {
        // Generate report locally
        generateReportLocally(reportType, reportData);
    }
}

// Generate report using local data
function generateReportLocally(reportType, reportData) {
    let processedData = {};

    if (reportType === 'category') {
        const category = reportData.category;
        const startDate = reportData.startDate ? new Date(reportData.startDate) : null;
        const endDate = reportData.endDate ? new Date(reportData.endDate) : null;

        // Filter expenses by category and date range
        const filteredExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return (category === 'all' || expense.category === category) &&
                expenseDate >= startDate &&
                expenseDate <= endDate;
        });

        // Group expenses by month
        const expensesByMonth = {};

        filteredExpenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const month = expenseDate.toLocaleString('default', {month: 'short'});

            if (!expensesByMonth[month]) {
                expensesByMonth[month] = 0;
            }

            expensesByMonth[month] += expense.amount;
        });

        // Calculate total
        const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Prepare report data
        processedData = {
            type: 'category',
            category,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            labels: Object.keys(expensesByMonth),
            values: Object.values(expensesByMonth),
            total
        };
    } else if (reportType === 'month-comparison') {
        // Get current date
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Calculate previous month
        const previousMonthDate = new Date(today);
        previousMonthDate.setMonth(currentMonth - 1);
        const previousMonth = previousMonthDate.getMonth();
        const previousMonthYear = previousMonthDate.getFullYear();

        // Filter expenses for current month
        const currentMonthExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth &&
                expenseDate.getFullYear() === currentYear;
        });

        // Filter expenses for previous month
        const previousMonthExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === previousMonth &&
                expenseDate.getFullYear() === previousMonthYear;
        });

        // Calculate totals
        const currentTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const previousTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Calculate difference and percentage change
        const difference = currentTotal - previousTotal;
        const percentageChange = previousTotal === 0 ? 0 : (difference / previousTotal) * 100;

        // Get month names
        const currentMonthName = today.toLocaleString('default', {month: 'long', year: 'numeric'});
        const previousMonthName = previousMonthDate.toLocaleString('default', {month: 'long', year: 'numeric'});

        // Prepare report data
        processedData = {
            type: 'month-comparison',
            currentMonth: currentMonthName,
            previousMonth: previousMonthName,
            labels: ['Current Month', 'Previous Month'],
            values: [currentTotal, previousTotal],
            currentTotal,
            previousTotal,
            difference,
            percentageChange
        };
    } else if (reportType === 'year-comparison') {
        // Get current date
        const today = new Date();
        const currentYear = today.getFullYear();
        const previousYear = currentYear - 1;

        // Filter expenses for current year
        const currentYearExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === currentYear;
        });

        // Filter expenses for previous year
        const previousYearExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === previousYear;
        });

        // Calculate totals
        const currentTotal = currentYearExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const previousTotal = previousYearExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Calculate difference and percentage change
        const difference = currentTotal - previousTotal;
        const percentageChange = previousTotal === 0 ? 0 : (difference / previousTotal) * 100;

        // Prepare report data
        processedData = {
            type: 'year-comparison',
            currentYear: currentYear.toString(),
            previousYear: previousYear.toString(),
            labels: ['Current Year', 'Previous Year'],
            values: [currentTotal, previousTotal],
            currentTotal,
            previousTotal,
            difference,
            percentageChange
        };
    }

    displayReport(processedData);
}

// Display the generated report
function displayReport(data) {
    // Clear previous report
    reportSummary.innerHTML = '';

    // Create and display chart
    createReportChart(data);

    // Create and display summary
    createReportSummary(data);
}

// Create a chart for the report
function createReportChart(data) {
    // Destroy previous chart if it exists
    if (window.reportChartInstance) {
        window.reportChartInstance.destroy();
    }

    const ctx = reportChart.getContext('2d');

    let chartConfig = {};

    if (data.type === 'category') {
        // Bar chart for category expenses
        chartConfig = {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Expenses',
                    data: data.values,
                    backgroundColor: 'rgba(26, 188, 156, 0.7)',
                    borderColor: 'rgba(26, 188, 156, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        };
    } else if (data.type === 'month-comparison' || data.type === 'year-comparison') {
        // Pie chart for comparison
        chartConfig = {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'rgba(26, 188, 156, 0.7)',
                        'rgba(46, 204, 113, 0.7)'
                    ],
                    borderColor: [
                        'rgba(26, 188, 156, 1)',
                        'rgba(46, 204, 113, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        };
    }

    window.reportChartInstance = new Chart(ctx, chartConfig);
}

// Create a summary for the report
function createReportSummary(data) {
    let summaryHTML = '';

    if (data.type === 'category') {
        summaryHTML = `
        <h3>Expense Summary</h3>
        <p><strong>Category:</strong> ${data.category === 'all' ? 'All Categories' : data.category}</p>
        <p><strong>Period:</strong> ${formatDate(new Date(data.startDate))} to ${formatDate(new Date(data.endDate))}</p>
        <p><strong>Total Expenses:</strong> ${data.total.toFixed(2)}</p>
    `;
    } else if (data.type === 'month-comparison') {
        summaryHTML = `
        <h3>Month Comparison</h3>
        <p><strong>Current Month:</strong> ${data.currentMonth}</p>
        <p><strong>Current Month Total:</strong> ${data.currentTotal.toFixed(2)}</p>
        <p><strong>Previous Month:</strong> ${data.previousMonth}</p>
        <p><strong>Previous Month Total:</strong> ${data.previousTotal.toFixed(2)}</p>
        <p><strong>Difference:</strong> ${data.difference.toFixed(2)} (${data.percentageChange.toFixed(2)}%)</p>
    `;
    } else if (data.type === 'year-comparison') {
        summaryHTML = `
        <h3>Year Comparison</h3>
        <p><strong>Current Year:</strong> ${data.currentYear}</p>
        <p><strong>Current Year Total:</strong> ${data.currentTotal.toFixed(2)}</p>
        <p><strong>Previous Year:</strong> ${data.previousYear}</p>
        <p><strong>Previous Year Total:</strong> ${data.previousTotal.toFixed(2)}</p>
        <p><strong>Difference:</strong> ${data.difference.toFixed(2)} (${data.percentageChange.toFixed(2)}%)</p>
    `;
    }

    reportSummary.innerHTML = summaryHTML;
}

// Add a new category
function addCategory(category) {
    // Check if category already exists
    if (categories.includes(category)) {
        showError('This category already exists.');
        return;
    }

    if (USE_API) {
        // Add via API
        fetch(API_ENDPOINTS.ADD_CATEGORY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({category})
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Add to local categories array
                    categories.push(category);

                    // Update UI
                    updateCategorySelects();

                    // Clear input
                    newCategoryInput.value = '';

                    // Show success message
                    showSuccess('Category added successfully!');
                } else {
                    showError(data.message || 'Failed to add category.');
                }
            })
            .catch(error => {
                console.error('Error adding category:', error);
                showError('Failed to add category. Please try again.');

                // Fall back to local storage if API fails
                addCategoryToLocalStorage(category);
            });
    } else {
        // Add to local storage
        addCategoryToLocalStorage(category);
    }
}

// Add category to local storage
function addCategoryToLocalStorage(category) {
    // Add to categorize array
    categories.push(category);

    // Save to local storage
    localStorage.setItem('categories', JSON.stringify(categories));

    // Update UI
    updateCategorySelects();

    // Clear input
    newCategoryInput.value = '';

    // Show success message
    showSuccess('Category added successfully!');
}

// Delete a category
function deleteCategory(category) {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the category "${category}"?`)) {
        return;
    }

    if (USE_API) {
        // Delete via API
        fetch(`${API_ENDPOINTS.DELETE_CATEGORY}/${encodeURIComponent(category)}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Remove from local categories array
                    categories = categories.filter(c => c !== category);

                    // Update UI
                    updateCategorySelects();

                    // Show success message
                    showSuccess('Category deleted successfully!');
                } else {
                    showError(data.message || 'Failed to delete category.');
                }
            })
            .catch(error => {
                console.error('Error deleting category:', error);
                showError('Failed to delete category. Please try again.');

                // Fall back to local storage if API fails
                deleteCategoryFromLocalStorage(category);
            });
    } else {
        // Delete from local storage
        deleteCategoryFromLocalStorage(category);
    }
}

// Delete category from local storage
function deleteCategoryFromLocalStorage(category) {
    // Remove from categories array
    categories = categories.filter(c => c !== category);

    // Save to local storage
    localStorage.setItem('categories', JSON.stringify(categories));

    // Update UI
    updateCategorySelects();

    // Show success message
    showSuccess('Category deleted successfully!');
}

// Set default dates for reports
function setDefaultDates() {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    reportStartDate.value = formatDateForInput(oneMonthAgo);
    reportEndDate.value = formatDateForInput(today);
}

// Format date for input fields (MM/DD/YYYY)
function formatDateForInput(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

// Helper function to format date for display - moved to global scope
function formatDate(date) {
    // Check if date is valid
    if (!(date instanceof Date) || isNaN(date)) {
        // Try to parse the date string
        if (typeof date === 'string') {
            date = parseDate(date);
        }

        // If still invalid, return the original string or a placeholder
        if (!(date instanceof Date) || isNaN(date)) {
            return typeof date === 'string' ? date : 'Invalid date';
        }
    }

    // Format the date in English
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper function to parse date strings in different formats
function parseDate(dateStr) {
    if (DEBUG) console.log('Parsing date:', dateStr);

    if (!dateStr) return new Date(0); // Invalid date

    // If it's already a Date object
    if (dateStr instanceof Date) return dateStr;

    // Try to parse ISO format (YYYY-MM-DD)
    if (dateStr.includes('-')) {
        try {
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            if (DEBUG) console.log('Parsed ISO date:', date, 'from', dateStr);
            return date;
        } catch (e) {
            console.error('Error parsing ISO date:', e);
            // Fall through to other formats
        }
    }

    // Try to parse DD.MM.YYYY format
    if (dateStr.includes('.')) {
        try {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                const [day, month, year] = parts.map(Number);
                const date = new Date(year, month - 1, day);
                if (DEBUG) console.log('Parsed DD.MM.YYYY date:', date, 'from', dateStr);
                return date;
            }
        } catch (e) {
            console.error('Error parsing DD.MM.YYYY date:', e);
            // Fall through to other formats
        }
    }

    // Try to parse MM/DD/YYYY format
    if (dateStr.includes('/')) {
        try {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const [month, day, year] = parts.map(Number);
                const date = new Date(year, month - 1, day);
                if (DEBUG) console.log('Parsed MM/DD/YYYY date:', date, 'from', dateStr);
                return date;
            }
        } catch (e) {
            console.error('Error parsing MM/DD/YYYY date:', e);
            // Fall through to other formats
        }
    }

    // Fallback: try to parse as is
    try {
        const date = new Date(dateStr);
        if (DEBUG) console.log('Parsed fallback date:', date, 'from', dateStr);
        return date;
    } catch (e) {
        console.error('Error parsing date:', e);
        return new Date(0); // Return invalid date
    }
}

// Initialize custom datepickers
function initDatepickers() {
    const datepickers = document.querySelectorAll('.datepicker');

    if (DEBUG) console.log('Initializing datepickers:', datepickers.length);

    datepickers.forEach(input => {
        // Create calendar popup
        const calendarPopup = document.createElement('div');
        calendarPopup.className = 'calendar-popup';
        document.body.appendChild(calendarPopup);

        // Add click event to input
        input.addEventListener('click', function (e) {
            e.stopPropagation();

            // Position the calendar popup
            const rect = this.getBoundingClientRect();
            calendarPopup.style.top = (rect.bottom + window.scrollY) + 'px';
            calendarPopup.style.left = rect.left + 'px';

            // Get current date or today
            let currentDate = this.value ? parseDate(this.value) : new Date();
            if (isNaN(currentDate.getTime())) currentDate = new Date();

            // Render calendar
            renderCalendar(calendarPopup, currentDate, (date) => {
                // Format date as MM/DD/YYYY
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const year = date.getFullYear();
                this.value = `${month}/${day}/${year}`;

                // Hide calendar
                calendarPopup.classList.remove('show');
            });

            // Show calendar
            calendarPopup.classList.add('show');
        });

        // Close calendar when clicking outside
        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !calendarPopup.contains(e.target)) {
                calendarPopup.classList.remove('show');
            }
        });
    });
}

// Render calendar
function renderCalendar(container, date, onSelect) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();

    // Get today's date for highlighting
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Month names in English
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Day names in English
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Create calendar HTML
    let html = `
        <div class="calendar-header">
            <button class="prev-month"><i class="fas fa-chevron-left"></i></button>
            <div class="calendar-month-year">${monthNames[month]} ${year}</div>
            <button class="next-month"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="calendar-days">
    `;

    // Add day names
    dayNames.forEach(day => {
        html += `<div class="calendar-day-name">${day}</div>`;
    });

    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
        html += `<div class="calendar-day other-month"></div>`;
    }

    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const currentDate = new Date(year, month, i);
        const isToday = currentDate.getTime() === today.getTime();
        const isSelected = date.getDate() === i && date.getMonth() === month && date.getFullYear() === year;

        html += `<div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${i}">${i}</div>`;
    }

    html += `</div>`;

    // Set HTML
    container.innerHTML = html;

    // Add event listeners
    container.querySelector('.prev-month').addEventListener('click', function (e) {
        e.stopPropagation();
        const newDate = new Date(year, month - 1, 1);
        renderCalendar(container, newDate, onSelect);
    });

    container.querySelector('.next-month').addEventListener('click', function (e) {
        e.stopPropagation();
        const newDate = new Date(year, month + 1, 1);
        renderCalendar(container, newDate, onSelect);
    });

    container.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
        day.addEventListener('click', function (e) {
            e.stopPropagation();
            const dayNum = parseInt(this.dataset.date);
            const selectedDate = new Date(year, month, dayNum);
            onSelect(selectedDate);
        });
    });
}

// Helper function to format date for display - moved outside to be globally accessible
function formatDate(date) {
    // Check if date is valid
    if (!(date instanceof Date) || isNaN(date)) {
        // Try to parse the date string
        if (typeof date === 'string') {
            date = parseDate(date);
        }

        // If still invalid, return the original string or a placeholder
        if (!(date instanceof Date) || isNaN(date)) {
            return typeof date === 'string' ? date : 'Invalid date';
        }
    }

    // Format the date in English
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper function to parse date strings in different formats
function parseDate(dateStr) {
    if (DEBUG) console.log('Parsing date:', dateStr);

    if (!dateStr) return new Date(0); // Invalid date

    // If it's already a Date object
    if (dateStr instanceof Date) return dateStr;

    // Try to parse ISO format (YYYY-MM-DD)
    if (dateStr.includes('-')) {
        try {
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            if (DEBUG) console.log('Parsed ISO date:', date, 'from', dateStr);
            return date;
        } catch (e) {
            console.error('Error parsing ISO date:', e);
            // Fall through to other formats
        }
    }

    // Try to parse DD.MM.YYYY format
    if (dateStr.includes('.')) {
        try {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                const [day, month, year] = parts.map(Number);
                const date = new Date(year, month - 1, day);
                if (DEBUG) console.log('Parsed DD.MM.YYYY date:', date, 'from', dateStr);
                return date;
            }
        } catch (e) {
            console.error('Error parsing DD.MM.YYYY date:', e);
            // Fall through to other formats
        }
    }

    // Try to parse MM/DD/YYYY format
    if (dateStr.includes('/')) {
        try {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const [month, day, year] = parts.map(Number);
                const date = new Date(year, month - 1, day);
                if (DEBUG) console.log('Parsed MM/DD/YYYY date:', date, 'from', dateStr);
                return date;
            }
        } catch (e) {
            console.error('Error parsing MM/DD/YYYY date:', e);
            // Fall through to other formats
        }
    }

    // Fallback: try to parse as is
    try {
        const date = new Date(dateStr);
        if (DEBUG) console.log('Parsed fallback date:', date, 'from', dateStr);
        return date;
    } catch (e) {
        console.error('Error parsing date:', e);
        return new Date(0); // Return invalid date
    }
}

// Initialize theme based on user preference or system preference
function initTheme() {
    if (DEBUG) console.log('Initializing theme');

    const savedTheme = localStorage.getItem('theme');

    if (DEBUG) console.log('Current theme from localStorage:', savedTheme);

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (DEBUG) console.log('Setting dark theme');
    } else if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (DEBUG) console.log('Setting light theme');
    } else {
        // Check system preference if no saved preference
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

        if (DEBUG) console.log('System prefers dark scheme:', prefersDarkScheme.matches);

        if (prefersDarkScheme.matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            if (DEBUG) console.log('Setting dark theme based on system preference');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            if (DEBUG) console.log('Setting light theme based on system preference');
        }
    }
}

// Show error message
function showError(message) {
    showToast(`Error: ${message}`, 'error');
}

// Show success message
function showSuccess(message) {
    showToast(`Success: ${message}`, 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}