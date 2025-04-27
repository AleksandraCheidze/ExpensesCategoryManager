// Global variables
let categories = [];
let expenses = [];

// Handle Chrome runtime errors (for browser extensions)
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('runtime.lastError')) {
        console.warn('Handled runtime.lastError:', event.message);
        event.preventDefault();
        event.stopPropagation();
        return true;
    }
});

// Suppress Chrome extension errors in console
const originalConsoleError = console.error;
console.error = function() {
    if (arguments[0] && typeof arguments[0] === 'string' &&
        arguments[0].includes('runtime.lastError')) {
        console.warn('Suppressed runtime.lastError:', arguments[0]);
        return;
    }
    originalConsoleError.apply(console, arguments);
};

// Helper function to normalize date string to YYYY-MM-DD format
function normalizeDate(input) {
    if (!input) return '';

    // Check if already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return input;
    }

    // Try MM/DD/YYYY format
    const mmddyyyyMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyyMatch) {
        const month = mmddyyyyMatch[1].padStart(2, '0');
        const day = mmddyyyyMatch[2].padStart(2, '0');
        const year = mmddyyyyMatch[3];
        return `${year}-${month}-${day}`;
    }

    // Try DD.MM.YYYY format
    const ddmmyyyyMatch = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (ddmmyyyyMatch) {
        const day = ddmmyyyyMatch[1].padStart(2, '0');
        const month = ddmmyyyyMatch[2].padStart(2, '0');
        const year = ddmmyyyyMatch[3];
        return `${year}-${month}-${day}`;
    }

    // Try standard date parsing as fallback
    try {
        const date = new Date(input);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (e) {
        console.error('Error parsing date:', input, e);
    }

    console.error('Failed to normalize date:', input);
    return input; // Return original input if parsing fails
}

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
const USE_API = false; // Set to false to use local storage instead

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
const reportResults = document.getElementById('report-results'); // Container for report results
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

        // Re-initialize report elements
        reportResults = document.getElementById('report-results');
        reportChart = document.getElementById('report-chart');
        reportSummary = document.getElementById('report-summary');

        if (DEBUG) {
            console.log('Navigation links:', navLinks);
            console.log('Sections:', sections);
            console.log('Report elements:', { reportResults, reportChart, reportSummary });
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
            let sectionId = link.id.replace('nav-', '') + '-section';

            // Special case for reports section (plural form)
            if (link.id === 'nav-reports') {
                sectionId = 'reports-section';
                console.log('Showing reports section');
            }

            // Special case for categories section
            if (link.id === 'nav-categories') {
                sectionId = 'categories-section';
                console.log('Showing categories section');
            }

            const targetSection = document.getElementById(sectionId);

            if (targetSection) {
                targetSection.classList.add('active-section');
                if (DEBUG) console.log('Showing section:', sectionId);
            } else {
                console.error('Target section not found:', sectionId);
            }
        });
    });
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
                // Don't show error message, just fall back to local storage
                console.warn('Falling back to local storage for categories');
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

    recentExpenses.forEach((expense, index) => {
        const row = document.createElement('tr');
        row.dataset.expenseIndex = index; // Store the index for easier deletion
        row.dataset.expenseId = expense.id || `expense-${Date.now()}-${index}`; // Generate a unique ID if none exists

        row.innerHTML = `
        <td data-label="Category"><span class="category-badge">${expense.category}</span></td>
        <td data-label="Amount"><span class="amount">${expense.amount.toFixed(2)}</span></td>
        <td data-label="Date"><span class="date">${formatDate(expense.date)}</span></td>
        <td class="actions" data-label="">
            <button class="delete-expense-btn" data-expense-index="${index}" title="Delete expense">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
        expensesTable.appendChild(row);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-expense-btn').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            const index = parseInt(this.getAttribute('data-expense-index'));
            if (!isNaN(index)) {
                deleteExpense(index);
            }
        });
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
    if (generateReportBtn) {
        // Remove any existing event listeners
        generateReportBtn.removeEventListener('click', generateReport);
        // Add new event listener
        generateReportBtn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('Generate report button clicked');
            generateReport();
        });
        console.log('Added event listener to generate report button');
    } else {
        console.error('Generate report button not found!');
    }

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
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;

    // Validation
    if (isNaN(amount) || amount <= 0) {
        showError('Amount must be a positive number');
        return;
    }
    if (!category) {
        showError('Please select a category');
        return;
    }
    if (!date) {
        showError('Please select a date');
        return;
    }

    // Create new expense object
    const newExpense = {
        amount,
        category,
        date: normalizeDate(date)
    };

    if (DEBUG) console.log('Adding new expense:', newExpense);

    // Show loading indicator
    const submitButton = document.getElementById('expenseSubmitBtn');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    // Add expense via API
    fetch(`${API_ENDPOINTS.ADD_EXPENSE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newExpense)
    })
    .then(response => {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = 'Add Expense';

        // Check if request was successful
        if (!response.ok) {
            throw new Error('Failed to add expense');
        }
        return response.json();
    })
    .then(data => {
        if (DEBUG) console.log('Expense added:', data);

        // Reload expenses from server
        loadExpenses();

        // Reset form
        expenseForm.reset();

        // Show success message
        showSuccess('Expense added successfully');

        // Refresh expense list
        loadExpenses();
    })
    .catch(error => {
        console.error('Error adding expense:', error);

        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-plus-circle"></i> Add Expense';

        // Show error message
        showError('Error adding expense: ' + error.message);

        // Add to local storage as fallback
        if (DEBUG) console.log('Falling back to local storage');
        addExpenseLocally(newExpense);
        showSuccess('Added expense locally (offline mode)');

        // Reset form
        expenseForm.reset();

        // Refresh expense list
        loadExpenses();
    });
}

