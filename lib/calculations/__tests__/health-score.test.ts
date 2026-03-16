import { describe, it, expect } from 'vitest'
import { calculateHealthScore } from '../health-score'

describe('calculateHealthScore', () => {
  // Helper para criar dados do funil
  const createFunnelData = (avgConversionTime: number) => ({
    stages: [],
    totalLeads: 100,
    totalValue: 50000,
    avgConversionTime,
  })

  describe('Status SAUDÁVEL', () => {
    it('should return SAUDÁVEL for high scores with excellent metrics', () => {
      const result = calculateHealthScore(
        createFunnelData(48),  // Tempo ideal
        25,   // Taxa de conversão acima da meta (20%)
        5,    // 5 leads estagnados (5%)
        90,   // 90 atividades (alto follow-up)
        100
      )
      
      expect(result.totalScore).toBeGreaterThanOrEqual(85)
      expect(result.status).toBe('SAUDÁVEL')
    })

    it('should return SAUDÁVEL with perfect conversion rate', () => {
      const result = calculateHealthScore(
        createFunnelData(60),
        30,   // 30% conversão (muito acima da meta)
        8,    // 8% estagnados
        85,
        100
      )
      
      expect(result.totalScore).toBeGreaterThanOrEqual(85)
      expect(result.status).toBe('SAUDÁVEL')
    })
  })

  describe('Status CRÍTICO', () => {
    it('should return CRÍTICO for very low scores', () => {
      const result = calculateHealthScore(
        createFunnelData(200), // Muito lento
        10,  // Conversão muito baixa
        40,  // 40% estagnados
        30,  // Poucas atividades
        100
      )
      
      expect(result.totalScore).toBeLessThan(40)
      expect(result.status).toBe('CRÍTICO')
    })

    it('should return CRÍTICO with extreme funnel velocity issues', () => {
      const result = calculateHealthScore(
        createFunnelData(300), // Extremamente lento
        15,
        50,
        20,
        100
      )
      
      expect(result.totalScore).toBeLessThan(40)
      expect(result.status).toBe('CRÍTICO')
    })
  })

  describe('Status ATENÇÃO', () => {
    it('should return ATENÇÃO for medium-low scores', () => {
      const result = calculateHealthScore(
        createFunnelData(130), // Lento
        16,  // Abaixo da meta
        20,  // 20% estagnados
        60,
        100
      )
      
      expect(result.totalScore).toBeGreaterThanOrEqual(40)
      expect(result.totalScore).toBeLessThan(60)
      expect(result.status).toBe('ATENÇÃO')
    })
  })

  describe('Status OK', () => {
    it('should return OK for medium scores', () => {
      const result = calculateHealthScore(
        createFunnelData(90),  // Um pouco lento
        18,  // Próximo da meta
        15,  // 15% estagnados (atenção)
        75,
        100
      )
      
      expect(result.totalScore).toBeGreaterThanOrEqual(60)
      expect(result.totalScore).toBeLessThan(85)
      expect(result.status).toBe('OK')
    })
  })

  describe('Conversion Factor', () => {
    it('should calculate conversion factor correctly for ACIMA status', () => {
      const result = calculateHealthScore(
        createFunnelData(60),
        25,  // Acima da meta de 20%
        10,
        80,
        100
      )
      
      expect(result.factors.conversionVsGoal.status).toBe('ACIMA')
      expect(result.factors.conversionVsGoal.actualRate).toBe(25)
      expect(result.factors.conversionVsGoal.targetRate).toBe(20)
    })

    it('should calculate conversion factor correctly for NA_META status', () => {
      const result = calculateHealthScore(
        createFunnelData(60),
        18,  // 90% da meta (16-20%)
        10,
        80,
        100
      )
      
      expect(result.factors.conversionVsGoal.status).toBe('NA_META')
    })

    it('should calculate conversion factor correctly for ABAIXO status', () => {
      const result = calculateHealthScore(
        createFunnelData(60),
        10,  // Bem abaixo da meta
        10,
        80,
        100
      )
      
      expect(result.factors.conversionVsGoal.status).toBe('ABAIXO')
    })
  })

  describe('Funnel Velocity Factor', () => {
    it('should return OK for ideal velocity (<= 72h)', () => {
      const result = calculateHealthScore(
        createFunnelData(60),
        20,
        10,
        80,
        100
      )
      
      expect(result.factors.funnelVelocity.status).toBe('OK')
      expect(result.factors.funnelVelocity.avgHours).toBe(60)
    })

    it('should return LENTO for velocity between 72h and 120h', () => {
      const result = calculateHealthScore(
        createFunnelData(100),
        20,
        10,
        80,
        100
      )
      
      expect(result.factors.funnelVelocity.status).toBe('LENTO')
    })

    it('should return CRÍTICO for velocity > 120h', () => {
      const result = calculateHealthScore(
        createFunnelData(150),
        20,
        10,
        80,
        100
      )
      
      expect(result.factors.funnelVelocity.status).toBe('CRÍTICO')
    })
  })

  describe('Stagnant Leads Factor', () => {
    it('should return OK for <= 10% stagnant leads', () => {
      const result = calculateHealthScore(
        createFunnelData(60),
        20,
        5,   // 5% estagnados
        80,
        100
      )
      
      expect(result.factors.stagnantLeads.status).toBe('OK')
      expect(result.factors.stagnantLeads.count).toBe(5)
      expect(result.factors.stagnantLeads.totalLeads).toBe(100)
    })

    it('should return ATENÇÃO for 10-25% stagnant leads', () => {
      const result = calculateHealthScore(
        createFunnelData(60),
        20,
        20,  // 20% estagnados
        80,
        100
      )
      
      expect(result.factors.stagnantLeads.status).toBe('ATENÇÃO')
    })

    it('should return CRÍTICO for > 25% stagnant leads', () => {
      const result = calculateHealthScore(
        createFunnelData(60),
        20,
        30,  // 30% estagnados
        80,
        100
      )
      
      expect(result.factors.stagnantLeads.status).toBe('CRÍTICO')
    })
  })

  describe('Follow-up Rate Factor', () => {
    it('should calculate 100% follow-up rate correctly', () => {
      const result = calculateHealthScore(
        createFunnelData(60),
        20,
        10,
        80,  // 80 atividades para 100 leads (meta = 80)
        100
      )
      
      expect(result.factors.followUpRate.score).toBe(100)
      expect(result.factors.followUpRate.percentage).toBe(100)
    })

    it('should calculate partial follow-up rate correctly', () => {
      const result = calculateHealthScore(
        createFunnelData(60),
        20,
        10,
        40,  // 40 atividades para 100 leads (meta = 80)
        100
      )
      
      expect(result.factors.followUpRate.score).toBe(50)
      expect(result.factors.followUpRate.percentage).toBe(50)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero total leads', () => {
      const result = calculateHealthScore(
        createFunnelData(60),
        0,
        0,
        0,
        0
      )
      
      expect(result.factors.stagnantLeads.score).toBe(100)
      expect(result.factors.followUpRate.score).toBe(0)
    })

    it('should cap score at 100', () => {
      const result = calculateHealthScore(
        createFunnelData(48),  // Ideal
        50,  // Muito acima da meta
        0,   // Nenhum estagnado
        100, // Follow-up perfeito
        100
      )
      
      expect(result.factors.conversionVsGoal.score).toBe(100)
      expect(result.totalScore).toBeLessThanOrEqual(100)
    })

    it('should floor score at 0', () => {
      const result = calculateHealthScore(
        createFunnelData(500), // Extremamente lento
        0,
        100, // Todos estagnados
        0,
        100
      )
      
      expect(result.totalScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Weights', () => {
    it('should apply correct weights to factors', () => {
      const result = calculateHealthScore(
        createFunnelData(72),   // 80 pontos (velocity)
        20,                     // 70 pontos (conversion at target)
        10,                     // 80 pontos (stagnant at 10%)
        80,                     // 100 pontos (follow-up)
        100
      )
      
      // Expected: 70*0.3 + 80*0.25 + 80*0.25 + 100*0.2 = 21 + 20 + 20 + 20 = 81
      expect(result.totalScore).toBeGreaterThanOrEqual(75)
      expect(result.totalScore).toBeLessThanOrEqual(85)
    })
  })
})
