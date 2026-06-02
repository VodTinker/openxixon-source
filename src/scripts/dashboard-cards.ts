// Controla las cards expandibles del dashboard.
// - Solo una card expandida a la vez por página.
// - Persiste en sessionStorage entre navegaciones SPA.

const STORAGE_KEY = 'dashboard:expanded'

function setExpanded(card: HTMLElement, expanded: boolean) {
  card.setAttribute('aria-expanded', String(expanded))
  const collapsed = card.querySelector<HTMLElement>('.ecard-collapsed')
  const exp       = card.querySelector<HTMLElement>('.ecard-expanded')
  if (collapsed) collapsed.hidden = expanded
  if (exp)       exp.hidden       = !expanded
  if (expanded && exp) {
    // Forzar reflow de Recharts ResponsiveContainer
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
  }
}

function init() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-card]'))
  if (cards.length === 0) return

  const saved = sessionStorage.getItem(STORAGE_KEY)

  cards.forEach(card => {
    const id = card.dataset.cardId
    const toggle = card.querySelector<HTMLButtonElement>('.ecard-toggle')
    if (!toggle || !id) return

    setExpanded(card, saved === id)

    toggle.addEventListener('click', () => {
      const isExpanded = card.getAttribute('aria-expanded') === 'true'
      cards.forEach(c => { if (c !== card) setExpanded(c, false) })
      setExpanded(card, !isExpanded)
      if (!isExpanded) sessionStorage.setItem(STORAGE_KEY, id)
      else             sessionStorage.removeItem(STORAGE_KEY)
    })
  })
}

document.addEventListener('astro:page-load', init)
document.addEventListener('DOMContentLoaded', init)
