import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class ExpenseCategoryManager {

  private static final String CATEGORIES_FILE_PATH = "res/categories.txt";
  private final List<String> categories;

  public ExpenseCategoryManager() {
    categories = new ArrayList<>();
    loadCategoriesFromFile();
  }

  /**
   * Adds a new expense category.
   *
   * @param category The name of the category to add.
   */
  public void addCategory(String category) {
    if (category != null && !category.trim().isEmpty()) {
      if (!categories.contains(category)) {
        categories.add(category);
        updateCategories();
        System.out.println("Category successfully added: " + category);
      } else {
        System.out.println("Category already exists: " + category);
      }
    } else {
      System.out.println("Invalid category name.");
    }
  }

  /**
   * Removes an expense category.
   *
   * @param category The name of the category to remove.
   */
  public void removeCategory(String category) {
    if (category != null && !category.isEmpty()) {
      if (categories.remove(category)) {
        updateCategories();
        System.out.println("Category successfully removed: " + category);
      } else {
        System.out.println("Category not found: " + category);
      }
    } else {
      System.out.println("Invalid category name.");
    }
  }
  public List<String> getCategories() {
    return categories;
  }

  /**
   * Manages categories interactively, allowing for adding and removing categories.
   *
   * @param scanner A Scanner object for user input.
   */
  public void manageCategories(Scanner scanner) {
    while (true) {
      System.out.println("Category Management:");
      System.out.println("1. Add category");
      System.out.println("2. Remove category");
      System.out.println("3. Return to main menu");

      int choice;
      if (scanner.hasNextInt()) {
        choice = scanner.nextInt();
        scanner.nextLine();
      } else {
        System.err.println("Please enter a number.");
        scanner.next();
        continue;
      }

      switch (choice) {
        case 1 -> addCategoryFromInput(scanner);
        case 2 -> removeCategoryFromInput(scanner);
        case 3 -> {
          return;
        }
        default -> System.err.println("Invalid choice");
      }
    }
  }

  /**
   * Adds a category based on user input.
   *
   * @param scanner A Scanner object for user input.
   */
  private void addCategoryFromInput(Scanner scanner) {
    System.out.println("Enter new category name:");
    String newCategory = scanner.nextLine();
    addCategory(newCategory);
  }

  /**
   * Removes a category based on user input.
   *
   * @param scanner A Scanner object for user input.
   */
  private void removeCategoryFromInput(Scanner scanner) {
    System.out.println("Enter category name to remove:");
    String categoryToRemove = scanner.nextLine();
    removeCategory(categoryToRemove);
  }

  public void updateCategories() {
    try (FileWriter categoriesWriter = new FileWriter(CATEGORIES_FILE_PATH)) {
      for (String category : categories) {
        categoriesWriter.write(category + "\n");
      }
    } catch (IOException e) {
      System.err.println("Error writing categories to file: " + e.getMessage());
    }
  }

  public void loadCategoriesFromFile() {
    try (Scanner categoriesScanner = new Scanner(new File(CATEGORIES_FILE_PATH))) {
      while (categoriesScanner.hasNextLine()) {
        String category = categoriesScanner.nextLine();
        if (!category.isEmpty()) {
          categories.add(category);
        }
      }
    } catch (FileNotFoundException e) {
      System.err.println("Категории не найдены. Создаем новый файл: " + e.getMessage());
      // Создаем директорию, если она не существует
      File file = new File(CATEGORIES_FILE_PATH);
      File parent = file.getParentFile();
      if (parent != null && !parent.exists()) {
        parent.mkdirs();
      }
      
      // Добавим несколько стандартных категорий
      addCategory("Food");
      addCategory("Clothing");
      addCategory("Transport");
      addCategory("Rent");
      addCategory("Other");
    }
  }
}
