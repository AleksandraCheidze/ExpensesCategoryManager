@echo off
echo Compiling Java files...
javac -d build/classes/java/main src/*.java

echo Starting server...
java -cp build/classes/java/main SimpleExpenseServer

pause
