import { HelpDisclosure } from '@/shared/components/help-disclosure'
import { Wordmark } from '@/shared/components/wordmark'
import { MoodDemo } from './mood-demo'

export function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 sm:px-10">
      <header className="py-7">
        <Wordmark />
      </header>

      <main className="flex flex-1 items-center py-6 lg:py-10">
        <MoodDemo />
      </main>

      <footer className="flex flex-col gap-4 border-t border-rule py-7 text-sm sm:flex-row sm:items-start sm:justify-between">
        <HelpDisclosure />
        <p className="text-muted-foreground">Não é terapia nem diagnóstico. Seus dados são seus.</p>
      </footer>
    </div>
  )
}
