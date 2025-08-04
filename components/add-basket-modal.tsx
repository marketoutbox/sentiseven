"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from 'lucide-react'

interface AddBasketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (basketName: string) => void
  isLoading?: boolean
}

export function AddBasketModal({ open, onOpenChange, onSave, isLoading = false }: AddBasketModalProps) {
  const [basketName, setBasketName] = useState("")

  const handleSave = () => {
    if (basketName.trim()) {
      onSave(basketName.trim())
      setBasketName("") // Reset for next time
    }
  }

  const handleCancel = () => {
    setBasketName("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#090e23] backdrop-blur-xl border border-[#0e142d] shadow-lg shadow-[#030516]/30 rounded-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plus className="h-5 w-5 text-blue-400" />
            Add to New Basket
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="basket-name" className="text-white">Basket Name</Label>
            <Input
              id="basket-name"
              value={basketName}
              onChange={(e) => setBasketName(e.target.value)}
              placeholder="Enter basket name (e.g., Tech Growth, Value Picks)"
              className="w-full bg-[#192233] border-[#0e142d] text-white rounded-xl focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && basketName.trim()) {
                  handleSave()
                }
              }}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-[#192233] border-[#0e142d] text-white hover:bg-[#1a2536] rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!basketName.trim() || isLoading}
            className="bg-[#1e31dd] hover:bg-[#245DFF] text-white hover:text-white transition-all duration-300 rounded-xl px-4 shadow-sm shadow-blue-900/20 gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Basket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
