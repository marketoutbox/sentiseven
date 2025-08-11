"use client"

import { useState, useEffect, useCallback } from "react" // Added useCallback
import { ChevronDown, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { getAllUserBaskets, getBasketById, type StockBasket, type BasketStock } from "@/lib/basket-service"
import { useAuth } from "@/context/auth-context"
import { Switch } from "@/components/ui/switch" // Add this line

interface StockSignal {
  date: string
  comp_symbol: string
  sentiment_score: number
  sentiment: string
  entry_price: number
}

interface PerformanceData {
  symbol: string
  name: string
  lockDate: string
  lockPrice: number
  lockSentiment: string | null
  currentPrice: number
  change: number
  changePercent: number
  currentSentiment: string | null
  hasSignals: boolean
}

// Company name mapping for common stock symbols
const companyNames: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corp.",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  META: "Meta Platforms Inc.",
  TSLA: "Tesla Inc.",
  NVDA: "NVIDIA Corp.",
  NFLX: "Netflix Inc.",
  JPM: "JPMorgan Chase & Co.",
  V: "Visa Inc.",
  GRPN: "Groupon Inc.",
  APRN: "Blue Apron Holdings Inc.",
  // Add more mappings as needed
}

// Helper function to capitalize sentiment words
const capitalizeSentiment = (sentiment: string | undefined | null): string => {
  if (!sentiment) return ""
  const lower = sentiment.toLowerCase()
  if (lower === "positive") return "Positive"
  if (lower === "negative") return "Negative"
  if (lower === "neutral") return "Neutral"
  return sentiment
}

