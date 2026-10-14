import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6">
      <h1 className="font-serif text-5xl leading-[1.04] tracking-[-0.02em]">
        Esta página não existe.
      </h1>
      <p className="leading-relaxed text-muted-foreground">
        O endereço pode ter mudado ou estar incompleto.
      </p>
      <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'w-fit')}>
        Voltar ao início
      </Link>
    </main>
  )
}
