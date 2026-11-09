// =============================================================
// remindersView.js — Tarjeta "Recordatorios" (vista Ajustes)
// -------------------------------------------------------------
// A diferencia de los pesos, aquí NO hay borrador: cada cambio
// se guarda al instante, porque no hay ninguna regla que pueda
// quedar "a medias" (como la suma de 100).
// =============================================================

const MAX_REMINDERS = 6;

const RemindersView = {
  els: {},
  reminders: null, // apunta a state.reminders (el mismo objeto, no una copia)

  mount(onChange) {
    const $ = (id) => document.getElementById(id);
    this.els = {
      permission: $("r-permission"),
      permissionBtn: $("r-permission-btn"),
      enabled: $("r-enabled"),
      body: $("r-body"),
      times: $("r-times"),
      add: $("r-add"),
      close: $("r-close"),
      test: $("r-test"),
    };
    this.onChange = onChange;

    this.els.permissionBtn.addEventListener("click", async () => {
      await Notify.requestPermission();
      this.renderPermission();
    });

    this.els.enabled.addEventListener("change", () => {
      this.reminders.enabled = this.els.enabled.checked;
      this.save(true);
    });

    // Cambiar una hora: guardamos sin redibujar (para no perder el foco al escribir).
    this.els.times.addEventListener("change", (event) => {
      const input = event.target.closest("[data-index]");
      if (!input) return;
      this.reminders.times[Number(input.dataset.index)] = input.value;
      this.save(false);
    });

    // Quitar una hora.
    this.els.times.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      this.reminders.times.splice(Number(button.dataset.remove), 1); // splice quita 1 elemento
      this.save(true);
    });

    this.els.add.addEventListener("click", () => {
      if (this.reminders.times.length >= MAX_REMINDERS) return;
      this.reminders.times.push("12:00");
      this.save(true);
    });

    this.els.close.addEventListener("change", () => {
      this.reminders.closeTime = this.els.close.value;
      this.save(false);
    });

    this.els.test.addEventListener("click", () => {
      Notify.show("Así se verán tus avisos", "Te faltan 3: Yoga, Dibujo, Aprender inglés");
    });
  },

  render(state) {
    this.reminders = state.reminders;
    this.renderPermission();
    this.renderTimes();
    this.els.enabled.checked = this.reminders.enabled;
    this.els.close.value = this.reminders.closeTime || "";
    this.els.body.classList.toggle("is-off", !this.reminders.enabled);
  },

  renderPermission() {
    const messages = {
      granted: ["ok", "✓ Notificaciones del sistema activadas."],
      default: ["", "Activa las notificaciones para recibir avisos aunque la pestaña esté minimizada."],
      denied: ["error", "Bloqueadas en este navegador. Para permitirlas, haz clic en el icono junto a la dirección (arriba) y activa «Notificaciones»."],
      insecure: ["warn", "Para notificaciones del sistema abre Life OS con iniciar.bat (http://localhost:5500). Mientras tanto verás los avisos dentro de la app."],
      unsupported: ["warn", "Tu navegador no admite notificaciones. Verás los avisos dentro de la app."],
    };
    const [type, text] = messages[Notify.status()];
    this.els.permission.className = `status ${type}`;
    this.els.permission.textContent = text;
    this.els.permissionBtn.hidden = Notify.status() !== "default";
  },

  renderTimes() {
    this.els.times.innerHTML = this.reminders.times.map((time, i) => `
      <li class="time-row">
        <input type="time" class="time-input" value="${escapeHTML(time)}" data-index="${i}"
               aria-label="Hora del recordatorio ${i + 1}">
        <button type="button" class="icon-btn small" data-remove="${i}"
                aria-label="Quitar recordatorio de las ${escapeHTML(time)}">×</button>
      </li>`).join("");
    this.els.add.disabled = this.reminders.times.length >= MAX_REMINDERS;
  },

  // Limpia, ordena, guarda y (si hace falta) vuelve a dibujar.
  save(redraw) {
    this.reminders.times = this.reminders.times.filter((t) => t !== ""); // fuera horas vacías
    if (redraw) {
      this.reminders.times.sort(); // "08:00" < "14:30" funciona también como texto
      this.render({ reminders: this.reminders });
    }
    this.onChange();
  },
};
