"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { StockOverview } from "./stock-overview"
import { SentimentGrid } from "./sentiment-grid"
import { SignalAnalytics } from "./signal-analytics"

interface StockDetailPageProps {
  symbol: string
}

export function StockDetailPage({ symbol }: StockDetailPageProps) {
  const router = useRouter()
  const [stockData, setStockData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading stock data
    const loadStockData = async () => {
      setIsLoading(true)
      // Mock data - replace with actual API call later
      const mockData = generateMockStockData(symbol)
      setStockData(mockData)
      setIsLoading(false)
    }

    loadStockData()
  }, [symbol])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#010310] to-[#030516] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-800 rounded w-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-slate-800 rounded"></div>
              <div className="h-96 bg-slate-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stockData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#010310] to-[#030516] p-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Stock Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010310] to-[#030516] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{stockData.symbol}</h1>
            <p className="text-slate-400">{stockData.name}</p>
          </div>
        </div>

        {/* Stock Overview Section */}
        <StockOverview stockData={stockData} />

        {/* Current Sentiment Grid */}
        <SentimentGrid sentimentData={stockData.currentSentiment} />

        {/* Signal Analytics */}
        <SignalAnalytics stockData={stockData} />
      </div>
    </div>
  )
}

// Mock data generator
function generateMockStockData(symbol: string) {
  const basePrice = 100 + Math.random() * 900
  const change = (Math.random() - 0.5) * 20
  const changePercent = (change / basePrice) * 100

  return {
    symbol,
    name: `${symbol} Corporation`,
    price: basePrice.toFixed(2),
    change: change.toFixed(2),
    changePercent: changePercent.toFixed(2),
    volume: Math.floor(Math.random() * 1000000) + 100000,
    marketCap: `$${(Math.random() * 1000 + 100).toFixed(1)}B`,
    peRatio: (Math.random() * 30 + 10).toFixed(2),
    dividend: `${(Math.random() * 3).toFixed(2)}%`,
    beta: (Math.random() * 2).toFixed(2),
    yearHigh: `$${(basePrice * 1.5).toFixed(2)}`,
    yearLow: `$${(basePrice * 0.7).toFixed(2)}`,
    currentSentiment: {
      twitter: {
        score: (Math.random() * 2 - 1).toFixed(2),
        trend: Math.random() > 0.5 ? "up" : "down",
        volume: Math.floor(Math.random() * 10000) + 1000,
      },
      news: {
        score: (Math.random() * 2 - 1).toFixed(2),
        trend: Math.random() > 0.5 ? "up" : "down",
        volume: Math.floor(Math.random() * 1000) + 100,
      },
      googleTrends: {
        score: (Math.random() * 2 - 1).toFixed(2),
        trend: Math.random() > 0.5 ? "up" : "down",
        volume: Math.floor(Math.random() * 100000) + 10000,
      },
    },
    historicalData: generateHistoricalData(basePrice),
    sentimentCorrelation: {
      twitter: (Math.random() * 0.6 + 0.2).toFixed(2),
      news: (Math.random() * 0.6 + 0.2).toFixed(2),
      googleTrends: (Math.random() * 0.6 + 0.2).toFixed(2),
    },
  }
}

function generateHistoricalData(basePrice: number) {
  const days = 365
  const data = []
  let currentPrice = basePrice

  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    // Add some random price movement
    const change = (Math.random() - 0.5) * 0.02 // ±1% daily change
    currentPrice = currentPrice * (1 + change)
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: currentPrice,
      volume: Math.floor(Math.random() * 1000000) + 100000,
    })
  }

  return data
}