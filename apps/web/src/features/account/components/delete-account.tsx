'use client'

import { useState, type SubmitEvent } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { FormMessage } from './form-message'

interface DeleteAccountProps {
  remove: (confirmation: string) => Promise<ActionResult<null>>
}

export function DeleteAccount({ remove }: DeleteAccountProps) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const { submit, pending, error } = useSubmit(remove, () => undefined)
  const confirmed = confirmation.trim().toUpperCase() === 'EXCLUIR'

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(confirmation)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true)
        }}
        className="py-3.5 text-left text-danger underline decoration-1 underline-offset-4"
      >
        Excluir minha conta
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-3.5">
      <p className="leading-relaxed text-pretty">
        Isso apaga sua conta, seus registros, questionários, consentimentos e vínculos com
        profissionais. Não dá para desfazer. Se quiser, baixe seus dados antes.
      </p>
      <TextField
        label="Digite EXCLUIR para confirmar"
        autoComplete="off"
        value={confirmation}
        onChange={(event) => {
          setConfirmation(event.currentTarget.value)
        }}
      />
      <FormMessage error={error} notice={null} />
      <div className="flex gap-3">
        <Button
          type="submit"
          size="sm"
          shape="pill"
          disabled={!confirmed || pending}
          className="bg-danger text-background hover:bg-danger/90"
        >
          {pending ? 'Excluindo…' : 'Excluir para sempre'}
        </Button>
        <Button
          type="button"
          size="sm"
          shape="pill"
          variant="ghost"
          onClick={() => {
            setOpen(false)
            setConfirmation('')
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
