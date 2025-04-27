// Debug mode
const DEBUG = true;

// DOM elements
let expensesTable;

// Data
let expenses = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - recent-expenses.js');

    // Get expenses table
    expensesTable = document.querySelector('#expenses-table tbody');
    if (!expensesTable) {
        console.error('Expenses table not found!');
        return;
    }

    // Load expenses
    loadExpenses();

    // Set up refresh button if it exists
    const refreshButton = document.getElementById('refresh-expenses');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadExpenses);
    }
});

// Load expenses from API
function loadExpenses() {
    console.log('Loading expenses...');

    fetch('/api/expenses')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Expenses loaded:', data);
            expenses = data;
            updateRecentExpensesTable();
        })
        .catch(error => {
            console.error('Error loading expenses:', error);
            expensesTable.innerHTML = `<tr><td colspan="3" class="text-center">Error loading expenses: ${error.message}</td></tr>`;
        });
}

// Update expenses table
function updateRecentExpensesTable() {
    console.log('Updating expenses table with', expenses.length, 'expenses');

    if (!expensesTable) {
        console.error('Expenses table not found!');
        return;
    }

    expensesTable.innerHTML = '';

    if (!expenses || expenses.length === 0) {
        console.log('No expenses to display');
        expensesTable.innerHTML = '<tr><td colspan="3" class="text-center">No expenses to display</td></tr>';
        return;
    }

    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);

        console.log(`Comparing dates: ${a.date} (${dateA}) vs ${b.date} (${dateB})`);

        return dateB - dateA;
    });

    console.log('Sorted expenses:', sortedExpenses);

    // Display only the 10 most recent expenses
    const recentExpenses = sortedExpenses.slice(0, 10);

    recentExpenses.forEach(expense => {
        const row = document.createElement('tr');

        // Format the date
        const formattedDate = formatDate(expense.date);
        console.log(`Formatting date: ${expense.date} -> ${formattedDate}`);

        row.innerHTML = `
            <td><span class="category-badge">${expense.category}</span></td>
            <td><span class="amount">${expense.amount.toFixed(2)}</span></td>
            <td><span class="date">${formattedDate}</span></td>
        `;
        expensesTable.appendChild(row);
    });
}

// Helper function to parse date strings in different formats
function parseDate(dateStr) {
    console.log('Parsing date:', dateStr);

    if (!dateStr) return new Date(0); // Invalid date

    // If it's already a Date object
    if (dateStr instanceof Date) return dateStr;

    // Try to parse ISO format (YYYY-MM-DD)
    if (dateStr.includes('-')) {
        try {
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            console.log('Parsed ISO date:', date, 'from', dateStr);
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
                console.log('Parsed DD.MM.YYYY date:', date, 'from', dateStr);
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
                console.log('Parsed MM/DD/YYYY date:', date, 'from', dateStr);
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
        console.log('Parsed fallback date:', date, 'from', dateStr);
        return date;
    } catch (e) {
        console.error('Error parsing date:', e);
        return new Date(0); // Return invalid date
    }
}

// Helper function to format date for display
function formatDate(dateStr) {
    console.log('Formatting date:', dateStr);

    // Try to parse the date
    const date = parseDate(dateStr);

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.log('Invalid date, returning original string');
        return dateStr;
    }

    // Format the date in English
    const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    console.log('Formatted date:', formatted);
    return formatted;
}
