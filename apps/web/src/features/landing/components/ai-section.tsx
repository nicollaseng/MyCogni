import { aiPrinciples, sections } from '../content'
import { SectionHeading } from './section-heading'
import { WeeklyNote } from './weekly-note'

export function AiSection() {
  const titleId = `${sections.ai}-title`

  return (
    <section
      id={sections.ai}
      aria-labelledby={titleId}
      className="scroll-mt-6 border-t border-rule py-20 sm:py-28"
    >
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-20">
        <div>
          <SectionHeading
            id={titleId}
            kicker="Inteligência artificial"
            title="A IA escreve. Os números vêm de você."
            description="Toda semana, o MyCogniAI encontra padrões nos seus registros e escreve um resumo em linguagem simples, para você entender seus dias e levar para a terapia."
          />
          <ul className="mt-10 divide-y divide-rule border-y border-rule">
            {aiPrinciples.map((principle) => (
              <li key={principle} className="py-4 leading-relaxed">
                {principle}
              </li>
            ))}
          </ul>
        </div>
        <WeeklyNote />
      </div>
    </section>
  )
}
