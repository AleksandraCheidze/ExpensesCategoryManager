import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

public class ExpenseReportGenerator {

  private final List<Expense> expenses;
  private final Scanner scanner;

  public ExpenseReportGenerator(List<Expense> expenses) {
    this.expenses = expenses;
    this.scanner = new Scanner(System.in);
  }

  /**
   * Generates an expense report based on user-selected category and date range.
   */
  public void viewExpensesByCategoryAndPeriod() {
    System.out.println("Expense report by category and period:");
    System.out.println("Choose a category or enter 0 to select all categories:");
    List<String> categories = getDistinctCategories();
    for (int i = 0; i < categories.size(); i++) {
      System.out.println((i + 1) + ". " + categories.get(i));
    }
    int categoryChoice = getUserChoice(scanner, categories.size() - 1);

    System.out.println("Enter start date (in format YYYY-MM-DD, DD.MM.YYYY, or MM/DD/YYYY):");
    String startDateInput = scanner.next();
    System.out.println("Enter end date (in format YYYY-MM-DD, DD.MM.YYYY, or MM/DD/YYYY):");
    String endDateInput = scanner.next();

    Date startDate = parseDate(startDateInput);
    Date endDate = parseDate(endDateInput);

    if (startDate != null && endDate != null) {
      String selectedCategory = categoryChoice == 0 ? "All categories" : categories.get(categoryChoice - 1);
      Map<String, List<Expense>> categoryExpensesMap = new HashMap<>();

      for (Expense expense : expenses) {
        Date expenseDate = parseDate(expense.getDate());
        String expenseCategory = expense.getCategory();
        if (expenseDate != null && (selectedCategory.equals("All categories") || expenseCategory.equals(selectedCategory))
            && expenseDate.compareTo(startDate) >= 0 && expenseDate.compareTo(endDate) <= 0) {
          categoryExpensesMap.computeIfAbsent(expenseCategory, k -> new ArrayList<>());
          categoryExpensesMap.get(expenseCategory).add(expense);
        }
      }

      System.out.println("======================================");
      System.out.println("Category: " + selectedCategory);
      System.out.println("Period: from " + startDateInput + " to " + endDateInput);

      Comparator<Expense> expenseDateComparator = (e1, e2) -> {
        Date date1 = parseDate(e1.getDate());
        Date date2 = parseDate(e2.getDate());
        if (date1 != null && date2 != null) {
          return date1.compareTo(date2);
        } else {
          return 0;
        }
      };
      for (Map.Entry<String, List<Expense>> entry : categoryExpensesMap.entrySet()) {
        String category = entry.getKey();
        List<Expense> categoryExpenses = entry.getValue();
        categoryExpenses.sort(expenseDateComparator);
        for (Expense expense : categoryExpenses) {
          double amount = expense.getAmount();
          System.out.printf("%-11s | %-18s | %.1f%n", expense.getDate(), category, amount);
        }
      }
    } else {
      System.err.println("Invalid date format.");
    }
  }

  /**
   * Compares expenses of the current month with the previous month.
   */
  public void compareExpensesWithPreviousMonth() {
    System.out.println("Comparing expenses with current month:");

    Calendar currentMonthStart = Calendar.getInstance();
    currentMonthStart.set(Calendar.DAY_OF_MONTH, 1);

    Calendar previousMonthStart = Calendar.getInstance();
    previousMonthStart.add(Calendar.MONTH, -1);
    previousMonthStart.set(Calendar.DAY_OF_MONTH, 1);

    double totalExpensesCurrent = getTotalExpensesInMonth(currentMonthStart);
    double totalExpensesPrevious = getTotalExpensesInMonth(previousMonthStart);

    System.out.println("Expenses in current month: " + String.format("%.1f", totalExpensesCurrent));
    System.out.println("Expenses in previous month: " + String.format("%.1f", totalExpensesPrevious));

    double difference = totalExpensesCurrent - totalExpensesPrevious;

    if (totalExpensesPrevious == 0) {
      if (difference > 0) {
        System.out.println("Expenses in current month are higher by: " + String.format("%.1f", difference));
        System.out.println("Percentage change: No data (previous expenses are zero)");
      } else if (difference < 0) {
        System.out.println("Expenses in current month are lower by: " + String.format("%.1f", Math.abs(difference)));
        System.out.println("Percentage change: No data (previous expenses are zero)");
      } else {
        System.out.println("Expenses in current month are equal to expenses in previous month.");
        System.out.println("Percentage change: No data (previous expenses are zero)");
      }
    } else {
      double percentageChange = (difference / Math.abs(totalExpensesPrevious)) * 100;

      if (difference > 0) {
        System.out.println("Expenses in current month are higher by: " + String.format("%.1f", difference));
        System.out.println("Percentage change: " + String.format("%.1f", percentageChange) + "%");
      } else if (difference < 0) {
        System.out.println("Expenses in current month are lower by: " + String.format("%.1f", Math.abs(difference)));
        System.out.println("Percentage change: " + String.format("%.1f", Math.abs(percentageChange)) + "%");
      } else {
        System.out.println("Expenses in current month are equal to expenses in previous month.");
        System.out.println("Percentage change: 0%");
      }
    }
  }

