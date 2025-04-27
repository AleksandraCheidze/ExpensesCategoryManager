import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Scanner;

public class BudgetApp {

  private static final String FILE_PATH = "res/expenses.txt";
  private static final String MENU_OPTION_ADD_EXPENSE = "1";
  private static final String MENU_OPTION_SHOW_REPORTS = "2";
  private static final String MENU_OPTION_MANAGE_CATEGORIES = "3";
  private static final String MENU_OPTION_EXIT = "4";

  private static final String SUBMENU_OPTION_REPORT_EXPENSES_BY_CATEGORY = "1";
  private static final String SUBMENU_OPTION_COMPARE_EXPENSES_THIS_MONTH = "2";
  private static final String SUBMENU_OPTION_COMPARE_EXPENSES_THIS_YEAR = "3";
  private static final String SUBMENU_OPTION_BACK_TO_MAIN_MENU = "4";

  final List<Expense> expenses;
  public final ExpenseCategoryManager categoryManager;
  private final SimpleDateFormat dateFormat = new SimpleDateFormat("dd.MM.yyyy");
  public Scanner scanner;

  public BudgetApp() {
    categoryManager = new ExpenseCategoryManager();
    scanner = new Scanner(System.in);
    expenses = Expense.loadExpensesFromFile(FILE_PATH);
  }

  public void run() {
    while (true) {
      displayMainMenu();
      String choice = getUserChoice(scanner);
      switch (choice) {
        case MENU_OPTION_ADD_EXPENSE:
          addExpense();
          break;
        case MENU_OPTION_SHOW_REPORTS:
          showReportsMenu();
          break;
        case MENU_OPTION_MANAGE_CATEGORIES:
          categoryManager.manageCategories(scanner);
          break;
        case MENU_OPTION_EXIT:
          Expense.saveExpensesToFile(expenses, FILE_PATH);
          exit();
          return;
        default:
          System.err.println("Invalid choice.");
      }
    }
  }

  private void displayMainMenu() {
    System.out.println("╔════════════════════════════════════════════════╗");
    System.out.println("║              Budget Application                ║");
    System.out.println("╠════════════════════════════════════════════════╣");
    System.out.println("║  1. New Expense                                ║");
    System.out.println("║  2. Reports                                    ║");
    System.out.println("║  3. Manage Categories                          ║");
    System.out.println("║  4. Exit                                       ║");
    System.out.println("╚════════════════════════════════════════════════╝");
  }

  private void showReportsMenu() {
    boolean isSubMenuRunning = true;
    ExpenseReportGenerator reportGenerator = new ExpenseReportGenerator(expenses);
    while (isSubMenuRunning) {
      System.out.println("Reports Menu:");
      System.out.println("1. Expense report by category and period");
      System.out.println("2. Compare current month expenses with previous");
      System.out.println("3. Compare current year expenses with previous");
      System.out.println("4. Back to main menu");
      String reportChoice = getUserChoice(scanner);
      switch (reportChoice) {
        case SUBMENU_OPTION_REPORT_EXPENSES_BY_CATEGORY:
          reportGenerator.viewExpensesByCategoryAndPeriod();
          break;
        case SUBMENU_OPTION_COMPARE_EXPENSES_THIS_MONTH:
          reportGenerator.compareExpensesWithPreviousMonth();
          break;
        case SUBMENU_OPTION_COMPARE_EXPENSES_THIS_YEAR:
          reportGenerator.compareExpensesByYear();
          break;
        case SUBMENU_OPTION_BACK_TO_MAIN_MENU:
          isSubMenuRunning = false;
          break;
        default:
          System.err.println("Invalid choice.");
      }
    }
  }

  /**
   * Prompts the user for their choice and returns it as a string.
   *
   * @param scanner The Scanner object for user input.
   * @return The user's choice as a string.
   */

  String getUserChoice(Scanner scanner) {
    System.out.print("Enter your choice: ");
    return scanner.nextLine();
  }

  /**
   * Prompts the user to choose an expense category from a list.
   *
   * @param scanner The Scanner object for user input.
   * @return The chosen expense category as a string, or null if an invalid choice is made.
   */

