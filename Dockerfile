FROM openjdk:17-jdk-slim

# Set Java version explicitly
ENV JAVA_VERSION=17

WORKDIR /app

# Copy source files
COPY src /app/src
COPY frontend /app/frontend
COPY res /app/res

# Compile the application
RUN mkdir -p build/classes/java/main && \
    javac -source 17 -target 17 -d build/classes/java/main src/*.java

# Create manifest file
RUN echo "Manifest-Version: 1.0\nMain-Class: SimpleExpenseServer\n" > MANIFEST.MF

# Create JAR file
RUN mkdir -p build/resources && \
    cp -r frontend build/resources/frontend && \
    cp -r res build/resources/res && \
    jar -cfm ExpenseManager.jar MANIFEST.MF -C build/classes/java/main . -C build resources

# Expose the port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "ExpenseManager.jar"]
