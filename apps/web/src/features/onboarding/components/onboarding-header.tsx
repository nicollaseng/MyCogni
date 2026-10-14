import { Wordmark } from '@/shared/components/wordmark'
import { cn } from '@/shared/lib/utils'
import { phases, type Phase } from '../model'

interface OnboardingHeaderProps {
  phase: Phase
  signOut: () => Promise<void>
}

export function OnboardingHeader({ phase, signOut }: OnboardingHeaderProps) {
  const current = phases.indexOf(phase) + 1

  return (
    <header className="shrink-0">
      <div className="flex h-11 items-center justify-between">
        <Wordmark className="text-[20px]" />
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
            Sair
          </button>
        </form>
      </div>
      <p className="sr-only">{`Etapa ${String(current)} de ${String(phases.length)}`}</p>
      <div aria-hidden className="mt-3 grid grid-cols-4 gap-1.5">
        {phases.map((item, index) => (
          <span
            key={item}
            className={cn(
              'h-[3px] rounded-full transition-colors duration-500',
              index < current ? 'bg-foreground' : 'bg-rule',
            )}
          />
        ))}
      </div>
    </header>
  )
}
