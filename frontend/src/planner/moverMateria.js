// Cambios manuales sobre un plan ya generado: mover una materia de cuatrimestre
// (drag & drop) validando correlativas y horarios con las mismas reglas que el
// planificador. Todas las funciones son puras y devuelven planes nuevos.

import {
  getMaterias,
  requisitosDe,
  parseTime,
  hayConflictoHorario,
  comisionPermitidaPorTurno,
  distanciaPrimero,
  buildMateriaAsignada,
} from './planificador'
import { swapMaterias } from '../utils/intercambioPlan'

function locate(plan, materiaId) {
  for (let ci = 0; ci < plan.cuatrimestres.length; ci++) {
    const mi = plan.cuatrimestres[ci].materias.findIndex((m) => m.materiaId === materiaId)
    if (mi >= 0) return { ci, mi, card: plan.cuatrimestres[ci].materias[mi] }
  }
  return null
}

// Primer y último cuatrimestre (índice) donde aparece cada materia. Una anual
// aparece en dos: arranca en el primero y recién se aprueba al final del segundo.
function posiciones(plan, excluirId) {
  const pos = new Map()
  plan.cuatrimestres.forEach((c, ci) => {
    for (const m of c.materias) {
      if (m.materiaId === excluirId) continue
      const p = pos.get(m.materiaId)
      if (p) p.fin = ci
      else pos.set(m.materiaId, { inicio: ci, fin: ci })
    }
  })
  return pos
}

function nombreDe(materiaId, plan) {
  const enPlan = plan && locate(plan, materiaId)
  return enPlan?.card.nombre || getMaterias().get(materiaId)?.nombre || materiaId
}

function horariosDeCard(card) {
  return (card.horarios || []).map((h) => ({
    dia: h.dia,
    horaInicio: parseTime(h.horaInicio),
    horaFin: parseTime(h.horaFin),
  }))
}

// El primer cuatrimestre del plan usa la oferta real (no estimada): ahí una
// materia sin comisiones no se puede cursar.
function esCuatriConOfertaReal(plan, ci) {
  return ci === 0 && plan.cuatrimestres[0]?.materias.some((m) => m.comisionId && !m.estimado)
}

function chequearCorrelativas(plan, materiaId, destino, ctx, pos) {
  for (const req of requisitosDe(materiaId)) {
    if (ctx.aprobadas.has(req)) continue
    const p = pos.get(req)
    if (!p || p.fin >= destino) {
      return `Necesita tener aprobada ${nombreDe(req, plan)} antes`
    }
  }
  for (const [otraId, p] of pos) {
    if (requisitosDe(otraId).includes(materiaId) && p.inicio <= destino) {
      return `${nombreDe(otraId, plan)} la tiene de correlativa y quedaría antes o en el mismo cuatrimestre`
    }
  }
  return null
}

/**
 * Evalúa si una materia se puede mover al cuatrimestre `destino` (índice; si es
 * igual a la cantidad de cuatrimestres, uno nuevo al final).
 * Devuelve { ok: true, comision } (la comisión que entra en ese cuatrimestre, o
 * null si la materia no tiene oferta) o { ok: false, motivo }.
 */
export function evaluarMovimiento(plan, materiaId, destino, ctx) {
  const loc = locate(plan, materiaId)
  if (!loc) return { ok: false, motivo: 'Materia no encontrada en el plan' }
  if (loc.ci === destino) return { ok: false, motivo: null }
  if (loc.card.anual) return { ok: false, motivo: 'Las materias anuales no se pueden mover' }

  const pos = posiciones(plan, materiaId)
  const motivoCorrelativas = chequearCorrelativas(plan, materiaId, destino, ctx, pos)
  if (motivoCorrelativas) return { ok: false, motivo: motivoCorrelativas }

  const otras = (plan.cuatrimestres[destino]?.materias || []).filter((m) => m.materiaId !== materiaId)
  const ocupados = otras.flatMap(horariosDeCard)

  const comisiones = ctx.comisionesPorMateria.get(materiaId) || []
  if (comisiones.length === 0) {
    if (esCuatriConOfertaReal(plan, destino)) {
      return { ok: false, motivo: 'No se dicta este cuatrimestre' }
    }
    return { ok: true, comision: null }
  }

  const candidatas = [...comisiones].sort(distanciaPrimero)
    .filter((c) => comisionPermitidaPorTurno(c, ctx.turnos))
  if (candidatas.length === 0) {
    return { ok: false, motivo: 'No tiene comisiones en los turnos que elegiste' }
  }

  const libres = candidatas.filter((c) => !hayConflictoHorario(c.horarios, ocupados))
  const comision = libres.find((c) => c.comisionId === loc.card.comisionId) || libres[0]
  if (!comision) {
    const choque = otras.find((m) => hayConflictoHorario(candidatas[0].horarios, horariosDeCard(m)))
    return {
      ok: false,
      motivo: choque
        ? `Choca de horario con ${choque.nombre}`
        : 'Ninguna comisión entra en los horarios libres de ese cuatrimestre',
    }
  }
  return { ok: true, comision }
}

