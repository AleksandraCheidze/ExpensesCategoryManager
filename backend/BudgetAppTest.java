import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.io.ByteArrayInputStream;
import java.util.Scanner;
import static org.junit.jupiter.api.Assertions.*;

public class BudgetAppTest {

  private BudgetApp budgetApp;

  @BeforeEach
  public void setUp() {
    budgetApp = new BudgetApp();
  }

  @Test
  public void testGetUserChoice() {
    String input = "2\n";
    ByteArrayInputStream in = new ByteArrayInputStream(input.getBytes());
    System.setIn(in);

    Scanner scanner = new Scanner(System.in);
    String choice = budgetApp.getUserChoice(scanner);
    assertEquals("2", choice);
  }

  @Test
  public void testGetDoubleInput() {
    String input = "123.45\n";
    ByteArrayInputStream in = new ByteArrayInputStream(input.getBytes());
    System.setIn(in);

    Scanner scanner = new Scanner(System.in);
    double result = budgetApp.getDoubleInput(scanner);
    assertEquals(123.45, result, 0.001);
  }
}