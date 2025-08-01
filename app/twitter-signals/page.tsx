"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, ChevronDown, ChevronUp, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"

interface TwitterSignal {
  date: string
  comp_symbol: string
  analyzed_tweets: number
  sentiment_score: number
  sentiment: string
  entry_price: number
}

interface StockPrice {
  symbol: string
  price: number
  source?: string
}

export default function TwitterSignalsPage() {
  const [data, setData] = useState<TwitterSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredData, setFilteredData] = useState<TwitterSignal[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sentimentFilter, setSentimentFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    lastUpdate: "",
    totalTweets: 0,
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

  // Helper function to format dates safely
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"

    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString

      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid Date"

      return date.toISOString().split("T")[0] // Returns YYYY-MM-DD
    } catch (e) {
      console.error("Date formatting error:", e)
      return "Invalid Date"
    }
  }

  // Helper function to safely get number value
  const safeNumber = (value: any, defaultValue = 0): number => {
    if (value === null || value === undefined) return defaultValue
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  // Helper function to safely get string value
  const safeString = (value: any, defaultValue = ""): string => {
    if (value === null || value === undefined) return defaultValue
    return String(value)
  }

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        console.log("Fetching Twitter signals...")
        const res = await fetch("/api/twitter-signals")
        console.log("Response status:", res.status)

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`API returned ${res.status}: ${errorText}`)
        }

        const rawData = await res.json()
        console.log("Raw Twitter signals data:", rawData)

        if (!Array.isArray(rawData)) {
          throw new Error("Invalid data format received from API")
        }

        // Safely process the data
        const processedData = rawData.map((item: any, index: number) => {
          try {
            return {
              date: formatDate(item.date),
              comp_symbol: safeString(item.comp_symbol, `UNKNOWN_${index}`),
              analyzed_tweets: safeNumber(item.analyzed_tweets, 0),
              sentiment_score: safeNumber(item.sentiment_score, 0),
              sentiment: safeString(item.sentiment, "neutral"),
              entry_price: safeNumber(item.entry_price, 0),
            }
          } catch (itemError) {
            console.error("Error processing item:", item, itemError)
            return {
              date: "Invalid Date",
              comp_symbol: `ERROR_${index}`,
              analyzed_tweets: 0,
              sentiment_score: 0,
              sentiment: "neutral",
              entry_price: 0,
            }
          }
        })

        setData(processedData)
        setFilteredData(processedData)

        // Generate summary stats safely
        try {
          const stats = {
            total: processedData.length,
            positive: processedData.filter(
              (item: TwitterSignal) => safeString(item.sentiment).toLowerCase() === "positive",
            ).length,
            negative: processedData.filter(
              (item: TwitterSignal) => safeString(item.sentiment).toLowerCase() === "negative",
            ).length,
            neutral: processedData.filter(
              (item: TwitterSignal) => safeString(item.sentiment).toLowerCase() === "neutral",
            ).length,
            lastUpdate: processedData.length > 0 ? processedData[0].date : "N/A",
            totalTweets: processedData.reduce(
              (sum: number, item: TwitterSignal) => sum + safeNumber(item.analyzed_tweets, 0),
              0,
            ),
            wins: 0, // Will be calculated in a separate useEffect
            losses: 0, // Will be calculated in a separate useEffect
            winRate: 0, // Will be calculated in a separate useEffect
          }
          setSummaryStats(stats)
        } catch (statsError) {
          console.error("Error generating stats:", statsError)
          setSummaryStats({
            total: 0,
            positive: 0,
            negative: 0,
            neutral: 0,
            lastUpdate: "N/A",
            totalTweets: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
          })
        }
      } catch (err: any) {
        console.error("Error fetching Twitter signals:", err)
        setError(`Failed to load Twitter Signals: ${err.message || "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchSignals()
  }, [])

  useEffect(() => {
    if (data.length > 0) {
      const uniqueSymbols = [...new Set(data.map((item) => item.comp_symbol))]
      console.log(`Found ${uniqueSymbols.length} unique symbols:`, uniqueSymbols)
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
        const entryPrice = safeNumber(signal.entry_price)

        if (entryPrice === 0) return // Cannot calculate P/L if entry price is 0

        if (safeString(signal.sentiment).toLowerCase() === "positive") {
          if (currentPrice >= entryPrice) {
            wins++
          } else {
            losses++
          }
        } else if (safeString(signal.sentiment).toLowerCase() === "negative") {
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
    console.log("TwitterSignalsPage: useEffect for sending summary stats triggered.")
    console.log(
      "TwitterSignalsPage: Conditions - filteredData.length:",
      filteredData.length,
      "pricesLoading:",
      pricesLoading,
      "summaryStats.total:",
      summaryStats.total,
    )
    if (filteredData.length > 0 && !pricesLoading && summaryStats.total > 0) {
      // Clear any existing timeout to avoid sending stale data
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      console.log("TwitterSignalsPage: Conditions met. Setting timeout for summary upload.")
      timeoutRef.current = setTimeout(async () => {
        console.log("TwitterSignalsPage: 60-second timeout elapsed. Sending summary data...")
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
              signal_type: "twitter",
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
              "TwitterSignalsPage: Failed to save Twitter signal summary:",
              errorData.error,
              response.status,
            )
          } else {
            console.log("TwitterSignalsPage: Twitter signal summary saved successfully!")
          }
        } catch (error) {
          console.error("Error sending Twitter signal summary:", error)
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
    try {
      // Apply filters and sorting safely
      let result = [...data]

      // Apply sentiment filter
      if (sentimentFilter !== "all") {
        result = result.filter((item) => safeString(item.sentiment).toLowerCase() === sentimentFilter.toLowerCase())
      }

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        result = result.filter((item) => safeString(item.comp_symbol).toLowerCase().includes(query))
      }

      // Apply sorting
      result.sort((a, b) => {
        try {
          if (sortBy === "date") {
            const dateA = new Date(a.date)
            const dateB = new Date(b.date)
            return dateA.getTime() - dateB.getTime()
          } else if (sortBy === "symbol") {
            return safeString(a.comp_symbol).localeCompare(safeString(b.comp_symbol))
          } else if (sortBy === "sentiment_score") {
            return safeNumber(a.sentiment_score) - safeNumber(b.sentiment_score)
          } else if (sortBy === "tweets") {
            return safeNumber(a.analyzed_tweets) - safeNumber(b.analyzed_tweets)
          }
          return 0
        } catch (sortError) {
          console.error("Sorting error:", sortError)
          return 0
        }
      })

      // Apply sort order
      if (sortOrder === "desc") {
        result.reverse()
      }

      setFilteredData(result)
    } catch (filterError) {
      console.error("Filtering error:", filterError)
      setFilteredData([])
    }
  }, [data, searchQuery, sentimentFilter, sortBy, sortOrder])

  // Generate comparison data safely
  const comparisonData = [
    { symbol: "AAPL", googleTrends: 0.5, twitter: 0.7, news: 0.6 },
    { symbol: "MSFT", googleTrends: 0.6, twitter: 0.7, news: 0.5 },
    { symbol: "AMZN", googleTrends: 0.4, twitter: 0.3, news: 0.2 },
    { symbol: "GOOGL", googleTrends: 0.6, twitter: 0.8, news: 0.7 },
    { symbol: "META", googleTrends: -0.3, twitter: -0.2, news: -0.1 },
    { symbol: "TSLA", googleTrends: 0.3, twitter: 0.4, news: 0.5 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010310] to-[#030516]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Twitter Signals</h1>
          <p className="text-sm sm:text-base text-blue-100/80 mt-1 sm:mt-2">
            View the latest Twitter sentiment signals for each stock.
          </p>
        </div>
        {/* Summary Stats Card */}
        <Card className="mb-8 bg-gradient-to-r from-[#1e31dd] via-[#245DFF] to-[#1e31dd] shadow-lg shadow-blue-900/30 border border-blue-500/20 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start px-4 sm:px-8">
                <div className="flex flex-col">
                  <span className="text-white text-xs sm:text-sm">Total Signals</span>
                  <span className="text-white text-xl sm:text-2xl font-bold">{summaryStats.total}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-xs sm:text-sm">Analyzed Tweets</span>
                  <span className="text-white text-xl sm:text-2xl font-bold">
                    {summaryStats.totalTweets.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-xs sm:text-sm">Win Rate %</span>
                  <span className="text-white text-xl sm:text-2xl font-bold">
                    {summaryStats.winRate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-xs sm:text-sm">Positive Signals</span>
                  <span className="text-white text-xl sm:text-2xl font-bold">{summaryStats.positive}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-xs sm:text-sm">Negative Signals</span>
                  <span className="text-white text-xl sm:text-2xl font-bold">{summaryStats.negative}</span>
                </div>
            </div>
            <div className="mt-4 flex justify-start">
              <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white/90 backdrop-blur-sm">
                Last updated: {summaryStats.lastUpdate}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Filters and Controls */}
        <Card className="mb-8 bg-[#090e23] backdrop-blur-xl border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <div className="flex-1 min-w-[180px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200/60 h-4 w-4" />
                  <Input
                    placeholder="Search by symbol..."
                    className="pl-10 h-9 sm:h-10 text-sm bg-[#192233] border-[#0e142d] text-white placeholder:text-blue-200/60 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-sm bg-[#192233] border-[#0e142d] text-white rounded-xl">
                    <SelectValue placeholder="Filter by sentiment" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#090e23] border-[#0e142d] rounded-xl">
                    <SelectItem value="all" className="text-white hover:bg-[#192233]">All Sentiments</SelectItem>
                    <SelectItem value="positive" className="text-white hover:bg-[#192233]">Positive</SelectItem>
                    <SelectItem value="negative" className="text-white hover:bg-[#192233]">Negative</SelectItem>
                    <SelectItem value="neutral" className="text-white hover:bg-[#192233]">Neutral</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-sm bg-[#192233] border-[#0e142d] text-white rounded-xl">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#090e23] border-[#0e142d] rounded-xl">
                    <SelectItem value="date" className="text-white hover:bg-[#192233]">Date</SelectItem>
                    <SelectItem value="symbol" className="text-white hover:bg-[#192233]">Symbol</SelectItem>
                    <SelectItem value="sentiment_score" className="text-white hover:bg-[#192233]">Sentiment Score</SelectItem>
                    <SelectItem value="tweets" className="text-white hover:bg-[#192233]">Analyzed Tweets</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 bg-[#192233] border-[#0e142d] text-white hover:bg-[#1a2536] rounded-xl"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Table View */}
        <Card className="mb-8 bg-[#090e23] backdrop-blur-xl border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin w-6 h-6 mr-2 text-blue-400" />
                <span className="text-blue-200/60">Loading sentiment data...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <p className="text-red-400 text-center">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="bg-[#192233] border-[#0e142d] text-white hover:bg-[#1a2536]">
                  Retry
                </Button>
              </div>
            ) : filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead>
                    <tr className="border-b border-[#0e142d]">
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-blue-200/60">Date</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-blue-200/60">Symbol</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-right text-blue-200/60">
                        Analyzed Tweets
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-right text-blue-200/60">
                        Sentiment Score
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 text-center font-medium text-blue-200/60">
                        Sentiment
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-right text-blue-200/60">
                        Entry Price
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-right text-blue-200/60">
                        Current Price
                      </th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-right text-blue-200/60">P/L%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((signal, i) => {
                      const currentPrice = currentPrices[signal.comp_symbol] || 0
                      const entryPrice = safeNumber(signal.entry_price)
                      let pLPercentage: number | null = null
                      let changeColorClass = ""

                      if (safeString(signal.sentiment).toLowerCase() === "positive") {
                        if (entryPrice !== 0) {
                          pLPercentage = ((currentPrice - entryPrice) / entryPrice) * 100
                        }
                      } else if (safeString(signal.sentiment).toLowerCase() === "negative") {
                        if (entryPrice !== 0) {
                          pLPercentage = ((entryPrice - currentPrice) / entryPrice) * 100 // Inverted for profit
                        }
                      }

                      if (pLPercentage !== null) {
                        changeColorClass = pLPercentage > 0 ? "text-green-600" : pLPercentage < 0 ? "text-red-600" : ""
                      }

                      return (
                        <tr
                          key={`${signal.comp_symbol}-${signal.date}-${i}`}
                          className="border-b border-[#0e142d] hover:bg-[#192233]/50 transition-colors"
                        >
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-white">{signal.date}</td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-white">
                            {signal.comp_symbol}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-right text-white">
                            {signal.analyzed_tweets}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-right text-white">
                            {safeNumber(signal.sentiment_score).toFixed(2)}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block
                                ${
                                  safeString(signal.sentiment).toLowerCase() === "positive"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                                    : safeString(signal.sentiment).toLowerCase() === "negative"
                                      ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                      : "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                                }`}
                            >
                              {signal.sentiment}
                            </span>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-right text-white">
                            ${safeNumber(signal.entry_price).toFixed(2)}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-right text-white">
                            {pricesLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin inline" />
                            ) : (
                              `$${(currentPrices[signal.comp_symbol] || 0).toFixed(2)}`
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
                <p className="text-muted-foreground">No Twitter signals found matching your criteria.</p>
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
              Compare Twitter with Google Trends and News signals
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="symbol"
                    stroke="hsl(var(--muted-foreground))"
                    className="fill-muted-foreground text-xs sm:text-sm"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    className="fill-muted-foreground text-xs sm:text-sm"
                    domain={[-1, 1]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.375rem",
                      color: "hsl(var(--foreground))",
                      fontSize: "0.875rem", // text-sm
                    }}
                    formatter={(value: any) => [Number(value).toFixed(2), "Sentiment Score"]}
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
