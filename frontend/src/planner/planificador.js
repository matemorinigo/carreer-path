// Planificador de cursada: genera el plan cuatrimestre por cuatrimestre a partir
// de la historia académica, el plan de estudios y la oferta de comisiones.
//
// Corre 100% en el navegador (antes vivía en un backend Spring Boot). Los datos
// del plan y la oferta son estáticos y vienen empaquetados en `src/data`.

import planEstudiosRaw from '../data/planEstudios.json'
import ofertaComisionesRaw from '../data/ofertaComisiones.json'

const MAX_CUATRIMESTRES = 30

// Desde 2026 cualquier materia electiva ofertada cubre indistintamente
// Electiva I, II o III: son un pool compartido, no listas separadas.
const ELECTIVA_SLOTS_COMPARTIDOS = new Set(['3672', '3673', '3674'])

const TURNOS = {
  manana: [8 * 60, 13 * 60],
  tarde: [13 * 60, 18 * 60],
  noche: [18 * 60, 23 * 60],
}

const TURNOS_DEFAULT = ['manana', 'tarde', 'noche']

// ── Carga de datos ──

export function normalizeId(id) {
  if (id == null) return ''
  const normalized = String(id).replace(/^0+/, '')
  return normalized === '' ? '0' : normalized
}

// "HH:mm" estricto → minutos desde las 00:00 (null si no parsea).
export function parseTime(time) {
  if (time == null) return null
  const m = /^(\d{2}):(\d{2})$/.exec(String(time))
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

function formatTime(minutos) {
  if (minutos == null) return null
  const h = String(Math.floor(minutos / 60)).padStart(2, '0')
  const m = String(minutos % 60).padStart(2, '0')
  return `${h}:${m}`
}

// Arma el mapa id → materia con correlativas y padre resueltos (descarta
// referencias a materias que no están en el plan).
function buildMaterias(planRaw) {
  const materiaMap = new Map()
  for (const dto of planRaw) {
    if (dto.id == null || dto.nombre == null) continue
    if (materiaMap.has(dto.id)) continue
    materiaMap.set(dto.id, {
      id: dto.id,
      nombre: dto.nombre,
      esObligatoria: !!dto.esObligatoria,
      anual: !!dto.anual,
      esTransversal: !!dto.esTransversal,
      horas: dto.horas,
      correlativas: [],
      padreId: null,
    })
  }
  for (const dto of planRaw) {
    const materia = materiaMap.get(dto.id)
    if (!materia) continue
    if (Array.isArray(dto.correlativas) && dto.correlativas.length > 0) {
      materia.correlativas = [...new Set(dto.correlativas)].filter((c) => materiaMap.has(c))
    }
    if (dto.padreId && materiaMap.has(dto.padreId)) {
      materia.padreId = dto.padreId
    }
  }
  return materiaMap
}

// `reemplazaSiVacia`: si una materia repetida viene sin comisiones, borra las que
// ya tenía (así se comportaba la oferta base; la oferta custom las conserva).
function buildComisionesFromOferta(oferta, materiaMap, reemplazaSiVacia = false) {
  const result = new Map()
  for (const dto of oferta || []) {
    const materiaId = normalizeId(dto.codigo_materia)
    if (!materiaMap.has(materiaId)) continue
    if (!dto.comisiones) {
      if (reemplazaSiVacia) result.delete(materiaId)
      continue
    }
    result.set(materiaId, dto.comisiones.map((c) => ({
      comisionId: c.id,
      sede: c.sede ?? null,
      modalidad: c.modalidad ?? null,
      horarios: (c.horarios || []).map((h) => ({
        dia: h.dia ?? null,
        horaInicio: parseTime(h.inicio),
        horaFin: parseTime(h.fin),
      })),
    })))
  }
  return result
}

const MATERIAS = buildMaterias(planEstudiosRaw)
const COMISIONES_DEFAULT = buildComisionesFromOferta(ofertaComisionesRaw, MATERIAS, true)

// Hijas (opciones) de cada slot de electiva.
const HIJAS = new Map()
for (const m of MATERIAS.values()) {
  if (!m.padreId) continue
  if (!HIJAS.has(m.padreId)) HIJAS.set(m.padreId, [])
  HIJAS.get(m.padreId).push(m)
}

export function getMaterias() {
  return MATERIAS
}

// Requisitos para cursar una materia: sus correlativas más las del slot de
// electiva al que pertenece (si es una opción de electiva).
export function requisitosDe(materiaId) {
  const m = MATERIAS.get(materiaId)
  if (!m) return []
  const padre = m.padreId ? MATERIAS.get(m.padreId) : null
  return [...new Set([...m.correlativas, ...(padre ? padre.correlativas : [])])]
}

// ── Grafo inverso de dependencias ──

function buildReverseDependencyGraph(materias) {
  const reverse = new Map()
  for (const m of materias) {
    for (const c of m.correlativas) {
      if (!reverse.has(c)) reverse.set(c, new Set())
      reverse.get(c).add(m.id)
    }
  }
  return reverse
}

function computeDependencyWeights(materias, reverseDeps) {
  const weights = new Map()
  for (const m of materias) {
    const visited = new Set()
    const queue = [...(reverseDeps.get(m.id) || [])]
    while (queue.length) {
      const current = queue.shift()
      if (!visited.has(current)) {
        visited.add(current)
        queue.push(...(reverseDeps.get(current) || []))
      }
    }
    weights.set(m.id, visited.size)
  }
  return weights
}

// Cantidad de materias que dependen (transitivamente) de cada una.
export const PESO_DEPENDENCIA = computeDependencyWeights(
  [...MATERIAS.values()],
  buildReverseDependencyGraph([...MATERIAS.values()]),
)

// ── Filtros de horario y turno ──

function esHorarioADistancia(h) {
  return h.dia != null && h.dia.toLowerCase().includes('distancia')
}

function esADistancia(modalidad) {
  return modalidad != null && modalidad.toLowerCase().includes('distancia')
}

export function hayConflictoHorario(nuevos, ocupados) {
  for (const nuevo of nuevos) {
    if (esHorarioADistancia(nuevo)) continue
    if (nuevo.horaInicio == null || nuevo.horaFin == null) continue
    for (const ocupado of ocupados) {
      if (esHorarioADistancia(ocupado)) continue
      if (ocupado.horaInicio == null || ocupado.horaFin == null) continue
      if (nuevo.dia != null && nuevo.dia === ocupado.dia
        && nuevo.horaInicio < ocupado.horaFin
        && nuevo.horaFin > ocupado.horaInicio) {
        return true
      }
    }
  }
  return false
}

// Sin horario fijo = asincrónica, sin día/hora real que pueda chocar con otra materia.
// No confundir con modalidad "a distancia": una comisión remota puede tener horario fijo
// (ej. video-clase sincrónica) y en ese caso sí debe chequearse contra otros horarios.
function sinHorarioFijo(comision) {
  return comision.horarios.length === 0 || comision.horarios.every(esHorarioADistancia)
}

function horarioDentroDelTurno(h, turnos) {
  if (h.horaInicio == null) return true
  return turnos.some((t) => {
    const rango = TURNOS[t]
    return rango && h.horaInicio >= rango[0] && h.horaInicio < rango[1]
  })
}

export function comisionPermitidaPorTurno(comision, turnos) {
  if (sinHorarioFijo(comision)) return true
  if (turnos.length === 3) return true
  return comision.horarios.every((h) =>
    esHorarioADistancia(h) || h.horaInicio == null || horarioDentroDelTurno(h, turnos))
}

export const distanciaPrimero = (a, b) => Number(esADistancia(b.modalidad)) - Number(esADistancia(a.modalidad))

// ── Helpers de armado ──

function materiaAsignada(fields) {
  return {
    materiaId: null,
    nombre: null,
    comisionId: null,
    sede: null,
    modalidad: null,
    horarios: null,
    sinOferta: false,
    electiva: false,
    anual: false,
    estimado: false,
    conflictoCon: null,
    ofertaFueraDeTurno: null,
    intercambiables: null,
    ...fields,
  }
}

export function buildMateriaAsignada(materia, comision) {
  return materiaAsignada({
    materiaId: materia.id,
    nombre: materia.nombre,
    comisionId: comision.comisionId,
    sede: comision.sede,
    modalidad: comision.modalidad,
    horarios: comision.horarios.map((h) => ({
      dia: h.dia,
      horaInicio: formatTime(h.horaInicio),
      horaFin: formatTime(h.horaFin),
    })),
    electiva: materia.padreId != null,
  })
}

function addIntercambiable(dto, intercambiable) {
  if (!dto.intercambiables) dto.intercambiables = []
  dto.intercambiables.push(intercambiable)
}

function horariosDe(asignada, comisionesPorMateria) {
  if (asignada.comisionId == null) return []
  const c = (comisionesPorMateria.get(asignada.materiaId) || [])
    .find((x) => x.comisionId === asignada.comisionId)
  return c ? c.horarios : []
}

function buildResumenOfertaFueraDeTurno(comisiones) {
  if (!comisiones || comisiones.length === 0) return null
  const primera = comisiones[0]
  const dias = primera.horarios
    .filter((h) => !esHorarioADistancia(h) && h.dia != null)
    .map((h) => `${h.dia} ${formatTime(h.horaInicio) ?? '?'}-${formatTime(h.horaFin) ?? '?'}`)
    .join(', ')
  if (!dias) return null
  return `${dias} (${primera.modalidad ?? 'Sin modalidad'})`
}

// ── Resolución de electivas ──

function tieneHijas(materia) {
  return HIJAS.has(materia.id)
}

function correlativasCumplidas(materia, completadas) {
  return materia.correlativas.every((c) => completadas.has(c))
}

function tieneHijaCursable(slot, completadas) {
  return (HIJAS.get(slot.id) || []).some((hija) =>
    !completadas.has(hija.id) && correlativasCumplidas(hija, completadas))
}

function resolverElectiva(slot, comisionesPorMateria, horariosOcupados, completadas,
  yaElegidasEsteCuatrimestre, conOferta, turnos) {
  // Si el slot pertenece al pool compartido de electivas, cualquier opción de
  // cualquiera de los 3 slots es válida acá (evitando repetir una ya asignada
  // a otro slot en este mismo cuatrimestre).
  const grupos = ELECTIVA_SLOTS_COMPARTIDOS.has(slot.id) ? [...ELECTIVA_SLOTS_COMPARTIDOS] : [slot.id]

  const opciones = grupos.flatMap((g) => HIJAS.get(g) || [])
    .filter((m) => !completadas.has(m.id))
    .filter((m) => !yaElegidasEsteCuatrimestre.has(m.id))
    .filter((m) => correlativasCumplidas(m, completadas))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  let mejor = null
  let menorSlots = Infinity

  for (const opcion of opciones) {
    const comisiones = comisionesPorMateria.get(opcion.id) || []
    if (comisiones.length > 0) {
      for (const comision of [...comisiones].sort(distanciaPrimero)) {
        if (!comisionPermitidaPorTurno(comision, turnos)) continue
        if (hayConflictoHorario(comision.horarios, horariosOcupados)) continue
        if (sinHorarioFijo(comision)) {
          mejor = buildMateriaAsignada(opcion, comision)
          if (!conOferta) mejor.estimado = true
          return mejor
        }
        if (comision.horarios.length < menorSlots) {
          menorSlots = comision.horarios.length
          mejor = buildMateriaAsignada(opcion, comision)
          if (!conOferta) mejor.estimado = true
        }
      }
    } else if (!conOferta) {
      return materiaAsignada({
        materiaId: opcion.id,
        nombre: opcion.nombre,
        sinOferta: true,
        electiva: true,
      })
    }
  }
  return mejor
}

// ── Detección de conflictos e intercambios ──

function findConflictoAsignada(comisionesMateria, asignadas, comisionesPorMateria) {
  for (const asignada of asignadas) {
    const horariosAsignada = horariosDe(asignada, comisionesPorMateria)
    for (const c of comisionesMateria) {
      if (hayConflictoHorario(c.horarios, horariosAsignada)) return asignada
    }
  }
  return null
}

const mismoHorario = (a, b) =>
  a.dia === b.dia && a.horaInicio === b.horaInicio && a.horaFin === b.horaFin

// Marca dos materias que chocan de horario como intercambiables cuando el orden
// en que se cursen es indistinto: ninguna bloquea correlativas a futuro (peso 0)
// y la diferida entraría en este mismo cuatrimestre si se saca a la ganadora.
// La otra mitad del chequeo (que la ganadora entre en el cuatrimestre donde caiga
// la diferida) se valida al ubicarla, antes de confirmar el link.
function registrarSwapSiCorresponde(diferidaId, comisionesDiferida, winner, horariosOcupados,
  comisionesPorMateria, turnos, numCuatrimestre, swapsPendientes) {
  swapsPendientes.delete(diferidaId)
  if (!winner || winner.materiaId == null) return

  const ningunaBloquea = (PESO_DEPENDENCIA.get(diferidaId) || 0) === 0
    && (PESO_DEPENDENCIA.get(winner.materiaId) || 0) === 0
  if (!ningunaBloquea) return

  const winnerHorarios = horariosDe(winner, comisionesPorMateria)
  const ocupadosSinWinner = horariosOcupados.filter((h) => !winnerHorarios.some((w) => mismoHorario(h, w)))

  const diferidaEntraSinWinner = comisionesDiferida
    .filter((c) => comisionPermitidaPorTurno(c, turnos))
    .some((c) => !hayConflictoHorario(c.horarios, ocupadosSinWinner))
  if (!diferidaEntraSinWinner) return

  swapsPendientes.set(diferidaId, { winner, winnerCuatrimestre: numCuatrimestre, winnerHorarios })
}

// ── Algoritmo principal ──

function generarPlanOptimo(maxMateriasPorCuatrimestre, historia, turnos, ofertaCustom, cuatrimestreInicio) {
  const modoOptimo = maxMateriasPorCuatrimestre === 0
  const todasMaterias = [...MATERIAS.values()]

  const comisionesPorMateria = ofertaCustom && ofertaCustom.length > 0
    ? buildComisionesFromOferta(ofertaCustom, MATERIAS)
    : COMISIONES_DEFAULT

  const aprobadasIds = new Set((historia || []).map((h) => normalizeId(h.codigo)))
  const completadas = new Set(todasMaterias.filter((m) => aprobadasIds.has(m.id)).map((m) => m.id))
  const materiasYaAprobadas = completadas.size

  const pendientes = new Set(todasMaterias
    .filter((m) => !completadas.has(m.id) && m.esObligatoria)
    .map((m) => m.id))

  const cuatrimestres = []
  let numCuatrimestre = 1
  let primerCuatrimestre = true
  const materiasAnualesEnCurso = new Set()
  const conflictosPendientes = new Map()
  // Materias diferidas por choque de horario que, por no bloquear nada a futuro,
  // se pueden intercambiar con la que ganó el slot. Clave: id de la diferida.
  const swapsPendientes = new Map()

  const porPeso = (a, b) => {
    const cmp = (PESO_DEPENDENCIA.get(b) || 0) - (PESO_DEPENDENCIA.get(a) || 0)
    if (cmp !== 0) return cmp
    return a < b ? -1 : a > b ? 1 : 0
  }

  while ((pendientes.size > 0 || materiasAnualesEnCurso.size > 0) && numCuatrimestre <= MAX_CUATRIMESTRES) {
    const cuatrimestreReal = cuatrimestreInicio + numCuatrimestre - 1
    const esPrimerCuatrimestreDelAnio = cuatrimestreReal % 2 === 1

    const asignadas = []
    const horariosOcupados = []
    const slotsResueltos = new Set()
    const electivasElegidasEsteCuatrimestre = new Set()

    const anualesCompletandose = new Set()
    if (!esPrimerCuatrimestreDelAnio) {
      for (const anualId of materiasAnualesEnCurso) {
        const m = MATERIAS.get(anualId)
        asignadas.push(materiaAsignada({ materiaId: m.id, nombre: m.nombre, sinOferta: true, anual: true }))
        anualesCompletandose.add(anualId)
      }
    }

    // --- Paso B: Filtrar materias cursables ---
    const cursables = [...pendientes].filter((id) => {
      const m = MATERIAS.get(id)
      if (!m) return false
      if (m.padreId != null) return false
      if (m.anual && !esPrimerCuatrimestreDelAnio) return false
      if (!correlativasCumplidas(m, completadas)) return false
      if (tieneHijas(m)) return tieneHijaCursable(m, completadas)
      return true
    })

    if (cursables.length === 0 && asignadas.length === 0) break

    // --- Paso C: Ordenar por peso y separar cores de transversales ---
    const coresCursables = cursables.filter((id) => !MATERIAS.get(id).esTransversal).sort(porPeso)
    // Las electivas (con varias opciones de horario) se resuelven últimas entre
    // los cores: así las materias de franja fija reservan su día primero, y la
    // electiva -flexible- se acomoda en lo que quede libre en vez de tomárselo.
    coresCursables.sort((a, b) => Number(tieneHijas(MATERIAS.get(a))) - Number(tieneHijas(MATERIAS.get(b))))

    const transvCursables = cursables.filter((id) => MATERIAS.get(id).esTransversal).sort(porPeso)

    // Mechar: detectar si la transversal tiene comisión sin horario fijo (asincrónica)
    let transvSinHorarioFijo = false
    if (transvCursables.length > 0) {
      const comisTransv = comisionesPorMateria.get(transvCursables[0]) || []
      transvSinHorarioFijo = comisTransv.some(sinHorarioFijo)
    }

    // Sin horario fijo: no reservar slot (será bonus). Con horario: reservar 1 slot (mechado normal).
    const slotsTransv = transvSinHorarioFijo ? 0 : Math.min(1, transvCursables.length)
    const limiteCores = modoOptimo ? Infinity : maxMateriasPorCuatrimestre - slotsTransv

    const ordenAsignacion = [...coresCursables]
    if (transvCursables.length > 0) ordenAsignacion.push(transvCursables[0])

    // --- Paso D: Asignar comisiones sin conflictos de horario ---
    let coresAsignados = 0
    for (const materiaId of ordenAsignacion) {
      const materia = MATERIAS.get(materiaId)
      const esBonusSinHorario = materia.esTransversal && transvSinHorarioFijo

      // Bonus sin horario fijo no cuenta contra el límite
      if (!modoOptimo && !esBonusSinHorario && asignadas.length >= maxMateriasPorCuatrimestre) continue
      // Limitar cores para dejar lugar a transversales presenciales
      if (!materia.esTransversal && !modoOptimo && coresAsignados >= limiteCores) continue

      const prevSize = asignadas.length

      if (tieneHijas(materia)) {
        const electiva = resolverElectiva(materia, comisionesPorMateria, horariosOcupados,
          completadas, electivasElegidasEsteCuatrimestre, primerCuatrimestre, turnos)
        if (electiva) {
          asignadas.push(electiva)
          horariosOcupados.push(...horariosDe(electiva, comisionesPorMateria))
          slotsResueltos.add(materiaId)
          electivasElegidasEsteCuatrimestre.add(electiva.materiaId)
          if (!materia.esTransversal) coresAsignados++
        }
        continue
      }

      const comisiones = comisionesPorMateria.get(materiaId) || []

      if (comisiones.length > 0) {
        const elegida = [...comisiones].sort(distanciaPrimero)
          .find((c) => comisionPermitidaPorTurno(c, turnos) && !hayConflictoHorario(c.horarios, horariosOcupados))

        if (elegida) {
          const dto = buildMateriaAsignada(materia, elegida)
          dto.anual = materia.anual
          dto.estimado = !primerCuatrimestre
          if (conflictosPendientes.has(materiaId)) {
            const prev = conflictosPendientes.get(materiaId)
            conflictosPendientes.delete(materiaId)
            if (prev != null) dto.conflictoCon = prev
          }

          // Si esta materia venía diferida por un choque con otra que
          // tampoco bloquea nada, y la ganadora entra igual acá sin esta
          // (chequeo del lado de este cuatrimestre), quedan intercambiables.
          const swap = swapsPendientes.get(materiaId)
          swapsPendientes.delete(materiaId)
          if (swap && !hayConflictoHorario(swap.winnerHorarios, horariosOcupados)) {
            addIntercambiable(swap.winner, { materiaId: materia.id, nombre: materia.nombre, cuatrimestre: numCuatrimestre })
            addIntercambiable(dto, { materiaId: swap.winner.materiaId, nombre: swap.winner.nombre, cuatrimestre: swap.winnerCuatrimestre })
          }

          asignadas.push(dto)
          horariosOcupados.push(...elegida.horarios)
        } else if (materia.anual) {
          const dto = materiaAsignada({ materiaId: materia.id, nombre: materia.nombre, sinOferta: true, anual: true })
          const resumen = buildResumenOfertaFueraDeTurno(comisiones)
          if (resumen != null) dto.ofertaFueraDeTurno = resumen
          if (conflictosPendientes.has(materiaId)) {
            const prev = conflictosPendientes.get(materiaId)
            conflictosPendientes.delete(materiaId)
            if (prev != null) dto.conflictoCon = prev
          }
          asignadas.push(dto)
        } else {
          const winner = findConflictoAsignada(comisiones, asignadas, comisionesPorMateria)
          conflictosPendientes.set(materiaId, winner ? winner.nombre : null)
          registrarSwapSiCorresponde(materiaId, comisiones, winner, horariosOcupados,
            comisionesPorMateria, turnos, numCuatrimestre, swapsPendientes)
        }
      } else if (!primerCuatrimestre) {
        const dto = materiaAsignada({ materiaId: materia.id, nombre: materia.nombre, sinOferta: true, anual: materia.anual })
        if (conflictosPendientes.has(materiaId)) {
          const prev = conflictosPendientes.get(materiaId)
          conflictosPendientes.delete(materiaId)
          if (prev != null) dto.conflictoCon = prev
        }
        asignadas.push(dto)
      }

      if (!materia.esTransversal && asignadas.length > prevSize) coresAsignados++
    }

    if (asignadas.length === 0) {
      if (primerCuatrimestre) {
        primerCuatrimestre = false
        continue
      }
      break
    }

    cuatrimestres.push({ numero: numCuatrimestre, materias: asignadas })

    for (const a of asignadas) {
      if (anualesCompletandose.has(a.materiaId)) continue
      const m = MATERIAS.get(a.materiaId)
      if (m && m.anual) materiasAnualesEnCurso.add(a.materiaId)
      else completadas.add(a.materiaId)
      pendientes.delete(a.materiaId)
    }

    for (const anualId of anualesCompletandose) {
      completadas.add(anualId)
      materiasAnualesEnCurso.delete(anualId)
    }

    for (const slotId of slotsResueltos) {
      completadas.add(slotId)
      pendientes.delete(slotId)
      // Los slots del pool compartido de electivas NO completan a sus
      // hermanas nominales acá: otra candidata sin usar puede hacer
      // falta todavía para resolver otro de los 3 slots.
      if (!ELECTIVA_SLOTS_COMPARTIDOS.has(slotId)) {
        for (const hija of HIJAS.get(slotId) || []) {
          pendientes.delete(hija.id)
          completadas.add(hija.id)
        }
      }
    }

    // Una vez resueltos los 3 slots del pool compartido, la candidata que
    // haya quedado sin usar ya no hace falta (sólo se piden 3 electivas).
    if ([...ELECTIVA_SLOTS_COMPARTIDOS].every((s) => completadas.has(s))) {
      for (const slotId of ELECTIVA_SLOTS_COMPARTIDOS) {
        for (const hija of HIJAS.get(slotId) || []) {
          if (pendientes.has(hija.id)) {
            pendientes.delete(hija.id)
            completadas.add(hija.id)
          }
        }
      }
    }

    numCuatrimestre++
    primerCuatrimestre = false
  }

  return {
    totalCuatrimestres: cuatrimestres.length,
    materiasCompletadas: materiasYaAprobadas,
    materiasPendientes: pendientes.size,
    cuatrimestres,
  }
}

/**
 * Datos con los que se generó un plan, para poder validar cambios manuales
 * (drag & drop) con las mismas reglas: aprobadas, turnos y oferta.
 */
export function crearContexto({ historia, turnos, ofertaCustom }) {
  return {
    aprobadas: new Set((historia || []).map((h) => normalizeId(h.codigo))),
    turnos: turnos && turnos.length > 0 ? turnos : TURNOS_DEFAULT,
    comisionesPorMateria: ofertaCustom && ofertaCustom.length > 0
      ? buildComisionesFromOferta(ofertaCustom, MATERIAS)
      : COMISIONES_DEFAULT,
  }
}

/**
 * Genera el plan de cursada.
 * @param {object} params
 * @param {Array<{codigo: string}>} params.historia materias aprobadas
 * @param {number} params.maxMaterias tope por cuatrimestre (0 = sin límite)
 * @param {string[]} params.turnos subset de manana/tarde/noche
 * @param {Array|null} params.ofertaCustom oferta parseada del SIU (opcional)
 * @param {number} params.cuatrimestreInicio 1 o 2 (el cuatrimestre del año en que arranca)
 */
export function generarPlan({ historia, maxMaterias = 5, turnos, ofertaCustom, cuatrimestreInicio = 1 }) {
  const max = maxMaterias === 0 ? 0 : Math.max(1, Math.min(maxMaterias, 10))
  const turnosEfectivos = turnos && turnos.length > 0 ? turnos : TURNOS_DEFAULT
  const inicio = Math.max(1, cuatrimestreInicio || 0)
  return generarPlanOptimo(max, historia || [], turnosEfectivos, ofertaCustom, inicio)
}
