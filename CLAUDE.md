# CLAUDE.md

## Prosjektoversikt

**@grunnmur/frontend-core** — Felles frontend-bibliotek for Kotlin/Ktor-appene i porteføljen.

Tilsvarer `grunnmur` (Kotlin-bibliotek) for backend, men for React/TypeScript frontend.

## Teknologier

- **Språk**: TypeScript 5.7+
- **Framework**: React 18/19
- **Test**: Vitest + Testing Library
- **Publisering**: GitHub Packages (privat, @grunnmur scope)
- **Byggesystem**: tsc (TypeScript compiler)

## Kommandoer

```bash
npm install       # Installer avhengigheter
npm run build     # Bygg til dist/
npm test          # Kjør tester
npm run lint      # ESLint
```

## Moduler (planlagt)

| Modul | Beskrivelse | Status |
|-------|-------------|--------|
| `api/apiClient` | Konfigurerbar fetch-wrapper med CSRF | Planlagt (#2) |
| `auth/AuthContext` | Generisk AuthProvider med hooks | Planlagt (#3) |
| `auth/authApi` | requestCode, verifyCode, getMe, logout | Planlagt (#3) |
| `components/ErrorBoundary` | Styling-agnostisk error boundary | Planlagt (#4) |
| `components/ProtectedRoute` | Konfigurerbar med roleCheck callback | Planlagt (#4) |
| `lib/queryClient` | Standard QueryClient-config | Planlagt (#5) |
| `lib/formatters` | Dato, valuta, tall | Planlagt (#5) |

## Konfigurasjonspunkter

### apiClient
- `onUnauthorized`: callback for 401-håndtering
- `csrfSource`: `'cookie'` | `'memory'`
- `basePath`: default `/api`

### AuthContext
- Generisk User-type: `AuthProvider<TUser>`
- `loginPath`: f.eks. `/logg-inn`
- `onLogout`: callback

### ProtectedRoute
- `loginPath`: konfigurerbar
- `roleCheck`: valgfri callback
- `loadingComponent`: valgfri spinner

## Apper som bruker dette biblioteket

| App | Spesielle hensyn |
|-----|------------------|
| summa-summarum | Pilot. Enklest app |
| 6810 | In-memory CSRF |
| styreportal | Multi-tenant (TenantContext) |
| lo-finans | Objekt-stil API (api.get/api.post) |
| biologportal | React Query, TOTP, Observer-rolle |

## Konvensjoner

- Dokumentasjon på norsk
- Commit-meldinger på engelsk
- Semver-versjonering (major for breaking, minor for features, patch for bugfiks)
- Tynn og stabil — konfigurasjon via callbacks, ikke feature-flags
- Alle eksporterte funksjoner skal ha JSDoc-kommentarer

## Viktig: `.dockerignore` ekskluderer runtime-React

`.dockerignore` i rota ekskluderer:

```
node_modules/react
node_modules/react-dom
node_modules/.package-lock.json
```

**Hvorfor:** Konsumentapper (lo-finans, biologportal, 6810, styreportal) bruker
oss via `file:../../grunnmur-frontend` og kopierer hele denne mappa inn i
Docker build-konteksten via `additional_contexts` + `COPY --from=grunnmur-frontend`.
Hvis vår `node_modules/react` følger med, ender konsumenten opp med to
React-instanser i bundlet (en fra grunnmurs node_modules, en fra konsumentens
egen) — og alle hooks fra grunnmur (AuthProvider, ErrorBoundary etc.) krasjer
med `Cannot read properties of null (reading 'useState')` på initial render.

Dette traff biologportal og lo-finans hardt 2026-04-10 — fire påfølgende
deploys i biologportal feilet smoke-test [7/7] før rotårsaken ble identifisert.
Se PR #24 og hvit side-incident i memory for full historikk.

**Hva som fortsatt shippes:** `@types/react`, `@types/react-dom`,
`@tanstack/react-query`, `react-router-dom` og resten av `node_modules/`.
Konsumentene trenger dette for at `tsc -b` skal kunne resolve type-imports
fra våre kompilerte `.d.ts`-filer (uten `@types/react` feiler kompilering med
`'ErrorBoundary' cannot be used as a JSX component`).

**Hva som er trygt å fjerne hvis du må kutte build-context-størrelse senere:**
Kun `react` og `react-dom`. Ikke fjern `@types/react` eller `node_modules` som
helhet. React er en `peerDependency` her, så konsumentene har alltid sin egen
runtime React tilgjengelig.

**Fjern aldri `.dockerignore` uten å varsle alle konsumenter** — fjerning
gjeninnfører bug-en. Hver konsument har en defensiv `RUN rm -rf` i sine egne
Dockerfiler som beskyttelse, men det er bedre å holde denne fila intakt.
