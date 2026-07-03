/**
 * Anonymiserer dynamiske segmenter i en URL-sti før den sendes til Umami som
 * pageview-URL — unngår at f.eks. bruker-ID-er eller kontrakt-tokens havner
 * i analytics-dashbordet.
 *
 * Superset av variantene som tidligere ble duplisert og divergert på tvers
 * av 3 apper: tall/UUID → `:id`, lange hex-strenger (32/64 tegn, typisk
 * kontrakt-/delingslenke-tokens) → `:token`. Trenger appen en snevrere
 * transform (f.eks. kun tall), send en egen funksjon til
 * `usePageView({ transformUrl })` i stedet.
 */

const NUMERIC_SEGMENT = /^\d+$/
const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Lange hex-strenger — matcher f.eks. ContractService (32 tegn) og ShareLinkService (64 tegn) tokens
const HEX_TOKEN_SEGMENT = /^[0-9a-f]{24,}$/i

export function anonymizePathname(pathname: string): string {
  if (pathname === '/' || pathname === '') return pathname
  const segments = pathname.split('/')
  return segments
    .map((segment) => {
      if (NUMERIC_SEGMENT.test(segment) || UUID_SEGMENT.test(segment)) return ':id'
      if (HEX_TOKEN_SEGMENT.test(segment)) return ':token'
      return segment
    })
    .join('/')
}
