import { signInWithGoogle } from '../actions'
import { SingleActionButton } from './single-action-button'

export function GoogleSignIn() {
  return (
    <div className="mb-6 space-y-6">
      <SingleActionButton action={signInWithGoogle} pendingLabel="Abrindo o Google…">
        Continuar com Google
      </SingleActionButton>
      <p className="flex items-center gap-4 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-rule after:h-px after:flex-1 after:bg-rule">
        ou com email
      </p>
    </div>
  )
}
