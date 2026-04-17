# @tommyskogstad/frontend-core

Felles frontend-bibliotek for Kotlin/Ktor-appene i portefoljen. Tilsvarer `grunnmur` (Kotlin-bibliotek) for backend, men for React/TypeScript frontend.

## Installasjon

Pakken publiseres til GitHub Packages (privat, `@tommyskogstad` scope).

### 1. Autentisering mot GitHub Packages

Opprett eller rediger `~/.npmrc`:

```
@tommyskogstad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_DIN_TOKEN
```

Tokenet trenger `read:packages` scope. Generer det under [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens).

### 2. Installer pakken

```bash
npm install @tommyskogstad/frontend-core
```

### Peer dependencies

Pakken krever disse som peer dependencies:

| Pakke | Versjon | Obligatorisk |
|-------|---------|-------------|
| `react` | ^18.0 \|\| ^19.0 | Ja |
| `react-dom` | ^18.0 \|\| ^19.0 | Ja |
| `react-router-dom` | ^6.0 \|\| ^7.0 | Ja |
| `@tanstack/react-query` | ^5.0 | Valgfritt |

## Quick start

```tsx
import {
  createApiClient,
  createAuthProvider,
  ErrorBoundary,
  formatCurrency,
} from '@tommyskogstad/frontend-core'

// 1. Opprett API-klient
const api = createApiClient({
  onUnauthorized: () => window.location.href = '/logg-inn',
})

// 2. Opprett auth-provider
interface User { id: number; email: string; role: string }

const { AuthProvider, useAuth, ProtectedRoute } = createAuthProvider<User>({
  apiClient: api,
  loginPath: '/logg-inn',
})

// 3. Bruk i app
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/logg-inn" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  )
}
```

## API-referanse

### `createApiClient(config?)`

Konfigurerbar fetch-wrapper med CSRF-tokenhandtering, JSON-serialisering, 401-deduplisering og FormData-stotte.

```ts
import { createApiClient } from '@tommyskogstad/frontend-core'
import type { ApiClientConfig, ApiClient, RequestOptions } from '@tommyskogstad/frontend-core'

const api = createApiClient({
  basePath: '/api',              // URL-prefiks (default: '/api')
  csrfSource: 'cookie',         // 'cookie' | 'memory' (default: 'cookie')
  csrfCookieName: 'csrf_token', // Navn pa CSRF-cookie (default: 'csrf_token')
  csrfHeaderName: 'X-CSRF-Token', // Navn pa CSRF-header (default: 'X-CSRF-Token')
  onUnauthorized: (error) => {  // Kalles ved 401 (med deduplisering)
    window.location.href = '/logg-inn'
  },
})
```

**Returnerer `ApiClient`:**

| Metode | Beskrivelse |
|--------|-------------|
| `request<T>(path, options?)` | JSON-request med automatisk CSRF |
| `formDataRequest<T>(path, formData, method?)` | FormData-request for filopplasting |
| `getCsrfToken()` | Hent gjeldende CSRF-token |
| `setCsrfToken(token)` | Sett CSRF-token manuelt (memory-mode) |
| `resetUnauthorizedFlag()` | Resett 401-deduplisering etter re-autentisering |

**Brukseksempler:**

```ts
// GET-request
const users = await api.request<User[]>('/users')

// POST med body
await api.request('/users', {
  method: 'POST',
  body: { name: 'Ola', email: 'ola@example.com' },
})

// Filopplasting
const formData = new FormData()
formData.append('file', file)
await api.formDataRequest('/upload', formData)
```

**`ApiError`** — strukturert feilklasse:

```ts
import { ApiError } from '@tommyskogstad/frontend-core'

try {
  await api.request('/protected')
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.status)     // 403
    console.log(error.statusText) // "Forbidden"
    console.log(error.body)       // { message: "Ingen tilgang" }
    console.log(error.is(403))    // true
  }
}
```

---

### `createAuthProvider<TUser>(config)`

