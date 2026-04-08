'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Background Aurora Component
function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Aurora Dream Vivid Bloom */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 70% 20%, rgba(175, 109, 255, 0.85), transparent 68%),
            radial-gradient(ellipse 70% 60% at 20% 80%, rgba(255, 100, 180, 0.75), transparent 68%),
            radial-gradient(ellipse 60% 50% at 60% 65%, rgba(255, 235, 170, 0.98), transparent 68%),
            radial-gradient(ellipse 65% 40% at 50% 60%, rgba(120, 190, 255, 0.3), transparent 68%),
            linear-gradient(180deg, #f7eaff 0%, #fde2ea 100%)
          `,
        }}
      />
      {/* Overlay sutil para melhorar contraste */}
      <div className="absolute inset-0 z-0 bg-white/5 backdrop-blur-[1px]" />
      {children}
    </div>
  )
}

function CadastroCRMForm() {
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function getErrorMessage(error: any, status?: number): string {
    if (typeof error === 'string') return error
    if (!error || Object.keys(error).length === 0) {
      if (status === 409) return 'Este email já está cadastrado.'
      if (status === 500) return 'Erro no servidor. Tente novamente.'
      return 'Erro ao processar solicitação. Tente novamente.'
    }
    
    const message = error?.error || error?.message || ''
    if (message.includes('Email já cadastrado') || message.includes('already registered')) {
      return 'Este email já está cadastrado. Tente fazer login.'
    }
    return message || 'Erro ao processar solicitação. Tente novamente.'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validações básicas no frontend
    if (!email || !email.includes('@')) {
      setError('Por favor, insira um email válido')
      setLoading(false)
      return
    }

    if (!password || password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      // Cadastro via API de CRM (REGULAR)
      const response = await fetch('/api/auth/register/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: email.split('@')[0] }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(getErrorMessage(data, response.status))
        setLoading(false)
        return
      }

      // Redireciona para onboarding
      router.push('/onboarding/organizacao')
      router.refresh()
    } catch (error) {
      setError('Erro de conexão. Verifique sua internet.')
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Card Principal */}
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/50">
          
          {/* Header com Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 relative">
              <Image
                src="/images/nexia-logo.png"
                alt="NexIA"
                width={80}
                height={32}
                className="h-8 w-auto"
                style={{ width: 'auto', height: '32px' }}
                priority
              />
            </div>
            
            {/* Badge do plano */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#46347F]/10 text-[#46347F] text-xs font-medium mb-3">
              <Building2 className="w-3.5 h-3.5" />
              Plano CRM
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">
              Criar conta
            </h1>
            <p className="mt-1 text-sm text-gray-500 text-center">
              Gerencie seus contatos e vendas em um só lugar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#8B7DB8] focus:bg-white focus:ring-2 focus:ring-[#8B7DB8]/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-11 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#8B7DB8] focus:bg-white focus:ring-2 focus:ring-[#8B7DB8]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all",
                "bg-gradient-to-r from-[#8B7DB8] to-[#46347F]",
                "hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]",
                "focus:outline-none focus:ring-2 focus:ring-[#8B7DB8]/50",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Já tem uma conta?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#8B7DB8] hover:text-[#46347F] transition-colors"
              >
                Fazer login
              </Link>
            </p>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Ao criar uma conta, você terá acesso completo ao CRM NexIA para gerenciar seus contatos, pipeline de vendas e conversas.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500/80">
          © {new Date().getFullYear()} NexIA Chat. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}

// Loading State
function CadastroLoading() {
  return (
    <AuroraBackground>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
            <div className="flex flex-col items-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-3 border-[#8B7DB8] border-t-transparent" />
              <p className="mt-4 text-sm text-gray-500">Carregando...</p>
            </div>
          </div>
        </div>
      </div>
    </AuroraBackground>
  )
}

export default function CadastroCRMPage() {
  return (
    <AuroraBackground>
      <Suspense fallback={<CadastroLoading />}>
        <CadastroCRMForm />
      </Suspense>
    </AuroraBackground>
  )
}
