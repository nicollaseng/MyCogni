'use client'

import { useId } from 'react'
import { cn } from '@/shared/lib/utils'
import { segmentedActive, segmentedGroup, segmentedItem } from '@/shared/ui/segmented'

interface Choice<T extends string> {
  value: T
  label: string
}

interface ChoiceGroupProps<T extends string> {
  label: string
  value: T
  choices: readonly Choice<T>[]
  onChange: (value: T) => void
}

export function ChoiceGroup<T extends string>({
  label,
  value,
  choices,
  onChange,
}: ChoiceGroupProps<T>) {
  const name = useId()

  return (
    <fieldset className="space-y-2">
      <legend className="pb-2 text-sm text-muted-foreground">{label}</legend>
      <div className={segmentedGroup}>
        {choices.map((choice) => (
          <label
            key={choice.value}
            className={cn(
              segmentedItem,
              'h-auto min-h-10 px-2 py-1.5 text-center leading-tight whitespace-normal has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foreground',
              choice.value === value && segmentedActive,
            )}
          >
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={choice.value === value}
              onChange={() => {
                onChange(choice.value)
              }}
              className="sr-only"
            />
            {choice.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
