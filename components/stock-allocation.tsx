"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Stock {
  id: string | number
  symbol?: string
  name: string
  allocation: number
  locked: boolean
}

interface StockAllocationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stocks: Stock[]
  onSave: (stocks: Stock[]) => void
  onAllocationChange?: (stockId: string | number, newAllocation: number) => void
  onToggleLock?: (stockId: string | number) => void
}

const StockAllocation: React.FC<StockAllocationProps> = ({
  open,
  onOpenChange,
  stocks,
  onSave,
  onAllocationChange,
  onToggleLock,
}) => {
  const [localStocks, setLocalStocks] = useState<Stock[]>([])
  const [totalAllocation, setTotalAllocation] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  // Reset local stocks when the dialog opens or stocks prop changes
  useEffect(() => {
    if (open) {
      setLocalStocks(stocks.map((stock) => ({ ...stock })))
    }
  }, [stocks, open])

  // Calculate total allocation whenever local stocks change
  useEffect(() => {
    const total = localStocks.reduce((sum, stock) => sum + stock.allocation, 0)
    setTotalAllocation(total)

    // Clear error if total is 100%
    if (Math.abs(total - 100) < 0.01) {
      setError(null)
    } else {
      setError(`Total allocation must be 100%. Current total: ${total.toFixed(1)}%`)
    }
  }, [localStocks])

  const handleAllocationChange = (id: string | number, allocation: number) => {
    // Ensure allocation is not negative
    const newAllocation = Math.max(0, allocation)

    setLocalStocks((prevStocks) => {
      // Create a copy of the stocks
      const updatedStocks = prevStocks.map((stock) =>
        stock.id === id ? { ...stock, allocation: newAllocation } : stock,
      )

      return updatedStocks
    })
  }

  const handleLockChange = (id: string | number) => {
    setLocalStocks((prevStocks) =>
      prevStocks.map((stock) => (stock.id === id ? { ...stock, locked: !stock.locked } : stock)),
    )
  }

  // Distribute remaining allocation to reach 100%
  const distributeRemaining = () => {
    // Find unlocked stocks
    const unlockedStocks = localStocks.filter((stock) => !stock.locked)

    if (unlockedStocks.length === 0) {
      setError("Cannot adjust allocations - all stocks are locked")
      return
    }

    // Calculate how much allocation is needed to reach 100%
    const remaining = 100 - totalAllocation

    // Distribute evenly among unlocked stocks
    const distributionPerStock = remaining / unlockedStocks.length

    setLocalStocks((prevStocks) =>
      prevStocks.map((stock) =>
        !stock.locked ? { ...stock, allocation: stock.allocation + distributionPerStock } : stock,
      ),
    )
  }

  // Reset allocations to be equal among unlocked stocks
  const resetAllocations = () => {
    // Calculate total allocation of locked stocks
    const lockedStocks = localStocks.filter((stock) => stock.locked)
    const lockedAllocation = lockedStocks.reduce((sum, stock) => sum + stock.allocation, 0)

    // Calculate number of unlocked stocks
    const unlockedStocks = localStocks.filter((stock) => !stock.locked)
    const unlockedCount = unlockedStocks.length

    if (unlockedCount === 0) {
      setError("Cannot reset allocations - all stocks are locked")
      return
    }

    // Calculate equal distribution for unlocked stocks
    const remainingAllocation = 100 - lockedAllocation
    const equalAllocation = remainingAllocation / unlockedCount

    setLocalStocks((prevStocks) =>
      prevStocks.map((stock) => (!stock.locked ? { ...stock, allocation: equalAllocation } : stock)),
    )
  }

  // Handle save
  const handleSave = () => {
    // Round all allocations to integers
    const stocksToSave = localStocks.map((stock) => ({
      ...stock,
      allocation: Math.round(stock.allocation),
    }))

    // Calculate the total after rounding
    const roundedTotal = stocksToSave.reduce((sum, stock) => sum + stock.allocation, 0)

    // Adjust for rounding errors to ensure total is exactly 100%
    if (roundedTotal !== 100) {
      // Find unlocked stocks
      const unlockedStocks = stocksToSave.filter((stock) => !stock.locked)

      if (unlockedStocks.length > 0) {
        // Adjust the first unlocked stock
        const firstUnlockedStock = stocksToSave.find((stock) => !stock.locked)
        if (firstUnlockedStock) {
          firstUnlockedStock.allocation += 100 - roundedTotal
        }
      } else {
        // If all stocks are locked, we can't adjust to 100%
        setError("Cannot adjust allocations to 100% because all stocks are locked.")
        return
      }
    }

    onSave(stocksToSave)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-card-foreground">Stock Allocation</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Allocate percentages to each stock. Total allocation must be 100%.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge
              className={
                Math.abs(totalAllocation - 100) < 0.01
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }
            >
              Total: {totalAllocation.toFixed(1)}%
            </Badge>
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={resetAllocations}
              className="bg-background text-foreground border-border hover:bg-accent"
            >
              Reset Equal
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={distributeRemaining}
              className="bg-background text-foreground border-border hover:bg-accent"
            >
              Distribute Remaining
            </Button>
          </div>
        </div>

        <div className="grid gap-4 py-4">
          {localStocks.map((stock) => (
            <div key={stock.id} className="grid grid-cols-12 items-center gap-3">
              <Label htmlFor={`stock-${stock.id}`} className="col-span-3 truncate text-foreground">
                {stock.symbol ? `${stock.symbol} - ${stock.name}` : stock.name}
              </Label>
              <div className="col-span-2">
                <Input
                  type="number"
                  id={`stock-${stock.id}`}
                  value={stock.allocation}
                  onChange={(e) => {
                    const newAllocation = Number.parseFloat(e.target.value)
                    if (!isNaN(newAllocation)) {
                      handleAllocationChange(stock.id, newAllocation)
                    }
                  }}
                  className="w-full bg-background border-border text-foreground"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
              <div className="col-span-4 px-2">
                <Slider
                  value={[stock.allocation]}
                  max={100}
                  step={0.1}
                  onValueChange={(value) => {
                    handleAllocationChange(stock.id, value[0])
                  }}
                  className="w-full"
                />
              </div>
              <div className="col-span-3 flex items-center justify-end gap-2 pl-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{stock.locked ? "Locked" : "Unlocked"}</span>
                <Switch checked={stock.locked} onCheckedChange={() => handleLockChange(stock.id)} />
              </div>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-background text-foreground border-border hover:bg-accent">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSave}
            disabled={Math.abs(totalAllocation - 100) > 0.01}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted"
          >
            Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default StockAllocation
