@echo off
echo Compiling Java files...
javac -cp "lib/*" -d build/classes/java/main src/*.java

echo Starting API server...
java -cp "build/classes/java/main;lib/*" Main --api

pause
