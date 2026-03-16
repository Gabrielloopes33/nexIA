#!/usr/bin/env pwsh
# Script para executar a migration do Sprint 1
# Uso: .\execute-sprint1-migration.ps1 -Password "sua_senha_aqui"

param(
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [string]$HostUrl = "aws-0-sa-east-1.pooler.supabase.com",
    [int]$Port = 5432,
    [string]$Database = "postgres",
    [string]$User = "postgres.wqbppfngjolnxbwqngfo"
)

$env:DATABASE_URL = "postgresql://${User}:${Password}@${HostUrl}:${Port}/${Database}"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Migration Sprint 1 - Contacts Core" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Banco: $HostUrl`:$Port/$Database" -ForegroundColor Gray
Write-Host ""

# Verificar status atual
Write-Host ">> Verificando status atual das migrations..." -ForegroundColor Yellow
npx prisma migrate status

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO: Não foi possível conectar ao banco de dados." -ForegroundColor Red
    Write-Host "Verifique se a senha está correta." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host ">> Executando migration pendente..." -ForegroundColor Yellow
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "Migration executada com sucesso!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    
    # Gerar cliente Prisma atualizado
    Write-Host ""
    Write-Host ">> Gerando cliente Prisma..." -ForegroundColor Yellow
    npx prisma generate
    
    Write-Host ""
    Write-Host "TABELAS CRIADAS:" -ForegroundColor Cyan
    Write-Host "  - tags" -ForegroundColor White
    Write-Host "  - contact_tags" -ForegroundColor White
    Write-Host "  - lists" -ForegroundColor White
    Write-Host "  - list_contacts" -ForegroundColor White
    Write-Host "  - custom_field_definitions" -ForegroundColor White
    Write-Host "  - contact_custom_field_values" -ForegroundColor White
    Write-Host "  - segments" -ForegroundColor White
    Write-Host ""
    Write-Host "ALTERAÇÕES:" -ForegroundColor Cyan
    Write-Host "  - Coluna deleted_at adicionada à tabela contacts" -ForegroundColor White
    Write-Host ""
    Write-Host "SEED DATA INSERIDO:" -ForegroundColor Cyan
    Write-Host "  - Tags: Lead Quente, Cliente VIP, Reengajamento, Newsletter, etc." -ForegroundColor White
    Write-Host "  - Custom Fields: CPF, Data de Nascimento, Cargo, Empresa, etc." -ForegroundColor White
    Write-Host "  - Lists: Leads Ativos, Clientes, Newsletter, Inativos" -ForegroundColor White
    Write-Host "  - Segments: Leads Qualificados, Clientes em Risco" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ERRO: Falha ao executar a migration." -ForegroundColor Red
    exit 1
}
