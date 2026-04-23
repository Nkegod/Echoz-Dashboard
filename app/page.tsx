"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import DashboardShell from "@/components/dashboard-shell";
import DashboardCharts from "@/components/dashboard-charts";

type InventoryItem = {
  id: number;
  item_name: string;
  category: string | null;
  cost_price: number | null;
  selling_price: number | null;
  quantity: number | null;
  stock_remaining: number | null;
  location: string | null;
};

type SaleItem = {
  id: number;
  item_name: string;
  quantity_sold: number;
  selling_price: number;
  location: string;
  sold_by: string;
  sale_date: string;
};

type RevenuePoint = {
  date: string;
  revenue: number;
  profit: number;
};

type TopItem = {
  item_name: string;
  total_quantity: number;
  total_revenue: number;
};

export default function DashboardPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboardData() {
    const [inventoryRes, salesRes] = await Promise.all([
      supabase
        .from("inventory")
        .select("*")
        .order("item_name", { ascending: true }),
      supabase
        .from("sales")
        .select("*")
        .order("sale_date", { ascending: true }),
    ]);

    if (inventoryRes.error) {
      console.error("Failed to load inventory:", inventoryRes.error.message);
      setInventory([]);
    } else {
      setInventory(inventoryRes.data || []);
    }

    if (salesRes.error) {
      console.error("Failed to load sales:", salesRes.error.message);
      setSales([]);
    } else {
      setSales(salesRes.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboardData();

    const inventoryChannel = supabase
      .channel("dashboard-inventory-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory" },
        async () => {
          await loadDashboardData();
        }
      )
      .subscribe();

    const salesChannel = supabase
      .channel("dashboard-sales-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        async () => {
          await loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(salesChannel);
    };
  }, []);

  const totals = useMemo(() => {
    const totalItems = inventory.length;

    const totalStock = inventory.reduce(
      (sum, item) => sum + Number(item.stock_remaining || 0),
      0
    );

    const totalRevenue = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.quantity_sold || 0) * Number(sale.selling_price || 0),
      0
    );

    const costPriceMap = new Map(
      inventory.map((item) => [item.item_name, Number(item.cost_price || 0)])
    );

    const estimatedProfit = sales.reduce((sum, sale) => {
      const costPrice = costPriceMap.get(sale.item_name) || 0;
      const unitProfit = Number(sale.selling_price || 0) - costPrice;
      return sum + unitProfit * Number(sale.quantity_sold || 0);
    }, 0);

    const lowStockItems = inventory.filter(
      (item) =>
        Number(item.stock_remaining || 0) > 0 &&
        Number(item.stock_remaining || 0) <= 5
    ).length;

    return {
      totalItems,
      totalStock,
      totalRevenue,
      estimatedProfit,
      lowStockItems,
    };
  }, [inventory, sales]);

  const revenueData = useMemo<RevenuePoint[]>(() => {
    const costPriceMap = new Map(
      inventory.map((item) => [item.item_name, Number(item.cost_price || 0)])
    );

    const grouped = new Map<string, RevenuePoint>();

    for (const sale of sales) {
      const date = sale.sale_date;
      const revenue =
        Number(sale.quantity_sold || 0) * Number(sale.selling_price || 0);

      const costPrice = costPriceMap.get(sale.item_name) || 0;
      const profit =
        (Number(sale.selling_price || 0) - costPrice) *
        Number(sale.quantity_sold || 0);

      if (!grouped.has(date)) {
        grouped.set(date, {
          date,
          revenue: 0,
          profit: 0,
        });
      }

      const existing = grouped.get(date)!;
      existing.revenue += revenue;
      existing.profit += profit;
    }

    return Array.from(grouped.values());
  }, [sales, inventory]);

  const topItems = useMemo<TopItem[]>(() => {
    const grouped = new Map<string, TopItem>();

    for (const sale of sales) {
      const revenue =
        Number(sale.quantity_sold || 0) * Number(sale.selling_price || 0);

      if (!grouped.has(sale.item_name)) {
        grouped.set(sale.item_name, {
          item_name: sale.item_name,
          total_quantity: 0,
          total_revenue: 0,
        });
      }

      const existing = grouped.get(sale.item_name)!;
      existing.total_quantity += Number(sale.quantity_sold || 0);
      existing.total_revenue += revenue;
    }

    return Array.from(grouped.values())
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 6);
  }, [sales]);

  const recentSales = useMemo(() => {
    return [...sales]
      .sort(
        (a, b) =>
          new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
      )
      .slice(0, 8);
  }, [sales]);

  return (
    <DashboardShell active="dashboard" pageLabel="Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Business Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Track revenue, inventory movement, and sales performance.
        </p>
      </div>

      <div className="mb-4">
        <button
          onClick={loadDashboardData}
          className="rounded-xl border border-white/10 bg-gray-900 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
            Total Items
          </p>
          <p className="text-2xl font-semibold text-white">
            {loading ? "..." : totals.totalItems.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-1">Products in system</p>
        </div>

        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
            Total Stock
          </p>
          <p className="text-2xl font-semibold text-emerald-400">
            {loading ? "..." : totals.totalStock.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-1">Units available</p>
        </div>

        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
            Revenue
          </p>
          <p className="text-2xl font-semibold text-white">
            {loading ? "..." : `₦${totals.totalRevenue.toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-600 mt-1">From all sales</p>
        </div>

        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
            Estimated Profit
          </p>
          <p className="text-2xl font-semibold text-blue-400">
            {loading ? "..." : `₦${totals.estimatedProfit.toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Based on current inventory cost price
          </p>
        </div>

        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
            Low Stock
          </p>
          <p className="text-2xl font-semibold text-yellow-400">
            {loading ? "..." : totals.lowStockItems}
          </p>
          <p className="text-xs text-gray-600 mt-1">Needs restocking</p>
        </div>
      </div>

      <div className="mb-8">
        <DashboardCharts revenueData={revenueData} topItems={topItems} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent Sales</h2>
            <p className="text-sm text-gray-400">
              Latest sales recorded in the system
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/10 text-left text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Sold By</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading dashboard data...
                  </td>
                </tr>
              ) : recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-100">
                      {sale.item_name}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {sale.quantity_sold}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      ₦{Number(sale.selling_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {sale.location}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {sale.sold_by}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {sale.sale_date}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No sales recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}