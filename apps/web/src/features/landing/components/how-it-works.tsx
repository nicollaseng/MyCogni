import type { ReactNode } from 'react'
import { MoodMap } from '@/features/mood/components/mood-map'
import { MoodStrip } from '@/features/mood/components/mood-strip'
import { sampleFortnight, sections } from '../content'
import { QuestionnairePreview } from './questionnaire-preview'
import { SectionHeading } from './section-heading'

interface Step {
  title: string
  description: string
  visual: ReactNode
}

const steps: readonly Step[] = [
  {
    title: 'Registre',
    description:
      'Arraste até o humor do momento e, se quiser, diga o que sente e o que tem a ver com isso. Leva menos de um minuto.',
    visual: <MoodMap valence={0.35} rings={9} className="size-40" />,
  },
  {
    title: 'Responda',
    description:
      'A cada duas semanas, o PHQ-9 e o GAD-7, questionários usados no mundo todo para acompanhar depressão e ansiedade.',
    visual: <QuestionnairePreview />,
  },
  {
    title: 'Entenda',
    description:
      'Toda semana, um resumo em linguagem simples mostra o que mudou e o que parece influenciar seus dias.',
    visual: (
      <figure className="w-full">
        <MoodStrip days={sampleFortnight} label="Exemplo de duas semanas de humor" />
        <figcaption className="mt-3 text-xs text-muted-foreground">exemplo · 14 dias</figcaption>
      </figure>
    ),
  },
]

export function HowItWorks() {
  const titleId = `${sections.howItWorks}-title`

  return (
    <section
      id={sections.howItWorks}
      aria-labelledby={titleId}
      className="scroll-mt-6 border-t border-rule py-20 sm:py-28"
    >
      <SectionHeading
        id={titleId}
        kicker="Como funciona"
        title="Um minuto por dia, um retrato a cada duas semanas."
      />
      <ol className="mt-14 grid gap-14 lg:grid-cols-3 lg:gap-12">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col">
            <div className="flex h-48 items-end">{step.visual}</div>
            <p className="mt-8 text-sm text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-1 font-serif text-[26px] tracking-[-0.01em]">{step.title}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
