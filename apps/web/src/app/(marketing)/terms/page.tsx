import type { Metadata } from 'next'
import { LegalPage } from '@/features/legal/components/legal-page'
import { termsOfUse } from '@/features/legal/content'

export const metadata: Metadata = { title: termsOfUse.title }

export default function TermsPage() {
  return <LegalPage document={termsOfUse} />
}
