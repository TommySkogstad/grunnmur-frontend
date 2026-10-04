import axe from 'axe-core'

/**
 * Kjører axe-core mot en DOM-node og returnerer brudd som lesbare linjer.
 * Tom liste betyr at axe ikke fant noe. `color-contrast` er av fordi jsdom
 * ikke har layout/stiler, og komponentene er styling-agnostiske.
 */
export async function axeViolations(container: Element = document.body): Promise<string[]> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  return results.violations.map(
    v => `${v.id}: ${v.help} (${v.nodes.map(n => n.target.join(' ')).join(', ')})`
  )
}
