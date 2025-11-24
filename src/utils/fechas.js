// src/utils/fechas.js
// Utilidades para formateo de fechas forzando la zona America/Caracas
// Sin dependencias externas (usa Intl)

/**
 * Nota:
 * - Estas utilidades están pensadas para usarse tanto en el frontend (React Native / Expo)
 *   como en el backend (Node.js). Intl con timeZone es usado para forzar la presentación
 *   en America/Caracas. Si tu runtime no soporta timeZone en Intl, considera añadir
 *   una dependencia (luxon / date-fns-tz) o polifill.
 */

const pad = (n, width = 2) => String(n).padStart(width, "0");

/**
 * safeToDate(value)
 * - Normaliza distintos inputs a Date o devuelve null si no es válido.
 */
function safeToDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * formatISOCaracas(isoOrDate, options)
 * - isoOrDate: string ISO (con Z o con offset) o Date object
 * - options: Intl.DateTimeFormat options (por defecto day/month/year + hour/minute)
 * - Devuelve una cadena formateada en 'es-ES' usando timeZone: 'America/Caracas'
 */
export function formatISOCaracas(isoOrDate, options = {}) {
  if (!isoOrDate) return null;
  const d = safeToDate(isoOrDate);
  if (!d) return String(isoOrDate);
  try {
    const defaultOpts = {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Caracas",
    };
    const opts = Object.assign({}, defaultOpts, options);
    return new Intl.DateTimeFormat("es-ES", opts).format(d);
  } catch (e) {
    // Fallback simple
    return d.toLocaleString();
  }
}

/**
 * formatTimeCaracasFromISO(isoOrDate, opts)
 * - Devuelve sólo la hora (ej. "9:49 p. m.") en America/Caracas
 */
export function formatTimeCaracasFromISO(isoOrDate, opts = {}) {
  if (!isoOrDate) return "—";
  const d = safeToDate(isoOrDate);
  if (!d) return String(isoOrDate);
  try {
    const defaultOpts = { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "America/Caracas" };
    const options = Object.assign({}, defaultOpts, opts);
    return new Intl.DateTimeFormat("es-ES", options).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}

/**
 * formatDateFromYYYYMMDDCaracas(yyyyMmDd, options)
 * - Toma una cadena 'YYYY-MM-DD' y la formatea en la zona America/Caracas
 * - options fallback similar a Intl options (weekday, day, month, year, ...)
 */
export function formatDateFromYYYYMMDDCaracas(yyyyMmDd, options = {}) {
  if (!yyyyMmDd) return null;
  try {
    const parts = String(yyyyMmDd).split("-");
    if (parts.length < 3) return String(yyyyMmDd);
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    // Create date as UTC midnight for that day, then format in America/Caracas timeZone
    const d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const defaultOpts = Object.assign({ day: "2-digit", month: "long", year: "numeric", timeZone: "America/Caracas" }, options);
    return new Intl.DateTimeFormat("es-ES", defaultOpts).format(d);
  } catch {
    return String(yyyyMmDd);
  }
}

/* -----------------------------
   Helpers para entradas "tagged" como las que guardamos en BD:
   ej: "[FECHA_CANCELACION:2025-11-23T22:12:59.284-04:00][AUTOR:Paciente] comentario..."
   ----------------------------- */

/**
 * extractTags(entry)
 * - Extrae etiquetas tipo [KEY:VALUE] y flags [FLAG] y devuelve { tags, afterText }
 * - tags: { KEY: VALUE|true }
 * - afterText: texto después de la última etiqueta (trim)
 */
export function extractTags(entry = "") {
  const raw = String(entry || "").trim();
  if (!raw) return { tags: {}, afterText: "" };
  const tagRegex = /\[([A-Z0-9_]+)(?::([^\]]+))?\]/gi;
  let match;
  const tags = {};
  while ((match = tagRegex.exec(raw))) {
    const key = (match[1] || "").toUpperCase();
    const val = match[2] !== undefined ? match[2] : true;
    tags[key] = val;
  }
  const afterLast = raw.slice(raw.lastIndexOf("]") + 1).trim();
  return { tags, afterText: afterLast, raw };
}

/**
 * parseTaggedISO(entry)
 * - Si la entrada contiene una etiqueta de FECHA_* devuelve la ISO encontrada.
 * - Soporta FECHA_CANCELACION, FECHA_APROBACION, FECHA_ATENCION, FECHA.
 */
export function parseTaggedISO(entry = "") {
  const { tags } = extractTags(entry || "");
  const fechaKeys = ["FECHA_APROBACION", "FECHA_CANCELACION", "FECHA_ATENCION", "FECHA"];
  for (const k of fechaKeys) {
    if (tags[k]) {
      const val = tags[k] === true ? null : String(tags[k]);
      return val;
    }
  }
  return null;
}

/**
 * humanizeTaggedEntry(entry)
 * - Convierte una entrada taggeada en un string legible y, si hay fecha ISO, la presenta en Caracas.
 * - Ejemplo:
 *   "[FECHA_CANCELACION:2025-11-23T22:12:59.284-04:00][AUTOR:Paciente] motivo..."
 *   => "Cancelada el 23 de noviembre de 2025, 10:12 p. m. • Paciente — motivo..."
 */
export function humanizeTaggedEntry(entry = "") {
  if (!entry) return "";
  const { tags, afterText, raw } = extractTags(entry);
  // Detectar acción
  let accion = null;
  if (/\[REPROGRAMADA/i.test(raw) || /REPROGRAMADA/i.test(raw)) accion = "Reprogramada";
  else if (/\[FECHA_APROBACION/i.test(raw) || /APROBACION/i.test(raw)) accion = "Aprobada";
  else if (/\[FECHA_CANCELACION/i.test(raw) || /CANCELADA?/i.test(raw)) accion = "Cancelada";
  else if (/\[FECHA_ATENCION/i.test(raw) || /ATENCION/i.test(raw) || /ATENDIDA?/i.test(raw)) accion = "Atendida";

  const fechaISO = parseTaggedISO(raw);
  const fechaHuman = fechaISO ? formatISOCaracas(fechaISO) : null;
  const autor = tags["AUTOR"] ? String(tags["AUTOR"]) : null;
  const fueraHorario = Object.prototype.hasOwnProperty.call(tags, "FUERA_HORARIO");

  const parts = [];
  if (accion) parts.push(accion);
  if (fechaHuman) parts.push(`el ${fechaHuman}`);
  if (autor) parts.push(`• ${autor}`);
  if (fueraHorario) parts.push("(fuera de horario)");

  const header = parts.length ? parts.join(" ") : null;
  const comentario = (afterText || "").trim();

  if (header && comentario) return `${header} — ${comentario}`;
  if (header) return header;
  if (comentario) return comentario;
  // fallback: strip brackets and return raw
  return raw.replace(/\[[^\]]*\]|\{[^}]*\}/g, "").trim();
}

/* -----------------------------
   Utilidades de presentación pequeñas
   ----------------------------- */

/**
 * stripBracketsAndCurly(s)
 * - Quita tags del tipo [...], {...} y limpia exceso de espacios
 */
export function stripBracketsAndCurly(s = "") {
  if (!s) return "";
  return String(s).replace(/\[[^\]]*\]|\{[^}]*\}/g, "").replace(/\s{2,}/g, " ").trim();
}

/* -----------------------------
   Exports (default/nominal)
   ----------------------------- */
export default {
  formatISOCaracas,
  formatTimeCaracasFromISO,
  formatDateFromYYYYMMDDCaracas,
  extractTags,
  parseTaggedISO,
  humanizeTaggedEntry,
  stripBracketsAndCurly,
};