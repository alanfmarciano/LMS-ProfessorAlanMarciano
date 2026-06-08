@echo off
title Servidor LMS Local - SENAI 4.0
:menu
cls
echo ======================================================
echo INICIANDO O SERVIDOR LMS LOCAL SENAI 4.0...
echo.
echo 1. Iniciar Servidor e Abrir Navegador
echo 2. Parar Servidor (Mata o processo na porta 3000)
echo 3. Reiniciar Servidor e Abrir Navegador (Recomendado)
echo 4. Instalar / Preparar Novo Computador
echo 5. Sair
echo.
echo ======================================================
set /p opcao="Escolha uma opcao (1-5): "

if "%opcao%"=="1" goto iniciar
if "%opcao%"=="2" goto parar
if "%opcao%"=="3" goto reiniciar
if "%opcao%"=="4" goto instalar
if "%opcao%"=="5" goto sair

goto menu

:iniciar
echo.
echo Iniciando servidor...
start "" "http://localhost:3000/admin.html"
node server.js
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O servidor parou inesperadamente ou ocorreu um erro na porta.
    echo Verifique se outra instancia do servidor ja esta rodando.
)
pause
goto menu

:parar
echo.
echo Parando servidor na porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":3000 "') do (
    echo Encerrando processo PID %%a...
    taskkill /f /pid %%a
)
pause
goto menu

:reiniciar
echo.
echo Parando servidor na porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":3000 "') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo Iniciando servidor...
start "" "http://localhost:3000/admin.html"
node server.js
pause
goto menu

:instalar
echo.
echo Instalando dependencias...
npm install
pause
goto menu

:sair
exit
