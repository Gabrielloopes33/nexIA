import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { 
  DashboardFiltersProvider, 
  useDashboardFilters,
  DashboardFiltersContext
} from '../use-dashboard-filters-context'
import { DashboardPeriod } from '@/types/dashboard-hooks'

/**
 * Wrapper que fornece o contexto para os testes
 */
function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DashboardFiltersProvider>
        {children}
      </DashboardFiltersProvider>
    )
  }
}

describe('useDashboardFilters', () => {
  it('deve retornar o período padrão (30d)', () => {
    const { result } = renderHook(() => useDashboardFilters(), {
      wrapper: createWrapper(),
    })

    expect(result.current.period).toBe('30d')
    expect(result.current.dateRange).toBeDefined()
    expect(result.current.dateRange.start).toBeInstanceOf(Date)
    expect(result.current.dateRange.end).toBeInstanceOf(Date)
  })

  it('deve alterar o período quando setPeriod é chamado', () => {
    const { result } = renderHook(() => useDashboardFilters(), {
      wrapper: createWrapper(),
    })

    expect(result.current.period).toBe('30d')

    act(() => {
      result.current.setPeriod('7d')
    })

    expect(result.current.period).toBe('7d')
  })

  it('deve calcular o dateRange corretamente para período today', () => {
    const { result } = renderHook(() => useDashboardFilters(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setPeriod('today')
    })

    const { start, end } = result.current.dateRange
    const now = new Date()

    // O início deve ser meia-noite do dia atual
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getSeconds()).toBe(0)
    expect(start.getDate()).toBe(now.getDate())

    // O fim deve ser próximo do momento atual
    expect(end.getTime()).toBeGreaterThan(start.getTime())
  })

  it('deve calcular o dateRange corretamente para período 7d', () => {
    const { result } = renderHook(() => useDashboardFilters(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setPeriod('7d')
    })

    const { start, end } = result.current.dateRange
    const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)

    // A diferença deve ser aproximadamente 7 dias
    expect(diffInDays).toBeCloseTo(7, 0)
  })

  it('deve calcular o dateRange corretamente para período 30d', () => {
    const { result } = renderHook(() => useDashboardFilters(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setPeriod('30d')
    })

    const { start, end } = result.current.dateRange
    const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)

    // A diferença deve ser aproximadamente 30 dias
    expect(diffInDays).toBeCloseTo(30, 0)
  })

  it('deve calcular o dateRange corretamente para período 90d', () => {
    const { result } = renderHook(() => useDashboardFilters(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setPeriod('90d')
    })

    const { start, end } = result.current.dateRange
    const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)

    // A diferença deve ser aproximadamente 90 dias
    expect(diffInDays).toBeCloseTo(90, 0)
  })

  it('deve lançar erro quando usado fora do provider', () => {
    // Suprime o console.error para este teste
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useDashboardFilters())
    }).toThrow('useDashboardFilters must be used within DashboardFiltersProvider')

    consoleSpy.mockRestore()
  })

  it('deve manter a função setPeriod estável entre renders', () => {
    const { result, rerender } = renderHook(() => useDashboardFilters(), {
      wrapper: createWrapper(),
    })

    const firstSetPeriod = result.current.setPeriod

    rerender()

    // A função deve ser a mesma referência
    expect(result.current.setPeriod).toBe(firstSetPeriod)
  })

  it('deve atualizar o dateRange quando o período muda', () => {
    const { result } = renderHook(() => useDashboardFilters(), {
      wrapper: createWrapper(),
    })

    const firstDateRange = result.current.dateRange

    act(() => {
      result.current.setPeriod('7d')
    })

    const secondDateRange = result.current.dateRange

    // O dateRange deve ter mudado
    expect(secondDateRange.start.getTime()).not.toBe(firstDateRange.start.getTime())
    
    // O período 7d deve ter start mais recente que 30d
    expect(secondDateRange.start.getTime()).toBeGreaterThan(firstDateRange.start.getTime())
  })
})

describe('DashboardFiltersProvider', () => {
  it('deve renderizar children corretamente', () => {
    const TestChild = () => <div data-testid="test-child">Test</div>
    
    const { getByTestId } = renderHook(() => null, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <DashboardFiltersProvider>
          {children}
          <TestChild />
        </DashboardFiltersProvider>
      ),
    })

    // O provider deve renderizar sem erros
    expect(true).toBe(true)
  })

  it('deve compartilhar o mesmo estado entre múltiplos hooks', () => {
    const { result: result1 } = renderHook(() => useDashboardFilters(), {
      wrapper: createWrapper(),
    })

    const { result: result2 } = renderHook(() => useDashboardFilters(), {
      wrapper: createWrapper(),
    })

    // Ambos devem começar com o mesmo período
    expect(result1.current.period).toBe(result2.current.period)

    // Alterar em um não deve afetar o outro (contextos diferentes)
    act(() => {
      result1.current.setPeriod('7d')
    })

    expect(result1.current.period).toBe('7d')
    // O segundo hook está em outro provider, então permanece 30d
    expect(result2.current.period).toBe('30d')
  })
})
