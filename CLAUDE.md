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
