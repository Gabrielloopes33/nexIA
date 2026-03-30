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
  Headphones,
  ListTodo,
  Phone,
} from "lucide-react"

export interface SidebarNavChild {
  label: string
  href: string
  badge?: number
  section?: string
  disabled?: boolean
  requiredRole?: 'OWNER' | 'ADMIN' | 'MANAGER'
}

// Type for custom icon component
export type CustomIconComponent = ({ className }: { className?: string }) => JSX.Element

export interface SidebarNavItem {
  key: string
  label: string
  href?: string
  icon: LucideIcon | CustomIconComponent
  children?: SidebarNavChild[]
  requiredRole?: 'OWNER' | 'ADMIN' | 'MANAGER'
}

export function isGroupActive(item: SidebarNavItem, pathname: string): boolean {
  if (!item.children || item.children.length === 0) return false
  return item.children.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))
}

// Ícone customizado da Meta (branco) - não é do Lucide
export const MetaIconComponent = ({ className = "h-4 w-4" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 6.016 4.432 10.984 10.206 11.852V15.18H7.237v-3.154h2.969v-2.418c0-2.919 1.741-4.539 4.418-4.539 1.279 0 2.617.228 2.617.228v2.868h-1.473c-1.452 0-1.904.899-1.904 1.822v2.039h3.241l-.518 3.154h-2.723v8.662C19.568 22.984 24 18.016 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

export const topNavItems: SidebarNavItem[] = [
  {
    key: "overview",
    label: "Início",
    href: "/dashboard",
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
    ],
  },
  {
    key: "conversas",
    label: "Conversas",
    href: "/conversas",
    icon: MessageSquare,
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
      { label: "Fila de Atendimento", href: "/agendamentos/fila", section: "Principal", badge: 0 },
      { label: "Histórico de Reuniões", href: "/agendamentos/reunioes", section: "Principal" },
      { label: "Concluídas", href: "/agendamentos/concluidas", section: "Principal" },
    ],
  },
  {
    key: "meta-api",
    label: "API Oficial Meta",
    icon: MetaIconComponent,
    children: [
      { label: "Visão Geral", href: "/meta-api", section: "Principal" },
      { label: "WhatsApp Business", href: "/meta-api/whatsapp", section: "APIs" },
      { label: "Instagram", href: "/meta-api/instagram", section: "APIs" },
      { label: "Conectar", href: "/meta-api/whatsapp/connect", section: "WhatsApp" },
      { label: "Templates", href: "/meta-api/whatsapp/templates", section: "WhatsApp" },
      { label: "Campanhas", href: "/campanhas", section: "WhatsApp" },
      { label: "Números", href: "/meta-api/whatsapp/numeros", section: "WhatsApp" },
      { label: "Analytics", href: "/meta-api/whatsapp/analytics", section: "WhatsApp" },
      { label: "Enviar Mensagens", href: "/meta-api/whatsapp/send", section: "WhatsApp" },
      { label: "Envio de Formulários", href: "/meta-api/whatsapp/form-submissions", section: "WhatsApp", badge: 0 },
      { label: "Webhooks", href: "/meta-api/whatsapp/webhooks", section: "WhatsApp" },
      { label: "Logs", href: "/meta-api/whatsapp/logs", section: "WhatsApp" },
      { label: "Compliance", href: "/meta-api/compliance", section: "Segurança" },
      { label: "Configurações", href: "/meta-api/configuracoes", section: "Gestão" },
    ],
  },
  {
    key: "integracoes",
    label: "Integrações",
    icon: Puzzle,
    children: [
      { label: "WhatsApp Não Oficial", href: "/integracoes/whatsapp-nao-oficial", section: "Canais" },
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
      { label: "Organizações", href: "/configuracoes/organizacoes", section: "Conta" },
      // Assinaturas - Apenas OWNER
      { label: "Visão Geral", href: "/configuracoes/assinaturas", section: "Assinaturas", requiredRole: "OWNER" },
      { label: "Assinaturas", href: "/configuracoes/assinaturas/assinaturas", section: "Assinaturas", requiredRole: "OWNER" },
      { label: "Faturas", href: "/configuracoes/assinaturas/faturas", section: "Assinaturas", requiredRole: "OWNER" },
      { label: "Clientes", href: "/configuracoes/assinaturas/clientes", section: "Assinaturas", requiredRole: "OWNER" },
      { label: "Métodos", href: "/configuracoes/assinaturas/pagamentos", section: "Assinaturas", requiredRole: "OWNER" },
      { label: "Histórico", href: "/configuracoes/assinaturas/historico", section: "Assinaturas", requiredRole: "OWNER" },
      { label: "Reembolsos", href: "/configuracoes/assinaturas/reembolsos", section: "Assinaturas", requiredRole: "OWNER" },
      { label: "Descontos", href: "/configuracoes/assinaturas/cupons", section: "Assinaturas", requiredRole: "OWNER" },
      { label: "Planos", href: "/configuracoes/assinaturas/planos", section: "Assinaturas", requiredRole: "OWNER" },
      { label: "Taxas", href: "/configuracoes/assinaturas/taxas", section: "Assinaturas", requiredRole: "OWNER" },
      { label: "Config", href: "/configuracoes/assinaturas/configuracoes", section: "Assinaturas", requiredRole: "OWNER" },
      // Seção Comunicação removida da configurações
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
