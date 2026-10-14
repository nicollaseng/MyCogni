import { fileURLToPath } from 'node:url'

export const signedInState = fileURLToPath(new URL('../.auth/signed-in.json', import.meta.url))

export const signedOut = { cookies: [], origins: [] }