Factory-funksjon som oppretter en typet AuthProvider, useAuth-hook og ProtectedRoute bundet til en felles auth-kontekst.

```ts
import { createAuthProvider } from '@tommyskogstad/frontend-core'
import type { AuthProviderConfig, AuthContextValue } from '@tommyskogstad/frontend-core'

interface MyUser { id: number; email: string; role: string }

const { AuthProvider, useAuth, ProtectedRoute } = createAuthProvider<MyUser>({
  apiClient: api,                         // API-klient fra createApiClient()
  loginPath: '/logg-inn',                 // Sti til innloggingsside (default: '/login')
  onLogout: () => queryClient.clear(),    // Callback ved utlogging
  parseUser: (data) => data as MyUser,    // Custom parsing av /me-respons
  // Unngå 401-logging i konsollen (krever at backend returnerer 2xx på /auth/session):
  useSessionEndpoint: true,               // Bruk session-endepunkt i stedet for /me
  // Valgfrie endepunkt-overrides:
  requestCodeEndpoint: '/auth/request-code',  // default
  verifyCodeEndpoint: '/auth/verify-code',    // default
  meEndpoint: '/auth/me',                     // default
  logoutEndpoint: '/auth/logout',             // default
  sessionEndpoint: '/auth/session',           // default
})
```

**Session-endepunkt** — når `useSessionEndpoint: true`, kaller `AuthProvider`
`sessionEndpoint` i stedet for `meEndpoint` ved initial sesjonssjekk.
Backend må da returnere 2xx med `{ authenticated: boolean, user?: TUser }`
slik at nettleseren ikke logger 401-nettverksfeil i konsollen for anonyme
brukere (Lighthouse `errors-in-console`). `getMe` beholdes uendret for
bakoverkompatibilitet.

```ts
// Autentisert respons
{ "authenticated": true, "user": { "id": 1, "email": "ola@example.com" } }

// Anonym respons (fortsatt HTTP 200)
{ "authenticated": false }
```

**`AuthProvider`** — wrapper-komponent som handterer sesjon:

```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

**`useAuth()`** — hook som returnerer `AuthContextValue<TUser>`:

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `user` | `TUser \| null` | Innlogget bruker |
| `isAuthenticated` | `boolean` | Om bruker er innlogget |
| `isLoading` | `boolean` | Om initial sessjonssjekk pagar |
| `login(email, code)` | `Promise<LoginResponse>` | Logg inn med e-post og engangskode |
| `logout()` | `Promise<void>` | Logg ut |
| `refreshUser()` | `Promise<void>` | Hent brukerinfo pa nytt |

```tsx
function Dashboard() {
  const { user, logout } = useAuth()
  return (
    <div>
      <p>Velkommen, {user?.email}</p>
      <button onClick={logout}>Logg ut</button>
    </div>
  )
}
```

---

### `createAuthApi(apiClient, config?)`

Lavniva auth-API for apper som trenger direkte kontroll over auth-flyten uten AuthProvider.

```ts
import { createAuthApi } from '@tommyskogstad/frontend-core'
import type { AuthApi, AuthApiConfig, LoginResponse } from '@tommyskogstad/frontend-core'

const authApi = createAuthApi(api, {
  requestCodeEndpoint: '/auth/request-code',
  verifyCodeEndpoint: '/auth/verify-code',
  meEndpoint: '/auth/me',
  logoutEndpoint: '/auth/logout',
})

await authApi.requestCode('ola@example.com')
const result = await authApi.verifyCode('ola@example.com', '123456')
const user = await authApi.getMe<MyUser>()
await authApi.logout()
```

---

### `ErrorBoundary`

Styling-agnostisk error boundary som fanger ubehandlede feil i React-komponenttreet.

```tsx
import { ErrorBoundary } from '@tommyskogstad/frontend-core'
import type { ErrorBoundaryProps } from '@tommyskogstad/frontend-core'

