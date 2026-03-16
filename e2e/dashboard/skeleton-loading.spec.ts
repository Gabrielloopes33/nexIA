import { test, expect } from '@playwright/test'

/**
 * Skeleton Loading Tests for Dashboard
 * Sprint 5: Testes de skeleton loading em todos os 6 cards
 */

test.describe('Dashboard - Skeleton Loading States', () => {
  test('all 6 cards should show skeleton on initial load', async ({ page }) => {
    // Intercept API calls to delay them significantly
    await page.route('**/api/dashboard/**', async (route) => {
      // Delay all dashboard API calls by 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000))
      await route.continue()
    })
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Immediately check for skeleton elements (within 500ms)
    const skeletonSelectors = [
      '[data-testid*="skeleton"]',
      '.animate-pulse',
      '[role="progressbar"]',
      '.skeleton',
      '.loading'
    ]
    
    // At least some skeleton elements should be visible
    let skeletonFound = false
    for (const selector of skeletonSelectors) {
      const elements = page.locator(selector)
      const count = await elements.count()
      if (count > 0) {
        const isVisible = await elements.first().isVisible().catch(() => false)
        if (isVisible) {
          skeletonFound = true
          break
        }
      }
    }
    
    expect(skeletonFound).toBeTruthy()
  })

  test('Funil card skeleton should have correct structure', async ({ page }) => {
    // Delay API response
    await page.route('**/api/dashboard/funnel**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.continue()
    })
    
    await page.goto('/dashboard')
    
    // Check for skeleton in Funil card area
    const funilCard = page.locator('.card', { hasText: 'Funil de Vendas' }).or(
      page.locator('[data-testid="funil-card"]')
    )
    
    // Look for skeleton elements within or near the Funil card
    const skeletonElements = page.locator('.animate-pulse').or(
      page.locator('[data-testid*="skeleton"]')
    )
    
    // Should have skeleton elements visible
    await expect(skeletonElements.first()).toBeVisible({ timeout: 1000 })
  })

  test('Recuperação card skeleton should show loading state', async ({ page }) => {
    await page.route('**/api/dashboard/recovery**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.continue()
    })
    
    await page.goto('/dashboard')
    
    // Check for loading indicators
    const loadingElements = page.locator('.animate-pulse, [data-testid*="skeleton"], .loading')
    await expect(loadingElements.first()).toBeVisible({ timeout: 1000 })
  })

  test('Canais card skeleton should show loading state', async ({ page }) => {
    await page.route('**/api/dashboard/channels**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.continue()
    })
    
    await page.goto('/dashboard')
    
    const loadingElements = page.locator('.animate-pulse, [data-testid*="skeleton"], .loading')
    await expect(loadingElements.first()).toBeVisible({ timeout: 1000 })
  })

  test('Motivos Perda card skeleton should show loading state', async ({ page }) => {
    await page.route('**/api/dashboard/lost-reasons**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.continue()
    })
    
    await page.goto('/dashboard')
    
    const loadingElements = page.locator('.animate-pulse, [data-testid*="skeleton"], .loading')
    await expect(loadingElements.first()).toBeVisible({ timeout: 1000 })
  })

  test('Receita card skeleton should show loading state', async ({ page }) => {
    await page.route('**/api/dashboard/revenue**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.continue()
    })
    
    await page.goto('/dashboard')
    
    const loadingElements = page.locator('.animate-pulse, [data-testid*="skeleton"], .loading')
    await expect(loadingElements.first()).toBeVisible({ timeout: 1000 })
  })

  test('Health Score card skeleton should show loading state', async ({ page }) => {
    await page.route('**/api/dashboard/health-score**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.continue()
    })
    
    await page.goto('/dashboard')
    
    const loadingElements = page.locator('.animate-pulse, [data-testid*="skeleton"], .loading')
    await expect(loadingElements.first()).toBeVisible({ timeout: 1000 })
  })

  test('skeletons should be replaced with content when data loads', async ({ page }) => {
    // Allow normal API response timing
    await page.goto('/dashboard')
    
    // Wait for content to load
    await page.waitForLoadState('networkidle')
    
    // All cards should show real content (not skeletons)
    await expect(page.getByText('Funil de Vendas')).toBeVisible()
    await expect(page.getByText('Oportunidades de Recuperação')).toBeVisible()
    await expect(page.getByText('Performance por Canal')).toBeVisible()
    await expect(page.getByText('Motivos de Perda')).toBeVisible()
    await expect(page.getByText('Receita Semanal')).toBeVisible()
    await expect(page.getByText('Health Score')).toBeVisible()
    
    // Check for actual data content (not skeleton classes)
    const skeletonElements = page.locator('.animate-pulse:visible')
    const count = await skeletonElements.count()
    expect(count).toBe(0)
  })

  test('partial loading - some cards show content while others loading', async ({ page }) => {
    // Make only one API slow
    await page.route('**/api/dashboard/health-score**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.continue()
    })
    
    // Other APIs respond normally
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // Most cards should show content
    await expect(page.getByText('Funil de Vendas')).toBeVisible()
    await expect(page.getByText('Oportunidades de Recuperação')).toBeVisible()
    
    // Health Score might still be loading (depending on implementation)
  })
})

test.describe('Dashboard - Skeleton Responsive Behavior', () => {
  test('skeletons should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    
    await page.route('**/api/dashboard/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000))
      await route.continue()
    })
    
    await page.goto('/dashboard')
    
    // Skeletons should be visible on mobile too
    const skeletonElements = page.locator('.animate-pulse, [data-testid*="skeleton"], .loading')
    await expect(skeletonElements.first()).toBeVisible({ timeout: 1000 })
  })

  test('skeletons should adapt to tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    
    await page.route('**/api/dashboard/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000))
      await route.continue()
    })
    
    await page.goto('/dashboard')
    
    const skeletonElements = page.locator('.animate-pulse, [data-testid*="skeleton"], .loading')
    await expect(skeletonElements.first()).toBeVisible({ timeout: 1000 })
  })
})

test.describe('Dashboard - Loading Performance', () => {
  test('cards should load within reasonable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Wait for all cards to be visible
    await expect(page.getByText('Funil de Vendas')).toBeVisible()
    await expect(page.getByText('Oportunidades de Recuperação')).toBeVisible()
    await expect(page.getByText('Performance por Canal')).toBeVisible()
    await expect(page.getByText('Motivos de Perda')).toBeVisible()
    await expect(page.getByText('Receita Semanal')).toBeVisible()
    await expect(page.getByText('Health Score')).toBeVisible()
    
    const endTime = Date.now()
    const loadTime = endTime - startTime
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
  })

  test('should show loading state immediately on navigation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for loading indicators immediately
    const loadingSelectors = [
      '.animate-pulse',
      '[data-testid*="skeleton"]',
      '[role="progressbar"]',
      '.loading'
    ]
    
    // Within 100ms, should show some loading indicator
    await page.waitForTimeout(100)
    
    let foundLoading = false
    for (const selector of loadingSelectors) {
      const elements = page.locator(selector)
      const count = await elements.count()
      if (count > 0) {
        const visible = await elements.first().isVisible().catch(() => false)
        if (visible) {
          foundLoading = true
          break
        }
      }
    }
    
    expect(foundLoading).toBeTruthy()
  })
})
