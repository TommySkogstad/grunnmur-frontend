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
import { useCallback, useState } from 'react';
const DEFAULT_PATH = '/issues';
const DEFAULT_MAX_IMAGES = 3;
/**
 * @param apiClient - Kun `formDataRequest` brukes; en full `ApiClient` fra `createApiClient()` fungerer.
 * @param options - Valgfri sti, maks-bilder og GitHub-labels.
 */
export function useIssueReport(apiClient, options) {
    const path = options?.path ?? DEFAULT_PATH;
    const maxImages = options?.maxImages ?? DEFAULT_MAX_IMAGES;
    const labels = options?.labels;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [senderName, setSenderName] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [consoleLogs, setConsoleLogs] = useState('');
    const [images, setImages] = useState([]);
    const [imageError, setImageError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const handleImageChange = useCallback((files) => {
        if (!files) {
            setImageError(null);
            setImages([]);
            return;
        }
        const selected = Array.from(files);
        if (selected.length > maxImages) {
            setImageError(`Du kan laste opp maks ${maxImages} bilde${maxImages === 1 ? '' : 'r'}`);
            setImages(selected.slice(0, maxImages));
            return;
        }
        setImageError(null);
        setImages(selected);
    }, [maxImages]);
    const reset = useCallback(() => {
        setTitle('');
        setDescription('');
        setSenderName('');
        setSenderEmail('');
        setConsoleLogs('');
        setImages([]);
        setImageError(null);
        setError(null);
        setResult(null);
    }, []);
    const submit = useCallback(async (e) => {
        e?.preventDefault();
        setError(null);
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('senderName', senderName.trim());
        formData.append('senderEmail', senderEmail.trim());
        if (consoleLogs.trim()) {
            formData.append('consoleLogs', consoleLogs.trim());
        }
        if (labels && labels.length > 0) {
            formData.append('labels', labels.join(','));
        }
        for (const image of images) {
            formData.append('images', image);
        }
        setSubmitting(true);
        try {
            const response = await apiClient.formDataRequest(path, formData);
            setResult(response);
            return response;
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Noe gikk galt');
            return undefined;
        }
        finally {
            setSubmitting(false);
        }
    }, [apiClient, path, labels, title, description, senderName, senderEmail, consoleLogs, images]);
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
    };
}
