/**
 * Norske formatters for dato, valuta, tall, filstørrelse og relativ tid.
 * Bruker nb-NO locale via Intl API-er.
 */

const LOCALE = 'nb-NO'
const DASH = '\u2013' // tankestrek (–)

// Lazy-initialiserte Intl-formatters for ytelse
let currencyFmt: Intl.NumberFormat
let dateFmt: Intl.DateTimeFormat
let dateTimeFmt: Intl.DateTimeFormat
let relativeFmt: Intl.RelativeTimeFormat

/** Konverterer string | Date til Date, eller null ved ugyldig input */
function toDate(input: string | Date): Date | null {
  if (input == null) return null
  const d = input instanceof Date ? input : new Date(input)
  return isNaN(d.getTime()) ? null : d
}

/** Formaterer beløp i NOK: "kr 1 234,50" */
export function formatCurrency(amount: number): string {
  if (!isFinite(amount)) return DASH
  currencyFmt ??= new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'NOK' })
  return currencyFmt.format(amount)
}

/** Formaterer dato: "08.04.2026" */
export function formatDate(date: string | Date): string {
  const d = toDate(date)
  if (!d) return DASH
  dateFmt ??= new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' })
  return dateFmt.format(d)
}

/** Formaterer dato med klokkeslett: "08.04.2026, 14:30" */
export function formatDateTime(date: string | Date): string {
  const d = toDate(date)
  if (!d) return DASH
  dateTimeFmt ??= new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
  return dateTimeFmt.format(d)
}

// Cache for formatNumber med ulike desimalverdier
const numberFmtCache = new Map<number | undefined, Intl.NumberFormat>()

/** Formaterer tall med norsk tusenskilletegn og valgfritt antall desimaler */
export function formatNumber(num: number, decimals?: number): string {
  if (!isFinite(num)) return DASH
  let fmt = numberFmtCache.get(decimals)
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    numberFmtCache.set(decimals, fmt)
  }
  return fmt.format(num)
}

/** Formaterer filstørrelse: "1,5 KB", "2,3 MB" */
export function formatFileSize(bytes: number): string {
  if (!isFinite(bytes) || bytes < 0) return DASH
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${formatNumber(value, i === 0 ? 0 : 1)} ${units[i]}`
}

/** Relativ tid: "2 timer siden", "om 3 dager", "i morgen" */
export function relativeTime(date: string | Date): string {
  const d = toDate(date)
  if (!d) return DASH
  relativeFmt ??= new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

  const diffMs = d.getTime() - Date.now()
  const absSec = Math.abs(diffMs / 1000)

  const thresholds: [number, Intl.RelativeTimeFormatUnit, number][] = [
    [60, 'second', 1],
    [3600, 'minute', 60],
    [86400, 'hour', 3600],
    [2592000, 'day', 86400],
    [31536000, 'month', 2592000],
    [Infinity, 'year', 31536000]
  ]

  for (const [limit, unit, divisor] of thresholds) {
    if (absSec < limit) {
      return relativeFmt.format(Math.round(diffMs / 1000 / divisor), unit)
    }
  }

  return DASH
}
