import { useTranslations } from 'next-intl'
import { initialsOf } from '@/shared/lib/initials'
import type { PhotoTransport } from '../use-photo-editing'
import { ProfilePhoto } from './profile-photo'

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
  const shownName = name ?? t('fallbackName')

  return (
    <ProfilePhoto
      photoUrl={photoUrl}
      initials={initialsOf(name, email)}
      alt={t('photo')}
      onSaved={onPhotoSaved}
      transport={transport}
    >
      <p className="truncate font-serif text-[26px] leading-[1.1] tracking-[-0.01em]">
        {shownName}
      </p>
      <p className="truncate text-sm text-muted-foreground">{email}</p>
    </ProfilePhoto>
  )
}
