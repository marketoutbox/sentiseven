"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InfoIcon as InfoCircle, Loader2 } from "lucide-react" // Added Loader2 for loading state

export function CorrelationChart() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dynamicSourceCorrelationData, setDynamicSourceCorrelationData] = useState([])

  useEffect(() => {
    const fetchSignalSummaries = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/signal-summaries")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const summaries = await response.json()

        // Initial structure for correlation data, impact will be dynamic
        const updatedData = [
          {
            name: "GTrends",
            correlation: 0.92, // This correlation value is still hardcoded as it's separate from win rate impact
            color: "#10b981", // emerald-500
            winRate: 0,
          },
          {
            name: "Twitter",
            correlation: 0.65,
            color: "#f59e0b", // amber-500
            winRate: 0,
          },
          {
            name: "Composite",
            correlation: 0.58,
            color: "#3b82f6", // blue-500
            winRate: 0,
          },
          {
            name: "News",
            correlation: 0.15,
            color: "#ef4444", // red-500
            winRate: 0,
          },
        ]

        let totalWinRate = 0
        let countForComposite = 0

        summaries.forEach((summary) => {
          const winRate = summary.win_rate_percent || 0 // Default to 0 if null/undefined
          if (summary.signal_type === "google_trends") {
            const index = updatedData.findIndex((d) => d.name === "GTrends")
            if (index !== -1) {
              updatedData[index].winRate = winRate
              totalWinRate += winRate
              countForComposite++
            }
          } else if (summary.signal_type === "twitter") {
            const index = updatedData.findIndex((d) => d.name === "Twitter")
            if (index !== -1) {
              updatedData[index].winRate = winRate
              totalWinRate += winRate
              countForComposite++
            }
          } else if (summary.signal_type === "news") {
            const index = updatedData.findIndex((d) => d.name === "News")
            if (index !== -1) {
              updatedData[index].winRate = winRate
              totalWinRate += winRate
              countForComposite++
            }
          }
        })

        // Calculate composite win rate
        const compositeIndex = updatedData.findIndex((d) => d.name === "Composite")
        if (compositeIndex !== -1 && countForComposite > 0) {
          updatedData[compositeIndex].winRate = totalWinRate / countForComposite
        }

        setDynamicSourceCorrelationData(updatedData)
      } catch (err: any) {
        console.error("Error fetching signal summaries for correlation chart:", err)
        setError(err.message || "Failed to load correlation data.")
      } finally {
        setLoading(false)
      }
    }

    fetchSignalSummaries()
  }, []) // Empty dependency array to run once on mount

  // Helper function to get the width percentage based on win rate value
  const getWinRateWidthPercentage = (winRate: number) => {
    return `${Math.min(winRate, 100)}%` // Ensure it doesn't exceed 100%
  }

  // NEW: Helper function to get the impact text based on win rate
  const getWinRateImpactText = (winRate: number) => {
    if (winRate >= 76) return "Very Strong"
    if (winRate >= 51) return "Strong"
    if (winRate >= 26) return "Moderate"
    return "Weak"
  }

  return (
    <Card className="bg-[#1e293b] backdrop-blur-xl border border-[#1e293b]/50 shadow-2xl shadow-[#1e293b]/30 rounded-3xl overflow-hidden">
      <CardHeader className="pb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-bold text-white">
              <div className="p-2 bg-gradient-to-r from-blue-600/40 to-purple-600/40 rounded-xl border border-blue-500/40">
                <InfoCircle className="h-6 w-6 text-blue-200" />
              </div>
              Sentiment-Price Correlation
            </CardTitle>
            <CardDescription className="text-blue-100/80 text-base">
              This table shows the relationship between the source of information and historical price
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-2 text-blue-100/80">Loading correlation data...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 text-red-300 border border-red-500/20 rounded-xl">{error}</div>
        ) : (
          <div className="space-y-6">
            {/* Header row */}
            <div className="grid grid-cols-2 gap-4 py-2 text-sm font-medium text-blue-100/80">
              <div>Source</div>
              <div className="flex items-center justify-end">
                Correlation Impact / Win Rate %
                <InfoCircle className="ml-1 h-4 w-4" />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-blue-800/40"></div>

            {/* Source rows in a 2x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {dynamicSourceCorrelationData.map((source, index) => (
                <div key={index} className="space-y-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-lg font-medium text-white">{source.name}</div>
                    <div className="flex items-center justify-end text-sm font-medium" style={{ color: source.color }}>
                      {getWinRateImpactText(source.winRate)} {/* Dynamically set impact text */}
                    </div>
                  </div>

                  {/* Scale labels ABOVE progress bar */}
                  <div className="grid grid-cols-4 text-xs text-blue-200/70 mb-1">
                    <div className="text-left">Weak</div>
                    <div className="text-center">Moderate</div>
                    <div className="text-center">Strong</div>
                    <div className="text-right">Very Strong</div>
                  </div>

                  {/* Progress bar container (relative for absolute children) */}
                  <div className="relative h-3 w-full rounded-full bg-slate-800/60 border border-blue-800/40">
                    {/* Percentage text above marker */}
                    <div
                      className="absolute bottom-[calc(100%+0.25rem)] text-xs text-black z-10"
                      style={{
                        left: getWinRateWidthPercentage(source.winRate),
                        transform: "translateX(-50%)", // Center text on the marker
                        textShadow: "0 0 3px rgba(255,255,255,0.8)", // Stronger white shadow for readability
                      }}
                    >
                      {source.winRate.toFixed(1)}%
                    </div>

                    {/* Vertical marker */}
                    <div
                      className="absolute top-0 h-full w-px bg-black z-10"
                      style={{ left: getWinRateWidthPercentage(source.winRate) }}
                    ></div>

                    {/* Progress bar fill */}
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: getWinRateWidthPercentage(source.winRate),
                        backgroundColor: source.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
