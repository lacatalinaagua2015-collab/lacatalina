// ════════════════════════════════════════════════════════════════════
// ◆  03-utils.js — funciones puras / helpers de datos (SIN JSX):
//    direccionCliente, KEY_PROD_ENV, prestadoClienteDe, fmtFechaHoraVenta,
//    debounceSave, useLS, s (estilos), calcVenta, comprimirFoto,
//    extraerCoordsDeURL, buscarCliente.
//    Los componentes de UI compartidos (CambioEnvasePanel, FotoClienteModal,
//    PieEnvases, FormCliente, HeaderApp, etc.) están en 04-componentes.js.
// ════════════════════════════════════════════════════════════════════

// ── Muestra la fecha y hora real del teléfono de un registro (ej: "19/6/2026 · 14:30", sin segundos) ──
// ── Arma la dirección completa de un cliente, combinando TODOS los campos
//    que tenga cargados — sector, manzana, lote, casa/dpto, calle, número,
//    barrio. No todos los clientes usan los mismos campos (unos tienen
//    calle y número, otros manzana/lote/sector de un barrio popular, otros
//    le suman casa o depto) — esta función junta lo que haya, sin dejar
//    afuera nada de lo cargado. Usarla en TODOS lados en vez de armar la
//    dirección a mano cada vez.
function direccionCliente(c) {
  if (!c) return "";
  const partes = [];
  if (c.calle) {
    partes.push(`${c.calle} ${c.nro || ""}`.trim());
  } else if (c.manzana || c.lote || c.sector) {
    let base = "";
    if (c.sector) base += `S${c.sector} `;
    if (c.manzana) base += `Mz ${c.manzana} `;
    if (c.lote) base += `L ${c.lote}`;
    if (base.trim()) partes.push(base.trim());
  }
  if (c.aclaracion) partes.push(c.aclaracion);
  if (c.barrio) partes.push(c.barrio);
  return partes.join(" · ");
}
const KEY_PROD_ENV = {
  "Sifón 1.5L": "sifon",
  "Bidón 10L": "bidon10",
  "Bidón 20L": "bidon20",
  "Dispenser": "dispenser"
};
// ── Cuánto tiene PRESTADO un cliente de un producto ("sifon"|"bidon10"|
//    "bidon20"|"dispenser"). Para sifón/bidón10/bidón20 se lee directo de
//    c.prestado (campo que se mantiene solo, sumando/restando en cada venta
//    — ver aplicarMovimientoEnvases en 14-app.js). Si el cliente todavía no
//    tiene ese campo, o es dispenser (que no tiene campo directo), se
//    calcula del historial de ventas de ese cliente + el ajuste manual
//    (c.envAjuste). Usar SIEMPRE esta función en vez de recalcular a mano
//    — así todas las pantallas muestran el mismo número.
function prestadoClienteDe(c, k, ventasHistoricas) {
  if (k !== "dispenser" && c.prestado && c.prestado[k] !== undefined) return c.prestado[k];
  let n = 0;
  (ventasHistoricas || []).forEach(v => {
    if (v.clienteId !== c.id) return;
    (v.envPrest || []).forEach(e => {
      if (KEY_PROD_ENV[e.prod] === k) n += Number(e.cant) || 0;
    });
    (v.envDev || []).forEach(e => {
      if (KEY_PROD_ENV[e.prod] === k) n -= Number(e.cant) || 0;
    });
  });
  return Math.max(0, n + (Number(c.envAjuste?.[k]) || 0));
}
function fmtFechaHoraVenta(f) {
  if (!f) return "";
  const limpio = String(f).replace(",", " ").replace(/\s+/g, " ").trim();
  const partes = limpio.split(" ");
  const fecha = partes[0] || "";
  let hora = partes[1] || "";
  const hm = hora.split(":");
  if (hm.length >= 2) hora = hm[0].padStart(2, "0") + ":" + hm[1];
  return hora ? fecha + " · " + hora : fecha;
}
function debounceSave(fn) {
  _saveQueue = fn;
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    const f = _saveQueue;
    _saveQueue = null;
    _saveTimer = null;
    if (f) f();
  }, 1200);
}
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && _saveQueue) {
    const f = _saveQueue;
    _saveQueue = null;
    if (_saveTimer) {
      clearTimeout(_saveTimer);
      _saveTimer = null;
    }
    f();
  }
});
function useLS(key, fallback) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : fallback;
    } catch {
      return fallback;
    }
  });
  // Acepta un valor directo O una función (prev => nuevoValor).
  // La forma función es la segura: React siempre le pasa el estado MÁS
  // reciente, incluso si hay varias llamadas seguidas antes de re-renderizar
  // (evita perder cambios cuando dos acciones se disparan rápido).
  const save = v => {
    setVal(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  return [val, save];
}
const s = {
  app: {
    maxWidth: 480,
    margin: "0 auto",
    background: "var(--color-background-primary)",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column"
  },
  header: {
    background: "var(--color-background-secondary)",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    position: "sticky",
    top: 0,
    zIndex: 10
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    flex: 1
  },
  backBtn: {
    background: "var(--color-background-tertiary)",
    border: "none",
    cursor: "pointer",
    padding: "6px 12px",
    color: "var(--color-text-secondary)",
    fontSize: 13,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontWeight: 500
  },
  screen: {
    flex: 1,
    paddingBottom: 40
  },
  card: {
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 12,
    padding: "10px 14px",
    margin: "6px 14px"
  },
  label: {
    fontSize: 11,
    color: "var(--color-text-secondary)",
    marginBottom: 3,
    display: "block"
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 8,
    fontSize: 14,
    background: "var(--color-background-tertiary)",
    color: "var(--color-text-primary)",
    outline: "none",
    boxSizing: "border-box"
  },
  inputNum: {
    padding: "7px 8px",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 8,
    fontSize: 14,
    background: "var(--color-background-tertiary)",
    color: "var(--color-text-primary)",
    outline: "none",
    textAlign: "right",
    width: "100%",
    boxSizing: "border-box"
  },
  btn: {
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
    background: "var(--color-background-tertiary)",
    color: "var(--color-text-secondary)"
  },
  btnPrimary: {
    background: "#185FA5",
    color: "#e2eaf4",
    border: "none",
    borderRadius: 8,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%"
  },
  btnDanger: {
    background: "var(--color-background-danger)",
    color: "var(--color-text-danger)",
    border: "0.5px solid var(--color-border-danger)",
    borderRadius: 8,
    padding: "5px 10px",
    fontSize: 12,
    cursor: "pointer"
  },
  row: {
    display: "flex",
    gap: 8,
    alignItems: "center"
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 6
  },
  metricCard: {
    background: "var(--color-background-tertiary)",
    borderRadius: 8,
    padding: "10px 12px"
  },
  metricLabel: {
    fontSize: 11,
    color: "var(--color-text-secondary)",
    marginBottom: 3
  },
  metricVal: {
    fontSize: 17,
    fontWeight: 500,
    color: "var(--color-text-primary)"
  },
  badge: c => ({
    fontSize: 10,
    fontWeight: 500,
    padding: "2px 7px",
    borderRadius: 6,
    background: `var(--color-background-${c})`,
    color: `var(--color-text-${c})`
  }),
  tag: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    background: "var(--color-background-tertiary)",
    borderRadius: 8,
    padding: "3px 9px"
  },
  divider: {
    borderTop: "0.5px solid var(--color-border-tertiary)",
    margin: "10px 0"
  },
  sectionTitle: {
    fontSize: 10,
    color: "var(--color-text-tertiary)",
    padding: "12px 14px 4px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    display: "block"
  },
  select: {
    width: "100%",
    padding: "8px 10px",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 8,
    fontSize: 14,
    background: "var(--color-background-tertiary)",
    color: "var(--color-text-primary)",
    outline: "none",
    boxSizing: "border-box"
  },
  tabBar: {
    display: "flex",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    padding: "0 14px",
    gap: 4,
    background: "var(--color-background-secondary)"
  },
  tab: a => ({
    padding: "9px 12px",
    fontSize: 13,
    cursor: "pointer",
    border: "none",
    background: "none",
    color: a ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
    fontWeight: a ? 500 : 400,
    borderBottom: a ? "2px solid #5daaff" : "2px solid transparent"
  })
};
// "s" recién se acaba de definir — si el tema guardado tiene relieve
// (Panel Industrial / Aluminio), la primera llamada en 01-temas.js no pudo
// mutar card/btn/btnPrimary porque "s" todavía no existía. La repetimos acá.
try {
  aplicarTemaLC(getTemaLC());
} catch {}
function calcVenta(detalle, pago, montoPagado, saldoAplicado, productos) {
  const bruto = detalle.reduce((a, d) => a + d.total, 0);
  const desc = 0; // retención solo en planilla, no afecta el monto de la venta
  const neto = bruto - desc;
  const aPagar = neto - (saldoAplicado || 0);
  const pagadoNum = pago === "fiado" ? 0 : montoPagado !== "" && !isNaN(Number(montoPagado)) ? Number(montoPagado) : aPagar;
  const saldoDelta = pagadoNum - neto;
  const costo = detalle.reduce((a, d) => {
    const p = productos.find(x => x.nombre === d.nombre);
    return a + (p ? p.costo * d.cantidad : 0);
  }, 0);
  return {
    bruto,
    desc,
    neto,
    aPagar,
    pagadoNum,
    saldoDelta,
    costo,
    ganancia: neto - costo
  };
}

