'use client'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectGroup {
  label: string
  options: readonly SelectOption[]
}

interface FilterSelectProps {
  label: string
  value: string
  options: readonly SelectOption[]
  groups?: readonly SelectGroup[]
  onChange: (value: string) => void
}

export function FilterSelect({ label, value, options, groups = [], onChange }: FilterSelectProps) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => {
        onChange(event.currentTarget.value)
      }}
      className="h-10 w-full min-w-0 cursor-pointer rounded-md border border-rule bg-background px-2.5 text-sm text-ellipsis"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {groups
        .filter((group) => group.options.length > 0)
        .map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
    </select>
  )
}
