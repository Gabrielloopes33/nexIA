/**
 * Testes E2E - Fluxo Completo de Criação de Contato
 * 
 * Cenários:
 * - Criar contato com sucesso
 * - Tentar criar contato sem preencher campos obrigatórios
 * - Ver mensagem de erro ao tentar duplicar telefone
 * - Verificar atualização da lista após criação
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo de Criação de Contato', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/contatos')
  })

  test('✅ deve criar contato com sucesso e aparecer na lista', async ({ page }) => {
    // Navegar para página de novo contato
    await page.click('text=Adicionar Contato')
    await page.waitForURL('/contatos/novo')

    // Preencher formulário
    await page.fill('[name="name"]', 'Contato Teste E2E')
    await page.fill('[name="phone"]', '5511987654321')
    await page.fill('[name="email"]', 'teste@exemplo.com')
    await page.fill('[name="empresa"]', 'Empresa Teste')

    // Selecionar status
    await page.click('[id="status"]')
    await page.click('text=Ativo')

    // Salvar
    await page.click('text=Salvar Contato')

    // Verificar toast de sucesso
    await expect(page.locator('text=Contato criado com sucesso!')).toBeVisible()

    // Verificar redirecionamento
    await page.waitForURL('/contatos')

    // Verificar que o contato aparece na lista
    await expect(page.locator('text=Contato Teste E2E')).toBeVisible()
    await expect(page.locator('text=5511987654321')).toBeVisible()
  })

  test('❌ deve mostrar erro quando telefone não é preenchido', async ({ page }) => {
    await page.goto('/contatos/novo')

    // Preencher apenas nome
    await page.fill('[name="name"]', 'Contato Sem Telefone')

    // Tentar salvar
    await page.click('text=Salvar Contato')

    // Verificar mensagem de erro de validação
    await expect(page.locator('text=Telefone é obrigatório')).toBeVisible()

    // Verificar que não saiu da página
    await expect(page).toHaveURL('/contatos/novo')
  })

  test('❌ deve mostrar erro quando nome tem menos de 2 caracteres', async ({ page }) => {
    await page.goto('/contatos/novo')

    await page.fill('[name="name"]', 'A')
    await page.fill('[name="phone"]', '5511987654321')

    await page.click('text=Salvar Contato')

    await expect(page.locator('text=Nome deve ter pelo menos 2 caracteres')).toBeVisible()
  })

  test('❌ deve mostrar erro ao tentar criar contato com telefone duplicado', async ({ page }) => {
    // Criar primeiro contato
    await page.goto('/contatos/novo')
    await page.fill('[name="name"]', 'Primeiro Contato')
    await page.fill('[name="phone"]', '5511987654321')
    await page.click('text=Salvar Contato')
    await page.waitForURL('/contatos')

    // Tentar criar segundo com mesmo telefone
    await page.click('text=Adicionar Contato')
    await page.waitForURL('/contatos/novo')
    await page.fill('[name="name"]', 'Segundo Contato')
    await page.fill('[name="phone"]', '5511987654321')
    await page.click('text=Salvar Contato')

    // Verificar mensagem de erro
    await expect(page.locator('text=já existe')).toBeVisible()
    await expect(page.locator('text=Telefone já cadastrado')).toBeVisible()
  })

  test('❌ deve mostrar loading durante o submit', async ({ page }) => {
    await page.goto('/contatos/novo')

    // Simular delay na API
    await page.route('/api/contacts', async (route) => {
      await new Promise(r => setTimeout(r, 1000))
      await route.continue()
    })

    await page.fill('[name="name"]', 'Contato Delay')
    await page.fill('[name="phone"]', '5511987654321')

    await page.click('text=Salvar Contato')

    // Verificar que o botão mostra loading
    await expect(page.locator('text=Salvando...')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('❌ deve manter dados do formulário quando API retorna erro', async ({ page }) => {
    await page.goto('/contatos/novo')

    // Simular erro na API
    await page.route('/api/contacts', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      })
    })

    await page.fill('[name="name"]', 'Contato Erro')
    await page.fill('[name="phone"]', '5511987654321')
    await page.fill('[name="email"]', 'erro@teste.com')

    await page.click('text=Salvar Contato')

    // Verificar mensagem de erro
    await expect(page.locator('text=Erro interno do servidor')).toBeVisible()

    // Verificar que os dados foram preservados
    await expect(page.locator('[name="name"]')).toHaveValue('Contato Erro')
    await expect(page.locator('[name="phone"]')).toHaveValue('5511987654321')
    await expect(page.locator('[name="email"]')).toHaveValue('erro@teste.com')
  })

  test('✅ deve permitir cancelar e voltar para lista', async ({ page }) => {
    await page.goto('/contatos/novo')

    await page.fill('[name="name"]', 'Contato Cancelado')
    await page.fill('[name="phone"]', '5511987654321')

    await page.click('text=Cancelar')

    await page.waitForURL('/contatos')

    // Verificar que o contato não foi criado
    await expect(page.locator('text=Contato Cancelado')).not.toBeVisible()
  })

  test('✅ deve validar formato de email quando preenchido', async ({ page }) => {
    await page.goto('/contatos/novo')

    await page.fill('[name="name"]', 'Contato Email')
    await page.fill('[name="phone"]', '5511987654321')
    await page.fill('[name="email"]', 'email-invalido')

    await page.click('text=Salvar Contato')

    await expect(page.locator('text=Email inválido')).toBeVisible()
  })

  test('✅ deve permitir selecionar múltiplas tags', async ({ page }) => {
    await page.goto('/contatos/novo')

    await page.fill('[name="name"]', 'Contato Com Tags')
    await page.fill('[name="phone"]', '5511987654321')

    // Selecionar tags (assumindo que existem tags cadastradas)
    await page.click('text=VIP')
    await page.click('text=Lead')

    await page.click('text=Salvar Contato')

    await page.waitForURL('/contatos')

    // Verificar que o contato foi criado com as tags
    const row = page.locator('tr:has-text("Contato Com Tags")')
    await expect(row.locator('text=VIP')).toBeVisible()
    await expect(row.locator('text=Lead')).toBeVisible()
  })

  test('✅ deve criar contato sem nome (apenas telefone)', async ({ page }) => {
    await page.goto('/contatos/novo')

    await page.fill('[name="phone"]', '5511987654321')

    await page.click('text=Salvar Contato')

    await expect(page.locator('text=Contato criado com sucesso!')).toBeVisible()
    await page.waitForURL('/contatos')

    // Verificar que aparece na lista (provavelmente como "Sem nome" ou número)
    await expect(page.locator('text=5511987654321')).toBeVisible()
  })
})
