# Tela de Login - Implementação Rápida

## Arquivos para Criar

```
app/login/page.tsx
lib/utils.ts
lib/supabase/client.ts
public/images/nexia-logo.png
```

## Código (copiar e colar)

**`app/login/page.tsx`**
```tsx
'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="absolute inset-0 z-0" style={{ background: `radial-gradient(ellipse 80% 60% at 70% 20%, rgba(175, 109, 255, 0.85), transparent 68%), radial-gradient(ellipse 70% 60% at 20% 80%, rgba(255, 100, 180, 0.75), transparent 68%), radial-gradient(ellipse 60% 50% at 60% 65%, rgba(255, 235, 170, 0.98), transparent 68%), radial-gradient(ellipse 65% 40% at 50% 60%, rgba(120, 190, 255, 0.3), transparent 68%), linear-gradient(180deg, #f7eaff 0%, #fde2ea 100%)` }} />
      <div className="absolute inset-0 z-0 bg-white/5 backdrop-blur-[1px]" />
      {children}
    </div>
  )
}

function AuthCard() {
  const router = useRouter(), searchParams = useSearchParams()
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false), [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const supabase = createClient()

  const translateError = (err: string) => ({ 'User already registered': 'Este email já está cadastrado', 'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres', 'Invalid login credentials': 'Email ou senha incorretos', 'Email not confirmed': 'Email não confirmado', 'rate limit': 'Limite de tentativas atingido' }[err] || err)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!email.includes('@')) return setError('Email inválido')
    if (password.length < 6) return setError('Senha deve ter pelo menos 6 caracteres')
    setLoading(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(translateError(error.message))
      else { router.push(searchParams.get('from') || '/dashboard'); router.refresh() }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setError(translateError(error.message))
      else if (!data.session) { setError('Conta criada! Verifique seu email.'); setMode('login') }
      else { router.push('/dashboard'); router.refresh() }
    }
    setLoading(false)
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/50">
          <div className="mb-8 flex flex-col items-center">
            <Image src="/images/nexia-logo.png" alt="NexIA" width={80} height={32} className="h-8 w-auto mb-4" priority />
            <h1 className="text-2xl font-bold text-gray-900">{mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}</h1>
            <p className="mt-1 text-sm text-gray-500">{mode === 'login' ? 'Entre com sua conta para continuar' : 'Preencha seus dados para começar'}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <div className="relative"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-sm outline-none focus:border-[#8B7DB8] focus:bg-white focus:ring-2 focus:ring-[#8B7DB8]/20" />
              </div>
            </div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Senha</label>
              <div className="relative"><Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-11 py-3 text-sm outline-none focus:border-[#8B7DB8] focus:bg-white focus:ring-2 focus:ring-[#8B7DB8]/20" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            {mode === 'login' && <div className="flex justify-end"><Link href="/recuperar-senha" className="text-xs font-medium text-[#8B7DB8] hover:text-[#46347F]">Esqueceu a senha?</Link></div>}
            {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}
            <button type="submit" disabled={loading} className={cn("group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all bg-gradient-to-r from-[#8B7DB8] to-[#46347F] hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed")}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === 'login' ? 'Entrar' : 'Criar conta'}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">{mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }} className="font-semibold text-[#8B7DB8] hover:text-[#46347F]">{mode === 'login' ? 'Criar conta' : 'Fazer login'}</button></p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-gray-500/80">© {new Date().getFullYear()} NexIA Chat. Todos os direitos reservados.</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <AuroraBackground><Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-12 w-12 border-3 border-[#8B7DB8] border-t-transparent rounded-full" /></div>}><AuthCard /></Suspense></AuroraBackground>
}
```

**`lib/utils.ts`**
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
```

**`lib/supabase/client.ts`**
```ts
import { createBrowserClient } from '@supabase/ssr'
export function createClient() { return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) }
```

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

## Checklist

- [ ] Copiar os 3 arquivos de código
- [ ] Configurar variáveis de ambiente
- [ ] Adicionar logo em `public/images/nexia-logo.png`
- [ ] Instalar dependências: `lucide-react`, `@supabase/ssr`, `clsx`, `tailwind-merge`
- [ ] Testar login e cadastro
