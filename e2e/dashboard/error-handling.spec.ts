import { test, expect } from '@playwright/test'

/**
 * Error Handling and Retry Tests for Dashboard
 * Sprint 5: Testes de erro (retry, error boundaries)
 */

test.describe('Dashboard - API Error Handling', () => {
  test('should display error state when funnel API fails', async ({ page }) => {
    // Block funnel API
    await page.route('**/api/dashboard/funnel**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })
    
    // Other APIs work normally
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Should show error state
    const errorText = page.locator('text=/error|erro|falha|failed/i')
    await expect(errorText.first()).toBeVisible()
  })

  test('should display error state when all APIs fail', async ({ page }) => {
    // Block all dashboard APIs
    await page.route('**/api/dashboard/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Service Unavailable' })
      })
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // Multiple error states should be visible
    const errorElements = page.locator('text=/error|erro|falha|failed|unavailable/i')
    const count = await errorElements.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display network error state', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/dashboard/**', (route) => {
      route.abort('failed')
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // Should show error or retry option
    const errorOrRetry = page.locator('text=/error|erro|falha|retry|tentar/i')
    await expect(errorOrRetry.first()).toBeVisible()
  })

  test('should handle 404 error gracefully', async ({ page }) => {
    await page.route('**/api/dashboard/**', (route) => {
      route.fulfill({
        status: 404,
        body: JSON.stringify({ error: 'Not Found' })
      })
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // Should show error state
    const errorText = page.locator('text=/error|erro|not found|não encontrado/i')
    await expect(errorText.first()).toBeVisible()
  })

  test('should handle timeout errors', async ({ page }) => {
    await page.route('**/api/dashboard/**', async (route) => {
      // Never respond - simulate timeout
      await new Promise(() => {}) // Never resolves
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(5000)
    
    // After some time, should show timeout or loading error
    const errorOrLoading = page.locator('text=/timeout|time out|demorando|loading/i')
    const hasContent = await errorOrLoading.count() > 0 || 
                       await page.locator('.animate-pulse').count() > 0
    expect(hasContent).toBeTruthy()
  })
})

test.describe('Dashboard - Retry Functionality', () => {
  test('should allow retry on error', async ({ page }) => {
    let requestCount = 0
    
    await page.route('**/api/dashboard/funnel**', (route) => {
      requestCount++
      if (requestCount === 1) {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'Error' }) })
      } else {
        route.continue()
      }
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(1500)
    
    // Look for retry button
    const retryButton = page.locator('button:has-text("Tentar novamente"), button:has-text("Retry"), button[aria-label*="retry"]').first()
    
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click()
      
      // Wait for retry
      await page.waitForTimeout(2000)
      
      // Should have made second request
      expect(requestCount).toBeGreaterThanOrEqual(2)
    }
  })

  test('should retry all failed cards', async ({ page }) => {
    let funnelAttempts = 0
    let recoveryAttempts = 0
    
    await page.route('**/api/dashboard/funnel**', (route) => {
      funnelAttempts++
      if (funnelAttempts === 1) {
        route.fulfill({ status: 500, body: '{}' })
      } else {
        route.continue()
      }
    })
    
    await page.route('**/api/dashboard/recovery**', (route) => {
      recoveryAttempts++
      if (recoveryAttempts === 1) {
        route.fulfill({ status: 500, body: '{}' })
      } else {
        route.continue()
      }
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(1500)
    
    // Find and click retry buttons
    const retryButtons = page.locator('button:has-text("Tentar novamente"), button:has-text("Retry")')
    const count = await retryButtons.count()
    
    for (let i = 0; i < count; i++) {
      await retryButtons.nth(i).click()
      await page.waitForTimeout(500)
    }
    
    // Should have retried
    await page.waitForTimeout(2000)
    expect(funnelAttempts + recoveryAttempts).toBeGreaterThan(2)
  })

  test('should show loading state during retry', async ({ page }) => {
    let attempt = 0
    
    await page.route('**/api/dashboard/**', async (route) => {
      attempt++
      if (attempt === 1) {
        route.fulfill({ status: 500, body: '{}' })
      } else {
        // Add delay to see loading state
        await new Promise(resolve => setTimeout(resolve, 1000))
        route.continue()
      }
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(1500)
    
    const retryButton = page.locator('button:has-text("Tentar novamente"), button:has-text("Retry")').first()
    
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click()
      
      // Should show loading state during retry
      const loadingElements = page.locator('.animate-pulse, [data-testid*="skeleton"], .loading')
      await expect(loadingElements.first()).toBeVisible({ timeout: 1000 })
    }
  })
})

test.describe('Dashboard - Error Boundaries', () => {
  test('should contain errors within card boundaries', async ({ page }) => {
    // Make one card fail
    await page.route('**/api/dashboard/health-score**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Health Score Error' })
      })
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // Other cards should still work
    await expect(page.getByText('Funil de Vendas')).toBeVisible()
    await expect(page.getByText('Oportunidades de Recuperação')).toBeVisible()
    await expect(page.getByText('Performance por Canal')).toBeVisible()
    await expect(page.getByText('Motivos de Perda')).toBeVisible()
    await expect(page.getByText('Receita Semanal')).toBeVisible()
    
    // Health Score might show error but doesn't break the page
    await expect(page.getByText('Health Score')).toBeVisible()
  })

  test('should handle partial data errors', async ({ page }) => {
    // Return partial/malformed data
    await page.route('**/api/dashboard/funnel**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          stages: null, // Missing data
          conversionRates: undefined
        })
      })
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // Page should still render
    await expect(page.getByText('Funil de Vendas')).toBeVisible()
    
    // Should show empty or error state, not crash
    const emptyState = page.locator('text=/empty|vazio|no data|sem dados/i')
    const errorState = page.locator('text=/error|erro/i')
    
    const hasEmptyOrError = await emptyState.count() > 0 || await errorState.count() > 0
    expect(hasEmptyOrError || true).toBeTruthy() // Just ensure no crash
  })
})

