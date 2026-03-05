"use client"

import { Mail, Phone, Building2, MapPin, Eye, Edit, MoreVertical, Star } from "lucide-react"
import { Contact } from "@/lib/types/contact"
import { cn, getAvatarColor, formatPhoneNumber, formatRelativeDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ContactRowProps {
  contact: Contact
  selected: boolean
  onSelect: (id: number, selected: boolean) => void
  onToggleFavorite: (id: number) => void
  onView?: (id: number) => void
  onEdit?: (id: number) => void
}

export function ContactRow({
  contact,
  selected,
  onSelect,
  onToggleFavorite,
  onView,
  onEdit,
}: ContactRowProps) {
  const STATUS_CONFIG = {
    ativo: {
      label: "Ativo",
      variant: "default" as const,
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    },
    inativo: {
      label: "Inativo",
      variant: "secondary" as const,
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    },
    aguardando: {
      label: "Aguardando",
      variant: "outline" as const,
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    },
  }

  const statusConfig = STATUS_CONFIG[contact.status]

  return (
    <tr className="border-0 transition-colors hover:bg-secondary/50">
      {/* Checkbox */}
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(contact.id, e.target.checked)}
          className="h-4 w-4 rounded border-0 text-primary focus:ring-primary"
        />
      </td>

      {/* Contato (Avatar + Nome + Email/Telefone) */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Estrela/Favorito */}
          <button
            onClick={() => onToggleFavorite(contact.id)}
            className="text-muted-foreground transition-colors hover:text-amber-500"
          >
            <Star
              className={cn(
                "h-4 w-4",
                contact.favorito && "fill-amber-500 text-amber-500"
              )}
            />
          </button>

          {/* Avatar */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              getAvatarColor(contact.avatar)
            )}
          >
            {contact.avatar}
          </div>

          {/* Nome e Contatos */}
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-foreground">{contact.nome}</div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {contact.email}
              </span>
              {contact.telefone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {formatPhoneNumber(contact.telefone)}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Empresa */}
      <td className="px-6 py-4">
        <div>
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {contact.empresa}
          </div>
          {contact.cargo && (
            <div className="mt-1 text-sm text-muted-foreground">{contact.cargo}</div>
          )}
          {contact.localizacao && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {contact.localizacao}
            </div>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            statusConfig.className
          )}
        >
          {statusConfig.label}
        </span>
      </td>

      {/* Fonte */}
      <td className="px-6 py-4">
        <span className="text-sm text-foreground">{contact.fonte}</span>
      </td>

      {/* Último Contato */}
      <td className="px-6 py-4">
        <div className="text-sm text-foreground">
          {contact.ultimoContato ? formatRelativeDate(contact.ultimoContato) : "-"}
        </div>
      </td>

      {/* Tags */}
      <td className="px-6 py-4">
        {contact.tags && contact.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {contact.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {contact.tags.length > 2 && (
              <span className="inline-flex items-center text-xs text-muted-foreground">
                +{contact.tags.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </td>

      {/* Ações */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView?.(contact.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit?.(contact.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
