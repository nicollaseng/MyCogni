import { useTranslations } from 'next-intl'
import { initialsOf } from '@/shared/lib/initials'
import { PhotoField, type PhotoTransport } from './photo-field'

interface ProfileHeaderProps {
  name: string | null
  email: string | null
  photoUrl: string | null
  onPhotoSaved: () => Promise<void>
  transport?: PhotoTransport
}

export function ProfileHeader({
  name,
  email,
  photoUrl,
  onPhotoSaved,
  transport,
}: ProfileHeaderProps) {
  const t = useTranslations('account.profile')
  return (
    <header>
      <PhotoField
        photoUrl={photoUrl}
        initials={initialsOf(name, email)}
        alt={t('photo')}
        onSaved={onPhotoSaved}
        transport={transport}
      >
        <h1 className="truncate font-serif text-[32px] leading-[1.05] tracking-[-0.02em]">
          {name ?? t('fallbackName')}
        </h1>
        <p className="truncate text-sm text-muted-foreground">{email}</p>
      </PhotoField>
    </header>
  )
}
