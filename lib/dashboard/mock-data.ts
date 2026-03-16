/**
 * Mock data para desenvolvimento e testes do dashboard
 */

import {
  FunnelData,
  RecoveryData,
  ChannelsData,
  LossReasonsData,
  RevenueData,
  HealthScoreData,
  KpisData,
} from '@/types/dashboard';

/**
 * Dados mockados do funil de vendas
 */
export const mockFunnelData: FunnelData = {
  stages: [
    {
      id: '1',
      name: 'Novo Lead',
      count: 1250,
      percentage: 100,
      conversionRate: 100,
      color: '#3B82F6', // blue-500
      trend: 'up',
      trendValue: 12,
    },
    {
      id: '2',
      name: 'Qualificado',
      count: 875,
      percentage: 70,
      conversionRate: 70,
      color: '#8B5CF6', // violet-500
      trend: 'up',
      trendValue: 8,
    },
    {
      id: '3',
      name: 'Proposta Enviada',
      count: 420,
      percentage: 48,
      conversionRate: 33.6,
      color: '#F59E0B', // amber-500
      trend: 'neutral',
      trendValue: 0,
    },
    {
      id: '4',
      name: 'Negociação',
      count: 210,
      percentage: 50,
      conversionRate: 16.8,
      color: '#EF4444', // red-500
      trend: 'down',
      trendValue: 5,
    },
    {
      id: '5',
      name: 'Fechado',
      count: 125,
      percentage: 59.5,
      conversionRate: 10,
      color: '#10B981', // emerald-500
      trend: 'up',
      trendValue: 15,
    },
  ],
  totalLeads: 1250,
  totalConversions: 125,
  globalConversionRate: 10,
  period: 'Últimos 30 dias',
};

/**
 * Dados mockados de recuperação de leads perdidos
 */
export const mockRecoveryData: RecoveryData = {
  leads: [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@empresa.com',
      phone: '(11) 98765-4321',
      lostStage: 'Negociação',
      lostDate: '2024-03-10',
      potentialValue: 15000,
      recoveryProbability: 75,
      lastContactDate: '2024-03-12',
      reason: 'Preço',
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@empresa.com',
      phone: '(11) 91234-5678',
      lostStage: 'Proposta',
      lostDate: '2024-03-08',
      potentialValue: 25000,
      recoveryProbability: 60,
      lastContactDate: '2024-03-11',
      reason: 'Timing',
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro.costa@empresa.com',
      phone: '(11) 95555-9999',
      lostStage: 'Negociação',
      lostDate: '2024-03-05',
      potentialValue: 8000,
      recoveryProbability: 45,
      lastContactDate: '2024-03-10',
      reason: 'Concorrência',
    },
    {
      id: '4',
      name: 'Ana Oliveira',
      email: 'ana@empresa.com',
      phone: '(11) 97777-8888',
      lostStage: 'Qualificação',
      lostDate: '2024-03-01',
      potentialValue: 32000,
      recoveryProbability: 85,
      lastContactDate: '2024-03-13',
      reason: 'Orçamento',
    },
  ],
  totalCount: 42,
  totalPotentialValue: 850000,
  avgRecoveryProbability: 58,
  period: 'Últimos 30 dias',
};

/**
 * Dados mockados de performance por canal
 */
export const mockChannelsData: ChannelsData = {
  channels: [
    {
      channel: 'whatsapp',
      leadsGenerated: 450,
      conversions: 68,
      conversionRate: 15.1,
      revenue: 425000,
      avgResponseTime: 12,
      trend: 'up',
      trendValue: 23,
      color: '#25D366',
    },
    {
      channel: 'instagram',
      leadsGenerated: 320,
      conversions: 32,
      conversionRate: 10,
      revenue: 280000,
      avgResponseTime: 45,
      trend: 'up',
      trendValue: 15,
      color: '#E4405F',
    },
    {
      channel: 'email',
      leadsGenerated: 280,
      conversions: 18,
      conversionRate: 6.4,
      revenue: 195000,
      avgResponseTime: 180,
      trend: 'down',
      trendValue: 8,
      color: '#EA4335',
    },
    {
      channel: 'phone',
      leadsGenerated: 150,
      conversions: 7,
      conversionRate: 4.7,
      revenue: 85000,
      avgResponseTime: 5,
      trend: 'neutral',
      trendValue: 0,
      color: '#3B82F6',
    },
    {
      channel: 'website',
      leadsGenerated: 50,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      avgResponseTime: 0,
      trend: 'neutral',
      trendValue: 0,
      color: '#6B7280',
    },
  ],
  topChannel: 'whatsapp',
  totalLeads: 1250,
  totalRevenue: 985000,
  period: 'Últimos 30 dias',
};

/**
 * Dados mockados de motivos de perda
 */
