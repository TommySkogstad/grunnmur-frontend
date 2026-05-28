import { QueryClient } from '@tanstack/react-query';
import type { DefaultOptions } from '@tanstack/react-query';
/**
 * Oppretter en QueryClient med fornuftige defaults for grunnmur-apper.
 *
 * Defaults:
 * - `staleTime`: 300 000 ms (5 min) — reduserer unødvendige refetches
 * - `retry`: 1 — én retry, unngår aggressive retry-loops
 * - `gcTime`: 300 000 ms (5 min) — standard cache-levetid
 *
 * @param overrides - Valgfri konfigurasjon som merges med defaults
 */
export declare function createQueryClient(overrides?: DefaultOptions): QueryClient;
