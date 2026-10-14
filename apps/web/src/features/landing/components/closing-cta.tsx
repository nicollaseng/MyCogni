import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'

export function ClosingCta() {
  return (
    <section
      aria-labelledby="closing-title"
      className="border-t border-rule py-20 text-center sm:py-28"
    >
      <h2
        id="closing-title"
        className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]"
      >
        Comece pelo dia de hoje.
      </h2>
      <p className="mt-4 text-lg text-muted-foreground">Leva menos de um minuto.</p>
      <Link
        href="/today"
        className={cn(buttonVariants({ size: 'lg', shape: 'pill' }), 'mt-9 px-9')}
      >
        Começar
      </Link>
    </section>
  )
}
