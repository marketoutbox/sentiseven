"use client"

import { ArrowUp, ArrowDown, Activity, TrendingUp, TrendingDown, Twitter, Newspaper, Search } from "lucide-react"

interface SentimentData {
  twitter: {
    sentiment: number
    volume: number
    mentions: number
    trending: boolean
  }
  news: {
    sentiment: number
    articles: number
    sources: number
    impact: 'high' | 'medium' | 'low'
  }
  googleTrends: {
    sentiment: number
    searchVolume: number
    trend: 'rising' | 'falling'
    keywords: string[]
  }
}

interface SentimentGridProps {
  data: SentimentData
}

export function SentimentGrid({ data }: SentimentGridProps) {
  // Helper function to get sentiment color
  const getSentimentColor = (value: number) => {
    if (value > 0.3) return "text-emerald-400"
    if (value >= -0.3) return "text-amber-400"
    return "text-red-400"
  }

  // Helper function to get sentiment icon
  const getSentimentIcon = (value: number) => {
    if (value > 0.3) return <ArrowUp className="h-4 w-4 text-emerald-400" />
    if (value >= -0.3) return <Activity className="h-4 w-4 text-amber-400" />
    return <ArrowDown className="h-4 w-4 text-red-400" />
  }

  // Helper function to get sentiment label
  const getSentimentLabel = (value: number) => {
    if (value > 0.5) return "Very Positive"
    if (value > 0.2) return "Positive"
    if (value >= -0.2) return "Neutral"
    if (value >= -0.5) return "Negative"
    return "Very Negative"
  }

  // Helper function to get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-amber-400'
      case 'low': return 'text-blue-400'
      default: return 'text-blue-400'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      {/* Twitter Sentiment */}
      <div className="relative w-full p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#030514]/60 hover:border-blue-500/60 transition-all duration-300 group hover:shadow-lg hover:shadow-[#030516]/40">
        {/* Subtle hover effect overlay */}
        <div className="absolute inset-0 bg-[#040517]/0 group-hover:bg-[#040517]/30 rounded-xl transition-all duration-300" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Twitter className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">Twitter</div>
                <div className="text-blue-200/70 text-xs">Social Sentiment</div>
              </div>
            </div>
            {data.twitter.trending && (
              <div className="px-2 py-1 bg-emerald-500/20 rounded-full">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              </div>
            )}
          </div>

          {/* Sentiment Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-blue-200/80">Sentiment Score</span>
              <span className={`text-sm font-bold ${getSentimentColor(data.twitter.sentiment)}`}>
                {data.twitter.sentiment > 0 ? '+' : ''}{data.twitter.sentiment.toFixed(3)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {getSentimentIcon(data.twitter.sentiment)}
              <span className={`text-sm font-medium ${getSentimentColor(data.twitter.sentiment)}`}>
                {getSentimentLabel(data.twitter.sentiment)}
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-blue-200/70">Mentions</span>
              <span className="text-white font-medium">{data.twitter.mentions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-200/70">Volume</span>
              <span className="text-white font-medium">{data.twitter.volume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* News Sentiment */}
      <div className="relative w-full p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#030514]/60 hover:border-blue-500/60 transition-all duration-300 group hover:shadow-lg hover:shadow-[#030516]/40">
        {/* Subtle hover effect overlay */}
        <div className="absolute inset-0 bg-[#040517]/0 group-hover:bg-[#040517]/30 rounded-xl transition-all duration-300" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Newspaper className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">News</div>
                <div className="text-blue-200/70 text-xs">Media Sentiment</div>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              data.news.impact === 'high' ? 'bg-red-500/20 text-red-400' :
              data.news.impact === 'medium' ? 'bg-amber-500/20 text-amber-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {data.news.impact.toUpperCase()}
            </div>
          </div>

          {/* Sentiment Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-blue-200/80">Sentiment Score</span>
              <span className={`text-sm font-bold ${getSentimentColor(data.news.sentiment)}`}>
                {data.news.sentiment > 0 ? '+' : ''}{data.news.sentiment.toFixed(3)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {getSentimentIcon(data.news.sentiment)}
              <span className={`text-sm font-medium ${getSentimentColor(data.news.sentiment)}`}>
                {getSentimentLabel(data.news.sentiment)}
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-blue-200/70">Articles</span>
              <span className="text-white font-medium">{data.news.articles}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-200/70">Sources</span>
              <span className="text-white font-medium">{data.news.sources}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Trends Sentiment */}
      <div className="relative w-full p-4 bg-gradient-to-br from-[#040517] to-[#030514] rounded-xl border border-[#030514]/60 hover:border-blue-500/60 transition-all duration-300 group hover:shadow-lg hover:shadow-[#030516]/40">
        {/* Subtle hover effect overlay */}
        <div className="absolute inset-0 bg-[#040517]/0 group-hover:bg-[#040517]/30 rounded-xl transition-all duration-300" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <Search className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">Google Trends</div>
                <div className="text-blue-200/70 text-xs">Search Sentiment</div>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              data.googleTrends.trend === 'rising' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {data.googleTrends.trend === 'rising' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            </div>
          </div>

          {/* Sentiment Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-blue-200/80">Sentiment Score</span>
              <span className={`text-sm font-bold ${getSentimentColor(data.googleTrends.sentiment)}`}>
                {data.googleTrends.sentiment > 0 ? '+' : ''}{data.googleTrends.sentiment.toFixed(3)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {getSentimentIcon(data.googleTrends.sentiment)}
              <span className={`text-sm font-medium ${getSentimentColor(data.googleTrends.sentiment)}`}>
                {getSentimentLabel(data.googleTrends.sentiment)}
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-blue-200/70">Search Volume</span>
              <span className="text-white font-medium">{data.googleTrends.searchVolume}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-200/70">Keywords</span>
              <span className="text-white font-medium">{data.googleTrends.keywords.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}