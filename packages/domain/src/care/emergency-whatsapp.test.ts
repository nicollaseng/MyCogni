import { describe, expect, it } from '@jest/globals'
import { emergencyWhatsappOf, isEmergencyWhatsapp, whatsappHref } from './emergency-whatsapp.ts'

describe('isEmergencyWhatsapp', () => {
  it('accepts international numbers in E.164', () => {
    expect(isEmergencyWhatsapp('+5511987654321')).toBe(true)
    expect(isEmergencyWhatsapp('+351912345678')).toBe(true)
    expect(isEmergencyWhatsapp('+12025550123')).toBe(true)
  })

  it('refuses numbers without the plus, too short, too long or starting at zero', () => {
    expect(isEmergencyWhatsapp('5511987654321')).toBe(false)
    expect(isEmergencyWhatsapp('+5511987')).toBe(false)
    expect(isEmergencyWhatsapp('+5511987654321123')).toBe(false)
    expect(isEmergencyWhatsapp('+0511987654321')).toBe(false)
    expect(isEmergencyWhatsapp('+55 11 98765-4321')).toBe(false)
  })
})

describe('emergencyWhatsappOf', () => {
  it('joins the country code and the number the way people type them', () => {
    expect(emergencyWhatsappOf('+55', '(11) 98765-4321')).toBe('+5511987654321')
    expect(emergencyWhatsappOf('+351', '912 345 678')).toBe('+351912345678')
  })

  it('has nothing for a number that cannot be dialled', () => {
    expect(emergencyWhatsappOf('+55', '1234')).toBeNull()
    expect(emergencyWhatsappOf('+55', '')).toBeNull()
  })
})

describe('whatsappHref', () => {
  it('opens a chat with the number and the message ready to send', () => {
    expect(whatsappHref('+5511987654321', 'Oi Helena, isso é urgente.\n\nMensagem')).toBe(
      'https://wa.me/5511987654321?text=Oi%20Helena%2C%20isso%20%C3%A9%20urgente.%0A%0AMensagem',
    )
  })
})