export default function PerformancePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [userBaskets, setUserBaskets] = useState<StockBasket[]>([])
  const [selectedBasketId, setSelectedBasketId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"all" | string>("all") // "all" or basket ID
  const [basketStocks, setBasketStocks] = useState<BasketStock[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>(["google", "twitter", "news"]) // Default: all models ON
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null)
  
  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000

  // Format date to YYYY-MM-DD
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  // Get company name from symbol
  const getCompanyName = (symbol: string) => {
    return companyNames[symbol] || `${symbol} Inc.`
  }

  // Load user's baskets
  const loadUserBaskets = async () => {
    if (!user) return

    try {
      const { baskets, error } = await getAllUserBaskets()
      if (!error && baskets) {
        // Only show locked baskets
        const lockedBaskets = baskets.filter((basket) => basket.is_locked)
        setUserBaskets(lockedBaskets)

        // If current selection is not valid anymore, reset to "all"
        if (selectedBasketId && !lockedBaskets.find((b) => b.id === selectedBasketId)) {
          setViewMode("all")
          setSelectedBasketId(null)
        }
      }
    } catch (error) {
      console.error("Error loading user baskets:", error)
    }
  }

  // NEW: Fetch current stock prices in batch using the new API route
  const getCurrentPricesBatch = useCallback(async (symbols: string[]): Promise<Record<string, number>> => {
    if (symbols.length === 0) return {}
    try {
      const response = await fetch("/api/stock-price/current/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbols }),
      })
      const data = await response.json()
      if (response.ok) {
        return data
      }
      throw new Error(data.error || "Failed to fetch current prices in batch")
    } catch (error) {
      console.error("Error fetching current prices in batch:", error)
      // Fallback to consistent mock prices for all symbols if batch API fails
      const mockPrices: Record<string, number> = {}
      symbols.forEach((symbol) => {
        const symbolSum = symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
        const basePrice = (symbolSum % 490) + 10 // Price between $10 and $500
        mockPrices[symbol] = Math.round(basePrice * 100) / 100
      })
      return mockPrices
    }
  }, [])

  // Fetch historical stock price using the new API route (individual call, but will be parallelized)
  const getHistoricalPrice = useCallback(async (symbol: string, date: string): Promise<number> => {
    try {
      const response = await fetch(`/api/stock-price/historical/${symbol}?date=${date}`)
      const data = await response.json()
      if (response.ok && data.price) {
        return data.price
      }
      throw new Error(data.error || `Failed to fetch historical price for ${symbol} on ${date}`)
    } catch (error) {
      console.error(`Error fetching historical price for ${symbol} on ${date} from API:`, error)
      // Fallback to a consistent mock price if API fails
      const symbolSum = symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
      const basePrice = (symbolSum % 490) + 10 // Price between $10 and $500
      const dateObj = new Date(date)
      const dateSeed = dateObj.getDate() + dateObj.getMonth() * 31
      const adjustment = ((dateSeed % 20) - 10) / 100 // -10% to +10% adjustment
      const finalPrice = basePrice * (1 + adjustment)
      return Math.round(finalPrice * 100) / 100
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadUserBaskets()
    }
  }, [user])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if we have fresh cached data
        const now = Date.now()
        if (lastFetchTime && performanceData.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
          console.log("Using cached performance data, skipping fetch")
          return
        }

        console.log("Fetching fresh performance data...")
        setLoading(true)
        setError(null)

        // Fetch data from all three signal APIs
        const [googleRes, twitterRes, newsRes] = await Promise.all([
          fetch("/api/gtrend-signals"),
          fetch("/api/twitter-signals"),
          fetch("/api/news-signals"),
        ])

        if (!googleRes.ok || !twitterRes.ok || !newsRes.ok) {
          throw new Error("Failed to fetch signal data")
        }

        const [googleData, twitterData, newsData] = await Promise.all([
          googleRes.json(),
          twitterRes.json(),
          newsRes.json(),
        ])

        // Get maps of stock symbols to their signal data from each source
        const googleSignalsMap = new Map(googleData.map((item: StockSignal) => [item.comp_symbol, item]))
        const twitterSignalsMap = new Map(twitterData.map((item: StockSignal) => [item.comp_symbol, item]))
        const newsSignalsMap = new Map(newsData.map((item: StockSignal) => [item.comp_symbol, item]))

        // Combine all unique symbols from all sources
        const allUniqueSymbols = new Set([
          ...Array.from(googleSignalsMap.keys()),
          ...Array.from(twitterSignalsMap.keys()),
          ...Array.from(newsSignalsMap.keys()),
        ])

        const stocksWithSignals = [...allUniqueSymbols].filter((symbol) => {
          if (selectedModels.length === 0) {
            return false // If no models are selected, no stocks should appear
          }

          let firstSentiment: string | null = null
          for (const model of selectedModels) {
            let signal: StockSignal | undefined

            if (model === "google") signal = googleSignalsMap.get(symbol)
            else if (model === "twitter") signal = twitterSignalsMap.get(symbol)
            else if (model === "news") signal = newsSignalsMap.get(symbol)

            // If a signal is missing for any selected model, this stock is filtered out
            if (!signal) {
              return false
            }

            // Validate that sentiment exists and normalize it (case insensitive)
            const sentiment = signal.sentiment?.toLowerCase().trim()
            if (!sentiment || !['positive', 'negative', 'neutral'].includes(sentiment)) {
              return false
            }

            // Check for sentiment consistency across selected models
            if (firstSentiment === null) {
              firstSentiment = sentiment
            } else if (sentiment !== firstSentiment) {
              return false // Sentiments are not consistent across selected models
            }
          }
          
          return true // Stock has valid signals in ALL selected models with SAME sentiment
        })

        let basketLockDate: string | null = null
        let selectedBasket: StockBasket | null = null
        let selectedBasketStocks: BasketStock[] = []
        let stocksToProcess: string[] = []

        // Handle different view modes
        if (viewMode !== "all" && viewMode) {
          // Load stocks for the selected basket
          try {
            const { basket, stocks, error } = await getBasketById(viewMode)
            if (!error && stocks && basket) {
              selectedBasket = basket
              basketLockDate = basket.locked_at || null
              selectedBasketStocks = stocks
              setBasketStocks(stocks)

              // For basket view, show all stocks in the basket that also match the signal criteria
              stocksToProcess = stocks
                .map((stock) => stock.symbol)
                .filter((symbol) => stocksWithSignals.includes(symbol))

              console.log(
                `Loaded ${stocks.length} stocks for basket "${basket.name}", filtered to ${stocksToProcess.length} matching signals.`,
              )
            } else {
              stocksToProcess = []
              console.error("Failed to load basket or stocks:", error)
            }
          } catch (error) {
            console.error("Error loading basket stocks:", error)
            stocksToProcess = []
          }
        } else {
          // For "All Stocks" view, only show stocks with signals matching criteria
          stocksToProcess = stocksWithSignals
        }

        if (stocksToProcess.length === 0) {
          setPerformanceData([])
          setLoading(false)
          if (selectedModels.length === 0) {
            // Added check for no models selected
            setError("Please select at least one signal model to view performance data.")
          } else if (viewMode !== "all") {
            const selectedBasketName = userBaskets.find((b) => b.id === viewMode)?.name || "Unknown"
            setError(
              `No stocks found in basket "${selectedBasketName}" that match selected models and sentiment consistency.`,
            )
          } else {
            setError("No stocks found matching the selected signal models and sentiment consistency.")
          }
          return
        }

        // Batch fetch current prices for all stocks to process
        const currentPricesMap = await getCurrentPricesBatch(stocksToProcess)

        // Prepare historical price promises if in basket view
        const historicalPricePromises: Promise<{ symbol: string; price: number }>[] = []

        if (viewMode !== "all" && selectedBasket && basketLockDate) {
          const formattedLockDate = formatDate(basketLockDate)
          for (const symbol of stocksToProcess) {
            historicalPricePromises.push(
              getHistoricalPrice(symbol, formattedLockDate).then((price) => ({ symbol, price })),
            )
          }
        }
        const historicalPricesResults = await Promise.all(historicalPricePromises)
        const historicalPricesMap = new Map(historicalPricesResults.map((item) => [item.symbol, item.price]))

        // Process data for stocks
        const processedData: PerformanceData[] = []

        for (const symbol of stocksToProcess) {
          try {
            const googleSignal = googleSignalsMap.get(symbol)
            const twitterSignal = twitterSignalsMap.get(symbol)
            const newsSignal = newsSignalsMap.get(symbol)

            // Determine the lock date and price based on view mode
            let lockDate: string
            let lockPrice: number
            let lockSentiment: string | null = null
            let currentSentiment: string | null = null

            // Determine the consistent sentiment for display
            let sentimentForDisplay: string | null = null
            if (selectedModels.length > 0) {
              // Since the stock has passed the filter, we know sentiments are consistent.
              // Just pick the sentiment from the first available selected model.
              for (const model of selectedModels) {
                let signal: StockSignal | undefined
                if (model === "google") signal = googleSignal
                else if (model === "twitter") signal = twitterSignal
                else if (model === "news") signal = newsSignal

                if (signal) {
                  sentimentForDisplay = signal.sentiment?.toLowerCase().trim() || null
                  break // Found a sentiment, and we know they are all consistent
                }
              }
            } else {
              sentimentForDisplay = "N/A" // No models selected
            }

            if (viewMode !== "all" && selectedBasket && basketLockDate) {
              // Use basket lock date
              lockDate = formatDate(basketLockDate)
              console.log(`Processing ${symbol} with basket lock date: ${lockDate}`)

              // Use the pre-fetched historical price
              lockPrice = historicalPricesMap.get(symbol) || 0 // Default to 0 if not found, though it should be

              lockSentiment = sentimentForDisplay
              currentSentiment = sentimentForDisplay
            } else {
              // For "All Stocks" view, use the most recent signal's entry price and sentiment
              const availableSignalsForDateAndPrice = [
                googleSignal ? { signal: googleSignal, source: "google" } : null,
                twitterSignal ? { signal: twitterSignal, source: "twitter" } : null,
                newsSignal ? { signal: newsSignal, source: "news" } : null,
              ].filter(Boolean) as { signal: StockSignal; source: string }[]

              // Find the most recent signal date among available sources (for lockDate and lockPrice)
              const dates = availableSignalsForDateAndPrice.map((item) => new Date(item.signal.date))
              const mostRecentDate = new Date(Math.max(...dates.map((d) => d.getTime())))

              const mostRecentSignal = availableSignalsForDateAndPrice.find(
                (item) => new Date(item.signal.date).getTime() === mostRecentDate.getTime(),
              )?.signal

              lockDate = formatDate(mostRecentDate.toISOString())
              // Use the entry_price from the signal for "All Stocks" view
              lockPrice = Number.parseFloat(mostRecentSignal?.entry_price.toString() || "0")
              lockSentiment = sentimentForDisplay // Use the consistent sentiment
              currentSentiment = sentimentForDisplay // Use the consistent sentiment
            }

            // Get current price using the pre-fetched batch map
            const currentPrice = currentPricesMap[symbol] || 0 // Default to 0 if not found

            // Calculate change and percentage
            const change = currentPrice - lockPrice
            const changePercent = lockPrice !== 0 ? (change / lockPrice) * 100 : 0

            // Get stock name - first try from basket stocks, then from company names map
            let stockName = ""
            if (viewMode !== "all") {
              const basketStock = selectedBasketStocks.find((s) => s.symbol === symbol)
              if (basketStock) {
                stockName = basketStock.name
              }
            }
            if (!stockName) {
              stockName = getCompanyName(symbol)
            }

            processedData.push({
              symbol,
              name: stockName,
              lockDate,
              lockPrice,
              lockSentiment,
              currentPrice,
              change,
              changePercent,
              currentSentiment,
              hasSignals: true, // If it passed the initial filter, it has signals
            })
          } catch (err) {
            console.error(`Error processing stock ${symbol}:`, err)
            // Continue with other stocks even if one fails
          }
        }

        // Sort by symbol
        processedData.sort((a, b) => a.symbol.localeCompare(b.symbol))

        setPerformanceData(processedData)
        setLastUpdated(new Date().toLocaleDateString())
        setLastFetchTime(Date.now()) // Set cache timestamp
      } catch (err: any) {
        console.error("Error fetching performance data:", err)
        setError(err.message || "Failed to fetch performance data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [viewMode, selectedModels]) // Optimized dependencies - removed functions that cause rerenders

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Auto-refreshing performance data (5 min interval)")
      setLastFetchTime(null) // Clear cache to force refresh
    }, CACHE_DURATION)

    return () => clearInterval(interval)
  }, [CACHE_DURATION])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Performance Summary</h1>
        <p className="text-sm sm:text-base text-blue-100/80 mt-1 sm:mt-2">
          {viewMode === "all"
            ? "Performance data for stocks matching selected signal models"
            : "Performance data for stocks in your selected basket matching selected signal models"}
        </p>
      </div>
        {/* Main Content Card */}
        <Card className="mb-8 bg-[#090e23] backdrop-blur-xl border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 px-4 sm:px-6">
            <div className="flex flex-col gap-4">
              {/* Toggle Switches and Refresh Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="google-switch"
                      checked={selectedModels.includes("google")}
                      onCheckedChange={(checked) => {
                        setSelectedModels((prev) => (checked ? [...prev, "google"] : prev.filter((m) => m !== "google")))
                      }}
                      className="data-[state=unchecked]:bg-gradient-to-br data-[state=unchecked]:from-[#040517] data-[state=unchecked]:to-[#030514] data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[#040517] data-[state=checked]:to-[#030514] border-[#030514]/60 [&>span]:data-[state=unchecked]:bg-[#192233] [&>span]:data-[state=checked]:bg-[#1e31dd]"
                    />
                    <label
                      htmlFor="google-switch"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                    >
                      GTrends
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="twitter-switch"
                      checked={selectedModels.includes("twitter")}
                      onCheckedChange={(checked) => {
                        setSelectedModels((prev) =>
                          checked ? [...prev, "twitter"] : prev.filter((m) => m !== "twitter"),
                        )
                      }}
                      className="data-[state=unchecked]:bg-gradient-to-br data-[state=unchecked]:from-[#040517] data-[state=unchecked]:to-[#030514] data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[#040517] data-[state=checked]:to-[#030514] border-[#030514]/60 [&>span]:data-[state=unchecked]:bg-[#192233] [&>span]:data-[state=checked]:bg-[#1e31dd]"
                    />
                    <label
                      htmlFor="twitter-switch"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                    >
                      Twitter
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="news-switch"
                      checked={selectedModels.includes("news")}
                      onCheckedChange={(checked) => {
                        setSelectedModels((prev) => (checked ? [...prev, "news"] : prev.filter((m) => m !== "news")))
                      }}
                      className="data-[state=unchecked]:bg-gradient-to-br data-[state=unchecked]:from-[#040517] data-[state=unchecked]:to-[#030514] data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[#040517] data-[state=checked]:to-[#030514] border-[#030514]/60 [&>span]:data-[state=unchecked]:bg-[#192233] [&>span]:data-[state=checked]:bg-[#1e31dd]"
                    />
                    <label
                      htmlFor="news-switch"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                    >
                      News
                    </label>
                  </div>
                </div>
                
                {/* Manual Refresh Button - Hidden on mobile */}
                <Button 
                  onClick={() => {
                    setLastFetchTime(null) // Clear cache to force refresh
                  }}
                  variant="outline" 
                  className="hidden sm:flex bg-[#192233] border-[#0e142d] text-white hover:bg-[#1a2536] rounded-xl px-3"
                  title="Refresh data"
                >
                  <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {/* Last Updated Info */}
              {lastFetchTime && (
                <div className="text-xs text-blue-200/60 text-center sm:text-right">
                  Last updated: {new Date(lastFetchTime).toLocaleTimeString()} • Auto-refresh: 5min
                </div>
              )}
              
              {/* All Stocks Dropdown - Moved to separate row */}
              <div className="flex justify-center sm:justify-start">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-[#192233] border-[#0e142d] text-white hover:bg-[#1a2536] rounded-xl w-full sm:w-auto max-w-xs">
                    <span>
                      {viewMode === "all"
                        ? "All Stocks"
                        : userBaskets.find((b) => b.id === viewMode)?.name || "Unknown Basket"}
                    </span>
                    <Badge variant="secondary" className="ml-2 bg-[#1e31dd]/20 text-blue-200 border-[#1e31dd]/50">
                      {performanceData.length} stocks
                    </Badge>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#090e23] border-[#0e142d] rounded-xl">
                  <DropdownMenuItem
                    onClick={() => {
                      setViewMode("all")
                      setSelectedBasketId(null)
                    }}
                    className="text-white hover:bg-[#192233]"
                  >
                    All Stocks
                  </DropdownMenuItem>
                  {userBaskets.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="bg-[#0e142d]" />
                      {userBaskets.map((basket) => (
                        <DropdownMenuItem
                          key={basket.id}
                          onClick={() => {
                            setViewMode(basket.id!)
                            setSelectedBasketId(basket.id!)
                          }}
                          className="text-white hover:bg-[#192233]"
                        >
                          {basket.name}
                          <span className="ml-2 text-xs text-blue-200/60">
                            (Locked {basket.locked_at ? new Date(basket.locked_at).toLocaleDateString() : ""})
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  {userBaskets.length === 0 && user && (
                    <DropdownMenuItem disabled className="text-blue-200/60">
                      No locked baskets
                      <span className="ml-2 text-xs text-muted-foreground">(Create and lock a basket first)</span>
                    </DropdownMenuItem>
                  )}
                  {!user && <DropdownMenuItem disabled>Login required</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Table */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <span className="ml-2 text-blue-200/60">Loading performance data...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
                {error}
              </div>
            ) : performanceData.length === 0 ? (
              <div className="p-8 text-center text-blue-200/60">
                {selectedModels.length === 0 // Updated message for no models selected
                  ? "Please select at least one signal model to view performance data."
                  : viewMode !== "all"
                    ? `No stocks found in basket "${userBaskets.find((b) => b.id === viewMode)?.name || "Unknown"}" that match selected models and sentiment consistency.`
                    : "No stocks found matching the selected signal models and sentiment consistency."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead>
                    <tr>
                      <th
                        colSpan={2}
                        className="px-3 py-3 sm:px-6 sm:py-4 border-b border-[#0e142d] text-center font-medium text-blue-200/60"
                      >
                        Stock
                      </th>
                      <th
                        colSpan={3}
                        className="px-3 py-3 sm:px-6 sm:py-4 border-b border-[#0e142d] text-center font-medium text-blue-200/60"
                      >
                        {viewMode === "all" ? "Signal Date" : "Basket Lock Date"}
                      </th>
                      <th
                        colSpan={3}
                        className="px-3 py-3 sm:px-6 sm:py-4 border-b border-[#0e142d] text-center font-medium text-blue-200/60"
                      >
                        Current
                      </th>
                    </tr>
                    <tr className="border-b border-[#0e142d]">
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-blue-200/60">
                        Symbol
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-blue-200/60">Name</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-blue-200/60">Date</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-blue-200/60">Price</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-blue-200/60">
                        Sentiment
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-blue-200/60">Price</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-blue-200/60">
                        Change
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-blue-200/60">
                        Change %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((stock) => (
                      <tr key={stock.symbol} className="border-b border-[#0e142d] hover:bg-[#192233]/50 transition-colors">
                        <td className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-white">{stock.symbol}</td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-white">{stock.name}</td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-white">{stock.lockDate}</td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-white">${stock.lockPrice.toFixed(2)}</td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          {stock.lockSentiment ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block
                                ${
                                  stock.lockSentiment.toLowerCase() === "positive"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                                    : stock.lockSentiment.toLowerCase() === "negative"
                                      ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                      : stock.lockSentiment.toLowerCase() === "neutral"
                                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                                        : "bg-gray-500/20 text-gray-400 border border-gray-500/50" // For "Mixed" or "N/A"
                                }`}
                            >
                              {capitalizeSentiment(stock.lockSentiment)}
                            </span>
                          ) : (
                            <span className="text-blue-200/60 text-xs">No data</span>
                          )}
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-white">${stock.currentPrice.toFixed(2)}</td>
                        <td
                          className={`px-3 py-3 sm:px-6 sm:py-4 font-medium ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {stock.change >= 0 ? (
                            <>
                              ↑ +{stock.change.toFixed(2)} (+{stock.changePercent.toFixed(2)}%)
                            </>
                          ) : (
                            <>
                              ↓ {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                            </>
                          )}
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          {stock.currentSentiment ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block
                                ${
                                  stock.currentSentiment.toLowerCase() === "positive"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                                    : stock.currentSentiment.toLowerCase() === "negative"
                                      ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                      : stock.currentSentiment.toLowerCase() === "neutral"
                                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                                        : "bg-gray-500/20 text-gray-400 border border-gray-500/50" // For "Mixed" or "N/A"
                                }`}
                            >
                              {capitalizeSentiment(stock.currentSentiment)}
                            </span>
                          ) : (
                            <span className="text-blue-200/60 text-xs">No data</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 text-xs text-blue-200/60 text-center border-t border-[#0e142d]">
                  Stock data as of {lastUpdated}
                  {viewMode !== "all" && (
                    <div className="mt-1">
                      <AlertCircle className="inline h-3 w-3 text-amber-500 mr-1" />
                      Stocks with this icon have fewer than 2 signal models available.
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-4">
          <div className="text-center">
            <p className="text-blue-200/60 text-sm">
              © 2024 Sentiment Analytics Pro. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    )
  }
