import { cn } from '@/shared/lib/utils'

const options = ['Nenhuma vez', 'Vários dias', 'Mais da metade dos dias', 'Quase todos os dias']

const chosen = 1

export function QuestionnairePreview() {
  return (
    <figure className="w-full border-l-2 border-rule pl-5">
      <figcaption className="text-xs text-muted-foreground">PHQ-9 · pergunta 2 de 9</figcaption>
      <p className="mt-2 font-serif text-[17px] leading-snug">
        Nas últimas duas semanas, com que frequência você se sentiu para baixo, deprimido(a) ou sem
        perspectiva?
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        {options.map((option, index) => (
          <li key={option} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className={cn(
                'size-3 rounded-full border',
                index === chosen ? 'border-foreground bg-foreground' : 'border-foreground/35',
              )}
            />
            <span className={cn(index === chosen && 'text-foreground')}>{option}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