  /**
   * Compares expenses of the current year with the previous year.
   */
  public void compareExpensesByYear() {
    System.out.println("Comparing expenses with current year:");

    Calendar currentYearStart = Calendar.getInstance();
    currentYearStart.set(Calendar.DAY_OF_YEAR, 1);

    Calendar previousYearStart = Calendar.getInstance();
    previousYearStart.add(Calendar.YEAR, -1);
    previousYearStart.set(Calendar.DAY_OF_YEAR, 1);

    int currentYear = currentYearStart.get(Calendar.YEAR);
    int previousYear = currentYear - 1;

    double totalExpensesThisYear = getTotalExpensesForYear(currentYear);
    double totalExpensesPreviousYear = getTotalExpensesForYear(previousYear);

    System.out.println("Expenses in current year: " + String.format("%.1f", totalExpensesThisYear));
    System.out.println("Expenses in previous year: " + String.format("%.1f", totalExpensesPreviousYear));

    double difference = totalExpensesThisYear - totalExpensesPreviousYear;

    if (totalExpensesPreviousYear != 0) {
      double percentageChange = (difference / totalExpensesPreviousYear) * 100;

      if (difference > 0) {
        System.out.println("Expenses in current year are higher by: " + String.format("%.1f", difference));
        System.out.println("Percentage change: " + String.format("%.1f", percentageChange) + "%");
      } else if (difference < 0) {
        System.out.println("Expenses in current year are lower by: " + String.format("%.1f", Math.abs(difference)));
        System.out.println("Percentage change: " + String.format("%.1f", Math.abs(percentageChange)) + "%");
      } else {
        System.out.println("Expenses in current year are equal to expenses in previous year.");
      }
    } else {
      System.out.println("No data on expenses in previous year.");
    }
  }

