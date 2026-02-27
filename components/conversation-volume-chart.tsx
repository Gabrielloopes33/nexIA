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
  { month: "Jan", whatsapp: 420, email: 180, instagram: 120, telegram: 80 },
  { month: "Fev", whatsapp: 480, email: 200, instagram: 150, telegram: 90 },
  { month: "Mar", whatsapp: 550, email: 220, instagram: 180, telegram: 110 },
  { month: "Abr", whatsapp: 510, email: 190, instagram: 160, telegram: 95 },
  { month: "Mai", whatsapp: 600, email: 250, instagram: 200, telegram: 120 },
  { month: "Jun", whatsapp: 650, email: 280, instagram: 220, telegram: 140 },
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#9795e4]" />
            <CardTitle className="text-lg font-bold">Total de conversas do período</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[220px]">
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
                tick={{ fontSize: 11, fill: "#888" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#888" }}
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
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: channelColors.whatsapp }} />
            <span className="text-muted-foreground">WhatsApp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: channelColors.email }} />
            <span className="text-muted-foreground">Email</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: channelColors.instagram }} />
            <span className="text-muted-foreground">Instagram</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: channelColors.telegram }} />
            <span className="text-muted-foreground">Telegram</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
