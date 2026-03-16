import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/lib/test/test-utils'
import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'

describe('DashboardCard', () => {
  it('deve renderizar children corretamente', () => {
    render(
      <DashboardCard title="Test Card">
        <div data-testid="card-content">Conteúdo do Card</div>
      </DashboardCard>
    )
    
    expect(screen.getByTestId('card-content')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo do Card')).toBeInTheDocument()
  })

  it('deve renderizar título corretamente', () => {
    render(
      <DashboardCard title="Meu Título">
        <div>Content</div>
      </DashboardCard>
    )
    
    expect(screen.getByText('Meu Título')).toBeInTheDocument()
  })

  it('deve renderizar descrição quando fornecida', () => {
    render(
      <DashboardCard 
        title="Título" 
        description="Esta é uma descrição"
      >
        <div>Content</div>
      </DashboardCard>
    )
    
    expect(screen.getByText('Esta é uma descrição')).toBeInTheDocument()
  })

  it('deve renderizar action no header quando fornecida', () => {
    render(
      <DashboardCard 
        title="Título"
        action={
          <Button size="icon" variant="ghost" data-testid="action-btn">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      >
        <div>Content</div>
      </DashboardCard>
    )
    
    expect(screen.getByTestId('action-btn')).toBeInTheDocument()
  })

  it('deve mostrar skeleton quando loading', () => {
    render(
      <DashboardCard title="Loading Card" loading={true}>
        <div>Content</div>
      </DashboardCard>
    )
    
    // Skeleton deve estar presente - verifica elementos com animate-pulse
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    
    // O conteúdo não deve estar visível
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('deve mostrar estado de erro quando error é fornecido', () => {
    const onRetry = vi.fn()
    const error = new Error('Falha ao carregar dados')
    
    render(
      <DashboardCard 
        title="Error Card" 
        error={error}
        onRetry={onRetry}
      >
        <div>Content</div>
      </DashboardCard>
    )
    
    expect(screen.getByText('Falha ao carregar dados')).toBeInTheDocument()
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })

  it('deve chamar onRetry quando botão de retry é clicado', () => {
    const onRetry = vi.fn()
    const error = new Error('Erro')
    
    render(
      <DashboardCard 
        title="Error Card" 
        error={error}
        onRetry={onRetry}
      >
        <div>Content</div>
      </DashboardCard>
    )
    
    fireEvent.click(screen.getByText('Tentar novamente'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('deve mostrar estado vazio quando empty é true', () => {
    render(
      <DashboardCard 
        title="Empty Card" 
        empty={true}
        emptyMessage="Nenhum dado encontrado"
      >
        <div>Content</div>
      </DashboardCard>
    )
    
    expect(screen.getByText('Nenhum dado encontrado')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('deve mostrar mensagem padrão de vazio quando emptyMessage não é fornecida', () => {
    render(
      <DashboardCard 
        title="Empty Card" 
        empty={true}
      >
        <div>Content</div>
      </DashboardCard>
    )
    
    expect(screen.getByText('Nenhum dado disponível')).toBeInTheDocument()
  })

  it('deve aplicar minHeight quando fornecido', () => {
    const { container } = render(
      <DashboardCard 
        title="Card" 
        minHeight={300}
        loading={true}
      >
        <div>Content</div>
      </DashboardCard>
    )
    
    const card = container.querySelector('[style*="min-height"]')
    expect(card).toHaveStyle({ minHeight: '300px' })
  })

  it('deve aplicar minHeight como string quando fornecido', () => {
    const { container } = render(
      <DashboardCard 
        title="Card" 
        minHeight="400px"
        loading={true}
      >
        <div>Content</div>
      </DashboardCard>
    )
    
    const card = container.querySelector('[style*="min-height"]')
    expect(card).toHaveStyle({ minHeight: '400px' })
  })

  it('deve aplicar classes adicionais via className', () => {
    const { container } = render(
      <DashboardCard title="Card" className="custom-card-class">
        <div>Content</div>
      </DashboardCard>
    )
    
    expect(container.firstChild).toHaveClass('custom-card-class')
  })

  it('deve renderizar estado de erro com título mesmo quando loading falhou', () => {
    const error = new Error('Erro crítico')
    
    render(
      <DashboardCard 
        title="Métricas Importantes" 
        error={error}
      >
        <div>Content</div>
      </DashboardCard>
    )
    
    expect(screen.getByText('Métricas Importantes')).toBeInTheDocument()
    expect(screen.getByText('Erro crítico')).toBeInTheDocument()
  })

  it('não deve mostrar botão de retry quando onRetry não é fornecido', () => {
    const error = new Error('Erro')
    
    render(
      <DashboardCard 
        title="Error Card" 
        error={error}
      >
        <div>Content</div>
      </DashboardCard>
    )
    
    expect(screen.queryByText('Tentar novamente')).not.toBeInTheDocument()
  })
})
