// ════════════════════════════════════════════════════════════════════
// ◆  10-gestion.js — GestionClientes, FormCliente
// ════════════════════════════════════════════════════════════════════

function GestionClientes({
  clientes,
  onEditar,
  onEliminar,
  onNuevo,
  onVolver,
  onReordenarTodo,
  onRegistrarVenta,
  onVerDetalle,
  ventas,
  productos,
  onGuardarCambio,
  onIrTab,
  onPerdida
}) {
  const [fotoClienteId, setFotoClienteId] = React.useState(null);
  const fotoCliente = fotoClienteId ? clientes.find(c => c.id === fotoClienteId) : null;
  const [busqueda, setBusqueda] = useState("");
  const [filtroDia, setFiltroDia] = useState("todos");
  const [modoNuevo, setModoNuevo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [cambioId, setCambioId] = useState(null);
  const [productoViejoCambio, setProductoViejoCambio] = useState("Bidón 20L");
  const [productoNuevoCambio, setProductoNuevoCambio] = useState("Bidón 20L");
  const [motivoCambio, setMotivoCambio] = useState("Agua en mal estado");
  const [clienteMoviendo, setClienteMoviendo] = useState(null); // id del cliente "levantado", esperando destino (mismo día)

  const moverCliente = (idOrigen, idDestino) => {
    if (idOrigen === idDestino) return;
    const origen = clientes.find(c => c.id === idOrigen);
    const destino = clientes.find(c => c.id === idDestino);
    if (!origen || !destino) return;
    if (origen.dia !== destino.dia) {
      alert("Solo podés reordenar dentro del mismo día.");
      return;
    }
    const delDia = [...clientes].filter(c => c.dia === origen.dia).sort((a, b) => (a.orden || 9999) - (b.orden || 9999));
    const idsDelDia = delDia.map(c => c.id);
    const idxOrigen = idsDelDia.indexOf(idOrigen),
      idxDestino = idsDelDia.indexOf(idDestino);
    if (idxOrigen === -1 || idxDestino === -1) return;
    const nuevoOrden = [...idsDelDia];
    const [item] = nuevoOrden.splice(idxOrigen, 1);
    nuevoOrden.splice(idxDestino, 0, item);
    const posMap = {};
    nuevoOrden.forEach((id, i) => {
      posMap[id] = i + 1;
    });
    onReordenarTodo(clientes.map(c => posMap[c.id] !== undefined ? {
      ...c,
      orden: posMap[c.id]
    } : c));
  };

  // Calcular envases extra por cliente
  const extraEnvases = React.useMemo(() => {
    const m = {};
    const KP = {
      "Sifón 1.5L": "sifon",
      "Bidón 10L": "bidon10",
      "Bidón 20L": "bidon20",
      "Dispenser": "dispenser"
    };
    (ventas || []).forEach(v => {
      if (!m[v.clienteId]) m[v.clienteId] = {
        sifon: 0,
        bidon10: 0,
        bidon20: 0,
        dispenser: 0
      };
      (v.envPrest || []).forEach(e => {
        const k = KP[e.prod];
        if (k) m[v.clienteId][k] += Number(e.cant) || 0;
      });
      (v.envDev || []).forEach(e => {
        const k = KP[e.prod];
        if (k) m[v.clienteId][k] -= Number(e.cant) || 0;
      });
    });
    return m;
  }, [ventas]);
  const filtrados = clientes.filter(c => filtroDia === "todos" || c.dia === filtroDia).filter(c => buscarCliente(c, busqueda) > 0).sort((a, b) => {
    // Con búsqueda activa: primero las coincidencias por DOMICILIO
    if (busqueda.trim()) {
      const dif = buscarCliente(b, busqueda) - buscarCliente(a, busqueda);
      if (dif !== 0) return dif;
    }
    if (a.dia !== b.dia) return DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia);
    return (a.orden || 9999) - (b.orden || 9999);
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: "Gestión de clientes",
    onVolver: onVolver
  }), onIrTab && /*#__PURE__*/React.createElement(ClientesTabs, {
    activo: "todos",
    onIr: onIrTab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px 6px"
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...s.input,
      background: "var(--color-background-info)",
      border: "0.5px solid var(--color-border-info)"
    },
    placeholder: "Buscar por domicilio, nombre o teléfono...",
    value: busqueda,
    onChange: e => setBusqueda(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, ["todos", ...DIAS].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "3px 10px",
      background: filtroDia === d ? "#185FA5" : "var(--color-background-tertiary)",
      color: filtroDia === d ? "#e2eaf4" : "var(--color-text-secondary)",
      border: filtroDia === d ? "none" : "0.5px solid var(--color-border-secondary)"
    },
    onClick: () => setFiltroDia(d)
  }, d === "todos" ? "Todos" : d)), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "3px 10px",
      marginLeft: "auto",
      background: "#185FA5",
      color: "#e2eaf4",
      border: "none"
    },
    onClick: () => {
      setModoNuevo(true);
      setEditandoId(null);
    }
  }, "+ Nuevo"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "3px 10px"
    },
    onClick: () => {
      const porDia = {};
      DIAS.forEach(d => {
        porDia[d] = [...clientes].filter(c => c.dia === d).sort((a, b) => (a.orden || 9999) - (b.orden || 9999));
      });
      const compactados = clientes.map(c => {
        const lista = porDia[c.dia];
        const idx = lista.findIndex(x => x.id === c.id);
        return idx >= 0 ? {
          ...c,
          orden: idx + 1
        } : c;
      });
      if (window.confirm("¿Reordenar todos los clientes eliminando los huecos en la numeración?")) onReordenarTodo(compactados);
    }
  }, "↺ Reordenar")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: clienteMoviendo ? "var(--color-text-warning)" : "var(--color-text-tertiary)",
      marginTop: 6,
      fontWeight: clienteMoviendo ? 600 : 400
    }
  }, clienteMoviendo ? `📍 Tocá el # de dónde debería ir "${clientes.find(c => c.id === clienteMoviendo)?.nombre || ""}" (mismo día · tocá el mismo para cancelar)` : `${filtrados.length} clientes${filtroDia !== "todos" ? ` · ${filtroDia}` : ""} · Tocá el # de un cliente para moverlo dentro de su día`)), modoNuevo && /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "6px 14px",
      borderLeft: "3px solid #185FA5"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.row,
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "Nuevo cliente"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "3px 10px"
    },
    onClick: () => setModoNuevo(false)
  }, "Cancelar")), /*#__PURE__*/React.createElement(FormCliente, {
    inicial: {
      nombre: "",
      dia: "Martes",
      barrio: "",
      manzana: "",
      lote: "",
      sector: "",
      calle: "",
      nro: "",
      aclaracion: "",
      telefono: "",
      maps: "",
      notas: "",
      sifon: 0,
      bidon10: 0,
      bidon20: 0,
      orden: ""
    },
    onGuardar: datos => {
      onNuevo(datos);
      setModoNuevo(false);
    }
  })), filtrados.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      ...s.card,
      borderLeft: editandoId === c.id ? "3px solid #5daaff" : "0.5px solid var(--color-border-tertiary)"
    }
  }, editandoId === c.id ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.row,
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "Editando"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "3px 10px"
    },
    onClick: () => setEditandoId(null)
  }, "Cancelar")), /*#__PURE__*/React.createElement(FormCliente, {
    inicial: c,
    onGuardar: datos => {
      onEditar(c.id, datos);
      setEditandoId(null);
    }
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      cursor: onVerDetalle ? "pointer" : "default"
    },
    onClick: () => onVerDetalle && onVerDetalle(c)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      flexShrink: 0,
      background: clienteMoviendo === c.id ? "#185FA5" : clienteMoviendo && clientes.find(x => x.id === clienteMoviendo)?.dia === c.dia ? "var(--color-background-warning)" : "var(--color-background-tertiary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 600,
      color: clienteMoviendo === c.id ? "#fff" : clienteMoviendo && clientes.find(x => x.id === clienteMoviendo)?.dia === c.dia ? "var(--color-text-warning)" : "var(--color-text-tertiary)",
      border: clienteMoviendo === c.id ? "1.5px solid #5daaff" : "none"
    },
    onClick: e => {
      e.stopPropagation();
      if (clienteMoviendo === null) setClienteMoviendo(c.id);else if (clienteMoviendo === c.id) setClienteMoviendo(null);else {
        moverCliente(clienteMoviendo, c.id);
        setClienteMoviendo(null);
      }
    }
  }, clienteMoviendo === c.id ? "✓" : c.orden || "#"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 18,
      color: "var(--color-text-primary)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, c.nombre), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 20,
      background: "var(--color-background-success)",
      color: "var(--color-text-success)",
      flexShrink: 0
    }
  }, c.dia)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-primary)",
      fontWeight: 600,
      marginTop: 3
    }
  }, direccionCliente(c)), c.notas && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-warning)",
      marginTop: 2
    }
  }, "📝 ", c.notas), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 7
    }
  }, c.saldo < 0 && /*#__PURE__*/React.createElement("span", {
    style: s.badge("danger")
  }, "Debe ", fmt(Math.abs(c.saldo))), c.saldo > 0 && /*#__PURE__*/React.createElement("span", {
    style: s.badge("success")
  }, "A favor ", fmt(c.saldo)), (() => {
    const ex = extraEnvases[c.id] || {};
    const aj = c.envAjuste || {};
    const real = {
      sifon: Math.max(0, (Number(c.sifon) || 0) + (ex.sifon || 0) + (aj.sifon || 0)),
      bidon10: Math.max(0, (Number(c.bidon10) || 0) + (ex.bidon10 || 0) + (aj.bidon10 || 0)),
      bidon20: Math.max(0, (Number(c.bidon20) || 0) + (ex.bidon20 || 0) + (aj.bidon20 || 0))
    };
    const pill = txt => /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 20,
        background: "var(--color-background-info)",
        color: "var(--color-text-info)"
      }
    }, txt);
    return /*#__PURE__*/React.createElement(React.Fragment, null, real.sifon > 0 && pill(`Sif ×${real.sifon}`), real.bidon10 > 0 && pill(`10L ×${real.bidon10}`), real.bidon20 > 0 && pill(`20L ×${real.bidon20}`), c.dispenser > 0 && pill(`Disp ×${c.dispenser}`));
  })())), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      flexShrink: 0,
      alignItems: "center"
    }
  }, (c.maps || c.lat && c.lng) && /*#__PURE__*/React.createElement("a", {
    href: c.maps || `https://www.google.com/maps?q=${c.lat},${c.lng}`,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 18,
      textDecoration: "none"
    },
    onClick: e => e.stopPropagation()
  }, "📍"), c.telefono && /*#__PURE__*/React.createElement("a", {
    href: `https://wa.me/54${c.telefono}`,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 18,
      textDecoration: "none"
    },
    onClick: e => e.stopPropagation()
  }, "💬"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      cursor: "pointer",
      lineHeight: 1
    },
    onClick: e => {
      e.stopPropagation();
      setFotoClienteId(fotoClienteId === c.id ? null : c.id);
    }
  }, "📷"))), /*#__PURE__*/React.createElement(PieEnvases, {
    c: c,
    ventas: ventas,
    onEditar: onEditar,
    onPerdida: onPerdida,
    izquierda: /*#__PURE__*/React.createElement("button", {
      style: {
        width: 28,
        height: 28,
        borderRadius: 8,
        cursor: "pointer",
        background: "var(--color-background-danger)",
        color: "var(--color-text-danger)",
        border: "1px solid var(--color-border-danger)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13
      },
      onClick: e => {
        e.stopPropagation();
        onEliminar(c.id);
      },
      title: "Eliminar cliente"
    }, "🗑️")
  }, onRegistrarVenta && /*#__PURE__*/React.createElement("button", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      padding: "5px 12px",
      borderRadius: 20,
      cursor: "pointer",
      background: "#185FA5",
      color: "#e2eaf4",
      border: "none"
    },
    onClick: e => {
      e.stopPropagation();
      onRegistrarVenta(c);
    }
  }, "💰 Venta"), /*#__PURE__*/React.createElement("button", {
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
    onClick: e => {
      e.stopPropagation();
      setCambioId(cambioId === c.id ? null : c.id);
    }
  }, "🔄 Cambio"), /*#__PURE__*/React.createElement("button", {
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
    onClick: e => {
      e.stopPropagation();
      setEditandoId(c.id);
    }
  }, "✏️ Editar")), cambioId === c.id && /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "8px 0 0",
      border: "1px solid #818cf8"
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)",
      marginBottom: 8,
      fontWeight: 500
    }
  }, "🔄 Cambio de envase (no se cobra)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      marginBottom: 4
    }
  }, "Se retira"), /*#__PURE__*/React.createElement("select", {
    style: s.select,
    value: productoViejoCambio,
    onChange: e => setProductoViejoCambio(e.target.value)
  }, (productos || []).map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.nombre
  }, p.nombre)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      marginBottom: 4
    }
  }, "Se entrega"), /*#__PURE__*/React.createElement("select", {
    style: s.select,
    value: productoNuevoCambio,
    onChange: e => setProductoNuevoCambio(e.target.value)
  }, (productos || []).map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.nombre
  }, p.nombre))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      marginBottom: 4
    }
  }, "Motivo"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Ej: Agua en mal estado",
    value: motivoCambio,
    onChange: e => setMotivoCambio(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
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
    onClick: () => setCambioId(null)
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      flex: 2,
      fontSize: 12,
      padding: "8px"
    },
    onClick: () => {
      const vt = {
        id: Date.now(),
        clienteId: c.id,
        cliente: c.nombre,
        dia: c.dia,
        fechaKey: new Date().toLocaleDateString("en-CA"),
        fecha: new Date().toLocaleString("es-AR"),
        detalle: [{
          nombre: "Cambio de envase",
          cantidad: 1,
          precio: 0,
          total: 0
        }],
        pago: "cambio",
        obs: `Cambio: ${productoViejoCambio} → ${productoNuevoCambio}${motivoCambio.trim() ? ` · ${motivoCambio.trim()}` : ""}`,
        neto: 0,
        bruto: 0,
        desc: 0,
        costo: 0,
        ganancia: 0,
        pagadoNum: 0,
        saldoDelta: 0,
        envDev: [{
          prod: productoViejoCambio,
          cant: 1
        }],
        envPrest: [{
          prod: productoNuevoCambio,
          cant: 1
        }],
        _esCambio: true,
        _upd: Date.now()
      };
      onGuardarCambio && onGuardarCambio(vt);
      setCambioId(null);
      setMotivoCambio("Agua en mal estado");
    }
  }, "✓ Registrar cambio")))))), filtrados.length === 0 && !modoNuevo && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "40px 20px",
      color: "var(--color-text-tertiary)",
      fontSize: 14
    }
  }, "No hay clientes", filtroDia !== "todos" ? ` en ${filtroDia}` : "", ".")), fotoClienteId && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.92)",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    },
    onClick: () => setFotoClienteId(null)
  }, fotoCliente && fotoCliente.foto ? /*#__PURE__*/React.createElement("img", {
    src: fotoCliente.foto,
    alt: "Domicilio",
    style: {
      maxWidth: "100%",
      maxHeight: "60vh",
      borderRadius: 10,
      objectFit: "contain",
      marginBottom: 16
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#aaa",
      fontSize: 14,
      marginBottom: 20
    }
  }, "Sin foto aún · ", fotoCliente && fotoCliente.nombre), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      background: "#185FA5",
      color: "#e2eaf4",
      padding: "12px 20px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      textAlign: "center"
    }
  }, "📷 Cámara", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    capture: "environment",
    style: {
      display: "none"
    },
    onChange: async e => {
      const f = e.target.files[0];
      if (!f) return;
      const b64 = await comprimirFoto(f);
      onEditar(fotoClienteId, {
        foto: b64
      });
      setFotoClienteId(null);
    }
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      background: "#2a3a4a",
      color: "#e2eaf4",
      padding: "12px 20px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      textAlign: "center"
    }
  }, "🖼 Galería", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: async e => {
      const f = e.target.files[0];
      if (!f) return;
      const b64 = await comprimirFoto(f);
      onEditar(fotoClienteId, {
        foto: b64
      });
      setFotoClienteId(null);
    }
  })), fotoCliente && fotoCliente.foto && /*#__PURE__*/React.createElement("button", {
    style: {
      background: "#3a2020",
      color: "#e05c5c",
      padding: "12px 14px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      border: "none"
    },
    onClick: () => {
      onEditar(fotoClienteId, {
        foto: ""
      });
      setFotoClienteId(null);
    }
  }, "🗑")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#aaa",
      fontSize: 11,
      marginTop: 14
    }
  }, "Tocá fuera para cerrar")));
}

