'use client'

import { Construction, ArrowLeft, Store } from 'lucide-react'
import Link from 'next/link'

export default function LojaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="w-20 h-20 bg-[#46347F]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Construction className="h-10 w-10 text-[#46347F]" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Loja em Breve
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-6">
            Estamos preparando algo especial para você. 
            A loja de integrações e apps estará disponível em breve!
          </p>

          {/* Features Preview */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Store className="h-4 w-4" />
              O que está por vir:
            </h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#46347F] rounded-full" />
                Integrações premium
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#46347F] rounded-full" />
                Templates de automação
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#46347F] rounded-full" />
                Apps exclusivos
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#46347F] rounded-full" />
                Relatórios avançados
              </li>
            </ul>
          </div>

          {/* Back Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#8B7DB8] to-[#46347F] text-white font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Dashboard
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500/80">
          © {new Date().getFullYear()} NexIA Chat. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
