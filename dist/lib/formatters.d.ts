/**
 * Norske formatters for dato, valuta, tall, filstørrelse og relativ tid.
 * Bruker nb-NO locale via Intl API-er.
 *
 * FORUTSETNING: Dette modulet er designet for et single-locale browser-miljø
 * (nb-NO). Formatter-instansene caches modul-globalt for ytelse og deles
 * på tvers av alle kall i samme modulinstans. Ikke egnet for SSR med
 * per-request locale uten refaktor til factory-funksjoner.
 *
 * Testing: Hvis du trenger fersk formatter-state (f.eks. ved vi.stubGlobal('Intl'...)),
 * bruk vi.resetModules() + dynamisk import for å isolere modulen per test.
 */
/** Maks antall entries i numberFmtCache — FIFO-purge ved overskridelse */
export declare const NUMBER_FMT_CACHE_MAX = 10;
/** Formaterer beløp i NOK: "kr 1 234,50" */
export declare function formatCurrency(amount: number): string;
/** Formaterer dato: "08.04.2026" */
export declare function formatDate(date: string | Date): string;
/** Formaterer dato med klokkeslett: "08.04.2026, 14:30" */
export declare function formatDateTime(date: string | Date): string;
/** Eksponerer cache-størrelse for testing — ikke bruk i produksjonskode */
export declare function _numberFmtCacheSize(): number;
/** Formaterer tall med norsk tusenskilletegn og valgfritt antall desimaler */
export declare function formatNumber(num: number, decimals?: number): string;
/** Formaterer filstørrelse: "1,5 KB", "2,3 MB" */
export declare function formatFileSize(bytes: number): string;
/** Relativ tid: "2 timer siden", "om 3 dager", "i morgen" */
export declare function relativeTime(date: string | Date): string;
