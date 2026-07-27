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
