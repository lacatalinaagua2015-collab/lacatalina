// ════════════════════════════════════════════════════════════════════
// ◆  03-utils.js — debounceSave, useLS, calcVenta, comprimirFoto, fmtFechaHoraVenta
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
  m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return {
    lat: +m[1],
    lng: +m[2]
  };
  m = url.match(/(-?\d+\.\d+)[,;\s]+(-?\d+\.\d+)/);
  if (m) return {
    lat: +m[1],
    lng: +m[2]
  };
  return null;
}

// ════════════════════════════════════════════════════════════════════
// ◆  PieEnvases — pie de tarjeta de cliente UNIFICADO (todas las listas)
//    Botón ♻️ Envases + botones propios de cada pantalla + panel con Confirmar.
//    Guarda SIEMPRE en c.envAjuste (mecanismo único).
//    Uso: <PieEnvases c={c} ventas={ventas} onEditar={(id,cambios)=>...}
//           izquierda={<botón opcional/>}> {botones derecha opcionales} </PieEnvases>
// ════════════════════════════════════════════════════════════════════
function PieEnvases({
  c,
  ventas,
  onEditar,
  onPerdida,
  izquierda,
  children
}) {
  const KEYS = ["sifon", "bidon10", "bidon20", "dispenser"];
  const KP = {
    "Sifón 1.5L": "sifon",
    "Bidón 10L": "bidon10",
    "Bidón 20L": "bidon20",
    "Dispenser": "dispenser"
  };
  const [draft, setDraft] = React.useState(null); // null = panel cerrado
  const [mostrarPerdida, setMostrarPerdida] = React.useState(false);
  const [prodPerdida, setProdPerdida] = React.useState("sifon");
  const [cantPerdida, setCantPerdida] = React.useState("");
  const confirmarPerdidaCliente = () => {
    const cant = Math.round(Number(cantPerdida) || 0);
    if (cant <= 0) return;
    const nuevoValor = Math.max(0, (Number(c[prodPerdida]) || 0) - cant);
    onEditar(c.id, {
      [prodPerdida]: nuevoValor
    });
    onPerdida && onPerdida({
      [prodPerdida]: cant
    }, "Roto/perdido en lo del cliente", c.nombre);
    setMostrarPerdida(false);
    setCantPerdida("");
  };
  const calcExtra = () => {
    const ex = {
      sifon: 0,
      bidon10: 0,
      bidon20: 0,
      dispenser: 0
    };
    (ventas || []).filter(v => v.clienteId === c.id).forEach(v => {
      (v.envPrest || []).forEach(e => {
        const k = KP[e.prod];
        if (k) ex[k] += Number(e.cant) || 0;
      });
      (v.envDev || []).forEach(e => {
        const k = KP[e.prod];
        if (k) ex[k] -= Number(e.cant) || 0;
      });
    });
    return ex;
  };
  const abrir = () => {
    const ex = calcExtra(),
      aj = c.envAjuste || {};
    setDraft({
      fijos: Object.fromEntries(KEYS.map(k => [k, Number(c[k]) || 0])),
      prest: Object.fromEntries(KEYS.map(k => [k, (ex[k] || 0) + (aj[k] || 0)]))
    });
  };
  const confirmar = () => {
    const ex = calcExtra();
    onEditar(c.id, {
      ...Object.fromEntries(KEYS.map(k => [k, Math.max(0, draft.fijos[k])])),
      envAjuste: Object.fromEntries(KEYS.map(k => [k, draft.prest[k] - (ex[k] || 0)]))
    });
    setDraft(null);
  };
  const abierto = !!draft;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6,
      marginTop: 10,
      borderTop: "0.5px solid var(--color-border-tertiary)",
      paddingTop: 8
    }
  }, izquierda || null, /*#__PURE__*/React.createElement("button", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      padding: "5px 12px",
      borderRadius: 20,
      cursor: "pointer",
      background: abierto ? "var(--color-background-warning)" : "var(--color-background-tertiary)",
      color: abierto ? "var(--color-text-warning)" : "var(--color-text-secondary)",
      border: abierto ? "1px solid var(--color-border-warning)" : "0.5px solid var(--color-border-secondary)"
    },
    onClick: e => {
      e.stopPropagation();
      abierto ? setDraft(null) : abrir();
    }
  }, "♻️ Envases"), children), abierto && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      background: "var(--color-background-tertiary)",
      borderRadius: 8,
      padding: "8px 10px"
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "82px 1fr 1fr 1fr 1fr",
      gap: 4,
      fontSize: 10,
      color: "var(--color-text-tertiary)",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "Sifón"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "10L"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "20L"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "Disp")), [["fijos", "🏠 Fijos"], ["prest", "📦 Prestados"]].map(([t, l]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: "grid",
      gridTemplateColumns: "82px 1fr 1fr 1fr 1fr",
      gap: 4,
      alignItems: "center",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: t === "prest" ? "var(--color-text-warning)" : "var(--color-text-secondary)"
    }
  }, l), KEYS.map(k => /*#__PURE__*/React.createElement("input", {
    key: k,
    type: "number",
    value: draft[t][k],
    onChange: e => {
      const n = Math.round(Number(e.target.value) || 0);
      setDraft(d => ({
        ...d,
        [t]: {
          ...d[t],
          [k]: n
        }
      }));
    },
    style: {
      ...s.inputNum,
      padding: "6px 2px",
      fontSize: 14,
      textAlign: "center",
      fontWeight: t === "prest" && draft[t][k] !== 0 ? 600 : 400,
      color: t === "prest" ? draft[t][k] > 0 ? "var(--color-text-warning)" : draft[t][k] < 0 ? "var(--color-text-success)" : "var(--color-text-primary)" : "var(--color-text-primary)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--color-text-tertiary)",
      margin: "2px 0 6px"
    }
  }, "Prestados = total extra que tiene hoy · 0 = devolvió todo"), !mostrarPerdida ? /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: "none",
      border: "none",
      color: "var(--color-text-danger)",
      fontSize: 11,
      fontWeight: 500,
      cursor: "pointer",
      padding: "4px 0",
      textAlign: "left",
      marginBottom: 6
    },
    onClick: e => {
      e.stopPropagation();
      setMostrarPerdida(true);
    }
  }, "💔 Se le rompió/perdió un envase") : /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-background-secondary)",
      borderRadius: 7,
      padding: 8,
      marginBottom: 8
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-danger)",
      fontWeight: 500,
      marginBottom: 6
    }
  }, "💔 Registrar roto/perdido de ", c.nombre), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 60px",
      gap: 6,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: prodPerdida,
    onChange: e => setProdPerdida(e.target.value),
    style: {
      ...s.inputNum,
      padding: "6px 4px",
      fontSize: 12,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "sifon"
  }, "Sifón 1.5L"), /*#__PURE__*/React.createElement("option", {
    value: "bidon10"
  }, "Bidón 10L"), /*#__PURE__*/React.createElement("option", {
    value: "bidon20"
  }, "Bidón 20L"), /*#__PURE__*/React.createElement("option", {
    value: "dispenser"
  }, "Dispenser")), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 1,
    placeholder: "Cant.",
    value: cantPerdida,
    onChange: e => setCantPerdida(e.target.value),
    style: {
      ...s.inputNum,
      padding: "6px 4px",
      fontSize: 12,
      textAlign: "center"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      flex: 1,
      fontSize: 11,
      padding: "6px"
    },
    onClick: () => {
      setMostrarPerdida(false);
      setCantPerdida("");
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 2,
      background: "var(--color-background-danger)",
      color: "var(--color-text-danger)",
      border: "1px solid var(--color-border-danger)",
      borderRadius: 7,
      padding: "7px",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer"
    },
    onClick: confirmarPerdidaCliente
  }, "Confirmar pérdida")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--color-text-tertiary)",
      marginTop: 5
    }
  }, "Se descuenta directo de lo que este cliente tiene asignado, y queda anotado en Stock → Pérdidas.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      flex: 1,
      fontSize: 12
    },
    onClick: e => {
      e.stopPropagation();
      setDraft(null);
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 2,
      background: "#1d9e75",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "9px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    },
    onClick: e => {
      e.stopPropagation();
      confirmar();
    }
  }, "✓ Confirmar"))));
}

