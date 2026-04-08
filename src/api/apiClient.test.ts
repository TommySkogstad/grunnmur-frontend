/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApiClient, ApiError } from './apiClient'
import type { ApiClient, ApiClientConfig } from './apiClient'

// Mock fetch globalt
const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  // Reset document.cookie
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: '',
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  mockFetch.mockReset()
})

/** Hjelpefunksjon: lag en mock Response */
function mockResponse(body: unknown, status = 200, statusText = 'OK'): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return new Response(text, { status, statusText })
}

function mockEmptyResponse(status = 204): Response {
  return new Response(null, { status, statusText: 'No Content' })
}

// ============================================================
// Test 1: Factory returnerer riktig objekt
// ============================================================
describe('createApiClient', () => {
  it('returnerer objekt med request, formDataRequest, getCsrfToken, setCsrfToken', () => {
    const client = createApiClient()

    expect(client).toBeDefined()
    expect(typeof client.request).toBe('function')
    expect(typeof client.formDataRequest).toBe('function')
    expect(typeof client.getCsrfToken).toBe('function')
    expect(typeof client.setCsrfToken).toBe('function')
    expect(typeof client.resetUnauthorizedFlag).toBe('function')
  })

  it('bruker default-konfigurasjon når ingen config gis', () => {
    const client = createApiClient()
    // Skal ikke kaste feil
    expect(client).toBeDefined()
  })
})

// ============================================================
// Test 2: Request legger til CSRF-header fra cookie
// ============================================================
describe('CSRF fra cookie', () => {
  it('leser csrf_token fra document.cookie og sender som header på POST', async () => {
    document.cookie = 'csrf_token=abc123'
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    await client.request('/test', { method: 'POST', body: { data: 1 } })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/test')
    expect(init.headers['X-CSRF-Token']).toBe('abc123')
  })

  it('håndterer URL-encoded cookie-verdier med decodeURIComponent', async () => {
    document.cookie = 'csrf_token=abc%2B123%3D'
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    await client.request('/test', { method: 'POST' })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-CSRF-Token']).toBe('abc+123=')
  })

  it('bruker konfigurerbart cookie-navn', async () => {
    document.cookie = 'my_csrf=xyz789'
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient({ csrfCookieName: 'my_csrf' })
    await client.request('/test', { method: 'PUT' })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-CSRF-Token']).toBe('xyz789')
  })

  it('bruker konfigurerbart header-navn', async () => {
    document.cookie = 'csrf_token=abc123'
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient({ csrfHeaderName: 'X-Custom-CSRF' })
    await client.request('/test', { method: 'POST' })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-Custom-CSRF']).toBe('abc123')
  })

  it('sender IKKE CSRF-header på GET-request', async () => {
    document.cookie = 'csrf_token=abc123'
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    await client.request('/test')

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-CSRF-Token']).toBeUndefined()
  })

  it('sender IKKE CSRF-header på HEAD-request', async () => {
    document.cookie = 'csrf_token=abc123'
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    await client.request('/test', { method: 'HEAD' })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-CSRF-Token']).toBeUndefined()
  })

  it('sender CSRF-header på DELETE-request', async () => {
    document.cookie = 'csrf_token=abc123'
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    await client.request('/test', { method: 'DELETE' })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-CSRF-Token']).toBe('abc123')
  })

  it('sender CSRF-header på PATCH-request', async () => {
    document.cookie = 'csrf_token=abc123'
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    await client.request('/test', { method: 'PATCH' })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-CSRF-Token']).toBe('abc123')
  })
})

// ============================================================
// Test 3: 401-håndtering med onUnauthorized callback
// ============================================================
describe('onUnauthorized', () => {
  it('kaller onUnauthorized ved 401-respons', async () => {
    const onUnauthorized = vi.fn()
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: 'Unauthorized' }, 401, 'Unauthorized')
    )

    const client = createApiClient({ onUnauthorized })

    await expect(client.request('/protected')).rejects.toThrow(ApiError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)

    const apiError = onUnauthorized.mock.calls[0][0]
    expect(apiError).toBeInstanceOf(ApiError)
    expect(apiError.status).toBe(401)
  })

  it('dedupliserer samtidige 401-kall', async () => {
    const onUnauthorized = vi.fn()
    mockFetch.mockResolvedValue(
      mockResponse({ error: 'Unauthorized' }, 401, 'Unauthorized')
    )

    const client = createApiClient({ onUnauthorized })

    // Tre parallelle requests som alle gir 401
    const results = await Promise.allSettled([
      client.request('/a'),
      client.request('/b'),
      client.request('/c'),
    ])

    // Alle skal rejecte
    expect(results.every((r) => r.status === 'rejected')).toBe(true)
    // Men onUnauthorized kalles kun én gang
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('resetUnauthorizedFlag tillater nye kall etter reset', async () => {
    const onUnauthorized = vi.fn()
    mockFetch.mockResolvedValue(
      mockResponse({ error: 'Unauthorized' }, 401, 'Unauthorized')
    )

    const client = createApiClient({ onUnauthorized })

    await expect(client.request('/a')).rejects.toThrow()
    expect(onUnauthorized).toHaveBeenCalledTimes(1)

    client.resetUnauthorizedFlag()

    await expect(client.request('/b')).rejects.toThrow()
    expect(onUnauthorized).toHaveBeenCalledTimes(2)
  })

  it('kaller IKKE onUnauthorized ved andre feilkoder', async () => {
    const onUnauthorized = vi.fn()
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: 'Forbidden' }, 403, 'Forbidden')
    )

    const client = createApiClient({ onUnauthorized })

    await expect(client.request('/test')).rejects.toThrow(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})

