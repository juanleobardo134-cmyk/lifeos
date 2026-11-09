// =============================================================
// notifications.js — Recordatorios y avisos
// -------------------------------------------------------------
// Cada 30 segundos app.js llama a Notify.check(). Si es la hora
// de un recordatorio (y no se envió ya hoy), mostramos:
//   1. Un aviso DENTRO de la app (siempre funciona).
//   2. Una notificación del sistema (solo si diste permiso).
//
// Límite: una página web solo puede avisarte mientras está
// abierta en alguna pestaña (aunque esté minimizada).
// =============================================================

const FIRED_KEY = "lifeos.fired"; // qué avisos ya se enviaron hoy
const WINDOW_MINUTES = 15;        // margen para enviar un aviso que llegó "tarde"

const Notify = {
  bannerTimer: null,

  // Conecta el botón × del aviso interno.
  mount() {
    document.getElementById("banner-close").addEventListener("click", () => this.hideBanner());
  },

  // Estado del permiso: "granted" (sí), "denied" (bloqueado), "default" (sin decidir),
  // "insecure" (abierto con doble clic) o "unsupported" (navegador sin soporte).
  status() {
    if (!("Notification" in window)) return "unsupported";
    if (!window.isSecureContext) return "insecure";
    return Notification.permission;
  },

  // Pide permiso al navegador. "async/await" = esperar la respuesta del usuario.
  async requestPermission() {
    if (this.status() === "default") {
      await Notification.requestPermission();
    }
    return this.status();
  },

  // Muestra un aviso: siempre dentro de la app y, si hay permiso, también en el sistema.
  show(title, body) {
    this.showBanner(title, body);
    if (this.status() === "granted") {
      const notification = new Notification(`Life OS · ${title}`, { body, tag: "lifeos" });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  },

  // Revisa si toca enviar algún recordatorio ahora.
  check(state, now = new Date()) {
    const reminders = state.reminders;
    if (!reminders || !reminders.enabled) return;

    const today = Dates.key(now);
    const fired = this.loadFired(today);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // ¿Estamos entre la hora indicada y 15 minutos después?
    const isDue = (time) => {
      const start = toMinutes(time);
      return nowMinutes >= start && nowMinutes < start + WINDOW_MINUTES;
    };

    // 1. Avisos de hábitos pendientes.
    reminders.times.forEach((time) => {
      const id = `pending-${time}`;
      if (fired.includes(id) || !isDue(time)) return;
      fired.push(id);

      const pending = state.habits.filter((h) => !Habits.isDone(state, today, h.id));
      if (pending.length > 0) this.show("Hábitos pendientes", pendingText(pending));
    });

    // 2. Aviso para cerrar el día.
    if (reminders.closeTime && !fired.includes("close") && isDue(reminders.closeTime)) {
      fired.push("close");
      const score = Scoring.dayScore(state, today);
      this.show("Hora de cerrar el día", `Hoy llevas ${score} puntos. Revisa y marca lo que hiciste.`);
    }

    this.saveFired(today, fired);
  },

  // --- Aviso dentro de la app ---
  showBanner(title, body) {
    document.getElementById("banner-title").textContent = title;
    document.getElementById("banner-body").textContent = body;
    document.getElementById("banner").hidden = false;
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => this.hideBanner(), 10000); // se cierra solo a los 10 s
  },

  hideBanner() {
    document.getElementById("banner").hidden = true;
  },

  // --- Registro de avisos enviados (se reinicia cada día) ---
  loadFired(today) {
    try {
      const data = JSON.parse(localStorage.getItem(FIRED_KEY));
      return data && data.day === today ? data.ids : [];
    } catch (err) {
      return [];
    }
  },

  saveFired(today, ids) {
    try {
      localStorage.setItem(FIRED_KEY, JSON.stringify({ day: today, ids }));
    } catch (err) {
      console.warn("Life OS: no se pudo guardar el registro de avisos.", err);
    }
  },
};

// "09:30" → 570 (minutos desde la medianoche). Así comparar horas es comparar números.
function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Texto del aviso: "Te faltan 3: Yoga, Dibujo, Aprender inglés"
function pendingText(pending) {
  const names = pending.map((h) => h.name);
  if (pending.length === 1) return `Te falta: ${names[0]}`;
  return `Te faltan ${pending.length}: ${names.join(", ")}`;
}