// ── CargaGPSMasiva ────────────────────────────────────────────────────────────
function CargaGPSMasiva({
  clientes,
  onActualizar,
  onVolver
}) {
  const sinGPS = React.useMemo(() => (clientes || []).filter(c => !c.lat || !c.lng), []);
  const [idx, setIdx] = React.useState(0);
  const [latVal, setLatVal] = React.useState("");
  const [lngVal, setLngVal] = React.useState("");
  const [guardados, setGuardados] = React.useState(0);
  const [listo, setListo] = React.useState(false);
  const actualizados = React.useRef([...clientes]);
  const cliente = sinGPS[idx] || null;
  const coordsDelLink = cliente?.maps ? extraerCoordsDeURL(cliente.maps) : null;
  React.useEffect(() => {
    if (!cliente) return;
    if (coordsDelLink) {
      setLatVal(String(coordsDelLink.lat));
      setLngVal(String(coordsDelLink.lng));
    } else {
      setLatVal("");
      setLngVal("");
    }
  }, [idx]);
  const guardarYSiguiente = (omitir = false) => {
    if (!omitir && cliente) {
      const lat = parseFloat(latVal),
        lng = parseFloat(lngVal);
      if (!isNaN(lat) && !isNaN(lng)) {
        const i = actualizados.current.findIndex(c => c.id === cliente.id);
        if (i >= 0) actualizados.current[i] = {
          ...actualizados.current[i],
          lat,
          lng
        };
        onActualizar([...actualizados.current]);
        setGuardados(g => g + 1);
      }
    }
    setLatVal("");
    setLngVal("");
    if (idx + 1 >= sinGPS.length) setListo(true);else setIdx(i => i + 1);
  };
  if (sinGPS.length === 0 || listo || !cliente) return /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.screen,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48
    }
  }, "✅"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 600,
      color: "var(--color-text-primary)",
      textAlign: "center"
    }
  }, "¡GPS cargado!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)",
      textAlign: "center"
    }
  }, guardados, " cliente", guardados !== 1 ? "s" : "", " con GPS guardado."), /*#__PURE__*/React.createElement("button", {
    style: s.btnPrimary,
    onClick: onVolver
  }, "Ver mapa →"));
  const progreso = Math.round(idx / sinGPS.length * 100);
  const dir = direccionCliente(cliente);
  const latOk = latVal && lngVal && !isNaN(parseFloat(latVal)) && !isNaN(parseFloat(lngVal));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.screen,
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: `Cargar GPS · ${idx + 1}/${sinGPS.length}`,
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      background: "var(--color-background-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      background: "#185FA5",
      width: `${progreso}%`,
      transition: "width 0.3s"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--color-text-primary)",
      marginBottom: 2
    }
  }, cliente.nombre), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, cliente.dia, " · ", dir), cliente.maps && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--color-text-tertiary)",
      marginTop: 2,
      wordBreak: "break-all"
    }
  }, cliente.maps)), coordsDelLink && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-background-success)",
      borderRadius: 10,
      padding: "10px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-success)",
      fontWeight: 600
    }
  }, "✓ Coordenadas extraídas del link"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-success)"
    }
  }, coordsDelLink.lat.toFixed(5), ", ", coordsDelLink.lng.toFixed(5))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-background-info)",
      borderRadius: 10,
      padding: "10px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-info)",
      fontWeight: 600,
      marginBottom: 4
    }
  }, "📋 Cómo obtener las coordenadas:"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-secondary)",
      lineHeight: 1.8
    }
  }, "1. Tocá ", /*#__PURE__*/React.createElement("b", null, "\"Abrir en Maps\""), " abajo", /*#__PURE__*/React.createElement("br", null), "2. ", /*#__PURE__*/React.createElement("b", null, "Mantené presionado"), " el punto del cliente", /*#__PURE__*/React.createElement("br", null), "3. Aparecen los números arriba: ", /*#__PURE__*/React.createElement("b", null, "-26.865, -65.217"), /*#__PURE__*/React.createElement("br", null), "4. Tocá esos números → ", /*#__PURE__*/React.createElement("b", null, "Copiar"), /*#__PURE__*/React.createElement("br", null), "5. Volvé acá y pegá abajo")), cliente.maps && /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      background: "#1a7a3a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    },
    onClick: () => window.open(cliente.maps, "_blank")
  }, "🗺 Abrir en Google Maps"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      fontSize: 12,
      fontWeight: 600
    }
  }, "Pegá las coordenadas (ej: -26.86590, -65.21780)"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...s.input,
      marginTop: 4
    },
    placeholder: "-26.86590, -65.21780",
    value: latVal && lngVal ? `${latVal}, ${lngVal}` : latVal,
    onChange: e => {
      const raw = e.target.value;
      const m = raw.match(/(-?\d+(?:\.\d+)?)[,;\s]+(-?\d+(?:\.\d+)?)/);
      if (m) {
        setLatVal(m[1]);
        setLngVal(m[2]);
      } else setLatVal(raw);
    }
  }), latOk ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4dd9a0",
      marginTop: 4
    }
  }, "✓ ", latVal, ", ", lngVal) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      marginTop: 4
    }
  }, "Pegá los dos números separados por coma")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      flex: 1,
      padding: "12px",
      fontSize: 13
    },
    onClick: () => guardarYSiguiente(true)
  }, "Omitir →"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      flex: 2,
      opacity: latOk || coordsDelLink ? 1 : 0.4
    },
    disabled: !latOk && !coordsDelLink,
    onClick: () => guardarYSiguiente(false)
  }, "Guardar y siguiente →")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      textAlign: "center"
    }
  }, guardados, " guardados · ", sinGPS.length - idx - 1, " restantes")));
}

