// ════════════════════════════════════════════════════════════════════
// ◆  07-menu.js — MenuDias, PlanillaDelDia, InicioReparto
// ════════════════════════════════════════════════════════════════════

function MenuDias({
  dias,
  onResumen,
  onConfig,
  onGestionClientes,
  onStock,
  onAgenda,
  onNuevoCliente,
  onVolver,
  darkMode,
  onToggleDark,
  scaleIdx,
  onToggleScale,
  scaleLabel,
  transferenciasPendientes,
  recordatoriosActivos,
  onConfirmarRecordatorio,
  onVerConfirmaciones,
  clientes,
  ventas,
  stock,
  zonasReparto,
  planillas,
  onSetZona,
  onDiaHoy,
  onDiaResumen,
  noVisitas,
  onFiados,
  onMapaClientes,
  onDormidos,
  onPlanillaAtajo,
  onIrPlanillaDia,
  onVerDeudor
}) {
  const [editandoZona, setEditandoZona] = React.useState(null);
  // Qué día tiene desplegada la lista de clientes en deuda (uno solo a la
  // vez, igual que editandoZona).
  const [deudaExpandida, setDeudaExpandida] = React.useState(null);
  const [mostrarRecordatorios, setMostrarRecordatorios] = React.useState(false);
  const [mostrarTransferencias, setMostrarTransferencias] = React.useState(false);
  const hoyDiaNombre = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][new Date().getDay()];
  // Usar hora LOCAL para evitar bug de zona horaria (Argentina UTC-3)
  const hoyFechaKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const hoyLabel = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short"
  });

  // Ícono de acceso rápido, por día — ANTES solo se mostraba un ícono, en el
  // día que coincidía justo con hoy (d === hoyDiaNombre): si quedaba
  // pendiente y pasaba la fecha (ej. el reparto del lunes sin terminar, y
  // ya es martes), el ícono de Lunes desaparecía de golpe. BUG REPORTADO
  // 2026-10-16: tiene que seguir cada día con lo suyo — si quedó algo
  // pendiente de Lunes y además salís el Martes, tienen que aparecer LOS 2
  // íconos (Lunes en rojo por lo pendiente, Martes con el suyo para
  // arrancar). Por día se calcula si corresponde mostrar ícono, si ya está
  // completo, y con qué fecha real sigue la sesión.
  const horaActual = new Date().getHours();
  const hoy0 = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  // Lunes de esta semana — un día sin cerrar de la semana PASADA ya no se
  // arrastra acá con ícono propio (sigue accesible por "Fechas de visita"),
  // para no acumular íconos indefinidamente.
  const inicioSemana = (() => {
    const d = new Date(hoy0);
    const delta = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - delta);
    return d;
  })();
  const estadoPorDia = {};
  (dias || []).forEach(d => {
    const dowTarget = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].indexOf(d);
    const cur = new Date(hoy0);
    while (cur.getDay() !== dowTarget) cur.setDate(cur.getDate() - 1);
    const ultimaFechaKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    const esHoyDia = d === hoyDiaNombre;
    const esPasado = cur.getTime() < hoy0.getTime();
    // Se muestra ícono si es el día de hoy, o si quedó pendiente de un día
    // hábil anterior DENTRO de esta misma semana.
    if (!esHoyDia && !(esPasado && cur.getTime() >= inicioSemana.getTime())) return;
    // Mismo criterio que ListaClientes (08-clientes.js): un cliente recién
    // creado HOY no cuenta para el total — cargarlo YA fue la visita.
    const clientesD = (clientes || []).filter(c => c.dia === d && !c._retirado && c.creadoFecha !== hoyFechaKey);
    // BUG REPORTADO 2026-10-16: un día sin ningún cliente cargado (ej.
    // "Lunes" con 0 clientes) quedaba igual con el ícono en rojo
    // "Pendiente 0/0" — no hay nada que entregar, no corresponde mostrar
    // nada.
    if (clientesD.length === 0) return;
    // OJO: acá NO se filtra por v.dia === d (a propósito). Un cliente
    // pendiente de Lunes puede terminar comprando desde la lista combinada
    // de Martes (sección "⏪ Pendientes de Lunes" en ListaClientes), y esa
    // venta queda etiquetada con dia:"Martes" — si acá exigiéramos
    // v.dia==="Lunes" para contarlo como visitado, el ícono de Lunes se
    // quedaría en rojo para siempre aunque ya se le haya entregado.
    const ventasDIds = new Set((ventas || []).filter(v => v.fechaKey >= ultimaFechaKey).map(v => v.clienteId));
    const noVisitasDIds = new Set((noVisitas || []).filter(v => v.fecha >= ultimaFechaKey && (v.motivo === "noesta2" || v.motivo === "noquiso")).map(v => v.clienteId));
    const visitadosD = clientesD.filter(c => ventasDIds.has(c.id) || noVisitasDIds.has(c.id));
    const completoD = clientesD.length > 0 && visitadosD.length >= clientesD.length;
    // Fecha real de la sesión: si ya se arrancó (hay planilla, venta o marca
    // cargada desde ultimaFechaKey en adelante), se sigue esa misma fecha —
    // así no se parte un mismo reparto en dos fechas. Si todavía no se tocó
    // nada, al arrancarlo ahora queda con la fecha real de HOY — la fecha
    // del día en que efectivamente se hizo (pedido 2026-10-16: la planilla
    // es del día que corresponde, pero la fecha es la del día en que se
    // hizo, p.ej. viernes hecho el sábado queda con fecha de sábado).
    // BUG REPORTADO 2026-10-17: acá también se seguía cualquier venta o
    // marca suelta con este día para encontrar la fecha de la sesión — una
    // venta puntual a un cliente de este día hecha desde Gestión/Agenda/
    // Mapa/Dormidos otro día (ver fix en 14-app.js) hacía que el ícono
    // apuntara a esa fecha suelta en vez de la propia. Ahora sólo cuenta
    // una planilla real (la crea "Inicio del reparto" al arrancar de
    // verdad la jornada de este día).
    let fechaSesion = null;
    Object.keys(planillas || {}).forEach(k => {
      if (k.indexOf(d + "_") === 0) {
        const fk = k.slice(d.length + 1);
        if (fk >= ultimaFechaKey && (!fechaSesion || fk > fechaSesion)) fechaSesion = fk;
      }
    });
    if (!fechaSesion) fechaSesion = hoyFechaKey;
    // BUG REPORTADO 2026-10-16: un día anterior ya completo (ej. Martes,
    // Miércoles, Jueves ya cerrados hace días) seguía mostrando el ✅ verde
    // toda la semana — tiene que desaparecer, se vuelve a habilitar recién
    // cuando llegue su turno la semana que viene. PERO — BUG REPORTADO
    // 2026-10-17: si lo que se completó es un arrastre que se terminó HOY
    // (ej. el reparto del viernes, terminado hoy sábado), tiene que seguir
    // apareciendo: es la única forma de entrar directo a su planilla del
    // día recién cerrado. La diferencia es si la sesión real (fechaSesion)
    // es la de HOY o la de un día anterior.
    if (!esHoyDia && completoD && fechaSesion !== hoyFechaKey) return;
    // Estado del recuadro según la hora del reloj (si quedó sin terminar):
    //   antes de las 12 → normal (azul) · 12 a 17 hs → naranja · 17 hs en
    //   adelante → rojo/pendiente. Si no es el día de hoy (quedó de un día
    //   anterior sin cerrar), directamente rojo: ya está vencido.
    const estado = completoD ? "listo" : !esHoyDia ? "rojo" : horaActual >= 17 ? "rojo" : horaActual >= 12 ? "naranja" : "normal";
    estadoPorDia[d] = {
      clientesD,
      visitadosD,
      completoD,
      fechaSesion,
      estado
    };
  });
  // Notificaciones (Recordatorios pendientes / Transferencias sin confirmar):
  // en vez de un solo número, mostrar días y clientes distintos por
  // separado ("2d, 5c") para saber de un vistazo el alcance real.
  const recDiasCount = new Set((recordatoriosActivos || []).map(r => r.dia)).size;
  const recClientesCount = new Set((recordatoriosActivos || []).map(r => r.clienteId)).size;
  const transDiasCount = (transferenciasPendientes || []).length;
  const transClientesCount = new Set((transferenciasPendientes || []).flatMap(t => (t.ventas || []).map(v => v.clienteId))).size;
  const transMontoBruto = (transferenciasPendientes || []).reduce((a, t) => a + (t.monto || 0), 0);
  const transMontoNeto = transMontoBruto - Math.round(transMontoBruto * 0.025);

  const temaIdActual = (typeof getTemaLC === "function") ? getTemaLC() : "oscuro-azul";
  const temaInfoActual = (typeof TEMAS_LC !== "undefined" && TEMAS_LC[temaIdActual]) || {};
  const estiloActual = temaInfoActual.cuadrado ? "cuadrado" : (temaInfoActual.relieve ? "metalico" : "clasico");

  if (estiloActual === "clasico") {
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    onVolver: onVolver
  }), recordatoriosActivos && recordatoriosActivos.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "8px 14px 4px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      color: "#5daaff",
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 4,
      // Mismo recuadro que el encabezado de "Transferencias sin confirmar",
      // con los colores azules propios de los recordatorios.
      background: "#1e2e4a",
      border: "1px solid #5daaff",
      borderRadius: 8,
      padding: "8px 10px"
    },
    onClick: () => setMostrarRecordatorios(v => !v)
  }, mostrarRecordatorios ? "▼" : "▶", " 🔔 Recordatorios pendientes (D:", recDiasCount, ") ; (C:", recClientesCount, ")"), mostrarRecordatorios && recordatoriosActivos.slice(0, 5).map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      ...s.card,
      margin: "0 0 6px",
      background: "#1e2e4a",
      border: "0.5px solid #5daaff",
      display: "flex",
      gap: 8,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      cursor: "pointer"
    },
    onClick: () => onAgenda && onAgenda()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "#5daaff"
    }
  }, r.clienteNombre, " · ", r.dia, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      opacity: 0.7
    }
  }, "→ tocá para ver")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-primary)",
      marginTop: 2
    }
  }, r.tipo === "cobro" ? "💰" : "🏠", " ", r.motivo), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--color-text-tertiary)",
      marginTop: 2
    }
  }, r.fecha, r.hora ? ` · ${r.hora}` : "")), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "#4dd9a0",
      color: "#0a2e1f",
      border: "none",
      borderRadius: 6,
      padding: "4px 8px",
      fontSize: 11,
      fontWeight: 600,
      cursor: "pointer",
      flexShrink: 0,
      marginTop: 2
    },
    onClick: () => onConfirmarRecordatorio && onConfirmarRecordatorio(r.id)
  }, "✓"))), mostrarRecordatorios && recordatoriosActivos.length > 5 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      textAlign: "center"
    }
  }, "+", recordatoriosActivos.length - 5, " más")), transferenciasPendientes && transferenciasPendientes.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "8px 14px 4px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      color: "#f5b942",
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 4,
      background: "#1e3a5f",
      border: "1px solid #f5b942",
      borderRadius: 8,
      padding: "8px 10px"
    },
    onClick: () => setMostrarTransferencias(v => !v)
  }, mostrarTransferencias ? "▼" : "▶", " 🔴 Transf. pendientes (D:", transDiasCount, " · C:", transClientesCount, ") · ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: 0
    }
  }, fmt(transMontoNeto))), mostrarTransferencias && transferenciasPendientes.map(({
    dia,
    fecha,
    count,
    monto,
    ventas: vts
  }) => /*#__PURE__*/React.createElement("button", {
    key: dia + fecha,
    style: {
      ...s.card,
      width: "100%",
      margin: "0 0 6px",
      background: "#1e3a5f",
      border: "1px solid #f5b942",
      display: "flex",
      alignItems: "center",
      gap: 10,
      cursor: "pointer",
      textAlign: "left"
    },
    onClick: () => onVerConfirmaciones && onVerConfirmaciones(dia)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, "🔴"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "#f5b942"
    }
  }, dia, " · ", count, " transfer. sin confirmar"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-secondary)",
      marginTop: 2
    }
  }, vts.slice(0, 3).map(v => v.cliente).join(", "), vts.length > 3 ? ` +${vts.length - 3} más` : "")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "#f5b942"
    }
  }, fmt(monto)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--color-text-tertiary)"
    }
  }, fecha))))), /*#__PURE__*/React.createElement("span", {
    style: s.sectionTitle
  }, "Días de reparto"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 16px",
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, dias.map((d, idx) => {
    const deudas = (clientes || []).filter(c => c.dia === d && c.saldo < 0);
    const totalDeuda = deudas.reduce((a, c) => a + Math.abs(c.saldo), 0);
    const totalClientes = (clientes || []).filter(c => c.dia === d).length;
    const zona = (zonasReparto || {})[d] || "";
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: d
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        alignItems: "stretch"
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.card,
        margin: 0,
        flex: 1,
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 16px"
      },
      onClick: () => onIrPlanillaDia(d)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 500,
        color: "var(--color-text-primary)"
      }
    }, d), zona && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 500,
        color: "var(--color-text-primary)"
      }
    }, "·"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 500,
        color: "var(--color-text-primary)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        cursor: "pointer",
        // Subrayado punteado tenue: la única señal de que se puede tocar para
        // editar (reemplaza al cartelito "editar zona" que estaba abajo).
        borderBottom: "1px dotted var(--color-text-tertiary)"
      },
      title: "Tocá para editar la zona",
      onClick: e => {
        e.stopPropagation();
        setEditandoZona(d);
      }
    }, zona)), !zona && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-tertiary)",
        fontStyle: "italic",
        cursor: "pointer"
      },
      onClick: e => {
        e.stopPropagation();
        setEditandoZona(d);
      }
    }, "+ zona")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, totalDeuda > 0 ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-danger)",
        cursor: "pointer",
        textDecoration: "underline",
        textDecorationStyle: "dotted"
      },
      title: "Tocá para ver quién debe",
      onClick: e => {
        e.stopPropagation();
        setDeudaExpandida(deudaExpandida === d ? null : d);
      }
    }, "⚠ ", deudas.length, " cliente", deudas.length > 1 ? "s" : "", " ", deudas.length > 1 ? "deben" : "debe", " ", fmt(totalDeuda), " ", deudaExpandida === d ? "▲" : "▼") : /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-success)"
      }
    }, "✓ Sin deudas"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-tertiary)"
      }
    }, totalClientes, " cliente", totalClientes !== 1 ? "s" : ""))), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--color-text-tertiary)",
        fontSize: 18,
        marginLeft: 10
      }
    }, "→")), estadoPorDia[d] && onDiaHoy && (() => {
      const info = estadoPorDia[d];
      const cfg = {
        listo: {
          bg: "#0a5c3a",
          border: "1.5px solid #4dd9a0",
          icon: "✅",
          txt: "Listo",
          txtCol: "#4dd9a0",
          subCol: "#9FE1CB"
        },
        rojo: {
          bg: "#b91c1c",
          border: "1.5px solid #fca5a5",
          icon: "🔴",
          txt: "Pendiente",
          txtCol: "#ffe4e4",
          subCol: "#ffc9c9"
        },
        naranja: {
          bg: "#b45309",
          border: "1.5px solid #fcd34d",
          icon: "⏰",
          txt: "Hoy",
          txtCol: "#fff4e0",
          subCol: "#ffe0b5"
        },
        normal: {
          bg: "#185FA5",
          border: "none",
          icon: "📅",
          txt: "Hoy",
          txtCol: "#e2eaf4",
          subCol: "#b5d4f4"
        }
      }[info.estado];
      const sub = info.completoD ? "Listo" : `${info.visitadosD.length}/${info.clientesD.length}`;
      return /*#__PURE__*/React.createElement("button", {
        style: {
          background: cfg.bg,
          borderRadius: 12,
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          minWidth: 56,
          border: cfg.border,
          cursor: "pointer",
          flexShrink: 0
        },
        onClick: () => info.completoD ? onDiaResumen && onDiaResumen(d, info.fechaSesion) : onDiaHoy(d, info.fechaSesion)
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 16
        }
      }, cfg.icon), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          color: cfg.txtCol,
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.3
        }
      }, cfg.txt), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          color: cfg.subCol,
          lineHeight: 1
        }
      }, sub));
    })()), editandoZona === d && /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-secondary)",
        borderRadius: 10,
        padding: "10px 14px",
        marginTop: 2
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--color-text-secondary)",
        marginBottom: 6
      }
    }, "Zona de reparto del ", d), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("input", {
      id: `zona-${d}`,
      style: s.input,
      defaultValue: zona,
      placeholder: "Ej: Lomas de Tafí",
      autoFocus: true
    }), /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btnPrimary,
        padding: "6px 14px",
        fontSize: 13,
        whiteSpace: "nowrap"
      },
      onClick: () => {
        const v = document.getElementById(`zona-${d}`).value.trim();
        onSetZona(d, v);
        setEditandoZona(null);
      }
    }, "OK"), /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btn,
        padding: "6px 10px",
        fontSize: 13
      },
      onClick: () => setEditandoZona(null)
    }, "✕"))), deudaExpandida === d && /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-secondary)",
        borderRadius: 10,
        padding: "8px 10px",
        marginTop: 2,
        display: "flex",
        flexDirection: "column",
        gap: 4
      },
      onClick: e => e.stopPropagation()
    }, [...deudas].sort((a, b) => a.saldo - b.saldo).map(c => /*#__PURE__*/React.createElement("button", {
      key: c.id,
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: "none",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        padding: "8px 4px",
        cursor: "pointer",
        textAlign: "left"
      },
      onClick: () => {
        setDeudaExpandida(null);
        onVerDeudor && onVerDeudor(c, d);
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--color-text-primary)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, c.nombre), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "var(--color-text-danger)",
        flexShrink: 0
      }
    }, fmt(Math.abs(c.saldo)))))));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 6,
      padding: "4px 0 8px"
    }
  }, [{
    ico: "📅",
    lbl: "Agenda",
    fn: () => onAgenda && onAgenda()
  }, {
    ico: "📋",
    lbl: "Planilla",
    fn: () => onPlanillaAtajo && onPlanillaAtajo()
  }, {
    ico: "➕",
    lbl: "Nuevo cliente",
    fn: () => onNuevoCliente && onNuevoCliente()
  }].map(({
    ico,
    lbl,
    fn
  }) => /*#__PURE__*/React.createElement("button", {
    key: lbl,
    onClick: fn,
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 3,
      padding: "10px 4px",
      borderRadius: 11,
      cursor: "pointer",
      border: "none",
      background: "var(--color-background-tertiary)",
      color: "var(--color-text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 19
    }
  }, ico), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 500,
      color: "var(--color-text-tertiary)"
    }
  }, lbl)))), /*#__PURE__*/React.createElement("div", {
    style: s.divider
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 8,
      paddingBottom: 8
    }
  }, [{
    ico: "👥",
    lbl: "Clientes",
    fn: onGestionClientes
  }, {
    ico: "📦",
    lbl: "Stock",
    fn: onStock
  }, {
    ico: "⚙️",
    lbl: "Config",
    fn: onConfig
  }].map(({
    ico,
    lbl,
    fn
  }) => /*#__PURE__*/React.createElement("button", {
    key: lbl,
    onClick: fn,
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      padding: "16px 6px",
      borderRadius: 12,
      cursor: "pointer",
      border: "2px solid transparent",
      background: "var(--color-background-tertiary)",
      boxShadow: "0 3px 6px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.06) inset",
      color: "var(--color-text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 26
    }
  }, ico), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-primary)",
      textAlign: "center"
    }
  }, lbl))))));
  }

  const diasRows = [];
  for (let i = 0; i < (dias || []).length; i += 3) diasRows.push(dias.slice(i, i + 3));
  const cfgEstado = {
    listo: { bg: "#0a5c3a", border: "1.5px solid #4dd9a0", icon: "✅", txt: "Listo", subCol: "#9FE1CB" },
    rojo: { bg: "#b91c1c", border: "1.5px solid #fca5a5", icon: "🔴", txt: "Pendiente", subCol: "#ffc9c9" },
    naranja: { bg: "#b45309", border: "1.5px solid #fcd34d", icon: "⏰", txt: "Hoy", subCol: "#ffe0b5" },
    normal: { bg: "#185FA5", border: "none", icon: "📅", txt: "Hoy", subCol: "#b5d4f4" }
  };
  const renderDia = (d, globalIdx, centered) => {
    const deudas = (clientes || []).filter(c => c.dia === d && c.saldo < 0);
    const totalDeuda = deudas.reduce((a, c) => a + Math.abs(c.saldo), 0);
    const totalClientes = (clientes || []).filter(c => c.dia === d).length;
    const zona = (zonasReparto || {})[d] || "";
    const info = estadoPorDia[d];
    const cfg = info ? cfgEstado[info.estado] : null;
    const sub = info ? (info.completoD ? cfg.txt : `${cfg.txt} ${info.visitadosD.length}/${info.clientesD.length}`) : null;
    return React.createElement("button", {
      key: d,
      className: "lc-dia-box",
      style: {
        ...s.card,
        margin: 0,
        // Mismo tamaño siempre, tenga la fila 3 días o 2 — antes la última
        // fila (centrada) usaba un ancho fijo distinto al de las filas de 3,
        // y los cuadros no quedaban iguales.
        flex: "0 0 calc((100% - 20px) / 3)",
        minWidth: 0,
        padding: "14px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        cursor: "pointer"
      },
      onClick: () => onIrPlanillaDia(d)
    }, React.createElement("div", {
      style: { fontSize: 15, fontWeight: 800, color: "var(--color-text-primary)" }
    }, d), zona ? React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--color-text-tertiary)",
        marginTop: 4,
        borderBottom: "1px dotted var(--color-text-tertiary)",
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      },
      onClick: e => {
        e.stopPropagation();
        setEditandoZona(d);
      }
    }, zona) : React.createElement("div", {
      style: { fontSize: 10, color: "var(--color-text-tertiary)", fontStyle: "italic", marginTop: 4 },
      onClick: e => {
        e.stopPropagation();
        setEditandoZona(d);
      }
    }, "+ zona"), totalDeuda > 0 ? React.createElement("div", {
      style: { fontSize: 10.5, fontWeight: 700, color: "var(--color-text-danger)", marginTop: 6 },
      onClick: e => {
        e.stopPropagation();
        setDeudaExpandida(deudaExpandida === d ? null : d);
      }
    }, "⚠ ", fmt(totalDeuda)) : React.createElement("div", {
      style: { fontSize: 10.5, fontWeight: 700, color: "var(--color-text-success)", marginTop: 6 }
    }, "✓ Sin deudas"), React.createElement("div", {
      style: { fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 3 }
    }, totalClientes, " cliente", totalClientes !== 1 ? "s" : ""), cfg && React.createElement("div", {
      className: "lc-dia-badge",
      onClick: e => {
        e.stopPropagation();
        info.completoD ? (onDiaResumen && onDiaResumen(d, info.fechaSesion)) : onDiaHoy(d, info.fechaSesion);
      },
      style: {
        marginTop: 8,
        background: cfg.bg,
        border: cfg.border,
        borderRadius: 8,
        padding: "3px 10px",
        display: "flex",
        alignItems: "center",
        gap: 5,
        cursor: "pointer"
      }
    }, React.createElement("span", { style: { fontSize: 12 } }, cfg.icon), React.createElement("span", {
      style: { fontSize: 9, fontWeight: 700, color: cfg.subCol }
    }, sub)));
  };
  const notifItems = [];
  if (transferenciasPendientes && transferenciasPendientes.length > 0) notifItems.push(React.createElement("button", {
    key: "trans",
    onClick: () => setMostrarTransferencias(v => !v),
    style: {
      flex: 1,
      textAlign: "left",
      background: "var(--color-background-danger)",
      border: "1px solid var(--color-border-danger)",
      borderRadius: 13,
      padding: "11px 12px",
      cursor: "pointer"
    }
  }, React.createElement("div", {
    style: { fontSize: 10, fontWeight: 800, color: "var(--color-text-danger)", textTransform: "uppercase", letterSpacing: "0.04em" }
  }, "🔴 Transferencias"), React.createElement("div", {
    style: { fontSize: 14, fontWeight: 800, color: "var(--color-text-danger)", marginTop: 3 }
  }, fmt(transMontoNeto)), React.createElement("div", {
    style: { fontSize: 10.5, color: "var(--color-text-danger)", opacity: 0.8, marginTop: 1 }
  }, transClientesCount, " sin confirmar")));
  if (recordatoriosActivos && recordatoriosActivos.length > 0) notifItems.push(React.createElement("button", {
    key: "rec",
    onClick: () => setMostrarRecordatorios(v => !v),
    style: {
      flex: 1,
      textAlign: "left",
      background: "var(--color-background-info)",
      border: "1px solid var(--color-border-info)",
      borderRadius: 13,
      padding: "11px 12px",
      cursor: "pointer"
    }
  }, React.createElement("div", {
    style: { fontSize: 10, fontWeight: 800, color: "var(--color-text-info)", textTransform: "uppercase", letterSpacing: "0.04em" }
  }, "🔔 Recordatorios"), React.createElement("div", {
    style: { fontSize: 14, fontWeight: 800, color: "var(--color-text-info)", marginTop: 3 }
  }, recClientesCount, " pendientes"), React.createElement("div", {
    style: { fontSize: 10.5, color: "var(--color-text-info)", opacity: 0.8, marginTop: 1 }
  }, recDiasCount, " día", recDiasCount !== 1 ? "s" : "")));

  return React.createElement("div", { style: s.screen },
  React.createElement(HeaderApp, { onVolver: onVolver }),

  React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--color-text-tertiary)",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      textAlign: "center",
      padding: "14px 0 8px"
    }
  }, "Días de reparto"),

  React.createElement("div", {
    style: { padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }
  }, diasRows.map((row, ri) => React.createElement("div", {
    key: ri,
    style: { display: "flex", gap: 10, justifyContent: row.length < 3 ? "center" : "flex-start" }
  }, row.map((d, ci) => renderDia(d, ri * 3 + ci, row.length < 3))))),

  editandoZona && React.createElement("div", {
    style: {
      background: "var(--color-background-secondary)",
      border: "0.5px solid var(--color-border-secondary)",
      borderRadius: 10,
      padding: "10px 14px",
      margin: "8px 16px 0"
    }
  }, React.createElement("div", {
    style: { fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }
  }, "Zona de reparto del ", editandoZona), React.createElement("div", {
    style: { display: "flex", gap: 8 }
  }, React.createElement("input", {
    id: `zona-${editandoZona}`,
    style: s.input,
    defaultValue: (zonasReparto || {})[editandoZona] || "",
    placeholder: "Ej: Lomas de Tafí",
    autoFocus: true
  }), React.createElement("button", {
    style: { ...s.btnPrimary, padding: "6px 14px", fontSize: 13, whiteSpace: "nowrap" },
    onClick: () => {
      const v = document.getElementById(`zona-${editandoZona}`).value.trim();
      onSetZona(editandoZona, v);
      setEditandoZona(null);
    }
  }, "OK"), React.createElement("button", {
    style: { ...s.btn, padding: "6px 10px", fontSize: 13 },
    onClick: () => setEditandoZona(null)
  }, "✕"))),

  deudaExpandida && React.createElement("div", {
    style: {
      background: "var(--color-background-secondary)",
      border: "0.5px solid var(--color-border-secondary)",
      borderRadius: 10,
      padding: "8px 10px",
      margin: "8px 16px 0",
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, [...(clientes || []).filter(c => c.dia === deudaExpandida && c.saldo < 0)].sort((a, b) => a.saldo - b.saldo).map(c => React.createElement("button", {
    key: c.id,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      background: "none",
      border: "none",
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      padding: "8px 4px",
      cursor: "pointer",
      textAlign: "left"
    },
    onClick: () => {
      setDeudaExpandida(null);
      onVerDeudor && onVerDeudor(c, deudaExpandida);
    }
  }, React.createElement("span", {
    style: { fontSize: 13, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
  }, c.nombre), React.createElement("span", {
    style: { fontSize: 13, fontWeight: 600, color: "var(--color-text-danger)", flexShrink: 0 }
  }, fmt(Math.abs(c.saldo)))))),

  notifItems.length > 0 && React.createElement("div", {
    style: { display: "flex", gap: 8, padding: "14px 16px 0" }
  }, notifItems),

  mostrarRecordatorios && recordatoriosActivos && recordatoriosActivos.length > 0 && React.createElement("div", {
    style: { padding: "8px 16px 0", display: "flex", flexDirection: "column", gap: 6 }
  }, recordatoriosActivos.slice(0, 5).map(r => React.createElement("div", {
    key: r.id,
    style: {
      ...s.card,
      margin: 0,
      background: "var(--color-background-info)",
      border: "0.5px solid var(--color-border-info)",
      display: "flex",
      gap: 8,
      alignItems: "flex-start"
    }
  }, React.createElement("div", {
    style: { flex: 1, cursor: "pointer" },
    onClick: () => onAgenda && onAgenda()
  }, React.createElement("div", {
    style: { fontSize: 12, fontWeight: 500, color: "var(--color-text-info)" }
  }, r.clienteNombre, " · ", r.dia, " ", React.createElement("span", {
    style: { fontSize: 10, opacity: 0.7 }
  }, "→ tocá para ver")), React.createElement("div", {
    style: { fontSize: 12, color: "var(--color-text-primary)", marginTop: 2 }
  }, r.tipo === "cobro" ? "💰" : "🏠", " ", r.motivo), React.createElement("div", {
    style: { fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2 }
  }, r.fecha, r.hora ? ` · ${r.hora}` : "")), React.createElement("button", {
    style: {
      background: "var(--color-background-success)",
      color: "var(--color-text-success)",
      border: "none",
      borderRadius: 6,
      padding: "4px 8px",
      fontSize: 11,
      fontWeight: 600,
      cursor: "pointer",
      flexShrink: 0,
      marginTop: 2
    },
    onClick: () => onConfirmarRecordatorio && onConfirmarRecordatorio(r.id)
  }, "✓"))), recordatoriosActivos.length > 5 && React.createElement("div", {
    style: { fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center" }
  }, "+", recordatoriosActivos.length - 5, " más")),

  mostrarTransferencias && transferenciasPendientes && transferenciasPendientes.length > 0 && React.createElement("div", {
    style: { padding: "8px 16px 0", display: "flex", flexDirection: "column", gap: 6 }
  }, transferenciasPendientes.map(({ dia, fecha, count, monto, ventas: vts }) => React.createElement("button", {
    key: dia + fecha,
    style: {
      ...s.card,
      width: "100%",
      margin: 0,
      background: "var(--color-background-danger)",
      border: "1px solid var(--color-border-danger)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      cursor: "pointer",
      textAlign: "left"
    },
    onClick: () => onVerConfirmaciones && onVerConfirmaciones(dia)
  }, React.createElement("span", {
    style: { fontSize: 18 }
  }, "🔴"), React.createElement("div", {
    style: { flex: 1 }
  }, React.createElement("div", {
    style: { fontSize: 13, fontWeight: 500, color: "var(--color-text-danger)" }
  }, dia, " · ", count, " transfer. sin confirmar"), React.createElement("div", {
    style: { fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }
  }, vts.slice(0, 3).map(v => v.cliente).join(", "), vts.length > 3 ? ` +${vts.length - 3} más` : "")), React.createElement("div", {
    style: { textAlign: "right", flexShrink: 0 }
  }, React.createElement("div", {
    style: { fontSize: 13, fontWeight: 500, color: "var(--color-text-danger)" }
  }, fmt(monto)), React.createElement("div", {
    style: { fontSize: 10, color: "var(--color-text-tertiary)" }
  }, fecha))))),

  React.createElement("div", {
    style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "16px 16px 8px" }
  }, [{
    ico: "📅",
    lbl: "Agenda",
    fn: () => onAgenda && onAgenda()
  }, {
    ico: "📋",
    lbl: "Planilla",
    fn: () => onPlanillaAtajo && onPlanillaAtajo()
  }, {
    ico: "➕",
    lbl: "Nuevo cliente",
    fn: () => onNuevoCliente && onNuevoCliente()
  }].map(({ ico, lbl, fn }) => React.createElement("button", {
    key: lbl,
    onClick: fn,
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 3,
      padding: "10px 4px",
      borderRadius: 11,
      cursor: "pointer",
      border: "none",
      background: "var(--color-background-tertiary)",
      color: "var(--color-text-secondary)"
    }
  }, React.createElement("span", {
    style: { fontSize: 19 }
  }, ico), React.createElement("span", {
    style: { fontSize: 9, fontWeight: 500, color: "var(--color-text-tertiary)" }
  }, lbl)))),

  React.createElement("div", { style: s.divider }),

  React.createElement("div", {
    style: {
      padding: "4px 20px 10px",
      borderTop: "0.5px solid var(--color-border-tertiary)",
      display: "flex",
      justifyContent: "space-around"
    }
  }, [{
    ico: "👥",
    lbl: "Clientes",
    fn: onGestionClientes
  }, {
    ico: "📦",
    lbl: "Stock",
    fn: onStock
  }, {
    ico: "⚙️",
    lbl: "Config",
    fn: onConfig
  }].map(({ ico, lbl, fn }) => React.createElement("button", {
    key: lbl,
    onClick: fn,
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 5,
      paddingTop: 10,
      border: "none",
      background: "none",
      cursor: "pointer"
    }
  }, React.createElement("span", {
    style: { fontSize: 20 }
  }, ico), React.createElement("span", {
    style: { fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)" }
  }, lbl))))

);
}
function DetalleTransferencias({
  ventas,
  ventasPendTrans,
  clientes,
  onConfirmarTransfer
}) {
  const [abierto, setAbierto] = React.useState(false);
  const pendientes = (ventasPendTrans || []).length;
  const clientePorId = React.useMemo(() => {
    const m = {};
    (clientes || []).forEach(c => {
      m[c.id] = c;
    });
    return m;
  }, [clientes]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "8px 0",
      borderRadius: 12,
      overflow: "hidden",
      border: "1.5px solid #185FA5",
      background: "var(--color-background-info)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      padding: "12px 16px",
      background: "none",
      border: "none",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      textAlign: "left"
    },
    onClick: () => setAbierto(o => !o)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, "💸"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-text-info)"
    }
  }, "Detalle de transferencias"), pendientes > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "1px 6px",
      borderRadius: 4,
      background: "var(--color-background-warning)",
      color: "#f5b942",
      fontWeight: 600
    }
  }, "🔴 ", pendientes, " pend.")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-text-info)",
      fontSize: 14,
      display: "inline-block",
      transform: abierto ? "rotate(180deg)" : "rotate(0deg)"
    }
  }, "▾")), abierto && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 16px 12px"
    }
  }, ventas.map(v => {
    const confirmada = !!v.transConfirmada;
    const monto = (v.pagadoNum != null ? v.pagadoNum : v.neto) || 0;
    const cli = clientePorId[v.clienteId];
    const tel = cli && cli.telefono;
    // Mensaje pre-armado (mismo texto en toda la app) — ver armarMsjTransferWA
    // en 03-utils.js.
    const msjWA = armarMsjTransferWA([v]);
    return /*#__PURE__*/React.createElement("div", {
      key: v.id,
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 0",
        borderBottom: "0.5px solid var(--color-border-tertiary)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-primary)",
        fontWeight: 500
      }
    }, v.cliente), /*#__PURE__*/React.createElement("button", {
      style: {
        marginLeft: 6,
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: 4,
        background: confirmada ? "var(--color-background-success)" : "var(--color-background-warning)",
        color: confirmada ? "var(--color-text-success)" : "#f5b942",
        fontWeight: 600,
        border: "none",
        cursor: "pointer"
      },
      title: confirmada ? "Transferencia confirmada — tocá para desmarcar" : "Tocá para confirmar la transferencia",
      onClick: e => {
        e.stopPropagation();
        onConfirmarTransfer && onConfirmarTransfer(v.clienteId, v.id);
      }
    }, confirmada ? "✅ Confirmada" : "🔴 Pendiente"), !confirmada && tel && /*#__PURE__*/React.createElement("a", {
      href: `https://wa.me/54${tel}?text=${msjWA}`,
      target: "_blank",
      rel: "noreferrer",
      title: "Mandar WhatsApp para pedir que confirme la transferencia",
      style: {
        marginLeft: 6,
        fontSize: 13,
        textDecoration: "none"
      },
      onClick: e => e.stopPropagation()
    }, "💬")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: confirmada ? "var(--color-text-success)" : "#f5b942",
        flexShrink: 0,
        marginLeft: 8
      }
    }, fmt(monto)));
  })));
}
function DetalleVentasDia({
  ventas,
  clientes,
  noVisitas,
  dia,
  fecha,
  productos,
  todasLasVentas,
  onEditarVenta,
  onEliminarVenta,
  onEditarCliente,
  onPerdidaCliente,
  onConfirmarTransfer,
  onRegistrarNoVisita,
  onQuitarNoVisita
}) {
  const [abierto, setAbierto] = React.useState(false);
  // Fila de "No compraron" cuyo menú de edición está desplegado (clienteId o null) —
  // para poder corregir la marca si se tocó sin querer o se marcó mal.
  const [editandoNVId, setEditandoNVId] = React.useState(null);
  // Qué venta se está editando in-place (solo aplica a compras reales —
  // cobros/ajustes/cambios de envase solo se pueden eliminar, no editar,
  // mismo criterio que el historial del perfil del cliente).
  const [editandoVentaId, setEditandoVentaId] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "0 0 8px",
      borderRadius: 12,
      overflow: "hidden",
      border: "1.5px solid #185FA5",
      background: "var(--color-background-info)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      padding: "12px 16px",
      background: "none",
      border: "none",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      textAlign: "left"
    },
    onClick: () => setAbierto(o => !o)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, "📋"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-text-info)"
    }
  }, "Detalle de ventas del día"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, ventas.length, " venta", ventas.length > 1 ? "s" : "")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-text-info)",
      fontSize: 14,
      display: "inline-block",
      transform: abierto ? "rotate(180deg)" : "rotate(0deg)"
    }
  }, "▾")), abierto && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "0.5px solid var(--color-border-info)",
      background: "var(--color-background-primary)"
    }
  }, ventas.map((v, idx) => {
    const esMixto = (Number(v.montoTrans) || 0) > 0 && (Number(v.montoEfec) || 0) > 0;
    const pagoBadge = esMixto ? {
      bg: v.transConfirmada ? "var(--color-background-success)" : "var(--color-background-warning)",
      color: v.transConfirmada ? "var(--color-text-success)" : "#f5b942",
      txt: `Mixto · ef ${fmt(v.montoEfec)} + tr ${fmt(v.montoTrans)} ${v.transConfirmada ? "✅" : "🔴"}`
    } : {
      contado: {
        bg: "var(--color-background-success)",
        color: "var(--color-text-success)",
        txt: "Contado"
      },
      transferencia: {
        bg: v.transConfirmada ? "var(--color-background-success)" : "var(--color-background-warning)",
        color: v.transConfirmada ? "var(--color-text-success)" : "#f5b942",
        txt: v.transConfirmada ? "Transfer. ✅" : "Transfer. 🔴"
      },
      fiado: {
        bg: "var(--color-background-warning)",
        color: "var(--color-text-warning)",
        txt: "Fiado"
      },
      cambio: {
        bg: "rgba(129,140,248,0.15)",
        color: "#818cf8",
        txt: "🔄 Cambio"
      },
      devolucion: {
        bg: "rgba(29,158,117,0.15)",
        color: "#1D9E75",
        txt: "↩️ Devolución"
      }
    }[v.pago] || {
      bg: "var(--color-background-tertiary)",
      color: "var(--color-text-secondary)",
      txt: v.pago
    };
    const cli = (clientes || []).find(x => x.id === v.clienteId);
    const dir = cli ? direccionCliente(cli) : "";
    const esNuevo = !!(cli && cli.creadoFecha === fecha);
    const deudaPagada = Math.max(0, (v.pagadoNum || 0) - (v.neto || 0));
    const fmtEnv = arr => (arr || []).filter(e => e.prod && Number(e.cant) > 0).map(e => `${e.cant} ${e.prod}`).join(", ");
    const prestStr = fmtEnv(v.envPrest);
    const devStr = fmtEnv(v.envDev);
    // Mismo criterio que el historial del perfil del cliente (08-clientes.js):
    // cobros/ajustes/cambios de envase solo se pueden eliminar, no editar —
    // editarlos como si fueran una compra normal rompería el saldo/stock.
    const esCobro = v.pagadoNum > 0 && v.neto === 0 && !v._esAjuste;
    const esAjuste = v._esAjuste || false;
    const esCambio = v._esCambio || false;
    const esDevolucion = v._esDevolucion || false;
    const esCompraReal = !esCobro && !esAjuste && !esCambio;
    const cardStyle = {
      padding: "10px 16px",
      borderBottom: idx < ventas.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
      ...(esNuevo ? { background: "rgba(93,170,255,0.10)", borderLeft: "3px solid #5daaff" } : {})
    };
    if (editandoVentaId === v.id && esCompraReal && cli) {
      return /*#__PURE__*/React.createElement("div", {
        key: v.id,
        style: cardStyle
      }, /*#__PURE__*/React.createElement(NuevaVenta, {
        compacto: true,
        ventaEditar: v,
        cliente: cli,
        productos: productos,
        ventasCliente: [],
        onGuardar: (detalle, pagoArg, montoArg, saldoApl, envPrest, envDev, obs, opcionSaldo, otroLeg, _saldoDelta, transConfirmadaArg) => {
          if (opcionSaldo === "mixto_ef") {
            onEditarVenta(v.id, detalle, "mixto", montoArg, saldoApl, obs, otroLeg, transConfirmadaArg);
          } else if (opcionSaldo === "mixto_tr") {
            onEditarVenta(v.id, detalle, "mixto", otroLeg, saldoApl, obs, montoArg, transConfirmadaArg);
          } else {
            onEditarVenta(v.id, detalle, pagoArg, montoArg, saldoApl, obs, undefined, transConfirmadaArg);
          }
          setEditandoVentaId(null);
        },
        onCancelar: () => setEditandoVentaId(null)
      }));
    }
    // Fila de acciones al pie de cada tarjeta: registrar envases prestados/
    // devueltos del cliente (mismo panel "♻️ Envases" que en Gestión/perfil),
    // editar (solo compras reales) y eliminar.
    const accionesRow = cli ? /*#__PURE__*/React.createElement(PieEnvases, {
      c: cli,
      ventas: todasLasVentas || [],
      onEditar: onEditarCliente,
      onPerdidaCliente: onPerdidaCliente
    }, esCompraReal && /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btn,
        fontSize: 11,
        padding: "3px 8px"
      },
      onClick: () => setEditandoVentaId(v.id)
    }, "✏️ Editar"), /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btnDanger,
        fontSize: 11,
        padding: "3px 8px"
      },
      onClick: () => {
        const tipo = esCobro ? "este cobro" : esAjuste ? "este ajuste" : esDevolucion ? "esta devolución" : esCambio ? "este cambio" : "esta venta";
        if (window.confirm(`¿Eliminar ${tipo}?`)) onEliminarVenta(v.id);
      }
    }, "🗑 Eliminar")) : null;
    return /*#__PURE__*/React.createElement("div", {
      key: v.id,
      style: cardStyle
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 5
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: "var(--color-text-primary)"
      }
    }, v.cliente), (v.pago === "transferencia" || esMixto) ? /*#__PURE__*/React.createElement("button", {
      style: {
        marginLeft: 6,
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: 4,
        background: pagoBadge.bg,
        color: pagoBadge.color,
        fontWeight: 600,
        border: "none",
        cursor: "pointer"
      },
      title: v.transConfirmada ? "Transfer. confirmada — tocá para desmarcar" : "Tocá para confirmar transferencia",
      onClick: e => {
        e.stopPropagation();
        onConfirmarTransfer && onConfirmarTransfer(v.clienteId, v.id);
      }
    }, pagoBadge.txt) : /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 6,
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: 4,
        background: pagoBadge.bg,
        color: pagoBadge.color,
        fontWeight: 600
      }
    }, pagoBadge.txt), !v.transConfirmada && (v.pago === "transferencia" || esMixto) && cli && cli.telefono && /*#__PURE__*/React.createElement("a", {
      href: `https://wa.me/54${cli.telefono}?text=${armarMsjTransferWA([v])}`,
      target: "_blank",
      rel: "noreferrer",
      title: "Mandar WhatsApp para pedir que confirme la transferencia",
      onClick: e => e.stopPropagation(),
      style: {
        marginLeft: 6,
        fontSize: 13,
        textDecoration: "none"
      }
    }, "💬"), esNuevo && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 6,
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: 4,
        background: "rgba(93,170,255,0.2)",
        color: "#5daaff",
        fontWeight: 700
      }
    }, "🆕 Nuevo"), v.hora && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 6,
        fontSize: 10,
        color: "var(--color-text-tertiary)"
      }
    }, "🕐 ", v.hora), dir && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--color-text-tertiary)",
        marginTop: 2
      }
    }, "📍 ", dir)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 500,
        color: "var(--color-text-primary)"
      }
    }, fmt(v.neto || 0))), (v.detalle || []).map((d, di) => /*#__PURE__*/React.createElement("div", {
      key: di,
      style: {
        display: "flex",
        justifyContent: "space-between",
        padding: "2px 0 2px 8px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-secondary)"
      }
    }, d.nombre, " × ", d.cantidad), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-tertiary)"
      }
    }, fmt(d.total)))), (v.saldoAplicado > 0 || deudaPagada > 0 || prestStr || devStr) && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "6px 8px",
        marginTop: 4,
        borderRadius: 6,
        background: "var(--color-background-info)"
      }
    }, v.saldoAplicado > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--color-text-success)"
      }
    }, "Saldo a favor aplicado: −", fmt(v.saldoAplicado)), deudaPagada > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--color-text-success)"
      }
    }, "💵 Pagó deuda: +", fmt(deudaPagada)), prestStr && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: "#f5b942",
        background: "rgba(245,185,66,0.15)",
        padding: "3px 8px",
        borderRadius: 6,
        width: "fit-content"
      }
    }, "📦 Prestó: ", prestStr), devStr && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: "#1D9E75",
        background: "rgba(29,158,117,0.15)",
        padding: "3px 8px",
        borderRadius: 6,
        width: "fit-content"
      }
    }, "↩️ Devolvió: ", devStr)), accionesRow);
  }), (() => {
    // BUG REPORTADO 2026-10-15: "registrarNoQuiereConEnvases" (14-app.js)
    // crea un registro en "ventas" cuando el cliente que dijo "No quiere"
    // igual dejó/llevó envases (para que quede el movimiento asentado y
    // mueva stock) — pero ese registro NO es una compra real. Acá abajo se
    // armaba "ventaIds" con TODAS las ventas del día sin filtrar, así que
    // ese cliente dejaba de aparecer en "No compraron" (quedaba "tapado"
    // por su propio registro de envases) aunque sí dijo que no quería —
    // exactamente lo que el usuario reportó: "No se registra la devolución"
    // cuando en realidad sí se registraba, solo que el cliente desaparecía
    // de la lista donde se esperaba verlo. Ahora solo cuentan como "ya
    // compró" las ventas reales (se excluyen cobros, ajustes, cambios de
    // envase y la parte-transferencia de un pago mixto).
    const ventaIds = new Set(ventas.filter(v => !v._esCobro && !v._esAjuste && !v._esCambio && !v._esMixtoTrans).map(v => v.clienteId));
    const noComp = (noVisitas || []).filter(n => n.fecha === fecha && !ventaIds.has(n.clienteId) && n.motivo !== "salteado");
    if (noComp.length === 0) return null;
    const lbl = m => m === "noquiso" ? {
      t: "No quiso",
      c: "var(--color-text-danger)",
      ic: "🚫"
    } : {
      t: "No estaba",
      c: "var(--color-text-warning)",
      ic: "🔄"
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: "0.5px solid var(--color-border-tertiary)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 16px 4px",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--color-text-tertiary)",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }
    }, "No compraron (", noComp.length, ")"), noComp.map((n, i) => {
      const p = (clientes || []).find(x => x.id === n.clienteId) || {};
      const info = lbl(n.motivo);
      const dir = direccionCliente(p);
      // Si "No quiere" vino con envases (ver registrarNoQuiereConEnvases en
      // 14-app.js), queda un registro en "ventas" solo para eso — mostrarlo
      // acá también, al lado de "No quiso", que es donde el usuario lo
      // busca primero (antes solo se veía en "Detalle de ventas del día").
      const ventaEnvNV = ventas.find(v => v.clienteId === n.clienteId && v._esAjuste && ((v.envPrest || []).length || (v.envDev || []).length));
      const fmtEnvNV = arr => (arr || []).filter(e => e.prod && Number(e.cant) > 0).map(e => `${e.cant} ${e.prod}`).join(", ");
      const prestStrNV = ventaEnvNV ? fmtEnvNV(ventaEnvNV.envPrest) : "";
      const devStrNV = ventaEnvNV ? fmtEnvNV(ventaEnvNV.envDev) : "";
      return /*#__PURE__*/React.createElement("div", {
        key: "nv" + i,
        style: {
          padding: "7px 16px",
          borderTop: i > 0 ? "0.5px solid var(--color-border-tertiary)" : "none"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13,
          color: "var(--color-text-secondary)"
        }
      }, p.nombre || "Cliente"), dir && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--color-text-tertiary)"
        }
      }, "📍 ", dir)), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 600,
          color: info.c,
          flexShrink: 0
        }
      }, info.ic, " ", info.t)), (prestStrNV || devStrNV) && /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 4
        }
      }, prestStrNV && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 600,
          color: "#f5b942",
          background: "rgba(245,185,66,0.15)",
          padding: "3px 8px",
          borderRadius: 6,
          width: "fit-content"
        }
      }, "📦 Prestó: ", prestStrNV), devStrNV && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 600,
          color: "#1D9E75",
          background: "rgba(29,158,117,0.15)",
          padding: "3px 8px",
          borderRadius: 6,
          width: "fit-content"
        }
      }, "↩️ Devolvió: ", devStrNV)), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
          marginTop: 8
        }
      }, p.id && /*#__PURE__*/React.createElement(PieEnvases, {
        c: p,
        ventas: todasLasVentas || [],
        onEditar: onEditarCliente,
        onPerdidaCliente: onPerdidaCliente
      }), (onRegistrarNoVisita || onQuitarNoVisita) && /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 11,
          fontWeight: 600,
          padding: "5px 12px",
          borderRadius: 20,
          cursor: "pointer",
          background: editandoNVId === n.clienteId ? "var(--color-background-info)" : "var(--color-background-tertiary)",
          color: editandoNVId === n.clienteId ? "var(--color-text-info)" : "var(--color-text-secondary)",
          border: editandoNVId === n.clienteId ? "1px solid var(--color-border-info)" : "0.5px solid var(--color-border-secondary)"
        },
        onClick: () => setEditandoNVId(editandoNVId === n.clienteId ? null : n.clienteId)
      }, "✏️ Editar")), editandoNVId === n.clienteId && /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 8,
          paddingTop: 8,
          borderTop: "0.5px dashed var(--color-border-tertiary)"
        }
      }, /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 11,
          fontWeight: 600,
          padding: "5px 12px",
          borderRadius: 20,
          cursor: "pointer",
          background: "var(--color-background-warning)",
          color: "var(--color-text-warning)",
          border: "1px solid var(--color-border-warning)"
        },
        onClick: () => {
          onRegistrarNoVisita && onRegistrarNoVisita(n.clienteId, "noesta");
          setEditandoNVId(null);
        }
      }, "🚪 No estaba"), /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 11,
          fontWeight: 600,
          padding: "5px 12px",
          borderRadius: 20,
          cursor: "pointer",
          background: "var(--color-background-danger)",
          color: "var(--color-text-danger)",
          border: "1px solid var(--color-border-danger)"
        },
        onClick: () => {
          onRegistrarNoVisita && onRegistrarNoVisita(n.clienteId, "noquiso");
          setEditandoNVId(null);
        }
      }, "🙅 No quiso"), /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 11,
          fontWeight: 600,
          padding: "5px 12px",
          borderRadius: 20,
          cursor: "pointer",
          background: "var(--color-background-tertiary)",
          color: "var(--color-text-secondary)",
          border: "0.5px solid var(--color-border-secondary)"
        },
        onClick: () => {
          onQuitarNoVisita && onQuitarNoVisita(n.clienteId);
          setEditandoNVId(null);
        }
      }, "🗑️ Quitar marca")));
    }));
  })()));
}
function PlanillaDelDia({
  dia,
  fecha,
  ventas,
  todasLasVentas,
  dispMovs,
  clientes,
  planilla,
  productos,
  stock,
  setStock,
  syncData,
  onGuardar,
  onVolver,
  autoCierre,
  onAutoGuardar,
  noVisitas,
  cargasDia,
  setCargasDia,
  onEditarVenta,
  onEliminarVenta,
  onEditarCliente,
  onPerdidaCliente,
  onConfirmarTransfer,
  onEditarCarga,
  onRegistrarNoVisita,
  onQuitarNoVisita,
  perdidas,
  movStock,
  ecToken
}) {
  // Separar ventas del día propio vs ventas de clientes de otro día
  const clientesDia = new Set((clientes || []).filter(c => c.dia === dia).map(c => c.id));
  const ventasPropias = ventas.filter(v => clientesDia.has(v.clienteId) && v.fechaKey === fecha && !v._esMixtoTrans);
  const ventasExtraDia = ventas.filter(v => !clientesDia.has(v.clienteId) && v.fechaKey === fecha && !v._esMixtoTrans);
  // Auto-calcular desde ventas del dia
  const CAJON_SODA = 6;
  const getProdCosto = nombre => {
    const p = (productos || []).find(x => x.nombre === nombre);
    return p ? p.costo || 0 : 0;
  };
  const costSifon = getProdCosto("Sifón 1.5L") || 133.33;
  const costB10 = getProdCosto("Bidón 10L") || 800;
  const costB20 = getProdCosto("Bidón 20L") || 1100;
  const COSTO_CAJON_SODA = costSifon * CAJON_SODA;
  const prodKey = {
    "Bidón 10L": "b10",
    "Bidón 20L": "b20",
    "Sifón 1.5L": "soda"
  };
  // BUG RAÍZ 2026-10-17 (reportado por el usuario: "esta planilla está
  // agregando ventas y plata a las listas de los días"): antes esto incluía
  // ventasExtraDia (ventas de clientes de OTRO día que cayeron en esta misma
  // fecha calendario) en TODOS los cálculos de plata y envases de este día
  // — cobEfectivo, cobFiado, cobTransBruto, ganancia, el botón
  // "Autocompletar desde ventas", "Guardar planilla" y el envío a Emma
  // Control. Si esta pantalla no era la dueña real de esa fecha (ej. una
  // planilla con el día pisado por el bug de diaActual ya arreglado más
  // arriba), terminaba guardando y hasta cerrando el día con la plata de
  // OTRO día — duplicándola en cualquier resumen que sume todas las
  // planillas, y hasta duplicando el movimiento de stock del cierre.
  // Las ventas de otros días siguen mostrándose aparte (más abajo, tarjeta
  // "Ventas de otros días"), pero ya NUNCA se suman a la plata/stock de
  // ESTE día.
  const todasVentasDia = ventasPropias;
  const totalesPorProd = {
    b10: {
      vacios: 0,
      plata: 0,
      llenar: 0
    },
    b20: {
      vacios: 0,
      plata: 0,
      llenar: 0
    },
    soda: {
      vacios: 0,
      plata: 0,
      llenar: 0,
      cajones: 0
    }
  };
  todasVentasDia.forEach(v => {
    v.detalle.forEach(d => {
      const k = prodKey[d.nombre];
      if (!k) return;
      totalesPorProd[k].vacios += d.cantidad;
      totalesPorProd[k].plata += d.total;
    });
  });
  // Cajones: resto ≤ 3 no suma, resto ≥ 4 suma un cajón más
  const calcCajones = sifones => {
    const full = Math.floor(sifones / CAJON_SODA);
    return sifones % CAJON_SODA >= 4 ? full + 1 : full;
  };
  const sodaCajones = calcCajones(totalesPorProd.soda.vacios);
  totalesPorProd.soda.cajones = sodaCajones;
  totalesPorProd.soda.llenar = sodaCajones * COSTO_CAJON_SODA;
  totalesPorProd.b10.llenar = totalesPorProd.b10.vacios * costB10;
  totalesPorProd.b20.llenar = totalesPorProd.b20.vacios * costB20;
  // Peso desde la CARGA INICIAL del día (lo que salió en el camión — dato de la planilla)
  const sifonesCargados = Number(planilla?.productos?.soda?.llenos || 0);
  const b10Cargados = Number(planilla?.productos?.b10?.llenos || 0);
  const b20Cargados = Number(planilla?.productos?.b20?.llenos || 0);
  const cajonesCargados = calcCajones(sifonesCargados);
  const pesoAuto = cajonesCargados * 13 + b10Cargados * 10 + b20Cargados * 20;
  // Bultos = cajones vendidos + bidones vendidos (con la misma regla de cajones)
  const bultosAuto = cajonesCargados + b10Cargados + b20Cargados;
  const totalVentaPlata = Object.values(totalesPorProd).reduce((a, p) => a + p.plata, 0);
  const totalVentaLlenar = Object.values(totalesPorProd).reduce((a, p) => a + p.llenar, 0);
  // Totales ventas de otros días
  // v.pagadoNum || v.neto || 0 trataba un pago totalmente cubierto con saldo
  // a favor (pagadoNum === 0, un valor real y válido) igual que un pagadoNum
  // faltante (undefined, dato viejo) — "0 || neto" cae a neto por el 0 ser
  // falsy en JS, contando como cobrado algo que en realidad se pagó con
  // crédito. Ahora solo se usa neto como respaldo cuando pagadoNum no existe.
  const extraEfectivo = ventasExtraDia.filter(v => v.pago === "contado").reduce((a, v) => a + ((v.pagadoNum != null ? v.pagadoNum : v.neto) || 0), 0);
  const extraTrans = ventasExtraDia.filter(v => v.pago === "transferencia").reduce((a, v) => a + ((v.pagadoNum != null ? v.pagadoNum : v.neto) || 0), 0);
  const extraFiado = ventasExtraDia.filter(v => v.pago === "fiado").reduce((a, v) => a + (v.neto || 0), 0);
  const extraTotal = extraEfectivo + extraTrans + extraFiado;
  // Cobranza — todas las ventas del día (propias + otros días)
  // Para pago mixto: la venta principal (pago="contado") tiene montoEfec y montoTrans guardados
  // cobEfectivo debe contar solo la parte efectivo del mixto, no el total
  const cobEfectivo = todasVentasDia.filter(v => v.pago === "contado").reduce((a, v) => {
    const esMixto = (Number(v.montoTrans) || 0) > 0;
    return a + (esMixto ? Number(v.montoEfec) || 0 : (v.pagadoNum != null ? v.pagadoNum : v.neto) || 0);
  }, 0);
  // cobTransBruto: transferencias puras + parte transferencia de pagos mixtos
  const cobTransBruto = todasVentasDia.reduce((a, v) => {
    if (v.pago === "transferencia") return a + ((v.pagadoNum != null ? v.pagadoNum : v.neto) || 0);
    if (v.pago === "contado" && (Number(v.montoTrans) || 0) > 0) return a + (Number(v.montoTrans) || 0);
    return a;
  }, 0);
  // Plata del día que se cubrió con saldo a favor (crédito generado en una
  // planilla anterior) — no es efectivo ni transferencia nueva, así que no
  // suma a "Total cobrado", pero se muestra aparte para que quede claro
  // adónde fue esa parte de la venta.
  const cobSaldoUsado = todasVentasDia.filter(v => v.pago === "contado" || v.pago === "transferencia").reduce((a, v) => a + (Number(v.saldoAplicado) || 0), 0);
  const cobTransDesc = Math.round(cobTransBruto * 0.025);
  const cobTransNeto = cobTransBruto - cobTransDesc;
  const ventasPendTrans = ventas.filter(v => (v.pago === "transferencia" || v.pago === "mixto" && Number(v.montoTrans) > 0) && !v.transConfirmada);
  const cobFiado = todasVentasDia.filter(v => v.pago === "fiado").reduce((a, v) => a + (v.neto || 0), 0);
  const cobSaldosEfec = todasVentasDia.filter(v => v.pago === "contado").reduce((a, v) => {
    const extra = (v.pagadoNum || 0) - (v.neto || 0);
    return a + (extra > 0 ? extra : 0);
  }, 0);
  const cobSaldosTrans = todasVentasDia.filter(v => v.pago === "transferencia").reduce((a, v) => {
    const extra = (v.pagadoNum || 0) - (v.neto || 0);
    return a + (extra > 0 ? extra : 0);
  }, 0);
  const cobSaldos = cobSaldosEfec + cobSaldosTrans;
  const fiadoNeto = cobFiado - cobSaldos;
  const [datos, setDatos] = useState(() => ({
    ...planilla,
    peso: planilla.peso || (pesoAuto > 0 ? String(pesoAuto) : ""),
    bultos: planilla.bultos || (bultosAuto > 0 ? String(bultosAuto) : ""),
    efectivo: planilla.efectivo || (cobEfectivo > 0 ? String(Math.round(cobEfectivo)) : ""),
    fiado: planilla.fiado || (cobFiado > 0 ? String(Math.round(cobFiado)) : ""),
    retenciones: planilla.retenciones || (cobTransDesc > 0 ? String(cobTransDesc) : "")
  }));
  const set = (k, v) => setDatos(d => ({
    ...d,
    [k]: v
  }));
  const cierreKey = `cierre_${dia}_${fecha}`;
  // Si ya se confirmó el cierre alguna vez para este día (localStorage se
  // marca de inmediato en confirmarCierre, antes incluso de que la planilla
  // sincronizada vuelva a bajar como prop), no hay que volver a pedir la
  // verificación de envases.
  const yaCerrado = !!planilla._diaCerrado || !!localStorage.getItem(cierreKey);
  const [mostrarCierre, setMostrarCierre] = useState(() => autoCierre && !(planilla._diaCerrado || localStorage.getItem(cierreKey)));
  const [enviandoCierre, setEnviandoCierre] = useState(false);
  const [realesLlenos, setRealesLlenos] = useState({
    soda: "",
    b10: "",
    b20: ""
  });
  const [realesVacios, setRealesVacios] = useState({
    soda: "",
    b10: "",
    b20: ""
  });
  const [realesParaLlenar, setRealesParaLlenar] = useState({
    soda: "",
    b10: "",
    b20: ""
  });
  const [realesVendido, setRealesVendido] = useState({
    soda: "",
    b10: "",
    b20: ""
  });
  const [realesPrestado, setRealesPrestado] = useState({
    soda: "",
    b10: "",
    b20: ""
  });
  const [realesDevuelto, setRealesDevuelto] = useState({
    soda: "",
    b10: "",
    b20: ""
  });
  // Cartel de confirmación antes de mover algo del/al Depósito — pedido del
  // usuario: la app tiene que avisar y preguntar, no mover en silencio.
  const [mostrarConfirmDeposito, setMostrarConfirmDeposito] = useState(false);
  // Detalle por cliente en "Movimiento de envases de hoy" — pedido del
  // usuario: "que se vea quien fue el que devolvio y a quien se le
  // presto", desplegable y arranca cerrado para no alargar la planilla.
  const [mostrarDetalleClientesEnv, setMostrarDetalleClientesEnv] = useState(false);
  // "Ventas de otros días" — pedido del usuario 2026-10-17: que sea
  // desplegable (arranca cerrado) para no mostrar de entrada las ventas
  // de otro día que solo sirven para reconciliar caja.
  const [mostrarExtraDia, setMostrarExtraDia] = useState(false);

  // ── Cálculo de stock para el cierre del día ──────────────────
  const CAJON = 6;
  const planKeyToSk = {
    soda: "sifon",
    b10: "bidon10",
    b20: "bidon20"
  };
  // Base de referencia de sodería (se edita solo desde la pantalla Stock,
  // acá es de solo lectura). Se usa para saber cuánto es "de más" al
  // cerrar el día — ver calcularMovimientoDeposito más abajo.
  const BASE_DEFAULT_REF = { sifon: 150, bidon10: 70, bidon20: 21 };
  const baseRefFor = sk => stock?.capacidadFija?.[sk] ?? BASE_DEFAULT_REF[sk] ?? 0;
  const llenosCargados = {
    soda: Number(datos.productos?.soda?.llenos || 0),
    b10: Number(datos.productos?.b10?.llenos || 0),
    b20: Number(datos.productos?.b20?.llenos || 0)
  };
  const vendidosDia = {
    soda: 0,
    b10: 0,
    b20: 0,
    disp: 0
  };
  const prestadosDia = {
    soda: 0,
    b10: 0,
    b20: 0,
    disp: 0
  };
  const devueltosDia = {
    soda: 0,
    b10: 0,
    b20: 0,
    disp: 0
  };
  const prodKeyPl = {
    "Sifón 1.5L": "soda",
    "Bidón 10L": "b10",
    "Bidón 20L": "b20"
  };
  ventas.forEach(v => {
    v.detalle.forEach(d => {
      const k = prodKeyPl[d.nombre];
      if (k) vendidosDia[k] += d.cantidad;
    });
    (v.envPrest || []).forEach(e => {
      const k = prodKeyPl[e.prod];
      if (k) prestadosDia[k] += Number(e.cant) || 0;
    });
    (v.envDev || []).forEach(e => {
      const k = prodKeyPl[e.prod];
      if (k) devueltosDia[k] += Number(e.cant) || 0;
    });
  });
  // Dispenser: no se "vende", se presta/retira en comodato directo al
  // cliente (ver registrarDispMov en 14-app.js) — se suma acá por separado
  // para que aparezca en el mismo informe del día que sifón/bidones.
  (dispMovs || []).forEach(m => {
    if (m.delta > 0) prestadosDia.disp += m.delta;else devueltosDia.disp += -m.delta;
  });
  // Perdidos y retirados de HOY (pedido del usuario: que el movimiento de
  // envases del día se vea reflejado en la planilla de cierre, no solo el
  // neto). "fecha" acá es la fecha de ESTA planilla (no necesariamente la
  // de hoy-hoy si se está cerrando un día atrasado) — se compara contra
  // eso, no contra la fecha real del sistema.
  const skToPl = {
    sifon: "soda",
    bidon10: "b10",
    bidon20: "b20",
    dispenser: "disp"
  };
  const perdidosDia = {
    soda: 0,
    b10: 0,
    b20: 0,
    disp: 0
  };
  (perdidas || []).forEach(p => {
    if ((p.fecha || "").slice(0, 10) !== fecha) return;
    Object.keys(skToPl).forEach(sk => {
      perdidosDia[skToPl[sk]] += Number(p[sk]) || 0;
    });
  });
  const retiradosDia = {
    soda: 0,
    b10: 0,
    b20: 0,
    disp: 0
  };
  (movStock || []).forEach(m => {
    if (m.tipo !== "retiro" || (m.fecha || "").slice(0, 10) !== fecha) return;
    Object.keys(skToPl).forEach(sk => {
      retiradosDia[skToPl[sk]] += Number(m.detalle?.[sk]) || 0;
    });
  });
  // Envases que hoy se le dejaron a un cliente nuevo o al editarle el fijo
  // (ver ajustarStockFijoCliente en 14-app.js) — salen de sodería al toque,
  // sin esperar el cierre, y el usuario también los quiere ver acá.
  const clientesNuevosDia = {
    soda: 0,
    b10: 0,
    b20: 0,
    disp: 0
  };
  // Envases que un cliente devolvió hoy porque se le achicó el fijo (no un
  // préstamo) — ej. edición manual en "♻️ Envases → Fijos". BUG REPORTADO:
  // esto SÍ movía el stock bien (ajustarStockFijoCliente ya sumaba de
  // vuelta a sodería), pero no se veía en ningún lado de la planilla — la
  // devolución sólo deja rastro acá vía movStock (nota "Envases fijos de
  // cliente..."), no como venta, así que NO entra a devueltosDia (que sale
  // de ventas.envDev) para no duplicar el ajuste de stock que ya se hizo al
  // toque. Se suma aparte y se mezcla solo en la columna "Devuelto" de la
  // tabla de abajo, a efectos de mostrarlo.
  const devueltosFijoDia = {
    soda: 0,
    b10: 0,
    b20: 0,
    disp: 0
  };
  (movStock || []).forEach(m => {
    // OJO: solo "Envases fijos de cliente..." — las correcciones de
    // "Envases prestados de cliente..." (✏️ Envases → Prestados) quedan
    // AFUERA a propósito: esas ya se cuentan en prestadosDia/devueltosDia
    // más arriba (vía el registro de venta que genera
    // window._lcRegistrarAjusteEnvases al confirmar el panel). Si también
    // entraran acá, cada corrección de Prestados se contaba DOBLE: una vez
    // en Prestado/Devuelto y otra vez en Cliente nuevo/Devuelto.
    if (m.tipo !== "ajuste" || !(m.nota || "").startsWith("Envases fijos de cliente") || (m.fecha || "").slice(0, 10) !== fecha) return;
    Object.keys(skToPl).forEach(sk => {
      const d = Number(m.detalle?.[sk]) || 0;
      // detalle viene negativo (sale de sodería) — acá se muestra en positivo,
      // como cantidad entregada. Si es positivo, es lo opuesto: volvió.
      if (d < 0) clientesNuevosDia[skToPl[sk]] += -d;else if (d > 0) devueltosFijoDia[skToPl[sk]] += d;
    });
  });
  // FÓRMULA CORRECTA:
  // Sobrantes llenos = cargados − vendidos (prestados no reducen llenos, se compensan con devueltos)
  // Vacíos del día = vendidos + devueltos − prestados (los prestados de hoy cancelan devueltos de hoy)
  const sobrantes = {
    soda: 0,
    b10: 0,
    b20: 0
  };
  const vaciosRec = {
    soda: 0,
    b10: 0,
    b20: 0
  };
  ["soda", "b10", "b20"].forEach(pk => {
    sobrantes[pk] = Math.max(0, llenosCargados[pk] - vendidosDia[pk]);
    vaciosRec[pk] = Math.max(0, vendidosDia[pk] + devueltosDia[pk] - prestadosDia[pk]);
  });
  // Sodería después del cierre
  const soderiaActual = stock?.soderia || {
    sifon: 0,
    bidon10: 0,
    bidon20: 0
  };
  const soderiaVaciosActual = stock?.soderia_vacios || {
    sifon: 0,
    bidon10: 0,
    bidon20: 0
  };
  const soderiaPost = {
    soda: 0,
    b10: 0,
    b20: 0
  };
  const soderiaVaciosPost = {
    soda: 0,
    b10: 0,
    b20: 0
  };
  ["soda", "b10", "b20"].forEach(pk => {
    const sk = planKeyToSk[pk];
    soderiaPost[pk] = (soderiaActual[sk] || 0) + sobrantes[pk];
    soderiaVaciosPost[pk] = (soderiaVaciosActual[sk] || 0) + vaciosRec[pk];
  });

  // Cuánto necesitás para la salida del PRÓXIMO día (según la carga real
  // aprendida la última vez que saliste ese día — ver saveCargasDia en 14-app.js)
  const DIAS_ORDEN = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const diaSiguiente = DIAS_ORDEN[(DIAS_ORDEN.indexOf(dia) + 1) % DIAS_ORDEN.length];
  const necesarioManana = cargasDia && cargasDia[diaSiguiente] || {
    soda: 0,
    b10: 0,
    b20: 0
  };
  // "Para llenar" (calculado) = de los vacíos que vuelven HOY, cuántos hacen
  // falta llenar para completar lo que se necesita mañana — teniendo en
  // cuenta lo que YA había en sodería de días anteriores, no solo lo de hoy.
  // El resto de los vacíos de hoy queda sin urgencia.
  const paraLlenarCalc = {
    soda: 0,
    b10: 0,
    b20: 0
  };
  const vaciosRestoCalc = {
    soda: 0,
    b10: 0,
    b20: 0
  };
  ["soda", "b10", "b20"].forEach(pk => {
    const sk = planKeyToSk[pk];
    const llenosHoy = pk === "soda" ? Math.floor(sobrantes[pk] / CAJON) : sobrantes[pk];
    const vaciosHoy = pk === "soda" ? Math.floor(vaciosRec[pk] / CAJON) : vaciosRec[pk];
    const llenosYaHabia = pk === "soda" ? Math.floor((soderiaActual[sk] || 0) / CAJON) : soderiaActual[sk] || 0;
    const necDisp = pk === "soda" ? Math.ceil((necesarioManana[pk] || 0) / CAJON) : necesarioManana[pk] || 0;
    // Cuánto falta, contando lo que ya había sentado en sodería + lo que vuelve hoy
    const falta = Math.max(0, necDisp - llenosYaHabia - llenosHoy);
    paraLlenarCalc[pk] = Math.min(falta, vaciosHoy); // no se puede llenar más de lo que vuelve vacío hoy
    vaciosRestoCalc[pk] = Math.max(0, vaciosHoy - paraLlenarCalc[pk]);
  });
  const planKeyToSkL = {
    "soda": "sifon",
    "b10": "bidon10",
    "b20": "bidon20"
  };
  // Calcula cuánto hay que sumar o sacar del Depósito para que sodería
  // vuelva a su número fijo (ver notas abajo). Se separa de confirmarCierre
  // para poder mostrar el mismo resultado en el cartel de confirmación
  // ANTES de tocar el stock — pedido del usuario: que la app avise y
  // pregunte antes de mover algo del/al depósito.
  const calcularMovimientoDeposito = () => {
    // Usar valores reales si el usuario los modificó, si no usar los calculados
    const llenVuelta = {
      soda: 0,
      b10: 0,
      b20: 0
    };
    const vacVuelta = {
      soda: 0,
      b10: 0,
      b20: 0
    };
    ["soda", "b10", "b20"].forEach(pk => {
      const calcL = sobrantes[pk];
      const calcPL = paraLlenarCalc[pk];
      const calcV = vaciosRestoCalc[pk];
      const cajon = pk === "soda" ? CAJON : 1;
      const sueltosLL = pk === "soda" ? sobrantes[pk] % CAJON : 0;
      // BUG REAL (causa de "falta un cajón" en el cierre): vaciosRestoCalc
      // sale de un Math.floor(vaciosRec/CAJON) — los sifones vacíos que
      // sobran sin completar un cajón entero (0 a 5) se perdían acá y no
      // volvían a aparecer en ningún lado. Los llenos SÍ se salvaban con
      // "sueltosLL" (ver arriba); a vacíos le faltaba el mismo tratamiento.
      // Un cajón físico que tiene, por ejemplo, 3 sifones vacíos (no lleno
      // el cajón entero de vacíos) igual tiene esos 3 vacíos reales — hay
      // que sumarlos, no descartarlos.
      const sueltosVV = pk === "soda" ? vaciosRec[pk] % CAJON : 0;
      const llenosReal = realesLlenos[pk] !== "" ? Number(realesLlenos[pk]) * cajon + sueltosLL : calcL;
      const paraLlenarReal = realesParaLlenar[pk] !== "" ? Number(realesParaLlenar[pk]) * cajon : calcPL * cajon;
      const vaciosReal = (realesVacios[pk] !== "" ? Number(realesVacios[pk]) * cajon : calcV * cajon) + sueltosVV;
      // "Para llenar" se llena antes de salir mañana — para el stock ya
      // cuenta como LLENO, no como vacío (aunque hoy físicamente esté vacío).
      llenVuelta[pk] = llenosReal + paraLlenarReal;
      vacVuelta[pk] = vaciosReal;
    });
    // Registrar diferencias para auditoría
    const diffs = {};
    ["soda", "b10", "b20"].forEach(pk => {
      const dl = llenVuelta[pk] - sobrantes[pk];
      const dv = vacVuelta[pk] - vaciosRec[pk];
      if (dl !== 0 || dv !== 0) diffs[pk] = {
        llenos: dl,
        vacios: dv
      };
    });
    // REDISEÑADO 2026-10-14: antes, acá se forzaba a que lo que vuelve a
    // sodería sea SIEMPRE exactamente "lo que salió cargado" (esperado),
    // escalando llenVuelta/vacVuelta con un factor para que sumen justo eso
    // — cualquier diferencia real (una devolución de envases viejos, un
    // préstamo, una pérdida) se mandaba entera al Depósito en vez de
    // reflejarse en sodería. Resultado reportado por el usuario: devolvían
    // envases y "no se registraba nada en sodería" — el factor los
    // absorbía para mantener el número fijo, y el Depósito (rotulado en
    // Stock como "vacíos nuevos, sin uso") terminaba siendo un bolsón de
    // diferencias que no le correspondían.
    // Ahora sodería recibe el conteo REAL de hoy tal cual (llenVuelta +
    // vacVuelta, sin escalar) — si devolvieron algo, sube; si se prestó o
    // se perdió algo, baja.
    // SEGUNDA VUELTA 2026-10-14: sodería SÍ se vincula con Depósito, y es
    // en los DOS sentidos — al cerrar, el total de sodería (lo que quedó
    // sin cargar + lo que vuelve) se compara contra la Base de ese
    // producto: si sobra, el excedente pasa a Depósito; si falta, el
    // faltante se completa automáticamente sacándolo de Depósito (son
    // envases vacíos sin usar todavía, listos para llenar). Si Depósito no
    // tiene suficiente para cubrir el faltante, se saca lo que haya y
    // sodería queda corta en el resto (no se puede sacar de donde no hay).
    // Ejemplo real del usuario: sodería con Base 20 (bidón 10L), salen 7
    // cargados, vuelven 1 lleno + 6 vacíos (ventas) + 2 vacíos (una
    // devolución vieja, sin venta) = 9; más los 13 que quedaron sin cargar
    // = 22. Como la Base es 20, los 2 de más pasan a Depósito y sodería se
    // queda en 20.
    const llenVueltaFijo = {},
      vacVueltaFijo = {};
    const diffBase = {},
      movDeposito = {}; // > 0: entra a Depósito · < 0: sale de Depósito
    ["soda", "b10", "b20"].forEach(pk => {
      const sk = planKeyToSkL[pk];
      llenVueltaFijo[pk] = Math.max(0, Math.round(llenVuelta[pk]));
      vacVueltaFijo[pk] = Math.max(0, Math.round(vacVuelta[pk]));
      const baseRef = baseRefFor(sk);
      const quedoLleno = (soderiaActual[sk] || 0) + llenVueltaFijo[pk];
      const quedoVacio = (soderiaVaciosActual[sk] || 0) + vacVueltaFijo[pk];
      diffBase[pk] = quedoLleno + quedoVacio - baseRef;
      if (diffBase[pk] > 0) {
        // Sobra: el excedente sale primero de los vacíos que vuelven (ahí
        // es donde entran las devoluciones de más); si no alcanza, se saca
        // de los llenos. Lo que efectivamente se sacó es lo que entra a
        // Depósito.
        let restante = diffBase[pk];
        const deVacios = Math.min(restante, vacVueltaFijo[pk]);
        vacVueltaFijo[pk] -= deVacios;
        restante -= deVacios;
        const deLlenos = Math.min(restante, llenVueltaFijo[pk]);
        llenVueltaFijo[pk] -= deLlenos;
        restante -= deLlenos;
        movDeposito[pk] = deVacios + deLlenos;
      } else if (diffBase[pk] < 0) {
        // Falta: se completa con lo que haya en Depósito, como vacíos
        // (envases sin usar todavía, listos para llenar mañana).
        const faltante = -diffBase[pk];
        const disponibleDeposito = stock?.casa?.[sk] || 0;
        const aTomar = Math.min(faltante, disponibleDeposito);
        vacVueltaFijo[pk] += aTomar;
        movDeposito[pk] = -aTomar;
      } else {
        movDeposito[pk] = 0;
      }
    });
    return {
      diffs,
      diffBase,
      movDeposito,
      llenVueltaFijo,
      vacVueltaFijo
    };
  };
  const confirmarCierre = () => {
    if (enviandoCierre) return;
    // Bloquear el botón de inmediato: sin este freno, un doble-toque podía
    // ejecutar confirmarCierre() dos veces seguidas y sumar los mismos
    // envases a sodería dos veces (causa real de acumulación de envases,
    // encontrada y corregida en Individual/Multiple — mismo arreglo acá).
    setEnviandoCierre(true);
    localStorage.setItem(cierreKey, "1"); // marcar como confirmado
    const {
      diffs,
      diffBase,
      movDeposito,
      llenVueltaFijo,
      vacVueltaFijo
    } = calcularMovimientoDeposito();
    setStock(prev => {
      const s = JSON.parse(JSON.stringify(prev || {}));
      if (!s.soderia) s.soderia = {
        sifon: 0,
        bidon10: 0,
        bidon20: 0
      };
      if (!s.soderia_vacios) s.soderia_vacios = {
        sifon: 0,
        bidon10: 0,
        bidon20: 0
      };
      if (!s.casa) s.casa = {
        sifon: 0,
        bidon10: 0,
        bidon20: 0
      };
      ["soda", "b10", "b20"].forEach(pk => {
        const sk = planKeyToSkL[pk];
        s.soderia[sk] = (s.soderia[sk] || 0) + llenVueltaFijo[pk];
        s.soderia_vacios[sk] = (s.soderia_vacios[sk] || 0) + vacVueltaFijo[pk];
        // Depósito se mueve en los dos sentidos acá — ver nota en
        // calcularMovimientoDeposito. Si sobró, suma; si faltó y había
        // stock en depósito, resta (ya viene recortado a lo disponible).
        if (movDeposito[pk]) s.casa[sk] = Math.max(0, (s.casa[sk] || 0) + movDeposito[pk]);
      });
      syncData && syncData({
        stock: s
      });
      return s;
    });
    if (window._lcRegistrarMovimientoStock) {
      const detalleCierre = {};
      ["soda", "b10", "b20"].forEach(pk => {
        const sk = planKeyToSkL[pk];
        const soderiaVuelta = (llenVueltaFijo[pk] || 0) + (vacVueltaFijo[pk] || 0);
        const dif = diffBase[pk] || 0;
        const aDeposito = movDeposito[pk] || 0;
        // "dif" = cuánto difirió de la Base de sodería; "aDeposito" = lo
        // que efectivamente se movió con Depósito (+ entra, − sale).
        if (soderiaVuelta || dif) detalleCierre[sk] = {
          soderia: soderiaVuelta,
          dif,
          aDeposito
        };
      });
      window._lcRegistrarMovimientoStock("cierre", detalleCierre, `Cierre del día ${dia} (${fecha})`);
    }
    onGuardar({
      ...datos,
      _diaCerrado: true,
      _stockActualizado: true,
      _cierreDiffs: Object.keys(diffs).length > 0 ? diffs : null
    });
    setMostrarCierre(false);
    setMostrarConfirmDeposito(false);
  };
  // Antes de cerrar, si hace falta agregar o sacar algo del Depósito (porque
  // sobra o falta en sodería), se pregunta primero — si no hace falta mover
  // nada, se cierra directo sin molestar con un cartel de más.
  const intentarCerrar = () => {
    if (enviandoCierre) return;
    const { diffBase } = calcularMovimientoDeposito();
    const hayMovimiento = ["soda", "b10", "b20"].some(pk => diffBase[pk] !== 0);
    if (hayMovimiento) setMostrarConfirmDeposito(true);else confirmarCierre();
  };
  const setProd = (pid, campo, v) => setDatos(d => ({
    ...d,
    productos: {
      ...d.productos,
      [pid]: {
        ...d.productos[pid],
        [campo]: v
      }
    }
  }));
  const setGasto = (i, campo, v) => {
    const g = [...(datos.gastos || [])];
    g[i] = {
      ...g[i],
      [campo]: v
    };
    setDatos(d => ({
      ...d,
      gastos: g
    }));
  };
  const addGasto = () => setDatos(d => ({
    ...d,
    gastos: [...(d.gastos || []), {
      cat: "propina",
      monto: ""
    }]
  }));
  const delGasto = i => setDatos(d => ({
    ...d,
    gastos: d.gastos.filter((_, j) => j !== i)
  }));
  const totalGastos = (datos.gastos || []).filter(g => g.confirmado).reduce((a, g) => a + num(g.monto), 0);
  const efectivo = num(datos.efectivo),
    fiado = num(datos.fiado),
    retenciones = num(datos.retenciones);
  const sobrante = efectivo - (totalVentaPlata - fiado); // retenciones es informativo, no afecta el sobrante
  const ganancia = cobEfectivo - totalVentaLlenar - totalGastos + cobTransNeto;
  // Antes sumaba unidades sueltas de los 3 productos (bidones + sifones)
  // sin más — mezclaba "39 bidones" con "90 sifones" en un solo número que
  // no significaba nada real. Todo en este negocio se piensa en bultos
  // (igual que "Bultos auto" arriba), así que el total de abajo usa la
  // misma cuenta: sifones a cajón, bidones 1 bulto cada uno.
  const totalBultosIngresados = calcCajones(num(datos.productos.soda?.llenos)) + num(datos.productos.b10?.llenos) + num(datos.productos.b20?.llenos);

  // ── Early return: pantalla de cierre ─────────────────────────────
  // Pedido del usuario: nada de recuento manual (Fijo/Lleno/Para llenar/
  // Vacío con inputs editables) — eso se sacó de la vista. Lo que se
  // muestra es: 1) cuánto sale, vuelve y queda en sodería por producto
  // (se calcula solo, igual que antes, sólo que ya no se expone el
  // ajuste manual en pantalla), 2) el mismo detalle de envases por
  // cliente que ya se ve en la planilla normal, y 3) un solo botón
  // "Confirmar" que llama a confirmarCierre() directo — sin el popup
  // de "Diferencia respecto a la Base" de antes (el ajuste automático
  // contra Depósito sigue pasando igual adentro de confirmarCierre()).
  if (mostrarCierre) {
    const movSoderia = [["Sifón", "soda"], ["Bidón 10L", "b10"], ["Bidón 20L", "b20"]];
    return /*#__PURE__*/React.createElement("div", {
      style: s.screen
    }, /*#__PURE__*/React.createElement(HeaderApp, {
      titulo: `Cierre del día · ${dia}`,
      onVolver: () => setMostrarCierre(false)
    }), /*#__PURE__*/React.createElement("div", {
      style: { padding: 16 }
    }, /*#__PURE__*/React.createElement("div", {
      style: { ...s.card, margin: "0 0 12px", padding: "14px 16px" }
    }, /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }
    }, "🧴 Movimiento de la sodería"), /*#__PURE__*/React.createElement("p", {
      style: { fontSize: 11, color: "var(--color-text-tertiary)", margin: "0 0 10px" }
    }, "Lo que salió, lo que volvió y lo que queda. Se calcula solo."), /*#__PURE__*/React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 4, fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 4 }
    }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Salió"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Volvió"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Queda")), movSoderia.map(([label, pk]) => {
      const cajon = pk === "soda" ? CAJON : 1;
      const div = n => pk === "soda" ? Math.floor(n / cajon) : n;
      const sueltosVV = pk === "soda" ? vaciosRec[pk] % cajon : 0;
      const llenReal = sobrantes[pk];
      const vacReal = vaciosRestoCalc[pk] * cajon + sueltosVV;
      const salio = llenosCargados[pk];
      const volvio = llenReal + vacReal;
      const sk = planKeyToSk[pk];
      const queda = (soderiaActual[sk] || 0) + llenReal + (soderiaVaciosActual[sk] || 0) + vacReal;
      return /*#__PURE__*/React.createElement("div", {
        key: pk,
        style: { display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 4, alignItems: "center", padding: "7px 0", borderTop: "0.5px solid var(--color-border-tertiary)" }
      }, /*#__PURE__*/React.createElement("span", { style: { fontSize: 13, color: "var(--color-text-primary)" } }, label), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" } }, div(salio)), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 14, fontWeight: 600, color: "var(--color-text-success)" } }, div(volvio)), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" } }, div(queda)));
    })), (() => {
      // Misma tarjeta "Movimiento de envases de hoy" (con Detalle por
      // cliente) que ya se ve en la planilla normal — se reusa tal cual
      // para que el cierre muestre exactamente lo mismo.
      const movLabels = [["Sifón", "soda"], ["Bidón 10L", "b10"], ["Bidón 20L", "b20"], ["Dispenser", "disp"]];
      const dv = (pk, n) => n;
      const PROD_LBL = { soda: "Sifón", b10: "Bidón 10L", b20: "Bidón 20L", disp: "Dispenser" };
      const porClienteEnv = {};
      const addMovCliente = (nombre, tipo, texto) => {
        const key = (nombre || "").trim() || "Sin nombre";
        if (!porClienteEnv[key]) porClienteEnv[key] = { prestado: [], devuelto: [] };
        porClienteEnv[key][tipo].push(texto);
      };
      ventas.forEach(v => {
        (v.envPrest || []).forEach(e => {
          const cant = Number(e.cant) || 0;
          if (cant > 0) addMovCliente(v.cliente, "prestado", `${cant} ${e.prod}`);
        });
        (v.envDev || []).forEach(e => {
          const cant = Number(e.cant) || 0;
          if (cant > 0) addMovCliente(v.cliente, "devuelto", `${cant} ${e.prod}`);
        });
      });
      (movStock || []).forEach(m => {
        if (m.tipo !== "ajuste" || (m.fecha || "").slice(0, 10) !== fecha) return;
        if (!(m.nota || "").startsWith("Envases fijos de cliente")) return;
        const nombre = (m.nota.split(" — ")[1] || "").trim();
        if (!nombre) return;
        Object.keys(skToPl).forEach(sk => {
          const d = Number(m.detalle?.[sk]) || 0;
          if (!d) return;
          const pk = skToPl[sk];
          const lbl = PROD_LBL[pk];
          if (d < 0) addMovCliente(nombre, "prestado", `${-d} ${lbl} (fijo)`);else addMovCliente(nombre, "devuelto", `${d} ${lbl} (fijo)`);
        });
      });
      (dispMovs || []).forEach(m => {
        const nombre = m.clienteNombre;
        if (!nombre || !m.delta) return;
        if (m.delta > 0) addMovCliente(nombre, "prestado", `${m.delta} Dispenser`);else addMovCliente(nombre, "devuelto", `${-m.delta} Dispenser`);
      });
      (movStock || []).forEach(m => {
        if (m.tipo !== "retiro" || (m.fecha || "").slice(0, 10) !== fecha) return;
        const nombre = (m.nota || "").replace("Cliente retirado:", "").trim();
        if (!nombre) return;
        const partes = Object.keys(skToPl).map(sk => {
          const d = Number(m.detalle?.[sk]) || 0;
          return d ? `${d} ${PROD_LBL[skToPl[sk]]}` : null;
        }).filter(Boolean);
        if (partes.length) addMovCliente(nombre, "devuelto", `${partes.join(", ")} (baja de cliente)`);
      });
      const nombresConMovEnv = Object.keys(porClienteEnv).sort((a, b) => a.localeCompare(b, "es"));
      return /*#__PURE__*/React.createElement("div", {
        style: { ...s.card, margin: "0 0 12px", padding: "14px 16px" }
      }, /*#__PURE__*/React.createElement("div", {
        style: { fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }
      }, "📋 Movimiento de envases de hoy"), /*#__PURE__*/React.createElement("p", {
        style: { fontSize: 11, color: "var(--color-text-tertiary)", margin: "0 0 8px" }
      }, "Préstamos, devoluciones, pérdidas, retiros y altas nuevas registrados en el día."), /*#__PURE__*/React.createElement("div", {
        style: { display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr 1fr 1fr", gap: 4, fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 4 }
      }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Prestado"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Devuelto"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Perdido"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Retirado"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Cliente nuevo")), movLabels.map(([label, pk]) => {
        const devueltoTotal = (devueltosDia[pk] || 0) + (devueltosFijoDia[pk] || 0);
        return /*#__PURE__*/React.createElement("div", {
          key: pk,
          style: { display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr 1fr 1fr", gap: 4, alignItems: "center", padding: "5px 0", borderTop: "0.5px solid var(--color-border-tertiary)" }
        }, /*#__PURE__*/React.createElement("span", { style: { fontSize: 12, color: "var(--color-text-primary)" } }, label), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 12, color: prestadosDia[pk] ? "var(--color-text-warning)" : "var(--color-text-tertiary)" } }, dv(pk, prestadosDia[pk]) || "—"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 12, color: devueltoTotal ? "var(--color-text-success)" : "var(--color-text-tertiary)" } }, dv(pk, devueltoTotal) || "—"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 12, color: perdidosDia[pk] ? "#ff6b6b" : "var(--color-text-tertiary)" } }, dv(pk, perdidosDia[pk]) || "—"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 12, color: retiradosDia[pk] ? "var(--color-text-secondary)" : "var(--color-text-tertiary)" } }, dv(pk, retiradosDia[pk]) || "—"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 12, color: clientesNuevosDia[pk] ? "#5daaff" : "var(--color-text-tertiary)" } }, dv(pk, clientesNuevosDia[pk]) || "—"));
      }), nombresConMovEnv.length > 0 && /*#__PURE__*/React.createElement("div", {
        style: { margin: "10px 0 0", borderRadius: 12, overflow: "hidden", border: "1.5px solid #185FA5", background: "var(--color-background-info)" }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => setMostrarDetalleClientesEnv(v => !v),
        style: { width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }
      }, /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", alignItems: "center", gap: 8 }
      }, /*#__PURE__*/React.createElement("span", {
        style: { fontSize: 16 }
      }, "👥"), /*#__PURE__*/React.createElement("span", {
        style: { fontSize: 13, fontWeight: 500, color: "var(--color-text-info)" }
      }, "Detalle por cliente"), /*#__PURE__*/React.createElement("span", {
        style: { fontSize: 11, color: "var(--color-text-tertiary)" }
      }, nombresConMovEnv.length, " cliente", nombresConMovEnv.length === 1 ? "" : "s")), /*#__PURE__*/React.createElement("span", {
        style: { color: "var(--color-text-info)", fontSize: 14, display: "inline-block", transform: mostrarDetalleClientesEnv ? "rotate(180deg)" : "rotate(0deg)" }
      }, "▾")), mostrarDetalleClientesEnv && /*#__PURE__*/React.createElement("div", {
        style: { padding: "0 16px 12px" }
      }, nombresConMovEnv.map(nombre => {
        const mov = porClienteEnv[nombre];
        return /*#__PURE__*/React.createElement("div", {
          key: nombre,
          style: { padding: "6px 0", borderTop: "0.5px solid var(--color-border-tertiary)" }
        }, /*#__PURE__*/React.createElement("div", {
          style: { fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 2 }
        }, nombre), /*#__PURE__*/React.createElement("div", {
          style: { display: "flex", flexWrap: "wrap", gap: 6 }
        }, mov.prestado.length > 0 && /*#__PURE__*/React.createElement("span", {
          style: { fontSize: 11, fontWeight: 600, color: "#f5b942", background: "rgba(245,185,66,0.15)", padding: "2px 7px", borderRadius: 6 }
        }, "📦 Prestó: ", mov.prestado.join(", ")), mov.devuelto.length > 0 && /*#__PURE__*/React.createElement("span", {
          style: { fontSize: 11, fontWeight: 600, color: "#1D9E75", background: "rgba(29,158,117,0.15)", padding: "2px 7px", borderRadius: 6 }
        }, "↩️ Devolvió: ", mov.devuelto.join(", "))));
      }))));
    })(), /*#__PURE__*/React.createElement("button", {
      style: {
        width: "100%",
        padding: "16px",
        borderRadius: 10,
        border: "none",
        background: "#1d9e75",
        color: "#fff",
        fontSize: 15,
        fontWeight: 700,
        cursor: enviandoCierre ? "default" : "pointer",
        opacity: enviandoCierre ? 0.7 : 1
      },
      disabled: enviandoCierre,
      onClick: confirmarCierre
    }, enviandoCierre ? "⏳ Cerrando día..." : "✓ Confirmar")));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: `Planilla · ${dia}`,
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 14px",
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 2,
      marginTop: -4,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, fecha), planilla._autoGuardado && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#4dd9a0",
      fontWeight: 500
    }
  }, "✓ Auto-guardado"), planilla._stockActualizado && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "var(--color-text-info)",
      fontWeight: 500
    }
  }, "📦 Stock actualizado"), onEditarCarga && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-info)",
      fontWeight: 500,
      cursor: "pointer",
      textDecoration: "underline"
    },
    onClick: onEditarCarga
  }, "✏️ Editar envases con los que salió"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...s.sectionTitle,
      padding: "0 0 8px"
    }
  }, "Al salir a repartir"), /*#__PURE__*/React.createElement("div", {
    style: s.grid3
  }, [["fecha", "Fecha", "text"], ["peso", "Peso kg", "number"], ["bultos", "Bultos", "number"]].map(([k, l, t]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, l), /*#__PURE__*/React.createElement("input", {
    style: s.inputNum,
    type: t,
    placeholder: t === "text" ? "dd/mm/aaaa" : "0",
    value: datos[k] || "",
    onChange: e => set(k, e.target.value)
  })))), (pesoAuto > 0 || bultosAuto > 0) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      marginBottom: 10,
      lineHeight: 1.7,
      background: "var(--color-background-tertiary)",
      borderRadius: 8,
      padding: "6px 10px"
    }
  }, bultosAuto > 0 && /*#__PURE__*/React.createElement("div", null, "📦 ", /*#__PURE__*/React.createElement("b", null, "Bultos auto:"), " ", cajonesCargados, " cajones soda + ", b10Cargados, " bid.10L + ", b20Cargados, " bid.20L = ", /*#__PURE__*/React.createElement("b", null, bultosAuto)), pesoAuto > 0 && /*#__PURE__*/React.createElement("div", null, "⚖️ ", /*#__PURE__*/React.createElement("b", null, "Peso auto:"), " ", cajonesCargados, "×13kg + ", b10Cargados, "×10kg + ", b20Cargados, "×20kg = ", /*#__PURE__*/React.createElement("b", null, pesoAuto, " kg"))), /*#__PURE__*/React.createElement("span", {
    style: {
      ...s.sectionTitle,
      padding: "12px 0 8px"
    }
  }, "Envases cargados (solo ingresá los llenos)"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-background-secondary)",
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
      padding: "6px 10px",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, ["Producto", "Llenos", "Vacíos", "Plata", "Llenar"].map(h => /*#__PURE__*/React.createElement("div", {
    key: h,
    style: {
      fontSize: 11,
      color: "var(--color-text-secondary)",
      fontWeight: 500,
      textAlign: h === "Producto" ? "left" : "right"
    }
  }, h))), PRODUCTOS_CONFIG.map(p => {
    const auto = totalesPorProd[p.id];
    const esSoda = p.id === "soda";
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
        padding: "6px 10px",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 500,
        color: "var(--color-text-primary)"
      }
    }, p.nombre), esSoda && auto.cajones > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#f5b942"
      }
    }, auto.cajones, " caj. (", auto.vacios, " un.)")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
      type: "number",
      style: {
        ...s.inputNum,
        width: "100%",
        fontSize: 13
      },
      value: datos.productos[p.id]?.llenos || "",
      onChange: e => setProd(p.id, "llenos", e.target.value),
      placeholder: "0"
    }), esSoda && datos.productos[p.id]?.llenos > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--color-text-tertiary)",
        textAlign: "right"
      }
    }, Math.floor((datos.productos[p.id]?.llenos || 0) / 6), " caj.")), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        fontSize: 13,
        color: "var(--color-text-secondary)"
      }
    }, esSoda ? `${auto.cajones || "—"} caj` : auto.vacios || "—"), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        fontSize: 13,
        color: "var(--color-text-primary)"
      }
    }, auto.plata ? fmt(auto.plata).replace("$", "") : "—"), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        fontSize: 13,
        color: "var(--color-text-danger)"
      }
    }, auto.llenar ? fmt(auto.llenar).replace("$", "") : "—"));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
      padding: "8px 10px",
      background: "var(--color-background-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)",
      fontWeight: 500
    }
  }, "Totales"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, totalBultosIngresados || "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, Object.values(totalesPorProd).reduce((a, p) => a + (p.cajones != null ? p.cajones : p.vacios), 0) || "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, totalVentaPlata ? fmt(totalVentaPlata).replace("$", "") : "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-danger)"
    }
  }, totalVentaLlenar ? fmt(totalVentaLlenar).replace("$", "") : "—"))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      marginBottom: 12
    }
  }, "Vacíos, plata y llenar se calculan automáticamente desde las ventas del día."), /*#__PURE__*/React.createElement("div", {
    style: s.divider
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-secondary)",
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.06em"
    }
  }, "Gastos extras (efectivo)"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 12,
      padding: "4px 12px"
    },
    onClick: addGasto
  }, "+ Agregar")), (datos.gastos || []).length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--color-text-tertiary)",
      marginBottom: 8
    }
  }, "Sin gastos extras"), (datos.gastos || []).map((g, i) => g.confirmado ? /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...s.card,
      margin: "0 0 6px",
      background: "var(--color-background-tertiary)",
      borderLeft: "3px solid #4dd9a0",
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, g.cat.charAt(0).toUpperCase() + g.cat.slice(1), g.desc ? ` · ${g.desc}` : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-danger)",
      marginTop: 2
    }
  }, "−", fmt(num(g.monto)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "3px 10px"
    },
    onClick: () => setGasto(i, "confirmado", false)
  }, "Editar"), /*#__PURE__*/React.createElement("button", {
    style: s.btnDanger,
    onClick: () => delGasto(i)
  }, "✕")))) : /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...s.card,
      margin: "0 0 6px",
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("select", {
    style: {
      ...s.select,
      flex: 1
    },
    value: g.cat,
    onChange: e => setGasto(i, "cat", e.target.value)
  }, GASTOS_CATEGORIAS.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c.charAt(0).toUpperCase() + c.slice(1)))), /*#__PURE__*/React.createElement("input", {
    style: {
      ...s.inputNum,
      flex: 1
    },
    type: "number",
    placeholder: "Monto $",
    value: g.monto || "",
    onChange: e => setGasto(i, "monto", e.target.value)
  })), /*#__PURE__*/React.createElement("input", {
    style: {
      ...s.input,
      marginBottom: 6
    },
    placeholder: "Descripción (opcional)",
    value: g.desc || "",
    onChange: e => setGasto(i, "desc", e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 1,
      padding: "7px",
      borderRadius: 8,
      border: "none",
      background: "#0a2e1f",
      color: "#4dd9a0",
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer",
      opacity: !g.monto ? 0.5 : 1
    },
    disabled: !g.monto,
    onClick: () => {
      const nuevosGastos = (datos.gastos || []).map((g2, j) => j === i ? {
        ...g2,
        confirmado: true
      } : g2);
      setDatos(d => ({
        ...d,
        gastos: nuevosGastos
      }));
      onAutoGuardar && onAutoGuardar({
        ...datos,
        gastos: nuevosGastos
      });
    }
  }, "✓ Confirmar y guardar"), /*#__PURE__*/React.createElement("button", {
    style: s.btnDanger,
    onClick: () => delGasto(i)
  }, "✕")))), totalGastos > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      borderTop: "0.5px solid var(--color-border-tertiary)",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)"
    }
  }, "Total gastos extras"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-text-danger)"
    }
  }, "−", fmt(totalGastos))), /*#__PURE__*/React.createElement("div", {
    style: s.divider
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...s.sectionTitle,
      padding: "0 0 10px"
    }
  }, "Resumen del día"), todasVentasDia.length > 0 ? /*#__PURE__*/React.createElement(DetalleVentasDia, {
    ventas: todasVentasDia,
    clientes: clientes,
    noVisitas: noVisitas,
    dia: dia,
    fecha: fecha,
    productos: productos,
    todasLasVentas: todasLasVentas,
    onEditarVenta: onEditarVenta,
    onEliminarVenta: onEliminarVenta,
    onEditarCliente: onEditarCliente,
    onPerdidaCliente: onPerdidaCliente,
    onConfirmarTransfer: onConfirmarTransfer,
    onRegistrarNoVisita: onRegistrarNoVisita,
    onQuitarNoVisita: onQuitarNoVisita
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 8px",
      padding: "12px 16px",
      background: "var(--color-background-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-tertiary)"
    }
  }, "📋 Sin ventas registradas para este día")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 8px",
      background: "var(--color-background-secondary)",
      padding: "14px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-secondary)",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    }
  }, "Ventas registradas"), [["Contado (efectivo)", fmt(cobEfectivo), "primary"], ["Transferencias", fmt(cobTransBruto), "info"], ["Fiado del día", fmt(cobFiado), "warning"]].map(([l, v, c]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)"
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: `var(--color-text-${c})`
    }
  }, v))), cobSaldosEfec > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)"
    }
  }, "+ Cobro deuda · efectivo"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-text-success)"
    }
  }, fmt(cobSaldosEfec))), cobSaldosTrans > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)"
    }
  }, "+ Cobro deuda · transferencia"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-text-info)"
    }
  }, fmt(cobSaldosTrans))), cobSaldoUsado > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)"
    }
  }, "💳 Pagado con saldo a favor"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "#b794f6"
    }
  }, fmt(cobSaldoUsado))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0 2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "Total cobrado"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, fmt(cobEfectivo + cobTransBruto)))), ventasExtraDia.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 8px",
      background: "var(--color-background-secondary)",
      padding: "14px 16px",
      borderLeft: "3px solid var(--color-border-info)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setMostrarExtraDia(v => !v),
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      marginBottom: mostrarExtraDia ? 8 : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-info)",
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    }
  }, "📦 Ventas de otros días (", ventasExtraDia.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 6 }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-text-info)"
    }
  }, fmt(extraTotal)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-text-info)",
      fontSize: 14,
      display: "inline-block",
      transform: mostrarExtraDia ? "rotate(180deg)" : "rotate(0deg)"
    }
  }, "▾"))), mostrarExtraDia && /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 4 }
  }, ventasExtraDia.map(v => {
    const c = (clientes || []).find(x => x.id === v.clienteId);
    return /*#__PURE__*/React.createElement("div", {
      key: v.id,
      style: {
        display: "flex",
        justifyContent: "space-between",
        padding: "5px 0",
        borderBottom: "0.5px solid var(--color-border-tertiary)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-secondary)"
      }
    }, c?.nombre || "Cliente", " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--color-text-tertiary)"
      }
    }, "· ", c?.dia)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: "var(--color-text-info)"
      }
    }, fmt((v.pagadoNum != null ? v.pagadoNum : v.neto) || 0)));
  }), extraEfectivo > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "3px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, "Contado"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-primary)"
    }
  }, fmt(extraEfectivo))), extraTrans > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "3px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, "Transfer."), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-info)"
    }
  }, fmt(extraTrans))), extraFiado > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "3px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, "Fiado"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-warning)"
    }
  }, fmt(extraFiado))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0 2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "Total otros días"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: "var(--color-text-info)"
    }
  }, fmt(extraTotal))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 8px",
      padding: "14px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-secondary)",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    }
  }, "Efectivo en mano"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)"
    }
  }, "Efectivo cobrado (contado)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-primary)"
    }
  }, fmt(cobEfectivo))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-danger)"
    }
  }, "− Llenado de envases"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-danger)"
    }
  }, fmt(totalVentaLlenar))), totalGastos > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-danger)"
    }
  }, "− Gastos extras"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-danger)"
    }
  }, fmt(totalGastos))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0 2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "Efectivo en mano"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 500,
      color: cobEfectivo - totalVentaLlenar - totalGastos >= 0 ? "var(--color-text-success)" : "var(--color-text-danger)"
    }
  }, fmt(cobEfectivo - totalVentaLlenar - totalGastos)))), cobTransBruto > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 8px",
      padding: "14px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-secondary)",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    }
  }, "Transferencias"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)"
    }
  }, "Monto total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-primary)"
    }
  }, fmt(cobTransBruto))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)"
    }
  }, "Retención 2.5% (informativo)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-text-danger)"
    }
  }, "−", fmt(cobTransDesc))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0 2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "Neto a acreditar"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: "var(--color-text-info)"
    }
  }, fmt(cobTransNeto))), (() => {
    // Transferencias puras del día + parte transferencia de pagos mixtos
    // (mismo fix de raíz: solo clientes propios de este día, nunca de otro)
    const mixtoTransDia = ventas.filter(v => v._esMixtoTrans && v.fechaKey === fecha && clientesDia.has(v.clienteId));
    const transDelDia = [...todasVentasDia.filter(v => v.pago === "transferencia"), ...mixtoTransDia];
    if (!transDelDia.length) return null;
    return /*#__PURE__*/React.createElement(DetalleTransferencias, {
      ventas: transDelDia,
      ventasPendTrans: ventasPendTrans,
      clientes: clientes,
      onConfirmarTransfer: onConfirmarTransfer
    });
  })()), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 8px",
      padding: "14px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-secondary)",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    }
  }, "Fiado pendiente"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)"
    }
  }, "Fiado del día"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-primary)"
    }
  }, fmt(cobFiado))), cobSaldos > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)"
    }
  }, "− Cobros de saldos anteriores"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-success)"
    }
  }, "−", fmt(cobSaldos))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0 2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "Fiado neto pendiente"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: fiadoNeto > 0 ? "var(--color-text-warning)" : "var(--color-text-success)"
    }
  }, fmt(Math.abs(fiadoNeto)), fiadoNeto < 0 ? " (a favor)" : ""))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 16px",
      padding: "14px 16px",
      background: "var(--color-background-secondary)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "Ganancia neta del día"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      marginTop: 2
    }
  }, "Efectivo en mano + Transferencias netas")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 500,
      color: ganancia >= 0 ? "var(--color-text-success)" : "var(--color-text-danger)"
    }
  }, fmt(ganancia)))), (() => {
    // Pedido del usuario: ver el movimiento de envases del día (prestado,
    // devuelto, perdido, retirado, cliente nuevo) directamente en la
    // planilla de siempre, SIN tener que entrar al flujo de "Cerrar el
    // día" — antes esta tarjeta sólo existía adentro de ese flujo
    // (gateado por mostrarCierre, con un return temprano), así que una
    // vez cerrado el día (o si autoCierre no la disparaba) no se veía
    // en ningún lado. Reusa los mismos datos ya calculados más arriba
    // (prestadosDia/devueltosDia/perdidosDia/retiradosDia/
    // clientesNuevosDia/devueltosFijoDia), filtrados por "fecha" (la de
    // esta planilla), para que coincida con la tarjeta del cierre.
    const movLabels = [["Sifón", "soda"], ["Bidón 10L", "b10"], ["Bidón 20L", "b20"], ["Dispenser", "disp"]];
    // OJO: acá se muestra en UNIDADES para los 4 productos (antes el Sifón
    // se dividía por CAJON=6, como en la pantalla de Cierre) — pedido del
    // usuario: "la parte de arriba no coincide con lo de abajo". El detalle
    // por cliente, más abajo, siempre mostró unidades (así vienen
    // envPrest/envDev), así que dividir el Sifón acá arriba hacía que la
    // tabla y el detalle no coincidieran nunca para ese producto.
    const dv = (pk, n) => n;
    // Detalle por cliente — pedido del usuario: "que se vea quien fue el
    // que devolvio y a quien se le presto", no solo el total agregado.
    const PROD_LBL = { soda: "Sifón", b10: "Bidón 10L", b20: "Bidón 20L", disp: "Dispenser" };
    const porClienteEnv = {};
    const addMovCliente = (nombre, tipo, texto) => {
      const key = (nombre || "").trim() || "Sin nombre";
      if (!porClienteEnv[key]) porClienteEnv[key] = { prestado: [], devuelto: [] };
      porClienteEnv[key][tipo].push(texto);
    };
    // 1) Préstamos/devoluciones de una visita normal (ventas de hoy)
    ventas.forEach(v => {
      (v.envPrest || []).forEach(e => {
        const cant = Number(e.cant) || 0;
        if (cant > 0) addMovCliente(v.cliente, "prestado", `${cant} ${e.prod}`);
      });
      (v.envDev || []).forEach(e => {
        const cant = Number(e.cant) || 0;
        if (cant > 0) addMovCliente(v.cliente, "devuelto", `${cant} ${e.prod}`);
      });
    });
    // 2) Correcciones de Fijo (✏️ Envases → Fijos) — quedan en movStock,
    // con el nombre del cliente al final de la nota.
    (movStock || []).forEach(m => {
      if (m.tipo !== "ajuste" || (m.fecha || "").slice(0, 10) !== fecha) return;
      if (!(m.nota || "").startsWith("Envases fijos de cliente")) return;
      const nombre = (m.nota.split(" — ")[1] || "").trim();
      if (!nombre) return;
      Object.keys(skToPl).forEach(sk => {
        const d = Number(m.detalle?.[sk]) || 0;
        if (!d) return;
        const pk = skToPl[sk];
        const lbl = PROD_LBL[pk];
        if (d < 0) addMovCliente(nombre, "prestado", `${-d} ${lbl} (fijo)`);else addMovCliente(nombre, "devuelto", `${d} ${lbl} (fijo)`);
      });
    });
    // 3) Dispenser (comodato aparte — ver registrarDispMov en 14-app.js)
    (dispMovs || []).forEach(m => {
      const nombre = m.clienteNombre;
      if (!nombre || !m.delta) return;
      if (m.delta > 0) addMovCliente(nombre, "prestado", `${m.delta} Dispenser`);else addMovCliente(nombre, "devuelto", `${-m.delta} Dispenser`);
    });
    // 4) Bajas de cliente con retiro total de envases
    (movStock || []).forEach(m => {
      if (m.tipo !== "retiro" || (m.fecha || "").slice(0, 10) !== fecha) return;
      const nombre = (m.nota || "").replace("Cliente retirado:", "").trim();
      if (!nombre) return;
      const partes = Object.keys(skToPl).map(sk => {
        const d = Number(m.detalle?.[sk]) || 0;
        return d ? `${d} ${PROD_LBL[skToPl[sk]]}` : null;
      }).filter(Boolean);
      if (partes.length) addMovCliente(nombre, "devuelto", `${partes.join(", ")} (baja de cliente)`);
    });
    const nombresConMovEnv = Object.keys(porClienteEnv).sort((a, b) => a.localeCompare(b, "es"));
    return /*#__PURE__*/React.createElement("div", {
      style: { ...s.card, margin: "0 0 16px", padding: "14px 16px" }
    }, /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }
    }, "📋 Movimiento de envases de hoy"), /*#__PURE__*/React.createElement("p", {
      style: { fontSize: 11, color: "var(--color-text-tertiary)", margin: "0 0 8px" }
    }, "Préstamos, devoluciones, pérdidas, retiros y altas nuevas registrados en el día."), /*#__PURE__*/React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr 1fr 1fr", gap: 4, fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 4 }
    }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Prestado"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Devuelto"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Perdido"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Retirado"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center" } }, "Cliente nuevo")), movLabels.map(([label, pk]) => {
      const devueltoTotal = (devueltosDia[pk] || 0) + (devueltosFijoDia[pk] || 0);
      return /*#__PURE__*/React.createElement("div", {
        key: pk,
        style: { display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr 1fr 1fr", gap: 4, alignItems: "center", padding: "5px 0", borderTop: "0.5px solid var(--color-border-tertiary)" }
      }, /*#__PURE__*/React.createElement("span", { style: { fontSize: 12, color: "var(--color-text-primary)" } }, label), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 12, color: prestadosDia[pk] ? "var(--color-text-warning)" : "var(--color-text-tertiary)" } }, dv(pk, prestadosDia[pk]) || "—"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 12, color: devueltoTotal ? "var(--color-text-success)" : "var(--color-text-tertiary)" } }, dv(pk, devueltoTotal) || "—"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 12, color: perdidosDia[pk] ? "#ff6b6b" : "var(--color-text-tertiary)" } }, dv(pk, perdidosDia[pk]) || "—"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 12, color: retiradosDia[pk] ? "var(--color-text-secondary)" : "var(--color-text-tertiary)" } }, dv(pk, retiradosDia[pk]) || "—"), /*#__PURE__*/React.createElement("span", { style: { textAlign: "center", fontSize: 12, color: clientesNuevosDia[pk] ? "#5daaff" : "var(--color-text-tertiary)" } }, dv(pk, clientesNuevosDia[pk]) || "—"));
    }), nombresConMovEnv.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: { margin: "10px 0 0", borderRadius: 12, overflow: "hidden", border: "1.5px solid #185FA5", background: "var(--color-background-info)" }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setMostrarDetalleClientesEnv(v => !v),
      style: { width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }
    }, /*#__PURE__*/React.createElement("div", {
      style: { display: "flex", alignItems: "center", gap: 8 }
    }, /*#__PURE__*/React.createElement("span", {
      style: { fontSize: 16 }
    }, "👥"), /*#__PURE__*/React.createElement("span", {
      style: { fontSize: 13, fontWeight: 500, color: "var(--color-text-info)" }
    }, "Detalle por cliente"), /*#__PURE__*/React.createElement("span", {
      style: { fontSize: 11, color: "var(--color-text-tertiary)" }
    }, nombresConMovEnv.length, " cliente", nombresConMovEnv.length === 1 ? "" : "s")), /*#__PURE__*/React.createElement("span", {
      style: { color: "var(--color-text-info)", fontSize: 14, display: "inline-block", transform: mostrarDetalleClientesEnv ? "rotate(180deg)" : "rotate(0deg)" }
    }, "▾")), mostrarDetalleClientesEnv && /*#__PURE__*/React.createElement("div", {
      style: { padding: "0 16px 12px" }
    }, nombresConMovEnv.map(nombre => {
      const mov = porClienteEnv[nombre];
      return /*#__PURE__*/React.createElement("div", {
        key: nombre,
        style: { padding: "6px 0", borderTop: "0.5px solid var(--color-border-tertiary)" }
      }, /*#__PURE__*/React.createElement("div", {
        style: { fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 2 }
      }, nombre), /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", flexWrap: "wrap", gap: 6 }
      }, mov.prestado.length > 0 && /*#__PURE__*/React.createElement("span", {
        style: { fontSize: 11, fontWeight: 600, color: "#f5b942", background: "rgba(245,185,66,0.15)", padding: "2px 7px", borderRadius: 6 }
      }, "📦 Prestó: ", mov.prestado.join(", ")), mov.devuelto.length > 0 && /*#__PURE__*/React.createElement("span", {
        style: { fontSize: 11, fontWeight: 600, color: "#1D9E75", background: "rgba(29,158,117,0.15)", padding: "2px 7px", borderRadius: 6 }
      }, "↩️ Devolvió: ", mov.devuelto.join(", "))));
    }))));
  })(), /*#__PURE__*/React.createElement("button", {
    style: s.btnPrimary,
    onClick: () => {
      // Enviar a Emma Control los valores NETOS que se ven en esta pantalla:
      // efectivo en mano (ya descontado el llenado de envases — costo que
      // Emma Control no ve de otra forma) y transferencia neta (ya
      // descontada la retención 2.5%). Los gastos extras se mandan aparte
      // como registros propios (igual que antes) — por eso NO se restan acá
      // también del efectivo, para no descontarlos dos veces en Emma Control.
      // Se reenvía cada vez que se guarda la planilla: los ids son fijos por
      // día (lc_ing_ef_<fecha> y lc_ing_tr_<fecha>), así que sobrescriben el
      // registro anterior en vez de duplicar. El efectivo y la transferencia
      // van como DOS registros separados, cada uno con su método, para que Emma
      // Control impute bien cada forma de cobro.
      if (ecToken && (window._lcEncolarEC || window.enviarAEmmaControl)) {
        const efectivoNeto = Math.round(cobEfectivo - totalVentaLlenar);
        const transferenciaNeta = Math.round(cobTransNeto);
        const gastosData = (datos.gastos || []).filter(g => g.confirmado && Number(g.monto) > 0).map(g => ({
          desc: g.desc || 'Gasto reparto',
          monto: Number(g.monto),
          cat: g.cat || 'Otros',
          metodo: g.metodo || 'efectivo'
        }));
        const ingresosEC = {
          total: efectivoNeto + transferenciaNeta,
          efectivo: efectivoNeto,
          transferencia: transferenciaNeta
        };
        // Vía la cola: si el envío falla (sin señal, permisos, cuota) el día
        // queda pendiente y se reintenta solo, en vez de perderse en silencio.
        if (window._lcEncolarEC) window._lcEncolarEC(fecha, ingresosEC, gastosData);else window.enviarAEmmaControl(ecToken, fecha, ingresosEC, gastosData);
      }
      onGuardar({...datos, efectivo: String(Math.round(cobEfectivo)), fiado: String(Math.round(cobFiado)), retenciones: String(cobTransDesc)});
    }
  }, "Guardar planilla"), !yaCerrado ? /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      padding: "14px",
      borderRadius: 10,
      border: "2px solid #f5b942",
      background: "#2e1f06",
      color: "#f5b942",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      marginTop: 10
    },
    onClick: () => setMostrarCierre(true)
  }, "🔒 Cerrar el día y actualizar stock") : /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "12px",
      borderRadius: 10,
      background: "rgba(29,158,117,0.15)",
      color: "#4dd9a0",
      fontSize: 13,
      fontWeight: 500,
      marginTop: 10
    }
  }, "✅ Día cerrado — stock actualizado")));
}
function InicioReparto({
  dia,
  fecha,
  planilla,
  productos,
  cargasDia,
  stock,
  onGuardar,
  onVolver
}) {
  const prodKeys = {
    "Sifón 1.5L": "soda",
    "Bidón 10L": "b10",
    "Bidón 20L": "b20"
  };
  const CAJON = 6; // sifones por cajón
  const [llenos, setLlenos] = useState(() => {
    const precarga = (cargasDia || CARGA_DIA_DEFAULT)[dia] || CARGA_DIA_DEFAULT[dia] || {};
    const m = {};
    productos.forEach(p => {
      const k = prodKeys[p.nombre];
      if (k) m[k] = planilla?.productos?.[k]?.llenos || precarga[k] || "";
    });
    return m;
  });
  const yaIniciado = planilla?.iniciado;
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: `Inicio del reparto · ${dia}`,
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 16px",
      background: "var(--color-background-info)",
      border: "0.5px solid var(--color-border-info)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-info)",
      marginBottom: 4
    }
  }, "📅 ", dia, " · ", fecha ? new Date(fecha + 'T12:00:00').toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }) : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)"
    }
  }, yaIniciado ? "Podés modificar las cantidades iniciales si hay un error." : "Ingresá la cantidad de envases llenos con los que salís hoy.")), /*#__PURE__*/React.createElement("span", {
    style: {
      ...s.sectionTitle,
      padding: "0 0 10px"
    }
  }, "Envases llenos al salir"), productos.map(p => {
    const k = prodKeys[p.nombre];
    if (!k) return null;
    const pkToSk = { soda: "sifon", b10: "bidon10", b20: "bidon20" };
    const sk = pkToSk[k];
    const necesario = Number(llenos[k]) || 0;
    const disponibleLleno = stock?.soderia?.[sk] || 0;
    const disponibleVacio = stock?.soderia_vacios?.[sk] || 0;
    const faltanLlenar = Math.max(0, necesario - disponibleLleno);
    const unidadRef = k === "soda" ? "cajones" : "unidades";
    const divRef = n => k === "soda" ? Math.ceil(n / CAJON) : n;
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        ...s.card,
        margin: "0 0 10px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 500,
        color: "var(--color-text-primary)"
      }
    }, p.nombre), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--color-text-secondary)"
      }
    }, fmt(p.precio), " c/u")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btn,
        padding: "6px 18px",
        fontSize: 22,
        lineHeight: 1
      },
      onClick: () => setLlenos(l => ({
        ...l,
        [k]: Math.max(0, (Number(l[k]) || 0) - (k === "soda" ? CAJON : 1))
      }))
    }, k === "soda" ? "-caj" : "-"), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        minWidth: 50
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 26,
        fontWeight: 500,
        color: "var(--color-text-primary)"
      }
    }, llenos[k] || 0), k === "soda" && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--color-text-tertiary)"
      }
    }, Math.floor((llenos[k] || 0) / CAJON), "caj+", (llenos[k] || 0) % CAJON, "un")), /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btn,
        padding: "6px 18px",
        fontSize: 22,
        lineHeight: 1
      },
      onClick: () => setLlenos(l => ({
        ...l,
        [k]: (Number(l[k]) || 0) + (k === "soda" ? CAJON : 1)
      }))
    }, k === "soda" ? "+caj" : "+"))), faltanLlenar > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        paddingTop: 8,
        borderTop: "0.5px solid var(--color-border-tertiary)",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--color-text-warning)",
        textAlign: "center"
      }
    }, faltanLlenar <= disponibleVacio ? `⚠ Necesitás hacer llenar ${divRef(faltanLlenar)} ${unidadRef} (sodería tiene ${divRef(disponibleLleno)} llenos)` : `⚠ Faltan ${divRef(faltanLlenar - disponibleVacio)} ${unidadRef} — no hay suficientes vacíos para llenar (sodería tiene ${divRef(disponibleLleno)} llenos y ${divRef(disponibleVacio)} vacíos)`));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "12px 0 20px",
      background: "var(--color-background-secondary)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)",
      marginBottom: 6
    }
  }, "Total envases cargados"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, Object.values(llenos).reduce((a, v) => a + (Number(v) || 0), 0))), /*#__PURE__*/React.createElement("button", {
    style: s.btnPrimary,
    onClick: () => {
      const nuevaPlanilla = {
        ...(planilla || planillaDiaVacia()),
        iniciado: true,
        productos: {
          ...(planilla?.productos || {}),
          ...Object.fromEntries(Object.entries(llenos).map(([k, v]) => [k, {
            ...(planilla?.productos?.[k] || {}),
            llenos: v
          }]))
        }
      };
      onGuardar(nuevaPlanilla, true);
    }
  }, yaIniciado ? "Actualizar y continuar →" : "🚀 Iniciar y descontar de sodería")), stock?.soderia && /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "10px 14px 0",
      background: "var(--color-background-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-secondary)",
      marginBottom: 8
    }
  }, "Stock actual · Sodería"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16
    }
  }, [["Sifón", stock?.soderia?.sifon || 0, stock?.soderia_vacios?.sifon || 0], ["Bidón 10L", stock?.soderia?.bidon10 || 0, stock?.soderia_vacios?.bidon10 || 0], ["Bidón 20L", stock?.soderia?.bidon20 || 0, stock?.soderia_vacios?.bidon20 || 0]].map(([l, lleno, vacio]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 500,
      color: lleno > 0 ? "var(--color-text-primary)" : "var(--color-text-danger)"
    }
  }, lleno || 0, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 400,
      color: "var(--color-text-tertiary)"
    }
  }, " lleno")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-text-secondary)"
    }
  }, vacio || 0, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 400,
      color: "var(--color-text-tertiary)"
    }
  }, " vacío")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--color-text-info)",
      marginTop: 2
    }
  }, "= ", lleno + vacio, " total"))))));
}

