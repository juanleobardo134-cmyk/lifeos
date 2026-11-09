// =============================================================
// monthView.js — Interfaz de la vista "Mes"
// -------------------------------------------------------------
// Dibuja: calendario de actividad, días por hábito y la gráfica
// de evolución del mes. Las flechas ‹ › cambian de mes.
// =============================================================

const MonthView = {
  offset: 0, // 0 = este mes, 1 = el mes pasado...
  els: {},

  mount(onChange) {
    const $ = (id) => document.getElementById(id);
    this.els = {
      subtitle: $("month-subtitle"),
      title: $("month-title"),
      prev: $("month-prev"),
      next: $("month-next"),
      score: $("m-score"),
      compare: $("m-compare"),
      completion: $("m-completion"),
      completionSub: $("m-completion-sub"),
      perfect: $("m-perfect"),
      active: $("m-active"),
      activeSub: $("m-active-sub"),
      calendar: $("m-calendar"),
      habits: $("m-habits"),
      evolution: $("m-evolution"),
    };

    this.els.prev.addEventListener("click", () => {
      this.offset++;
      onChange();
    });
    this.els.next.addEventListener("click", () => {
      if (this.offset > 0) {
        this.offset--;
        onChange();
      }
    });
  },

  render(state, now = new Date()) {
    const reference = Dates.addMonths(now, -this.offset);
    const current = Stats.monthSummary(state, reference, now);
    const previous = Stats.monthSummary(state, Dates.addMonths(reference, -1), now);

    this.renderHeader(reference);
    this.renderKpis(current, current.average - previous.average);
    this.renderCalendar(current);
    this.renderHabits(current);
    this.renderEvolution(current);
  },

  renderHeader(reference) {
    const subtitles = ["Este mes", "Mes pasado"];
    this.els.subtitle.textContent = subtitles[this.offset] || `Hace ${this.offset} meses`;
    this.els.title.textContent = Dates.monthLabel(reference);
    this.els.next.disabled = this.offset === 0;
  },

  renderKpis(current, diff) {
    this.els.score.textContent = current.average;

    const compare = this.els.compare;
    compare.classList.toggle("up", diff > 0);
    compare.classList.toggle("down", diff < 0);
    if (diff > 0) compare.textContent = `▲ +${diff} vs mes anterior`;
    else if (diff < 0) compare.textContent = `▼ ${diff} vs mes anterior`;
    else compare.textContent = "Igual que el mes anterior";

    this.els.completion.textContent = `${current.completion}%`;
    this.els.completionSub.textContent = `${current.completed} de ${current.possible} hábitos`;
    this.els.perfect.textContent = current.perfectDays;
    this.els.active.textContent = current.activeDays;
    this.els.activeSub.textContent = `de ${current.past.length} días`;
  },

  // Calendario tipo "mapa de calor": más color = mejor día.
  renderCalendar(current) {
    const letters = ["L", "M", "X", "J", "V", "S", "D"];
    const firstDay = current.days[0].date;
    const blanks = (firstDay.getDay() + 6) % 7; // huecos antes del día 1 (la semana empieza en lunes)

    const head = letters.map((l) => `<span class="cal-head">${l}</span>`).join("");
    const empty = `<span class="cal-cell empty"></span>`.repeat(blanks);
    const cells = current.days.map((day) => {
      const level = day.isFuture ? "future" : heatLevel(day.score);
      const label = day.isFuture ? "sin datos" : `${day.score} puntos`;
      return `<span class="cal-cell lvl-${level} ${day.isToday ? "today" : ""}"
                    title="${day.date.getDate()}: ${label}">${day.date.getDate()}</span>`;
    }).join("");

    this.els.calendar.innerHTML = head + empty + cells;
  },

  // Barras horizontales: cuántos días hiciste cada hábito (de más a menos).
  renderHabits(current) {
    // slice() hace una copia: así sort() no desordena la lista original.
    const sorted = current.perHabit.slice().sort((a, b) => b.count - a.count);

    this.els.habits.innerHTML = sorted.map(({ habit, count, percent }) => `
      <li class="mrow" style="--habit-color: ${escapeHTML(habit.color)}">
        <div class="mrow-top">
          <span class="hrow-name">
            <span class="hrow-icon" aria-hidden="true">${escapeHTML(habit.icon)}</span>
            <span class="hrow-label">${escapeHTML(habit.name)}</span>
          </span>
          <span class="mrow-count">${count} ${count === 1 ? "día" : "días"} · ${percent}%</span>
        </div>
        <div class="mrow-track"><div class="mrow-fill" data-w="${percent}"></div></div>
      </li>`).join("");

    void this.els.habits.offsetHeight; // ver la explicación en weekView.js
    this.els.habits.querySelectorAll("[data-w]").forEach((el) => {
      el.style.width = `${el.dataset.w}%`;
    });
  },

  // Gráfica de línea: la puntuación de cada día del mes.
  renderEvolution(current) {
    const W = 600;
    const H = 200;
    const n = current.days.length;
    const x = (i) => (n > 1 ? (i / (n - 1)) * W : 0); // día → posición horizontal
    const y = (score) => H - (score / 100) * H;       // puntos → posición vertical (0 abajo)

    const points = current.past.map((d, i) => `${x(i).toFixed(1)},${y(d.score).toFixed(1)}`);
    if (points.length === 0) {
      this.els.evolution.innerHTML = `<p class="kpi-sub">Aún no hay datos este mes.</p>`;
      return;
    }

    const last = current.past.length - 1;
    const line = `M${points.join(" L")}`;
    const area = `${line} L${x(last).toFixed(1)},${H} L0,${H} Z`; // cerramos la figura por abajo

    // Etiquetas de días: 1, 8, 15, 22 y el último.
    const labelDays = [1, 8, 15, 22, n];
    const labels = labelDays.map((d) =>
      `<span style="left: ${(x(d - 1) / W) * 100}%">${d}</span>`).join("");

    const lastScore = current.past[last].score;
    this.els.evolution.innerHTML = `
      <div class="evo-plot">
        <span class="evo-y" style="top: 0%">100</span>
        <span class="evo-y" style="top: 50%">50</span>
        <span class="evo-y" style="top: 100%">0</span>
        <svg class="evo-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="evoArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#60a5fa" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="evoLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#34d399"/>
              <stop offset="50%" stop-color="#60a5fa"/>
              <stop offset="100%" stop-color="#a78bfa"/>
            </linearGradient>
          </defs>
          <line class="evo-grid" x1="0" y1="0" x2="${W}" y2="0"/>
          <line class="evo-grid" x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}"/>
          <line class="evo-grid" x1="0" y1="${H}" x2="${W}" y2="${H}"/>
          <path d="${area}" fill="url(#evoArea)"/>
          <path class="evo-line" d="${line}"/>
        </svg>
        <span class="evo-dot" style="left: ${(x(last) / W) * 100}%; top: ${(y(lastScore) / H) * 100}%"
              title="Día ${last + 1}: ${lastScore} puntos"></span>
      </div>
      <div class="evo-x">${labels}</div>`;
  },
};

// Puntuación → nivel de color del calendario (0 = vacío, 4 = día perfecto).
function heatLevel(score) {
  if (score === 0) return 0;
  if (score < 40) return 1;
  if (score < 70) return 2;
  if (score < 100) return 3;
  return 4;
}
