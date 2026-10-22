import type { Page } from '@playwright/test'

export async function installSyntheticMicrophone(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const speak = () => {
      const context = new AudioContext()
      const voice = context.createOscillator()
      const swell = context.createOscillator()
      const depth = context.createGain()
      const level = context.createGain()
      voice.frequency.value = 180
      swell.frequency.value = 1.5
      depth.gain.value = 0.11
      level.gain.value = 0.12
      swell.connect(depth).connect(level.gain)
      const destination = context.createMediaStreamDestination()
      voice.connect(level).connect(destination)
      voice.start()
      swell.start()
      return Promise.resolve(destination.stream)
    }
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: speak })
  })
}
