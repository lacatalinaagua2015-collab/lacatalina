// ════════════════════════════════════════════════════════════════════
// ◆  04-portada.js — Portada, fechas, SelectorFecha, Setup, SyncBar
// ════════════════════════════════════════════════════════════════════

function Portada({
  onIngresar
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      padding: 32,
      minHeight: "100vh"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 80,
      height: 80,
      borderRadius: "50%",
      background: "var(--color-background-info)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 38
    }
  }, "💧"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 24,
      fontWeight: 500,
      color: "var(--color-text-primary)",
      marginBottom: 6
    }
  }, "Reparto App"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: "var(--color-text-secondary)"
    }
  }, "Soda y Agua Tratada · Reparto")), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      width: 200,
      marginTop: 8
    },
    onClick: onIngresar
  }, "Ingresar"), typeof window !== "undefined" && window.matchMedia && !window.matchMedia("(display-mode: standalone)").matches && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      textAlign: "center",
      lineHeight: 1.6,
      marginTop: 4,
      maxWidth: 240
    }
  }, "💡 Instalá la app: menú del navegador → \"Agregar a pantalla de inicio\""));
}

// ── Generador de fechas por día de semana ────────────────────────────────────
function getFechasDelAnio(diaNombre) {
  const diasSemana = {
    "Lunes": 1,
    "Martes": 2,
    "Miércoles": 3,
    "Jueves": 4,
    "Viernes": 5,
    "Sábado": 6,
    "Domingo": 0
  };
  const target = diasSemana[diaNombre];
  if (target === undefined) return [];
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const fechas = [];
  const d = new Date(anio, 0, 1);
  while (d.getDay() !== target) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === anio) {
    fechas.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return fechas;
}
function formatFecha(d) {
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}
function fechaKey(d) {
  return d.toLocaleDateString("en-CA");
}
function hoyKey() {
  return new Date().toLocaleDateString("en-CA");
}
function SelectorFecha({
  dia,
  planillas,
  ventas,
  noVisitas,
  onSeleccionar,
  onVolver
}) {
  const fechas = getFechasDelAnio(dia);
  const hoy = hoyKey();
  const [mostrarTodas, setMostrarTodas] = useState(false);

  // Agrupar por mes
  const porMes = {};
  fechas.forEach(f => {
    const mes = f.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric"
    });
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push(f);
  });
  const meses = Object.keys(porMes);
  const mesActual = new Date().toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric"
  });
  const [mesAbierto, setMesAbierto] = useState(mesActual);
  const ventasPorFecha = {};
  ventas.filter(v => v.dia === dia).forEach(v => {
    const fk = v.fechaKey || v.fecha?.slice(0, 10) || "";
    ventasPorFecha[fk] = (ventasPorFecha[fk] || 0) + 1;
  });
  const visitasPorFecha = {};
  (noVisitas || []).filter(v => v.dia === dia).forEach(v => {
    visitasPorFecha[v.fecha] = (visitasPorFecha[v.fecha] || 0) + 1;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: `Fechas de visita · ${dia}`,
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 16px"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)",
      marginBottom: 8
    }
  }, "Seleccioná la fecha de reparto para comenzar o continuar la jornada."), meses.map(mes => {
    const abierto = mes === mesAbierto;
    return /*#__PURE__*/React.createElement("div", {
      key: mes,
      style: {
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.card,
        margin: 0,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        background: abierto ? "var(--color-background-info)" : "var(--color-background-secondary)"
      },
      onClick: () => setMesAbierto(abierto ? null : mes)
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 500,
        color: abierto ? "var(--color-text-info)" : "var(--color-text-primary)",
        textTransform: "capitalize"
      }
    }, mes), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--color-text-tertiary)"
      }
    }, abierto ? "▲" : "▼")), abierto && /*#__PURE__*/React.createElement("div", {
      style: {
        border: "0.5px solid var(--color-border-tertiary)",
        borderTop: "none",
        borderRadius: "0 0 12px 12px",
        overflow: "hidden"
      }
    }, porMes[mes].map(f => {
      const fk = fechaKey(f);
      const planKey = `${dia}_${fk}`;
      const tienePlanilla = !!planillas[planKey];
      const nVentas = ventasPorFecha[fk] || 0;
      const nVisitas = visitasPorFecha[fk] || 0;
      const esHoy = fk === hoy;
      return /*#__PURE__*/React.createElement("button", {
        key: fk,
        style: {
          width: "100%",
          textAlign: "left",
          padding: "12px 16px",
          cursor: "pointer",
          border: "none",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          background: esHoy ? "var(--color-background-success)" : "var(--color-background-primary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        },
        onClick: () => onSeleccionar(fk, f)
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 14,
          fontWeight: esHoy ? 500 : 400,
          color: esHoy ? "var(--color-text-success)" : "var(--color-text-primary)",
          textTransform: "capitalize"
        }
      }, formatFecha(f), esHoy ? " · Hoy" : ""), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 6,
          marginTop: 4
        }
      }, nVentas > 0 && /*#__PURE__*/React.createElement("span", {
        style: s.badge("success")
      }, nVentas, " entregas"), nVisitas > 0 && /*#__PURE__*/React.createElement("span", {
        style: s.badge("warning")
      }, nVisitas, " visitas s/venta"), tienePlanilla && /*#__PURE__*/React.createElement("span", {
        style: s.badge("info")
      }, "planilla ✓"))), /*#__PURE__*/React.createElement("span", {
        style: {
          color: "var(--color-text-tertiary)"
        }
      }, "→"));
    })));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "12px 0 0",
      background: "var(--color-background-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "📅 Fecha especial (feriado o reparto extra)"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    style: {
      ...s.input,
      fontSize: 14,
      marginTop: 4
    },
    onChange: e => {
      if (e.target.value) {
        const d = new Date(e.target.value + 'T12:00:00');
        onSeleccionar(e.target.value, d);
      }
    }
  }))));
}
function SyncBar({
  status,
  isOnline
}) {
  if (status === "idle") {
    if (!isOnline) return /*#__PURE__*/React.createElement("div", {
      style: {
        background: "#3d2e1e",
        color: "#f59e0b",
        textAlign: "center",
        fontSize: 11,
        padding: "4px",
        fontWeight: 500
      }
    }, "📵 Sin conexión · Los cambios se sincronizan al reconectar");
    return null;
  }
  if (status === "saved") return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-background-success)",
      color: "var(--color-text-success)",
      textAlign: "center",
      fontSize: 12,
      padding: "5px",
      fontWeight: 500
    }
  }, "✓ Guardado");
  const cfg = {
    loading: {
      bg: "#1e3a5f",
      color: "#5daaff",
      txt: "⏳ Cargando datos de la nube..."
    },
    saving: {
      bg: "var(--color-background-warning)",
      color: "var(--color-text-warning)",
      txt: "☁ Guardando..."
    },
    error: {
      bg: "var(--color-background-danger)",
      color: "var(--color-text-danger)",
      txt: "⚠ Error al guardar en la nube"
    },
    offline: {
      bg: "#3d2e1e",
      color: "#f59e0b",
      txt: "📵 Sin conexión — los cambios se guardan localmente"
    },
    offline_pending: {
      bg: "#3d2e1e",
      color: "#f59e0b",
      txt: "📵 Sin conexión — cambios pendientes de sincronizar"
    }
  };
  const c = cfg[status] || cfg.saving;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: c.bg,
      color: c.color,
      textAlign: "center",
      fontSize: 12,
      padding: "6px",
      fontWeight: 500
    }
  }, c.txt);
}

