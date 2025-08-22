"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, MessageCircle, Newspaper, TrendingUp as TrendingUpIcon } from "lucide-react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface SignalAnalyticsProps {
  stockData: any
}

export function SignalAnalytics({ stockData }: SignalAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("twitter")

  const getSentimentIcon = (score: string) => {
    const numScore = parseFloat(score)
    if (numScore > 0.3) return <TrendingUp className="h-4 w-4 text-emerald-500" />
    if (numScore >= -0.3) return <Activity className="h-4 w-4 text-amber-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getCorrelationColor = (correlation: string) => {
    const numCorr = parseFloat(correlation)
    if (numCorr > 0.5) return "text-emerald-500"
    if (numCorr > 0.3) return "text-blue-500"
    if (numCorr > 0.1) return "text-amber-500"
    return "text-red-500"
  }

  const getCorrelationStrength = (correlation: string) => {
    const numCorr = parseFloat(correlation)
    if (numCorr > 0.7) return { text: "Strong", color: "bg-emerald-500/20 text-emerald-400" }
    if (numCorr > 0.5) return { text: "Moderate", color: "bg-blue-500/20 text-blue-400" }
    if (numCorr > 0.3) return { text: "Weak", color: "bg-amber-500/20 text-amber-400" }
    return { text: "Very Weak", color: "bg-red-500/20 text-red-400" }
  }

  // Generate mock historical data for each signal type
  const generateHistoricalData = (signalType: string) => {
    const data = []
    const baseCorrelation = parseFloat(stockData.sentimentCorrelation[signalType])
    
    for (let i = 0; i < 12; i++) {
      const month = new Date()
      month.setMonth(month.getMonth() - i)
      
      // Add some variation to the correlation
      const variation = (Math.random() - 0.5) * 0.2
      const correlation = Math.max(0, Math.min(1, baseCorrelation + variation))
      
      // Generate sentiment distribution (histogram data)
      const sentimentBins = [
        { range: "-1.0 to -0.6", count: Math.floor(Math.random() * 50) + 10, sentiment: -0.8 },
        { range: "-0.6 to -0.2", count: Math.floor(Math.random() * 80) + 20, sentiment: -0.4 },
        { range: "-0.2 to 0.2", count: Math.floor(Math.random() * 100) + 30, sentiment: 0.0 },
        { range: "0.2 to 0.6", count: Math.floor(Math.random() * 80) + 20, sentiment: 0.4 },
        { range: "0.6 to 1.0", count: Math.floor(Math.random() * 50) + 10, sentiment: 0.8 },
      ]
      
      data.unshift({
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        correlation: correlation.toFixed(3),
        sentimentBins,
        price: stockData.historicalData[stockData.historicalData.length - 1 - i]?.price || 100,
      })
    }
    
    return data
  }

  const signalTypes = [
    {
      key: "twitter",
      title: "Twitter Signals",
      icon: <MessageCircle className="h-5 w-5 text-blue-500" />,
      description: "Social media sentiment correlation with price",
      data: generateHistoricalData("twitter"),
    },
    {
      key: "news",
      title: "News Signals",
      icon: <Newspaper className="h-5 w-5 text-purple-500" />,
      description: "Media coverage sentiment correlation with price",
      data: generateHistoricalData("news"),
    },
    {
      key: "googleTrends",
      title: "Google Trends",
      icon: <TrendingUpIcon className="h-5 w-5 text-green-500" />,
      description: "Search trend correlation with price",
      data: generateHistoricalData("googleTrends"),
    },
  ]

  const currentSignal = signalTypes.find(s => s.key === activeTab)!

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Signal Analytics</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          {signalTypes.map((signal) => (
            <TabsTrigger
              key={signal.key}
              value={signal.key}
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <div className="flex items-center gap-2">
                {signal.icon}
                <span className="hidden sm:inline">{signal.title.split(' ')[0]}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {signalTypes.map((signal) => (
          <TabsContent key={signal.key} value={signal.key} className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {signal.icon}
                  <div>
                    <CardTitle className="text-slate-50">{signal.title}</CardTitle>
                    <p className="text-sm text-slate-400">{signal.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Current Correlation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Current Correlation</p>
                    <p className={`text-2xl font-bold ${getCorrelationColor(stockData.sentimentCorrelation[signal.key])}`}>
                      {stockData.sentimentCorrelation[signal.key]}
                    </p>
                    <Badge className={getCorrelationStrength(stockData.sentimentCorrelation[signal.key]).color}>
                      {getCorrelationStrength(stockData.sentimentCorrelation[signal.key]).text}
                    </Badge>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Current Sentiment</p>
                    <div className="flex items-center justify-center gap-2">
                      {getSentimentIcon(stockData.currentSentiment[signal.key].score)}
                      <p className="text-2xl font-bold text-white">
                        {parseFloat(stockData.currentSentiment[signal.key].score) > 0 ? "+" : ""}
                        {stockData.currentSentiment[signal.key].score}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Signal Volume</p>
                    <p className="text-2xl font-bold text-white">
                      {stockData.currentSentiment[signal.key].volume > 1000000 
                        ? `${(stockData.currentSentiment[signal.key].volume / 1000000).toFixed(1)}M`
                        : stockData.currentSentiment[signal.key].volume > 1000 
                        ? `${(stockData.currentSentiment[signal.key].volume / 1000).toFixed(1)}K`
                        : stockData.currentSentiment[signal.key].volume.toLocaleString()
                      }
                    </p>
                  </div>
                </div>

                {/* Historical Correlation Chart */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Historical Correlation & Price Movement</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={signal.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#9ca3af" 
                          fontSize={12}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke="#9ca3af" 
                          fontSize={12}
                          domain={[0, 1]}
                          tickFormatter={(value) => value.toFixed(2)}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#9ca3af" 
                          fontSize={12}
                          domain={["dataMin - 10", "dataMax + 10"]}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#f9fafb",
                          }}
                          labelFormatter={(value) => `Month: ${value}`}
                          formatter={(value: any, name: string) => [
                            name === "correlation" ? value : `$${value.toFixed(2)}`,
                            name === "correlation" ? "Correlation" : "Price"
                          ]}
                        />
                        
                        {/* Histogram bars for sentiment distribution */}
                        {signal.data[0]?.sentimentBins.map((bin: any, index: number) => (
                          <Bar
                            key={index}
                            dataKey={`sentimentBins.${index}.count`}
                            fill="#374151"
                            opacity={0.6}
                            yAxisId="left"
                          />
                        ))}
                        
                        {/* Line for correlation */}
                        <Line
                          type="monotone"
                          dataKey="correlation"
                          stroke="#1e31dd"
                          strokeWidth={3}
                          yAxisId="left"
                          dot={{ fill: "#1e31dd", strokeWidth: 2, r: 4 }}
                        />
                        
                        {/* Line for price */}
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#10b981"
                          strokeWidth={2}
                          yAxisId="right"
                          dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Chart Legend */}
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-slate-600 opacity-60 rounded"></div>
                      <span className="text-slate-300">Sentiment Distribution</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-blue-600 rounded"></div>
                      <span className="text-slate-300">Correlation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-green-600 rounded"></div>
                      <span className="text-slate-300">Price</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}