/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act, cleanup, fireEvent } from '@testing-library/react'
import { useIssueReport } from './useIssueReport'
import type { CreateIssueResponse, UseIssueReportOptions } from './useIssueReport'
import type { ApiClient } from '../api/apiClient'

function makeApiClient(formDataRequest: ApiClient['formDataRequest']): Pick<ApiClient, 'formDataRequest'> {
  return { formDataRequest }
}

function TestForm({
  apiClient,
  options,
}: {
  apiClient: Pick<ApiClient, 'formDataRequest'>
  options?: UseIssueReportOptions
}) {
  const issueReport = useIssueReport(apiClient, options)

  return (
    <form onSubmit={issueReport.submit}>
      <input
        data-testid="title"
        value={issueReport.title}
        onChange={(e) => issueReport.setTitle(e.target.value)}
      />
      <input
        data-testid="description"
        value={issueReport.description}
        onChange={(e) => issueReport.setDescription(e.target.value)}
      />
      <input
        data-testid="senderName"
        value={issueReport.senderName}
        onChange={(e) => issueReport.setSenderName(e.target.value)}
      />
      <input
        data-testid="senderEmail"
        value={issueReport.senderEmail}
        onChange={(e) => issueReport.setSenderEmail(e.target.value)}
      />
      <input
        data-testid="consoleLogs"
        value={issueReport.consoleLogs}
        onChange={(e) => issueReport.setConsoleLogs(e.target.value)}
      />
      <input
        data-testid="images"
        type="file"
        multiple
        onChange={(e) => issueReport.handleImageChange(e.target.files)}
      />
      <button type="submit" data-testid="submit" disabled={issueReport.submitting}>
        Send
      </button>
      <button type="button" data-testid="reset" onClick={issueReport.reset}>
        Nullstill
      </button>
      <div data-testid="submitting">{String(issueReport.submitting)}</div>
      <div data-testid="error">{issueReport.error ?? ''}</div>
      <div data-testid="imageError">{issueReport.imageError ?? ''}</div>
      <div data-testid="result">{issueReport.result ? JSON.stringify(issueReport.result) : ''}</div>
      <div data-testid="imageCount">{issueReport.images.length}</div>
    </form>
  )
}

function makeFile(name: string): File {
  return new File(['data'], name, { type: 'image/png' })
}

