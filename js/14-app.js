// ════════════════════════════════════════════════════════════════════
// ◆  14-app.js — Componente App principal
// ════════════════════════════════════════════════════════════════════

// Al cobrar una deuda, marca las ventas fiado más viejas del cliente como
// pagadas (o parcialmente pagadas) en orden FIFO, hasta agotar el monto
// cobrado. No toca ventas que no sean fiado, ni cobros/ajustes/cambios.
function aplicarCobroAVentasFiado(ventasPrev, clienteId, monto) {
  let restante = Number(monto) || 0;
  const idsAfectados = [];
  const cambios = {};
  const pendientes = ventasPrev.filter(v => v.clienteId === clienteId && v.pago === "fiado" && !v._esCobro && !v._esAjuste && !v._esCambio && !v._pagada).sort((a, b) => (a.id || 0) - (b.id || 0));
  for (const v of pendientes) {
    if (restante <= 0) break;
    const yaPagado = Number(v._montoPagadoAcum) || 0;
    const debe = (Number(v.neto) || 0) - yaPagado;
    if (debe <= 0) continue;
    if (restante >= debe) {
      cambios[v.id] = {
        _pagada: true,
        _montoPagadoAcum: Number(v.neto) || 0,
        _upd: Date.now()
      };
      restante -= debe;
    } else {
      cambios[v.id] = {
        _pagada: false,
        _montoPagadoAcum: yaPagado + restante,
        _upd: Date.now()
      };
      restante = 0;
    }
    idsAfectados.push(v.id);
  }
  const ventasActualizadas = ventasPrev.map(v => cambios[v.id] ? {
    ...v,
    ...cambios[v.id]
  } : v);
  return {
    ventasActualizadas,
    idsAfectados
  };
}

// KEY_PROD_ENV está definido en 03-utils.js (se comparte, mismo alcance global).

// Prestado histórico de un cliente para un producto — se usa UNA sola vez,
// para sembrar el campo c.prestado la primera vez que se toca ese cliente
// con este sistema. Después, c.prestado se mantiene solo con sumas y restas
// directas (ya no hace falta recorrer todo el historial de nuevo).
function prestadoHistoricoDe(ventasPrev, clienteId, k) {
  let n = 0;
  (ventasPrev || []).forEach(v => {
    if (v.clienteId !== clienteId) return;
    (v.envPrest || []).forEach(e => {
      if (KEY_PROD_ENV[e.prod] === k) n += Number(e.cant) || 0;
    });
    (v.envDev || []).forEach(e => {
      if (KEY_PROD_ENV[e.prod] === k) n -= Number(e.cant) || 0;
    });
  });
  return Math.max(0, n);
}

// Aplica el movimiento de envases de UNA venta al cliente:
// - Préstamo: se suma directo a c.prestado[k].
// - Devolución: primero descuenta de c.prestado[k]. Si devuelve más de lo
//   que tenía prestado, el resto se descuenta del stock FIJO del cliente
//   (c.sifon/bidon10/bidon20) — ya no es devolver un préstamo, es que se
//   queda con menos envases propios.
function aplicarMovimientoEnvases(clientesPrev, ventasPrev, clienteId, envPrest, envDev) {
  return (clientesPrev || []).map(c => {
    if (c.id !== clienteId) return c;
    const prestado = {
      sifon: c.prestado?.sifon,
      bidon10: c.prestado?.bidon10,
      bidon20: c.prestado?.bidon20,
      dispenser: c.prestado?.dispenser
    };
    const fijo = {
      sifon: Number(c.sifon) || 0,
      bidon10: Number(c.bidon10) || 0,
      bidon20: Number(c.bidon20) || 0
    };
    const seed = k => {
      if (prestado[k] === undefined) prestado[k] = prestadoHistoricoDe(ventasPrev, clienteId, k);
    };
    (envPrest || []).forEach(e => {
      const k = KEY_PROD_ENV[e.prod];
      const cant = Number(e.cant) || 0;
      if (!k || cant <= 0) return;
      seed(k);
      prestado[k] += cant;
    });
    (envDev || []).forEach(e => {
      const k = KEY_PROD_ENV[e.prod];
      let cant = Number(e.cant) || 0;
      if (!k || cant <= 0) return;
      seed(k);
      const deLoPrestado = Math.min(prestado[k], cant);
      prestado[k] -= deLoPrestado;
      cant -= deLoPrestado;
      if (cant > 0) fijo[k] = Math.max(0, fijo[k] - cant);
    });
    ["sifon", "bidon10", "bidon20", "dispenser"].forEach(k => {
      if (prestado[k] === undefined) prestado[k] = c.prestado?.[k] || 0;
    });
    return {
      ...c,
      prestado,
      sifon: fijo.sifon,
      bidon10: fijo.bidon10,
      bidon20: fijo.bidon20
    };
  });
}

// Busca el próximo cliente pendiente del día (sin venta ni "no quiso"/"no
// está" x2 registrados hoy) para saltar automático después de marcar "no
// está" o "no quiere". Los marcados "no está" (una sola vez) van de segunda
// prioridad, así se los visita al final en vez de saltarlos del todo.
function siguientePendienteId(clientes, ventas, noVisitasHoy, dia, fecha, excluirId) {
  const clientesDia = (clientes || []).filter(c => c.dia === dia).sort((a, b) => (a.orden || 9999) - (b.orden || 9999));
  const ventasIds = new Set((ventas || []).filter(v => v.fechaKey === fecha && v.dia === dia && !v._esCobro && !v._esAjuste && !v._esMixtoTrans).map(v => v.clienteId));
  const noVMap = {};
  (noVisitasHoy || []).filter(v => v.dia === dia && v.fecha === fecha).forEach(v => {
    noVMap[v.clienteId] = v.motivo;
  });
  const terminados = new Set(clientesDia.filter(c => ventasIds.has(c.id) || noVMap[c.id] === "noquiso" || noVMap[c.id] === "noesta2").map(c => c.id));
  const normalPend = clientesDia.filter(c => !terminados.has(c.id) && noVMap[c.id] !== "noesta" && c.id !== excluirId);
  const noestaPend = clientesDia.filter(c => noVMap[c.id] === "noesta" && !terminados.has(c.id) && c.id !== excluirId);
  const sig = normalPend[0] || noestaPend[0];
  return sig ? sig.id : null;
}

// Barra de pestañas del hub de Clientes (Todos · Fiados · Dormidos · Mapa)
function ClientesTabs({
  activo,
  onIr
}) {
  const tabs = [["todos", "👥", "Todos", "gestionClientes"], ["fiados", "💰", "Fiados", "fiadosPendientes"], ["dormidos", "😴", "Dormidos", "clientesDormidos"], ["mapa", "🗺", "Mapa", "mapaClientes"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      padding: "8px 8px",
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      background: "var(--color-background-secondary)"
    }
  }, tabs.map(([id, ico, lbl, pant]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => activo !== id && onIr && onIr(pant),
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2,
      padding: "6px 2px",
      borderRadius: 9,
      cursor: "pointer",
      border: "none",
      background: activo === id ? "var(--color-background-tertiary)" : "transparent",
      borderBottom: activo === id ? "2px solid var(--color-accent)" : "2px solid transparent"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, ico), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: activo === id ? 600 : 400,
      color: activo === id ? "var(--color-text-primary)" : "var(--color-text-tertiary)"
    }
  }, lbl))));
}
let _catIdSeq = 0;
function nuevoIdCat() {
  _catIdSeq = (_catIdSeq + 1) % 1000;
  return Date.now() * 1000 + _catIdSeq;
}

// ── Context para bajar datos/handlers GLOBALES sin prop-drilling ──────────
// Antes ListaClientes/DetalleCliente/FiadosPendientes/ClientesDormidos recibían
// productos, todasVentas, recordatorios y onPerdida (registrarPerdida) como props
// sueltas repetidas en cada pantalla. Ahora los leen de acá. Se mantiene fallback
// a props dentro de cada componente, así nada se rompe si alguna sigue pasándose.
const DatosAppContext = React.createContext(null);
// Dedupe defensivo de mantVeh por contenido (protege contra duplicados
// que puedan seguir existiendo en Firestore mientras no se terminen de
// borrar, evita QuotaExceededError en localStorage sin importar cuántos
// documentos duplicados haya del lado del servidor).
function _lcHashCorto(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
  return Math.abs(h).toString(36);
}
function _lcDedupMantVeh(arr) {
  if (!Array.isArray(arr)) return [];
  const vistos = new Set();
  const limpio = [];
  arr.forEach(function (r) {
    const firma = JSON.stringify({
      km: r && r.km,
      fecha: r && r.fecha,
      costo: r && r.costo,
      proximo: r && r.proximo,
      desc: r && (r.desc || r.tipo) || ''
    });
    const clave = r && r.id != null ? String(r.id) : firma;
    if (!vistos.has(clave)) {
      vistos.add(clave);
      limpio.push(r && r.id != null ? r : { ...r, id: 'mv_' + _lcHashCorto(firma) });
    }
  });
  return limpio;
}

