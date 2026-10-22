'use client'

import { isRecordable, readingCompleted, readingEndDwellMs, type ArticleId } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { recordPractice, type RecordPractice } from './record'

interface ReadingTrackerProps {
  article: ArticleId
  record?: RecordPractice
}

export function ReadingTracker({ article, record = recordPractice }: ReadingTrackerProps) {
  const t = useTranslations('zen.practice')
  const end = useRef<HTMLDivElement>(null)
  const startedAt = useRef<Date | null>(null)
  const saved = useRef(false)
  const done = useRef(false)
  const latest = useRef(record)
  const [read, setRead] = useState(false)

  useEffect(() => {
    latest.current = record
  })

  function save(finished: boolean): void {
    done.current = done.current || finished
    const completed = done.current
    if (saved.current || startedAt.current === null) {
      return
    }
    const seconds = (Date.now() - startedAt.current.getTime()) / 1000
    if (!isRecordable({ kind: 'reading', contentId: article, seconds, completed })) {
      return
    }
    saved.current = true
    void latest.current({
      kind: 'reading',
      contentId: article,
      startedAt: startedAt.current,
      seconds,
      completed,
    })
  }

  const latestSave = useRef(save)

  useEffect(() => {
    latestSave.current = save
  })

  useEffect(() => {
    startedAt.current = new Date()
    const leave = () => {
      latestSave.current(false)
    }
    window.addEventListener('pagehide', leave)
    return () => {
      window.removeEventListener('pagehide', leave)
      leave()
    }
  }, [])

  useEffect(() => {
    const element = end.current
    if (element === null || typeof IntersectionObserver === 'undefined') {
      return undefined
    }
    let since: number | null = null
    let timer: number | undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting === true) {
        since = Date.now()
        timer = window.setTimeout(() => {
          if (since !== null && readingCompleted(Date.now() - since, false)) {
            setRead(true)
            latestSave.current(true)
          }
        }, readingEndDwellMs)
      } else {
        since = null
        window.clearTimeout(timer)
      }
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div ref={end} data-testid="reading-end" className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        disabled={read}
        onClick={() => {
          setRead(true)
          latestSave.current(readingCompleted(0, true))
        }}
      >
        {read ? t('read') : t('markRead')}
      </Button>
    </div>
  )
}
