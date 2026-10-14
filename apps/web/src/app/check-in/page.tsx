import type { Metadata } from 'next'
import { connection } from 'next/server'
import { CheckInFlow } from '@/features/check-in/components/check-in-flow'
import { defaultTimeZone, formatLongDate } from '@/shared/lib/time'

export const metadata: Metadata = { title: 'Check-in' }

export default async function CheckInPage() {
  await connection()
  return <CheckInFlow today={formatLongDate(new Date(), defaultTimeZone)} />
}
