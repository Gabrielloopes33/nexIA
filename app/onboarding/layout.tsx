import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AuroraBackground } from '@/components/onboarding/aurora-background'

export const metadata: Metadata = {
  title: 'NexIA Chat - Onboarding',
  description: 'Complete o setup da sua organização no NexIA Chat',
  icons: {
    icon: '/images/nexia-logo.png',
    shortcut: '/images/nexia-logo.png',
    apple: '/images/nexia-logo.png',
  },
}

/**
 * Layout de Onboarding
 * 
 * Layout sem sidebar para as páginas de onboarding.
 * Usa AuroraBackground como wrapper com header simples.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuroraBackground>
      {/* Header com Logo */}
      <header className="w-full py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/images/nexia-logo.png"
              alt="NexIA"
              width={32}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <span className="text-xl font-bold text-gray-900">NexIA</span>
          </Link>
        </div>
      </header>

      {/* Área central para conteúdo */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Footer opcional com links */}
      <footer className="w-full py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700 transition-colors">
            Início
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/configuracoes" className="hover:text-gray-700 transition-colors">
            Configurações
          </Link>
          <span className="text-gray-300">|</span>
          <span>© {new Date().getFullYear()} NexIA Chat</span>
        </div>
      </footer>
    </AuroraBackground>
  )
}