// Add expense to local storage
function addExpenseLocally(newExpense) {
    if (DEBUG) console.log('Adding expense locally:', newExpense);

    // Add to expenses array
    expenses.push(newExpense);

    // Save to local storage
    localStorage.setItem('expenses', JSON.stringify(expenses));

    // Update UI
    updateExpensesTable();
}

// Delete expense
function deleteExpense(index) {
    if (DEBUG) console.log('Deleting expense at index:', index);

    // Get the expense to delete
    const recentExpenses = [...expenses].sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateB - dateA;
    }).slice(0, 10);

    const expenseToDelete = recentExpenses[index];

    if (!expenseToDelete) {
        console.error('Expense not found at index:', index);
        return;
    }

    if (DEBUG) console.log('Expense to delete:', expenseToDelete);

    // Find the expense in the original array
    const originalIndex = expenses.findIndex(expense => {
        return expense.category === expenseToDelete.category &&
               expense.amount === expenseToDelete.amount &&
               expense.date === expenseToDelete.date;
    });

    if (originalIndex === -1) {
        console.error('Could not find expense in original array');
        return;
    }

    // Remove from array
    expenses.splice(originalIndex, 1);

    if (USE_API) {
        // Delete from API
        fetch(`${API_ENDPOINTS.GET_EXPENSES}/${expenseToDelete.id || originalIndex}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (DEBUG) console.log('Expense deleted from API:', data);

            // Update UI
            updateExpensesTable();

            // Show success message
            showSuccess('Expense deleted successfully!');
        })
        .catch(error => {
            console.error('Error deleting expense from API:', error);
            showError('Failed to delete expense from API. Falling back to local storage.');

            // Save to local storage
            localStorage.setItem('expenses', JSON.stringify(expenses));

            // Update UI
            updateExpensesTable();
        });
    } else {
        // Save to local storage
        localStorage.setItem('expenses', JSON.stringify(expenses));

        // Update UI
        updateExpensesTable();

        // Show success message
        showSuccess('Expense deleted successfully!');
    }
}

// Generate a report based on selected options
function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const categoryId = document.getElementById('report-category').value;
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;

    console.log('Generating report with parameters:', {
        reportType,
        categoryId,
        startDate,
        endDate
    });

    if (!startDate || !endDate) {
        showError('Please select start and end dates');
        return;
    }

    const reportData = {
        type: reportType,
        startDate: normalizeDate(startDate),
        endDate: normalizeDate(endDate)
    };

    if (categoryId) {
        reportData.categoryId = categoryId;
        reportData.category = categoryId; // Add both for compatibility
    }

    console.log('Sending report request with data:', reportData);

    // Show loading indicator
    if (!reportResults) {
        console.error('Report container not found! Expected element with id "report-results"');
        showError('Error generating report. Please try again.');
        return;
    }
    reportResults.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Generating report...</div>';

    // Get report via API
    fetch(`${API_ENDPOINTS.GET_REPORT}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
    })
    .then(response => {
        // Check if request was successful
        if (!response.ok) {
            console.error('Server returned error:', response.status, response.statusText);
            throw new Error('Failed to generate report');
        }
        console.log('Server response received, parsing JSON...');
        return response.json();
    })
    .then(data => {
        console.log('Report data received:', data);

        // Process and display the report
        processReportData(data, reportType);
    })
    .catch(error => {
        console.error('Error generating report:', error);

        // Fall back to local report generation
        console.log('Falling back to local report generation');
        generateReportLocally(reportData);
    });
}

