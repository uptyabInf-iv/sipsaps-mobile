// src/components/citas/apartado-medico/validacionesFechas.js
export function esFechaPasada(date) {
  if (!date) return false;
  const ahora = new Date();
  return date.getTime() < ahora.getTime();
}

export function existeSolapamiento(citas, nuevoInicio, nuevoFin, excluirId = null) {
  if (!Array.isArray(citas)) return false;
  for (const c of citas) {
    if (!c.fechaSolicitud) continue;
    if (excluirId && c.id === excluirId) continue;
    const inicioExistente = new Date(c.fechaSolicitud);
    const finExistente = new Date(inicioExistente.getTime() + 30 * 60 * 1000);
    if (nuevoInicio < finExistente && nuevoFin > inicioExistente) return true;
  }
  return false;
}