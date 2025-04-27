import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.*;
import java.util.List;
import java.util.Scanner;

import static org.junit.jupiter.api.Assertions.*;

class ExpenseCategoryManagerTest {

  private final ByteArrayOutputStream outContent = new ByteArrayOutputStream();
  private final ByteArrayOutputStream errContent = new ByteArrayOutputStream();
  private ExpenseCategoryManager categoryManager;
  private static final String TEST_FILE_NAME = "res/categories_test.txt";

  @BeforeEach
  void setUp() throws IOException {
    // Create a temporary file in the current directory with the required name
    File tempFile = new File(TEST_FILE_NAME);

    if (!tempFile.getParentFile().exists()) {
      tempFile.getParentFile().mkdirs(); // Create a directory if it doesn't exist
    }

    // Create a new file, if it already exists, it will be overwritten
    tempFile.createNewFile();

    categoryManager = new ExpenseCategoryManager();
    System.setOut(new PrintStream(outContent));
    System.setErr(new PrintStream(errContent));
  }

  /**
   * Test method to add a category successfully to the category manager.
   */
  @Test
  void addCategory_Successful() {
    // Test case: Add a valid category and ensure it exists in the category list
    String category = "TestCategory";
    categoryManager.addCategory(category);
    List<String> categories = categoryManager.getCategories();
    assertTrue(categories.contains(category));
  }

  /**
   * Test method to attempt adding a duplicate category to the category manager.
   */
  @Test
  void addCategory_Duplicate() {
    // Test case: Add a category and then attempt to add the same category again,
    // ensuring only one instance of the category exists in the category list.
    String category = "TestCategory";
    categoryManager.addCategory(category);
    categoryManager.addCategory(category);
    List<String> categories = categoryManager.getCategories();
    assertEquals(1, categories.stream().filter(c -> c.equals(category)).count());
  }

  /**
   * Test method to attempt adding an invalid category name (empty or whitespace) to the category manager.
   */
  @Test
  void addCategory_InvalidName() {
    // Test case 1: Attempt to add an empty category name, ensuring it is not added to the category list.
    categoryManager.addCategory("");
    List<String> categories = categoryManager.getCategories();
    assertFalse(categories.contains(""));

    // Test case 2: Attempt to add a category with a whitespace-only name, ensuring it is not added to the category list.
    categoryManager.addCategory("    ");
    assertFalse(categories.contains("    "));
  }

  /**
   * Test method to attempt adding a null category to the category manager.
   */
  @Test
  void addCategory_NullCategory() {
    // Test case: Attempt to add a null category, ensuring it is not added to the category list.
    categoryManager.addCategory(null);
    List<String> categories = categoryManager.getCategories();
    assertFalse(categories.contains(null));
  }

  /**
   * Test method to remove a category successfully from the category manager.
   */
  @Test
  void removeCategory_Successful() {
    // Test case: Add a category, then remove it, ensuring it no longer exists in the category list.
    String category = "TestCategory";
    categoryManager.addCategory(category);
    categoryManager.removeCategory(category);
    assertFalse(categoryManager.getCategories().contains(category));
  }

  /**
   * Test method to attempt removing a category that does not exist in the category manager.
   */
  @Test
  void removeCategory_NotFound() {
    // Test case: Attempt to remove a category that does not exist, ensuring it does not affect the category list.
    String categoryToRemove = "NonExistentCategory";
    categoryManager.removeCategory(categoryToRemove);
    assertFalse(categoryManager.getCategories().contains(categoryToRemove));
  }

  /**
   * Test method to attempt removing an invalid category name (empty or whitespace) from the category manager.
   */
  @Test
  void removeCategory_InvalidName() {
    // Test case 1: Attempt to remove an empty category name, ensuring it does not affect the category list.
    categoryManager.removeCategory("");
    assertFalse(categoryManager.getCategories().contains(""));

    // Test case 2: Attempt to remove a category with a whitespace-only name, ensuring it does not affect the category list.
    categoryManager.removeCategory("    ");
    assertFalse(categoryManager.getCategories().contains("    "));
  }

  /**
   * Test method to attempt removing a null category from the category manager.
   */
  @Test
  void removeCategory_NullCategory() {
    // Test case: Attempt to remove a null category, ensuring it does not affect the category list.
    categoryManager.removeCategory(null);
    assertFalse(categoryManager.getCategories().contains(null));
  }

  /**
   * Test method to retrieve categories after adding categories.
   */
  @Test
  void getCategories_AfterAddingCategories() {
    // Test case: Add multiple categories and then check if they exist in the category list.
    String category1 = "TestCategory1";
    String category2 = "TestCategory2";
    categoryManager.addCategory(category1);
    categoryManager.addCategory(category2);
    assertTrue(categoryManager.getCategories().contains(category1));
    assertTrue(categoryManager.getCategories().contains(category2));
  }

  /**
   * Test method to retrieve categories after adding and then removing categories.
   */
  @Test
  void getCategories_AfterRemovingCategories() {
    // Test case: Add multiple categories, remove one, and then check if they exist in the category list accordingly.
    String category1 = "TestCategory1";
    String category2 = "TestCategory2";
    categoryManager.addCategory(category1);
    categoryManager.addCategory(category2);
    categoryManager.removeCategory(category1);
    assertFalse(categoryManager.getCategories().contains(category1));
    assertTrue(categoryManager.getCategories().contains(category2));
  }

  /**
   * Test method to simulate category management operations using user input.
   */
  @Test
  void manageCategories_AddAndRemoveCategories() {
    // Test case: Simulate adding and removing categories using input stream and validate the result.
    String input = "1\nTestCategory1\n1\nTestCategory2\n2\nTestCategory1\n3\n";
    InputStream in = new ByteArrayInputStream(input.getBytes());
    System.setIn(in);
    Scanner scanner = new Scanner(System.in);
    categoryManager.manageCategories(scanner);
    List<String> categories = categoryManager.getCategories();
    assertEquals(1, categories.stream().filter(c -> c.equals("TestCategory2")).count());
  }

  /**
   * Test method to simulate an invalid choice during category management operations using user input.
   */
  @Test
  void manageCategories_InvalidChoice() {
    // Test case: Simulate an invalid choice during category management and check for error output.
    String input = "5\n3\n";
    InputStream in = new ByteArrayInputStream(input.getBytes());
    System.setIn(in);
    Scanner scanner = new Scanner(System.in);
    categoryManager.manageCategories(scanner);
    String errorOutput = errContent.toString().trim();
    assertEquals("Invalid choice", errorOutput);
  }

  /**
   * Test method to check for a file-related error when updating categories.
   */
  @Test
  void updateCategories_FileError() {
    // Test case: Set a read-only file, attempt to update categories, and check for the error message.
    File readOnlyFile = new File("res/categories.txt");
    assertTrue(readOnlyFile.setReadOnly());
    categoryManager.updateCategories();
    String errorOutput = errContent.toString().trim();
    assertTrue(errorOutput.contains("Error writing categories to file"));
    assertTrue(readOnlyFile.setWritable(true));
  }
}