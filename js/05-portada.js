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

// ── Acceso con PIN + huella (WebAuthn) — La Catalina ───────────────────────────
const LC_BIO_KEY = "lc_bio_cred";
const LC_PIN_KEY = "lc_pin";
function lcBioSoportado() {
  return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
}
// Lo de arriba sólo dice que EXISTE la API — da true en cualquier Chrome, aunque
// el equipo no tenga lector de huella disponible para el navegador. Esta es la
// pregunta de verdad: ¿hay un autenticador del propio dispositivo (huella/rostro)
// que el navegador pueda usar? Es asincrónica, por eso va aparte.
async function lcBioDisponible() {
  try {
    if (!lcBioSoportado()) return false;
    if (!window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return false;
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}
// Traduce el error técnico de WebAuthn a algo que se entienda y diga qué hacer.
// Antes todos los fallos mostraban "No se pudo activar", que no dice nada:
// no es lo mismo cancelar el cartel del sistema que estar en un contexto no seguro.
function lcBioMotivo(e) {
  const n = e && e.name || "";
  if (n === "NotAllowedError") return "Se canceló o se agotó el tiempo del cartel de huella. Probá de nuevo y apoyá el dedo cuando aparezca.";
  if (n === "InvalidStateError") return "Esta huella ya estaba registrada en este dispositivo. Desactivá y volvé a activar.";
  if (n === "NotSupportedError") return "El navegador no soporta huella en este dispositivo.";
  if (n === "SecurityError") return "El navegador bloqueó la huella por el origen del sitio (tiene que ser HTTPS).";
  if (n === "AbortError") return "La operación se interrumpió. Probá de nuevo.";
  if (n === "ConstraintError") return "El dispositivo no pudo cumplir el requisito de verificación (huella o rostro).";
  return (n ? n + ": " : "") + (e && e.message || "Error desconocido");
}
function lcBioEnrolado() {
  try {
    return !!localStorage.getItem(LC_BIO_KEY);
  } catch {
    return false;
  }
}
function lcBioRechazado() {
  try {
    return localStorage.getItem("lc_bio_no") === "1";
  } catch {
    return false;
  }
}
function _lcB64ToBuf(b64) {
  const x = atob(b64);
  const u = new Uint8Array(x.length);
  for (let i = 0; i < x.length; i++) u[i] = x.charCodeAt(i);
  return u.buffer;
}
function _lcBufToB64(buf) {
  const u = new Uint8Array(buf);
  let x = "";
  for (let i = 0; i < u.length; i++) x += String.fromCharCode(u[i]);
  return btoa(x);
}
async function lcBioRegistrar() {
  if (!lcBioSoportado()) throw new Error("no_soportado");
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: {
        name: "La Catalina",
        // Explícito: el dominio del sitio. Sin esto el navegador lo deduce solo,
        // y en algunos Android eso falla al registrar.
        id: location.hostname
      },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: "usuario",
        displayName: "Usuario"
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
        userVerification: "required"
      },
      timeout: 60000,
      attestation: "none"
    }
  });
  if (!cred) throw new Error("cancelado");
  localStorage.setItem(LC_BIO_KEY, _lcBufToB64(cred.rawId));
  localStorage.removeItem("lc_bio_no");
  return true;
}
async function lcBioVerificar() {
  if (!lcBioSoportado() || !lcBioEnrolado()) throw new Error("no_disponible");
  const r = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{
        type: "public-key",
        id: _lcB64ToBuf(localStorage.getItem(LC_BIO_KEY))
      }],
      userVerification: "required",
      // 25s en vez de 60: si el cartel del sistema no llega a abrirse, un minuto
      // entero mirando "Verificando huella…" se siente como que la app se colgó.
      timeout: 25000,
      // Explícito, igual que al registrar: el id tiene que coincidir con el que
      // se usó en el alta, si no el autenticador no encuentra la credencial.
      rpId: location.hostname
    }
  });
  return !!r;
}
function PantallaBloqueoLC({
  onOk
}) {
  const pinGuardado = (() => {
    try {
      return localStorage.getItem(LC_PIN_KEY) || "";
    } catch {
      return "";
    }
  })();
  const modoSetup = !pinGuardado;
  const [pin, setPin] = React.useState("");
  const [setupPaso, setSetupPaso] = React.useState(1);
  const [pinTmp, setPinTmp] = React.useState("");
  const [error, setError] = React.useState("");
  const [faseEnrolar, setFaseEnrolar] = React.useState(false);
  const [bioMsg, setBioMsg] = React.useState("");
  const [mostrarPin, setMostrarPin] = React.useState(modoSetup); // setup siempre muestra PIN
  const [fallosBio, setFallosBio] = React.useState(0);
  const [verificando, setVerificando] = React.useState(false);
  const puedeBio = lcBioSoportado();
  const bioOn = lcBioEnrolado();

  // Intento automático de huella al montar (solo si ya está enrolada)
  // NO se intenta la huella sola al abrir. Dos motivos, los dos comprobados en
  // el Android de uso diario:
  //   1) Chrome no abre el cartel del sistema si la verificación no viene de un
  //      toque del usuario, así que el intento automático fallaba siempre.
  //   2) Peor todavía: ese intento dejaba una verificación "en curso" hasta
  //      25 segundos, y el guard anti-superposición de intentarHuellaDeNuevo
  //      descartaba el toque del botón — tocabas el dedito y no pasaba nada.
  // Ahora la huella la disparás vos tocando el botón, que es además el único
  // camino que Android acepta.
  const finalizar = () => {
    if (puedeBio && !lcBioEnrolado() && !lcBioRechazado()) {
      setPin("");
      setFaseEnrolar(true);
    } else onOk();
  };
  const completar = valor => {
    if (valor.length < 4) return;
    if (modoSetup) {
      if (setupPaso === 1) {
        setPinTmp(valor);
        setPin("");
        setSetupPaso(2);
        setError("");
      } else {
        if (valor === pinTmp) {
          try {
            localStorage.setItem(LC_PIN_KEY, valor);
          } catch (e) {}
          setError("");
          finalizar();
        } else {
          setError("No coincide, empezá de nuevo");
          setPin("");
          setPinTmp("");
          setSetupPaso(1);
        }
      }
    } else {
      if (valor === pinGuardado) {
        setError("");
        finalizar();
      } else {
        setError("PIN incorrecto");
        setPin("");
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
    }
  };
  const presionar = d => {
    if (pin.length >= 4) return;
    const nuevo = pin + d;
    setPin(nuevo);
    setError("");
    if (nuevo.length === 4) completar(nuevo);
  };
  const borrar = () => {
    setPin(p => p.slice(0, -1));
    setError("");
  };
  const intentarHuellaDeNuevo = async () => {
    if (verificando) return; // evita disparar dos verificaciones superpuestas
    setBioMsg("");
    setError("");
    setVerificando(true);
    try {
      if (await lcBioVerificar()) onOk();
      setVerificando(false);
    } catch (e) {
      setVerificando(false);
      const nf = fallosBio + 1;
      setFallosBio(nf);
      if (nf >= 3) {
        setBioMsg("Demasiados intentos. Ingresá tu PIN.");
        setMostrarPin(true);
      } else {
        // Mostrar el motivo real ayuda a distinguir "no se reconoció el dedo"
        // de "el navegador no llegó a abrir el cartel".
        const motivo = typeof lcBioMotivo === "function" ? lcBioMotivo(e) : "";
        setBioMsg(motivo || `No se reconoció. Intentos restantes: ${3 - nf}`);
      }
    }
  };
  // Borra la credencial guardada y registra una nueva, en un solo toque.
  // Hace falta porque una credencial vieja (registrada con otra configuración)
  // ya no la encuentra el teléfono: falla ANTES de dibujar el cartel del dedo,
  // así que no hay forma de entrar con huella ni de darse cuenta de por qué.
  // Va acá, en la pantalla de bloqueo, porque es donde estás cuando pasa —
  // depender del botón "Desactivar" de Config obliga a entrar primero.
  // Registrar exige verificación biométrica, o sea que si sale bien ya te
  // identificaste: se entra derecho.
  const reconfigurarHuella = async () => {
    setBioMsg("");
    setError("");
    try {
      localStorage.removeItem(LC_BIO_KEY);
      localStorage.removeItem("lc_bio_no");
    } catch (e) {}
    try {
      await lcBioRegistrar();
      onOk();
    } catch (e) {
      setBioMsg(typeof lcBioMotivo === "function" ? lcBioMotivo(e) : "No se pudo reconfigurar.");
      setMostrarPin(true);
    }
  };
  const activarHuella = async () => {
    setBioMsg("");
    try {
      await lcBioRegistrar();
      onOk();
    } catch (e) {
      setBioMsg("No se pudo activar. Entrás con tu PIN.");
      setTimeout(onOk, 1200);
    }
  };
  const saltarHuella = () => {
    try {
      localStorage.setItem("lc_bio_no", "1");
    } catch (e) {}
    onOk();
  };
  const titulo = modoSetup ? setupPaso === 1 ? "Creá un PIN de 4 dígitos" : "Repetí el PIN" : "Ingresá tu PIN";
  const btnStyle = color => ({
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    fontSize: 24,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color || "var(--color-background-secondary,#1a2b3c)",
    color: "var(--color-text-primary,#e2eaf4)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
  });
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
      textAlign: "center",
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 44,
      marginBottom: 8
    }
  }, "💧"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: "var(--color-text-primary,#e2eaf4)",
      margin: 0
    }
  }, "La Catalina"), mostrarPin && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary,#7a9ab8)",
      marginTop: 4
    }
  }, titulo)), faseEnrolar ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      maxWidth: 280
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 46
    }
  }, "👆"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      color: "var(--color-text-primary,#e2eaf4)",
      textAlign: "center",
      margin: 0,
      fontWeight: 600
    }
  }, "¿Entrar con tu huella la próxima vez?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary,#7a9ab8)",
      textAlign: "center",
      margin: 0,
      lineHeight: 1.5
    }
  }, "Más rápido. Tu PIN sigue funcionando por si lo necesitás."), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "#185FA5",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      padding: "12px 20px",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      width: 210
    },
    onClick: activarHuella
  }, "Activar huella"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      color: "var(--color-text-secondary,#7a9ab8)",
      fontSize: 13,
      cursor: "pointer"
    },
    onClick: saltarHuella
  }, "Ahora no"))

  /* Esperando huella automática */ : !mostrarPin && bioOn ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16
    }
  },
  // El 👆 ahora es un BOTÓN, no un adorno. Chrome en Android no muestra el
  // cartel de huella del sistema si la verificación se dispara sola al abrir
  // la app (pide un gesto del usuario), así que sin algo para tocar la pantalla
  // quedaba en "Verificando huella…" hasta agotar el tiempo y caer al PIN.
  /*#__PURE__*/React.createElement("button", {
    onClick: intentarHuellaDeNuevo,
    "aria-label": "Entrar con huella",
    style: {
      fontSize: 56,
      lineHeight: 1,
      background: "var(--color-background-secondary,#1a2b3c)",
      border: "2px solid #185FA5",
      borderRadius: "50%",
      width: 116,
      height: 116,
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
      textAlign: "center"
    }
  }, verificando ? "Verificando huella..." : "Tocá la huella para entrar"), bioMsg && /*#__PURE__*/React.createElement("p", {
    style: {
      color: "#f5b942",
      fontSize: 13,
      textAlign: "center"
    }
  }, bioMsg), fallosBio > 0 && fallosBio < 3 && /*#__PURE__*/React.createElement("button", {
    style: {
      background: "#185FA5",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      padding: "10px 20px",
      fontSize: 14,
      cursor: "pointer"
    },
    onClick: intentarHuellaDeNuevo
  }, "Reintentar huella"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      color: "var(--color-text-tertiary,#4a6a85)",
      fontSize: 13,
      cursor: "pointer",
      marginTop: 8
    },
    onClick: () => setMostrarPin(true)
  }, "Usar PIN"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "0.5px solid var(--color-border-secondary,#2e4055)",
      color: "var(--color-text-tertiary,#4a6a85)",
      fontSize: 12,
      borderRadius: 8,
      padding: "6px 14px",
      cursor: "pointer",
      marginTop: 4
    },
    onClick: reconfigurarHuella
  }, "Reconfigurar huella"))

  /* Teclado PIN */ : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      marginBottom: 28
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: i < pin.length ? "#185FA5" : "rgba(255,255,255,0.15)",
      boxShadow: i < pin.length ? "0 0 8px rgba(24,95,165,0.6)" : "none"
    }
  }))), error && /*#__PURE__*/React.createElement("p", {
    style: {
      color: "#f07070",
      fontSize: 13,
      marginBottom: 18,
      textAlign: "center"
    }
  }, error), bioMsg && /*#__PURE__*/React.createElement("p", {
    style: {
      color: "#f5b942",
      fontSize: 13,
      marginBottom: 16,
      textAlign: "center"
    }
  }, bioMsg), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,72px)",
      gap: 12
    }
  }, [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    style: btnStyle(),
    onClick: () => presionar(String(n))
  }, n)), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("button", {
    style: btnStyle(),
    onClick: () => presionar("0")
  }, "0"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...btnStyle("rgba(240,112,112,0.15)"),
      color: "#f07070"
    },
    onClick: borrar
  }, "⌫"))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary,#4a6a85)",
      marginTop: 24,
      textAlign: "center"
    }
  }, "La Catalina"));
}