// ════════════════════════════════════════════════════════════════════
// ◆  FormCliente — formulario de cliente UNIFICADO (crear y editar)
//    Usado en: Nuevo cliente, Editar desde el perfil, Editar en Gestión.
//    Los envases prestados NO van acá: se editan con ♻️ Envases (PieEnvases).
// ════════════════════════════════════════════════════════════════════
function FormCliente({
  inicial,
  onGuardar,
  onEliminarCliente,
  textoGuardar
}) {
  const [datos, setDatos] = React.useState({
    ...(inicial || {})
  });
  const set = (k, v) => setDatos(d => ({
    ...d,
    [k]: v
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: s.grid2
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Día de reparto"), /*#__PURE__*/React.createElement("select", {
    style: s.select,
    value: datos.dia || "Martes",
    onChange: e => set("dia", e.target.value)
  }, DIAS.map(d => /*#__PURE__*/React.createElement("option", {
    key: d,
    value: d
  }, d)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Número de orden"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    type: "number",
    min: 1,
    placeholder: "ej: 5",
    value: datos.orden || "",
    onChange: e => set("orden", Number(e.target.value) || "")
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Nombre y apellido *"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Nombre completo",
    value: datos.nombre || "",
    onChange: e => set("nombre", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: s.grid2
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Barrio"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Barrio",
    value: datos.barrio || "",
    onChange: e => set("barrio", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Sector"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Sector",
    value: datos.sector || "",
    onChange: e => set("sector", e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: s.grid3
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Manzana"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Mz",
    value: datos.manzana || "",
    onChange: e => set("manzana", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Lote"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Lote",
    value: datos.lote || "",
    onChange: e => set("lote", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Casa/Dpto"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Casa",
    value: datos.aclaracion || "",
    onChange: e => set("aclaracion", e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: s.grid2
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Calle"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Calle",
    value: datos.calle || "",
    onChange: e => set("calle", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Número"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Nro",
    value: datos.nro || "",
    onChange: e => set("nro", e.target.value)
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Teléfono (sin 0 ni 15)"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "3816559000",
    value: datos.telefono || "",
    onChange: e => set("telefono", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Link Google Maps"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "https://maps.app.goo.gl/...",
    value: datos.maps || "",
    onChange: e => set("maps", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Link foto del domicilio (Google Drive, etc)"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "https://...",
    value: datos.foto || "",
    onChange: e => set("foto", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Notas rápidas (timbre roto, perro, cobrar deuda, etc.)"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "ej: timbre roto, cobrar $2000...",
    value: datos.notas || "",
    onChange: e => set("notas", e.target.value)
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      marginTop: 4
    }
  }, "Envases habituales asignados"), /*#__PURE__*/React.createElement("div", {
    style: s.grid3
  }, [["sifon", "Sifón"], ["bidon10", "Bidón 10L"], ["bidon20", "Bidón 20L"]].map(([k, l]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      textAlign: "center"
    }
  }, l), /*#__PURE__*/React.createElement("input", {
    style: {
      ...s.input,
      textAlign: "center"
    },
    type: "number",
    min: 0,
    value: datos[k] || 0,
    onChange: e => set(k, Number(e.target.value))
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Dispenser en comodato"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      padding: "5px 14px",
      fontSize: 18,
      lineHeight: 1
    },
    onClick: () => set("dispenser", Math.max(0, (datos.dispenser || 0) - 1))
  }, "−"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 500,
      minWidth: 28,
      textAlign: "center",
      color: "var(--color-text-primary)"
    }
  }, datos.dispenser || 0), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      padding: "5px 14px",
      fontSize: 18,
      lineHeight: 1
    },
    onClick: () => set("dispenser", (datos.dispenser || 0) + 1)
  }, "+"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, "unidades"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, "💡 Los envases prestados (extra) se ajustan con el botón ♻️ Envases."), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "4px 0",
      background: "var(--color-background-tertiary)",
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-secondary)",
      marginBottom: 8
    }
  }, "Saldo del cliente"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 6
    }
  }, [["favor", "A favor"], ["deuda", "Debe"], ["cero", "Sin saldo"]].map(([v, l]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    style: {
      flex: 1,
      fontSize: 11,
      padding: "6px 4px",
      borderRadius: 8,
      border: "0.5px solid var(--color-border-secondary)",
      cursor: "pointer",
      background: datos._tipoSaldo === v ? "#185FA5" : "var(--color-background-secondary)",
      color: datos._tipoSaldo === v ? "#e2eaf4" : "var(--color-text-secondary)"
    },
    onClick: () => set("_tipoSaldo", v)
  }, l))), datos._tipoSaldo && datos._tipoSaldo !== "cero" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, datos._tipoSaldo === "favor" ? "Monto a favor ($)" : "Monto que debe ($)"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    type: "number",
    min: 0,
    placeholder: "0",
    value: datos._montoSaldo || "",
    onChange: e => set("_montoSaldo", e.target.value)
  })), (datos.saldo || 0) !== 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: datos.saldo < 0 ? "var(--color-text-danger)" : "var(--color-text-success)",
      marginTop: 4
    }
  }, "Saldo actual: ", fmt(datos.saldo), " · ", datos.saldo < 0 ? "Debe" : "A favor"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "O ingresá el saldo directamente (−negativo = debe · +positivo = a favor)"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    type: "number",
    placeholder: "ej: -2500 o 1800",
    value: datos._saldoDirecto ?? "",
    onChange: e => set("_saldoDirecto", e.target.value)
  }))), datos.foto && /*#__PURE__*/React.createElement("img", {
    src: datos.foto,
    alt: "Domicilio",
    style: {
      width: "100%",
      borderRadius: 8,
      maxHeight: 160,
      objectFit: "cover"
    }
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      marginTop: 4,
      opacity: !datos.nombre ? 0.45 : 1
    },
    disabled: !datos.nombre,
    onClick: () => {
      let saldo = datos.saldo || 0;
      if (datos._tipoSaldo === "favor") saldo = Math.abs(Number(datos._montoSaldo) || 0);
      if (datos._tipoSaldo === "deuda") saldo = -Math.abs(Number(datos._montoSaldo) || 0);
      if (datos._tipoSaldo === "cero") saldo = 0;
      if (datos._saldoDirecto !== undefined && datos._saldoDirecto !== "") saldo = Number(datos._saldoDirecto);
      onGuardar({
        ...datos,
        saldo
      });
    }
  }, textoGuardar || "Guardar cliente"), onEliminarCliente && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 12,
      borderTop: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnDanger,
      width: "100%",
      padding: "10px",
      fontSize: 13
    },
    onClick: () => {
      window.lcConfirm(`¿Eliminar a ${datos.nombre}? Se borrarán también todas sus ventas.`, {
        peligro: true
      }).then(function (ok) {
        if (ok) onEliminarCliente();
      });
    }
  }, "Eliminar cliente permanentemente")));
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

