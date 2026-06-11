import { vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'

export function createMockApiClient(): ApiClient {
  return {
    request: vi.fn(),
    formDataRequest: vi.fn(),
    blobRequest: vi.fn(),
    getCsrfToken: vi.fn(() => null),
    setCsrfToken: vi.fn(),
    resetUnauthorizedFlag: vi.fn(),
  }
}
