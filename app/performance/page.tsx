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
  const [selectedModels, setSelectedModels] = useState<string[]>(["google", "twitter", "news"]) // Add this line

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

        // Get sets of stock symbols from each source
        const googleStocks = new Set(googleData.map((item: StockSignal) => item.comp_symbol))
        const twitterStocks = new Set(twitterData.map((item: StockSignal) => item.comp_symbol))
        const newsStocks = new Set(newsData.map((item: StockSignal) => item.comp_symbol))

        // Create a map to easily look up signal data by symbol
        const googleMap = new Map(googleData.map((item: StockSignal) => [item.comp_symbol, item]))
        const twitterMap = new Map(twitterData.map((item: StockSignal) => [item.comp_symbol, item]))
        const newsMap = new Map(newsData.map((item: StockSignal) => [item.comp_symbol, item]))

        // Find stocks that appear in at least 2 out of 3 sources
        const allStocks = new Set([...googleStocks, ...twitterStocks, ...newsStocks])
        const stocksWithSignals = [...allStocks].filter((symbol) => {
          if (selectedModels.length === 0) {
            return false // If no models are selected, no stocks should appear
          }
          // A stock must have a signal in ALL currently selected models
          return selectedModels.every((model) => {
            if (model === "google") return googleStocks.has(symbol)
            if (model === "twitter") return twitterStocks.has(symbol)
            if (model === "news") return newsStocks.has(symbol)
            return false
          })
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

              // For basket view, show all stocks in the basket
              stocksToProcess = stocks.map((stock) => stock.symbol)

              console.log(`Loaded ${stocks.length} stocks for basket "${basket.name}"`)
            } else {
              stocksToProcess = []
              console.error("Failed to load basket or stocks:", error)
            }
          } catch (error) {
            console.error("Error loading basket stocks:", error)
            stocksToProcess = []
          }
        } else {
          // For "All Stocks" view, only show stocks with signals in at least 2 models
          stocksToProcess = stocksWithSignals
        }

        if (stocksToProcess.length === 0) {
          setPerformanceData([])
          setLoading(false)
          if (viewMode !== "all") {
            const selectedBasketName = userBaskets.find((b) => b.id === viewMode)?.name || "Unknown"
            setError(`No stocks found in basket "${selectedBasketName}" that match selected models.`)
          } else {
            setError("No stocks found matching the selected signal models.")
          }
          return
        }

        // NEW: Batch fetch current prices for all stocks to process
        const currentPricesMap = await getCurrentPricesBatch(stocksToProcess)

        // NEW: Prepare historical price promises if in basket view
        const historicalPricePromises: Promise<{ symbol: string; price: number }>[] = []
        const historicalPriceRequests: { symbol: string; date: string }[] = []

        if (viewMode !== "all" && selectedBasket && basketLockDate) {
          const formattedLockDate = formatDate(basketLockDate)
          for (const symbol of stocksToProcess) {
            historicalPriceRequests.push({ symbol, date: formattedLockDate })
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
            const googleSignal = googleMap.get(symbol)
            const twitterSignal = twitterMap.get(symbol)
            const newsSignal = newsMap.get(symbol)

            // Check if this stock has signals in at least 2 models
            const availableSignals = [
              googleSignal ? { signal: googleSignal, source: "google" } : null,
              twitterSignal ? { signal: twitterSignal, source: "twitter" } : null,
              newsSignal ? { signal: newsSignal, source: "news" } : null,
            ].filter(Boolean)

            const hasSignals = selectedModels.every((model) => {
              if (model === "google") return googleSignal !== undefined
              if (model === "twitter") return twitterSignal !== undefined
              if (model === "news") return newsSignal !== undefined
              return false
            })

            // Determine the lock date and price based on view mode
            let lockDate: string
            let lockPrice: number
            let lockSentiment: string | null = null
            let currentSentiment: string | null = null

            if (viewMode !== "all" && selectedBasket && basketLockDate) {
              // Use basket lock date
              lockDate = formatDate(basketLockDate)
              console.log(`Processing ${symbol} with basket lock date: ${lockDate}`)

              // Use the pre-fetched historical price
              lockPrice = historicalPricesMap.get(symbol) || 0 // Default to 0 if not found, though it should be

              // If we have signals, use the sentiment from the most recent one
              if (hasSignals) {
                // Find the most recent signal date among available sources
                const dates = availableSignals.map((item) => new Date(item.signal.date))
                const mostRecentDate = new Date(Math.max(...dates.map((d) => d.getTime())))

                // Find which signal corresponds to the most recent date
                const mostRecentSignal = availableSignals.find(
                  (item) => new Date(item.signal.date).getTime() === mostRecentDate.getTime(),
                )?.signal

                if (mostRecentSignal) {
                  lockSentiment = mostRecentSignal.sentiment
                  currentSentiment = mostRecentSignal.sentiment
                }
              }
            } else {
              // For "All Stocks" view, we should have at least 2 signals
              if (!hasSignals) continue

              // Find the most recent signal date among available sources
              const dates = availableSignals.map((item) => new Date(item.signal.date))
              const mostRecentDate = new Date(Math.max(...dates.map((d) => d.getTime())))

              // Find which signal corresponds to the most recent date
              const mostRecentSignal = availableSignals.find(
                (item) => new Date(item.signal.date).getTime() === mostRecentDate.getTime(),
              )?.signal

              lockDate = formatDate(mostRecentDate.toISOString())
              // Use the entry_price from the signal for "All Stocks" view
              lockPrice = Number.parseFloat(mostRecentSignal.entry_price.toString())
              lockSentiment = mostRecentSignal.sentiment
              currentSentiment = mostRecentSignal.sentiment
            }

            // Get current price using the pre-fetched batch map
            const currentPrice = currentPricesMap[symbol] || 0 // Default to 0 if not found

            // Calculate change and percentage
            const change = currentPrice - lockPrice
            const changePercent = (change / lockPrice) * 100

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
              hasSignals,
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
      } catch (err: any) {
        console.error("Error fetching performance data:", err)
        setError(err.message || "Failed to fetch performance data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [viewMode, userBaskets, getCurrentPricesBatch, getHistoricalPrice, selectedModels]) // Added dependencies

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {" "}
        {/* Updated classes */}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance Summary</h1>
          <p className="text-muted-foreground mt-2">
            {viewMode === "all"
              ? "Performance data for stocks matching selected signal models"
              : "Performance data for stocks in your selected basket matching selected signal models"}
          </p>
        </div>
        {/* Main Content Card */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl">Stocks Performance Table</CardTitle>
                <CardDescription>
                  {viewMode === "all"
                    ? "Performance data for stocks matching selected signal models"
                    : "Performance data from basket lock date to current date, matching selected signal models"}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="google-switch"
                    checked={selectedModels.includes("google")}
                    onCheckedChange={(checked) => {
                      setSelectedModels((prev) => (checked ? [...prev, "google"] : prev.filter((m) => m !== "google")))
                    }}
                  />
                  <label
                    htmlFor="google-switch"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                  />
                  <label
                    htmlFor="twitter-switch"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                  />
                  <label
                    htmlFor="news-switch"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    News
                  </label>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <span>
                      {viewMode === "all"
                        ? "All Stocks"
                        : userBaskets.find((b) => b.id === viewMode)?.name || "Unknown Basket"}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {performanceData.length} stocks
                    </Badge>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setViewMode("all")
                      setSelectedBasketId(null)
                    }}
                  >
                    All Stocks
                  </DropdownMenuItem>
                  {userBaskets.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      {userBaskets.map((basket) => (
                        <DropdownMenuItem
                          key={basket.id}
                          onClick={() => {
                            setViewMode(basket.id!)
                            setSelectedBasketId(basket.id!)
                          }}
                        >
                          {basket.name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Locked {basket.locked_at ? new Date(basket.locked_at).toLocaleDateString() : ""})
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  {userBaskets.length === 0 && user && (
                    <DropdownMenuItem disabled>
                      No locked baskets
                      <span className="ml-2 text-xs text-muted-foreground">(Create and lock a basket first)</span>
                    </DropdownMenuItem>
                  )}
                  {!user && <DropdownMenuItem disabled>Login required</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent>
            {/* Table */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading performance data...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                {error}
              </div>
            ) : performanceData.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {viewMode !== "all"
                  ? `No stocks found for basket "${userBaskets.find((b) => b.id === viewMode)?.name || "Unknown"}" matching selected signal models.`
                  : "No stocks found matching the selected signal models."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th
                        colSpan={2}
                        className="px-4 py-3 bg-muted text-muted-foreground border-b text-center font-medium"
                      >
                        Stock
                      </th>
                      <th
                        colSpan={3}
                        className="px-4 py-3 bg-primary/10 text-foreground border-b text-center font-medium"
                      >
                        {viewMode === "all" ? "Signal Date" : "Basket Lock Date"}
                      </th>
                      <th
                        colSpan={3}
                        className="px-4 py-3 bg-muted text-muted-foreground border-b text-center font-medium"
                      >
                        Current
                      </th>
                    </tr>
                    <tr>
                      <th className="px-4 py-3 bg-muted text-muted-foreground border-b text-left font-medium">
                        Symbol
                      </th>
                      <th className="px-4 py-3 bg-muted text-muted-foreground border-b text-left font-medium">Name</th>
                      <th className="px-4 py-3 bg-primary/10 text-foreground border-b text-left font-medium">Date</th>
                      <th className="px-4 py-3 bg-primary/10 text-foreground border-b text-left font-medium">Price</th>
                      <th className="px-4 py-3 bg-primary/10 text-foreground border-b text-left font-medium">
                        Sentiment
                      </th>
                      <th className="px-4 py-3 bg-muted text-muted-foreground border-b text-left font-medium">Price</th>
                      <th className="px-4 py-3 bg-muted text-muted-foreground border-b text-left font-medium">
                        Change
                      </th>
                      <th className="px-4 py-3 bg-muted text-muted-foreground border-b text-left font-medium">
                        Change %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((stock) => (
                      <tr key={stock.symbol}>
                        <td className="px-4 py-4 font-medium text-foreground">{stock.symbol}</td>
                        <td className="px-4 py-4 font-medium text-foreground">{stock.name}</td>
                        <td className="px-4 py-4 font-medium text-foreground">{stock.lockDate}</td>
                        <td className="px-4 py-4 font-medium text-foreground">${stock.lockPrice.toFixed(2)}</td>
                        <td className="px-4 py-4">
                          {stock.lockSentiment ? (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium inline-block
                                ${
                                  stock.lockSentiment.toLowerCase() === "positive"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-800"
                                    : stock.lockSentiment.toLowerCase() === "negative"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-200 dark:border-red-800"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                }`}
                            >
                              {stock.lockSentiment}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">No data</span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-medium text-foreground">${stock.currentPrice.toFixed(2)}</td>
                        <td
                          className={`px-4 py-4 font-medium ${stock.change >= 0 ? "text-green-600" : "text-red-600"}`}
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
                        <td className="px-4 py-4">
                          {stock.currentSentiment ? (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium inline-block
                                ${
                                  stock.currentSentiment.toLowerCase() === "positive"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-800"
                                    : stock.currentSentiment.toLowerCase() === "negative"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-200 dark:border-red-800"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                }`}
                            >
                              {stock.currentSentiment}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">No data</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 text-xs text-muted-foreground text-center border-t">
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
      </div>
    </div>
  )
}
