import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ContactPanelProvider } from '@/lib/contexts/contact-panel-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'NexIA Chat - Início',
  description: 'CRM Início - NexIA Chat',
  icons: {
    icon: '/images/nexia-logo.png',
    shortcut: '/images/nexia-logo.png',
    apple: '/images/nexia-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased" style={{ fontFamily: '"Britti Sans", -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
        <ContactPanelProvider>
          {children}
        </ContactPanelProvider>
        <Analytics />
      </body>
    </html>
  )
}
