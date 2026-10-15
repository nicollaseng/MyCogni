import { fetchProfessional } from '../api/care'

export type HomePath = '/pro' | '/today'

export async function homePath(): Promise<HomePath> {
  try {
    return (await fetchProfessional()) === null ? '/today' : '/pro'
  } catch (cause) {
    console.error(cause)
    return '/today'
  }
}
