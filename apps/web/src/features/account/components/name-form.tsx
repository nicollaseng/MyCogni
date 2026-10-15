'use client'

import { useState, type SubmitEvent } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { FormMessage } from './form-message'
import { useCloseRow } from './settings-row'

interface NameFormProps {
  initialName: string
  rename: (displayName: string) => Promise<ActionResult<string>>
}

export function NameForm({ initialName, rename }: NameFormProps) {
  const close = useCloseRow()
  const [name, setName] = useState(initialName)
  const { submit, pending, error } = useSubmit(rename, close)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(name)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextField
        label="Novo nome"
        autoComplete="given-name"
        maxLength={80}
        value={name}
        onChange={(event) => {
          setName(event.currentTarget.value)
        }}
      />
      <FormMessage error={error} notice={null} />
      <Button type="submit" size="sm" shape="pill" disabled={pending || name.trim() === ''}>
        {pending ? 'Salvando…' : 'Salvar nome'}
      </Button>
    </form>
  )
}
