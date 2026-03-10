import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Calendar,
  Puzzle,
  Store,
  Settings,
  LucideIcon,
} from "lucide-react"

export interface SidebarNavChild {
  label: string
  href: string
  badge?: number
  section?: string
  disabled?: boolean
}

export interface SidebarNavItem {
  key: string
  label: string
  href?: string
  icon: LucideIcon
  children?: SidebarNavChild[]
}

export function isGroupActive(item: SidebarNavItem, pathname: string): boolean {
  if (!item.children || item.children.length === 0) return false
  return item.children.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))
}

export const topNavItems: SidebarNavItem[] = [
  {
    key: "overview",
    label: "Início",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    key: "contatos",
    label: "Contatos",
    icon: Users,
    children: [
      { label: "Todos", href: "/contatos", section: "Principal" },
      { label: "Listas", href: "/contatos/listas", section: "Principal" },
      { label: "Segmentos", href: "/contatos/segmentos", section: "Gerenciar" },
      { label: "Tags", href: "/contatos/tags", section: "Gerenciar" },
      { label: "Campos", href: "/contatos/campos", section: "Gerenciar" },
      { label: "Importar", href: "/contatos/importar", section: "Dados" },
      { label: "Exportar", href: "/contatos/exportar", section: "Dados" },
      { label: "Lixeira", href: "/contatos/lixeira", section: "Dados" },
      { label: "Tendências", href: "/contatos/relatorios/tendencias", section: "Relatórios" },
      { label: "Desempenho", href: "/contatos/relatorios/desempenho", section: "Relatórios" },
    ],
  },
  {
    key: "conversas",
    label: "Conversas",
    icon: MessageSquare,
    children: [
      { label: "Todas", href: "/conversas", section: "Principal" },
      { label: "Menções", href: "/conversas/mentions", section: "Principal" },
      { label: "Não Atendidas", href: "/conversas/unattended", section: "Principal" },
      { label: "Prioridade", href: "/conversas/folders/priority", section: "Pastas" },
      { label: "Leads", href: "/conversas/folders/leads", section: "Pastas" },
      { label: "Vendas", href: "/conversas/teams/sales", section: "Equipes" },
      { label: "Suporte", href: "/conversas/teams/support", section: "Equipes" },
      { label: "WhatsApp", href: "/conversas/channels/whatsapp", section: "Canais" },
      { label: "Instagram", href: "/conversas/channels/instagram", section: "Canais" },
      { label: "Chat Widget", href: "/conversas/channels/chat-widget", section: "Canais" },
    ],
  },
  {
    key: "pipeline",
    label: "Pipeline",
    href: "/pipeline",
    icon: BarChart3,
  },
  {
    key: "agendamentos",
    label: "Agendamentos",
    icon: Calendar,
    children: [
      { label: "Visão Geral", href: "/agendamentos", section: "Principal" },
      { label: "Concluídas", href: "/agendamentos/concluidas", section: "Principal", badge: 0 },
      { label: "Ligações", href: "/agendamentos/ligacoes", section: "Tipos" },
      { label: "Reuniões", href: "/agendamentos/reunioes", section: "Tipos" },
      { label: "Tarefas", href: "/agendamentos/tarefas", section: "Tipos" },
      { label: "Prazos", href: "/agendamentos/prazos", section: "Tipos" },
    ],
  },
  {
    key: "integracoes",
    label: "Integrações",
    icon: Puzzle,
    children: [
      { label: "WhatsApp Oficial", href: "/integracoes/whatsapp-oficial", section: "Canais" },
      { label: "WhatsApp Não Oficial", href: "/integracoes/whatsapp-nao-oficial", section: "Canais" },
      { label: "Instagram", href: "/integracoes/instagram", section: "Canais" },
      { label: "Compliance", href: "/integracoes/whatsapp-compliance", section: "Canais" },
      { label: "Config. WhatsApp", href: "/integracoes/whatsapp-settings", section: "Canais" },
      { label: "Webhooks", href: "/integracoes/webhooks", section: "Ações" },
      { label: "Logs", href: "/integracoes/logs", section: "Ações" },
      { label: "Sync", href: "/integracoes/sync", section: "Ações" },
      { label: "Filtros", href: "/integracoes/filters", section: "Ações" },
      { label: "Token", href: "/integracoes/auth", section: "Configurações" },
      { label: "Exportar", href: "/integracoes/export", section: "Configurações" },
    ],
  },
  {
    key: "configuracoes",
    label: "Configurações",
    icon: Settings,
    children: [
      // Conta
      { label: "Perfil", href: "/configuracoes/perfil", section: "Conta" },
      { label: "Empresa", href: "/configuracoes/empresa", section: "Conta" },
      { label: "Usuários", href: "/configuracoes/usuarios", section: "Conta" },
      // Assinaturas (antiga Cobranças)
      { label: "Visão Geral", href: "/configuracoes/assinaturas", section: "Assinaturas" },
      { label: "Assinaturas", href: "/configuracoes/assinaturas/assinaturas", section: "Assinaturas" },
      { label: "Faturas", href: "/configuracoes/assinaturas/faturas", section: "Assinaturas" },
      { label: "Clientes", href: "/configuracoes/assinaturas/clientes", section: "Assinaturas" },
      { label: "Métodos", href: "/configuracoes/assinaturas/pagamentos", section: "Assinaturas" },
      { label: "Histórico", href: "/configuracoes/assinaturas/historico", section: "Assinaturas" },
      { label: "Reembolsos", href: "/configuracoes/assinaturas/reembolsos", section: "Assinaturas" },
      { label: "Descontos", href: "/configuracoes/assinaturas/cupons", section: "Assinaturas" },
      { label: "Planos", href: "/configuracoes/assinaturas/planos", section: "Assinaturas" },
      { label: "Taxas", href: "/configuracoes/assinaturas/taxas", section: "Assinaturas" },
      { label: "Config", href: "/configuracoes/assinaturas/configuracoes", section: "Assinaturas" },
      // Comunicação
      { label: "Canais", href: "/configuracoes/canais", section: "Comunicação" },
      { label: "Notificações", href: "/configuracoes/notificacoes", section: "Comunicação" },
    ],
  },
]

export const bottomNavItems: SidebarNavItem[] = [
  {
    key: "loja",
    label: "Loja",
    href: "/loja",
    icon: Store,
  },
]

export const navItems: SidebarNavItem[] = [...topNavItems, ...bottomNavItems]
