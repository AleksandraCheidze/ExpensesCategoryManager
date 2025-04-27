@echo off
echo Creating build directory...
mkdir build\classes\java\main 2>nul

echo Compiling Java files...
javac -source 17 -target 17 -d build/classes/java/main src/*.java

echo Creating resources directory...
mkdir build\resources 2>nul

echo Copying frontend files...
xcopy /E /I /Y frontend build\resources\frontend

echo Creating JAR file...
jar -cfm ExpenseManager.jar MANIFEST.MF -C build/classes/java/main . -C build resources

echo Build completed successfully!
echo You can now run the application with: java -jar ExpenseManager.jar
pause
