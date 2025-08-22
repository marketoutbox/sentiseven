// Mock data generator for stock detail pages

// Generate mock stock price history
export function generateMockStockData(symbol: string) {
  const basePrice = Math.random() * 400 + 50 // Random price between $50-$450
  const priceHistory = []
  const now = new Date()
  
  // Generate 30 days of price data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Add some realistic price volatility
    const volatility = (Math.random() - 0.5) * 0.04 // ±2% daily change
    const price = basePrice * (1 + volatility)
    
    priceHistory.push({
      date: date.toISOString().split('T')[0],
      price: Number(price.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000
    })
  }
  
  const currentPrice = priceHistory[priceHistory.length - 1].price
  const previousPrice = priceHistory[priceHistory.length - 2].price
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100
  
  return {
    symbol,
    companyName: getCompanyName(symbol),
    currentPrice,
    priceChange,
    volume: Math.floor(Math.random() * 100000000) + 10000000,
    marketCap: Math.floor(Math.random() * 500) + 50,
    peRatio: Number((Math.random() * 20 + 10).toFixed(1)),
    weekHigh52: Number((basePrice * 1.3).toFixed(2)),
    weekLow52: Number((basePrice * 0.7).toFixed(2)),
    priceHistory
  }
}

// Generate mock sentiment data
export function generateMockSentimentData(symbol: string) {
  const baseSentiment = Math.random() * 0.6 - 0.3 // Random baseline between -0.3 and 0.3
  
  return {
    twitter: {
      sentiment: Number((baseSentiment + (Math.random() - 0.5) * 0.2).toFixed(3)),
      volume: Math.floor(Math.random() * 10000) + 1000,
      mentions: Math.floor(Math.random() * 5000) + 500,
      trending: Math.random() > 0.5
    },
    news: {
      sentiment: Number((baseSentiment + (Math.random() - 0.5) * 0.3).toFixed(3)),
      articles: Math.floor(Math.random() * 100) + 10,
      sources: Math.floor(Math.random() * 20) + 5,
      impact: Math.random() > 0.6 ? 'high' : 'medium'
    },
    googleTrends: {
      sentiment: Number((baseSentiment + (Math.random() - 0.5) * 0.25).toFixed(3)),
      searchVolume: Math.floor(Math.random() * 100) + 10,
      trend: Math.random() > 0.5 ? 'rising' : 'falling',
      keywords: ['earnings', 'dividend', 'growth', 'innovation'].slice(0, Math.floor(Math.random() * 3) + 1)
    }
  }
}

// Generate mock correlation data
export function generateMockCorrelationData(symbol: string) {
  const generateTimeSeries = (days: number, baseValue: number, volatility: number) => {
    const data = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      const variation = (Math.random() - 0.5) * volatility
      const value = Math.max(-1, Math.min(1, baseValue + variation))
      
      data.push({
        date: date.toISOString().split('T')[0],
        sentiment: Number(value.toFixed(3)),
        price: Math.random() * 100 + 50
      })
    }
    
    return data
  }
  
  return {
    twitter: {
      current: generateTimeSeries(30, Math.random() * 0.4 - 0.2, 0.3),
      historical: generateTimeSeries(365, Math.random() * 0.4 - 0.2, 0.25),
      correlation: Number((Math.random() * 0.6 + 0.2).toFixed(3))
    },
    news: {
      current: generateTimeSeries(30, Math.random() * 0.4 - 0.2, 0.35),
      historical: generateTimeSeries(365, Math.random() * 0.4 - 0.2, 0.3),
      correlation: Number((Math.random() * 0.7 + 0.15).toFixed(3))
    },
    googleTrends: {
      current: generateTimeSeries(30, Math.random() * 0.4 - 0.2, 0.28),
      historical: generateTimeSeries(365, Math.random() * 0.4 - 0.2, 0.22),
      correlation: Number((Math.random() * 0.5 + 0.25).toFixed(3))
    }
  }
}

// Helper function to get company names
function getCompanyName(symbol: string): string {
  const companies: { [key: string]: string } = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix Inc.',
    'AMD': 'Advanced Micro Devices Inc.',
    'CRM': 'Salesforce Inc.',
    'ORCL': 'Oracle Corporation',
    'INTC': 'Intel Corporation',
    'CSCO': 'Cisco Systems Inc.',
    'IBM': 'International Business Machines Corporation',
    'ADBE': 'Adobe Inc.',
    'PYPL': 'PayPal Holdings Inc.',
    'UBER': 'Uber Technologies Inc.',
    'LYFT': 'Lyft Inc.',
    'SNAP': 'Snap Inc.',
    'TWTR': 'Twitter Inc.'
  }
  
  return companies[symbol] || `${symbol} Corporation`
}