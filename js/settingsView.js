// =============================================================
// settingsView.js — Interfaz de la vista "Ajustes"
// -------------------------------------------------------------
// Permite cambiar el peso de cada hábito y exportar tus datos.
//
// Idea clave: trabajamos sobre un BORRADOR ("draft"). Mover un
// control no cambia tus datos reales; solo al pulsar "Guardar"
// (y si todo suma 100) se aplican los cambios.
// =============================================================

const SettingsView = {
  els: {},
  habits: [], // lista de hábitos (para nombres, iconos y colores)
  saved: {},  // pesos guardados   → { lectura: 12, ... }
  draft: {},  // pesos en edición  → { lectura: 15, ... }

  mount({ onSave, onExport, onImport }) {
    const $ = (id) => document.getElementById(id);
    this.els = {
      weights: $("s-weights"),
      total: $("s-total"),
      bar: $("s-total-bar"),
      status: $("s-status"),
      save: $("s-save"),
      reset: $("s-reset"),
      toast: $("s-toast"),
      days: $("s-days"),
      since: $("s-since"),
      export: $("s-export"),
      importBtn: $("s-import"),
      importFile: $("s-import-file"),
      dataMsg: $("s-data-msg"),
    };

    // Al mover cualquier control, actualizamos el borrador.
    this.els.weights.addEventListener("input", (event) => {
      const slider = event.target.closest("[data-weight]");
      if (!slider) return;
      this.draft[slider.dataset.weight] = Number(slider.value); // el valor llega como texto
      this.update();
    });

    this.els.save.addEventListener("click", () => {
      if (this.total() !== 100) return; // doble seguridad
      onSave({ ...this.draft });
      this.showToast("Cambios guardados ✓");
    });

    this.els.reset.addEventListener("click", () => {
      DEFAULT_HABITS.forEach((h) => { this.draft[h.id] = h.weight; });
      this.update();
    });

    this.els.export.addEventListener("click", onExport);

    // El botón bonito "abre" el selector de archivos, que está oculto.
    this.els.importBtn.addEventListener("click", () => this.els.importFile.click());

    this.els.importFile.addEventListener("change", async () => {
      const file = this.els.importFile.files[0];
      this.els.importFile.value = ""; // permite elegir el mismo archivo otra vez
      if (!file) return;

      try {
        const data = Store.parseBackup(await file.text()); // await = esperar a leer el archivo
        const days = Object.values(data.history).filter((ids) => ids.length > 0).length;
        const ok = confirm(
          `¿Reemplazar tus datos actuales por este respaldo (${days} días registrados)?\n\n` +
          "Antes se guardará una copia interna de tus datos actuales."
        );
        if (!ok) return;
        onImport(data);
        this.showDataMessage("ok", `Respaldo importado ✓ (${days} días)`);
      } catch (err) {
        this.showDataMessage("error", err.message);
      }
    });
  },

  showDataMessage(type, text) {
    this.els.dataMsg.className = `status ${type}`;
    this.els.dataMsg.textContent = text;
  },

  // Se llama al entrar en la vista: el borrador vuelve a los pesos guardados.
  render(state) {
    this.habits = state.habits;
    this.saved = {};
    state.habits.forEach((h) => { this.saved[h.id] = h.weight; });
    this.draft = { ...this.saved }; // copia: si cambia el borrador, "saved" no se toca

    this.buildRows();
    this.update();
    this.renderData(state);
  },

  // Crea una fila por hábito y un segmento de la barra total (solo una vez).
  buildRows() {
    if (this.els.weights.children.length === this.habits.length) return;

    this.els.weights.innerHTML = this.habits.map((h) => `
      <li class="wrow" style="--habit-color: ${escapeHTML(h.color)}">
        <span class="hrow-name">
          <span class="hrow-icon" aria-hidden="true">${escapeHTML(h.icon)}</span>
          <span class="hrow-label">${escapeHTML(h.name)}</span>
        </span>
        <input type="range" min="0" max="40" step="1"
               data-weight="${escapeHTML(h.id)}" aria-label="Peso de ${escapeHTML(h.name)}">
        <output class="wrow-value" data-value="${escapeHTML(h.id)}"></output>
      </li>`).join("");

    this.els.bar.innerHTML = this.habits.map((h) =>
      `<span class="total-seg" data-seg="${escapeHTML(h.id)}" style="--habit-color: ${escapeHTML(h.color)}"></span>`
    ).join("");
  },

  total() {
    return Object.values(this.draft).reduce((sum, w) => sum + w, 0);
  },

  // Refleja el borrador en pantalla: controles, valores, barra, total y botones.
  update() {
    this.habits.forEach((h) => {
      const weight = this.draft[h.id];
      this.els.weights.querySelector(`[data-weight="${h.id}"]`).value = weight;
      this.els.weights.querySelector(`[data-value="${h.id}"]`).textContent = `${weight}%`;
      this.els.bar.querySelector(`[data-seg="${h.id}"]`).style.width = `${weight}%`;
    });

    const total = this.total();
    const changed = this.habits.some((h) => this.draft[h.id] !== this.saved[h.id]);
    const status = this.els.status;

    this.els.total.textContent = `${total}%`;
    status.classList.remove("ok", "warn", "error");

    if (total === 100) {
      status.classList.add("ok");
      status.textContent = changed ? "Suma 100%. Ya puedes guardar." : "Suma 100% ✓";
    } else if (total < 100) {
      status.classList.add("warn");
      status.textContent = `Faltan ${100 - total}% para llegar a 100`;
    } else {
      status.classList.add("error");
      status.textContent = `Sobran ${total - 100}%`;
    }

    // Solo se puede guardar si suma 100 Y hay algo nuevo que guardar.
    this.els.save.disabled = total !== 100 || !changed;
  },

  renderData(state) {
    const days = Object.keys(state.history)
      .filter((key) => state.history[key].length > 0)
      .sort(); // "AAAA-MM-DD" se ordena bien como texto

    this.els.days.textContent = days.length;
    if (days.length === 0) {
      this.els.since.textContent = "—";
    } else {
      const [y, m, d] = days[0].split("-").map(Number);
      this.els.since.textContent = Dates.shortDate(new Date(y, m - 1, d));
    }
  },

  // Mensaje temporal que desaparece a los 2,5 segundos.
  showToast(message) {
    this.els.toast.textContent = message;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.els.toast.textContent = ""; }, 2500);
  },
};
