"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { MessageSquare } from "lucide-react"

const data = [
  { month: "Jan", whatsapp: 420, instagram: 180, telegram: 120, iframe: 80 },
  { month: "Fev", whatsapp: 480, instagram: 200, telegram: 150, iframe: 90 },
  { month: "Mar", whatsapp: 550, instagram: 220, telegram: 180, iframe: 110 },
  { month: "Abr", whatsapp: 510, instagram: 190, telegram: 160, iframe: 95 },
  { month: "Mai", whatsapp: 600, instagram: 250, telegram: 200, iframe: 120 },
  { month: "Jun", whatsapp: 650, instagram: 280, telegram: 220, iframe: 140 },
]

const channelColors = {
  whatsapp: "#9795e4",
  email: "#b3b3e5",
  instagram: "#7c7ab8",
  telegram: "#a5a3d9",
}

export function ConversationVolumeChart() {
  return (
    <Card className="rounded-sm shadow-sm">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900">Total de Conversas</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Por canal - últimos 6 meses
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barSize={28}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#888" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#888" }}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="whatsapp"
                stackId="a"
                fill={channelColors.whatsapp}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="email"
                stackId="a"
                fill={channelColors.email}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="instagram"
                stackId="a"
                fill={channelColors.instagram}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="telegram"
                stackId="a"
                fill={channelColors.telegram}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: channelColors.whatsapp }} />
            <span className="text-muted-foreground text-xs">WhatsApp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: channelColors.email }} />
            <span className="text-muted-foreground text-xs">Email</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: channelColors.instagram }} />
            <span className="text-muted-foreground text-xs">Instagram</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: channelColors.telegram }} />
            <span className="text-muted-foreground text-xs">Telegram</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
