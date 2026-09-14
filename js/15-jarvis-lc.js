// ════════════════════════════════════════════════════════════════════
// ◆  15-jarvis-lc.js — "Jarvis LC": asistente de voz de La Catalina
// ════════════════════════════════════════════════════════════════════
// Botón flotante + reconocimiento de voz del navegador (Web Speech API)
// + un intérprete simple de comandos en español. Todo vive DENTRO de la
// PWA (no depende de Jarvis en el celular ni de ninguna app externa).
//
// A propósito, NUNCA toca por su cuenta plata, envases ni stock:
//   • "Vendele a Fulano" → solo navega a la pantalla de Venta con el
//     cliente ya elegido. Vos cargás cantidades/pago a mano, como siempre.
//   • "Recordame..." → arma el recordatorio de Agenda y lo deja abierto
//     para que revises y toques "Guardar" vos mismo.
//   • Consultas ("cuánto me debe...", "quién falta hoy") → solo lee datos
//     que ya existen, no escribe nada.
//
// Requiere Chrome (o similar) — si el navegador no soporta dictado, el
// botón avisa y no hace nada raro.
// ════════════════════════════════════════════════════════════════════

(function () {
  const h = React.createElement;

  // ---------- utilidades de texto/fecha ----------
  function normalizar(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function fechaISO(offsetDias) {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000 + (offsetDias || 0) * 86400000);
    return d.toISOString().slice(0, 10);
  }

  const DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

  function proximaFechaDia(nombreDiaNorm) {
    const idx = DIAS_SEMANA.indexOf(nombreDiaNorm);
    if (idx < 0) return null;
    const base = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const hoyIdx = base.getDay();
    let delta = (idx - hoyIdx + 7) % 7;
    if (delta === 0) delta = 7; // "el lunes" ya pasado hoy → el que viene
    return new Date(base.getTime() + delta * 86400000).toISOString().slice(0, 10);
  }

  function extraerFechaHora(t) {
    let fecha = fechaISO(0);
    let hora = "10:00";
    if (/pasado\s*manana/.test(t)) fecha = fechaISO(2);else if (/\bmanana\b/.test(t)) fecha = fechaISO(1);else {
      const mDia = t.match(/\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/);
      if (mDia) {
        const f = proximaFechaDia(mDia[1]);
        if (f) fecha = f;
      }
    }
    const mHora = t.match(/\ba\s*las?\s*(\d{1,2})(?:[:.](\d{2}))?\s*(y\s*media)?/);
    if (mHora) {
      const hh = String(Math.min(23, parseInt(mHora[1], 10))).padStart(2, "0");
      const mm = mHora[3] ? "30" : mHora[2] || "00";
      hora = `${hh}:${mm}`;
    }
    return { fecha, hora };
  }

  // Busca, dentro del texto dicho, a qué cliente de la lista se refiere.
  // Se queda con el nombre completo más largo que aparezca como
  // substring; si no hay ninguno, prueba solo el primer nombre, pero
  // nada más si es único entre todos los clientes (para no confundir
  // "Juan" con dos Juanes distintos).
  function encontrarCliente(t, clientes) {
    let mejor = null,
      mejorLargo = 0;
    (clientes || []).forEach(c => {
      const nombre = normalizar(c.nombre || "");
      if (nombre && t.includes(nombre) && nombre.length > mejorLargo) {
        mejor = c;
        mejorLargo = nombre.length;
      }
    });
    if (mejor) return mejor;
    (clientes || []).forEach(c => {
      const primero = normalizar((c.nombre || "").split(" ")[0]);
      if (primero.length > 2 && new RegExp(`\\b${primero}\\b`).test(t)) {
        const repetidos = (clientes || []).filter(c2 => normalizar((c2.nombre || "").split(" ")[0]) === primero);
        if (repetidos.length === 1) mejor = c;
      }
    });
    return mejor;
  }

  // ---------- intérprete de comandos ----------
  function interpretar(textoCrudo, clientes) {
    const t = normalizar(textoCrudo);
    const NAV = [[/\bagenda\b/, "agenda"], [/\bstock\b/, "stock"], [/\bclientes?\b/, "clientes"], [/\bresumen\b/, "resumen"], [/\bconfig(uracion)?\b|\bajustes\b/, "config"], [/\bmenu\b|\binicio\b/, "menu"]];
    if (/\b(abri|abrime|anda|andate|ir a|mostrame|llevame)\b/.test(t)) {
      for (const [re, pantalla] of NAV) {
        if (re.test(t)) return { tipo: "navegacion", pantalla };
      }
    }
    if (/cuanto(s)?\s*(me\s*)?debe/.test(t)) {
      const c = encontrarCliente(t, clientes);
      return c ? { tipo: "consulta_saldo", cliente: c } : { tipo: "desconocido" };
    }
    if (/quien(es)?\s*falta/.test(t)) {
      return { tipo: "consulta_quienfalta" };
    }
    if (/que\s*tengo\s*(hoy|manana)/.test(t)) {
      return { tipo: "consulta_agenda", cuando: /manana/.test(t) ? "manana" : "hoy" };
    }
    if (/\bvent(a|ele|ele a|as)\b|\bvend/.test(t)) {
      const c = encontrarCliente(t, clientes);
      return c ? { tipo: "venta", cliente: c } : { tipo: "venta_sin_cliente" };
    }
    if (/\b(recordame|recorda|agendame|agenda(le)?)\b/.test(t)) {
      const c = encontrarCliente(t, clientes);
      const { fecha, hora } = extraerFechaHora(t);
      const tipoRec = /cobr|deuda|saldo/.test(t) ? "cobro" : "visita";
      let motivo = textoCrudo.replace(/^\s*\S+\s*/, "").trim(); // saca la primera palabra (el disparador)
      if (!motivo) motivo = tipoRec === "cobro" ? "Cobrar" : "Visitar";
      return {
        tipo: "agenda",
        datos: {
          clienteId: c ? c.id : null,
          clienteNombre: c ? c.nombre : null,
          tipo: tipoRec,
          fecha,
          hora,
          motivo
        }
      };
    }
    return { tipo: "desconocido" };
  }

  window.JarvisLCInterpretar = interpretar; // útil para probar desde la consola

  // ---------- botón flotante ----------
  function JarvisLCBoton({ clientes, recordatorios, ventas, diaActual, onNavegar, onAbrirVenta, onProponerRecordatorio }) {
    const [escuchando, setEscuchando] = React.useState(false);
    const [mensaje, setMensaje] = React.useState(null); // { texto, tipo: 'ok'|'error'|'info' }
    const soportado = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    React.useEffect(() => {
      if (!mensaje) return;
      const t = setTimeout(() => setMensaje(null), 6500);
      return () => clearTimeout(t);
    }, [mensaje]);

    function hablar(texto) {
      try {
        if (!window.speechSynthesis) return;
        const u = new SpeechSynthesisUtterance(texto);
        u.lang = "es-AR";
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }

    function responder(texto, tipo) {
      setMensaje({ texto, tipo: tipo || "ok" });
      hablar(texto);
    }

    function procesar(textoCrudo) {
      const r = interpretar(textoCrudo, clientes);
      switch (r.tipo) {
        case "navegacion":
          onNavegar(r.pantalla);
          responder(`Abriendo ${r.pantalla}.`);
          break;
        case "consulta_saldo":
          {
            const deuda = r.cliente.saldo < 0 ? Math.abs(r.cliente.saldo) : 0;
            responder(deuda > 0 ? `${r.cliente.nombre} debe $${deuda.toLocaleString("es-AR")}.` : `${r.cliente.nombre} no tiene deuda.`, "info");
            break;
          }
        case "consulta_quienfalta":
          {
            const clientesDia = (clientes || []).filter(c => c.dia === diaActual && !c._retirado);
            const visitados = new Set((ventas || []).filter(v => v.dia === diaActual).map(v => v.clienteId));
            const faltan = clientesDia.filter(c => !visitados.has(c.id));
            responder(faltan.length === 0 ? "Ya visitaste a todos." : `Faltan ${faltan.length}: ${faltan.slice(0, 6).map(c => c.nombre).join(", ")}${faltan.length > 6 ? "…" : ""}.`, "info");
            break;
          }
        case "consulta_agenda":
          {
            const objetivo = r.cuando === "manana" ? fechaISO(1) : fechaISO(0);
            const pend = (recordatorios || []).filter(rec => !rec.confirmado && rec.fecha === objetivo);
            const cuandoTxt = r.cuando === "manana" ? "mañana" : "hoy";
            responder(pend.length === 0 ? `No tenés nada agendado para ${cuandoTxt}.` : `Tenés ${pend.length} para ${cuandoTxt}: ${pend.slice(0, 6).map(p => p.clienteNombre || p.motivo).join(", ")}.`, "info");
            break;
          }
        case "venta":
          onAbrirVenta(r.cliente);
          responder(`Abriendo venta para ${r.cliente.nombre}.`);
          break;
        case "venta_sin_cliente":
          responder("No identifiqué el cliente. Decime el nombre completo.", "error");
          break;
        case "agenda":
          if (!r.datos.clienteId) {
            responder("No identifiqué el cliente para el recordatorio. Probá con el nombre completo.", "error");
            break;
          }
          onProponerRecordatorio(r.datos);
          responder(`Recordatorio armado para ${r.datos.clienteNombre}. Revisalo y guardalo.`);
          break;
        default:
          responder("No entendí. Probá de nuevo.", "error");
      }
    }

    function escuchar() {
      if (!soportado) {
        setMensaje({ texto: "Tu navegador no soporta dictado por voz. Probá con Chrome.", tipo: "error" });
        return;
      }
      if (escuchando) return;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const r = new SR();
      r.lang = "es-AR";
      r.continuous = false;
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.onresult = ev => procesar(ev.results[0][0].transcript);
      r.onerror = () => setEscuchando(false);
      r.onend = () => setEscuchando(false);
      setMensaje(null);
      setEscuchando(true);
      try {
        r.start();
      } catch (e) {
        setEscuchando(false);
      }
    }

    return h(React.Fragment, null, mensaje && h("div", {
      style: {
        position: "fixed",
        bottom: 84,
        left: 16,
        right: 16,
        zIndex: 850,
        background: mensaje.tipo === "error" ? "var(--color-background-danger)" : "var(--color-background-info)",
        color: "var(--color-text-primary)",
        border: mensaje.tipo === "error" ? "1px solid var(--color-border-danger)" : "1px solid var(--color-border-info)",
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 500,
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        maxWidth: 480,
        margin: "0 auto"
      },
      onClick: () => setMensaje(null)
    }, mensaje.texto), h("button", {
      onClick: escuchar,
      title: "Jarvis — hablá para agendar, vender, consultar o navegar",
      style: {
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 850,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        background: escuchando ? "#d9364a" : "#185FA5",
        color: "#fff",
        fontSize: 24,
        boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    }, escuchando ? "🔴" : "🎙️"));
  }

  window.JarvisLCBoton = JarvisLCBoton;
})();
