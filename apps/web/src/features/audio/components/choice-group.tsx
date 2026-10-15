'use client'

import { useId } from 'react'
import { cn } from '@/shared/lib/utils'

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
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-md border border-rule p-1">
        {choices.map((choice) => (
          <label
            key={choice.value}
            className={cn(
              'flex min-h-10 cursor-pointer items-center justify-center rounded-sm px-2 text-center text-sm leading-tight transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foreground motion-reduce:transition-none',
              choice.value === value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-sage hover:text-foreground',
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
