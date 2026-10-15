import { StepActions } from '@/shared/components/step-actions'
import { Button } from '@/shared/ui/button'
import { StepHeading } from '@/shared/components/step-heading'

const facts = [
  { figure: '16', text: 'perguntas, uma por tela' },
  { figure: '3', text: 'minutos, mais ou menos' },
  { figure: '2', text: 'semanas: o período que as perguntas cobrem' },
] as const

export function ScreeningIntroStep({ onStart }: { onStart: () => void }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <StepHeading title="Dois questionários curtos">
        O <span className="whitespace-nowrap">PHQ-9</span> e o{' '}
        <span className="whitespace-nowrap">GAD-7</span> são usados no mundo todo para acompanhar
        sinais de depressão e de ansiedade. Eles viram o seu ponto de partida.
      </StepHeading>
      <dl className="mt-8 border-t border-rule">
        {facts.map((fact) => (
          <div key={fact.figure} className="flex items-baseline gap-4 border-b border-rule py-3.5">
            <dt className="w-10 shrink-0 font-serif text-[30px] leading-none">{fact.figure}</dt>
            <dd className="text-[15px] text-muted-foreground">{fact.text}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-[15px] leading-relaxed text-pretty">
        Não existe resposta certa. Responda pensando em como as coisas foram de verdade.
      </p>
      <StepActions>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          É uma triagem, não um diagnóstico.
        </p>
        <Button size="lg" shape="pill" onClick={onStart}>
          Começar
        </Button>
      </StepActions>
    </section>
  )
}
