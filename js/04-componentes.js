// ════════════════════════════════════════════════════════════════════
// ◆  04-componentes.js — componentes de UI COMPARTIDOS entre pantallas:
//    CambioEnvasePanel, FotoClienteModal, TipoRecordatorioSelector,
//    FechaHoraRow, PieEnvases, FormCliente, HeaderBotones, HeaderApp.
//    Usan funciones/estilos definidos en 03-utils.js (carga antes que este).
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
// ◆  CambioEnvasePanel — panel "🔄 Cambio de envase" UNIFICADO (venta,
//    detalle de cliente, gestión). Solo maneja la UI y el estado local
//    (producto que se retira, que se entrega, motivo) — quien lo usa decide
//    cómo registrar el cambio (onConfirmar) y qué hacer al cancelar (onCancelar).
//    Uso: {mostrar && <CambioEnvasePanel productos={productos}
//            onConfirmar={(viejo,nuevo,motivo)=>{...registrar...; cerrar();}}
//            onCancelar={cerrar} />}
// ════════════════════════════════════════════════════════════════════
function CambioEnvasePanel({
  productos,
  onConfirmar,
  onCancelar
}) {
  const [productoViejo, setProductoViejo] = React.useState("Bidón 20L");
  const [productoNuevo, setProductoNuevo] = React.useState("Bidón 20L");
  const [motivo, setMotivo] = React.useState("Agua en mal estado");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "0 0 10px",
      border: "1px solid #818cf8"
    }
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
    value: productoViejo,
    onChange: e => setProductoViejo(e.target.value)
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
    value: productoNuevo,
    onChange: e => setProductoNuevo(e.target.value)
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
    value: motivo,
    onChange: e => setMotivo(e.target.value)
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
    onClick: onCancelar
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      flex: 2,
      fontSize: 12,
      padding: "8px"
    },
    onClick: () => {
      onConfirmar(productoViejo, productoNuevo, motivo);
      setMotivo("Agua en mal estado");
    }
  }, "✓ Registrar cambio")));
}
// ════════════════════════════════════════════════════════════════════
// ◆  FotoClienteModal — visor/editor de foto de cliente a pantalla
//    completa UNIFICADO (📷 Cámara / 🖼 Galería / 🗑 Eliminar).
//    Uso: {abierto && <FotoClienteModal cliente={c} onCerrar={()=>setX(false)}
//            onGuardarFoto={b64 => ...guardar b64 en el cliente...} />}
// ════════════════════════════════════════════════════════════════════
function FotoClienteModal({
  cliente,
  onCerrar,
  onGuardarFoto
}) {
  if (!cliente) return null;
  const subir = async e => {
    const f = e.target.files[0];
    if (!f) return;
    const b64 = await comprimirFoto(f);
    onGuardarFoto(b64);
    onCerrar();
  };
  return /*#__PURE__*/React.createElement("div", {
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
    onClick: e => {
      e.stopPropagation();
      onCerrar();
    }
  }, cliente.foto ? /*#__PURE__*/React.createElement("img", {
    src: cliente.foto,
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
  }, "Sin foto · ", cliente.nombre), /*#__PURE__*/React.createElement("div", {
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
    onChange: subir
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
    onChange: subir
  })), cliente.foto && /*#__PURE__*/React.createElement("button", {
    style: {
      background: "#3a2020",
      color: "#e05c5c",
      padding: "10px 14px",
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      border: "none"
    },
    onClick: () => {
      onGuardarFoto("");
      onCerrar();
    }
  }, "🗑")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#aaa",
      fontSize: 11,
      marginTop: 14
    }
  }, "Tocá fuera para cerrar"));
}
const TIPO_RECORDATORIO_CONFIG = {
  visita: {
    ico: "🏠",
    label: "Visita",
    color: "#5daaff",
    bg: "#1e3a5f"
  },
  cobro: {
    ico: "💰",
    label: "Cobro",
    color: "#f5b942",
    bg: "#2e1f06"
  }
};
// ── Selector "Visita/Cobro" para recordatorios, UNIFICADO entre el modal de
//    venta (RecordatorioModal) y el formulario de la Agenda (NuevoRecordatorioForm).
function TipoRecordatorioSelector({
  tipo,
  onCambiarTipo
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12
    }
  }, Object.entries(TIPO_RECORDATORIO_CONFIG).map(([k, tc]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    style: {
      flex: 1,
      padding: "10px 8px",
      borderRadius: 10,
      border: `2px solid ${tipo === k ? tc.color : "var(--color-border-secondary)"}`,
      background: tipo === k ? tc.bg : "transparent",
      color: tipo === k ? tc.color : "var(--color-text-secondary)",
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 3
    },
    onClick: () => onCambiarTipo(k)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20
    }
  }, tc.ico), tc.label)));
}
// ── Fila Fecha/Hora para recordatorios, misma unificación.
function FechaHoraRow({
  fecha,
  hora,
  onCambiarFecha,
  onCambiarHora
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 2
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Fecha"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    style: s.input,
    value: fecha,
    onChange: e => onCambiarFecha(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Hora"), /*#__PURE__*/React.createElement("input", {
    type: "time",
    style: s.input,
    value: hora,
    onChange: e => onCambiarHora(e.target.value)
  })));
}
// ════════════════════════════════════════════════════════════════════
// ◆  PieEnvases — pie de tarjeta de cliente UNIFICADO (todas las listas)
//    Botón ♻️ Envases + botones propios de cada pantalla + panel con Confirmar.
//    Guarda en c.prestado (sifón/bidón10/bidón20) y c.envAjuste (dispenser, sin campo directo).
//    Uso: <PieEnvases c={c} ventas={ventas} onEditar={(id,cambios)=>...}
//           izquierda={<botón opcional/>}> {botones derecha opcionales} </PieEnvases>
// ════════════════════════════════════════════════════════════════════
function PieEnvases({
  c,
  ventas,
  onEditar,
  onPerdida,
  onPerdidaCliente,
  izquierda,
  children
}) {
  const KEYS = ["sifon", "bidon10", "bidon20", "dispenser"];
  const KP = {
    "Sifón 1.5L": "sifon",
    "Bidón 10L": "bidon10",
    "Bidón 20L": "bidon20",
    "Dispenser": "dispenser"
  };
  const [draft, setDraft] = React.useState(null); // null = panel cerrado
  const [mostrarPerdida, setMostrarPerdida] = React.useState(false);
  const [prodPerdida, setProdPerdida] = React.useState("sifon");
  const [cantPerdida, setCantPerdida] = React.useState("");
  const confirmarPerdidaCliente = () => {
    const cant = Math.round(Number(cantPerdida) || 0);
    if (cant <= 0) return;
    // OJO: acá NO se usa onEditar (ese asume que lo que baja del fijo del
    // cliente volvió al depósito, ver ajustarStockFijoCliente en 14-app.js).
    // Un envase roto/perdido nunca volvió a ningún lado — se da de baja
    // directo con onPerdidaCliente, que reduce el fijo del cliente sin
    // acreditarle nada a Casa.
    if (onPerdidaCliente) {
      onPerdidaCliente(c.id, prodPerdida, cant);
    } else {
      // Fallback por si algún lugar todavía no pasa el prop nuevo.
      const nuevoValor = Math.max(0, (Number(c[prodPerdida]) || 0) - cant);
      onEditar(c.id, {
        [prodPerdida]: nuevoValor
      });
      onPerdida && onPerdida({
        [prodPerdida]: cant
      }, "Roto/perdido en lo del cliente", c.nombre);
    }
    setMostrarPerdida(false);
    setCantPerdida("");
  };
  const abrir = () => {
    setDraft({
      fijos: Object.fromEntries(KEYS.map(k => [k, Number(c[k]) || 0])),
      prest: Object.fromEntries(KEYS.map(k => [k, prestadoClienteDe(c, k, ventas)]))
    });
  };
  const confirmar = () => {
    // Los 4 productos (incluido dispenser) se guardan directo en c.prestado
    // — es un campo estable que se mantiene solo, sumando/restando en cada
    // venta (ver aplicarMovimientoEnvases en 14-app.js). Antes dispenser
    // quedaba afuera de este modelo y la edición manual acá se guardaba en
    // envAjuste, un campo que prestadoClienteDe ya no lee una vez que
    // c.prestado.dispenser existe — la edición manual quedaba "perdida".
    onEditar(c.id, {
      ...Object.fromEntries(KEYS.map(k => [k, Math.max(0, draft.fijos[k])])),
      prestado: {
        ...(c.prestado || {}),
        ...Object.fromEntries(KEYS.map(k => [k, Math.max(0, draft.prest[k])]))
      }
    });
    setDraft(null);
  };
  const abierto = !!draft;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6,
      marginTop: 10,
      borderTop: "0.5px solid var(--color-border-tertiary)",
      paddingTop: 8
    }
  }, izquierda || null, /*#__PURE__*/React.createElement("button", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      padding: "5px 12px",
      borderRadius: 20,
      cursor: "pointer",
      background: abierto ? "var(--color-background-warning)" : "var(--color-background-tertiary)",
      color: abierto ? "var(--color-text-warning)" : "var(--color-text-secondary)",
      border: abierto ? "1px solid var(--color-border-warning)" : "0.5px solid var(--color-border-secondary)"
    },
    onClick: e => {
      e.stopPropagation();
      abierto ? setDraft(null) : abrir();
    }
  }, "♻️ Envases"), children), abierto && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      background: "var(--color-background-tertiary)",
      borderRadius: 8,
      padding: "8px 10px"
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "82px 1fr 1fr 1fr 1fr",
      gap: 4,
      fontSize: 10,
      color: "var(--color-text-tertiary)",
      marginBottom: 4
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
  }, "Disp")), [["fijos", "🏠 Fijos"], ["prest", "📦 Prestados"]].map(([t, l]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: "grid",
      gridTemplateColumns: "82px 1fr 1fr 1fr 1fr",
      gap: 4,
      alignItems: "center",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: t === "prest" ? "var(--color-text-warning)" : "var(--color-text-secondary)"
    }
  }, l), KEYS.map(k => /*#__PURE__*/React.createElement("input", {
    key: k,
    type: "number",
    value: draft[t][k],
    onChange: e => {
      const n = Math.round(Number(e.target.value) || 0);
      setDraft(d => ({
        ...d,
        [t]: {
          ...d[t],
          [k]: n
        }
      }));
    },
    style: {
      ...s.inputNum,
      padding: "6px 2px",
      fontSize: 14,
      textAlign: "center",
      fontWeight: t === "prest" && draft[t][k] !== 0 ? 600 : 400,
      color: t === "prest" ? draft[t][k] > 0 ? "var(--color-text-warning)" : draft[t][k] < 0 ? "var(--color-text-success)" : "var(--color-text-primary)" : "var(--color-text-primary)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--color-text-tertiary)",
      margin: "2px 0 6px"
    }
  }, "Prestados = total extra que tiene hoy · 0 = devolvió todo"), !mostrarPerdida ? /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      background: "none",
      border: "none",
      color: "var(--color-text-danger)",
      fontSize: 11,
      fontWeight: 500,
      cursor: "pointer",
      padding: "4px 0",
      textAlign: "left",
      marginBottom: 6
    },
    onClick: e => {
      e.stopPropagation();
      setMostrarPerdida(true);
    }
  }, "💔 Se le rompió/perdió un envase") : /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-background-secondary)",
      borderRadius: 7,
      padding: 8,
      marginBottom: 8
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-danger)",
      fontWeight: 500,
      marginBottom: 6
    }
  }, "💔 Registrar roto/perdido de ", c.nombre), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 60px",
      gap: 6,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: prodPerdida,
    onChange: e => setProdPerdida(e.target.value),
    style: {
      ...s.inputNum,
      padding: "6px 4px",
      fontSize: 12,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "sifon"
  }, "Sifón 1.5L"), /*#__PURE__*/React.createElement("option", {
    value: "bidon10"
  }, "Bidón 10L"), /*#__PURE__*/React.createElement("option", {
    value: "bidon20"
  }, "Bidón 20L"), /*#__PURE__*/React.createElement("option", {
    value: "dispenser"
  }, "Dispenser")), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 1,
    placeholder: "Cant.",
    value: cantPerdida,
    onChange: e => setCantPerdida(e.target.value),
    style: {
      ...s.inputNum,
      padding: "6px 4px",
      fontSize: 12,
      textAlign: "center"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      flex: 1,
      fontSize: 11,
      padding: "6px"
    },
    onClick: () => {
      setMostrarPerdida(false);
      setCantPerdida("");
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 2,
      background: "var(--color-background-danger)",
      color: "var(--color-text-danger)",
      border: "1px solid var(--color-border-danger)",
      borderRadius: 7,
      padding: "7px",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer"
    },
    onClick: confirmarPerdidaCliente
  }, "Confirmar pérdida")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--color-text-tertiary)",
      marginTop: 5
    }
  }, "Se descuenta directo de lo que este cliente tiene asignado, y queda anotado en Stock → Pérdidas.")), /*#__PURE__*/React.createElement("div", {
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
    onClick: e => {
      e.stopPropagation();
      setDraft(null);
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 2,
      background: "#1d9e75",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "9px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    },
    onClick: e => {
      e.stopPropagation();
      confirmar();
    }
  }, "✓ Confirmar"))));
}

