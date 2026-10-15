import type { ProfessionalProfile } from '@mycogni/contracts'
import { redirect } from 'next/navigation'
import { fetchProfessional } from '@/shared/lib/api/care'
import { currentUser } from '@/shared/lib/auth/session'

export async function requireProfessional(): Promise<ProfessionalProfile> {
  if ((await currentUser()) === null) {
    redirect('/pro/join')
  }
  const professional = await fetchProfessional()
  if (professional === null) {
    redirect('/pro/join')
  }
  return professional
}

export async function requireVerifiedProfessional(): Promise<ProfessionalProfile> {
  const professional = await requireProfessional()
  if (professional.status !== 'verified') {
    redirect('/pro')
  }
  return professional
}
