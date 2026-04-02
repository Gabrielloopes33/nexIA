"use client"

import { ChevronDown, Package } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useProductSelection } from "@/hooks/use-product-selection"

export function ProductSwitcher({ className }: { className?: string }) {
  const { productId, products, isLoadingProducts, switchProduct } = useProductSelection()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedProduct = products.find((p) => p.id === productId)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (isLoadingProducts || products.length <= 1) {
    return null
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted/50 transition-colors w-[110px] justify-between"
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: selectedProduct?.color || "#6366f1" }}
        />
        <span className="flex-1 truncate text-left">{selectedProduct?.name || "Selecionar produto"}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg border border-border bg-white py-1 shadow-lg">
          <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Produtos</div>
          <div className="max-h-64 overflow-y-auto">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  switchProduct(product.id)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  product.id === productId && "bg-[#46347F]/5 font-medium text-[#46347F]"
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: product.color || "#6366f1" }}
                />
                <span className="flex-1 truncate">{product.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
