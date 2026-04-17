# Changelog

Alle vesentlige endringer i dette prosjektet dokumenteres her.
Formatet er basert pa [Keep a Changelog](https://keepachangelog.com/nb-NO/1.1.0/),
og prosjektet folger [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Lagt til
- `authApi.getSession<TUser>()` — sesjonssjekk mot `/auth/session` (konfigurerbar via `sessionEndpoint`) som returnerer `{ authenticated, user? }`. Lar backend svare 2xx for anonyme brukere slik at nettleseren ikke logger 401 i konsollen (Lighthouse `errors-in-console`).
- `AuthProviderConfig.useSessionEndpoint` — flagg som faar `AuthProvider` til aa bruke `getSession` i stedet for `getMe` ved initial sesjonssjekk. `getMe` beholdes uendret for bakoverkompatibilitet.

## [1.0.0] - 2026-04-08

Forste stabile release av `@tommyskogstad/frontend-core`.

### Lagt til

#### API-klient (`createApiClient`)
- Konfigurerbar fetch-wrapper med automatisk CSRF-tokenhandtering
- Stotte for bade cookie-basert og in-memory CSRF
- JSON-serialisering og -deserialisering
- 401-deduplisering med `onUnauthorized` callback
- FormData-stotte for filopplasting
- Strukturert `ApiError`-klasse med statuskode og parsed body

#### Autentisering (`createAuthProvider`, `createAuthApi`)
- Generisk `AuthProvider<TUser>` med typet `useAuth()`-hook
- Factory-pattern for app-spesifikk konfigurasjon
- Auth-API med `requestCode`, `verifyCode`, `getMe`, `logout`
- Automatisk sessjonssjekk ved mount
- Innebygd `ProtectedRoute` fra `createAuthProvider()`
- Konfigurerbare endepunkter for alle auth-operasjoner

#### Komponenter
- **ErrorBoundary** — styling-agnostisk error boundary med render-funksjon og reset-callback
- **ProtectedRoute** — konfigurerbar rutebeskyttelse med rollesjekk, custom loading og redirect

#### React Query (`createQueryClient`)
- Factory for `QueryClient` med fornuftige defaults (staleTime: 5 min, retry: 1, gcTime: 5 min)
- Valgfri peer dependency pa `@tanstack/react-query` ^5.0

#### Formatters
- `formatCurrency` — NOK-formatering med norsk tusenskilletegn
- `formatDate` — datoformatering (dd.mm.yyyy)
- `formatDateTime` — dato med klokkeslett
- `formatNumber` — tallformatering med valgfrie desimaler
- `formatFileSize` — filstorrelse (B, KB, MB, GB, TB)
- `relativeTime` — relativ tid pa norsk ("2 timer siden", "om 3 dager")

#### Delt konfigurasjon
- Eksporterbar ESLint-config (`@tommyskogstad/frontend-core/eslint-config`)
- Base tsconfig (`@tommyskogstad/frontend-core/tsconfig`)

### Teknisk

- TypeScript 5.7+ med strict mode
- React 18/19 stotte
- react-router-dom 6/7 stotte
- Vitest + Testing Library for tester
- Publisert til GitHub Packages (privat, `@tommyskogstad` scope)