function App() {
  const [pantalla, setPantalla] = useState(() => {
    const h = window.location.hash.slice(1) || "portada";
    const needsDia = ["diaPrincipal", "selectorFechaClientes", "selectorFechaPlanilla", "inicioReparto", "clientes", "detalleCliente", "venta", "planilla"]; // historial does NOT need dia
    const savedDia = (() => {
      try {
        return JSON.parse(localStorage.getItem("cat_dia_actual") || '""');
      } catch {
        return "";
      }
    })();
    if (needsDia.includes(h) && !savedDia) return "portada";
    return h;
  });
  const [diaActual, setDiaActual] = useLS("cat_dia_actual", "");
  // Reset diaActual when it's invalid
  React.useEffect(() => {
    if (diaActual && !DIAS.includes(diaActual)) setDiaActual("");
  }, []);
  const [fechaActual, setFechaActual] = useLS("cat_fecha_actual", ""); // ISO date key YYYY-MM-DD
  const [fechaObj, setFechaObj] = useState(null);
  // De donde vino la seleccion de fecha ("planilla" o "clientes") - para que
  // el paso de "Inicio del reparto" (cuando el dia aun no se cargo) sepa a
  // donde volver despues: directo a la planilla, o a la lista de clientes.
  const [origenFecha, setOrigenFecha] = useState("clientes");
  const [clienteId, setClienteId] = useState(null);
  const [pinOk, setPinOk] = React.useState(false);
  const [noVisitas, setNoVisitas] = useLS("cat_novisitas_v1", []);
  // Registro de envases perdidos — rotos durante el reparto, o no
  // recuperados al eliminar un cliente (se mudó y no avisó, etc). Se
  // descuentan del stock real y quedan anotados acá para poder revisar
  // después cuánto se está perdiendo y por qué.
  const [perdidas, setPerdidas] = useLS("cat_perdidas_v1", []);
  const registrarPerdida = (items, motivo, clienteNombre) => {
    // items: {sifon,bidon10,bidon20,dispenser} — cantidades perdidas de cada producto
    setPerdidas(prev => {
      const next = [...prev, {
        id: Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        fecha: new Date().toISOString(),
        motivo,
        clienteNombre: clienteNombre || null,
        sifon: items.sifon || 0,
        bidon10: items.bidon10 || 0,
        bidon20: items.bidon20 || 0,
        dispenser: items.dispenser || 0,
        _upd: Date.now()
      }];
      syncData({
        perdidas: next
      });
      return next;
    });
  };
  const [recordatorios, setRecordatorios] = useLS("cat_recordatorios_v1", []);
  // recordatorio: {id, clienteId, clienteNombre, fecha, hora, motivo, dia, confirmado}
  // BUG REPORTADO: clientes (y productos/recordatorios) borrados volvían a
  // aparecer solos después de unos días. Causa: el patrón de guardado de
  // acá abajo le ponía un _upd (marca de "última modificación") NUEVO a
  // TODOS los registros en CADA guardado, hubieran cambiado o no. Como el
  // borrado usa un "tombstone" (fecha del borrado) que solo gana si es más
  // nuevo que el _upd que tenga la nube, bastaba con que OTRO dispositivo
  // (uno que todavía no se había enterado del borrado, por ejemplo un
  // celular que quedó con una pestaña vieja abierta) guardara CUALQUIER
  // cosa — aunque fuera un cambio en un cliente totalmente distinto — para
  // que ese guardado le pisara la fecha al cliente ya borrado con la hora
  // actual, "ganándole" al tombstone y resucitándolo para todos. Esta
  // función solo renueva el _upd de los registros que realmente cambiaron.
  const _soloUpdCambiados = (prevArr, baseArr, _t) => {
    const porId = {};
    (prevArr || []).forEach(x => {
      if (x && x.id != null) porId[x.id] = x;
    });
    return (baseArr || []).map(x => {
      if (!x || x.id == null) return { ...x, _upd: _t }; // sin id: no se puede comparar, se estampa
      const antes = porId[x.id];
      if (!antes) return { ...x, _upd: _t }; // nuevo
      const sinUpdAntes = JSON.stringify({ ...antes, _upd: undefined });
      const sinUpdAhora = JSON.stringify({ ...x, _upd: undefined });
      return sinUpdAntes !== sinUpdAhora ? { ...x, _upd: _t } : x; // solo si cambió algo más que _upd
    });
  };
  const saveRecordatorios = r => {
    setRecordatorios(prev => {
      const base = typeof r === "function" ? r(prev) : r;
      const _t = Date.now();
      const next = _soloUpdCambiados(prev, base, _t);
      syncData({
        recordatorios: next
      });
      return next;
    });
  };
  const recordatoriosActivos = (recordatorios || []).filter(r => !r.confirmado); // [{clienteId,dia,fecha,motivo}]
  const [prospectos, setProspectos] = useLS("cat_prospectos_v1", []);
  const saveProspectos = r => {
    setProspectos(prev => {
      const base = typeof r === "function" ? r(prev) : r;
      const _t = Date.now();
      const next = _soloUpdCambiados(prev, base, _t);
      syncData({
        prospectos: next
      });
      return next;
    });
  };
  // Cuando se toca "Convertir en cliente" en un prospecto, se guarda acá
  // para precargar el formulario de Nuevo Cliente con nombre/teléfono/dirección.
  const [prospectoAConvertir, setProspectoAConvertir] = useState(null);
  const [clientes, setClientes] = useLS("cat_clientes_v3", CLIENTES_INICIALES);
  const [ventasRaw, setVentasRaw] = useLS("cat_ventas_v3", []);
  const normalizarFechaKey = v => {
    if (v.fechaKey) return v;
    const fk = v.fecha ? (() => {
      const parts = v.fecha.split('/');
      if (parts.length >= 3) {
        const d = parts[0].trim(),
          m = parts[1].trim(),
          y = parts[2].split(',')[0].trim();
        if (y.length === 4) return y + '-' + m.padStart(2, '0') + '-' + d.padStart(2, '0');
      }
      return '';
    })() : '';
    return {
      ...v,
      fechaKey: fk
    };
  };
  const ventas = React.useMemo(() => (ventasRaw || []).map(normalizarFechaKey), [ventasRaw]);
  const setVentas = arg => setVentasRaw(typeof arg === 'function' ? prev => arg(prev) : arg);
  const [productos, setProductos] = useLS("cat_productos_v3", PRODUCTOS_INICIALES);
  const BASE_DEFAULT_FIJA = {
    sifon: 150,
    bidon10: 70,
    bidon20: 21,
    dispenser: 0
  };
  const normStock = s => {
    const e = () => ({
      sifon: 0,
      bidon10: 0,
      bidon20: 0,
      dispenser: 0
    });
    const pick = o => ({
      sifon: o?.sifon || 0,
      bidon10: o?.bidon10 || 0,
      bidon20: o?.bidon20 || 0,
      dispenser: o?.dispenser || 0
    });
    const pickFija = o => ({
      sifon: o?.sifon ?? BASE_DEFAULT_FIJA.sifon,
      bidon10: o?.bidon10 ?? BASE_DEFAULT_FIJA.bidon10,
      bidon20: o?.bidon20 ?? BASE_DEFAULT_FIJA.bidon20,
      dispenser: o?.dispenser ?? BASE_DEFAULT_FIJA.dispenser
    });
    const base = {
      soderia: e(),
      soderia_vacios: e(),
      casa: e(),
      camion: e(),
      capacidadFija: { ...BASE_DEFAULT_FIJA }
    };
    if (!s || typeof s !== "object") return base;
    if (s.soderia && typeof s.soderia === "object") {
      return {
        soderia: pick(s.soderia),
        soderia_vacios: pick(s.soderia_vacios),
        casa: pick(s.casa),
        camion: e(), /* auto-heal: "camion" es vestigial (nada lo incrementa, solo se le resta al cerrar el dia); cualquier valor viejo es basura y se descarta en cada lectura para que nunca vuelva a inflar el Total General */
        capacidadFija: pickFija(s.capacidadFija)
      };
    }
    // formato viejo (plano) → todo a sodería llenos
    return {
      soderia: pick(s),
      soderia_vacios: e(),
      casa: e(),
      camion: e(),
      capacidadFija: pickFija(s.capacidadFija)
    };
  };
  const [stockRaw, setStockRaw] = useLS("cat_stock_v4", {
    soderia: {
      sifon: 0,
      bidon10: 0,
      bidon20: 0,
      dispenser: 0
    },
    soderia_vacios: {
      sifon: 0,
      bidon10: 0,
      bidon20: 0,
      dispenser: 0
    },
    casa: {
      sifon: 0,
      bidon10: 0,
      bidon20: 0,
      dispenser: 0
    },
    camion: {
      sifon: 0,
      bidon10: 0,
      bidon20: 0,
      dispenser: 0
    },
    capacidadFija: {
      sifon: 150,
      bidon10: 70,
      bidon20: 21,
      dispenser: 0
    }
  });
  const stockNorm = React.useMemo(() => normStock(stockRaw), [JSON.stringify(stockRaw)]);
  const setStock = sOrFn => {
    if (typeof sOrFn === "function") {
      setStockRaw(prev => normStock(sOrFn(normStock(prev))));
    } else {
      setStockRaw(normStock(sOrFn));
    }
  };
  // Auto-migrate old stock format on first load
  React.useEffect(() => {
    // Force normalize stock on every mount
    const normalized = normStock(stockRaw);
    if (JSON.stringify(normalized) !== JSON.stringify(stockRaw)) setStockRaw(normalized);
  }, []);
  // Helper: transferir del camión a sodería al cerrar el día
  const cerrarCamion = (sobrLlenos, vacios) => {
    setStock(prev => {
      const s = JSON.parse(JSON.stringify(normStock(prev)));
      ["sifon", "bidon10", "bidon20", "dispenser"].forEach(k => {
        s.soderia[k] = (s.soderia[k] || 0) + (sobrLlenos[k] || 0);
        s.soderia_vacios[k] = (s.soderia_vacios[k] || 0) + (vacios[k] || 0);
        s.camion[k] = Math.max(0, (s.camion[k] || 0) - (sobrLlenos[k] || 0) - (vacios[k] || 0));
      });
      syncData({
        stock: s
      });
      return s;
    });
  };
  const [planillas, setPlanillas] = useLS("cat_planillas_v1", {});
  // Cargas de salida por día — declarado acá arriba para que estadoRef pueda incluirlo y viaje a Firebase
  const [cargasDia, setCargasDia] = useLS("cat_cargas_dia_v1", CARGA_DIA_DEFAULT);
  // Firebase — credentials embedded in SDK config above
  const apiKey = "firebase";
  const binId = "firebase";
  const [syncStatus, setSyncStatus] = useState("idle");
  const [ecToken, setEcToken] = useState(() => localStorage.getItem('lc_ec_token') || '');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOfflineSync, setPendingOfflineSync] = useState(() => !!localStorage.getItem("sr_offline_pending"));
  const [cloudSetup, setCloudSetup] = useState(false);
  const [darkMode, setDarkMode] = useLS("cat_darkmode", false); // ya no controla el tema — ver 01-temas.js
  const [tabConfig, setTabConfig] = useState("stock");
  const [zonasReparto, setZonasReparto] = useLS("cat_zonas_v1", {});
  const [modalResumenDia, setModalResumenDia] = useState(null); // {dia, fechaKey}
  const [scaleIdx, setScaleIdx] = useLS("cat_scale_v1", 1); // 0=S 1=M 2=L 3=XL
  const SCALES = [0.82, 1.0, 1.18, 1.36];
  const SCALE_LABELS = ["S", "M", "L", "XL"];
  // NOTA: acá antes había un useEffect que pisaba las variables de color
  // con valores fijos escritos a mano cada vez que arrancaba la app —
  // chocaba de frente con el selector de temas de Configuración (que usa
  // TEMAS_LC en 01-temas.js) y podía "resetear" el tema elegido al recargar.
  // Se sacó: el color/modo ahora lo maneja SOLO aplicarTemaLC.
  // Al iniciar (y cada vez que volvés a la app), traer datos de la nube
  const {
    useEffect
  } = React;
  const ultimoFetchNubeRef = React.useRef(0);
  // Sello del último cambio de stock hecho EN ESTE dispositivo (ver bloque
  // "if (data.stock)" más abajo y syncData): protege ediciones locales
  // recién hechas para que un refetch de la nube que llega antes de que
  // termine de sincronizar no las pise (mismo problema que ya se resolvía
  // para clientes/ventas/planillas/noVisitas, pero stock quedaba afuera).
  const ultimoStockLocalRef = React.useRef(0);
  const traerDeLaNube = React.useCallback(forzar => {
    if (!apiKey || !binId) return;
    const ahora = Date.now();
    if (!forzar && ahora - ultimoFetchNubeRef.current < 15000) return; // evita llamadas duplicadas (visibilitychange+focus)
    ultimoFetchNubeRef.current = ahora;
    setSyncStatus("loading");
    cloudLoad().then(function (data) {
      if (!data) {
        setSyncStatus("idle");
        return;
      }
      // ═══════════════════════════════════════════════════════════════════
      // LEER ESTO ANTES DE TOCAR CUALQUIER MERGE DE ACÁ ABAJO
      // ═══════════════════════════════════════════════════════════════════
      // Patrón que se repite para clientes/ventas/planillas/noVisitas: al
      // cargar de la nube, en vez de PISAR el array local con el de la nube
      // (lo que perdía cambios recientes si el refetch llegaba antes de
      // terminar de sincronizar), se compara registro por registro usando
      // el timestamp `_upd` de cada uno, y gana el más nuevo.
      //
      // REGLA DE ORO: la comparación debe ser SIEMPRE con > estricto, nunca
      // con >=. Un empate (misma marca de tiempo) significa que ese registro
      // YA está sincronizado sin cambios — tratarlo como "cambio" hace que
      // se re-suba de nuevo cada vez que la app carga, aunque no haya pasado
      // nada. Esto pasó de verdad: un typo de >= en el merge de noVisitas
      // hizo que 1027 marcas se re-sincronizaran en cada apertura de la app,
      // agotando la cuota gratuita de Firestore en un día (julio 2026).
      // Si algún día la cuota se agota sin explicación, ACÁ es el primer
      // lugar para revisar — buscar cualquier ">=" y confirmar que debería
      // ser ">".
      // ═══════════════════════════════════════════════════════════════════
      // ── Clientes: MERGEAR en vez de sobreescribir (igual que ventas) ──────
      // Antes esto pisaba el array entero con lo de la nube, perdiendo saldos
      // recién actualizados localmente si el refetch llegaba antes de que
      // terminara de sincronizar (foco de la app, otro dispositivo, etc.)
      if (data.clientes?.length) {
        const clientesLocales = (() => {
          try {
            return JSON.parse(localStorage.getItem("cat_clientes_v3") || "[]");
          } catch {
            return [];
          }
        })();
        const porIdCli = {};
        (data.clientes || []).forEach(c => {
          porIdCli[c.id] = c;
        }); // base: lo de la nube
        // "Vistos en la nube alguna vez": para distinguir un cliente GENUINAMENTE
        // nuevo (creado en este aparato, todavía no llegó a subirse) de un
        // cliente que se borró en OTRO aparato. Antes, si faltaba de la nube se
        // asumía siempre "solo local → lo agrego", lo que resucitaba clientes
        // borrados desde otro celular/PC cada vez que este aparato sincronizaba
        // (y encima los volvía a subir, deshaciendo el borrado para todos).
        let vistosNubeCli = [];
        try {
          vistosNubeCli = JSON.parse(localStorage.getItem("cat_clientes_vistos_nube_v1") || "[]");
        } catch {}
        const vistosNubeSet = new Set(vistosNubeCli);
        let cambiosLocalesCli = 0;
        let resucitadosEvitados = 0;
        clientesLocales.forEach(c => {
          const enNube = porIdCli[c.id];
          if (!enNube) {
            if (vistosNubeSet.has(c.id)) {
              // Ya lo habíamos visto confirmado en la nube antes, y ahora no
              // está: se borró en otro aparato. No lo resucitamos.
              resucitadosEvitados++;
              return;
            }
            porIdCli[c.id] = c;
            cambiosLocalesCli++;
            return;
          } // solo en local, nunca visto en la nube → recién creado, lo agrego
          const uL = Number(c._upd) || 0,
            uN = Number(enNube._upd) || 0;
          if (uL > uN) {
            porIdCli[c.id] = c;
            cambiosLocalesCli++;
          } // gana el más nuevo
        });
        // Tombstones: cliente borrado localmente que la nube todavía tenía.
        let cambiosTombstoneCli = 0;
        try {
          const tombCli = JSON.parse(localStorage.getItem("cat_clientes_tombstone_v1") || "[]");
          tombCli.forEach(t => {
            const enNubeT = porIdCli[t.id];
            if (enNubeT && t.ts >= (Number(enNubeT._upd) || 0)) {
              delete porIdCli[t.id];
              cambiosTombstoneCli++;
            }
          });
        } catch {}
        // Actualizar la lista de "vistos en la nube" con lo que la nube tiene
        // AHORA MISMO (confirmado), para la próxima sincronización.
        try {
          localStorage.setItem("cat_clientes_vistos_nube_v1", JSON.stringify((data.clientes || []).map(c => c.id)));
        } catch {}
        if (resucitadosEvitados > 0) {
          console.log("Merge: " + resucitadosEvitados + " clientes borrados en otro aparato, no se resucitan.");
        }
        const mergedCli = Object.values(porIdCli);
        setClientes(mergedCli);
        if (cambiosTombstoneCli > 0) {
          console.log("Merge: " + cambiosTombstoneCli + " clientes borrados localmente que la nube todavía tenía, re-sincronizando el borrado...");
          setTimeout(() => syncData({
            clientes: mergedCli
          }), 2000);
        }
        if (cambiosLocalesCli > 0) {
          console.log("Merge: " + cambiosLocalesCli + " clientes locales más nuevos que Firebase, sincronizando...");
          setTimeout(() => syncData({
            clientes: mergedCli
          }), 2000);
        }
      }
      // ── Ventas: MERGEAR en vez de sobreescribir ──────────────────────────
      // Si el celular tenía ventas no sincronizadas, no las pisamos con Firebase
      if (data.ventas?.length) {
        const ventasLocales = (() => {
          try {
            return JSON.parse(localStorage.getItem("cat_ventas_v3") || "[]");
          } catch {
            return [];
          }
        })();
        // ── MERGE INTELIGENTE: por cada venta, quedarse con la versión MÁS NUEVA ──
        // Se compara el sello _upd (última modificación). Si empatan (o son datos
        // viejos sin sello), se prioriza la transferencia YA confirmada para no revivirla.
        const porId = {};
        (data.ventas || []).forEach(v => {
          porId[v.id] = v;
        }); // base: lo de la nube
        let cambiosLocales = 0;
        ventasLocales.forEach(v => {
          const enNube = porId[v.id];
          if (!enNube) {
            porId[v.id] = v;
            cambiosLocales++;
            return;
          } // solo en local → la agrego
          const uL = Number(v._upd) || 0,
            uN = Number(enNube._upd) || 0;
          const ganaLocal = uL !== uN ? uL > uN // gana la más nueva
          : !!v.transConfirmada && !enNube.transConfirmada; // empate → no revivir una confirmada
          if (ganaLocal) {
            porId[v.id] = v;
            cambiosLocales++;
          }
        });
        // ── Tombstones: honrar ventas BORRADAS localmente ──────────────────
        // El merge de arriba solo sabe agregar ("está en local pero no en la
        // nube → la sumo"). No tenía forma de representar un borrado: si vos
        // borrabas una venta pero la nube todavía tenía la copia vieja (no
        // llegó a sincronizar antes del próximo refetch), esa venta volvía
        // sola — quedaba "no puedo eliminar una venta". Ahora eliminarVenta
        // deja un tombstone (id + cuándo se borró) y acá se respeta: si la
        // nube trae un id que borramos DESPUÉS de su _upd, no se reincorpora.
        let cambiosTombstone = 0;
        try {
          const tomb = JSON.parse(localStorage.getItem("cat_ventas_tombstone_v1") || "[]");
          tomb.forEach(t => {
            const enNubeT = porId[t.id];
            if (enNubeT && t.ts >= (Number(enNubeT._upd) || 0)) {
              delete porId[t.id];
              cambiosTombstone++;
            }
          });
        } catch {}
        const merged = Object.values(porId);
        setVentasRaw(merged);
        // Si el celular tenía versiones más nuevas que la nube, sincronizarlas ahora
        if (cambiosTombstone > 0) {
          console.log("Merge: " + cambiosTombstone + " ventas borradas localmente que la nube todavía tenía, re-sincronizando el borrado...");
          setTimeout(() => syncData({
            ventas: merged
          }), 2000);
        }
        if (cambiosLocales > 0) {
          console.log("Merge: " + cambiosLocales + " ventas locales más nuevas que Firebase, sincronizando...");
          setTimeout(() => syncData({
            ventas: merged
          }), 2000);
        }
      }
      // ── Planillas: MERGEAR por día en vez de sobreescribir ────────────────
      // Mismo problema que tenía clientes: si el refetch llegaba antes de que
      // terminara de sincronizar un cambio (ej. "Llenos" recién tipeado),
      // se perdía. Comparamos _upd por cada día y nos quedamos con el más nuevo.
      if (data.planillas) {
        const planillasLocales = (() => {
          try {
            return JSON.parse(localStorage.getItem("cat_planillas_v1") || "{}");
          } catch {
            return {};
          }
        })();
        const merged = {
          ...data.planillas
        };
        let cambiosLocalesPla = 0;
        Object.keys(planillasLocales).forEach(dia => {
          const loc = planillasLocales[dia];
          const nub = merged[dia];
          if (!nub) {
            merged[dia] = loc;
            cambiosLocalesPla++;
            return;
          }
          const uL = Number(loc?._upd) || 0,
            uN = Number(nub?._upd) || 0;
          if (uL > uN) {
            merged[dia] = loc;
            cambiosLocalesPla++;
          }
        });
        setPlanillas(merged);
        if (cambiosLocalesPla > 0) {
          console.log("Merge: " + cambiosLocalesPla + " planillas locales más nuevas que Firebase, sincronizando...");
          setTimeout(() => syncData({
            planillas: merged
          }), 2000);
        }
      }
      // ── Stock: no pisar si la edición local es más nueva que lo que trajo la nube ──
      // Antes esto reemplazaba stock entero SIEMPRE que llegaba de Firebase,
      // sin comparar nada (a diferencia de clientes/ventas/planillas, que sí
      // mergean por _upd). Resultado: un ajuste manual de stock (o el cierre
      // del día) podía desaparecer sin aviso si un refetch de la nube — por
      // volver a la app, cambiar de pestaña, u otro dispositivo — llegaba
      // antes de terminar de sincronizar. Ahora se compara igual que el resto.
      if (data.stock) {
        const ds = data.stock;
        const normStockIn = ds.soderia ? ds : {
          soderia: {
            sifon: ds.sifon || 0,
            bidon10: ds.bidon10 || 0,
            bidon20: ds.bidon20 || 0
          },
          casa: {
            sifon: 0,
            bidon10: 0,
            bidon20: 0
          },
          camion: {
            sifon: 0,
            bidon10: 0,
            bidon20: 0
          }
        };
        const remoteUpdStock = Number(ds._upd) || 0;
        if (ultimoStockLocalRef.current > remoteUpdStock) {
          console.log("Merge: stock local más nuevo que Firebase, sincronizando...");
          setTimeout(() => syncData({
            stock: estadoRef.current.stock
          }), 2000);
        } else {
          setStock(normStockIn);
        }
      }
      // ── Productos: MERGEAR por id + _upd (antes se pisaba entero) ──────
      // Un cambio de precio recién guardado podía perderse si un refetch
      // llegaba antes de terminar de sincronizar.
      if (data.productos?.length) {
        const productosLocales = (() => {
          try {
            return JSON.parse(localStorage.getItem("cat_productos_v3") || "[]");
          } catch {
            return [];
          }
        })();
        const porIdProd = {};
        (data.productos || []).forEach(p => {
          porIdProd[p.id] = p;
        });
        let cambiosLocalesProd = 0;
        productosLocales.forEach(p => {
          const enNube = porIdProd[p.id];
          if (!enNube) {
            porIdProd[p.id] = p;
            cambiosLocalesProd++;
            return;
          }
          const uL = Number(p._upd) || 0,
            uN = Number(enNube._upd) || 0;
          if (uL > uN) {
            porIdProd[p.id] = p;
            cambiosLocalesProd++;
          }
        });
        let cambiosTombstoneProd = 0;
        try {
          const tombProd = JSON.parse(localStorage.getItem("cat_productos_tombstone_v1") || "[]");
          tombProd.forEach(t => {
            const enNubeT = porIdProd[t.id];
            if (enNubeT && t.ts >= (Number(enNubeT._upd) || 0)) {
              delete porIdProd[t.id];
              cambiosTombstoneProd++;
            }
          });
        } catch {}
        const mergedProd = Object.values(porIdProd);
        setProductos(mergedProd);
        if (cambiosTombstoneProd > 0) {
          console.log("Merge: " + cambiosTombstoneProd + " productos borrados localmente que la nube todavía tenía, re-sincronizando el borrado...");
          setTimeout(() => syncData({
            productos: mergedProd
          }), 2000);
        }
        if (cambiosLocalesProd > 0) {
          console.log("Merge: " + cambiosLocalesProd + " productos locales más nuevos que Firebase, sincronizando...");
          setTimeout(() => syncData({
            productos: mergedProd
          }), 2000);
        }
      }
      // ── Perdidas: MERGEAR por id + _upd (antes no se sincronizaba nada) ──
      // Registro append-only (nunca se edita ni se borra desde la UI), así
      // que alcanza con unir por id sin necesitar tombstones.
      if (data.perdidas?.length) {
        const perdidasLocales = (() => {
          try {
            return JSON.parse(localStorage.getItem("cat_perdidas_v1") || "[]");
          } catch {
            return [];
          }
        })();
        const porIdPerd = {};
        (data.perdidas || []).forEach(p => {
          porIdPerd[p.id] = p;
        });
        let cambiosLocalesPerd = 0;
        perdidasLocales.forEach(p => {
          const enNube = porIdPerd[p.id];
          if (!enNube) {
            porIdPerd[p.id] = p;
            cambiosLocalesPerd++;
            return;
          }
          const uL = Number(p._upd) || 0,
            uN = Number(enNube._upd) || 0;
          if (uL > uN) {
            porIdPerd[p.id] = p;
            cambiosLocalesPerd++;
          }
        });
        const mergedPerd = Object.values(porIdPerd);
        setPerdidas(mergedPerd);
        if (cambiosLocalesPerd > 0) {
          console.log("Merge: " + cambiosLocalesPerd + " pérdidas locales más nuevas, sincronizando...");
          setTimeout(() => syncData({
            perdidas: mergedPerd
          }), 2000);
        }
      }
      // ── noVisitas: MERGEAR en vez de sobreescribir (mismo problema que clientes/planillas) ──
      // Acá vive "No está" / "No quiere" / "Saltar". Sin esto, una marca recién
      // hecha podía desaparecer si llegaba un refetch antes de terminar de sincronizar
      // — el cliente "revivía" en la lista de pendientes sin haber vuelto a pasar.
      if (data.noVisitas) {
        const noVisitasLocales = (() => {
          try {
            return JSON.parse(localStorage.getItem("cat_novisitas_v1") || "[]");
          } catch {
            return [];
          }
        })();
        const clave = v => `${v.clienteId}|${v.dia}|${v.fecha}`;
        const porClaveNV = {};
        (data.noVisitas || []).forEach(v => {
          porClaveNV[clave(v)] = v;
        }); // base: lo de la nube
        let cambiosLocalesNV = 0;
        noVisitasLocales.forEach(v => {
          const k = clave(v);
          const enNube = porClaveNV[k];
          if (!enNube) {
            porClaveNV[k] = v;
            cambiosLocalesNV++;
            return;
          }
          const uL = Number(v._upd) || 0,
            uN = Number(enNube._upd) || 0;
          if (uL > uN) {
            porClaveNV[k] = v;
            cambiosLocalesNV++;
          } // gana el más nuevo (empate = sin cambio real)
        });
        // Tombstones: mismo problema que tenían las ventas — "Desmarcar" borra
        // una marca localmente, pero si la nube todavía tiene la copia vieja
        // (no llegó a sincronizar antes del próximo refetch), volvía sola.
        let cambiosTombstoneNV = 0;
        try {
          const tombNV = JSON.parse(localStorage.getItem("cat_novisitas_tombstone_v1") || "[]");
          tombNV.forEach(t => {
            const enNubeT = porClaveNV[t.clave];
            if (enNubeT && t.ts >= (Number(enNubeT._upd) || 0)) {
              delete porClaveNV[t.clave];
              cambiosTombstoneNV++;
            }
          });
        } catch {}
        const mergedNV = Object.values(porClaveNV);
        setNoVisitas(mergedNV);
        if (cambiosTombstoneNV > 0) {
          console.log("Merge: " + cambiosTombstoneNV + " marcas de visita borradas localmente (Desmarcar) que la nube todavía tenía, re-sincronizando el borrado...");
          setTimeout(() => syncData({
            noVisitas: mergedNV
          }), 2000);
        }
        if (cambiosLocalesNV > 0) {
          console.log("Merge: " + cambiosLocalesNV + " marcas de visita locales más nuevas que Firebase, sincronizando...");
          setTimeout(() => syncData({
            noVisitas: mergedNV
          }), 2000);
        }
      }
      if (data.recordatorios?.length) {
        const recLocales = (() => {
          try {
            return JSON.parse(localStorage.getItem("cat_recordatorios_v1") || "[]");
          } catch {
            return [];
          }
        })();
        const porId = {};
        (data.recordatorios || []).forEach(r => {
          porId[r.id] = r;
        });
        let cambiosLocalesRec = 0;
        recLocales.forEach(r => {
          const enNube = porId[r.id];
          if (!enNube) {
            porId[r.id] = r;
            cambiosLocalesRec++;
            return;
          }
          const uL = Number(r._upd) || 0,
            uN = Number(enNube._upd) || 0;
          const ganaLocal = uL !== uN ? uL > uN : !!r.confirmado && !enNube.confirmado;
          if (ganaLocal) {
            porId[r.id] = r;
            cambiosLocalesRec++;
          }
        });
        let cambiosTombstoneRec = 0;
        try {
          const tombRec = JSON.parse(localStorage.getItem("cat_recordatorios_tombstone_v1") || "[]");
          tombRec.forEach(t => {
            const enNubeT = porId[t.id];
            if (enNubeT && t.ts >= (Number(enNubeT._upd) || 0)) {
              delete porId[t.id];
              cambiosTombstoneRec++;
            }
          });
        } catch {}
        const mergedRec = Object.values(porId);
        setRecordatorios(mergedRec);
        if (cambiosTombstoneRec > 0) setTimeout(() => syncData({
          recordatorios: mergedRec
        }), 2000);
        if (cambiosLocalesRec > 0) setTimeout(() => syncData({
          recordatorios: mergedRec
        }), 2000);
      }
      if (data.mantVeh?.length) localStorage.setItem("cat_mant_vehiculo_v1", JSON.stringify(_lcDedupMantVeh(data.mantVeh)));
      if (data.horaAvisoCierre) localStorage.setItem("lc_hora_notif_cierre", data.horaAvisoCierre);
      if (data.horasAvisoTrans) localStorage.setItem("lc_horas_notif_trans", JSON.stringify(data.horasAvisoTrans));
      if (data.diasAvisoMant) localStorage.setItem("lc_dias_notif_mant", data.diasAvisoMant.join(','));
      if (data.histPrecios?.length) localStorage.setItem("lc_hist_precios", JSON.stringify(data.histPrecios));
      if (data.zonasReparto && Object.keys(data.zonasReparto).length) setZonasReparto(data.zonasReparto);
      if (data.cargasDia && Object.keys(data.cargasDia).length) setCargasDia(data.cargasDia);
      setSyncStatus("saved");
      setTimeout(() => setSyncStatus("idle"), 2000);
    });
  }, [apiKey, binId]);
  useEffect(() => {
    traerDeLaNube(); // al montar
    const onVisible = () => {
      if (document.visibilityState === "visible") traerDeLaNube();
    };
    const onFocus = () => traerDeLaNube();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [traerDeLaNube]);

  // Sync en tiempo real: escucha cambios en Firestore desde otros dispositivos
  const ultimoUpdRemotoRef = React.useRef(null);
  useEffect(() => {
    if (!window.db) return;
    // NUEVO ESQUEMA: los datos ya no viven en un doc único, sino en una
    // colección por entidad. Poner un onSnapshot sobre CADA colección haría
    // que cada apertura leyera colecciones enteras (clientes/ventas) — justo
    // el gasto de cuota que se quiere evitar. En su lugar, cloudSave escribe
    // un "pulso" en meta/pulse cada vez que guarda algo; escuchamos ESE doc
    // (1 solo) y, ante un cambio de otro dispositivo, traemos por colección.
    const unsub = window.db.collection("meta").doc("pulse").onSnapshot({
      includeMetadataChanges: true
    }, snap => {
     if (!snap.exists || snap.metadata.hasPendingWrites) return; // ignora el eco de nuestro propio guardado (fase local)
      const upd = snap.data()._upd;
      if (upd && upd !== ultimoUpdRemotoRef.current) {
        const esPrimera = ultimoUpdRemotoRef.current === null;
        const esPropio = upd === window._lcUltimoPulsoPropio; // el server ya confirmó ESTE MISMO guardado nuestro
        ultimoUpdRemotoRef.current = upd;
        if (!esPrimera && !esPropio) traerDeLaNube(true); // cambio real de OTRO dispositivo → recién ahí traer
      }
    }, err => console.warn("Listener Firestore:", err));
    return () => unsub();
  }, [traerDeLaNube]);

  // ── MIGRACIÓN única del esquema viejo (lc2/config chunked) al nuevo ────────
  // Corre una sola vez, después de que hay sesión. Pregunta con el modal propio
  // (no confirm nativo) y hace backup automático antes de copiar.
  React.useEffect(() => {
    if (!window.migrarDatosLegacy) return;
    let vivo = true;
    (window._authReady || Promise.resolve()).then(function () {
      if (!vivo) return;
      window.migrarDatosLegacy(function () {
        return window.lcConfirm("Se detectaron datos en formato antiguo. ¿Migrar ahora? Se hace backup automático.", {
          titulo: "Migración de datos",
          okText: "Migrar ahora",
          cancelText: "Ahora no"
        });
      }, function (msg) {
        if (window.lcToast) window.lcToast(msg, "info", 4000);
      }).then(function (res) {
        if (res && res.migrada) {
          if (window.lcToast) window.lcToast("Migración completa. Copia de seguridad guardada.", "ok", 4500);
          traerDeLaNube(true);
        } else if (res && res.error) {
          if (window.logError) window.logError("migración", res.error);
        }
      });
    });
    return () => {
      vivo = false;
    };
  }, []);

  // Ref para el guard anti doble-tap en registrarVenta
  const ultimoRegistroRef = React.useRef({
    firma: null,
    ts: 0
  });
  // Mismo tipo de guard, para no restar/editar el saldo dos veces si el cartel
  // de confirmación tarda en desaparecer y se vuelve a tocar Eliminar/Editar.
  const ultimoBorradoRef = React.useRef({
    id: null,
    ts: 0
  });
  // "Deshacer" para venta eliminada — guarda lo justo para poder revertir:
  // las ventas borradas (para reponerlas tal cual estaban) y el ajuste de
  // saldo que hay que devolver. Se limpia solo a los 8s si no se usa.
  const [deshacerVenta, setDeshacerVenta] = React.useState(null); // {ventasBorradas, clienteId, ajusteTotal, ts}
  const deshacerTimerRef = React.useRef(null);
  const ultimoEditadoRef = React.useRef({
    firma: null,
    ts: 0
  });
  const ultimoClienteBorradoRef = React.useRef({
    id: null,
    ts: 0
  });

  // Ref siempre actualizado — evita datos viejos en el debounce
  const estadoRef = React.useRef({
    clientes,
    ventas,
    planillas,
    stock: stockNorm,
    productos,
    noVisitas,
    recordatorios,
    cargasDia
  });
  React.useEffect(() => {
    estadoRef.current = {
      clientes,
      ventas,
      planillas,
      stock: stockNorm,
      productos,
      noVisitas,
      recordatorios,
      zonasReparto,
      cargasDia,
      perdidas
    };
  });

  // ── AUTO-BACKUP mejorado ────────────────────────────────────────────────
  // Guarda cada 10 minutos (no solo al arrancar) y mantiene los últimos 3 días.
  // OJO: antes dependía de [clientes,ventas,planillas], así que se re-disparaba
  // cada vez que cambiaba CUALQUIER dato (no solo cada 10 minutos) — ahora lee
  // siempre el dato más fresco desde estadoRef, y el efecto corre una sola vez.
  React.useEffect(() => {
    const hacerBackup = () => {
      try {
        const hoy = new Date().toLocaleDateString("en-CA");
        const {
          clientes: cl,
          ventas: ve,
          planillas: pl
        } = estadoRef.current;
        const payload = JSON.stringify({
          clientes: cl,
          ventas: ve,
          planillas: pl
        });
        localStorage.setItem("lc_backup_" + hoy, payload);
        localStorage.setItem("lc_ultimo_backup", hoy);
        // Mantener solo los últimos 3 días de backup
        const keys = Object.keys(localStorage).filter(k => k.startsWith("lc_backup_")).sort().reverse();
        keys.slice(3).forEach(k => localStorage.removeItem(k));
        console.log("Auto-backup guardado:", hoy, new Date().toLocaleTimeString());
      } catch (e) {
        console.warn("Auto-backup falló:", e);
      }
    };
    hacerBackup(); // inmediato al cargar
    const intervalo = setInterval(hacerBackup, 10 * 60 * 1000); // cada 10 minutos
    return () => clearInterval(intervalo);
  }, []);

  // Descarga un archivo JSON al PC — usado por la limpieza automática de
  // abajo, para que quede un registro a mano además del que se guarda en
  // Firebase (por si algún día hace falta mirarlo sin entrar a la nube).
  const _descargarArchivoLC = (nombre, contenido) => {
    try {
      const blob = new Blob([JSON.stringify(contenido, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e) {
      console.warn("No se pudo descargar el archivo de respaldo:", e);
    }
  };

  // ── LIMPIEZA AUTOMÁTICA de ventas antiguas ──────────────────────────────
  // Archiva a Firebase y elimina localmente ventas de más de 3 meses
  React.useEffect(() => {
    if (!ventas.length) return;
    const hoy = new Date();
    const limite = new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate());
    const limiteKey = limite.toLocaleDateString("en-CA");
    // Si ya archivamos hasta esta fecha (o más allá) antes, no repetir — esto
    // es lo que evitaba que la descarga se disparara de nuevo en cada apertura
    // cuando la nube no llegaba a guardar la versión "limpia" a tiempo.
    const yaHasta = localStorage.getItem("lc_archivado_ventas_hasta") || "";
    if (yaHasta >= limiteKey) return;
    const viejas = ventas.filter(v => v.fechaKey && v.fechaKey < limiteKey);
    if (!viejas.length) {
      localStorage.setItem("lc_archivado_ventas_hasta", limiteKey);
      return;
    }
    // Archivar las viejas en Firebase antes de borrarlas localmente
    if (window.db) {
      const col = window.db.collection("archivo_ventas");
      col.doc(limiteKey).set({
        d: viejas,
        archivadasEl: hoy.toISOString()
      }).then(() => {
        // Solo borrar localmente si se guardaron en Firebase
        const ventasRecientes = ventas.filter(v => !v.fechaKey || v.fechaKey >= limiteKey);
        if (ventasRecientes.length < ventas.length) {
          console.log("Limpieza automática: archivadas " + viejas.length + " ventas antiguas en Firebase");
          setVentasRaw(ventasRecientes);
          syncData({
            ventas: ventasRecientes
          });
          _descargarArchivoLC(`la-catalina_ventas-archivadas_${limiteKey}.json`, viejas);
        }
        localStorage.setItem("lc_archivado_ventas_hasta", limiteKey);
      }).catch(e => console.warn("No se pudieron archivar ventas antiguas:", e));
    }
  }, []); // solo al arrancar

  // ── LIMPIEZA AUTOMÁTICA de marcas "no está/no quiere" antiguas ─────────
  // Mismo criterio que las ventas de arriba: archiva a Firebase y elimina
  // localmente las de más de 3 meses. Esto era lo que estaba haciendo lenta
  // la carga de ventas — estas marcas se acumulaban PARA SIEMPRE (nunca se
  // limpiaban), y llegaron a 1027 sin que hubiera ningún tope.
  React.useEffect(() => {
    if (!noVisitas || !noVisitas.length) return;
    const hoy = new Date();
    const limite = new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate());
    const limiteKey = limite.toLocaleDateString("en-CA");
    const yaHasta = localStorage.getItem("lc_archivado_novisitas_hasta") || "";
    if (yaHasta >= limiteKey) return;
    const viejas = noVisitas.filter(v => v.fecha && v.fecha < limiteKey);
    if (!viejas.length) {
      localStorage.setItem("lc_archivado_novisitas_hasta", limiteKey);
      return;
    }
    if (window.db) {
      const col = window.db.collection("archivo_novisitas");
      col.doc(limiteKey).set({
        d: viejas,
        archivadasEl: hoy.toISOString()
      }).then(() => {
        const recientes = noVisitas.filter(v => !v.fecha || v.fecha >= limiteKey);
        if (recientes.length < noVisitas.length) {
          console.log("Limpieza automática: archivadas " + viejas.length + " marcas de visita antiguas en Firebase");
          setNoVisitas(recientes);
          syncData({
            noVisitas: recientes
          });
          _descargarArchivoLC(`la-catalina_visitas-archivadas_${limiteKey}.json`, viejas);
        }
        localStorage.setItem("lc_archivado_novisitas_hasta", limiteKey);
      }).catch(e => console.warn("No se pudieron archivar marcas de visita antiguas:", e));
    }
  }, []); // solo al arrancar

  const syncData = (overrides = {}) => {
    if (!window.db) return;
    // Estampar el momento del cambio de stock ANTES de mandarlo — es lo que
    // permite, del otro lado (traerDeLaNube), saber si una edición local es
    // más nueva que lo que trae un refetch y no pisarla. Único punto por el
    // que pasan todas las escrituras de stock (StockGeneral, Config, cierre
    // de día, etc.), así que alcanza con estampar acá.
    if (overrides.stock) {
      overrides = {
        ...overrides,
        stock: {
          ...overrides.stock,
          _upd: Date.now()
        }
      };
      ultimoStockLocalRef.current = overrides.stock._upd;
    }
    setSyncStatus("saving");
    const mantVehActual = (() => {
      try {
        return JSON.parse(localStorage.getItem("cat_mant_vehiculo_v1") || "[]");
      } catch {
        return [];
      }
    })();
    const histPreciosActual = (() => {
      try {
        return JSON.parse(localStorage.getItem("lc_hist_precios") || "[]");
      } catch {
        return [];
      }
    })();
    const data = {
      ...estadoRef.current,
      ...overrides,
      noVisitas: estadoRef.current.noVisitas || [],
      recordatorios: estadoRef.current.recordatorios || [],
      mantVeh: overrides.mantVeh || mantVehActual,
      histPrecios: overrides.histPrecios || histPreciosActual,
      zonasReparto: overrides.zonasReparto || estadoRef.current.zonasReparto || {},
      horaAvisoCierre: overrides.horaAvisoCierre || localStorage.getItem('lc_hora_notif_cierre') || '18:00',
      horasAvisoTrans: overrides.horasAvisoTrans || (() => {
        try {
          return JSON.parse(localStorage.getItem('lc_horas_notif_trans') || '["13:00","19:00"]');
        } catch {
          return ['13:00', '19:00'];
        }
      })(),
      diasAvisoMant: overrides.diasAvisoMant || (localStorage.getItem('lc_dias_notif_mant') || '3,2,1,0').split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n))
    };
    estadoRef.current = data;
    // OJO — "sr_offline_pending" antes guardaba una FOTO COMPLETA de `data`
    // (todo el estado de la app en ese momento) en localStorage, para
    // reintentar más tarde con cloudSave(esaFotoVieja). El problema: si
    // pasaban minutos u horas hasta el reintento (o si el reintento
    // periódico de 45s seguía fallando por otro motivo — permisos, cuota,
    // no solo por señal), esa foto quedaba cada vez más vieja. Cuando por
    // fin se reintentaba, mandaba de vuelta datos de ESE momento — pisando
    // ventas ya borradas, ediciones ya guardadas, saldos ya corregidos, todo
    // lo que hubiera pasado después volvía a como estaba. Esto es lo que
    // hacía que "no se pudiera" borrar o editar una venta: en algún momento
    // el reintento con la foto vieja la resucitaba sola.
    // Ahora "sr_offline_pending" es solo una bandera (sin datos). El
    // reintento, cuando vuelve la señal, llama a syncData({}) de nuevo —
    // que arma `data` fresco a partir de estadoRef.current (el estado local
    // MÁS reciente), nunca una foto vieja.
    debounceSave(() => {
      if (!navigator.onLine) {
        try {
          localStorage.setItem("sr_offline_pending", "1");
        } catch {}
        setPendingOfflineSync(true);
        setSyncStatus("offline_pending");
        return;
      }
      cloudSave(data).then(function (ok) {
        if (ok) {
          localStorage.removeItem("sr_offline_pending");
          setPendingOfflineSync(false);
          setSyncStatus("saved");
        } else {
          try {
            localStorage.setItem("sr_offline_pending", "1");
          } catch {}
          setPendingOfflineSync(true);
          // Si el navegador dice que hay conexión, esto NO es un problema de
          // señal — es un fallo real (permisos, cuota, dato mal formado).
          // Mostrar "sin conexión" ahí sería confuso, así que se distingue.
          setSyncStatus(navigator.onLine ? "error" : "offline_pending");
        }
      }).catch(function () {
        try {
          localStorage.setItem("sr_offline_pending", "1");
        } catch {}
        setPendingOfflineSync(true);
        setSyncStatus(navigator.onLine ? "error" : "offline_pending");
      });
    });
  };

  // ── MODO OFFLINE ──────────────────────────────────────────────────
  React.useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      const pending = localStorage.getItem("sr_offline_pending");
      if (pending) {
        setSyncStatus("saving");
        // Reintentar con el estado ACTUAL (estadoRef.current, vía
        // syncData({})) — no con una foto vieja guardada en localStorage.
        // syncData ya se encarga de limpiar la bandera sr_offline_pending
        // si el guardado sale bien, y de re-marcarla si vuelve a fallar.
        try {
          cloudSave(estadoRef.current).then(ok => {
            if (ok) {
              localStorage.removeItem("sr_offline_pending");
              setPendingOfflineSync(false);
              setSyncStatus("saved");
              setTimeout(() => setSyncStatus("idle"), 2500);
            } else {
              setSyncStatus("error");
              setTimeout(() => setSyncStatus("offline_pending"), 3000);
            }
          }).catch(() => {
            setSyncStatus("error");
            setTimeout(() => setSyncStatus("offline_pending"), 3000);
          });
        } catch {
          localStorage.removeItem("sr_offline_pending");
          setPendingOfflineSync(false);
        }
      }
    };
    const goOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    // Reintento periódico: cubre el caso de un guardado que falló ESTANDO
    // online (permisos, cuota momentánea) — sin esto, solo se reintentaba
    // al pasar de sin señal a con señal, y ese cambio puede no pasar nunca
    // en una sesión donde la conexión nunca se corta.
    const reintentoPeriodico = setInterval(() => {
      if (navigator.onLine && localStorage.getItem("sr_offline_pending")) goOnline();
    }, 45000);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      clearInterval(reintentoPeriodico);
    };
  }, []);

  // ── NOTIFICACIONES PUSH ─────────────────────────────────────────────
  // Corre al abrir la app: pide permiso y (re)suscribe. El botón "Probar" en
  // Configuración (12-config.js) reusa esta misma función vía window._suscribirPushLC,
  // no hay una segunda copia de esta lógica en ningún otro lado.
  React.useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    function conLimite(promesa, ms, paso) {
      return Promise.race([promesa, new Promise((_, rej) => setTimeout(() => rej(new Error(`Se colgó en: ${paso} (no respondió en ${ms / 1000}s)`)), ms))]);
    }
    const VAPID_PUBLIC = 'BHLfex7GDQ-rMtrSuhoXjiPtul-_WvfvnMV_AvGhlbjc5DxvV3NDt6kn2Uugnx98CSgTIiP-tJ0aJlJ8gYsiUBk';
    function getDeviceId() {
      let id = localStorage.getItem('lc_device_id');
      if (!id) {
        id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('lc_device_id', id);
      }
      return id;
    }
    async function suscribirPush() {
      if (!window.messagingLC) {
        localStorage.setItem('lc_push_estado', JSON.stringify({
          ok: false,
          msg: 'Cloud Messaging no está disponible en este navegador.',
          ts: Date.now()
        }));
        return;
      }
      try {
        const sw = await conLimite(navigator.serviceWorker.ready, 8000, 'esperando el service worker');
        const token = await conLimite(window.messagingLC.getToken({
          vapidKey: VAPID_PUBLIC,
          serviceWorkerRegistration: sw
        }), 8000, 'pidiendo el token a Firebase');
        if (window.db) {
          const deviceId = getDeviceId();
          // Guarda bajo la clave de ESTE dispositivo — no pisa el token de otros celus/PC.
          // Colección propia push_subs (antes era un doc dentro de lc2).
          await conLimite(window.db.collection('push_subs').doc(deviceId).set({
            token,
            ts: Date.now()
          }), 8000, 'guardando en la nube (Firestore)');
          localStorage.setItem('lc_push_estado', JSON.stringify({
            ok: true,
            msg: 'Token guardado. Esto confirma que el navegador quedó registrado — no confirma que un aviso vaya a llegar (eso depende del servidor).',
            ts: Date.now()
          }));
        } else {
          localStorage.setItem('lc_push_estado', JSON.stringify({
            ok: false,
            msg: 'No se encontró conexión a la base de datos (window.db)',
            ts: Date.now()
          }));
        }
      } catch (e) {
        localStorage.setItem('lc_push_estado', JSON.stringify({
          ok: false,
          msg: e.message || 'Error desconocido',
          ts: Date.now()
        }));
      }
    }
    window._suscribirPushLC = async () => {
      await suscribirPush();
      return JSON.parse(localStorage.getItem('lc_push_estado') || 'null');
    };
    (async () => {
      if (Notification.permission === "default") await Notification.requestPermission();
      if (Notification.permission === "granted") await suscribirPush();
    })();
  }, []);

  // Ambas aceptan un array directo O una función (prev => nuevoArray).
  // Usar la forma función en cualquier lugar que calcule el nuevo valor
  // a partir del estado actual (sumar/restar saldo, sacar un item, etc.)
  // — así no se pierden cambios si dos acciones se disparan casi juntas.
  const saveClientes = v => {
    setClientes(prev => {
      const base = typeof v === "function" ? v(prev) : v;
      const _t = Date.now();
      const vv = _soloUpdCambiados(prev, base, _t);
      syncData({
        clientes: vv
      });
      return vv;
    });
  };
  const saveVentas = v => {
    setVentasRaw(prev => {
      const nv = typeof v === "function" ? v(prev) : v;
      syncData({
        ventas: nv
      });
      return nv;
    });
  };

  // Hooks globales: respaldo COMPLETO descargable + restaurar
  React.useEffect(() => {
    // Descargar un archivo .json con TODOS los datos
    window._descargarRespaldo = () => {
      const mantVeh = (() => {
        try {
          return JSON.parse(localStorage.getItem("cat_mant_vehiculo_v1") || "[]");
        } catch {
          return [];
        }
      })();
      const histPrecios = (() => {
        try {
          return JSON.parse(localStorage.getItem("lc_hist_precios") || "[]");
        } catch {
          return [];
        }
      })();
      const data = {
        ...estadoRef.current,
        mantVeh,
        histPrecios,
        _respaldo: true,
        _app: "la-catalina",
        _fecha: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const f = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
      a.href = url;
      a.download = `respaldo-completo_la-catalina_${f}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    // Restaurar desde un objeto de datos (ya parseado del .json)
    window._restaurarRespaldo = data => {
      if (!data || typeof data !== "object") {
        lcAlert("El archivo no es un respaldo válido.");
        return false;
      }
      try {
        if (data.clientes !== undefined) setClientes(data.clientes || []);
        if (data.ventas !== undefined) setVentasRaw(data.ventas || []);
        if (data.planillas !== undefined) setPlanillas(data.planillas || {});
        if (data.stock) {
          const ds = data.stock;
          const ns = ds.soderia ? ds : {
            soderia: {
              sifon: ds.sifon || 0,
              bidon10: ds.bidon10 || 0,
              bidon20: ds.bidon20 || 0
            },
            casa: {
              sifon: 0,
              bidon10: 0,
              bidon20: 0
            },
            camion: {
              sifon: 0,
              bidon10: 0,
              bidon20: 0
            }
          };
          setStock(ns);
        }
        if (data.productos !== undefined) setProductos(data.productos || []);
        if (data.noVisitas !== undefined) setNoVisitas(data.noVisitas || []);
        if (data.perdidas !== undefined) setPerdidas(data.perdidas || []);
        if (data.recordatorios !== undefined) setRecordatorios(data.recordatorios || []);
        if (data.mantVeh !== undefined) localStorage.setItem("cat_mant_vehiculo_v1", JSON.stringify(_lcDedupMantVeh(data.mantVeh || [])));
        if (data.histPrecios !== undefined) localStorage.setItem("lc_hist_precios", JSON.stringify(data.histPrecios || []));
        if (data.zonasReparto !== undefined) setZonasReparto(data.zonasReparto || {});
        if (data.cargasDia && Object.keys(data.cargasDia).length) setCargasDia(data.cargasDia);
        // Subir lo restaurado a la nube
        try {
          cloudSave({
            ...estadoRef.current,
            ...data
          });
        } catch {}
        return true;
      } catch (e) {
        lcAlert("Error al restaurar: " + e.message);
        return false;
      }
    };
    return () => {
      delete window._descargarRespaldo;
      delete window._restaurarRespaldo;
    };
  }, []);
  const savePlanillasCloud = v => {
    setPlanillas(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      syncData({
        planillas: next
      });
      return next;
    });
  };
  const saveStock = v => {
    setStock(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      syncData({
        stock: next
      });
      return next;
    });
  };
  const saveProductos = v => {
    setProductos(prev => {
      const base = typeof v === "function" ? v(prev) : v;
      // _upd solo se renueva en los productos que realmente cambiaron (ver
      // _soloUpdCambiados) — antes se pisaba en TODOS en cada guardado, lo
      // que podía resucitar un producto ya borrado (mismo bug que clientes).
      const _t = Date.now();
      const next = _soloUpdCambiados(prev, base, _t);
      // Registrar cambio de precio en historial
      const hoy = new Date().toISOString().slice(0, 16);
      const histPrecios = JSON.parse(localStorage.getItem("lc_hist_precios") || "[]");
      histPrecios.push({
        fecha: hoy,
        productos: next.map(p => ({
          nombre: p.nombre,
          precio: p.precio,
          costo: p.costo
        }))
      });
      localStorage.setItem("lc_hist_precios", JSON.stringify(histPrecios.slice(-50)));
      syncData({
        productos: next
      });
      return next;
    });
  };
  const saveCargasDia = v => {
    setCargasDia(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      syncData({
        cargasDia: next
      });
      return next;
    });
  };
  const saveNoVisitas = v => {
    setNoVisitas(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      syncData({
        noVisitas: next
      });
      return next;
    });
  };
  const cliente = clientes.find(c => c.id === clienteId) || null;
  const irA = p => {
    const needsDia = ["diaPrincipal", "selectorFechaClientes", "selectorFechaPlanilla", "inicioReparto", "clientes", "detalleCliente", "venta", "planilla"]; // historial does NOT need dia
    if (needsDia.includes(p) && !diaActual) {
      setPantalla("menu");
      window.history.pushState({
        pantalla: "menu"
      }, '', '#menu');
      window.scrollTo(0, 0);
      return;
    }
    setPantalla(p);
    window.scrollTo(0, 0);
   window.history.pushState({
      pantalla: p
    }, '', `#${p}`);
  };
  window._lcIrA = irA;

  // Handle back button
  React.useEffect(() => {
    const handler = e => {
      const p = e.state?.pantalla || "portada";
      const needsDia = ["diaPrincipal", "selectorFechaClientes", "selectorFechaPlanilla", "inicioReparto", "clientes", "detalleCliente", "venta", "planilla"]; // historial does NOT need dia
      if (needsDia.includes(p) && !diaActual) {
        setPantalla("menu");
        return;
      }
      setPantalla(p);
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);
  const updateCliente = (id, cambios) => {
    const antes = clientes.find(c => c.id === id);
    saveClientes(prev => prev.map(c => c.id === id ? {
      ...c,
      ...cambios
    } : c));
    if (antes) ajustarStockFijoCliente(antes, { ...antes, ...cambios });
  };
  const savePlanilla = (dia, datos) => {
    savePlanillasCloud(prev => ({
      ...prev,
      [dia]: {
        ...datos,
        _upd: Date.now()
      }
    }));
  };
  const getPlanilla = dia => planillas[dia] || planillaDiaVacia();

  // Auto-guardado de planilla cuando todos los clientes del día tienen estado
  React.useEffect(() => {
    if (!diaActual || !fechaActual) return;
    const clientesDia = clientes.filter(c => c.dia === diaActual);
    if (clientesDia.length === 0) return;
    const ventasDia = ventas.filter(v => v.dia === diaActual && v.fechaKey === fechaActual);
    const noVisitasDia = (noVisitas || []).filter(v => v.dia === diaActual && v.fecha === fechaActual);
    const atendidos = new Set(ventasDia.map(v => v.clienteId));
    const conEstado = new Set([...atendidos, ...noVisitasDia.map(v => v.clienteId)]);
    const todosVisitados = clientesDia.every(c => conEstado.has(c.id));
    if (!todosVisitados) return;
    // Calcular valores automáticos para la planilla
    const CAJON_SODA = 6;
    const getProdCosto = nombre => {
      const p = (productos || []).find(x => x.nombre === nombre);
      return p ? p.costo || 0 : 0;
    };
    const costSifon = getProdCosto("Sifón 1.5L") || 133.33;
    const costB10 = getProdCosto("Bidón 10L") || 800;
    const costB20 = getProdCosto("Bidón 20L") || 1100;
    const tots = {
      b10: {
        vacios: 0
      },
      b20: {
        vacios: 0
      },
      soda: {
        vacios: 0
      }
    };
    const prodKey = {
      "Bidón 10L": "b10",
      "Bidón 20L": "b20",
      "Sifón 1.5L": "soda"
    };
    ventasDia.forEach(v => v.detalle.forEach(d => {
      const k = prodKey[d.nombre];
      if (k) tots[k].vacios += d.cantidad;
    }));
    const sodaCajones = Math.floor(tots.soda.vacios / CAJON_SODA) || 0;
    const cobEfectivo = ventasDia.filter(v => v.pago === "contado").reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0);
    const cobFiado = ventasDia.filter(v => v.pago === "fiado").reduce((a, v) => a + (v.neto || 0), 0);
    const cobTransBruto = ventasDia.filter(v => v.pago === "transferencia").reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0);
    const cobTransDesc = Math.round(cobTransBruto * 0.025);
    const planillaKey = `${diaActual}_${fechaActual}`;
    const planillaActual = planillas[planillaKey] || planillaDiaVacia();
    // Solo auto-completar campos vacíos, nunca pisar lo que el usuario editó
    const nueva = {
      ...planillaActual,
      fecha: planillaActual.fecha || fechaActual,
      efectivo: planillaActual.efectivo || (cobEfectivo > 0 ? String(Math.round(cobEfectivo)) : ""),
      fiado: planillaActual.fiado || (cobFiado > 0 ? String(Math.round(cobFiado)) : ""),
      retenciones: planillaActual.retenciones || (cobTransDesc > 0 ? String(cobTransDesc) : ""),
      _autoGuardado: true
    };
    // Solo guardar si cambió algo
    if (JSON.stringify(nueva) !== JSON.stringify(planillaActual)) {
      savePlanilla(planillaKey, nueva);
    }
    // AVISO A EMMA CONTROL — se ejecuta una sola vez por día.
    // OJO: acá ANTES también se recalculaba y sumaba el traspaso de stock
    // camión→sodería (sobrantes + vacíos) en automático. Se sacó porque
    // duplicaba el cierre: el mismo traspaso se vuelve a hacer, con revisión
    // de cantidades reales, en la pantalla "Cierre del día" (confirmarCierre,
    // 06-menu.js) — que se abre sola apenas el camión salió. Los dos corrían
    // sin enterarse uno del otro y el stock quedaba sumado dos veces cada
    // día. Ahora el ÚNICO lugar que mueve stock al cerrar el día es
    // confirmarCierre en 06-menu.js.
    const camionCerradoKey = `lc_cam_${planillaKey}`;
    if (planillaActual.iniciado && !planillaActual._stockCerrado && !localStorage.getItem(camionCerradoKey)) {
      localStorage.setItem(camionCerradoKey, "1");
      savePlanilla(planillaKey, {
        ...nueva,
        _stockCerrado: true
      });
      // ── Enviar datos del día a Emma Control ──
      if (ecToken && window.enviarAEmmaControl) {
        const cobEf = ventasDia.filter(v => v.pago === "contado").reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0);
        const cobTr = ventasDia.filter(v => v.pago === "transferencia").reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0);
        const totalCob = Math.round(cobEf + cobTr);
        const gastosData = (planillaActual.gastos || []).filter(g => g.monto && Number(g.monto) > 0).map(g => ({
          desc: g.desc || 'Gasto reparto',
          monto: Number(g.monto),
          cat: g.cat || 'Otros',
          metodo: g.metodo || 'efectivo'
        }));
        window.enviarAEmmaControl(ecToken, fechaActual, {
          total: totalCob,
          efectivo: Math.round(cobEf),
          transferencia: Math.round(cobTr)
        }, gastosData);
      }
    }
  }, [ventas, noVisitas, clientes, diaActual, fechaActual, planillas, ecToken]);
  // OJO: antes esta función tomaba el cliente del estado global `cliente`
  // (clientes.find por el clienteId seleccionado en pantalla). Eso andaba
  // bien mientras solo existía la pantalla completa de venta, pero se rompe
  // apenas hay una tarjeta compacta EN LA LISTA: si dos cards pudieran estar
  // abiertas, o si el estado global todavía no se actualizó, la venta podía
  // quedar registrada al cliente equivocado. Ahora el cliente viaja explícito
  // como primer argumento — cada llamador (pantalla completa o tarjeta
  // compacta) pasa el ID del cliente que tiene efectivamente abierto.
  const registrarVenta = (ventaClienteId, detalle, pago, montoPagado, saldoAplicado, envPrest, envDev, obs, opcionSaldo, montoTrans2, saldoDeltaMixto, transConfirmadaInicial) => {
    montoTrans2 = Number(montoTrans2) || 0; // defensa: siempre número (el desglose mixto depende de esto)
    const c = clientes.find(cl => cl.id === ventaClienteId);
    if (!c) {
      console.warn("⚠️ registrarVenta: cliente no encontrado", ventaClienteId);
      return;
    }
    // ── Guard anti doble-tap: ignora una llamada idéntica al mismo cliente ──
    // dentro de 1.5s (botón sin lock + toque duplicado en el celular)
    const firmaReg = JSON.stringify({
      cid: c.id,
      detalle,
      pago,
      montoPagado,
      opcionSaldo
    });
    const ahoraReg = Date.now();
    if (ultimoRegistroRef.current.firma === firmaReg && ahoraReg - ultimoRegistroRef.current.ts < 1500) {
      console.warn("⚠️ Venta duplicada bloqueada (doble tap):", c.nombre);
      return;
    }
    ultimoRegistroRef.current = {
      firma: firmaReg,
      ts: ahoraReg
    };
    // Auto-detectar envases prestados (solo si no es cobro de deuda)
    const envAutoDetect = [];
    if (opcionSaldo !== "cobro_deuda" && opcionSaldo !== "cambio_envase") {
      const mapa = {
        sifon: "Sifón 1.5L",
        bidon10: "Bidón 10L",
        bidon20: "Bidón 20L"
      };
      detalle.forEach(d => {
        const asignado = d.nombre === "Sifón 1.5L" ? c.sifon || 0 : d.nombre === "Bidón 10L" ? c.bidon10 || 0 : d.nombre === "Bidón 20L" ? c.bidon20 || 0 : 0;
        const extra = d.cantidad - asignado;
        if (extra > 0) envAutoDetect.push({
          prod: d.nombre,
          cant: String(extra)
        });
      });
    }
    const envPrestFinal = [...(envPrest || []).filter(e => e.prod && e.cant), ...envAutoDetect.filter(e => !(envPrest || []).some(ep => ep.prod === e.prod))];

    // Pago mixto: guardamos pago real según opción
    const pagoReal = opcionSaldo === "mixto_ef" ? "contado" : opcionSaldo === "mixto_tr" ? "transferencia" : pago;
    const obsExtra = montoTrans2 > 0 ? ` [Mixto: ef $${montoPagado} + tr $${montoTrans2}]` : "";

    // Para pago mixto: el calc usa el TOTAL pagado (ef+tr) asi el saldoDelta refleja lo real
    // La ventaTr solo existe para el flujo de confirmacion de transferencia, sin impacto en saldo
    const montoParaCalc = opcionSaldo === "mixto_ef" && montoTrans2 > 0 ? String(Number(montoPagado) + montoTrans2) : montoPagado;
    const calc = calcVenta(detalle, pagoReal, montoParaCalc, saldoAplicado, productos);
    const nuevaVenta = {
      id: Date.now(),
      clienteId: c.id,
      cliente: c.nombre,
      dia: diaActual,
      fechaKey: new Date().toLocaleDateString("en-CA"),
      fecha: new Date().toLocaleString("es-AR"),
      hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      detalle,
      pago: pagoReal,
      obs: (obs || "") + obsExtra,
      saldoAplicado: saldoAplicado || 0,
      envPrest: envPrestFinal,
      envDev: (envDev || []).filter(e => e.prod && e.cant),
      ...calc,
      montoTrans: montoTrans2 || 0,
      montoEfec: opcionSaldo === "mixto_ef" ? Number(montoPagado) : 0,
      transConfirmada: !!transConfirmadaInicial,
      _upd: Date.now(),
      ...(opcionSaldo === "cobro_deuda" ? {
        _esCobro: true,
        neto: 0,
        bruto: 0,
        costo: 0,
        ganancia: 0
      } : {}),
      ...(opcionSaldo === "cambio_envase" ? {
        _esCambio: true,
        neto: 0,
        bruto: 0,
        costo: 0,
        ganancia: 0
      } : {})
    };

    // Si es pago mixto, guardamos la transferencia como venta pendiente de confirmacion
    // saldoDelta=0 porque el saldo ya fue calculado en la venta principal con el total
    const ventasNuevas = [nuevaVenta];
    let saldoExtra = calc.saldoDelta;
    if (montoTrans2 > 0 && opcionSaldo === "mixto_ef") {
      const ventaTr = {
        id: Date.now() + 2,
        clienteId: c.id,
        cliente: c.nombre,
        dia: diaActual,
        fechaKey: new Date().toLocaleDateString("en-CA"),
        fecha: new Date().toLocaleString("es-AR"),
      hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        detalle: [{
          nombre: "Pago mixto · transferencia",
          cantidad: 1,
          precio: montoTrans2,
          total: montoTrans2
        }],
        pago: "transferencia",
        obs: "[Parte transfer. de pago mixto]",
        saldoAplicado: 0,
        neto: montoTrans2,
        bruto: montoTrans2,
        desc: 0,
        costo: 0,
        ganancia: 0,
        pagadoNum: montoTrans2,
        saldoDelta: 0,
        // sin impacto en saldo
        envPrest: [],
        envDev: [],
        _esMixtoTrans: true,
        _mixtoDe: nuevaVenta.id,
        transConfirmada: !!transConfirmadaInicial,
        _upd: Date.now() // refleja el checkbox, no queda pendiente para siempre
      };
      ventasNuevas.push(ventaTr);
      // saldoExtra ya es correcto, NO sumamos montoTrans2
    }

    // Forma funcional: agrega sobre el ventas/clientes MÁS RECIENTE, no sobre
    // el que había cuando se abrió esta pantalla (evita perder ventas o saldo
    // si esto se dispara más de una vez seguida).
    saveVentas(prev => {
      const base = [...prev, ...ventasNuevas];
      // Si esta venta es un cobro de deuda (opción del formulario, no el
      // botón rápido), también marcamos las ventas fiado más viejas.
      if (opcionSaldo === "cobro_deuda" && saldoExtra > 0) {
        const { ventasActualizadas, idsAfectados } = aplicarCobroAVentasFiado(base, c.id, saldoExtra);
        return ventasActualizadas.map(v => v.id === nuevaVenta.id ? {
          ...v,
          _ventasSaldadas: idsAfectados
        } : v);
      }
      return base;
    });
    saveClientes(prev => aplicarMovimientoEnvases(prev, ventas, c.id, nuevaVenta.envPrest, nuevaVenta.envDev).map(c2 => c2.id === c.id ? {
      ...c2,
      saldo: (Number(c2.saldo) || 0) + saldoExtra
    } : c2));
  };
  const renumerarTrasEliminar = (lista, clienteEliminado) => {
    const {
      dia,
      orden
    } = clienteEliminado;
    if (!orden) return lista;
    return lista.map(c => c.dia === dia && (c.orden || 0) > orden ? {
      ...c,
      orden: c.orden - 1
    } : c);
  };
  const eliminarCliente = async clienteId => {
    // Guard anti doble-toque: ignora un segundo borrado del MISMO cliente
    // dentro de 3s (dos confirmaciones seguidas — la de acá y la de envases
    // si tiene — pueden hacer que el dedo vuelva a tocar por las dudas).
    const ahoraDel = Date.now();
    if (ultimoClienteBorradoRef.current.id === clienteId && ahoraDel - ultimoClienteBorradoRef.current.ts < 3000) {
      console.warn("⚠️ Borrado de cliente duplicado bloqueado (doble toque):", clienteId);
      return;
    }
    ultimoClienteBorradoRef.current = {
      id: clienteId,
      ts: ahoraDel
    };
    const eliminado = clientes.find(c => c.id === clienteId);
    if (eliminado) {
      const env = {
        sifon: (Number(eliminado.sifon) || 0) + (Number(eliminado.prestado?.sifon) || 0),
        bidon10: (Number(eliminado.bidon10) || 0) + (Number(eliminado.prestado?.bidon10) || 0),
        bidon20: (Number(eliminado.bidon20) || 0) + (Number(eliminado.prestado?.bidon20) || 0),
        dispenser: (Number(eliminado.dispenser) || 0) + (Number(eliminado.prestado?.dispenser) || 0)
      };
      const totalEnv = env.sifon + env.bidon10 + env.bidon20 + env.dispenser;
      if (totalEnv > 0) {
        const det = [env.sifon && `${env.sifon} Sifón 1.5L`, env.bidon10 && `${env.bidon10} Bidón 10L`, env.bidon20 && `${env.bidon20} Bidón 20L`, env.dispenser && `${env.dispenser} Dispenser`].filter(Boolean).join(" · ");
        // OJO: esto NO pregunta "¿eliminar?" de nuevo — el cliente YA se va
        // a borrar (eso se confirmó en el cartel anterior). Esta pregunta es
        // solo para el stock: si los envases vuelven a la Casa o se pierden.
        const devolvio = await window.lcConfirm(`Borrando a "${eliminado.nombre}"...\n\nTenía estos envases:\n${det}\n\n¿Los devolvió?\n\n• Confirmar = SÍ, sumarlos al stock (Casa)\n• Cancelar = NO, se dan por perdidos\n\n(Cualquiera de las dos opciones borra al cliente igual)`, {
          okText: "Sí, los devolvió",
          cancelText: "No, perdidos"
        });
        if (devolvio) {
          setStock(prev => {
            const s = JSON.parse(JSON.stringify(normStock(prev)));
            s.casa.sifon = (s.casa.sifon || 0) + env.sifon;
            s.casa.bidon10 = (s.casa.bidon10 || 0) + env.bidon10;
            s.casa.bidon20 = (s.casa.bidon20 || 0) + env.bidon20;
            s.casa.dispenser = (s.casa.dispenser || 0) + env.dispenser;
            syncData({
              stock: s
            });
            return s;
          });
        } else {
          // No se pudieron recuperar — quedan registrados como pérdida en
          // vez de desaparecer sin dejar rastro. El total general de stock
          // ya los deja de contar solo (salían de "En clientes"), esto es
          // nada más para poder revisar después cuánto se perdió y por qué.
          registrarPerdida(env, "Cliente eliminado sin recuperar envases", eliminado.nombre);
        }
      }
    }
    registrarTombstoneId("clientes", clienteId);
    saveClientes(prev => {
      let nc = prev.filter(c => c.id !== clienteId);
      if (eliminado) nc = renumerarTrasEliminar(nc, eliminado);
      return nc;
    });
    // Estos son borrados en CASCADA — no pasan por eliminarVenta ni por
    // onQuitarNoVisita (que ya dejan su propio tombstone), así que hay que
    // dejarlo acá también. Si no, borrar un cliente podía hacer que sus
    // ventas o marcas de "no visita" volvieran solas.
    ventas.filter(v => v.clienteId === clienteId).forEach(v => registrarTombstoneId("ventas", v.id));
    (noVisitas || []).filter(v => v.clienteId === clienteId).forEach(v => registrarTombstoneNoVisita(v.clienteId, v.dia, v.fecha));
    (recordatorios || []).filter(r => r.clienteId === clienteId).forEach(r => registrarTombstoneId("recordatorios", r.id));
    saveVentas(prev => prev.filter(v => v.clienteId !== clienteId));
    saveNoVisitas(prev => (prev || []).filter(v => v.clienteId !== clienteId));
    saveRecordatorios(prev => (prev || []).filter(r => r.clienteId !== clienteId));
    irA("clientes");
  };

  // ── Ajusta stock.casa (depósito) cuando se crea o edita el fijo de
  // envases/dispenser de un cliente. Antes esto NO pasaba en ningún lado:
  // al dar de alta un cliente con envases fijos (o un dispenser), esos
  // envases nunca se descontaban del depósito — el stock quedaba mal desde
  // el primer día. "antes" = valores previos (null si es alta nueva),
  // "despues" = valores nuevos.
  const ajustarStockFijoCliente = (antes, despues) => {
    const a = antes || {};
    const d = despues || {};
    const delta = {
      sifon: (Number(d.sifon) || 0) - (Number(a.sifon) || 0),
      bidon10: (Number(d.bidon10) || 0) - (Number(a.bidon10) || 0),
      bidon20: (Number(d.bidon20) || 0) - (Number(a.bidon20) || 0),
      dispenser: (Number(d.dispenser) || 0) - (Number(a.dispenser) || 0)
    };
    if (!delta.sifon && !delta.bidon10 && !delta.bidon20 && !delta.dispenser) return;
    setStock(prev => {
      const s = JSON.parse(JSON.stringify(normStock(prev)));
      s.casa.sifon = Math.max(0, (s.casa.sifon || 0) - delta.sifon);
      s.casa.bidon10 = Math.max(0, (s.casa.bidon10 || 0) - delta.bidon10);
      s.casa.bidon20 = Math.max(0, (s.casa.bidon20 || 0) - delta.bidon20);
      s.casa.dispenser = Math.max(0, (s.casa.dispenser || 0) - delta.dispenser);
      syncData({
        stock: s
      });
      return s;
    });
  };

  // ── Registrar un envase roto/perdido EN CASA DE UN CLIENTE (sin borrarlo) ──
  // Usado por el panel de "romper/perder" en la ficha del cliente. A
  // diferencia de un editar cliente común, acá el envase NO volvió al
  // depósito — se rompió o se perdió estando afuera. Por eso reduce el fijo
  // del cliente directamente (sin pasar por ajustarStockFijoCliente, que
  // asumiría que volvió a Casa) y lo deja anotado en el historial de
  // pérdidas para poder revisarlo después.
  const registrarPerdidaCliente = (clienteId, producto, cantidad) => {
    let cant = Math.round(Number(cantidad) || 0);
    if (cant <= 0) return;
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return;
    // Igual criterio que aplicarMovimientoEnvases: descuenta primero de lo
    // PRESTADO (el envase roto puede ser uno prestado, no necesariamente
    // uno de los fijos) y, si sobra cantidad, recién ahí del fijo. Antes
    // esto siempre restaba del fijo aunque el cliente no tuviera fijos de
    // ese producto (ej. dispenser fijo=0, prestado=1) — quedaba clampeado
    // en 0 sin descontar nada, y el total "en clientes" no bajaba aunque
    // la pérdida ya se hubiera anotado en el historial.
    const prestadoActual = prestadoClienteDe(cli, producto, ventas);
    const deLoPrestado = Math.min(prestadoActual, cant);
    const nuevoPrestado = prestadoActual - deLoPrestado;
    cant -= deLoPrestado;
    const nuevoValor = Math.max(0, (Number(cli[producto]) || 0) - cant);
    saveClientes(prev => prev.map(c => c.id === clienteId ? {
      ...c,
      [producto]: nuevoValor,
      prestado: {
        ...(c.prestado || {}),
        [producto]: nuevoPrestado
      }
    } : c));
    registrarPerdida({ [producto]: Math.round(Number(cantidad) || 0) }, "Roto/perdido en lo del cliente", cli.nombre);
  };

  // ── Unificación de duplicados SEGURA: prioriza el DOMICILIO ──
  // Mismo nombre+día pero domicilios distintos = probablemente personas diferentes → viene desmarcado
  // Tombstone genérico por id — usado para clientes, productos y
  // recordatorios borrados (mismo problema y misma solución que ventas y
  // noVisitas: el merge por id/_upd solo sabe "agregar si falta", nunca
  // "sacar si lo borraron localmente" — sin esto, un borrado podía revivir
  // solo si la nube todavía tenía la copia vieja en el próximo refetch).
  const registrarTombstoneId = (entidad, id) => {
    try {
      // Mismo formato de clave que ya usan ventas ("cat_ventas_tombstone_v1")
      // y noVisitas ("cat_novisitas_tombstone_v1") — así el merge de ventas
      // en cascada (ver eliminarCliente) escribe en el MISMO lugar que ya
      // lee el filtro de tombstones de ventas.
      const key = `cat_${entidad}_tombstone_v1`;
      const ahoraT = Date.now();
      const prevT = JSON.parse(localStorage.getItem(key) || "[]");
      const CUARENTA_CINCO_DIAS = 45 * 24 * 60 * 60 * 1000;
      const vivoT = prevT.filter(t => ahoraT - t.ts < CUARENTA_CINCO_DIAS);
      vivoT.push({
        id,
        ts: ahoraT
      });
      localStorage.setItem(key, JSON.stringify(vivoT));
    } catch {}
  };
  // Deja constancia de una marca de "no visita" borrada (Desmarcar / eliminar
  // del historial) — mismo mecanismo que el tombstone de ventas, ver ahí.
  const registrarTombstoneNoVisita = (clienteIdT, diaT, fechaT) => {
    try {
      const ahoraT = Date.now();
      const prevT = JSON.parse(localStorage.getItem("cat_novisitas_tombstone_v1") || "[]");
      const CUARENTA_CINCO_DIAS = 45 * 24 * 60 * 60 * 1000;
      const vivoT = prevT.filter(t => ahoraT - t.ts < CUARENTA_CINCO_DIAS);
      vivoT.push({
        clave: `${clienteIdT}|${diaT}|${fechaT}`,
        ts: ahoraT
      });
      localStorage.setItem("cat_novisitas_tombstone_v1", JSON.stringify(vivoT));
    } catch {}
  };
  // Extraído para poder usarse tanto desde la pantalla completa de venta
  // (pantalla "venta") como desde la tarjeta compacta en la lista de
  // clientes: marca "no quiere" y, si quedaron envases prestados/devueltos
  // cargados, registra igual ese movimiento (mismo comportamiento de antes).
  const registrarNoQuiereConEnvases = (clienteIdObj, envPrest, envDev) => {
    const cli = clientes.find(c => c.id === clienteIdObj);
    const nv = [...(noVisitas || []).filter(v => !(v.clienteId === clienteIdObj && v.dia === diaActual && v.fecha === fechaActual)), {
      clienteId: clienteIdObj,
      dia: diaActual,
      fecha: fechaActual,
      motivo: "noquiso",
      _upd: Date.now()
    }];
    saveNoVisitas(nv);
    const _ep = (envPrest || []).filter(e => e.prod && Number(e.cant) > 0);
    const _ed = (envDev || []).filter(e => e.prod && Number(e.cant) > 0);
    if (_ep.length || _ed.length) {
      const fk = new Date().toLocaleDateString("en-CA");
      saveVentas(prev => [...prev, {
        id: Date.now(),
        clienteId: clienteIdObj,
        cliente: cli ? cli.nombre : "",
        dia: diaActual,
        fechaKey: fk,
        fecha: new Date().toLocaleString("es-AR"),
      hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        detalle: [{
          nombre: "Movimiento de envases (No quiere)",
          cantidad: 1,
          precio: 0,
          total: 0
        }],
        pago: "-",
        obs: "Envases marcados al no comprar",
        neto: 0,
        bruto: 0,
        desc: 0,
        costo: 0,
        ganancia: 0,
        pagadoNum: 0,
        saldoDelta: 0,
        envPrest: _ep,
        envDev: _ed,
        _esAjuste: true
      }]);
      saveClientes(prev => aplicarMovimientoEnvases(prev, ventas, clienteIdObj, _ep, _ed));
    }
    return nv;
  };
  const eliminarVenta = ventaId => {
    // Guard anti doble-tap: ignora un segundo borrado del MISMO id dentro de 2s
    // (el diálogo de confirmación puede tardar en cerrarse y volver a tocarse
    // "Eliminar" en la misma fila restaría el saldo dos veces).
    const ahoraDel = Date.now();
    if (ultimoBorradoRef.current.id === ventaId && ahoraDel - ultimoBorradoRef.current.ts < 2000) {
      console.warn("⚠️ Borrado duplicado bloqueado (doble tap):", ventaId);
      return;
    }
    ultimoBorradoRef.current = {
      id: ventaId,
      ts: ahoraDel
    };
    const v = ventas.find(x => x.id === ventaId);
    if (!v) return;
    const eraMixta = (Number(v.montoTrans) || 0) > 0;
    // Calculamos qué se borra y el ajuste de saldo AHORA MISMO, de forma
    // sincrónica — no depende de cuándo React decida correr el actualizador
    // de saveVentas (eso fue lo que causaba el tilde en "No está"/"No quiere").
    let ajusteSaldoExtra = 0;
    const idsABorrar = new Set([ventaId]);
    ventas.forEach(x => {
      const ligada = x._esMixtoTrans && (x._mixtoDe === ventaId || x._mixtoDe === undefined && eraMixta && x.clienteId === v.clienteId && x.fechaKey === v.fechaKey);
      if (ligada) {
        idsABorrar.add(x.id);
        if ((Number(x.saldoDelta) || 0) !== 0) ajusteSaldoExtra += Number(x.saldoDelta);
      }
    });
    // Dejar constancia de qué se borró y CUÁNDO (tombstone) — es lo que usa
    // el merge de traerDeLaNube para no revivir esta venta si la nube todavía
    // tiene la copia vieja cuando llegue el próximo refetch. Sin esto, borrar
    // una venta podía no "pegar": desaparecía un instante y volvía sola.
    try {
      const ahoraTomb = Date.now();
      const tombPrevio = JSON.parse(localStorage.getItem("cat_ventas_tombstone_v1") || "[]");
      const CUARENTA_CINCO_DIAS = 45 * 24 * 60 * 60 * 1000;
      const tombVivo = tombPrevio.filter(t => ahoraTomb - t.ts < CUARENTA_CINCO_DIAS);
      const tombNuevo = [...idsABorrar].map(id => ({
        id,
        ts: ahoraTomb
      }));
      localStorage.setItem("cat_ventas_tombstone_v1", JSON.stringify([...tombVivo, ...tombNuevo]));
    } catch {}
    // Guardar lo borrado para poder "Deshacer" — antes de tocar nada
    const ventasBorradas = ventas.filter(x => idsABorrar.has(x.id));
    const ajusteTotal = v.saldoDelta + ajusteSaldoExtra;
    if (deshacerTimerRef.current) clearTimeout(deshacerTimerRef.current);
    setDeshacerVenta({
      ventasBorradas,
      clienteId: v.clienteId,
      ajusteTotal,
      ts: Date.now()
    });
    deshacerTimerRef.current = setTimeout(() => setDeshacerVenta(null), 8000);
    // Escribimos sobre el ventas MÁS RECIENTE (prev), no sobre el closure —
    // así, si se borran varias ventas una atrás de otra rápido, ninguna
    // "revive" por pisar el array con una versión vieja.
    saveVentas(prev => {
      let nv = prev.filter(x => !idsABorrar.has(x.id));
      // Limpieza: partes-transferencia huérfanas (su venta principal ya no existe)
      nv = nv.filter(x => !(x._esMixtoTrans && x._mixtoDe !== undefined && !nv.some(y => y.id === x._mixtoDe)));
      return nv;
    });
    // El saldo se resta sobre el saldo REAL más reciente del cliente (prev),
    // así ninguna reversión se pierde si borrás varias ventas seguidas.
    // Los envases también se revierten: lo que esa venta prestó se le
    // devuelve al cliente (se resta de prestado) y lo que devolvió se le
    // vuelve a prestar (se suma a prestado) — mismo helper, roles invertidos.
    saveClientes(prev => {
      let out = prev;
      ventasBorradas.forEach(x => {
        if ((x.envPrest?.length || 0) > 0 || (x.envDev?.length || 0) > 0) {
          out = aplicarMovimientoEnvases(out, ventas, x.clienteId, x.envDev, x.envPrest);
        }
      });
      return out.map(x => x.id === v.clienteId ? {
        ...x,
        saldo: (Number(x.saldo) || 0) - v.saldoDelta - ajusteSaldoExtra
      } : x);
    });
  };
  const deshacerUltimaVenta = () => {
    if (!deshacerVenta) return;
    if (deshacerTimerRef.current) clearTimeout(deshacerTimerRef.current);
    const {
      ventasBorradas,
      clienteId,
      ajusteTotal
    } = deshacerVenta;
    // Sacar del tombstone lo que se está restaurando — si no, el próximo
    // merge de la nube podría volver a borrarlo solo.
    try {
      const idsRestaurados = new Set(ventasBorradas.map(x => x.id));
      const tombPrevio = JSON.parse(localStorage.getItem("cat_ventas_tombstone_v1") || "[]");
      localStorage.setItem("cat_ventas_tombstone_v1", JSON.stringify(tombPrevio.filter(t => !idsRestaurados.has(t.id))));
    } catch {}
    saveVentas(prev => [...prev, ...ventasBorradas]);
    saveClientes(prev => {
      let out = prev;
      ventasBorradas.forEach(x => {
        if ((x.envPrest?.length || 0) > 0 || (x.envDev?.length || 0) > 0) {
          out = aplicarMovimientoEnvases(out, ventas, x.clienteId, x.envPrest, x.envDev);
        }
      });
      return out.map(x => x.id === clienteId ? {
        ...x,
        saldo: (Number(x.saldo) || 0) + ajusteTotal
      } : x);
    });
    setDeshacerVenta(null);
  };

  // Limpieza automática: partes-transferencia cuya venta principal ya fue eliminada
  React.useEffect(() => {
    const huerfanas = ventas.filter(v => v._esMixtoTrans && v._mixtoDe !== undefined && !ventas.some(x => x.id === v._mixtoDe));
    if (huerfanas.length > 0) {
      const ids = new Set(huerfanas.map(v => v.id));
      saveVentas(prev => prev.filter(v => !ids.has(v.id)));
    }
  }, [ventas]);
  const editarVenta = (ventaId, detalle, pago, montoPagado, saldoAplicado, obs, montoTrans2) => {
    // Guard anti doble-tap: ignora una segunda edición IDÉNTICA de la MISMA
    // venta dentro de 2s (mismo motivo que el guard de eliminarVenta).
    const firmaEdit = JSON.stringify({
      ventaId,
      detalle,
      pago,
      montoPagado,
      saldoAplicado,
      montoTrans2
    });
    const ahoraEdit = Date.now();
    if (ultimoEditadoRef.current.firma === firmaEdit && ahoraEdit - ultimoEditadoRef.current.ts < 2000) {
      console.warn("⚠️ Edición duplicada bloqueada (doble tap):", ventaId);
      return;
    }
    ultimoEditadoRef.current = {
      firma: firmaEdit,
      ts: ahoraEdit
    };
    const vV = ventas.find(v => v.id === ventaId);
    if (!vV) return;
    const esMixto = pago === "mixto";
    const ef = Number(montoPagado) || 0,
      tr = esMixto ? Number(montoTrans2) || 0 : 0;
    const pagoReal = esMixto ? "contado" : pago;
    // MIXTO: el cálculo usa el TOTAL pagado (ef+tr), igual que al registrar → el saldo queda bien
    const calc = calcVenta(detalle, pagoReal, esMixto ? String(ef + tr) : montoPagado, saldoAplicado, productos);
    const obsLimpia = (obs || "").replace(/\s*\[Mixto:[^\]]*\]/g, "");
    const obsFinal = esMixto && tr > 0 ? obsLimpia + ` [Mixto: ef $${ef} + tr $${tr}]` : obsLimpia;
    const eraMixta = (Number(vV.montoTrans) || 0) > 0;
    // Buscar de forma sincrónica las partes-transferencia ligadas a esta venta
    // — no depende de cuándo React corra el actualizador de saveVentas.
    let ajusteLigadas = 0;
    let transConfirmadaPrevia = false;
    const idsLigados = new Set();
    ventas.forEach(v => {
      const ligada = v._esMixtoTrans && (v._mixtoDe === ventaId || v._mixtoDe === undefined && eraMixta && v.clienteId === vV.clienteId && v.fechaKey === vV.fechaKey);
      if (ligada) {
        idsLigados.add(v.id);
        if ((Number(v.saldoDelta) || 0) !== 0) ajusteLigadas += Number(v.saldoDelta);
        if (v.transConfirmada) transConfirmadaPrevia = true;
      }
    });
    // netDeltaCambio: cuánto CAMBIA el saldo por esta edición — es un delta puro,
    // no depende del saldo actual del cliente (por eso es seguro aplicarlo después
    // sobre el saldo más reciente, en vez de sobre el que había al abrir la pantalla).
    const netDeltaCambio = calc.saldoDelta - vV.saldoDelta - ajusteLigadas;
    saveVentas(prev => {
      let nev = prev.filter(v => !idsLigados.has(v.id));
      nev = nev.map(v => v.id === ventaId ? {
        ...vV,
        detalle,
        pago: pagoReal,
        obs: obsFinal,
        saldoAplicado: saldoAplicado || 0,
        ...calc,
        montoEfec: esMixto ? ef : 0,
        montoTrans: tr,
        _upd: Date.now()
      } : v);
      if (esMixto && tr > 0) {
        const ventaTr = {
          id: Date.now() + 2,
          clienteId: vV.clienteId,
          cliente: vV.cliente,
          dia: vV.dia,
          fechaKey: vV.fechaKey,
          fecha: vV.fecha,
          detalle: [{
            nombre: "Pago mixto · transferencia",
            cantidad: 1,
            precio: tr,
            total: tr
          }],
          pago: "transferencia",
          obs: "[Parte transfer. de pago mixto]",
          saldoAplicado: 0,
          neto: tr,
          bruto: tr,
          desc: 0,
          costo: 0,
          ganancia: 0,
          pagadoNum: tr,
          saldoDelta: 0,
          envPrest: [],
          envDev: [],
          _esMixtoTrans: true,
          _mixtoDe: ventaId,
          transConfirmada: transConfirmadaPrevia,
          _upd: Date.now()
        };
        nev = [...nev, ventaTr];
      }
      return nev;
    });
    saveClientes(prev => prev.map(x => x.id === vV.clienteId ? {
      ...x,
      saldo: (Number(x.saldo) || 0) + netDeltaCambio
    } : x));
  };
  if (!pinOk) return /*#__PURE__*/React.createElement(PantallaBloqueoLC, {
    onOk: () => {
      setPinOk(true);
      if (pantalla === "portada") irA("menu");
    }
  });
  window._setScaleIdxLC = setScaleIdx;
  // Header clickeable: tocar el nombre de la empresa en CUALQUIER pantalla
  // vuelve al inicio (mismo patrón que _setScaleIdxLC, sin pasar props por
  // todas las pantallas — HeaderApp se usa en decenas de lugares).
  window._lcIrInicio = () => irA("menu");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(DatosAppContext.Provider, {
    value: {
      productos,
      todasVentas: ventas,
      recordatorios,
      onPerdida: registrarPerdida,
    onPerdidaCliente: registrarPerdidaCliente,
      onPerdidaCliente: registrarPerdidaCliente,
      clientes,
      ventas,
      stock: stockNorm,
      syncData
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.app,
      zoom: SCALES[scaleIdx]
    }
  }, /*#__PURE__*/React.createElement(SyncBar, {
    status: syncStatus,
    isOnline: isOnline
  }), pantalla === "portada" && /*#__PURE__*/React.createElement(Portada, {
    onIngresar: () => irA("menu")
  }), pantalla === "menu" && /*#__PURE__*/React.createElement(MenuDias, {
    dias: DIAS,
    onDia: d => {
      setDiaActual(d);
      irA("diaPrincipal");
    },
    onPlanillaAtajo: () => irA("atajoPlanillaSemana"),
    onResumen: () => irA("resumen"),
    onConfig: tab => {
      setTabConfig(tab || "stock");
      irA("config");
    },
    onGestionClientes: () => irA("gestionClientes"),
    onStock: () => irA("stock"),
    onAgenda: () => irA("agenda"),
    onNuevoCliente: () => irA("nuevoCliente"),
    onPromociones: () => irA("prospectos"),
    onVolver: () => irA("portada"),
    darkMode: darkMode,
    onToggleDark: () => setDarkMode(!darkMode),
    scaleIdx: scaleIdx,
    onToggleScale: () => setScaleIdx(i => (i + 1) % 4),
    scaleLabel: SCALE_LABELS[scaleIdx],
    clientes: clientes,
    ventas: ventas,
    stock: stockNorm,
    recordatoriosActivos: recordatoriosActivos,
    onConfirmarRecordatorio: id => saveRecordatorios(prev => (prev || []).map(r => r.id === id ? {
      ...r,
      confirmado: true,
      _upd: Date.now()
    } : r)),
    onVerConfirmaciones: dia => {
      if (dia) setDiaActual(dia);
      irA("confirmacionesDia");
    },
    transferenciasPendientes: DIAS.map(dia => {
      const vts = ventas.filter(v => v.dia === dia && v.pago === "transferencia" && !v.transConfirmada);
      if (!vts.length) return null;
      const fechas = [...new Set(vts.map(v => v.fechaKey))].sort().reverse();
      return {
        dia,
        fecha: fechas[0] || "",
        count: vts.length,
        monto: vts.reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0),
        ventas: vts
      };
    }).filter(Boolean),
    zonasReparto: zonasReparto,
    onSetZona: (dia, zona) => {
      const nz = {
        ...zonasReparto,
        [dia]: zona
      };
      setZonasReparto(nz);
      syncData({
        zonasReparto: nz
      });
    },
    onDiaHoy: (dia, fechaKey) => {
      setDiaActual(dia);
      setFechaActual(fechaKey);
      setFechaObj(new Date(fechaKey + "T12:00:00"));
      // Si el camión ya se cargó hoy, no repetir la pantalla de "cargar envases"
      // cada vez que se vuelve a este día — ir directo a la lista de clientes.
      const yaIniciado = planillas[`${dia}_${fechaKey}`]?.iniciado;
      irA(yaIniciado ? "clientes" : "inicioReparto");
    },
    onDiaResumen: (dia, fechaKey) => {
      setDiaActual(dia);
      setFechaActual(fechaKey);
      setFechaObj(new Date(fechaKey + "T12:00:00"));
      irA("planilla");
    },
    noVisitas: noVisitas || [],
    onFiados: () => irA("fiadosPendientes"),
    onMapaClientes: () => irA("mapaClientes"),
    onDormidos: () => irA("clientesDormidos")
  }), pantalla === "confirmacionesDia" && /*#__PURE__*/React.createElement(ConfirmacionesDia, {
    dia: diaActual || "todos los días",
    ventas: ventas.filter(v => v.pago === "transferencia" && (!diaActual || v.dia === diaActual)),
    clientes: clientes,
    onConfirmar: ventaId => {
      saveVentas(prev => prev.map(v => v.id === ventaId ? {
        ...v,
        transConfirmada: !v.transConfirmada,
        _upd: Date.now()
      } : v));
    },
    onVolver: () => irA("menu")
  }), pantalla === "atajoPlanillaSemana" && /*#__PURE__*/React.createElement(AtajoPlanillaSemana, {
    planillas: planillas,
    ventas: ventas,
    clientes: clientes,
    onSeleccionar: (fk, dia) => {
      setDiaActual(dia);
      setFechaActual(fk);
      setOrigenFecha("atajo");
      irA("planilla");
    },
    onVolver: () => irA("menu")
  }), pantalla === "diaPrincipal" && /*#__PURE__*/React.createElement(DiaPrincipal, {
    dia: diaActual,
    onIrClientes: () => {
      // Si ya se venía trabajando esta fecha (camión ya cargado hoy), entrar
      // directo a la lista en vez de pasar de nuevo por el selector de fecha
      // + la pantalla de "Inicio del reparto".
      const yaIniciado = fechaActual && planillas[`${diaActual}_${fechaActual}`]?.iniciado;
      irA(yaIniciado ? "clientes" : "selectorFechaClientes");
    },
    onIrPlanilla: () => irA("selectorFechaPlanilla"),
    onVolver: () => irA("menu"),
    onVerConfirmaciones: () => irA("confirmacionesDia"),
    ventasPendientesTransfer: ventas.filter(v => v.dia === diaActual && v.pago === "transferencia" && !v.transConfirmada).length
  }), pantalla === "selectorFechaPlanilla" && /*#__PURE__*/React.createElement(SelectorFecha, {
    dia: diaActual,
    planillas: planillas,
    ventas: ventas,
    noVisitas: noVisitas,
   onSeleccionar: (fk, fo) => {
      setFechaActual(fk);
      setFechaObj(fo);
      setOrigenFecha("planilla");
      const yaIniciado = planillas[`${diaActual}_${fk}`]?.iniciado;
      irA(yaIniciado ? "planilla" : "inicioReparto");
    },
    onVolver: () => irA("diaPrincipal")
  }), pantalla === "planilla" && /*#__PURE__*/React.createElement(PlanillaDelDia, {
    dia: diaActual,
    fecha: fechaActual,
    ventas: ventas.filter(v => v.fechaKey === fechaActual),
    todasLasVentas: ventas,
    clientes: clientes,
    planilla: planillas[`${diaActual}_${fechaActual}`] || planillaDiaVacia(),
    productos: productos,
    stock: stockNorm,
    setStock: setStock,
    syncData: syncData,
    autoCierre: !!planillas[`${diaActual}_${fechaActual}`]?.iniciado,
    cargasDia: cargasDia,
    onGuardar: d => {
      savePlanilla(`${diaActual}_${fechaActual}`, d);
      if (!d._diaCerrado) irA(origenFecha === "atajo" ? "atajoPlanillaSemana" : "selectorFechaPlanilla");
      // Si es cierre de d\xc3\xada, no navega: setMostrarCierre(false) vuelve a la planilla normal
    },
    onAutoGuardar: d => savePlanilla(`${diaActual}_${fechaActual}`, d),
    onVolver: () => irA(origenFecha === "atajo" ? "atajoPlanillaSemana" : "selectorFechaPlanilla"),
    noVisitas: noVisitas
  }), pantalla === "selectorFechaClientes" && /*#__PURE__*/React.createElement(SelectorFecha, {
    dia: diaActual,
    planillas: planillas,
    ventas: ventas,
    noVisitas: noVisitas,
    onSeleccionar: (fk, fo) => {
      setFechaActual(fk);
      setFechaObj(fo);
      setOrigenFecha("clientes");
      // Si el camión ya se cargó ese día, no repetir "Inicio del reparto" —
      // ir directo a la lista de clientes (mismo criterio que selectorFechaPlanilla).
      const yaIniciado = planillas[`${diaActual}_${fk}`]?.iniciado;
      irA(yaIniciado ? "clientes" : "inicioReparto");
    },
    onVolver: () => irA("diaPrincipal")
  }), pantalla === "inicioReparto" && /*#__PURE__*/React.createElement(InicioReparto, {
    dia: diaActual,
    fecha: fechaActual,
    planilla: planillas[`${diaActual}_${fechaActual}`] || planillaDiaVacia(),
    productos: productos,
    cargasDia: cargasDia,
    stock: stockNorm,
    onGuardar: (p, descontar) => {
      savePlanilla(`${diaActual}_${fechaActual}`, p);
      if (descontar) {
        const soda = Number(p.productos?.soda?.llenos || 0);
        const b10 = Number(p.productos?.b10?.llenos || 0);
        const b20 = Number(p.productos?.b20?.llenos || 0);
        setStock(prev => {
          const s = JSON.parse(JSON.stringify(normStock(prev)));
          s.soderia.sifon = Math.max(0, (s.soderia.sifon || 0) - soda);
          s.soderia.bidon10 = Math.max(0, (s.soderia.bidon10 || 0) - b10);
          s.soderia.bidon20 = Math.max(0, (s.soderia.bidon20 || 0) - b20);
          s.camion.sifon = (s.camion.sifon || 0) + soda;
          s.camion.bidon10 = (s.camion.bidon10 || 0) + b10;
          s.camion.bidon20 = (s.camion.bidon20 || 0) + b20;
          syncData({
            stock: normStock(s)
          });
          return normStock(s);
        });
        // La carga real de hoy queda como sugerencia para la próxima vez que
        // toque este día — así no depende de un número fijo cargado una vez.
        saveCargasDia(prev => ({
          ...prev,
          [diaActual]: {
            soda,
            b10,
            b20
          }
        }));
      }
      irA(origenFecha === "planilla" ? "planilla" : "clientes");
    },
    onVolver: () => irA(origenFecha === "planilla" ? "selectorFechaPlanilla" : "selectorFechaClientes")
  }), pantalla === "clientes" && /*#__PURE__*/React.createElement(ListaClientes, {
    clientes: clientes.filter(c => c.dia === diaActual),
    dia: diaActual,
    fecha: fechaActual,
    ventas: ventas.filter(v => v.fechaKey === fechaActual && v.dia === diaActual),
    todasVentas: ventas,
    noVisitas: (noVisitas || []).filter(v => v.dia === diaActual && v.fecha === fechaActual),
    productos: productos,
    onGuardarVenta: (clienteIdVenta, ...args) => registrarVenta(clienteIdVenta, ...args),
    onNoQuiereConEnvases: registrarNoQuiereConEnvases,
    onEditarCliente: (id, cambios) => {
      const antes = clientes.find(c => c.id === id);
      saveClientes(prev => prev.map(c => c.id === id ? {
        ...c,
        ...cambios
      } : c));
      if (antes) ajustarStockFijoCliente(antes, { ...antes, ...cambios });
    },
    onCambiarDispenserCliente: (id, delta) => {
      const antes = clientes.find(c => c.id === id);
      saveClientes(prev => prev.map(c => c.id === id ? {
        ...c,
        dispenser: Math.max(0, (Number(c.dispenser) || 0) + delta)
      } : c));
      if (antes) ajustarStockFijoCliente(antes, { ...antes, dispenser: Math.max(0, (Number(antes.dispenser) || 0) + delta) });
    },
    onSeleccionar: c => {
      setClienteId(c.id);
      irA("detalleCliente");
    },
    onEntregar: c => {
      setClienteId(c.id);
      irA("venta");
    },
    onNuevoCliente: () => irA("nuevoCliente"),
    onVolver: () => irA("selectorFechaClientes"),
    onReordenar: lista => {
      saveClientes(prev => [...prev.filter(c => c.dia !== diaActual), ...lista]);
    },
    onRegistrarNoVisita: (clienteId, motivo) => {
      saveNoVisitas(prev => [...(prev || []).filter(v => !(v.clienteId === clienteId && v.dia === diaActual && v.fecha === fechaActual)), {
        clienteId,
        dia: diaActual,
        fecha: fechaActual,
        motivo,
        _upd: Date.now()
      }]);
    },
    onQuitarNoVisita: clienteId => {
      registrarTombstoneNoVisita(clienteId, diaActual, fechaActual);
      saveNoVisitas(prev => (prev || []).filter(v => !(v.clienteId === clienteId && v.dia === diaActual && v.fecha === fechaActual)));
    },
    onConfirmarTransfer: (clienteId, ventaId) => {
      saveVentas(prev => prev.map(v => v.id === ventaId ? {
        ...v,
        transConfirmada: !v.transConfirmada,
        _upd: Date.now()
      } : v));
    },
    onAbrirMapa: () => irA("mapaClientes"),
    onPlanilla: () => irA("planilla")
  }), pantalla === "detalleCliente" && cliente && /*#__PURE__*/React.createElement(DetalleCliente, {
    cliente: cliente,
    ventas: ventas.filter(v => v.clienteId === cliente.id),
    noVisitas: (noVisitas || []).filter(v => v.clienteId === cliente.id),
    dia: diaActual,
    fecha: fechaActual,
    // BUG REPORTADO: "Editar" en una venta desde el perfil del cliente
    // rompía la app ("Cannot read properties of undefined (reading
    // 'forEach')"). Causa: acá nunca se pasaba la prop `productos`, así que
    // EditVenta (08-ventas.js) recibía productos=undefined y explotaba en
    // su primer useState (productos.forEach(...)). El otro punto donde se
    // usa DetalleCliente (pantalla "detalleDesdeGestion", más abajo) sí la
    // pasaba — por eso desde Gestión funcionaba pero desde la lista normal
    // de clientes no.
    productos: productos,
    onVenta: () => {
      const hoyKey = new Date().toLocaleDateString("en-CA");
      if (fechaActual !== hoyKey) setFechaActual(hoyKey);
      irA("venta");
    },
    onVolver: () => irA("clientes"),
    onEditar: cambios => updateCliente(cliente.id, cambios),
    onEliminarVenta: eliminarVenta,
    onEditarVenta: editarVenta,
    onEliminarCliente: () => eliminarCliente(cliente.id),
    onEliminarNoVisita: (nvDia, nvFecha) => {
      registrarTombstoneNoVisita(cliente.id, nvDia, nvFecha);
      saveNoVisitas(prev => (prev || []).filter(v => !(v.clienteId === cliente.id && v.dia === nvDia && v.fecha === nvFecha)));
    },
    onNoEstaCliente: () => {
      const nv = [...(noVisitas || []).filter(v => !(v.clienteId === cliente.id && v.dia === diaActual && v.fecha === fechaActual)), {
        clienteId: cliente.id,
        dia: diaActual,
        fecha: fechaActual,
        motivo: "noesta",
        _upd: Date.now()
      }];
      saveNoVisitas(nv);
      const sigId = siguientePendienteId(clientes, ventas, nv, diaActual, fechaActual, cliente.id);
      if (sigId) {
        setClienteId(sigId);
        irA("detalleCliente");
      } else irA("clientes");
    },
    onNoQuiereCliente: () => {
      const nv = [...(noVisitas || []).filter(v => !(v.clienteId === cliente.id && v.dia === diaActual && v.fecha === fechaActual)), {
        clienteId: cliente.id,
        dia: diaActual,
        fecha: fechaActual,
        motivo: "noquiso",
        _upd: Date.now()
      }];
      saveNoVisitas(nv);
      const sigId = siguientePendienteId(clientes, ventas, nv, diaActual, fechaActual, cliente.id);
      if (sigId) {
        setClienteId(sigId);
        irA("detalleCliente");
      } else irA("clientes");
    },
    recordatorios: recordatorios,
    onGuardarRecordatorio: r => saveRecordatorios(prev => [...(prev || []), {
      ...r,
      _upd: Date.now()
    }]),
    onConfirmarRecordatorio: id => saveRecordatorios(prev => (prev || []).map(r => r.id === id ? {
      ...r,
      confirmado: true,
      _upd: Date.now()
    } : r)),
    onCobrarSaldo: (monto, pago) => {
      const cl = cliente;
      const det = [{
        nombre: "Cobro de deuda",
        cantidad: 1,
        precio: 0,
        total: 0
      }];
      const fk = new Date().toLocaleDateString("en-CA");
      // saldoAntes/saldoDespues son solo para mostrar en el historial (referencia visual);
      // el cálculo real del saldo usa saldoDelta con forma funcional más abajo.
      const vt = {
        id: Date.now(),
        clienteId: cl.id,
        cliente: cl.nombre,
        dia: diaActual || cl.dia,
        fechaKey: fk,
        fecha: new Date().toLocaleString("es-AR"),
      hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        detalle: det,
        pago,
        obs: `Cobro de deuda ${fmt(monto)} (${pago})`,
        saldoAplicado: 0,
        neto: 0,
        bruto: 0,
        desc: 0,
        costo: 0,
        ganancia: 0,
        pagadoNum: monto,
        saldoDelta: monto,
        envPrest: [],
        envDev: [],
        saldoAntes: cl.saldo || 0,
        saldoDespues: (cl.saldo || 0) + monto,
        _esCobro: true,
        _upd: Date.now()
      };
      saveVentas(prev => {
        const { ventasActualizadas, idsAfectados } = aplicarCobroAVentasFiado(prev, cl.id, monto);
        return [...ventasActualizadas, { ...vt, _ventasSaldadas: idsAfectados }];
      });
      saveClientes(prev => prev.map(x => x.id === cl.id ? {
        ...x,
        saldo: (Number(x.saldo) || 0) + monto
      } : x));
    },
    onGuardarAjuste: vt => {
      saveVentas(prev => [...prev, vt]);
    },
    onGuardarCambio: vt => {
      saveVentas(prev => [...prev, vt]);
    }
  }), pantalla === "venta" && cliente && /*#__PURE__*/React.createElement(NuevaVenta, {
    // BUG REPORTADO: mientras se cargaba una venta, las cantidades tipeadas
    // se borraban solas y a veces quedaba "transferencia" guardada como
    // "contado". Causa: la key incluía ventas.filter(...).length, que
    // cambia con cualquier sync de Firestore que toque las ventas de este
    // cliente (aunque el usuario no haya hecho nada) -> React desmontaba y
    // volvía a montar NuevaVenta DE CERO en medio de la carga, perdiendo
    // cantidades, método de pago, etc. Después de guardar, el flujo siempre
    // navega a otro cliente o a la lista (ver onGuardar más abajo), así que
    // no hace falta ese .length para "refrescar" el formulario — con
    // clienteId alcanza.
    key: clienteId,
    cliente: cliente,
    productos: productos,
    fecha: fechaActual,
    ventasCliente: ventas.filter(v => v.clienteId === cliente.id),
    progressData: (() => {
      const clientesDia = clientes.filter(c => c.dia === diaActual);
      const ventasHoy = ventas.filter(v => v.fechaKey === fechaActual && v.dia === diaActual && !v._esCobro && !v._esAjuste && !v._esMixtoTrans);
      const noVHoy = (noVisitas || []).filter(v => v.dia === diaActual && v.fecha === fechaActual);
      const visitadosIds = new Set([...ventasHoy.map(v => v.clienteId), ...noVHoy.map(v => v.clienteId)]);
      const montoHoy = ventasHoy.reduce((a, v) => a + (v.neto || 0), 0);
      const sifs = ventasHoy.reduce((a, v) => a + (v.detalle || []).filter(d => d.nombre === "Sifón 1.5L").reduce((b, d) => b + d.cantidad, 0), 0);
      const b10 = ventasHoy.reduce((a, v) => a + (v.detalle || []).filter(d => d.nombre === "Bidón 10L").reduce((b, d) => b + d.cantidad, 0), 0);
      const b20 = ventasHoy.reduce((a, v) => a + (v.detalle || []).filter(d => d.nombre === "Bidón 20L").reduce((b, d) => b + d.cantidad, 0), 0);
      const planillaHoy = planillas[`${diaActual}_${fechaActual}`] || {};
      const stockRestante = {
        "Sif": Math.max(0, (Number(planillaHoy.productos?.soda?.llenos) || 0) - sifs),
        "10L": Math.max(0, (Number(planillaHoy.productos?.b10?.llenos) || 0) - b10),
        "20L": Math.max(0, (Number(planillaHoy.productos?.b20?.llenos) || 0) - b20)
      };
      return {
        visitados: visitadosIds.size,
        total: clientesDia.length,
        montoHoy,
        stock: stockRestante
      };
    })(),
    onNoEsta: () => {
      const anterior = (noVisitas || []).find(v => v.clienteId === clienteId && v.dia === diaActual && v.fecha === fechaActual);
      const motivo = anterior?.motivo === "noesta" ? "noesta2" : "noesta";
      const nv = [...(noVisitas || []).filter(v => !(v.clienteId === clienteId && v.dia === diaActual && v.fecha === fechaActual)), {
        clienteId,
        dia: diaActual,
        fecha: fechaActual,
        motivo,
        _upd: Date.now()
      }];
      saveNoVisitas(nv);
      const sigId = siguientePendienteId(clientes, ventas, nv, diaActual, fechaActual, clienteId);
      if (sigId) {
        setClienteId(sigId);
        irA("venta");
      } else irA("clientes");
    },
    onNoQuiere: (envPrest, envDev) => {
      const nv = registrarNoQuiereConEnvases(clienteId, envPrest, envDev);
      const sigId = siguientePendienteId(clientes, ventas, nv, diaActual, fechaActual, clienteId);
      if (sigId) {
        setClienteId(sigId);
        irA("venta");
      } else irA("clientes");
    },
    onGuardar: (...args) => {
      // Pasa TODOS los argumentos (incluye el desglose del pago mixto: montoTrans2 y saldoDelta)
      registrarVenta(clienteId, ...args);
      // Auto-advance to next pending client (noesta = volver al final, no saltar a ellos)
      const clientesDia = clientes.filter(c => c.dia === diaActual).sort((a, b) => (a.orden || 9999) - (b.orden || 9999));
      const visitadosIds = new Set([...ventas.filter(v => v.fechaKey === fechaActual && v.dia === diaActual && !v._esCobro && !v._esAjuste && !v._esMixtoTrans).map(v => v.clienteId), ...(noVisitas || []).filter(v => v.dia === diaActual && v.fecha === fechaActual && (v.motivo === "noquiso" || v.motivo === "noesta2" || v.motivo === "noesta" || v.motivo === "salteado")).map(v => v.clienteId)]);
      visitadosIds.add(clienteId);
      const siguiente = clientesDia.find(c => !visitadosIds.has(c.id) && c.id !== clienteId);
      if (siguiente) {
        setClienteId(siguiente.id);
        irA("venta");
      } else irA("clientes");
    },
    onSaltar: () => {
      const nv = [...(noVisitas || []).filter(v => !(v.clienteId === clienteId && v.dia === diaActual && v.fecha === fechaActual)), {
        clienteId,
        dia: diaActual,
        fecha: fechaActual,
        motivo: "salteado",
        _upd: Date.now()
      }];
      saveNoVisitas(nv);
      // Auto-avanzar al siguiente cliente pendiente, respetando el orden de reparto
      const visitadosIds = new Set([...ventas.filter(v => v.fechaKey === fechaActual && v.dia === diaActual).map(v => v.clienteId), ...nv.filter(v => v.fecha === fechaActual && v.dia === diaActual).map(v => v.clienteId)]);
      const clientesDia = clientes.filter(c => c.dia === diaActual).sort((a, b) => (a.orden || 9999) - (b.orden || 9999));
      const sig = clientesDia.find(c => !visitadosIds.has(c.id) && c.id !== clienteId);
      if (sig) {
        setClienteId(sig.id);
        irA("venta");
      } else irA("clientes");
    },
    onVolver: () => irA("detalleCliente")
  }), pantalla === "nuevoCliente" && /*#__PURE__*/React.createElement(NuevoCliente, {
    diaActual: diaActual,
    prefill: prospectoAConvertir ? {
      nombre: prospectoAConvertir.nombre,
      telefono: prospectoAConvertir.telefono,
      calle: prospectoAConvertir.calle,
      barrio: prospectoAConvertir.barrio
    } : null,
    onGuardar: datos => {
      const orden = datos.orden;
      saveClientes(prevC => {
        let base = prevC;
        if (orden && prevC.some(c => c.dia === datos.dia && (c.orden || 0) === Number(orden))) {
          base = prevC.map(c => c.dia === datos.dia && (c.orden || 0) >= Number(orden) ? {
            ...c,
            orden: (c.orden || 0) + 1
          } : c);
        }
        return [...base, {
          ...datos,
          id: nuevoIdCat(),
          saldo: 0,
          dispenser: datos.dispenser || 0,
          creadoFecha: new Date().toLocaleDateString("en-CA")
        }].sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || (a.orden || 9999) - (b.orden || 9999));
      });
      ajustarStockFijoCliente(null, datos);
      // Si venía de "Convertir en cliente" desde un prospecto, lo marcamos
      // como convertido (no se borra, queda el historial) y volvemos a la
      // lista de prospectos en vez de a la lista de clientes.
      if (prospectoAConvertir) {
        const idProsp = prospectoAConvertir.id;
        setProspectoAConvertir(null);
        saveProspectos(prev => (prev || []).map(p => p.id === idProsp ? {
          ...p,
          estado: "convertido"
        } : p));
        irA("prospectos");
      } else {
        irA("clientes");
      }
    },
    onVolver: () => {
      const veniaDeProspecto = !!prospectoAConvertir;
      setProspectoAConvertir(null);
      irA(veniaDeProspecto ? "prospectos" : "clientes");
    }
  }), pantalla === "prospectos" && /*#__PURE__*/React.createElement(Prospectos, {
    prospectos: prospectos,
    onGuardar: p => saveProspectos(prev => [...(prev || []), p]),
    onEliminar: id => saveProspectos(prev => (prev || []).filter(p => p.id !== id)),
    onConvertir: p => {
      setProspectoAConvertir(p);
      irA("nuevoCliente");
    },
    onVolver: () => irA("menu")
  }), pantalla === "gestionClientes" && /*#__PURE__*/React.createElement(GestionClientes, {
    onIrTab: irA,
    clientes: clientes,
    onPerdida: registrarPerdida,
    onPerdidaCliente: registrarPerdidaCliente,
    onReordenarTodo: lista => saveClientes(lista),
    onEditar: (id, cambios) => {
      const antes = clientes.find(c => c.id === id);
      saveClientes(prev => prev.map(c => c.id === id ? {
        ...c,
        ...cambios
      } : c));
      if (antes) ajustarStockFijoCliente(antes, { ...antes, ...cambios });
    },
    onEliminar: id => {
      window.lcConfirm("¿Eliminar cliente? Se quitará de todas las listas (clientes, ventas, no-visitas y recordatorios).", {
        peligro: true
      }).then(function (ok) {
        if (ok) {
          eliminarCliente(id);
          irA("gestionClientes");
        }
      });
    },
    onNuevo: datos => {
      const orden = datos.orden;
      saveClientes(prevC => {
        let nuevos;
        if (orden && prevC.some(c => c.dia === datos.dia && c.orden === orden)) {
          // Shift all clients with same day and order >= new order
          nuevos = prevC.map(c => c.dia === datos.dia && (c.orden || 0) >= orden ? {
            ...c,
            orden: (c.orden || 0) + 1
          } : c);
        } else {
          nuevos = [...prevC];
        }
        return [...nuevos, {
          ...datos,
          id: nuevoIdCat(),
          saldo: 0,
          dispenser: datos.dispenser || 0,
          creadoFecha: new Date().toLocaleDateString("en-CA")
        }].sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || (a.orden || 9999) - (b.orden || 9999));
      });
      ajustarStockFijoCliente(null, datos);
    },
    onVolver: () => irA("menu"),
    onRegistrarVenta: c => {
      setClienteId(c.id);
      // Asegurar que fechaActual esté seteado a hoy
      const hoyKey = new Date().toLocaleDateString("en-CA");
      if (!fechaActual) setFechaActual(hoyKey);
      // Si no hay diaActual, usar el día del cliente como fallback
      if (!diaActual) setDiaActual(c.dia);
      irA("venta");
    },
    onVerDetalle: c => {
      setClienteId(c.id);
      irA("detalleDesdeGestion");
    },
    ventas: ventas,
    productos: productos,
    onGuardarCambio: vt => {
      saveVentas(prev => [...prev, vt]);
    }
  }), pantalla === "detalleDesdeGestion" && cliente && /*#__PURE__*/React.createElement(DetalleCliente, {
    cliente: cliente,
    ventas: ventas.filter(v => v.clienteId === cliente.id),
    noVisitas: (noVisitas || []).filter(v => v.clienteId === cliente.id),
    dia: diaActual || cliente.dia,
    fecha: fechaActual,
    productos: productos,
    onVenta: () => {
      setDiaActual(cliente.dia);
      const hoy = new Date().toLocaleDateString("en-CA");
      if (!fechaActual) setFechaActual(hoy);
      irA("venta");
    },
    onVolver: () => irA("gestionClientes"),
    onEditar: cambios => updateCliente(cliente.id, cambios),
    onEliminarVenta: eliminarVenta,
    onEditarVenta: editarVenta,
    onEliminarCliente: () => {
      eliminarCliente(cliente.id);
      irA("gestionClientes");
    },
    onNoEstaCliente: () => {},
    onNoQuiereCliente: () => {},
    recordatorios: recordatorios,
    onGuardarRecordatorio: r => saveRecordatorios(prev => [...(prev || []), {
      ...r,
      _upd: Date.now()
    }]),
    onConfirmarRecordatorio: id => saveRecordatorios(prev => (prev || []).map(r => r.id === id ? {
      ...r,
      confirmado: true,
      _upd: Date.now()
    } : r)),
    onCobrarSaldo: (monto, pago) => {
      if (cliente) {
        const det = [{
          nombre: "Cobro de deuda",
          cantidad: 1,
          precio: 0,
          total: 0
        }];
        const fk = fechaActual || new Date().toLocaleDateString("en-CA");
        const vt = {
          id: Date.now(),
          clienteId: cliente.id,
          cliente: cliente.nombre,
          dia: diaActual || cliente.dia,
          fechaKey: fk,
          fecha: new Date().toLocaleString("es-AR"),
      hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
          detalle: det,
          pago,
          obs: `Cobro de deuda $${monto.toLocaleString("es-AR")} (${pago})`,
          saldoAplicado: 0,
          neto: 0,
          bruto: 0,
          desc: 0,
          costo: 0,
          ganancia: 0,
          pagadoNum: monto,
          saldoDelta: monto,
          envPrest: [],
          envDev: [],
          saldoAntes: cliente.saldo || 0,
          saldoDespues: (cliente.saldo || 0) + monto,
          _esCobro: true,
          _upd: Date.now()
        };
        saveVentas(prev => {
          const { ventasActualizadas, idsAfectados } = aplicarCobroAVentasFiado(prev, cliente.id, monto);
          return [...ventasActualizadas, { ...vt, _ventasSaldadas: idsAfectados }];
        });
        saveClientes(prev => prev.map(x => x.id === cliente.id ? {
          ...x,
          saldo: (Number(x.saldo) || 0) + monto
        } : x));
      }
    },
    onGuardarCambio: vt => {
      saveVentas(prev => [...prev, vt]);
    }
  }), pantalla === "agenda" && /*#__PURE__*/React.createElement(AgendaScreen, {
    recordatorios: recordatorios || [],
    clientes: clientes,
    onConfirmar: id => saveRecordatorios(prev => (prev || []).map(r => r.id === id ? {
      ...r,
      confirmado: true,
      _upd: Date.now()
    } : r)),
    onEliminar: id => {
      registrarTombstoneId("recordatorios", id);
      saveRecordatorios(prev => (prev || []).filter(r => r.id !== id));
    },
    onNuevo: datos => {
      const c = clientes.find(x => x.id === datos.clienteId);
      if (!c) {
        lcAlert("Seleccioná un cliente");
        return;
      }
      saveRecordatorios(prev => [...(prev || []), {
        ...datos,
        id: Date.now(),
        clienteId: c.id,
        clienteNombre: c.nombre,
        dia: c.dia,
        confirmado: false
      }]);
    },
    onIrCliente: clienteId => {
      setClienteId(clienteId);
      irA("detalleDesdeGestion");
    },
    onVolver: () => irA("menu")
  }), pantalla === "stock" && /*#__PURE__*/React.createElement(StockGeneral, {
    stock: stockNorm,
    setStock: ns => {
      setStock(ns);
      syncData({
        stock: ns
      });
    },
    clientes: clientes,
    setClientes: saveClientes,
    ventas: ventas,
    productos: productos,
    setProductos: saveProductos,
    onEliminarProducto: id => registrarTombstoneId("productos", id),
    cargasDia: cargasDia,
    setCargasDia: saveCargasDia,
    planillas: planillas,
    perdidas: perdidas,
    registrarPerdida: registrarPerdida,
    onVolver: () => irA("menu"),
    onResumen: () => irA("resumen")
  }), pantalla === "resumen" && /*#__PURE__*/React.createElement(Resumen, {
    ventas: ventas,
    clientes: clientes,
    productos: productos,
    planillas: planillas,
    noVisitas: noVisitas || [],
    onVolver: () => irA("menu")
  }), pantalla === "fiadosPendientes" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ClientesTabs, {
    activo: "fiados",
    onIr: irA
  }), /*#__PURE__*/React.createElement(FiadosPendientes, {
    clientes: clientes,
    onPerdida: registrarPerdida,
    onPerdidaCliente: registrarPerdidaCliente,
    onCobrar: (clienteId, monto, pago) => {
      const cl = clientes.find(c => c.id === clienteId);
      if (!cl) return;
      // saldoAntes/saldoDespues son solo para mostrar en el historial (referencia visual);
      // el cálculo real del saldo usa saldoDelta con forma funcional más abajo.
      const vt = {
        id: Date.now(),
        clienteId: cl.id,
        cliente: cl.nombre,
        dia: cl.dia,
        fechaKey: new Date().toLocaleDateString("en-CA"),
        fecha: new Date().toLocaleString("es-AR"),
      hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        detalle: [{
          nombre: "Cobro de deuda",
          cantidad: 1,
          precio: monto,
          total: monto
        }],
        pago,
        obs: `Cobro de deuda ${fmt(monto)} (${pago})`,
        neto: monto,
        bruto: monto,
        desc: 0,
        costo: monto,
        ganancia: 0,
        pagadoNum: monto,
        saldoDelta: monto,
        envPrest: [],
        envDev: [],
        saldoAntes: cl.saldo || 0,
        saldoDespues: (cl.saldo || 0) + monto,
        _esCobro: true,
        _upd: Date.now()
      };
      saveVentas(prev => {
        const { ventasActualizadas, idsAfectados } = aplicarCobroAVentasFiado(prev, clienteId, monto);
        return [...ventasActualizadas, { ...vt, _ventasSaldadas: idsAfectados }];
      });
      saveClientes(prev => prev.map(c => c.id === clienteId ? {
        ...c,
        saldo: (Number(c.saldo) || 0) + monto
      } : c));
    },
    onVolver: () => irA("menu"),
    ventas: ventas,
    onEditarCliente: (id, cambios) => {
      const antes = clientes.find(c => c.id === id);
      saveClientes(prev => prev.map(c => c.id === id ? {
        ...c,
        ...cambios
      } : c));
      if (antes) ajustarStockFijoCliente(antes, { ...antes, ...cambios });
    }
  })), pantalla === "clientesDormidos" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ClientesTabs, {
    activo: "dormidos",
    onIr: irA
  }), /*#__PURE__*/React.createElement(ClientesDormidos, {
    clientes: clientes,
    ventas: ventas,
    onPerdida: registrarPerdida,
    onPerdidaCliente: registrarPerdidaCliente,
    onVolver: () => irA("menu"),
    onSeleccionar: c => {
      setClienteId(c.id);
      setDiaActual(c.dia);
      irA("detalleCliente");
    },
    onEditarCliente: (id, cambios) => {
      const antes = clientes.find(c => c.id === id);
      saveClientes(prev => prev.map(c => c.id === id ? {
        ...c,
        ...cambios
      } : c));
      if (antes) ajustarStockFijoCliente(antes, { ...antes, ...cambios });
    },
    onEliminar: eliminarCliente
  })), modalResumenDia && (() => {
    const {
      dia,
      fechaKey
    } = modalResumenDia;
    const vDia = ventas.filter(v => v.fechaKey === fechaKey && v.dia === dia && !v._esCobro && !v._esAjuste && !v._esMixtoTrans);
    const efectivo = vDia.filter(v => v.pago === "contado").reduce((a, v) => a + ((Number(v.montoTrans) || 0) > 0 ? Number(v.montoEfec) || 0 : v.pagadoNum || v.neto || 0), 0);
    const transTot = vDia.filter(v => v.pago === "transferencia").reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0);
    const transConf = vDia.filter(v => v.pago === "transferencia" && v.transConfirmada).reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0);
    const transPend = transTot - transConf;
    const fiado = vDia.filter(v => v.pago === "fiado").reduce((a, v) => a + (v.neto || 0), 0);
    const total = efectivo + transTot + fiado;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--color-background-primary)",
        borderRadius: 16,
        padding: 24,
        width: "100%",
        maxWidth: 360,
        display: "flex",
        flexDirection: "column",
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 36,
        marginBottom: 6
      }
    }, "✅"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        fontWeight: 600,
        color: "var(--color-text-primary)"
      }
    }, "¡Día completado!"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--color-text-tertiary)",
        marginTop: 2,
        textTransform: "capitalize"
      }
    }, dia, " · ", new Date(fechaKey + "T12:00:00").toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, [["💵 Efectivo", efectivo, "success"], ["💳 Transferencias", transTot, "info"], transPend > 0 && ["   🔴 Pendientes de confirmar", transPend, "warning"], ["📋 Fiado nuevo", fiado, "warning"]].filter(Boolean).map(([l, v, c]) => /*#__PURE__*/React.createElement("div", {
      key: l,
      style: {
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: 8,
        background: "var(--color-background-secondary)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--color-text-secondary)"
      }
    }, l), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 500,
        color: `var(--color-text-${c})`
      }
    }, fmt(v)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: 8,
        background: "var(--color-background-tertiary)",
        borderTop: "0.5px solid var(--color-border-tertiary)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: "var(--color-text-primary)"
      }
    }, "Total del día"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 17,
        fontWeight: 700,
        color: "var(--color-text-success)"
      }
    }, fmt(total)))), /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btnPrimary
      },
      onClick: () => {
        setModalResumenDia(null);
        irA("planilla");
      }
    }, "Ver planilla completa →"), /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btn,
        textAlign: "center"
      },
      onClick: () => setModalResumenDia(null)
    }, "Cerrar")));
  })(), pantalla === "mapaClientes" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ClientesTabs, {
    activo: "mapa",
    onIr: irA
  }), /*#__PURE__*/React.createElement(MapaClientes, {
    clientes: clientes,
    dia: diaActual,
    fecha: fechaActual,
    ventas: ventas,
    noVisitas: noVisitas,
    onActualizar: saveClientes,
    onSeleccionar: c => {
      setClienteId(c.id);
      irA("detalleDesdeGestion");
    },
    onVolver: () => irA("menu")
  })), pantalla === "config" && /*#__PURE__*/React.createElement(Config, {
    productos: productos,
    setProductos: saveProductos,
    onEliminarProducto: id => registrarTombstoneId("productos", id),
    clientes: clientes,
    setClientes: saveClientes,
    ventas: ventas,
    setVentas: saveVentas,
    planillas: planillas,
    setPlanillas: savePlanillasCloud,
    stock: stockNorm,
    setStock: s => {
      const ns = normStock(s);
      setStockRaw(ns);
      syncData({
        stock: ns
      });
    },
    cargasDia: cargasDia,
    setCargasDia: saveCargasDia,
    syncData: syncData,
    onVolver: () => irA("menu"),
    ecToken: ecToken,
    setEcToken: setEcToken,
    tabInicial: tabConfig,
    noVisitas: noVisitas,
    onDiagnostico: () => irA("diagnostico")
  }), pantalla === "diagnostico" && /*#__PURE__*/React.createElement(Diagnostico, {
    onVolver: () => irA("config")
  }), deshacerVenta && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      left: 14,
      right: 14,
      bottom: 18,
      zIndex: 999,
      background: "var(--color-background-tertiary)",
      border: "1px solid var(--color-border-secondary)",
      borderRadius: 12,
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      boxShadow: "0 4px 16px rgba(0,0,0,0.35)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-primary)",
      flex: 1
    }
  }, "🗑️ Venta eliminada"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "#185FA5",
      color: "#e2eaf4",
      border: "none",
      borderRadius: 8,
      padding: "8px 16px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    },
    onClick: deshacerUltimaVenta
  }, "↩️ Deshacer")))));
}
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }
  static getDerivedStateFromError(e) {
    return {
      error: e
    };
  }
  componentDidCatch(e, info) {
    try {
      window.logError && window.logError("ErrorBoundary", e);
    } catch (_) {}
    console.error("App error:", e, info);
  }
  render() {
    if (this.state.error) return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 40,
        textAlign: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1923"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 40,
        marginBottom: 16
      }
    }, "⚠️"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 500,
        color: "#f07070",
        marginBottom: 8
      }
    }, "Algo salió mal"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "#7a9ab8",
        marginBottom: 20,
        maxWidth: 300
      }
    }, String(this.state.error.message || "Error desconocido")), /*#__PURE__*/React.createElement("button", {
      style: {
        background: "#185FA5",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "10px 24px",
        fontSize: 14,
        cursor: "pointer"
      },
      onClick: () => {
        this.setState({
          error: null
        });
        window.location.hash = "portada";
      }
    }, "Reiniciar app"));
    return this.props.children;
  }
}

