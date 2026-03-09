"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface InstagramMetricsSectionProps {
  insights: {
    impressions: number
    reach: number
    profileViews: number
    websiteClicks: number
  }
  period: "day" | "week" | "month"
  onPeriodChange: (period: "day" | "week" | "month") => void
  isLoading?: boolean
  instance?: {
    followersCount?: number
    mediaCount?: number
  } | null
}

// Mock data for charts
const mockDailyData = [
  { name: "00h", impressions: 120, reach: 80, engagement: 45 },
  { name: "04h", impressions: 80, reach: 50, engagement: 25 },
  { name: "08h", impressions: 450, reach: 320, engagement: 180 },
  { name: "12h", impressions: 890, reach: 620, engagement: 340 },
  { name: "16h", impressions: 1200, reach: 850, engagement: 420 },
  { name: "20h", impressions: 980, reach: 720, engagement: 380 },
]

const mockWeeklyData = [
  { name: "Seg", impressions: 3200, reach: 2100, engagement: 980 },
  { name: "Ter", impressions: 4100, reach: 2800, engagement: 1200 },
  { name: "Qua", impressions: 3800, reach: 2600, engagement: 1150 },
  { name: "Qui", impressions: 5200, reach: 3400, engagement: 1580 },
  { name: "Sex", impressions: 6100, reach: 4100, engagement: 1920 },
  { name: "Sáb", impressions: 5800, reach: 3900, engagement: 2100 },
  { name: "Dom", impressions: 4200, reach: 2900, engagement: 1350 },
]

const mockMonthlyData = [
  { name: "Sem 1", impressions: 28000, reach: 19000, engagement: 8500 },
  { name: "Sem 2", impressions: 32000, reach: 22000, engagement: 9800 },
  { name: "Sem 3", impressions: 35000, reach: 24000, engagement: 11200 },
  { name: "Sem 4", impressions: 31000, reach: 21000, engagement: 9500 },
]

const mockTopPosts = [
  { id: "1", type: "image", likes: 2450, comments: 128, shares: 45, saves: 234, engagement: "12.5%" },
  { id: "2", type: "reels", likes: 3890, comments: 256, shares: 120, saves: 445, engagement: "18.2%" },
  { id: "3", type: "carousel", likes: 1820, comments: 89, shares: 32, saves: 178, engagement: "9.8%" },
  { id: "4", type: "image", likes: 1560, comments: 67, shares: 23, saves: 145, engagement: "8.4%" },
]

export function InstagramMetricsSection({
  insights,
  period,
  onPeriodChange,
  isLoading,
  instance,
}: InstagramMetricsSectionProps) {
  const getChartData = () => {
    switch (period) {
      case "day":
        return mockDailyData
      case "week":
        return mockWeeklyData
      case "month":
        return mockMonthlyData
      default:
        return mockWeeklyData
    }
  }

  const getPeriodLabel = () => {
    switch (period) {
      case "day":
        return "últimas 24 horas"
      case "week":
        return "últimos 7 dias"
      case "month":
        return "últimos 30 dias"
    }
  }

  const stats = [
    {
      label: "Alcance",
      value: insights.reach.toLocaleString(),
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      label: "Impressões",
      value: insights.impressions.toLocaleString(),
      change: "+8.3%",
      trend: "up",
      icon: Eye,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      label: "Visualizações de Perfil",
      value: insights.profileViews.toLocaleString(),
      change: "+15.2%",
      trend: "up",
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      label: "Cliques no Site",
      value: insights.websiteClicks.toLocaleString(),
      change: "-2.1%",
      trend: "down",
      icon: MousePointer,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
  ]

  const engagementStats = [
    { label: "Curtidas", value: "12.4K", icon: Heart, color: "text-red-500" },
    { label: "Comentários", value: "856", icon: MessageCircle, color: "text-blue-500" },
    { label: "Compartilhamentos", value: "234", icon: Share2, color: "text-green-500" },
    { label: "Salvamentos", value: "1.2K", icon: Bookmark, color: "text-yellow-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Período de Análise</h3>
                <p className="text-sm text-muted-foreground">
                  Dados dos {getPeriodLabel()}
                </p>
              </div>
            </div>
            <Tabs value={period} onValueChange={(v) => onPeriodChange(v as typeof period)}>
              <TabsList className="h-9">
                <TabsTrigger value="day" className="text-xs">24h</TabsTrigger>
                <TabsTrigger value="week" className="text-xs">7 dias</TabsTrigger>
                <TabsTrigger value="month" className="text-xs">30 dias</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array(4).fill(null).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                  )}>
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Engagement Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {engagementStats.map((stat) => (
          <Card key={stat.label} className="border-border bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={cn("h-5 w-5", stat.color)} />
                <div>
                  <p className="text-lg font-semibold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Main Chart */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Desempenho</CardTitle>
                <CardDescription>
                  Impressões, alcance e engajamento ao longo do tempo
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData()}>
                    <defs>
                      <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#833AB4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#833AB4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FD1D1D" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FD1D1D" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="impressions"
                      stroke="#833AB4"
                      fillOpacity={1}
                      fill="url(#colorImpressions)"
                      name="Impressões"
                    />
                    <Area
                      type="monotone"
                      dataKey="reach"
                      stroke="#FD1D1D"
                      fillOpacity={1}
                      fill="url(#colorReach)"
                      name="Alcance"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Publicações em Destaque
          </CardTitle>
          <CardDescription>
            Suas publicações com melhor desempenho neste período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTopPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-semibold text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={post.type === "reels" ? "default" : "secondary"} className="text-xs">
                        {post.type === "image" && "Foto"}
                        {post.type === "reels" && "Reels"}
                        {post.type === "carousel" && "Carrossel"}
                      </Badge>
                      <span className="text-sm font-medium text-emerald-600">{post.engagement} engaj.</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-red-500" />
                        {post.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                        {post.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-3.5 w-3.5 text-green-500" />
                        {post.shares}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="h-3.5 w-3.5 text-yellow-500" />
                        {post.saves}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