  String chooseExpenseCategory(Scanner scanner) {
    System.out.println("Choose expense category:");
    List<String> categories = categoryManager.getCategories();
    for (int i = 0; i < categories.size(); i++) {
      System.out.println((i + 1) + ". " + categories.get(i));
    }

    int categoryChoice = Integer.parseInt(getUserChoice(scanner)); // Use the passed scanner
    if (categoryChoice < 1 || categoryChoice > categories.size()) {
      System.err.println("Invalid category choice.");
      return null;
    }
    return categories.get(categoryChoice - 1);
  }

  /**
   * Prompts the user to enter the expense amount and returns it as a double.
   *
   * @return The entered expense amount as a double.
   */
  double enterExpenseAmount() {
    System.out.print("Enter expense amount: ");
    return getDoubleInput(scanner);
  }

  /**
   * Prompts the user to enter the expense date and returns it as a Date object.
   *
   * @return The entered expense date as a Date object.
   */

  Date enterExpenseDate() {
    boolean validDate = false;
    Date date = null;

    while (!validDate) {
      System.out.print("Enter expense date (in format YYYY-MM-DD, DD.MM.YYYY, or MM/DD/YYYY): ");
      String dateStr = scanner.nextLine();

      // Try to parse the date using different formats
      try {
        // Check if date is in YYYY-MM-DD format
        if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
          SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd");
          isoFormat.setLenient(false);
          date = isoFormat.parse(dateStr);
          validDate = true;
          continue;
        }

        // Check if date is in DD.MM.YYYY format
        if (dateStr.matches("\\d{1,2}\\.\\d{1,2}\\.\\d{4}")) {
          String[] dateParts = dateStr.split("\\.");
          int day = Integer.parseInt(dateParts[0]);
          int month = Integer.parseInt(dateParts[1]);
          int year = Integer.parseInt(dateParts[2]);

          if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
            System.err.println("Invalid date values. Please enter a valid date.");
            continue;
          }

          Calendar calendar = Calendar.getInstance();
          calendar.setLenient(false);
          calendar.set(Calendar.DAY_OF_MONTH, day);
          calendar.set(Calendar.MONTH, month - 1);
          calendar.set(Calendar.YEAR, year);

          date = calendar.getTime();
          validDate = true;
          continue;
        }

        // Check if date is in MM/DD/YYYY format
        if (dateStr.matches("\\d{1,2}/\\d{1,2}/\\d{4}")) {
          String[] dateParts = dateStr.split("/");
          int month = Integer.parseInt(dateParts[0]);
          int day = Integer.parseInt(dateParts[1]);
          int year = Integer.parseInt(dateParts[2]);

          if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
            System.err.println("Invalid date values. Please enter a valid date.");
            continue;
          }

          Calendar calendar = Calendar.getInstance();
          calendar.setLenient(false);
          calendar.set(Calendar.DAY_OF_MONTH, day);
          calendar.set(Calendar.MONTH, month - 1);
          calendar.set(Calendar.YEAR, year);

          date = calendar.getTime();
          validDate = true;
          continue;
        }

        System.err.println("Invalid date format. Use format YYYY-MM-DD, DD.MM.YYYY, or MM/DD/YYYY.");
      } catch (Exception e) {
        System.err.println("Invalid date: " + e.getMessage() + ". Please enter a valid date.");
      }
    }
    return date;
  }

  /**
   * Adds a new expense to the expenses list based on user input. Prompts the user to choose a
   * category, enter an amount, and input the date.
   */
  public void addExpense() {
    String category = chooseExpenseCategory(scanner);
    if (category == null) {
      return;
    }

    double amount = enterExpenseAmount();
    Date date = enterExpenseDate();

    Expense expense = new Expense(category, amount, dateFormat.format(date));
    expenses.add(expense);
    System.out.println("Expense successfully added.");
  }

  /**
   * Helper method to get a double input from the user via the scanner.
   *
   * @param scanner The Scanner object for user input.
   * @return The entered double value.
   */
  double getDoubleInput(Scanner scanner) {
    while (true) {
      try {
        return Double.parseDouble(scanner.nextLine());
      } catch (NumberFormatException e) {
        System.err.println("Invalid input. Enter a number.");
      }
    }
  }

  void exit() {
    System.out.println("Exit");
    scanner.close();
  }
}
