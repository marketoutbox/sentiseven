"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ChevronDown, ChevronUp, Search, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"

interface GTrendSignal {
  date: string
  comp_symbol: string
  analyzed_keywords: string
  sentiment_score: number
  sentiment: string
  entry_price: number
}

export default function GoogleTrendSignalsPage() {
  const [data, setData] = useState<GTrendSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState({})
  const [filteredData, setFilteredData] = useState<GTrendSignal[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sentimentFilter, setSentimentFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [comparisonData, setComparisonData] = useState([])
  const [error, setError] = useState<string | null>(null)
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    lastUpdate: "",
    wins: 0, // New
    losses: 0, // New
    winRate: 0, // New
  })

  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
  const [pricesLoading, setPricesLoading] = useState(false)

  // Fetch current prices for all symbols using the new batch API
  const fetchCurrentPrices = async (symbols: string[]) => {
    setPricesLoading(true)
    const prices: Record<string, number> = {}

    if (symbols.length === 0) {
      setPricesLoading(false)
      return
    }

    try {
      const res = await fetch("/api/stock-price/current/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbols }),
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch current prices: ${res.statusText}`)
      }

      const data = await res.json() // data will be an object like {AAPL: 175.43, MSFT: 325.76}
      Object.assign(prices, data) // Merge fetched prices into the prices object
    } catch (error) {
      console.error("Failed to get current prices in batch:", error)
      // Optionally, set all prices to 0 or a fallback if batch fails
      symbols.forEach((symbol) => (prices[symbol] = 0))
    }

    setCurrentPrices(prices)
    setPricesLoading(false)
  }

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString

    try {
      const date = new Date(dateString)
      return date.toISOString().split("T")[0] // Returns YYYY-MM-DD
    } catch (e) {
      return dateString // Return original if parsing fails
    }
  }

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        console.log("Fetching Google Trend signals...")
        const res = await fetch("/api/gtrend-signals")
        console.log("Response status:", res.status)

        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`)
        }

        const data = await res.json()
        console.log("Google Trend signals data:", data)

        if (data.error) {
          throw new Error(data.error)
        }

        // Format dates in the data
        const formattedData = data.map((item: GTrendSignal) => ({
          ...item,
          date: formatDate(item.date),
        }))

        setData(formattedData)
        setFilteredData(formattedData)
        setLoading(false)

        // Generate summary stats with formatted date
        const stats = {
          total: data.length,
          positive: data.filter((item: GTrendSignal) => item.sentiment?.toLowerCase() === "positive").length,
          negative: data.filter((item: GTrendSignal) => item.sentiment?.toLowerCase() === "negative").length,
          neutral: data.filter((item: GTrendSignal) => item.sentiment?.toLowerCase() === "neutral").length,
          lastUpdate: data.length > 0 ? formatDate(data[0].date) : "N/A",
          wins: 0, // Will be calculated in a separate useEffect
          losses: 0, // Will be calculated in a separate useEffect
          winRate: 0, // Will be calculated in a separate useEffect
        }
        setSummaryStats(stats)

        // Generate comparison data
        setComparisonData(generateComparisonData())
      } catch (err: any) {
        console.error("Error fetching Google Trend signals:", err)
        setError(`Failed to load Google Trend Signals: ${err.message}`)
        setLoading(false)
      }
    }

    fetchSignals()
  }, [])

  useEffect(() => {
    if (data.length > 0) {
      const uniqueSymbols = [...new Set(data.map((item) => item.comp_symbol))]
      fetchCurrentPrices(uniqueSymbols)
    }
  }, [data])

  // New useEffect to calculate Win Rate
  useEffect(() => {
    if (filteredData.length > 0 && !pricesLoading) {
      let wins = 0
      let losses = 0

      filteredData.forEach((signal) => {
        const currentPrice = currentPrices[signal.comp_symbol] || 0
        const entryPrice = signal.entry_price

        if (entryPrice === 0) return // Cannot calculate P/L if entry price is 0

        if (signal.sentiment?.toLowerCase() === "positive") {
          if (currentPrice >= entryPrice) {
            wins++
          } else {
            losses++
          }
        } else if (signal.sentiment?.toLowerCase() === "negative") {
          if (currentPrice <= entryPrice) {
            wins++
          } else {
            losses++
          }
        }
        // Neutral signals are ignored for win/loss calculation
      })

      const totalTrades = wins + losses
      const calculatedWinRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0

      setSummaryStats((prevStats) => ({
        ...prevStats,
        wins,
        losses,
        winRate: calculatedWinRate,
      }))
    }
  }, [filteredData, currentPrices, pricesLoading])

  // Effect to send summary stats to the server after a delay
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log("GoogleTrendSignalsPage: useEffect for sending summary stats triggered.")
    console.log(
      "GoogleTrendSignalsPage: Conditions - filteredData.length:",
      filteredData.length,
      "pricesLoading:",
      pricesLoading,
      "summaryStats.total:",
      summaryStats.total,
    )
    if (filteredData.length > 0 && !pricesLoading && summaryStats.total > 0) {
      // Clear any existing timeout to avoid sending stale data
      console.log("GoogleTrendSignalsPage: Conditions met. Setting timeout for summary upload.")
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(async () => {
        console.log("GoogleTrendSignalsPage: 60-second timeout elapsed. Sending summary data...")
        try {
          const positiveRatio =
            summaryStats.negative > 0
              ? summaryStats.positive / summaryStats.negative
              : summaryStats.positive > 0
                ? null // Send null if negative is 0 and positive is > 0 (representing Infinity)
                : 0 // Send 0 if both are 0

          const response = await fetch("/api/signal-summaries", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              signal_type: "google_trends",
              total_signals: summaryStats.total,
              positive_ratio: positiveRatio,
              win_rate_percent: summaryStats.winRate,
              positive_signals: summaryStats.positive,
              negative_signals: summaryStats.negative,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error(
              "GoogleTrendSignalsPage: Failed to save Google Trends signal summary:",
              errorData.error,
              response.status,
            )
          } else {
            console.log("GoogleTrendSignalsPage: Google Trends signal summary saved successfully!")
          }
        } catch (error) {
          console.error("Error sending Google Trends signal summary:", error)
        }
      }, 60000) // 60 seconds delay
    }

    // Cleanup function to clear the timeout if the component unmounts or dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [filteredData, pricesLoading, summaryStats])

  useEffect(() => {
    // Apply filters and sorting
    let result = [...data]

    // Apply sentiment filter
    if (sentimentFilter !== "all") {
      result = result.filter((item) => item.sentiment?.toLowerCase() === sentimentFilter.toLowerCase())
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          safeString(item.comp_symbol).toLowerCase().includes(query) ||
          safeString(item.analyzed_keywords).toLowerCase().includes(query),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.date) > new Date(b.date) ? 1 : -1
      } else if (sortBy === "symbol") {
        return a.comp_symbol.localeCompare(b.comp_symbol)
      } else if (sortBy === "sentiment_score") {
        return Number.parseFloat(a.sentiment_score) - Number.parseFloat(b.sentiment_score)
      }
      return 0
    })

    // Apply sort order
    if (sortOrder === "desc") {
      result.reverse()
    }

    setFilteredData(result)
  }, [data, searchQuery, sentimentFilter, sortBy, sortOrder])

  const toggleRow = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  // Helper function to generate comparison data
  const generateComparisonData = () => {
    // Mock data comparing different signal sources
    return [
      { symbol: "AAPL", googleTrends: 0.7, twitter: 0.5, news: 0.6 },
      { symbol: "MSFT", googleTrends: 0.6, twitter: 0.7, news: 0.5 },
      { symbol: "AMZN", googleTrends: 0.3, twitter: 0.4, news: 0.2 },
      { symbol: "GOOGL", googleTrends: 0.8, twitter: 0.6, news: 0.7 },
      { symbol: "META", googleTrends: -0.2, twitter: -0.3, news: -0.1 },
      { symbol: "TSLA", googleTrends: 0.4, twitter: 0.3, news: 0.5 },
    ]
  }

  // Helper function to safely convert a value to a string
  const safeString = (value: any): string => {
    if (typeof value === "string") {
      return value
    }
    if (typeof value === "number") {
      return value.toString()
    }
    if (value === null || value === undefined) {
      return ""
    }
    return String(value)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Google Trends Signals</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            View the latest Google Trends sentiment signals for each stock.
          </p>
        </div>
        {/* Summary Stats Card */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs sm:text-sm">Total Signals</span>
                <span className="text-foreground text-xl sm:text-2xl font-bold">{summaryStats.total}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs sm:text-sm">Positive/Negative Ratio</span>
                <span className="text-foreground text-xl sm:text-2xl font-bold">
                  {summaryStats.negative > 0
                    ? (summaryStats.positive / summaryStats.negative).toFixed(2)
                    : summaryStats.positive > 0
                      ? "∞"
                      : "0"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs sm:text-sm">Win Rate %</span>
                <span className="text-foreground text-xl sm:text-2xl font-bold">
                  {summaryStats.winRate.toFixed(2)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs sm:text-sm">Positive Signals</span>
                <span className="text-green-600 text-xl sm:text-2xl font-bold">{summaryStats.positive}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs sm:text-sm">Negative Signals</span>
                <span className="text-red-600 text-xl sm:text-2xl font-bold">{summaryStats.negative}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
              <span className="text-muted-foreground text-xs sm:text-sm">Last updated: {summaryStats.lastUpdate}</span>
            </div>
          </CardContent>
        </Card>
        {/* Filters and Controls */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <div className="flex-1 min-w-[180px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by symbol or keywords..."
                    className="pl-10 h-9 sm:h-10 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Filter by sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sentiments</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="symbol">Symbol</SelectItem>
                    <SelectItem value="sentiment_score">Sentiment Score</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Table View */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin w-6 h-6 mr-2 text-primary" />
                <span className="text-muted-foreground">Loading sentiment data...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-red-500">{error}</p>
              </div>
            ) : filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium">Date</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium">Symbol</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium">Analyzed Keywords</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 text-right font-medium">Sentiment Score</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 text-center font-medium">Sentiment</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-right">Entry Price</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-right">Current Price</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-right">P/L%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, i) => {
                      const currentPrice = currentPrices[row.comp_symbol] || 0
                      const entryPrice = row.entry_price
                      let pLPercentage: number | null = null
                      let changeColorClass = ""

                      if (row.sentiment?.toLowerCase() === "positive") {
                        if (entryPrice !== 0) {
                          pLPercentage = ((currentPrice - entryPrice) / entryPrice) * 100
                        }
                      } else if (row.sentiment?.toLowerCase() === "negative") {
                        if (entryPrice !== 0) {
                          pLPercentage = ((entryPrice - currentPrice) / entryPrice) * 100 // Inverted for profit
                        }
                      }

                      if (pLPercentage !== null) {
                        changeColorClass = pLPercentage > 0 ? "text-green-600" : pLPercentage < 0 ? "text-red-600" : ""
                      }

                      return (
                        <tr key={i} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-3 py-3 sm:px-6 sm:py-4">{row.date}</td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 font-medium">{row.comp_symbol}</td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 max-w-[150px] sm:max-w-xs truncate">
                            {row.analyzed_keywords}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-right">{row.sentiment_score}</td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block
                        ${
                          row.sentiment?.toLowerCase() === "positive"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-800"
                            : row.sentiment?.toLowerCase() === "negative"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-200 dark:border-red-800"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}
                            >
                              {row.sentiment}
                            </span>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-right">${row.entry_price}</td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-right">
                            {pricesLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin inline" />
                            ) : (
                              `$${(currentPrices[row.comp_symbol] || 0).toFixed(2)}`
                            )}
                          </td>
                          <td className={`px-3 py-3 sm:px-6 sm:py-4 text-right font-medium ${changeColorClass}`}>
                            {pLPercentage !== null ? `${pLPercentage.toFixed(2)}%` : "N/A"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-muted-foreground">No Google Trends signals found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Signal Source Comparison */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <CardTitle className="text-lg sm:text-xl">Signal Source Comparison</CardTitle>
            </div>
            <CardDescription className="text-sm sm:text-base">
              Compare Google Trends with Twitter and News signals
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="symbol"
                    stroke="var(--muted-foreground)"
                    className="fill-muted-foreground text-xs sm:text-sm"
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    className="fill-muted-foreground text-xs sm:text-sm"
                    domain={[-1, 1]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      borderRadius: "0.375rem",
                      color: "var(--foreground)",
                      fontSize: "0.875rem", // text-sm
                    }}
                    formatter={(value) => [value.toFixed(2), "Sentiment Score"]}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.75rem" }} /> {/* text-xs */}
                  <Bar dataKey="googleTrends" name="Google Trends" fill="#10b981" />
                  <Bar dataKey="twitter" name="Twitter" fill="#3b82f6" />
                  <Bar dataKey="news" name="News" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
