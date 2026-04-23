"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Package } from "lucide-react"

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock"

interface StockItem {
  id: string
  name: string
  remaining: number
  status: StockStatus
}

interface StockTableProps {
  items: StockItem[]
}

function getStatusStyles(status: StockStatus) {
  switch (status) {
    case "In Stock":
      return "bg-success/15 text-success border-success/20"
    case "Low Stock":
      return "bg-warning/15 text-warning border-warning/20"
    case "Out of Stock":
      return "bg-danger/15 text-danger border-danger/20"
  }
}

export function StockTable({ items }: StockTableProps) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">Stock Overview</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Item</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Remaining</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="border-border/30 hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {item.remaining.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        getStatusStyles(item.status)
                      )}
                    >
                      {item.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
