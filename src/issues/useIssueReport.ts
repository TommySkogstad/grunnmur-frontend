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

import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import type { ApiClient } from '../api/apiClient'

/** Respons fra grunnmur-backends `POST /issues` — matcher `GitHubIssueRoutes.kt`s `CreateIssueResponse` */
export interface CreateIssueResponse {
  issueNumber: number
  issueUrl: string
  imageUrls: string[]
}

/** Valgfri konfigurasjon for useIssueReport */
export interface UseIssueReportOptions {
  /** API-sti for issue-endepunktet (default: '/issues') */
  path?: string
  /** Maks antall bilder klient-side — bør matche backendens `maxImagesPerRequest` (default: 3) */
  maxImages?: number
  /** Ekstra GitHub-labels som sendes med issuen (f.eks. `['brukerrapportert']`) */
  labels?: string[]
}

/** Returverdi fra useIssueReport */
export interface UseIssueReportResult {
  title: string
  description: string
  senderName: string
  senderEmail: string
  consoleLogs: string
  images: File[]
  /** Feilmelding hvis flere enn maxImages bilder ble valgt, ellers null */
  imageError: string | null
  setTitle: (value: string) => void
  setDescription: (value: string) => void
  setSenderName: (value: string) => void
  setSenderEmail: (value: string) => void
  setConsoleLogs: (value: string) => void
  /** Sett bilder fra en `<input type="file" multiple>`. Klipper til maxImages og setter imageError hvis overskredet. */
  handleImageChange: (files: FileList | File[] | null) => void
  submitting: boolean
  /** Feilmelding fra siste innsendingsforsøk, eller null */
  error: string | null
  /** Respons fra siste vellykkede innsending, eller null */
  result: CreateIssueResponse | null
  /**
   * Send rapporten. Kan brukes direkte som `onSubmit` — kaller `e.preventDefault()`
   * hvis et event gis. Kaster ikke ved feil; feilen leses fra `error` etterpå.
   */
  submit: (e?: FormEvent) => Promise<CreateIssueResponse | undefined>
  /** Nullstill alle felt, bilder og resultat/feil-state */
  reset: () => void
}

const DEFAULT_PATH = '/issues'
const DEFAULT_MAX_IMAGES = 3

/**
 * @param apiClient - Kun `formDataRequest` brukes; en full `ApiClient` fra `createApiClient()` fungerer.
 * @param options - Valgfri sti, maks-bilder og GitHub-labels.
 */
export function useIssueReport(
  apiClient: Pick<ApiClient, 'formDataRequest'>,
  options?: UseIssueReportOptions
): UseIssueReportResult {
  const path = options?.path ?? DEFAULT_PATH
  const maxImages = options?.maxImages ?? DEFAULT_MAX_IMAGES
  const labels = options?.labels

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [consoleLogs, setConsoleLogs] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateIssueResponse | null>(null)

  const handleImageChange = useCallback((files: FileList | File[] | null) => {
    if (!files) {
      setImageError(null)
      setImages([])
      return
    }
    const selected = Array.from(files)
    if (selected.length > maxImages) {
      setImageError(`Du kan laste opp maks ${maxImages} bilde${maxImages === 1 ? '' : 'r'}`)
      setImages(selected.slice(0, maxImages))
      return
    }
    setImageError(null)
    setImages(selected)
  }, [maxImages])

  const reset = useCallback(() => {
    setTitle('')
    setDescription('')
    setSenderName('')
    setSenderEmail('')
    setConsoleLogs('')
    setImages([])
    setImageError(null)
    setError(null)
    setResult(null)
  }, [])

  const submit = useCallback(async (e?: FormEvent): Promise<CreateIssueResponse | undefined> => {
    e?.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('description', description.trim())
    formData.append('senderName', senderName.trim())
    formData.append('senderEmail', senderEmail.trim())
    if (consoleLogs.trim()) {
      formData.append('consoleLogs', consoleLogs.trim())
    }
    if (labels && labels.length > 0) {
      formData.append('labels', labels.join(','))
    }
    for (const image of images) {
      formData.append('images', image)
    }

    setSubmitting(true)
    try {
      const response = await apiClient.formDataRequest<CreateIssueResponse>(path, formData)
      setResult(response)
      return response
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt')
      return undefined
    } finally {
      setSubmitting(false)
    }
  }, [apiClient, path, labels, title, description, senderName, senderEmail, consoleLogs, images])

  return {
    title,
    description,
    senderName,
    senderEmail,
    consoleLogs,
    images,
    imageError,
    setTitle,
    setDescription,
    setSenderName,
    setSenderEmail,
    setConsoleLogs,
    handleImageChange,
    submitting,
    error,
    result,
    submit,
    reset,
  }
}
