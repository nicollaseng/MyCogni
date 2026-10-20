'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { BreathingMode } from './breathing-mode'

interface BreatheButtonProps {
  label: string
  variant?: 'default' | 'outline' | 'inverse'
  size?: 'default' | 'sm'
  className?: string
}

export function BreatheButton({
  label,
  variant = 'outline',
  size = 'default',
  className,
}: BreatheButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        aria-haspopup="dialog"
        className={className}
        onClick={() => {
          setOpen(true)
        }}
      >
        {label}
      </Button>
      {open && (
        <BreathingMode
          onClose={() => {
            setOpen(false)
          }}
        />
      )}
    </>
  )
}