// ── MapaClientes ──────────────────────────────────────────────────────────────
function MapaClientes({
  clientes,
  dia,
  fecha,
  ventas,
  noVisitas,
  onSeleccionar,
  onVolver,
  onActualizar
}) {
  const mapRef = React.useRef(null);
  const mapInstRef = React.useRef(null);
  const [leafletOk, setLeafletOk] = React.useState(!!window.L);
  const [filtroDia, setFiltroDia] = React.useState(dia || "todos");
  const [modoCarga, setModoCarga] = React.useState(false);
  const ventasHoy = (ventas || []).filter(v => v.fechaKey === fecha);
  const noVisHoy = (noVisitas || []).filter(v => v.fecha === fecha);
  const _coordsURL = url => {
    if (!url) return null;
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
    m = url.match(/[?&](?:q|ll|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return {
      lat: +m[1],
      lng: +m[2]
    };
    m = url.match(/(-?\d{1,2}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})/);
    if (m) return {
      lat: +m[1],
      lng: +m[2]
    };
    return null;
  };
  const _getCoords = c => {
    if (c.lat && c.lng) return {
      lat: c.lat,
      lng: c.lng
    };
    return _coordsURL(c.maps);
  };
  const clientesFiltrados = (clientes || []).filter(c => {
    if (filtroDia !== "todos" && c.dia !== filtroDia) return false;
    return !!_getCoords(c);
  }).map(c => {
    const co = _getCoords(c);
    return co ? {
      ...c,
      lat: co.lat,
      lng: co.lng
    } : c;
  });
  const sinCoordenadas = (clientes || []).filter(c => (filtroDia === "todos" || c.dia === filtroDia) && !_getCoords(c)).length;
  const entregadosCount = clientesFiltrados.filter(c => ventasHoy.some(v => v.clienteId === c.id)).length;
  const pendientesCount = clientesFiltrados.filter(c => !ventasHoy.some(v => v.clienteId === c.id) && !noVisHoy.some(v => v.clienteId === c.id)).length;

  // ── TODOS los hooks ANTES de cualquier return condicional ──
  React.useEffect(() => {
    if (window.L) {
      setLeafletOk(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletOk(true);
    document.head.appendChild(script);
  }, []);
  React.useEffect(() => {
    if (modoCarga) return; // no inicializar mapa en modo carga
    if (!leafletOk || !mapRef.current) return;
    if (mapInstRef.current) {
      mapInstRef.current.remove();
      mapInstRef.current = null;
    }
    const L = window.L;
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19
    }).addTo(map);
    mapInstRef.current = map;
    const bounds = [];
    clientesFiltrados.forEach(c => {
      const entregado = ventasHoy.some(v => v.clienteId === c.id);
      const noVis = noVisHoy.some(v => v.clienteId === c.id);
      const color = entregado ? "#4dd9a0" : noVis ? "#f07070" : "#5daaff";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.4)">${c.orden || "·"}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });
      const marker = L.marker([c.lat, c.lng], {
        icon
      }).addTo(map);
      const dir = c.calle ? c.calle + " " + (c.nro || "") : c.manzana ? "Mz " + c.manzana + " L " + (c.lote || "") : c.barrio || "";
      marker.bindPopup(`<div style="font-family:sans-serif;min-width:160px">
          <b style="font-size:13px">${c.nombre}</b><br/>
          <span style="font-size:11px;color:#666">${c.dia} · Orden ${c.orden || "-"}</span><br/>
          ${dir}<br/>
          ${entregado ? "<span style='color:#059669;font-weight:600'>✓ Entregado</span>" : noVis ? "<span style='color:#dc2626'>✗ No visitado</span>" : "<span style='color:#2563eb'>Pendiente</span>"}
        </div>`);
      bounds.push([c.lat, c.lng]);
    });
    if (bounds.length > 0) map.fitBounds(bounds, {
      padding: [30, 30]
    });else map.setView([-26.82, -65.2], 13);
    return () => {
      if (mapInstRef.current) {
        mapInstRef.current.remove();
        mapInstRef.current = null;
      }
    };
  }, [leafletOk, modoCarga, filtroDia, clientesFiltrados.length]);

  // return condicional DESPUÉS de todos los hooks
  if (modoCarga) return /*#__PURE__*/React.createElement(CargaGPSMasiva, {
    clientes: clientes,
    onActualizar: onActualizar,
    onVolver: () => setModoCarga(false)
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.screen,
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: "Mapa de clientes",
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      padding: "8px 14px",
      overflowX: "auto",
      background: "var(--color-background-secondary)",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, ["todos", ...DIAS].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    style: {
      ...s.btn,
      padding: "5px 12px",
      fontSize: 12,
      flexShrink: 0,
      background: filtroDia === d ? "#185FA5" : "var(--color-background-tertiary)",
      color: filtroDia === d ? "#e2eaf4" : "var(--color-text-secondary)",
      border: filtroDia === d ? "none" : "0.5px solid var(--color-border-secondary)"
    },
    onClick: () => setFiltroDia(d)
  }, d === "todos" ? "Todos" : d))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      background: "var(--color-background-secondary)",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, [{
    val: clientesFiltrados.length,
    lbl: "Con GPS",
    color: "#5daaff"
  }, {
    val: entregadosCount,
    lbl: "Entregados",
    color: "#4dd9a0"
  }, {
    val: pendientesCount,
    lbl: "Pendientes",
    color: "#f5b942"
  }, {
    val: sinCoordenadas,
    lbl: "Sin GPS",
    color: "var(--color-text-tertiary)"
  }].map((item, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      textAlign: "center",
      padding: "8px 4px",
      borderRight: i < 3 ? "0.5px solid var(--color-border-tertiary)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: item.color
    }
  }, item.val), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "var(--color-text-secondary)"
    }
  }, item.lbl)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      padding: "6px 14px",
      background: "var(--color-background-secondary)",
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, [["#4dd9a0", "Entregado"], ["#5daaff", "Pendiente"], ["#f07070", "No visitado"]].map(([color, lbl]) => /*#__PURE__*/React.createElement("div", {
    key: lbl,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "var(--color-text-secondary)"
    }
  }, lbl)))), leafletOk && clientesFiltrados.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 14,
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40
    }
  }, "📍"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: "var(--color-text-primary)",
      textAlign: "center"
    }
  }, "Sin clientes con GPS"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)",
      textAlign: "center",
      lineHeight: 1.6,
      maxWidth: 280
    }
  }, "Tenés ", sinCoordenadas, " cliente", sinCoordenadas !== 1 ? "s" : "", " sin coordenadas.", /*#__PURE__*/React.createElement("br", null), "Usá la carga masiva para agregarlas en 10-15 minutos."), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      maxWidth: 260
    },
    onClick: () => setModoCarga(true)
  }, "📍 Iniciar carga de GPS (", sinCoordenadas, " clientes)")), !leafletOk && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28
    }
  }, "🗺"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)"
    }
  }, "Cargando mapa...")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      position: "relative",
      display: leafletOk && clientesFiltrados.length > 0 ? "block" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: mapRef,
    style: {
      width: "100%",
      height: "100%",
      minHeight: 400
    }
  }), sinCoordenadas > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setModoCarga(true),
    style: {
      position: "absolute",
      bottom: 16,
      right: 16,
      zIndex: 1000,
      background: "#185FA5",
      color: "#e2eaf4",
      border: "none",
      borderRadius: 24,
      padding: "10px 16px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 3px 12px rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, "📍 Cargar ", sinCoordenadas, " faltantes")));
}
// ════════════════════════════════════════════════════════════════════
// ◆  Prospectos — lista de gente visitada durante una promoción que
//    todavía no es cliente (no la encontraron en casa, se mudó, etc).
//    Se guarda nombre/teléfono/dirección para hacer seguimiento y, cuando
//    corresponda, convertirlo en cliente real (precarga el alta).
// ════════════════════════════════════════════════════════════════════
function Prospectos({ prospectos, onGuardar, onEliminar, onConvertir, onVolver }) {
  const [mostrarForm, setMostrarForm] = React.useState(false);
  const [nombre, setNombre] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [calle, setCalle] = React.useState("");
  const [barrio, setBarrio] = React.useState("");
  const [notas, setNotas] = React.useState("");
  const [verConvertidos, setVerConvertidos] = React.useState(false);

  const limpiarForm = () => {
    setNombre("");
    setTelefono("");
    setCalle("");
    setBarrio("");
    setNotas("");
    setMostrarForm(false);
  };

  const guardar = () => {
    if (!nombre.trim()) {
      alert("⚠️ Poné al menos el nombre.");
      return;
    }
    onGuardar({
      id: (window._lcGenId ? window._lcGenId() : ("p" + Date.now() + "_" + Math.random().toString(36).slice(2, 8))),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      calle: calle.trim(),
      barrio: barrio.trim(),
      notas: notas.trim(),
      estado: "pendiente",
      fecha: new Date().toLocaleDateString("es-AR")
    });
    limpiarForm();
  };

  const lista = (prospectos || [])
    .filter(p => verConvertidos || p.estado !== "convertido")
    .sort((a, b) => (b.id || "").localeCompare(a.id || ""));

  const renderForm = () => {
    if (!mostrarForm) return null;
    return React.createElement("div", { style: s.card },
      React.createElement("div", { style: { marginBottom: 8 } },
        React.createElement("label", { style: s.label }, "Nombre *"),
        React.createElement("input", {
          style: s.input, placeholder: "Nombre y apellido",
          value: nombre, onChange: e => setNombre(e.target.value), autoFocus: true
        })
      ),
      React.createElement("div", { style: { marginBottom: 8 } },
        React.createElement("label", { style: s.label }, "Teléfono (sin 0 ni 15)"),
        React.createElement("input", {
          style: s.input, placeholder: "3816559000",
          value: telefono, onChange: e => setTelefono(e.target.value)
        })
      ),
      React.createElement("div", { style: { ...s.grid2, marginBottom: 8 } },
        React.createElement("div", null,
          React.createElement("label", { style: s.label }, "Calle / altura"),
          React.createElement("input", {
            style: s.input, placeholder: "Calle 123",
            value: calle, onChange: e => setCalle(e.target.value)
          })
        ),
        React.createElement("div", null,
          React.createElement("label", { style: s.label }, "Barrio"),
          React.createElement("input", {
            style: s.input, placeholder: "Barrio",
            value: barrio, onChange: e => setBarrio(e.target.value)
          })
        )
      ),
      React.createElement("div", { style: { marginBottom: 10 } },
        React.createElement("label", { style: s.label }, "Notas (cuándo volver, qué le interesó, etc.)"),
        React.createElement("input", {
          style: s.input, placeholder: "Notas",
          value: notas, onChange: e => setNotas(e.target.value)
        })
      ),
      React.createElement("div", { style: { display: "flex", gap: 8 } },
        React.createElement("button", { style: { ...s.btn, flex: 1 }, onClick: limpiarForm }, "Cancelar"),
        React.createElement("button", { style: { ...s.btnPrimary, flex: 2 }, onClick: guardar }, "Guardar prospecto")
      )
    );
  };

  const renderItem = p => React.createElement("div", {
      key: p.id,
      style: { ...s.card, opacity: p.estado === "convertido" ? 0.55 : 1 }
    },
    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 } },
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" } },
          p.nombre,
          p.estado === "convertido" && React.createElement("span", { style: { ...s.badge("success"), marginLeft: 6 } }, "✓ Cliente")
        ),
        (p.calle || p.barrio) && React.createElement("div", { style: { fontSize: 12, color: "var(--color-text-secondary)" } },
          [p.calle, p.barrio].filter(Boolean).join(" · ")
        )
      ),
      React.createElement("span", { style: { fontSize: 11, color: "var(--color-text-tertiary)" } }, p.fecha)
    ),
    p.notas && React.createElement("div", { style: { fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 } }, "📝 ", p.notas),
    React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
      p.telefono && React.createElement("a", {
        href: `https://wa.me/54${p.telefono}?text=${encodeURIComponent(`Hola ${p.nombre}! Te contacto de La Catalina, pasamos por tu casa hace poco. ¿Te interesa que te llevemos agua?`)}`,
        target: "_blank", rel: "noreferrer",
        style: { ...s.btn, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }
      }, "💬 WhatsApp"),
      p.estado !== "convertido" && React.createElement("button", {
        style: { ...s.btn, background: "#185FA5", color: "#fff", border: "none" },
        onClick: () => onConvertir(p)
      }, "✓ Convertir en cliente"),
      React.createElement("button", {
        style: { ...s.btnDanger, marginLeft: "auto" },
        onClick: () => { if (window.confirm(`¿Eliminar el prospecto "${p.nombre}"?`)) onEliminar(p.id); }
      }, "Eliminar")
    )
  );

  return React.createElement("div", { style: s.screen },
    React.createElement(HeaderApp, { titulo: "Promociones · Prospectos", onVolver: onVolver }),
    React.createElement("div", { style: { padding: "10px 14px 0" } },
      React.createElement("p", { style: { fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 10 } },
        "Gente que visitaste en una promoción y todavía no es cliente (no estaba en casa, se mudó, etc). Anotá el contacto acá para hacer seguimiento después."
      ),
      !mostrarForm && React.createElement("button", {
        style: { ...s.btnPrimary, marginBottom: 10 },
        onClick: () => setMostrarForm(true)
      }, "➕ Agregar prospecto")
    ),
    renderForm(),
    React.createElement("div", { style: { padding: "4px 14px" } },
      React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-tertiary)", margin: "6px 0" } },
        React.createElement("input", { type: "checkbox", checked: verConvertidos, onChange: e => setVerConvertidos(e.target.checked) }),
        "Ver ya convertidos en clientes"
      )
    ),
    lista.length === 0 && React.createElement("p", {
      style: { fontSize: 13, color: "var(--color-text-tertiary)", padding: "20px 14px", textAlign: "center" }
    }, "Sin prospectos cargados todavía."),
    lista.map(renderItem)
  );
}
