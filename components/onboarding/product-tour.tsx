'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { CallBackProps, STATUS, Step } from 'react-joyride'

// Dynamic import to avoid SSR issues
const Joyride = dynamic(() => import('react-joyride').then((mod) => mod.default), {
  ssr: false,
  loading: () => null,
})

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: 'Bem-vindo ao NexIA! 👋',
    content: 'Vamos fazer um tour rápido para você conhecer tudo que está disponível aqui.',
  },
  {
    target: '[data-tour="conversas"]',
    placement: 'right',
    disableBeacon: true,
    title: 'Conversas',
    content: 'Aqui ficam todas as suas mensagens — WhatsApp, Instagram e chat. Atenda e gerencie tudo em um só lugar.',
  },
  {
    target: '[data-tour="contatos"]',
    placement: 'right',
    disableBeacon: true,
    title: 'Contatos',
    content: 'Sua base de clientes e leads. Importe, segmente, adicione tags e acompanhe o histórico de cada contato.',
  },
  {
    target: '[data-tour="pipeline"]',
    placement: 'right',
    disableBeacon: true,
    title: 'Pipeline',
    content: 'Acompanhe o progresso dos seus negócios por etapas. Arraste os cards conforme avança nas conversas.',
  },
  {
    target: '[data-tour="agendamentos"]',
    placement: 'right',
    disableBeacon: true,
    title: 'Agendamentos',
    content: 'Organize reuniões, calls e tarefas — tudo com histórico e fila de atendimento.',
  },
  {
    target: '[data-tour="relatorios"]',
    placement: 'right',
    disableBeacon: true,
    title: 'Relatórios',
    content: 'Veja a performance do seu time: tempo de resposta, conversões, canais mais usados e muito mais.',
  },
  {
    target: '[data-tour="integracoes"]',
    placement: 'right',
    disableBeacon: true,
    title: 'Integrações',
    content: 'Conecte o WhatsApp, Instagram, Calendly e outros canais aqui.',
  },
  {
    target: '[data-tour="configuracoes"]',
    placement: 'right',
    disableBeacon: true,
    title: 'Configurações',
    content: 'Gerencie usuários, dados da empresa e assinaturas.',
  },
  {
    target: '[data-tour="dashboard-kpis"]',
    placement: 'right',
    disableBeacon: true,
    title: 'Indicadores',
    content: 'Receita em aberto, receita fechada, taxa de conversão e novos leads — tudo em tempo real.',
  },
  {
    target: '[data-tour="dashboard-cards"]',
    placement: 'top',
    disableBeacon: true,
    title: 'Gráficos do dashboard',
    content: 'Funil por etapa, performance por canal, motivos de perda e saúde geral do seu funil.',
  },
  {
    target: '[data-tour="novo-lead"]',
    placement: 'bottom',
    disableBeacon: true,
    title: 'Novo Lead',
    content: 'Crie um lead rapidamente por aqui, sem precisar abrir o pipeline.',
  },
  {
    target: '[data-tour="dashboard-filters"]',
    placement: 'bottom',
    disableBeacon: true,
    title: 'Filtros',
    content: 'Filtre os dados do dashboard por período ou por membro da equipe.',
  },
]

async function markTourComplete() {
  await fetch('/api/user/tour-complete', { method: 'PATCH' })
}

export function ProductTour() {
  const [run, setRun] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.onboardingTourCompleted === false) {
          setRun(true)
        }
      })
      .catch(() => {})
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) return null

  const handleCallback = useCallback((data: CallBackProps) => {
    const { status } = data
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false)
      markTourComplete()
    }
  }, [])

  if (!run) return null

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      callback={handleCallback}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular tour',
      }}
      styles={{
        options: {
          primaryColor: '#46347F',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          fontSize: 14,
        },
        tooltipTitle: {
          fontSize: 15,
          fontWeight: 600,
          color: '#46347F',
        },
        buttonNext: {
          backgroundColor: '#46347F',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
        },
        buttonBack: {
          color: '#46347F',
          fontSize: 13,
        },
        buttonSkip: {
          color: '#888',
          fontSize: 13,
        },
        spotlight: {
          borderRadius: 8,
        },
      }}
    />
  )
}
