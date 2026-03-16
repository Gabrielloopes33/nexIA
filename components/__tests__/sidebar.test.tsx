import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/lib/test/test-utils'
import { Sidebar } from '@/components/dashboard/layout/Sidebar'

// Mock do next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'

const mockedUsePathname = vi.mocked(usePathname)

describe('Sidebar', () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue('/dashboard')
  })

  it('deve renderizar a sidebar corretamente', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('SalesDash')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Leads')).toBeInTheDocument()
    expect(screen.getByText('Config')).toBeInTheDocument()
    expect(screen.getByText('Ajuda')).toBeInTheDocument()
  })

  it('deve ter largura de 280px implícita via layout', () => {
    const { container } = render(<Sidebar />)
    const sidebarContainer = container.firstChild as HTMLElement
    
    expect(sidebarContainer).toHaveClass('h-full', 'flex', 'flex-col')
  })

  it('deve destacar navegação ativa corretamente', () => {
    mockedUsePathname.mockReturnValue('/analytics')
    
    const { container } = render(<Sidebar />)
    
    // Verifica se o link Analytics tem a classe ativa
    const analyticsLink = screen.getByText('Analytics').closest('a')
    expect(analyticsLink).toHaveClass('bg-primary/10', 'text-primary')
  })

  it('deve mostrar links inativos sem classe ativa', () => {
    mockedUsePathname.mockReturnValue('/dashboard')
    
    render(<Sidebar />)
    
    const analyticsLink = screen.getByText('Analytics').closest('a')
    expect(analyticsLink).not.toHaveClass('bg-primary/10')
    expect(analyticsLink).toHaveClass('text-muted-foreground')
  })

  it('deve renderizar todos os itens do menu', () => {
    render(<Sidebar />)
    
    const expectedItems = ['Dashboard', 'Analytics', 'Leads', 'Config']
    expectedItems.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument()
    })
  })

  it('deve ter link correto para cada item', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('Analytics').closest('a')).toHaveAttribute('href', '/analytics')
    expect(screen.getByText('Leads').closest('a')).toHaveAttribute('href', '/leads')
    expect(screen.getByText('Config').closest('a')).toHaveAttribute('href', '/settings')
  })

  it('deve renderizar ícones em cada item do menu', () => {
    render(<Sidebar />)
    
    const navItems = screen.getAllByRole('link')
    navItems.forEach(item => {
      // Cada link deve ter um SVG (ícone) como filho
      expect(item.querySelector('svg')).toBeInTheDocument()
    })
  })

  it('deve renderizar botão de ajuda', () => {
    render(<Sidebar />)
    
    const helpButton = screen.getByText('Ajuda').closest('button')
    expect(helpButton).toBeInTheDocument()
    expect(helpButton).toHaveClass('w-full')
  })
})
