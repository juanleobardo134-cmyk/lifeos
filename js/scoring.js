// =============================================================
// scoring.js — Cálculo de puntuaciones
// -------------------------------------------------------------
// La puntuación del día (0–100) es la suma de los pesos de los
// hábitos completados. Ejemplo: Lectura (12) + Ejercicio (18) = 30.
// Dividimos entre el total de pesos por si algún día no suman
// exactamente 100.
// =============================================================

const Scoring = {
  dayScore(state, dayKey) {
    const totalWeight = state.habits.reduce((sum, h) => sum + h.weight, 0);
    if (totalWeight === 0) return 0;

    const earned = state.habits
      .filter((h) => Habits.isDone(state, dayKey, h.id))
      .reduce((sum, h) => sum + h.weight, 0);

    return Math.round((earned / totalWeight) * 100);
  },

  // Los 7 días (lunes a domingo) con su puntuación.
  // "reference" es cualquier día de la semana que queremos ver
  // (por defecto, la actual). "today" sirve para saber qué días son futuros.
  week(state, today = new Date(), reference = today) {
    const monday = Dates.startOfWeek(reference);
    const todayKey = Dates.key(today);

    return Array.from({ length: 7 }, (_, i) => {
      const date = Dates.addDays(monday, i);
      const key = Dates.key(date);
      return {
        date,
        key,
        score: Scoring.dayScore(state, key),
        isToday: key === todayKey,
        isFuture: key > todayKey, // las claves "AAAA-MM-DD" se pueden comparar como texto
      };
    });
  },

  // Promedio de los días que ya ocurrieron (no cuenta días futuros).
  weekAverage(days) {
    const past = days.filter((d) => !d.isFuture);
    if (past.length === 0) return 0;
    return Math.round(past.reduce((sum, d) => sum + d.score, 0) / past.length);
  },
};
