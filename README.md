# Expense Manager

[![Live Demo](https://img.shields.io/badge/demo-online-green.svg)](https://expensescategorymanager.onrender.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/java-17-orange.svg)](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)

## 🌟 Live Demo

**[Try the application online](https://expensescategorymanager.onrender.com/)**

## 📝 Project Description

The "Expense Manager" is a comprehensive budget management application with a Java backend and JavaScript frontend designed to help users efficiently manage their finances. This application enables users to track their expenses across various categories, create and manage expense records, and generate insightful financial reports. It offers a complete solution for monitoring and analyzing personal expenses with a modern, responsive UI that adapts to all device sizes and includes dark mode support.

## 💻 Technical Stack

### Backend
- **Programming Language:** Java 17
- **Server:** Custom HTTP server implementation
- **Data Storage:** File-based storage with `expenses.txt` and `categories.txt`
- **Deployment:** Docker container on Render
- **Entry Point:** The primary entry point for the application is the `SimpleExpenseServer.java` file

### Frontend
- **HTML5** - Structure and content
- **CSS3** - Styling with responsive design and dark mode support
- **JavaScript** (vanilla) - Client-side logic and interactivity
- **Chart.js** - Data visualization for expense reports

## 📚 Project Structure

The project is organized into a clean architecture for separation of concerns:

### Backend (Java)
Located in the `src` directory, the backend is organized around key classes:

- **`BudgetApp`**: The central application class responsible for user interactions, expense recording, and report generation
- **`ExpenseCategoryManager`**: A class dedicated to managing expense categories, offering functionalities for adding and removing categories
- **`Expense`**: A class representing individual expense records, featuring fields for `category`, `amount`, and `date`
- **`ExpenseReportGenerator`**: A versatile class designed for generating a variety of expense reports
- **`SimpleExpenseServer`**: A lightweight HTTP server that serves the frontend and handles API requests
- **`ReportsHandler`**: Handles report generation requests from the frontend
- **`SimpleHttpServer`**: Provides HTTP server functionality

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

### Deployment Files
- **`Dockerfile`**: Configures the Docker container for deployment
- **`render.yaml`**: Configuration file for Render deployment
- **`ExpenseManager.jar`**: Compiled Java application ready for execution

## 📍 Installation & Running Locally

### Prerequisites

- Java JDK 17 or higher
- Web browser (Chrome, Firefox, Edge, or Safari recommended)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/AleksandraCheidze/ExpensesCategoryManager.git
   cd ExpensesCategoryManager
   ```

2. Build the project using the provided batch file:
   ```bash
   build.bat
   ```

### Running the Application

#### Option 1: Using the JAR file

```bash
java -jar ExpenseManager.jar
```

#### Option 2: Using the run batch file

```bash
run.bat
```

#### Option 3: Using Gradle

```bash
./gradlew runApi
```

### Accessing the Application

Once the server is running, open http://localhost:8080 in your web browser to access the application.

## 🚀 Deployment

The application is deployed on Render using Docker. You can access the live version at:

**[https://expensescategorymanager.onrender.com/](https://expensescategorymanager.onrender.com/)**

### Deployment Configuration

The deployment is configured using:

1. **Dockerfile** - Defines the container setup
2. **render.yaml** - Configures the Render web service

### Deploying Your Own Instance

1. Fork this repository
2. Sign up for [Render](https://render.com/)
3. Create a new Web Service and connect your GitHub repository
4. Render will automatically detect the configuration and deploy the application

## 👀 User Interface

![Expense Manager Screenshot](https://i.imgur.com/JQpGqgV.png)

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

## ✨ Key Features

- **Expense Tracking**: Add, view, and delete expenses with amount, category, and date
- **Category Management**: Create and manage custom expense categories
- **Interactive Reports**: Generate visual reports to analyze spending patterns
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between dark and light themes for comfortable viewing
- **Custom Calendar**: User-friendly date picker with month and year navigation
- **Offline Support**: Fallback to local storage when server is unavailable
- **Real-time Updates**: Instant UI updates when adding or deleting expenses

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Add a new expense |
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Add a new category |
| DELETE | `/api/categories/:category` | Delete a category |
| POST | `/api/reports` | Generate a report |

## 👨‍💻 Author

- **Aleksandra Cheidze**
- **Dmitrijs Loginovs**

## 📃 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <a href="https://expensescategorymanager.onrender.com/">
    <img src="https://img.shields.io/badge/Try%20It%20Now-Expense%20Manager-brightgreen?style=for-the-badge" alt="Try It Now">
  </a>
</p>
