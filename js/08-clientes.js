// ════════════════════════════════════════════════════════════════════
// ◆  07-clientes.js — ListaClientes, DetalleCliente (formulario: FormCliente unificado en 03-utils)
// ════════════════════════════════════════════════════════════════════

// ClienteCard: antes vivía como "const Card = (...) => {...}" DEFINIDA ADENTRO
// de ListaClientes. Eso hacía que React viera un componente nuevo en cada
// render de la lista (nueva identidad de función = nuevo tipo) y desmontara/
// remontara TODAS las tarjetas de golpe en cada tecla del buscador o cada vez
// que se expandía un cliente — la causa real de la traba durante el día.
// Ahora es una función de módulo estable; todo lo que antes tomaba "gratis"
// del cierre de ListaClientes ahora llega explícito por props (mismos
// nombres, así el cuerpo de abajo no tuvo que tocarse).
const ClienteCard = /*#__PURE__*/React.memo(function ClienteCard({
  c, atendidos, noVMap, visitados, clienteExpandidoId, setClienteExpandidoId, pendientes, clienteMoviendo, setClienteMoviendo, moverCliente, onSeleccionar, recordatorios, ventas, fecha, onConfirmarTransfer, onPasarAEfectivo, todasVentas, marcarNoVisita, onGuardarVenta, productos, onNoQuiereConEnvases, onCambiarDispenserCliente, onQuitarNoVisita, clientes, onReordenar, onRetirarCliente, onPerdidaCliente
}) {
    const [fotoOpen, setFotoOpen] = React.useState(false);
    const [mostrarMas, setMostrarMas] = React.useState(false);
    const [mostrarDeuda, setMostrarDeuda] = React.useState(false);
    const atendido = atendidos.has(c.id),
      est = noVMap[c.id];
    const bc = atendido ? "#1D9E75" : est === "noesta" ? "#EF9F27" : est === "noesta2" || est === "noquiso" ? "#E24B4A" : "var(--color-border-tertiary)";
    const pausadoActivo = !!(c.pausadoHasta && c.pausadoHasta >= fecha);
    // Cliente quincenal: mismo cálculo que en ListaClientes (ver comentario
    // ahí) — si hace menos de ~10 días que compró de verdad, no le toca esta
    // semana. Se recalcula acá porque ClienteCard también se usa fuera de
    // esa lista (ej. "Agregados hoy").
    const noLeTocaQuincenal = (() => {
      if (c.frecuencia !== "quincenal") return false;
      const reales = (todasVentas || ventas).filter(v => v.clienteId === c.id && !v._esCobro && !v._esAjuste && !v._esAjusteEnvases && !v._esCambio && !v._esMixtoTrans && v.fechaKey);
      if (!reales.length) return false;
      const ultimaFk = reales.reduce((a, v) => v.fechaKey > a ? v.fechaKey : a, reales[0].fechaKey);
      const dias = Math.floor((new Date(fecha + "T12:00:00") - new Date(ultimaFk + "T12:00:00")) / 86400000);
      return dias < 10;
    })();
    const puedeEntregar = (!visitados.has(c.id) || est === "noesta") && !atendido && !pausadoActivo && !noLeTocaQuincenal;
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
    // Envases (fijos + prestados) que tiene el cliente — se usa la misma
    // lista real de productos que en Stock, así un producto nuevo también
    // aparece acá (ver 19/11/2026).
    const PRODS_BADGE = (productos || []).filter(p => p.trackStock !== false).map(p => [claveStockDeProducto(p), p.nombre]);
    const esMetalico = esMetalicoLC();
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        ...s.card,
        // Prospecto: recuadro punteado distinto hasta que se confirme como
        // cliente fijo (5 compras en su día) — para distinguirlos de un
        // vistazo en la lista.
        border: c.esProspecto ? "1.5px dashed #b794f6" : "1px solid var(--color-border-secondary)",
        borderRadius: esMetalico ? 20 : undefined,
        boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
        background: c.esProspecto ? "rgba(183,148,246,0.06)" : undefined,
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
        borderRadius: esMetalico ? "50%" : 8,
        background: clienteMoviendo === c.id ? "#185FA5" : clienteMoviendo && !atendido ? "var(--color-background-warning)" : "var(--color-background-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 600,
        color: clienteMoviendo === c.id ? "#fff" : clienteMoviendo && !atendido ? "var(--color-text-warning)" : "var(--color-text-secondary)",
        cursor: atendido ? "default" : "pointer",
        border: clienteMoviendo === c.id ? "1.5px solid #5daaff" : "0.5px solid var(--color-border-tertiary)",
        boxShadow: esMetalico ? "inset 0 1px 2px rgba(255,255,255,0.18), inset 0 -2px 4px rgba(0,0,0,0.3)" : undefined
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
        fontWeight: 700,
        fontSize: 17,
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
    }, "📷")), c.esProspecto && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 20,
        color: "#b794f6",
        border: "0.5px solid #b794f6",
        flexShrink: 0
      }
    }, "🔸 Prospecto"), pausadoActivo && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 20,
        color: "#EF9F27",
        border: "0.5px solid #EF9F27",
        flexShrink: 0
      },
      title: c.pausadoMotivo || ""
    }, "⏸ Pausado hasta ", (() => {
      const [y, m, d] = String(c.pausadoHasta).split("-");
      return d && m ? `${d}/${m}` : c.pausadoHasta;
    })()), c.frecuencia === "quincenal" && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 20,
        color: "#5daaff",
        border: "0.5px solid #5daaff",
        flexShrink: 0
      },
      title: "Cliente quincenal: compra, saltea la próxima, y vuelve a comprar a la otra"
    }, noLeTocaQuincenal ? "📅 No le toca esta semana" : "📅 Quincenal"), (recordatorios || []).some(r => r.clienteId === c.id && !r.confirmado) && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        flexShrink: 0
      },
      title: "Recordatorio pendiente"
    }, "🔔"), (() => {
      const vt = ventas.find(v => v.clienteId === c.id && v.fechaKey === fecha && v.pago === "transferencia");
      if (!vt) return null;
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
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
      }, fmt((vt.pagadoNum != null ? vt.pagadoNum : vt.neto) || 0))), !vt.transConfirmada && onPasarAEfectivo && /*#__PURE__*/React.createElement("button", {
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px 4px",
          lineHeight: 1,
          flexShrink: 0,
          fontSize: 15
        },
        onClick: e => {
          e.stopPropagation();
          if (window.confirm(`¿"${c.nombre}" te pagó en efectivo en vez de transferir? Se va a registrar como cobrado en efectivo.`)) {
            onPasarAEfectivo(vt.id);
          }
        },
        title: "Nunca llegó la transferencia y pagó en efectivo"
      }, "💵"), !vt.transConfirmada && c.telefono && /*#__PURE__*/React.createElement("a", {
        href: `https://wa.me/54${c.telefono}?text=${armarMsjTransferWA([vt])}`,
        target: "_blank",
        rel: "noreferrer",
        onClick: e => e.stopPropagation(),
        title: "Mandar WhatsApp para pedir que confirme la transferencia",
        style: {
          fontSize: 15,
          textDecoration: "none",
          flexShrink: 0
        }
      }, "💬"));
    })(), c.saldo < 0 && /*#__PURE__*/React.createElement("button", {
      className: "no-relieve",
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        padding: "5px 11px",
        borderRadius: esMetalico ? 999 : 20,
        background: "var(--color-background-danger)",
        color: "var(--color-text-danger)",
        border: "1px solid var(--color-border-danger)",
        cursor: "pointer",
        flexShrink: 0,
        marginLeft: "auto"
      },
      onClick: e => {
        e.stopPropagation();
        if (!expandido) setClienteExpandidoId(c.id);
        setMostrarDeuda(m => !m);
      }
    }, "Debe ", fmt(Math.abs(c.saldo)), " \u203A")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        color: "var(--color-text-primary)",
        fontWeight: 600,
        marginTop: 3
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
        gap: 5,
        marginTop: 7
      }
    }, (() => {
      const pill = txt => /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: esMetalico ? 999 : 20,
          background: "var(--color-background-info)",
          color: "var(--color-text-primary)"
        }
      }, txt);
      return /*#__PURE__*/React.createElement(React.Fragment, null, PRODS_BADGE.map(([k, lbl]) => {
        const real = Math.max(0, (Number(c[k]) || 0) + prestadoClienteDe(c, k, todasVentas || ventas));
        return real > 0 ? /*#__PURE__*/React.createElement(React.Fragment, { key: k }, pill(`${lbl.replace(" 1.5L", "")}×${real}`)) : null;
      }));
    })(), atendido && /*#__PURE__*/React.createElement("span", {
      style: s.badge("success")
    }, "✓ Listo"), est === "noesta" && !atendido && /*#__PURE__*/React.createElement("span", {
      style: s.badge("warning")
    }, "🔄 No estaba aún"), est === "noesta2" && /*#__PURE__*/React.createElement("span", {
      style: s.badge("warning")
    }, "No estaba"), est === "noquiso" && /*#__PURE__*/React.createElement("span", {
      style: s.badge("danger")
    }, "No quiso"), c.saldo > 0 && /*#__PURE__*/React.createElement("span", {
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
        borderRadius: esMetalico ? "50%" : 9,
        background: "var(--color-background-tertiary)",
        border: "0.5px solid var(--color-border-secondary)",
        boxShadow: esMetalico ? "inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.3)" : undefined
      }
    }, "📍"), c.telefono && /*#__PURE__*/React.createElement("a", {
      href: `https://wa.me/54${c.telefono}?text=${armarMsjPedidoWA(c)}`,
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
        borderRadius: esMetalico ? "50%" : 9,
        background: "var(--color-background-tertiary)",
        border: "0.5px solid var(--color-border-secondary)",
        boxShadow: esMetalico ? "inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.3)" : undefined
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
        borderRadius: esMetalico ? "50%" : 9,
        background: "var(--color-background-tertiary)",
        border: "0.5px solid var(--color-border-secondary)",
        boxShadow: esMetalico ? "inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.3)" : undefined
      },
      title: "Foto domicilio",
      onClick: e => {
        e.stopPropagation();
        setFotoOpen(true);
      }
    }, "📷"), c.esProspecto && onRetirarCliente && /*#__PURE__*/React.createElement("button", {
      style: {
        fontSize: 15,
        cursor: "pointer",
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: esMetalico ? "50%" : 9,
        background: "rgba(226,75,74,0.08)",
        border: "0.5px solid #E24B4A",
        color: "#E24B4A",
        padding: 0
      },
      title: "El prospecto no sigue — retira el envase de promoción y lo da de baja",
      onClick: e => {
        e.stopPropagation();
        onRetirarCliente(c.id);
      }
    }, "\u{1F6AB}"))), puedeEntregar && !expandido && /*#__PURE__*/React.createElement("div", {
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
      onClick: () => {
        marcarNoVisita(c.id, est === "noesta" ? "noesta2" : "noesta");
        irAlSiguientePendiente();
      }
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
      onClick: () => {
        marcarNoVisita(c.id, "noquiso");
        irAlSiguientePendiente();
      }
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
    }, /*#__PURE__*/React.createElement("div", {
      // 25/11/2026: el botón "⋮ Más opciones" era chico y sin color,
      // Guillermo no lo encontraba a simple vista (ahí vive, entre otras
      // cosas, Dispenser roto / Cambio-Devolución / Envase roto). Se lo
      // agranda al doble y se le da color propio para que resalte; la "X"
      // de cerrar queda del mismo tamaño de siempre pero se corre al
      // costado derecho (queda debajo de los íconos 📍/💬/📷 de arriba),
      // alineados por el centro para no romper la línea divisoria de
      // arriba (borderTop) que sigue marcando la mitad entre el bloque de
      // datos del cliente y el formulario de venta.
      style: {
        display: "flex",
        gap: 8,
        marginBottom: 10,
        alignItems: "center",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btn,
        flex: "0 0 149px",
        width: 149,
        height: 38,
        fontSize: 20,
        fontWeight: 700,
        padding: 0,
        background: mostrarMas ? "var(--color-background-info)" : "var(--color-background-warning)",
        color: mostrarMas ? "var(--color-text-info)" : "var(--color-text-warning)",
        border: mostrarMas ? "1px solid var(--color-border-info)" : "1px solid var(--color-border-warning)"
      },
      title: "Más opciones (Dispenser roto, Cambio/Devolución, Envase roto)",
      onClick: () => setMostrarMas(m => !m)
    }, "⋮"), /*#__PURE__*/React.createElement("button", {
      style: {
        ...s.btn,
        flex: "0 0 38px",
        width: 38,
        height: 38,
        fontSize: 15,
        padding: 0
      },
      title: "Cerrar",
      onClick: () => setClienteExpandidoId(null)
    }, "✕")), /*#__PURE__*/React.createElement(NuevaVenta, {
      key: `${c.id}-${(todasVentas || ventas).filter(v => v.clienteId === c.id).length}`,
      compacto: true,
      cliente: c,
      productos: productos,
      fecha: fecha,
      onPerdidaCliente: onPerdidaCliente,
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
        // Antes esto llamaba a marcarNoVisita Y a onNoQuiereConEnvases, las
        // dos casi al mismo tiempo — ambas terminan guardando noVisitas, así
        // que quedaba una carrera donde una podía pisar a la otra. Con una
        // sola vía (onNoQuiereConEnvases, que adentro ya marca "noquiso" Y
        // deja asentado el envase prestado/devuelto) no hay forma de que el
        // envase se pierda por el orden de guardado.
        if (onNoQuiereConEnvases) onNoQuiereConEnvases(c.id, envPrest, envDev);else marcarNoVisita(c.id, "noquiso");
        irAlSiguientePendiente();
      },
      onCambiarDispenser: delta => onCambiarDispenserCliente && onCambiarDispenserCliente(c.id, delta),
      mostrarMas: mostrarMas,
      mostrarDeuda: mostrarDeuda
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
});

