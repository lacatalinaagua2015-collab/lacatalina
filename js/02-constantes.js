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
// Pedido de Guillermo (19/11/2026): el stock/comodato estaba atado a 4
// nombres fijos (sifon/bidon10/bidon20/dispenser) en vez de a esta lista de
// productos, que YA era configurable. Estos 3 campos nuevos son los que
// permiten agregar un producto nuevo (bidón de 12L, de 15L, sifón de medio
// litro, dispenser frío-calor, etc.) y que el stock/comodato lo siga solo,
// sin tocar código:
//   - trackStock: este producto tiene su propia fila en Stock (Sodería/
//     Depósito/En clientes). false para productos que no son envases.
//   - retornable: además tiene comodato (envases prestados a devolver).
//   - agrupacion: conversión opcional a una unidad más grande para mostrar
//     (ej. 6 sifones = 1 cajón) — generaliza lo que antes era un caso
//     especial hardcodeado solo para "sifon".
const PRODUCTOS_INICIALES = [
  { id:1, nombre:"Sifón 1.5L", precio:800,  costo:133.33, trackStock:true, retornable:true, agrupacion:{ factor:6, nombre:"caj" }, capacidadBase:150 },
  { id:2, nombre:"Bidón 10L",  precio:2500, costo:800, trackStock:true, retornable:true, capacidadBase:70 },
  { id:3, nombre:"Bidón 20L",  precio:5000, costo:800, trackStock:true, retornable:true, capacidadBase:21 },
  { id:4, nombre:"Dispenser",  precio:0,    costo:15000, esDispenser:true, trackStock:true, retornable:true, capacidadBase:0 },
];
// Lugares de stock -- lista configurable (reemplaza los 2 lugares fijos que
// ya existían, soderia/casa). "camion" NO entra en esta lista: es tránsito
// del día (se carga desde Sodería al iniciar el reparto y vuelve a Sodería
// al cerrar), no un lugar que el usuario administre a mano.
const UBICACIONES_STOCK_DEFAULT = [
  { id:"soderia", nombre:"Sodería", icono:"🏭" },
  { id:"casa",    nombre:"Depósito", icono:"📦" },
];
// Mapa de migración: nombre del producto clásico -> clave vieja fija con la
// que estaba guardado su stock/comodato antes de esta lista. Se usa UNA
// SOLA VEZ (ver migrarStockYComodatoAProductoId en 14-app.js) para mover los
// datos existentes a la nueva clave por id de producto, sin perder nada.
const CLAVE_LEGACY_POR_NOMBRE = {
  "Sifón 1.5L": "sifon",
  "Bidón 10L": "bidon10",
  "Bidón 20L": "bidon20",
  "Dispenser": "dispenser",
};

// Lo mismo que CLAVE_LEGACY_POR_NOMBRE pero para el "cierre del día" /
// "carga por día" (planilla, 07-menu.js) — ese subsistema usa sus propias
// claves cortas de siempre (soda/b10/b20), distintas de sifon/bidon10/
// bidon20. Un producto nuevo no tiene clave corta: usa directamente su
// propia clave de stock (prod_<id>), que ya es única — ver
// claveCargaDeProducto en 03-utils.js.
const PL_LEGACY_POR_NOMBRE = {
  "Sifón 1.5L": "soda",
  "Bidón 10L": "b10",
  "Bidón 20L": "b20",
};

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
  { id: 5, nombre: "Cambio de oblea (GNC)",  tipo: "monto", monto: 35000,   frecuencia: "año",   repiteCada: 1 },
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
