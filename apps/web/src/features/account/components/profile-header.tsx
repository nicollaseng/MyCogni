import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { ActionResult } from '@/shared/lib/actions/result'
import { initialsOf } from '@/shared/lib/initials'
import { AvatarControls } from './avatar-controls'

interface ProfileHeaderProps {
  name: string | null
  email: string | null
  photoUrl: string | null
  upload: (data: FormData) => Promise<ActionResult<string>>
  remove: () => Promise<ActionResult<string>>
}

export function ProfileHeader({ name, email, photoUrl, upload, remove }: ProfileHeaderProps) {
  const t = useTranslations('account.profile')
  return (
    <header className="flex items-center gap-5">
      {photoUrl === null ? (
        <span
          aria-hidden
          className="grid size-20 shrink-0 place-items-center rounded-full bg-sage font-serif text-[28px]"
        >
          {initialsOf(name, email)}
        </span>
      ) : (
        <Image
          src={photoUrl}
          alt={t('photo')}
          width={80}
          height={80}
          unoptimized
          className="size-20 shrink-0 rounded-full object-cover"
        />
      )}
      <div className="min-w-0 space-y-1">
        <h1 className="truncate font-serif text-[32px] leading-[1.05] tracking-[-0.02em]">
          {name ?? t('fallbackName')}
        </h1>
        <p className="truncate text-sm text-muted-foreground">{email}</p>
        <AvatarControls hasPhoto={photoUrl !== null} upload={upload} remove={remove} />
      </div>
    </header>
  )
}
