/**
 * useIssueReport — headless hook for «rapporter feil»-skjemaer mot grunnmur-backends
 * `POST /issues` (GitHubIssueRoutes.kt). Eier felt-state, FormData-bygging, feltnavn-
 * kontrakt og klient-side maks-bilder-validering. UI/styling er appens ansvar —
 * grunnmur er styling-agnostisk.
 *
 * @example
 * ```tsx
 * const issueReport = useIssueReport(apiClient)
 *
 * <form onSubmit={issueReport.submit}>
 *   <input value={issueReport.title} onChange={e => issueReport.setTitle(e.target.value)} />
 *   <input type="file" multiple onChange={e => issueReport.handleImageChange(e.target.files)} />
 *   <button disabled={issueReport.submitting}>Send</button>
 * </form>
 * ```
 */
import type { FormEvent } from 'react';
import type { ApiClient } from '../api/apiClient';
/** Respons fra grunnmur-backends `POST /issues` — matcher `GitHubIssueRoutes.kt`s `CreateIssueResponse` */
export interface CreateIssueResponse {
    issueNumber: number;
    issueUrl: string;
    imageUrls: string[];
}
/** Valgfri konfigurasjon for useIssueReport */
export interface UseIssueReportOptions {
    /** API-sti for issue-endepunktet (default: '/issues') */
    path?: string;
    /** Maks antall bilder klient-side — bør matche backendens `maxImagesPerRequest` (default: 3) */
    maxImages?: number;
    /** Ekstra GitHub-labels som sendes med issuen (f.eks. `['brukerrapportert']`) */
    labels?: string[];
}
/** Returverdi fra useIssueReport */
export interface UseIssueReportResult {
    title: string;
    description: string;
    senderName: string;
    senderEmail: string;
    consoleLogs: string;
    images: File[];
    /** Feilmelding hvis flere enn maxImages bilder ble valgt, ellers null */
    imageError: string | null;
    setTitle: (value: string) => void;
    setDescription: (value: string) => void;
    setSenderName: (value: string) => void;
    setSenderEmail: (value: string) => void;
    setConsoleLogs: (value: string) => void;
    /** Sett bilder fra en `<input type="file" multiple>`. Klipper til maxImages og setter imageError hvis overskredet. */
    handleImageChange: (files: FileList | File[] | null) => void;
    submitting: boolean;
    /** Feilmelding fra siste innsendingsforsøk, eller null */
    error: string | null;
    /** Respons fra siste vellykkede innsending, eller null */
    result: CreateIssueResponse | null;
    /**
     * Send rapporten. Kan brukes direkte som `onSubmit` — kaller `e.preventDefault()`
     * hvis et event gis. Kaster ikke ved feil; feilen leses fra `error` etterpå.
     */
    submit: (e?: FormEvent) => Promise<CreateIssueResponse | undefined>;
    /** Nullstill alle felt, bilder og resultat/feil-state */
    reset: () => void;
}
/**
 * @param apiClient - Kun `formDataRequest` brukes; en full `ApiClient` fra `createApiClient()` fungerer.
 * @param options - Valgfri sti, maks-bilder og GitHub-labels.
 */
export declare function useIssueReport(apiClient: Pick<ApiClient, 'formDataRequest'>, options?: UseIssueReportOptions): UseIssueReportResult;
