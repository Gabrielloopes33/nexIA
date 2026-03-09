"use client";

import { useState } from "react";
import { DealDetailModal } from "@/components/pipeline/DealDetailModal";
import { formatCurrency } from "@/lib/utils";
import { Target } from "lucide-react";

interface ActiveDeal {
  id: string;
  title: string;
  value: number;
  currency: string;
  leadScore: number;
  stage: {
    id: string;
    name: string;
    color: string;
  };
}

interface DealBadgeProps {
  deal: ActiveDeal;
}

export function DealBadge({ deal }: DealBadgeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activities, setActivities] = useState([]);

  const handleClick = () => {
    // Fetch activities when opening modal
    fetch(`/api/pipeline/deals/${deal.id}/activities`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setActivities(data.data);
        }
      });
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
        style={{
          backgroundColor: `${deal.stage.color}20`,
          color: deal.stage.color,
          border: `1px solid ${deal.stage.color}40`,
        }}
        title={`${deal.title} - ${formatCurrency(deal.value)}`}
      >
        <Target className="h-3 w-3" />
        <span className="truncate max-w-[120px]">{deal.stage.name}</span>
        <span className="opacity-60">•</span>
        <span>{formatCurrency(deal.value)}</span>
      </button>

      {/* Modal would be rendered here, but we need to fetch full deal data */}
      {isModalOpen && (
        <DealDetailModal
          deal={{
            ...deal,
            expectedCloseDate: null,
            actualCloseDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "OPEN",
            priority: "MEDIUM",
            tags: [],
            source: null,
          }}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          activities={activities}
          onAddNote={async () => {}}
          onUpdateDeal={async () => {}}
        />
      )}
    </>
  );
}

export function DealBadgeSkeleton() {
  return (
    <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
  );
}
