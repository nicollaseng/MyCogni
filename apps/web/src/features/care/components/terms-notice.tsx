import type { CareLink } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { termsNoticeHref } from '../terms'

export function TermsNotice({ links }: { links: readonly CareLink[] }) {
  const t = useTranslations('care.terms')
  const href = termsNoticeHref(links)

  if (href === null) {
    return null
  }

  return (
    <p className="flex items-start gap-2.5 text-[15px] leading-relaxed text-pretty">
      <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-emphasis" />
      <span>
        {t.rich('notice', {
          link: (chunks) => (
            <Link
              href={href}
              className="whitespace-nowrap underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {chunks}
            </Link>
          ),
        })}
      </span>
    </p>
  )
}
