"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { formatCurrency } from "@/lib/utils";
import { Calendar, DollarSign, MessageSquare, MoreVertical, Pencil, Trash2, GripVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: {
    id: string;
    title: string;
    value: number;
    currency: string;
    priority: string;
    leadScore: number;
    expectedCloseDate?: string | null;
    contact?: {
      id: string;
      name: string;
      email?: string;
      avatar?: string | null;
    };
    activitiesCount?: number;
    updatedAt: string;
  };
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

export function DealCard({ 
  deal, 
  onClick, 
  onEdit, 
  onDelete, 
  draggable = false,
  onDragStart,
  isDragging = false
}: DealCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-500";
      case "MEDIUM":
        return "text-yellow-500";
      case "LOW":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      draggable={draggable}
      onDragStart={onDragStart}
      className={cn(
        "cursor-pointer hover:shadow-md transition-all border-l-4 group relative",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 rotate-2 scale-105 shadow-xl ring-2 ring-[#46347F]/30"
      )}
      style={{ borderLeftColor: deal.leadScore >= 60 ? "#10b981" : "#3b82f6" }}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          {draggable && (
            <div className="mr-2 text-muted-foreground/50">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <h4 className="font-medium text-sm line-clamp-2 flex-1 mr-2">
            {deal.title}
          </h4>
          <div className="flex items-center gap-1">
            <LeadScoreBadge score={deal.leadScore} className="shrink-0" />
            
            {/* Menu de Ações - 3 Pontinhos */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Value */}
        <div className="flex items-center gap-1 text-sm font-semibold text-green-600 mb-2">
          <DollarSign className="h-3.5 w-3.5" />
          {formatCurrency(deal.value)}
        </div>

        {/* Contact */}
        {deal.contact && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={deal.contact.avatar || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10">
                {getInitials(deal.contact.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {deal.contact.name}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {deal.expectedCloseDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(deal.expectedCloseDate).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {deal.activitiesCount ? (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {deal.activitiesCount}
              </span>
            ) : null}
            <span className={getPriorityColor(deal.priority)}>
              ●
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
