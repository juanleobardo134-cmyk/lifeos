// =============================================================
// app.js — Punto de entrada
// -------------------------------------------------------------
// Es el "director de orquesta": carga los datos, pide a cada
// vista que se dibuje y decide qué pasa al hacer clic.
// =============================================================

const state = Store.load();
let currentDay = Dates.key();

// Vuelve a dibujar todas las vistas con los datos actuales.
function refresh() {
  const now = new Date();
  Dashboard.render(state, now);
  WeekView.render(state, now);
  MonthView.render(state, now);
  SettingsView.render(state);
  RemindersView.render(state);
}

// Se ejecuta al pulsar "Guardar cambios" en Ajustes.
function handleSaveWeights(weights) {
  Habits.setWeights(state, weights);
  Store.save(state);
  refresh();
}

// Se ejecuta cada vez que tocas un hábito.
function handleToggle(habitId) {
  Habits.toggle(state, Dates.key(), habitId); // 1. cambiar los datos
  Store.save(state);                          // 2. guardarlos
  refresh();                                  // 3. volver a dibujar
}

// Se ejecuta al importar un respaldo (ya validado y confirmado).
function handleImport(data) {
  Store.backupCurrent(state);                          // 1. copia de seguridad
  Object.keys(state).forEach((key) => delete state[key]); // 2. vaciamos el objeto...
  Object.assign(state, data);                          // 3. ...y copiamos lo importado
  Store.save(state);
  refresh();
}

// ---------- Navegación entre vistas ----------
// Usamos el "hash" de la dirección: index.html#semana muestra la
// vista Semana. Así el botón "atrás" del navegador también funciona.
const VIEWS = { "#inicio": "home", "#semana": "week", "#mes": "month", "#ajustes": "settings" };

function showView() {
  const view = VIEWS[location.hash] || "home";

  document.querySelectorAll(".view").forEach((section) => {
    section.hidden = section.id !== `view-${view}`;
  });

  document.querySelectorAll("[data-view]").forEach((link) => {
    const active = link.dataset.view === view;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  window.scrollTo(0, 0);
  refresh();
}

Dashboard.mount(handleToggle);
WeekView.mount(refresh);
MonthView.mount(refresh);
SettingsView.mount({
  onSave: handleSaveWeights,
  onExport: () => Store.exportFile(state),
  onImport: handleImport,
});
Notify.mount();
RemindersView.mount(() => Store.save(state));
window.addEventListener("hashchange", showView);
showView();

// Cada 30 segundos:
// 1. Si pasó la medianoche, el nuevo día empieza con todo pendiente.
// 2. Revisamos si toca enviar algún recordatorio.
function tick() {
  if (Dates.key() !== currentDay) {
    currentDay = Dates.key();
    refresh();
  }
  Notify.check(state, new Date());
}

tick();
setInterval(tick, 30 * 1000);

// ---------- App instalable / sin internet ----------
// Registramos el service worker (sw.js). Solo funciona en
// http://localhost o https:// (no al abrir con doble clic).
if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("sw.js").catch((err) => {
    console.warn("Life OS: no se pudo activar el modo sin internet.", err);
  });
}
