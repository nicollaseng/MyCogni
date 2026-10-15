import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { PageTitle } from '@/shared/components/page-title'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'

interface PatientAccountNoticeProps {
  signOut: () => Promise<void>
}

export function PatientAccountNotice({ signOut }: PatientAccountNoticeProps) {
  const t = useTranslations('professional.patientAccount')

  return (
    <div className="max-w-xl space-y-8">
      <div className="space-y-3">
        <PageTitle kicker={t('kicker')} title={t('title')} description={t('body')} />
        <p className="leading-relaxed text-pretty text-muted-foreground">{t('records')}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <form action={signOut}>
          <Button type="submit" className="w-full sm:w-auto">
            {t('signOut')}
          </Button>
        </form>
        <Link
          href="/today"
          className={cn(buttonVariants({ variant: 'outline' }), 'w-full sm:w-auto')}
        >
          {t('back')}
        </Link>
      </div>
    </div>
  )
}
