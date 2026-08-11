import * as React from "react"
import { cn } from "../../lib/utils"

export function Dialog({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0" 
        onClick={() => onOpenChange(false)}
      />
      <div className="z-50 w-full max-w-lg bg-background rounded-lg shadow-lg relative">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  )
}
