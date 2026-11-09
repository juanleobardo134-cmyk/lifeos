// =============================================================
// stats.js — Estadísticas
// -------------------------------------------------------------
// Convierte el historial en números útiles: promedio de la
// semana, cumplimiento, mejor y peor día, y la comparación con
// la semana anterior. Igual que scoring.js, no toca la pantalla.
// =============================================================

const Stats = {
  // Resumen de la semana que contiene la fecha "reference".
  weekSummary(state, reference, today = new Date()) {
    const days = Scoring.week(state, today, reference);
    const past = days.filter((d) => !d.isFuture); // solo los días que ya ocurrieron

    // Mejor y peor día: recorremos los días y nos quedamos con el extremo.
    let best = null;
    let worst = null;
    past.forEach((day) => {
      if (best === null || day.score > best.score) best = day;
      // Hoy no puede ser el "peor día": todavía no ha terminado.
      if (day.isToday && past.length > 1) return;
      if (worst === null || day.score < worst.score) worst = day;
    });

    // Cumplimiento: cuántos hábitos hiciste de todos los que podías hacer.
    // (Aquí todos los hábitos valen igual; en la puntuación cuentan los pesos.)
    const possible = past.length * state.habits.length;
    let completed = 0;
    past.forEach((day) => {
      completed += state.habits.filter((h) => Habits.isDone(state, day.key, h.id)).length;
    });

    // Para cada hábito: qué días lo hiciste (null = día futuro).
    const perHabit = state.habits.map((habit) => {
      const marks = days.map((d) => (d.isFuture ? null : Habits.isDone(state, d.key, habit.id)));
      return { habit, marks, count: marks.filter((m) => m === true).length };
    });

    return {
      days,
      past,
      average: Scoring.weekAverage(days),
      best,
      worst,
      completed,
      possible,
      completion: possible > 0 ? Math.round((completed / possible) * 100) : 0,
      perHabit,
    };
  },

  // Resumen del mes que contiene la fecha "reference".
  monthSummary(state, reference, today = new Date()) {
    const year = reference.getFullYear();
    const month = reference.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate(); // día 0 del mes siguiente = último de este
    const todayKey = Dates.key(today);

    const days = Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(year, month, i + 1);
      const key = Dates.key(date);
      return {
        date,
        key,
        score: Scoring.dayScore(state, key),
        isToday: key === todayKey,
        isFuture: key > todayKey,
      };
    });
    const past = days.filter((d) => !d.isFuture);

    // ¿Cuántos días hiciste cada hábito?
    const perHabit = state.habits.map((habit) => {
      const count = past.filter((d) => Habits.isDone(state, d.key, habit.id)).length;
      const percent = past.length > 0 ? Math.round((count / past.length) * 100) : 0;
      return { habit, count, percent };
    });

    const completed = perHabit.reduce((sum, h) => sum + h.count, 0);
    const possible = past.length * state.habits.length;

    return {
      days,
      past,
      average: Scoring.weekAverage(days), // sirve igual para un mes: promedia los días pasados
      completed,
      possible,
      completion: possible > 0 ? Math.round((completed / possible) * 100) : 0,
      perfectDays: past.filter((d) => d.score === 100).length,
      activeDays: past.filter((d) => d.score > 0).length,
      perHabit,
    };
  },

  // Compara una semana con la anterior.
  compareWithPrevious(state, reference, today = new Date()) {
    const current = Stats.weekSummary(state, reference, today);
    const previous = Stats.weekSummary(state, Dates.addDays(reference, -7), today);
    return { current, previous, diff: current.average - previous.average };
  },
};
