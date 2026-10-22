'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { MeditationMode } from './meditation-mode'
import type { MeditationOption } from './options'

interface MeditationButtonProps {
  option: MeditationOption
  label: string
  variant?: 'default' | 'outline' | 'inverse'
  size?: 'default' | 'sm'
}

export function MeditationButton({
  option,
  label,
  variant = 'outline',
  size = 'default',
}: MeditationButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true)
        }}
      >
        {label}
      </Button>
      {open && (
        <MeditationMode
          option={option}
          onClose={() => {
            setOpen(false)
          }}
        />
      )}
    </>
  )
}
