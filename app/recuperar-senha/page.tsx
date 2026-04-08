'use client'

import { useState } from 'react'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setSent(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao enviar email de recuperação')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7eaff] to-[#fde2ea] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Recuperar Senha</h1>
            <p className="mt-2 text-sm text-gray-600">
              {sent 
                ? 'Enviamos um link de recuperação para seu email.' 
                : 'Digite seu email para receber o link de recuperação.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:border-[#8B7DB8] focus:bg-white focus:ring-2 focus:ring-[#8B7DB8]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B7DB8] to-[#46347F] text-white font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-[#8B7DB8] hover:text-[#46347F] font-medium"
              >
                Enviar novamente
              </button>
            </div>
          )}

          {/* Voltar */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500/80">
          © {new Date().getFullYear()} NexIA Chat. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
