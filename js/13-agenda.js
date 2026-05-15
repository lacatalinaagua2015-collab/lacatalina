// ════════════════════════════════════════════════════════════════════
// ◆  13-agenda.js — AgendaScreen, Recordatorios, Apariencia
// ════════════════════════════════════════════════════════════════════

function AgendaScreen({recordatorios,clientes,onConfirmar,onEliminar,onNuevo,onIrCliente,onVolver}) {
  const [mostrarNuevo,setMostrarNuevo] = React.useState(false);
  const [clienteBusq,setClienteBusq]  = React.useState("");
  const [clienteSel,setClienteSel]    = React.useState(null);
  const [filtro,setFiltro]            = React.useState("pendiente"); // pendiente | todos
  const hoy = new Date().toISOString().slice(0,10);

  const tipoIco  = {visita:"🏠",cobro:"💰"};
  const tipoCl   = {visita:"var(--color-text-info)",cobro:"var(--color-text-warning)"};
  const tipoBg   = {visita:"var(--color-background-info)",cobro:"var(--color-background-warning)"};

  const lista = [...(recordatorios||[])].sort((a,b)=>a.fecha.localeCompare(b.fecha));
  const pendientes = lista.filter(r=>!r.confirmado);
  const confirmados = lista.filter(r=>r.confirmado);
  const mostrar = filtro==="pendiente" ? pendientes : lista;

  const clientesFiltrados = clienteBusq
    ? clientes.filter(c=>c.nombre.toLowerCase().includes(clienteBusq.toLowerCase())).slice(0,5)
    : [];

  const hoyPend = pendientes.filter(r=>r.fecha===hoy).length;
  const vencidos = pendientes.filter(r=>r.fecha<hoy).length;

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <span style={s.headerTitle}>📅 Agenda</span>
        <button style={{...s.btn,padding:"6px 12px",fontSize:12,background:"#185FA5",color:"#e2eaf4",border:"none"}}
          onClick={()=>setMostrarNuevo(true)}>+ Nuevo</button>
      </div>

      {/* Métricas rápidas */}
      <div style={{display:"flex",gap:8,padding:"10px 14px 6px"}}>
        {vencidos>0&&(
          <div style={{...s.card,flex:1,margin:0,background:"var(--color-background-danger)",border:"0.5px solid var(--color-border-danger)",padding:"8px 12px",textAlign:"center"}}>
            <div style={{fontSize:10,color:"var(--color-text-danger)",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>Vencidos</div>
            <div style={{fontSize:22,fontWeight:700,color:"var(--color-text-danger)"}}>{vencidos}</div>
          </div>
        )}
        <div style={{...s.card,flex:1,margin:0,background:"var(--color-background-info)",border:"0.5px solid var(--color-border-info)",padding:"8px 12px",textAlign:"center"}}>
          <div style={{fontSize:10,color:"var(--color-text-info)",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>Hoy</div>
          <div style={{fontSize:22,fontWeight:700,color:"var(--color-text-info)"}}>{hoyPend}</div>
        </div>
        <div style={{...s.card,flex:1,margin:0,padding:"8px 12px",textAlign:"center"}}>
          <div style={{fontSize:10,color:"var(--color-text-secondary)",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>Pendientes</div>
          <div style={{fontSize:22,fontWeight:700,color:"var(--color-text-primary)"}}>{pendientes.length}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{display:"flex",gap:6,padding:"0 14px 8px"}}>
        {[["pendiente","⏳ Pendientes"],["todos","📋 Todos"]].map(([v,l])=>(
          <button key={v} style={{...s.btn,flex:1,fontSize:12,padding:"6px",
            background:filtro===v?"#185FA5":"var(--color-background-tertiary)",
            color:filtro===v?"#e2eaf4":"var(--color-text-secondary)",
            border:filtro===v?"none":"0.5px solid var(--color-border-secondary)"}}
            onClick={()=>setFiltro(v)}>{l}</button>
        ))}
      </div>

      {/* Lista */}
      {mostrar.length===0&&(
        <div style={{textAlign:"center",padding:"40px 20px",color:"var(--color-text-tertiary)"}}>
          <div style={{fontSize:36,marginBottom:10}}>📅</div>
          <div style={{fontSize:14}}>{filtro==="pendiente"?"No hay recordatorios pendientes":"Sin recordatorios"}</div>
          <div style={{fontSize:12,marginTop:6}}>Tocá "+ Nuevo" para agregar uno</div>
        </div>
      )}

      {mostrar.map(r=>{
        const c=clientes.find(x=>x.id===r.clienteId);
        const vencido=!r.confirmado&&r.fecha<hoy;
        const esHoy=r.fecha===hoy;
        const ico=tipoIco[r.tipo]||"🔔";
        const colTipo=tipoCl[r.tipo]||"var(--color-text-secondary)";
        const bgTipo=tipoBg[r.tipo]||"var(--color-background-tertiary)";
        return (
          <div key={r.id} style={{...s.card,
            borderLeft:`3px solid ${r.confirmado?"#1D9E75":vencido?"var(--color-text-danger)":esHoy?"var(--color-text-warning)":colTipo}`,
            opacity:r.confirmado?0.65:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
              <div style={{flex:1,minWidth:0}}>
                {/* Tipo + Fecha */}
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,
                    background:bgTipo,color:colTipo}}>{ico} {r.tipo==="cobro"?"Cobro":"Visita"}</span>
                  <span style={{fontSize:12,color:vencido?"var(--color-text-danger)":esHoy?"var(--color-text-warning)":"var(--color-text-tertiary)",fontWeight:vencido||esHoy?600:400}}>
                    {vencido?"⚠ ":esHoy?"📌 ":""}{r.fecha}{r.hora?` · ${r.hora}`:""}
                  </span>
                  {r.confirmado&&<span style={s.badge("success")}>✓ Listo</span>}
                </div>
                {/* Cliente */}
                <div style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)",marginBottom:2}}>
                  {c?.nombre||r.clienteNombre||"Cliente"}
                </div>
                {c&&<div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:4}}>{c.dia} · {c.barrio||""}</div>}
                {/* Motivo */}
                <div style={{fontSize:13,color:"var(--color-text-primary)",lineHeight:1.4}}>{r.motivo}</div>
              </div>
              {/* Acciones */}
              <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                {c?.telefono&&<a href={`https://wa.me/54${c.telefono}`} target="_blank" rel="noreferrer" style={{fontSize:20,textDecoration:"none"}}>💬</a>}
                {c?.maps&&<a href={c.maps} target="_blank" rel="noreferrer" style={{fontSize:20,textDecoration:"none"}}>📍</a>}
              </div>
            </div>
            <div style={{display:"flex",gap:6,marginTop:10,paddingTop:8,borderTop:"0.5px solid var(--color-border-tertiary)"}}>
              {!r.confirmado&&<button style={{...s.btn,flex:1,fontSize:12}} onClick={()=>{if(window.confirm("¿Eliminar este recordatorio?"))onEliminar(r.id);}}>🗑 Eliminar</button>}
              {!r.confirmado&&<button style={{flex:1,padding:"7px",borderRadius:8,border:"none",background:"#0a2e1f",color:"#4dd9a0",fontSize:12,fontWeight:500,cursor:"pointer"}}
                onClick={()=>onConfirmar(r.id)}>✓ Listo</button>}
              {onIrCliente&&r.clienteId&&<button style={{flex:2,padding:"7px",borderRadius:8,border:"none",background:"#185FA5",color:"#e2eaf4",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={()=>onIrCliente(r.clienteId)}>
                {r.tipo==="cobro"?"💰 Ir a cobrar":"🏠 Ver cliente →"}
              </button>}
            </div>
          </div>
        );
      })}

      {/* Modal nuevo recordatorio */}
      {mostrarNuevo&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"var(--color-background-secondary)",borderRadius:16,padding:20,width:"100%",maxWidth:400,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:16,fontWeight:500,color:"var(--color-text-primary)",marginBottom:12}}>🔔 Nuevo recordatorio</div>
            <NuevoRecordatorioForm
              clientes={clientes}
              onGuardar={(datos)=>{onNuevo(datos);setMostrarNuevo(false);}}
              onCerrar={()=>setMostrarNuevo(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NuevoRecordatorioForm({clientes,onGuardar,onCerrar}) {
  const hoy = new Date().toISOString().slice(0,10);
  const [tipo,setTipo]     = React.useState("visita");
  const [fecha,setFecha]   = React.useState(hoy);
  const [hora,setHora]     = React.useState("10:00");
  const [busq,setBusq]     = React.useState("");
  const [clienteId,setClienteId] = React.useState(null);
  const [motivo,setMotivo] = React.useState("");
  const tipoConfig = {visita:{ico:"🏠",label:"Visita",color:"#5daaff",bg:"#1e3a5f"},cobro:{ico:"💰",label:"Cobro",color:"#f5b942",bg:"#2e1f06"}};
  const clientesFilt = busq.length>1 ? clientes.filter(c=>c.nombre.toLowerCase().includes(busq.toLowerCase())).slice(0,6) : [];
  const clienteSel = clientes.find(c=>c.id===clienteId);
  return (
    <div>
      {/* Tipo */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {Object.entries(tipoConfig).map(([k,tc])=>(
          <button key={k} style={{flex:1,padding:"10px 8px",borderRadius:10,border:`2px solid ${tipo===k?tc.color:"var(--color-border-secondary)"}`,
            background:tipo===k?tc.bg:"transparent",color:tipo===k?tc.color:"var(--color-text-secondary)",
            fontSize:13,fontWeight:500,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}
            onClick={()=>setTipo(k)}>
            <span style={{fontSize:20}}>{tc.ico}</span>{tc.label}
          </button>
        ))}
      </div>
      {/* Fecha y hora */}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <div style={{flex:2}}><label style={s.label}>Fecha</label><input type="date" style={s.input} value={fecha} onChange={e=>setFecha(e.target.value)}/></div>
        <div style={{flex:1}}><label style={s.label}>Hora</label><input type="time" style={s.input} value={hora} onChange={e=>setHora(e.target.value)}/></div>
      </div>
      {/* Buscar cliente */}
      <div style={{marginBottom:10}}>
        <label style={s.label}>Cliente</label>
        {clienteSel ? (
          <div style={{...s.card,margin:0,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--color-background-info)"}}>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{clienteSel.nombre}</div>
              <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{clienteSel.dia} · {clienteSel.barrio||""}</div>
            </div>
            <button style={{...s.btn,fontSize:11,padding:"3px 8px"}} onClick={()=>{setClienteId(null);setBusq("");}}>✕</button>
          </div>
        ) : (
          <div>
            <input style={s.input} placeholder="Escribí el nombre del cliente..." value={busq} onChange={e=>setBusq(e.target.value)} />
            {clientesFilt.map(c=>(
              <div key={c.id} style={{...s.card,margin:"2px 0",padding:"8px 12px",cursor:"pointer",background:"var(--color-background-tertiary)"}}
                onClick={()=>{setClienteId(c.id);setBusq("");}}>
                <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{c.nombre}</div>
                <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{c.dia} · {c.barrio||""}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Detalle */}
      <div style={{marginBottom:14}}>
        <label style={s.label}>Detalle</label>
        <textarea style={{...s.input,minHeight:60,resize:"vertical"}}
          placeholder={tipo==="cobro"?"ej: Cobrar deuda $5.000...":"ej: Pasar a visitar, entregar pedido..."}
          value={motivo} onChange={e=>setMotivo(e.target.value)}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button style={{...s.btn,flex:1}} onClick={onCerrar}>Cancelar</button>
        <button style={{...s.btnPrimary,flex:2,opacity:(!clienteId||!motivo.trim())?0.5:1}}
          disabled={!clienteId||!motivo.trim()}
          onClick={()=>onGuardar({tipo,fecha,hora,motivo:motivo.trim(),clienteId})}>
          Guardar recordatorio
        </button>
      </div>
    </div>
  );
}


function ConfigAparienciaLC() {
  const [temaActual, setTemaActual] = React.useState(getTemaLC);
  const [modoVista, setModoVista] = React.useState(()=>TEMAS_LC[getTemaLC()]?.modo||"oscuro");
  const [guardado, setGuardado] = React.useState(false);
  const aplicar = (id) => {
    setTemaActual(id); aplicarTemaLC(id);
    localStorage.setItem("lc_tema", JSON.stringify(id));
    setGuardado(true); setTimeout(()=>setGuardado(false),2000);
  };
  const temasFiltrados = Object.entries(TEMAS_LC).filter(([,t])=>t.modo===modoVista);
  return (
    <div>
      <div style={{...s.card,marginBottom:12,background:"var(--color-background-secondary)"}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--color-text-primary)",marginBottom:10}}>🎨 Paleta de colores</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {[["oscuro","🌙 Oscuro"],["claro","☀️ Claro"]].map(([m,l])=>(
            <button key={m} style={{flex:1,padding:"7px 8px",fontSize:12,fontWeight:500,borderRadius:8,cursor:"pointer",
              background:modoVista===m?"var(--color-accent)":"var(--color-background-tertiary)",
              color:modoVista===m?"#fff":"var(--color-text-secondary)",
              border:`1px solid ${modoVista===m?"transparent":"var(--color-border-secondary)"}`}}
              onClick={()=>setModoVista(m)}>{l}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {temasFiltrados.map(([id,tema])=>(
            <button key={id} onClick={()=>aplicar(id)} style={{
              padding:"10px 8px",borderRadius:10,cursor:"pointer",textAlign:"center",
              border:`2px solid ${temaActual===id?"var(--color-accent)":"var(--color-border-secondary)"}`,
              background:temaActual===id?"var(--color-background-secondary)":"var(--color-background-tertiary)",
            }}>
              <div style={{fontSize:20,marginBottom:3}}>{tema.emoji}</div>
              <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-primary)",marginBottom:4}}>{tema.nombre}</div>
              <div style={{display:"flex",gap:3,justifyContent:"center"}}>
                {[tema.vars["--color-background-primary"],tema.vars["--color-accent"]||tema.vars["--color-text-info"],tema.vars["--color-text-success"],tema.vars["--color-text-warning"]].map((c,i)=>(
                  <div key={i} style={{width:12,height:12,borderRadius:"50%",background:c,border:"1px solid rgba(128,128,128,0.3)"}}/>
                ))}
              </div>
              {temaActual===id&&<div style={{fontSize:10,color:"var(--color-text-info)",marginTop:3}}>✓ Activo</div>}
            </button>
          ))}
        </div>
        {guardado&&<div style={{fontSize:12,color:"var(--color-text-success)",textAlign:"center",marginTop:8}}>✓ Estilo aplicado</div>}
      </div>
    </div>
  );
}