// ── AuthGate: exige una sesión real de Firebase Auth (email+password) ANTES
//    de mostrar la app. El lock local de huella/PIN (PantallaBloqueoLC) sigue
//    igual, pero ahora corre DESPUÉS de esta puerta (adentro de <App/>).
function AuthGate({
  children
}) {
  const [estado, setEstado] = React.useState("cargando"); // cargando | login | ok
  const [modoCrear, setModoCrear] = React.useState(() => !localStorage.getItem("lc_cuenta_creada"));
  const [email, setEmail] = React.useState(() => localStorage.getItem("lc_ultimo_email") || "");
  const [pass, setPass] = React.useState("");
  const [pass2, setPass2] = React.useState("");
  const [err, setErr] = React.useState("");
  const [cargando, setCargando] = React.useState(false);
  React.useEffect(() => {
    if (typeof firebase === "undefined" || !firebase.auth) {
      setEstado("ok");
      return;
    } // sin Firebase: no bloquear
    const unsub = firebase.auth().onAuthStateChanged(function (u) {
      setEstado(u && !u.isAnonymous ? "ok" : "login");
    });
    return () => unsub();
  }, []);
  const entrar = async () => {
    setErr("");
    const em = (email || "").trim();
    if (!em || !pass) {
      setErr("Completá email y contraseña.");
      return;
    }
    setCargando(true);
    try {
      if (modoCrear) {
        if (pass.length < 6) {
          setErr("La contraseña debe tener al menos 6 caracteres.");
          setCargando(false);
          return;
        }
        if (pass !== pass2) {
          setErr("Las dos contraseñas no coinciden.");
          setCargando(false);
          return;
        }
        await firebase.auth().createUserWithEmailAndPassword(em, pass);
        localStorage.setItem("lc_cuenta_creada", "1");
        try {
          if (window.db) await window.db.collection("meta").doc("cuenta").set({
            email: em,
            creada: Date.now()
          });
        } catch (e) {}
      } else {
        await firebase.auth().signInWithEmailAndPassword(em, pass);
      }
      localStorage.setItem("lc_ultimo_email", em);
      // onAuthStateChanged pasa el estado a "ok"
    } catch (e) {
      const c = e && e.code || "";
      if (c === "auth/email-already-in-use") {
        setErr("Ese email ya tiene cuenta. Entrá con tu contraseña.");
        setModoCrear(false);
      } else if (c === "auth/invalid-credential" || c === "auth/wrong-password" || c === "auth/user-not-found") {
        setErr('Email o contraseña incorrectos. Si es la primera vez, tocá "Crear cuenta".');
      } else if (c === "auth/invalid-email") {
        setErr("El email no es válido.");
      } else if (c === "auth/weak-password") {
        setErr("La contraseña es muy débil (mínimo 6 caracteres).");
      } else if (c === "auth/network-request-failed") {
        setErr("Sin conexión. Revisá tu internet.");
      } else if (c === "auth/too-many-requests") {
        setErr("Demasiados intentos. Esperá un momento.");
      } else setErr(e && e.message || "No se pudo ingresar.");
    }
    setCargando(false);
  };
  if (estado === "cargando") return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f1923",
      color: "#7a9ab8",
      fontSize: 14
    }
  }, "Cargando…");
  if (estado === "ok") return children;
  const inp = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "0.5px solid rgba(255,255,255,0.18)",
    background: "#1a2b3c",
    color: "#e2eaf4",
    fontSize: 15,
    marginBottom: 10,
    boxSizing: "border-box"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#0f1923",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 360
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "icons/icon-192.png",
    alt: "",
    style: {
      width: 64,
      height: 64,
      borderRadius: 16,
      marginBottom: 10
    },
    onError: e => {
      e.target.style.display = "none";
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: "#e2eaf4"
    }
  }, "Reparto App"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#7a9ab8",
      marginTop: 4
    }
  }, modoCrear ? "Creá tu cuenta (solo la primera vez)" : "Ingresá con tu cuenta")), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "email",
    inputMode: "email",
    autoComplete: "username",
    placeholder: "Email",
    value: email,
    onChange: e => setEmail(e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "password",
    autoComplete: modoCrear ? "new-password" : "current-password",
    placeholder: "Contraseña",
    value: pass,
    onChange: e => setPass(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter" && !modoCrear) entrar();
    }
  }), modoCrear && /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "password",
    autoComplete: "new-password",
    placeholder: "Repetí la contraseña",
    value: pass2,
    onChange: e => setPass2(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") entrar();
    }
  }), err && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#f07070",
      fontSize: 13,
      marginBottom: 10,
      lineHeight: 1.4
    }
  }, err), /*#__PURE__*/React.createElement("button", {
    disabled: cargando,
    onClick: entrar,
    style: {
      width: "100%",
      padding: "13px",
      borderRadius: 10,
      border: "none",
      background: "#185FA5",
      color: "#fff",
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer",
      opacity: cargando ? 0.6 : 1
    }
  }, cargando ? "Un momento…" : modoCrear ? "Crear cuenta" : "Ingresar"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setErr("");
      setModoCrear(!modoCrear);
    },
    style: {
      width: "100%",
      marginTop: 12,
      background: "none",
      border: "none",
      color: "#7a9ab8",
      fontSize: 13,
      cursor: "pointer"
    }
  }, modoCrear ? "Ya tengo cuenta — Ingresar" : "Es la primera vez — Crear cuenta")));
}

