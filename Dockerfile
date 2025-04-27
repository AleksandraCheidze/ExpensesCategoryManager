FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy the JAR file
COPY ExpenseManager.jar /app/ExpenseManager.jar

# Create directory for expenses data
RUN mkdir -p /app/res

# Expose the port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "ExpenseManager.jar"]
