"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, Twitter, Newspaper, Search } from "lucide-react"
import { StockPriceChart } from "./stock-price-chart"
import { SentimentGrid } from "./sentiment-grid"
import { SignalAnalytics } from "./signal-analytics"
import { generateMockStockData, generateMockSentimentData, generateMockCorrelationData } from "@/lib/mock-stock-data"

interface StockDetailPageProps {
  symbol: string
}

export function StockDetailPage({ symbol }: StockDetailPageProps) {
  const router = useRouter()
  const [stockData, setStockData] = useState<any>(null)
  const [sentimentData, setSentimentData] = useState<any>(null)
  const [correlationData, setCorrelationData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call delay
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Generate mock data
        const stock = generateMockStockData(symbol)
        const sentiment = generateMockSentimentData(symbol)
        const correlation = generateMockCorrelationData(symbol)
        
        setStockData(stock)
        setSentimentData(sentiment)
        setCorrelationData(correlation)
      } catch (error) {
        console.error("Error loading stock data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [symbol])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#010310] to-[#030516] flex items-center justify-center">
        <div className="text-white text-xl">Loading {symbol}...</div>
      </div>
    )
  }

  if (!stockData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#010310] to-[#030516] flex items-center justify-center">
        <div className="text-white text-xl">Stock not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010310] to-[#030516] text-white">
      {/* Subtle Background Patterns */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(30,49,221,0.08),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(36,93,255,0.06),transparent_50%)] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto p-4 sm:p-6">
        {/* Navigation Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-blue-200 hover:text-white hover:bg-blue-800/30 rounded-xl transition-all duration-200 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#0e142d]">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{symbol}</h1>
              <p className="text-blue-100/80 text-sm sm:text-base">{stockData.companyName}</p>
            </div>
          </div>
        </div>

        {/* Top Section - Stock Overview */}
        <div className="mb-8">
          <Card className="bg-[#090e23] backdrop-blur-xl border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl overflow-hidden">
            <CardHeader className="pb-6 px-4 sm:px-8 pt-6 sm:pt-8">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                Stock Overview
              </CardTitle>
              <CardDescription className="text-blue-100/80">
                Real-time price data and market information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Stock Price Chart */}
                <div className="lg:col-span-3">
                  <div className="h-64 sm:h-80 lg:h-96">
                    <StockPriceChart data={stockData.priceHistory} />
                  </div>
                </div>
                
                {/* Right: Stock Price Details */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Current Price */}
                  <div className="bg-gradient-to-br from-[#040517] to-[#030514] p-4 rounded-xl border border-[#0e142d]">
                    <div className="text-sm text-blue-200/80 mb-1">Current Price</div>
                    <div className="text-2xl sm:text-3xl font-bold text-white">${stockData.currentPrice}</div>
                    <div className={`flex items-center gap-2 mt-2 ${stockData.priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stockData.priceChange >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="font-semibold">
                        {stockData.priceChange >= 0 ? '+' : ''}{stockData.priceChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Market Data Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-[#040517] to-[#030514] p-3 rounded-xl border border-[#0e142d]">
                      <div className="text-xs text-blue-200/80 mb-1">Volume</div>
                      <div className="text-sm font-semibold text-white">{stockData.volume.toLocaleString()}</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#040517] to-[#030514] p-3 rounded-xl border border-[#0e142d]">
                      <div className="text-xs text-blue-200/80 mb-1">Market Cap</div>
                      <div className="text-sm font-semibold text-white">${stockData.marketCap}B</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#040517] to-[#030514] p-3 rounded-xl border border-[#0e142d]">
                      <div className="text-xs text-blue-200/80 mb-1">P/E Ratio</div>
                      <div className="text-sm font-semibold text-white">{stockData.peRatio}</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#040517] to-[#030514] p-3 rounded-xl border border-[#0e142d]">
                      <div className="text-xs text-blue-200/80 mb-1">52W High</div>
                      <div className="text-sm font-semibold text-white">${stockData.weekHigh52}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Section - Current Sentiment Grid */}
        <div className="mb-8">
          <Card className="bg-[#090e23] backdrop-blur-xl border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl overflow-hidden">
            <CardHeader className="pb-6 px-4 sm:px-8 pt-6 sm:pt-8">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                Current Sentiment Analysis
              </CardTitle>
              <CardDescription className="text-blue-100/80">
                Real-time sentiment scores across multiple data sources
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
              <SentimentGrid data={sentimentData} />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Signal Analytics */}
        <div className="mb-8">
          <Card className="bg-[#090e23] backdrop-blur-xl border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl overflow-hidden">
            <CardHeader className="pb-6 px-4 sm:px-8 pt-6 sm:pt-8">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                Signal Analytics
              </CardTitle>
              <CardDescription className="text-blue-100/80">
                Historical correlation between sentiment signals and price performance
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
              <SignalAnalytics data={correlationData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}