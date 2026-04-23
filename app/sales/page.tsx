"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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

export default function SalesPage() {
  const { checking } = useAuthGuard();

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

  async function loadItems() {
    setLoadingItems(true);

    const { data, error } = await supabase
      .from("inventory")
      .select("id, item_name, selling_price, stock_remaining")
      .order("item_name", { ascending: true });

    if (error) {
      console.error("Failed to load inventory:", error.message);
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
      console.error("Failed to load sales:", error.message);
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
    setSoldBy("");

    setSubmitting(false);
  }

  const locationOptions = useMemo(() => {
    return Array.from(new Set(salesHistory.map((s) => s.location)));
  }, [salesHistory]);

  const soldByOptions = useMemo(() => {
    return Array.from(new Set(salesHistory.map((s) => s.sold_by)));
  }, [salesHistory]);

  const filteredSales = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return salesHistory.filter((sale) => {
      const matchSearch =
        !term ||
        sale.item_name.toLowerCase().includes(term) ||
        sale.location.toLowerCase().includes(term) ||
        sale.sold_by.toLowerCase().includes(term);

      const matchLocation =
        locationFilter === "all" || sale.location === locationFilter;

      const matchSoldBy =
        soldByFilter === "all" || sale.sold_by === soldByFilter;

      return matchSearch && matchLocation && matchSoldBy;
    });
  }, [salesHistory, searchTerm, locationFilter, soldByFilter]);

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-400 bg-gray-950">
        Checking access...
      </main>
    );
  }

  return (
    <DashboardShell active="sales" pageLabel="Sales">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Record Sale</h1>
        <p className="text-sm text-gray-400">
          Capture sales and update inventory automatically
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/4 border border-white/10 rounded-2xl p-6 space-y-4 max-w-xl"
      >
        <select
          value={selectedItemId}
          onChange={(e) => handleItemChange(e.target.value)}
          className="input"
          required
        >
          <option value="">Select item</option>
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
          className="w-full py-3 rounded-xl bg-white text-black font-semibold"
        >
          {submitting ? "Saving..." : "Save Sale"}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Sales History</h2>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Locations</option>
            {locationOptions.map((loc) => (
              <option key={loc}>{loc}</option>
            ))}
          </select>

          <select
            value={soldByFilter}
            onChange={(e) => setSoldByFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Sellers</option>
            {soldByOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <table className="w-full text-sm border border-white/10">
          <thead>
            <tr className="bg-white/5">
              <th className="p-3">Item</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Price</th>
              <th className="p-3">Location</th>
              <th className="p-3">Sold By</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="border-t border-white/10">
                <td className="p-3">{sale.item_name}</td>
                <td className="p-3">{sale.quantity_sold}</td>
                <td className="p-3">₦{sale.selling_price}</td>
                <td className="p-3">{sale.location}</td>
                <td className="p-3">{sale.sold_by}</td>
                <td className="p-3">{sale.sale_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}