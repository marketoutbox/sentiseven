"use client"

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"
import { Card } from "@/components/ui/card"

interface CorrelationDataPoint {
  date: string
  sentiment: number
  price: number
}

interface CorrelationChartProps {
  data: CorrelationDataPoint[]
  title: string
  type: 'current' | 'historical'
}

export function CorrelationChart({ data, title, type }: CorrelationChartProps) {
  // Process data for better visualization
  const processedData = data.map((point, index) => ({
    ...point,
    // Normalize sentiment to 0-100 scale for better bar visualization
    sentimentNormalized: ((point.sentiment + 1) * 50), // Convert from -1,1 to 0,100
    // Normalize price to 0-100 scale
    priceNormalized: ((point.price - Math.min(...data.map(d => d.price))) / 
                     (Math.max(...data.map(d => d.price)) - Math.min(...data.map(d => d.price)))) * 100,
    // Create a simple index for X-axis
    index: index
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = processedData[label]
      return (
        <Card className="bg-[#090e23] border border-[#0e142d] p-3 shadow-lg">
          <div className="text-white space-y-2">
            <p className="font-semibold">{dataPoint?.date || `Point ${label}`}</p>
            <div className="space-y-1">
              <p className="text-emerald-400">
                Sentiment: {dataPoint?.sentiment.toFixed(3)}
              </p>
              <p className="text-blue-400">
                Price: ${dataPoint?.price.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      )
    }
    return null
  }

  // Custom axis tick for X-axis
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    if (type === 'current') {
      // For current data, show dates
      const dataPoint = processedData[payload.value]
      if (dataPoint) {
        const date = new Date(dataPoint.date)
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`
        return (
          <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              {formattedDate}
            </text>
          </g>
        )
      }
    }
    
    // For historical data, show month labels
    if (payload.value % 30 === 0) {
      const dataPoint = processedData[payload.value]
      if (dataPoint) {
        const date = new Date(dataPoint.date)
        const monthName = date.toLocaleDateString('en-US', { month: 'short' })
        return (
          <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              {monthName}
            </text>
          </g>
        )
      }
    }
    
    return null
  }

  // Custom Y-axis tick for sentiment
  const CustomSentimentYAxisTick = ({ x, y, payload }: any) => (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dx={-10} textAnchor="end" fill="#94a3b8" fontSize={10}>
        {((payload.value / 50) - 1).toFixed(1)}
      </text>
    </g>
  )

  // Custom Y-axis tick for price
  const CustomPriceYAxisTick = ({ x, y, payload }: any) => (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dx={-10} textAnchor="end" fill="#94a3b8" fontSize={10}>
        ${payload.value.toFixed(0)}
      </text>
    </g>
  )

  return (
    <div className="w-full h-full">
      {/* Chart Title */}
      <div className="text-center mb-4">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <p className="text-xs text-blue-200/60">
          {type === 'current' ? '30-day correlation analysis' : '1-year historical correlation'}
        </p>
      </div>

      {/* Chart Container */}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
          
          {/* X-axis */}
          <XAxis 
            dataKey="index" 
            tick={<CustomXAxisTick />}
            interval={type === 'current' ? Math.ceil(processedData.length / 7) : Math.ceil(processedData.length / 12)}
          />
          
          {/* Left Y-axis for sentiment (bars) */}
          <YAxis 
            yAxisId="left"
            orientation="left"
            tick={<CustomSentimentYAxisTick />}
            domain={[0, 100]}
            width={40}
          />
          
          {/* Right Y-axis for price (line) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={<CustomPriceYAxisTick />}
            domain={['dataMin', 'dataMax']}
            width={50}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Reference line for neutral sentiment */}
          <ReferenceLine y={50} yAxisId="left" stroke="#64748b" strokeDasharray="3 3" opacity={0.5} />
          
          {/* Sentiment bars */}
          <Bar
            yAxisId="left"
            dataKey="sentimentNormalized"
            fill="#1e31dd"
            opacity={0.6}
            radius={[2, 2, 0, 0]}
          />
          
          {/* Price line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="price"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Chart Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#1e31dd] rounded-sm opacity-60"></div>
          <span className="text-blue-200/80">Sentiment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#10b981] rounded-sm"></div>
          <span className="text-emerald-200/80">Price</span>
        </div>
      </div>

      {/* Chart Info */}
      <div className="mt-2 text-center">
        <div className="text-xs text-blue-200/60">
          {processedData.length} data points • {type === 'current' ? 'Daily' : 'Monthly'} intervals
        </div>
      </div>
    </div>
  )
}
