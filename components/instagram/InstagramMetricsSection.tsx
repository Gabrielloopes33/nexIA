"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Eye, MousePointer } from "lucide-react";

interface InstagramInsights {
  impressions: number;
  reach: number;
  profileViews: number;
  websiteClicks: number;
}

interface InstagramMetricsSectionProps {
  insights: InstagramInsights;
  period: "day" | "week" | "month";
  onPeriodChange: (period: "day" | "week" | "month") => void;
}

const mockChartData = [
  { name: "Seg", impressions: 1200, reach: 800 },
  { name: "Ter", impressions: 1500, reach: 1000 },
  { name: "Qua", impressions: 1100, reach: 700 },
  { name: "Qui", impressions: 1800, reach: 1200 },
  { name: "Sex", impressions: 2200, reach: 1500 },
  { name: "Sáb", impressions: 2000, reach: 1300 },
  { name: "Dom", impressions: 1700, reach: 1100 },
];

export function InstagramMetricsSection({
  insights,
  period,
  onPeriodChange,
}: InstagramMetricsSectionProps) {
  const stats = [
    {
      label: "Alcance",
      value: insights.reach.toLocaleString(),
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Impressões",
      value: insights.impressions.toLocaleString(),
      icon: Eye,
      color: "text-purple-500",
    },
    {
      label: "Visualizações de Perfil",
      value: insights.profileViews.toLocaleString(),
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Cliques no Site",
      value: insights.websiteClicks.toLocaleString(),
      icon: MousePointer,
      color: "text-orange-500",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas
          </CardTitle>
          <Tabs
            value={period}
            onValueChange={(v) => onPeriodChange(v as "day" | "week" | "month")}
          >
            <TabsList className="h-8">
              <TabsTrigger value="day" className="text-xs px-3">
                24h
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3">
                7 dias
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3">
                30 dias
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Bar
                dataKey="impressions"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="Impressões"
              />
              <Bar
                dataKey="reach"
                fill="hsl(var(--secondary))"
                radius={[4, 4, 0, 0]}
                name="Alcance"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
