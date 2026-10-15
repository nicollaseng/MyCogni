import type { FormState } from '../form-state'

export function FormFeedback({ state }: { state: FormState }) {
  if (state.error !== null) {
    return (
      <p role="alert" className="text-sm text-danger">
        {state.error}
      </p>
    )
  }
  if (state.notice !== null) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {state.notice}
      </p>
    )
  }
  return null
}
