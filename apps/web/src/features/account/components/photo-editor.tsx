'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useId, useState, type ChangeEvent } from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import { Sheet } from '@/shared/components/sheet'
import { Button } from '@/shared/ui/button'
import type { RenderPhoto } from '../photo-canvas'
import { quarterTurn, usableArea } from '../photo-geometry'

interface PhotoEditorProps {
  source: File
  preview: string
  render: RenderPhoto
  onConfirm: (photo: File) => void
  onClose: () => void
  onChooseAnother?: (event: ChangeEvent<HTMLInputElement>) => void
}

const cropAreaStyle = {
  border: '1px solid color-mix(in oklab, var(--foreground) 45%, transparent)',
  color: 'color-mix(in oklab, var(--background) 62%, transparent)',
}

const sliderRow = 'grid grid-cols-[5.5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm'

const turnButton = 'h-9 px-3.5 text-sm'

export function PhotoEditor({
  source,
  preview,
  render,
  onConfirm,
  onClose,
  onChooseAnother,
}: PhotoEditorProps) {
  const t = useTranslations('account.photoEditor')
  const format = useFormatter()
  const ids = useId()
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [quarter, setQuarter] = useState(0)
  const [angle, setAngle] = useState(0)
  const [area, setArea] = useState<Area | null>(null)
  const [state, setState] = useState<'editing' | 'preparing' | 'failed'>('editing')
  const rotation = quarter + angle

  async function confirm(close: () => void) {
    setState('preparing')
    try {
      onConfirm(await render(source, area, rotation))
      close()
    } catch {
      setState('failed')
    }
  }

  return (
    <Sheet title={t('title')} closeLabel={t('close')} onClose={onClose}>
      {(close) => (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5 sm:px-6">
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{t('hint')}</p>
            <div className="relative mx-auto aspect-square w-full max-w-[24rem] overflow-hidden rounded-[8px] bg-surface">
              <Cropper
                image={preview}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                objectFit="cover"
                minZoom={1}
                maxZoom={4}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => {
                  setArea(usableArea(pixels))
                }}
                style={{ cropAreaStyle }}
                cropperProps={{ 'aria-label': t('area') }}
                mediaProps={{ alt: '' }}
              />
            </div>
            <div className="space-y-3">
              <div className={sliderRow}>
                <label htmlFor={`${ids}-zoom`}>{t('zoom')}</label>
                <input
                  id={`${ids}-zoom`}
                  type="range"
                  min={1}
                  max={4}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => {
                    setZoom(Number(event.currentTarget.value))
                  }}
                  className="w-full accent-primary"
                />
                <span aria-hidden className="text-right text-muted-foreground tabular-nums">
                  {format.number(zoom, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}×
                </span>
              </div>
              <div className={sliderRow}>
                <label htmlFor={`${ids}-angle`}>{t('angle')}</label>
                <input
                  id={`${ids}-angle`}
                  type="range"
                  min={-45}
                  max={45}
                  step={1}
                  value={angle}
                  aria-valuetext={t('degrees', { value: angle })}
                  onChange={(event) => {
                    setAngle(Number(event.currentTarget.value))
                  }}
                  className="w-full accent-primary"
                />
                <span aria-hidden className="text-right text-muted-foreground tabular-nums">
                  {t('degrees', { value: angle })}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className={turnButton}
                onClick={() => {
                  setQuarter((current) => quarterTurn(current, -1))
                }}
              >
                {t('rotateLeft')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={turnButton}
                onClick={() => {
                  setQuarter((current) => quarterTurn(current, 1))
                }}
              >
                {t('rotateRight')}
              </Button>
              {onChooseAnother !== undefined && (
                <label className="inline-flex h-9 cursor-pointer items-center rounded-md px-3.5 text-sm underline decoration-1 underline-offset-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={onChooseAnother}
                  />
                  {t('chooseAnother')}
                </label>
              )}
            </div>
            {state === 'failed' && (
              <p role="alert" className="text-sm text-danger">
                {t('failed')}
              </p>
            )}
          </div>
          <div className="flex shrink-0 justify-end gap-2.5 border-t border-rule px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
            <Button variant="outline" size="sm" onClick={close}>
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              disabled={state === 'preparing'}
              onClick={() => {
                void confirm(close)
              }}
            >
              {state === 'preparing' ? t('preparing') : t('confirm')}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
