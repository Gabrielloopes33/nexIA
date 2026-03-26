import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { ContactPanelProvider } from '@/lib/contexts/contact-panel-context'
import { OrganizationProviderWrapper } from '@/components/providers/organization-provider-wrapper'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-figtree',
  display: 'swap',
})

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
    <html lang="pt-BR" className={figtree.variable}>
      <body className={`${figtree.className} antialiased`}>
        <QueryProvider>
          <OrganizationProviderWrapper>
            <ContactPanelProvider>
              {children}
            </ContactPanelProvider>
          </OrganizationProviderWrapper>
        </QueryProvider>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
