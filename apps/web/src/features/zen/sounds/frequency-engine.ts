import {
  binauralTones,
  soundFadeInSeconds,
  soundFadeOutSeconds,
  type NoiseBed,
  type SoundMode,
  type SoundProgramme,
} from '@mycogni/domain'

export const masterVolume = 0.5

export const toneVolume = 0.16

export const bedVolume = 0.06

const bedSeconds = 4

export interface FrequencyEngine {
  start(programme: SoundProgramme, mode: SoundMode): void
  stop(): Promise<void>
  playing(): boolean
}

export type ContextFactory = () => AudioContext

function noise(context: AudioContext, bed: NoiseBed): AudioBuffer {
  const length = context.sampleRate * bedSeconds
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  let low = 0
  let middle = 0
  let high = 0
  for (let index = 0; index < length; index++) {
    const white = Math.random() * 2 - 1
    if (bed === 'brown') {
      last = (last + 0.02 * white) / 1.02
      data[index] = last * 3.5
    } else {
      low = 0.99765 * low + white * 0.099046
      middle = 0.963 * middle + white * 0.2965164
      high = 0.57 * high + white * 1.0526913
      data[index] = (low + middle + high + white * 0.1848) * 0.12
    }
  }
  return buffer
}

function tone(context: AudioContext, frequency: number): OscillatorNode {
  const oscillator = context.createOscillator()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  return oscillator
}

export function createFrequencyEngine(
  createContext: ContextFactory = () => new AudioContext(),
): FrequencyEngine {
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let sources: AudioScheduledSourceNode[] = []

  function connect(
    audio: AudioContext,
    output: GainNode,
    programme: SoundProgramme,
    mode: SoundMode,
  ): AudioScheduledSourceNode[] {
    const { carrier, beat, bed } = programme
    const tones = audio.createGain()
    tones.gain.value = toneVolume
    tones.connect(output)
    const started: AudioScheduledSourceNode[] = []
    if (mode === 'binaural') {
      for (const [index, frequency] of binauralTones(programme).entries()) {
        const side = audio.createStereoPanner()
        side.pan.value = index === 0 ? -1 : 1
        const oscillator = tone(audio, frequency)
        oscillator.connect(side).connect(tones)
        started.push(oscillator)
      }
    } else {
      const pulse = audio.createGain()
      pulse.gain.value = 0.5
      const oscillator = tone(audio, carrier)
      const rhythm = tone(audio, beat)
      const depth = audio.createGain()
      depth.gain.value = 0.5
      rhythm.connect(depth).connect(pulse.gain)
      oscillator.connect(pulse).connect(tones)
      started.push(oscillator, rhythm)
    }
    const bedSource = audio.createBufferSource()
    bedSource.buffer = noise(audio, bed)
    bedSource.loop = true
    const filter = audio.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    const bedGain = audio.createGain()
    bedGain.gain.value = bedVolume
    bedSource.connect(filter).connect(bedGain).connect(output)
    started.push(bedSource)
    return started
  }

  return {
    start(programme, mode) {
      if (context !== null) {
        return
      }
      const audio = createContext()
      const output = audio.createGain()
      output.gain.setValueAtTime(0, audio.currentTime)
      output.gain.linearRampToValueAtTime(masterVolume, audio.currentTime + soundFadeInSeconds)
      output.connect(audio.destination)
      sources = connect(audio, output, programme, mode)
      for (const source of sources) {
        source.start()
      }
      context = audio
      master = output
      void audio.resume().catch(() => undefined)
    },
    stop() {
      const audio = context
      const output = master
      const playingSources = sources
      context = null
      master = null
      sources = []
      if (audio === null || output === null) {
        return Promise.resolve()
      }
      const now = audio.currentTime
      output.gain.cancelScheduledValues(now)
      output.gain.setValueAtTime(output.gain.value, now)
      output.gain.linearRampToValueAtTime(0, now + soundFadeOutSeconds)
      return new Promise((resolve) => {
        setTimeout(() => {
          for (const source of playingSources) {
            source.stop()
          }
          void audio.close().catch(() => undefined)
          resolve()
        }, soundFadeOutSeconds * 1000)
      })
    },
    playing() {
      return context !== null
    },
  }
}
