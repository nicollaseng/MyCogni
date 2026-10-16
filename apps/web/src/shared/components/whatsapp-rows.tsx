import { whatsappHref } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import type { EmergencyContact } from '@/shared/lib/emergency-contacts'

interface WhatsappRowsProps {
  contacts: readonly EmergencyContact[]
  className?: string
}

export function WhatsappRows({ contacts, className }: WhatsappRowsProps) {
  const t = useTranslations('common.whatsapp')

  if (contacts.length === 0) {
    return null
  }

  return (
    <ul aria-label={t('list')} className={className}>
      {contacts.map((contact) => (
        <li key={`${contact.name}-${contact.whatsapp}`}>
          <a
            href={whatsappHref(contact.whatsapp, t('message', { name: contact.name }))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-baseline gap-1.5 py-1"
          >
            <span className="font-medium text-foreground underline decoration-1 underline-offset-4">
              {t('talk', { name: contact.name })}
            </span>{' '}
            <span className="text-muted-foreground">{t('label')}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
