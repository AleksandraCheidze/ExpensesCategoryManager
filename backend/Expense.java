import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;
import javax.sound.midi.Soundbank;

public class Expense {
  private final String category;
  private final double amount;
  private final String date;

  public Expense(String category, double amount, String date) {
    this.category = category;
    this.amount = amount;
    this.date = date;
  }

  public String getCategory() {
    return category;
  }

  public double getAmount() {
    return amount;
  }

  public String getDate() {
    return date;
  }

  /**
   * Loads a list of expenses from the specified file.
   *
   * @param filePath The path to the file from which to load expenses.
   * @return A list of expense objects loaded from the file.
   */
  public static List<Expense> loadExpensesFromFile(String filePath) {
    List<Expense> expenses = new ArrayList<>();
    try (Scanner fileScanner = new Scanner(new File(filePath))) {
      while (fileScanner.hasNextLine()) {
        String line = fileScanner.nextLine().trim();
        if (line.isEmpty()) {
          continue; // Skip empty lines
        }
        // Format: Category Amount Date
        // Find the last two parts (amount and date) and consider everything before as the category
        int lastSpace = line.lastIndexOf(' ');
        if (lastSpace > 0) {
          String date = line.substring(lastSpace + 1);
          String remainingLine = line.substring(0, lastSpace).trim();

          lastSpace = remainingLine.lastIndexOf(' ');
          if (lastSpace > 0) {
            String amountStr = remainingLine.substring(lastSpace + 1);
            String category = remainingLine.substring(0, lastSpace).trim();
            try {
              double amount = Double.parseDouble(amountStr);
              expenses.add(new Expense(category, amount, date));
              System.out.println("Loaded expense: " + category + " " + amount + " " + date);
            } catch (NumberFormatException e) {
              System.err.println("Invalid amount format in line: " + line);
            }
          }
        }
      }
    } catch (Exception e) {
      System.err.println("Unable to read expenses: " + e.getMessage());
    }
    return expenses;
  }

  /**
   * Saves a list of expenses to the specified file.
   *
   * @param expenses The list of expenses to be saved.
   * @param filePath The path to the file where expenses should be saved.
   */
  public static void saveExpensesToFile(List<Expense> expenses, String filePath) {
    System.out.println("Saving " + expenses.size() + " expenses to file: " + filePath);
    try {
      // Make sure the directory exists
      File file = new File(filePath);
      File parent = file.getParentFile();
      if (parent != null && !parent.exists()) {
        parent.mkdirs();
      }

      // Write expenses to file
      try (FileWriter writer = new FileWriter(filePath)) {
        for (Expense expense : expenses) {
          // Ensure date is in YYYY-MM-DD format
          String date = expense.getDate();

          // Handle DD.MM.YYYY format
          if (date.contains(".")) {
            String[] parts = date.split("\\.");
            if (parts.length == 3) {
              date = parts[2] + "-" + parts[1] + "-" + parts[0];
            }
          }
          // Handle MM/DD/YYYY format
          else if (date.contains("/")) {
            String[] parts = date.split("/");
            if (parts.length == 3) {
              date = parts[2] + "-" + parts[0] + "-" + parts[1];
            }
          }
          String line = expense.getCategory() + " " + expense.getAmount() + " " + date;
          System.out.println("Writing expense: " + line);
          writer.write(line + "\n");
        }
        writer.flush();
        System.out.println("Expenses saved to " + filePath);
      }
    } catch (IOException e) {
      System.err.println("Error saving expenses: " + e.getMessage());
      e.printStackTrace();
    }
  }
}
