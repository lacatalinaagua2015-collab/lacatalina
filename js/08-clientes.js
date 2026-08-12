// ════════════════════════════════════════════════════════════════════
// ◆  07-clientes.js — ListaClientes, DetalleCliente (formulario: FormCliente unificado en 03-utils)
// ════════════════════════════════════════════════════════════════════

function ListaClientes({
  clientes,
  dia,
  fecha,
  ventas,
  todasVentas,
  noVisitas,
  recordatorios,
  productos,
  onSeleccionar,
  onEntregar,
  onGuardarVenta,
  onNoQuiereConEnvases,
  onCambiarDispenserCliente,
  onNuevoCliente,
  onVolver,
  onReordenar,
  onEditarCliente,
  onRegistrarNoVisita,
  onQuitarNoVisita,
  onConfirmarTransfer,
  onAbrirMapa,
  onPlanilla,
  onPerdida
}) {
  const [busqueda, setBusqueda] = useState("");
  const [clienteMoviendo, setClienteMoviendo] = useState(null); // id del cliente "levantado", esperando destino
  // Tarjeta de venta compacta expandida in-place (una sola a la vez). Antes
  // "Entregar" navegaba a otra pantalla (NuevaVenta); ahora expande la
  // planilla ahí mismo y la lista sigue debajo, sin cambiar de pantalla.
  const [clienteExpandidoId, setClienteExpandidoId] = useState(null);
  // Auto-scroll al botón "Ir a la planilla del día" apenas se termina de
  // registrar el último cliente pendiente — antes había que darse cuenta y
  // bajar manualmente.
  const btnPlanillaRef = React.useRef(null);
  // ventas y noVisitas ya filtradas por fecha+dia desde App
  const atendidos = new Set(ventas.filter(v => !v._esCobro && !v._esAjuste).map(v => v.clienteId));
  const noVMap = {};
  (noVisitas || []).filter(v => v.fecha === fecha).forEach(v => {
    noVMap[v.clienteId] = v.motivo;
  });
  // visitados = ventas + noesta2 + noquiso (noesta 1ra vez NO cuenta)
  const visitadosSinVenta = new Set(Object.entries(noVMap).filter(([, m]) => m === "noesta2" || m === "noquiso").map(([id]) => Number(id)));
  const visitados = new Set([...atendidos, ...visitadosSinVenta]);
  const marcarNoVisita = (id, motivo) => {
    const prev = noVMap[id];
    if (motivo === "noesta" && prev === "noesta") onRegistrarNoVisita(id, "noesta2");else if (prev === motivo) onQuitarNoVisita(id);else onRegistrarNoVisita(id, motivo);
  };
  const clientesReales = clientes;
  const clientesOrdenados = [...clientesReales].sort((a, b) => (a.orden || 9999) - (b.orden || 9999));
  const filtrados = clientesOrdenados.filter(c => buscarCliente(c, busqueda) > 0);
  const pendientesNormales = filtrados.filter(c => !visitados.has(c.id) && noVMap[c.id] !== "noesta");
  const volverAlFinal = filtrados.filter(c => noVMap[c.id] === "noesta" && !atendidos.has(c.id));
  const pendientes = [...pendientesNormales, ...volverAlFinal];
  const sinEntrega = filtrados.filter(c => visitadosSinVenta.has(c.id));
  const listos = filtrados.filter(c => atendidos.has(c.id));
  const todosListos = clientesReales.length > 0 && clientesReales.filter(c => visitados.has(c.id)).length >= clientesReales.length;
  React.useEffect(() => {
    if (todosListos && btnPlanillaRef.current) {
      btnPlanillaRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [todosListos]);
  const abrirRuta = () => {
    const cp = pendientes.filter(c => c.maps).slice(0, 9);
    if (!cp.length) {
      alert("Ningún pendiente tiene Maps cargado.");
      return;
    }
    const dest = encodeURIComponent(cp[cp.length - 1].maps);
    const wps = cp.slice(0, -1).map(c => encodeURIComponent(c.maps)).join("|");
    window.open(`https://www.google.com/maps/dir/?api=1${wps ? `&waypoints=${wps}` : ""}&destination=${dest}&travelmode=driving`, "_blank");
  };

  // Ruta óptima: ordena los pendientes por cercanía (vecino más cercano) y abre Google Maps
  const abrirRutaOptima = () => {
    const conMaps = pendientes.filter(c => c.maps);
    const conCoords = conMaps.map(c => ({
      c,
      co: extraerCoordsDeURL(c.maps)
    })).filter(x => x.co);
    if (conCoords.length < 2) {
      alert("Para la ruta óptima necesito al menos 2 clientes pendientes cuyo link de Maps tenga las coordenadas adentro. Si tus links no las tienen, usá la ruta normal (🗺).");
      return;
    }
    const rest = [...conCoords];
    const orden = [rest.shift()];
    while (rest.length) {
      const last = orden[orden.length - 1].co;
      let bi = 0,
        bd = Infinity;
      rest.forEach((x, i) => {
        const d = (x.co.lat - last.lat) ** 2 + (x.co.lng - last.lng) ** 2;
        if (d < bd) {
          bd = d;
          bi = i;
        }
      });
      orden.push(rest.splice(bi, 1)[0]);
    }
    const pts = orden.slice(0, 10).map(x => `${x.co.lat},${x.co.lng}`);
    const origin = pts[0],
      dest = pts[pts.length - 1];
    const wps = pts.slice(1, -1).join("|");
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}${wps ? `&waypoints=${encodeURIComponent(wps)}` : ""}&destination=${dest}&travelmode=driving`, "_blank");
    const afuera = conMaps.length - conCoords.length;
    if (afuera > 0) setTimeout(() => alert(`Nota: ${afuera} cliente(s) quedaron afuera de la ruta óptima porque su link de Maps no trae coordenadas.`), 400);
  };
  const moverCliente = (idOrigen, idDestino) => {
    if (idOrigen === idDestino) return;
    const ordenActual = clientesOrdenados.map(c => c.id); // todos los reales del día, en su orden actual
    const idxOrigen = ordenActual.indexOf(idOrigen);
    const idxDestino = ordenActual.indexOf(idDestino);
    if (idxOrigen === -1 || idxDestino === -1) return;
    const nuevoOrden = [...ordenActual];
    const [item] = nuevoOrden.splice(idxOrigen, 1);
    nuevoOrden.splice(idxDestino, 0, item);
    // Renumerar TODO en secuencia (1,2,3...) según la posición nueva —
    // así nunca queda un número peleado con otro cliente.
    const posMap = {};
    nuevoOrden.forEach((id, i) => {
      posMap[id] = i + 1;
    });
    onReordenar(clientes.map(c => posMap[c.id] !== undefined ? {
      ...c,
      orden: posMap[c.id]
    } : c));
  };
  const Card = ({
    c
  }) => {
    const [fotoOpen, setFotoOpen] = React.useState(false);
    const atendido = atendidos.has(c.id),
      est = noVMap[c.id];
    const bc = atendido ? "#1D9E75" : est === "noesta" ? "#EF9F27" : est === "noesta2" || est === "noquiso" ? "#E24B4A" : "var(--color-border-tertiary)";
    const puedeEntregar = (!visitados.has(c.id) || est === "noesta") && !atendido;
    const expandido = clienteExpandidoId === c.id;
    // Al terminar con este cliente (venta registrada, "no está" o "no
    // quiere") saltar directo al siguiente pendiente de la lista en vez de
    // solo cerrar — así se sigue reparto sin tener que buscar y tocar
    // "Entregar" de nuevo cada vez. `pendientes` todavía incluye a `c` en
    // este render (el estado recién se actualiza después), por eso se busca
    // el próximo con id distinto a partir de su posición.
    const irAlSiguientePendiente = () => {
      const idx = pendientes.findIndex(x => x.id === c.id);
      const siguiente = pendientes.find((x, i) => x.id !== c.id && (idx === -1 || i > idx));
      setClienteExpandidoId(siguiente ? siguiente.id : null);
    };
    // Envases extra que tiene el cliente (usa la misma función que Arqueo y Planilla)
    const envExtra = {
      sifon: prestadoClienteDe(c, "sifon", todasVentas || ventas),
      bidon10: prestadoClienteDe(c, "bidon10", todasVentas || ventas),
      bidon20: prestadoClienteDe(c, "bidon20", todasVentas || ventas)
    };
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        ...s.card,
        borderLeft: `3px solid ${bc}`,
        opacity: visitados.has(c.id) ? 0.65 : est === "noesta" ? 0.85 : 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        paddingTop: 2
      },
      onClick: () => {
        if (atendido) return;
        if (clienteMoviendo === null) setClienteMoviendo(c.id);else if (clienteMoviendo === c.id) setClienteMoviendo(null);else {
          moverCliente(clienteMoviendo, c.id);
          setClienteMoviendo(null);
        }
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 8,
        background: clienteMoviendo === c.id ? "#185FA5" : clienteMoviendo && !atendido ? "var(--color-background-warning)" : "var(--color-background-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 600,
        color: clienteMoviendo === c.id ? "#fff" : clienteMoviendo && !atendido ? "var(--color-text-warning)" : "var(--color-text-secondary)",
        cursor: atendido ? "default" : "pointer",
        border: clienteMoviendo === c.id ? "1.5px solid #5daaff" : "0.5px solid var(--color-border-tertiary)"
      }
    }, clienteMoviendo === c.id ? "✓" : c.orden || "#")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        cursor: "pointer",
        minWidth: 0
      },
      onClick: () => onSeleccionar(c)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 500,
        fontSize: 15,
        color: "var(--color-text-primary)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 5
      }
    }, c.nombre, c.foto && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#4dd9a0",
        flexShrink: 0,
        marginLeft: 3
      }
    }, "📷")), (recordatorios || []).some(r => r.clienteId === c.id && !r.confirmado) && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        flexShrink: 0
      },
      title: "Recordatorio pendiente"
    }, "🔔"), (() => {
      const vt = ventas.find(v => v.clienteId === c.id && v.fechaKey === fecha && v.pago === "transferencia");
      if (!vt) return null;
      return /*#__PURE__*/React.createElement("button", {
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px 4px",
          lineHeight: 1,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 3,
          borderRadius: 6,
          background: vt.transConfirmada ? "transparent" : "rgba(245,185,66,0.15)"
        },
        onClick: e => {
          e.stopPropagation();
          onConfirmarTransfer && onConfirmarTransfer(c.id, vt.id);
        },
        title: vt.transConfirmada ? "Transfer. confirmada — tocá para desmarcar" : "Tocá para confirmar transferencia"
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 15
        }
      }, vt.transConfirmada ? "🟢" : "🔴"), !vt.transConfirmada && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 500,
          color: "#f5b942"
        }
      }, fmt(vt.pagadoNum || vt.neto || 0)));
    })()), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        color: "var(--color-text-primary)",
        fontWeight: 600,
        marginTop: 2
      }
    }, direccionCliente(c)), c.notas && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--color-text-warning)",
        marginTop: 2
      }
    }, "📝 ", c.notas), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 5
      }
    }, (() => {
      const real = {
        sifon: Math.max(0, (Number(c.sifon) || 0) + envExtra.sifon),
        bidon10: Math.max(0, (Number(c.bidon10) || 0) + envExtra.bidon10),
        bidon20: Math.max(0, (Number(c.bidon20) || 0) + envExtra.bidon20)
      };
      return /*#__PURE__*/React.createElement(React.Fragment, null, real.sifon > 0 && /*#__PURE__*/React.createElement("span", {
        style: s.tag
      }, "Sifón×", real.sifon), real.bidon10 > 0 && /*#__PURE__*/React.createElement("span", {
        style: s.tag
      }, "10L×", real.bidon10), real.bidon20 > 0 && /*#__PURE__*/React.createElement("span", {
        style: s.tag
      }, "20L×", real.bidon20), c.dispenser > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          ...s.tag,
          color: "#5daaff"
        }
      }, "Disp×", c.dispenser));
    })(), atendido && /*#__PURE__*/React.createElement("span", {
      style: s.badge("success")
    }, "✓ Listo"), est === "noesta" && !atendido && /*#__PURE__*/React.createElement("span", {
      style: s.badge("warning")
    }, "🔄 No estaba aún"), est === "noesta2" && /*#__PURE__*/React.createElement("span", {
      style: s.badge("warning")
    }, "No estaba"), est === "noquiso" && /*#__PURE__*/React.createElement("span", {
      style: s.badge("danger")
    }, "No quiso"), c.saldo < 0 && /*#__PURE__*/React.createElement("span", {
      style: s.badge("danger")
    }, "Debe ", fmt(Math.abs(c.saldo))), c.saldo > 0 && /*#__PURE__*/React.createElement("span", {
      style: s.badge("success")
    }, "A favor ", fmt(c.saldo)))), /*#__PURE__*/React.createElement("div", {
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
        fontSize: 17,
        textDecoration: "none",
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 9,
        background: "var(--color-background-tertiary)",
        border: "0.5px solid var(--color-border-secondary)"
      }
    }, "📍"), c.telefono && /*#__PURE__*/React.createElement("a", {
      href: `https://wa.me/54${c.telefono}`,
      target: "_blank",
      rel: "noreferrer",
      style: {
        fontSize: 17,
        textDecoration: "none",
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 9,
        background: "var(--color-background-tertiary)",
        border: "0.5px solid var(--color-border-secondary)"
      }
    }, "💬"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 17,
        cursor: "pointer",
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 9,
        background: "var(--color-background-tertiary)",
        border: "0.5px solid var(--color-border-secondary)"
      },
      title: "Foto domicilio",
      onClick: e => {
        e.stopPropagation();
        setFotoOpen(true);
      }
    }, "📷"))), puedeEntregar && !expandido && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        background: "var(--color-background-warning)",
        color: "var(--color-text-warning)",
        border: "1px solid var(--color-border-warning)",
        borderRadius: 10,
        padding: "10px 0",
        fontSize: 13,
        cursor: "pointer",
        fontWeight: 500,
        flex: 1
      },
      onClick: () => marcarNoVisita(c.id, est === "noesta" ? "noesta2" : "noesta")
    }, est === "noesta" ? "2ª vez" : "🔄 No está"), /*#__PURE__*/React.createElement("button", {
      style: {
        background: "var(--color-background-danger)",
        color: "var(--color-text-danger)",
        border: "1px solid var(--color-border-danger)",
        borderRadius: 10,
        padding: "10px 0",
        fontSize: 13,
        cursor: "pointer",
        fontWeight: 500,
        flex: 1
      },
      onClick: () => marcarNoVisita(c.id, "noquiso")
    }, "No quiere"), /*#__PURE__*/React.createElement("button", {
      style: {
        background: "#185FA5",
        color: "#e2eaf4",
        border: "none",
        borderRadius: 10,
        padding: "10px 0",
        fontSize: 14,
        cursor: "pointer",
        fontWeight: 600,
        flex: 2
      },
      onClick: () => setClienteExpandidoId(c.id)
    }, "Entregar →")), puedeEntregar && expandido && onGuardarVenta && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        paddingTop: 10,
        borderTop: "0.5px solid var(--color-border-tertiary)"
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btn,
        width: "100%",
        marginBottom: 10,
        fontSize: 13,
        fontWeight: 500
      },
      onClick: () => setClienteExpandidoId(null)
    }, "▲ Cerrar"), /*#__PURE__*/React.createElement(NuevaVenta, {
      key: `${c.id}-${(todasVentas || ventas).filter(v => v.clienteId === c.id).length}`,
      compacto: true,
      cliente: c,
      productos: productos,
      fecha: fecha,
      ventasCliente: (todasVentas || ventas).filter(v => v.clienteId === c.id),
      onGuardar: (...args) => {
        onGuardarVenta(c.id, ...args);
        irAlSiguientePendiente();
      },
      onNoEsta: () => {
        marcarNoVisita(c.id, est === "noesta" ? "noesta2" : "noesta");
        irAlSiguientePendiente();
      },
      onNoQuiere: (envPrest, envDev) => {
        marcarNoVisita(c.id, "noquiso");
        onNoQuiereConEnvases && onNoQuiereConEnvases(c.id, envPrest, envDev);
        irAlSiguientePendiente();
      },
      onCambiarDispenser: delta => onCambiarDispenserCliente && onCambiarDispenserCliente(c.id, delta)
    })), (est === "noesta2" || est === "noquiso") && !atendido && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btn,
        fontSize: 12,
        padding: "4px 10px"
      },
      onClick: () => onQuitarNoVisita(c.id)
    }, "Desmarcar"))), fotoOpen && /*#__PURE__*/React.createElement(FotoClienteModal, {
    cliente: c,
    onCerrar: () => setFotoOpen(false),
    onGuardarFoto: b64 => onReordenar(clientes.map(x => x.id === c.id ? {
      ...x,
      foto: b64
    } : x))
  }));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: `Clientes · ${dia}`,
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 16px 6px"
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Buscar por domicilio o nombre...",
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
  }, /*#__PURE__*/React.createElement("span", {
    style: s.badge("success")
  }, clientesReales.filter(c => visitados.has(c.id)).length, "/", clientesReales.length, " visitados"), volverAlFinal.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: s.badge("warning")
  }, volverAlFinal.length, " volver al final"), sinEntrega.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: s.badge("danger")
  }, sinEntrega.length, " sin entrega"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "3px 10px",
      marginLeft: "auto",
      background: "#185FA5",
      color: "#e2eaf4",
      border: "none"
    },
    onClick: onNuevoCliente
  }, "+ Nuevo"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "3px 10px"
    },
    onClick: abrirRutaOptima
  }, "🧭 Ruta óptima"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "3px 10px"
    },
    onClick: onAbrirMapa
  }, "🗺 Mapa")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: clienteMoviendo ? "var(--color-text-warning)" : "var(--color-text-tertiary)",
      marginTop: 6,
      fontWeight: clienteMoviendo ? 600 : 400
    }
  }, clienteMoviendo ? `📍 Tocá el # de dónde debería ir "${clientesReales.find(c => c.id === clienteMoviendo)?.nombre || ""}" (tocá el mismo para cancelar)` : "Tocá el # de un cliente para moverlo, después tocá dónde debería ir")), filtrados.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "40px 20px",
      color: "var(--color-text-tertiary)",
      fontSize: 14
    }
  }, "No hay clientes para ", dia, "."), pendientesNormales.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: s.sectionTitle
  }, "Pendientes (", pendientesNormales.length, ")"), pendientesNormales.map(c => /*#__PURE__*/React.createElement(Card, {
    key: c.id,
    c: c
  }))), volverAlFinal.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      ...s.sectionTitle,
      color: "#f5b942"
    }
  }, "🔄 Volver a visitar (", volverAlFinal.length, ")"), volverAlFinal.map(c => /*#__PURE__*/React.createElement(Card, {
    key: c.id,
    c: c
  }))), listos.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: s.sectionTitle
  }, "Entregado (", listos.length, ")"), listos.map(c => /*#__PURE__*/React.createElement(Card, {
    key: c.id,
    c: c
  }))), sinEntrega.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: s.sectionTitle
  }, "Sin entrega (", sinEntrega.length, ")"), sinEntrega.map(c => /*#__PURE__*/React.createElement(Card, {
    key: c.id,
    c: c
  }))), onPlanilla && todosListos && /*#__PURE__*/React.createElement("div", {
    ref: btnPlanillaRef,
    style: {
      padding: "18px 16px 8px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: "#0a5c3a",
      color: "#e2eaf4",
      border: "1.5px solid #4dd9a0",
      borderRadius: 12,
      padding: "15px 20px",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    },
    onClick: onPlanilla
  }, "✅ Todos registrados · Ir a la planilla del día →")));
}
function DetalleCliente({
  cliente,
  ventas,
  noVisitas,
  dia,
  fecha,
  productos,
  onVenta,
  onVolver,
  onEditar,
  onEliminarVenta,
  onEditarVenta,
  onEliminarCliente,
  onEliminarNoVisita,
  onNoEstaCliente,
  onNoQuiereCliente,
  recordatorios,
  onGuardarRecordatorio,
  onConfirmarRecordatorio,
  onCobrarSaldo,
  onGuardarAjuste,
  onGuardarCambio,
  onPerdida
}) {
  const [editandoCliente, setEditandoCliente] = useState(false);
  const [editandoVentaId, setEditandoVentaId] = useState(null);
  const [editandoSaldo, setEditandoSaldo] = useState(false);
  const [tipoSaldoEdit, setTipoSaldoEdit] = useState("");
  const [montoSaldoEdit, setMontoSaldoEdit] = useState("");
  const [mostrarRecordatorio, setMostrarRecordatorio] = useState(false);
  const [mostrarPagoSaldo, setMostrarPagoSaldo] = useState(false);
  const [mostrarFotoGrande, setMostrarFotoGrande] = useState(false);
  const [razonAjuste, setRazonAjuste] = useState("");
  const [mostrarCambio, setMostrarCambio] = useState(false);
  const recActivos = (recordatorios || []).filter(r => r.clienteId === cliente.id && !r.confirmado);
  // Las partes-transferencia de pagos mixtos NO son ventas: no se listan ni se cuentan acá
  // (la venta principal ya muestra el desglose [Mixto: ef + tr]; la transferencia se confirma en el panel del día)
  const ventasSinMixtoTr = ventas.filter(v => !v._esMixtoTrans);
  const historial = [...ventasSinMixtoTr].sort((a, b) => (b.fechaKey || "").localeCompare(a.fechaKey || "") || (b.id || 0) - (a.id || 0));
  const ventaHoy = fecha ? ventasSinMixtoTr.find(v => v.fechaKey === fecha && !v._esCobro && !v._esAjuste && !v._esCambio) : null;
  const initials = cliente.nombre.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
  const totalComprado = ventasSinMixtoTr.reduce((a, v) => a + (v.neto || 0), 0);
  const promedioVenta = ventasSinMixtoTr.length > 0 ? Math.round(totalComprado / ventasSinMixtoTr.length) : 0;
  const ventasUltimos30 = ventasSinMixtoTr.filter(v => {
    const fk = v.fechaKey || "";
    if (!fk) return false;
    const d = new Date(fk);
    const hoy = new Date();
    return (hoy - d) / 86400000 <= 30;
  }).length;
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: `Clientes · ${cliente.dia || ""}`,
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-background-secondary)",
      borderRadius: 10,
      margin: "8px 14px 0",
      padding: "10px 14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--color-text-primary)"
    }
  }, cliente.nombre), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      padding: "4px 8px",
      fontSize: 18,
      lineHeight: 1,
      position: "relative"
    },
    onClick: () => setMostrarRecordatorio(true)
  }, "🔔", recActivos.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: -3,
      right: -3,
      background: "#f5b942",
      color: "#0f1923",
      borderRadius: "50%",
      width: 16,
      height: 16,
      fontSize: 9,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, recActivos.length)), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 12,
      padding: "5px 10px"
    },
    onClick: () => {
      setEditandoCliente(!editandoCliente);
      setEditandoVentaId(null);
    }
  }, editandoCliente ? "Cancelar" : "Editar"))), mostrarPagoSaldo && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.7)",
      zIndex: 999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement(PagoSaldoPanel, {
    saldo: cliente.saldo,
    onCobrar: (monto, pago) => {
      onCobrarSaldo && onCobrarSaldo(monto, pago);
      setMostrarPagoSaldo(false);
    },
    onCerrar: () => setMostrarPagoSaldo(false)
  })), mostrarRecordatorio && /*#__PURE__*/React.createElement(RecordatorioModal, {
    cliente: cliente,
    onGuardar: datos => {
      onGuardarRecordatorio && onGuardarRecordatorio({
        ...datos,
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        dia: cliente.dia,
        id: Date.now(),
        confirmado: false
      });
      setMostrarRecordatorio(false);
    },
    onCerrar: () => setMostrarRecordatorio(false)
  }), mostrarFotoGrande && /*#__PURE__*/React.createElement(FotoClienteModal, {
    cliente: cliente,
    onCerrar: () => setMostrarFotoGrande(false),
    onGuardarFoto: b64 => {
      onEditar({
        foto: b64
      });
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, recActivos.length > 0 && !editandoCliente && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, recActivos.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      ...s.card,
      margin: "0 0 6px",
      background: "#2e1f06",
      border: "1px solid #f5b942",
      display: "flex",
      gap: 10,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      flexShrink: 0
    }
  }, "🔔"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "#f5b942"
    }
  }, r.fecha, " ", r.hora && `· ${r.hora}`), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-primary)",
      marginTop: 2
    }
  }, r.motivo)), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "#4dd9a0",
      color: "#0a2e1f",
      border: "none",
      borderRadius: 6,
      padding: "4px 10px",
      fontSize: 11,
      fontWeight: 600,
      cursor: "pointer",
      flexShrink: 0
    },
    onClick: () => onConfirmarRecordatorio && onConfirmarRecordatorio(r.id)
  }, "✓ Listo")))), !editandoCliente && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 14
    }
  }, cliente.foto ? /*#__PURE__*/React.createElement("img", {
    src: cliente.foto,
    alt: "",
    onClick: () => setMostrarFotoGrande(true),
    title: "Ver foto grande",
    style: {
      width: 52,
      height: 52,
      borderRadius: 10,
      objectFit: "cover",
      flexShrink: 0,
      border: "0.5px solid var(--color-border-tertiary)",
      cursor: "zoom-in"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 10,
      background: "var(--color-background-info)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 500,
      fontSize: 18,
      color: "var(--color-text-info)",
      flexShrink: 0
    }
  }, initials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 16,
      color: "var(--color-text-primary)"
    }
  }, cliente.nombre), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, direccionCliente(cliente), cliente.dia ? ` · ${cliente.dia}` : ""), cliente.notas && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-warning)",
      marginTop: 3
    }
  }, "📝 ", cliente.notas)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, (cliente.maps || cliente.lat && cliente.lng) && /*#__PURE__*/React.createElement("a", {
    href: cliente.maps || `https://www.google.com/maps?q=${cliente.lat},${cliente.lng}`,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 26,
      textDecoration: "none"
    }
  }, "📍"), cliente.telefono && /*#__PURE__*/React.createElement("a", {
    href: `https://wa.me/54${cliente.telefono}`,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 26,
      textDecoration: "none"
    }
  }, "💬"))), cliente.foto && !editandoCliente && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10,
      cursor: "zoom-in",
      borderRadius: 10,
      overflow: "hidden",
      maxHeight: 140,
      position: "relative"
    },
    onClick: () => setMostrarFotoGrande(true)
  }, /*#__PURE__*/React.createElement("img", {
    src: cliente.foto,
    alt: "Domicilio",
    style: {
      width: "100%",
      maxHeight: 140,
      objectFit: "cover",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      background: "linear-gradient(transparent,rgba(0,0,0,0.5))",
      padding: "6px 10px",
      fontSize: 11,
      color: "#fff"
    }
  }, "📷 Domicilio · tocá para ampliar")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.grid2,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: s.metricCard
  }, /*#__PURE__*/React.createElement("div", {
    style: s.metricLabel
  }, "Saldo"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.metricVal,
      color: cliente.saldo < 0 ? "var(--color-text-danger)" : cliente.saldo > 0 ? "var(--color-text-success)" : "var(--color-text-primary)"
    }
  }, fmt(cliente.saldo)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      marginTop: 2
    }
  }, cliente.saldo < 0 ? "Debe" : cliente.saldo > 0 ? "A su favor" : "Al día")), /*#__PURE__*/React.createElement("div", {
    style: s.metricCard
  }, /*#__PURE__*/React.createElement("div", {
    style: s.metricLabel
  }, "Total histórico"), /*#__PURE__*/React.createElement("div", {
    style: s.metricVal
  }, fmt(totalComprado)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      marginTop: 2
    }
  }, ventasSinMixtoTr.length, " compras"))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px",
      borderLeft: cliente.saldo < 0 ? "3px solid var(--color-text-danger)" : cliente.saldo > 0 ? "3px solid #4dd9a0" : "0.5px solid var(--color-border-tertiary)"
    }
  }, !editandoSaldo ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, cliente.saldo < 0 ? "Saldo pendiente" : cliente.saldo > 0 ? "Saldo a favor" : "Sin saldo"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 500,
      color: cliente.saldo < 0 ? "var(--color-text-danger)" : cliente.saldo > 0 ? "#4dd9a0" : "var(--color-text-tertiary)"
    }
  }, fmt(Math.abs(cliente.saldo)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, cliente.saldo < 0 && /*#__PURE__*/React.createElement("button", {
    style: {
      background: "#185FA5",
      color: "#e2eaf4",
      border: "none",
      borderRadius: 8,
      padding: "6px 12px",
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer"
    },
    onClick: () => setMostrarPagoSaldo(true)
  }, "💰 Cobrar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "4px 10px"
    },
    onClick: () => setEditandoSaldo(true)
  }, "Ajustar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 11,
      padding: "4px 10px"
    },
    onClick: () => setMostrarCambio(true)
  }, "🔄 Cambio"))) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)",
      marginBottom: 8,
      fontWeight: 500
    }
  }, "Ajustar saldo"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 8
    }
  }, [["favor", "A favor"], ["deuda", "Debe"], ["cero", "En cero"]].map(([v, l]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    style: {
      flex: 1,
      fontSize: 11,
      padding: "6px 4px",
      borderRadius: 8,
      border: "0.5px solid var(--color-border-secondary)",
      cursor: "pointer",
      background: tipoSaldoEdit === v ? "#185FA5" : "var(--color-background-secondary)",
      color: tipoSaldoEdit === v ? "#e2eaf4" : "var(--color-text-secondary)"
    },
    onClick: () => setTipoSaldoEdit(v)
  }, l))), tipoSaldoEdit && tipoSaldoEdit !== "cero" && /*#__PURE__*/React.createElement("input", {
    style: {
      ...s.input,
      marginBottom: 8
    },
    type: "number",
    min: 0,
    placeholder: "Monto ($)",
    value: montoSaldoEdit,
    onChange: e => setMontoSaldoEdit(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      marginBottom: 4
    }
  }, "Razón del ajuste (obligatorio)"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Ej: Error de carga, condonación, inicio",
    value: razonAjuste,
    onChange: e => setRazonAjuste(e.target.value)
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
    onClick: () => {
      setEditandoSaldo(false);
      setTipoSaldoEdit("");
      setMontoSaldoEdit("");
      setRazonAjuste("");
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      flex: 2,
      fontSize: 12,
      padding: "8px"
    },
    onClick: () => {
      if (!razonAjuste.trim()) {
        alert("Ingresá la razón del ajuste");
        return;
      }
      const saldoAntes = cliente.saldo || 0;
      let saldoNuevo = saldoAntes;
      if (tipoSaldoEdit === "favor") saldoNuevo = Math.abs(Number(montoSaldoEdit) || 0);
      if (tipoSaldoEdit === "deuda") saldoNuevo = -Math.abs(Number(montoSaldoEdit) || 0);
      if (tipoSaldoEdit === "cero") saldoNuevo = 0;
      onEditar({
        saldo: saldoNuevo
      });
      // Guardar registro del ajuste
      const vt = {
        id: Date.now(),
        clienteId: cliente.id,
        cliente: cliente.nombre,
        dia: dia,
        fechaKey: fecha,
        fecha: new Date().toLocaleString("es-AR"),
        detalle: [{
          nombre: "Ajuste de saldo",
          cantidad: 1,
          precio: 0,
          total: 0
        }],
        pago: "manual",
        obs: `Ajuste: ${razonAjuste} · ${tipoSaldoEdit === "favor" ? "A favor" : tipoSaldoEdit === "deuda" ? "Deuda" : "En cero"}${tipoSaldoEdit !== "cero" ? ` $${(Number(montoSaldoEdit) || 0).toLocaleString("es-AR")}` : ""}`,
        neto: 0,
        bruto: 0,
        desc: 0,
        costo: 0,
        ganancia: 0,
        pagadoNum: 0,
        saldoDelta: saldoNuevo - saldoAntes,
        envPrest: [],
        envDev: [],
        saldoAntes,
        saldoDespues: saldoNuevo,
        _esAjuste: true
      };
      onGuardarAjuste && onGuardarAjuste(vt);
      setEditandoSaldo(false);
      setTipoSaldoEdit("");
      setMontoSaldoEdit("");
      setRazonAjuste("");
    }
  }, "Guardar saldo")))), mostrarCambio && /*#__PURE__*/React.createElement(CambioEnvasePanel, {
    productos: productos,
    onConfirmar: (productoViejo, productoNuevo, motivo) => {
      const vt = {
        id: Date.now(),
        clienteId: cliente.id,
        cliente: cliente.nombre,
        dia: dia,
        fechaKey: fecha,
        fecha: new Date().toLocaleString("es-AR"),
        detalle: [{
          nombre: "Cambio de envase",
          cantidad: 1,
          precio: 0,
          total: 0
        }],
        pago: "cambio",
        obs: `Cambio: ${productoViejo} → ${productoNuevo}${motivo.trim() ? ` · ${motivo.trim()}` : ""}`,
        neto: 0,
        bruto: 0,
        desc: 0,
        costo: 0,
        ganancia: 0,
        pagadoNum: 0,
        saldoDelta: 0,
        envDev: [{
          prod: productoViejo,
          cant: 1
        }],
        envPrest: [{
          prod: productoNuevo,
          cant: 1
        }],
        _esCambio: true,
        _upd: Date.now()
      };
      onGuardarCambio && onGuardarCambio(vt);
      setMostrarCambio(false);
    },
    onCancelar: () => setMostrarCambio(false)
  }), ventaHoy ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 12px",
      borderLeft: "3px solid #1D9E75",
      padding: "10px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "#4dd9a0"
    }
  }, "✓ Entrega registrada hoy"), /*#__PURE__*/React.createElement("span", {
    style: s.badge("success")
  }, fmt(ventaHoy.neto))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)",
      marginTop: 4
    }
  }, ventaHoy.detalle.map(d => `${d.nombre} ×${d.cantidad}`).join(" · "), " · ", (Number(ventaHoy.montoTrans) || 0) > 0 && (Number(ventaHoy.montoEfec) || 0) > 0 ? `Mixto · ef ${fmt(ventaHoy.montoEfec)} + tr ${fmt(ventaHoy.montoTrans)}` : ventaHoy.pago)) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      background: "var(--color-background-warning)",
      color: "var(--color-text-warning)",
      border: "1px solid var(--color-border-warning)",
      borderRadius: 10,
      padding: "12px 0",
      fontSize: 13,
      cursor: "pointer",
      fontWeight: 500,
      flex: 1,
      minWidth: 90
    },
    onClick: () => {
      onNoEstaCliente && onNoEstaCliente();
    }
  }, "🔄 No está"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "var(--color-background-danger)",
      color: "var(--color-text-danger)",
      border: "1px solid var(--color-border-danger)",
      borderRadius: 10,
      padding: "12px 0",
      fontSize: 13,
      cursor: "pointer",
      fontWeight: 500,
      flex: 1,
      minWidth: 90
    },
    onClick: () => {
      onNoQuiereCliente && onNoQuiereCliente();
    }
  }, "🚫 No quiere"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      padding: "12px 0",
      fontSize: 15,
      borderRadius: 10,
      flex: 2,
      minWidth: 120
    },
    onClick: onVenta
  }, "📦 Registrar entrega")), cliente.saldo < 0 && !ventaHoy && /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: "#0a2e1f",
      color: "#4dd9a0",
      border: "1.5px solid #4dd9a0",
      borderRadius: 10,
      padding: "12px",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    },
    onClick: () => setMostrarPagoSaldo(true)
  }, "💰 Cobrar deuda · ", fmt(Math.abs(cliente.saldo))), /*#__PURE__*/React.createElement("details", {
    style: {
      marginTop: 4
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
      padding: "10px 14px",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "📋 Historial completo del cliente"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, "▾")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 8
    }
  }, [["🛒", "#3b82f6", "Venta"], ["💳", "#10b981", "Cobro"], ["✏️", "#818cf8", "Ajuste saldo"], ["🚪", "#f59e0b", "No estaba"], ["🙅", "#ef4444", "No quiso"]].map(([ico, col, lbl]) => /*#__PURE__*/React.createElement("span", {
    key: lbl,
    style: {
      fontSize: 10,
      color: col,
      background: col + "18",
      border: `0.5px solid ${col}44`,
      borderRadius: 20,
      padding: "2px 7px",
      fontWeight: 600
    }
  }, ico, " ", lbl))), (() => {
    const nvItems = (noVisitas || []).map(nv => ({
      ...nv,
      _esNoVisita: true,
      fechaKey: nv.fecha
    }));
    const todo = [...historial, ...nvItems].sort((a, b) => (b.fechaKey || "").localeCompare(a.fechaKey || "") || (b.id || 0) - (a.id || 0));
    if (todo.length === 0) return /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: "var(--color-text-tertiary)",
        padding: "4px 0"
      }
    }, "Sin registros aún");
    return todo.map((item, idx) => {
      // ── NO VISITA ──
      if (item._esNoVisita) {
        const esNoEsta = item.motivo === "noesta";
        return /*#__PURE__*/React.createElement("div", {
          key: "nv" + idx,
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 12px",
            marginBottom: 6,
            background: esNoEsta ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
            borderRadius: 10,
            border: `0.5px solid ${esNoEsta ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 18
          }
        }, esNoEsta ? "🚪" : "🙅"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: esNoEsta ? "#f59e0b" : "#ef4444"
          }
        }, esNoEsta ? "No estaba en casa" : "No quiso comprar"), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 11,
            color: "var(--color-text-tertiary)"
          }
        }, item.fechaKey, " · ", item.dia)), onEliminarNoVisita && /*#__PURE__*/React.createElement("button", {
          style: {
            ...s.btnDanger,
            fontSize: 11,
            padding: "3px 8px",
            marginLeft: "auto",
            flexShrink: 0
          },
          onClick: () => {
            if (window.confirm(`¿Eliminar "${esNoEsta ? "No estaba en casa" : "No quiso comprar"}" del ${item.fechaKey}?`)) onEliminarNoVisita(item.dia, item.fecha);
          }
        }, "Eliminar"));
      }
      const v = item;
      const esCobro = v.pagadoNum > 0 && v.neto === 0 && !v._esAjuste;
      const esAjuste = v._esAjuste || false;
      const esCambio = v._esCambio || false;
      if (esCobro) return /*#__PURE__*/React.createElement("div", {
        key: v.id,
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "10px 12px",
          marginBottom: 6,
          background: "rgba(16,185,129,0.08)",
          borderRadius: 10,
          border: "0.5px solid rgba(16,185,129,0.3)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 18
        }
      }, "💳"), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 700,
          color: "#10b981"
        }
      }, "Cobro de deuda"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          marginTop: 1
        }
      }, v.fechaKey, " · ", v.pago), v.saldoAntes !== undefined && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          marginTop: 2
        }
      }, "Saldo antes: ", fmt(v.saldoAntes), " → después: ", fmt(v.saldoDespues)))), /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: "right",
          flexShrink: 0,
          marginLeft: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 16,
          fontWeight: 700,
          color: "#10b981"
        }
      }, "+", fmt(v.pagadoNum)), /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 10,
          color: "var(--color-text-danger)",
          background: "none",
          border: "none",
          cursor: "pointer",
          marginTop: 4
        },
        onClick: () => {
          if (window.confirm("¿Eliminar este cobro?")) onEliminarVenta(v.id);
        }
      }, "Eliminar")));
      if (esAjuste) return /*#__PURE__*/React.createElement("div", {
        key: v.id,
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "10px 12px",
          marginBottom: 6,
          background: "rgba(129,140,248,0.08)",
          borderRadius: 10,
          border: "0.5px solid rgba(129,140,248,0.3)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 18
        }
      }, "✏️"), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 700,
          color: "#818cf8"
        }
      }, "Ajuste de saldo"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "var(--color-text-secondary)",
          marginTop: 2
        }
      }, v.obs?.replace("Ajuste: ", "")), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          marginTop: 1
        }
      }, v.fechaKey), v.saldoAntes !== undefined && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--color-text-tertiary)"
        }
      }, "Saldo: ", fmt(v.saldoAntes), " → ", fmt(v.saldoDespues)))), /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 10,
          color: "var(--color-text-danger)",
          background: "none",
          border: "none",
          cursor: "pointer",
          flexShrink: 0
        },
        onClick: () => {
          if (window.confirm("¿Eliminar este ajuste?")) onEliminarVenta(v.id);
        }
      }, "Eliminar"));
      if (esCambio) return /*#__PURE__*/React.createElement("div", {
        key: v.id,
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "10px 12px",
          marginBottom: 6,
          background: "rgba(129,140,248,0.08)",
          borderRadius: 10,
          border: "0.5px solid rgba(129,140,248,0.3)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 18
        }
      }, "🔄"), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 700,
          color: "#818cf8"
        }
      }, "Cambio de envase"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "var(--color-text-secondary)",
          marginTop: 2
        }
      }, v.obs?.replace("Cambio: ", "")), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          marginTop: 1
        }
      }, v.fechaKey, " · no se cobró"))), /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 10,
          color: "var(--color-text-danger)",
          background: "none",
          border: "none",
          cursor: "pointer",
          flexShrink: 0
        },
        onClick: () => {
          if (window.confirm("¿Eliminar este cambio?")) onEliminarVenta(v.id);
        }
      }, "Eliminar"));
      return /*#__PURE__*/React.createElement("div", {
        key: v.id,
        style: {
          marginBottom: 6
        }
      }, editandoVentaId === v.id ? /*#__PURE__*/React.createElement(EditVenta, {
        venta: v,
        productos: productos,
        onGuardar: (d, p, m, sa, obs, tr2) => {
          onEditarVenta(v.id, d, p, m, sa, obs, tr2);
          setEditandoVentaId(null);
        },
        onCancelar: () => setEditandoVentaId(null)
      }) : /*#__PURE__*/React.createElement("div", {
        style: {
          padding: "10px 12px",
          background: "rgba(59,130,246,0.06)",
          borderRadius: 10,
          border: "0.5px solid rgba(59,130,246,0.2)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 3,
          alignItems: "center"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 6,
          alignItems: "center"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 16
        }
      }, "🛒"), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "var(--color-text-tertiary)"
        }
      }, v.fechaKey || v.dia, v.hora ? ` · ${v.hora}` : "")), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 15,
          fontWeight: 700,
          color: "#3b82f6"
        }
      }, fmt(v.neto))), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: "var(--color-text-primary)",
          marginBottom: 2,
          paddingLeft: 22
        }
      }, v.detalle.map(d => `${d.nombre} ×${d.cantidad}`).join(" · ")), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--color-text-secondary)",
          paddingLeft: 22,
          marginBottom: v.envPrest?.length || v.envDev?.length ? 2 : 6
        }
      }, (() => {
        const esMixto = (Number(v.montoTrans) || 0) > 0 && (Number(v.montoEfec) || 0) > 0;
        if (esMixto) return `Mixto · ef ${fmt(v.montoEfec)} + tr ${fmt(v.montoTrans)}`;
        return v.pago;
      })(), v.desc > 0 ? ` · desc. ${fmt(v.desc)}` : "", v.saldoAplicado > 0 ? ` · saldo apl. ${fmt(v.saldoAplicado)}` : "", v.obs ? ` · ${v.obs.replace(/\s*\[Mixto:[^\]]*\]/g, "")}` : ""), v.pago === "fiado" && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          fontWeight: 600,
          color: v._pagada ? "#4dd9a0" : "var(--color-text-danger)",
          paddingLeft: 22,
          marginBottom: 6
        }
      }, v._pagada ? "✓ Pagada" : v._montoPagadoAcum > 0 ? `Debe ${fmt((v.neto || 0) - (v._montoPagadoAcum || 0))} · pagó ${fmt(v._montoPagadoAcum)} parcial` : `Debe ${fmt(v.neto || 0)}`), (v.envPrest?.length > 0 || v.envDev?.length > 0) && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--color-text-warning)",
          paddingLeft: 22,
          marginBottom: 6
        }
      }, "🔁", (v.envPrest || []).filter(e => Number(e.cant) > 0).map(e => ` Prestó ${e.cant} ${e.prod}`).join(" ·"), v.envPrest?.some(e => Number(e.cant) > 0) && v.envDev?.some(e => Number(e.cant) > 0) ? " ·" : "", (v.envDev || []).filter(e => Number(e.cant) > 0).map(e => ` Devolvió ${e.cant} ${e.prod}`).join(" ·")), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "flex-end",
          gap: 6
        }
      }, /*#__PURE__*/React.createElement("button", {
        style: {
          ...s.btn,
          fontSize: 11,
          padding: "3px 8px"
        },
        onClick: () => setEditandoVentaId(v.id)
      }, "Editar"), /*#__PURE__*/React.createElement("button", {
        style: {
          ...s.btnDanger,
          fontSize: 11,
          padding: "3px 8px"
        },
        onClick: () => {
          if (window.confirm(`¿Eliminar venta de ${fmt(v.neto)}?`)) onEliminarVenta(v.id);
        }
      }, "Eliminar"))));
    });
  })())), /*#__PURE__*/React.createElement("details", {
    style: {
      marginTop: 6
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
      padding: "10px 14px",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, "🫧 Envases"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, "▾")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px",
      paddingTop: 2
    }
  }, /*#__PURE__*/React.createElement(PieEnvases, {
    c: cliente,
    ventas: ventas,
    onEditar: (id, cambios) => onEditar(cambios),
    onPerdida: onPerdida,
    izquierda: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-secondary)"
      }
    }, "Ajustar fijos y prestados")
  })), (() => {
    const exTotal = {
      sifon: prestadoClienteDe(cliente, "sifon", historial),
      bidon10: prestadoClienteDe(cliente, "bidon10", historial),
      bidon20: prestadoClienteDe(cliente, "bidon20", historial)
    };
    const hab = {
      sifon: cliente.sifon || 0,
      bidon10: cliente.bidon10 || 0,
      bidon20: cliente.bidon20 || 0
    };
    const total = {
      sifon: hab.sifon + exTotal.sifon,
      bidon10: hab.bidon10 + exTotal.bidon10,
      bidon20: hab.bidon20 + exTotal.bidon20
    };
    const hayExtra = exTotal.sifon !== 0 || exTotal.bidon10 !== 0 || exTotal.bidon20 !== 0;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        ...s.card,
        margin: "0 0 10px",
        background: "var(--color-background-tertiary)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        marginBottom: 8
      }
    }, "📦 En poder del cliente ahora"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap"
      }
    }, total.sifon > 0 && /*#__PURE__*/React.createElement("div", {
      style: s.metricCard
    }, /*#__PURE__*/React.createElement("div", {
      style: s.metricLabel
    }, "Sifón"), /*#__PURE__*/React.createElement("div", {
      style: {
        ...s.metricVal,
        color: exTotal.sifon > 0 ? "var(--color-text-warning)" : exTotal.sifon < 0 ? "var(--color-text-success)" : "var(--color-text-primary)"
      }
    }, total.sifon)), total.bidon10 > 0 && /*#__PURE__*/React.createElement("div", {
      style: s.metricCard
    }, /*#__PURE__*/React.createElement("div", {
      style: s.metricLabel
    }, "10L"), /*#__PURE__*/React.createElement("div", {
      style: {
        ...s.metricVal,
        color: exTotal.bidon10 > 0 ? "var(--color-text-warning)" : exTotal.bidon10 < 0 ? "var(--color-text-success)" : "var(--color-text-primary)"
      }
    }, total.bidon10)), total.bidon20 > 0 && /*#__PURE__*/React.createElement("div", {
      style: s.metricCard
    }, /*#__PURE__*/React.createElement("div", {
      style: s.metricLabel
    }, "20L"), /*#__PURE__*/React.createElement("div", {
      style: {
        ...s.metricVal,
        color: exTotal.bidon20 > 0 ? "var(--color-text-warning)" : exTotal.bidon20 < 0 ? "var(--color-text-success)" : "var(--color-text-primary)"
      }
    }, total.bidon20)), cliente.dispenser > 0 && /*#__PURE__*/React.createElement("div", {
      style: s.metricCard
    }, /*#__PURE__*/React.createElement("div", {
      style: s.metricLabel
    }, "Dispenser"), /*#__PURE__*/React.createElement("div", {
      style: s.metricVal
    }, cliente.dispenser)), !total.sifon && !total.bidon10 && !total.bidon20 && !cliente.dispenser && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--color-text-tertiary)"
      }
    }, "Sin envases")), hayExtra && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--color-text-tertiary)",
        marginTop: 8,
        borderTop: "0.5px solid var(--color-border-tertiary)",
        paddingTop: 6
      }
    }, (hab.sifon > 0 || hab.bidon10 > 0 || hab.bidon20 > 0) && /*#__PURE__*/React.createElement("span", null, "Habitual: ", hab.sifon > 0 ? `Sifón×${hab.sifon} ` : "", hab.bidon10 > 0 ? `10L×${hab.bidon10} ` : "", hab.bidon20 > 0 ? `20L×${hab.bidon20}` : "", " · "), exTotal.sifon !== 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        color: exTotal.sifon > 0 ? "var(--color-text-warning)" : "var(--color-text-success)"
      }
    }, exTotal.sifon > 0 ? `+${exTotal.sifon} sif. extra` : ` −${Math.abs(exTotal.sifon)} sif. devueltos`, " "), exTotal.bidon10 !== 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        color: exTotal.bidon10 > 0 ? "var(--color-text-warning)" : "var(--color-text-success)"
      }
    }, exTotal.bidon10 > 0 ? `+${exTotal.bidon10} 10L extra` : ` −${Math.abs(exTotal.bidon10)} 10L devueltos`, " "), exTotal.bidon20 !== 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        color: exTotal.bidon20 > 0 ? "var(--color-text-warning)" : "var(--color-text-success)"
      }
    }, exTotal.bidon20 > 0 ? `+${exTotal.bidon20} 20L extra` : ` −${Math.abs(exTotal.bidon20)} 20L devueltos`))));
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-secondary)",
      margin: "10px 0 6px"
    }
  }, "Movimientos registrados"), historial.filter(v => (v.envPrest || []).length > 0 || (v.envDev || []).length > 0).length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--color-text-tertiary)"
    }
  }, "Sin movimientos de envases registrados"), historial.filter(v => (v.envPrest || []).length > 0 || (v.envDev || []).length > 0).map(v => /*#__PURE__*/React.createElement("div", {
    key: v.id,
    style: {
      ...s.card,
      margin: "0 0 8px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      marginBottom: 4
    }
  }, v.fechaKey || v.dia, v.hora ? ` · ${v.hora}` : ""), (v.envPrest || []).map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: "p" + i,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "3px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, "+ Prestado: ", e.prod), /*#__PURE__*/React.createElement("span", {
    style: s.badge("warning")
  }, "×", e.cant))), (v.envDev || []).map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: "d" + i,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "3px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, "← Devuelto: ", e.prod), /*#__PURE__*/React.createElement("span", {
    style: s.badge("success")
  }, "×", e.cant))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.divider,
      marginTop: 12
    }
  }), /*#__PURE__*/React.createElement("details", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      cursor: "pointer",
      padding: "4px 0",
      listStyle: "none",
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, "⚙ Opciones avanzadas"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnDanger,
      width: "100%",
      padding: "10px",
      fontSize: 13
    },
    onClick: () => {
      const tieneEnv = (Number(cliente.sifon) || 0) + (Number(cliente.bidon10) || 0) + (Number(cliente.bidon20) || 0) > 0;
      const aviso = tieneEnv ? "\n\n(Como tiene envases a su nombre, después te va a preguntar aparte si los devolvió — eso no cancela el borrado, es solo para el stock)" : "";
      if (window.confirm(`¿Eliminar a ${cliente.nombre}? Se borrarán también sus ventas.${aviso}`)) onEliminarCliente();
    }
  }, "Eliminar cliente")))), editandoCliente && /*#__PURE__*/React.createElement(FormCliente, {
    inicial: cliente,
    textoGuardar: "Guardar cambios",
    onGuardar: cambios => {
      onEditar(cambios);
      setEditandoCliente(false);
    },
    onEliminarCliente: onEliminarCliente
  })));
}
function FiadosPendientes({
  clientes,
  ventas,
  onCobrar,
  onVolver,
  onEditarCliente,
  onPerdida
}) {
  const [pagando, setPagando] = React.useState(null); // clienteId
  const [monto, setMonto] = React.useState('');
  const [pago, setPago] = React.useState('contado');
  const conDeuda = clientes.filter(c => c.saldo < 0).sort((a, b) => a.saldo - b.saldo);
  const totalDeuda = conDeuda.reduce((a, c) => a + Math.abs(c.saldo), 0);
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement("div", {
    style: s.header
  }, /*#__PURE__*/React.createElement("button", {
    style: s.backBtn,
    onClick: onVolver
  }, "← Volver"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: s.headerTitle
  }, "💰 Fiados pendientes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--color-text-danger)'
    }
  }, conDeuda.length, " clientes · ", fmt(totalDeuda), " total")), /*#__PURE__*/React.createElement(HeaderBotones, null)), conDeuda.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: 'center',
      color: 'var(--color-text-success)',
      fontSize: 15
    }
  }, "✅ ¡Sin fiados pendientes!"), conDeuda.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      ...s.card,
      margin: '6px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--color-text-primary)'
    }
  }, c.nombre), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--color-text-tertiary)'
    }
  }, c.dia, direccionCliente(c) ? ' · ' + direccionCliente(c) : '')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--color-text-danger)'
    }
  }, fmt(Math.abs(c.saldo)))), pagando === c.id ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      paddingTop: 8,
      borderTop: '0.5px solid var(--color-border-tertiary)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, ['contado', 'transferencia'].map(p => /*#__PURE__*/React.createElement("button", {
    key: p,
    style: {
      flex: 1,
      padding: '7px',
      fontSize: 12,
      borderRadius: 8,
      border: '0.5px solid var(--color-border-secondary)',
      background: pago === p ? '#185FA5' : 'var(--color-background-tertiary)',
      color: pago === p ? '#e2eaf4' : 'var(--color-text-secondary)',
      cursor: 'pointer',
      fontWeight: pago === p ? 600 : 400
    },
    onClick: () => setPago(p)
  }, p === 'contado' ? '💵 Efectivo' : '💳 Transfer.'))), /*#__PURE__*/React.createElement("input", {
    style: {
      ...s.input
    },
    type: "number",
    placeholder: fmt(Math.abs(c.saldo)) + ' (total)',
    value: monto,
    onChange: e => setMonto(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      flex: 1
    },
    onClick: () => {
      setPagando(null);
      setMonto('');
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      flex: 2,
      padding: '9px'
    },
    onClick: () => {
      const m = Number(monto) || Math.abs(c.saldo);
      onCobrar(c.id, m, pago);
      setPagando(null);
      setMonto('');
    }
  }, "✓ Confirmar cobro"))) : /*#__PURE__*/React.createElement("button", {
    style: {
      width: '100%',
      padding: '9px',
      background: '#0a2e1f',
      color: '#4dd9a0',
      border: '1px solid #4dd9a0',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer'
    },
    onClick: () => {
      setPagando(c.id);
      setMonto(String(Math.abs(c.saldo)));
      setPago('contado');
    }
  }, "💰 Cobrar deuda"), onEditarCliente && /*#__PURE__*/React.createElement(PieEnvases, {
    c: c,
    ventas: ventas,
    onEditar: onEditarCliente,
    onPerdida: onPerdida
  }))));
}
function ClientesDormidos({
  clientes,
  ventas,
  onVolver,
  onSeleccionar,
  onEditarCliente,
  onEliminar,
  onPerdida
}) {
  const [semanas, setSemanas] = React.useState(4);
  const hoy = new Date();
  // Última compra real por cliente (ignora cobros y ajustes)
  const ultima = {};
  (ventas || []).forEach(v => {
    if (v._esCobro || v._esAjuste || v._esAjusteEnvases || v._esCambio || v._esMixtoTrans) return;
    const fk = v.fechaKey;
    if (!fk) return;
    if (!ultima[v.clienteId] || fk > ultima[v.clienteId]) ultima[v.clienteId] = fk;
  });
  const diasDesde = fk => {
    if (!fk) return Infinity;
    const d = new Date(fk + "T12:00:00");
    return Math.floor((hoy - d) / 86400000);
  };
  const lista = (clientes || []).map(c => {
    const fk = ultima[c.id];
    return {
      ...c,
      ultimaFecha: fk,
      dias: diasDesde(fk)
    };
  }).filter(c => c.dias >= semanas * 7).sort((a, b) => b.dias - a.dias);
  const textoTiempo = c => {
    if (c.dias === Infinity) return "Sin compras registradas";
    const sem = Math.floor(c.dias / 7);
    return `Hace ${sem} semana${sem !== 1 ? "s" : ""}` + (c.ultimaFecha ? ` · últ. ${c.ultimaFecha}` : "");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement("div", {
    style: s.header
  }, /*#__PURE__*/React.createElement("button", {
    style: s.backBtn,
    onClick: onVolver
  }, "← Volver"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: s.headerTitle
  }, "😴 Clientes dormidos"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, lista.length, " cliente", lista.length !== 1 ? "s" : "", " sin comprar hace ", semanas, "+ semanas")), /*#__PURE__*/React.createElement(HeaderBotones, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px 4px",
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, "Mostrar sin comprar hace:"), [2, 3, 4, 8].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => setSemanas(n),
    style: {
      padding: "5px 10px",
      fontSize: 12,
      borderRadius: 8,
      cursor: "pointer",
      border: "0.5px solid var(--color-border-secondary)",
      background: semanas === n ? "#185FA5" : "var(--color-background-tertiary)",
      color: semanas === n ? "#e2eaf4" : "var(--color-text-secondary)",
      fontWeight: semanas === n ? 600 : 400
    }
  }, n, "+ sem"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 14px 4px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      background: "var(--color-background-tertiary)",
      borderRadius: 8,
      padding: "7px 10px"
    }
  }, "📋 Política: a partir de 3-4 semanas sin comprar, se recomienda retirar los envases y eliminar al cliente.")), lista.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--color-text-success)",
      fontSize: 15
    }
  }, "✅ ¡Ningún cliente dormido con ese filtro!"), lista.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      ...s.card,
      margin: "6px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      cursor: "pointer"
    },
    onClick: () => onSeleccionar && onSeleccionar(c)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, c.nombre), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)",
      marginTop: 2
    }
  }, c.dia, direccionCliente(c) ? " · " + direccionCliente(c) : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: c.dias >= 28 ? "var(--color-text-danger)" : "var(--color-text-warning)",
      marginTop: 4
    }
  }, "⏳ ", textoTiempo(c)), c.saldo < 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-danger)",
      marginTop: 3
    }
  }, "Debe ", fmt(Math.abs(c.saldo)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      flexShrink: 0,
      alignItems: "center"
    }
  }, c.telefono && /*#__PURE__*/React.createElement("a", {
    href: `https://wa.me/54${c.telefono}`,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 22,
      textDecoration: "none"
    },
    title: "WhatsApp"
  }, "💬"), (c.maps || c.lat && c.lng) && /*#__PURE__*/React.createElement("a", {
    href: c.maps || `https://www.google.com/maps?q=${c.lat},${c.lng}`,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 22,
      textDecoration: "none"
    },
    title: "Mapa"
  }, "📍"))), onEditarCliente && /*#__PURE__*/React.createElement(PieEnvases, {
    c: c,
    ventas: ventas,
    onEditar: onEditarCliente,
    onPerdida: onPerdida,
    izquierda: onEliminar && /*#__PURE__*/React.createElement("button", {
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
      onClick: e => {
        e.stopPropagation();
        onEliminar(c.id);
      }
    }, "🗑️ Eliminar")
  }))));
}