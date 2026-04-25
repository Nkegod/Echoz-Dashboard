"use client";

import Image from "next/image";
import { ReactNode } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";
import LogoutButton from "@/components/logout-button";

type DashboardShellProps = {
  children: ReactNode;
  active?: "dashboard" | "inventory" | "sales" | "add-stock" | "staff";
  pageLabel?: string;
};

export default function DashboardShell({
  children,
  active,
  pageLabel,
}: DashboardShellProps) {
  const { checking, profile } = useAuthGuard();

  const firstName = profile?.full_name
    ? profile.full_name.trim().split(" ")[0]
    : "User";

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Checking access...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-8">
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-5 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/images/echoz-logo.png"
            alt="ECHOZ Logo"
            width={140}
            height={50}
            priority
          />
          <span className="text-gray-200 text-lg font-semibold tracking-wide hidden sm:block">
            MULTI VENTURES LTD
          </span>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm text-white font-medium">
                Welcome, {firstName}
              </span>

              <span className="text-xs text-gray-400 uppercase tracking-wide">
                {profile.role}
              </span>
            </div>
          )}

          {pageLabel && (
            <span className="text-xs text-gray-500 uppercase tracking-widest hidden md:block">
              {pageLabel}
            </span>
          )}

          <LogoutButton />
        </div>
      </div>

      <nav className="flex gap-2 mb-8 flex-wrap">
        <a
          href="/"
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            active === "dashboard"
              ? "bg-white text-black border-white"
              : "bg-gray-900 text-gray-300 border-white/10 hover:bg-gray-800"
          }`}
        >
          Dashboard
        </a>

        <a
          href="/inventory"
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            active === "inventory"
              ? "bg-white text-black border-white"
              : "bg-gray-900 text-gray-300 border-white/10 hover:bg-gray-800"
          }`}
        >
          Inventory
        </a>

        <a
          href="/sales"
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            active === "sales"
              ? "bg-white text-black border-white"
              : "bg-gray-900 text-gray-300 border-white/10 hover:bg-gray-800"
          }`}
        >
          Sales
        </a>

        {profile?.role === "admin" && (
          <a
            href="/add-stock"
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              active === "add-stock"
                ? "bg-white text-black border-white"
                : "bg-gray-900 text-gray-300 border-white/10 hover:bg-gray-800"
            }`}
          >
            + Add Stock
          </a>
        )}

        {profile?.role === "admin" && (
          <a
            href="/staff"
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              active === "staff"
                ? "bg-white text-black border-white"
                : "bg-gray-900 text-gray-300 border-white/10 hover:bg-gray-800"
            }`}
          >
            Staff
          </a>
        )}
      </nav>

      {children}
    </main>
  );
}
