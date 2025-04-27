# Expense Manager - Standalone Web Interface

This is a standalone web interface for the Expense Category Manager application. It provides a visual way to manage expenses, categories, and generate reports.

## Features

- Add and track expenses
- Manage expense categories
- Generate visual reports:
  - Expenses by category
  - Month-to-month comparison
  - Year-to-year comparison

## How to Use

1. Simply open the `index.html` file in any modern web browser.
2. No server or installation required!

## Data Storage

This standalone version uses the browser's local storage to save your data. This means:
- Your data is stored in your browser
- Data will persist between sessions on the same browser
- Data will not be shared between different browsers or devices

## Integration with Java Backend

This web interface can be integrated with the Java backend by:
1. Moving these files to the `src/web` directory of the Java project
2. Modifying the JavaScript to use the API endpoints instead of local storage
3. Building and running the Java application with the web server enabled
