import { readFileSync } from 'node:fs'
import { isIP } from 'node:net'
import { join } from 'node:path'
import { Reader, type Response } from 'mmdb-lib'
import { z } from 'zod'

const countryRecordSchema = z.object({ country_code: z.string().length(2) })

let reader: Reader<Response> | null = null

function countryReader(): Reader<Response> {
  reader ??= new Reader<Response>(
    readFileSync(
      join(
        process.cwd(),
        'node_modules/@ip-location-db/geo-whois-asn-country-mmdb/geo-whois-asn-country.mmdb',
      ),
    ),
  )
  return reader
}

export function countryOfIp(ip: string): string | null {
  if (isIP(ip) === 0) {
    return null
  }
  try {
    const record = countryRecordSchema.safeParse(countryReader().get(ip))
    return record.success ? record.data.country_code : null
  } catch (cause) {
    console.error(cause)
    return null
  }
}

export function clientIp(forwardedFor: string | null, realIp: string | null): string | null {
  const first = forwardedFor?.split(',')[0]?.trim()
  return first === undefined || first === '' ? realIp : first
}
