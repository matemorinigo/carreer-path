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
  alternativasDeElectiva,
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
function posiciones(plan, ...excluir) {
  const pos = new Map()
  plan.cuatrimestres.forEach((c, ci) => {
    for (const m of c.materias) {
      if (excluir.includes(m.materiaId)) continue
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
  return elegirComision(plan, materiaId, destino, ctx, otras, loc.card.comisionId)
}

// Comisión con la que `materiaId` entra en el cuatrimestre `destino` junto a
// `otras` (respetando turnos y sin choques). Si la que ya tenía (`preferida`)
// sigue entrando, se conserva. Sin oferta sólo vale en cuatrimestres estimados.
function elegirComision(plan, materiaId, destino, ctx, otras, preferida) {
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
  const comision = libres.find((c) => c.comisionId === preferida) || libres[0]
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

// ── Elegir qué electiva cursar ──

// Card de una electiva puesta en lugar de otra. Arranca sin "movida por
// choque" ni intercambios: esos datos eran de la materia reemplazada.
function cardElectiva(plan, materiaId, ci, comision) {
  const materia = getMaterias().get(materiaId)
  if (!comision) {
    return {
      ...buildMateriaAsignada(materia, { comisionId: null, sede: null, modalidad: null, horarios: [] }),
      horarios: null,
      sinOferta: true,
    }
  }
  return { ...buildMateriaAsignada(materia, comision), estimado: !esCuatriConOfertaReal(plan, ci) }
}

const minusculaInicial = (s) => s.charAt(0).toLowerCase() + s.slice(1)

/**
 * Evalúa cursar la electiva `nuevaId` en lugar de `materiaId` (otra opción que
 * cubre el mismo requisito), en el cuatrimestre donde está esta. Si `nuevaId`
 * ya está en otro cuatrimestre del plan es un intercambio: cada una pasa al
 * lugar de la otra. Devuelve { ok: true, comision, intercambio } (intercambio:
 * null o { comision } de la que se va al otro cuatrimestre) o { ok: false, motivo }.
 */
export function evaluarCambioElectiva(plan, materiaId, nuevaId, ctx) {
  const loc = locate(plan, materiaId)
  if (!loc) return { ok: false, motivo: 'Materia no encontrada en el plan' }
  if (!alternativasDeElectiva(materiaId).some((m) => m.id === nuevaId)) {
    return { ok: false, motivo: 'No es una opción de la misma electiva' }
  }
  if (ctx.aprobadas.has(nuevaId)) return { ok: false, motivo: 'Ya la aprobaste' }

  const otraLoc = locate(plan, nuevaId)
  if (otraLoc?.ci === loc.ci) return { ok: false, motivo: 'Ya la cursás en este mismo cuatrimestre' }

  const pos = posiciones(plan, materiaId, nuevaId)
  const restoDe = (ci) => plan.cuatrimestres[ci].materias
    .filter((m) => m.materiaId !== materiaId && m.materiaId !== nuevaId)

  const motivoCorrelativas = chequearCorrelativas(plan, nuevaId, loc.ci, ctx, pos)
  if (motivoCorrelativas) return { ok: false, motivo: motivoCorrelativas }
  const aca = elegirComision(plan, nuevaId, loc.ci, ctx, restoDe(loc.ci), otraLoc?.card.comisionId)
  if (!aca.ok) return aca
  if (!otraLoc) return { ok: true, comision: aca.comision, intercambio: null }

  const motivoAlla = chequearCorrelativas(plan, materiaId, otraLoc.ci, ctx, pos)
  const alla = motivoAlla
    ? { ok: false, motivo: motivoAlla }
    : elegirComision(plan, materiaId, otraLoc.ci, ctx, restoDe(otraLoc.ci), loc.card.comisionId)
  if (!alla.ok) {
    return { ok: false, motivo: `${loc.card.nombre} no entraría en su lugar: ${minusculaInicial(alla.motivo)}` }
  }
  return { ok: true, comision: aca.comision, intercambio: { comision: alla.comision } }
}

/**
 * Opciones para cambiar la electiva `materiaId` por otra que cubra el mismo
 * requisito (sin las ya aprobadas ni las que ya se cursan en ese mismo
 * cuatrimestre). Cada una trae su evaluación, los horarios con los que
 * quedaría y, si ya está en otro cuatrimestre del plan, el número de ese.
 */
export function opcionesElectiva(plan, materiaId, ctx) {
  const loc = locate(plan, materiaId)
  if (!loc) return []
  return alternativasDeElectiva(materiaId)
    .filter((m) => !ctx.aprobadas.has(m.id))
    .map((m) => ({ m, otra: locate(plan, m.id) }))
    .filter(({ otra }) => otra?.ci !== loc.ci)
    .map(({ m, otra }) => {
      const ev = evaluarCambioElectiva(plan, materiaId, m.id, ctx)
      const preview = ev.ok ? cardElectiva(plan, m.id, loc.ci, ev.comision) : null
      return {
        materiaId: m.id,
        nombre: m.nombre,
        ok: ev.ok,
        motivo: ev.ok ? null : ev.motivo,
        horarios: preview?.horarios ?? null,
        modalidad: preview?.modalidad ?? null,
        enCuatrimestre: otra ? plan.cuatrimestres[otra.ci].numero : null,
      }
    })
}

/**
 * Cursa la electiva `nuevaId` en lugar de `materiaId` (o las intercambia si
 * `nuevaId` ya estaba en otro cuatrimestre). Devuelve { plan } o { error }.
 */
export function cambiarElectiva(plan, materiaId, nuevaId, ctx) {
  const ev = evaluarCambioElectiva(plan, materiaId, nuevaId, ctx)
  if (!ev.ok) return { error: ev.motivo }

  const loc = locate(plan, materiaId)
  const otra = locate(plan, nuevaId)
  const cuatris = plan.cuatrimestres.map((c) => ({ ...c, materias: [...c.materias] }))
  cuatris[loc.ci].materias[loc.mi] = cardElectiva(plan, nuevaId, loc.ci, ev.comision)
  if (ev.intercambio) {
    cuatris[otra.ci].materias[otra.mi] = cardElectiva(plan, materiaId, otra.ci, ev.intercambio.comision)
  }

  return { plan: normalizarIntercambiables({ ...plan, cuatrimestres: cuatris }, ctx) }
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
