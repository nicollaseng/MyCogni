import type { Metadata } from 'next'
import { LegalPage } from '@/features/legal/components/legal-page'
import { privacyPolicy } from '@/features/legal/content'

export const metadata: Metadata = { title: privacyPolicy.title }

export default function PrivacyPage() {
  return <LegalPage document={privacyPolicy} />
}
