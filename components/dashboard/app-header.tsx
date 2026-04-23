"use client"

import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white px-3 py-1.5 text-sm font-bold text-black">
            ECHO<span className="text-orange-500">Z</span>
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white">
              ECHOZ MULTI VENTURES LTD
            </p>
            <p className="text-xs text-zinc-400">
              Inventory & Sales Dashboard
            </p>
          </div>
        </div>

        <div className="hidden w-full max-w-md md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search inventory, sales, stock..."
              className="h-10 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white">
            <Bell className="h-4 w-4" />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
            E
          </div>
        </div>
      </div>
    </header>
  )
}