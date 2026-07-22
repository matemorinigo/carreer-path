export function getCuatrimestreInicioActual() {
  const month = new Date().getMonth()
  return month >= 6 ? 2 : 1
}

// Etiqueta corta ("1º cuatri 2027") para un cuatrimestre del plan, donde `numero`
// es el índice 1-based dentro del plan generado (1 = el cuatrimestre de inicio).
export function cuatriLabelCorto(numero, cuatrimestreInicio = 1, baseYear) {
  const startYear = baseYear || new Date().getFullYear()
  const cuatrimestreReal = cuatrimestreInicio + numero - 1
  const year = startYear + Math.floor((cuatrimestreReal - 1) / 2)
  const half = cuatrimestreReal % 2 === 1 ? 1 : 2
  return `${half}º cuatri ${year}`
}
