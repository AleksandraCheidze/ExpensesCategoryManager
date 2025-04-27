import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.Date;

public class SimpleHttpServer {
    private final int port;
    private final BudgetApp budgetApp;
    private final ExpenseCategoryManager categoryManager;
    private final List<Expense> expenses;
    private HttpServer server;

    public SimpleHttpServer(int port, BudgetApp budgetApp) {
        this.port = port;
        this.budgetApp = budgetApp;
        this.categoryManager = budgetApp.categoryManager;
        this.expenses = budgetApp.expenses;
    }

    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);

        // API endpoints
        server.createContext("/api/expenses", new ExpensesHandler());
        server.createContext("/api/categories", new CategoriesHandler());
        server.createContext("/api/reports", new ReportsHandler());

        // Static files
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null); // Use the default executor
        server.start();
        System.out.println("Server started on port " + port);
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
        }
    }

    private class ExpensesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Enable CORS
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

            System.out.println("Received " + exchange.getRequestMethod() + " request to " + exchange.getRequestURI());

            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                System.out.println("Handling OPTIONS request (CORS preflight)");
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (exchange.getRequestMethod().equalsIgnoreCase("GET")) {
                // Return all expenses
                List<Map<String, Object>> expensesList = new ArrayList<>();
                System.out.println("Preparing to return " + expenses.size() + " expenses");

                for (Expense expense : expenses) {
                    Map<String, Object> expenseMap = new HashMap<>();

                    // Handle date format - could be DD.MM.YYYY, MM/DD/YYYY, or YYYY-MM-DD
                    String dateStr = expense.getDate();
                    String normalizedDate = normalizeDate(dateStr);

                    // Debug output
                    System.out.println("Processing expense: category=" + expense.getCategory() +
                                     ", amount=" + expense.getAmount() +
                                     ", date=" + dateStr + " -> " + normalizedDate);

                    expenseMap.put("category", expense.getCategory());
                    expenseMap.put("amount", expense.getAmount());
                    expenseMap.put("date", normalizedDate);
                    expensesList.add(expenseMap);
                }

                String response = toJson(expensesList);
                sendJsonResponse(exchange, 200, response);
            } else if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                // Add a new expense
                String requestBody = readRequestBody(exchange);
                System.out.println("Received expense request: " + requestBody);

                Map<String, Object> expenseData = fromJson(requestBody);
                System.out.println("Parsed expense data: " + expenseData);

                String category = (String) expenseData.get("category");
                double amount = Double.parseDouble(expenseData.get("amount").toString());
                String date = (String) expenseData.get("date");

                System.out.println("Extracted expense details: category=" + category + ", amount=" + amount + ", date=" + date);

                // Convert date to ISO format (YYYY-MM-DD) if it's not already
                if (date.contains("/")) {
                    String[] parts = date.split("/");
                    if (parts.length == 3) {
                        // Convert from MM/DD/YYYY to YYYY-MM-DD
                        date = parts[2] + "-" + parts[0] + "-" + parts[1];
                    }
                }

                Expense expense = new Expense(category, amount, date);
                expenses.add(expense);

                // Save expenses to file
                try {
                    System.out.println("Saving expense to file: " + expense.getCategory() + " " + expense.getAmount() + " " + expense.getDate());
                    Expense.saveExpensesToFile(expenses, "res/expenses.txt");
                    System.out.println("Expense saved successfully");
                } catch (Exception e) {
                    System.err.println("Error saving expense to file: " + e.getMessage());
                    e.printStackTrace();
                }

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Expense added successfully");

                sendJsonResponse(exchange, 200, toJson(response));
            } else {
                sendErrorResponse(exchange, 405, "Method Not Allowed");
            }
        }
    }

    private class CategoriesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Enable CORS
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

            System.out.println("Received " + exchange.getRequestMethod() + " request to " + exchange.getRequestURI());

            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                System.out.println("Handling OPTIONS request (CORS preflight)");
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (exchange.getRequestMethod().equalsIgnoreCase("GET")) {
                // Return all categories
                List<String> categories = categoryManager.getCategories();
                String response = toJson(categories);
                sendJsonResponse(exchange, 200, response);
            } else if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                // Add a new category
                String requestBody = readRequestBody(exchange);
                System.out.println("Received category request: " + requestBody);

                Map<String, Object> categoryData = fromJson(requestBody);
                System.out.println("Parsed category data: " + categoryData);

                String category = (String) categoryData.get("category");
                System.out.println("Adding category: " + category);
                categoryManager.addCategory(category);

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Category added successfully");

                sendJsonResponse(exchange, 200, toJson(response));
            } else if (exchange.getRequestMethod().equalsIgnoreCase("DELETE")) {
                // Delete a category
                String path = exchange.getRequestURI().getPath();
                String category = path.substring(path.lastIndexOf('/') + 1);
                System.out.println("Deleting category from path: " + path + ", extracted category: " + category);

                // URL decode the category name
                try {
                    category = java.net.URLDecoder.decode(category, "UTF-8");
                    System.out.println("URL decoded category: " + category);
                } catch (Exception e) {
                    System.err.println("Error decoding category name: " + e.getMessage());
                }

                categoryManager.removeCategory(category);

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Category deleted successfully");

                sendJsonResponse(exchange, 200, toJson(response));
            } else {
                sendErrorResponse(exchange, 405, "Method Not Allowed");
            }
        }
    }

    private class ReportsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Enable CORS
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

            System.out.println("Received " + exchange.getRequestMethod() + " request to " + exchange.getRequestURI());

            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                System.out.println("Handling OPTIONS request (CORS preflight)");
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                // Generate a report
                String requestBody = readRequestBody(exchange);
                System.out.println("Received report request: " + requestBody);

                Map<String, Object> reportData = fromJson(requestBody);
                System.out.println("Parsed report data: " + reportData);

                String reportType = (String) reportData.get("type");
                System.out.println("Report type: " + reportType);

                Map<String, Object> response = new HashMap<>();

                if ("category".equals(reportType)) {
                    String category = (String) reportData.get("category");
                    String startDate = (String) reportData.get("startDate");
                    String endDate = (String) reportData.get("endDate");

                    // Generate category report
                    response = generateCategoryReport(category, startDate, endDate);
                } else if ("month-comparison".equals(reportType)) {
                    // Generate month comparison report
                    response = generateMonthComparisonReport();
                } else if ("year-comparison".equals(reportType)) {
                    // Generate year comparison report
                    response = generateYearComparisonReport();
                } else {
                    sendErrorResponse(exchange, 400, "Invalid report type");
                    return;
                }

                sendJsonResponse(exchange, 200, toJson(response));
            } else {
                sendErrorResponse(exchange, 405, "Method Not Allowed");
            }
        }

        private Map<String, Object> generateCategoryReport(String category, String startDate, String endDate) {
            Map<String, Object> report = new HashMap<>();
            report.put("type", "category");
            report.put("category", category);
            report.put("startDate", startDate);
            report.put("endDate", endDate);
            
            // Create report generator
            ExpenseReportGenerator reportGenerator = new ExpenseReportGenerator(expenses);
            
            // Get report data
            List<Map<String, Object>> expenseItems = new ArrayList<>();
            double total = 0;
            
            // Filter expenses by category and date range
            for (Expense expense : expenses) {
                Date expenseDate = null;
                Date start = null;
                Date end = null;
                
                try {
                    // Parse dates carefully
                    expenseDate = reportGenerator.parseDate(expense.getDate());
                    start = reportGenerator.parseDate(normalizeDate(startDate));
                    end = reportGenerator.parseDate(normalizeDate(endDate));
                    
                    // Check if the expense matches category and date range
                    if (expenseDate != null && start != null && end != null && 
                        (category.equals("all") || expense.getCategory().equals(category)) &&
                        !expenseDate.before(start) && !expenseDate.after(end)) {
                        
                        Map<String, Object> item = new HashMap<>();
                        item.put("category", expense.getCategory());
                        item.put("amount", expense.getAmount());
                        item.put("date", expense.getDate());
                        expenseItems.add(item);
                        
                        total += expense.getAmount();
                    }
                } catch (Exception e) {
                    System.err.println("Error processing expense for report: " + e.getMessage());
                }
            }
            
            report.put("expenses", expenseItems);
            report.put("total", total);
            
            return report;
        }

        private Map<String, Object> generateMonthComparisonReport() {
            Map<String, Object> report = new HashMap<>();
            report.put("type", "month-comparison");
            
            // Create report generator
            ExpenseReportGenerator reportGenerator = new ExpenseReportGenerator(expenses);
            
            // Get current and previous month
            Calendar currentMonthStart = Calendar.getInstance();
            currentMonthStart.set(Calendar.DAY_OF_MONTH, 1);
            
            Calendar previousMonthStart = Calendar.getInstance();
            previousMonthStart.add(Calendar.MONTH, -1);
            previousMonthStart.set(Calendar.DAY_OF_MONTH, 1);
            
            // Format month names
            SimpleDateFormat monthFormat = new SimpleDateFormat("MMMM yyyy", Locale.ENGLISH);
            String currentMonthName = monthFormat.format(currentMonthStart.getTime());
            String previousMonthName = monthFormat.format(previousMonthStart.getTime());
            
            // Get expense totals
            double currentTotal = reportGenerator.getTotalExpensesInMonth(currentMonthStart);
            double previousTotal = reportGenerator.getTotalExpensesInMonth(previousMonthStart);
            
            // Calculate difference and percentage change
            double difference = currentTotal - previousTotal;
            double percentageChange = 0;
            if (previousTotal > 0) {
                percentageChange = (difference / previousTotal) * 100;
            }
            
            report.put("currentMonth", currentMonthName);
            report.put("previousMonth", previousMonthName);
            report.put("labels", Arrays.asList("Current Month", "Previous Month"));
            report.put("values", Arrays.asList(currentTotal, previousTotal));
            report.put("currentTotal", currentTotal);
            report.put("previousTotal", previousTotal);
            report.put("difference", difference);
            report.put("percentageChange", percentageChange);
            
            return report;
        }

        private Map<String, Object> generateYearComparisonReport() {
            Map<String, Object> report = new HashMap<>();
            report.put("type", "year-comparison");
            
            // Create report generator
            ExpenseReportGenerator reportGenerator = new ExpenseReportGenerator(expenses);
            
            // Get current and previous year
            Calendar currentDate = Calendar.getInstance();
            int currentYear = currentDate.get(Calendar.YEAR);
            int previousYear = currentYear - 1;
            
            // Get expense totals
            double currentTotal = reportGenerator.getTotalExpensesForYear(currentYear);
            double previousTotal = reportGenerator.getTotalExpensesForYear(previousYear);
            
            // Calculate difference and percentage change
            double difference = currentTotal - previousTotal;
            double percentageChange = 0;
            if (previousTotal > 0) {
                percentageChange = (difference / previousTotal) * 100;
            }
            
            report.put("currentYear", String.valueOf(currentYear));
            report.put("previousYear", String.valueOf(previousYear));
            report.put("labels", Arrays.asList("Current Year", "Previous Year"));
            report.put("values", Arrays.asList(currentTotal, previousTotal));
            report.put("currentTotal", currentTotal);
            report.put("previousTotal", previousTotal);
            report.put("difference", difference);
            report.put("percentageChange", percentageChange);
            
            return report;
        }
    }

    private class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            System.out.println("Received static file request for: " + path);

            // Default to index.html for root path
            if (path.equals("/")) {
                path = "/index.html";
                System.out.println("Redirecting to index.html");
            }

            // Try multiple possible locations for the file
            File file = null;
            String filePath = null;

            // First try Expenses/standalone-web
            filePath = "Expenses/standalone-web" + path;
            file = new File(filePath);
            System.out.println("Trying file path: " + file.getAbsolutePath());

            // If not found, try standalone-web
            if (!file.exists() || file.isDirectory()) {
                filePath = "standalone-web" + path;
                file = new File(filePath);
                System.out.println("Trying alternate file path: " + file.getAbsolutePath());
            }

            // If not found, try Expenses/src/web
            if (!file.exists() || file.isDirectory()) {
                filePath = "Expenses/src/web" + path;
                file = new File(filePath);
                System.out.println("Trying alternate file path: " + file.getAbsolutePath());
            }

            // If not found, try src/web
            if (!file.exists() || file.isDirectory()) {
                filePath = "src/web" + path;
                file = new File(filePath);
                System.out.println("Trying alternate file path: " + file.getAbsolutePath());
            }

            if (file.exists() && !file.isDirectory()) {
                // Determine content type
                String contentType = getContentType(path);
                exchange.getResponseHeaders().set("Content-Type", contentType);
                System.out.println("Serving file: " + file.getAbsolutePath() + " with content type: " + contentType);

                // Send the file
                exchange.sendResponseHeaders(200, file.length());
                try (OutputStream os = exchange.getResponseBody();
                     FileInputStream fis = new FileInputStream(file)) {
                    byte[] buffer = new byte[4096];
                    int count;
                    while ((count = fis.read(buffer)) != -1) {
                        os.write(buffer, 0, count);
                    }
                }
            } else {
                // File not found
                System.out.println("File not found: " + path);
                sendErrorResponse(exchange, 404, "File Not Found: " + path);
            }
        }

        private String getContentType(String path) {
            if (path.endsWith(".html")) {
                return "text/html";
            } else if (path.endsWith(".css")) {
                return "text/css";
            } else if (path.endsWith(".js")) {
                return "application/javascript";
            } else if (path.endsWith(".json")) {
                return "application/json";
            } else if (path.endsWith(".png")) {
                return "image/png";
            } else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
                return "image/jpeg";
            } else if (path.endsWith(".gif")) {
                return "image/gif";
            } else {
                return "application/octet-stream";
            }
        }
    }

    // Helper methods for JSON handling
    private String toJson(Object obj) {
        if (obj instanceof List) {
            StringBuilder sb = new StringBuilder();
            sb.append("[");
            List<?> list = (List<?>) obj;
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) {
                    sb.append(",");
                }
                Object item = list.get(i);
                if (item instanceof String) {
                    sb.append("\"").append(item).append("\"");
                } else if (item instanceof Map) {
                    sb.append(toJson(item));
                } else {
                    sb.append(item);
                }
            }
            sb.append("]");
            return sb.toString();
        } else if (obj instanceof Map) {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            Map<?, ?> map = (Map<?, ?>) obj;
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!first) {
                    sb.append(",");
                }
                first = false;
                sb.append("\"").append(entry.getKey()).append("\":");
                Object value = entry.getValue();
                if (value instanceof String) {
                    sb.append("\"").append(value).append("\"");
                } else if (value instanceof List || value instanceof Map) {
                    sb.append(toJson(value));
                } else {
                    sb.append(value);
                }
            }
            sb.append("}");
            return sb.toString();
        } else {
            return obj.toString();
        }
    }

    private Map<String, Object> fromJson(String json) {
        // Very simple JSON parser for demo purposes
        Map<String, Object> result = new HashMap<>();
        try {
            json = json.trim();
            System.out.println("Parsing JSON: " + json);

            // Check if the JSON is valid
            if (!json.startsWith("{") || !json.endsWith("}")) {
                System.err.println("Invalid JSON format: " + json);
                return result;
            }

            // Extract the content between the curly braces
            json = json.substring(1, json.length() - 1).trim();

            // Split by commas, but respect nested objects and arrays
            List<String> pairs = new ArrayList<>();
            int depth = 0;
            StringBuilder currentPair = new StringBuilder();

            for (int i = 0; i < json.length(); i++) {
                char c = json.charAt(i);
                if (c == '{' || c == '[') {
                    depth++;
                    currentPair.append(c);
                } else if (c == '}' || c == ']') {
                    depth--;
                    currentPair.append(c);
                } else if (c == ',' && depth == 0) {
                    pairs.add(currentPair.toString().trim());
                    currentPair = new StringBuilder();
                } else {
                    currentPair.append(c);
                }
            }

            if (currentPair.length() > 0) {
                pairs.add(currentPair.toString().trim());
            }

            // Process each key-value pair
            for (String pair : pairs) {
                System.out.println("Processing pair: " + pair);

                // Find the colon that separates key and value
                int colonIndex = -1;
                boolean inQuotes = false;
                for (int i = 0; i < pair.length(); i++) {
                    char c = pair.charAt(i);
                    if (c == '"') {
                        inQuotes = !inQuotes;
                    } else if (c == ':' && !inQuotes) {
                        colonIndex = i;
                        break;
                    }
                }

                if (colonIndex == -1) {
                    System.err.println("Invalid key-value pair: " + pair);
                    continue;
                }

                // Extract key and value
                String key = pair.substring(0, colonIndex).trim();
                String value = pair.substring(colonIndex + 1).trim();

                // Remove quotes from key
                if (key.startsWith("\"") && key.endsWith("\"")) {
                    key = key.substring(1, key.length() - 1);
                }

                System.out.println("Key: " + key + ", Value: " + value);

                // Process value based on type
                if (value.startsWith("\"") && value.endsWith("\"")) {
                    // String value
                    value = value.substring(1, value.length() - 1);
                    result.put(key, value);
                } else if (value.equals("true")) {
                    // Boolean true
                    result.put(key, true);
                } else if (value.equals("false")) {
                    // Boolean false
                    result.put(key, false);
                } else if (value.startsWith("{") && value.endsWith("}")) {
                    // Nested object - not handling for simplicity
                    result.put(key, value);
                } else if (value.startsWith("[") && value.endsWith("]")) {
                    // Array - not handling for simplicity
                    result.put(key, value);
                } else {
                    // Number or other value
                    try {
                        result.put(key, Double.parseDouble(value));
                    } catch (NumberFormatException e) {
                        result.put(key, value);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing JSON: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("Parsed result: " + result);
        return result;
    }

    /**
     * Normalizes date format to yyyy-MM-dd for consistent handling
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
        
        // Return original string if we can't normalize it
        return dateStr;
    }

    private String readRequestBody(HttpExchange exchange) throws IOException {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
            StringBuilder requestBody = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                requestBody.append(line);
            }
            String result = requestBody.toString();
            System.out.println("Read request body: " + result);
            return result;
        } catch (Exception e) {
            System.err.println("Error reading request body: " + e.getMessage());
            e.printStackTrace();
            return "";
        }
    }

    private void sendJsonResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, response.getBytes(StandardCharsets.UTF_8).length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes(StandardCharsets.UTF_8));
        }
    }

    private void sendErrorResponse(HttpExchange exchange, int statusCode, String errorMessage) throws IOException {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", errorMessage);
        String response = toJson(errorResponse);
        sendJsonResponse(exchange, statusCode, response);
    }
}
