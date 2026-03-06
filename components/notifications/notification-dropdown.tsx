"use client"

import { useState, useMemo } from "react"
import { Bell, Check, CheckCheck } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Notification {
  id: string
  type: 'lead' | 'system' | 'warning' | 'success'
  title: string
  message: string
  timestamp: string
  read: boolean
  link?: string
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "lead",
    title: "Novo lead recebido",
    message: "Carlos Eduardo entrou em contato via Instagram",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    link: "/contatos"
  },
  {
    id: "2",
    type: "success",
    title: "Meta de vendas atingida!",
    message: "Você atingiu 110% da meta deste mês",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "3",
    type: "warning",
    title: "Lead quente sem resposta",
    message: "Ana Maria (Score: 85) está aguardando há 4 horas",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: false,
    link: "/conversas"
  },
  {
    id: "4",
    type: "system",
    title: "Backup completado",
    message: "Backup automático realizado com sucesso",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: "5",
    type: "lead",
    title: "Novo comentário",
    message: "João Silva comentou no lead 'Maria Santos'",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
  },
]

const TYPE_COLORS = {
  lead: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  system: "bg-slate-500",
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "há menos de 1 min"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} min`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `há ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) {
    return "há 1 dia"
  }
  return `há ${diffInDays} dias`
}

function getDayGroup(timestamp: string): "Hoje" | "Ontem" | "Anteriores" {
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (notificationDate.getTime() === today.getTime()) {
    return "Hoje"
  }
  if (notificationDate.getTime() === yesterday.getTime()) {
    return "Ontem"
  }
  return "Anteriores"
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const content = (
    <div
      className={cn(
        "flex gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50",
        !notification.read && "bg-muted/30"
      )}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className={cn("w-2 h-2 mt-2 rounded-full shrink-0", TYPE_COLORS[notification.type])} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium", !notification.read && "font-semibold")}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>
    </div>
  )

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)
  const [open, setOpen] = useState(false)

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      Hoje: [],
      Ontem: [],
      Anteriores: [],
    }

    notifications.forEach((notification) => {
      const group = getDayGroup(notification.timestamp)
      groups[group].push(notification)
    })

    return groups
  }, [notifications])

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const hasNotifications = notifications.length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {hasNotifications ? (
          <ScrollArea className="h-[300px]">
            {groupedNotifications.Hoje.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-muted/50">
                  <span className="text-xs font-medium text-muted-foreground">Hoje</span>
                </div>
                {groupedNotifications.Hoje.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}

            {groupedNotifications.Ontem.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-muted/50">
                  <span className="text-xs font-medium text-muted-foreground">Ontem</span>
                </div>
                {groupedNotifications.Ontem.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}

            {groupedNotifications.Anteriores.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-muted/50">
                  <span className="text-xs font-medium text-muted-foreground">Anteriores</span>
                </div>
                {groupedNotifications.Anteriores.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        ) : (
          <div className="py-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
          </div>
        )}

        <div className="p-2 border-t">
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <Link href="/notificacoes">Ver todas</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