/**
 * Mueve la materia al cuatrimestre `destino` si es válido. Devuelve
 * { plan } con el plan nuevo o { error } con el motivo.
 */
export function moverMateria(plan, materiaId, destino, ctx) {
  const ev = evaluarMovimiento(plan, materiaId, destino, ctx)
  if (!ev.ok) return { error: ev.motivo }

  const loc = locate(plan, materiaId)
  const cuatris = plan.cuatrimestres.map((c) => ({ ...c, materias: [...c.materias] }))
  if (destino === cuatris.length) {
    cuatris.push({ numero: cuatris[cuatris.length - 1].numero + 1, materias: [] })
  }

  let card
  if (ev.comision) {
    const materia = getMaterias().get(materiaId)
    card = {
      ...buildMateriaAsignada(materia, ev.comision),
      estimado: !esCuatriConOfertaReal(plan, destino),
      intercambiables: loc.card.intercambiables,
    }
  } else {
    card = { ...loc.card, conflictoCon: null }
  }

  cuatris[loc.ci].materias.splice(loc.mi, 1)
  cuatris[destino].materias.push(card)

  // Si el último cuatrimestre quedó vacío, se termina antes.
  while (cuatris.length > 0 && cuatris[cuatris.length - 1].materias.length === 0) cuatris.pop()

  const nuevo = { ...plan, cuatrimestres: cuatris, totalCuatrimestres: cuatris.length }
  return { plan: normalizarIntercambiables(nuevo, ctx) }
}

// Una materia en su lugar actual cumple correlativas y no choca de horario
// con el resto de su cuatrimestre.
function cardValida(plan, materiaId, ctx) {
  const loc = locate(plan, materiaId)
  if (!loc) return false
  if (chequearCorrelativas(plan, materiaId, loc.ci, ctx, posiciones(plan, materiaId))) return false
  const otras = plan.cuatrimestres[loc.ci].materias.filter((m) => m.materiaId !== materiaId)
  return !hayConflictoHorario(horariosDeCard(loc.card), otras.flatMap(horariosDeCard))
}

/**
 * Tras un cambio manual, los "se puede intercambiar con X" que generó el
 * planificador pueden quedar viejos: actualiza el cuatrimestre de cada pareja
 * y descarta los intercambios que ya no serían válidos.
 */
export function normalizarIntercambiables(plan, ctx) {
  const cuatris = plan.cuatrimestres.map((c, ci) => ({
    ...c,
    materias: c.materias.map((m) => {
      if (!Array.isArray(m.intercambiables) || m.intercambiables.length === 0) return m
      const vigentes = m.intercambiables
        .map((x) => {
          const pareja = locate(plan, x.materiaId)
          if (!pareja || pareja.ci === ci) return null
          const swapped = swapMaterias(plan, m.materiaId, x.materiaId)
          if (!cardValida(swapped, m.materiaId, ctx) || !cardValida(swapped, x.materiaId, ctx)) return null
          return { ...x, cuatrimestre: plan.cuatrimestres[pareja.ci].numero }
        })
        .filter(Boolean)
      return { ...m, intercambiables: vigentes.length > 0 ? vigentes : null }
    }),
  }))
  return { ...plan, cuatrimestres: cuatris }
}
