import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onCheckedChange?.(e.target.checked)
    }

    return (
      <div className="relative">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-gray-600 bg-[#202022] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AAFF69] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onChange={handleChange}
          {...props}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Check className="h-3 w-3 text-[#AAFF69] opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }