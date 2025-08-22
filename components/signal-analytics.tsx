"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Twitter, Newspaper, Search, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { CorrelationChart } from "./correlation-chart"

interface CorrelationData {
  twitter: {
    current: Array<{ date: string; sentiment: number; price: number }>
    historical: Array<{ date: string; sentiment: number; price: number }>
    correlation: number
  }
  news: {
    current: Array<{ date: string; sentiment: number; price: number }>
    historical: Array<{ date: string; sentiment: number; price: number }>
    correlation: number
  }
  googleTrends: {
    current: Array<{ date: string; sentiment: number; price: number }>
    historical: Array<{ date: string; sentiment: number; price: number }>
    correlation: number
  }
}

interface SignalAnalyticsProps {
  data: CorrelationData
}

export function SignalAnalytics({ data }: SignalAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("twitter")

  // Helper function to get correlation strength label
  const getCorrelationLabel = (correlation: number) => {
    const absCorr = Math.abs(correlation)
    if (absCorr > 0.7) return "Strong"
    if (absCorr > 0.5) return "Moderate"
    if (absCorr > 0.3) return "Weak"
    return "Very Weak"
  }

  // Helper function to get correlation color
  const getCorrelationColor = (correlation: number) => {
    const absCorr = Math.abs(correlation)
    if (absCorr > 0.7) return "text-emerald-400"
    if (absCorr > 0.5) return "text-amber-400"
    if (absCorr > 0.3) return "text-orange-400"
    return "text-red-400"
  }

  // Helper function to get correlation icon
  const getCorrelationIcon = (correlation: number) => {
    if (correlation > 0.5) return <TrendingUp className="h-4 w-4 text-emerald-400" />
    if (correlation > 0.2) return <Activity className="h-4 w-4 text-amber-400" />
    return <TrendingDown className="h-4 w-4 text-red-400" />
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "twitter": return <Twitter className="h-4 w-4" />
      case "news": return <Newspaper className="h-4 w-4" />
      case "googleTrends": return <Search className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getTabColor = (tab: string) => {
    switch (tab) {
      case "twitter": return "text-blue-400"
      case "news": return "text-purple-400"
      case "googleTrends": return "text-green-400"
      default: return "text-blue-400"
    }
  }

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#192233] border border-[#0e142d] rounded-xl p-1">
          <TabsTrigger 
            value="twitter" 
            className="flex items-center gap-2 data-[state=active]:bg-[#1e31dd] data-[state=active]:text-white rounded-lg transition-all duration-200"
          >
            <Twitter className="h-4 w-4" />
            <span className="hidden sm:inline">Twitter</span>
          </TabsTrigger>
          <TabsTrigger 
            value="news" 
            className="flex items-center gap-2 data-[state=active]:bg-[#1e31dd] data-[state=active]:text-white rounded-lg transition-all duration-200"
          >
            <Newspaper className="h-4 w-4" />
            <span className="hidden sm:inline">News</span>
          </TabsTrigger>
          <TabsTrigger 
            value="googleTrends" 
            className="flex items-center gap-2 data-[state=active]:bg-[#1e31dd] data-[state=active]:text-white rounded-lg transition-all duration-200"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Google Trends</span>
          </TabsTrigger>
        </TabsList>

        {/* Twitter Analytics */}
        <TabsContent value="twitter" className="mt-6">
          <div className="space-y-6">
            {/* Correlation Summary */}
            <Card className="bg-[#192233] border border-[#0e142d] rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg text-white">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Twitter className="h-5 w-5 text-blue-400" />
                  </div>
                  Twitter Signal Correlation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#0e142d]">
                    <div className="text-2xl font-bold text-white">{data.twitter.correlation.toFixed(3)}</div>
                    <div className="text-sm text-blue-200/80">Correlation Coefficient</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#0e142d]">
                    <div className="text-2xl font-bold text-white">{getCorrelationLabel(data.twitter.correlation)}</div>
                    <div className="text-sm text-blue-200/80">Strength</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#0e142d]">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white">
                      {getCorrelationIcon(data.twitter.correlation)}
                      {data.twitter.correlation > 0 ? 'Positive' : 'Negative'}
                    </div>
                    <div className="text-sm text-blue-200/80">Direction</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#192233] border border-[#0e142d] rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white">Current Correlation (30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <CorrelationChart 
                      data={data.twitter.current} 
                      title="Twitter vs Price (30D)"
                      type="current"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#192233] border border-[#0e142d] rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white">Historical Correlation (1 Year)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <CorrelationChart 
                      data={data.twitter.historical} 
                      title="Twitter vs Price (1Y)"
                      type="historical"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* News Analytics */}
        <TabsContent value="news" className="mt-6">
          <div className="space-y-6">
            {/* Correlation Summary */}
            <Card className="bg-[#192233] border border-[#0e142d] rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg text-white">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Newspaper className="h-5 w-5 text-purple-400" />
                  </div>
                  News Signal Correlation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#0e142d]">
                    <div className="text-2xl font-bold text-white">{data.news.correlation.toFixed(3)}</div>
                    <div className="text-sm text-blue-200/80">Correlation Coefficient</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#0e142d]">
                    <div className="text-2xl font-bold text-white">{getCorrelationLabel(data.news.correlation)}</div>
                    <div className="text-sm text-blue-200/80">Strength</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#0e142d]">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white">
                      {getCorrelationIcon(data.news.correlation)}
                      {data.news.correlation > 0 ? 'Positive' : 'Negative'}
                    </div>
                    <div className="text-sm text-blue-200/80">Direction</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#192233] border border-[#0e142d] rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white">Current Correlation (30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <CorrelationChart 
                      data={data.news.current} 
                      title="News vs Price (30D)"
                      type="current"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#192233] border border-[#0e142d] rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white">Historical Correlation (1 Year)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <CorrelationChart 
                      data={data.news.historical} 
                      title="News vs Price (1Y)"
                      type="historical"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Google Trends Analytics */}
        <TabsContent value="googleTrends" className="mt-6">
          <div className="space-y-6">
            {/* Correlation Summary */}
            <Card className="bg-[#192233] border border-[#0e142d] rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg text-white">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <Search className="h-5 w-5 text-green-400" />
                  </div>
                  Google Trends Signal Correlation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#0e142d]">
                    <div className="text-2xl font-bold text-white">{data.googleTrends.correlation.toFixed(3)}</div>
                    <div className="text-sm text-blue-200/80">Correlation Coefficient</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#0e142d]">
                    <div className="text-2xl font-bold text-white">{getCorrelationLabel(data.googleTrends.correlation)}</div>
                    <div className="text-sm text-blue-200/80">Strength</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#0e142d]">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white">
                      {getCorrelationIcon(data.googleTrends.correlation)}
                      {data.googleTrends.correlation > 0 ? 'Positive' : 'Negative'}
                    </div>
                    <div className="text-sm text-blue-200/80">Direction</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#192233] border border-[#0e142d] rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white">Current Correlation (30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <CorrelationChart 
                      data={data.googleTrends.current} 
                      title="Google Trends vs Price (30D)"
                      type="current"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#192233] border border-[#0e142d] rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white">Historical Correlation (1 Year)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <CorrelationChart 
                      data={data.googleTrends.historical} 
                      title="Google Trends vs Price (1Y)"
                      type="historical"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}