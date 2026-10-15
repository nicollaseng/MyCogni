import type { Locale } from '@mycogni/domain'

export interface PluralForms {
  one: string
  other: string
}

export function pluralizer(locale: Locale): (count: number, forms: PluralForms) => string {
  const rules = new Intl.PluralRules(locale)
  return (count, forms) =>
    (rules.select(count) === 'one' ? forms.one : forms.other).replace('#', String(count))
}
