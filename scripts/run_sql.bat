@echo off
setlocal

REM Lê as variáveis do arquivo .env.local
for /f "tokens=1,2 delims==" %%a in (.env.local) do (
    if "%%a"=="DATABASE_URL" set DATABASE_URL=%%b
)

echo Executando SQL em: %DATABASE_URL%

REM Extrai componentes da URL (simplificado)
psql "%DATABASE_URL%" -f scripts/create_automation_tables.sql

if %ERRORLEVEL% NEQ 0 (
    echo Erro ao executar SQL
    exit /b 1
)

echo SQL executado com sucesso!
endlocal
