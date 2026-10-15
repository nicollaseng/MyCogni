import { StepActions } from '@/shared/components/step-actions'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'

export function SupportStep({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="mt-10 border-l-2 border-help pl-5">
        <h1 className="font-serif text-[34px] leading-[1.06] tracking-[-0.02em] text-balance">
          Obrigado por contar.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-pretty">
          Você disse que, nas últimas duas semanas, pensou em se ferir ou que seria melhor estar
          morto/a. Isso é sério, e você não precisa passar por isso sem ajuda.
        </p>
      </div>
      <dl className="mt-8 space-y-5 text-[15px] leading-relaxed">
        <div>
          <dt className="font-medium">CVV · 188</dt>
          <dd className="text-muted-foreground">
            Conversa sigilosa e gratuita, 24 horas. Também por chat em cvv.org.br.
          </dd>
        </div>
        <div>
          <dt className="font-medium">Em perigo agora?</dt>
          <dd className="text-muted-foreground">
            Ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo.
          </dd>
        </div>
      </dl>
      <StepActions className="gap-3">
        <a href="tel:188" className={cn(buttonVariants({ size: 'lg', shape: 'pill' }), 'w-full')}>
          Ligar para o CVV
        </a>
        <Button size="lg" shape="pill" variant="outline" onClick={onContinue}>
          Continuar o questionário
        </Button>
      </StepActions>
    </section>
  )
}
