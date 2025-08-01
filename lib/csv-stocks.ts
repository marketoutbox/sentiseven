export interface Stock {
  symbol: string
  name: string
  price?: number
  change?: number
}

// Cache for CSV data
let cachedStocks: Stock[] | null = null
let lastFetchTime: number | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

// Function to fetch current stock prices using existing API
const getCurrentPricesBatch = async (symbols: string[]): Promise<Record<string, number>> => {
  if (symbols.length === 0) return {}
  try {
    const response = await fetch("/api/stock-price/current/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbols }),
    })
    const data = await response.json()
    if (response.ok) {
      return data
    }
    throw new Error(data.error || "Failed to fetch current prices in batch")
  } catch (error) {
    console.error("Error fetching current prices in batch:", error)
    // Fallback to consistent mock prices for all symbols if batch API fails
    const mockPrices: Record<string, number> = {}
    symbols.forEach((symbol) => {
      const symbolSum = symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
      const basePrice = (symbolSum % 490) + 10 // Price between $10 and $500
      mockPrices[symbol] = Math.round(basePrice * 100) / 100
    })
    return mockPrices
  }
}

// Function to parse CSV content
const parseCSV = (csvContent: string): Stock[] => {
  const lines = csvContent.trim().split('\n')
  const header = lines[0].trim()
  
  console.log('CSV Header found:', JSON.stringify(header))
  console.log('CSV Header length:', header.length)
  console.log('Expected header:', JSON.stringify('symbol,company'))
  
  if (header !== 'symbol,company') {
    console.error('Invalid CSV format. Expected: symbol,company, but got:', JSON.stringify(header))
    // Let's be more flexible and try to continue if it's close
    if (!header.toLowerCase().includes('symbol') || !header.toLowerCase().includes('company')) {
      return []
    }
    console.warn('Header mismatch but contains expected fields, continuing...')
  }

  const stocks: Stock[] = []
  console.log('Total CSV lines:', lines.length)
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line) {
      const parts = line.split(',')
      const symbol = parts[0]?.trim()
      const name = parts.slice(1).join(',').trim() // Handle commas in company names
      
      if (symbol && name && symbol !== '' && name !== '') {
        stocks.push({
          symbol: symbol,
          name: name,
        })
      } else {
        console.warn(`Skipping invalid line ${i}: "${line}"`)
      }
    }
  }
  
  console.log('Successfully parsed stocks:', stocks.length)

  return stocks
}

// Function to load stocks from CSV with caching
export const loadStocksFromCSV = async (includePrices = false): Promise<Stock[]> => {
  try {
    // Check cache first
    const now = Date.now()
    if (cachedStocks && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION && !includePrices) {
      return cachedStocks
    }

    // Fetch CSV file
    console.log('Fetching CSV file from /list.csv...')
    const response = await fetch('/list.csv')
    if (!response.ok) {
      console.error('Failed to fetch CSV file:', response.status, response.statusText)
      throw new Error(`Failed to fetch stock list: ${response.status} ${response.statusText}`)
    }

    const csvContent = await response.text()
    console.log('CSV content loaded, length:', csvContent.length)
    console.log('First 100 characters of CSV:', JSON.stringify(csvContent.substring(0, 100)))
    const stocks = parseCSV(csvContent)
    console.log('Parsed stocks count:', stocks.length)

    if (includePrices && stocks.length > 0) {
      // Fetch current prices for all stocks
      const symbols = stocks.map(stock => stock.symbol)
      const prices = await getCurrentPricesBatch(symbols)

      // Add prices to stocks
      stocks.forEach(stock => {
        stock.price = prices[stock.symbol] || 0
        // Mock change percentage for now (in real app, you'd calculate from previous close)
        stock.change = ((Math.random() - 0.5) * 10) // Random change between -5% and +5%
      })
    }

    // Update cache
    cachedStocks = stocks
    lastFetchTime = now

    return stocks
  } catch (error) {
    console.error('Error loading stocks from CSV:', error)
    // Return empty array instead of throwing to prevent app crashes
    return []
  }
}

// Helper function to get all stocks with prices
export const getAllStocks = async (): Promise<Stock[]> => {
  return loadStocksFromCSV(true)
}

// Helper function to get all stocks without prices (faster for searches)
export const getAllStocksBasic = async (): Promise<Stock[]> => {
  return loadStocksFromCSV(false)
}

// Helper function to search stocks
export const searchStocks = async (query: string): Promise<Stock[]> => {
  const stocks = await getAllStocksBasic()
  return stocks.filter((stock) => {
    return (
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    )
  })
}

// Helper function to get stock by symbol
export const getStockBySymbol = async (symbol: string): Promise<Stock | undefined> => {
  const stocks = await getAllStocksBasic()
  return stocks.find((stock) => stock.symbol === symbol)
}

// Clear cache (useful for testing or forcing refresh)
export const clearStocksCache = (): void => {
  cachedStocks = null
  lastFetchTime = null
}