// ════════════════════════════════════════════════════════════════════════════
// ◆  ACCESO BIOMÉTRICO (v2) — huella / rostro, con passkey DESCUBRIBLE
// ════════════════════════════════════════════════════════════════════════════
// Reemplaza al esquema anterior (PIN + huella), que se eliminó entero.
//
// POR QUÉ ES DISTINTO. El anterior guardaba el identificador de la credencial
// en localStorage y se lo pasaba al teléfono para verificar. Eso falló: cuando
// el almacenamiento del navegador se llenaba, el identificador no quedaba
// guardado, y al reabrir la app no había con qué verificar — pedía PIN y volvía
// a ofrecer activar la huella, en círculo.
//
// Acá NO se guarda ningún identificador. Se crea una passkey "descubrible"
// (residentKey), que queda en el gestor de credenciales del propio teléfono, y
// al verificar se pide sin lista: el teléfono ofrece lo que tenga para este
// sitio. Así el acceso no depende del almacenamiento del navegador.
//
// Lo único que se guarda acá es una marca de "está activado", y si esa marca se
// pierde la app simplemente abre sin pedir nada: nunca deja a nadie afuera.
const LC_BIO2_ON = "lc_bio2_on";
function lcBio2Soportado() {
  return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
}
// ¿Hay de verdad un lector del dispositivo disponible para el navegador?
// (que exista la API no alcanza: da true en cualquier Chrome).
async function lcBio2Disponible() {
  try {
    if (!lcBio2Soportado()) return false;
    if (!window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return false;
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}
function lcBio2Activo() {
  try {
    return localStorage.getItem(LC_BIO2_ON) === "1";
  } catch {
    return false;
  }
}
function lcBio2Apagar() {
  try {
    localStorage.removeItem(LC_BIO2_ON);
  } catch {}
}
// Traduce el error técnico a algo que se entienda y diga qué hacer.
function lcBio2Motivo(e) {
  const n = e && e.name || "";
  if (n === "NotAllowedError") return "Se canceló o se agotó el tiempo. Tocá de nuevo y apoyá el dedo cuando aparezca el cartel.";
  if (n === "InvalidStateError") return "Este dispositivo ya tenía el acceso creado. Probá entrar con la huella.";
  if (n === "NotSupportedError") return "Este teléfono o navegador no soporta el acceso por huella.";
  if (n === "SecurityError") return "El navegador lo bloqueó por el origen del sitio.";
  if (n === "OperationError") return "Ya había un pedido abierto. Esperá un segundo y tocá de nuevo.";
  if (n === "AbortError") return "Se interrumpió. Probá de nuevo.";
  return (n ? n + ": " : "") + (e && e.message || "No se pudo completar");
}
// Crea la passkey. `residentKey: required` es lo que la hace descubrible —
// sin eso volveríamos a depender de guardar un identificador.
async function lcBio2Registrar() {
  if (!lcBio2Soportado()) throw new Error("no_soportado");
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: {
        name: "La Catalina",
        id: location.hostname
      },
      // id fijo a propósito: si cambiara en cada alta, el teléfono acumularía
      // una passkey nueva por cada activación.
      user: {
        id: new TextEncoder().encode("lacatalina-app"),
        name: "La Catalina",
        displayName: "La Catalina"
      },
      pubKeyCredParams: [{
        type: "public-key",
        alg: -7
      }, {
        type: "public-key",
        alg: -257
      }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "required",
        requireResidentKey: true,
        userVerification: "required"
      },
      timeout: 60000,
      attestation: "none"
    }
  });
  if (!cred) throw new Error("cancelado");
  try {
    localStorage.setItem(LC_BIO2_ON, "1");
  } catch (e) {
    // Si ni esta marca mínima entra, avisamos en vez de fingir que quedó activo.
    const err = new Error("sin_espacio");
    err.name = "AlmacenamientoLleno";
    throw err;
  }
  return true;
}
// Verifica SIN lista de credenciales: el teléfono ofrece las que tenga para
// este sitio. Por eso no hace falta haber guardado nada.
async function lcBio2Verificar() {
  const r = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rpId: location.hostname,
      userVerification: "required",
      timeout: 60000
    }
  });
  return !!r;
}