// ════════════════════════════════════════════════════════════════════
// ◆  HeaderBotones / HeaderApp — encabezado estándar: "Empresa · Pantalla"
//    + sol/M adentro del recuadro, conectado al selector de temas real
//    (antes usaba un interruptor aparte que no tenía nada que ver)
// ════════════════════════════════════════════════════════════════════
const SCALE_LABELS_LC = ["S", "M", "L", "XL"];
function _flipModoTemaLC(id) {
  if (id.startsWith("oscuro-")) return "claro-" + id.slice(7);
  if (id.startsWith("claro-")) return "oscuro-" + id.slice(6);
  return id;
}
function HeaderBotones() {
  const [temaId, setTemaIdLocal] = React.useState(getTemaLC);
  const [scaleIdx, setScaleIdxLocal] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cat_scale_v1") || "1");
    } catch {
      return 1;
    }
  });
  const modoActual = TEMAS_LC[temaId]?.modo || "oscuro";
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const nuevoId = _flipModoTemaLC(temaId);
      if (!TEMAS_LC[nuevoId]) return; // no debería pasar, pero por las dudas no rompe nada
      localStorage.setItem("lc_tema", JSON.stringify(nuevoId)); // guardar primero, siempre
      setTemaIdLocal(nuevoId);
      try {
        aplicarTemaLC(nuevoId);
      } catch (e) {
        console.warn("Error al cambiar de modo:", e);
      }
    },
    style: {
      padding: "6px 10px",
      borderRadius: 8,
      border: "none",
      background: "var(--color-background-tertiary)",
      color: "var(--color-text-secondary)",
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    },
    title: "Cambiar modo claro/oscuro"
  }, modoActual === "oscuro" ? "☀️" : "🌙"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const nv = (scaleIdx + 1) % 4;
      setScaleIdxLocal(nv);
      if (window._setScaleIdxLC) window._setScaleIdxLC(nv);
    },
    style: {
      padding: "6px 10px",
      borderRadius: 8,
      border: "none",
      background: "var(--color-background-tertiary)",
      color: "var(--color-text-secondary)",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    },
    title: "Tamaño de texto"
  }, SCALE_LABELS_LC[scaleIdx]));
}
function HeaderApp({
  titulo,
  onVolver
}) {
  const negocio = (() => {
    try {
      return JSON.parse(localStorage.getItem("lc_negocio_nombre") || '"La Catalina"');
    } catch {
      return "La Catalina";
    }
  })();
  return /*#__PURE__*/React.createElement("div", {
    style: s.header
  }, /*#__PURE__*/React.createElement("button", {
    style: s.backBtn,
    onClick: onVolver
  }, "← Volver"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...s.headerTitle,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, titulo ? `${negocio} · ${titulo}` : negocio), /*#__PURE__*/React.createElement(HeaderBotones, null));
}

