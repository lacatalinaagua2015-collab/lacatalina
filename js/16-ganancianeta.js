// ════════════════════════════════════════════════════════════════════
// ◆  16-ganancianeta.js — "📊 Ganancia neta": ventas menos costo de
//     llenado menos el gasto real de la camioneta (combustible según
//     km recorridos + costos fijos/periódicos configurables), por día
//     (la vista principal) y comparado mes a mes.
//     Pedido de Guillermo, 17-18/11/2026. Los "gastos extras" que se
//     cargan al cerrar cada reparto (propina, mercado, gnc, uber...) NO
//     se tocan ni se usan acá — son control de caja aparte, nada que
//     ver con este cálculo.
// ════════════════════════════════════════════════════════════════════

// ── Distancia entre dos puntos (fórmula de Haversine, en km) ──────────
function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 0;
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Km estimados de un día: casa → clientes visitados (en el orden real
//    de venta, no el orden de la lista) → vuelta a casa ─────────────────
function calcularKmDelDia(fechaKey, ventas, clientes, casaUbicacion) {
  const ventasDia = (ventas || []).filter(v => v.fechaKey === fechaKey && !v._esCobro && !v._esAjuste && !v._esAjusteEnvases && !v._esCambio && !v._esMixtoTrans);
  if (!ventasDia.length) return { km: 0, clientesContados: 0, clientesSinUbicacion: 0, visitas: 0 };
  // Un cliente puede tener más de una venta el mismo día — nos quedamos
  // con la hora de su PRIMERA venta de ese día para no contarlo dos veces.
  const porCliente = {};
  ventasDia.forEach(v => {
    const h = v.hora || "00:00";
    if (!porCliente[v.clienteId] || h < porCliente[v.clienteId].hora) {
      porCliente[v.clienteId] = { clienteId: v.clienteId, hora: h };
    }
  });
  const orden = Object.values(porCliente).sort((a, b) => a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : 0);
  let sinUbic = 0;
  let puntos = [];
  orden.forEach(o => {
    const c = (clientes || []).find(c => c.id === o.clienteId);
    if (c && c.lat != null && c.lng != null) puntos.push({ lat: c.lat, lng: c.lng });
    else sinUbic++;
  });
  if (casaUbicacion && casaUbicacion.lat != null && casaUbicacion.lng != null && puntos.length) {
    puntos = [{ lat: casaUbicacion.lat, lng: casaUbicacion.lng }, ...puntos, { lat: casaUbicacion.lat, lng: casaUbicacion.lng }];
  }
  let km = 0;
  for (let i = 1; i < puntos.length; i++) km += haversineKm(puntos[i - 1].lat, puntos[i - 1].lng, puntos[i].lat, puntos[i].lng);
  return { km: Math.round(km * 10) / 10, clientesContados: orden.length - sinUbic, clientesSinUbicacion: sinUbic, visitas: orden.length };
}

// ── Gasto vehicular del día, a partir de la lista configurable ───────────
function calcularGastoVehiculoDelDia(costosVehiculo, kmDelDia) {
  const detalle = [];
  let totalBase = 0;
  (costosVehiculo || []).forEach(item => {
    if (item.tipo === "porcentaje") return; // se calcula en la 2da pasada
    let monto = 0;
    if (item.frecuencia === "km") {
      monto = (Number(item.monto) || 0) * kmDelDia;
    } else {
      const dias = DIAS_POR_FRECUENCIA_VEHICULO[item.frecuencia] || 0;
      const repite = Number(item.repiteCada) || 1;
      monto = dias > 0 ? (Number(item.monto) || 0) / (repite * dias) : 0;
    }
    monto = Math.round(monto);
    detalle.push({ ...item, montoDia: monto });
    totalBase += monto;
  });
  (costosVehiculo || []).forEach(item => {
    if (item.tipo !== "porcentaje") return;
    const monto = Math.round(totalBase * (Number(item.porcentaje) || 0) / 100);
    detalle.push({ ...item, montoDia: monto });
  });
  const total = detalle.reduce((a, d) => a + d.montoDia, 0);
  return { detalle, total };
}

// ── "Bulto" para la Ganancia neta — definición de Guillermo (18/11/2026):
//    6 sifones = 1 bulto, bidón 10L = 1 bulto, bidón 20L = 1,5 bultos.
//    Es DISTINTO del "bulto" que ya existe en la planilla de carga
//    (07-menu.js, bultosAuto), que es para otra cosa (peso/espacio en la
//    camioneta) — no se tocan entre sí, viven cada uno en lo suyo.
function factorBultoPorNombre(nombre) {
  if (!nombre) return 0;
  const n = String(nombre).toLowerCase();
  if (n.includes("20")) return 1.5;
  if (n.includes("10")) return 1;
  if (n.includes("sif") || n.includes("soda")) return 1 / 6;
  return 0;
}
function bultosDeDetalle(detalle) {
  const det = Array.isArray(detalle) ? detalle : Object.values(detalle || {});
  return det.reduce((a, d) => a + (Number(d.cantidad) || 0) * factorBultoPorNombre(d.nombre), 0);
}

// ── Día de la semana (capitalizado igual que DIAS/zonasReparto) ─────────
const DIAS_SEMANA_TODAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
function diaSemanaDeFecha(fechaKey) {
  const [y, m, d] = fechaKey.split("-").map(Number);
  return DIAS_SEMANA_TODAS[new Date(y, m - 1, d).getDay()];
}

// ── Todo lo de un día: ventas, ganancia bruta, km, gasto vehículo, neta ──
function calcularDatosDelDia(fechaKey, ventas, clientes, costosVehiculo, casaUbicacion) {
  const ventasReales = (ventas || []).filter(v => v.fechaKey === fechaKey && !v._esCobro && !v._esAjuste && !v._esAjusteEnvases && !v._esCambio && !v._esMixtoTrans);
  const totalVendido = ventasReales.reduce((a, v) => a + (v.neto || 0), 0);
  const totalCostoLlenado = ventasReales.reduce((a, v) => a + (v.costo || 0), 0);
  const gananciaBruta = ventasReales.reduce((a, v) => a + (v.ganancia || 0), 0);
  const totalBultos = ventasReales.reduce((a, v) => a + bultosDeDetalle(v.detalle), 0);
  const { km, clientesContados, clientesSinUbicacion, visitas } = calcularKmDelDia(fechaKey, ventas, clientes, casaUbicacion);
  const { detalle, total: gastoVehiculo } = calcularGastoVehiculoDelDia(costosVehiculo, km);
  const gananciaNeta = gananciaBruta - gastoVehiculo;
  return {
    fechaKey, totalVendido, totalCostoLlenado, gananciaBruta, km, clientesContados, clientesSinUbicacion, visitas,
    detalleCostos: detalle, gastoVehiculo, gananciaNeta, totalBultos,
    pctBruto: totalVendido > 0 ? Math.round(gananciaBruta / totalVendido * 100) : 0,
    pctNeto: totalVendido > 0 ? Math.round(gananciaNeta / totalVendido * 100) : 0,
    kmPorCliente: visitas > 0 ? km / visitas : 0,
  };
}

// ── Helpers de fecha ──────────────────────────────────────────────────
function hoyKey() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toLocaleDateString("en-CA");
}
function sumarDiasKey(fechaKey, delta) {
  const [y, m, d] = fechaKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function fechaLegible(fechaKey) {
  const [y, m, d] = fechaKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}
function diasDelMesHasta(mesKey, tope) {
  const [y, m] = mesKey.split("-").map(Number);
  const ultimoDia = new Date(y, m, 0).getDate();
  const topeKey = tope < `${mesKey}-01` ? null : tope;
  const dias = [];
  for (let d = 1; d <= ultimoDia; d++) {
    const k = `${mesKey}-${String(d).padStart(2, "0")}`;
    if (k > tope) break;
    dias.push(k);
  }
  return dias;
}
function nombreMesLegible(mesKey) {
  const [y, m] = mesKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

// ── Pantalla principal ────────────────────────────────────────────────
function GananciaNetaScreen({ ventas, clientes, costosVehiculo, casaUbicacion, zonasReparto, onVolver, onConfigurar }) {
  const hoy = hoyKey();
  const [vista, setVista] = React.useState("dia"); // "dia" | "mes" | "zona" | "objetivo"
  const [diaSel, setDiaSel] = React.useState(hoy);
  const [mesSel, setMesSel] = React.useState(diaSel.slice(0, 7));
  const [mesZona, setMesZona] = React.useState(diaSel.slice(0, 7));
  const [objetivoInput, setObjetivoInput] = React.useState(() => {
    try { return localStorage.getItem("cat_objetivo_neto_v1") || ""; } catch { return ""; }
  });

  const sinConfigurar = !costosVehiculo || !costosVehiculo.length;

  const datosDia = React.useMemo(
    () => calcularDatosDelDia(diaSel, ventas, clientes, costosVehiculo, casaUbicacion),
    [diaSel, ventas, clientes, costosVehiculo, casaUbicacion]
  );

  // Días del mes (hasta hoy si el mes es el actual, o todo el mes si es uno pasado)
  const topeMes = mesSel === hoy.slice(0, 7) ? hoy : `${mesSel}-31`;
  const diasMes = React.useMemo(() => diasDelMesHasta(mesSel, topeMes), [mesSel, topeMes]);
  const filasMes = React.useMemo(
    () => diasMes.map(k => calcularDatosDelDia(k, ventas, clientes, costosVehiculo, casaUbicacion)).filter(d => d.totalVendido > 0 || d.km > 0),
    [diasMes, ventas, clientes, costosVehiculo, casaUbicacion]
  );
  const promedioKmPorClienteMes = (() => {
    const conVisitas = filasMes.filter(f => f.visitas > 0 && f.fechaKey !== diaSel);
    if (!conVisitas.length) return null;
    return conVisitas.reduce((a, f) => a + f.kmPorCliente, 0) / conVisitas.length;
  })();
  const mostrarAlerta = promedioKmPorClienteMes && datosDia.visitas > 0 && datosDia.kmPorCliente > promedioKmPorClienteMes * 1.3;

  const irADia = fechaKey => { setDiaSel(fechaKey); setVista("dia"); };
  const abrirCompararMes = () => { setMesSel(diaSel.slice(0, 7)); setVista("mes"); };

  const diaNav = /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "10px 14px 2px" }
  },
    /*#__PURE__*/React.createElement("button", { style: { ...s.btn, padding: "4px 10px" }, onClick: () => irADia(sumarDiasKey(diaSel, -1)) }, "◀"),
    /*#__PURE__*/React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", textTransform: "capitalize" } }, fechaLegible(diaSel)),
    /*#__PURE__*/React.createElement("button", { style: { ...s.btn, padding: "4px 10px" }, onClick: () => irADia(sumarDiasKey(diaSel, 1)) }, "▶")
  );

  const tabs = /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 4, margin: "6px 14px 10px", borderBottom: "1px solid var(--color-border-tertiary)" }
  },
    /*#__PURE__*/React.createElement("button", {
      onClick: () => setVista("dia"),
      style: { flex: 1, textAlign: "center", fontSize: 12.5, padding: "8px 2px", background: "none", border: "none", cursor: "pointer",
        color: vista === "dia" ? "#4dd9a0" : "var(--color-text-tertiary)",
        borderBottom: vista === "dia" ? "2px solid #4dd9a0" : "2px solid transparent", fontWeight: vista === "dia" ? 700 : 400 }
    }, "📅 Por día"),
    /*#__PURE__*/React.createElement("button", {
      onClick: abrirCompararMes,
      style: { flex: 1, textAlign: "center", fontSize: 12.5, padding: "8px 2px", background: "none", border: "none", cursor: "pointer",
        color: vista === "mes" ? "#4dd9a0" : "var(--color-text-tertiary)",
        borderBottom: vista === "mes" ? "2px solid #4dd9a0" : "2px solid transparent", fontWeight: vista === "mes" ? 700 : 400 }
    }, "📊 Comparar el mes")
  );

  const vistaDia = () => /*#__PURE__*/React.createElement(React.Fragment, null,
    diaNav, tabs,
    sinConfigurar && /*#__PURE__*/React.createElement("div", {
      style: { ...s.card, textAlign: "center" }
    },
      /*#__PURE__*/React.createElement("div", { style: { fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 10 } }, "Todavía no configuraste los costos de la camioneta."),
      /*#__PURE__*/React.createElement("button", { style: s.btnPrimary, onClick: onConfigurar }, "⚙️ Configurar en Ajustes → Vehículo")
    ),
    !sinConfigurar && datosDia.totalVendido === 0 && /*#__PURE__*/React.createElement("div", {
      style: { padding: 30, textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }
    }, "No hay ventas registradas ese día."),
    !sinConfigurar && datosDia.totalVendido > 0 && /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("div", { style: s.card },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 } }, "Ventas del día"),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" } },
          /*#__PURE__*/React.createElement("span", null, "Total vendido"), /*#__PURE__*/React.createElement("span", null, fmt(datosDia.totalVendido))),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: "var(--color-text-tertiary)" } },
          /*#__PURE__*/React.createElement("span", null, "− Costo de llenado"), /*#__PURE__*/React.createElement("span", null, "−", fmt(datosDia.totalCostoLlenado))),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, paddingTop: 8, marginTop: 4, borderTop: "1px solid var(--color-border-tertiary)" } },
          /*#__PURE__*/React.createElement("span", null, "Ganancia bruta"),
          /*#__PURE__*/React.createElement("span", { style: { color: "#4dd9a0" } }, datosDia.pctBruto, "% ", /*#__PURE__*/React.createElement("span", { style: { fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400 } }, "(", fmt(datosDia.gananciaBruta), ")")))
      ),
      /*#__PURE__*/React.createElement("div", { style: s.card },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 } },
          "Gasto vehículo (", datosDia.km, " km · ", datosDia.visitas, " cliente", datosDia.visitas === 1 ? "" : "s", ")"),
        datosDia.detalleCostos.map(d => /*#__PURE__*/React.createElement("div", {
          key: d.id,
          style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--color-border-tertiary)" }
        },
          /*#__PURE__*/React.createElement("div", { style: { display: "flex", flexDirection: "column" } },
            /*#__PURE__*/React.createElement("span", { style: { fontSize: 13 } }, d.nombre),
            /*#__PURE__*/React.createElement("span", { style: { fontSize: 10.5, color: "var(--color-text-tertiary)" } },
              d.tipo === "porcentaje" ? `${d.porcentaje}% sobre el gasto vehicular` : `${fmt(d.monto)} / ${d.frecuencia}${d.repiteCada > 1 ? ` cada ${d.repiteCada}` : ""}`)),
          /*#__PURE__*/React.createElement("div", { style: { textAlign: "right" } },
            /*#__PURE__*/React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "#E24B4A", lineHeight: 1.1 } },
              datosDia.totalVendido > 0 ? Math.round(d.montoDia / datosDia.totalVendido * 100) : 0, "%"),
            /*#__PURE__*/React.createElement("div", { style: { fontSize: 10.5, color: "var(--color-text-tertiary)" } }, fmt(d.montoDia))))),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, paddingTop: 8, marginTop: 4 } },
          /*#__PURE__*/React.createElement("span", null, "Total gasto vehículo"),
          /*#__PURE__*/React.createElement("span", { style: { color: "#E24B4A" } }, datosDia.pctBruto - datosDia.pctNeto, "% ", /*#__PURE__*/React.createElement("span", { style: { fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400 } }, "(", fmt(datosDia.gastoVehiculo), ")"))),
        datosDia.clientesSinUbicacion > 0 && /*#__PURE__*/React.createElement("div", { style: { fontSize: 10.5, color: "var(--color-text-tertiary)", marginTop: 6 } },
          "📍 ", datosDia.clientesSinUbicacion, " cliente", datosDia.clientesSinUbicacion === 1 ? "" : "s", " sin ubicación guardada — no entra en el cálculo de km."),
        mostrarAlerta && /*#__PURE__*/React.createElement("div", {
          style: { marginTop: 10, background: "rgba(239,159,39,0.1)", border: "1px solid #EF9F27", borderRadius: 10, padding: "9px 11px", fontSize: 12, color: "#f5c777", lineHeight: 1.4 }
        }, "⚠️ Hoy recorriste bastante para los clientes que atendiste (", datosDia.kmPorCliente.toFixed(1), " km por cliente, contra un promedio del mes de ", promedioKmPorClienteMes.toFixed(1), " km) — por eso el gasto vehicular de hoy pesa más que lo normal.")
      ),
      /*#__PURE__*/React.createElement("div", { style: { ...s.card, border: "1px solid #4dd9a0", background: "rgba(77,217,160,0.06)", textAlign: "center" } },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 2 } }, "GANANCIA NETA DEL DÍA"),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 32, fontWeight: 800, color: datosDia.gananciaNeta >= 0 ? "#4dd9a0" : "#E24B4A", lineHeight: 1.1 } }, datosDia.pctNeto, "%"),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 12.5, color: "var(--color-text-secondary)", marginTop: 2 } }, "de lo vendido · ", fmt(datosDia.gananciaNeta)),
        /*#__PURE__*/React.createElement("div", { style: { height: 9, borderRadius: 6, background: "var(--color-background-tertiary)", marginTop: 12, overflow: "hidden", display: "flex" } },
          /*#__PURE__*/React.createElement("div", { style: { width: `${Math.max(0, Math.min(100, datosDia.pctNeto))}%`, background: "#4dd9a0" } }),
          /*#__PURE__*/React.createElement("div", { style: { width: `${Math.max(0, 100 - Math.min(100, datosDia.pctNeto))}%`, background: "#E24B4A" } }))
      )
    )
  );

  const vistaMes = () => /*#__PURE__*/React.createElement(React.Fragment, null,
    /*#__PURE__*/React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "10px 14px 2px" } },
      /*#__PURE__*/React.createElement("button", { style: { ...s.btn, padding: "4px 10px" }, onClick: () => setMesSel(m => { const [y, mm] = m.split("-").map(Number); const d = new Date(y, mm - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }) }, "◀"),
      /*#__PURE__*/React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", textTransform: "capitalize" } }, nombreMesLegible(mesSel)),
      /*#__PURE__*/React.createElement("button", { style: { ...s.btn, padding: "4px 10px" }, onClick: () => setMesSel(m => { const [y, mm] = m.split("-").map(Number); const d = new Date(y, mm, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }) }, "▶")
    ),
    tabs,
    filasMes.length === 0 && /*#__PURE__*/React.createElement("div", { style: { padding: 30, textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 } }, "No hay ventas registradas ese mes."),
    filasMes.length > 0 && /*#__PURE__*/React.createElement("div", { style: s.card },
      /*#__PURE__*/React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12.5 } },
        /*#__PURE__*/React.createElement("tr", null,
          /*#__PURE__*/React.createElement("th", { style: { textAlign: "left", color: "var(--color-text-tertiary)", fontSize: 10.5, paddingBottom: 6 } }, "Día"),
          /*#__PURE__*/React.createElement("th", { style: { textAlign: "right", color: "var(--color-text-tertiary)", fontSize: 10.5, paddingBottom: 6 } }, "Km"),
          /*#__PURE__*/React.createElement("th", { style: { textAlign: "right", color: "var(--color-text-tertiary)", fontSize: 10.5, paddingBottom: 6 } }, "Neto $"),
          /*#__PURE__*/React.createElement("th", { style: { textAlign: "right", color: "var(--color-text-tertiary)", fontSize: 10.5, paddingBottom: 6 } }, "Neto %")),
        filasMes.map(f => /*#__PURE__*/React.createElement("tr", {
          key: f.fechaKey,
          onClick: () => irADia(f.fechaKey),
          style: { cursor: "pointer", background: f.fechaKey === diaSel ? "rgba(93,170,255,0.12)" : undefined }
        },
          /*#__PURE__*/React.createElement("td", { style: { padding: "6px 4px", borderBottom: "1px solid var(--color-border-tertiary)", color: f.fechaKey === diaSel ? "#5daaff" : "var(--color-text-primary)", fontWeight: f.fechaKey === diaSel ? 700 : 400 } },
            fechaLegible(f.fechaKey), f.fechaKey === diaSel ? " 👁" : ""),
          /*#__PURE__*/React.createElement("td", { style: { padding: "6px 4px", borderBottom: "1px solid var(--color-border-tertiary)", textAlign: "right" } }, f.km || "—"),
          /*#__PURE__*/React.createElement("td", { style: { padding: "6px 4px", borderBottom: "1px solid var(--color-border-tertiary)", textAlign: "right" } }, fmt(f.gananciaNeta)),
          /*#__PURE__*/React.createElement("td", { style: { padding: "6px 4px", borderBottom: "1px solid var(--color-border-tertiary)", textAlign: "right", color: f.pctNeto >= 0 ? "#4dd9a0" : "#E24B4A" } }, f.pctNeto, "%")))),
      (() => {
        const prom = Math.round(filasMes.reduce((a, f) => a + f.pctNeto, 0) / filasMes.length);
        const mejor = filasMes.reduce((a, f) => f.pctNeto > a.pctNeto ? f : a, filasMes[0]);
        const peor = filasMes.reduce((a, f) => f.pctNeto < a.pctNeto ? f : a, filasMes[0]);
        return /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--color-border-tertiary)" } },
          /*#__PURE__*/React.createElement("span", null, "Promedio del mes: ", /*#__PURE__*/React.createElement("b", { style: { color: "var(--color-text-secondary)" } }, prom, "%")),
          /*#__PURE__*/React.createElement("span", null, "Mejor: ", fechaLegible(mejor.fechaKey), " · Peor: ", fechaLegible(peor.fechaKey)));
      })()
    )
  );

  return /*#__PURE__*/React.createElement("div", { style: s.screen },
    /*#__PURE__*/React.createElement("div", { style: s.header },
      /*#__PURE__*/React.createElement("button", { style: s.backBtn, onClick: onVolver }, "← Volver"),
      /*#__PURE__*/React.createElement("div", { style: s.headerTitle }, "📊 Ganancia neta"),
      /*#__PURE__*/React.createElement("button", { style: { ...s.btn, fontSize: 16, padding: "4px 8px" }, title: "Configurar costos de la camioneta", onClick: onConfigurar }, "⚙️")
    ),
    vista === "dia" ? vistaDia() : vistaMes()
  );
}
