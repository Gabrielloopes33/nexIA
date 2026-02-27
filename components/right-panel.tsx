import { Users, Package, CalendarDays } from "lucide-react"

const leadSources = [
  { name: "LinkedIn", count: 645, percentage: 76.6, color: "#2563EB" },
  { name: "Sales Navigator", count: 123, percentage: 14.6, color: "#6B7280" },
  { name: "Manual Upload", count: 74, percentage: 8.8, color: "#2563EB" },
]

export function RightPanel() {
  return (
    <div className="flex flex-col gap-4">
      {/* Counters */}
      <div className="rounded-sm shadow-sm bg-card p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]">
                <Users className="h-4 w-4 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm text-muted-foreground">Contatos</span>
            </div>
            <span className="text-base font-bold text-foreground">1,245</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]">
                <Package className="h-4 w-4 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm text-muted-foreground">Produtos</span>
            </div>
            <span className="text-base font-bold text-foreground">38</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]">
                <CalendarDays className="h-4 w-4 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm text-muted-foreground">Agendamentos</span>
            </div>
            <span className="text-base font-bold text-foreground">12</span>
          </div>
        </div>
      </div>

      {/* Lead Sources */}
      <div className="rounded-sm shadow-sm bg-card p-4">
        <h3 className="mb-4 text-base font-semibold text-foreground">Lead Sources</h3>
        <div className="flex flex-col gap-3.5">
          {leadSources.map((source) => (
            <div key={source.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{source.name}</span>
                <span className="text-sm font-semibold text-foreground">{source.count}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${source.percentage}%`,
                    backgroundColor: source.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
