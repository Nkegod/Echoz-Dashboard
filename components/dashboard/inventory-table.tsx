import { Badge } from "@/components/ui/badge"

type Item = {
  id: number
  name: string
  category: string
  costPrice: string
  sellingPrice: string
  qty: number
  remaining: number
  location: string
  status: "In Stock" | "Low"
}

const statusStyles = {
  "In Stock":
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  Low:
    "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
}

export default function InventoryTable({ items }: { items: Item[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Item Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Cost Price</th>
              <th className="px-4 py-3 font-medium">Selling Price</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Remaining</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Location</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-white/10 transition hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                <td className="px-4 py-3 text-zinc-300">{item.category}</td>
                <td className="px-4 py-3 text-zinc-300">{item.costPrice}</td>
                <td className="px-4 py-3 text-zinc-300">{item.sellingPrice}</td>
                <td className="px-4 py-3 text-zinc-300">{item.qty}</td>
                <td className="px-4 py-3 font-medium text-white">{item.remaining}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={`rounded-full ${statusStyles[item.status]}`}
                  >
                    {item.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-zinc-300">{item.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}