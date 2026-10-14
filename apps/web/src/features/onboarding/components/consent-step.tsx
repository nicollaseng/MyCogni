'use client'

import { requiredConsentKinds, type ConsentKind } from '@mycogni/domain'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { StepActions } from '@/shared/components/step-actions'
import { Button } from '@/shared/ui/button'
import type { OnboardingActions } from '../model'
import { useSubmit } from '../use-submit'
import { ActionError } from './action-error'
import { StepHeading } from './step-heading'

interface ConsentOption {
  id: string
  kinds: readonly ConsentKind[]
  label: ReactNode
}

const documentLink = 'underline decoration-1 underline-offset-4'

const options: readonly ConsentOption[] = [
  { id: 'adult', kinds: ['adult'], label: 'Tenho 18 anos ou mais.' },
  {
    id: 'documents',
    kinds: ['terms', 'privacy'],
    label: (
      <>
        Li e aceito os{' '}
        <Link href="/terms" target="_blank" className={documentLink}>
          Termos de uso
        </Link>{' '}
        e a{' '}
        <Link href="/privacy" target="_blank" className={documentLink}>
          Política de privacidade
        </Link>
        .
      </>
    ),
  },
  {
    id: 'health',
    kinds: ['health_data'],
    label:
      'Autorizo o tratamento dos meus registros de humor e das minhas respostas aos questionários. São dados de saúde, usados só para mostrar meus padrões.',
  },
  {
    id: 'ai',
    kinds: ['ai_processing'],
    label: 'Opcional: quero que a IA escreva resumos a partir dos meus registros.',
  },
]

function isRequired(option: ConsentOption): boolean {
  return option.kinds.every((kind) => requiredConsentKinds.includes(kind))
}

interface ConsentStepProps {
  accept: OnboardingActions['acceptConsents']
  onDone: () => void
}

export function ConsentStep({ accept, onDone }: ConsentStepProps) {
  const [checked, setChecked] = useState<readonly string[]>([])
  const { submit, pending, error } = useSubmit(accept, onDone)
  const ready = options.filter(isRequired).every((option) => checked.includes(option.id))

  function toggle(id: string) {
    setChecked((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    )
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <StepHeading title="Antes de começar">
        Você vai registrar como se sente, e isso é dado de saúde. Por isso pedimos sua permissão,
        item por item.
      </StepHeading>
      <fieldset className="mt-7 border-t border-rule">
        <legend className="sr-only">Permissões</legend>
        {options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer gap-3.5 border-b border-rule py-4 text-[15px] leading-snug"
          >
            <span className="relative mt-px grid size-[22px] shrink-0">
              <input
                type="checkbox"
                checked={checked.includes(option.id)}
                onChange={() => {
                  toggle(option.id)
                }}
                className="peer size-[22px] cursor-pointer appearance-none rounded-full border-[1.5px] border-foreground/35 transition-colors checked:border-primary checked:bg-primary"
              />
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="pointer-events-none absolute inset-0 m-auto size-3 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
              >
                <path
                  d="M3.5 8.5l3 3 6-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <StepActions>
        <ActionError error={error} />
        <Button
          size="lg"
          shape="pill"
          disabled={!ready || pending}
          onClick={() => {
            submit(
              options
                .filter((option) => checked.includes(option.id))
                .flatMap((option) => option.kinds),
            )
          }}
        >
          {pending ? 'Salvando…' : 'Concordar e continuar'}
        </Button>
      </StepActions>
    </section>
  )
}
