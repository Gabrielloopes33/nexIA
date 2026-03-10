'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
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

// Toggle entre Login e Sign Up
type AuthMode = 'login' | 'signup'

function AuthCard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from')
  const from = fromParam && fromParam !== '/' ? fromParam : '/dashboard'
  
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // Google OAuth desabilitado - adicionar quando tiver credenciais configuradas no Supabase

  // Função para traduzir erros do Supabase
  function getErrorMessage(error: any): string {
    const message = error?.message || error?.error_description || ''
    
    // Mapeamento de erros comuns do Supabase
    if (message.includes('User already registered')) {
      return 'Este email já está cadastrado. Tente fazer login.'
    }
    if (message.includes('Password should be at least 6 characters')) {
      return 'A senha deve ter pelo menos 6 caracteres'
    }
    if (message.includes('Unable to validate email address')) {
      return 'Email inválido. Verifique o formato do email.'
    }
    if (message.includes('Invalid login credentials')) {
      return 'Email ou senha incorretos'
    }
    if (message.includes('Email not confirmed')) {
      return 'Email não confirmado. Verifique sua caixa de entrada.'
    }
    if (message.includes('rate limit') || error?.status === 429 || error?.statusCode === 429) {
      return 'Limite de tentativas atingido. Tente usar outro email ou aguarde algumas horas. Se persistir, contate o suporte.'
    }
    
    // Log para debug
    console.error('Supabase auth error:', error)
    return `Erro: ${message || 'Erro ao processar solicitação. Tente novamente.'}`
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

    const supabase = createClient()

    if (mode === 'signup') {
      // Criar conta
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        setError(getErrorMessage(error))
        setLoading(false)
        return
      }

      // Se o signup retornou user mas não session, pode precisar de confirmação de email
      if (data.user && !data.session) {
        setError('Conta criada! Verifique seu email para confirmar o cadastro.')
        setMode('login')
        setLoading(false)
        return
      }

      // Login automático após signup (se não precisar de confirmação)
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        setError('Conta criada! Faça login para continuar.')
        setMode('login')
        setLoading(false)
        return
      }

      router.push(from)
      router.refresh()
    } else {
      // Login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(getErrorMessage(error))
        setLoading(false)
        return
      }

      router.push(from)
      router.refresh()
    }
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
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
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === 'login' 
                ? 'Entre com sua conta para continuar' 
                : 'Preencha seus dados para começar'}
            </p>
          </div>

          {/* TODO: Adicionar botão Google quando OAuth estiver configurado no Supabase */}

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
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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

            {/* Esqueceu a senha (só no login) */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <Link
                  href="/recuperar-senha"
                  className="text-xs font-medium text-[#8B7DB8] hover:text-[#46347F] transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            )}

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
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-[#8B7DB8] hover:text-[#46347F] transition-colors"
              >
                {mode === 'login' ? 'Criar conta' : 'Fazer login'}
              </button>
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
function LoginLoading() {
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

export default function LoginPage() {
  return (
    <AuroraBackground>
      <Suspense fallback={<LoginLoading />}>
        <AuthCard />
      </Suspense>
    </AuroraBackground>
  )
}