// ════════════════════════════════════════════════════════════════════
// ◆  UI propia: toast / alert / confirm  (reemplazo de alert()/confirm()
//    nativos) + logError centralizado. Todo vanilla DOM para que funcione
//    desde cualquier archivo y desde el <script> de index.html (migración).
// ════════════════════════════════════════════════════════════════════
(function () {
  if (window.lcAlert) return; // evitar doble init
  function cont() {
    var c = document.getElementById('lc-modal-root');
    if (!c) {
      c = document.createElement('div');
      c.id = 'lc-modal-root';
      document.body.appendChild(c);
    }
    return c;
  }
  var COL = {
    info: 'var(--color-text-info,#5daaff)',
    ok: 'var(--color-text-success,#4dd9a0)',
    warn: 'var(--color-text-warning,#f5b942)',
    danger: 'var(--color-text-danger,#f07070)'
  };
  // ── Toast transitorio (no bloquea) ──
  window.lcToast = function (msg, tipo, ms) {
    tipo = tipo || 'info';
    ms = ms || 3200;
    var root = cont();
    var t = document.createElement('div');
    t.textContent = String(msg);
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);max-width:88%;' + 'background:var(--color-background-tertiary,#253647);color:var(--color-text-primary,#e2eaf4);' + 'border-left:4px solid ' + (COL[tipo] || COL.info) + ';padding:12px 16px;border-radius:10px;' + 'font-size:14px;line-height:1.4;box-shadow:0 8px 30px rgba(0,0,0,.45);z-index:100000;' + 'white-space:pre-wrap;opacity:0;transition:opacity .18s';
    root.appendChild(t);
    requestAnimationFrame(function () {
      t.style.opacity = '1';
    });
    setTimeout(function () {
      t.style.opacity = '0';
      setTimeout(function () {
        t.remove();
      }, 220);
    }, ms);
    return t;
  };
  // ── Modal genérico (devuelve Promise<boolean>) ──
  function modal(opts) {
    return new Promise(function (resolve) {
      var root = cont();
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100001;' + 'display:flex;align-items:center;justify-content:center;padding:20px';
      var box = document.createElement('div');
      box.style.cssText = 'background:var(--color-background-secondary,#1a2b3c);color:var(--color-text-primary,#e2eaf4);' + 'border:0.5px solid var(--color-border-secondary,rgba(255,255,255,.13));border-radius:14px;' + 'max-width:420px;width:100%;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.6)';
      if (opts.titulo) {
        var h = document.createElement('div');
        h.textContent = opts.titulo;
        h.style.cssText = 'font-size:16px;font-weight:700;margin-bottom:8px;color:' + (COL[opts.tipo] || 'var(--color-text-primary,#e2eaf4)');
        box.appendChild(h);
      }
      var p = document.createElement('div');
      p.textContent = String(opts.mensaje || '');
      p.style.cssText = 'font-size:14px;line-height:1.5;white-space:pre-wrap;color:var(--color-text-secondary,#7a9ab8)';
      box.appendChild(p);
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;margin-top:18px;justify-content:flex-end';
      function cerrar(val) {
        ov.remove();
        resolve(val);
      }
      if (opts.confirm) {
        var bc = document.createElement('button');
        bc.textContent = opts.cancelText || 'Cancelar';
        bc.style.cssText = 'flex:1;padding:11px;border-radius:9px;border:none;cursor:pointer;font-size:14px;font-weight:600;' + 'background:var(--color-background-tertiary,#253647);color:var(--color-text-secondary,#7a9ab8)';
        bc.onclick = function () {
          cerrar(false);
        };
        row.appendChild(bc);
      }
      var bo = document.createElement('button');
      bo.textContent = opts.okText || (opts.confirm ? 'Confirmar' : 'Entendido');
      var bg = opts.peligro ? 'var(--color-text-danger,#f07070)' : 'var(--color-accent,#185FA5)';
      bo.style.cssText = 'flex:1;padding:11px;border-radius:9px;border:none;cursor:pointer;font-size:14px;font-weight:700;' + 'background:' + bg + ';color:#fff';
      bo.onclick = function () {
        cerrar(true);
      };
      row.appendChild(bo);
      box.appendChild(row);
      ov.appendChild(box);
      ov.onclick = function (e) {
        if (e.target === ov && !opts.confirm) cerrar(true);
      };
      root.appendChild(ov);
      setTimeout(function () {
        bo.focus();
      }, 30);
    });
  }
  window.lcAlert = function (mensaje, opts) {
    opts = opts || {};
    return modal({
      mensaje: mensaje,
      titulo: opts.titulo,
      tipo: opts.tipo,
      confirm: false,
      okText: opts.okText
    });
  };
  window.lcConfirm = function (mensaje, opts) {
    opts = opts || {};
    return modal({
      mensaje: mensaje,
      titulo: opts.titulo || 'Confirmar',
      tipo: opts.tipo,
      confirm: true,
      okText: opts.okText,
      cancelText: opts.cancelText,
      peligro: opts.peligro
    });
  };

  // ── logError centralizado + registro para la pantalla de Diagnóstico ──
  window._lcErrores = window._lcErrores || [];
  window.logError = function (contexto, error) {
    var info = {
      contexto: String(contexto || ''),
      mensaje: error && error.message || String(error || ''),
      stack: error && error.stack ? String(error.stack).slice(0, 1200) : '',
      fecha: new Date().toISOString()
    };
    try {
      console.error('[logError] ' + info.contexto + ':', error);
    } catch (e) {}
    window._lcErrores.unshift(info);
    if (window._lcErrores.length > 50) window._lcErrores.length = 50;
    try {
      var prev = JSON.parse(localStorage.getItem('lc_error_log') || '[]');
      prev.unshift(info);
      if (prev.length > 50) prev.length = 50;
      localStorage.setItem('lc_error_log', JSON.stringify(prev));
    } catch (e) {}
    return info;
  };
  window.lcGetErrores = function () {
    try {
      return JSON.parse(localStorage.getItem('lc_error_log') || '[]');
    } catch (e) {
      return window._lcErrores || [];
    }
  };
  window.lcLimpiarErrores = function () {
    window._lcErrores = [];
    try {
      localStorage.removeItem('lc_error_log');
    } catch (e) {}
  };
  // Errores globales no capturados
  window.addEventListener('error', function (e) {
    try {
      window.logError('window.onerror', e.error || e.message);
    } catch (_) {}
  });
  window.addEventListener('unhandledrejection', function (e) {
    try {
      window.logError('promesa no manejada', e.reason);
    } catch (_) {}
  });
})();
