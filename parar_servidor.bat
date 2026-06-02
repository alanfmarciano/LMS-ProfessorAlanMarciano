@echo off
title Parar Servidor LMS Local - SENAI 4.0
echo ======================================================
echo 🛑 PARANDO O SERVIDOR LMS LOCAL NA PORTA 3000...
echo ======================================================
echo.

:: Busca o processo que esta escutando na porta 3000 e encerra ele
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":3000 "') do (
    echo Encerrando processo PID %%a...
    taskkill /f /pid %%a
)

echo.
echo ======================================================
echo ✅ Servidor parado com sucesso!
echo ======================================================
timeout /t 3
