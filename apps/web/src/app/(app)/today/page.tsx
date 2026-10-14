import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { MoodMap } from '@/features/mood/components/mood-map'
import { MoodStrip } from '@/features/mood/components/mood-strip'
import { PageTitle } from '@/shared/components/page-title'
import { cn } from '@/shared/lib/utils'
import { defaultTimeZone, formatLongDate } from '@/shared/lib/time'
import { buttonVariants } from '@/shared/ui/button'

export const metadata: Metadata = { title: 'Hoje' }

const emptyFortnight = Array.from({ length: 14 }, () => null)

export default async function TodayPage() {
  await connection()
  const today = formatLongDate(new Date(), defaultTimeZone)

  return (
    <>
      <PageTitle kicker={today} title="Como você está agora?" />

      <section className="flex items-center gap-6 sm:gap-10">
        <MoodMap valence={0.5} rings={9} className="size-32 shrink-0 sm:size-40" />
        <div className="space-y-4">
          <p className="leading-relaxed text-muted-foreground">
            Leva menos de um minuto. Num dia difícil, só o humor já basta.
          </p>
          <Link href="/check-in" className={cn(buttonVariants({ shape: 'pill' }))}>
            Registrar como estou
          </Link>
        </div>
      </section>

      <section className="space-y-4 border-t border-rule pt-8">
        <h2 className="text-xs tracking-[0.04em] text-muted-foreground">últimos 14 dias</h2>
        <MoodStrip days={emptyFortnight} label="Nenhum dia registrado nos últimos 14 dias" />
        <p className="text-sm text-muted-foreground">
          Seus dias aparecem aqui conforme você registra.
        </p>
      </section>

      <section className="border-t border-rule pt-8">
        <h2 className="sr-only">Avaliações</h2>
        <p className="leading-relaxed">
          PHQ-9 e GAD-7{' '}
          <span className="text-muted-foreground">
            · voltam a cada duas semanas para mostrar como você muda.
          </span>
        </p>
      </section>
    </>
  )
}
