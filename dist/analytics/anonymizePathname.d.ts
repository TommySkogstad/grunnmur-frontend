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
export declare function anonymizePathname(pathname: string): string;
