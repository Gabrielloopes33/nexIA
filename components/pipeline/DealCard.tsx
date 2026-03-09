"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { formatCurrency, formatDistanceToNow } from "@/lib/utils";
import { Calendar, DollarSign, MessageSquare, User } from "lucide-react";

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
}

export function DealCard({ deal, onClick }: DealCardProps) {
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
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: deal.leadScore >= 60 ? "#10b981" : "#3b82f6" }}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm line-clamp-2 flex-1 mr-2">
            {deal.title}
          </h4>
          <LeadScoreBadge score={deal.leadScore} className="shrink-0" />
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
