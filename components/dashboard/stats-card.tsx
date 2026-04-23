import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type StatsCardProps = {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  valueClassName?: string
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  valueClassName = "text-white",
}: StatsCardProps) {
  return (
    <Card className="rounded-2xl border-white/10 bg-white/[0.04] shadow-none">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-400">
            {title}
          </span>

          <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400">
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className={`text-3xl font-semibold tracking-tight ${valueClassName}`}>
          {value}
        </div>

        <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
      </CardContent>
    </Card>
  )
}