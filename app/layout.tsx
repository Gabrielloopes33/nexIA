import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { ContactPanelProvider } from "@/lib/contexts/contact-panel-context";
import { OrganizationProviderWrapper } from "@/components/providers/organization-provider-wrapper";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NexIA Chat — CRM Omnichannel com IA Nativa",
  description:
    "Centralize WhatsApp, Instagram e Messenger em um único fluxo inteligente. Deixe nossa IA qualificar seus leads enquanto você foca em fechar vendas.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`dark ${jakarta.variable} ${inter.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
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
  );
}
