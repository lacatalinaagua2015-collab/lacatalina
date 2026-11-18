// ════════════════════════════════════════════════════════════════════
// ◆  02-constantes.js — Constantes globales
// ════════════════════════════════════════════════════════════════════

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Cargas de salida precargadas por día (soda en unidades: 1 cajón = 6 sifones)
const CARGA_DIA_DEFAULT = {
  "Lunes":     { soda: 0,   b10: 0,  b20: 0  },
  "Martes":    { soda: 90,  b10: 45, b20: 7  },
  "Miércoles": { soda: 60,  b10: 30, b20: 9  },
  "Jueves":    { soda: 120, b10: 45, b20: 14 },
  "Viernes":   { soda: 90,  b10: 30, b20: 7  },
};
const PRODUCTOS_CONFIG = [
  { id: "b10",  nombre: "Bidón 10L",       costoUnit: 800 },
  { id: "b20",  nombre: "Bidón 20L",       costoUnit: 1100 },
  { id: "soda", nombre: "Soda 1.5L (caj)", costoUnit: 880 },
];
const GASTOS_CATEGORIAS = ["propina","mercado","gnc","gaseosa","uber","inflado","frutas","otro"];

const CLIENTES_INICIALES = [];
const PRODUCTOS_INICIALES = [
  { id:1, nombre:"Sifón 1.5L", precio:800,  costo:133.33 },
  { id:2, nombre:"Bidón 10L",  precio:2500, costo:800 },
  { id:3, nombre:"Bidón 20L",  precio:5000, costo:800 },
  { id:4, nombre:"Dispenser",  precio:0,    costo:15000, esDispenser:true },
];

const planillaDiaVacia = () => ({
  fecha:"", peso:"", bultos:"",
  productos:{ b10:{llenos:"",vacios:"",plata:"",llenar:""}, b20:{llenos:"",vacios:"",plata:"",llenar:""}, soda:{llenos:"",vacios:"",plata:"",llenar:""} },
  gastos:[], efectivo:"", fiado:"", retenciones:"", obs:"",
});

const fmt = (n) => "$" + Math.round(Number(n)||0).toLocaleString("es-AR");
const num = (v) => Number(v)||0;

// ─── Ganancia neta — costos de la camioneta (configurable, Ajustes → Vehículo) ──
// Pedido de Guillermo (17/11/2026): cada costo tiene un monto y una
// frecuencia (por km, semana, mes o año; "repiteCada" permite cosas como
// "$1.200.000 cada 4 años" sin que tenga que hacer la división él mismo), o
// bien es un porcentaje sobre el total de los demás costos (ej: un colchón
// de repuestos imprevistos). Estos son los valores reales que me dio para
// arrancar — se editan libremente desde la app, esto es solo el default.
const COSTOS_VEHICULO_DEFAULT = [
  { id: 1, nombre: "Combustible (GNC)",      tipo: "monto", monto: 227,     frecuencia: "km",    repiteCada: 1 },
  { id: 2, nombre: "Aceite",                 tipo: "monto", monto: 16000,   frecuencia: "semana",repiteCada: 1 },
  { id: 3, nombre: "Seguro",                 tipo: "monto", monto: 47000,   frecuencia: "mes",   repiteCada: 1 },
  { id: 4, nombre: "Revisación técnica",     tipo: "monto", monto: 90000,   frecuencia: "año",   repiteCada: 1 },
  { id: 5, nombre: "Cambio de olla (GNC)",   tipo: "monto", monto: 35000,   frecuencia: "año",   repiteCada: 1 },
  { id: 6, nombre: "Cubiertas (4)",          tipo: "monto", monto: 1200000, frecuencia: "año",   repiteCada: 4 },
  { id: 7, nombre: "Repuestos imprevistos",  tipo: "porcentaje", porcentaje: 8, base: "gastoVehiculoTotal" },
];
// Ubicación de casa/depósito — punto de partida y llegada de cada reparto,
// para estimar los km recorridos de cada día (Guillermo, 17/11/2026).
const CASA_UBICACION_DEFAULT = { lat: -26.865927367594715, lng: -65.21777978271315, nombre: "Casa" };
const FRECUENCIAS_COSTO_VEHICULO = ["km", "semana", "mes", "año"];
const DIAS_POR_FRECUENCIA_VEHICULO = { "semana": 7, "mes": 30.44, "año": 365.25 };

// ─── Cloud Storage (Firebase Firestore) ─────────────────────────────────────
// cloudSave and cloudLoad are defined in the <script> tag above via Firebase SDK

// Debounce save — espera 1.5s después del último cambio antes de guardar
let _saveTimer = null;
let _saveQueue = null;
