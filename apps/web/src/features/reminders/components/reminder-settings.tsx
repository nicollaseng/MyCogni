'use client'

import type { ReminderOverview, ReminderSettings as Settings } from '@mycogni/contracts'
import { isLocale } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState, useSyncExternalStore, useTransition } from 'react'
import { FormMessage } from '@/features/account/components/form-message'
import { Panel } from '@/shared/components/section'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Switch } from '@/shared/ui/switch'
import {
  browserPushEnvironment,
  pushSupportOf,
  subscribeThisDevice,
  unsubscribeThisDevice,
  type PushSupport,
} from '../push-device'
import { dayKeyOf, dayOrder, toggleDay } from '../week-days'

export interface ReminderActions {
  save: (settings: Settings) => Promise<ActionResult<ReminderOverview>>
  registerDevice: (subscription: PushSubscriptionJSON) => Promise<ActionResult<null>>
  forgetDevice: (endpoint: string) => Promise<ActionResult<null>>
}

type PushNotice = Exclude<PushSupport, 'ready'> | 'unavailable'

const noSubscription = () => () => undefined

function useBrowserPushSupport(): PushSupport | null {
  return useSyncExternalStore(
    noSubscription,
    () => pushSupportOf(browserPushEnvironment()),
    () => null,
  )
}

interface ToggleRowProps {
  label: string
  hint?: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ label, hint, checked, disabled = false, onChange }: ToggleRowProps) {
  const hintId = useId()
  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <div className="space-y-1">
        <p>{label}</p>
        {hint !== undefined && (
          <p id={hintId} className="max-w-md text-sm text-pretty text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <div className="pt-0.5">
        <Switch
          checked={checked}
          label={label}
          describedBy={hint === undefined ? undefined : hintId}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
    </div>
  )
}

interface ReminderSettingsProps {
  overview: ReminderOverview
  actions: ReminderActions
}

export function ReminderSettings({ overview, actions }: ReminderSettingsProps) {
  const t = useTranslations('reminders')
  const locale = useLocale()
  const timeId = useId()
  const support = useBrowserPushSupport()
  const [settings, setSettings] = useState<Settings>(overview.settings)
  const [pushNotice, setPushNotice] = useState<PushNotice | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const order = dayOrder(isLocale(locale) ? locale : 'pt-BR')
  const shownNotice: PushNotice | null =
    pushNotice ?? (support === 'install' && !settings.push ? 'install' : null)

  function change(next: Partial<Settings>) {
    setNotice(null)
    setSettings((current) => ({ ...current, ...next }))
  }

  function turnPushOn() {
    startTransition(async () => {
      if (overview.pushKey === null) {
        setPushNotice('unavailable')
        return
      }
      if (support !== 'ready') {
        setPushNotice(support ?? 'unsupported')
        return
      }
      const subscription = await subscribeThisDevice(overview.pushKey)
      if (subscription === null) {
        setPushNotice('blocked')
        return
      }
      const result = await actions.registerDevice(subscription)
      if (result.ok) {
        setPushNotice(null)
        change({ push: true })
      } else {
        setError(result.error)
      }
    })
  }

  function turnPushOff() {
    startTransition(async () => {
      const endpoint = await unsubscribeThisDevice()
      if (endpoint !== null) {
        await actions.forgetDevice(endpoint)
      }
      change({ push: false })
    })
  }

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await actions.save(settings)
      if (result.ok) {
        setSettings(result.value.settings)
        setNotice(t('saved'))
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <Panel>
        <ToggleRow
          label={t('enabled.label')}
          hint={t('enabled.hint')}
          checked={settings.enabled}
          onChange={(enabled) => {
            change({ enabled })
          }}
        />
      </Panel>
      {settings.enabled && (
        <>
          <Panel className="space-y-5 py-4">
            <div className="flex items-center justify-between gap-6">
              <label htmlFor={timeId}>{t('time')}</label>
              <input
                id={timeId}
                type="time"
                required
                value={settings.time}
                onChange={(event) => {
                  change({ time: event.currentTarget.value })
                }}
                className="h-11 rounded-md border border-rule bg-background px-3 text-base tabular-nums outline-none focus:border-foreground"
              />
            </div>
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm text-muted-foreground">{t('days.legend')}</legend>
              <div className="grid grid-cols-7 gap-1.5">
                {order.map((day) => {
                  const key = dayKeyOf(day)
                  const chosen = settings.days.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={chosen}
                      aria-label={t(`days.long.${key}`)}
                      disabled={chosen && settings.days.length === 1}
                      onClick={() => {
                        change({ days: toggleDay(settings.days, day) })
                      }}
                      className={cn(
                        'h-10 cursor-pointer rounded-md text-sm transition-colors duration-150 disabled:cursor-default motion-reduce:transition-none',
                        chosen
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-rule text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t(`days.short.${key}`)}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </Panel>
          <fieldset>
            <legend className="mb-3 text-[15px] font-medium">{t('channels.legend')}</legend>
            <Panel>
              <ToggleRow
                label={t('channels.push')}
                checked={settings.push}
                disabled={pending}
                onChange={(on) => {
                  if (on) {
                    turnPushOn()
                  } else {
                    turnPushOff()
                  }
                }}
              />
              {shownNotice !== null && (
                <p className="pb-3.5 text-sm text-pretty text-muted-foreground">
                  {t(`push.${shownNotice}`)}
                </p>
              )}
              <ToggleRow
                label={t('channels.email')}
                checked={settings.email}
                onChange={(email) => {
                  change({ email })
                }}
              />
            </Panel>
          </fieldset>
        </>
      )}
      <div className="flex items-center gap-4">
        <Button size="sm" disabled={pending} onClick={save}>
          {t('save')}
        </Button>
        <FormMessage error={error} notice={notice} />
      </div>
    </div>
  )
}
