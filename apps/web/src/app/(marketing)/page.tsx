import { LandingPage } from '@/features/landing/components/landing-page'
import { chooseLocale } from '@/features/locale/actions'

export default function HomePage() {
  return <LandingPage chooseLocale={chooseLocale} />
}
