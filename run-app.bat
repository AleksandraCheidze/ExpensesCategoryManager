@echo off
echo Compiling Java files...
javac -d build/classes/java/main backend/SimpleExpenseServer.java backend/ReportsHandler.java backend/BudgetApp.java backend/Expense.java backend/ExpenseCategoryManager.java backend/ExpenseReportGenerator.java backend/SimpleHttpServer.java

echo Starting server...
java -cp build/classes/java/main SimpleExpenseServer

pause
