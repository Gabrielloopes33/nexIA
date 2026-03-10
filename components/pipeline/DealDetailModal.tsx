"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { formatCurrency, formatDate, formatDistanceToNow } from "@/lib/utils";
import {
  DollarSign,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  ArrowRight,
  StickyNote,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { ActivityType } from "@prisma/client";

interface DealActivity {
  id: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

interface Deal {
  id: string;
  title: string;
  description?: string | null;
  value: number;
  currency: string;
  status: string;
  priority: string;
  leadScore: number;
  expectedCloseDate?: string | null;
  actualCloseDate?: string | null;
  source?: string | null;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  contact?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string | null;
  };
  stage?: {
    id: string;
    name: string;
    color: string;
    probability: number;
  };
}

interface DealDetailModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  activities: DealActivity[];
  onAddNote: (note: string) => Promise<void>;
  onUpdateDeal: (updates: Partial<Deal>) => Promise<void>;
}

export function DealDetailModal({
  deal,
  isOpen,
  onClose,
  activities,
  onAddNote,
  onUpdateDeal,
}: DealDetailModalProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!deal) return null;

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddNote(note.trim());
      setNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "STAGE_CHANGE":
        return <ArrowRight className="h-4 w-4" />;
      case "NOTE":
        return <StickyNote className="h-4 w-4" />;
      case "CALL":
        return <Phone className="h-4 w-4" />;
      case "EMAIL":
        return <Mail className="h-4 w-4" />;
      case "MEETING":
        return <Calendar className="h-4 w-4" />;
      case "TASK_COMPLETED":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case "STAGE_CHANGE":
        return "bg-blue-100 text-blue-700";
      case "NOTE":
        return "bg-yellow-100 text-yellow-700";
      case "CALL":
        return "bg-green-100 text-green-700";
      case "EMAIL":
        return "bg-purple-100 text-purple-700";
      case "MEETING":
        return "bg-pink-100 text-pink-700";
      case "TASK_COMPLETED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl mb-1">{deal.title}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>ID: {deal.id.slice(0, 8)}</span>
                <span>•</span>
                <span>Criado {formatDistanceToNow(new Date(deal.createdAt))}</span>
              </div>
            </div>
            <LeadScoreBadge score={deal.leadScore} />
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="timeline">
              Timeline ({activities.length})
            </TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {/* Value & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Valor</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(deal.value)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Tag className="h-4 w-4" />
                  <span className="text-sm">Status</span>
                </div>
                <Badge
                  variant={deal.status === "WON" ? "default" : deal.status === "LOST" ? "destructive" : "secondary"}
                  className="text-sm"
                >
                  {deal.status === "OPEN" && "Em Aberto"}
                  {deal.status === "WON" && "Ganho"}
                  {deal.status === "LOST" && "Perdido"}
                </Badge>
              </div>
            </div>

            {/* Contact Info */}
            {deal.contact && (
              <div className="p-4 rounded-lg border">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contato
                </h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={deal.contact.avatar || undefined} />
                    <AvatarFallback>{getInitials(deal.contact.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{deal.contact.name}</p>
                    {deal.contact.email && (
                      <p className="text-sm text-muted-foreground">{deal.contact.email}</p>
                    )}
                    {deal.contact.phone && (
                      <p className="text-sm text-muted-foreground">{deal.contact.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stage Info */}
            {deal.stage && (
              <div className="p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Estágio Atual</h4>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: deal.stage.color }}
                  />
                  <span>{deal.stage.name}</span>
                  <span className="text-muted-foreground">
                    ({deal.stage.probability}% de chance)
                  </span>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              {deal.expectedCloseDate && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Fechamento Esperado</span>
                  </div>
                  <p className="font-medium">
                    {formatDate(deal.expectedCloseDate)}
                  </p>
                </div>
              )}
              {deal.source && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ArrowRight className="h-4 w-4" />
                    <span className="text-sm">Origem</span>
                  </div>
                  <p className="font-medium capitalize">{deal.source}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            {deal.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {deal.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma atividade registrada
                </p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getActivityColor(
                        activity.type
                      )}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 pb-4 border-b last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{activity.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                          <pre>{JSON.stringify(activity.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Adicionar uma nota..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleAddNote}
                disabled={isSubmitting || !note.trim()}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {activities
                .filter((a) => a.type === "NOTE")
                .map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-muted">
                    <p className="text-sm">{note.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(note.createdAt))}
                    </p>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
