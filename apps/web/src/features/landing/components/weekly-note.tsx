import { labelOf, moodColor, valenceOf } from '@/features/mood/mood-levels'
import { cn } from '@/shared/lib/utils'
import { sampleWeek } from '../content'

const restfulSleep = 7

function formatHours(hours: number): string {
  return `${hours.toLocaleString('pt-BR')} h`
}

export function WeeklyNote() {
  return (
    <figure className="border-y border-rule py-8">
      <figcaption className="text-xs tracking-[0.04em] text-muted-foreground">
        resumo da semana · 5 a 11 de outubro
      </figcaption>
      <blockquote className="mt-5 font-serif text-[21px] leading-[1.5] text-pretty sm:text-[23px]">
        Foi uma semana mais leve que a anterior. Nos cinco dias em que você dormiu sete horas ou
        mais, o humor ficou entre neutro e bem. Os dois dias mais difíceis vieram depois de noites
        curtas, e em ambos você marcou cansaço e trabalho.
      </blockquote>

      <table className="mt-8 w-full table-fixed text-center text-xs text-muted-foreground">
        <caption className="sr-only">Humor e horas de sono de cada dia da semana</caption>
        <thead>
          <tr>
            <th scope="col" className="w-14 text-left font-normal">
              <span className="sr-only">Medida</span>
            </th>
            {sampleWeek.map((entry) => (
              <th key={entry.day} scope="col" className="pb-2 font-normal">
                {entry.day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="text-left font-normal">
              humor
            </th>
            {sampleWeek.map((entry) => (
              <td key={entry.day} aria-label={labelOf(entry.mood)} className="h-16 align-bottom">
                <span
                  className="mx-auto block w-5 rounded-[1px]"
                  style={{
                    height: `${String(28 + entry.mood * 12)}%`,
                    backgroundColor: moodColor(valenceOf(entry.mood)),
                  }}
                />
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="pt-3 text-left font-normal">
              sono
            </th>
            {sampleWeek.map((entry) => (
              <td
                key={entry.day}
                className={cn(
                  'pt-3',
                  entry.sleepHours < restfulSleep && 'font-medium text-foreground',
                )}
              >
                {formatHours(entry.sleepHours)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        Escrito pelo MyCogniAI a partir de 7 registros. As relações vêm dos seus dados; a IA só
        coloca em palavras.
      </p>
    </figure>
  )
}