describe('useIssueReport', () => {
  afterEach(() => {
    cleanup()
  })

  it('sender FormData med korrekt feltnavn-kontrakt til /issues (default path)', async () => {
    const formDataRequest = vi.fn().mockResolvedValue({
      issueNumber: 42,
      issueUrl: 'https://github.com/x/y/issues/42',
      imageUrls: [],
    } satisfies CreateIssueResponse)

    const { getByTestId } = render(<TestForm apiClient={makeApiClient(formDataRequest)} />)

    fireEvent.change(getByTestId('title'), { target: { value: 'Feil på siden' } })
    fireEvent.change(getByTestId('description'), { target: { value: 'Beskrivelse her' } })
    fireEvent.change(getByTestId('senderName'), { target: { value: 'Ola Nordmann' } })
    fireEvent.change(getByTestId('senderEmail'), { target: { value: 'ola@example.com' } })

    await act(async () => {
      fireEvent.click(getByTestId('submit'))
    })

    expect(formDataRequest).toHaveBeenCalledTimes(1)
    const [path, formData] = formDataRequest.mock.calls[0]
    expect(path).toBe('/issues')
    expect(formData).toBeInstanceOf(FormData)
    expect((formData as FormData).get('title')).toBe('Feil på siden')
    expect((formData as FormData).get('description')).toBe('Beskrivelse her')
    expect((formData as FormData).get('senderName')).toBe('Ola Nordmann')
    expect((formData as FormData).get('senderEmail')).toBe('ola@example.com')
    // consoleLogs utelates helt når feltet er tomt
    expect((formData as FormData).has('consoleLogs')).toBe(false)
  })

  it('trimmer felt før innsending', async () => {
    const formDataRequest = vi.fn().mockResolvedValue({ issueNumber: 1, issueUrl: 'x', imageUrls: [] })
    const { getByTestId } = render(<TestForm apiClient={makeApiClient(formDataRequest)} />)

    fireEvent.change(getByTestId('title'), { target: { value: '  Tittel  ' } })
    fireEvent.change(getByTestId('description'), { target: { value: '  Beskrivelse  ' } })
    fireEvent.change(getByTestId('senderName'), { target: { value: '  Navn  ' } })
    fireEvent.change(getByTestId('senderEmail'), { target: { value: '  epost@example.com  ' } })

    await act(async () => {
      fireEvent.click(getByTestId('submit'))
    })

    const formData = formDataRequest.mock.calls[0][1] as FormData
    expect(formData.get('title')).toBe('Tittel')
    expect(formData.get('description')).toBe('Beskrivelse')
    expect(formData.get('senderName')).toBe('Navn')
    expect(formData.get('senderEmail')).toBe('epost@example.com')
  })

  it('inkluderer consoleLogs kun når feltet har innhold', async () => {
    const formDataRequest = vi.fn().mockResolvedValue({ issueNumber: 1, issueUrl: 'x', imageUrls: [] })
    const { getByTestId } = render(<TestForm apiClient={makeApiClient(formDataRequest)} />)

    fireEvent.change(getByTestId('consoleLogs'), { target: { value: 'TypeError: x is not a function' } })

    await act(async () => {
      fireEvent.click(getByTestId('submit'))
    })

    const formData = formDataRequest.mock.calls[0][1] as FormData
    expect(formData.get('consoleLogs')).toBe('TypeError: x is not a function')
  })

  it('sender labels som kommaseparert streng når konfigurert', async () => {
    const formDataRequest = vi.fn().mockResolvedValue({ issueNumber: 1, issueUrl: 'x', imageUrls: [] })
    const { getByTestId } = render(
      <TestForm apiClient={makeApiClient(formDataRequest)} options={{ labels: ['brukerrapportert', 'bug'] }} />
    )

    await act(async () => {
      fireEvent.click(getByTestId('submit'))
    })

    const formData = formDataRequest.mock.calls[0][1] as FormData
    expect(formData.get('labels')).toBe('brukerrapportert,bug')
  })

  it('bruker konfigurerbar path', async () => {
    const formDataRequest = vi.fn().mockResolvedValue({ issueNumber: 1, issueUrl: 'x', imageUrls: [] })
    const { getByTestId } = render(
      <TestForm apiClient={makeApiClient(formDataRequest)} options={{ path: '/custom-issues' }} />
    )

    await act(async () => {
      fireEvent.click(getByTestId('submit'))
    })

    expect(formDataRequest.mock.calls[0][0]).toBe('/custom-issues')
  })

  it('godtar opptil maxImages bilder uten feil (default 3)', () => {
    const formDataRequest = vi.fn()
    const { getByTestId } = render(<TestForm apiClient={makeApiClient(formDataRequest)} />)

    const input = getByTestId('images') as HTMLInputElement
    const files = [makeFile('a.png'), makeFile('b.png'), makeFile('c.png')]
    Object.defineProperty(input, 'files', { value: files })

    act(() => {
      fireEvent.change(input)
    })

    expect(getByTestId('imageCount').textContent).toBe('3')
    expect(getByTestId('imageError').textContent).toBe('')
  })

  it('avviser flere enn maxImages bilder og setter imageError', () => {
    const formDataRequest = vi.fn()
    const { getByTestId } = render(<TestForm apiClient={makeApiClient(formDataRequest)} />)

    const input = getByTestId('images') as HTMLInputElement
    const files = [makeFile('a.png'), makeFile('b.png'), makeFile('c.png'), makeFile('d.png')]
    Object.defineProperty(input, 'files', { value: files })

    act(() => {
      fireEvent.change(input)
    })

    expect(getByTestId('imageError').textContent).toContain('maks 3 bilder')
    // Klippes til maxImages
    expect(getByTestId('imageCount').textContent).toBe('3')
  })

  it('respekterer konfigurerbar maxImages', () => {
    const formDataRequest = vi.fn()
    const { getByTestId } = render(
      <TestForm apiClient={makeApiClient(formDataRequest)} options={{ maxImages: 1 }} />
    )

    const input = getByTestId('images') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [makeFile('a.png'), makeFile('b.png')] })

    act(() => {
      fireEvent.change(input)
    })

    expect(getByTestId('imageError').textContent).toContain('maks 1 bilde')
    expect(getByTestId('imageCount').textContent).toBe('1')
  })

  it('inkluderer bilder i FormData under "images"-nøkkelen', async () => {
    const formDataRequest = vi.fn().mockResolvedValue({ issueNumber: 1, issueUrl: 'x', imageUrls: [] })
    const { getByTestId } = render(<TestForm apiClient={makeApiClient(formDataRequest)} />)

    const input = getByTestId('images') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [makeFile('a.png'), makeFile('b.png')] })

    act(() => {
      fireEvent.change(input)
    })

    await act(async () => {
      fireEvent.click(getByTestId('submit'))
    })

    const formData = formDataRequest.mock.calls[0][1] as FormData
    const images = formData.getAll('images')
    expect(images).toHaveLength(2)
  })

  it('setter submitting=true under innsending og false etterpå', async () => {
    let resolveRequest: (value: CreateIssueResponse) => void = () => {}
    const formDataRequest = vi.fn().mockImplementation(
      () => new Promise<CreateIssueResponse>((resolve) => { resolveRequest = resolve })
    )
    const { getByTestId } = render(<TestForm apiClient={makeApiClient(formDataRequest)} />)

    let submitPromise: Promise<void> | undefined
    act(() => {
      submitPromise = Promise.resolve(fireEvent.click(getByTestId('submit'))) as unknown as Promise<void>
    })

    expect(getByTestId('submitting').textContent).toBe('true')

    await act(async () => {
      resolveRequest({ issueNumber: 1, issueUrl: 'x', imageUrls: [] })
      await submitPromise
    })

    expect(getByTestId('submitting').textContent).toBe('false')
  })

  it('setter result ved vellykket innsending', async () => {
    const response: CreateIssueResponse = { issueNumber: 99, issueUrl: 'https://x/99', imageUrls: ['https://x/img.png'] }
    const formDataRequest = vi.fn().mockResolvedValue(response)
    const { getByTestId } = render(<TestForm apiClient={makeApiClient(formDataRequest)} />)

    await act(async () => {
      fireEvent.click(getByTestId('submit'))
    })

    expect(getByTestId('result').textContent).toBe(JSON.stringify(response))
    expect(getByTestId('error').textContent).toBe('')
  })

  it('setter error-melding ved feil og lar ikke submit kaste', async () => {
    const formDataRequest = vi.fn().mockRejectedValue(new Error('Nettverksfeil — sjekk tilkoblingen'))
    const { getByTestId } = render(<TestForm apiClient={makeApiClient(formDataRequest)} />)

    await act(async () => {
      fireEvent.click(getByTestId('submit'))
    })

    expect(getByTestId('error').textContent).toBe('Nettverksfeil — sjekk tilkoblingen')
    expect(getByTestId('result').textContent).toBe('')
  })

  it('bruker fallback-feilmelding hvis kastet verdi ikke er en Error', async () => {
    const formDataRequest = vi.fn().mockRejectedValue('streng-feil')
    const { getByTestId } = render(<TestForm apiClient={makeApiClient(formDataRequest)} />)

    await act(async () => {
      fireEvent.click(getByTestId('submit'))
    })

    expect(getByTestId('error').textContent).toBe('Noe gikk galt')
  })

  it('reset() nullstiller felt, bilder, feil og resultat', async () => {
    const formDataRequest = vi.fn().mockResolvedValue({ issueNumber: 1, issueUrl: 'x', imageUrls: [] })
    const { getByTestId } = render(<TestForm apiClient={makeApiClient(formDataRequest)} />)

    fireEvent.change(getByTestId('title'), { target: { value: 'Noe' } })
    const input = getByTestId('images') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [makeFile('a.png')] })
    act(() => {
      fireEvent.change(input)
    })

    await act(async () => {
      fireEvent.click(getByTestId('submit'))
    })
    expect(getByTestId('result').textContent).not.toBe('')

    act(() => {
      fireEvent.click(getByTestId('reset'))
    })

    expect((getByTestId('title') as HTMLInputElement).value).toBe('')
    expect(getByTestId('imageCount').textContent).toBe('0')
    expect(getByTestId('result').textContent).toBe('')
    expect(getByTestId('error').textContent).toBe('')
  })
})
