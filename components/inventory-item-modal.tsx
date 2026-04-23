"use client";

import { useEffect, useState } from "react";

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

type InventoryItemModalProps = {
  isOpen: boolean;
  mode: "edit" | "delete";
  item: InventoryItem | null;
  loading?: boolean;
  onClose: () => void;
  onSave?: (updatedItem: InventoryItem) => void;
  onDelete?: () => void;
};

export default function InventoryItemModal({
  isOpen,
  mode,
  item,
  loading = false,
  onClose,
  onSave,
  onDelete,
}: InventoryItemModalProps) {
  const [formData, setFormData] = useState<InventoryItem | null>(item);

  useEffect(() => {
    setFormData(item);
  }, [item]);

  if (!isOpen || !item) return null;

  function handleChange(
    field: keyof InventoryItem,
    value: string | number | null
  ) {
    if (!formData) return;

    setFormData({
      ...formData,
      [field]: value,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData && onSave) {
      onSave(formData);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-gray-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {mode === "edit" ? "Edit Inventory Item" : "Delete Inventory Item"}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {mode === "edit" ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Item Name
              </label>
              <input
                value={formData?.item_name || ""}
                onChange={(e) => handleChange("item_name", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Category
              </label>
              <input
                value={formData?.category || ""}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Cost Price
                </label>
                <input
                  type="number"
                  value={formData?.cost_price ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "cost_price",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Selling Price
                </label>
                <input
                  type="number"
                  value={formData?.selling_price ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "selling_price",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData?.quantity ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "quantity",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Stock Remaining
                </label>
                <input
                  type="number"
                  value={formData?.stock_remaining ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "stock_remaining",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Location
              </label>
              <input
                value={formData?.location || ""}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-white/10 bg-gray-900 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200 transition disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <p className="text-sm text-gray-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">{item.item_name}</span>?
            </p>
            <p className="mt-2 text-sm text-gray-500">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-white/10 bg-gray-900 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition"
              >
                Cancel
              </button>

              <button
                onClick={onDelete}
                disabled={loading}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition disabled:opacity-60"
              >
                {loading ? "Deleting..." : "Delete Item"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