// ============================================================
// Test 4: Memory-mode CSRF
// ============================================================
describe('CSRF memory-mode', () => {
  it('bruker setCsrfToken/getCsrfToken for memory-mode', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient({ csrfSource: 'memory' })
    client.setCsrfToken('mem-token-123')

    expect(client.getCsrfToken()).toBe('mem-token-123')

    await client.request('/test', { method: 'POST' })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-CSRF-Token']).toBe('mem-token-123')
  })

  it('returnerer null fra getCsrfToken når ingen token er satt i memory-mode', () => {
    const client = createApiClient({ csrfSource: 'memory' })
    expect(client.getCsrfToken()).toBeNull()
  })

  it('ignorerer cookie i memory-mode', async () => {
    document.cookie = 'csrf_token=cookie-value'
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient({ csrfSource: 'memory' })
    client.setCsrfToken('memory-value')

    await client.request('/test', { method: 'POST' })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-CSRF-Token']).toBe('memory-value')
  })
})

// ============================================================
// Test 5: Request-funksjonalitet
// ============================================================
describe('request', () => {
  it('bruker konfigurerbar basePath', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: 1 }))

    const client = createApiClient({ basePath: '/v2' })
    await client.request('/users')

    expect(mockFetch.mock.calls[0][0]).toBe('/v2/users')
  })

  it('setter Content-Type application/json for requests med body', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    await client.request('/test', { method: 'POST', body: { name: 'test' } })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ name: 'test' }))
  })

  it('setter credentials: include på alle requests', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    await client.request('/test')

    const [, init] = mockFetch.mock.calls[0]
    expect(init.credentials).toBe('include')
  })

  it('parser JSON-respons korrekt', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ users: [1, 2, 3] }))

    const client = createApiClient()
    const result = await client.request<{ users: number[] }>('/users')

    expect(result).toEqual({ users: [1, 2, 3] })
  })

  it('håndterer tom respons (204)', async () => {
    mockFetch.mockResolvedValueOnce(mockEmptyResponse())

    const client = createApiClient()
    const result = await client.request('/delete', { method: 'DELETE' })

    expect(result).toBeNull()
  })

  it('håndterer tom respons-body med 200-status', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }))

    const client = createApiClient()
    const result = await client.request('/test')

    expect(result).toBeNull()
  })

  it('default metode er GET', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    await client.request('/test')

    const [, init] = mockFetch.mock.calls[0]
    expect(init.method).toBe('GET')
  })

  it('sender egendefinerte headers', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    await client.request('/test', {
      headers: { 'X-Custom': 'value' },
    })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-Custom']).toBe('value')
  })
})

// ============================================================
// Test 6: ApiError
// ============================================================
describe('ApiError', () => {
  it('inneholder status, statusText og body', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: 'Not found', code: 'USER_NOT_FOUND' }, 404, 'Not Found')
    )

    const client = createApiClient()

    try {
      await client.request('/user/999')
      expect.fail('Skulle ha kastet ApiError')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      const err = e as ApiError
      expect(err.status).toBe(404)
      expect(err.statusText).toBe('Not Found')
      expect(err.body).toEqual({ message: 'Not found', code: 'USER_NOT_FOUND' })
      expect(err.message).toBe('Not found')
    }
  })

  it('bruker statusText som message hvis body ikke har message-felt', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ code: 'UNKNOWN' }, 500, 'Internal Server Error')
    )

    const client = createApiClient()

    try {
      await client.request('/error')
      expect.fail('Skulle ha kastet ApiError')
    } catch (e) {
      const err = e as ApiError
      expect(err.message).toBe('Internal Server Error')
    }
  })

  it('har is()-metode for statussjekk', () => {
    const err = new ApiError('test', 429, 'Too Many Requests')
    expect(err.is(429)).toBe(true)
    expect(err.is(500)).toBe(false)
  })
})

// ============================================================
// Test 7: formDataRequest
// ============================================================
describe('formDataRequest', () => {
  it('sender FormData uten Content-Type header', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ uploaded: true }))

    const client = createApiClient()
    const formData = new FormData()
    formData.append('file', new Blob(['data']), 'test.txt')

    await client.formDataRequest('/upload', formData)

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/upload')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(formData)
    // Content-Type skal IKKE settes manuelt for FormData
    expect(init.headers['Content-Type']).toBeUndefined()
  })

  it('støtter konfigurerbar HTTP-metode', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    const formData = new FormData()

    await client.formDataRequest('/update', formData, 'PUT')

    const [, init] = mockFetch.mock.calls[0]
    expect(init.method).toBe('PUT')
  })

  it('legger til CSRF-header på formData-requests', async () => {
    document.cookie = 'csrf_token=form-csrf-token'
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    const formData = new FormData()

    await client.formDataRequest('/upload', formData)

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-CSRF-Token']).toBe('form-csrf-token')
  })

  it('setter credentials: include', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }))

    const client = createApiClient()
    await client.formDataRequest('/upload', new FormData())

    const [, init] = mockFetch.mock.calls[0]
    expect(init.credentials).toBe('include')
  })
})
