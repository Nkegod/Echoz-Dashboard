"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

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

type DashboardChartsProps = {
  revenueData: RevenuePoint[];
  topItems: TopItem[];
};

export default function DashboardCharts({
  revenueData,
  topItems,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/4 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Revenue & Profit Trend</h2>
          <p className="text-sm text-gray-400">
            Daily revenue and estimated profit based on recorded sales
          </p>
        </div>

        <div className="h-80px">
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₦${Number(value).toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `₦${Number(value).toLocaleString()}`,
                    name === "revenue" ? "Revenue" : "Profit",
                  ]}
                  contentStyle={{
                    backgroundColor: "#09090b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#60a5fa"
                  fill="#60a5fa"
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-gray-500">
              No chart data available yet.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Top-Selling Items</h2>
          <p className="text-sm text-gray-400">
            Best-performing items by quantity sold
          </p>
        </div>

        <div className="h-80px]">
          {topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="item_name"
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  width={110}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "total_quantity") {
                      return [value, "Qty Sold"];
                    }
                    return [`₦${Number(value).toLocaleString()}`, "Revenue"];
                  }}
                  contentStyle={{
                    backgroundColor: "#09090b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="total_quantity" fill="#a78bfa" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-gray-500">
              No sales data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
