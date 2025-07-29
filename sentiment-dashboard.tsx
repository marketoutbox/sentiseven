"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowUp,
  ArrowDown,
  Activity,
  BarChart3,
  Edit2,
  Lock,
  Unlock,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StockSelector } from "./components/stock-selector"
import { StockDetailView } from "./components/stock-detail-view"
import { CorrelationChart } from "./components/correlation-chart"
import StockAllocation from "./components/stock-allocation"
import { AddBasketModal } from "./components/add-basket-modal"
import { useAuth } from "@/context/auth-context"
import {
  saveBasket,
  getMostRecentBasket,
  getAllUserBaskets,
  getBasketById,
  deleteBasket,
  unlockBasket,
  type StockBasket,
  type BasketStock,
} from "@/lib/basket-service"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"

// Add this import at the top with the other imports
import { Edit } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const SentimentDashboard = () => {
  // Auth context
  const { user } = useAuth()
  const { toast } = useToast()

  // State for time period and source weights
  const [timePeriod, setTimePeriod] = useState("1w")
  const [weights, setWeights] = useState({
    twitter: 0.4,
    googleTrends: 0.3,
    news: 0.3,
  })

  // Add this after the weights state
  const [weightLocks, setWeightLocks] = useState({
    twitter: false,
    googleTrends: false,
    news: false,
  })

  // Add this state for date editing near the other state declarations
  const [isEditingLockDate, setIsEditingLockDate] = useState(false)

  // Sample basket of stocks with allocation percentages
  const [stocks, setStocks] = useState([
    { id: 1, symbol: "AAPL", name: "Apple Inc.", sector: "Technology", allocation: 25, locked: false },
    { id: 2, symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", allocation: 20, locked: true },
    { id: 3, symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical", allocation: 20, locked: false },
    { id: 4, symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", allocation: 15, locked: false },
    { id: 5, symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", allocation: 20, locked: true },
  ])

  // State for basket management
  const [basketId, setBasketId] = useState<string | null>(null)
  const [basketName, setBasketName] = useState("Tech Leaders")
  const [basketLocked, setBasketLocked] = useState(false)
  const [basketDates, setBasketDates] = useState({
    created: null,
    updated: null,
    locked: null,
  })

  // State for basket management
  const [allBaskets, setAllBaskets] = useState<StockBasket[]>([])
  const [selectedBasketId, setSelectedBasketId] = useState<string | null>(null)
  const [isLoadingBaskets, setIsLoadingBaskets] = useState(false)

  // State for Add Basket Modal
  const [isAddBasketModalOpen, setIsAddBasketModalOpen] = useState(false)

  // State for loading
  const [isLoading, setIsLoading] = useState(false)

  // Sample sentiment data
  const sentimentData = {
    "1d": generateSentimentData(1),
    "1w": generateSentimentData(7),
    "1m": generateSentimentData(30),
  }

  // State for stock selector dialog
  const [isStockSelectorOpen, setIsStockSelectorOpen] = useState(false)

  // State for selected stock
  const [selectedStock, setSelectedStock] = useState(null)

  // State for allocation editor
  const [isAllocationEditorOpen, setIsAllocationEditorOpen] = useState(false)

  // Add a new state for the unlock alert dialog
  const [isUnlockBasketAlertOpen, setIsUnlockBasketAlertOpen] = useState(false)

  // State for section collapse
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    inputs: false,
    insights: false,
    tracking: false,
  })

  // Load user's baskets and most recent basket when component mounts
  useEffect(() => {
    if (user) {
      loadUserBaskets()
      loadMostRecentBasket()
    }
  }, [user])

  // Load all user baskets
  const loadUserBaskets = async () => {
    setIsLoadingBaskets(true)
    try {
      const { baskets, error } = await getAllUserBaskets()

      if (error) {
        console.error("Error loading baskets:", error)
        return
      }

      if (baskets) {
        setAllBaskets(baskets)
      }
    } catch (error) {
      console.error("Error in loadUserBaskets:", error)
    } finally {
      setIsLoadingBaskets(false)
    }
  }

  // Load a specific basket
  const loadBasket = async (basketId: string) => {
    setIsLoading(true)
    try {
      const { basket, stocks: basketStocks, error } = await getBasketById(basketId)

      if (error) {
        console.error("Error loading basket:", error)
        toast({
          title: "Error",
          description: "Failed to load the selected basket. Please try again.",
          variant: "destructive",
        })
        return
      }

      if (basket) {
        // Update the state with the loaded basket
        setBasketId(basket.id)
        setSelectedBasketId(basket.id)
        setBasketName(basket.name)
        setBasketLocked(basket.is_locked)
        setWeights(basket.source_weights)

        // Convert dates
        if (basket.created_at) {
          setBasketDates({
            created: new Date(basket.created_at),
            updated: basket.updated_at ? new Date(basket.updated_at) : null,
            locked: basket.locked_at ? new Date(basket.locked_at) : null, // Add locked date
          })
        }

        // Convert stocks format
        if (basketStocks && basketStocks.length > 0) {
          const formattedStocks = basketStocks.map((stock) => ({
            id: stock.id,
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            allocation: stock.allocation,
            locked: stock.is_locked,
          }))
          setStocks(formattedStocks)
        } else {
          setStocks([])
        }

        toast({
          title: "Basket Loaded",
          description: `Successfully loaded "${basket.name}" basket.`,
        })
      }
    } catch (error) {
      console.error("Error in loadBasket:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load the most recent basket
  const loadMostRecentBasket = async () => {
    setIsLoading(true)
    try {
      const { basket, stocks: basketStocks, error } = await getMostRecentBasket()

      if (error) {
        console.error("Error loading basket:", error)
        toast({
          title: "Error",
          description: "Failed to load your basket. Please try again.",
          variant: "destructive",
        })
        return
      }

      if (basket) {
        // Update the state with the loaded basket
        setBasketId(basket.id)
        setSelectedBasketId(basket.id)
        setBasketName(basket.name)
        setBasketLocked(basket.is_locked)
        setWeights(basket.source_weights)

        // Convert dates
        if (basket.created_at) {
          setBasketDates({
            created: new Date(basket.created_at),
            updated: basket.updated_at ? new Date(basket.updated_at) : null,
            locked: basket.locked_at ? new Date(basket.locked_at) : null, // Add locked date
          })
        }

        // Convert stocks format
        if (basketStocks && basketStocks.length > 0) {
          const formattedStocks = basketStocks.map((stock) => ({
            id: stock.id,
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            allocation: stock.allocation,
            locked: stock.is_locked,
          }))
          setStocks(formattedStocks)
        }
      }
    } catch (error) {
      console.error("Error in loadMostRecentBasket:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Save changes to current basket
  const saveCurrentBasket = async (isLocked = false) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your basket.",
        variant: "destructive",
      })
      return
    }

    if (!basketId) {
      toast({
        title: "No Basket Selected",
        description: "Please select a basket or create a new one.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Format the basket data
      const basketData: StockBasket = {
        id: basketId,
        name: basketName,
        source_weights: weights,
        is_locked: isLocked,
        locked_at: basketDates.locked?.toISOString(), // Preserve the existing locked date
      }

      // Format the stocks data
      const stocksData: BasketStock[] = stocks.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector || "Unknown",
        allocation: stock.allocation,
        is_locked: stock.locked,
      }))

      // Save the basket
      const { error } = await saveBasket(basketData, stocksData, false)

      if (error) {
        console.error("Error saving basket:", error)
        toast({
          title: "Error",
          description: "Failed to save your basket. Please try again.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Your changes have been saved.",
      })

      // If locking the basket, update the state
      if (isLocked) {
        setBasketLocked(true)
        const now = new Date()
        setBasketDates({
          created: basketDates.created || now,
          updated: now,
          locked: now, // Set the locked date
        })

        // Scroll to the basket tracking section
        setTimeout(() => {
          const trackingSection = document.getElementById("tracking-section")
          if (trackingSection) {
            trackingSection.scrollIntoView({ behavior: "smooth" })
          }
        }, 100)

        // Only reload baskets list when locking (status change)
        await loadUserBaskets()
      }
    } catch (error) {
      console.error("Error in saveCurrentBasket:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Create new basket
  const createNewBasket = async (newBasketName: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a basket.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Format the basket data
      const basketData: StockBasket = {
        name: newBasketName,
        source_weights: weights,
        is_locked: false,
      }

      // Format the stocks data
      const stocksData: BasketStock[] = stocks.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector || "Unknown",
        allocation: stock.allocation,
        is_locked: stock.locked,
      }))

      // Save the new basket
      const { error, basketId: newBasketId } = await saveBasket(basketData, stocksData, true)

      if (error) {
        console.error("Error creating basket:", error)
        toast({
          title: "Error",
          description: "Failed to create new basket. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Update state to switch to the new basket
      if (newBasketId) {
        setBasketId(newBasketId)
        setSelectedBasketId(newBasketId)
        setBasketName(newBasketName)
        setBasketLocked(false)
        const now = new Date()
        setBasketDates({
          created: now,
          updated: now,
          locked: null, // New baskets aren't locked
        })
      }

      toast({
        title: "Success",
        description: `New basket "${newBasketName}" created successfully.`,
      })

      // Close modal and reload baskets list
      setIsAddBasketModalOpen(false)
      await loadUserBaskets()
    } catch (error) {
      console.error("Error in createNewBasket:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Delete basket
  const handleDeleteBasket = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete a basket.",
        variant: "destructive",
      })
      return
    }

    if (!basketId) {
      toast({
        title: "No Basket Selected",
        description: "Please select a basket to delete.",
        variant: "destructive",
      })
      return
    }

    if (basketLocked) {
      toast({
        title: "Cannot Delete Locked Basket",
        description: "Locked baskets cannot be deleted to preserve tracking data.",
        variant: "destructive",
      })
      return
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the basket "${basketName}"? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    try {
      const { error } = await deleteBasket(basketId)

      if (error) {
        console.error("Error deleting basket:", error)
        toast({
          title: "Error",
          description: "Failed to delete the basket. Please try again.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: `Basket "${basketName}" has been deleted.`,
      })

      // Reset state
      setBasketId(null)
      setSelectedBasketId(null)
      setBasketName("New Basket")
      setBasketLocked(false)
      setBasketDates({
        created: null,
        updated: null,
        locked: null, // Reset locked date
      })

      // Reload baskets list
      await loadUserBaskets()
    } catch (error) {
      console.error("Error in handleDeleteBasket:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add this function to handle updating the lock date
  const handleUpdateLockDate = async (newDate: Date) => {
    if (!basketId) return

    setIsLoading(true)
    try {
      // Format the date for Supabase
      const formattedDate = newDate.toISOString()

      // Update the locked_at field in the database
      const { error } = await supabase.from("stock_baskets").update({ locked_at: formattedDate }).eq("id", basketId)

      if (error) {
        console.error("Error updating lock date:", error)
        toast({
          title: "Error",
          description: "Failed to update the lock date. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Update local state
      setBasketDates({
        ...basketDates,
        locked: newDate,
      })

      toast({
        title: "Success",
        description: "Lock date updated successfully.",
      })
    } catch (error) {
      console.error("Error in handleUpdateLockDate:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Unlock basket
  const handleUnlockBasket = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to unlock a basket.",
        variant: "destructive",
      })
      return
    }

    if (!basketId) {
      toast({
        title: "No Basket Selected",
        description: "Please select a basket to unlock.",
        variant: "destructive",
      })
      return
    }

    if (!basketLocked) {
      toast({
        title: "Basket Already Unlocked",
        description: "This basket is already in editable mode.",
        variant: "default",
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await unlockBasket(basketId)

      if (error) {
        console.error("Error unlocking basket:", error)
        toast({
          title: "Error",
          description: "Failed to unlock the basket. Please try again.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: `Basket "${basketName}" has been unlocked and is now editable.`,
      })

      // Update state
      setBasketLocked(false)

      // Reload baskets list
      await loadUserBaskets()
    } catch (error) {
      console.error("Error in handleUnlockBasket:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle basket selection change
  const handleBasketChange = (basketId: string) => {
    if (basketId && basketId !== selectedBasketId) {
      loadBasket(basketId)
    }
  }

  // Toggle section collapse
  const toggleSection = (section) => {
    setSectionsCollapsed({
      ...sectionsCollapsed,
      [section]: !sectionsCollapsed[section],
    })
  }

  // Function to handle saving stocks from the stock selector
  const handleSaveStocks = (newStocks) => {
    // If these are stocks from the StockAllocation component, just update them directly
    if (newStocks.length > 0 && newStocks[0].hasOwnProperty("allocation")) {
      // Remove duplicates by id before setting
      const uniqueStocks = newStocks.filter((stock, index, self) => index === self.findIndex((s) => s.id === stock.id))
      setStocks(uniqueStocks)
      return
    }

    // Otherwise, this is from the StockSelector - handle adding new stocks
    const existingStockIds = stocks.map((stock) => stock.id)
    const brandNewStocks = newStocks.filter((stock) => !existingStockIds.includes(stock.id))
    const continuingStocks = newStocks.filter((stock) => existingStockIds.includes(stock.id))

    // Preserve allocations and locked status for existing stocks
    const updatedContinuingStocks = continuingStocks.map((newStock) => {
      const existingStock = stocks.find((s) => s.id === newStock.id)
      return {
        ...newStock,
        allocation: existingStock?.allocation || 0,
        locked: existingStock?.locked || false,
      }
    })

    // Set new stocks to 0% allocation by default
    const updatedNewStocks = brandNewStocks.map((stock) => ({
      ...stock,
      allocation: 0,
      locked: false,
    }))

    // Combine continuing and new stocks, ensuring no duplicates
    const finalStocks = [...updatedContinuingStocks, ...updatedNewStocks]
    const uniqueFinalStocks = finalStocks.filter(
      (stock, index, self) => index === self.findIndex((s) => s.id === stock.id),
    )

    setStocks(uniqueFinalStocks)
  }

  // Generate weighted composite sentiment
  const calculateWeightedSentiment = () => {
    return sentimentData[timePeriod].map((day) => {
      const weightedSentiment =
        day.twitterSentiment * weights.twitter +
        day.googleTrendsSentiment * weights.googleTrends +
        day.newsSentiment * weights.news

      return {
        ...day,
        compositeSentiment: Number.parseFloat(weightedSentiment.toFixed(2)),
      }
    })
  }

  // Add these functions after the calculateWeightedSentiment function
  // Function to toggle lock status of a weight
  const toggleWeightLock = (source) => {
    setWeightLocks({
      ...weightLocks,
      [source]: !weightLocks[source],
    })
  }

  // Update the handleWeightChange function to respect locks
  const handleWeightChange = (source, value) => {
    const newValue = Number.parseFloat(value[0])

    // Calculate how much we need to adjust other weights to maintain sum = 1
    const otherSources = Object.keys(weights).filter((key) => key !== source && !weightLocks[key])

    // If all other sources are locked, we can't adjust
    if (otherSources.length === 0) {
      // Just update this source and normalize
      const newWeights = { ...weights, [source]: newValue }
      const sum = Object.values(newWeights).reduce((a, b) => a + b, 0)

      // Normalize to ensure sum is exactly 1
      if (Math.abs(sum - 1) > 0.001) {
        // Adjust this source to make sum = 1
        newWeights[source] = newValue + (1 - sum)
      }

      setWeights(newWeights)
      return
    }

    // Calculate the total weight that should be distributed among other sources
    const remainingWeight =
      1 -
      newValue -
      Object.keys(weights)
        .filter((key) => key !== source && weightLocks[key])
        .reduce((sum, key) => sum + weights[key], 0)

    // Calculate the current sum of other unlocked weights
    const currentOtherSum = otherSources.reduce((sum, key) => sum + weights[key], 0)

    // Create new weights object
    const newWeights = { ...weights, [source]: newValue }

    // If other weights sum to zero, distribute evenly
    if (currentOtherSum === 0) {
      const evenDistribution = remainingWeight / otherSources.length
      otherSources.forEach((key) => {
        newWeights[key] = evenDistribution
      })
    } else {
      // Otherwise, distribute proportionally
      otherSources.forEach((key) => {
        const proportion = weights[key] / currentOtherSum
        newWeights[key] = remainingWeight * proportion
        newWeights[key] = isNaN(newWeights[key]) ? 0 : newWeights[key]
      })
    }

    // Ensure all weights are non-negative and sum to 1
    Object.keys(newWeights).forEach((key) => {
      newWeights[key] = Math.max(0, newWeights[key])
    })

    // Normalize to ensure sum is exactly 1
    const sum = Object.values(newWeights).reduce((a, b) => a + b, 0)
    if (sum > 0 && Math.abs(sum - 1) > 0.001) {
      // Find an unlocked source to adjust
      const adjustSource = otherSources.length > 0 ? otherSources[0] : source
      newWeights[adjustSource] += 1 - sum
    }

    setWeights(newWeights)
  }

  const weightedData = calculateWeightedSentiment()

  // Function to handle clicking on a stock
  const handleStockClick = (stock) => {
    if (!stock) return // Guard clause to prevent clicking on undefined stock

    // Find the full stock data with price
    const stockWithPrice = stockPerformanceData.find((s) => s.id === stock.id) || {
      ...stock,
      price: 100, // Default price if not found
      change: 0, // Default change if not found
      performance: 0,
    }

    setSelectedStock(stockWithPrice)
  }

  // Function to toggle lock status of a stock
  const handleToggleLock = (stockId) => {
    const updatedStocks = stocks.map((stock) => (stock.id === stockId ? { ...stock, locked: !stock.locked } : stock))
    setStocks(updatedStocks)
  }

  // Function to reset allocations to equal distribution
  const handleResetAllocations = () => {
    // Create a copy of stocks
    const updatedStocks = [...stocks]

    // Calculate total allocation of locked stocks
    const lockedStocks = updatedStocks.filter((stock) => stock.locked)
    const lockedAllocation = lockedStocks.reduce((sum, stock) => sum + stock.allocation, 0)

    // Calculate number of unlocked stocks
    const unlockedStocks = updatedStocks.filter((stock) => !stock.locked)
    const unlockedCount = unlockedStocks.length

    if (unlockedCount === 0) {
      // If all stocks are locked, we can't reset
      return
    }

    // Calculate equal distribution for unlocked stocks
    const remainingAllocation = 100 - lockedAllocation
    const equalAllocation = Math.floor(remainingAllocation / unlockedCount)

    // Distribute equally among unlocked stocks
    updatedStocks.forEach((stock) => {
      if (!stock.locked) {
        stock.allocation = equalAllocation
      }
    })

    // Adjust for rounding errors
    const newTotal = updatedStocks.reduce((sum, stock) => sum + stock.allocation, 0)
    if (newTotal < 100) {
      // Find the first unlocked stock to adjust
      const firstUnlockedStock = updatedStocks.find((stock) => !stock.locked)
      if (firstUnlockedStock) {
        firstUnlockedStock.allocation += 100 - newTotal
      }
    }

    setStocks(updatedStocks)
  }

  // Function to update stock allocation using slider
  const handleAllocationChange = (stockId, newAllocation) => {
    // Create a copy of stocks
    const updatedStocks = [...stocks]

    // Find the stock to update
    const stockIndex = updatedStocks.findIndex((s) => s.id === stockId)
    if (stockIndex === -1) return

    // Calculate the difference in allocation
    const oldAllocation = updatedStocks[stockIndex].allocation
    const difference = newAllocation - oldAllocation

    // Update the allocation for the selected stock
    updatedStocks[stockIndex].allocation = newAllocation

    // Find unlocked stocks to adjust (excluding the one being modified)
    const unlockedStocks = updatedStocks.filter((s) => !s.locked && s.id !== stockId)

    if (unlockedStocks.length > 0) {
      // Get the total allocation of unlocked stocks (excluding the one being modified)
      const totalUnlockedAllocation = unlockedStocks.reduce((sum, s) => sum + s.allocation, 0)

      // Adjust each unlocked stock proportionally
      updatedStocks.forEach((stock) => {
        if (!stock.locked && stock.id !== stockId) {
          // Calculate the proportion this stock represents of all unlocked stocks
          const proportion =
            totalUnlockedAllocation > 0 ? stock.allocation / totalUnlockedAllocation : 1 / unlockedStocks.length
          // Reduce this stock's allocation proportionally
          stock.allocation = Math.max(0, stock.allocation - difference * proportion)
        }
      })

      // Ensure total allocation is exactly 100%
      const totalAllocation = updatedStocks.reduce((sum, stock) => sum + stock.allocation, 0)
      if (Math.abs(totalAllocation - 100) > 0.01) {
        // Find the first unlocked stock that's not the one we're updating
        const adjustmentStock = updatedStocks.find((s) => !s.locked && s.id !== stockId)
        if (adjustmentStock) {
          adjustmentStock.allocation += 100 - totalAllocation
        }
      }
    }

    // Round all allocations to integers
    updatedStocks.forEach((stock) => {
      stock.allocation = Math.round(stock.allocation)
    })

    setStocks(updatedStocks)
  }

  // Generate stock performance data
  const stockPerformanceData = stocks.map((stock) => {
    const basePerformance = Math.random() * 10 - 5 // Random between -5% and +5%
    const compositeSentiment = weightedData[weightedData.length - 1].compositeSentiment
    const sentimentImpact = compositeSentiment > 0 ? compositeSentiment * 2 : compositeSentiment
    const performance = Number.parseFloat((basePerformance + sentimentImpact).toFixed(2))

    // Generate a random price between 50 and 500
    const price = Number.parseFloat((Math.random() * 450 + 50).toFixed(2))
    const change = performance // Use performance as the change percentage

    return {
      ...stock,
      price,
      change,
      performance,
      twitterSentiment: weightedData[weightedData.length - 1].twitterSentiment,
      googleTrendsSentiment: weightedData[weightedData.length - 1].googleTrendsSentiment,
      newsSentiment: weightedData[weightedData.length - 1].compositeSentiment,
      compositeSentiment: weightedData[weightedData.length - 1].compositeSentiment,
    }
  })

  // Color function for sentiment
  const getSentimentColor = (value) => {
    if (value > 0.3) return "text-emerald-500"
    if (value >= -0.3) return "text-amber-500"
    return "text-red-500"
  }

  // Color function for performance
  const getPerformanceColor = (value) => {
    if (value > 0) return "text-emerald-500"
    return "text-red-500"
  }

  // Get sentiment icon
  const getSentimentIcon = (value) => {
    if (value > 0.3) return <ArrowUp className="h-4 w-4 text-emerald-500" />
    if (value >= -0.3) return <Activity className="h-4 w-4 text-amber-500" />
    return <ArrowDown className="h-4 w-4 text-red-500" />
  }

  // Get overall sentiment status
  const getOverallSentiment = () => {
    const latestComposite = weightedData[weightedData.length - 1].compositeSentiment

    if (latestComposite > 0.5) return { text: "Very Positive", color: "bg-emerald-500" }
    if (latestComposite > 0.2) return { text: "Positive", color: "bg-emerald-400" }
    if (latestComposite > -0.2) return { text: "Neutral", color: "bg-amber-400" }
    if (latestComposite > -0.5) return { text: "Negative", color: "bg-red-400" }
    return { text: "Very Negative", color: "bg-red-500" }
  }

  const overallSentiment = getOverallSentiment()

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "N/A"
    return date instanceof Date ? `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}` : "N/A"
  }

  return (
    <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(59,130,246,0.05)_50%,transparent_70%)] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto p-6">
        {isLoading && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl shadow-2xl flex items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <span className="text-slate-200 text-lg font-medium">{isLoadingBaskets ? "Loading baskets..." : "Processing..."}</span>
            </div>
          </div>
        )}
        {selectedStock ? (
          <StockDetailView stock={selectedStock} onBack={() => setSelectedStock(null)} timePeriod={timePeriod} />
        ) : (
          <>
            {/* Premium Header */}
            <div className="relative mb-12">
              {/* Glass morphism header container */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="space-y-3">
                    <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                      Sentiment Analytics
                    </h1>
                    <p className="text-slate-400 text-lg font-medium">
                      Advanced market intelligence across multiple data sources
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span>Real-time data • Last updated {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Premium sentiment badge */}
                    <div className="relative">
                      <div className={`${overallSentiment.color} px-6 py-3 rounded-full text-white font-semibold shadow-lg backdrop-blur-sm border border-white/20`}>
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(weightedData[weightedData.length - 1].compositeSentiment)}
                          {overallSentiment.text}
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced time period selector */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-1">
                      <Tabs defaultValue={timePeriod} onValueChange={setTimePeriod} className="w-[240px]">
                        <TabsList className="grid grid-cols-3 bg-transparent gap-1">
                          <TabsTrigger 
                            value="1d" 
                            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-xl px-4 py-2 font-medium"
                          >
                            1 Day
                          </TabsTrigger>
                          <TabsTrigger 
                            value="1w" 
                            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-xl px-4 py-2 font-medium"
                          >
                            1 Week
                          </TabsTrigger>
                          <TabsTrigger 
                            value="1m" 
                            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-xl px-4 py-2 font-medium"
                          >
                            1 Month
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Inputs Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-200">Portfolio Configuration</h2>
                  <p className="text-slate-400">Optimize your allocations with sentiment-driven insights</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all duration-200" 
                  onClick={() => toggleSection("inputs")}
                >
                  {sectionsCollapsed.inputs ? 
                    <ChevronDown className="h-5 w-5" /> : 
                    <ChevronUp className="h-5 w-5" />
                  }
                </Button>
              </div>

              {!sectionsCollapsed.inputs && (
                <>
                  {/* Premium Stock Allocation Card */}
                  <Card className="mb-8 bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="pb-6 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-b border-slate-700/30">
                      <div className="flex items-center justify-between">
                        <div className="space-y-3">
                          <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-bold text-slate-200">
                            <div className="p-2 bg-blue-500/20 rounded-xl">
                              <BarChart3 className="h-6 w-6 text-blue-400" />
                            </div>
                            Stock Allocation
                          </CardTitle>
                          <CardDescription className="text-slate-400 text-base">
                            Optimize portfolio allocation with sentiment-driven insights and position locking
                          </CardDescription>
                        </div>
                        <Button
                          size="lg"
                          className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 hover:text-white transition-all duration-200 rounded-xl px-6 gap-2"
                          onClick={() =>
                            basketLocked ? setIsUnlockBasketAlertOpen(true) : setIsStockSelectorOpen(true)
                          }
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit Portfolio
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-8">
                      {/* Grid layout with 3 cards per row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stocks.map((stock, index) => {
                          const stockData = stockPerformanceData.find((s) => s.id === stock.id) || stock
                          const performanceColor = stockData.compositeSentiment > 0.3 
                            ? "text-emerald-400" 
                            : stockData.compositeSentiment > -0.3 
                              ? "text-amber-400" 
                              : "text-red-400"
                          const bgColor = stockData.compositeSentiment > 0.3 
                            ? "from-emerald-500/10 to-emerald-400/5" 
                            : stockData.compositeSentiment > -0.3 
                              ? "from-amber-500/10 to-amber-400/5" 
                              : "from-red-500/10 to-red-400/5"
                          
                          return (
                            <div 
                              key={stock.id} 
                              className={`relative p-6 bg-gradient-to-br ${bgColor} rounded-2xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 cursor-pointer group hover:scale-[1.02]`}
                              onClick={() => handleStockClick(stock)}
                            >
                              {/* Hover effect overlay */}
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 group-hover:from-blue-500/5 to-transparent rounded-2xl transition-all duration-300" />
                              
                              <div className="relative space-y-4">
                                {/* Header with stock symbol and lock */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-600/30">
                                      <span className="font-bold text-white text-xs">{stock.symbol}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg bg-slate-800/30 hover:bg-slate-700/50 border border-slate-600/30 transition-all duration-200"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleLock(stock.id)
                                      }}
                                      disabled={basketLocked}
                                    >
                                      {stock.locked ? (
                                        <Lock className="h-3 w-3 text-amber-400" />
                                      ) : (
                                        <Unlock className="h-3 w-3 text-slate-400" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {/* Stock info */}
                                <div className="space-y-2">
                                  <div className="font-semibold text-slate-200 text-lg">{stock.symbol}</div>
                                  <div className="text-slate-400 text-sm truncate">{stock.name}</div>
                                </div>

                                {/* Allocation percentage - large and prominent */}
                                <div className="text-center py-4">
                                  <div className="text-3xl font-bold text-slate-200">{stock.allocation}%</div>
                                  <div className="text-xs text-slate-400 mt-1">Portfolio Allocation</div>
                                </div>

                                {/* Performance indicator */}
                                <div className="flex items-center justify-center gap-2 py-2">
                                  {getSentimentIcon(stockData.compositeSentiment)}
                                  <span className={`text-sm font-medium ${performanceColor}`}>
                                    {stockData.compositeSentiment > 0.3 ? "Positive" : 
                                     stockData.compositeSentiment > -0.3 ? "Neutral" : "Negative"}
                                  </span>
                                </div>

                                {/* Interactive allocation slider */}
                                <div className="space-y-2">
                                  <div className="relative">
                                    <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full bg-gradient-to-r transition-all duration-500 ${
                                          stockData.compositeSentiment > 0.3
                                            ? "from-emerald-500 to-emerald-400"
                                            : stockData.compositeSentiment > -0.3
                                              ? "from-amber-500 to-amber-400"
                                              : "from-red-500 to-red-400"
                                        }`}
                                        style={{ width: `${stock.allocation}%` }}
                                      />
                                    </div>
                                    
                                    <Slider
                                      value={[stock.allocation]}
                                      max={100}
                                      step={1}
                                      disabled={stock.locked || basketLocked}
                                      onValueChange={(value) => handleAllocationChange(stock.id, value[0])}
                                      className="absolute inset-0 opacity-0"
                                    />
                                  </div>
                                  
                                  {stock.locked && (
                                    <div className="text-center">
                                      <div className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                        <Lock className="h-3 w-3" />
                                        Locked
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>

                    <CardFooter className="flex flex-wrap justify-between bg-gradient-to-r from-slate-800/30 to-slate-900/30 border-t border-slate-700/30 pt-6 gap-4">
                      <div className="flex items-center gap-6">
                        <div className="text-slate-300">
                          <span className="font-semibold text-white">{stocks.filter((s) => s.locked).length}</span>
                          <span className="text-slate-400"> of </span>
                          <span className="font-semibold text-white">{stocks.length}</span>
                          <span className="text-slate-400"> positions locked</span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/30 text-slate-300 hover:text-white transition-all duration-200 rounded-xl gap-2"
                          onClick={handleResetAllocations}
                          disabled={basketLocked}
                        >
                          <RotateCw className="h-4 w-4" />
                          Reset Allocations
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 hover:text-white transition-all duration-200 rounded-xl px-6"
                        onClick={() =>
                          basketLocked ? setIsUnlockBasketAlertOpen(true) : setIsAllocationEditorOpen(true)
                        }
                        disabled={basketLocked}
                      >
                        Fine-tune Allocations
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Premium Source Weighting and Correlation */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Premium Source Weighting Controls */}
                    <Card className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 shadow-2xl rounded-3xl overflow-hidden">
                      <CardHeader className="pb-6 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-b border-slate-700/30">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-200">
                          <div className="p-2 bg-purple-500/20 rounded-xl">
                            <Activity className="h-6 w-6 text-purple-400" />
                          </div>
                          Source Weighting
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-base">
                          Fine-tune data source influence on composite sentiment analytics
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm text-muted-foreground font-medium">Twitter</label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium bg-muted text-foreground px-2 py-0.5 rounded">
                                  {(weights.twitter * 100).toFixed(0)}%
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleWeightLock("twitter")}
                                  disabled={basketLocked}
                                >
                                  {weightLocks.twitter ? (
                                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                                  ) : (
                                    <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <Slider
                              defaultValue={[weights.twitter]}
                              value={[weights.twitter]}
                              max={1}
                              step={0.05}
                              onValueChange={(value) => handleWeightChange("twitter", value)}
                              className="py-1"
                              disabled={basketLocked}
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm text-muted-foreground font-medium">Google Trends</label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium bg-muted text-foreground px-2 py-0.5 rounded">
                                  {(weights.googleTrends * 100).toFixed(0)}%
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleWeightLock("googleTrends")}
                                  disabled={basketLocked}
                                >
                                  {weightLocks.googleTrends ? (
                                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                                  ) : (
                                    <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <Slider
                              defaultValue={[weights.googleTrends]}
                              value={[weights.googleTrends]}
                              max={1}
                              step={0.05}
                              onValueChange={(value) => handleWeightChange("googleTrends", value)}
                              className="py-1"
                              disabled={basketLocked}
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm text-muted-foreground font-medium">News</label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium bg-muted text-foreground px-2 py-0.5 rounded">
                                  {(weights.news * 100).toFixed(0)}%
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleWeightLock("news")}
                                  disabled={basketLocked}
                                >
                                  {weightLocks.news ? (
                                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                                  ) : (
                                    <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <Slider
                              defaultValue={[weights.news]}
                              value={[weights.news]}
                              max={1}
                              step={0.05}
                              onValueChange={(value) => handleWeightChange("news", value)}
                              className="py-1"
                              disabled={basketLocked}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sentiment-Performance Correlation */}
                    <CorrelationChart stocks={stocks} weights={weights} />
                  </div>

                  <div className="mb-6">
                    {/* Model Accuracy */}
                    {/* This component is not provided in the attachment, assuming it exists */}
                    {/* If it causes an error, you might need to provide its code or remove it */}
                    {/* <ModelAccuracy /> */}
                  </div>

                  {/* Simplified Basket Management */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl mb-1">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Basket Management
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Select an existing basket or create a new one to track your portfolio
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        {/* Basket Dropdown */}
                        <div className="flex-1">
                          <Select value={selectedBasketId || ""} onValueChange={handleBasketChange}>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Select a basket" />
                            </SelectTrigger>
                            <SelectContent>
                              {allBaskets &&
                                allBaskets.map(
                                  (
                                    basket, // Defensive check
                                  ) => (
                                    <SelectItem key={basket.id} value={basket.id}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{basket.name}</span>
                                        {basket.is_locked && <Lock className="h-3 w-3 text-amber-500 ml-2" />}
                                      </div>
                                    </SelectItem>
                                  ),
                                )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                          <Button
                            variant="outline"
                            onClick={() => saveCurrentBasket(false)}
                            disabled={!basketId || isLoading || basketLocked}
                            className="gap-1"
                          >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Save Changes
                          </Button>

                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteBasket()}
                            disabled={!basketId || isLoading || basketLocked}
                            className="gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>

                          <Button onClick={() => setIsAddBasketModalOpen(true)} disabled={isLoading} className="gap-1">
                            <Plus className="h-4 w-4" />
                            Add to New Basket
                          </Button>

                          {basketId && (
                            <Button
                              variant={basketLocked ? "outline" : "secondary"}
                              onClick={() => (basketLocked ? handleUnlockBasket() : saveCurrentBasket(true))}
                              disabled={isLoading}
                              className="gap-1"
                            >
                              {basketLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                              {basketLocked ? "Unlock" : "Lock"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Current Basket Info */}
                      {basketId && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Current:</span>
                              <span className="font-medium ml-1">{basketName}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Stocks:</span>
                              <span className="font-medium ml-1">{stocks.length}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status:</span>
                              <span className="font-medium ml-1">
                                {basketLocked ? (
                                  <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                                    Locked
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                                    Editable
                                  </Badge>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Created:</span>
                              <span className="font-medium ml-1">{formatDate(basketDates.created)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Conditional Insights and Performance Tracking Sections */}
            {basketLocked ? ( // NEW CONDITIONAL WRAPPER
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {" "}
                {/* NEW GRID LAYOUT */}
                {/* Insights Section - NOW CONDITIONAL */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">Insights</h2>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleSection("insights")}>
                      {sectionsCollapsed.insights ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </Button>
                  </div>

                  {!sectionsCollapsed.insights && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {" "}
                      {/* Adjusted grid for inner cards */}
                      {stockPerformanceData &&
                        stockPerformanceData.map(
                          (
                            stock, // Defensive check
                          ) => (
                            <Card
                              key={stock.id}
                              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                              onClick={() => handleStockClick(stock)}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg">{stock.symbol}</CardTitle>
                                    <CardDescription className="text-sm">{stock.name}</CardDescription>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold">${stock.price}</div>
                                    <div className={`text-sm ${getPerformanceColor(stock.change)}`}>
                                      {stock.change > 0 ? "+" : ""}
                                      {stock.change.toFixed(2)}%
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Allocation</span>
                                    <span className="font-medium">{stock.allocation}%</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Sentiment</span>
                                    <div className="flex items-center gap-1">
                                      {getSentimentIcon(stock.compositeSentiment)}
                                      <span
                                        className={`text-sm font-medium ${getSentimentColor(stock.compositeSentiment)}`}
                                      >
                                        {stock.compositeSentiment.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ),
                        )}
                    </div>
                  )}
                </div>
                {/* Performance Tracking Section - REMAINS CONDITIONAL, MOVED INSIDE GRID */}
                <div id="tracking-section">
                  {" "}
                  {/* Removed mb-8 from here */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">Performance Tracking</h2>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleSection("tracking")}>
                      {sectionsCollapsed.tracking ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  {!sectionsCollapsed.tracking && (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl mb-1">
                              <Lock className="h-5 w-5 text-amber-500" />
                              Locked Basket: {basketName}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                              This basket is locked for performance tracking. Unlock to make changes.
                            </CardDescription>
                          </div>
                          <Button variant="outline" onClick={handleUnlockBasket} disabled={isLoading} className="gap-1">
                            <Unlock className="h-4 w-4" />
                            Unlock Basket
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-foreground">
                              {stocks.reduce((sum, stock) => sum + stock.allocation, 0)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Total Allocation</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-emerald-500">+2.4%</div>
                            <div className="text-sm text-muted-foreground">Performance Since Lock</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-foreground">{stocks.length}</div>
                            <div className="text-sm text-muted-foreground">Stocks in Basket</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Created:</span>
                            <span className="font-medium">{formatDate(basketDates.created)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Last Updated:</span>
                            <span className="font-medium">{formatDate(basketDates.updated)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Locked Date:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{formatDate(basketDates.locked)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setIsEditingLockDate(true)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Popover open={isEditingLockDate} onOpenChange={setIsEditingLockDate}>
                          <PopoverTrigger asChild>
                            <div />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={basketDates.locked || undefined}
                              onSelect={(date) => {
                                if (date) {
                                  handleUpdateLockDate(date)
                                  setIsEditingLockDate(false)
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : null}

            {/* Premium Footer */}
            <div className="mt-16 pt-8 border-t border-slate-700/30 bg-gradient-to-r from-slate-900/20 to-slate-800/20 backdrop-blur-sm rounded-t-3xl">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Live Data Feed</span>
                  </div>
                  <div className="text-slate-500">•</div>
                  <div className="text-slate-400">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                  <div className="text-slate-500">•</div>
                  <div className="text-slate-400">
                    Refresh: 15min intervals
                  </div>
                </div>
                <p className="text-slate-500 text-sm">
                  © 2024 Sentiment Analytics Pro. Advanced market intelligence platform.
                </p>
              </div>
            </div>

            {/* Modals */}
            <AddBasketModal
              open={isAddBasketModalOpen}
              onOpenChange={setIsAddBasketModalOpen}
              onSave={createNewBasket}
              isLoading={isLoading}
            />

            <StockSelector
              open={isStockSelectorOpen}
              onOpenChange={setIsStockSelectorOpen}
              initialStocks={stocks}
              onSave={handleSaveStocks}
            />
            <StockAllocation
              open={isAllocationEditorOpen}
              onOpenChange={setIsAllocationEditorOpen}
              stocks={stocks}
              onSave={handleSaveStocks}
              onAllocationChange={handleAllocationChange}
              onToggleLock={handleToggleLock}
            />
            <AlertDialog open={isUnlockBasketAlertOpen} onOpenChange={setIsUnlockBasketAlertOpen}>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-card-foreground">Basket Locked</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This basket is currently locked for performance tracking. Please unlock it to make changes to stock
                    positions or allocations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-background text-foreground border-border hover:bg-accent">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUnlockBasket}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Unlock Basket
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  )
}

// Helper function to generate sample sentiment data
function generateSentimentData(days) {
  const data = []
  const now = new Date()
  let twitterBaseline = Math.random() * 0.4 + 0.1 // 0.1 to 0.5
  let googleBaseline = Math.random() * 0.4 - 0.2 // -0.2 to 0.2
  let newsBaseline = Math.random() * 0.6 - 0.3 // -0.3 to 0.3

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Create some variability in the sentiment
    const twitterVariation = Math.random() * 0.4 - 0.2 // -0.2 to 0.2
    const googleVariation = Math.random() * 0.3 - 0.15 // -0.15 to 0.15
    const newsVariation = Math.random() * 0.5 - 0.25 // -0.25 to 0.25

    // Create some correlation between the sentiments
    const commonFactor = Math.random() * 0.3 - 0.15 // -0.15 to 0.15

    // Calculate sentiments with bounds checking
    const twitterSentiment = clamp(twitterBaseline + twitterVariation + commonFactor, -1, 1)
    const googleTrendsSentiment = clamp(googleBaseline + googleVariation + commonFactor, -1, 1)
    const newsSentiment = clamp(newsBaseline + newsVariation + commonFactor, -1, 1)

    // Format date as MM/DD
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`

    data.push({
      date: formattedDate,
      twitterSentiment,
      googleTrendsSentiment,
      newsSentiment,
    })

    // Adjust baselines slightly for trend
    twitterBaseline += Math.random() * 0.1 - 0.05
    googleBaseline += Math.random() * 0.08 - 0.04
    newsBaseline += Math.random() * 0.12 - 0.06

    // Keep baselines in reasonable range
    twitterBaseline = clamp(twitterBaseline, -0.7, 0.7)
    googleBaseline = clamp(googleBaseline, -0.7, 0.7)
    newsBaseline = clamp(newsBaseline, -0.7, 0.7)
  }

  return data
}

// Helper function to clamp a value between min and max
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default SentimentDashboard
