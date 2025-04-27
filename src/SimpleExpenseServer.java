import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SimpleExpenseServer {
    private static final String EXPENSES_FILE = "res/expenses.txt";
    private static final int PORT = 8080;

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // Set up routes
        server.createContext("/api/expenses", new ExpensesHandler());
        server.createContext("/api/reports", new ReportsHandler());
        server.createContext("/", new StaticFileHandler());

        // Start server
        server.setExecutor(null);
        server.start();

        System.out.println("Server started on port " + PORT);
        System.out.println("Open http://localhost:" + PORT + "/add-expense.html in your browser");
    }

    static class ExpensesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Enable CORS
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

            System.out.println("Received " + exchange.getRequestMethod() + " request to " + exchange.getRequestURI());

            // Handle preflight requests
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (exchange.getRequestMethod().equalsIgnoreCase("GET")) {
                // Return all expenses
                List<Map<String, Object>> expenses = loadExpenses();
                System.out.println("Returning " + expenses.size() + " expenses to client");
                String response = toJson(expenses);
                System.out.println("JSON response: " + response);
                sendResponse(exchange, response);
            } else if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                // Add a new expense
                String requestBody = readRequestBody(exchange);
                System.out.println("Request body: " + requestBody);

                try {
                    // Parse JSON
                    Map<String, Object> expenseData = parseJson(requestBody);
                    System.out.println("Parsed data: " + expenseData);

                    // Extract data
                    String category = (String) expenseData.get("category");
                    double amount = Double.parseDouble(expenseData.get("amount").toString());
                    String date = (String) expenseData.get("date");

                    // Validate data
                    if (category == null || category.isEmpty() || date == null || date.isEmpty()) {
                        sendErrorResponse(exchange, "Invalid data");
                        return;
                    }

                    // Add expense to file
                    addExpense(category, amount, date);

                    // Send success response
                    Map<String, Object> responseData = new HashMap<>();
                    responseData.put("success", true);
                    responseData.put("message", "Expense added successfully");
                    sendResponse(exchange, toJson(responseData));
                } catch (Exception e) {
                    e.printStackTrace();
                    sendErrorResponse(exchange, "Error processing request: " + e.getMessage());
                }
            } else {
                sendErrorResponse(exchange, "Method not allowed");
            }
        }

        private void sendErrorResponse(HttpExchange exchange, String message) throws IOException {
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", false);
            responseData.put("message", message);
            sendResponse(exchange, toJson(responseData));
        }

        private void sendResponse(HttpExchange exchange, String response) throws IOException {
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
                os.flush();
            }
            System.out.println("Response sent: " + response.substring(0, Math.min(100, response.length())) +
                              (response.length() > 100 ? "..." : ""));
        }

        private String readRequestBody(HttpExchange exchange) throws IOException {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
                StringBuilder requestBody = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    requestBody.append(line);
                }
                return requestBody.toString();
            }
        }

        private Map<String, Object> parseJson(String json) {
            Map<String, Object> result = new HashMap<>();

            // Simple JSON parser for demo purposes
            json = json.trim();
            if (json.startsWith("{") && json.endsWith("}")) {
                json = json.substring(1, json.length() - 1);
                String[] pairs = json.split(",");
                for (String pair : pairs) {
                    String[] keyValue = pair.split(":");
                    if (keyValue.length == 2) {
                        String key = keyValue[0].trim();
                        if (key.startsWith("\"") && key.endsWith("\"")) {
                            key = key.substring(1, key.length() - 1);
                        }

                        String value = keyValue[1].trim();
                        if (value.startsWith("\"") && value.endsWith("\"")) {
                            value = value.substring(1, value.length() - 1);
                            result.put(key, value);
                        } else if (value.equals("true")) {
                            result.put(key, true);
                        } else if (value.equals("false")) {
                            result.put(key, false);
                        } else {
                            try {
                                result.put(key, Double.parseDouble(value));
                            } catch (NumberFormatException e) {
                                result.put(key, value);
                            }
                        }
                    }
                }
            }

            return result;
        }

        private String toJson(Object obj) {
            if (obj instanceof Map) {
                Map<?, ?> map = (Map<?, ?>) obj;
                StringBuilder sb = new StringBuilder();
                sb.append("{");
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
                    } else if (value instanceof Map || value instanceof List) {
                        sb.append(toJson(value));
                    } else {
                        sb.append(value);
                    }
                }
                sb.append("}");
                return sb.toString();
            } else if (obj instanceof List) {
                List<?> list = (List<?>) obj;
                StringBuilder sb = new StringBuilder();
                sb.append("[");
                boolean first = true;
                for (Object item : list) {
                    if (!first) {
                        sb.append(",");
                    }
                    first = false;
                    if (item instanceof String) {
                        sb.append("\"").append(item).append("\"");
                    } else if (item instanceof Map || item instanceof List) {
                        sb.append(toJson(item));
                    } else {
                        sb.append(item);
                    }
                }
                sb.append("]");
                return sb.toString();
            } else {
                return obj.toString();
            }
        }

        private List<Map<String, Object>> loadExpenses() {
            List<Map<String, Object>> expenses = new ArrayList<>();

            try {
                System.out.println("Loading expenses from file: " + EXPENSES_FILE);
                File file = new File(EXPENSES_FILE);
                if (!file.exists()) {
                    System.out.println("Expenses file does not exist!");
                    return expenses;
                }

                List<String> lines = Files.readAllLines(Paths.get(EXPENSES_FILE), StandardCharsets.UTF_8);
                System.out.println("Read " + lines.size() + " lines from expenses file");

                for (String line : lines) {
                    line = line.trim();
                    if (line.isEmpty()) {
                        continue;
                    }

                    System.out.println("Processing line: " + line);
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

                                // Normalize date format if needed
                                String normalizedDate = normalizeDate(date);

                                // Use the category as is - no translation needed
                                String englishCategory = category;

                                System.out.println("Parsed expense: category=" + englishCategory + ", amount=" + amount + ", date=" + normalizedDate);

                                Map<String, Object> expense = new HashMap<>();
                                expense.put("category", englishCategory);
                                expense.put("amount", amount);
                                expense.put("date", normalizedDate);

                                expenses.add(expense);
                            } catch (NumberFormatException e) {
                                System.out.println("Invalid amount format in line: " + line);
                            }
                        } else {
                            System.out.println("Invalid line format (missing amount): " + line);
                        }
                    } else {
                        System.out.println("Invalid line format (missing date): " + line);
                    }
                }

                System.out.println("Loaded " + expenses.size() + " expenses");
            } catch (IOException e) {
                System.err.println("Error loading expenses: " + e.getMessage());
                e.printStackTrace();
            }

            return expenses;
        }



        /**
         * Normalizes date format to yyyy-MM-dd for consistent handling
         */
        private String normalizeDate(String date) {
            // Check if date is in DD.MM.YYYY format
            if (date.matches("\\d{2}\\.\\d{2}\\.\\d{4}")) {
                String[] parts = date.split("\\.");
                return parts[2] + "-" + parts[1] + "-" + parts[0];
            }
            // Check if date is in MM/DD/YYYY format
            else if (date.matches("\\d{2}/\\d{2}/\\d{4}")) {
                String[] parts = date.split("/");
                return parts[2] + "-" + parts[0] + "-" + parts[1];
            }
            // If already in YYYY-MM-DD format or unknown format, return as is
            return date;
        }

        private void addExpense(String category, double amount, String date) throws IOException {
            // Make sure the directory exists
            File file = new File(EXPENSES_FILE);
            File parent = file.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }

            // Append to file
            try (FileWriter writer = new FileWriter(EXPENSES_FILE, true)) {
                writer.write(category + " " + amount + " " + date + "\n");
            }

            System.out.println("Added expense: " + category + " " + amount + " " + date);
        }
    }

    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            System.out.println("Requested path: " + path);

            // Default to index.html for root path
            if (path.equals("/")) {
                path = "/frontend/index.html";
            }

            // Remove leading slash
            if (path.startsWith("/")) {
                path = path.substring(1);
            }

            // Try to load from file system first
            File file = new File(path);
            if (file.exists() && file.isFile()) {
                // Determine content type
                String contentType = getContentType(path);
                exchange.getResponseHeaders().set("Content-Type", contentType);

                // Send file
                exchange.sendResponseHeaders(200, file.length());
                try (OutputStream os = exchange.getResponseBody();
                     FileInputStream fis = new FileInputStream(file)) {
                    byte[] buffer = new byte[1024];
                    int count;
                    while ((count = fis.read(buffer)) != -1) {
                        os.write(buffer, 0, count);
                    }
                }
                return;
            }

            // If not found in file system, try to load from resources
            InputStream resourceStream = getClass().getClassLoader().getResourceAsStream(path);
            if (resourceStream != null) {
                // Determine content type
                String contentType = getContentType(path);
                exchange.getResponseHeaders().set("Content-Type", contentType);

                // Read resource into byte array to determine length
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                int nRead;
                byte[] data = new byte[1024];
                while ((nRead = resourceStream.read(data, 0, data.length)) != -1) {
                    buffer.write(data, 0, nRead);
                }
                buffer.flush();
                byte[] resourceData = buffer.toByteArray();

                // Send resource
                exchange.sendResponseHeaders(200, resourceData.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(resourceData);
                }
                return;
            }

            // File not found
            String response = "File not found: " + path;
            exchange.sendResponseHeaders(404, response.getBytes(StandardCharsets.UTF_8).length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes(StandardCharsets.UTF_8));
            }
        }
    }

    private static String getContentType(String path) {
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
