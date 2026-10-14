import { cn } from '@/shared/lib/utils'

const phoneLink = 'font-medium text-foreground underline decoration-1 underline-offset-4'

export function HelpDisclosure({ className }: { className?: string }) {
  return (
    <details className={cn('text-sm', className)}>
      <summary className="w-fit cursor-pointer list-none text-help underline decoration-1 underline-offset-4 [&::-webkit-details-marker]:hidden">
        Precisa de ajuda agora?
      </summary>
      <div className="mt-4 max-w-md space-y-2 border-l-2 border-help pl-4 leading-relaxed">
        <p>Se você está em crise ou pensando em se machucar, ligue agora:</p>
        <p>
          <a href="tel:188" className={phoneLink}>
            188
          </a>{' '}
          <span className="text-muted-foreground">CVV, 24 horas, gratuito</span>
        </p>
        <p>
          <a href="tel:192" className={phoneLink}>
            192
          </a>{' '}
          <span className="text-muted-foreground">SAMU, emergência</span>
        </p>
        <p className="pt-2 text-muted-foreground">
          O MyCogniAI não substitui acompanhamento profissional.
        </p>
      </div>
    </details>
  )
}
