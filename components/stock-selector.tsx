"use client"

import { useState, useEffect, useRef } from "react"
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
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Reset selected stocks when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedStocks(initialStocks)
      setSearchTerm("") // Clear search when opening
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

  // Show all stocks when no search term, otherwise show filtered results
  const displayStocks = filteredStocks

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
      <DialogContent className="max-w-6xl h-[100dvh] sm:h-[90vh] sm:max-h-[90vh] w-[100vw] sm:w-[90vw] flex flex-col bg-card border-border p-0 sm:p-6">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-0">
          <DialogTitle className="text-card-foreground">Edit Stock Basket</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select stocks to include in your sentiment analysis basket.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-3 sm:gap-6 flex-1 overflow-hidden min-h-0 p-4 sm:p-0">
          {/* Left side - Available stocks */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3 sm:mb-4 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search by symbol or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  autoComplete="off"
                  inputMode="none"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-1 bg-background border-border text-foreground hover:bg-accent whitespace-nowrap"
                  >
                    {sectorFilter || "All Sectors"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 bg-popover border-border" align="end">
                  <Command className="bg-popover">
                    <CommandList>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => setSectorFilter(null)}
                          className="flex items-center gap-2 text-popover-foreground hover:bg-accent"
                        >
                          {!sectorFilter && <Check className="h-4 w-4" />}
                          <span className={!sectorFilter ? "font-medium" : ""}>All Sectors</span>
                        </CommandItem>
                        {sectors.map((sector) => (
                          <CommandItem
                            key={sector}
                            onSelect={() => setSectorFilter(sector)}
                            className="flex items-center gap-2 text-popover-foreground hover:bg-accent"
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

            <Card className="flex-1 overflow-hidden bg-card border-border min-h-0">
              <CardHeader className="p-3 sm:p-4 flex-shrink-0 border-b border-border">
                <CardTitle className="text-sm sm:text-base text-card-foreground">
                  Available Stocks ({searchTerm ? filteredStocks.length : allStocks.length})
                </CardTitle>
              </CardHeader>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-[300px] sm:h-[350px] lg:h-[400px]">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10 border-b border-border">
                        <TableRow className="border-border">
                          <TableHead className="w-[60px] sm:w-[80px] text-muted-foreground text-xs sm:text-sm font-medium">Symbol</TableHead>
                          <TableHead className="text-muted-foreground text-xs sm:text-sm min-w-[120px] font-medium">Name</TableHead>
                          <TableHead className="hidden sm:table-cell text-muted-foreground text-xs sm:text-sm font-medium">Sector</TableHead>
                          <TableHead className="text-right text-muted-foreground text-xs sm:text-sm w-[80px] sm:w-[90px] font-medium">Price</TableHead>
                          <TableHead className="w-[70px] sm:w-[90px] text-center text-muted-foreground text-xs sm:text-sm font-medium">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayStocks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              {searchTerm ? 'No stocks found matching your search criteria' : 'No stocks available'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayStocks.map((stock) => (
                            <TableRow key={stock.id} className="group border-border hover:bg-accent/50">
                              <TableCell className="font-medium text-card-foreground text-xs sm:text-sm py-3">
                                {stock.symbol}
                              </TableCell>
                              <TableCell className="text-card-foreground text-xs sm:text-sm py-3">
                                <div className="truncate max-w-[120px] sm:max-w-none" title={stock.name}>
                                  {stock.name}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-muted-foreground text-xs sm:text-sm py-3">
                                <div className="truncate max-w-[100px]" title={stock.sector}>
                                  {stock.sector}
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-3">
                                <div className="flex flex-col items-end">
                                  <span className={`font-medium text-xs sm:text-sm ${stock.change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    ${stock.price.toFixed(2)}
                                  </span>
                                  <span className={`text-xs ${stock.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {stock.change >= 0 ? '+' : ''}{stock.change}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <Button
                                  variant={isSelected(stock.id) ? "default" : "outline"}
                                  size="sm"
                                  className={`w-full text-xs px-2 h-7 sm:h-8 ${
                                    isSelected(stock.id)
                                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                      : "bg-background border-border text-foreground hover:bg-accent"
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
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>

          {/* Right side - Selected stocks */}
          <div className="w-full lg:w-[280px] xl:w-[320px] flex flex-col min-h-0">
            <Card className="flex-1 bg-card border-border overflow-hidden min-h-0">
              <CardHeader className="p-3 sm:p-4 flex-shrink-0 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base text-card-foreground">Selected Stocks</CardTitle>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    {selectedStocks.length}
                  </Badge>
                </div>
              </CardHeader>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-[200px] sm:h-[250px] lg:h-[400px]">
                  {selectedStocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-4 text-center text-muted-foreground h-full">
                      <div className="rounded-full bg-muted p-3 mb-3">
                        <Plus className="h-6 w-6" />
                      </div>
                      <p className="text-sm sm:text-base">No stocks selected</p>
                      <p className="text-xs sm:text-sm">Add stocks from the list on the left</p>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-4 space-y-2">
                      {selectedStocks.map((stock) => (
                        <div
                          key={stock.id}
                          className="flex items-center justify-between p-2 sm:p-3 rounded-md bg-accent hover:bg-accent/80 group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-card-foreground text-sm sm:text-base">{stock.symbol}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground truncate" title={stock.name}>
                              {stock.name}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7 opacity-50 group-hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-muted flex-shrink-0 ml-2"
                            onClick={() => toggleStock(stock)}
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </Card>
          </div>
        </div>

        <DialogFooter className="mt-3 sm:mt-6 flex-shrink-0 flex flex-col sm:flex-row gap-2 p-4 sm:p-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-background border-border text-foreground hover:bg-accent w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedStocks.length === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
          >
            Save Changes ({selectedStocks.length} stocks)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
