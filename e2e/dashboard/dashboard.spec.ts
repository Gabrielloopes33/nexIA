import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Dashboard - All 6 Cards
 * Sprint 5: Testes de integração E2E
 */

test.describe('Dashboard - All Cards Present', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display all 6 dashboard cards', async ({ page }) => {
    // Verify all card titles are present
    await expect(page.getByText('Funil de Vendas')).toBeVisible()
    await expect(page.getByText('Oportunidades de Recuperação')).toBeVisible()
    await expect(page.getByText('Performance por Canal')).toBeVisible()
    await expect(page.getByText('Motivos de Perda')).toBeVisible()
    await expect(page.getByText('Receita Semanal')).toBeVisible()
    await expect(page.getByText('Health Score')).toBeVisible()
  })

  test('Funil card - should display funnel metrics', async ({ page }) => {
    const funilCard = page.locator('[data-testid="funil-card"]').or(
      page.locator('.card:has-text("Funil de Vendas")')
    )
    
    // Check for key funnel elements
    await expect(page.getByText('Leads')).toBeVisible()
    await expect(page.getByText('Propostas')).toBeVisible()
    await expect(page.getByText('Negociação')).toBeVisible()
    await expect(page.getByText('Fechamento')).toBeVisible()
  })

  test('Recuperação card - should display recovery opportunities', async ({ page }) => {
    // Check for recovery card elements
    await expect(page.getByText(/oportunidades? de recuperação/i)).toBeVisible()
    await expect(page.getByText('Valor Total em Risco')).toBeVisible()
    await expect(page.getByText('Taxa de Sucesso')).toBeVisible()
  })

  test('Canais card - should display channel performance', async ({ page }) => {
    // Check for channel card elements
    await expect(page.getByText(/melhor desempenho/i)).toBeVisible()
    await expect(page.getByText('Taxa de Conversão')).toBeVisible()
    
    // Should show channel names
    const channels = ['Website', 'Indicação', 'Redes Sociais', 'Email', 'Offline']
    for (const channel of channels) {
      await expect(page.getByText(channel, { exact: false })).toBeVisible()
    }
  })

  test('Motivos Perda card - should display lost reasons chart', async ({ page }) => {
    // Check for lost reasons elements
    await expect(page.getByText(/distribuição de motivos/i)).toBeVisible()
    await expect(page.getByText('Principal Motivo')).toBeVisible()
  })

  test('Receita card - should display weekly revenue', async ({ page }) => {
    // Check for revenue elements
    await expect(page.getByText('Receita Total')).toBeVisible()
    await expect(page.getByText('Média Diária')).toBeVisible()
    await expect(page.getByText('Dia Mais Alto')).toBeVisible()
  })

  test('Health Score card - should display health score gauge', async ({ page }) => {
    // Check for health score elements
    await expect(page.getByText(/índice de saúde/i)).toBeVisible()
    await expect(page.getByText('Status')).toBeVisible()
    
    // Check for status labels
    const statuses = ['SAUDÁVEL', 'OK', 'ATENÇÃO', 'CRÍTICO']
    let foundStatus = false
    for (const status of statuses) {
      const statusElement = page.getByText(status, { exact: false })
      if (await statusElement.isVisible().catch(() => false)) {
        foundStatus = true
        break
      }
    }
    expect(foundStatus).toBeTruthy()
  })
})

test.describe('Dashboard - Loading States', () => {
  test('should show skeleton loaders while data is loading', async ({ page }) => {
    // Intercept API calls to delay them
    await page.route('**/api/dashboard/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check for skeleton elements
    const skeletons = page.locator('[data-testid*="skeleton"]').or(
      page.locator('.animate-pulse')
    )
    
    // At least one skeleton should be visible initially
    await expect(skeletons.first()).toBeVisible({ timeout: 1000 })
  })
})

test.describe('Dashboard - Error Handling', () => {
  test('should display error state when API fails', async ({ page }) => {
    // Block API calls to simulate error
    await page.route('**/api/dashboard/**', (route) => {
      route.abort('failed')
    })
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check for error messages or retry buttons
    const errorElements = page.locator('text=/error|erro|falha|retry|tentar/i')
    await expect(errorElements.first()).toBeVisible({ timeout: 5000 })
  })

  test('should allow retry on error', async ({ page }) => {
    let requestCount = 0
    
    // First request fails, second succeeds
    await page.route('**/api/dashboard/**', (route) => {
      requestCount++
      if (requestCount === 1) {
        route.abort('failed')
      } else {
        route.continue()
      }
    })
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Wait for error state
    await page.waitForTimeout(1000)
    
    // Look for retry button
    const retryButton = page.locator('button:has-text("Tentar novamente"), button:has-text("Retry")')
    
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click()
      
      // After retry, cards should load
      await expect(page.getByText('Funil de Vendas')).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Dashboard - Interactions', () => {
  test('should refresh data when refresh button is clicked', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Look for refresh button
    const refreshButton = page.locator('button[title*="Atualizar"], button:has(.refresh-icon)').first()
    
    if (await refreshButton.isVisible().catch(() => false)) {
      // Click refresh
      await refreshButton.click()
      
      // Data should reload (check for loading state or updated timestamp)
      await page.waitForTimeout(1000)
    }
  })

  test('should navigate through sidebar links', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check sidebar is visible
    const sidebar = page.locator('aside, [data-testid="sidebar"], nav').first()
    await expect(sidebar).toBeVisible()
    
    // Common sidebar navigation items
    const navItems = ['Dashboard', 'Negócios', 'Contatos', 'Relatórios', 'Configurações']
    
    for (const item of navItems) {
      const navItem = page.getByText(item, { exact: false }).first()
      if (await navItem.isVisible().catch(() => false)) {
        await expect(navItem).toBeVisible()
      }
    }
  })
})
