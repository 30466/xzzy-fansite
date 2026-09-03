export const BEIJING_TIME_ZONE = 'Asia/Shanghai'

const beijingPartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BEIJING_TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
})

function toValidDate(value) {
  if (value === null || value === undefined || value === '') return null
  let normalized = value
  if (typeof value === 'string') {
    if (/^\d+$/.test(value)) normalized = Number(value)
    else if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value.trim())) return null
  }
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(normalized)
  return Number.isFinite(date.getTime()) ? date : null
}

const pad = value => String(value).padStart(2, '0')
const formatCivilDate = parts => `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
export function getBeijingParts(value = Date.now()) {
  const date = toValidDate(value)
  if (!date) return null
  const values = {}
  for (const part of beijingPartsFormatter.formatToParts(date)) {
    if (part.type !== 'literal') values[part.type] = Number(part.value)
  }
  return { year: values.year, month: values.month, day: values.day, hour: values.hour, minute: values.minute, second: values.second }
}

export function getAbsoluteTime(value) {
  return toValidDate(value)?.getTime() ?? 0
}

export function parseBeijingDateTime(value) {
  const match = String(value ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T~](\d{2})[:.](\d{2})[:.](\d{2})$/)
  if (!match) return null
  const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour: Number(match[4]), minute: Number(match[5]), second: Number(match[6]) }
  const probe = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  const validDate = probe.getUTCFullYear() === parts.year && probe.getUTCMonth() + 1 === parts.month && probe.getUTCDate() === parts.day
  const validTime = parts.hour >= 0 && parts.hour <= 23 && parts.minute >= 0 && parts.minute <= 59 && parts.second >= 0 && parts.second <= 59
  return validDate && validTime ? parts : null
}

export function formatBeijingDate(value) {
  const parts = getBeijingParts(value)
  return parts ? formatCivilDate(parts) : ''
}
export function formatBeijingTime(value, { seconds = false } = {}) {
  const parts = getBeijingParts(value)
  if (!parts) return ''
  const base = `${pad(parts.hour)}:${pad(parts.minute)}`
  return seconds ? `${base}:${pad(parts.second)}` : base
}
export function formatBeijingDateTime(value, { seconds = true } = {}) {
  const parts = getBeijingParts(value)
  if (!parts) return ''
  const base = `${formatCivilDate(parts)} ${pad(parts.hour)}:${pad(parts.minute)}`
  return seconds ? `${base}:${pad(parts.second)}` : base
}
export function getArchiveDate(value) {
  const parts = getBeijingParts(value)
  return parts ? formatCivilDate(parts) : null
}
export function getArchiveDateFromBeijingDateTime(value) {
  const parts = parseBeijingDateTime(value)
  return parts ? formatCivilDate(parts) : null
}
