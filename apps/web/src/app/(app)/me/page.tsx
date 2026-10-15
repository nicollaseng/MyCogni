import type { Metadata } from 'next'
import { signOut } from '@/features/auth/actions'
import { PageTitle } from '@/shared/components/page-title'
import { requireUser } from '@/shared/lib/auth/session'
import { Button } from '@/shared/ui/button'

export const metadata: Metadata = { title: 'Você' }

export default async function MePage() {
  const user = await requireUser()

  return (
    <>
      <PageTitle title="Você" description="Seus dados, seus lembretes e sua privacidade." />
      <section className="space-y-4 border-t border-rule pt-8">
        <h2 className="text-xs tracking-[0.04em] text-muted-foreground">conta</h2>
        <p>{user.email}</p>
        <form action={signOut}>
          <Button type="submit" variant="outline" shape="pill">
            Sair
          </Button>
        </form>
      </section>
      <p className="border-t border-rule pt-8 text-muted-foreground">
        Foto, nome, lembretes e a exportação dos seus dados ficam aqui.
      </p>
    </>
  )
}