// ════════════════════════════════════════════════════════════════════
// ◆  FormCliente — formulario de cliente UNIFICADO (crear y editar)
//    Usado en: Nuevo cliente, Editar desde el perfil, Editar en Gestión.
//    Los envases prestados NO van acá: se editan con ♻️ Envases (PieEnvases).
// ════════════════════════════════════════════════════════════════════
function FormCliente({
  inicial,
  onGuardar,
  onEliminarCliente,
  textoGuardar
}) {
  const [datos, setDatos] = React.useState({
    ...(inicial || {})
  });
  const set = (k, v) => setDatos(d => ({
    ...d,
    [k]: v
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: s.grid2
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Día de reparto"), /*#__PURE__*/React.createElement("select", {
    style: s.select,
    value: datos.dia || "Martes",
    onChange: e => set("dia", e.target.value)
  }, DIAS.map(d => /*#__PURE__*/React.createElement("option", {
    key: d,
    value: d
  }, d)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Número de orden"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    type: "number",
    min: 1,
    placeholder: "ej: 5",
    value: datos.orden || "",
    onChange: e => set("orden", Number(e.target.value) || "")
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Nombre y apellido *"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Nombre completo",
    value: datos.nombre || "",
    onChange: e => set("nombre", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: s.grid2
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Barrio"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Barrio",
    value: datos.barrio || "",
    onChange: e => set("barrio", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Sector"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Sector",
    value: datos.sector || "",
    onChange: e => set("sector", e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: s.grid3
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Manzana"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Mz",
    value: datos.manzana || "",
    onChange: e => set("manzana", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Lote"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Lote",
    value: datos.lote || "",
    onChange: e => set("lote", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Casa/Dpto"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Casa",
    value: datos.aclaracion || "",
    onChange: e => set("aclaracion", e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: s.grid2
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Calle"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Calle",
    value: datos.calle || "",
    onChange: e => set("calle", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Número"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "Nro",
    value: datos.nro || "",
    onChange: e => set("nro", e.target.value)
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Teléfono (sin 0 ni 15)"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "3816559000",
    value: datos.telefono || "",
    onChange: e => set("telefono", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Link Google Maps"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "https://maps.app.goo.gl/...",
    value: datos.maps || "",
    onChange: e => set("maps", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Link foto del domicilio (Google Drive, etc)"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "https://...",
    value: datos.foto || "",
    onChange: e => set("foto", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Notas rápidas (timbre roto, perro, cobrar deuda, etc.)"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    placeholder: "ej: timbre roto, cobrar $2000...",
    value: datos.notas || "",
    onChange: e => set("notas", e.target.value)
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      marginTop: 4
    }
  }, "Envases habituales asignados"), /*#__PURE__*/React.createElement("div", {
    style: s.grid3
  }, [["sifon", "Sifón"], ["bidon10", "Bidón 10L"], ["bidon20", "Bidón 20L"]].map(([k, l]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...s.label,
      textAlign: "center"
    }
  }, l), /*#__PURE__*/React.createElement("input", {
    style: {
      ...s.input,
      textAlign: "center"
    },
    type: "number",
    min: 0,
    value: datos[k] || 0,
    onChange: e => set(k, Number(e.target.value))
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "Dispenser en comodato"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      padding: "5px 14px",
      fontSize: 18,
      lineHeight: 1
    },
    onClick: () => set("dispenser", Math.max(0, (datos.dispenser || 0) - 1))
  }, "−"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 500,
      minWidth: 28,
      textAlign: "center",
      color: "var(--color-text-primary)"
    }
  }, datos.dispenser || 0), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btn,
      padding: "5px 14px",
      fontSize: 18,
      lineHeight: 1
    },
    onClick: () => set("dispenser", (datos.dispenser || 0) + 1)
  }, "+"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-text-secondary)"
    }
  }, "unidades"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--color-text-tertiary)"
    }
  }, "💡 Los envases prestados (extra) se ajustan con el botón ♻️ Envases."), /*#__PURE__*/React.createElement("div", {
    style: {
      ...s.card,
      margin: "4px 0",
      background: "var(--color-background-tertiary)",
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-text-secondary)",
      marginBottom: 8
    }
  }, "Saldo del cliente"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 6
    }
  }, [["favor", "A favor"], ["deuda", "Debe"], ["cero", "Sin saldo"]].map(([v, l]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    style: {
      flex: 1,
      fontSize: 11,
      padding: "6px 4px",
      borderRadius: 8,
      border: "0.5px solid var(--color-border-secondary)",
      cursor: "pointer",
      background: datos._tipoSaldo === v ? "#185FA5" : "var(--color-background-secondary)",
      color: datos._tipoSaldo === v ? "#e2eaf4" : "var(--color-text-secondary)"
    },
    onClick: () => set("_tipoSaldo", v)
  }, l))), datos._tipoSaldo && datos._tipoSaldo !== "cero" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, datos._tipoSaldo === "favor" ? "Monto a favor ($)" : "Monto que debe ($)"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    type: "number",
    min: 0,
    placeholder: "0",
    value: datos._montoSaldo || "",
    onChange: e => set("_montoSaldo", e.target.value)
  })), (datos.saldo || 0) !== 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: datos.saldo < 0 ? "var(--color-text-danger)" : "var(--color-text-success)",
      marginTop: 4
    }
  }, "Saldo actual: ", fmt(datos.saldo), " · ", datos.saldo < 0 ? "Debe" : "A favor"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: s.label
  }, "O ingresá el saldo directamente (−negativo = debe · +positivo = a favor)"), /*#__PURE__*/React.createElement("input", {
    style: s.input,
    type: "number",
    placeholder: "ej: -2500 o 1800",
    value: datos._saldoDirecto ?? "",
    onChange: e => set("_saldoDirecto", e.target.value)
  }))), datos.foto && /*#__PURE__*/React.createElement("img", {
    src: datos.foto,
    alt: "Domicilio",
    style: {
      width: "100%",
      borderRadius: 8,
      maxHeight: 160,
      objectFit: "cover"
    }
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnPrimary,
      marginTop: 4,
      opacity: !datos.nombre ? 0.45 : 1
    },
    disabled: !datos.nombre,
    onClick: () => {
      let saldo = datos.saldo || 0;
      if (datos._tipoSaldo === "favor") saldo = Math.abs(Number(datos._montoSaldo) || 0);
      if (datos._tipoSaldo === "deuda") saldo = -Math.abs(Number(datos._montoSaldo) || 0);
      if (datos._tipoSaldo === "cero") saldo = 0;
      if (datos._saldoDirecto !== undefined && datos._saldoDirecto !== "") saldo = Number(datos._saldoDirecto);
      onGuardar({
        ...datos,
        saldo
      });
    }
  }, textoGuardar || "Guardar cliente"), onEliminarCliente && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 12,
      borderTop: "0.5px solid var(--color-border-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.btnDanger,
      width: "100%",
      padding: "10px",
      fontSize: 13
    },
    onClick: () => {
      if (window.confirm(`¿Eliminar a ${datos.nombre}? Se borrarán también todas sus ventas.`)) onEliminarCliente();
    }
  }, "Eliminar cliente permanentemente")));
}

