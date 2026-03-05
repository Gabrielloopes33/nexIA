import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SubSidebarProvider } from '@/lib/contexts/sidebar-context'
import { ContactPanelProvider } from '@/lib/contexts/contact-panel-context'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  preload: true,
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
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif' }}>
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
