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

// ── "Bulto" para la Ganancia neta — definición de Guillermo (18/11/2026,
//    ajustado 19/11/2026): 6 sifones = 1 bulto, bidón 10L = 1 bulto, bidón
//    20L = 1,5 bultos. Un producto NUEVO (no es ninguno de estos 3) cuenta
//    1 unidad vendida = 1 bulto -- "son las unidades que se venden de cada
//    cosa, eso es lo que equivale en bulto" (pedido del usuario). Es
//    DISTINTO del "bulto" que ya existe en la planilla de carga
//    (07-menu.js, bultosAuto), que es para otra cosa (peso/espacio en la
//    camioneta) — no se tocan entre sí, viven cada uno en lo suyo.
function factorBultoPorNombre(nombre) {
  if (!nombre) return 0;
  const n = String(nombre).toLowerCase();
  if (n.includes("20")) return 1.5;
  if (n.includes("10")) return 1;
  if (n.includes("sif") || n.includes("soda")) return 1 / 6;
  return 1;
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

// ── Promedio de días entre cobros (_esCobro), de todo el historial — para
//    saber "cada cuánto se cobra" el fiado en promedio. Pedido de Guillermo,
//    19/11/2026. No usa la ventana de 60 días: el fiado se cobra espaciado,
//    conviene mirar todo el historial para tener una muestra razonable.
function promedioDiasEntreCobros(ventas) {
  const porCliente = {};
  (ventas || []).forEach(v => {
    if (v._esCobro && v.clienteId != null && v.fechaKey) {
      (porCliente[v.clienteId] = porCliente[v.clienteId] || []).push(v.fechaKey);
    }
  });
  const gaps = [];
  Object.values(porCliente).forEach(fechas => {
    const ordenadas = [...new Set(fechas)].sort();
    for (let i = 1; i < ordenadas.length; i++) {
      const dias = Math.round((new Date(ordenadas[i]) - new Date(ordenadas[i - 1])) / 86400000);
      if (dias > 0) gaps.push(dias);
    }
  });
  if (!gaps.length) return null;
  return gaps.reduce((a, b) => a + b, 0) / gaps.length;
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
  // Días de reparto por semana para el cálculo del Objetivo — editable, no
  // depende de DIAS (que es otra cosa, los días con zona asignada). Pedido
  // de Guillermo, 18/11/2026: hoy reparte 4 días, no 5.
  const [diasRepartoInput, setDiasRepartoInput] = React.useState(() => {
    try { return localStorage.getItem("cat_objetivo_dias_semana_v1") || ""; } catch { return ""; }
  });
  // Simulador "¿y si vendo X bultos por día?" — pedido de Guillermo,
  // 19/11/2026: el cálculo inverso al de arriba: no "cuánto necesito
  // vender", sino "si vendo tanto, cuánto me daría de ganancia".
  const [simBultosInput, setSimBultosInput] = React.useState(() => {
    try { return localStorage.getItem("cat_sim_bultos_v1") || ""; } catch { return ""; }
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

  const tabBtn = (key, label, onClick) => /*#__PURE__*/React.createElement("button", {
    onClick: onClick || (() => setVista(key)),
    style: { flex: 1, textAlign: "center", fontSize: 11.5, padding: "8px 2px", background: "none", border: "none", cursor: "pointer",
      color: vista === key ? "#4dd9a0" : "var(--color-text-tertiary)",
      borderBottom: vista === key ? "2px solid #4dd9a0" : "2px solid transparent", fontWeight: vista === key ? 700 : 400 }
  }, label);
  const tabs = /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 3, margin: "6px 14px 10px", borderBottom: "1px solid var(--color-border-tertiary)" }
  },
    tabBtn("dia", "📅 Día", null),
    tabBtn("mes", "📊 Mes", abrirCompararMes),
    tabBtn("zona", "🗺 Zona", () => { setMesZona(diaSel.slice(0, 7)); setVista("zona"); }),
    tabBtn("objetivo", "🎯 Objetivo", null)
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
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0", color: "var(--color-text-primary)" } },
          /*#__PURE__*/React.createElement("span", null, "Total vendido"), /*#__PURE__*/React.createElement("span", null, fmt(datosDia.totalVendido))),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: "var(--color-text-secondary)" } },
          /*#__PURE__*/React.createElement("span", null, "− Costo de llenado"), /*#__PURE__*/React.createElement("span", null, "−", fmt(datosDia.totalCostoLlenado))),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, paddingTop: 8, marginTop: 4, borderTop: "1px solid var(--color-border-tertiary)", color: "var(--color-text-primary)" } },
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
            /*#__PURE__*/React.createElement("span", { style: { fontSize: 13, color: "var(--color-text-primary)" } }, d.nombre),
            /*#__PURE__*/React.createElement("span", { style: { fontSize: 10.5, color: "var(--color-text-secondary)" } },
              d.tipo === "porcentaje" ? `${d.porcentaje}% sobre el gasto vehicular` : `${fmt(d.monto)} / ${d.frecuencia}${d.repiteCada > 1 ? ` cada ${d.repiteCada}` : ""}`)),
          /*#__PURE__*/React.createElement("div", { style: { textAlign: "right" } },
            /*#__PURE__*/React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "#E24B4A", lineHeight: 1.1 } },
              datosDia.totalVendido > 0 ? Math.round(d.montoDia / datosDia.totalVendido * 100) : 0, "%"),
            /*#__PURE__*/React.createElement("div", { style: { fontSize: 10.5, color: "var(--color-text-tertiary)" } }, fmt(d.montoDia))))),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, paddingTop: 8, marginTop: 4, color: "var(--color-text-primary)" } },
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

  // ── Vista "🗺 Zona": compara las zonas asignadas por día de reparto (Lunes
  //    a Viernes), usando los días de ese día-de-semana dentro del mes
  //    elegido con mesZona. — pedido de Guillermo, 18/11/2026. ──────────────
  const mesNavZona = /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "10px 14px 2px" }
  },
    /*#__PURE__*/React.createElement("button", { style: { ...s.btn, padding: "4px 10px" }, onClick: () => setMesZona(m => { const [y, mm] = m.split("-").map(Number); const d = new Date(y, mm - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }) }, "◀"),
    /*#__PURE__*/React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", textTransform: "capitalize" } }, nombreMesLegible(mesZona)),
    /*#__PURE__*/React.createElement("button", { style: { ...s.btn, padding: "4px 10px" }, onClick: () => setMesZona(m => { const [y, mm] = m.split("-").map(Number); const d = new Date(y, mm, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }) }, "▶")
  );

  const topeZona = mesZona === hoy.slice(0, 7) ? hoy : `${mesZona}-31`;
  const diasDelMesZona = diasDelMesHasta(mesZona, topeZona);

  const filasZona = DIAS.map(dia => {
    const diasDeEseDiaSemana = diasDelMesZona.filter(k => diaSemanaDeFecha(k) === dia);
    const datosDias = diasDeEseDiaSemana.map(k => calcularDatosDelDia(k, ventas, clientes, costosVehiculo, casaUbicacion)).filter(d => d.totalVendido > 0);
    const totalVendido = datosDias.reduce((a, d) => a + d.totalVendido, 0);
    const gananciaNetaZona = datosDias.reduce((a, d) => a + d.gananciaNeta, 0);
    const totalBultos = datosDias.reduce((a, d) => a + d.totalBultos, 0);
    const clientesZona = datosDias.reduce((a, d) => a + d.visitas, 0);
    const km = datosDias.reduce((a, d) => a + d.km, 0);
    return {
      dia, zona: (zonasReparto || {})[dia] || "",
      diasConDatos: datosDias.length, totalVendido, gananciaNeta: gananciaNetaZona, totalBultos, clientes: clientesZona, km,
      pctNeto: totalVendido > 0 ? Math.round(gananciaNetaZona / totalVendido * 100) : 0,
      bultosPorCliente: clientesZona > 0 ? totalBultos / clientesZona : 0,
      kmPromedioDia: datosDias.length > 0 ? km / datosDias.length : 0,
      kmPorCliente: clientesZona > 0 ? km / clientesZona : 0,
    };
  }).filter(f => f.zona && f.diasConDatos > 0);

  const sinZona = DIAS.filter(dia => !(zonasReparto || {})[dia]);
  const mejorZona = filasZona.length ? filasZona.reduce((a, f) => f.pctNeto > a.pctNeto ? f : a, filasZona[0]) : null;
  const peorZona = filasZona.length ? filasZona.reduce((a, f) => f.pctNeto < a.pctNeto ? f : a, filasZona[0]) : null;

  const vistaZona = () => /*#__PURE__*/React.createElement(React.Fragment, null,
    mesNavZona, tabs,
    filasZona.length === 0 && /*#__PURE__*/React.createElement("div", { style: { padding: 30, textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 } }, "No hay zonas con ventas registradas ese mes."),
    filasZona.map(f => {
      const esMejor = mejorZona && f.dia === mejorZona.dia;
      const esPeor = peorZona && f.dia === peorZona.dia && filasZona.length > 1 && !esMejor;
      return /*#__PURE__*/React.createElement("div", {
        key: f.dia,
        style: { ...s.card, position: "relative", ...(esMejor ? { border: "1px solid #4dd9a0" } : esPeor ? { border: "1px solid #E24B4A" } : {}) }
      },
        esMejor && /*#__PURE__*/React.createElement("div", { style: { position: "absolute", top: -10, right: 12, fontSize: 10.5, fontWeight: 800, padding: "2px 9px", borderRadius: 12, background: "#0d2318", color: "#4dd9a0", border: "1px solid #4dd9a0" } }, "🏆 MEJOR ZONA"),
        esPeor && /*#__PURE__*/React.createElement("div", { style: { position: "absolute", top: -10, right: 12, fontSize: 10.5, fontWeight: 800, padding: "2px 9px", borderRadius: 12, background: "#2a0f0f", color: "#E24B4A", border: "1px solid #E24B4A" } }, "⚠ LA MÁS COSTOSA"),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 } },
          /*#__PURE__*/React.createElement("div", null,
            /*#__PURE__*/React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" } }, f.zona),
            /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "var(--color-text-secondary)" } }, f.dia)),
          /*#__PURE__*/React.createElement("div", { style: { fontSize: 22, fontWeight: 800, color: f.pctNeto >= 0 ? "#4dd9a0" : "#E24B4A" } }, f.pctNeto, "%")),
        /*#__PURE__*/React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 11, color: "var(--color-text-secondary)", borderTop: "1px solid var(--color-border-tertiary)", paddingTop: 8 } },
          /*#__PURE__*/React.createElement("div", null, "Clientes", /*#__PURE__*/React.createElement("b", { style: { display: "block", color: "var(--color-text-primary)", fontSize: 13 } }, f.clientes)),
          /*#__PURE__*/React.createElement("div", null, "Bultos/cliente", /*#__PURE__*/React.createElement("b", { style: { display: "block", color: "var(--color-text-primary)", fontSize: 13 } }, f.bultosPorCliente.toFixed(1))),
          /*#__PURE__*/React.createElement("div", null, "Ventas (mes)", /*#__PURE__*/React.createElement("b", { style: { display: "block", color: "var(--color-text-primary)", fontSize: 13 } }, fmt(f.totalVendido))),
          /*#__PURE__*/React.createElement("div", null, "Neto (mes)", /*#__PURE__*/React.createElement("b", { style: { display: "block", color: "var(--color-text-primary)", fontSize: 13 } }, fmt(f.gananciaNeta))),
          /*#__PURE__*/React.createElement("div", null, "Km prom./día", /*#__PURE__*/React.createElement("b", { style: { display: "block", color: "var(--color-text-primary)", fontSize: 13 } }, f.kmPromedioDia.toFixed(0), " km")),
          /*#__PURE__*/React.createElement("div", null, "Km/cliente", /*#__PURE__*/React.createElement("b", { style: { display: "block", color: "var(--color-text-primary)", fontSize: 13 } }, f.kmPorCliente.toFixed(1)))));
    }),
    (() => {
      // “Qué le falta a cada día” — pedido de Guillermo, 19/11/2026:
      // comparar, promedio por jornada (no total del mes, para que sea
      // parejo aunque un día haya caído más o menos veces este mes), cuántos
      // clientes y cuánta venta le faltan a cada día para igualar al mejor.
      const filasConProm = filasZona.map(f => ({
        ...f,
        clientesProm: f.diasConDatos > 0 ? f.clientes / f.diasConDatos : 0,
        ventaProm: f.diasConDatos > 0 ? f.totalVendido / f.diasConDatos : 0,
      }));
      if (filasConProm.length < 2) return null;
      const diaMejorVenta = filasConProm.reduce((a, f) => f.ventaProm > a.ventaProm ? f : a, filasConProm[0]);
      const mejorClientesProm = Math.max(...filasConProm.map(f => f.clientesProm));
      const mejorVentaProm = diaMejorVenta.ventaProm;
      // "Si emparejás los días con el mejor" — pedido de Guillermo,
      // 19/11/2026: si TODOS los días facturaran como el mejor día, usando
      // el mismo % neto que ese día realmente tuvo (no el promedio general),
      // cuánto daría de ganancia neta por mes.
      const gananciaNetaRealMesZona = filasZona.reduce((a, f) => a + f.gananciaNeta, 0);
      const ventaProyectadaMes = mejorVentaProm * diasRepartoMes;
      const gananciaNetaProyectadaMes = ventaProyectadaMes * (diaMejorVenta.pctNeto / 100);
      const diferenciaProyeccion = gananciaNetaProyectadaMes - gananciaNetaRealMesZona;

      return /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("div", { style: s.card },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 10 } },
          "📉 Qué le falta a cada día (promedio por jornada, vs ", diaMejorVenta.dia, ")"),
        filasConProm.map((f, i) => {
          const esElMejor = f.dia === diaMejorVenta.dia;
          const faltanClientes = Math.max(0, Math.round(mejorClientesProm - f.clientesProm));
          // La venta que falta se deriva de los clientes que faltan × tu
          // promedio real de $/cliente (no de restar los promedios de venta
          // de cada día, que tienen su propio $/cliente y no cierran entre
          // sí) — corrección pedida por Guillermo, 19/11/2026.
          const faltaVenta = hayDatosObjetivo && ventaPorClienteProm > 0
            ? faltanClientes * ventaPorClienteProm
            : Math.max(0, mejorVentaProm - f.ventaProm);
          return /*#__PURE__*/React.createElement("div", {
            key: f.dia,
            style: { padding: "8px 0", borderTop: i > 0 ? "1px solid var(--color-border-tertiary)" : "none" }
          },
            /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13 } },
              /*#__PURE__*/React.createElement("span", { style: { fontWeight: 700, color: "var(--color-text-primary)" } }, f.dia),
              /*#__PURE__*/React.createElement("span", { style: { color: "var(--color-text-secondary)" } }, "≈", f.clientesProm.toFixed(1), " clientes · ", fmt(f.ventaProm), "/jornada")),
            esElMejor
              ? /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, color: "#4dd9a0", marginTop: 2 } }, "🏆 Tu mejor día")
              : /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, color: "#f5b942", marginTop: 2 } },
                  "Le faltan ≈", faltanClientes, " cliente", faltanClientes === 1 ? "" : "s", " y ", fmt(faltaVenta), " en venta por jornada para igualar a ", diaMejorVenta.dia));
        }),
        ventaPorClienteProm > 0 && /*#__PURE__*/React.createElement("div", { style: { fontSize: 10.5, color: "var(--color-text-tertiary)", marginTop: 8 } },
          "La venta que falta = clientes que faltan × tu promedio real de ", fmt(ventaPorClienteProm), "/cliente (de los últimos ", diasVentanaObjetivo, " días) — no el promedio propio de cada día.")
      ),
      /*#__PURE__*/React.createElement("div", { style: { ...s.card, border: "1px solid #4dd9a0", background: "rgba(77,217,160,0.06)" } },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 10 } },
          "💡 Si emparejás tus ", diasRepartoSemana, " días con ", diaMejorVenta.dia),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: "var(--color-text-secondary)" } },
          /*#__PURE__*/React.createElement("span", null, "Venta/jornada al nivel de ", diaMejorVenta.dia),
          /*#__PURE__*/React.createElement("b", { style: { color: "var(--color-text-primary)" } }, fmt(mejorVentaProm))),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: "var(--color-text-secondary)" } },
          /*#__PURE__*/React.createElement("span", null, "Venta proyectada /mes"),
          /*#__PURE__*/React.createElement("b", { style: { color: "var(--color-text-primary)" } }, fmt(ventaProyectadaMes))),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, padding: "6px 0", marginTop: 4, borderTop: "1px solid var(--color-border-tertiary)" } },
          /*#__PURE__*/React.createElement("span", { style: { color: "var(--color-text-primary)" } }, "Ganancia neta proyectada /mes (a ", diaMejorVenta.pctNeto, "%)"),
          /*#__PURE__*/React.createElement("span", { style: { color: "#4dd9a0" } }, fmt(gananciaNetaProyectadaMes))),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 12.5, color: "var(--color-text-secondary)", marginTop: 6 } },
          "Hoy tenés (los días con zona asignada, este mes): ", fmt(gananciaNetaRealMesZona), " netos — ",
          diferenciaProyeccion > 0
            ? /*#__PURE__*/React.createElement("b", { style: { color: "#f5b942" } }, Math.round(diferenciaProyeccion / Math.max(gananciaNetaRealMesZona, 1) * 100), "% más si emparejás (", fmt(diferenciaProyeccion), " extra)")
            : /*#__PURE__*/React.createElement("b", { style: { color: "#4dd9a0" } }, "ya estás a ese nivel")),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 10.5, color: "var(--color-text-tertiary)", marginTop: 6 } },
          "Usa el % neto real que tuvo ", diaMejorVenta.dia, " (", diaMejorVenta.pctNeto, "%), no el promedio general — es la hipótesis más fiel a “todos los días rinden como ese día”.")
      )
      );
    })(),
    sinZona.length > 0 && /*#__PURE__*/React.createElement("div", { style: { fontSize: 11.5, color: "var(--color-text-tertiary)", textAlign: "center", marginTop: 6 } },
      "(", sinZona.join(", "), " ", sinZona.length === 1 ? "no tiene" : "no tienen", " zona asignada todavía)")
  );

  // ── Vista "🎯 Objetivo": con tu promedio real de los últimos 60 días,
  //    cuánto necesitás vender/atender por día para llegar a la ganancia neta
  //    mensual que escribas. — pedido de Guillermo, 18/11/2026. ───────────
  const diasVentanaObjetivo = 60;
  const diasObjetivoKeys = [];
  for (let i = 0; i < diasVentanaObjetivo; i++) diasObjetivoKeys.push(sumarDiasKey(hoy, -i));
  const datosVentanaObjetivo = diasObjetivoKeys.map(k => calcularDatosDelDia(k, ventas, clientes, costosVehiculo, casaUbicacion)).filter(d => d.totalVendido > 0);
  const totalVendidoVentana = datosVentanaObjetivo.reduce((a, d) => a + d.totalVendido, 0);
  const totalNetoVentana = datosVentanaObjetivo.reduce((a, d) => a + d.gananciaNeta, 0);
  const totalBultosVentana = datosVentanaObjetivo.reduce((a, d) => a + d.totalBultos, 0);
  const totalClientesVentana = datosVentanaObjetivo.reduce((a, d) => a + d.visitas, 0);
  const hayDatosObjetivo = totalVendidoVentana > 0 && totalClientesVentana > 0 && totalBultosVentana > 0;
  const pctNetoProm = hayDatosObjetivo ? totalNetoVentana / totalVendidoVentana : 0;
  const ventaPorClienteProm = hayDatosObjetivo ? totalVendidoVentana / totalClientesVentana : 0;
  const precioPorBultoProm = hayDatosObjetivo ? totalVendidoVentana / totalBultosVentana : 0;
  const bultosPorClienteProm = hayDatosObjetivo ? totalBultosVentana / totalClientesVentana : 0;
  // Días de reparto reales detectados (cuántos días de la semana distintos
  // tuvieron ventas en los últimos 60 días) — si el campo de abajo está
  // vacío, arrancamos de acá en vez de asumir los 5 días de DIAS. Corrección
  // pedida por Guillermo, 19/11/2026 (él reparte 4 días, no 5).
  const diasRepartoDetectado = new Set(datosVentanaObjetivo.map(d => diaSemanaDeFecha(d.fechaKey))).size || DIAS.length;
  const diasRepartoSemana = Number(diasRepartoInput) > 0 ? Number(diasRepartoInput) : diasRepartoDetectado;
  const guardarDiasReparto = valor => {
    setDiasRepartoInput(valor);
    try { localStorage.setItem("cat_objetivo_dias_semana_v1", valor); } catch {}
  };
  const diasRepartoMes = diasRepartoSemana * (30.44 / 7);

  const objetivoNum = Number(String(objetivoInput).replace(/[^\d]/g, "")) || 0;
  const guardarObjetivo = valor => {
    setObjetivoInput(valor);
    try { localStorage.setItem("cat_objetivo_neto_v1", valor); } catch {}
  };

  const gananciaNetaDiaNecesaria = objetivoNum > 0 && hayDatosObjetivo ? objetivoNum / diasRepartoMes : 0;
  const ventaDiaNecesaria = pctNetoProm > 0 ? gananciaNetaDiaNecesaria / pctNetoProm : 0;
  const clientesDiaNecesarios = ventaPorClienteProm > 0 ? ventaDiaNecesaria / ventaPorClienteProm : 0;
  const bultosDiaNecesarios = precioPorBultoProm > 0 ? ventaDiaNecesaria / precioPorBultoProm : 0;

  // Real vs Objetivo — pedido de Guillermo, 19/11/2026: no comparar
  // hipótesis entre sí, sino lo que REALMENTE estás generando ahora (de
  // tus ventas reales de los últimos 60 días) contra tu objetivo real (el
  // que cargaste arriba: días y $ por mes).
  const gananciaNetaMensualReal = hayDatosObjetivo ? (totalNetoVentana / diasVentanaObjetivo) * 30.44 : 0;
  const ventaMensualReal = hayDatosObjetivo ? (totalVendidoVentana / diasVentanaObjetivo) * 30.44 : 0;
  const clientesMensualReal = hayDatosObjetivo ? (totalClientesVentana / diasVentanaObjetivo) * 30.44 : 0;
  const bultosMensualReal = hayDatosObjetivo ? (totalBultosVentana / diasVentanaObjetivo) * 30.44 : 0;

  const ventaMensualObjetivo = ventaDiaNecesaria * diasRepartoMes;
  const clientesMensualObjetivo = clientesDiaNecesarios * diasRepartoMes;
  const bultosMensualObjetivo = bultosDiaNecesarios * diasRepartoMes;
  const faltaGananciaNeta = objetivoNum - gananciaNetaMensualReal;

  // Info aparte (no entra en la comparación ni en "te faltan"): el fiado ya
  // cuenta como ganancia (la venta ya se hizo), esto es solo referencia de
  // cuánta plata está "a plazo" sin cobrar todavía, y cada cuánto se cobra.
  const fiadoPendienteTotal = (clientes || []).filter(c => (c.saldo || 0) < 0).reduce((a, c) => a + Math.abs(c.saldo), 0);
  const promedioDiasCobro = React.useMemo(() => promedioDiasEntreCobros(ventas), [ventas]);

  // Detalle día por día (Martes, Miércoles, Jueves, Viernes...) — pedido de
  // Guillermo, 19/11/2026: ver bultos reales por jornada de CADA día de la
  // semana, no solo un promedio mensual, y cuántos bultos necesitaría cada
  // jornada para el objetivo, manteniendo los días actuales o sumando uno más.
  const filasDiaObjetivo = DIAS.map(dia => {
    const diasDeEseDiaSemana = diasObjetivoKeys.filter(k => diaSemanaDeFecha(k) === dia);
    const datosDias = diasDeEseDiaSemana.map(k => calcularDatosDelDia(k, ventas, clientes, costosVehiculo, casaUbicacion)).filter(d => d.totalVendido > 0);
    const n = datosDias.length;
    const clientesProm = n > 0 ? datosDias.reduce((a, d) => a + d.visitas, 0) / n : 0;
    const bultosProm = n > 0 ? datosDias.reduce((a, d) => a + d.totalBultos, 0) / n : 0;
    return {
      dia, diasConDatos: n, clientesProm, bultosProm,
      ventaProm: n > 0 ? datosDias.reduce((a, d) => a + d.totalVendido, 0) / n : 0,
      // bultos/cliente REAL de ese día específico — cada día tiene su propia
      // compra promedio por cliente (Guillermo, 19/11/2026: Jueves es corto
      // y eficiente con buena compra; Martes es más lejos, menos clientes,
      // pero compensa con más compra por cliente — no son todos iguales).
      bultosPorClienteReal: clientesProm > 0 ? bultosProm / clientesProm : 0,
    };
  }).filter(f => f.diasConDatos > 0);



  const vistaObjetivo = () => /*#__PURE__*/React.createElement(React.Fragment, null,
    tabs,
    !hayDatosObjetivo && /*#__PURE__*/React.createElement("div", { style: { padding: 30, textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 } },
      "No hay suficientes ventas en los últimos ", diasVentanaObjetivo, " días para calcular tu promedio real."),
    hayDatosObjetivo && /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("div", { style: s.card },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 } }, "Tu promedio real (últimos ", diasVentanaObjetivo, " días)"),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: "var(--color-text-secondary)" } }, /*#__PURE__*/React.createElement("span", null, "Ganancia neta promedio"), /*#__PURE__*/React.createElement("b", { style: { color: "var(--color-text-primary)" } }, Math.round(pctNetoProm * 100), "%")),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: "var(--color-text-secondary)" } }, /*#__PURE__*/React.createElement("span", null, "Venta promedio por cliente"), /*#__PURE__*/React.createElement("b", { style: { color: "var(--color-text-primary)" } }, fmt(ventaPorClienteProm))),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: "var(--color-text-secondary)" } }, /*#__PURE__*/React.createElement("span", null, "Precio promedio por bulto"), /*#__PURE__*/React.createElement("b", { style: { color: "var(--color-text-primary)" } }, fmt(precioPorBultoProm))),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: "var(--color-text-secondary)" } }, /*#__PURE__*/React.createElement("span", null, "Bultos por cliente"), /*#__PURE__*/React.createElement("b", { style: { color: "var(--color-text-primary)" } }, bultosPorClienteProm.toFixed(1))),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "4px 0", color: "var(--color-text-secondary)" } },
          /*#__PURE__*/React.createElement("span", null, "Días de reparto por semana"),
          /*#__PURE__*/React.createElement("input", {
            type: "number", min: 1, max: 7, inputMode: "numeric",
            value: diasRepartoInput || String(diasRepartoDetectado),
            onChange: e => guardarDiasReparto(e.target.value),
            style: { width: 44, padding: "4px 6px", borderRadius: 6, border: "1px solid var(--color-border-secondary)", background: "var(--color-background-tertiary)", color: "var(--color-text-primary)", fontSize: 14, fontWeight: 700, textAlign: "center", boxSizing: "border-box" }
          }))
      ),
      /*#__PURE__*/React.createElement("div", { style: s.card },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 } }, "🔢 ¿Y si vendo X bultos por día?"),
        /*#__PURE__*/React.createElement("input", {
          type: "number", inputMode: "numeric",
          value: simBultosInput,
          onChange: e => { setSimBultosInput(e.target.value); try { localStorage.setItem("cat_sim_bultos_v1", e.target.value); } catch {} },
          placeholder: "Ej: 90",
          style: { width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--color-border-secondary)", background: "var(--color-background-tertiary)", color: "var(--color-text-primary)", fontSize: 17, fontWeight: 700, boxSizing: "border-box" }
        }),
        (() => {
          const simBultos = Number(simBultosInput) || 0;
          if (simBultos <= 0 || !hayDatosObjetivo) return null;
          const simVentaDia = simBultos * precioPorBultoProm;
          const simGananciaNetaDia = simVentaDia * pctNetoProm;
          return /*#__PURE__*/React.createElement(React.Fragment, null,
            /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0 2px", marginTop: 8, borderTop: "1px solid var(--color-border-tertiary)", color: "var(--color-text-secondary)" } },
              /*#__PURE__*/React.createElement("span", null, "Venta estimada /día"),
              /*#__PURE__*/React.createElement("b", { style: { color: "var(--color-text-primary)" } }, fmt(simVentaDia))),
            /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, padding: "4px 0" } },
              /*#__PURE__*/React.createElement("span", { style: { color: "var(--color-text-primary)" } }, "Ganancia neta estimada /día (a tu ", Math.round(pctNetoProm * 100), "%)"),
              /*#__PURE__*/React.createElement("span", { style: { color: "#4dd9a0" } }, fmt(simGananciaNetaDia))),
            /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: "var(--color-text-secondary)" } },
              /*#__PURE__*/React.createElement("span", null, "Venta estimada /mes (", diasRepartoSemana, " días/sem.)"),
              /*#__PURE__*/React.createElement("b", { style: { color: "var(--color-text-primary)" } }, fmt(simVentaDia * diasRepartoMes))),
            /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, padding: "4px 0" } },
              /*#__PURE__*/React.createElement("span", { style: { color: "var(--color-text-primary)" } }, "Ganancia neta estimada /mes"),
              /*#__PURE__*/React.createElement("span", { style: { color: "#4dd9a0" } }, fmt(simGananciaNetaDia * diasRepartoMes))));
        })(),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 10.5, color: "var(--color-text-tertiary)", marginTop: 6 } },
          "Usa tu precio promedio real por bulto (", fmt(precioPorBultoProm), ") y tu % neto real promedio (", Math.round(pctNetoProm * 100), "%) de los últimos ", diasVentanaObjetivo, " días.")
      ),
      /*#__PURE__*/React.createElement("div", { style: s.card },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 } }, "¿Cuánto querés ganar NETO por mes?"),
        /*#__PURE__*/React.createElement("input", {
          type: "text", inputMode: "numeric",
          value: objetivoInput,
          onChange: e => guardarObjetivo(e.target.value),
          placeholder: "Ej: 4.000.000",
          style: { width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--color-border-secondary)", background: "var(--color-background-tertiary)", color: "var(--color-text-primary)", fontSize: 17, fontWeight: 700, boxSizing: "border-box" }
        })
      ),
      objetivoNum > 0 && /*#__PURE__*/React.createElement("div", { style: { ...s.card, border: "1px solid #4dd9a0", background: "rgba(77,217,160,0.06)" } },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 10 } },
          "PARA LLEGAR A ", fmt(objetivoNum), " NETOS/MES, NECESITÁS POR CADA DÍA DE REPARTO (≈", diasRepartoMes.toFixed(1), " días/mes):"),
        [
          ["Ganancia neta por día", fmt(gananciaNetaDiaNecesaria)],
          ["Venta por día (a tu " + Math.round(pctNetoProm * 100) + "%)", fmt(ventaDiaNecesaria)],
          ["Clientes por día (a " + fmt(ventaPorClienteProm) + " c/u)", "≈" + Math.round(clientesDiaNecesarios)],
          ["Bultos por día (a " + fmt(precioPorBultoProm) + " c/u)", "≈" + Math.round(bultosDiaNecesarios)],
        ].map(([label, val], i) => /*#__PURE__*/React.createElement("div", {
          key: i,
          style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: i < 3 ? "1px solid var(--color-border-tertiary)" : "none" }
        },
          /*#__PURE__*/React.createElement("span", { style: { fontSize: 13, color: "var(--color-text-secondary)" } }, label),
          /*#__PURE__*/React.createElement("span", { style: { fontSize: 19, fontWeight: 800, color: "#4dd9a0" } }, val)))
      ),
      objetivoNum > 0 && /*#__PURE__*/React.createElement("div", { style: s.card },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 10 } },
          "Dónde estás vs. tu objetivo"),
        /*#__PURE__*/React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 4, fontSize: 10.5, color: "var(--color-text-tertiary)", marginBottom: 4 } },
          /*#__PURE__*/React.createElement("div", null),
          /*#__PURE__*/React.createElement("div", { style: { textAlign: "right", fontWeight: 700 } }, "Real (", diasVentanaObjetivo, "d)"),
          /*#__PURE__*/React.createElement("div", { style: { textAlign: "right", fontWeight: 700, color: "#4dd9a0" } }, "Objetivo")),
        [
          ["Ganancia neta /mes", gananciaNetaMensualReal, objetivoNum, v => fmt(v)],
          ["Venta /mes", ventaMensualReal, ventaMensualObjetivo, v => fmt(v)],
          ["Clientes /mes", clientesMensualReal, clientesMensualObjetivo, v => "≈" + Math.round(v)],
          ["Bultos /mes", bultosMensualReal, bultosMensualObjetivo, v => "≈" + Math.round(v)],
        ].map(([label, a, b, formatear], i) => /*#__PURE__*/React.createElement("div", {
          key: i,
          style: { display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 4, fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--color-border-tertiary)", alignItems: "center" }
        },
          /*#__PURE__*/React.createElement("span", { style: { color: "var(--color-text-secondary)" } }, label),
          /*#__PURE__*/React.createElement("span", { style: { textAlign: "right", color: "var(--color-text-primary)", fontWeight: 700 } }, formatear(a)),
          /*#__PURE__*/React.createElement("span", { style: { textAlign: "right", color: "#4dd9a0", fontWeight: 700 } }, formatear(b)))),
        /*#__PURE__*/React.createElement("div", {
          style: { marginTop: 10, textAlign: "center", fontSize: 13, fontWeight: 700, color: faltaGananciaNeta > 0 ? "#f5b942" : "#4dd9a0" }
        }, faltaGananciaNeta > 0 ? `Te faltan ${fmt(faltaGananciaNeta)} netos más por mes para llegar` : "🎉 Ya estás llegando a tu objetivo"),
        /*#__PURE__*/React.createElement("div", { style: { marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--color-border-tertiary)" } },
          /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0", color: "var(--color-text-secondary)" } },
            /*#__PURE__*/React.createElement("span", null, "Fiado pendiente de cobro"),
            /*#__PURE__*/React.createElement("b", { style: { color: "var(--color-text-primary)" } }, fmt(fiadoPendienteTotal))),
          promedioDiasCobro != null && /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0", color: "var(--color-text-secondary)" } },
            /*#__PURE__*/React.createElement("span", null, "Promedio de cobro"),
            /*#__PURE__*/React.createElement("b", { style: { color: "var(--color-text-primary)" } }, "cada ~", Math.round(promedioDiasCobro), " días")),
          /*#__PURE__*/React.createElement("div", { style: { fontSize: 10.5, color: "var(--color-text-tertiary)", marginTop: 4 } },
            "El fiado ya cuenta como ganancia (la venta ya se hizo) — esto es solo para que sepas cuánta plata está ‘a plazo’ sin cobrar.")
        )
      ),
      objetivoNum > 0 && filasDiaObjetivo.length > 0 && /*#__PURE__*/React.createElement("div", { style: s.card },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 } },
          "📅 Bultos por día: lo real vs. lo que necesitás"),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 10 } },
          "Cuántos bultos vendés, en promedio, CADA jornada de ese día (últimos ", diasVentanaObjetivo, " días) — contra cuántos necesitarías vender en CADA jornada para llegar a tu objetivo repartido en tus ", diasRepartoSemana, " días de reparto por semana."),
        /*#__PURE__*/React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 10.5, color: "var(--color-text-tertiary)", marginBottom: 4 } },
          /*#__PURE__*/React.createElement("div", null),
          /*#__PURE__*/React.createElement("div", { style: { textAlign: "right", fontWeight: 700 } }, "Real/jornada"),
          /*#__PURE__*/React.createElement("div", { style: { textAlign: "right", fontWeight: 700, color: "#4dd9a0" } }, "Necesario")),
        filasDiaObjetivo.map((f, i) => {
          const faltan = Math.max(0, Math.round(bultosDiaNecesarios - f.bultosProm));
          const bultosPorClienteNecesario = f.clientesProm > 0 ? bultosDiaNecesarios / f.clientesProm : null;
          return /*#__PURE__*/React.createElement("div", {
            key: f.dia,
            style: { padding: "6px 0", borderTop: i > 0 ? "1px solid var(--color-border-tertiary)" : "none" }
          },
            /*#__PURE__*/React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 13, alignItems: "center" } },
              /*#__PURE__*/React.createElement("span", { style: { fontWeight: 700, color: "var(--color-text-primary)" } }, f.dia),
              /*#__PURE__*/React.createElement("span", { style: { textAlign: "right", color: faltan > 0 ? "#E24B4A" : "#4dd9a0", fontWeight: 700 } }, Math.round(f.bultosProm), " bultos"),
              /*#__PURE__*/React.createElement("span", { style: { textAlign: "right", color: "#4dd9a0", fontWeight: 700 } }, Math.round(bultosDiaNecesarios), " bultos")),
            /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 } },
              "≈", f.clientesProm.toFixed(1), " clientes reales · ", f.bultosPorClienteReal.toFixed(1), " bultos/cliente real",
              bultosPorClienteNecesario != null && (" · necesitarías ≈" + bultosPorClienteNecesario.toFixed(1) + " bultos/cliente")),
            faltan > 0
              ? /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#f5b942", marginTop: 2 } }, "Le faltan ≈", faltan, " bultos esa jornada para llegar al objetivo")
              : /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#4dd9a0", marginTop: 2 } }, "✅ Ya llega al objetivo"));
        }),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 10.5, color: "var(--color-text-tertiary)", marginTop: 8 } },
          "Cada día tiene su propia cantidad real de clientes y su propia compra por cliente (un día lejos con pocos clientes puede compensar con compras más grandes, uno corto y eficiente puede tener más clientes) — por eso “necesitarías ≈X bultos/cliente” sale distinto en cada fila, aunque el total de bultos necesarios por jornada sea el mismo."),
        (() => {
          const diasSinDatos = DIAS.filter(d => !filasDiaObjetivo.some(f => f.dia === d));
          return diasSinDatos.length > 0 && /*#__PURE__*/React.createElement("div", { style: { fontSize: 10.5, color: "var(--color-text-tertiary)", marginTop: 6 } },
            "(", diasSinDatos.join(", "), " no ", diasSinDatos.length === 1 ? "tiene" : "tienen", " ventas registradas en los últimos ", diasVentanaObjetivo, " días, por eso no ", diasSinDatos.length === 1 ? "aparece" : "aparecen", " acá)");
        })()
      )
    )
  );

  return /*#__PURE__*/React.createElement("div", { style: s.screen },
    /*#__PURE__*/React.createElement("div", { style: s.header },
      /*#__PURE__*/React.createElement("button", { style: s.backBtn, onClick: onVolver }, "← Volver"),
      /*#__PURE__*/React.createElement("div", { style: s.headerTitle }, "📊 Ganancia neta"),
      /*#__PURE__*/React.createElement("button", { style: { ...s.btn, fontSize: 16, padding: "4px 8px" }, title: "Configurar costos de la camioneta", onClick: onConfigurar }, "⚙️")
    ),
    vista === "dia" ? vistaDia() : vista === "mes" ? vistaMes() : vista === "zona" ? vistaZona() : vistaObjetivo()
  );
}