// Standard fallback (viser "Noe gikk galt")
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Custom render-funksjon med reset
<ErrorBoundary
  fallback={(error, reset) => (
    <div className="error-page">
      <p>Feil: {error.message}</p>
      <button onClick={reset}>Prov igjen</button>
    </div>
  )}
  onError={(error, info) => loggTilServer(error)}
  className="error-wrapper"
>
  <App />
</ErrorBoundary>
```

| Prop | Type | Beskrivelse |
|------|------|-------------|
| `children` | `ReactNode` | Barn som beskyttes |
| `fallback` | `ReactNode \| (error, reset) => ReactNode` | Fallback-UI |
| `onError` | `(error, errorInfo) => void` | Logging-callback |
| `className` | `string` | CSS-klasse pa wrapper ved feil |

---

### `createProtectedRoute<TUser>(useAuth)`

Factory-funksjon for rutebeskyttelse. Returneres automatisk fra `createAuthProvider()`, men kan ogsa brukes separat.

```tsx
import { createProtectedRoute } from '@tommyskogstad/frontend-core'
import type { ProtectedRouteProps } from '@tommyskogstad/frontend-core'

const ProtectedRoute = createProtectedRoute(useAuth)

// Som layout-route
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>

// Med rollesjekk
<Route element={<ProtectedRoute roleCheck={(u) => u.role === 'admin'} />}>
  <Route path="/admin" element={<Admin />} />
</Route>

// Med custom loading-komponent
<Route element={<ProtectedRoute loadingComponent={<Spinner />} />}>
  <Route path="/profil" element={<Profil />} />
</Route>
```

| Prop | Type | Default | Beskrivelse |
|------|------|---------|-------------|
| `loginPath` | `string` | `'/logg-inn'` | Redirect ved uautentisert |
| `roleCheck` | `(user: TUser) => boolean` | — | Valgfri rollesjekk |
| `unauthorizedPath` | `string` | `loginPath` | Redirect ved feilet rollesjekk |
| `loadingComponent` | `ReactNode` | `null` | Vises under sessjonssjekk |

---

### `createQueryClient(overrides?)`

Oppretter en `@tanstack/react-query` QueryClient med fornuftige defaults.

```ts
import { createQueryClient } from '@tommyskogstad/frontend-core'

const queryClient = createQueryClient()
// Defaults: staleTime: 5min, retry: 1, gcTime: 5min

// Med overrides
const queryClient = createQueryClient({
  queries: { staleTime: 60_000 },
  mutations: { retry: 0 },
})
```

Krever `@tanstack/react-query` ^5.0 som peer dependency (valgfritt).

---

### Formatters

Norske formatters som bruker `nb-NO` locale via Intl API-er.

```ts
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatFileSize,
  relativeTime,
} from '@tommyskogstad/frontend-core'
```

| Funksjon | Eksempel input | Eksempel output |
|----------|---------------|-----------------|
| `formatCurrency(amount)` | `1234.5` | `kr 1 234,50` |
| `formatDate(date)` | `'2026-04-08'` | `08.04.2026` |
| `formatDateTime(date)` | `'2026-04-08T14:30:00'` | `08.04.2026, 14:30` |
| `formatNumber(num, decimals?)` | `1234567, 2` | `1 234 567,00` |
| `formatFileSize(bytes)` | `1536` | `1,5 KB` |
| `relativeTime(date)` | `new Date(Date.now() - 7200000)` | `2 timer siden` |

Alle funksjoner returnerer tankestrek (`–`) for ugyldig input.

---

### Delt konfigurasjon

Pakken eksporterer ogsa ESLint-config og base tsconfig for konsistent oppsett pa tvers av apper.

#### ESLint-config

```js
// eslint.config.js i din app
import grunnmurConfig from '@tommyskogstad/frontend-core/eslint-config'

