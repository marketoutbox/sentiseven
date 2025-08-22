"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Lock, Unlock } from "lucide-react"
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
  const [isMobile, setIsMobile] = useState(false)

  // Reset local stocks when the dialog opens or stocks prop changes
  useEffect(() => {
    if (open) {
      setLocalStocks(stocks.map((stock) => ({ ...stock })))
    }
  }, [stocks, open])

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#090e23] border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white text-xl font-bold">Stock Allocation</AlertDialogTitle>
          <AlertDialogDescription className="text-blue-100/80">
            Allocate percentages to each stock. Total allocation must be 100%.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge
              className={
                Math.abs(totalAllocation - 100) < 0.01
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                  : "bg-red-500/20 text-red-400 border-red-500/50"
              }
            >
              Total: {totalAllocation.toFixed(1)}%
            </Badge>
            {error && <span className="text-sm text-red-400">{error}</span>}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={resetAllocations}
              className="bg-gradient-to-b from-[#181c35] to-[#272c47] hover:from-[#1a1e37] hover:to-[#292e49] text-white hover:text-white transition-all duration-300 rounded-xl shadow-sm shadow-blue-900/20"
            >
              Set Equal
            </Button>
            <Button
              size="sm"
              onClick={distributeRemaining}
              className="bg-gradient-to-b from-[#181c35] to-[#272c47] hover:from-[#1a1e37] hover:to-[#292e49] text-white hover:text-white transition-all duration-300 rounded-xl shadow-sm shadow-blue-900/20"
            >
              Distribute
            </Button>
          </div>
        </div>

        <div className="grid gap-4 py-4">
          {localStocks.map((stock) => (
            <div key={stock.id} className="grid grid-cols-12 items-center gap-4">
              <Label htmlFor={`stock-${stock.id}`} className="col-span-3 truncate text-white font-medium">
                {stock.symbol ? (
                  <div 
                    className="cursor-pointer hover:text-blue-300 transition-colors flex items-center gap-1"
                    onClick={() => window.location.href = `/stock/${stock.symbol}`}
                  >
                    {stock.symbol}
                    <span className="text-blue-400 text-xs opacity-60">→</span>
                    {!isMobile && ` - ${stock.name}`}
                  </div>
                ) : (
                  stock.name
                )}
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
                  className="w-full bg-[#192233] border-[#0e142d] text-white rounded-xl focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
              <div className="col-span-4 pr-2">
                <Slider
                  value={[stock.allocation]}
                  max={100}
                  step={0.1}
                  onValueChange={(value) => {
                    handleAllocationChange(stock.id, value[0])
                  }}
                  className="[&>span[data-orientation='horizontal']]:bg-[#192233] [&>span[data-orientation='horizontal']>span]:bg-[#1e31dd]"
                />
              </div>
              <div className="col-span-3 flex items-center justify-end gap-2">
                {stock.locked ? <Lock className="h-4 w-4 text-blue-400" /> : <Unlock className="h-4 w-4 text-blue-200/60" />}
                <Switch 
                  checked={stock.locked} 
                  onCheckedChange={() => handleLockChange(stock.id)}
                  className="data-[state=unchecked]:bg-gradient-to-br data-[state=unchecked]:from-[#040517] data-[state=unchecked]:to-[#030514] data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[#040517] data-[state=checked]:to-[#030514] border-[#030514]/60 [&>span]:data-[state=unchecked]:bg-[#192233] [&>span]:data-[state=checked]:bg-[#1e31dd]"
                />
              </div>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-[#192233] border-[#0e142d] text-white hover:bg-[#1a2536] rounded-xl">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSave}
            disabled={Math.abs(totalAllocation - 100) > 0.01}
            className="bg-[#1e31dd] hover:bg-[#245DFF] text-white hover:text-white transition-all duration-300 rounded-xl px-4 shadow-sm shadow-blue-900/20 disabled:bg-[#192233] disabled:text-blue-200/60"
          >
            Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default StockAllocation