// Process report data from API
function processReportData(data, reportType) {
    console.log('Processing report data:', data);

    // Check if we have valid data
    if (!data || !data.expenses || !Array.isArray(data.expenses)) {
        console.error('Invalid report data received:', data);
        showError('Invalid report data received. Falling back to local generation.');

        // Get the report parameters again
        const reportData = {
            type: reportType,
            category: document.getElementById('report-category').value,
            startDate: document.getElementById('report-start-date').value,
            endDate: document.getElementById('report-end-date').value
        };

        console.log('Falling back to local report generation with:', reportData);
        generateReportLocally(reportData);
        return;
    }

    // Process the data based on report type
    let processedData = {};

    if (reportType === 'category') {
        // Group expenses by category
        const expensesByCategory = {};
        data.expenses.forEach(expense => {
            if (!expensesByCategory[expense.category]) {
                expensesByCategory[expense.category] = 0;
            }
            expensesByCategory[expense.category] += expense.amount;
        });

        // Prepare data for chart
        const labels = Object.keys(expensesByCategory);
        const values = Object.values(expensesByCategory);
        const total = values.reduce((sum, value) => sum + value, 0);

        // Get selected category
        const selectedCategory = document.getElementById('report-category').value;

        processedData = {
            type: 'category',
            labels,
            values,
            total,
            category: selectedCategory,
            startDate: data.startDate,
            endDate: data.endDate
        };

        console.log('Processed category report data:', processedData);
    } else if (reportType === 'month-comparison') {
        // Process month comparison data
        // This would depend on the structure of your API response
        processedData = {
            type: 'month-comparison',
            currentMonth: data.currentMonth,
            previousMonth: data.previousMonth,
            labels: ['Current Month', 'Previous Month'],
            values: [data.currentTotal, data.previousTotal],
            currentTotal: data.currentTotal,
            previousTotal: data.previousTotal,
            difference: data.difference,
            percentageChange: data.percentageChange
        };
    } else if (reportType === 'year-comparison') {
        // Process year comparison data
        processedData = {
            type: 'year-comparison',
            currentYear: data.currentYear,
            previousYear: data.previousYear,
            labels: ['Current Year', 'Previous Year'],
            values: [data.currentTotal, data.previousTotal],
            currentTotal: data.currentTotal,
            previousTotal: data.previousTotal,
            difference: data.difference,
            percentageChange: data.percentageChange
        };
    }

    // Display the processed report
    displayReport(processedData);
}

