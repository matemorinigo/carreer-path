// Intercambia dos materias entre sus cuatrimestres dentro de un plan.
//
// El backend sólo marca como `intercambiables` a materias que chocan de horario
// pero no bloquean correlativas a futuro, así que mover una al cuatrimestre de la
// otra (y viceversa) no altera el resto del plan: cada card conserva su comisión
// y horario, sólo cambia de cuatrimestre. Devuelve un plan nuevo (inmutable).
export function swapMaterias(plan, idA, idB) {
  if (!plan?.cuatrimestres) return plan

  const cuatris = plan.cuatrimestres.map((c) => ({
    ...c,
    materias: c.materias.map((m) => ({ ...m })),
  }))

  const locate = (id) => {
    for (let ci = 0; ci < cuatris.length; ci++) {
      const mi = cuatris[ci].materias.findIndex((m) => m.materiaId === id)
      if (mi >= 0) return { ci, mi }
    }
    return null
  }

  const locA = locate(idA)
  const locB = locate(idB)
  if (!locA || !locB || locA.ci === locB.ci) return plan

  const cardA = cuatris[locA.ci].materias[locA.mi]
  const cardB = cuatris[locB.ci].materias[locB.mi]

  const numA = cuatris[locA.ci].numero
  const numB = cuatris[locB.ci].numero

  // Tras el swap cada card cae en el cuatrimestre de la otra.
  const cardANuevoNum = numB
  const cardBNuevoNum = numA

  const fixCard = (card, partnerId, partnerNombre, partnerNuevoNum, quedaMasTarde) => {
    if (Array.isArray(card.intercambiables)) {
      card.intercambiables = card.intercambiables.map((x) =>
        x.materiaId === partnerId ? { ...x, cuatrimestre: partnerNuevoNum } : x
      )
    }
    // La que queda en el cuatrimestre más tarde es la "movida por choque".
    card.conflictoCon = quedaMasTarde ? partnerNombre : null
  }

  fixCard(cardA, idB, cardB.nombre, cardBNuevoNum, cardANuevoNum > cardBNuevoNum)
  fixCard(cardB, idA, cardA.nombre, cardANuevoNum, cardBNuevoNum > cardANuevoNum)

  cuatris[locA.ci].materias[locA.mi] = cardB
  cuatris[locB.ci].materias[locB.mi] = cardA

  return { ...plan, cuatrimestres: cuatris }
}
