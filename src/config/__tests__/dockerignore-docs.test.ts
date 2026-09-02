import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '..', '..', '..')

/**
 * Henter alle `node_modules/`-regler fra .dockerignore (kommentarer og
 * tomme linjer filtreres bort).
 */
function dockerignoreNodeModulesRules(): string[] {
  const content = readFileSync(resolve(ROOT, '.dockerignore'), 'utf-8')
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('node_modules/'))
}

/**
 * Henter linjene i den fenced kodeblokken CLAUDE.md bruker for å dokumentere
 * innholdet i .dockerignore (første kodeblokk etter `.dockerignore`-seksjonen).
 */
function documentedNodeModulesRules(): string[] {
  const content = readFileSync(resolve(ROOT, 'CLAUDE.md'), 'utf-8')
  const section = content.indexOf('## Viktig: `.dockerignore`')
  expect(section, 'CLAUDE.md mangler `.dockerignore`-seksjonen').toBeGreaterThan(-1)

  const fenceStart = content.indexOf('```', section)
  expect(fenceStart, 'Fant ingen kodeblokk i `.dockerignore`-seksjonen').toBeGreaterThan(-1)
  const bodyStart = content.indexOf('\n', fenceStart) + 1
  const fenceEnd = content.indexOf('```', bodyStart)
  expect(fenceEnd, 'Kodeblokken i `.dockerignore`-seksjonen er ikke lukket').toBeGreaterThan(-1)

  return content
    .slice(bodyStart, fenceEnd)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

describe('CLAUDE.md dokumenterer .dockerignore korrekt', () => {
  it('dokumenterer nøyaktig de samme node_modules-reglene som .dockerignore har', () => {
    // Sortert sammenligning: rekkefølgen i dokumentasjonen er ikke en del av kontrakten,
    // men innholdet er. Drift i begge retninger gir rød test.
    expect([...documentedNodeModulesRules()].sort()).toEqual([...dockerignoreNodeModulesRules()].sort())
  })

  it('dokumenterer ikke pakker som ikke lenger ekskluderes (f.eks. react-router-dom, se #257/#259)', () => {
    const actual = dockerignoreNodeModulesRules()
    for (const documented of documentedNodeModulesRules()) {
      expect(actual, `CLAUDE.md dokumenterer «${documented}», men .dockerignore har ingen slik regel`).toContain(
        documented
      )
    }
  })

  it('utelater ingen node_modules-regel som faktisk finnes i .dockerignore', () => {
    const documented = documentedNodeModulesRules()
    for (const rule of dockerignoreNodeModulesRules()) {
      expect(documented, `.dockerignore har «${rule}», men CLAUDE.md dokumenterer den ikke`).toContain(rule)
    }
  })
})

/**
 * Apper som er arkivert og derfor ikke lenger skal stå i konsumentlisten noe
 * sted i repoet (se #289 — lo-finans arkivert 2026-05-19).
 */
const ARKIVERTE_APPER = ['lo-finans']

/**
 * Henter innholdet i første fangstgruppe. Feiler testen med en forklarende
 * melding om mønsteret ikke matcher (samme expect-idiom som resten av fila).
 */
function kreverMatch(content: string, pattern: RegExp, feilmelding: string): string {
  const match = content.match(pattern)
  expect(match, feilmelding).not.toBeNull()
  // Ureachable når expect over feiler — `?? ''` er kun for typesnevring.
  return match?.[1] ?? ''
}

/**
 * Splitter en konsumentliste på `/` eller `,`. Trimmer bort mellomrom og et
 * eventuelt `#`-prefiks, slik at en toppkommentar som brytes over flere
 * `#`-linjer ikke gir falsk rød test.
 */
function splittKonsumenter(raw: string): string[] {
  return raw
    .split(/[/,]/)
    .map((navn) => navn.replace(/^[\s#]+/, '').trim())
    .filter((navn) => navn.length > 0)
}

/**
 * Henter konsumentlisten fra toppkommentaren i .dockerignore, f.eks.
 * `# Forhindrer at konsumenter (biologportal/6810/...) får` → `['biologportal', '6810', ...]`.
 */
function dockerignoreConsumers(): string[] {
  const content = readFileSync(resolve(ROOT, '.dockerignore'), 'utf-8')
  return splittKonsumenter(
    kreverMatch(
      content,
      /konsumenter\s*\(([^)]+)\)/,
      '.dockerignore mangler «konsumenter (...)»-listen i toppkommentaren'
    )
  )
}

/**
 * Henter konsumentlisten CLAUDE.md dokumenterer i `.dockerignore`-seksjonen
 * («Konsumentapper (...) bruker oss via file:../../grunnmur-frontend»).
 */
function documentedConsumers(): string[] {
  const content = readFileSync(resolve(ROOT, 'CLAUDE.md'), 'utf-8')
  const section = content.indexOf('## Viktig: `.dockerignore`')
  expect(section, 'CLAUDE.md mangler `.dockerignore`-seksjonen').toBeGreaterThan(-1)

  // Avgrens til seksjonen (fram til neste `## `-heading) og ankre til
  // «**Hvorfor:**»-avsnittet. Ordet «Konsumentapper» forekommer flere ganger i
  // CLAUDE.md, så en uankret regex over resten av fila kunne plukket feil
  // parentes hvis teksten rundt endres senere.
  const nextHeading = content.indexOf('\n## ', section + 1)
  const sectionBody = content.slice(section, nextHeading > -1 ? nextHeading : undefined)

  return splittKonsumenter(
    kreverMatch(
      sectionBody,
      /\*\*Hvorfor:\*\*\s*Konsumentapper\s*\(([^)]+)\)/,
      'CLAUDE.md mangler «**Hvorfor:** Konsumentapper (...)»-listen i `.dockerignore`-seksjonen'
    )
  )
}

describe('CLAUDE.md dokumenterer konsumentlisten i .dockerignore korrekt', () => {
  it('dokumenterer nøyaktig de samme konsumentappene som .dockerignore-kommentaren', () => {
    // Rekkefølgen er ikke del av kontrakten, men innholdet er: legges en ny
    // konsument til i .dockerignore uten at CLAUDE.md følger etter (eller
    // omvendt), blir testen rød. Se #291.
    expect([...documentedConsumers()].sort()).toEqual([...dockerignoreConsumers()].sort())
  })

  it('lister ingen arkiverte apper i .dockerignore-kommentaren (se #289)', () => {
    for (const arkivert of ARKIVERTE_APPER) {
      expect(
        dockerignoreConsumers(),
        `.dockerignore lister «${arkivert}», som er arkivert og ikke lenger er konsument`
      ).not.toContain(arkivert)
    }
  })

  it('lister ingen arkiverte apper i CLAUDE.md-konsumentlisten (se #289)', () => {
    for (const arkivert of ARKIVERTE_APPER) {
      expect(
        documentedConsumers(),
        `CLAUDE.md lister «${arkivert}», som er arkivert og ikke lenger er konsument`
      ).not.toContain(arkivert)
    }
  })
})
