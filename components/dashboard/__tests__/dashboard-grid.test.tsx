import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test/test-utils'
import { DashboardGrid, DashboardRow } from '@/components/dashboard/dashboard-grid'

describe('DashboardGrid', () => {
  it('deve renderizar children corretamente', () => {
    render(
      <DashboardGrid>
        <div data-testid="content">Conteúdo Principal</div>
      </DashboardGrid>
    )
    
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo Principal')).toBeInTheDocument()
  })

  it('deve renderizar com layout de sidebar quando prop sidebar é fornecida', () => {
    render(
      <DashboardGrid sidebar={<div data-testid="sidebar">Sidebar</div>}>
        <div data-testid="main">Main Content</div>
      </DashboardGrid>
    )
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('main')).toBeInTheDocument()
  })

  it('deve aplicar classes de gap corretamente', () => {
    const { container } = render(
      <DashboardGrid gap={4}>
        <div>Content</div>
      </DashboardGrid>
    )
    
    expect(container.firstChild).toHaveClass('gap-4')
  })

  it('deve ter classe de grid', () => {
    const { container } = render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    )
    
    expect(container.firstChild).toHaveClass('grid')
  })

  it('deve aplicar classes adicionais via className', () => {
    const { container } = render(
      <DashboardGrid className="custom-class">
        <div>Content</div>
      </DashboardGrid>
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('deve renderizar sidebar dentro do aside', () => {
    const { container } = render(
      <DashboardGrid sidebar={<div data-testid="sidebar-content">KPIs</div>}>
        <div>Main</div>
      </DashboardGrid>
    )
    
    const aside = container.querySelector('aside')
    expect(aside).toBeInTheDocument()
    expect(aside).toContainElement(screen.getByTestId('sidebar-content'))
    expect(aside).toHaveClass('kpi-sidebar')
  })

  it('deve renderizar children dentro do main', () => {
    const { container } = render(
      <DashboardGrid>
        <div data-testid="main-content">Content</div>
      </DashboardGrid>
    )
    
    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
    expect(main).toContainElement(screen.getByTestId('main-content'))
    expect(main).toHaveClass('main-content')
  })

  it('deve ter classe de responsividade para sidebar', () => {
    const { container } = render(
      <DashboardGrid sidebar={<div>Sidebar</div>}>
        <div>Content</div>
      </DashboardGrid>
    )
    
    // Quando tem sidebar, aplica a classe de grid responsivo
    const className = (container.firstChild as HTMLElement).className
    expect(className).toContain('xl:grid-cols-')
  })
})

describe('DashboardRow', () => {
  it('deve renderizar children corretamente', () => {
    render(
      <DashboardRow>
        <div data-testid="item1">Item 1</div>
        <div data-testid="item2">Item 2</div>
      </DashboardRow>
    )
    
    expect(screen.getByTestId('item1')).toBeInTheDocument()
    expect(screen.getByTestId('item2')).toBeInTheDocument()
  })

  it('deve aplicar classes de colunas corretamente para 2 colunas', () => {
    const { container } = render(
      <DashboardRow columns={2}>
        <div>Item 1</div>
        <div>Item 2</div>
      </DashboardRow>
    )
    
    expect(container.firstChild).toHaveClass('md:grid-cols-2')
  })

  it('deve aplicar classes de colunas corretamente para 3 colunas', () => {
    const { container } = render(
      <DashboardRow columns={3}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </DashboardRow>
    )
    
    expect(container.firstChild).toHaveClass('lg:grid-cols-3')
  })

  it('deve aplicar classes de colunas corretamente para 4 colunas', () => {
    const { container } = render(
      <DashboardRow columns={4}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
        <div>Item 4</div>
      </DashboardRow>
    )
    
    expect(container.firstChild).toHaveClass('lg:grid-cols-4')
  })

  it('deve ter classe de grid', () => {
    const { container } = render(
      <DashboardRow>
        <div>Item</div>
      </DashboardRow>
    )
    
    expect(container.firstChild).toHaveClass('grid')
  })

  it('deve aplicar gap personalizado', () => {
    const { container } = render(
      <DashboardRow gap={4}>
        <div>Item</div>
      </DashboardRow>
    )
    
    expect(container.firstChild).toHaveClass('gap-4')
  })

  it('deve aplicar classes adicionais via className', () => {
    const { container } = render(
      <DashboardRow className="row-class">
        <div>Item</div>
      </DashboardRow>
    )
    
    expect(container.firstChild).toHaveClass('row-class')
  })
})
