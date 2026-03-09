import { Sidebar } from "@/components/sidebar"
import { WhatsAppSubSidebar } from "@/components/whatsapp/whatsapp-sub-sidebar"

export default function WhatsAppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <WhatsAppSubSidebar />
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {children}
      </main>
    </div>
  )
}
