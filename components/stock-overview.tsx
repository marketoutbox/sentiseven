"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface StockOverviewProps {
  stockData: any
}

export function StockOverview({ stockData }: StockOverviewProps) {
  const [timeframe, setTimeframe] = useState("1Y")

  const timeframes = [
    { label: "1D", value: "1D" },
    { label: "1W", value: "1W" },
    { label: "1M", value: "1M" },
    { label: "3M", value: "3M" },
    { label: "1Y", value: "1Y" },
  ]

  const getChangeColor = (change: string) => {
    const numChange = parseFloat(change)
    return numChange >= 0 ? "text-emerald-500" : "text-red-500"
  }

  const getChangeIcon = (change: string) => {
    const numChange = parseFloat(change)
    return numChange >= 0 ? (
      <TrendingUp className="h-4 w-4 text-emerald-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getChangeBadgeColor = (change: string) => {
    const numChange = parseFloat(change)
    return numChange >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
  }

  // Filter data based on timeframe
  const getFilteredData = () => {
    const data = stockData.historicalData
    if (timeframe === "1D") return data.slice(-1)
    if (timeframe === "1W") return data.slice(-7)
    if (timeframe === "1M") return data.slice(-30)
    if (timeframe === "3M") return data.slice(-90)
    return data // 1Y
  }

  const chartData = getFilteredData()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Interactive Stock Price Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-50">Price Chart</CardTitle>
          <div className="flex gap-2">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(tf.value)}
                className="text-xs"
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e31dd" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1e31dd" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => {
                    if (timeframe === "1D") return value
                    if (timeframe === "1W") return value.slice(-5)
                    if (timeframe === "1M") return value.slice(-5)
                    if (timeframe === "3M") return value.slice(-5)
                    return value.slice(-5)
                  }}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#f9fafb",
                  }}
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#1e31dd"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Right: Stock Price Details */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-50">Stock Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Price and Change */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">
                ${stockData.price}
              </span>
              <div className="flex items-center gap-2">
                {getChangeIcon(stockData.change)}
                <span className={`text-lg font-semibold ${getChangeColor(stockData.change)}`}>
                  {stockData.change}
                </span>
                <Badge className={getChangeBadgeColor(stockData.change)}>
                  {stockData.changePercent}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Volume</p>
              <p className="text-white font-medium">
                {(stockData.volume / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Market Cap</p>
              <p className="text-white font-medium">{stockData.marketCap}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">P/E Ratio</p>
              <p className="text-white font-medium">{stockData.peRatio}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Dividend Yield</p>
              <p className="text-white font-medium">{stockData.dividend}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Beta</p>
              <p className="text-white font-medium">{stockData.beta}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">52W High</p>
              <p className="text-white font-medium">{stockData.yearHigh}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">52W Low</p>
              <p className="text-white font-medium">{stockData.yearLow}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Sector</p>
              <p className="text-white font-medium">Technology</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}