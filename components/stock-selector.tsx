"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, Plus, Search, X, Loader2, RefreshCw } from "lucide-react"
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

// Import stock data from CSV
import { getAllStocks, searchStocks as searchStocksCSV, type Stock } from "@/lib/csv-stocks"
import { testCSVAccess } from "@/lib/test-csv"
import { testMobileCSVAccess, getMobileDebugInfo } from "@/lib/mobile-debug"

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
  const [allStocksData, setAllStocksData] = useState<Stock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null)

  // Cache duration: 30 minutes (stocks don't change frequently)
  const CACHE_DURATION = 30 * 60 * 1000

  // Load stocks from CSV when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedStocks(initialStocks)
      
      // Only load stocks if we don't have cached data or cache is stale
      const now = Date.now()
      const isCacheFresh = lastFetchTime && allStocksData.length > 0 && (now - lastFetchTime) < CACHE_DURATION
      
      if (!isCacheFresh) {
        console.log('Loading stocks (cache miss or stale)')
        loadStocks()
      } else {
        console.log('Using cached stocks:', allStocksData.length)
      }
    }
  }, [open, initialStocks])

  const loadStocks = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('StockSelector: Starting to load stocks...')
      console.log('User agent:', navigator.userAgent)
      console.log('Is mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      
      // Test CSV access with mobile-specific debugging
      console.log('Testing CSV access...')
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      let testResult
      if (isMobile) {
        console.log('Running mobile-specific CSV test...')
        testResult = await testMobileCSVAccess()
      } else {
        testResult = await testCSVAccess()
      }
      
      console.log('CSV test result:', testResult)
      
      if (!testResult.success) {
        console.error('CSV test failed, trying direct CSV load anyway...')
        if (isMobile && testResult.debugInfo) {
          console.log('Mobile debug info:', testResult.debugInfo)
        }
        // Don't throw error immediately, try direct load
      }
      
      console.log('Attempting to load stocks from CSV...')
      const stocks = await getAllStocks()
      console.log('StockSelector: Loaded stocks:', stocks.length)
      console.log('First few stocks:', stocks.slice(0, 3))
      
      if (stocks.length === 0) {
        throw new Error('No stocks were loaded from CSV file. Check network connection and CSV file accessibility.')
      }
      
      setAllStocksData(stocks)
      setLastFetchTime(Date.now()) // Update cache timestamp
      console.log('Stocks successfully cached for 30 minutes')
      
    } catch (error) {
      console.error('StockSelector: Error loading stocks:', error)
      console.error('Error stack:', error.stack)
      
      // More specific error messages for debugging
      let errorMessage = 'Failed to load stocks'
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error: Cannot fetch stock data. Check internet connection.'
      } else if (error.message.includes('CSV')) {
        errorMessage = 'CSV file error: Stock data file not accessible.'
      } else if (error.message.includes('parse')) {
        errorMessage = 'Data parsing error: Stock data format is invalid.'
      } else {
        errorMessage = `Loading error: ${error.message}`
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Filter stocks based on search term
  const filteredStocks = allStocksData.filter((stock) => {
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // Check if a stock is selected
  const isSelected = (stockSymbol: string) => {
    return selectedStocks.some((stock) => stock.symbol === stockSymbol)
  }

  // Toggle stock selection
  const toggleStock = (stock: Stock) => {
    if (isSelected(stock.symbol)) {
      setSelectedStocks(selectedStocks.filter((s) => s.symbol !== stock.symbol))
    } else {
      setSelectedStocks([...selectedStocks, { ...stock, allocation: 0, locked: false }])
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
      <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col bg-[#090e23] border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">Edit Stock Basket</DialogTitle>
          <DialogDescription className="text-blue-100/80">
            Select stocks to include in your sentiment analysis basket.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 flex-1 overflow-hidden">
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
              <div className="flex gap-2 flex-wrap">
                {lastFetchTime && (
                  <Button
                    onClick={() => {
                      setLastFetchTime(null) // Clear cache
                      loadStocks()
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-[#192233] border-[#0e142d] text-white hover:bg-[#1a2536] rounded-xl"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                )}
                {error && (
                  <>
                    <Button
                      onClick={loadStocks}
                      variant="outline"
                      size="sm"
                      className="bg-[#192233] border-[#0e142d] text-white hover:bg-[#1a2536] rounded-xl"
                    >
                      Retry
                    </Button>
                    <Button
                      onClick={() => {
                        // Clear all cache and force reload
                        setLastFetchTime(null)
                        setAllStocksData([])
                        setError(null)
                        setTimeout(() => loadStocks(), 100)
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-[#1e31dd] border-[#245DFF] text-white hover:bg-[#245DFF] rounded-xl"
                    >
                      Force Reload
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Card className="flex-1 overflow-hidden bg-[#090e23] border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl">
              <CardHeader className="p-4">
                <CardTitle className="text-base text-white">Available Stocks</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1 h-[400px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    <span className="ml-2 text-blue-200/60">Loading stocks...</span>
                  </div>
                ) : error ? (
                  <div className="flex flex-col justify-center items-center py-12">
                    <p className="text-red-400 mb-4">{error}</p>
                    <Button
                      onClick={loadStocks}
                      className="bg-[#1e31dd] hover:bg-[#245DFF] text-white px-6 py-2 rounded-xl transition-colors"
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#0e142d]">
                        <TableHead className="w-[80px] text-blue-200/60">Symbol</TableHead>
                        <TableHead className="text-blue-200/60">Company</TableHead>
                        <TableHead className="text-right text-blue-200/60">Price</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStocks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-blue-200/60">
                            No stocks found matching your search
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStocks.map((stock) => (
                          <TableRow key={stock.symbol} className="group border-[#0e142d] hover:bg-[#192233]/50">
                            <TableCell className="font-medium text-white">{stock.symbol}</TableCell>
                            <TableCell className="text-white">{stock.name}</TableCell>
                            <TableCell className="text-right">
                              <span className={stock.change && stock.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                                ${stock.price?.toFixed(2) || '0.00'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                className={`w-full transition-all duration-300 rounded-xl shadow-sm shadow-blue-900/20 ${
                                  isSelected(stock.symbol)
                                    ? "bg-gradient-to-b from-[#181c35] to-[#272c47] hover:from-[#1a1e37] hover:to-[#292e49] text-white hover:text-white"
                                    : "bg-gradient-to-b from-[#181c35] to-[#272c47] hover:from-[#1a1e37] hover:to-[#292e49] text-white hover:text-white"
                                }`}
                                onClick={() => toggleStock(stock)}
                              >
                                {isSelected(stock.symbol) ? "Remove" : "Add"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
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
              <ScrollArea className="h-[400px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
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
                        key={stock.symbol}
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
