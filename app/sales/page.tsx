"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";
import DashboardShell from "@/components/dashboard-shell";
import { useAuthGuard } from "@/lib/use-auth-guard";

type InventoryItem = {
  id: number;
  item_name: string;
  selling_price: number;
  stock_remaining: number;
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

type DateFilter = "all" | "today" | "week" | "month";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG");
}

function formatNaira(value: number) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function escapeCSV(value: string | number | null | undefined) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function isSameDay(dateValue: string) {
  const today = new Date();
  const date = new Date(dateValue);

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isThisWeek(dateValue: string) {
  const today = new Date();
  const date = new Date(dateValue);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return date >= startOfWeek && date < endOfWeek;
}

function isThisMonth(dateValue: string) {
  const today = new Date();
  const date = new Date(dateValue);

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  );
}

export default function SalesPage() {
  const { checking, profile } = useAuthGuard();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleItem[]>([]);

  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantitySold, setQuantitySold] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [location, setLocation] = useState("");
  const [soldBy, setSoldBy] = useState("");

  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [soldByFilter, setSoldByFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const firstName = profile?.full_name
    ? profile.full_name.trim().split(" ")[0]
    : "";

  async function loadItems() {
    setLoadingItems(true);

    const { data, error } = await supabase
      .from("inventory")
      .select("id, item_name, selling_price, stock_remaining")
      .order("item_name", { ascending: true });

    if (error) {
      toast.error("Failed to load inventory: " + error.message);
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoadingItems(false);
  }

  async function loadSalesHistory() {
    setLoadingSales(true);

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sale_date", { ascending: false });

    if (error) {
      toast.error("Failed to load sales: " + error.message);
      setSalesHistory([]);
    } else {
      setSalesHistory(data || []);
    }

    setLoadingSales(false);
  }

  useEffect(() => {
    loadItems();
    loadSalesHistory();

    const inventoryChannel = supabase
      .channel("sales-inventory-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory" },
        async () => {
          await loadItems();
        }
      )
      .subscribe();

    const salesChannel = supabase
      .channel("sales-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        async () => {
          await loadSalesHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(salesChannel);
    };
  }, []);

  useEffect(() => {
    if (firstName && !soldBy) {
      setSoldBy(firstName);
    }
  }, [firstName, soldBy]);

  function handleItemChange(value: string) {
    setSelectedItemId(value);

    const selected = items.find((item) => String(item.id) === value);

    if (selected) {
      setSellingPrice(String(selected.selling_price));
    } else {
      setSellingPrice("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (submitting) return;

    const selected = items.find((item) => String(item.id) === selectedItemId);

    if (!selected) {
      toast.error("Please select an item.");
      return;
    }

    const qty = Number(quantitySold);
    const price = Number(sellingPrice);

    if (qty <= 0) {
      toast.error("Quantity must be greater than 0.");
      return;
    }

    if (price <= 0) {
      toast.error("Selling price must be greater than 0.");
      return;
    }

    if (!location.trim()) {
      toast.error("Location is required.");
      return;
    }

    if (!soldBy.trim()) {
      toast.error("Sold by is required.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.rpc("record_sale_atomic", {
      p_inventory_id: selected.id,
      p_quantity_sold: qty,
      p_selling_price: price,
      p_location: location.trim(),
      p_sold_by: soldBy.trim(),
      p_sale_date: new Date().toISOString().split("T")[0],
    });

    if (error) {
      toast.error(error.message || "Failed to record sale.");
      setSubmitting(false);
      return;
    }

    toast.success("Sale recorded successfully!");

    setSelectedItemId("");
    setQuantitySold("");
    setSellingPrice("");
    setLocation("");
    setSoldBy(firstName || "");

    await loadItems();
    await loadSalesHistory();

    setSubmitting(false);
  }

  const locationOptions = useMemo(() => {
    return Array.from(
      new Set(salesHistory.map((sale) => sale.location).filter(Boolean))
    );
  }, [salesHistory]);

  const soldByOptions = useMemo(() => {
    return Array.from(
      new Set(salesHistory.map((sale) => sale.sold_by).filter(Boolean))
    );
  }, [salesHistory]);

  const filteredSales = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return salesHistory.filter((sale) => {
      const matchSearch =
        !term ||
        sale.item_name.toLowerCase().includes(term) ||
        sale.location.toLowerCase().includes(term) ||
        sale.sold_by.toLowerCase().includes(term) ||
        formatDate(sale.sale_date).toLowerCase().includes(term);

      const matchLocation =
        locationFilter === "all" || sale.location === locationFilter;

      const matchSoldBy =
        soldByFilter === "all" || sale.sold_by === soldByFilter;

      const matchDate =
        dateFilter === "all" ||
        (dateFilter === "today" && isSameDay(sale.sale_date)) ||
        (dateFilter === "week" && isThisWeek(sale.sale_date)) ||
        (dateFilter === "month" && isThisMonth(sale.sale_date));

      return matchSearch && matchLocation && matchSoldBy && matchDate;
    });
  }, [salesHistory, searchTerm, locationFilter, soldByFilter, dateFilter]);

  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.quantity_sold || 0) * Number(sale.selling_price || 0),
    0
  );

  const totalQuantity = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.quantity_sold || 0),
    0
  );

  const totalTransactions = filteredSales.length;

  const averageSale =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  function exportCSV() {
    const headers = [
      "Item",
      "Quantity",
      "Selling Price",
      "Total Amount",
      "Location",
      "Sold By",
      "Date",
    ];

    const rows = filteredSales.map((sale) => [
      sale.item_name,
      sale.quantity_sold,
      sale.selling_price,
      Number(sale.quantity_sold || 0) * Number(sale.selling_price || 0),
      sale.location,
      sale.sold_by,
      formatDate(sale.sale_date),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => escapeCSV(value)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sales-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.text("ECHOZ MULTI VENTURES LTD", 40, 40);

    doc.setFontSize(11);
    doc.text("Sales Report", 40, 60);
    doc.text(`Generated: ${new Date().toLocaleString("en-NG")}`, 40, 78);
    doc.text(`Total Revenue: ${formatNaira(totalRevenue)}`, 40, 96);
    doc.text(`Total Quantity Sold: ${totalQuantity}`, 240, 96);
    doc.text(`Transactions: ${totalTransactions}`, 430, 96);

    autoTable(doc, {
      startY: 120,
      head: [
        [
          "Item",
          "Qty",
          "Price",
          "Total",
          "Location",
          "Sold By",
          "Date",
        ],
      ],
      body: filteredSales.map((sale) => [
        sale.item_name,
        String(sale.quantity_sold),
        formatNaira(sale.selling_price),
        formatNaira(Number(sale.quantity_sold || 0) * Number(sale.selling_price || 0)),
        sale.location,
        sale.sold_by,
        formatDate(sale.sale_date),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [31, 41, 55],
      },
    });

    doc.save("sales-report.pdf");
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-400 bg-gray-950">
        Checking access...
      </main>
    );
  }

  return (
    <DashboardShell active="sales" pageLabel="Sales">
      <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Sales
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Record sales, monitor revenue, and export sales reports.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition"
          >
            Export Excel
          </button>

          <button
            onClick={exportPDF}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 mb-8">
        <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">
            Record Sale
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            Add a new sale and update inventory automatically.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={selectedItemId}
              onChange={(e) => handleItemChange(e.target.value)}
              className="input"
              required
              disabled={loadingItems}
            >
              <option value="">
                {loadingItems ? "Loading items..." : "Select item"}
              </option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name} ({item.stock_remaining} left)
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Quantity"
              value={quantitySold}
              onChange={(e) => setQuantitySold(e.target.value)}
              className="input"
              required
            />

            <input
              type="number"
              placeholder="Selling Price"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="input"
              required
            />

            <input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              required
            />

            <input
              placeholder="Sold By"
              value={soldBy}
              onChange={(e) => setSoldBy(e.target.value)}
              className="input"
              required
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save Sale"}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
          <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
              Total Revenue
            </p>
            <p className="text-2xl font-semibold text-emerald-400">
              {formatNaira(totalRevenue)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Revenue from filtered sales
            </p>
          </div>

          <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
              Quantity Sold
            </p>
            <p className="text-2xl font-semibold text-white">
              {totalQuantity.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Total units sold
            </p>
          </div>

          <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
              Transactions
            </p>
            <p className="text-2xl font-semibold text-yellow-400">
              {totalTransactions.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Number of sales records
            </p>
          </div>

          <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
              Average Sale
            </p>
            <p className="text-2xl font-semibold text-blue-400">
              {formatNaira(averageSale)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Average value per sale
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-200">
                Sales History
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {filteredSales.length} sale
                {filteredSales.length !== 1 ? "s" : ""} shown
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <input
                placeholder="Search item, location, seller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
              />

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="input"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Locations</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              <select
                value={soldByFilter}
                onChange={(e) => setSoldByFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Sellers</option>
                {soldByOptions.map((seller) => (
                  <option key={seller} value={seller}>
                    {seller}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/3">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Sold By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {loadingSales ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500 text-sm"
                  >
                    Loading sales...
                  </td>
                </tr>
              ) : filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const total =
                    Number(sale.quantity_sold || 0) *
                    Number(sale.selling_price || 0);

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-100">
                        {sale.item_name}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {sale.quantity_sold}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {formatNaira(sale.selling_price)}
                      </td>
                      <td className="px-4 py-3 font-medium text-emerald-400">
                        {formatNaira(total)}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {sale.location}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300 whitespace-nowrap">
                          {sale.sold_by}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(sale.sale_date)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500 text-sm"
                  >
                    No sales found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="mt-8 pt-5 border-t border-white/10 text-center text-xs text-gray-600">
        © 2026 ECHOZ MULTI VENTURES LTD. All rights reserved.
      </footer>
    </DashboardShell>
  );
}