// ── Pantalla de Diagnóstico: muestra los últimos errores registrados ──────────
function Diagnostico({
  onVolver
}) {
  const [errores, setErrores] = React.useState(() => window.lcGetErrores ? window.lcGetErrores() : []);
  const refrescar = () => setErrores(window.lcGetErrores ? window.lcGetErrores() : []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "var(--color-background-primary,#0f1923)"
    }
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: "Diagnóstico",
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: s.btn,
    onClick: refrescar
  }, "↻ Refrescar"), /*#__PURE__*/React.createElement("button", {
    style: s.btnDanger,
    onClick: () => {
      if (window.lcLimpiarErrores) window.lcLimpiarErrores();
      refrescar();
    }
  }, "Vaciar registro")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      marginBottom: 10
    }
  }, "Se guardan los últimos 50 errores en este dispositivo. No se envían a ningún servidor."), (!errores || !errores.length) && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--color-text-secondary)",
      fontSize: 14,
      padding: "20px 0",
      textAlign: "center"
    }
  }, "✅ Sin errores registrados."), (errores || []).map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--color-background-secondary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 10,
      padding: "10px 12px",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-danger)",
      fontWeight: 600
    }
  }, e.contexto || "error"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-primary)",
      margin: "3px 0",
      wordBreak: "break-word"
    }
  }, e.mensaje), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, e.fecha), e.stack && /*#__PURE__*/React.createElement("details", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      cursor: "pointer"
    }
  }, "Detalle técnico"), /*#__PURE__*/React.createElement("pre", {
    style: {
      fontSize: 10,
      color: "var(--color-text-secondary)",
      whiteSpace: "pre-wrap",
      marginTop: 4
    }
  }, e.stack))))));
}

// ── Render raíz ──────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(AuthGate, null, /*#__PURE__*/React.createElement(App, null))));