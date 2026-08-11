// ════════════════════════════════════════════════════════════════════
// ◆  07-menu.js — MenuDias, DiaPrincipal, PlanillaDelDia, InicioReparto
// ════════════════════════════════════════════════════════════════════

function MenuDias({
  dias,
  onDia,
  onResumen,
  onConfig,
  onGestionClientes,
  onStock,
  onAgenda,
  onNuevoCliente,
  onPromociones,
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
  onSetZona,
  onDiaHoy,
  onDiaResumen,
  noVisitas,
  onFiados,
  onMapaClientes,
  onDormidos,
  onPlanillaAtajo
}) {
  const [editandoZona, setEditandoZona] = React.useState(null);
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

  // Calcular si el día de hoy está completo (todos los clientes visitados)
  const clientesHoy = (clientes || []).filter(c => c.dia === hoyDiaNombre);
  const ventasHoyIds = new Set((ventas || []).filter(v => v.fechaKey === hoyFechaKey).map(v => v.clienteId));
  const noVisitasHoyIds = new Set((noVisitas || []).filter(v => v.fecha === hoyFechaKey).map(v => v.clienteId));
  const visitadosHoy = clientesHoy.filter(c => ventasHoyIds.has(c.id) || noVisitasHoyIds.has(c.id));
  const diaCompleto = clientesHoy.length > 0 && visitadosHoy.length >= clientesHoy.length;
  // Estado del recuadro de HOY según la hora del reloj (si quedó sin terminar):
  //   antes de las 12 → normal (azul) · 12 a 17 hs → naranja · 17 hs en adelante → rojo/pendiente
  const horaActual = new Date().getHours();
  const hayPendHoy = clientesHoy.length > 0 && !diaCompleto;
  const estadoHoy = diaCompleto ? "listo" : hayPendHoy && horaActual >= 17 ? "rojo" : hayPendHoy && horaActual >= 12 ? "naranja" : "normal";
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
      letterSpacing: "0.05em"
    }
  }, "🔔 Recordatorios pendientes"), recordatoriosActivos.slice(0, 5).map(r => /*#__PURE__*/React.createElement("div", {
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
  }, "✓"))), recordatoriosActivos.length > 5 && /*#__PURE__*/React.createElement("div", {
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
      letterSpacing: "0.05em"
    }
  }, "🔴 Transferencias sin confirmar"), transferenciasPendientes.map(({
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
      onClick: () => onDia(d)
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
        whiteSpace: "nowrap"
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
        color: "var(--color-text-danger)"
      }
    }, "⚠ ", deudas.length, " cliente", deudas.length > 1 ? "s" : "", " ", deudas.length > 1 ? "deben" : "debe", " ", fmt(totalDeuda)) : /*#__PURE__*/React.createElement("span", {
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
    }, "→")), d === hoyDiaNombre && onDiaHoy && (() => {
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
      }[estadoHoy];
      const sub = diaCompleto ? "Listo" : `${visitadosHoy.length}/${clientesHoy.length}`;
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
        onClick: () => diaCompleto ? onDiaResumen && onDiaResumen(d, hoyFechaKey) : onDiaHoy(d, hoyFechaKey)
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
    }, "✕"))), zona && editandoZona !== d && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        marginTop: 2,
        marginBottom: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "var(--color-text-tertiary)",
        cursor: "pointer",
        textDecoration: "underline"
      },
      onClick: e => {
        e.stopPropagation();
        setEditandoZona(d);
      }
    }, "editar zona")), false && idx === dias.length - 1 && stock && (() => {
      const CAJON = 6;
      const sCaj = Math.floor((stock.soderia?.sifon || 0) / CAJON);
      const cCaj = Math.floor((stock.casa?.sifon || 0) / CAJON);
      const sB10 = stock.soderia?.bidon10 || 0,
        cB10 = stock.casa?.bidon10 || 0;
      const sB20 = stock.soderia?.bidon20 || 0,
        cB20 = stock.casa?.bidon20 || 0;
      const envC = {
        sifon: 0,
        bidon10: 0,
        bidon20: 0
      };
      (clientes || []).forEach(c => {
        envC.sifon += c.sifon || 0;
        envC.bidon10 += c.bidon10 || 0;
        envC.bidon20 += c.bidon20 || 0;
      });
      (ventas || []).forEach(v => {
        (v.envPrest || []).forEach(e => {
          const k = e.prod === "Sifón 1.5L" ? "sifon" : e.prod === "Bidón 10L" ? "bidon10" : e.prod === "Bidón 20L" ? "bidon20" : null;
          if (k) envC[k] += Number(e.cant) || 0;
        });
        (v.envDev || []).forEach(e => {
          const k = e.prod === "Sifón 1.5L" ? "sifon" : e.prod === "Bidón 10L" ? "bidon10" : e.prod === "Bidón 20L" ? "bidon20" : null;
          if (k) envC[k] -= Number(e.cant) || 0;
        });
      });
      const envCCaj = Math.floor(envC.sifon / CAJON);
      const totCaj = sCaj + cCaj + envCCaj,
        totB10 = sB10 + cB10 + envC.bidon10,
        totB20 = sB20 + cB20 + envC.bidon20;
      const StockCard = () => {
        const [open, setOpen] = React.useState(false);
        return /*#__PURE__*/React.createElement("div", {
          style: {
            ...s.card,
            margin: "4px 0 0",
            background: "var(--color-background-secondary)",
            border: "0.5px solid var(--color-border-secondary)"
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer"
          },
          onClick: () => setOpen(o => !o)
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 10
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-text-primary)"
          }
        }, "📦 Stock"), /*#__PURE__*/React.createElement("div", {
          style: {
            display: "flex",
            gap: 6
          }
        }, [[totCaj, "caj"], [totB10, "10L"], [totB20, "20L"]].map(([v, u], i) => /*#__PURE__*/React.createElement("span", {
          key: i,
          style: {
            fontSize: 12,
            fontWeight: 600,
            color: Number(v) < 3 ? "var(--color-text-danger)" : Number(v) < 8 ? "var(--color-text-warning)" : "var(--color-text-info)"
          }
        }, v, /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 10,
            fontWeight: 400,
            color: "var(--color-text-tertiary)",
            marginLeft: 1
          }
        }, u))))), /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 13,
            color: "var(--color-text-tertiary)",
            transition: "transform 0.2s",
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "rotate(0deg)"
          }
        }, "▾")), open && /*#__PURE__*/React.createElement("div", {
          style: {
            marginTop: 12
          }
        }, [["🏭 Sodería", [sCaj, sB10, sB20], "primary"], ["👥 En clientes", [envCCaj, envC.bidon10, envC.bidon20], "info"], ["📦 Total general", [totCaj, totB10, totB20], "info"]].map(([titulo, vals, color], gi) => /*#__PURE__*/React.createElement("div", {
          key: gi,
          style: {
            marginBottom: gi < 2 ? 10 : 0
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 10,
            color: "var(--color-text-tertiary)",
            marginBottom: 4,
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }
        }, titulo), /*#__PURE__*/React.createElement("div", {
          style: {
            display: "flex",
            gap: 6
          }
        }, vals.map((v, i) => /*#__PURE__*/React.createElement("div", {
          key: i,
          style: {
            textAlign: "center",
            flex: 1,
            background: gi === 2 ? "#1e3a5f" : "var(--color-background-tertiary)",
            borderRadius: 8,
            padding: "6px 4px",
            border: gi === 2 ? "0.5px solid var(--color-border-info)" : "none"
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 18,
            fontWeight: gi === 2 ? 700 : 600,
            color: gi === 0 ? Number(v) < 3 ? "var(--color-text-danger)" : Number(v) < 8 ? "var(--color-text-warning)" : "var(--color-text-primary)" : `var(--color-text-${color})`
          }
        }, v), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 10,
            color: "var(--color-text-tertiary)"
          }
        }, ["caj", "10L", "20L"][i]))))))));
      };
      return /*#__PURE__*/React.createElement(StockCard, null);
    })());
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
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
    ico: "📣",
    lbl: "Promociones",
    fn: () => onPromociones && onPromociones()
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
function DiaPrincipal({
  dia,
  onIrClientes,
  onIrPlanilla,
  onVolver,
  onVerConfirmaciones,
  ventasPendientesTransfer
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: dia,
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.card,
      margin: 0,
      cursor: "pointer",
      textAlign: "left",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 16px"
    },
    onClick: onIrPlanilla
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "📋 Planilla del día"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)",
      marginTop: 4
    }
  }, "Fechas de visita · inicio del reparto · totales")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-text-tertiary)",
      fontSize: 20
    }
  }, "→")), ventasPendientesTransfer > 0 && /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.card,
      margin: "0 0 10px",
      background: "#1e3a5f",
      border: "1px solid #f5b942",
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      textAlign: "left",
      cursor: "pointer"
    },
    onClick: () => (onVerConfirmaciones || onIrClientes)()
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22
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
  }, ventasPendientesTransfer, " transferencia", ventasPendientesTransfer > 1 ? "s" : "", " sin confirmar"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-secondary)"
    }
  }, "Tocá para ir a confirmar →")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f5b942",
      fontSize: 18
    }
  }, "→")), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.card,
      margin: 0,
      cursor: "pointer",
      textAlign: "left",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 16px"
    },
    onClick: onIrClientes
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "👥 Clientes del día"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)",
      marginTop: 4
    }
  }, "Registrar entregas y visitas")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-text-tertiary)",
      fontSize: 20
    }
  }, "→"))));
}
function DetalleTransferencias({
  ventas,
  ventasPendTrans
}) {
  const [abierto, setAbierto] = React.useState(false);
  const pendientes = (ventasPendTrans || []).length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      borderTop: "0.5px solid var(--color-border-tertiary)",
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: "none",
      border: "none",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "2px 0"
    },
    onClick: () => setAbierto(o => !o)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-secondary)",
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.05em"
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
      fontSize: 13,
      color: "var(--color-text-tertiary)",
      display: "inline-block",
      transform: abierto ? "rotate(180deg)" : "rotate(0deg)"
    }
  }, "▾")), abierto && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, ventas.map(v => {
    const confirmada = !!v.transConfirmada;
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
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-primary)",
        fontWeight: 500
      }
    }, v.cliente), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 6,
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: 4,
        background: confirmada ? "var(--color-background-success)" : "var(--color-background-warning)",
        color: confirmada ? "var(--color-text-success)" : "#f5b942",
        fontWeight: 600
      }
    }, confirmada ? "✅ Confirmada" : "🔴 Pendiente")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: confirmada ? "var(--color-text-success)" : "#f5b942"
      }
    }, fmt(v.pagadoNum || v.neto || 0)));
  })));
}
function DetalleVentasDia({
  ventas,
  clientes,
  noVisitas,
  fecha
}) {
  const [abierto, setAbierto] = React.useState(false);
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
      }
    }[v.pago] || {
      bg: "var(--color-background-tertiary)",
      color: "var(--color-text-secondary)",
      txt: v.pago
    };
    const cli = (clientes || []).find(x => x.id === v.clienteId);
    const dir = cli ? direccionCliente(cli) : "";
    const deudaPagada = Math.max(0, (v.pagadoNum || 0) - (v.neto || 0));
    const fmtEnv = arr => (arr || []).filter(e => e.prod && Number(e.cant) > 0).map(e => `${e.cant} ${e.prod}`).join(", ");
    const prestStr = fmtEnv(v.envPrest);
    const devStr = fmtEnv(v.envDev);
    return /*#__PURE__*/React.createElement("div", {
      key: v.id,
      style: {
        padding: "10px 16px",
        borderBottom: idx < ventas.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none"
      }
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
    }, v.cliente), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 6,
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: 4,
        background: pagoBadge.bg,
        color: pagoBadge.color,
        fontWeight: 600
      }
    }, pagoBadge.txt), v.hora && /*#__PURE__*/React.createElement("span", {
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
        gap: 2,
        padding: "3px 0 0 8px",
        marginTop: 2,
        borderTop: "0.5px solid var(--color-border-tertiary)"
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
        color: "#f5b942"
      }
    }, "📦 Prestó: ", prestStr), devStr && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--color-text-info)"
      }
    }, "↩️ Devolvió: ", devStr)));
  }), (() => {
    const ventaIds = new Set(ventas.map(v => v.clienteId));
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
      return /*#__PURE__*/React.createElement("div", {
        key: "nv" + i,
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "7px 16px",
          borderTop: i > 0 ? "0.5px solid var(--color-border-tertiary)" : "none"
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
      }, info.ic, " ", info.t));
    }));
  })()));
}
function PlanillaDelDia({
  dia,
  fecha,
  ventas,
  todasLasVentas,
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
  cargasDia
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
  // Todas las ventas del día (propias + otros días) para envases y plata
  const todasVentasDia = [...ventasPropias, ...ventasExtraDia];
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
  const extraEfectivo = ventasExtraDia.filter(v => v.pago === "contado").reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0);
  const extraTrans = ventasExtraDia.filter(v => v.pago === "transferencia").reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0);
  const extraFiado = ventasExtraDia.filter(v => v.pago === "fiado").reduce((a, v) => a + (v.neto || 0), 0);
  const extraTotal = extraEfectivo + extraTrans + extraFiado;
  // Cobranza — todas las ventas del día (propias + otros días)
  // Para pago mixto: la venta principal (pago="contado") tiene montoEfec y montoTrans guardados
  // cobEfectivo debe contar solo la parte efectivo del mixto, no el total
  const cobEfectivo = todasVentasDia.filter(v => v.pago === "contado").reduce((a, v) => {
    const esMixto = (Number(v.montoTrans) || 0) > 0;
    return a + (esMixto ? Number(v.montoEfec) || 0 : v.pagadoNum || v.neto || 0);
  }, 0);
  // cobTransBruto: transferencias puras + parte transferencia de pagos mixtos
  const cobTransBruto = todasVentasDia.reduce((a, v) => {
    if (v.pago === "transferencia") return a + (v.pagadoNum || v.neto || 0);
    if (v.pago === "contado" && (Number(v.montoTrans) || 0) > 0) return a + (Number(v.montoTrans) || 0);
    return a;
  }, 0);
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
  const yaCerrado = !!planilla._diaCerrado;
  const [mostrarCierre, setMostrarCierre] = useState(() => autoCierre && !planilla._diaCerrado);
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

  // ── Cálculo de stock para el cierre del día ──────────────────
  const CAJON = 6;
  const planKeyToSk = {
    soda: "sifon",
    b10: "bidon10",
    b20: "bidon20"
  };
  const llenosCargados = {
    soda: Number(datos.productos?.soda?.llenos || 0),
    b10: Number(datos.productos?.b10?.llenos || 0),
    b20: Number(datos.productos?.b20?.llenos || 0)
  };
  const vendidosDia = {
    soda: 0,
    b10: 0,
    b20: 0
  };
  const prestadosDia = {
    soda: 0,
    b10: 0,
    b20: 0
  };
  const devueltosDia = {
    soda: 0,
    b10: 0,
    b20: 0
  };
  const prodKeyPl = {
    "Sifón 1.5L": "soda",
    "Bidón 10L": "b10",
    "Bidón 20L": "b20"
  };
  // Stock TOTAL fijo de la sodería+camión (nunca cambia): 25 cajones de
  // soda, 70 bidones de 10L, 21 bidones de 20L. En todo momento tiene que
  // estar repartido entre 4 lugares: sodería+camión (lleno/vacío/a llenar),
  // depósito (stock.casa), clientes fijos (c.sifon/bidon10/bidon20) y
  // clientes prestados (envases de más, historial + ajuste manual) — si no
  // cuadra, algo se perdió o falta cargar un movimiento.
  const CAPACIDAD_FIJA = {
    soda: 25 * CAJON,
    b10: 70,
    b20: 21
  };
  const clientesReales = clientes || [];
  // Clientes FIJOS: el stock base que cada cliente siempre tiene (no se mueve con las ventas)
  const totClientesFijos = {
    soda: 0,
    b10: 0,
    b20: 0
  };
  clientesReales.forEach(c => {
    totClientesFijos.soda += Number(c.sifon) || 0;
    totClientesFijos.b10 += Number(c.bidon10) || 0;
    totClientesFijos.b20 += Number(c.bidon20) || 0;
  });
  // Depósito: stock guardado aparte de la sodería (stock.casa)
  const enDeposito = {
    soda: stock?.casa?.sifon || 0,
    b10: stock?.casa?.bidon10 || 0,
    b20: stock?.casa?.bidon20 || 0
  };
  // Envases PRESTADOS en poder de clientes: se lee directo de c.prestado por
  // cliente (se mantiene solo en cada venta — ver aplicarMovimientoEnvases en
  // 14-app.js, mismo criterio que el Arqueo de Stock). Si un cliente todavía
  // no tiene ese campo, se usa el cálculo por historial completo como
  // referencia inicial.
  const enClientesActual = {
    soda: 0,
    b10: 0,
    b20: 0
  };
  const historialPorCliente = {};
  (todasLasVentas || ventas).forEach(v => {
    if (!historialPorCliente[v.clienteId]) historialPorCliente[v.clienteId] = {
      soda: 0,
      b10: 0,
      b20: 0
    };
    (v.envPrest || []).forEach(e => {
      const k = prodKeyPl[e.prod];
      if (k) historialPorCliente[v.clienteId][k] += Number(e.cant) || 0;
    });
    (v.envDev || []).forEach(e => {
      const k = prodKeyPl[e.prod];
      if (k) historialPorCliente[v.clienteId][k] -= Number(e.cant) || 0;
    });
  });
  clientesReales.forEach(c => {
    ["soda", "b10", "b20"].forEach(pk => {
      const sk = planKeyToSk[pk];
      const valor = c.prestado && c.prestado[sk] !== undefined ? c.prestado[sk] : Math.max(0, historialPorCliente[c.id]?.[pk] || 0);
      enClientesActual[pk] += valor;
    });
  });
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
  const confirmarCierre = () => {
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
    const planKeyToSkL = {
      "soda": "sifon",
      "b10": "bidon10",
      "b20": "bidon20"
    };
    ["soda", "b10", "b20"].forEach(pk => {
      const calcL = sobrantes[pk];
      const calcPL = paraLlenarCalc[pk];
      const calcV = vaciosRestoCalc[pk];
      const cajon = pk === "soda" ? CAJON : 1;
      const llenosReal = realesLlenos[pk] !== "" ? Number(realesLlenos[pk]) * cajon : calcL;
      const paraLlenarReal = realesParaLlenar[pk] !== "" ? Number(realesParaLlenar[pk]) * cajon : calcPL * cajon;
      const vaciosReal = realesVacios[pk] !== "" ? Number(realesVacios[pk]) * cajon : calcV * cajon;
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
    // Sobra o falta del día (lo que volvió vs lo esperado según lo que salió,
    // se prestó y se devolvió) se ajusta contra el depósito: si sobra, se
    // suma al depósito; si falta, se resta.
    const diffDeposito = {};
    ["soda", "b10", "b20"].forEach(pk => {
      const esperadoPk = llenosCargados[pk] + devueltosDia[pk] - prestadosDia[pk];
      const vuelveTotalPk = llenVuelta[pk] + vacVuelta[pk];
      diffDeposito[pk] = vuelveTotalPk - esperadoPk;
    });
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
        s.soderia[sk] = (s.soderia[sk] || 0) + llenVuelta[pk];
        s.soderia_vacios[sk] = (s.soderia_vacios[sk] || 0) + vacVuelta[pk];
        s.casa[sk] = (s.casa[sk] || 0) + diffDeposito[pk];
      });
      s.camion = {
        sifon: 0,
        bidon10: 0,
        bidon20: 0
      };
      syncData && syncData({
        stock: s
      });
      return s;
    });
    onGuardar({
      ...datos,
      _diaCerrado: true,
      _stockActualizado: true,
      _cierreDiffs: Object.keys(diffs).length > 0 ? diffs : null
    });
    setMostrarCierre(false);
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
  const totalLlenosIngresados = PRODUCTOS_CONFIG.reduce((a, p) => a + num(datos.productos[p.id]?.llenos), 0);

  // ── Early return: pantalla de cierre ─────────────────────────────
  if (mostrarCierre) {
    return /*#__PURE__*/React.createElement("div", {
      style: s.screen
    }, /*#__PURE__*/React.createElement(HeaderApp, {
      titulo: `Cierre del día · ${dia}`,
      onVolver: () => setMostrarCierre(false)
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16
      }
    }, /*#__PURE__*/React.createElement("details", {
      style: {
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("summary", {
      style: {
        cursor: "pointer",
        listStyle: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--color-background-tertiary)",
        borderRadius: 8,
        padding: "10px 14px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: "var(--color-text-primary)"
      }
    }, "Ver detalle del día (lo cargado y los movimientos)"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--color-text-tertiary)"
      }
    }, "▾")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...s.card,
        margin: "0 0 8px",
        padding: "10px 12px"
      }
    }, [["Soda", llenosCargados.soda > 0 ? `${Math.floor(llenosCargados.soda / CAJON)} cajones (${llenosCargados.soda} un)` : "—"], ["Bidón 10L", llenosCargados.b10 > 0 ? `${llenosCargados.b10} unidades` : "—"], ["Bidón 20L", llenosCargados.b20 > 0 ? `${llenosCargados.b20} unidades` : "—"]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
      key: l,
      style: {
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "0.5px solid var(--color-border-tertiary)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--color-text-secondary)"
      }
    }, l, " cargado"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 500,
        color: "var(--color-text-primary)"
      }
    }, v)))), /*#__PURE__*/React.createElement("div", {
      style: {
        ...s.card,
        margin: "0 0 8px",
        padding: "10px 12px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        marginBottom: 8
      }
    }, ["", "Vendido", "Prestado", "Devuelto"].map(h => /*#__PURE__*/React.createElement("div", {
      key: h,
      style: {
        fontSize: 11,
        color: "var(--color-text-tertiary)",
        textAlign: h ? "center" : "left",
        fontWeight: 500
      }
    }, h))), [["Soda", "soda"], ["10L", "b10"], ["20L", "b20"]].map(([label, pk]) => /*#__PURE__*/React.createElement("div", {
      key: pk,
      style: {
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        padding: "7px 0",
        borderTop: "0.5px solid var(--color-border-tertiary)",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--color-text-primary)"
      }
    }, label), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "center",
        fontSize: 15,
        fontWeight: 600,
        color: "var(--color-text-warning)"
      }
    }, vendidosDia[pk] > 0 ? `−${pk === "soda" ? Math.floor(vendidosDia[pk] / CAJON) : vendidosDia[pk]}` : "—"), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "center",
        fontSize: 15,
        fontWeight: 600,
        color: prestadosDia[pk] > 0 ? "var(--color-text-warning)" : "var(--color-text-tertiary)"
      }
    }, prestadosDia[pk] > 0 ? `−${pk === "soda" ? Math.floor(prestadosDia[pk] / CAJON) : prestadosDia[pk]}` : "0"), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "center",
        fontSize: 15,
        fontWeight: 600,
        color: devueltosDia[pk] > 0 ? "var(--color-text-success)" : "var(--color-text-tertiary)"
      }
    }, devueltosDia[pk] > 0 ? `+${pk === "soda" ? Math.floor(devueltosDia[pk] / CAJON) : devueltosDia[pk]}` : "0")))))), /*#__PURE__*/React.createElement("span", {
      style: {
        ...s.sectionTitle,
        padding: "0 0 8px"
      }
    }, "LO QUE VUELVE A SODERÍA"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12,
        color: "var(--color-text-tertiary)",
        margin: "-4px 0 12px"
      }
    }, "Salió, vuelve y lo que queda. Si algo no coincide con lo cargado, corregilo vos."), [["Soda", "soda"], ["Bidón 10L", "b10"], ["Bidón 20L", "b20"]].map(([label, pk]) => {
      const cajon = pk === "soda" ? CAJON : 1;
      const unidad = pk === "soda" ? "cajones" : "unidades";
      const div = n => pk === "soda" ? Math.floor(n / cajon) : n;
      const AZUL = "#5daaff",
        AMBAR = "#f5b942",
        VIOLETA = "#b794f6";
      const llenReal = realesLlenos[pk] !== "" ? Number(realesLlenos[pk]) * cajon : sobrantes[pk];
      const paraLlenarReal = realesParaLlenar[pk] !== "" ? Number(realesParaLlenar[pk]) * cajon : paraLlenarCalc[pk] * cajon;
      const vacReal = realesVacios[pk] !== "" ? Number(realesVacios[pk]) * cajon : vaciosRestoCalc[pk] * cajon;
      const salio = llenosCargados[pk];
      const vuelveTotal = llenReal + paraLlenarReal + vacReal;
      const esperado = salio + devueltosDia[pk] - prestadosDia[pk];
      const cuadra = vuelveTotal === esperado;
      const quedaLleno = (soderiaActual[planKeyToSk[pk]] || 0) + llenReal;
      const quedaVacio = (soderiaVaciosActual[planKeyToSk[pk]] || 0) + vacReal;
      const totalFlota = quedaLleno + quedaVacio + paraLlenarReal + enDeposito[pk] + totClientesFijos[pk] + enClientesActual[pk];
      const cuadraFijo = totalFlota === CAPACIDAD_FIJA[pk];
      const filaCampo = (titulo, valor, color) => {
        const etiqueta = /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 12,
            color: "var(--color-text-secondary)"
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            marginRight: 6
          }
        }), titulo);
        const valorEl = /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 14,
            fontWeight: 600,
            color: color || "var(--color-text-primary)"
          }
        }, div(valor));
        return /*#__PURE__*/React.createElement("div", {
          key: titulo,
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 0"
          }
        }, etiqueta, valorEl);
      };
      return /*#__PURE__*/React.createElement("div", {
        key: pk,
        style: {
          ...s.card,
          margin: "0 0 10px",
          padding: "12px"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
          paddingBottom: 8,
          borderBottom: "0.5px solid var(--color-border-tertiary)"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-text-primary)"
        }
      }, label), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 20,
          fontWeight: 700,
          color: cuadraFijo ? "var(--color-text-primary)" : "var(--color-text-danger)"
        }
      }, div(totalFlota), " ", /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 400,
          color: "var(--color-text-tertiary)"
        }
      }, unidad))), filaCampo("Salió hoy", salio, "var(--color-text-tertiary)"), filaCampo("Vuelve lleno", llenReal, AZUL), filaCampo("Vuelve vacío", vacReal + paraLlenarReal, AMBAR), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 0 6px 14px"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: VIOLETA
        }
      }, "↳ ¿Cuántos llenás hoy?"), /*#__PURE__*/React.createElement("input", {
        type: "number",
        min: 0,
        value: realesParaLlenar[pk],
        placeholder: String(paraLlenarCalc[pk]),
        style: {
          padding: "5px 2px",
          borderRadius: 7,
          border: `1.5px solid ${VIOLETA}`,
          background: "var(--color-background-tertiary)",
          color: VIOLETA,
          fontSize: 14,
          fontWeight: 600,
          textAlign: "center",
          width: 64,
          boxSizing: "border-box"
        },
        onChange: e => setRealesParaLlenar(r => ({
          ...r,
          [pk]: e.target.value
        }))
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          margin: "8px 0 4px"
        }
      }, /*#__PURE__*/React.createElement("input", {
        type: "number",
        min: 0,
        value: realesLlenos[pk],
        placeholder: String(Math.floor(sobrantes[pk] / cajon)),
        title: "Corregir Vuelve lleno",
        style: {
          padding: "5px 2px",
          borderRadius: 7,
          border: `1px solid ${AZUL}`,
          background: "var(--color-background-tertiary)",
          color: AZUL,
          fontSize: 12,
          textAlign: "center",
          width: "100%",
          boxSizing: "border-box"
        },
        onChange: e => setRealesLlenos(r => ({
          ...r,
          [pk]: e.target.value
        }))
      }), /*#__PURE__*/React.createElement("input", {
        type: "number",
        min: 0,
        value: realesVacios[pk],
        placeholder: String(vaciosRestoCalc[pk]),
        title: "Corregir Vuelve vacío (resto)",
        style: {
          padding: "5px 2px",
          borderRadius: 7,
          border: `1px solid ${AMBAR}`,
          background: "var(--color-background-tertiary)",
          color: AMBAR,
          fontSize: 12,
          textAlign: "center",
          width: "100%",
          boxSizing: "border-box"
        },
        onChange: e => setRealesVacios(r => ({
          ...r,
          [pk]: e.target.value
        }))
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          borderTop: "0.5px solid var(--color-border-tertiary)",
          marginTop: 8,
          paddingTop: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          marginBottom: 4
        }
      }, "Queda en sodería"), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 12,
          fontSize: 12
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: AZUL
        }
      }, "● Lleno ", div(quedaLleno)), /*#__PURE__*/React.createElement("span", {
        style: {
          color: VIOLETA
        }
      }, "● A llenar ", div(paraLlenarReal)), /*#__PURE__*/React.createElement("span", {
        style: {
          color: AMBAR
        }
      }, "● Vacío ", div(quedaVacio))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 12,
          fontSize: 12,
          marginTop: 4
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: "var(--color-text-secondary)"
        }
      }, "● Depósito ", div(enDeposito[pk])), /*#__PURE__*/React.createElement("span", {
        style: {
          color: "var(--color-text-secondary)"
        }
      }, "● Clientes ", div(totClientesFijos[pk] + enClientesActual[pk])))), /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: "center",
          marginTop: 8,
          fontSize: 11,
          fontWeight: 600,
          color: cuadra ? "var(--color-text-success)" : "var(--color-text-danger)"
        }
      }, cuadra ? `✓ Cuadra: ${div(vuelveTotal)} de ${div(esperado)}` : `⚠ No cuadra: ${div(vuelveTotal)} de ${div(esperado)} esperados`), /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: "center",
          marginTop: 4,
          fontSize: 11,
          fontWeight: 600,
          color: cuadraFijo ? "var(--color-text-success)" : "var(--color-text-warning)"
        }
      }, cuadraFijo ? `✓ Cuadra con el fijo: ${div(totalFlota)} de ${div(CAPACIDAD_FIJA[pk])}` : `⚠ No cuadra con el fijo: ${div(totalFlota)} de ${div(CAPACIDAD_FIJA[pk])} (${totalFlota > CAPACIDAD_FIJA[pk] ? "sobran " + div(totalFlota - CAPACIDAD_FIJA[pk]) : "faltan " + div(CAPACIDAD_FIJA[pk] - totalFlota)})`));
    }), /*#__PURE__*/React.createElement("button", {
      style: {
        width: "100%",
        padding: "16px",
        borderRadius: 10,
        border: "none",
        background: "var(--color-background-tertiary)",
        borderTop: "2px solid #f5b942",
        color: "#f5b942",
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer"
      },
      onClick: confirmarCierre
    }, "✓ Cerrar día y actualizar stock")));
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
  }, "📦 Stock actualizado"))), /*#__PURE__*/React.createElement("div", {
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
  }, bultosAuto > 0 && /*#__PURE__*/React.createElement("div", null, "📦 ", /*#__PURE__*/React.createElement("b", null, "Bultos auto:"), " ", cajonesCargados || cajonesLlenos || 0, " cajones soda + ", b10Cargados || b10Llenos || 0, " bid.10L + ", b20Cargados || b20Llenos || 0, " bid.20L = ", /*#__PURE__*/React.createElement("b", null, bultosAuto)), pesoAuto > 0 && /*#__PURE__*/React.createElement("div", null, "⚖️ ", /*#__PURE__*/React.createElement("b", null, "Peso auto:"), " ", cajonesCargados || cajonesLlenos || 0, "×13kg + ", b10Cargados || b10Llenos || 0, "×10kg + ", b20Cargados || b20Llenos || 0, "×20kg = ", /*#__PURE__*/React.createElement("b", null, pesoAuto, " kg"))), /*#__PURE__*/React.createElement("span", {
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
  }, totalLlenosIngresados || "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, Object.values(totalesPorProd).reduce((a, p) => a + p.vacios, 0) || "—"), /*#__PURE__*/React.createElement("div", {
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
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0 8px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "var(--color-text-tertiary)",
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.07em"
    }
  }, "Cobranza del día"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "3px 10px"
    },
    onClick: () => setDatos(d => ({
      ...d,
      peso: String(pesoAuto || d.peso || ""),
      bultos: String(bultosAuto || d.bultos || ""),
      efectivo: String(Math.round(cobEfectivo)),
      retenciones: String(cobTransDesc),
      fiado: String(Math.round(cobFiado))
    }))
  }, "↻ Autocompletar desde ventas")), /*#__PURE__*/React.createElement("div", {
    style: s.grid3
  }, [["efectivo", "Efectivo"], ["fiado", "Fiado"], ["retenciones", "Retención 2.5%"]].map(([k, l]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      textAlign: "center"
    }
  }, l), /*#__PURE__*/React.createElement("input", {
    style: {
      ...s.inputNum,
      textAlign: "center"
    },
    type: "number",
    placeholder: "0",
    value: datos[k] || "",
    onChange: e => set(k, e.target.value)
  })))), cobTransBruto > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "10px 0",
      background: "var(--color-background-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-secondary)",
      marginBottom: 8
    }
  }, "Detalle transferencias"), [["Monto bruto", fmt(cobTransBruto), "primary"], ["Retención 2.5%", `−${fmt(cobTransDesc)}`, "danger"], ["Neto recibido", fmt(cobTransNeto), "success"]].map(([l, v, c]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: `var(--color-text-${c})`
    }
  }, v)))), cobSaldos > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px",
      background: "var(--color-background-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, "Cobrado de deuda anterior"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "#4dd9a0"
    }
  }, fmt(cobSaldos)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Observaciones"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...s.input,
      minHeight: 56,
      resize: "vertical"
    },
    placeholder: "Notas del día...",
    value: datos.obs || "",
    onChange: e => set("obs", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
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
    fecha: fecha
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
  }, fmt(cobSaldosTrans))), /*#__PURE__*/React.createElement("div", {
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
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-info)",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    }
  }, "📦 Ventas de otros días (", ventasExtraDia.length, ")"), ventasExtraDia.map(v => {
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
    }, fmt(v.pagadoNum || v.neto || 0)));
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
  }, fmt(extraTotal)))), /*#__PURE__*/React.createElement("div", {
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
    const mixtoTransDia = ventas.filter(v => v._esMixtoTrans && v.fechaKey === fecha);
    const transDelDia = [...todasVentasDia.filter(v => v.pago === "transferencia"), ...mixtoTransDia];
    if (!transDelDia.length) return null;
    return /*#__PURE__*/React.createElement(DetalleTransferencias, {
      ventas: transDelDia,
      ventasPendTrans: ventasPendTrans
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
  }, fmt(ganancia)))), /*#__PURE__*/React.createElement("button", {
    style: s.btnPrimary,
    onClick: () => onGuardar(datos)
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
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        ...s.card,
        margin: "0 0 10px",
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
    }, k === "soda" ? "+caj" : "+")));
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
  }, yaIniciado ? "Actualizar y continuar →" : "🚀 Iniciar y descontar de sodería"), !yaIniciado && /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      width: "100%",
      padding: "12px",
      fontSize: 13,
      borderRadius: 10,
      marginTop: 6
    },
    onClick: () => {
      const nuevaPlanilla = {
        ...planilla,
        iniciado: true,
        productos: Object.fromEntries(Object.entries(cajones).map(([k, v]) => [k, {
          ...(planilla?.productos?.[k] || {}),
          llenos: v
        }]))
      };
      onGuardar(nuevaPlanilla, false);
    }
  }, "Iniciar sin descontar stock")), stock?.soderia && /*#__PURE__*/React.createElement("div", {
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
  }, [["Sifón", stock?.soderia?.sifon || 0], ["Bidón 10L", stock?.soderia?.bidon10 || 0], ["Bidón 20L", stock?.soderia?.bidon20 || 0]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
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
      color: v > 0 ? "var(--color-text-primary)" : "var(--color-text-danger)"
    }
  }, v || 0))))));
}

// ── Atajo: Planilla de los últimos días (lun-vie) sin pasar por Clientes ──
function AtajoPlanillaSemana({
  planillas,
  ventas,
  clientes,
  onSeleccionar,
  onVolver
}) {
  const DIAS_NOMBRE = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const dias5 = [];
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  while (dias5.length < 5) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      const fechaKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      dias5.push({
        fecha: new Date(cur),
        fechaKey,
        dia: DIAS_NOMBRE[dow]
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
    const cerrada = !!(pl && pl._diaCerrado);
    const iniciada = !!(pl && pl.iniciado);
    const totalClientes = (clientes || []).filter(c => c.dia === dia).length;
    const entregas = (ventas || []).filter(v => v.fechaKey === fechaKey).length;
    const label = fecha.toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
    return /*#__PURE__*/React.createElement("button", {
      key: fechaKey + "_" + dia,
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
    }, label, totalClientes ? ` · ${entregas}/${totalClientes} entregas` : "")), /*#__PURE__*/React.createElement("div", {
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
    }, "Cerrada ✓") : iniciada ? /*#__PURE__*/React.createElement("span", {
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
