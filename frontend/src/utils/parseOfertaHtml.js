const DIAS_ABREV = { Lu: 'LU', Ma: 'MA', Mi: 'MI', Ju: 'JU', Vi: 'VI', Sa: 'SA' }
const HORARIO_RE = /((?:Lu|Ma|Mi|Ju|Vi|Sa)+)(\d{2})a(\d{2})/
const DIAS_RE = /Lu|Ma|Mi|Ju|Vi|Sa/g

function limpiar(texto) {
  return texto.replace(/\u00a0/g, '').trim()
}

function parsearHorario(raw) {
  const cleaned = limpiar(raw)
  if (!cleaned) return []

  const match = cleaned.match(HORARIO_RE)
  if (!match) return [{ dia: cleaned, inicio: null, fin: null }]

  const diasStr = match[1]
  const inicio = `${match[2]}:00`
  const fin = `${match[3]}:00`
  const dias = diasStr.match(DIAS_RE) || []

  return dias.map((d) => ({ dia: DIAS_ABREV[d], inicio, fin }))
}

export function parseOfertaHtml(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const table = doc.querySelector('table')
  if (!table) throw new Error('No se encontró ninguna tabla en el HTML de oferta.')

  const tbody = table.querySelector('tbody')
  const rows = (tbody || table).querySelectorAll('tr')

  const materias = {}
  let codigoActual = null
  let nombreActual = null
  let totalComisiones = 0

  for (const tr of rows) {
    const tds = tr.querySelectorAll('td')
    if (tds.length < 7) continue

    const codigoRaw = limpiar(tds[0].textContent)
    const nombreRaw = limpiar(tds[1].textContent)

    if (codigoRaw && nombreRaw) {
      codigoActual = codigoRaw
      nombreActual = nombreRaw
    }

    if (!codigoActual) continue

    const comisionId = limpiar(tds[2].textContent)
    const horarioRaw = tds[4].textContent
    const modalidadTag = tds[5].querySelector('a')
    const modalidad = modalidadTag
      ? limpiar(modalidadTag.textContent)
      : limpiar(tds[5].textContent)
    const sede = limpiar(tds[6].textContent)

    if (!materias[codigoActual]) {
      materias[codigoActual] = {
        codigo_materia: codigoActual,
        nombre: nombreActual,
        comisiones: [],
      }
    }

    materias[codigoActual].comisiones.push({
      id: comisionId,
      horarios: parsearHorario(horarioRaw),
      sede,
      modalidad,
    })
    totalComisiones++
  }

  const resultado = Object.values(materias)
  return { materias: resultado, totalMaterias: resultado.length, totalComisiones }
}
