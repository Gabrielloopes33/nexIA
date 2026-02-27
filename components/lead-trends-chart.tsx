"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const data = [
  { year: "2014", total: 120, verified: 80, upcoming: 40 },
  { year: "2015", total: 180, verified: 120, upcoming: 60 },
  { year: "2016", total: 220, verified: 150, upcoming: 90 },
  { year: "2017", total: 280, verified: 200, upcoming: 120 },
  { year: "2018", total: 350, verified: 250, upcoming: 150 },
  { year: "2019", total: 420, verified: 300, upcoming: 180 },
  { year: "2020", total: 380, verified: 280, upcoming: 160 },
  { year: "2021", total: 480, verified: 360, upcoming: 200 },
  { year: "2022", total: 550, verified: 420, upcoming: 230 },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-sm shadow-sm bg-card px-3 py-2">
        <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function LeadTrendsChart() {
  return (
    <div className="rounded-sm shadow-sm bg-card p-5">
      <div className="mb-6 pb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Tendência de Geração de Leads</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#9795e4]" />
            <span className="text-xs text-muted-foreground">Total de Leads</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#027E46]" />
            <span className="text-xs text-muted-foreground">Verificados</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D1D5DB]" />
            <span className="text-xs text-muted-foreground">Novos</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9795e4" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#9795e4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#027E46" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#027E46" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorUpcoming" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D1D5DB" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#D1D5DB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#DDDBDA" vertical={false} />
          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#9795e4"
            strokeWidth={2}
            fill="url(#colorTotal)"
            name="Total Leads"
          />
          <Area
            type="monotone"
            dataKey="verified"
            stroke="#027E46"
            strokeWidth={2}
            fill="url(#colorVerified)"
            name="Verified"
          />
          <Area
            type="monotone"
            dataKey="upcoming"
            stroke="#D1D5DB"
            strokeWidth={2}
            fill="url(#colorUpcoming)"
            name="Upcoming"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
