// =============================================================
// weekView.js — Interfaz de la vista "Semana"
// -------------------------------------------------------------
// Dibuja las estadísticas semanales. Las flechas ‹ › permiten
// moverse a semanas anteriores (offset = cuántas semanas atrás).
// =============================================================

const WeekView = {
  offset: 0, // 0 = esta semana, 1 = la pasada, 2 = hace dos...
  els: {},

  mount(onChange) {
    const $ = (id) => document.getElementById(id);
    this.els = {
      title: $("week-title"),
      range: $("week-range"),
      prev: $("week-prev"),
      next: $("week-next"),
      score: $("w-score"),
      compare: $("w-compare"),
      completion: $("w-completion"),
      completionSub: $("w-completion-sub"),
      best: $("w-best"),
      bestSub: $("w-best-sub"),
      worst: $("w-worst"),
      worstSub: $("w-worst-sub"),
      chart: $("w-chart"),
      habits: $("w-habits"),
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
    const reference = Dates.addDays(now, -7 * this.offset);
    const { current, previous, diff } = Stats.compareWithPrevious(state, reference, now);

    this.renderHeader(current);
    this.renderKpis(current, diff);
    this.renderChart(current, previous);
    this.renderHabits(current);
  },

  renderHeader(current) {
    const titles = ["Esta semana", "Semana pasada"];
    this.els.title.textContent = titles[this.offset] || `Hace ${this.offset} semanas`;
    const monday = current.days[0].date;
    const sunday = current.days[6].date;
    this.els.range.textContent = `${Dates.shortDate(monday)} – ${Dates.shortDate(sunday)}`;
    this.els.next.disabled = this.offset === 0; // no hay semanas futuras
  },

  renderKpis(current, diff) {
    this.els.score.textContent = current.average;

    // Comparación: ▲ verde si mejoraste, ▼ rojo si bajaste.
    const compare = this.els.compare;
    compare.classList.toggle("up", diff > 0);
    compare.classList.toggle("down", diff < 0);
    if (diff > 0) compare.textContent = `▲ +${diff} vs semana anterior`;
    else if (diff < 0) compare.textContent = `▼ ${diff} vs semana anterior`;
    else compare.textContent = "Igual que la semana anterior";

    this.els.completion.textContent = `${current.completion}%`;
    this.els.completionSub.textContent = `${current.completed} de ${current.possible} hábitos`;

    const { best, worst } = current;
    if (best === null || best.score === 0) {
      this.showDay(this.els.best, this.els.bestSub, null, "Sin registros aún");
      this.showDay(this.els.worst, this.els.worstSub, null, "Sin registros aún");
    } else if (best.score === worst.score) {
      this.showDay(this.els.best, this.els.bestSub, best, `${best.score} puntos`);
      this.showDay(this.els.worst, this.els.worstSub, null, "Todos los días igual");
    } else {
      this.showDay(this.els.best, this.els.bestSub, best, `${best.score} puntos`);
      this.showDay(this.els.worst, this.els.worstSub, worst, `${worst.score} puntos`);
    }
  },

  // Pequeña ayuda para no repetir código: nombre del día + texto debajo.
  showDay(valueEl, subEl, day, subText) {
    valueEl.textContent = day ? Dates.weekdayName(day.date) : "—";
    subEl.textContent = subText;
  },

  // Gráfica de barras dobles: semana anterior (gris) vs esta semana (color).
  renderChart(current, previous) {
    const chart = this.els.chart;
    chart.innerHTML = current.days.map((day, i) => {
      const before = previous.days[i];
      const now = day.isFuture ? 0 : day.score;
      return `
        <div class="cbar ${day.isToday ? "today" : ""}"
             title="${Dates.weekdayName(day.date)}: ${day.isFuture ? "–" : now} · anterior: ${before.score}">
          <div class="cbar-pair">
            <div class="cbar-track"><div class="cbar-fill prev" data-h="${before.score}"></div></div>
            <div class="cbar-track"><div class="cbar-fill" data-h="${now}"></div></div>
          </div>
          <span class="bar-day">${Dates.shortDay(day.date)}</span>
        </div>`;
    }).join("");

    // Forzamos al navegador a "pintar" las barras con altura 0 y luego
    // les damos su altura real: así la transición CSS las anima creciendo.
    void chart.offsetHeight;
    chart.querySelectorAll("[data-h]").forEach((el) => {
      el.style.height = `${el.dataset.h}%`;
    });
  },

  // Tabla: cada hábito con un punto por día (lleno = hecho).
  renderHabits(current) {
    const letters = ["L", "M", "X", "J", "V", "S", "D"];
    const header = `
      <li class="hrow head">
        <span></span>
        <span class="hrow-dots">${letters.map((l) => `<span>${l}</span>`).join("")}</span>
        <span class="hrow-count">Total</span>
      </li>`;

    const rows = current.perHabit.map(({ habit, marks, count }) => `
      <li class="hrow" style="--habit-color: ${escapeHTML(habit.color)}">
        <span class="hrow-name">
          <span class="hrow-icon" aria-hidden="true">${escapeHTML(habit.icon)}</span>
          <span class="hrow-label">${escapeHTML(habit.name)}</span>
        </span>
        <span class="hrow-dots">
          ${marks.map((m) => `<span class="dot ${m === null ? "future" : m ? "on" : ""}"></span>`).join("")}
        </span>
        <span class="hrow-count">${count}/${current.past.length}</span>
      </li>`).join("");

    this.els.habits.innerHTML = header + rows;
  },
};
