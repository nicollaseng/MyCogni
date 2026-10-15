'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { initialsOf } from '@/features/account/avatar'
import { PhotoField, type PhotoTransport } from '@/features/account/components/photo-field'
import { StepActions } from '@/shared/components/step-actions'
import { StepHeading } from '@/shared/components/step-heading'
import { Button } from '@/shared/ui/button'

export interface OnboardingPhoto {
  url: string | null
  email: string | null
}

interface PhotoStepProps {
  photo: OnboardingPhoto
  name: string
  saved: () => Promise<void>
  transport?: PhotoTransport
  onDone: () => void
}

export function PhotoStep({ photo, name, saved, transport, onDone }: PhotoStepProps) {
  const t = useTranslations('onboarding.photo')
  const [hasPhoto, setHasPhoto] = useState(photo.url !== null)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StepHeading title={t('title')}>{t('lead')}</StepHeading>
      <div className="mt-8">
        <PhotoField
          photoUrl={photo.url}
          initials={initialsOf(name, photo.email)}
          alt={t('alt')}
          transport={transport}
          onSaved={saved}
          onChange={(url) => {
            setHasPhoto(url !== null)
          }}
        />
      </div>
      <p className="mt-6 text-sm text-pretty text-muted-foreground">{t('later')}</p>
      <StepActions>
        <Button type="button" size="lg" onClick={onDone}>
          {hasPhoto ? t('continue') : t('skip')}
        </Button>
      </StepActions>
    </div>
  )
}