// ════════════════════════════════════════════════════════════════════
// ◆  HeaderBotones / HeaderApp — encabezado estándar: "Empresa · Pantalla"
//    + sol/M adentro del recuadro, conectado al selector de temas real
//    (antes usaba un interruptor aparte que no tenía nada que ver)
// ════════════════════════════════════════════════════════════════════
const SCALE_LABELS_LC = ["S", "M", "L", "XL"];
function _flipModoTemaLC(id) {
  if (id.startsWith("oscuro-")) return "claro-" + id.slice(7);
  if (id.startsWith("claro-")) return "oscuro-" + id.slice(6);
  return id;
}
function HeaderBotones() {
  const [temaId, setTemaIdLocal] = React.useState(getTemaLC);
  const [scaleIdx, setScaleIdxLocal] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cat_scale_v1") || "1");
    } catch {
      return 1;
    }
  });
  const modoActual = TEMAS_LC[temaId]?.modo || "oscuro";
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const nuevoId = _flipModoTemaLC(temaId);
      if (!TEMAS_LC[nuevoId]) return; // no debería pasar, pero por las dudas no rompe nada
      localStorage.setItem("lc_tema", JSON.stringify(nuevoId)); // guardar primero, siempre
      setTemaIdLocal(nuevoId);
      try {
        aplicarTemaLC(nuevoId);
      } catch (e) {
        console.warn("Error al cambiar de modo:", e);
      }
    },
    style: {
      padding: "6px 10px",
      borderRadius: 8,
      border: "none",
      background: "var(--color-background-tertiary)",
      color: "var(--color-text-secondary)",
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    },
    title: "Cambiar modo claro/oscuro"
  }, modoActual === "oscuro" ? "☀️" : "🌙"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const nv = (scaleIdx + 1) % 4;
      setScaleIdxLocal(nv);
      if (window._setScaleIdxLC) window._setScaleIdxLC(nv);
    },
    style: {
      padding: "6px 10px",
      borderRadius: 8,
      border: "none",
      background: "var(--color-background-tertiary)",
      color: "var(--color-text-secondary)",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    },
    title: "Tamaño de texto"
  }, SCALE_LABELS_LC[scaleIdx]));
}
function HeaderApp({
  titulo,
  onVolver
}) {
  const negocio = (() => {
    try {
      return JSON.parse(localStorage.getItem("lc_negocio_nombre") || '"La Catalina"');
    } catch {
      return "La Catalina";
    }
  })();
  return /*#__PURE__*/React.createElement("div", {
    style: s.header
  }, /*#__PURE__*/React.createElement("button", {
    style: s.backBtn,
    onClick: onVolver
  }, "← Volver"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...s.headerTitle,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      cursor: "pointer"
    },
    onClick: () => window._lcIrInicio && window._lcIrInicio(),
    title: "Ir al inicio"
  }, titulo ? `${negocio} · ${titulo}` : negocio), /*#__PURE__*/React.createElement(HeaderBotones, null));
}
