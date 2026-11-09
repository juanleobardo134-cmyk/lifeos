// =============================================================
// habits.js — Lógica de hábitos
// -------------------------------------------------------------
// Funciones que responden preguntas sobre los hábitos:
// ¿está hecho hoy?, marcar/desmarcar, ¿cuántos días de racha?
// No tocan la pantalla ni el almacenamiento: solo trabajan con
// el objeto "state".
// =============================================================

const Habits = {
  // Lista de ids completados en un día (vacía si no hay registro).
  completedOn(state, dayKey) {
    return state.history[dayKey] || [];
  },

  isDone(state, dayKey, habitId) {
    return Habits.completedOn(state, dayKey).includes(habitId);
  },

  // Marca el hábito si estaba pendiente, o lo desmarca si estaba hecho.
  // Solo modifica el día indicado: el resto del historial no se toca.
  toggle(state, dayKey, habitId) {
    const done = Habits.completedOn(state, dayKey);
    state.history[dayKey] = done.includes(habitId)
      ? done.filter((id) => id !== habitId) // quitar
      : [...done, habitId];                 // añadir
  },

  // Cambia los pesos. "weights" es un objeto como { lectura: 12, yoga: 8, ... }
  setWeights(state, weights) {
    state.habits.forEach((habit) => {
      if (weights[habit.id] !== undefined) habit.weight = weights[habit.id];
    });
  },

  // Racha = días seguidos completando el hábito.
  // Si hoy aún no lo has hecho, contamos desde ayer: así la racha
  // no se "rompe" a las 8 de la mañana solo porque el día empezó.
  streak(state, habitId, today = new Date()) {
    let day = today;
    if (!Habits.isDone(state, Dates.key(day), habitId)) {
      day = Dates.addDays(day, -1);
    }
    let count = 0;
    while (Habits.isDone(state, Dates.key(day), habitId)) {
      count++;
      day = Dates.addDays(day, -1);
    }
    return count;
  },
};
