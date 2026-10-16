export const emergencyWhatsappPattern = /^\+[1-9][0-9]{7,14}$/

export const defaultCountryCode = '+55'

export const maxEmergencyContacts = 3

export function isEmergencyWhatsapp(value: string): boolean {
  return emergencyWhatsappPattern.test(value)
}

export function emergencyWhatsappOf(countryCode: string, number: string): string | null {
  const value = `+${`${countryCode}${number}`.replace(/\D/g, '')}`
  return isEmergencyWhatsapp(value) ? value : null
}

export function whatsappHref(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}
