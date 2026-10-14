import type { FormState } from '../form-state'
import { GoogleMark } from './google-mark'
import { SingleActionButton } from './single-action-button'

interface GoogleSignInProps {
  action: (state: FormState) => Promise<FormState>
}

export function GoogleSignIn({ action }: GoogleSignInProps) {
  return (
    <div className="mb-6 space-y-6">
      <SingleActionButton action={action} pendingLabel="Abrindo o Google…">
        <span className="flex items-center gap-3">
          <GoogleMark />
          Continuar com o Google
        </span>
      </SingleActionButton>
      <p className="flex items-center gap-4 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-rule after:h-px after:flex-1 after:bg-rule">
        ou com email
      </p>
    </div>
  )
}
