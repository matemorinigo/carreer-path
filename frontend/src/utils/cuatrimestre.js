export function getCuatrimestreInicioActual() {
  const month = new Date().getMonth()
  return month >= 6 ? 2 : 1
}
