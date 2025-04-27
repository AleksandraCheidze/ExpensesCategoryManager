# Expense Manager

## Project Description

The "Expense Manager" is a comprehensive budget management application with a Java backend and JavaScript frontend designed to help users efficiently manage their finances. This application enables users to track their expenses across various categories, create and manage expense records, and generate insightful financial reports. It offers a complete solution for monitoring and analyzing personal expenses with a modern, responsive UI that adapts to all device sizes and includes dark mode support.

## Technical Requirements

### Backend
- **Programming Language:** Java 18-20
- **Dependencies:**
  - Spark (web framework)
  - Gson (JSON serialization/deserialization)
  - JUnit 8 (for testing)
- **Entry Point:** The primary entry point for the application is the `Main.java` file, which can run either in console mode or API server mode
- **Required Files:** The application utilizes two essential files, `expenses.txt` for storing expense data and `categories.txt` for maintaining a list of categories

### Frontend
- **Technologies:**
  - HTML5
  - CSS3
  - JavaScript (vanilla)
  - Chart.js (for data visualization)

## Project Structure

The project is organized into two main directories for clean separation of concerns:

### Backend (Java)
Located in the `backend` directory, the backend is organized around key classes and interfaces:

- **`BudgetApp`**: The central application class responsible for user interactions, expense recording, and report generation
- **`ExpenseCategoryManager`**: A class dedicated to managing expense categories, offering functionalities for adding and removing categories
- **`Expense`**: A class representing individual expense records, featuring fields for `category`, `amount`, and `date`
- **`ExpenseReportGenerator`**: A versatile class designed for generating a variety of expense reports
- **`SimpleExpenseServer`**: A lightweight HTTP server that serves the frontend and handles API requests
- **`ReportsHandler`**: Handles report generation requests from the frontend
- **`SimpleHttpServer`**: Provides HTTP server functionality

The relationships between these classes are as follows:

- `BudgetApp` utilizes `ExpenseCategoryManager` to manage and manipulate categories
- `BudgetApp` leverages `ExpenseReportGenerator` for generating detailed financial reports
- `ExpenseReportGenerator` relies on data from the `Expense` class to produce meaningful reports
- `SimpleExpenseServer` uses all of the above classes to provide a REST API for the frontend

### Frontend (JavaScript)
Located in the `frontend` directory, the frontend is organized around the following files:

- **`index.html`**: The main HTML file that defines the structure of the web application
- **`styles.css`**: The CSS file that defines the styling of the web application, including dark mode support and responsive design
- **`app.js`**: The main JavaScript file that contains core application logic and interacts with the backend API
- **`calendar.js`**: Implements a custom date picker with month and year navigation
- **`categories.js`**: Manages category operations (add, delete, display)
- **`navigation.js`**: Handles tab navigation and UI state management
- **`recent-expenses.js`**: Manages the display and deletion of recent expenses
- **`display-report.js`**: Handles report generation and visualization

## Installation

### Prerequisites

- Java JDK 18 or higher
- Web browser (Chrome, Firefox, Edge, or Safari recommended)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/AleksandraCheidze/ExpenseManager.git
   cd ExpenseManager
   ```

2. Build the project (if using Gradle):
   ```bash
   ./gradlew build
   ```

## Running the Application

### Quick Start

The easiest way to run the application is to use the provided batch file:

```bash
run-app.bat
```

This will compile the Java files and start the server on http://localhost:8080.

### Manual Start

Alternatively, you can compile and run the server manually:

```bash
javac -d build/classes/java/main backend/SimpleExpenseServer.java
java -cp build/classes/java/main SimpleExpenseServer
```

### Accessing the Application

Once the server is running, open http://localhost:8080 in your web browser to access the application. The frontend is automatically served by the Java backend.

## User Interface

The application features a modern, responsive interface with the following sections:

1. **Add Expense**: Form for adding new expenses with amount, category, and date
2. **Recent Expenses**: Table displaying recent expenses with options to delete entries
3. **Categories**: Interface for managing expense categories
4. **Reports**: Tools for generating and visualizing expense reports

### Responsive Design

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile phones

The UI automatically adapts to different screen sizes, providing an optimal user experience on any device.

## Key Features

- **Expense Tracking**: Add, view, and delete expenses with amount, category, and date
- **Category Management**: Create and manage custom expense categories
- **Interactive Reports**: Generate visual reports to analyze spending patterns
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between dark and light themes for comfortable viewing
- **Custom Calendar**: User-friendly date picker with month and year navigation
- **Offline Support**: Fallback to local storage when server is unavailable
- **Real-time Updates**: Instant UI updates when adding or deleting expenses

## API Endpoints

- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Add a new expense
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Add a new category
- `DELETE /api/categories/:category` - Delete a category
- `POST /api/reports` - Generate a report

## Author

- **Aleksandra Cheidze**

## License

This project is licensed under the MIT License - see the LICENSE file for details.