// ── Pantalla de acceso ───────────────────────────────────────────────────────
// Solo aparece si el acceso está activado. Siempre ofrece "Entrar sin huella":
// la app es la herramienta de trabajo del día, no puede dejarte afuera en medio
// del reparto porque el lector no quiso andar.
function PantallaAccesoLC({
  onOk
}) {
  const [msg, setMsg] = React.useState("");
  const [verificando, setVerificando] = React.useState(false);
  // Guard sincrónico: con estado de React no alcanza (no se aplica en el acto)
  // y dos toques seguidos disparaban dos pedidos, lo que el teléfono rechaza
  // con "A request is already pending".
  const enCursoRef = React.useRef(false);
  const entrarConHuella = async () => {
    if (enCursoRef.current) return;
    enCursoRef.current = true;
    setMsg("");
    setVerificando(true);
    try {
      if (await lcBio2Verificar()) onOk();
    } catch (e) {
      setMsg(lcBio2Motivo(e));
    } finally {
      enCursoRef.current = false;
      setVerificando(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-background-primary,#0f1923)",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 44,
      marginBottom: 8
    }
  }, "💧"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 600,
      color: "var(--color-text-primary,#e2eaf4)",
      marginBottom: 28
    }
  }, "La Catalina"), /*#__PURE__*/React.createElement("button", {
    onClick: entrarConHuella,
    "aria-label": "Entrar con huella",
    style: {
      fontSize: 52,
      lineHeight: 1,
      width: 116,
      height: 116,
      borderRadius: "50%",
      background: "var(--color-background-secondary,#1a2b3c)",
      border: "2px solid #185FA5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      padding: 0,
      boxShadow: "0 4px 16px rgba(0,0,0,0.35)"
    }
  }, "👆"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: "var(--color-text-secondary,#7a9ab8)",
      marginTop: 16,
      textAlign: "center"
    }
  }, verificando ? "Esperando tu huella..." : "Tocá para entrar con tu huella"), msg && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "#f5b942",
      marginTop: 10,
      textAlign: "center",
      maxWidth: 300,
      lineHeight: 1.5
    }
  }, msg), /*#__PURE__*/React.createElement("button", {
    onClick: onOk,
    style: {
      marginTop: 22,
      background: "none",
      border: "0.5px solid var(--color-border-secondary,#2e4055)",
      color: "var(--color-text-tertiary,#7797b5)",
      fontSize: 13,
      borderRadius: 8,
      padding: "8px 18px",
      cursor: "pointer"
    }
  }, "Entrar sin huella"));
}
