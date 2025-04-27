import java.io.IOException;

public class Main {

  public static void main(String[] args) {
    BudgetApp app = new BudgetApp();

    // Check if we should run in API mode
    if (args.length > 0 && args[0].equals("--api")) {
      // Start the API server
      System.out.println("Starting API server on http://localhost:8080");
      try {
        SimpleHttpServer server = new SimpleHttpServer(8080, app);
        server.start();
        System.out.println("Server started successfully. Press Ctrl+C to stop.");
      } catch (IOException e) {
        System.err.println("Failed to start server: " + e.getMessage());
        e.printStackTrace();
      }
    } else {
      // Run the console app
      app.run();
    }
  }
}