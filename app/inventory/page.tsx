"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import DashboardShell from "@/components/dashboard-shell";
import InventoryItemModal from "@/components/inventory-item-modal";
import { useAuthGuard } from "@/lib/use-auth-guard";

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

export default function InventoryPage() {
  const { checking, profile } = useAuthGuard();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalMode, setModalMode] = useState<"edit" | "delete" | null>(null);

  async function fetchInventory() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("item_name", { ascending: true });

    if (error) {
      setError(error.message);
      setInventory([]);
    } else {
      setInventory(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchInventory();

    const inventoryChannel = supabase
      .channel("inventory-page-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory" },
        async () => {
          await fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inventoryChannel);
    };
  }, []);

  const filteredInventory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return inventory;

    return inventory.filter((item) => {
      const itemName = item.item_name?.toLowerCase() || "";
      const category = item.category?.toLowerCase() || "";
      const location = item.location?.toLowerCase() || "";

      return (
        itemName.includes(term) ||
        category.includes(term) ||
        location.includes(term)
      );
    });
  }, [inventory, searchTerm]);

  const totalItems = inventory.length;

  const totalStock = inventory.reduce(
    (sum, item) => sum + Number(item.stock_remaining || 0),
    0
  );

  const lowStockItems = inventory.filter(
    (item) =>
      Number(item.stock_remaining || 0) > 0 &&
      Number(item.stock_remaining || 0) <= 5
  ).length;

  const outOfStockItems = inventory.filter(
    (item) => Number(item.stock_remaining || 0) === 0
  ).length;

  function openEditModal(item: InventoryItem) {
    setSelectedItem(item);
    setModalMode("edit");
  }

  function openDeleteModal(item: InventoryItem) {
    setSelectedItem(item);
    setModalMode("delete");
  }

  function closeModal() {
    setSelectedItem(null);
    setModalMode(null);
  }

  async function handleSave(updatedItem: InventoryItem) {
    setActionLoading(true);

    const { error } = await supabase
      .from("inventory")
      .update({
        item_name: updatedItem.item_name,
        category: updatedItem.category,
        cost_price: updatedItem.cost_price,
        selling_price: updatedItem.selling_price,
        quantity: updatedItem.quantity,
        stock_remaining: updatedItem.stock_remaining,
        location: updatedItem.location,
      })
      .eq("id", updatedItem.id);

    if (error) {
      toast.error("Failed to update item: " + error.message);
      setActionLoading(false);
      return;
    }

    toast.success("Inventory item updated successfully.");
    closeModal();
    await fetchInventory();
    setActionLoading(false);
  }

  async function handleDelete() {
    if (!selectedItem) return;

    setActionLoading(true);

    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", selectedItem.id);

    if (error) {
      toast.error("Failed to delete item: " + error.message);
      setActionLoading(false);
      return;
    }

    toast.success("Inventory item deleted successfully.");
    closeModal();
    await fetchInventory();
    setActionLoading(false);
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-400 bg-gray-950">
        Checking access...
      </main>
    );
  }

  if (error) {
    return (
      <DashboardShell active="inventory" pageLabel="Inventory">
        <div className="space-y-4">
          <p className="text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-sm">
            Error loading inventory: {error}
          </p>

          <button
            onClick={fetchInventory}
            className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-gray-200 transition"
          >
            Retry
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell active="inventory" pageLabel="Inventory">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            View and manage all stock items across locations.
          </p>
        </div>

        <div className="hidden md:block">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search item, category, location..."
            className="w-72 bg-gray-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-white/20"
          />
        </div>
      </div>

      <div className="md:hidden mb-4">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search item, category, location..."
          className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-white/20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
            Total Items
          </p>
          <p className="text-2xl font-semibold text-white">
            {totalItems.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-1">Recorded products</p>
        </div>

        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
            Total Stock
          </p>
          <p className="text-2xl font-semibold text-emerald-400">
            {totalStock.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-1">Units available</p>
        </div>

        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
            Low Stock
          </p>
          <p className="text-2xl font-semibold text-yellow-400">
            {lowStockItems}
          </p>
          <p className="text-xs text-gray-600 mt-1">Need attention</p>
        </div>

        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
            Out of Stock
          </p>
          <p className="text-2xl font-semibold text-red-400">
            {outOfStockItems}
          </p>
          <p className="text-xs text-gray-600 mt-1">Unavailable items</p>
        </div>
      </div>

      <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden flex-1">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-200">
              Inventory List
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Current items and stock status
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {filteredInventory.length} item
              {filteredInventory.length !== 1 ? "s" : ""}
            </span>

            <button
              onClick={fetchInventory}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-gray-900 text-gray-300 border border-white/10 hover:bg-gray-800 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/3">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Stock Remaining
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-gray-500 text-sm"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredInventory.length > 0 ? (
                filteredInventory.map((item) => {
                  const remaining = Number(item.stock_remaining || 0);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-100">
                        {item.item_name}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {item.category || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        ₦{Number(item.cost_price || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        ₦{Number(item.selling_price || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {item.quantity ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-200">
                        {remaining}
                      </td>
                      <td className="px-4 py-3">
                        {remaining > 5 ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                            In Stock
                          </span>
                        ) : remaining > 0 ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium border border-red-500/20 bg-red-500/10 text-red-400">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.location || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {profile?.role === "admin" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="rounded-lg border border-white/10 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800 transition"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => openDeleteModal(item)}
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-gray-500 text-sm"
                  >
                    No matching inventory found.
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

      <InventoryItemModal
        isOpen={modalMode !== null}
        mode={modalMode || "edit"}
        item={selectedItem}
        loading={actionLoading}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </DashboardShell>
  );
}