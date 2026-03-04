export function parseHistoriaHtml(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const items = doc.querySelectorAll('div.historia-item')

  const materias = []

  for (const item of items) {
    const codigoDiv = item.querySelector('div.fw-bold')
    const nombreDiv = item.querySelector('div.fw-medium')
    const notaDiv = item.querySelector('div.nota-destacada')

    if (!codigoDiv || !nombreDiv) continue

    const codigo = codigoDiv.textContent.trim()
    const nombre = nombreDiv.textContent.trim()

    const notaRaw = notaDiv ? notaDiv.textContent.trim() : null
    const nota = notaRaw !== null ? parseInt(notaRaw, 10) : null

    const cols = item.querySelectorAll(':scope > div > div[class*="col-lg-"]')

    let origen = null
    let acta = null
    let fecha = null

    if (cols.length >= 6) {
      const origenContainer = cols[2]
      const innerDivs = origenContainer.querySelectorAll(':scope > div > div')
      for (const d of innerDivs) {
        if (!d.className.includes('text-muted')) {
          origen = d.textContent.trim()
          break
        }
      }

      const actaDiv = cols[3].querySelector('div.small')
      if (actaDiv) acta = actaDiv.textContent.trim()

      const fechaDiv = cols[4].querySelector('div.small')
      if (fechaDiv) fecha = fechaDiv.textContent.trim()
    }

    materias.push({
      codigo,
      nombre,
      origen,
      acta_resolucion: acta,
      fecha,
      nota: isNaN(nota) ? null : nota,
    })
  }

  return materias
}

export function isHtml(text) {
  const trimmed = text.trim()
  return trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')
}
