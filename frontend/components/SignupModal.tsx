"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SignupForm } from "@/components/signup-form"
import { FrontDeskSignupForm } from "@/components/FrontDeskSignupForm"

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
  isFrontDesk?: boolean
}

export function SignupModal({ isOpen, onClose, isFrontDesk = false }: SignupModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto [&_button[data-slot='dialog-close']_svg]:size-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            Join ZFit Gym
          </DialogTitle>
          <DialogDescription>
            Create your account to start your fitness journey
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isFrontDesk ? <FrontDeskSignupForm /> : <SignupForm />}
        </div>
      </DialogContent>
    </Dialog>
  )
}