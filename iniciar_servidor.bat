@echo off
title Servidor LMS Local - SENAI 4.0
echo ======================================================
echo INICIANDO O SERVIDOR LMS LOCAL SENAI 4.0...
echo.
echo    Acesso do Aluno: http://localhost:3000
echo    Painel do Instrutor (Admin): http://localhost:3000/admin.html
echo.
echo O painel admin sera aberto automaticamente.
echo ======================================================
echo.

:: Abre o painel administrativo automaticamente no navegador padrao
start "" "http://localhost:3000/admin.html"

node server.js
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O servidor parou inesperadamente ou ocorreu um erro na porta.
    echo Verifique se outra instancia do servidor ja esta rodando.
)
pause
