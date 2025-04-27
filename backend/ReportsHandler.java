import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

public class ReportsHandler implements HttpHandler {
    private static final String EXPENSES_FILE = "res/expenses.txt";

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        // Set CORS headers
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type,Authorization");

        // Handle preflight requests
        if (method.equals("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (method.equals("POST")) {
            // Read request body
            InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
            BufferedReader br = new BufferedReader(isr);
            StringBuilder requestBody = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                requestBody.append(line);
            }

            // Parse JSON request
            String jsonRequest = requestBody.toString();
            System.out.println("Report request: " + jsonRequest);

            // Load expenses
            List<Map<String, Object>> allExpenses = new ArrayList<>();

            try {
                System.out.println("Loading expenses from file: " + EXPENSES_FILE);
                File file = new File(EXPENSES_FILE);
                if (!file.exists()) {
                    System.out.println("Expenses file does not exist!");
                } else {
                    List<String> lines = Files.readAllLines(Paths.get(EXPENSES_FILE), StandardCharsets.UTF_8);
                    System.out.println("Read " + lines.size() + " lines from expenses file");

                    for (String expLine : lines) {
                        expLine = expLine.trim();
                        if (expLine.isEmpty()) {
                            continue;
                        }

                        // Find the last two parts (amount and date) and consider everything before as the category
                        int lastSpace = expLine.lastIndexOf(' ');
                        if (lastSpace > 0) {
                            String date = expLine.substring(lastSpace + 1);
                            String remainingLine = expLine.substring(0, lastSpace).trim();

                            lastSpace = remainingLine.lastIndexOf(' ');
                            if (lastSpace > 0) {
                                String amountStr = remainingLine.substring(lastSpace + 1);
                                String category = remainingLine.substring(0, lastSpace).trim();
                                try {
                                    double amount = Double.parseDouble(amountStr);

                                    // Normalize date format if needed
                                    String normalizedDate = normalizeDate(date);

                                    Map<String, Object> expense = new HashMap<>();
                                    expense.put("category", category);
                                    expense.put("amount", amount);
                                    expense.put("date", normalizedDate);

                                    allExpenses.add(expense);
                                } catch (NumberFormatException e) {
                                    System.err.println("Error parsing amount: " + e.getMessage());
                                }
                            }
                        }
                    }
                }
            } catch (IOException e) {
                System.err.println("Error loading expenses: " + e.getMessage());
            }

            // Parse report parameters
            String reportType = "";
            String category = "";
            String startDate = "";
            String endDate = "";

            try {
                // Simple JSON parsing without external libraries
                String json = jsonRequest.trim();
                if (json.startsWith("{") && json.endsWith("}")) {
                    json = json.substring(1, json.length() - 1);
                    String[] pairs = json.split(",");
                    for (String pair : pairs) {
                        String[] keyValue = pair.split(":");
                        if (keyValue.length == 2) {
                            String key = keyValue[0].trim().replace("\"", "");
                            String value = keyValue[1].trim().replace("\"", "");

                            if (key.equals("type")) {
                                reportType = value;
                            } else if (key.equals("category") || key.equals("categoryId")) {
                                category = value;
                            } else if (key.equals("startDate")) {
                                startDate = value;
                            } else if (key.equals("endDate")) {
                                endDate = value;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Error parsing report request: " + e.getMessage());
            }

            // Filter expenses based on report parameters
            List<Map<String, Object>> filteredExpenses = new ArrayList<>();

            // Normalize dates for comparison
            String normalizedStartDate = normalizeDate(startDate);
            String normalizedEndDate = normalizeDate(endDate);

            // Convert to Date objects for comparison
            Date startDateObj = null;
            Date endDateObj = null;

            try {
                if (!normalizedStartDate.isEmpty()) {
                    startDateObj = new SimpleDateFormat("yyyy-MM-dd").parse(normalizedStartDate);
                }
                if (!normalizedEndDate.isEmpty()) {
                    endDateObj = new SimpleDateFormat("yyyy-MM-dd").parse(normalizedEndDate);
                }
            } catch (ParseException e) {
                System.err.println("Error parsing date: " + e.getMessage());
            }

            // Filter expenses
            for (Map<String, Object> expense : allExpenses) {
                boolean include = true;

                // Filter by category if specified
                if (!category.isEmpty() && !category.equals("all")) {
                    String expenseCategory = (String) expense.get("category");
                    if (!expenseCategory.equals(category)) {
                        include = false;
                    }
                }

                // Filter by date range if specified
                if (startDateObj != null || endDateObj != null) {
                    String expenseDateStr = (String) expense.get("date");
                    try {
                        Date expenseDate = new SimpleDateFormat("yyyy-MM-dd").parse(expenseDateStr);

                        if (startDateObj != null && expenseDate.before(startDateObj)) {
                            include = false;
                        }

                        if (endDateObj != null && expenseDate.after(endDateObj)) {
                            include = false;
                        }
                    } catch (ParseException e) {
                        System.err.println("Error parsing expense date: " + e.getMessage());
                        include = false;
                    }
                }

                if (include) {
                    filteredExpenses.add(expense);
                }
            }

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("expenses", filteredExpenses);
            response.put("startDate", startDate);
            response.put("endDate", endDate);
            response.put("category", category);
            response.put("reportType", reportType);

            // Convert response to JSON
            StringBuilder jsonResponse = new StringBuilder();
            jsonResponse.append("{");
            jsonResponse.append("\"expenses\":");
            jsonResponse.append("[");

            for (int i = 0; i < filteredExpenses.size(); i++) {
                Map<String, Object> expense = filteredExpenses.get(i);
                jsonResponse.append("{");
                jsonResponse.append("\"category\":\"" + expense.get("category") + "\",");
                jsonResponse.append("\"amount\":" + expense.get("amount") + ",");
                jsonResponse.append("\"date\":\"" + expense.get("date") + "\"");
                jsonResponse.append("}");

                if (i < filteredExpenses.size() - 1) {
                    jsonResponse.append(",");
                }
            }

            jsonResponse.append("]");
            jsonResponse.append(",\"startDate\":\"" + startDate + "\"");
            jsonResponse.append(",\"endDate\":\"" + endDate + "\"");
            jsonResponse.append(",\"category\":\"" + category + "\"");
            jsonResponse.append(",\"reportType\":\"" + reportType + "\"");
            jsonResponse.append("}");

            // Send response
            byte[] responseBytes = jsonResponse.toString().getBytes(StandardCharsets.UTF_8);

            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, responseBytes.length);

            OutputStream os = exchange.getResponseBody();
            os.write(responseBytes);
            os.close();

            System.out.println("Report generated with " + filteredExpenses.size() + " expenses");
        } else {
            // Method not allowed
            String response = "Method not allowed";
            exchange.sendResponseHeaders(405, response.length());
            OutputStream os = exchange.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
    }

    private static String normalizeDate(String dateStr) {
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
}
