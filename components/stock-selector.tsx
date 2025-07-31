"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, Plus, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Import stock data from the separate file
import { allStocks, getSectors } from "@/data/stocks"

// Get all sectors
const sectors = getSectors()

export function StockSelector({
  open,
  onOpenChange,
  initialStocks = [],
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStocks: any[]
  onSave: (stocks: any[]) => void
}) {
  const [selectedStocks, setSelectedStocks] = useState(initialStocks)
  const [searchTerm, setSearchTerm] = useState("")
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)

  // Reset selected stocks when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedStocks(initialStocks)
    }
  }, [open, initialStocks])

  // Filter stocks based on search term and sector
  const filteredStocks = allStocks.filter((stock) => {
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSector = !sectorFilter || stock.sector === sectorFilter

    return matchesSearch && matchesSector
  })

  // Check if a stock is selected
  const isSelected = (stockId: number) => {
    return selectedStocks.some((stock) => stock.id === stockId)
  }

  // Toggle stock selection
  const toggleStock = (stock) => {
    if (isSelected(stock.id)) {
      setSelectedStocks(selectedStocks.filter((s) => s.id !== stock.id))
    } else {
      setSelectedStocks([...selectedStocks, stock])
    }
  }

  // Function to handle saving
  const handleSave = () => {
    // Ensure all selected stocks have valid properties
    const stocksToSave = selectedStocks.map((stock) => ({
      ...stock,
      allocation: stock.allocation || Math.floor(100 / selectedStocks.length), // Default allocation if not set
      locked: stock.locked || false, // Default to unlocked if not set
    }))

    onSave(stocksToSave)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-[#090e23] border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">Edit Stock Basket</DialogTitle>
          <DialogDescription className="text-blue-100/80">
            Select stocks to include in your sentiment analysis basket.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
          {/* Left side - Available stocks */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-200/60" />
                <Input
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#192233] border-[#0e142d] text-white placeholder:text-blue-200/60 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-1 bg-[#192233] border-[#0e142d] text-white hover:bg-[#1a2536] rounded-xl"
                  >
                    {sectorFilter || "All Sectors"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 bg-[#090e23] border-[#0e142d] rounded-xl" align="end">
                  <Command className="bg-[#090e23]">
                    <CommandList>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => setSectorFilter(null)}
                          className="flex items-center gap-2 text-white hover:bg-[#192233]"
                        >
                          {!sectorFilter && <Check className="h-4 w-4" />}
                          <span className={!sectorFilter ? "font-medium" : ""}>All Sectors</span>
                        </CommandItem>
                        {sectors.map((sector) => (
                          <CommandItem
                            key={sector}
                            onSelect={() => setSectorFilter(sector)}
                            className="flex items-center gap-2 text-white hover:bg-[#192233]"
                          >
                            {sectorFilter === sector && <Check className="h-4 w-4" />}
                            <span className={sectorFilter === sector ? "font-medium" : ""}>{sector}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Card className="flex-1 overflow-hidden bg-[#090e23] border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl">
              <CardHeader className="p-4">
                <CardTitle className="text-base text-white">Available Stocks</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1 h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#0e142d]">
                      <TableHead className="w-[80px] text-blue-200/60">Symbol</TableHead>
                      <TableHead className="text-blue-200/60">Name</TableHead>
                      <TableHead className="hidden md:table-cell text-blue-200/60">Sector</TableHead>
                      <TableHead className="text-right text-blue-200/60">Price</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-blue-200/60">
                          No stocks found matching your criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStocks.map((stock) => (
                        <TableRow key={stock.id} className="group border-[#0e142d] hover:bg-[#192233]/50">
                          <TableCell className="font-medium text-white">{stock.symbol}</TableCell>
                          <TableCell className="text-white">{stock.name}</TableCell>
                          <TableCell className="hidden md:table-cell text-blue-200/60">{stock.sector}</TableCell>
                          <TableCell className="text-right">
                            <span className={stock.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                              ${stock.price.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className={`w-full transition-all duration-300 rounded-xl shadow-sm shadow-blue-900/20 ${
                                isSelected(stock.id)
                                  ? "bg-gradient-to-b from-[#181c35] to-[#272c47] hover:from-[#1a1e37] hover:to-[#292e49] text-white hover:text-white"
                                  : "bg-gradient-to-b from-[#181c35] to-[#272c47] hover:from-[#1a1e37] hover:to-[#292e49] text-white hover:text-white"
                              }`}
                              onClick={() => toggleStock(stock)}
                            >
                              {isSelected(stock.id) ? "Remove" : "Add"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </div>

          {/* Right side - Selected stocks */}
          <div className="w-full md:w-[300px] flex flex-col">
            <Card className="flex-1 bg-[#090e23] border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-white">Selected Stocks</CardTitle>
                  <Badge variant="secondary" className="bg-[#192233] text-white border-[#0e142d]">
                    {selectedStocks.length}
                  </Badge>
                </div>
              </CardHeader>
              <ScrollArea className="h-[300px]">
                {selectedStocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-blue-200/60">
                    <div className="rounded-full bg-[#192233] p-3 mb-3">
                      <Plus className="h-6 w-6" />
                    </div>
                    <p>No stocks selected</p>
                    <p className="text-sm">Add stocks from the list on the left</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {selectedStocks.map((stock) => (
                      <div
                        key={stock.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-[#040517] to-[#030514] border border-[#030514]/60 hover:border-blue-500/60 transition-all duration-300 group hover:shadow-lg hover:shadow-[#030516]/40"
                      >
                        <div>
                          <div className="font-medium text-white">{stock.symbol}</div>
                          <div className="text-xs text-blue-200/60">{stock.name}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-50 group-hover:opacity-100 text-blue-200/60 hover:text-white hover:bg-[#192233]"
                          onClick={() => toggleStock(stock)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-[#192233] border-[#0e142d] text-white hover:bg-[#1a2536] rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedStocks.length === 0}
            className="bg-[#1e31dd] hover:bg-[#245DFF] text-white hover:text-white transition-all duration-300 rounded-xl px-4 shadow-sm shadow-blue-900/20"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