// Generate report using local data
function generateReportLocally(reportData) {
    let processedData = {};

    if (reportData.type === 'category') {
        const category = reportData.category;
        const startDate = reportData.startDate ? new Date(normalizeDate(reportData.startDate)) : null;
        const endDate = reportData.endDate ? new Date(normalizeDate(reportData.endDate)) : null;

        // Filter expenses by category and date range
        const filteredExpenses = expenses.filter(expense => {
            const expenseDate = new Date(normalizeDate(expense.date));
            return (category === 'all' || expense.category === category) &&
                expenseDate >= startDate &&
                expenseDate <= endDate;
        });

        // Group expenses by month
        const expensesByMonth = {};

        filteredExpenses.forEach(expense => {
            const expenseDate = new Date(normalizeDate(expense.date));
            const month = expenseDate.toLocaleString('en-US', {month: 'short'});

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
    } else if (reportData.type === 'month-comparison') {
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
            const expenseDate = new Date(normalizeDate(expense.date));
            return expenseDate.getMonth() === currentMonth &&
                expenseDate.getFullYear() === currentYear;
        });

        // Filter expenses for previous month
        const previousMonthExpenses = expenses.filter(expense => {
            const expenseDate = new Date(normalizeDate(expense.date));
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
    } else if (reportData.type === 'year-comparison') {
        // Get current date
        const today = new Date();
        const currentYear = today.getFullYear();
        const previousYear = currentYear - 1;

        // Filter expenses for current year
        const currentYearExpenses = expenses.filter(expense => {
            const expenseDate = new Date(normalizeDate(expense.date));
            return expenseDate.getFullYear() === currentYear;
        });

        // Filter expenses for previous year
        const previousYearExpenses = expenses.filter(expense => {
            const expenseDate = new Date(normalizeDate(expense.date));
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

// This function is now in display-report.js
// Keeping this comment as a reference

// Create a chart for the report
function createReportChart(data) {
    console.log('Creating chart with data:', data);

    // Check if chart element exists
    const chartCanvas = document.getElementById('report-chart');
    if (!chartCanvas) {
        console.error('Chart canvas element not found!');
        return;
    }

    // Destroy previous chart if it exists
    if (window.reportChartInstance) {
        window.reportChartInstance.destroy();
    }

    const ctx = chartCanvas.getContext('2d');

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
    console.log('Creating summary with data:', data);

    // Check if summary element exists
    const summaryElement = document.getElementById('report-summary');
    if (!summaryElement) {
        console.error('Report summary element not found!');
        return;
    }

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
    if (!(date instanceof Date)) {
        console.error('formatDateForInput expects a Date object');
        return '';
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
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

    // Format the date in English (force en-US locale)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper function to normalize date to YYYY-MM-DD format
function normalizeDate(input) {
    if (input instanceof Date) {
        const year = input.getFullYear();
        const month = (input.getMonth() + 1).toString().padStart(2, '0');
        const day = input.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    if (typeof input === 'string') {
        // If already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            return input;
        }

        // Try to parse MM/DD/YYYY format
        const mmddyyyyMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mmddyyyyMatch) {
            const month = mmddyyyyMatch[1].padStart(2, '0');
            const day = mmddyyyyMatch[2].padStart(2, '0');
            const year = mmddyyyyMatch[3];
            return `${year}-${month}-${day}`;
        }

        // Try to parse dd.mm.yyyy format
        const ddmmyyyyMatch = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (ddmmyyyyMatch) {
            const day = ddmmyyyyMatch[1].padStart(2, '0');
            const month = ddmmyyyyMatch[2].padStart(2, '0');
            const year = ddmmyyyyMatch[3];
            return `${year}-${month}-${day}`;
        }

        // Try standard date parsing as fallback
        try {
            const date = new Date(input);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (e) {
            console.error('Error parsing date:', input, e);
        }
    }

    console.error('Failed to normalize date:', input);
    return input; // Return original input if parsing fails
}

// Function to parse date from various formats
function parseDate(dateStr) {
    if (!dateStr) return new Date(0);

    // Check if already a Date object
    if (dateStr instanceof Date) {
        return dateStr;
    }

    // Check if already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        if (DEBUG) console.log('Parsing ISO date:', dateStr);
        return new Date(dateStr + 'T00:00:00'); // Add time to avoid timezone issues
    }

    // Check MM/DD/YYYY format (US format)
    const mmddyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    if (mmddyyyyRegex.test(dateStr)) {
        const parts = dateStr.match(mmddyyyyRegex);
        const month = parseInt(parts[1]) - 1; // Months are 0-indexed
        const day = parseInt(parts[2]);
        const year = parseInt(parts[3]);
        if (DEBUG) console.log('Parsed US date:', year, month, day, 'from', dateStr);
        return new Date(year, month, day);
    }

    // Check DD.MM.YYYY format (European format)
    const ddmmyyyyRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    if (ddmmyyyyRegex.test(dateStr)) {
        const parts = dateStr.match(ddmmyyyyRegex);
        const day = parseInt(parts[1]);
        const month = parseInt(parts[2]) - 1; // Months are 0-indexed
        const year = parseInt(parts[3]);
        if (DEBUG) console.log('Parsed European date:', year, month, day, 'from', dateStr);
        return new Date(year, month, day);
    }

    // Fallback to standard Date parsing
    try {
        // First, try to normalize to YYYY-MM-DD
        const normalizedDate = normalizeDate(dateStr);
        if (normalizedDate !== dateStr) {
            if (DEBUG) console.log('Using normalized date:', normalizedDate);
            return new Date(normalizedDate + 'T00:00:00');
        }

        // If normalization didn't change anything, try direct parsing
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            if (DEBUG) console.log('Parsed fallback date:', date, 'from', dateStr);
            return date;
        }

        console.error('Unable to parse date:', dateStr);
        return new Date(0); // Return invalid date
    } catch (e) {
        console.error('Error parsing date:', e);
        return new Date(0); // Return invalid date
    }
}

// Initialize custom datepickers
function initDatepickers() {
    if (DEBUG) console.log('Initializing datepickers');

    document.querySelectorAll('.datepicker-input').forEach(input => {
        if (DEBUG) console.log('Setting up datepicker for:', input.id);

        // Create a container for the calendar if it doesn't exist
        let calendarContainer = document.getElementById(`calendar-${input.id}`);
        if (!calendarContainer) {
            calendarContainer = document.createElement('div');
            calendarContainer.id = `calendar-${input.id}`;
            calendarContainer.className = 'calendar-container';
            // Add to the end of body instead of inside the parent element
            document.body.appendChild(calendarContainer);
            if (DEBUG) console.log('Created calendar container for:', input.id);
        }

        // Initialize with current date if empty
        let currentDate;
        if (input.value) {
            const normalizedDate = normalizeDate(input.value);
            currentDate = new Date(normalizedDate);
            if (isNaN(currentDate.getTime())) {
                currentDate = new Date();
            }
        } else {
            currentDate = new Date();
            // Set the input value to the current date in the correct format
            input.value = formatDateForInput(currentDate);
        }

        if (DEBUG) console.log(`Initial date for ${input.id}:`, currentDate, 'formatted as:', input.value);

        // Add click event to show calendar
        input.addEventListener('click', function(event) {
            event.stopPropagation();

            if (DEBUG) console.log(`Clicked on ${input.id}`);

            // Close any other open calendars
            document.querySelectorAll('.calendar-container').forEach(container => {
                if (container !== calendarContainer) {
                    container.style.display = 'none';
                }
            });

            // Check if we need to update currentDate from input
            if (this.value) {
                const normalizedDate = normalizeDate(this.value);
                const dateFromInput = new Date(normalizedDate);
                if (!isNaN(dateFromInput.getTime())) {
                    currentDate = dateFromInput;
                    if (DEBUG) console.log(`Updated current date from input to:`, currentDate);
                }
            }

            // Update calendar and display
            renderCalendar(calendarContainer, currentDate, function(date) {
                currentDate = date;
                input.value = formatDateForInput(date);
                calendarContainer.style.display = 'none';
                if (DEBUG) console.log(`Selected date:`, date, 'formatted as:', input.value);
            });

            // Position the calendar relative to the input field
            const rect = input.getBoundingClientRect();
            calendarContainer.style.position = 'fixed';
            calendarContainer.style.top = `${rect.bottom + window.scrollY}px`;
            calendarContainer.style.left = `${rect.left + window.scrollX}px`;
            calendarContainer.style.width = `${Math.max(300, rect.width)}px`;

            // Show the calendar
            calendarContainer.style.display = 'block';
            if (DEBUG) console.log(`Showing calendar for ${input.id} at position:`, {
                top: calendarContainer.style.top,
                left: calendarContainer.style.left,
                width: calendarContainer.style.width
            });
        });

        // Close calendar when clicking outside
        document.addEventListener('click', function(event) {
            if (!calendarContainer.contains(event.target) && event.target !== input) {
                calendarContainer.style.display = 'none';
                if (DEBUG) console.log(`Hiding calendar for ${input.id} (clicked outside)`);
            }
        });
    });
}

// Render calendar for date picking
function renderCalendar(container, date, onDateSelected) {
    // Clear container
    container.innerHTML = '';

    // Get current month and year
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();

    // Create calendar header
    const header = document.createElement('div');
    header.className = 'calendar-header';

    // Add prev month button
    const prevMonthBtn = document.createElement('button');
    prevMonthBtn.innerHTML = '&lt;';
    prevMonthBtn.addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent event bubbling
        const newDate = new Date(currentYear, currentMonth - 1, 1);
        renderCalendar(container, newDate, onDateSelected);
        if (DEBUG) console.log('Switched to previous month:', newDate);
    });
    header.appendChild(prevMonthBtn);

    // Add month and year
    const monthYear = document.createElement('div');
    monthYear.className = 'month-year';
    // Force English locale for month names
    monthYear.textContent = new Date(currentYear, currentMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    header.appendChild(monthYear);

    // Add next month button
    const nextMonthBtn = document.createElement('button');
    nextMonthBtn.innerHTML = '&gt;';
    nextMonthBtn.addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent event bubbling
        const newDate = new Date(currentYear, currentMonth + 1, 1);
        renderCalendar(container, newDate, onDateSelected);
        if (DEBUG) console.log('Switched to next month:', newDate);
    });
    header.appendChild(nextMonthBtn);

    container.appendChild(header);

    // Create weekdays header
    const weekdaysRow = document.createElement('div');
    weekdaysRow.className = 'weekdays';
    // English weekday abbreviations
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    weekdays.forEach(day => {
        const dayElem = document.createElement('div');
        dayElem.textContent = day;
        weekdaysRow.appendChild(dayElem);
    });
    container.appendChild(weekdaysRow);

    // Create days grid
    const daysGrid = document.createElement('div');
    daysGrid.className = 'days';

    // Get first day of month
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    // Adjust for Monday as first day (0 = Monday, 6 = Sunday)
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;

    // Get number of days in month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayAdjusted; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'day empty';
        daysGrid.appendChild(emptyDay);
    }

    // Add days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Remove time portion from the input date for comparison
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    for (let i = 1; i <= daysInMonth; i++) {
        const dayElem = document.createElement('div');
        dayElem.className = 'day';
        dayElem.textContent = i;

        // Check if this day is today
        const thisDay = new Date(currentYear, currentMonth, i);
        if (thisDay.getTime() === today.getTime()) {
            dayElem.classList.add('today');
        }

        // Check if this day is the selected date
        if (thisDay.getTime() === compareDate.getTime()) {
            dayElem.classList.add('selected');
        }

        // Add click event
        dayElem.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent event bubbling
            const selectedDate = new Date(currentYear, currentMonth, i);
            if (DEBUG) console.log('Selected day:', i, 'month:', currentMonth + 1, 'year:', currentYear);
            onDateSelected(selectedDate);
        });

        daysGrid.appendChild(dayElem);
    }

    container.appendChild(daysGrid);
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