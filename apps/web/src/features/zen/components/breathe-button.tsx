'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Sheet } from '@/shared/components/sheet'
import { Button } from '@/shared/ui/button'
import { BreathingExercise } from './breathing-exercise'

interface BreatheButtonProps {
  label: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm'
  className?: string
}

export function BreathingSheet({ onClose }: { onClose: () => void }) {
  const t = useTranslations('zen.breathing')

  return (
    <Sheet title={t('title')} closeLabel={t('close')} onClose={onClose}>
      {() => (
        <div className="overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6">
          <BreathingExercise />
        </div>
      )}
    </Sheet>
  )
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
        <BreathingSheet
          onClose={() => {
            setOpen(false)
          }}
        />
      )}
    </>
  )
}