// ── Atajo: Planilla de los últimos días (lun-vie) sin pasar por Clientes ──
function AtajoPlanillaSemana({
  planillas,
  ventas,
  clientes,
  noVisitas,
  onSeleccionar,
  onVolver
}) {
  const DIAS_NOMBRE = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const dias5 = [];
  const hoy0 = new Date();
  hoy0.setHours(0, 0, 0, 0);
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  while (dias5.length < 5) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      const fechaKeyNominal = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      const diaNombre = DIAS_NOMBRE[dow];
      // BUG REPORTADO 2026-10-17: si el reparto de este día se terminó en
      // otra fecha real (ej. el viernes arrastrado y cerrado el sábado),
      // esta tarjeta seguía mirando la fecha nominal (el viernes calendario)
      // y mostraba todo vacío/"Sin iniciar" — los datos reales quedaron
      // guardados bajo la fecha en que efectivamente se hizo, otra
      // planilla, inencontrable desde acá. Se busca la fecha real más
      // nueva (desde la nominal en adelante) donde haya quedado algo
      // cargado para este día, y se usa esa en vez de la nominal.
      // BUG REPORTADO 2026-10-17: acá también se buscaba por cualquier
      // venta/marca suelta con este día (no sólo por planilla real) — una
      // venta puntual a un cliente de Miércoles hecha desde Gestión otro
      // día (ver fix en 14-app.js) terminaba mostrando "Miércoles" fechado
      // ese otro día, mezclado con lo real. Pedido del usuario: sólo
      // cuentan planillas reales (las crea "Inicio del reparto").
      let fechaKeyReal = null;
      Object.keys(planillas || {}).forEach(k => {
        if (k.indexOf(diaNombre + "_") === 0) {
          const fk = k.slice(diaNombre.length + 1);
          if (fk >= fechaKeyNominal && (!fechaKeyReal || fk > fechaKeyReal)) fechaKeyReal = fk;
        }
      });
      const fechaKey = fechaKeyReal || fechaKeyNominal;
      dias5.push({
        fecha: fechaKey === fechaKeyNominal ? new Date(cur) : new Date(fechaKey + "T12:00:00"),
        fechaKey,
        dia: diaNombre
      });
    }
    cur.setDate(cur.getDate() - 1);
  }
  // Mostrar siempre en orden Lunes -> Viernes (no por cercanía a hoy)
  const ORDEN_DIA = {
    "Lunes": 1,
    "Martes": 2,
    "Miércoles": 3,
    "Jueves": 4,
    "Viernes": 5
  };
  dias5.sort((a, b) => ORDEN_DIA[a.dia] - ORDEN_DIA[b.dia]);
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: "Planilla · Últimos días",
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 16px 4px",
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, "Tocá una fecha para ir directo a su planilla."), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, dias5.map(({
    fecha,
    fechaKey,
    dia
  }) => {
    const pl = (planillas || {})[`${dia}_${fechaKey}`];
    // El cierre deja DOS marcas: `_diaCerrado` en la planilla (sincroniza a la
    // nube) y una en localStorage, que confirmarCierre escribe de inmediato.
    // La pantalla de la planilla mira las dos (su `yaCerrado`); esta tarjeta
    // miraba sólo `_diaCerrado`, así que un día ya cerrado acá seguía
    // apareciendo abierto si el guardado de la planilla no llegó a persistir
    // (falló, o un merge de la nube lo pisó). Ahora mira las mismas dos.
    const cerradaEnPlanilla = !!(pl && pl._diaCerrado);
    const cerradaLocal = (() => {
      try {
        return !!localStorage.getItem(`cierre_${dia}_${fechaKey}`);
      } catch {
        return false;
      }
    })();
    const cerrada = cerradaEnPlanilla || cerradaLocal;
    // Se cerró en este dispositivo pero la planilla no guardó la marca: el día
    // está cerrado de hecho, pero en otro dispositivo se va a seguir viendo abierto.
    const cierreNoRegistrado = cerradaLocal && !cerradaEnPlanilla;
    const iniciada = !!(pl && pl.iniciado);
    const clientesDia = (clientes || []).filter(c => c.dia === dia);
    const totalClientes = clientesDia.length;
    const esPasado = fecha.getTime() < hoy0.getTime();
    // BUG 2026-10-17: antes filtraba sólo por fechaKey, sin exigir que la
    // venta/marca sea realmente DE ESE día (v.dia). Si dos días terminan
    // compartiendo la misma fecha real (ej. se tocó la planilla propia de
    // Miércoles el mismo jueves que se hizo la de Jueves), un cliente de
    // Miércoles visitado en otro momento contaminaba el conteo de Jueves
    // y viceversa. Ahora exige fecha Y día — cada conteo sólo ve lo suyo.
    const ventaIdsDia = new Set((ventas || []).filter(v => v.fechaKey === fechaKey && v.dia === dia).map(v => v.clienteId));
    const noVisitaIdsDia = new Set((noVisitas || []).filter(n => n.fecha === fechaKey && n.dia === dia).map(n => n.clienteId));
    // VISITADOS: clientes ÚNICOS del día con alguna venta registrada. Se cuenta
    // por cliente y no por registro de venta a propósito: un cliente que no
    // compró pero pagó deuda vieja SÍ fue visitado (queda como venta _esCobro),
    // y un mismo cliente puede tener varios registros el mismo día (venta +
    // cobro, o la parte-transferencia de un pago mixto) sin ser dos visitas.
    const visitados = clientesDia.filter(c => ventaIdsDia.has(c.id)).length;
    // Marcados: no compraron pero quedaron registrados (no estaba / no quiso / salteado).
    const marcados = clientesDia.filter(c => !ventaIdsDia.has(c.id) && noVisitaIdsDia.has(c.id)).length;
    // Pendientes: ni venta ni marca — son los que faltó atender o marcar antes de cerrar.
    const pendientes = clientesDia.filter(c => !ventaIdsDia.has(c.id) && !noVisitaIdsDia.has(c.id));
    const sinCerrar = esPasado && iniciada && !cerrada;
    // Causa concreta por la que el día quedó sin cerrar.
    const causaSinCierre = pendientes.length > 0 ? `⚠️ No se cerró porque faltan ${pendientes.length} cliente${pendientes.length === 1 ? "" : "s"} por atender o marcar` : `⚠️ No se cerró: ${visitados} visitados + ${marcados} marcados, pero nunca se confirmó el cierre`;
    const label = fecha.toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
    return /*#__PURE__*/React.createElement("div", {
      key: fechaKey + "_" + dia,
      role: "button",
      onClick: () => onSeleccionar(fechaKey, dia),
      style: {
        ...s.card,
        margin: 0,
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "13px 14px"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 500,
        color: "var(--color-text-primary)"
      }
    }, dia), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--color-text-tertiary)",
        marginTop: 2,
        textTransform: "capitalize"
      }
    }, label, totalClientes ? ` · ${visitados}/${totalClientes} visitados` : ""), cierreNoRegistrado && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--color-text-tertiary)",
        marginTop: 2
      }
    }, "Cerrada en este dispositivo (no quedó guardada en la planilla)"), sinCerrar && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--color-text-danger)",
        marginTop: 2
      }
    }, causaSinCierre), sinCerrar && /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        onSeleccionar(fechaKey, dia);
      },
      style: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: 600,
        padding: "5px 12px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        background: "var(--color-accent)",
        color: "#fff"
      }
    }, "Cerrar día")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, cerrada ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        padding: "3px 8px",
        borderRadius: 20,
        background: "var(--color-background-success)",
        color: "var(--color-text-success)"
      }
    }, "Cerrada ✓") : sinCerrar ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        padding: "3px 8px",
        borderRadius: 20,
        background: "var(--color-background-danger)",
        color: "var(--color-text-danger)"
      }
    }, "Sin cerrar ⚠️") : iniciada ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        padding: "3px 8px",
        borderRadius: 20,
        background: "var(--color-background-warning)",
        color: "var(--color-text-warning)"
      }
    }, "En curso") : /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--color-text-tertiary)"
      }
    }, "Sin iniciar"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--color-text-tertiary)"
      }
    }, "→")));
  })));
}
