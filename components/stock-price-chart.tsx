"use client"

import { useState } from "react"
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
  ReferenceLine
} from "recharts"
import { Card } from "@/components/ui/card"

interface PriceData {
  date: string
  price: number
  volume: number
}

interface StockPriceChartProps {
  data: PriceData[]
}

export function StockPriceChart({ data }: StockPriceChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('area')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  
  // Filter data based on time range
  const getFilteredData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    return data.slice(-days)
  }
  
  const filteredData = getFilteredData()
  
  // Calculate min/max for Y-axis
  const prices = filteredData.map(d => d.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice
  const yDomain = [minPrice - priceRange * 0.1, maxPrice + priceRange * 0.1]
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-[#090e23] border border-[#0e142d] p-3 shadow-lg">
          <div className="text-white">
            <p className="font-semibold">{label}</p>
            <p className="text-emerald-400">${payload[0].value}</p>
            {payload[1] && (
              <p className="text-blue-400">Volume: {payload[1].value.toLocaleString()}</p>
            )}
          </div>
        </Card>
      )
    }
    return null
  }
  
  // Custom axis tick
  const CustomAxisTick = ({ x, y, payload }: any) => (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={12}>
        {payload.value}
      </text>
    </g>
  )
  
  const CustomYAxisTick = ({ x, y, payload }: any) => (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dx={-10} textAnchor="end" fill="#94a3b8" fontSize={12}>
        ${payload.value}
      </text>
    </g>
  )

  return (
    <div className="w-full h-full">
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
              chartType === 'area'
                ? 'bg-[#1e31dd] text-white'
                : 'bg-[#192233] text-blue-200 hover:bg-[#1a2536]'
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
              chartType === 'line'
                ? 'bg-[#1e31dd] text-white'
                : 'bg-[#192233] text-blue-200 hover:bg-[#1a2536]'
            }`}
          >
            Line
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
              timeRange === '7d'
                ? 'bg-[#1e31dd] text-white'
                : 'bg-[#192233] text-blue-200 hover:bg-[#1a2536]'
            }`}
          >
            7D
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
              timeRange === '30d'
                ? 'bg-[#1e31dd] text-white'
                : 'bg-[#192233] text-blue-200 hover:bg-[#1a2536]'
            }`}
          >
            30D
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
              timeRange === '90d'
                ? 'bg-[#1e31dd] text-white'
                : 'bg-[#192233] text-blue-200 hover:bg-[#1a2536]'
            }`}
          >
            90D
          </button>
        </div>
      </div>
      
      {/* Chart Container */}
      <div className="w-full h-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e31dd" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1e31dd" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={<CustomAxisTick />}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis 
                domain={yDomain}
                tick={<CustomYAxisTick />}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#1e31dd"
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 6, fill: "#1e31dd", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={<CustomAxisTick />}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis 
                domain={yDomain}
                tick={<CustomYAxisTick />}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#1e31dd"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#1e31dd", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {/* Chart Info */}
      <div className="mt-4 text-center">
        <div className="text-sm text-blue-200/80">
          {filteredData.length} data points • {timeRange} view • {chartType} chart
        </div>
      </div>
    </div>
  )
}