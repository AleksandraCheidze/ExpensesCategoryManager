import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ExpenseReportGeneratorTest {

  private ExpenseReportGenerator reportGenerator;

  @BeforeEach
  void setUp() throws ParseException {
    List<Expense> testExpenses = new ArrayList<>();
    testExpenses.add(new Expense("Category1", 100.0, "01.01.2023"));
    testExpenses.add(new Expense("Category1", 200.0, "02.01.2023"));
    testExpenses.add(new Expense("Category2", 150.0, "03.01.2023"));
    testExpenses.add(new Expense("Category2", 50.0, "04.01.2023"));
    reportGenerator = new ExpenseReportGenerator(testExpenses);
  }

  /**
   * Test method to calculate the total expenses for a specific year.
   */
  @Test
  void testGetTotalExpensesForYear() {
    double totalExpenses = reportGenerator.getTotalExpensesForYear(2023);
    assertEquals(500.0, totalExpenses, 0.001);

    totalExpenses = reportGenerator.getTotalExpensesForYear(2022);
    assertEquals(0.0, totalExpenses, 0.001);
  }

  /**
   * Test method to parse a date string into a Date object.
   */
  @Test
  void testParseDate() {
    String dateStr = "01.01.2023";
    Date parsedDate = reportGenerator.parseDate(dateStr);
    SimpleDateFormat dateFormat = new SimpleDateFormat("dd.MM.yyyy");
    String formattedDate = dateFormat.format(parsedDate);
    assertEquals(dateStr, formattedDate);

    assertNull(reportGenerator.parseDate("01-01-2023"));

    assertNull(reportGenerator.parseDate("31.02.2023"));
  }

  /**
   * Test method to get a list of distinct expense categories.
   */
  @Test
  void testGetDistinctCategories() {
    List<String> distinctCategories = reportGenerator.getDistinctCategories();
    assertEquals(2, distinctCategories.size());
    assertEquals("Category1", distinctCategories.get(0));
    assertEquals("Category2", distinctCategories.get(1));
  }

  /**
   * Test method to calculate total expenses for a month when the expenses list is empty.
   */
  @Test
  void testGetTotalExpensesInMonthWithEmptyExpensesList() {
    List<Expense> emptyExpenses = new ArrayList<>();
    ExpenseReportGenerator emptyReportGenerator = new ExpenseReportGenerator(emptyExpenses);
    double totalExpenses = emptyReportGenerator.getTotalExpensesInMonth();
    assertEquals(0.0, totalExpenses, 0.001);
  }

  /**
   * Test method to calculate total expenses for a year when the expenses list is empty.
   */
  @Test
  void testGetTotalExpensesForYearWithEmptyExpensesList() {
    List<Expense> emptyExpenses = new ArrayList<>();
    ExpenseReportGenerator emptyReportGenerator = new ExpenseReportGenerator(emptyExpenses);
    double totalExpenses = emptyReportGenerator.getTotalExpensesForYear(2023);
    assertEquals(0.0, totalExpenses, 0.001);
  }

  /**
   * Test method to get distinct categories when the expenses list is empty.
   */
  @Test
  void testGetDistinctCategoriesWithEmptyExpensesList() {
    List<Expense> emptyExpenses = new ArrayList<>();
    ExpenseReportGenerator emptyReportGenerator = new ExpenseReportGenerator(emptyExpenses);
    List<String> distinctCategories = emptyReportGenerator.getDistinctCategories();
    assertEquals(0, distinctCategories.size());
  }

  /**
   * Test method to parse an invalid date string with a different format.
   */
  @Test
  void testParseDateWithInvalidDateFormat() {
    assertNull(reportGenerator.parseDate("2023-01-01"));
  }

  /**
   * Test method to parse an invalid date string with an impossible date.
   */
  @Test
  void testParseDateWithInvalidDate() {
    assertNull(reportGenerator.parseDate("31.02.2023"));
  }
}
