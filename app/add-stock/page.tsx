"use client";

import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import DashboardShell from "@/components/dashboard-shell";
import { useAuthGuard } from "@/lib/use-auth-guard";
import LogoutButton from "@/components/logout-button";

export default function AddStockPage() {
  const { checking, profile } = useAuthGuard();

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Checking access...
      </main>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/4 p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className="text-sm text-gray-400 mb-4">
            Only admins can add stock.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition"
          >
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (submitting) return;

    const qty = Number(quantity);
    const cost = Number(costPrice);
    const selling = Number(sellingPrice);

    if (!itemName.trim()) {
      toast.error("Item name is required.");
      return;
    }

    if (!category.trim()) {
      toast.error("Category is required.");
      return;
    }

    if (!location.trim()) {
      toast.error("Location is required.");
      return;
    }

    if (qty <= 0) {
      toast.error("Quantity must be greater than 0.");
      return;
    }

    if (cost <= 0) {
      toast.error("Cost price must be greater than 0.");
      return;
    }

    if (selling <= 0) {
      toast.error("Selling price must be greater than 0.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("inventory").insert([
      {
        item_name: itemName.trim(),
        category: category.trim(),
        cost_price: cost,
        selling_price: selling,
        quantity: qty,
        stock_remaining: qty,
        location: location.trim(),
      },
    ]);

    if (error) {
      toast.error("Error adding stock: " + error.message);
      setSubmitting(false);
      return;
    }

    toast.success("Stock added successfully!");

    setItemName("");
    setCategory("");
    setCostPrice("");
    setSellingPrice("");
    setQuantity("");
    setLocation("");

    setSubmitting(false);
  }

  return (
    <DashboardShell active="add-stock" pageLabel="Add Stock">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Add Stock</h1>
          <p className="text-sm text-gray-400">
            Add new inventory items into your system
          </p>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <span className="px-3 py-1 rounded-lg bg-white/10 text-xs uppercase tracking-wide text-gray-300 border border-white/10">
              {profile.role}
            </span>
          )}
          <LogoutButton />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/4 border border-white/10 rounded-2xl p-6 space-y-5 max-w-xl"
      >
        <div>
          <label className="text-sm text-gray-400 mb-1 block">
            Item Name
          </label>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">
            Category
          </label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Cost Price
            </label>
            <input
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Selling Price
            </label>
            <input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : "Save Stock"}
        </button>
      </form>
    </DashboardShell>
  );
}