import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const ENTRY_RE = /^(\d+)\s+(Promocion|Examen|Equivalencia)\s+(\d{3,5})\s+(.+)$/
const TAIL_RE = /^(.+?)\s+(\S+)\s+(\d{2}\/\d{2}\/\d{4})\s*(\d+)?\s*$/
const SKIP_RE = /^(INGENIER|Alumno:|Nro Documento:|Nº\s+Origen|Resolución|Página \d|--\s*\d+\s+of)/i

async function extractText(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const lines = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    let currentLine = ''
    for (const item of content.items) {
      if (item.str !== undefined) currentLine += item.str
      if (item.hasEOL) {
        lines.push(currentLine)
        currentLine = ''
      }
    }
    if (currentLine) lines.push(currentLine)
  }
  return lines.join('\n')
}

function parseLines(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !SKIP_RE.test(l))

  const groups = []
  for (const line of lines) {
    if (ENTRY_RE.test(line)) {
      groups.push(line)
    } else if (groups.length > 0) {
      groups[groups.length - 1] += ' ' + line
    }
  }

  const materias = []
  for (const group of groups) {
    const entryMatch = group.match(ENTRY_RE)
    if (!entryMatch) continue

    const origen = entryMatch[2]
    const codigo = entryMatch[3]
    const rest = entryMatch[4]

    const tailMatch = rest.match(TAIL_RE)
    if (!tailMatch) continue

    const nombre = tailMatch[1]
    const acta = tailMatch[2]
    const fecha = tailMatch[3]
    const notaRaw = tailMatch[4]
    const nota = notaRaw != null ? parseInt(notaRaw, 10) : null

    materias.push({
      codigo,
      nombre,
      origen,
      acta_resolucion: acta,
      fecha,
      nota: nota != null && !isNaN(nota) ? nota : null,
    })
  }

  return materias
}

export async function parseHistoriaPdf(arrayBuffer) {
  const text = await extractText(arrayBuffer)
  return parseLines(text)
}

export function isPdf(file) {
  return (
    file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
  )
}
