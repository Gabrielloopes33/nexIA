'use client'

import { motion } from 'framer-motion'
import { 
  CheckCircle2, 
  UserPlus, 
  MessageCircle, 
  BarChart3, 
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuickAction {
  icon: React.ReactNode
  label: string
  description: string
  href: string
  color: string
}

interface WelcomeScreenProps {
  organizationName: string
  onStart: () => void
}

export function WelcomeScreen({
  organizationName,
  onStart,
}: WelcomeScreenProps) {
  const quickActions: QuickAction[] = [
    {
      icon: <UserPlus className="size-5" />,
      label: 'Adicionar Contato',
      description: 'Cadastre seu primeiro cliente',
      href: '/contatos/novo',
      color: 'bg-blue-500',
    },
    {
      icon: <MessageCircle className="size-5" />,
      label: 'Configurar WhatsApp',
      description: 'Conecte seu número oficial',
      href: '/configuracoes/whatsapp',
      color: 'bg-green-500',
    },
    {
      icon: <BarChart3 className="size-5" />,
      label: 'Ver Pipeline',
      description: 'Gerencie suas oportunidades',
      href: '/pipeline',
      color: 'bg-purple-500',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Header de sucesso */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center size-20 rounded-full bg-green-100 mb-6"
        >
          <CheckCircle2 className="size-10 text-green-600" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="size-5 text-amber-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Bem-vindo ao NexIA!
            </h1>
            <Sparkles className="size-5 text-amber-500" />
          </div>
          <p className="text-lg text-gray-600">
            A organização <span className="font-semibold text-gray-900">{organizationName}</span> foi configurada com sucesso.
          </p>
        </motion.div>
      </div>

      {/* Próximos passos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          O que fazer agora?
        </h2>
        <p className="text-gray-600 mb-6">
          Escolha uma das opções abaixo para começar a usar o NexIA:
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action, index) => (
            <motion.a
              key={action.label}
              href={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="group relative p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-gray-50/50 hover:bg-white"
            >
              <div className={`inline-flex items-center justify-center size-10 rounded-lg ${action.color} text-white mb-3`}>
                {action.icon}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {action.label}
              </h3>
              <p className="text-xs text-gray-500">
                {action.description}
              </p>
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* Botão principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <Button
          onClick={onStart}
          size="lg"
          className="h-12 px-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Ir para o Dashboard
          <ArrowRight className="ml-2 size-5" />
        </Button>
        <p className="mt-4 text-sm text-gray-500">
          Você pode acessar essas opções a qualquer momento pelo menu lateral.
        </p>
      </motion.div>

      {/* Confetti effect placeholder */}
      <Confetti />
    </motion.div>
  )
}

// Simples efeito de confetes usando CSS
function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: ['#8B7DB8', '#46347F', '#A78BFA', '#10B981', '#F59E0B'][i % 5],
            left: `${Math.random() * 100}%`,
            top: -10,
          }}
          animate={{
            y: ['0vh', '100vh'],
            x: [`${Math.random() * 20 - 10}vw`, `${Math.random() * 40 - 20}vw`],
            rotate: [0, 360],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}