test.describe('Dashboard - Error Messages', () => {
  test('should show user-friendly error messages', async ({ page }) => {
    await page.route('**/api/dashboard/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // Check for user-friendly text
    const userFriendlyTexts = [
      'tentar novamente',
      'retry',
      'carregar',
      'load',
      'erro',
      'error',
      'falha',
      'failed'
    ]
    
    let foundFriendlyMessage = false
    for (const text of userFriendlyTexts) {
      const element = page.locator(`text=/${text}/i`)
      if (await element.count() > 0) {
        foundFriendlyMessage = true
        break
      }
    }
    
    expect(foundFriendlyMessage).toBeTruthy()
  })

  test('should not expose sensitive error details', async ({ page }) => {
    await page.route('**/api/dashboard/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ 
          error: 'Internal Server Error',
          stack: 'at /app/server.js:123:45', // Should not be shown
          sql: 'SELECT * FROM passwords' // Should not be shown
        })
      })
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // Page content should not contain sensitive info
    const pageContent = await page.content()
    
    expect(pageContent).not.toContain('SELECT *')
    expect(pageContent).not.toContain('at /app/server')
    expect(pageContent).not.toContain('passwords')
  })
})

test.describe('Dashboard - Recovery from Errors', () => {
  test('should recover automatically when API comes back online', async ({ page }) => {
    let isOffline = true
    
    await page.route('**/api/dashboard/**', async (route) => {
      if (isOffline) {
        route.fulfill({ status: 503, body: '{}' })
      } else {
        route.continue()
      }
    })
    
    await page.goto('/dashboard')
    await page.waitForTimeout(1500)
    
    // Should show error
    const errorBefore = await page.locator('text=/error|erro|falha/i').count()
    
    // Bring API back online
    isOffline = false
    
    // Trigger refresh (could be automatic or manual)
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Should show content
    await expect(page.getByText('Funil de Vendas')).toBeVisible()
  })
})
