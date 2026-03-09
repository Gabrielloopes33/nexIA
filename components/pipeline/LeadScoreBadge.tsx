"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeadScoreBadgeProps {
  score: number;
  className?: string;
}

export function LeadScoreBadge({ score, className }: LeadScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500 hover:bg-green-600";
    if (score >= 60) return "bg-emerald-500 hover:bg-emerald-600";
    if (score >= 40) return "bg-yellow-500 hover:bg-yellow-600";
    if (score >= 20) return "bg-orange-500 hover:bg-orange-600";
    return "bg-red-500 hover:bg-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Hot";
    if (score >= 60) return "Warm";
    if (score >= 40) return "Mild";
    if (score >= 20) return "Cold";
    return "Frozen";
  };

  return (
    <Badge
      className={cn(
        getScoreColor(score),
        "text-white text-xs font-medium",
        className
      )}
    >
      {score} - {getScoreLabel(score)}
    </Badge>
  );
}
