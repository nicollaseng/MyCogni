export const accountTypes = ['patient', 'professional'] as const

export type AccountType = (typeof accountTypes)[number]

export const accountTypeChoiceMinutes = 60

export interface AccountFootprint {
  createdAt: Date
  onboardingCompletedAt: Date | null
  records: number
}

export function isAccountType(value: unknown): value is AccountType {
  return accountTypes.some((type) => type === value)
}

export function signUpAccountType(value: unknown): AccountType {
  return value === 'professional' ? 'professional' : 'patient'
}

export function isBrandNewAccount(account: AccountFootprint, now: Date): boolean {
  const age = now.getTime() - account.createdAt.getTime()
  return (
    account.onboardingCompletedAt === null &&
    account.records === 0 &&
    age >= 0 &&
    age <= accountTypeChoiceMinutes * 60_000
  )
}
