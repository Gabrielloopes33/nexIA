import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SubSidebarProvider } from '@/lib/contexts/sidebar-context'
import { ContactPanelProvider } from '@/lib/contexts/contact-panel-context'
import './globals.css'

const manrope = Manrope({ 
  subsets: ["latin"], 
  variable: "--font-manrope",
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'NexIA Chat - Dashboard',
  description: 'CRM Dashboard - NexIA Chat',
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
      <body className={`${manrope.variable} font-sans antialiased`}>
        <SubSidebarProvider>
          <ContactPanelProvider>
            {children}
          </ContactPanelProvider>
        </SubSidebarProvider>
        <Analytics />
      </body>
    </html>
  )
}
