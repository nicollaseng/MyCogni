'use client'

import { useState, type SubmitEvent } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { FormMessage } from './form-message'

interface PasswordFormProps {
  changePassword: (input: { current: string; next: string }) => Promise<ActionResult<string>>
}

export function PasswordForm({ changePassword }: PasswordFormProps) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const { submit, pending, error } = useSubmit(changePassword, (message) => {
    setNotice(message)
    setCurrent('')
    setNext('')
  })

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    submit({ current, next })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextField
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(event) => {
          setCurrent(event.currentTarget.value)
        }}
      />
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres, com letras e números."
        value={next}
        onChange={(event) => {
          setNext(event.currentTarget.value)
        }}
      />
      <FormMessage error={error} notice={notice} />
      <Button
        type="submit"
        size="sm"
        shape="pill"
        disabled={pending || current === '' || next === ''}
      >
        {pending ? 'Salvando…' : 'Salvar nova senha'}
      </Button>
    </form>
  )
}