export const mockLossReasonsData: LossReasonsData = {
  reasons: [
    {
      id: '1',
      reason: 'Preço alto',
      count: 45,
      percentage: 32,
      estimatedRevenueLost: 675000,
      trend: 'down',
      color: '#EF4444',
    },
    {
      id: '2',
      reason: 'Sem orçamento',
      count: 32,
      percentage: 23,
      estimatedRevenueLost: 480000,
      trend: 'neutral',
      color: '#F59E0B',
    },
    {
      id: '3',
      reason: 'Concorrência',
      count: 28,
      percentage: 20,
      estimatedRevenueLost: 420000,
      trend: 'up',
      color: '#8B5CF6',
    },
    {
      id: '4',
      reason: 'Timing',
      count: 20,
      percentage: 14,
      estimatedRevenueLost: 300000,
      trend: 'down',
      color: '#3B82F6',
    },
    {
      id: '5',
      reason: 'Não responde',
      count: 15,
      percentage: 11,
      estimatedRevenueLost: 225000,
      trend: 'up',
      color: '#6B7280',
    },
  ],
  totalLost: 140,
  totalRevenueLost: 2100000,
  topReason: 'Preço alto',
  period: 'Últimos 30 dias',
};

/**
 * Dados mockados de receita semanal (8 semanas)
 */
export const mockRevenueData: RevenueData = {
  weeks: [
    { week: 'S1', weekNumber: 1, startDate: '2024-01-01', endDate: '2024-01-07', revenue: 125000, target: 120000, dealsClosed: 12 },
    { week: 'S2', weekNumber: 2, startDate: '2024-01-08', endDate: '2024-01-14', revenue: 135000, target: 130000, dealsClosed: 14 },
    { week: 'S3', weekNumber: 3, startDate: '2024-01-15', endDate: '2024-01-21', revenue: 110000, target: 130000, dealsClosed: 11 },
    { week: 'S4', weekNumber: 4, startDate: '2024-01-22', endDate: '2024-01-28', revenue: 158000, target: 140000, dealsClosed: 16 },
    { week: 'S5', weekNumber: 5, startDate: '2024-01-29', endDate: '2024-02-04', revenue: 172000, target: 150000, dealsClosed: 18 },
    { week: 'S6', weekNumber: 6, startDate: '2024-02-05', endDate: '2024-02-11', revenue: 165000, target: 150000, dealsClosed: 17 },
    { week: 'S7', weekNumber: 7, startDate: '2024-02-12', endDate: '2024-02-18', revenue: 189000, target: 160000, dealsClosed: 20 },
    { week: 'S8', weekNumber: 8, startDate: '2024-02-19', endDate: '2024-02-25', revenue: 195000, target: 170000, dealsClosed: 21 },
  ],
  totalRevenue: 1249000,
  totalTarget: 1150000,
  achievementRate: 108.6,
  avgDealValue: 12365,
  growthRate: 56,
  period: 'Últimas 8 semanas',
};

/**
 * Dados mockados de health score
 */
export const mockHealthScoreData: HealthScoreData = {
  overallScore: 78,
  previousScore: 72,
  rating: 'good',
  breakdown: [
    {
      category: 'Velocidade de Resposta',
      score: 85,
      weight: 25,
      description: 'Tempo médio de primeira resposta',
    },
    {
      category: 'Taxa de Conversão',
      score: 70,
      weight: 30,
      description: 'Leads convertidos em vendas',
    },
    {
      category: 'Follow-up',
      score: 80,
      weight: 20,
      description: 'Consistência de follow-ups',
    },
    {
      category: 'Qualificação',
      score: 75,
      weight: 25,
      description: 'Qualidade da qualificação de leads',
    },
  ],
  lastUpdated: '2024-03-13T10:00:00Z',
};

/**
 * Dados mockados dos KPIs
 */
export const mockKpisData: KpisData = {
  kpis: [
    {
      id: 'weekly-leads',
      label: 'Leads Semana',
      value: 312,
      previousValue: 280,
      change: 11.4,
      changeType: 'positive',
      format: 'number',
      trend: 'up',
    },
    {
      id: 'closed-revenue',
      label: 'Receita Fechada',
      value: 195000,
      previousValue: 172000,
      change: 13.4,
      changeType: 'positive',
      format: 'currency',
      trend: 'up',
    },
    {
      id: 'conversion-rate',
      label: 'Taxa Conversão',
      value: 10,
      previousValue: 8.5,
      change: 17.6,
      changeType: 'positive',
      format: 'percentage',
      trend: 'up',
    },
    {
      id: 'pipeline-value',
      label: 'Pipeline Valor',
      value: 2450000,
      previousValue: 2300000,
      change: 6.5,
      changeType: 'positive',
      format: 'currency',
      trend: 'up',
    },
    {
      id: 'avg-conversion-time',
      label: 'Tempo Médio',
      value: 4.5,
      previousValue: 5.2,
      change: 13.5,
      changeType: 'positive', // Menos dias = positivo
      format: 'duration',
      suffix: ' dias',
      trend: 'down',
    },
  ],
  lastUpdated: '2024-03-13T10:00:00Z',
};