  /**
   * Calculates the total expenses for a specific year.
   *
   * @param year The year for which expenses are calculated.
   * @return The total expenses for the specified year.
   */
  public double getTotalExpensesForYear(int year) {
    double totalExpenses = 0.0;
    for (Expense expense : expenses) {
      Date expenseDate = parseDate(expense.getDate());
      if (expenseDate != null) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(expenseDate);
        if (cal.get(Calendar.YEAR) == year) {
          totalExpenses += expense.getAmount();
        }
      }
    }
    return totalExpenses;
  }

  /**
   * Calculates the total expenses for a specific month.
   *
   * @param monthStart A Calendar instance representing the start of the month.
   * @return The total expenses for the specified month.
   */
  public double getTotalExpensesInMonth(Calendar monthStart) {
    double totalExpenses = 0.0;
    for (Expense expense : expenses) {
      Date expenseDate = parseDate(expense.getDate());
      if (expenseDate != null) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(expenseDate);
        if (cal.get(Calendar.YEAR) == monthStart.get(Calendar.YEAR) &&
            cal.get(Calendar.MONTH) == monthStart.get(Calendar.MONTH)) {
          totalExpenses += expense.getAmount();
        }
      }
    }
    return totalExpenses;
  }

  /**
   * Retrieves a list of distinct expense categories from the expenses list.
   *
   * @return List of distinct expense categories.
   */
  public List<String> getDistinctCategories() {
    List<String> distinctCategories = new ArrayList<>();
    for (Expense expense : expenses) {
      String category = expense.getCategory();
      if (!distinctCategories.contains(category)) {
        distinctCategories.add(category);
      }
    }
    return distinctCategories;
  }

  /**
   * Parses a date string into a Date object.
   *
   * @param dateStr The date string to be parsed.
   * @return A Date object representing the parsed date, or null if parsing fails.
   */
  public Date parseDate(String dateStr) {
    if (dateStr == null || dateStr.trim().isEmpty()) {
      System.err.println("Empty date string provided");
      return null;
    }

    try {
      // Check if date is in YYYY-MM-DD format (ISO format)
      if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
        SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd");
        isoFormat.setLenient(false);
        return isoFormat.parse(dateStr);
      }

      // Check if date is in DD.MM.YYYY format
      if (dateStr.matches("\\d{1,2}\\.\\d{1,2}\\.\\d{4}")) {
        SimpleDateFormat dotFormat = new SimpleDateFormat("dd.MM.yyyy");
        dotFormat.setLenient(false);
        return dotFormat.parse(dateStr);
      }

      // Check if date is in MM/DD/YYYY format
      if (dateStr.matches("\\d{1,2}/\\d{1,2}/\\d{4}")) {
        SimpleDateFormat slashFormat = new SimpleDateFormat("MM/dd/yyyy");
        slashFormat.setLenient(false);
        return slashFormat.parse(dateStr);
      }

      // Try to normalize the date format if it doesn't match any of the above patterns
      String normalizedDate = normalizeDate(dateStr);
      if (!normalizedDate.equals(dateStr)) {
        SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd");
        isoFormat.setLenient(false);
        return isoFormat.parse(normalizedDate);
      }

      // Last resort: try with default format
      SimpleDateFormat defaultFormat = new SimpleDateFormat("yyyy-MM-dd");
      defaultFormat.setLenient(false);
      return defaultFormat.parse(dateStr);
    } catch (ParseException e) {
      System.err.println("Error parsing date: " + e.getMessage() + " for date: " + dateStr);
      return null;
    }
  }

  /**
   * Normalizes date format to yyyy-MM-dd for consistent handling
   *
   * @param dateStr The date string to normalize
   * @return Normalized date string in yyyy-MM-dd format
   */
  private String normalizeDate(String dateStr) {
    if (dateStr == null || dateStr.trim().isEmpty()) {
      return "";
    }

    // Check if date is already in YYYY-MM-DD format
    if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
      return dateStr;
    }

    // Try to convert from DD.MM.YYYY to YYYY-MM-DD
    try {
      String[] parts = dateStr.split("\\.");
      if (parts.length == 3) {
        String day = parts[0].length() == 1 ? "0" + parts[0] : parts[0];
        String month = parts[1].length() == 1 ? "0" + parts[1] : parts[1];
        String year = parts[2];
        return year + "-" + month + "-" + day;
      }
    } catch (Exception e) {
      System.err.println("Error normalizing date '" + dateStr + "': " + e.getMessage());
    }

    // Try to convert from MM/DD/YYYY to YYYY-MM-DD
    try {
      String[] parts = dateStr.split("/");
      if (parts.length == 3) {
        String month = parts[0].length() == 1 ? "0" + parts[0] : parts[0];
        String day = parts[1].length() == 1 ? "0" + parts[1] : parts[1];
        String year = parts[2];
        return year + "-" + month + "-" + day;
      }
    } catch (Exception e) {
      System.err.println("Error normalizing date '" + dateStr + "': " + e.getMessage());
    }

    return dateStr; // Return original if normalization fails
  }

  /**
   * Prompts the user for a choice and ensures it falls within a specified range.
   *
   * @param scanner A Scanner object for user input.
   * @param max     The maximum allowed choice value.
   * @return The user's valid choice.
   */
  private int getUserChoice(Scanner scanner, int max) {
    while (true) {
      try {
        String input = scanner.nextLine();
        int choice = Integer.parseInt(input);
        if (choice >= 0 && choice <= max) {
          return choice;
        } else {
          System.err.println("Please enter a number in the range from " + 0 + " to " + max + ".");
        }
      } catch (InputMismatchException | NumberFormatException e) {
        System.err.println("Please enter a number.");
      }
    }
  }

  public double getTotalExpensesInMonth() {

    return 0;
  }
}