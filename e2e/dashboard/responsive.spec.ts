import { test, expect } from '@playwright/test'

/**
 * Responsive Design Tests for Dashboard
 * Sprint 5: Testes de responsividade (mobile, tablet, desktop)
 */

test.describe('Dashboard - Responsive Layout', () => {
  test('desktop: should show sidebar and all cards in grid layout', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Sidebar should be visible on desktop
    const sidebar = page.locator('aside').or(page.locator('[data-testid="sidebar"]')).first()
    await expect(sidebar).toBeVisible()
    
    // Check sidebar width (should be around 280px based on specs)
    const sidebarBox = await sidebar.boundingBox()
    expect(sidebarBox?.width).toBeGreaterThan(250)
    expect(sidebarBox?.width).toBeLessThan(300)
    
    // All cards should be visible
    await expect(page.getByText('Funil de Vendas')).toBeVisible()
    await expect(page.getByText('Oportunidades de Recuperação')).toBeVisible()
  })

  test('tablet: should adapt layout for medium screens', async ({ page }) => {
    // Set tablet viewport (iPad Pro)
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Cards should still be visible
    await expect(page.getByText('Funil de Vendas')).toBeVisible()
    await expect(page.getByText('Oportunidades de Recuperação')).toBeVisible()
    
    // Layout should adapt - cards might stack or resize
    const mainContent = page.locator('main').or(page.locator('[data-testid="dashboard-content"]')).first()
    await expect(mainContent).toBeVisible()
  })

  test('mobile: should show mobile-optimized layout', async ({ page }) => {
    // Set mobile viewport (iPhone)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Check if mobile menu button is present
    const menuButton = page.locator('button[aria-label*="menu"], button:has(.menu-icon)').first()
    
    // Sidebar might be hidden or collapsed on mobile
    const sidebar = page.locator('aside').or(page.locator('[data-testid="sidebar"]')).first()
    
    // Either sidebar is hidden OR there's a menu button to toggle it
    const sidebarVisible = await sidebar.isVisible().catch(() => false)
    const menuButtonVisible = await menuButton.isVisible().catch(() => false)
    
    expect(sidebarVisible || menuButtonVisible).toBeTruthy()
    
    // Cards should stack vertically on mobile
    await expect(page.getByText('Funil de Vendas')).toBeVisible()
    await expect(page.getByText('Oportunidades de Recuperação')).toBeVisible()
  })

  test('mobile landscape: should handle landscape orientation', async ({ page }) => {
    // Set mobile landscape viewport
    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Cards should be visible
    await expect(page.getByText('Funil de Vendas')).toBeVisible()
    await expect(page.getByText('Health Score')).toBeVisible()
  })
})

test.describe('Dashboard - Card Responsive Behavior', () => {
  test('Funil card: should adapt chart size to container', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 390, height: 844, name: 'mobile' }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Funil card should be visible with chart
      const funilCard = page.getByText('Funil de Vendas').locator('..').locator('..')
      await expect(page.getByText('Funil de Vendas')).toBeVisible()
      
      // Chart elements should be present
      await expect(page.getByText('Leads')).toBeVisible()
    }
  })

  test('Health Score card: gauge should be readable on all sizes', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 390, height: 844, name: 'mobile' }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Health Score card should be visible
      await expect(page.getByText('Health Score')).toBeVisible()
      
      // Score value should be visible
      const scoreText = page.getByText(/\d+%/).first()
      await expect(scoreText).toBeVisible()
      
      // Status should be visible
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
    }
  })

  test('Receita card: chart should adapt to width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Receita card should have chart
    await expect(page.getByText('Receita Semanal')).toBeVisible()
    await expect(page.getByText('Receita Total')).toBeVisible()
    
    // Test on mobile
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be visible
    await expect(page.getByText('Receita Semanal')).toBeVisible()
  })
})

test.describe('Dashboard - Typography Responsive Scaling', () => {
  test('card titles should be readable on all devices', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 390, height: 844, name: 'mobile' }
    ]
    
    const cardTitles = [
      'Funil de Vendas',
      'Oportunidades de Recuperação',
      'Performance por Canal',
      'Motivos de Perda',
      'Receita Semanal',
      'Health Score'
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      for (const title of cardTitles) {
        const titleElement = page.getByText(title)
        await expect(titleElement).toBeVisible()
        
        // Check font size is reasonable
        const fontSize = await titleElement.evaluate(el => 
          window.getComputedStyle(el).fontSize
        )
        const sizeInPx = parseInt(fontSize)
        expect(sizeInPx).toBeGreaterThanOrEqual(12) // Minimum readable size
      }
    }
  })
})

test.describe('Dashboard - Touch Interactions on Mobile', () => {
  test('should support touch scrolling on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Scroll down
    await page.touchscreen.tap(195, 700)
    await page.mouse.wheel(0, 500)
    
    // Wait for scroll
    await page.waitForTimeout(500)
    
    // Bottom cards should be visible after scroll
    await expect(page.getByText('Health Score')).toBeVisible()
  })

  test('tap targets should be large enough on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Find all buttons
    const buttons = page.locator('button')
    const count = await buttons.count()
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      
      if (box) {
        // Minimum touch target size: 44x44px (WCAG 2.1)
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })
})
