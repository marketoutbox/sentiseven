"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { StockDetailPage } from "@/components/stock-detail-page"

export default function StockPage() {
  const params = useParams()
  const symbol = params.symbol as string

  return <StockDetailPage symbol={symbol} />
}