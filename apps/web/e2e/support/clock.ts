export function zoneAtHour(hour: number, now: Date = new Date()): string {
  let offset = hour - now.getUTCHours()
  if (offset > 14) {
    offset -= 24
  }
  if (offset < -12) {
    offset += 24
  }
  if (offset === 0) {
    return 'Etc/GMT'
  }
  return offset > 0 ? `Etc/GMT-${String(offset)}` : `Etc/GMT+${String(-offset)}`
}
