'use client'

import { useState, type RefObject } from 'react'
import { usePopoverMenu } from '@/shared/hooks/use-popover-menu'
import { cn } from '@/shared/lib/utils'
import { iconButtonStyle } from '@/shared/ui/icon-button'
import { menuItemStyle, menuSurface } from '@/shared/ui/menu'
import { MoreIcon } from './icons'

const itemHeight = 40

const bottomReserve = 112

export interface MoreMenuAction {
  label: string
  onSelect: () => void
  destructive?: boolean
}

interface MoreMenuProps {
  label: string
  actions: readonly MoreMenuAction[]
  trigger?: RefObject<HTMLButtonElement | null>
  className?: string
}

export function MoreMenu({ label, actions, trigger, className }: MoreMenuProps) {
  const { mounted, closing, close, triggerProps, panelProps } = usePopoverMenu(trigger)
  const [above, setAbove] = useState(false)

  function place(button: HTMLButtonElement) {
    const room = window.innerHeight - button.getBoundingClientRect().bottom
    setAbove(room < actions.length * itemHeight + bottomReserve)
  }

  return (
    <div className={cn('relative shrink-0', className)}>
      <button
        {...triggerProps}
        onClick={(event) => {
          place(event.currentTarget)
          triggerProps.onClick()
        }}
        onKeyDown={(event) => {
          place(event.currentTarget)
          triggerProps.onKeyDown(event)
        }}
        aria-label={label}
        className={iconButtonStyle}
      >
        <MoreIcon className="size-5" />
      </button>
      {mounted && (
        <div
          {...panelProps}
          role="menu"
          aria-label={label}
          className={cn(
            menuSurface,
            'absolute right-0 w-max min-w-40 p-1 starting:scale-[0.98] starting:opacity-0',
            above ? 'bottom-full mb-1 origin-bottom-right' : 'top-full mt-1 origin-top-right',
            closing && 'pointer-events-none scale-[0.98] opacity-0',
          )}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close(true)
                action.onSelect()
              }}
              className={cn(menuItemStyle, action.destructive === true && 'text-danger')}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