// Comprime imagen a max 800px y calidad 0.75 antes de guardar
function comprimirFoto(file, maxW = 800, quality = 0.75) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(file);
  });
}

// Extrae coordenadas (lat,lng) de un link/texto de Google Maps. Devuelve {lat,lng} o null.
function extraerCoordsDeURL(url) {
  if (!url || typeof url !== "string") return null;
  let m;
  m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return {
    lat: +m[1],
    lng: +m[2]
  };
  m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m) return {
    lat: +m[1],
    lng: +m[2]
  };
  m = url.match(/[?&](?:q|ll|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return {
    lat: +m[1],
    lng: +m[2]
  };
  m = url.match(/(-?\d{1,2}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})/);
  if (m) return {
    lat: +m[1],
    lng: +m[2]
  };
  return null;
}

// ════════════════════════════════════════════════════════════════════
// ◆  buscarCliente — búsqueda UNIFICADA priorizando el DOMICILIO
//    Devuelve: 2 = coincide el domicilio · 1 = coincide nombre/tel/notas · 0 = no
//    Entiende: "juramento 59", "mz f l 28", "policial 3", barrios, sectores...
// ════════════════════════════════════════════════════════════════════
function buscarCliente(c, q) {
  const t = (q || "").trim().toLowerCase();
  if (!t) return 1; // sin búsqueda: todos pasan
  const domicilio = [c.calle, c.nro, c.calle && c.nro ? `${c.calle} ${c.nro}` : "", c.barrio, c.sector, c.aclaracion, c.manzana, c.lote, c.manzana ? `mz ${c.manzana}` : "", c.lote ? `l ${c.lote}` : "", c.manzana && c.lote ? `mz ${c.manzana} l ${c.lote}` : "", c.manzana && c.lote ? `manzana ${c.manzana} lote ${c.lote}` : ""].filter(Boolean).join(" · ").toLowerCase();
  if (domicilio.includes(t)) return 2;
  if ((c.nombre || "").toLowerCase().includes(t)) return 1;
  if (String(c.telefono || "").includes(t)) return 1;
  if ((c.notas || "").toLowerCase().includes(t)) return 1;
  return 0;
}