// Vista previa de la "ruta sugerida" (ver sugerirRuta en ListaClientes más
// abajo) — solo muestra, nunca aplica sola; Guillermo decide si la usa.
function RutaSugeridaModal({ rutaSugerida, onCerrar, onAplicar }) {
  if (!rutaSugerida) return null;
  const { orden, horaPorId, sinUbicarIds } = rutaSugerida;
  const minAHora = min => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
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
      alignItems: "flex-end",
      justifyContent: "center"
    },
    onClick: onCerrar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#101b24",
      borderRadius: "16px 16px 0 0",
      padding: 16,
      width: "100%",
      maxWidth: 480,
      maxHeight: "82vh",
      overflowY: "auto",
      border: "1px solid var(--color-border-secondary)",
      borderBottom: "none"
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }
  }, "✨ Ruta sugerida"), /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 12.5, color: "var(--color-text-secondary)", marginBottom: 12, lineHeight: 1.4 }
  }, "Orden según el horario en que solés atender a cada uno (de tu historial) y, a los que no tienen suficiente historial, la ubicación más cercana. Revisá y aplicá solo si tiene sentido."), orden.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 0",
      borderBottom: i < orden.length - 1 ? "1px solid var(--color-border-tertiary)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: { width: 22, fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)", flexShrink: 0 }
  }, i + 1), /*#__PURE__*/React.createElement("span", {
    style: { flex: 1, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
  }, c.nombre), horaPorId[c.id] != null ? /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 11.5, fontWeight: 600, color: "#4dd9a0", flexShrink: 0 }
  }, "\uD83D\uDD50 ~", minAHora(horaPorId[c.id])) : sinUbicarIds.has(c.id) ? /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 11, color: "#E24B4A", flexShrink: 0 }
  }, "sin datos") : /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 11, color: "var(--color-text-tertiary)", flexShrink: 0 }
  }, "sin historial"))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 10, marginTop: 16 }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 1,
      padding: "12px 0",
      borderRadius: 10,
      border: "1px solid var(--color-border-tertiary)",
      background: "none",
      color: "var(--color-text-secondary)",
      fontSize: 14,
      cursor: "pointer"
    },
    onClick: onCerrar
  }, "Cerrar"), /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 1,
      padding: "12px 0",
      borderRadius: 10,
      border: "none",
      background: "#0a5c3a",
      color: "#e2eaf4",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer"
    },
    onClick: onAplicar
  }, "Aplicar este orden"))));
}
function ListaClientes({
  clientes,
  // Clientes pendientes de un día hábil anterior de esta misma semana que
  // todavía no se cerró (ej. quedaron 3 de Lunes y hoy es Martes) — pedido
  // 2026-10-16: se muestran en su propia sección, ARRIBA de "Pendientes",
  // para terminarlos antes de arrancar con los de hoy. Las ventas/marcas que
  // se carguen acá quedan con el día y fecha de HOY (dia/fecha de abajo, los
  // de la pantalla), no con el día original — así lo pidió Guillermo.
  clientesArrastrados,
  dia,
  fecha,
  ventas,
  todasVentas,
  noVisitas,
  recordatorios,
  productos,
  onSeleccionar,
  onEntregar,
  onPasarAEfectivo,
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
  onPerdida,
  onPerdidaCliente,
  onRetirarCliente
}) {
  const [busqueda, setBusqueda] = useState("");
  // 25/11/2026: pedido de Guillermo -- achicar la cabecera de "Clientes del
  // día": Buscar / Ruta y mapa / Nuevo en una sola fila compacta de 3
  // columnas, en vez de 3 filas separadas (buscador + fila de 4 botones +
  // texto de ayuda). "Ruta óptima", "Sugerir ruta" y "Mapa" quedan
  // unificados en un solo botón que despliega las 3 opciones.
  const [menuRutaAbierto, setMenuRutaAbierto] = useState(false);
  const [clienteMoviendo, setClienteMoviendo] = useState(null); // id del cliente "levantado", esperando destino
  const [rutaSugerida, setRutaSugerida] = useState(null); // preview de sugerirRuta(); null = cerrado
  // Tarjeta de venta compacta expandida in-place (una sola a la vez). Antes
  // "Entregar" navegaba a otra pantalla (NuevaVenta); ahora expande la
  // planilla ahí mismo y la lista sigue debajo, sin cambiar de pantalla.
  const [clienteExpandidoId, setClienteExpandidoId] = useState(null);
  // Auto-scroll al botón "Ir a la planilla del día" apenas se termina de
  // registrar el último cliente pendiente — antes había que darse cuenta y
  // bajar manualmente.
  const btnPlanillaRef = React.useRef(null);
  // ventas y noVisitas ya filtradas por fecha+dia desde App
  const clientesReales = clientes;
  // Todo este bloque (orden, filtro de búsqueda, y las 4 secciones de la
  // lista) antes se recalculaba en CADA render de ListaClientes — incluido
  // cada vez que se tocaba un botón que no cambia la composición de la
  // lista (expandir "Entregar" en una tarjeta, levantar un cliente para
  // reordenar, etc.). Con 100-300 clientes no es pesado en sí, pero sí
  // genera un array/Set nuevo en cada toque, lo que hace que TODAS las
  // tarjetas reciban props con identidad distinta y vuelvan a renderizar
  // igual. Memoizado acá, solo se recalcula si cambian los datos reales
  // (clientes, ventas, noVisitas, fecha) o el texto buscado.
  const {
    atendidos,
    noVMap,
    visitadosSinVenta,
    visitados,
    clientesOrdenados,
    filtrados,
    pendientesNormales,
    volverAlFinal,
    pendientes,
    sinEntrega,
    listos,
    pausados,
    quincenalesSinTurno,
    agregadosHoy,
    clientesParaHoy,
    todosListos
  } = React.useMemo(() => {
    const atendidos = new Set(ventas.filter(v => !v._esCobro && !v._esAjuste).map(v => v.clienteId));
    const noVMap = {};
    (noVisitas || []).filter(v => v.fecha === fecha).forEach(v => {
      noVMap[v.clienteId] = v.motivo;
    });
    // visitados = ventas + noesta2 + noquiso (noesta 1ra vez NO cuenta)
    const visitadosSinVenta = new Set(Object.entries(noVMap).filter(([, m]) => m === "noesta2" || m === "noquiso").map(([id]) => Number(id)));
    const visitados = new Set([...atendidos, ...visitadosSinVenta]);
    // Prospectos siempre al final, sin importar si tienen orden cargado —
    // son "un reparto dentro del reparto" hasta que se confirmen como fijos.
    const clientesOrdenados = [...clientes].sort((a, b) => (a.esProspecto ? 1 : 0) - (b.esProspecto ? 1 : 0) || (a.orden || 9999) - (b.orden || 9999));
    const filtrados = clientesOrdenados.filter(c => buscarCliente(c, busqueda) > 0);
    // Un cliente (prospecto o no) cargado HOY mismo no debe aparecer como
    // "pendiente de atender" en la ronda de hoy — cargarlo YA fue la visita de
    // hoy. Recién debería volver a aparecer en su próxima visita (la semana
    // que viene, cuando "fecha" cambie y ya no coincida con creadoFecha).
    // Pausa manual: el cliente avisó que no va a estar X días — evita ir en
    // vano (pedido de Guillermo 2026-11-17, tras ir 3 veces el mismo día a
    // alguien que ya le había avisado). Mientras pausadoHasta sea hoy o
    // futuro no cuenta como pendiente de HOY ni exige visita para cerrar la
    // ronda; tiene su propia sección para seguir visible.
    const esPausado = c => !!(c.pausadoHasta && c.pausadoHasta >= fecha);
    // Clientes "quincenales": compran, saltean la visita siguiente, y recién
    // vuelven a comprar a la otra — pedido de Guillermo 2026-11-17. A
    // diferencia de la pausa (fecha fija elegida a mano), esto se marca UNA
    // SOLA VEZ (cliente.frecuencia === "quincenal") y el sistema calcula
    // solo, cada semana, si le toca o no: mira la fecha de su última compra
    // REAL (ignora cobros/ajustes/cambios) y si todavía no pasaron ~10 días
    // no le toca esta semana. Sin historial de compras reales, se lo trata
    // como si le tocara (no hay con qué calcular todavía).
    const ultimaCompraReal = {};
    (todasVentas || ventas).forEach(v => {
      if (v._esCobro || v._esAjuste || v._esAjusteEnvases || v._esCambio || v._esMixtoTrans) return;
      const fk = v.fechaKey;
      if (!fk) return;
      if (!ultimaCompraReal[v.clienteId] || fk > ultimaCompraReal[v.clienteId]) ultimaCompraReal[v.clienteId] = fk;
    });
    const hoyDate = new Date(fecha + "T12:00:00");
    const noLeTocaQuincenal = c => {
      if (c.frecuencia !== "quincenal") return false;
      const fk = ultimaCompraReal[c.id];
      if (!fk) return false;
      const dias = Math.floor((hoyDate - new Date(fk + "T12:00:00")) / 86400000);
      return dias < 10;
    };
    const pendientesNormales = filtrados.filter(c => !visitados.has(c.id) && noVMap[c.id] !== "noesta" && c.creadoFecha !== fecha && !esPausado(c) && !noLeTocaQuincenal(c));
    const volverAlFinal = filtrados.filter(c => noVMap[c.id] === "noesta" && !atendidos.has(c.id) && !esPausado(c) && !noLeTocaQuincenal(c));
    const pendientes = [...pendientesNormales, ...volverAlFinal];
    const sinEntrega = filtrados.filter(c => visitadosSinVenta.has(c.id));
    const listos = filtrados.filter(c => atendidos.has(c.id));
    const pausados = filtrados.filter(c => esPausado(c) && !visitados.has(c.id));
    const quincenalesSinTurno = filtrados.filter(c => !esPausado(c) && noLeTocaQuincenal(c) && !visitados.has(c.id));
    // BUG REPORTADO: un cliente cargado hoy mismo (creadoFecha === fecha), sin
    // venta ni "no está"/"no quiere" todavía, quedaba afuera de las 4
    // secciones de arriba — no aparecía en NINGÚN lado de la lista, ni
    // buscándolo, aunque el dato estuviera bien guardado. Necesita su propia
    // sección para seguir visible/buscable sin contar como "pendiente".
    const agregadosHoy = filtrados.filter(c => c.creadoFecha === fecha && !visitados.has(c.id) && noVMap[c.id] !== "noesta");
    // Mismo criterio: los recién cargados hoy no cuentan para el total de
    // "todos listos" — si no, la ronda nunca se marcaría como terminada.
    const clientesParaHoy = clientes.filter(c => c.creadoFecha !== fecha && !esPausado(c) && !noLeTocaQuincenal(c));
    const todosListos = clientesParaHoy.length > 0 && clientesParaHoy.filter(c => visitados.has(c.id)).length >= clientesParaHoy.length;
    return {
      atendidos,
      noVMap,
      visitadosSinVenta,
      visitados,
      clientesOrdenados,
      filtrados,
      pendientesNormales,
      volverAlFinal,
      pendientes,
      sinEntrega,
      listos,
      pausados,
      quincenalesSinTurno,
      agregadosHoy,
      clientesParaHoy,
      todosListos
    };
  }, [clientes, ventas, noVisitas, fecha, busqueda]);
  const marcarNoVisita = (id, motivo) => {
    const prev = noVMap[id];
    if (motivo === "noesta" && prev === "noesta") onRegistrarNoVisita(id, "noesta2");else if (prev === motivo) onQuitarNoVisita(id);else onRegistrarNoVisita(id, motivo);
  };
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
  // Ruta sugerida "según tu movimiento real": el orden de la lista no es el
  // orden en que realmente se atiende (hay clientes que se visitan temprano
  // y otros tarde, según en qué horario se sabe que están) — pedido de
  // Guillermo 2026-11-17. Primero se arma el orden según la hora típica de
  // cada cliente (mediana de la hora de sus últimas ventas reales ESE día
  // de la semana — cada venta ya guarda `hora`); a los que no tienen
  // suficiente historial se los intercala por cercanía geográfica (Maps)
  // junto al vecino de hora conocida más próximo; si tampoco tienen
  // ubicación cargada quedan al final, marcados "sin datos". Nunca se
  // aplica sola — arma una vista previa (ver RutaSugeridaModal) y Guillermo
  // decide si la usa.
  const _horaAMinutos = hhmm => {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || "").trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const sugerirRuta = () => {
    const base = clientesOrdenados;
    if (base.length < 3) {
      alert("Hace falta al menos 3 clientes en el día para armar una sugerencia.");
      return;
    }
    const conHora = [],
      sinHora = [];
    base.forEach(c => {
      const horas = (todasVentas || ventas).filter(v => v.clienteId === c.id && v.dia === dia && v.hora && !v._esCobro && !v._esAjuste && !v._esAjusteEnvases && !v._esCambio && !v._esMixtoTrans).sort((a, b) => (b.fechaKey || "").localeCompare(a.fechaKey || "")).slice(0, 8).map(v => _horaAMinutos(v.hora)).filter(n => n != null).sort((a, b) => a - b);
      if (horas.length) conHora.push({
        c,
        min: horas[Math.floor(horas.length / 2)]
      });else sinHora.push(c);
    });
    if (conHora.length < 2) {
      alert("Todavía no hay suficiente historial de horarios para este día — probá de nuevo cuando haya más ventas cargadas.");
      return;
    }
    conHora.sort((a, b) => a.min - b.min);
    let secuencia = conHora.map(x => x.c);
    const sinUbicar = [];
    sinHora.forEach(c => {
      const co = extraerCoordsDeURL(c.maps);
      if (!co) {
        sinUbicar.push(c);
        return;
      }
      let mejorIdx = -1,
        mejorD = Infinity;
      secuencia.forEach((sc, i) => {
        const sco = extraerCoordsDeURL(sc.maps);
        if (!sco) return;
        const d = (sco.lat - co.lat) ** 2 + (sco.lng - co.lng) ** 2;
        if (d < mejorD) {
          mejorD = d;
          mejorIdx = i;
        }
      });
      if (mejorIdx === -1) {
        sinUbicar.push(c);
        return;
      }
      secuencia = [...secuencia.slice(0, mejorIdx + 1), c, ...secuencia.slice(mejorIdx + 1)];
    });
    setRutaSugerida({
      orden: [...secuencia, ...sinUbicar],
      horaPorId: Object.fromEntries(conHora.map(x => [x.c.id, x.min])),
      sinUbicarIds: new Set(sinUbicar.map(c => c.id))
    });
  };
  const aplicarRutaSugerida = () => {
    if (!rutaSugerida) return;
    const posMap = {};
    rutaSugerida.orden.forEach((c, i) => {
      posMap[c.id] = i + 1;
    });
    onReordenar(clientes.map(c => posMap[c.id] !== undefined ? {
      ...c,
      orden: posMap[c.id]
    } : c));
    setRutaSugerida(null);
  };
  // Contador en vivo de efectivo cobrado + envases vendidos HOY, fijo
  // arriba de la lista mientras se reparte (pedido de Guillermo
  // 25/11/2026). Efectivo = solo la parte en efectivo (un pago mixto solo
  // suma su parte montoEfec, igual criterio que "cobEfectivo" en la
  // Planilla). Envases = solo entregas reales de hoy (se excluyen cobros
  // de deuda, ajustes y la parte-transferencia de un pago mixto, que no
  // representan envases físicamente entregados hoy).
  const contadorDia = React.useMemo(() => {
    let efectivo = 0;
    const envases = { soda: 0, b10: 0, b20: 0 };
    (ventas || []).forEach(v => {
      if (v.pago === "contado") {
        const esMixto = (Number(v.montoTrans) || 0) > 0;
        efectivo += esMixto ? (Number(v.montoEfec) || 0) : ((v.pagadoNum != null ? v.pagadoNum : v.neto) || 0);
      }
      if (v._esCobro || v._esAjuste || v._esMixtoTrans) return;
      (v.detalle || []).forEach(d => {
        const cant = Number(d.cantidad) || 0;
        if (d.nombre === "Sifón 1.5L") envases.soda += cant;else if (d.nombre === "Bidón 10L") envases.b10 += cant;else if (d.nombre === "Bidón 20L") envases.b20 += cant;
      });
    });
    return { efectivo, envases };
  }, [ventas]);
  // Props estables para ClienteCard (ver comentario arriba de su definición) —
  // spreadeadas en cada React.createElement(ClienteCard, {key, ...cardProps(c)}).
  const cardProps = c => ({
    c, atendidos, noVMap, visitados, clienteExpandidoId, setClienteExpandidoId, pendientes, clienteMoviendo, setClienteMoviendo, moverCliente, onSeleccionar, recordatorios, ventas, fecha, onConfirmarTransfer, onPasarAEfectivo, todasVentas, marcarNoVisita, onGuardarVenta, productos, onNoQuiereConEnvases, onCambiarDispenserCliente, onQuitarNoVisita, clientes, onReordenar, onRetirarCliente, onPerdidaCliente
  });
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: `Clientes · ${dia}`,
    onVolver: onVolver
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 16px 6px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: { ...s.input, flex: 1, minWidth: 0, fontSize: 12.5, padding: "9px 8px" },
    placeholder: "🔍 Buscar",
    value: busqueda,
    onChange: e => setBusqueda(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      flex: 1,
      minWidth: 0,
      fontSize: 11.5,
      fontWeight: 700,
      padding: "9px 4px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      background: menuRutaAbierto ? "var(--color-background-info)" : undefined,
      color: menuRutaAbierto ? "var(--color-text-info)" : undefined
    },
    onClick: () => setMenuRutaAbierto(m => !m)
  }, "🗺️ Ruta y mapa ", menuRutaAbierto ? "▴" : "▾"), /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 1,
      minWidth: 0,
      background: "linear-gradient(180deg, #2a79cf, #185FA5)",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      fontSize: 11.5,
      fontWeight: 800,
      padding: "9px 4px",
      cursor: "pointer",
      whiteSpace: "nowrap"
    },
    onClick: onNuevoCliente
  }, "＋ Nuevo")), menuRutaAbierto && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      background: "var(--color-background-secondary)",
      border: "0.5px solid var(--color-border-secondary)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, [["🎯", "Ruta óptima", abrirRutaOptima], ["✨", "Sugerir ruta", sugerirRuta], ["📍", "Ver mapa", onAbrirMapa]].map(([ic, lbl, fn], i) => /*#__PURE__*/React.createElement("div", {
    key: lbl,
    onClick: () => {
      fn && fn();
      setMenuRutaAbierto(false);
    },
    style: {
      padding: "11px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 13,
      color: "var(--color-text-primary)",
      borderBottom: i < 2 ? "0.5px solid var(--color-border-tertiary)" : "none",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 15 }
  }, ic), lbl))), (volverAlFinal.length > 0 || sinEntrega.length > 0) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 8
    }
  }, volverAlFinal.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: s.badge("warning")
  }, volverAlFinal.length, " volver al final"), sinEntrega.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: s.badge("danger")
  }, sinEntrega.length, " sin entrega")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: clienteMoviendo ? "var(--color-text-warning)" : "var(--color-text-tertiary)",
      marginTop: 6,
      fontWeight: clienteMoviendo ? 600 : 400
    }
  }, clienteMoviendo ? `📍 Tocá el # de dónde debería ir "${clientesReales.find(c => c.id === clienteMoviendo)?.nombre || ""}" (tocá el mismo para cancelar)` : "Tocá el # de un cliente para moverlo, después tocá dónde debería ir")), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "0 16px 10px",
      background: "var(--color-background-secondary)",
      border: "0.5px solid var(--color-border-secondary)",
      borderRadius: 14,
      padding: "10px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--color-text-success)",
      paddingBottom: 8,
      marginBottom: 10,
      borderBottom: "0.5px solid var(--color-border-tertiary)"
    }
  }, "✓ ", clientesReales.filter(c => visitados.has(c.id)).length, "/", clientesReales.length, " VISITADOS"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", flexDirection: "column" }
  }, /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 10, color: "var(--color-text-tertiary)", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }
  }, "💵 Efectivo cobrado"), /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 19, color: "var(--color-text-success)", fontWeight: 800 }
  }, fmt(contadorDia.efectivo))), /*#__PURE__*/React.createElement("div", {
    style: { width: 0.5, alignSelf: "stretch", background: "var(--color-border-tertiary)" }
  }), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 12 }
  }, [["soda", "Sifón"], ["b10", "Bidón 10L"], ["b20", "Bidón 20L"]].map(([k, lbl]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: { display: "flex", flexDirection: "column", alignItems: "center" }
  }, /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 16, fontWeight: 800, color: "var(--color-text-primary)" }
  }, contadorDia.envases[k]), /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 9, color: "var(--color-text-tertiary)", fontWeight: 600 }
  }, lbl)))))), filtrados.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "40px 20px",
      color: "var(--color-text-tertiary)",
      fontSize: 14
    }
  }, "No hay clientes para ", dia, "."), (clientesArrastrados || []).length > 0 && (() => {
    const grupos = {};
    clientesArrastrados.forEach(c => {
      const k = c._arrastreDia;
      if (!grupos[k]) grupos[k] = {
        fecha: c._arrastreFecha,
        items: []
      };
      grupos[k].items.push(c);
    });
    return Object.keys(grupos).map(k => /*#__PURE__*/React.createElement(React.Fragment, {
      key: "arrastre_" + k
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...s.sectionTitle,
        color: "#fca5a5"
      }
    }, "⏪ Pendientes de ", k, " ", grupos[k].fecha, " (", grupos[k].items.length, ")"), grupos[k].items.map(c => /*#__PURE__*/React.createElement(ClienteCard, {
      key: "arr_" + c.id,
      ...cardProps(c)
    }))));
  })(), pendientesNormales.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: s.sectionTitle
  }, "Pendientes (", pendientesNormales.length, ")"), pendientesNormales.map(c => /*#__PURE__*/React.createElement(ClienteCard, {
    key: c.id,
    ...cardProps(c)
  }))), agregadosHoy.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      ...s.sectionTitle,
      color: "#5daaff"
    }
  }, "🆕 Agregados hoy (", agregadosHoy.length, ")"), agregadosHoy.map(c => /*#__PURE__*/React.createElement(ClienteCard, {
    key: c.id,
    ...cardProps(c)
  }))), volverAlFinal.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      ...s.sectionTitle,
      color: "#f5b942"
    }
  }, "🔄 Volver a visitar (", volverAlFinal.length, ")"), volverAlFinal.map(c => /*#__PURE__*/React.createElement(ClienteCard, {
    key: c.id,
    ...cardProps(c)
  }))), pausados.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      ...s.sectionTitle,
      color: "#EF9F27"
    }
  }, "⏸ Pausados (", pausados.length, ")"), pausados.map(c => /*#__PURE__*/React.createElement(ClienteCard, {
    key: c.id,
    ...cardProps(c)
  }))), quincenalesSinTurno.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      ...s.sectionTitle,
      color: "#5daaff"
    }
  }, "📅 Quincenales — no les toca esta semana (", quincenalesSinTurno.length, ")"), quincenalesSinTurno.map(c => /*#__PURE__*/React.createElement(ClienteCard, {
    key: c.id,
    ...cardProps(c)
  }))), listos.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: s.sectionTitle
  }, "Entregado (", listos.length, ")"), listos.map(c => /*#__PURE__*/React.createElement(ClienteCard, {
    key: c.id,
    ...cardProps(c)
  }))), sinEntrega.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: s.sectionTitle
  }, "Sin entrega (", sinEntrega.length, ")"), sinEntrega.map(c => /*#__PURE__*/React.createElement(ClienteCard, {
    key: c.id,
    ...cardProps(c)
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
  }, "✅ Todos registrados · Ir a la planilla del día →")), rutaSugerida && /*#__PURE__*/React.createElement(RutaSugeridaModal, {
    rutaSugerida: rutaSugerida,
    onCerrar: () => setRutaSugerida(null),
    onAplicar: aplicarRutaSugerida
  }));
}
// Modal para pausar el reparto a un cliente: elige la fecha de vuelta con el
// selector nativo de fecha del celular (pedido de Guillermo 2026-11-17: antes
// pedía "cuántos días" y era menos práctico que elegir la fecha directo).
function PausaClienteModal({ cliente, onGuardar, onCerrar }) {
  const sugerida = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toLocaleDateString("en-CA");
  })();
  const [fecha, setFecha] = React.useState(cliente.pausadoHasta || sugerida);
  const [motivo, setMotivo] = React.useState(cliente.pausadoMotivo || "");
  const hoy = new Date().toLocaleDateString("en-CA");
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
      padding: 16
    },
    onClick: onCerrar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      width: "100%",
      maxWidth: 380,
      background: "#101b24"
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 2 }
  }, "⏸ Pausar reparto"), /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 12.5, color: "var(--color-text-secondary)", marginBottom: 14 }
  }, cliente.nombre), /*#__PURE__*/React.createElement("label", {
    style: { fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }
  }, "¿Qué día volvés a su casa?"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: fecha,
    min: hoy,
    onChange: e => setFecha(e.target.value),
    style: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid var(--color-border-tertiary)",
      background: "var(--color-background-secondary)",
      color: "var(--color-text-primary)",
      fontSize: 15,
      marginBottom: 12,
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: { fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }
  }, "Motivo (opcional)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: motivo,
    onChange: e => setMotivo(e.target.value),
    placeholder: "Ej: dijo que no va a estar",
    style: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid var(--color-border-tertiary)",
      background: "var(--color-background-secondary)",
      color: "var(--color-text-primary)",
      fontSize: 14,
      marginBottom: 16,
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 10 }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 1,
      padding: "12px 0",
      borderRadius: 10,
      border: "1px solid var(--color-border-tertiary)",
      background: "none",
      color: "var(--color-text-secondary)",
      fontSize: 14,
      cursor: "pointer"
    },
    onClick: onCerrar
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 1,
      padding: "12px 0",
      borderRadius: 10,
      border: "none",
      background: "#EF9F27",
      color: "#1a1206",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer"
    },
    onClick: () => {
      if (!fecha) return;
      onGuardar({ pausadoHasta: fecha, pausadoMotivo: motivo || "" });
    }
  }, "Guardar"))));
}
// Modal para pactar el mínimo de consumo mensual de un cliente con
// dispenser de frío/calor prestado (pedido de Guillermo 2026-11-17: el
// dispenser se presta gratis mientras el cliente mantenga un consumo
// mensual razonable de un producto pactado; si no llega, a fin de mes se
// le cobra la diferencia — ver DispensersFrioCalor más abajo, que hace el
// cálculo real y el cobro, esto solo pacta el mínimo).
function DispenserConfigModal({ cliente, productos, onGuardar, onCerrar }) {
  const opciones = (productos || []).filter(p => !p.esDispenser);
  const [producto, setProducto] = React.useState(cliente.dispenserProducto || (opciones[0] && opciones[0].nombre) || "");
  const [minimo, setMinimo] = React.useState(cliente.dispenserMinimoMensual || "");
  const precioSel = (opciones.find(p => p.nombre === producto) || {}).precio || 0;
  const pesosEq = precioSel && Number(minimo) ? Math.round(Number(minimo) * precioSel) : null;
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
      padding: 16
    },
    onClick: onCerrar
  }, /*#__PURE__*/React.createElement("div", {
    style: { ...s.card, width: "100%", maxWidth: 380, background: "#101b24" },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 2 }
  }, "🌡 Mínimo del dispenser"), /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 12.5, color: "var(--color-text-secondary)", marginBottom: 14 }
  }, cliente.nombre), /*#__PURE__*/React.createElement("label", {
    style: { fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }
  }, "Producto pactado"), /*#__PURE__*/React.createElement("select", {
    value: producto,
    onChange: e => setProducto(e.target.value),
    style: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid var(--color-border-tertiary)",
      background: "var(--color-background-secondary)",
      color: "var(--color-text-primary)",
      fontSize: 15,
      marginBottom: 12,
      boxSizing: "border-box"
    }
  }, opciones.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.nombre
  }, p.nombre))), /*#__PURE__*/React.createElement("label", {
    style: { fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }
  }, "Mínimo por mes (unidades)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    inputMode: "numeric",
    value: minimo,
    onChange: e => setMinimo(e.target.value),
    placeholder: "Ej: 12",
    style: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid var(--color-border-tertiary)",
      background: "var(--color-background-secondary)",
      color: "var(--color-text-primary)",
      fontSize: 15,
      marginBottom: 4,
      boxSizing: "border-box"
    }
  }), pesosEq && /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 11.5, color: "var(--color-text-tertiary)", marginBottom: 12 }
  }, "≈ $", pesosEq.toLocaleString("es-AR"), " al precio actual de ", producto, " ($", precioSel.toLocaleString("es-AR"), " c/u) — si el precio cambia, se recalcula solo"), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", gap: 10, marginTop: pesosEq ? 0 : 16 }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 1,
      padding: "12px 0",
      borderRadius: 10,
      border: "1px solid var(--color-border-tertiary)",
      background: "none",
      color: "var(--color-text-secondary)",
      fontSize: 14,
      cursor: "pointer"
    },
    onClick: onCerrar
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 1,
      padding: "12px 0",
      borderRadius: 10,
      border: "none",
      background: "#5daaff",
      color: "#07131f",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer"
    },
    onClick: () => {
      const n = Math.max(0, Math.round(Number(minimo)) || 0);
      if (!producto || n <= 0) return;
      onGuardar({ dispenserProducto: producto, dispenserMinimoMensual: n });
    }
  }, "Guardar"))));
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
  onEditarMontoCobro,
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
  onPerdida,
  onRetirarCliente
}) {
  const [editandoCliente, setEditandoCliente] = useState(false);
  const [editandoVentaId, setEditandoVentaId] = useState(null);
  const [editandoSaldo, setEditandoSaldo] = useState(false);
  const [tipoSaldoEdit, setTipoSaldoEdit] = useState("");
  const [montoSaldoEdit, setMontoSaldoEdit] = useState("");
  const [mostrarRecordatorio, setMostrarRecordatorio] = useState(false);
  const [mostrarPausa, setMostrarPausa] = useState(false);
  const [mostrarDispenserConfig, setMostrarDispenserConfig] = useState(false);
  const [mostrarPagoSaldo, setMostrarPagoSaldo] = useState(false);
  const [mostrarFotoGrande, setMostrarFotoGrande] = useState(false);
  const [mostrarFotoComodato, setMostrarFotoComodato] = useState(false);
  const [razonAjuste, setRazonAjuste] = useState("");
  const [mostrarCambio, setMostrarCambio] = useState(false);
  const pausadoActivo = !!(cliente.pausadoHasta && cliente.pausadoHasta >= fecha);
  const noLeTocaQuincenalFicha = (() => {
    if (cliente.frecuencia !== "quincenal") return false;
    const reales = (ventas || []).filter(v => !v._esCobro && !v._esAjuste && !v._esAjusteEnvases && !v._esCambio && !v._esMixtoTrans && v.fechaKey);
    if (!reales.length) return false;
    const ultimaFk = reales.reduce((a, v) => v.fechaKey > a ? v.fechaKey : a, reales[0].fechaKey);
    const dias = Math.floor((new Date(fecha + "T12:00:00") - new Date(ultimaFk + "T12:00:00")) / 86400000);
    return dias < 10;
  })();
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
  // "Para retirar": 4 visitas SEGUIDAS sin comprar (no está confirmado 2da
  // vez, o no quiere) — se calcula en vivo mirando el historial combinado
  // de compras + no-visitas de este cliente, más reciente primero. Si las
  // primeras N son todas "sin comprar", esas son las consecutivas actuales.
  const comprasReales = ventasSinMixtoTr.filter(v => !v._esCobro && !v._esAjuste && !v._esAjusteEnvases && !v._esCambio);
  const eventosVisita = [...comprasReales.map(v => ({
    fecha: v.fechaKey,
    compra: true
  })), ...(noVisitas || []).filter(n => n.motivo === "noesta2" || n.motivo === "noquiso").map(n => ({
    fecha: n.fecha,
    compra: false
  }))].filter(e => e.fecha).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  let consecutivasSinComprar = 0;
  for (const e of eventosVisita) {
    if (e.compra) break;
    consecutivasSinComprar++;
  }
  const paraRetirar = consecutivasSinComprar >= 4;
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement(HeaderApp, {
    titulo: `Clientes · ${cliente.dia || ""}`,
    onVolver: onVolver
  }), paraRetirar && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "8px 14px 0",
      padding: "10px 14px",
      borderRadius: 10,
      background: "rgba(226,75,74,0.14)",
      border: "1px solid #E24B4A",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#E24B4A",
      fontWeight: 500
    }
  }, "⚠ ", consecutivasSinComprar, " visitas seguidas sin comprar"), /*#__PURE__*/React.createElement("button", {
    style: {
      padding: "7px 12px",
      borderRadius: 8,
      border: "1px solid #E24B4A",
      background: "transparent",
      color: "#E24B4A",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      flexShrink: 0
    },
    onClick: () => onRetirarCliente && onRetirarCliente()
  }, "Retirar envases y dar de baja")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: paraRetirar ? "rgba(226,75,74,0.08)" : "var(--color-background-secondary)",
      border: paraRetirar ? "1px solid #E24B4A" : undefined,
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
  }, cliente.nombre, cliente.esProspecto && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 20,
      color: "#b794f6",
      border: "0.5px solid #b794f6",
      flexShrink: 0
    }
  }, "🔸 Prospecto")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexShrink: 0
    }
  }, cliente.esProspecto && onRetirarCliente && /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 12,
      padding: "5px 10px",
      border: "1px solid #E24B4A",
      color: "#E24B4A",
      background: "transparent"
    },
    title: "El prospecto no sigue — retira el envase de promoción y lo da de baja",
    onClick: () => onRetirarCliente()
  }, "Retirado"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 12,
      padding: "5px 10px",
      border: pausadoActivo ? "1px solid #EF9F27" : undefined,
      color: pausadoActivo ? "#EF9F27" : undefined,
      background: pausadoActivo ? "transparent" : undefined
    },
    title: "El cliente avisó que no va a estar — pausa el reparto para que no cuente como pendiente",
    onClick: () => {
      if (pausadoActivo) {
        if (window.confirm("¿Quitar la pausa de este cliente? Vuelve a aparecer como pendiente.")) onEditar({
          pausadoHasta: null,
          pausadoMotivo: null
        });
        return;
      }
      setMostrarPausa(true);
    }
  }, pausadoActivo ? "⏸ Pausado" : "⏸ Pausar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 12,
      padding: "5px 10px",
      border: cliente.frecuencia === "quincenal" ? "1px solid #5daaff" : undefined,
      color: cliente.frecuencia === "quincenal" ? "#5daaff" : undefined,
      background: cliente.frecuencia === "quincenal" ? "transparent" : undefined
    },
    title: "Compra, saltea la próxima visita y vuelve a comprar a la otra — marcalo una vez y el sistema calcula solo cada semana si le toca",
    onClick: () => {
      if (cliente.frecuencia === "quincenal") {
        if (window.confirm("¿Volver a frecuencia semanal normal para este cliente?")) onEditar({
          frecuencia: null
        });
        return;
      }
      if (window.confirm("¿Marcar a este cliente como quincenal? El sistema va a calcular solo, según su última compra real, si le toca o no cada semana.")) onEditar({
        frecuencia: "quincenal"
      });
    }
  }, cliente.frecuencia === "quincenal" ? "📅 Quincenal" : "📅 Semanal"), (Number(cliente.dispenser) || 0) > 0 && /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      fontSize: 12,
      padding: "5px 10px",
      border: cliente.dispenserMinimoMensual ? "1px solid #5daaff" : undefined,
      color: cliente.dispenserMinimoMensual ? "#5daaff" : undefined,
      background: cliente.dispenserMinimoMensual ? "transparent" : undefined
    },
    title: "Mínimo de consumo mensual pactado (en unidades) por el dispenser de frío/calor prestado",
    onClick: () => setMostrarDispenserConfig(true)
  }, cliente.dispenserMinimoMensual ? `🌡 ${cliente.dispenserMinimoMensual}/mes` : "🌡 Configurar mínimo"), /*#__PURE__*/React.createElement("button", {
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
  }), mostrarFotoComodato && /*#__PURE__*/React.createElement(FotoClienteModal, {
    cliente: cliente,
    campo: "fotoComodato",
    titulo: "Comodato",
    onCerrar: () => setMostrarFotoComodato(false),
    onGuardarFoto: b64 => {
      onEditar({
        fotoComodato: b64
      });
    }
  }), mostrarPausa && /*#__PURE__*/React.createElement(PausaClienteModal, {
    cliente: cliente,
    onCerrar: () => setMostrarPausa(false),
    onGuardar: cambios => {
      onEditar(cambios);
      setMostrarPausa(false);
    }
  }), mostrarDispenserConfig && /*#__PURE__*/React.createElement(DispenserConfigModal, {
    cliente: cliente,
    productos: productos,
    onCerrar: () => setMostrarDispenserConfig(false),
    onGuardar: cambios => {
      onEditar(cambios);
      setMostrarDispenserConfig(false);
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, pausadoActivo && !editandoCliente && /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px",
      background: "#3a1500",
      border: "1px solid #EF9F27",
      display: "flex",
      gap: 10,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 18, flexShrink: 0 }
  }, "⏸"), /*#__PURE__*/React.createElement("div", {
    style: { flex: 1 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 13, fontWeight: 600, color: "#EF9F27" }
  }, "No visitar hasta el ", (() => {
    const [y, m, d] = String(cliente.pausadoHasta).split("-");
    return d && m ? `${d}/${m}/${y}` : cliente.pausadoHasta;
  })()), cliente.pausadoMotivo && /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 13, color: "var(--color-text-primary)", marginTop: 2 }
  }, cliente.pausadoMotivo)), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      color: "#EF9F27",
      border: "1px solid #EF9F27",
      borderRadius: 6,
      padding: "4px 10px",
      fontSize: 11,
      fontWeight: 600,
      cursor: "pointer",
      flexShrink: 0
    },
    onClick: () => {
      if (window.confirm("¿Quitar la pausa de este cliente? Vuelve a aparecer como pendiente.")) onEditar({
        pausadoHasta: null,
        pausadoMotivo: null
      });
    }
  }, "Quitar")), noLeTocaQuincenalFicha && !editandoCliente && /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px",
      background: "#0d2238",
      border: "1px solid #5daaff",
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 18, flexShrink: 0 }
  }, "📅"), /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 13, color: "#5daaff", fontWeight: 600 }
  }, "Cliente quincenal — no le toca esta semana")), recActivos.length > 0 && !editandoCliente && /*#__PURE__*/React.createElement("div", {
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
  }, "💬"), /*#__PURE__*/React.createElement("div", {
    onClick: () => setMostrarFotoComodato(true),
    title: cliente.fotoComodato ? "Ver foto del comodato" : "Cargar foto del comodato",
    style: {
      width: 26,
      height: 26,
      borderRadius: 6,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: 20,
      flexShrink: 0,
      border: cliente.fotoComodato ? "1.5px solid #b794f6" : "1.5px dashed var(--color-border-secondary)"
    }
  }, cliente.fotoComodato ? /*#__PURE__*/React.createElement("img", {
    src: cliente.fotoComodato,
    alt: "Comodato",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : "📄"))), cliente.foto && !editandoCliente && /*#__PURE__*/React.createElement("div", {
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
  }, "🔄 Cambio/Devolución"))) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
      const esDevol = !productoNuevo;
      const vt = {
        id: Date.now(),
        clienteId: cliente.id,
        cliente: cliente.nombre,
        dia: dia,
        fechaKey: fecha,
        fecha: new Date().toLocaleString("es-AR"),
        detalle: [{
          nombre: esDevol ? "Devolución de envase" : "Cambio de envase",
          cantidad: 1,
          precio: 0,
          total: 0
        }],
        pago: esDevol ? "devolucion" : "cambio",
        obs: esDevol ? `Devolución: ${productoViejo}${motivo.trim() ? ` · ${motivo.trim()}` : ""}` : `Cambio: ${productoViejo} → ${productoNuevo}${motivo.trim() ? ` · ${motivo.trim()}` : ""}`,
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
        envPrest: esDevol ? [] : [{
          prod: productoNuevo,
          cant: 1
        }],
        _esCambio: true,
        _esDevolucion: esDevol,
        _upd: Date.now()
      };
      onGuardarCambio && onGuardarCambio(vt);
      setMostrarCambio(false);
    },
    onCancelar: () => setMostrarCambio(false)
  }), ventaHoy && /*#__PURE__*/React.createElement("div", {
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
  }, ventaHoy.detalle.map(d => `${d.nombre} ×${d.cantidad}`).join(" · "), " · ", (Number(ventaHoy.montoTrans) || 0) > 0 && (Number(ventaHoy.montoEfec) || 0) > 0 ? `Mixto · ef ${fmt(ventaHoy.montoEfec)} + tr ${fmt(ventaHoy.montoTrans)}` : ventaHoy.pago)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      padding: "12px 0",
      fontSize: 15,
      borderRadius: 10
    },
    onClick: onVenta
  }, ventaHoy ? "📦 Registrar otra venta" : "📦 Registrar venta")), cliente.saldo < 0 && /*#__PURE__*/React.createElement("button", {
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
      const esDevolucion = v._esDevolucion || false;
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
      }, "Eliminar"), !v.transConfirmada && onEditarMontoCobro && /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 10,
          color: "var(--color-accent)",
          background: "none",
          border: "none",
          cursor: "pointer",
          marginTop: 4,
          display: "block"
        },
        onClick: () => {
          const nuevo = window.prompt("Nuevo monto del cobro:", v.pagadoNum);
          if (nuevo === null) return;
          onEditarMontoCobro(v.id, nuevo);
        }
      }, "✏️ Editar monto")));
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
          background: esDevolucion ? "rgba(29,158,117,0.08)" : "rgba(129,140,248,0.08)",
          borderRadius: 10,
          border: esDevolucion ? "0.5px solid rgba(29,158,117,0.3)" : "0.5px solid rgba(129,140,248,0.3)"
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
      }, esDevolucion ? "↩️" : "🔄"), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 700,
          color: esDevolucion ? "#1D9E75" : "#818cf8"
        }
      }, esDevolucion ? "Devolución de envase" : "Cambio de envase"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "var(--color-text-secondary)",
          marginTop: 2
        }
      }, esDevolucion ? v.obs?.replace("Devolución: ", "") : v.obs?.replace("Cambio: ", "")), /*#__PURE__*/React.createElement("div", {
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
          if (window.confirm(esDevolucion ? "¿Eliminar esta devolución?" : "¿Eliminar este cambio?")) onEliminarVenta(v.id);
        }
      }, "Eliminar"));
      return /*#__PURE__*/React.createElement("div", {
        key: v.id,
        style: {
          marginBottom: 6
        }
      }, editandoVentaId === v.id ? /*#__PURE__*/React.createElement(NuevaVenta, {
        compacto: true,
        ventaEditar: v,
        cliente: cliente,
        productos: productos,
        ventasCliente: [],
        // Traduce la firma "create" de NuevaVenta (con envases/opcionSaldo) a
        // la firma más chica que espera editarVenta — misma lógica que usaba
        // EditVenta antes de unificarse en este componente.
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
    productos: productos,
    onEditar: (id, cambios) => onEditar(cambios),
    onPerdida: onPerdida,
    izquierda: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-text-secondary)"
      }
    }, "Ajustar fijos y prestados")
  })), (() => {
    const PRODS_DET = (productos || []).filter(p => p.trackStock !== false).map(p => [claveStockDeProducto(p), p.nombre.replace(" 1.5L", "")]);
    const exTotal = {};
    const hab = {};
    const total = {};
    PRODS_DET.forEach(([k]) => {
      exTotal[k] = prestadoClienteDe(cliente, k, historial);
      hab[k] = cliente[k] || 0;
      total[k] = hab[k] + exTotal[k];
    });
    const hayExtra = PRODS_DET.some(([k]) => exTotal[k] !== 0);
    const hayAlgunoTotal = PRODS_DET.some(([k]) => total[k] > 0);
    const metricCards = PRODS_DET.map(([k, lbl]) => total[k] > 0 ? /*#__PURE__*/React.createElement("div", {
      key: k,
      style: s.metricCard
    }, /*#__PURE__*/React.createElement("div", {
      style: s.metricLabel
    }, lbl), /*#__PURE__*/React.createElement("div", {
      style: {
        ...s.metricVal,
        color: exTotal[k] > 0 ? "var(--color-text-warning)" : exTotal[k] < 0 ? "var(--color-text-success)" : "var(--color-text-primary)"
      }
    }, total[k])) : null);
    const extraSpans = PRODS_DET.map(([k, lbl]) => exTotal[k] !== 0 ? /*#__PURE__*/React.createElement("span", {
      key: k,
      style: {
        color: exTotal[k] > 0 ? "var(--color-text-warning)" : "var(--color-text-success)"
      }
    }, exTotal[k] > 0 ? `+${exTotal[k]} ${lbl} extra ` : ` −${Math.abs(exTotal[k])} ${lbl} devueltos `) : null);
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
    }, metricCards, !hayAlgunoTotal && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--color-text-tertiary)"
      }
    }, "Sin envases"))), hayExtra && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--color-text-tertiary)",
        marginTop: 8,
        borderTop: "0.5px solid var(--color-border-tertiary)",
        paddingTop: 6
      }
    }, PRODS_DET.some(([k]) => hab[k] > 0) && /*#__PURE__*/React.createElement("span", null, "Habitual: ", PRODS_DET.map(([k, lbl]) => hab[k] > 0 ? `${lbl}×${hab[k]} ` : "").join(""), " · "), extraSpans));
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
      const tieneEnv = (productos || []).filter(p => p.trackStock !== false).some(p => (Number(cliente[claveStockDeProducto(p)]) || 0) > 0);
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
  productos,
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
    productos: productos,
    onEditar: onEditarCliente,
    onPerdida: onPerdida
  }))));
}
function ClientesDormidos({
  clientes,
  ventas,
  productos,
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
    productos: productos,
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

// ─── Dispensers de frío/calor ───────────────────────────────────────────
// Pedido de Guillermo 2026-11-17: a los clientes a los que se les presta un
// dispenser de frío/calor se les pacta un mínimo de compra mensual de un
// producto (ej. 12 Bidones 20L/mes); si no llegan, a fin de mes se les cobra
// la diferencia al precio normal de ese producto (asunción: no hay un
// precio especial de "alquiler" separado, se avisó al pedirlo). NUNCA se
// cobra solo — esta pantalla solo muestra el cálculo, y el cobro se aplica
// recién cuando Guillermo toca "Cobrar faltante" en cada cliente.
function DispensersFrioCalor({
  clientes,
  ventas,
  productos,
  onVolver,
  onSeleccionar,
  onCobrarFaltante
}) {
  const [mesSel, setMesSel] = React.useState(() => new Date().toLocaleDateString("en-CA").slice(0, 7));
  const cambiarMes = delta => {
    const [y, m] = mesSel.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMesSel(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const nombreMes = (() => {
    const [y, m] = mesSel.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  })();
  const conDispenser = (clientes || []).filter(c => !c._retirado && (Number(c.dispenser) || 0) > 0 && c.dispenserProducto && Number(c.dispenserMinimoMensual) > 0);
  const filas = conDispenser.map(c => {
    const consumido = (ventas || []).filter(v => v.clienteId === c.id && v.fechaKey && v.fechaKey.slice(0, 7) === mesSel && !v._esCobro && !v._esAjuste && !v._esAjusteEnvases && !v._esCambio && !v._esMixtoTrans).reduce((a, v) => a + (v.detalle || []).filter(d => d.nombre === c.dispenserProducto).reduce((b, d) => b + (Number(d.cantidad) || 0), 0), 0);
    const minimo = Number(c.dispenserMinimoMensual) || 0;
    const faltante = Math.max(0, minimo - consumido);
    // el precio se toma siempre al momento del cálculo (si el producto aumentó, se cobra al precio actual)
    const producto = (productos || []).find(p => p.nombre === c.dispenserProducto);
    const precio = producto ? Number(producto.precio) || 0 : 0;
    const monto = faltante * precio;
    const yaCobrado = (ventas || []).some(v => v.clienteId === c.id && v._esAjusteDispenser && v._mesDispenser === mesSel);
    return { c, consumido, minimo, faltante, monto, precio, yaCobrado };
  });
  return /*#__PURE__*/React.createElement("div", {
    style: s.screen
  }, /*#__PURE__*/React.createElement("div", {
    style: s.header
  }, /*#__PURE__*/React.createElement("button", {
    style: s.backBtn,
    onClick: onVolver
  }, "← Volver"), /*#__PURE__*/React.createElement("div", {
    style: { flex: 1 }
  }, /*#__PURE__*/React.createElement("div", {
    style: s.headerTitle
  }, "🌡 Dispensers frío/calor"), /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 11, color: "var(--color-text-tertiary)" }
  }, conDispenser.length, " con mínimo pactado"))), /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "10px 14px" }
  }, /*#__PURE__*/React.createElement("button", {
    style: { ...s.btn, padding: "4px 10px" },
    onClick: () => cambiarMes(-1)
  }, "◀"), /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", textTransform: "capitalize" }
  }, nombreMes), /*#__PURE__*/React.createElement("button", {
    style: { ...s.btn, padding: "4px 10px" },
    onClick: () => cambiarMes(1)
  }, "▶")), filas.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: { padding: 40, textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14 }
  }, "Todavía no marcaste ningún cliente con dispenser + mínimo mensual. Entrá a la ficha del cliente (tiene que tener un dispenser prestado) y tocá \"🌡 Configurar mínimo\"."), filas.map(({ c, consumido, minimo, faltante, monto, precio, yaCobrado }) => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: { ...s.card, margin: "6px 14px" }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontWeight: 700, fontSize: 15, color: "var(--color-text-primary)", cursor: "pointer" },
    onClick: () => onSeleccionar(c)
  }, c.nombre), /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 13, color: "var(--color-text-secondary)", marginTop: 3 }
  }, "Consumió ", consumido, " / ", minimo, " · ", c.dispenserProducto), faltante > 0 ? /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 13, fontWeight: 600, color: "#E24B4A" }
  }, "Faltan ", faltante, " · $", monto.toLocaleString("es-AR")), yaCobrado ? /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 12, fontWeight: 600, color: "var(--color-text-success)" }
  }, "✓ Cobrado") : /*#__PURE__*/React.createElement("button", {
    style: { ...s.btnPrimary, fontSize: 12, padding: "7px 12px" },
    onClick: () => {
      if (!window.confirm(`¿Cobrarle a ${c.nombre} $${monto.toLocaleString("es-AR")} por faltarle ${faltante} ${c.dispenserProducto} este mes?`)) return;
      const saldoAntes = c.saldo || 0;
      const saldoNuevo = saldoAntes - monto;
      const vt = {
        id: Date.now(),
        clienteId: c.id,
        cliente: c.nombre,
        dia: c.dia,
        fechaKey: new Date().toLocaleDateString("en-CA"),
        fecha: new Date().toLocaleString("es-AR"),
        hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        detalle: [{ nombre: c.dispenserProducto, cantidad: faltante, precio, total: monto }],
        pago: "manual",
        obs: `Dispenser frío/calor — mes ${nombreMes}: consumió ${consumido}/${minimo}, faltan ${faltante} (a $${precio.toLocaleString("es-AR")} c/u)`,
        neto: 0,
        bruto: 0,
        desc: 0,
        costo: 0,
        ganancia: 0,
        pagadoNum: 0,
        saldoDelta: -monto,
        envPrest: [],
        envDev: [],
        saldoAntes,
        saldoDespues: saldoNuevo,
        _esAjuste: true,
        _esAjusteDispenser: true,
        _mesDispenser: mesSel
      };
      onCobrarFaltante(c.id, saldoNuevo, vt);
    }
  }, "Cobrar faltante")) : /*#__PURE__*/React.createElement("div", {
    style: { marginTop: 6, fontSize: 12.5, fontWeight: 600, color: "var(--color-text-success)" }
  }, "✓ Cumplió el mínimo"))));
}