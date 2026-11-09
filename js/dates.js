// =============================================================
// dates.js — Utilidades de fechas
// -------------------------------------------------------------
// Cada día se identifica con una "clave" de texto: "AAAA-MM-DD".
// Usamos la hora LOCAL (no la UTC) para que el día cambie a la
// medianoche de tu país y no a la de Londres.
// =============================================================

const Dates = {
  // Date -> "2026-11-07"
  key(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0"); // los meses empiezan en 0
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },

  // Devuelve una fecha nueva desplazada n días (n puede ser negativo).
  addDays(date, n) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + n);
    return copy;
  },

  // Lunes de la semana de la fecha dada.
  startOfWeek(date = new Date()) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const daysSinceMonday = (copy.getDay() + 6) % 7; // getDay(): 0 = domingo
    copy.setDate(copy.getDate() - daysSinceMonday);
    return copy;
  },

  // "sábado, 7 de noviembre"
  longLabel(date) {
    return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  },

  // Día 1 del mes desplazado n meses (n = -1 → mes anterior).
  addMonths(date, n) {
    return new Date(date.getFullYear(), date.getMonth() + n, 1);
  },

  // "noviembre 2026"
  monthLabel(date) {
    const month = date.toLocaleDateString("es-ES", { month: "long" });
    return `${month} ${date.getFullYear()}`;
  },

  // "2 nov"
  shortDate(date) {
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
  },

  // "lunes"
  weekdayName(date) {
    return date.toLocaleDateString("es-ES", { weekday: "long" });
  },

  // "sáb"
  shortDay(date) {
    return date.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "").slice(0, 3);
  },
};
