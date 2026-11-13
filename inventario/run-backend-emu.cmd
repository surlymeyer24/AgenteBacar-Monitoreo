@echo off
rem Backend local contra el emulador de Firestore (127.0.0.1:8180). Nunca contra prod.
set FIRESTORE_EMULATOR_HOST=127.0.0.1:8180
cd /d "%~dp0"
call "%~dp0mvnw.cmd" spring-boot:run
