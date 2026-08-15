// ════════════════════════════════════════════════════════════════════
// ◆  05-stock.js — StockGeneral, ConfirmacionesDia
// ════════════════════════════════════════════════════════════════════

function StockGeneral({
  stock,
  setStock,
  clientes,
  setClientes,
  ventas,
  productos,
  setProductos,
  cargasDia,
  setCargasDia,
  planillas,
  perdidas,
  registrarPerdida,
  onVolver,
  onResumen
}) {
  const [clientesAbierto, setClientesAbierto] = React.useState(false);
  const [abiertoSoderia, setAbiertoSoderia] = React.useState(false);
  const [abiertoDeposito, setAbiertoDeposito] = React.useState(false);
  const [abiertoEnClientes, setAbiertoEnClientes] = React.useState(false);
  const [abiertoProductos, setAbiertoProductos] = React.useState(false);
  const [abiertoCarga, setAbiertoCarga] = React.useState(false);
  const [abiertoPerdidas, setAbiertoPerdidas] = React.useState(false);
  const [formPerdida, setFormPerdida] = React.useState({
    producto: "sifon",
    cantidad: "",
    ubicacion: "soderia",
    motivo: "Roto en el reparto"
  });
  const hoyDia = DIAS[(new Date().getDay() + 6) % 7] || "Lunes";
  const [diaCarga, setDiaCarga] = React.useState(DIAS.includes(hoyDia) ? hoyDia : "Lunes");
  const PRODS = [["sifon", "Sifón 1.5L"], ["bidon10", "Bidón 10L"], ["bidon20", "Bidón 20L"], ["dispenser", "Dispenser"]];
  const setLoc = (loc, key, val) => {
    const ns = JSON.parse(JSON.stringify(stock));
    if (!ns[loc]) ns[loc] = {
      sifon: 0,
      bidon10: 0,
      bidon20: 0,
      dispenser: 0
    };
    ns[loc][key] = Math.max(0, Math.round(Number(val) || 0));
    setStock(ns);
  };
  const setClienteEnv = (id, key, val) => {
    setClientes((clientes || []).map(c => c.id === id ? {
      ...c,
      [key]: Math.max(0, Math.round(Number(val) || 0))
    } : c));
  };
  const setProdPrecio = (id, campo, val) => {
    setProductos((productos || []).map(p => p.id === id ? {
      ...p,
      [campo]: Math.max(0, Number(val) || 0)
    } : p));
  };
  const [draftProductos, setDraftProductos] = React.useState(() => JSON.parse(JSON.stringify(productos || [])));
  React.useEffect(() => {
    setDraftProductos(JSON.parse(JSON.stringify(productos || [])));
  }, [productos]);
  const [hayCambiosProd, setHayCambiosProd] = React.useState(false);
  const setDraftPrecio = (id, campo, val) => {
    setDraftProductos(dp => dp.map(p => p.id === id ? {
      ...p,
      [campo]: Math.max(0, Number(val) || 0)
    } : p));
    setHayCambiosProd(true);
  };
  const [mostrarNuevoProd, setMostrarNuevoProd] = React.useState(false);
  const [nuevoProdNombre, setNuevoProdNombre] = React.useState("");
  const [nuevoProdCosto, setNuevoProdCosto] = React.useState("");
  const [nuevoProdPrecio, setNuevoProdPrecio] = React.useState("");
  const setCarga = (dia, key, val) => {
    const nc = JSON.parse(JSON.stringify(cargasDia || {}));
    if (!nc[dia]) nc[dia] = {};
    nc[dia][key] = Math.max(0, Math.round(Number(val) || 0));
    setCargasDia(nc);
  };
  const clientesReales = clientes || [];
  const totClientes = {
    sifon: 0,
    bidon10: 0,
    bidon20: 0,
    dispenser: 0
  };
  clientesReales.forEach(c => {
    totClientes.sifon += Number(c.sifon) || 0;
    totClientes.bidon10 += Number(c.bidon10) || 0;
    totClientes.bidon20 += Number(c.bidon20) || 0;
    totClientes.dispenser += Number(c.dispenser) || 0;
  });

  // ── ARQUEO: envases EXTRA prestados por cliente (calculado desde ventas) ──
  const KEY_PROD = {
    "Sifón 1.5L": "sifon",
    "Bidón 10L": "bidon10",
    "Bidón 20L": "bidon20",
    "Dispenser": "dispenser"
  };
  const extraPorCliente = React.useMemo(() => {
    const m = {};
    (ventas || []).forEach(v => {
      if (!m[v.clienteId]) m[v.clienteId] = {
        sifon: 0,
        bidon10: 0,
        bidon20: 0,
        dispenser: 0
      };
      (v.envPrest || []).forEach(e => {
        const k = KEY_PROD[e.prod];
        if (k) m[v.clienteId][k] += Number(e.cant) || 0;
      });
      (v.envDev || []).forEach(e => {
        const k = KEY_PROD[e.prod];
        if (k) m[v.clienteId][k] -= Number(e.cant) || 0;
      });
    });
    return m;
  }, [ventas]);
  // Prestado TOTAL de un cliente: los 4 productos (incluido dispenser) se
  // leen directo de c.prestado (se mantiene solo, sumando/restando en cada
  // venta — ver aplicarMovimientoEnvases en 14-app.js). Si un cliente
  // todavía no tiene ese campo (no tuvo ventas con envases desde que se
  // agregó), se usa el cálculo viejo por historial + ajuste manual como
  // referencia inicial.
  const prestadoDe = (c, k) => {
    if (c.prestado && c.prestado[k] !== undefined) return c.prestado[k];
    return Math.max(0, (extraPorCliente[c.id]?.[k] || 0) + (c.envAjuste?.[k] || 0));
  };
  // Al editar a mano en el Arqueo, los 4 productos se guardan directo en
  // c.prestado (antes dispenser quedaba afuera y se guardaba en envAjuste,
  // un campo que prestadoDe/prestadoClienteDe ya no leen una vez que
  // c.prestado.dispenser existe — la edición manual quedaba "perdida").
  const setClientePrestado = (id, k, val) => {
    const n = Math.max(0, Math.round(Number(val) || 0));
    setClientes((clientes || []).map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        prestado: {
          ...(c.prestado || {}),
          [k]: n
        }
      };
    }));
  };
  const [modoArqueo, setModoArqueo] = React.useState("fijos"); // fijos | prestados
  const [buscaArqueo, setBuscaArqueo] = React.useState("");
  const [diaArqueo, setDiaArqueo] = React.useState("todos");
  const totPrestados = {
    sifon: 0,
    bidon10: 0,
    bidon20: 0,
    dispenser: 0
  };
  clientesReales.forEach(c => {
    ["sifon", "bidon10", "bidon20", "dispenser"].forEach(k => {
      totPrestados[k] += prestadoDe(c, k);
    });
  });
  // Total general por producto: Sodería (llenos+vacíos+camión) + Depósito + Clientes (fijos+prestados)
  const totalGeneralDe = k => {
    const enSoderia = (stock.soderia?.[k] || 0) + (stock.soderia_vacios?.[k] || 0) + (stock.camion?.[k] || 0);
    const enDeposito = stock.casa?.[k] || 0;
    const enClientes = (totClientes[k] || 0) + (totPrestados[k] || 0);
    return enSoderia + enDeposito + enClientes;
  };
  const confirmarPerdida = () => {
    const cant = Math.round(Number(formPerdida.cantidad) || 0);
    if (cant <= 0) return;
    const ns = JSON.parse(JSON.stringify(stock));
    if (!ns[formPerdida.ubicacion]) ns[formPerdida.ubicacion] = {
      sifon: 0,
      bidon10: 0,
      bidon20: 0,
      dispenser: 0
    };
    ns[formPerdida.ubicacion][formPerdida.producto] = Math.max(0, (ns[formPerdida.ubicacion][formPerdida.producto] || 0) - cant);
    setStock(ns);
    registrarPerdida && registrarPerdida({
      [formPerdida.producto]: cant
    }, formPerdida.motivo, null);
    setFormPerdida({
      producto: "sifon",
      cantidad: "",
      ubicacion: "soderia",
      motivo: "Roto en el reparto"
    });
  };
  const totalPerdidas = {
    sifon: 0,
    bidon10: 0,
    bidon20: 0,
    dispenser: 0
  };
  (perdidas || []).forEach(p => {
    totalPerdidas.sifon += p.sifon || 0;
    totalPerdidas.bidon10 += p.bidon10 || 0;
    totalPerdidas.bidon20 += p.bidon20 || 0;
    totalPerdidas.dispenser += p.dispenser || 0;
  });
  const inNum = {
    ...s.inputNum,
    padding: "5px 2px",
    fontSize: 13
  };
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: "📦 Stock",
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px 40px"
    }
  }, onResumen && /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      width: "100%",
      marginBottom: 10,
      fontSize: 13,
      fontWeight: 500
    },
    onClick: onResumen
  }, "📊 Ver resumen"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px",
      border: "1px solid var(--color-border-secondary)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--color-text-primary)",
      marginBottom: 2
    }
  }, "Σ Total general"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      marginBottom: 9
    }
  }, "El número real que existe hoy, sea cual sea la ubicación."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 46px 46px 46px 46px 52px",
      gap: 5,
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "Soder."), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "Depós."), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "Client."), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center",
      color: "var(--color-text-danger)"
    }
  }, "Perdi."), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center",
      color: "var(--color-text-success)",
      fontWeight: 600
    }
  }, "Total")), PRODS.map(([k, lbl]) => {
    const enSoderia = (stock.soderia?.[k] || 0) + (stock.soderia_vacios?.[k] || 0) + (stock.camion?.[k] || 0);
    const enDeposito = stock.casa?.[k] || 0;
    const enClientes = (totClientes[k] || 0) + (totPrestados[k] || 0);
    const perdido = totalPerdidas[k] || 0;
    const total = enSoderia + enDeposito + enClientes;
    return /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 46px 46px 46px 46px 52px",
        gap: 5,
        alignItems: "center",
        padding: "5px 0",
        borderTop: "0.5px solid var(--color-border-tertiary)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-primary)"
      }
    }, lbl.replace(" 1.5L", "")), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "center",
        fontSize: 12,
        color: "var(--color-text-secondary)"
      }
    }, enSoderia), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "center",
        fontSize: 12,
        color: "var(--color-text-secondary)"
      }
    }, enDeposito), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "center",
        fontSize: 12,
        color: "var(--color-text-secondary)"
      }
    }, enClientes), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "center",
        fontSize: 12,
        color: perdido > 0 ? "var(--color-text-danger)" : "var(--color-text-tertiary)"
      }
    }, perdido > 0 ? `-${perdido}` : "—"), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "center",
        fontSize: 14,
        fontWeight: 700,
        color: "var(--color-text-success)"
      }
    }, total, k === "sifon" && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "var(--color-text-tertiary)",
        fontWeight: 400
      }
    }, Math.floor(total / 6), " caj")));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-info)",
      margin: "0 0 10px",
      padding: "7px 11px",
      background: "var(--color-background-info)",
      borderRadius: 8
    }
  }, "ℹ️ El ", /*#__PURE__*/React.createElement("b", null, "sifón"), " se cuenta en ", /*#__PURE__*/React.createElement("b", null, "unidades sueltas"), " (6 unidades = 1 cajón)."), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: "var(--color-background-tertiary)",
      border: "none",
      borderRadius: 10,
      padding: "14px 16px",
      marginBottom: abiertoSoderia ? 10 : 0,
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      textAlign: "left"
    },
    onClick: () => setAbiertoSoderia(!abiertoSoderia)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--color-text-info)",
      flex: 1
    }
  }, "🏭 Sodería ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--color-text-tertiary)",
      fontSize: 12
    }
  }, "· de acá sale el camión")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      background: "var(--color-background-primary)",
      color: "var(--color-text-info)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      flexShrink: 0
    }
  }, abiertoSoderia ? "▲" : "▼")), abiertoSoderia && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 52px 52px 46px 52px",
      gap: 6,
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "Llenos"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "Vacíos"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center",
      color: "var(--color-text-secondary)"
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center",
      color: "var(--color-text-info)"
    }
  }, "Base")), PRODS.map(([k, lbl]) => {
    const ll = stock.soderia?.[k] || 0,
      va = stock.soderia_vacios?.[k] || 0;
    const BASE_DEFAULT = { sifon: 150, bidon10: 70, bidon20: 21, dispenser: 0 };
    const base = stock.capacidadFija?.[k] ?? BASE_DEFAULT[k] ?? 0;
    return /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 52px 52px 46px 52px",
        gap: 6,
        alignItems: "center",
        marginBottom: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--color-text-primary)"
      }
    }, lbl), /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: ll,
      onChange: e => setLoc("soderia", k, e.target.value),
      style: inNum
    }), /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: va,
      onChange: e => setLoc("soderia_vacios", k, e.target.value),
      style: inNum
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "center",
        fontSize: 13,
        color: "var(--color-text-secondary)",
        fontWeight: 500
      }
    }, ll + va, k === "sifon" && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "var(--color-text-tertiary)",
        fontWeight: 400
      }
    }, Math.floor((ll + va) / 6), " caj")), /*#__PURE__*/React.createElement("div", {
      style: { textAlign: "center" }
    }, /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: base,
      onChange: e => setLoc("capacidadFija", k, e.target.value),
      style: { ...inNum, borderColor: "var(--color-border-info)" }
    }), k === "sifon" && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "var(--color-text-tertiary)",
        fontWeight: 400
      }
    }, Math.floor(base / 6), " caj")));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: "var(--color-background-tertiary)",
      border: "none",
      borderRadius: 10,
      padding: "14px 16px",
      marginBottom: abiertoDeposito ? 10 : 0,
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      textAlign: "left"
    },
    onClick: () => setAbiertoDeposito(!abiertoDeposito)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--color-text-info)",
      flex: 1
    }
  }, "📦 Depósito ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--color-text-tertiary)",
      fontSize: 12
    }
  }, "· vacíos nuevos, sin uso")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      background: "var(--color-background-primary)",
      color: "var(--color-text-info)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      flexShrink: 0
    }
  }, abiertoDeposito ? "▲" : "▼")), abiertoDeposito && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 7
    }
  }, PRODS.map(([k, lbl]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "var(--color-background-tertiary)",
      borderRadius: 8,
      padding: "6px 9px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-primary)"
    }
  }, lbl.replace(" 1.5L", ""), k === "sifon" && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      display: "block"
    }
  }, Math.floor((stock.casa?.sifon || 0) / 6), " caj")), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: stock.casa?.[k] || 0,
    onChange: e => setLoc("casa", k, e.target.value),
    style: {
      ...inNum,
      width: 48
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: "var(--color-background-tertiary)",
      border: "none",
      borderRadius: 10,
      padding: "14px 16px",
      marginBottom: abiertoEnClientes ? 10 : 0,
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      textAlign: "left"
    },
    onClick: () => setAbiertoEnClientes(!abiertoEnClientes)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--color-text-info)",
      flex: 1
    }
  }, "👥 En clientes ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--color-text-tertiary)",
      fontSize: 12
    }
  }, "· fijos + prestados")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      background: "var(--color-background-primary)",
      color: "var(--color-text-info)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      flexShrink: 0
    }
  }, abiertoEnClientes ? "▲" : "▼")), abiertoEnClientes && /*#__PURE__*/React.createElement(React.Fragment, null, (() => {
    const totGeneral = {
      sifon: totClientes.sifon + totPrestados.sifon,
      bidon10: totClientes.bidon10 + totPrestados.bidon10,
      bidon20: totClientes.bidon20 + totPrestados.bidon20,
      dispenser: totClientes.dispenser + totPrestados.dispenser
    };
    const filas = [["🏠 Fijos", totClientes, "var(--color-text-primary)"], ["📦 Prestados", totPrestados, "var(--color-text-warning)"], ["Σ Total", totGeneral, "var(--color-text-info)"]];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 8,
        background: "var(--color-background-tertiary)",
        borderRadius: 8,
        padding: "7px 9px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "80px 1fr 1fr 1fr 1fr",
        gap: 4,
        fontSize: 12,
        color: "var(--color-text-tertiary)",
        marginBottom: 3
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
    }, "Disp")), filas.map(([l, t, col], i) => /*#__PURE__*/React.createElement("div", {
      key: l,
      style: {
        display: "grid",
        gridTemplateColumns: "80px 1fr 1fr 1fr 1fr",
        gap: 4,
        padding: "3px 0",
        borderTop: i === 2 ? "0.5px solid var(--color-border-secondary)" : "none",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--color-text-secondary)",
        fontSize: 12
      }
    }, l), ["sifon", "bidon10", "bidon20", "dispenser"].map(k => /*#__PURE__*/React.createElement("span", {
      key: k,
      style: {
        textAlign: "center",
        fontSize: 13,
        fontWeight: i === 2 ? 600 : 400,
        color: col
      }
    }, t[k] || 0, k === "sifon" && i === 2 && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "var(--color-text-tertiary)",
        fontWeight: 400
      }
    }, Math.floor((t[k] || 0) / 6), " caj"))))));
  })(), /*#__PURE__*/React.createElement("button", {
    onClick: () => setClientesAbierto(o => !o),
    style: {
      ...s.btn,
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", null, "📋 Arqueo por cliente (", clientesReales.length, ")"), /*#__PURE__*/React.createElement("span", null, clientesAbierto ? "▲" : "▼")), clientesAbierto && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 6
    }
  }, [["fijos", "🏠 Fijos (habituales)"], ["prestados", "📦 Prestados (extra)"]].map(([v, l]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => setModoArqueo(v),
    style: {
      ...s.btn,
      flex: 1,
      fontSize: 12,
      padding: "8px 4px",
      background: modoArqueo === v ? "#185FA5" : "var(--color-background-tertiary)",
      color: modoArqueo === v ? "#e2eaf4" : "var(--color-text-secondary)",
      border: modoArqueo === v ? "none" : "0.5px solid var(--color-border-secondary)"
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      marginBottom: 8,
      lineHeight: 1.5
    }
  }, modoArqueo === "fijos" ? "Envases habituales que el cliente tiene siempre en su poder. Editá directo el número." : "Envases EXTRA prestados. Editá el TOTAL que tiene hoy en su poder · 0 = devolvió todo · negativo = devolvió de más."), /*#__PURE__*/React.createElement("input", {
    style: {
      ...s.input,
      marginBottom: 6,
      fontSize: 13
    },
    placeholder: "🔍 Buscar cliente...",
    value: buscaArqueo,
    onChange: e => setBuscaArqueo(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      marginBottom: 8,
      flexWrap: "wrap"
    }
  }, ["todos", ...DIAS].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    onClick: () => setDiaArqueo(d),
    style: {
      fontSize: 12,
      padding: "3px 9px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      background: diaArqueo === d ? "#185FA5" : "var(--color-background-tertiary)",
      color: diaArqueo === d ? "#e2eaf4" : "var(--color-text-secondary)",
      fontWeight: diaArqueo === d ? 600 : 400
    }
  }, d === "todos" ? "Todos" : d.slice(0, 3)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 42px 42px 42px 42px",
      gap: 4,
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "Sif"), /*#__PURE__*/React.createElement("span", {
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
  }, "Disp")), clientesReales.filter(c => diaArqueo === "todos" || c.dia === diaArqueo).filter(c => buscarCliente(c, buscaArqueo) > 0).sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")).map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 42px 42px 42px 42px",
      gap: 4,
      alignItems: "center",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-text-primary)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, c.nombre, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, c.dia)), modoArqueo === "fijos" ? ["sifon", "bidon10", "bidon20", "dispenser"].map(k => /*#__PURE__*/React.createElement("input", {
    key: k,
    type: "number",
    value: c[k] || 0,
    onChange: e => setClienteEnv(c.id, k, e.target.value),
    style: {
      ...inNum,
      padding: "4px 2px",
      fontSize: 12
    }
  })) : ["sifon", "bidon10", "bidon20", "dispenser"].map(k => {
    const val = prestadoDe(c, k);
    return /*#__PURE__*/React.createElement("input", {
      key: k,
      type: "number",
      value: val,
      onChange: e => setClientePrestado(c.id, k, e.target.value),
      style: {
        ...inNum,
        padding: "4px 2px",
        fontSize: 12,
        fontWeight: val !== 0 ? 600 : 400,
        color: val > 0 ? "var(--color-text-warning)" : val < 0 ? "var(--color-text-success)" : "var(--color-text-tertiary)"
      }
    });
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: "var(--color-background-tertiary)",
      border: "none",
      borderRadius: 10,
      padding: "14px 16px",
      marginBottom: abiertoPerdidas ? 10 : 0,
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      textAlign: "left"
    },
    onClick: () => setAbiertoPerdidas(!abiertoPerdidas)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--color-text-danger)",
      flex: 1
    }
  }, "💔 Pérdidas ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--color-text-tertiary)",
      fontSize: 12
    }
  }, "· rotos o no recuperados")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      background: "var(--color-background-primary)",
      color: "var(--color-text-info)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      flexShrink: 0
    }
  }, abiertoPerdidas ? "▲" : "▼")), abiertoPerdidas && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: "var(--color-background-tertiary)",
      borderRadius: 6,
      padding: "3px 8px",
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, "Sifón ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--color-text-danger)"
    }
  }, totalPerdidas.sifon)), /*#__PURE__*/React.createElement("span", {
    style: {
      background: "var(--color-background-tertiary)",
      borderRadius: 6,
      padding: "3px 8px",
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, "10L ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--color-text-danger)"
    }
  }, totalPerdidas.bidon10)), /*#__PURE__*/React.createElement("span", {
    style: {
      background: "var(--color-background-tertiary)",
      borderRadius: 6,
      padding: "3px 8px",
      fontSize: 12,
      color: "var(--color-text-danger)"
    }
  }, "20L ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--color-text-danger)"
    }
  }, totalPerdidas.bidon20)), /*#__PURE__*/React.createElement("span", {
    style: {
      background: "var(--color-background-tertiary)",
      borderRadius: 6,
      padding: "3px 8px",
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, "Dispenser ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--color-text-danger)"
    }
  }, totalPerdidas.dispenser))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-background-tertiary)",
      borderRadius: 8,
      padding: "10px",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-primary)",
      marginBottom: 8
    }
  }, "Registrar una pérdida"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 70px",
      gap: 6,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: formPerdida.producto,
    onChange: e => setFormPerdida(f => ({
      ...f,
      producto: e.target.value
    })),
    style: {
      ...inNum,
      textAlign: "left"
    }
  }, PRODS.map(([k, lbl]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, lbl))), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 1,
    placeholder: "Cant.",
    value: formPerdida.cantidad,
    onChange: e => setFormPerdida(f => ({
      ...f,
      cantidad: e.target.value
    })),
    style: inNum
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      display: "block",
      marginBottom: 3
    }
  }, "¿De dónde salía?"), /*#__PURE__*/React.createElement("select", {
    value: formPerdida.ubicacion,
    onChange: e => setFormPerdida(f => ({
      ...f,
      ubicacion: e.target.value
    })),
    style: {
      ...inNum,
      textAlign: "left",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "soderia"
  }, "Sodería (llenos)"), /*#__PURE__*/React.createElement("option", {
    value: "soderia_vacios"
  }, "Sodería (vacíos)"), /*#__PURE__*/React.createElement("option", {
    value: "casa"
  }, "Depósito")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      marginTop: 3
    }
  }, "¿Un cliente perdió un envase? Se registra solo al eliminarlo (te pregunta ahí si lo devolvió) — así queda ligado a ese cliente puntual.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      display: "block",
      marginBottom: 3
    }
  }, "Motivo"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formPerdida.motivo,
    onChange: e => setFormPerdida(f => ({
      ...f,
      motivo: e.target.value
    })),
    style: {
      ...inNum,
      textAlign: "left",
      width: "100%"
    },
    placeholder: "Roto en el reparto, se cayó del camión, etc."
  })), /*#__PURE__*/React.createElement("button", {
    onClick: confirmarPerdida,
    style: {
      ...s.btn,
      width: "100%",
      background: "var(--color-background-danger)",
      color: "var(--color-text-danger)",
      border: "1px solid var(--color-border-danger)"
    }
  }, "💔 Registrar pérdida")), (perdidas || []).length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      marginBottom: 6
    }
  }, "Historial (", perdidas.length, ")"), [...perdidas].reverse().slice(0, 20).map(p => {
    const items = [p.sifon && `${p.sifon} Sifón`, p.bidon10 && `${p.bidon10} 10L`, p.bidon20 && `${p.bidon20} 20L`, p.dispenser && `${p.dispenser} Dispenser`].filter(Boolean).join(" · ");
    const fecha = new Date(p.fecha).toLocaleDateString("es-AR");
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        padding: "6px 0",
        borderTop: "0.5px solid var(--color-border-tertiary)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--color-text-primary)"
      }
    }, items), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--color-text-tertiary)"
      }
    }, fecha, " · ", p.motivo, p.clienteNombre ? ` · ${p.clienteNombre}` : ""));
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: "var(--color-background-tertiary)",
      border: "none",
      borderRadius: 10,
      padding: "14px 16px",
      marginBottom: abiertoProductos ? 10 : 0,
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      textAlign: "left"
    },
    onClick: () => setAbiertoProductos(!abiertoProductos)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--color-text-info)"
    }
  }, "🏷️ Productos y precios"), !abiertoProductos && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      marginTop: 2
    }
  }, "De acá salen los precios de la planilla y todas las ventas")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      background: "var(--color-background-primary)",
      color: "var(--color-text-info)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      flexShrink: 0
    }
  }, abiertoProductos ? "▲" : "▼")), abiertoProductos && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      marginBottom: 9
    }
  }, "De acá salen los precios de la planilla y todas las ventas"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 60px 60px 60px",
      gap: 6,
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "Llenado"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center"
    }
  }, "Venta"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "center",
      color: "var(--color-text-success)"
    }
  }, "Stock")), draftProductos.map(p => {
    const k = KEY_PROD[p.nombre];
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 60px 60px 60px",
        gap: 6,
        alignItems: "center",
        marginBottom: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--color-text-primary)"
      }
    }, p.nombre), /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: p.costo || 0,
      onChange: e => setDraftPrecio(p.id, "costo", e.target.value),
      style: {
        ...inNum,
        fontSize: 12
      }
    }), p.esDispenser ? /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "center",
        fontSize: 12,
        color: "var(--color-text-warning)"
      }
    }, "comodato") : /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: p.precio || 0,
      onChange: e => setDraftPrecio(p.id, "precio", e.target.value),
      style: {
        ...inNum,
        fontSize: 12
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "center",
        fontSize: 13,
        fontWeight: 700,
        color: "var(--color-text-success)"
      }
    }, totalGeneralDe(k)));
  }), hayCambiosProd && /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      marginTop: 8,
      background: "#1d9e75",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "9px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    },
    onClick: () => {
      setProductos(draftProductos);
      setHayCambiosProd(false);
    }
  }, "✓ Confirmar cambios de precio"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "0.5px solid var(--color-border-tertiary)",
      margin: "10px 0"
    }
  }), !mostrarNuevoProd ? /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      width: "100%",
      fontSize: 12,
      padding: "8px"
    },
    onClick: () => setMostrarNuevoProd(true)
  }, "+ Agregar producto") : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Nombre (ej: Botellón 5L)",
    value: nuevoProdNombre,
    onChange: e => setNuevoProdNombre(e.target.value),
    style: {
      ...s.input,
      fontSize: 13
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      marginBottom: 3
    }
  }, "Costo llenado"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: nuevoProdCosto,
    onChange: e => setNuevoProdCosto(e.target.value),
    style: {
      ...inNum,
      fontSize: 12,
      width: "100%"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      marginBottom: 3
    }
  }, "Precio venta"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: nuevoProdPrecio,
    onChange: e => setNuevoProdPrecio(e.target.value),
    style: {
      ...inNum,
      fontSize: 12,
      width: "100%"
    }
  }))), /*#__PURE__*/React.createElement("div", {
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
    onClick: () => {
      setMostrarNuevoProd(false);
      setNuevoProdNombre("");
      setNuevoProdCosto("");
      setNuevoProdPrecio("");
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 2,
      background: "#185FA5",
      color: "#e2eaf4",
      border: "none",
      borderRadius: 8,
      padding: "9px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    },
    disabled: !nuevoProdNombre.trim(),
    onClick: () => {
      const nuevo = {
        id: Date.now(),
        nombre: nuevoProdNombre.trim(),
        costo: Number(nuevoProdCosto) || 0,
        precio: Number(nuevoProdPrecio) || 0
      };
      setProductos([...(productos || []), nuevo]);
      setMostrarNuevoProd(false);
      setNuevoProdNombre("");
      setNuevoProdCosto("");
      setNuevoProdPrecio("");
    }
  }, "✓ Agregar"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: "var(--color-background-tertiary)",
      border: "none",
      borderRadius: 10,
      padding: "14px 16px",
      marginBottom: abiertoCarga ? 10 : 0,
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      textAlign: "left"
    },
    onClick: () => setAbiertoCarga(!abiertoCarga)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--color-text-info)",
      flex: 1
    }
  }, "🚐 Carga diaria del camión"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      background: "var(--color-background-primary)",
      color: "var(--color-text-info)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      flexShrink: 0
    }
  }, abiertoCarga ? "▲" : "▼")), abiertoCarga && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      marginBottom: 10,
      flexWrap: "wrap"
    }
  }, DIAS.map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    onClick: () => setDiaCarga(d),
    style: {
      fontSize: 12,
      padding: "4px 9px",
      borderRadius: 7,
      border: "none",
      cursor: "pointer",
      background: diaCarga === d ? "#185FA5" : "var(--color-background-tertiary)",
      color: diaCarga === d ? "#e2eaf4" : "var(--color-text-secondary)",
      fontWeight: diaCarga === d ? 500 : 400
    }
  }, d.slice(0, 3)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 7
    }
  }, [["soda", "Sifón"], ["b10", "Bidón 10L"], ["b20", "Bidón 20L"], ["disp", "Dispenser"]].map(([k, lbl]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "var(--color-background-tertiary)",
      borderRadius: 8,
      padding: "6px 9px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-primary)"
    }
  }, lbl.replace("Bidón ", "").replace(" 1.5L", ""), k === "soda" && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      display: "block"
    }
  }, Math.floor((cargasDia?.[diaCarga]?.soda || 0) / 6), " caj")), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: cargasDia?.[diaCarga]?.[k] || 0,
    onChange: e => setCarga(diaCarga, k, e.target.value),
    style: {
      ...inNum,
      width: 48
    }
  }))))))));
}
function ConfirmacionesDia({
  dia,
  ventas,
  clientes,
  onConfirmar,
  onVolver
}) {
  const [abiertos, setAbiertos] = React.useState({});
  const toggleFecha = fk => setAbiertos(o => ({
    ...o,
    [fk]: !o[fk]
  }));
  const pendientes = ventas.filter(v => !v.transConfirmada);
  const confirmadas = ventas.filter(v => v.transConfirmada);
  const porCliente = {};
  pendientes.forEach(v => {
    if (!porCliente[v.clienteId]) porCliente[v.clienteId] = {
      cliente: clientes.find(c => c.id === v.clienteId),
      ventas: []
    };
    porCliente[v.clienteId].ventas.push(v);
  });
  const grupos = Object.values(porCliente);
  const totalPendiente = pendientes.reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0);
  const totalConfirmado = confirmadas.reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0);
  const confirmadasPorFecha = {};
  confirmadas.forEach(v => {
    const fk = v.fechaKey || "sin fecha";
    if (!confirmadasPorFecha[fk]) confirmadasPorFecha[fk] = [];
    confirmadasPorFecha[fk].push(v);
  });
  const fechasConf = Object.keys(confirmadasPorFecha).sort().reverse();
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: `Transferencias · ${dia}`,
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px 4px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      flex: 1,
      margin: 0,
      background: "#1e3a5f",
      border: "1px solid #f5b942",
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#f5b942",
      fontWeight: 500,
      textTransform: "uppercase",
      marginBottom: 4
    }
  }, "🔴 Pendientes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "#f5b942"
    }
  }, fmt(totalPendiente)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)"
    }
  }, pendientes.length, " transfer.")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      flex: 1,
      margin: 0,
      background: "#0a2e1f",
      border: "1px solid #4dd9a0",
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#4dd9a0",
      fontWeight: 500,
      textTransform: "uppercase",
      marginBottom: 4
    }
  }, "✓ Confirmadas"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "#4dd9a0"
    }
  }, fmt(totalConfirmado)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)"
    }
  }, confirmadas.length, " transfer."))), grupos.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: "center",
      padding: "20px 0",
      color: "var(--color-text-tertiary)",
      fontSize: 14
    }
  }, "✓ No hay transferencias pendientes para ", dia), grupos.map(({
    cliente: c,
    ventas: vts
  }) => /*#__PURE__*/React.createElement("div", {
    key: c?.id || Math.random(),
    style: {
      ...s.card,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, c?.nombre || "Cliente desconocido"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--color-text-secondary)",
      marginTop: 2
    }
  }, direccionCliente(c))), c?.telefono && /*#__PURE__*/React.createElement("a", {
    href: `https://wa.me/54${c.telefono}`,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 20,
      textDecoration: "none"
    }
  }, "💬")), vts.map(v => /*#__PURE__*/React.createElement("div", {
    key: v.id,
    style: {
      ...s.card,
      margin: "0 0 6px",
      background: "var(--color-background-tertiary)",
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)"
    }
  }, v.fechaKey, " · ", v.fecha?.slice(-8) || ""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)",
      marginTop: 2
    }
  }, (v.detalle || []).map(d => `${d.nombre}×${d.cantidad}`).join(" · "))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: "#f5b942"
    }
  }, fmt(v.pagadoNum || v.neto || 0))), /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      padding: "9px",
      borderRadius: 8,
      border: "none",
      background: "#185FA5",
      color: "#e2eaf4",
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer"
    },
    onClick: () => onConfirmar(v.id)
  }, "✓ Confirmar transferencia"))))), fechasConf.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      margin: "8px 0 6px"
    }
  }, "✓ Ya confirmadas"), fechasConf.map(fk => {
    const vtsFecha = confirmadasPorFecha[fk];
    const totalFecha = vtsFecha.reduce((a, v) => a + (v.pagadoNum || v.neto || 0), 0);
    const open = !!abiertos[fk];
    return /*#__PURE__*/React.createElement("div", {
      key: fk,
      style: {
        ...s.card,
        margin: "0 0 6px",
        background: "#0a2e1f",
        border: "0.5px solid #4dd9a0"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer"
      },
      onClick: () => toggleFecha(fk)
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: "#4dd9a0"
      }
    }, "📅 ", fk), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--color-text-tertiary)",
        marginTop: 2
      }
    }, vtsFecha.length, " transferencia", vtsFecha.length !== 1 ? "s" : "")), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 600,
        color: "#4dd9a0"
      }
    }, fmt(totalFecha)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--color-text-tertiary)",
        marginTop: 2
      }
    }, open ? "▲" : "▼"))), open && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        borderTop: "0.5px solid rgba(77,217,160,0.2)",
        paddingTop: 8
      }
    }, vtsFecha.map(v => {
      const c = clientes.find(x => x.id === v.clienteId);
      return /*#__PURE__*/React.createElement("div", {
        key: v.id,
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 0",
          borderBottom: "0.5px solid rgba(77,217,160,0.15)"
        }
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: "var(--color-text-primary)"
        }
      }, c?.nombre || "Cliente"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "var(--color-text-tertiary)",
          marginTop: 1
        }
      }, (v.detalle || []).map(d => `${d.nombre}×${d.cantidad}`).join(" · "))), /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: "right",
          flexShrink: 0,
          marginLeft: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 500,
          color: "#4dd9a0"
        }
      }, fmt(v.pagadoNum || v.neto || 0)), /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 12,
          color: "var(--color-text-tertiary)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px 0",
          textDecoration: "underline"
        },
        onClick: () => onConfirmar(v.id)
      }, "desmarcar")));
    })));
  }))));
}