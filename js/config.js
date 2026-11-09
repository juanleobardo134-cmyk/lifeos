// =============================================================
// config.js — Configuración inicial de Life OS
// -------------------------------------------------------------
// Aquí viven los datos "de fábrica": los 8 hábitos con su peso.
// Solo se usan la PRIMERA vez que abres la app (cuando todavía
// no hay nada guardado). Después, los datos salen de LocalStorage.
// =============================================================

// Los pesos están en porcentaje y deben sumar 100.
const DEFAULT_HABITS = [
  { id: "lectura",      name: "Lectura",                weight: 12, icon: "📚", color: "#60a5fa" },
  { id: "programacion", name: "Programación y estudio", weight: 18, icon: "💻", color: "#a78bfa" },
  { id: "ejercicio",    name: "Ejercicio",              weight: 18, icon: "🏋️", color: "#34d399" },
  { id: "dibujo",       name: "Dibujo",                 weight: 8,  icon: "✏️", color: "#f472b6" },
  { id: "meditacion",   name: "Meditación",             weight: 10, icon: "🧘", color: "#22d3ee" },
  { id: "yoga",         name: "Yoga",                   weight: 8,  icon: "🤸", color: "#fbbf24" },
  { id: "alimentacion", name: "Alimentación",           weight: 16, icon: "🥗", color: "#4ade80" },
  { id: "ingles",       name: "Aprender inglés",        weight: 10, icon: "🗣️", color: "#818cf8" },
];

// Recordatorios iniciales (desactivados hasta que tú los actives).
// "times": avisos de hábitos pendientes. "closeTime": aviso para cerrar el día.
const DEFAULT_REMINDERS = {
  enabled: false,
  times: ["09:00", "14:00", "19:00"],
  closeTime: "21:30",
};
