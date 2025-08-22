"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, MessageCircle, Newspaper, TrendingUp as TrendingUpIcon } from "lucide-react"

interface SentimentGridProps {
  sentimentData: {
    twitter: { score: string; trend: string; volume: number }
    news: { score: string; trend: string; volume: number }
    googleTrends: { score: string; trend: string; volume: number }
  }
}

export function SentimentGrid({ sentimentData }: SentimentGridProps) {
  const getSentimentColor = (score: string) => {
    const numScore = parseFloat(score)
    if (numScore > 0.3) return "text-emerald-500"
    if (numScore >= -0.3) return "text-amber-500"
    return "text-red-500"
  }

  const getSentimentIcon = (score: string) => {
    const numScore = parseFloat(score)
    if (numScore > 0.3) return <TrendingUp className="h-5 w-5 text-emerald-500" />
    if (numScore >= -0.3) return <Activity className="h-5 w-5 text-amber-500" />
    return <TrendingDown className="h-5 w-5 text-red-500" />
  }

  const getSentimentBadge = (score: string) => {
    const numScore = parseFloat(score)
    if (numScore > 0.5) return { text: "Very Positive", color: "bg-emerald-500/20 text-emerald-400" }
    if (numScore > 0.2) return { text: "Positive", color: "bg-emerald-400/20 text-emerald-300" }
    if (numScore > -0.2) return { text: "Neutral", color: "bg-amber-400/20 text-amber-300" }
    if (numScore > -0.5) return { text: "Negative", color: "bg-red-400/20 text-red-300" }
    return { text: "Very Negative", color: "bg-red-500/20 text-red-400" }
  }

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const sentimentCards = [
    {
      title: "Twitter Signals",
      icon: <MessageCircle className="h-6 w-6 text-blue-500" />,
      data: sentimentData.twitter,
      description: "Social media sentiment analysis",
      color: "border-blue-500/20",
    },
    {
      title: "News Signals",
      icon: <Newspaper className="h-6 w-6 text-purple-500" />,
      data: sentimentData.news,
      description: "Media coverage sentiment",
      color: "border-purple-500/20",
    },
    {
      title: "Google Trends",
      icon: <TrendingUpIcon className="h-6 w-6 text-green-500" />,
      data: sentimentData.googleTrends,
      description: "Search trend analysis",
      color: "border-green-500/20",
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Current Sentiment Analysis</h2>
      
      {/* 3-Column Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sentimentCards.map((card, index) => (
          <Card key={index} className={`bg-slate-900 border-slate-800 ${card.color}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {card.icon}
                  <CardTitle className="text-slate-50 text-lg">{card.title}</CardTitle>
                </div>
                {getSentimentIcon(card.data.score)}
              </div>
              <p className="text-sm text-slate-400">{card.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sentiment Score */}
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {parseFloat(card.data.score) > 0 ? "+" : ""}{card.data.score}
                </div>
                <Badge className={getSentimentBadge(card.data.score).color}>
                  {getSentimentBadge(card.data.score).text}
                </Badge>
              </div>

              {/* Trend and Volume */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-slate-400 mb-1">Trend</p>
                  <div className="flex items-center justify-center gap-1">
                    {getTrendIcon(card.data.trend)}
                    <span className="text-white capitalize">{card.data.trend}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 mb-1">Volume</p>
                  <p className="text-white font-medium">
                    {card.data.volume > 1000000 
                      ? `${(card.data.volume / 1000000).toFixed(1)}M`
                      : card.data.volume > 1000 
                      ? `${(card.data.volume / 1000).toFixed(1)}K`
                      : card.data.volume.toLocaleString()
                    }
                  </p>
                </div>
              </div>

              {/* Sentiment Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>-1.0</span>
                  <span>0.0</span>
                  <span>+1.0</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      parseFloat(card.data.score) > 0 ? "bg-emerald-500" : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.abs(parseFloat(card.data.score)) * 50}%`,
                      marginLeft: parseFloat(card.data.score) < 0 ? "auto" : "0",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}