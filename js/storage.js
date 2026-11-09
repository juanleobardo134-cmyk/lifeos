// =============================================================
// storage.js — Guardar y cargar datos (LocalStorage)
// -------------------------------------------------------------
// LocalStorage es un pequeño "cajón" del navegador donde se
// guarda texto. Todo se queda en TU computadora: nada se envía
// a internet.
//
// Forma de los datos guardados (el "estado" de la app):
// {
//   version: 1,
//   habits:  [ { id, name, weight, icon, color }, ... ],
//   history: { "2026-11-07": ["lectura", "yoga"], ... }
// }
// =============================================================

const STORAGE_KEY = "lifeos.v1";

// Copia de los recordatorios iniciales (la lista "times" también se copia,
// para que cambiar tus horas nunca modifique DEFAULT_REMINDERS).
function defaultReminders() {
  return { ...DEFAULT_REMINDERS, times: [...DEFAULT_REMINDERS.times] };
}

const Store = {
  // Lee los datos guardados. Si no hay nada, crea un estado nuevo.
  load() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw); // texto -> objeto JavaScript
        if (data && Array.isArray(data.habits) && data.history) {
          // "Migración": los datos guardados antes de la etapa 5 no tenían
          // recordatorios. Se los añadimos sin tocar nada de lo demás.
          if (!data.reminders) data.reminders = defaultReminders();
          return data;
        }
      }
    } catch (err) {
      console.warn("Life OS: no se pudieron leer los datos guardados.", err);
    }

    // Si había datos pero estaban dañados, los copiamos a un respaldo
    // antes de empezar de cero. Así NUNCA se pierde el historial.
    if (raw) {
      try {
        localStorage.setItem(`${STORAGE_KEY}.backup-${Date.now()}`, raw);
      } catch (err) {
        console.warn("Life OS: no se pudo crear el respaldo.", err);
      }
    }

    return {
      version: 1,
      habits: DEFAULT_HABITS.map((habit) => ({ ...habit })), // copia de cada hábito
      history: {},
      reminders: defaultReminders(),
    };
  },

  // Descarga todos tus datos en un archivo .json (un respaldo en tu PC).
  // No se envía nada a internet: el archivo se crea dentro del navegador.
  exportFile(state) {
    const json = JSON.stringify(state, null, 2);        // texto bonito, con sangría
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);             // dirección temporal al archivo
    const link = document.createElement("a");
    link.href = url;
    link.download = `lifeos-respaldo-${Dates.key()}.json`;
    link.click();                                      // simula un clic → se descarga
    setTimeout(() => URL.revokeObjectURL(url), 1000);  // liberamos la memoria
  },

  // Convierte el texto de un archivo de respaldo en datos válidos.
  // Si algo no cuadra, "lanza" (throw) un error con un mensaje claro.
  parseBackup(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error("Ese archivo no es un respaldo válido.");
    }

    const looksValid =
      data &&
      Array.isArray(data.habits) &&
      data.habits.every((h) => h && typeof h.id === "string" && typeof h.name === "string" && typeof h.weight === "number") &&
      data.history && typeof data.history === "object" &&
      Object.values(data.history).every(Array.isArray);

    if (!looksValid) throw new Error("Ese archivo no tiene el formato de Life OS.");
    if (!data.reminders) data.reminders = defaultReminders();
    return data;
  },

  // Copia interna de seguridad (antes de reemplazar los datos al importar).
  backupCurrent(state) {
    try {
      localStorage.setItem(`${STORAGE_KEY}.backup-${Date.now()}`, JSON.stringify(state));
      return true;
    } catch (err) {
      console.warn("Life OS: no se pudo crear la copia interna.", err);
      return false;
    }
  },

  // Guarda el estado completo. Devuelve true si salió bien.
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); // objeto -> texto
      return true;
    } catch (err) {
      console.error("Life OS: no se pudo guardar.", err);
      return false;
    }
  },
};
