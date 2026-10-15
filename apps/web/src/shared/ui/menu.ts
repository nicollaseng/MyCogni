import { cn } from '@/shared/lib/utils'

export const menuItemStyle =
  'flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-left text-[15px] outline-none hover:bg-foreground/[0.06] focus-visible:bg-foreground/[0.08] focus-visible:outline-none'

export const menuSurface =
  'z-30 rounded-[8px] border border-rule bg-background shadow-[0_8px_28px_rgb(0_0_0/0.12)] outline-none transition-[opacity,translate,scale] duration-150 ease-out motion-reduce:transition-none'

export function headerDropdownStyle(closing: boolean, className?: string): string {
  return cn(
    menuSurface,
    'absolute inset-x-4 top-full mt-2 origin-top sm:inset-x-auto sm:right-6 sm:origin-top-right starting:-translate-y-1 starting:scale-[0.98] starting:opacity-0',
    closing && 'pointer-events-none -translate-y-1 scale-[0.98] opacity-0 ease-in',
    className,
  )
}
