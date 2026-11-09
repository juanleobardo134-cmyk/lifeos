// =============================================================
// dashboard.js — Interfaz del Dashboard
// -------------------------------------------------------------
// Toma el "state" y lo dibuja en la pantalla. Es la única parte
// que toca el HTML. No guarda nada: cuando haces clic en un
// hábito, avisa a app.js (onToggle) y app.js decide qué hacer.
// =============================================================

const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS; // perímetro del círculo

// Evita que un texto se interprete como HTML (seguridad básica).
function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

const Dashboard = {
  els: {}, // referencias a los elementos del HTML

  // Se llama una sola vez: busca los elementos y conecta los clics.
  mount(onToggle) {
    const $ = (id) => document.getElementById(id);
    this.els = {
      date: $("today-date"),
      greeting: $("greeting"),
      ring: $("ring-progress"),
      ringValue: $("ring-value"),
      done: $("stat-done"),
      pending: $("stat-pending"),
      streak: $("stat-streak"),
      message: $("score-message"),
      bars: $("week-bars"),
      weekAvg: $("week-avg"),
      list: $("habit-list"),
      habitsCount: $("habits-count"),
    };

    this.els.ring.style.strokeDasharray = RING_LENGTH;
    this.els.ring.style.strokeDashoffset = RING_LENGTH;

    // "Delegación de eventos": un solo escuchador para toda la lista.
    this.els.list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-habit]");
      if (button) onToggle(button.dataset.habit);
    });
  },

  // Dibuja todo el dashboard.
  render(state, now = new Date()) {
    const todayKey = Dates.key(now);
    this.renderHeader(now);
    this.renderScore(state, todayKey, now);
    this.renderWeek(state, now);
    this.renderHabits(state, todayKey, now);
  },

  renderHeader(now) {
    const hour = now.getHours();
    const greeting = hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
    this.els.greeting.textContent = greeting;
    this.els.date.textContent = Dates.longLabel(now);
  },

  renderScore(state, todayKey, now) {
    const score = Scoring.dayScore(state, todayKey);
    const total = state.habits.length;
    const done = state.habits.filter((h) => Habits.isDone(state, todayKey, h.id)).length;
    const bestStreak = Math.max(0, ...state.habits.map((h) => Habits.streak(state, h.id, now)));

    // El anillo: cuanto mayor la puntuación, menos "hueco" (offset) queda.
    const offset = RING_LENGTH * (1 - score / 100);
    requestAnimationFrame(() => { this.els.ring.style.strokeDashoffset = offset; });
    animateNumber(this.els.ringValue, score);

    this.els.done.textContent = `${done}/${total}`;
    this.els.pending.textContent = total - done;
    this.els.streak.textContent = `${bestStreak} ${bestStreak === 1 ? "día" : "días"}`;
    this.els.message.textContent = scoreMessage(score);
  },

  renderWeek(state, now) {
    const days = Scoring.week(state, now);
    const bars = this.els.bars;

    // Creamos las 7 barras solo la primera vez; después solo las actualizamos
    // (así la altura cambia con una animación en vez de "saltar").
    if (bars.children.length === 0) {
      bars.innerHTML = days.map(() => `
        <div class="bar">
          <span class="bar-score"></span>
          <div class="bar-track"><div class="bar-fill"></div></div>
          <span class="bar-day"></span>
        </div>`).join("");
    }

    days.forEach((day, i) => {
      const bar = bars.children[i];
      bar.classList.toggle("today", day.isToday);
      bar.classList.toggle("future", day.isFuture);
      bar.querySelector(".bar-score").textContent = day.isFuture ? "–" : day.score;
      bar.querySelector(".bar-day").textContent = Dates.shortDay(day.date);
      const fill = bar.querySelector(".bar-fill");
      requestAnimationFrame(() => { fill.style.height = `${day.score}%`; });
    });

    this.els.weekAvg.textContent = `Promedio ${Scoring.weekAverage(days)}`;
  },

  renderHabits(state, todayKey, now) {
    const list = this.els.list;

    if (list.children.length !== state.habits.length) {
      list.innerHTML = state.habits.map((h) => `
        <li>
          <button type="button" class="habit" data-habit="${escapeHTML(h.id)}"
                  style="--habit-color: ${escapeHTML(h.color)}" aria-pressed="false">
            <span class="habit-icon" aria-hidden="true">${escapeHTML(h.icon)}</span>
            <span class="habit-info">
              <span class="habit-name">${escapeHTML(h.name)}</span>
              <span class="habit-meta"></span>
            </span>
            <span class="habit-check" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
          </button>
        </li>`).join("");
    }

    let doneCount = 0;
    state.habits.forEach((h, i) => {
      const button = list.children[i].querySelector(".habit");
      const done = Habits.isDone(state, todayKey, h.id);
      const streak = Habits.streak(state, h.id, now);
      if (done) doneCount++;

      button.classList.toggle("done", done);
      button.setAttribute("aria-pressed", String(done));
      button.querySelector(".habit-meta").textContent =
        `${h.weight}% · ${streak > 0 ? `🔥 ${streak} ${streak === 1 ? "día" : "días"}` : "Sin racha"}`;
    });

    this.els.habitsCount.textContent = `${doneCount} de ${state.habits.length} completados`;
  },
};

// Frase motivadora según la puntuación.
function scoreMessage(score) {
  if (score === 0) return "Tu día empieza aquí. Marca tu primer hábito.";
  if (score < 40) return "Buen comienzo. Cada hábito suma.";
  if (score < 70) return "Vas por buen camino.";
  if (score < 100) return "¡Casi lo logras! Un último empujón.";
  return "¡Día perfecto! 🎉";
}

// Cuenta desde el número actual hasta el nuevo en ~0,7 s.
function animateNumber(element, target) {
  const from = Number(element.textContent) || 0;
  const start = performance.now();
  const duration = 700;

  function step(time) {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // empieza rápido, termina suave
    element.textContent = Math.round(from + (target - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
