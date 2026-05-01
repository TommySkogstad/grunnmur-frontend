import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { VERSION } from '../../index'

const ROOT = resolve(__dirname, '..', '..', '..')

describe('Eksporterbar eslint-config', () => {
  const eslintConfigPath = resolve(ROOT, 'config', 'eslint.base.js')

  it('config/eslint.base.js eksisterer', () => {
    expect(existsSync(eslintConfigPath)).toBe(true)
  })

  it('eksporterer en default array med config-objekter', async () => {
    const mod = await import(eslintConfigPath)
    const config = mod.default
    expect(Array.isArray(config)).toBe(true)
    expect(config.length).toBeGreaterThan(0)
  })

  it('inkluderer typescript-eslint regler', async () => {
    const mod = await import(eslintConfigPath)
    const config = mod.default as Array<Record<string, unknown>>
    const hasTypeScriptPlugin = config.some(
      (c) => c.plugins && typeof c.plugins === 'object' && '@typescript-eslint' in (c.plugins as Record<string, unknown>)
    )
    expect(hasTypeScriptPlugin).toBe(true)
  })

  it('inkluderer react-hooks plugin', async () => {
    const mod = await import(eslintConfigPath)
    const config = mod.default as Array<Record<string, unknown>>
    const hasReactHooks = config.some(
      (c) => c.plugins && typeof c.plugins === 'object' && 'react-hooks' in (c.plugins as Record<string, unknown>)
    )
    expect(hasReactHooks).toBe(true)
  })

  it('har no-unused-vars som warn med argsIgnorePattern for produksjonskode', async () => {
    const mod = await import(eslintConfigPath)
    const config = mod.default as Array<Record<string, unknown>>
    // Finn siste non-test entry med no-unused-vars (den som vinner for produksjonskode)
    const prodEntries = config.filter(
      (c) =>
        c.rules &&
        typeof c.rules === 'object' &&
        '@typescript-eslint/no-unused-vars' in (c.rules as Record<string, unknown>) &&
        c.files &&
        Array.isArray(c.files) &&
        (c.files as string[]).some((f) => f.includes('*.{ts,tsx}') && !f.includes('test'))
    )
    expect(prodEntries.length).toBeGreaterThan(0)
    const prodEntry = prodEntries[prodEntries.length - 1]
    const rule = (prodEntry.rules as Record<string, unknown>)['@typescript-eslint/no-unused-vars']
    expect(Array.isArray(rule)).toBe(true)
    expect((rule as unknown[])[0]).toBe('warn')
    expect((rule as unknown[])[1]).toHaveProperty('argsIgnorePattern', '^_')
  })
})

describe('Eksporterbar tsconfig.base.json', () => {
  const tsconfigBasePath = resolve(ROOT, 'tsconfig.base.json')

  it('tsconfig.base.json eksisterer', () => {
    expect(existsSync(tsconfigBasePath)).toBe(true)
  })

  it('har strict mode aktivert', () => {
    const config = JSON.parse(readFileSync(tsconfigBasePath, 'utf-8'))
    expect(config.compilerOptions.strict).toBe(true)
  })

  it('har JSX support (react-jsx)', () => {
    const config = JSON.parse(readFileSync(tsconfigBasePath, 'utf-8'))
    expect(config.compilerOptions.jsx).toBe('react-jsx')
  })

  it('bruker bundler moduleResolution', () => {
    const config = JSON.parse(readFileSync(tsconfigBasePath, 'utf-8'))
    expect(config.compilerOptions.moduleResolution).toBe('bundler')
  })

  it('har isolatedModules for bundler-kompatibilitet', () => {
    const config = JSON.parse(readFileSync(tsconfigBasePath, 'utf-8'))
    expect(config.compilerOptions.isolatedModules).toBe(true)
  })

  it('har IKKE outDir/rootDir/declaration (app-spesifikke settings)', () => {
    const config = JSON.parse(readFileSync(tsconfigBasePath, 'utf-8'))
    expect(config.compilerOptions.outDir).toBeUndefined()
    expect(config.compilerOptions.rootDir).toBeUndefined()
    expect(config.compilerOptions.declaration).toBeUndefined()
    expect(config.compilerOptions.declarationDir).toBeUndefined()
  })
})

describe('VERSION er synkronisert med package.json', () => {
  it('VERSION matcher package.json-versjon', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
    expect(VERSION).toBe(pkg.version)
  })
})

describe('package.json eksponerer config-filer', () => {
  it('files inkluderer config/ og tsconfig.base.json', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.files).toContain('config')
    expect(pkg.files).toContain('tsconfig.base.json')
  })

  it('exports har eslint-config entry', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.exports).toHaveProperty('./eslint-config')
  })

  it('exports har tsconfig entry', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.exports).toHaveProperty('./tsconfig')
  })
})