export default [
  ...grunnmurConfig,
  // App-spesifikke overrides her
]
```

#### Base tsconfig

```json
// tsconfig.json i din app
{
  "extends": "@tommyskogstad/frontend-core/tsconfig",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

## Konfigurasjon per app

### summa-summarum (enklest oppsett)

```ts
const api = createApiClient({
  onUnauthorized: () => navigate('/logg-inn'),
})

const { AuthProvider, useAuth, ProtectedRoute } = createAuthProvider<User>({
  apiClient: api,
  loginPath: '/logg-inn',
})
```

### 6810 (in-memory CSRF)

```ts
const api = createApiClient({
  csrfSource: 'memory',
  onUnauthorized: () => navigate('/logg-inn'),
})

// Etter login: sett CSRF-token fra respons
const result = await authApi.verifyCode(email, code)
if (result.csrfToken) {
  api.setCsrfToken(result.csrfToken)
}
```

### biologportal (React Query + TOTP)

```ts
const queryClient = createQueryClient()

const api = createApiClient({
  onUnauthorized: () => {
    queryClient.clear()
    navigate('/logg-inn')
  },
})

const { AuthProvider, useAuth, ProtectedRoute } = createAuthProvider<Observer>({
  apiClient: api,
  loginPath: '/logg-inn',
  onLogout: () => queryClient.clear(),
})
```

### styreportal (multi-tenant med rollesjekk)

```tsx
const { AuthProvider, useAuth, ProtectedRoute } = createAuthProvider<TenantUser>({
  apiClient: api,
  loginPath: '/logg-inn',
  parseUser: (data) => parseTenantUser(data),
})

// Admin-ruter
<Route element={<ProtectedRoute roleCheck={(u) => u.role === 'admin'} />}>
  <Route path="/admin/*" element={<AdminPanel />} />
</Route>
```

### lo-finans (objekt-stil API)

```ts
// lo-finans bruker api.get/api.post-stil — wrapp apiClient:
const apiClient = createApiClient({ ... })

const api = {
  get: <T>(path: string) => apiClient.request<T>(path),
  post: <T>(path: string, body: unknown) => apiClient.request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: unknown) => apiClient.request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => apiClient.request<T>(path, { method: 'DELETE' }),
}
```

## Migreringsguide

### Fra app-spesifikk apiClient

**For:**
```ts
// Hver app hadde sin egen apiClient.ts (~185 linjer)
const response = await fetch('/api/users', {
  headers: { 'X-CSRF-Token': getCsrfToken() },
  credentials: 'include',
})
```

**Etter:**
```ts
import { createApiClient } from '@tommyskogstad/frontend-core'

const api = createApiClient()
const users = await api.request<User[]>('/users')
```

### Fra app-spesifikk AuthContext

**For:**
```tsx
// Hver app hadde sin egen AuthContext.tsx (~83-135 linjer)
const AuthContext = createContext(...)
export function AuthProvider({ children }) { ... }
export function useAuth() { ... }
```

**Etter:**
```tsx
import { createAuthProvider } from '@tommyskogstad/frontend-core'

const { AuthProvider, useAuth, ProtectedRoute } = createAuthProvider<MyUser>({
  apiClient: api,
  loginPath: '/logg-inn',
})
```

### Fra app-spesifikk ErrorBoundary

**For:**
```tsx
// Hardkodede Tailwind-klasser
<div className="flex flex-col items-center p-8">
  <h1>Noe gikk galt</h1>
</div>
```

**Etter:**
```tsx
import { ErrorBoundary } from '@tommyskogstad/frontend-core'

<ErrorBoundary
  fallback={(error, reset) => (
    <div className="flex flex-col items-center p-8">
      <h1>Noe gikk galt</h1>
      <button onClick={reset}>Prov igjen</button>
    </div>
  )}
>
  <App />
</ErrorBoundary>
```

## Utvikling

```bash
npm install       # Installer avhengigheter
npm run build     # Bygg til dist/
npm test          # Kjor tester
npm run lint      # ESLint
```

## Lisens

Privat — kun for intern bruk i portefoljen.
