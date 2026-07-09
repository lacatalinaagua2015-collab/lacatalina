// ════════════════════════════════════════════════════════════════════
// ◆  07-clientes.js — ListaClientes, DetalleCliente (formulario: FormCliente unificado en 03-utils)
// ════════════════════════════════════════════════════════════════════

function ListaClientes({clientes,dia,fecha,ventas,todasVentas,noVisitas,prospectos,recordatorios,onSeleccionar,onEntregar,onNuevoCliente,onVolver,onReordenar,onEditarCliente,onRegistrarNoVisita,onQuitarNoVisita,onVentaProspecto,onNoEstaProspecto,onNoQuiereProspecto,onConfirmarTransfer,onVerProspecto,onEliminarProspecto,onAbrirMapa,onPlanilla}) {
  const [busqueda,setBusqueda] = useState("");
  const [editandoOrden,setEditandoOrden] = useState(null);
  const [ordenTemp,setOrdenTemp] = useState("");
  // ventas y noVisitas ya filtradas por fecha+dia desde App
  const atendidos = new Set(ventas.filter(v=>!v._esCobro&&!v._esAjuste).map(v=>v.clienteId));
  const noVMap = {}; (noVisitas||[]).filter(v=>v.fecha===fecha).forEach(v=>{noVMap[v.clienteId]=v.motivo;});
  // visitados = ventas + noesta2 + noquiso (noesta 1ra vez NO cuenta)
  const visitadosSinVenta = new Set(
    Object.entries(noVMap).filter(([,m])=>m==="noesta2"||m==="noquiso").map(([id])=>Number(id))
  );
  const visitados = new Set([...atendidos,...visitadosSinVenta]);
  const prospectosDelDia = (prospectos||[]).filter(p=>p.dia===dia&&p.estado==="activo");
  const noVMapProspectos = {};
  (noVisitas||[]).filter(v=>v.fecha===fecha).forEach(v=>{noVMapProspectos[v.clienteId]=v.motivo;});
  const ventasProspectos = new Set(
    ventas.filter(v=>prospectosDelDia.some(p=>p.id===v.clienteId)).map(v=>v.clienteId)
  );
  const visitadosProspectos = new Set([
    ...ventasProspectos,
    ...prospectosDelDia.filter(p=>noVMapProspectos[p.id]==="noquiso").map(p=>p.id)
  ]);

  const marcarNoVisita = (id,motivo) => {
    const prev = noVMap[id];
    if(motivo==="noesta"&&prev==="noesta") onRegistrarNoVisita(id,"noesta2");
    else if(prev===motivo) onQuitarNoVisita(id);
    else onRegistrarNoVisita(id,motivo);
  };

  const clientesReales = clientes.filter(c=>!c._esProspecto);
  const clientesOrdenados = [...clientesReales].sort((a,b)=>(a.orden||9999)-(b.orden||9999));
  const filtrados  = clientesOrdenados.filter(c=>buscarCliente(c,busqueda)>0);
  const pendientesNormales = filtrados.filter(c=>!visitados.has(c.id)&&noVMap[c.id]!=="noesta");
  const volverAlFinal      = filtrados.filter(c=>noVMap[c.id]==="noesta"&&!atendidos.has(c.id));
  const pendientes         = [...pendientesNormales, ...volverAlFinal];
  const sinEntrega         = filtrados.filter(c=>visitadosSinVenta.has(c.id));
  const listos             = filtrados.filter(c=>atendidos.has(c.id));

  const abrirRuta = ()=>{
    const cp=pendientes.filter(c=>c.maps).slice(0,9);
    if(!cp.length){alert("Ningún pendiente tiene Maps cargado.");return;}
    const dest=encodeURIComponent(cp[cp.length-1].maps);
    const wps=cp.slice(0,-1).map(c=>encodeURIComponent(c.maps)).join("|");
    window.open(`https://www.google.com/maps/dir/?api=1${wps?`&waypoints=${wps}`:""}&destination=${dest}&travelmode=driving`,"_blank");
  };

  // Saca coordenadas (lat,lng) de un link de Google Maps si las tiene adentro
  const extraerCoords = (url)=>{
    if(!url) return null; let m;
    m=url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);                 if(m) return {lat:+m[1],lng:+m[2]};
    m=url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);             if(m) return {lat:+m[1],lng:+m[2]};
    m=url.match(/[?&](?:q|ll|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/); if(m) return {lat:+m[1],lng:+m[2]};
    m=url.match(/(-?\d{1,2}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})/); if(m) return {lat:+m[1],lng:+m[2]};
    return null;
  };

  // Ruta óptima: ordena los pendientes por cercanía (vecino más cercano) y abre Google Maps
  const abrirRutaOptima = ()=>{
    const conMaps = pendientes.filter(c=>c.maps);
    const conCoords = conMaps.map(c=>({c, co:extraerCoords(c.maps)})).filter(x=>x.co);
    if(conCoords.length<2){
      alert("Para la ruta óptima necesito al menos 2 clientes pendientes cuyo link de Maps tenga las coordenadas adentro. Si tus links no las tienen, usá la ruta normal (🗺).");
      return;
    }
    const rest=[...conCoords];
    const orden=[rest.shift()];
    while(rest.length){
      const last=orden[orden.length-1].co;
      let bi=0,bd=Infinity;
      rest.forEach((x,i)=>{const d=(x.co.lat-last.lat)**2+(x.co.lng-last.lng)**2; if(d<bd){bd=d;bi=i;}});
      orden.push(rest.splice(bi,1)[0]);
    }
    const pts=orden.slice(0,10).map(x=>`${x.co.lat},${x.co.lng}`);
    const origin=pts[0], dest=pts[pts.length-1];
    const wps=pts.slice(1,-1).join("|");
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}${wps?`&waypoints=${encodeURIComponent(wps)}`:""}&destination=${dest}&travelmode=driving`,"_blank");
    const afuera=conMaps.length-conCoords.length;
    if(afuera>0) setTimeout(()=>alert(`Nota: ${afuera} cliente(s) quedaron afuera de la ruta óptima porque su link de Maps no trae coordenadas.`),400);
  };

  const guardarOrden=(c)=>{
    const n=parseInt(ordenTemp);
    if(!isNaN(n)&&n>0) onReordenar(clientes.map(x=>x.id===c.id?{...x,orden:n}:x));
    setEditandoOrden(null);setOrdenTemp("");
  };

  const Card=({c})=>{
    const [fotoOpen,setFotoOpen] = React.useState(false);
    const atendido=atendidos.has(c.id), est=noVMap[c.id];
    const bc=atendido?"#1D9E75":est==="noesta"?"#EF9F27":(est==="noesta2"||est==="noquiso")?"#E24B4A":"var(--color-border-tertiary)";
    // Envases extra que tiene el cliente (historial completo + ajuste manual envAjuste)
    const envExtra={sifon:0,bidon10:0,bidon20:0};
    (todasVentas||ventas).filter(v=>v.clienteId===c.id).forEach(v=>{
      (v.envPrest||[]).forEach(e=>{const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":null;if(k)envExtra[k]+=Number(e.cant)||0;});
      (v.envDev||[]).forEach(e=>{const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":null;if(k)envExtra[k]-=Number(e.cant)||0;});
    });
    const ajC=c.envAjuste||{};
    envExtra.sifon+=Number(ajC.sifon)||0; envExtra.bidon10+=Number(ajC.bidon10)||0; envExtra.bidon20+=Number(ajC.bidon20)||0;
    return (
      <>
      <div style={{...s.card,borderLeft:`3px solid ${bc}`,opacity:(visitados.has(c.id))?0.65:est==="noesta"?0.85:1}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
          <div style={{flexShrink:0,paddingTop:2}} onClick={()=>{if(!atendido){setEditandoOrden(c.id);setOrdenTemp(String(c.orden||""));}}}>
            {editandoOrden===c.id
              ? <input autoFocus type="number" min={1} value={ordenTemp}
                  onChange={e=>setOrdenTemp(e.target.value)}
                  onBlur={()=>guardarOrden(c)}
                  onKeyDown={e=>e.key==="Enter"&&guardarOrden(c)}
                  style={{width:40,textAlign:"center",padding:"3px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",fontSize:14}} />
              : <div style={{width:34,height:34,borderRadius:8,background:"var(--color-background-secondary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"var(--color-text-secondary)",cursor:"pointer",border:"0.5px solid var(--color-border-tertiary)"}}>
                  {c.orden||"#"}
                </div>
            }
          </div>
          <div style={{flex:1,cursor:"pointer",minWidth:0}} onClick={()=>onSeleccionar(c)}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{fontWeight:500,fontSize:15,color:"var(--color-text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
                {c.nombre}
                {c.foto&&<span style={{fontSize:10,color:"#4dd9a0",flexShrink:0,marginLeft:3}}>📷</span>}
              </div>
              {(recordatorios||[]).some(r=>r.clienteId===c.id&&!r.confirmado)&&(
                <span style={{fontSize:13,flexShrink:0}} title="Recordatorio pendiente">🔔</span>
              )}
              {(()=>{const vt=ventas.find(v=>v.clienteId===c.id&&v.fechaKey===fecha&&v.pago==="transferencia");
                if(!vt) return null;
                return (
                  <button style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",lineHeight:1,flexShrink:0,display:"flex",alignItems:"center",gap:3,borderRadius:6,background:vt.transConfirmada?"transparent":"rgba(245,185,66,0.15)"}}
                    onClick={e=>{e.stopPropagation();onConfirmarTransfer&&onConfirmarTransfer(c.id,vt.id);}}
                    title={vt.transConfirmada?"Transfer. confirmada — tocá para desmarcar":"Tocá para confirmar transferencia"}>
                    <span style={{fontSize:15}}>{vt.transConfirmada?"🟢":"🔴"}</span>
                    {!vt.transConfirmada&&<span style={{fontSize:11,fontWeight:500,color:"#f5b942"}}>{fmt(vt.pagadoNum||vt.neto||0)}</span>}
                  </button>
                );
              })()}
            </div>
            <div style={{fontSize:17,color:"var(--color-text-secondary)",marginTop:2}}>
              {c.calle?`${c.calle} ${c.nro||""}`:c.manzana?`Mz ${c.manzana} L ${c.lote}`:""}{c.barrio?` · ${c.barrio}`:""}
            </div>
            {c.notas&&<div style={{fontSize:12,color:"var(--color-text-warning)",marginTop:2}}>📝 {c.notas}</div>}
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:5}}>
              {c.sifon>0    && <span style={s.tag}>Sifón×{c.sifon}</span>}
              {c.bidon10>0  && <span style={s.tag}>10L×{c.bidon10}</span>}
              {c.bidon20>0  && <span style={s.tag}>20L×{c.bidon20}</span>}
              {c.dispenser>0 && <span style={{...s.tag,color:"#5daaff"}}>Disp×{c.dispenser}</span>}
              {atendido    && <span style={s.badge("success")}>✓ Listo</span>}
              {est==="noesta" && !atendido  && <span style={s.badge("warning")}>🔄 No estaba aún</span>}
              {est==="noesta2"  && <span style={s.badge("warning")}>No estaba</span>}
              {est==="noquiso"  && <span style={s.badge("danger")}>No quiso</span>}
              {c.saldo<0   && <span style={s.badge("danger")}>Debe {fmt(Math.abs(c.saldo))}</span>}
              {c.saldo>0   && <span style={s.badge("success")}>A favor {fmt(c.saldo)}</span>}
              {(envExtra.sifon!==0||envExtra.bidon10!==0||envExtra.bidon20!==0) && (
                <span style={{...s.tag,color:"#f5b942",fontWeight:600}}>
                  🔁{envExtra.sifon!==0?` Sif×${envExtra.sifon}`:""}
                     {envExtra.bidon10!==0?` 10L×${envExtra.bidon10}`:""}
                     {envExtra.bidon20!==0?` 20L×${envExtra.bidon20}`:""}
                </span>
              )}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0,alignItems:"center"}}>
            {(c.maps||(c.lat&&c.lng))     && <a href={c.maps||`https://www.google.com/maps?q=${c.lat},${c.lng}`} target="_blank" rel="noreferrer" style={{fontSize:17,textDecoration:"none",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:9,background:"var(--color-background-tertiary)",border:"0.5px solid var(--color-border-secondary)"}}>📍</a>}
            {c.telefono && <a href={`https://wa.me/54${c.telefono}`} target="_blank" rel="noreferrer" style={{fontSize:17,textDecoration:"none",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:9,background:"var(--color-background-tertiary)",border:"0.5px solid var(--color-border-secondary)"}}>💬</a>}
            <span style={{fontSize:17,cursor:"pointer",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:9,background:"var(--color-background-tertiary)",border:"0.5px solid var(--color-border-secondary)"}} title="Foto domicilio" onClick={e=>{e.stopPropagation();setFotoOpen(true);}}>📷</span>
          </div>
        </div>
        {(!visitados.has(c.id)||est==="noesta")&&!atendido&&(
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button style={{background:"var(--color-background-warning)",color:"var(--color-text-warning)",border:"1px solid var(--color-border-warning)",borderRadius:10,padding:"10px 0",fontSize:13,cursor:"pointer",fontWeight:500,flex:1}}
              onClick={()=>marcarNoVisita(c.id,est==="noesta"?"noesta2":"noesta")}>
              {est==="noesta"?"2ª vez":"🔄 No está"}
            </button>
            <button style={{background:"var(--color-background-danger)",color:"var(--color-text-danger)",border:"1px solid var(--color-border-danger)",borderRadius:10,padding:"10px 0",fontSize:13,cursor:"pointer",fontWeight:500,flex:1}}
              onClick={()=>marcarNoVisita(c.id,"noquiso")}>No quiere</button>
            <button style={{background:"#185FA5",color:"#e2eaf4",border:"none",borderRadius:10,padding:"10px 0",fontSize:14,cursor:"pointer",fontWeight:600,flex:2}}
              onClick={()=>(onEntregar||onSeleccionar)(c)}>Entregar →</button>
          </div>
        )}
        {(est==="noesta2"||est==="noquiso")&&!atendido&&(
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:6}}>
            <button style={{...s.btn,fontSize:12,padding:"4px 10px"}} onClick={()=>onQuitarNoVisita(c.id)}>Desmarcar</button>
          </div>
        )}
        {onEditarCliente&&<PieEnvases c={c} ventas={todasVentas||ventas} onEditar={onEditarCliente} />}
      </div>
      {fotoOpen&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:2000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{e.stopPropagation();setFotoOpen(false);}}>
          {c.foto
            ? <img src={c.foto} alt="Domicilio" style={{maxWidth:"100%",maxHeight:"60vh",borderRadius:10,objectFit:"contain",marginBottom:16}} />
            : <div style={{color:"#aaa",fontSize:14,marginBottom:20}}>Sin foto · {c.nombre}</div>
          }
          <div style={{display:"flex",gap:12}} onClick={e=>e.stopPropagation()}>
            <label style={{background:"#185FA5",color:"#e2eaf4",padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"center"}}>
              📷 Cámara
              <input type="file" accept="image/*" capture="environment" style={{display:"none"}}
                onChange={async e=>{const f=e.target.files[0];if(!f)return;const b64=await comprimirFoto(f);onReordenar(clientes.map(x=>x.id===c.id?{...x,foto:b64}:x));setFotoOpen(false);}} />
            </label>
            <label style={{background:"#2a3a4a",color:"#e2eaf4",padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"center"}}>
              🖼 Galería
              <input type="file" accept="image/*" style={{display:"none"}}
                onChange={async e=>{const f=e.target.files[0];if(!f)return;const b64=await comprimirFoto(f);onReordenar(clientes.map(x=>x.id===c.id?{...x,foto:b64}:x));setFotoOpen(false);}} />
            </label>
            {c.foto&&<button style={{background:"#3a2020",color:"#e05c5c",padding:"10px 14px",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",border:"none"}} onClick={()=>{onReordenar(clientes.map(x=>x.id===c.id?{...x,foto:""}:x));setFotoOpen(false);}}>🗑</button>}
          </div>
          <span style={{color:"#aaa",fontSize:11,marginTop:14}}>Tocá fuera para cerrar</span>
        </div>
      )}
      </>
    );
  };

  return (
    <div style={s.screen}>
      <HeaderApp titulo={`Clientes · ${dia}`} onVolver={onVolver}/>
      <div style={{padding:"10px 16px 6px"}}>
        <input style={s.input} placeholder="Buscar por domicilio o nombre..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={s.badge("success")}>{clientesReales.filter(c=>visitados.has(c.id)).length}/{clientesReales.length} visitados</span>
          {volverAlFinal.length>0&&<span style={s.badge("warning")}>{volverAlFinal.length} volver al final</span>}
          {sinEntrega.length>0&&<span style={s.badge("danger")}>{sinEntrega.length} sin entrega</span>}
          <button style={{...s.btn,fontSize:11,padding:"3px 10px",marginLeft:"auto",background:"#185FA5",color:"#e2eaf4",border:"none"}} onClick={onNuevoCliente}>+ Nuevo</button>
          <button style={{...s.btn,fontSize:11,padding:"3px 10px"}} onClick={abrirRutaOptima}>🧭 Ruta óptima</button>
          <button style={{...s.btn,fontSize:11,padding:"3px 10px"}} onClick={onAbrirMapa}>🗺 Mapa</button>
        </div>
        <p style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:6}}>Tocá el # para editar el número de orden del cliente</p>
      </div>
      {filtrados.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"var(--color-text-tertiary)",fontSize:14}}>No hay clientes para {dia}.</div>}
      {pendientesNormales.length>0&&<><span style={s.sectionTitle}>Pendientes ({pendientesNormales.length})</span>{pendientesNormales.map(c=><Card key={c.id} c={c}/>)}</>}
      {volverAlFinal.length>0&&<><span style={{...s.sectionTitle,color:"#f5b942"}}>🔄 Volver a visitar ({volverAlFinal.length})</span>{volverAlFinal.map(c=><Card key={c.id} c={c}/>)}</>}
      {listos.length>0&&<><span style={s.sectionTitle}>Entregado ({listos.length})</span>{listos.map(c=><Card key={c.id} c={c}/>)}</>}
      {sinEntrega.length>0&&<><span style={s.sectionTitle}>Sin entrega ({sinEntrega.length})</span>{sinEntrega.map(c=><Card key={c.id} c={c}/>)}</>}

      {/* Botón verde: aparece solo cuando TODOS los clientes están registrados → lleva a la planilla del día */}
      {onPlanilla && clientesReales.length>0 && clientesReales.filter(c=>visitados.has(c.id)).length>=clientesReales.length && (
        <div style={{padding:"18px 16px 8px"}}>
          <button
            style={{
              width:"100%", background:"#0a5c3a", color:"#e2eaf4",
              border:"1.5px solid #4dd9a0", borderRadius:12, padding:"15px 20px",
              fontSize:15, fontWeight:600, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8
            }}
            onClick={onPlanilla}>
            ✅ Todos registrados · Ir a la planilla del día →
          </button>
        </div>
      )}
    </div>
  );
}

function DetalleCliente({cliente,ventas,noVisitas,dia,fecha,productos,onVenta,onVolver,onEditar,onEliminarVenta,onEditarVenta,onEliminarCliente,onNoEstaCliente,onNoQuiereCliente,recordatorios,onGuardarRecordatorio,onConfirmarRecordatorio,onCobrarSaldo,onGuardarAjuste,onGuardarCambio}) {
  const [editandoCliente,setEditandoCliente] = useState(false);
  const [editandoVentaId,setEditandoVentaId] = useState(null);
  const [editandoSaldo,setEditandoSaldo] = useState(false);
  const [tipoSaldoEdit,setTipoSaldoEdit] = useState("");
  const [montoSaldoEdit,setMontoSaldoEdit] = useState("");
  const [mostrarRecordatorio,setMostrarRecordatorio] = useState(false);
  const [mostrarPagoSaldo,setMostrarPagoSaldo] = useState(false);
  const [mostrarFotoGrande,setMostrarFotoGrande] = useState(false);
  const [razonAjuste,setRazonAjuste] = useState("");
  const [mostrarCambio,setMostrarCambio] = useState(false);
  const [productoViejoCambio,setProductoViejoCambio] = useState("Bidón 20L");
  const [productoNuevoCambio,setProductoNuevoCambio] = useState("Bidón 20L");
  const [motivoCambio,setMotivoCambio] = useState("Agua en mal estado");
  const recActivos = (recordatorios||[]).filter(r=>r.clienteId===cliente.id&&!r.confirmado);
  // Las partes-transferencia de pagos mixtos NO son ventas: no se listan ni se cuentan acá
  // (la venta principal ya muestra el desglose [Mixto: ef + tr]; la transferencia se confirma en el panel del día)
  const ventasSinMixtoTr = ventas.filter(v=>!v._esMixtoTrans);
  const historial = [...ventasSinMixtoTr].sort((a,b)=>(b.fechaKey||"").localeCompare(a.fechaKey||"")||(b.id||0)-(a.id||0));
  const ventaHoy  = fecha ? ventasSinMixtoTr.find(v=>v.fechaKey===fecha&&!v._esCobro&&!v._esAjuste&&!v._esCambio) : null;
  const initials  = cliente.nombre.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase();
  const totalComprado = ventasSinMixtoTr.reduce((a,v)=>a+(v.neto||0),0);
  const promedioVenta = ventasSinMixtoTr.length>0 ? Math.round(totalComprado/ventasSinMixtoTr.length) : 0;
  const ventasUltimos30 = ventasSinMixtoTr.filter(v=>{
    const fk=v.fechaKey||""; if(!fk) return false;
    const d=new Date(fk); const hoy=new Date();
    return (hoy-d)/86400000<=30;
  }).length;

  return (
    <div style={s.screen}>
      <HeaderApp titulo={`Clientes · ${cliente.dia||""}`} onVolver={onVolver}/>
      <div style={{background:"var(--color-background-secondary)",borderRadius:10,margin:"8px 14px 0",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
        <span style={{fontSize:15,fontWeight:600,color:"var(--color-text-primary)"}}>{cliente.nombre}</span>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button style={{...s.btn,padding:"4px 8px",fontSize:18,lineHeight:1,position:"relative"}}
            onClick={()=>setMostrarRecordatorio(true)}>
            🔔
            {recActivos.length>0&&<span style={{position:"absolute",top:-3,right:-3,background:"#f5b942",color:"#0f1923",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{recActivos.length}</span>}
          </button>
          <button style={{...s.btn,fontSize:12,padding:"5px 10px"}} onClick={()=>{setEditandoCliente(!editandoCliente);setEditandoVentaId(null);}}>
            {editandoCliente?"Cancelar":"Editar"}
          </button>
        </div>
      </div>
      {mostrarPagoSaldo&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <PagoSaldoPanel
            saldo={cliente.saldo}
            onCobrar={(monto,pago)=>{
              onCobrarSaldo&&onCobrarSaldo(monto,pago);
              setMostrarPagoSaldo(false);
            }}
            onCerrar={()=>setMostrarPagoSaldo(false)}
          />
        </div>
      )}
      {mostrarRecordatorio&&(
        <RecordatorioModal
          cliente={cliente}
          onGuardar={(datos)=>{
            onGuardarRecordatorio&&onGuardarRecordatorio({...datos,clienteId:cliente.id,clienteNombre:cliente.nombre,dia:cliente.dia,id:Date.now(),confirmado:false});
            setMostrarRecordatorio(false);
          }}
          onCerrar={()=>setMostrarRecordatorio(false)}
        />
      )}

      {mostrarFotoGrande&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:2000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setMostrarFotoGrande(false)}>
          {cliente.foto
            ? <img src={cliente.foto} alt="Domicilio" style={{maxWidth:"100%",maxHeight:"60vh",borderRadius:10,objectFit:"contain",marginBottom:16}} />
            : <div style={{color:"#aaa",fontSize:14,marginBottom:20}}>Sin foto aún · {cliente.nombre}</div>
          }
          <div style={{display:"flex",gap:12}} onClick={e=>e.stopPropagation()}>
            <label style={{background:"#185FA5",color:"#e2eaf4",padding:"12px 20px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"center"}}>
              📷 Cámara
              <input type="file" accept="image/*" capture="environment" style={{display:"none"}}
                onChange={async e=>{const f=e.target.files[0];if(!f)return;const b64=await comprimirFoto(f);onEditar({foto:b64});setMostrarFotoGrande(false);}} />
            </label>
            <label style={{background:"#2a3a4a",color:"#e2eaf4",padding:"12px 20px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"center"}}>
              🖼 Galería
              <input type="file" accept="image/*" style={{display:"none"}}
                onChange={async e=>{const f=e.target.files[0];if(!f)return;const b64=await comprimirFoto(f);onEditar({foto:b64});setMostrarFotoGrande(false);}} />
            </label>
            {cliente.foto&&<button style={{background:"#3a2020",color:"#e05c5c",padding:"12px 14px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",border:"none"}} onClick={()=>{onEditar({foto:""});setMostrarFotoGrande(false);}}>🗑</button>}
          </div>
          <span style={{color:"#aaa",fontSize:11,marginTop:14}}>Tocá fuera para cerrar</span>
        </div>
      )}
      <div style={{padding:16}}>
        {recActivos.length>0&&!editandoCliente&&(
          <div style={{marginBottom:10}}>
            {recActivos.map(r=>(
              <div key={r.id} style={{...s.card,margin:"0 0 6px",background:"#2e1f06",border:"1px solid #f5b942",display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:18,flexShrink:0}}>🔔</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#f5b942"}}>{r.fecha} {r.hora&&`· ${r.hora}`}</div>
                  <div style={{fontSize:13,color:"var(--color-text-primary)",marginTop:2}}>{r.motivo}</div>
                </div>
                <button style={{background:"#4dd9a0",color:"#0a2e1f",border:"none",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}
                  onClick={()=>onConfirmarRecordatorio&&onConfirmarRecordatorio(r.id)}>
                  ✓ Listo
                </button>
              </div>
            ))}
          </div>
        )}
        {!editandoCliente && <>
          {/* Header cliente */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            {cliente.foto
              ? <img src={cliente.foto} alt="" onClick={()=>setMostrarFotoGrande(true)} title="Ver foto grande" style={{width:52,height:52,borderRadius:10,objectFit:"cover",flexShrink:0,border:"0.5px solid var(--color-border-tertiary)",cursor:"zoom-in"}} />
              : <div style={{width:52,height:52,borderRadius:10,background:"var(--color-background-info)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:500,fontSize:18,color:"var(--color-text-info)",flexShrink:0}}>{initials}</div>
            }
            <div style={{flex:1}}>
              <div style={{fontWeight:500,fontSize:16,color:"var(--color-text-primary)"}}>{cliente.nombre}</div>
              <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>
                {cliente.calle?`${cliente.calle} ${cliente.nro||""} · `:cliente.manzana?`Mz ${cliente.manzana} L ${cliente.lote} · `:""}
                {cliente.barrio} · {cliente.dia}
              </div>
              {cliente.notas&&<div style={{fontSize:12,color:"var(--color-text-warning)",marginTop:3}}>📝 {cliente.notas}</div>}
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              {(cliente.maps||(cliente.lat&&cliente.lng))     && <a href={cliente.maps||`https://www.google.com/maps?q=${cliente.lat},${cliente.lng}`} target="_blank" rel="noreferrer" style={{fontSize:26,textDecoration:"none"}}>📍</a>}
              {cliente.telefono && <a href={`https://wa.me/54${cliente.telefono}`} target="_blank" rel="noreferrer" style={{fontSize:26,textDecoration:"none"}}>💬</a>}

            </div>
          </div>

          {/* Foto domicilio si existe - clickable */}
          {cliente.foto&&!editandoCliente&&(
            <div style={{marginBottom:10,cursor:"zoom-in",borderRadius:10,overflow:"hidden",maxHeight:140,position:"relative"}} onClick={()=>setMostrarFotoGrande(true)}>
              <img src={cliente.foto} alt="Domicilio" style={{width:"100%",maxHeight:140,objectFit:"cover",display:"block"}} />
              <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.5))",padding:"6px 10px",fontSize:11,color:"#fff"}}>
                📷 Domicilio · tocá para ampliar
              </div>
            </div>
          )}

          {/* Métricas */}
          <div style={{...s.grid2,marginBottom:12}}>
            <div style={s.metricCard}>
              <div style={s.metricLabel}>Saldo</div>
              <div style={{...s.metricVal,color:cliente.saldo<0?"var(--color-text-danger)":cliente.saldo>0?"var(--color-text-success)":"var(--color-text-primary)"}}>{fmt(cliente.saldo)}</div>
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>{cliente.saldo<0?"Debe":cliente.saldo>0?"A su favor":"Al día"}</div>
            </div>
            <div style={s.metricCard}>
              <div style={s.metricLabel}>Total histórico</div>
              <div style={s.metricVal}>{fmt(totalComprado)}</div>
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>{ventasSinMixtoTr.length} compras</div>
            </div>
          </div>

          {/* Saldo */}
          <div style={{...s.card,margin:"0 0 10px",borderLeft:cliente.saldo<0?"3px solid var(--color-text-danger)":cliente.saldo>0?"3px solid #4dd9a0":"0.5px solid var(--color-border-tertiary)"}}>
            {!editandoSaldo?(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{cliente.saldo<0?"Saldo pendiente":cliente.saldo>0?"Saldo a favor":"Sin saldo"}</div>
                  <div style={{fontSize:20,fontWeight:500,color:cliente.saldo<0?"var(--color-text-danger)":cliente.saldo>0?"#4dd9a0":"var(--color-text-tertiary)"}}>{fmt(Math.abs(cliente.saldo))}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {cliente.saldo<0&&(
                    <button style={{background:"#185FA5",color:"#e2eaf4",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:500,cursor:"pointer"}}
                      onClick={()=>setMostrarPagoSaldo(true)}>
                      💰 Cobrar
                    </button>
                  )}
                  <button style={{...s.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>setEditandoSaldo(true)}>Ajustar</button>
                  <button style={{...s.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>setMostrarCambio(true)}>🔄 Cambio</button>
                </div>
              </div>
            ):(
              <div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8,fontWeight:500}}>Ajustar saldo</div>
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  {[["favor","A favor"],["deuda","Debe"],["cero","En cero"]].map(([v,l])=>(
                    <button key={v} style={{flex:1,fontSize:11,padding:"6px 4px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",cursor:"pointer",
                      background:tipoSaldoEdit===v?"#185FA5":"var(--color-background-secondary)",
                      color:tipoSaldoEdit===v?"#e2eaf4":"var(--color-text-secondary)"}}
                      onClick={()=>setTipoSaldoEdit(v)}>{l}</button>
                  ))}
                </div>
                {tipoSaldoEdit&&tipoSaldoEdit!=="cero"&&(
                  <input style={{...s.input,marginBottom:8}} type="number" min={0} placeholder="Monto ($)"
                    value={montoSaldoEdit} onChange={e=>setMontoSaldoEdit(e.target.value)} />
                )}
                <div style={{marginBottom:8}}>
                  <label style={{...s.label,marginBottom:4}}>Razón del ajuste (obligatorio)</label>
                  <input style={s.input} placeholder="Ej: Error de carga, condonación, inicio" value={razonAjuste} onChange={e=>setRazonAjuste(e.target.value)}/>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button style={{...s.btn,flex:1,fontSize:12}} onClick={()=>{setEditandoSaldo(false);setTipoSaldoEdit("");setMontoSaldoEdit("");setRazonAjuste("");}}>Cancelar</button>
                  <button style={{...s.btnPrimary,flex:2,fontSize:12,padding:"8px"}} onClick={()=>{
                    if(!razonAjuste.trim()){alert("Ingresá la razón del ajuste");return;}
                    const saldoAntes=cliente.saldo||0;
                    let saldoNuevo=saldoAntes;
                    if(tipoSaldoEdit==="favor") saldoNuevo=Math.abs(Number(montoSaldoEdit)||0);
                    if(tipoSaldoEdit==="deuda") saldoNuevo=-Math.abs(Number(montoSaldoEdit)||0);
                    if(tipoSaldoEdit==="cero")  saldoNuevo=0;
                    onEditar({saldo:saldoNuevo});
                    // Guardar registro del ajuste
                    const vt={id:Date.now(),clienteId:cliente.id,cliente:cliente.nombre,
                      dia:dia,fechaKey:fecha,fecha:new Date().toLocaleString("es-AR"),
                      detalle:[{nombre:"Ajuste de saldo",cantidad:1,precio:0,total:0}],
                      pago:"manual",obs:`Ajuste: ${razonAjuste} · ${tipoSaldoEdit==="favor"?"A favor":tipoSaldoEdit==="deuda"?"Deuda":"En cero"}${tipoSaldoEdit!=="cero"?` $${(Number(montoSaldoEdit)||0).toLocaleString("es-AR")}` :""}`,
                      neto:0,bruto:0,desc:0,costo:0,ganancia:0,pagadoNum:0,saldoDelta:saldoNuevo-saldoAntes,
                      envPrest:[],envDev:[],saldoAntes,saldoDespues:saldoNuevo,_esAjuste:true};
                    onGuardarAjuste&&onGuardarAjuste(vt);
                    setEditandoSaldo(false);setTipoSaldoEdit("");setMontoSaldoEdit("");setRazonAjuste("");
                  }}>Guardar saldo</button>
                </div>
              </div>
            )}
          </div>

          {/* Cambio de envase (ej: problema con el agua) — no cobra, solo registra */}
          {mostrarCambio&&(
            <div style={{...s.card,margin:"0 0 10px",border:"1px solid #818cf8"}}>
              <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8,fontWeight:500}}>🔄 Cambio de envase (no se cobra)</div>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <div style={{flex:1}}>
                  <label style={{...s.label,marginBottom:4}}>Se retira</label>
                  <select style={s.select} value={productoViejoCambio} onChange={e=>setProductoViejoCambio(e.target.value)}>
                    {(productos||[]).map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{...s.label,marginBottom:4}}>Se entrega</label>
                  <select style={s.select} value={productoNuevoCambio} onChange={e=>setProductoNuevoCambio(e.target.value)}>
                    {(productos||[]).map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:8}}>
                <label style={{...s.label,marginBottom:4}}>Motivo</label>
                <input style={s.input} placeholder="Ej: Agua en mal estado" value={motivoCambio} onChange={e=>setMotivoCambio(e.target.value)}/>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button style={{...s.btn,flex:1,fontSize:12}} onClick={()=>setMostrarCambio(false)}>Cancelar</button>
                <button style={{...s.btnPrimary,flex:2,fontSize:12,padding:"8px"}} onClick={()=>{
                  const vt={id:Date.now(),clienteId:cliente.id,cliente:cliente.nombre,
                    dia:dia,fechaKey:fecha,fecha:new Date().toLocaleString("es-AR"),
                    detalle:[{nombre:"Cambio de envase",cantidad:1,precio:0,total:0}],
                    pago:"cambio",obs:`Cambio: ${productoViejoCambio} → ${productoNuevoCambio}${motivoCambio.trim()?` · ${motivoCambio.trim()}`:""}`,
                    neto:0,bruto:0,desc:0,costo:0,ganancia:0,pagadoNum:0,saldoDelta:0,
                    envDev:[{prod:productoViejoCambio,cant:1}],envPrest:[{prod:productoNuevoCambio,cant:1}],
                    _esCambio:true,_upd:Date.now()};
                  onGuardarCambio&&onGuardarCambio(vt);
                  setMostrarCambio(false);setMotivoCambio("Agua en mal estado");
                }}>✓ Registrar cambio</button>
              </div>
            </div>
          )}

          {/* Registrar venta — solo una por día */}
          {ventaHoy
            ? <div style={{...s.card,margin:"0 0 12px",borderLeft:"3px solid #1D9E75",padding:"10px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:14,fontWeight:500,color:"#4dd9a0"}}>✓ Entrega registrada hoy</span>
                  <span style={s.badge("success")}>{fmt(ventaHoy.neto)}</span>
                </div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:4}}>
                  {ventaHoy.detalle.map(d=>`${d.nombre} ×${d.cantidad}`).join(" · ")} · {(Number(ventaHoy.montoTrans)||0)>0&&(Number(ventaHoy.montoEfec)||0)>0?`Mixto · ef ${fmt(ventaHoy.montoEfec)} + tr ${fmt(ventaHoy.montoTrans)}`:ventaHoy.pago}
                </div>
              </div>
            : <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                <button style={{background:"var(--color-background-warning)",color:"var(--color-text-warning)",border:"1px solid var(--color-border-warning)",borderRadius:10,padding:"12px 0",fontSize:13,cursor:"pointer",fontWeight:500,flex:1,minWidth:90}}
                  onClick={()=>{onNoEstaCliente&&onNoEstaCliente();}}>
                  🔄 No está
                </button>
                <button style={{background:"var(--color-background-danger)",color:"var(--color-text-danger)",border:"1px solid var(--color-border-danger)",borderRadius:10,padding:"12px 0",fontSize:13,cursor:"pointer",fontWeight:500,flex:1,minWidth:90}}
                  onClick={()=>{onNoQuiereCliente&&onNoQuiereCliente();}}>
                  🚫 No quiere
                </button>
                <button style={{...s.btnPrimary,padding:"12px 0",fontSize:15,borderRadius:10,flex:2,minWidth:120}} onClick={onVenta}>
                  📦 Registrar entrega
                </button>
              </div>
          }
          {/* Cobrar deuda rápido — botón prominente cuando el cliente debe */}
          {cliente.saldo<0&&!ventaHoy&&(
            <button
              style={{width:"100%",background:"#0a2e1f",color:"#4dd9a0",border:"1.5px solid #4dd9a0",borderRadius:10,padding:"12px",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
              onClick={()=>setMostrarPagoSaldo(true)}>
              💰 Cobrar deuda · {fmt(Math.abs(cliente.saldo))}
            </button>
          )}

          {/* Historial colapsable */}
          <details style={{marginTop:4}}>
            <summary style={{cursor:"pointer",listStyle:"none",display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--color-background-tertiary)",borderRadius:8,padding:"10px 14px",marginBottom:4}}>
              <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>📋 Historial completo del cliente</span>
              <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>▾</span>
            </summary>
          <div style={{marginTop:4}}>
          {/* Leyenda */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
            {[["🛒","#3b82f6","Venta"],["💳","#10b981","Cobro"],["✏️","#818cf8","Ajuste saldo"],["🚪","#f59e0b","No estaba"],["🙅","#ef4444","No quiso"]].map(([ico,col,lbl])=>(
              <span key={lbl} style={{fontSize:10,color:col,background:col+"18",border:`0.5px solid ${col}44`,borderRadius:20,padding:"2px 7px",fontWeight:600}}>{ico} {lbl}</span>
            ))}
          </div>
          {(()=>{
            const nvItems=(noVisitas||[]).map(nv=>({...nv,_esNoVisita:true,fechaKey:nv.fecha}));
            const todo=[...historial,...nvItems].sort((a,b)=>(b.fechaKey||"").localeCompare(a.fechaKey||"")||(b.id||0)-(a.id||0));
            if(todo.length===0) return <p style={{fontSize:13,color:"var(--color-text-tertiary)",padding:"4px 0"}}>Sin registros aún</p>;
            return todo.map((item,idx)=>{
              // ── NO VISITA ──
              if(item._esNoVisita){
                const esNoEsta=item.motivo==="noesta";
                return(
                  <div key={"nv"+idx} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",marginBottom:6,background:esNoEsta?"rgba(245,158,11,0.08)":"rgba(239,68,68,0.08)",borderRadius:10,border:`0.5px solid ${esNoEsta?"rgba(245,158,11,0.3)":"rgba(239,68,68,0.3)"}`}}>
                    <span style={{fontSize:18}}>{esNoEsta?"🚪":"🙅"}</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:esNoEsta?"#f59e0b":"#ef4444"}}>{esNoEsta?"No estaba en casa":"No quiso comprar"}</div>
                      <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{item.fechaKey} · {item.dia}</div>
                    </div>
                  </div>
                );
              }
              const v=item;
              const esCobro=v.pagadoNum>0&&v.neto===0&&!v._esAjuste;
              const esAjuste=v._esAjuste||false;
              const esCambio=v._esCambio||false;
              if(esCobro) return(
                <div key={v.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 12px",marginBottom:6,background:"rgba(16,185,129,0.08)",borderRadius:10,border:"0.5px solid rgba(16,185,129,0.3)"}}>
                  <div style={{display:"flex",gap:8,alignItems:"flex-start",flex:1}}>
                    <span style={{fontSize:18}}>💳</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#10b981"}}>Cobro de deuda</div>
                      <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:1}}>{v.fechaKey} · {v.pago}</div>
                      {v.saldoAntes!==undefined&&<div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>Saldo antes: {fmt(v.saldoAntes)} → después: {fmt(v.saldoDespues)}</div>}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                    <div style={{fontSize:16,fontWeight:700,color:"#10b981"}}>+{fmt(v.pagadoNum)}</div>
                    <button style={{fontSize:10,color:"var(--color-text-danger)",background:"none",border:"none",cursor:"pointer",marginTop:4}} onClick={()=>{if(window.confirm("¿Eliminar este cobro?"))onEliminarVenta(v.id);}}>Eliminar</button>
                  </div>
                </div>
              );
              if(esAjuste) return(
                <div key={v.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 12px",marginBottom:6,background:"rgba(129,140,248,0.08)",borderRadius:10,border:"0.5px solid rgba(129,140,248,0.3)"}}>
                  <div style={{display:"flex",gap:8,alignItems:"flex-start",flex:1}}>
                    <span style={{fontSize:18}}>✏️</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#818cf8"}}>Ajuste de saldo</div>
                      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>{v.obs?.replace("Ajuste: ","")}</div>
                      <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:1}}>{v.fechaKey}</div>
                      {v.saldoAntes!==undefined&&<div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Saldo: {fmt(v.saldoAntes)} → {fmt(v.saldoDespues)}</div>}
                    </div>
                  </div>
                  <button style={{fontSize:10,color:"var(--color-text-danger)",background:"none",border:"none",cursor:"pointer",flexShrink:0}} onClick={()=>{if(window.confirm("¿Eliminar este ajuste?"))onEliminarVenta(v.id);}}>Eliminar</button>
                </div>
              );
              if(esCambio) return(
                <div key={v.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 12px",marginBottom:6,background:"rgba(129,140,248,0.08)",borderRadius:10,border:"0.5px solid rgba(129,140,248,0.3)"}}>
                  <div style={{display:"flex",gap:8,alignItems:"flex-start",flex:1}}>
                    <span style={{fontSize:18}}>🔄</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#818cf8"}}>Cambio de envase</div>
                      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>{v.obs?.replace("Cambio: ","")}</div>
                      <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:1}}>{v.fechaKey} · no se cobró</div>
                    </div>
                  </div>
                  <button style={{fontSize:10,color:"var(--color-text-danger)",background:"none",border:"none",cursor:"pointer",flexShrink:0}} onClick={()=>{if(window.confirm("¿Eliminar este cambio?"))onEliminarVenta(v.id);}}>Eliminar</button>
                </div>
              );
              return(
            <div key={v.id} style={{marginBottom:6}}>
              {editandoVentaId===v.id
                ? <EditVenta venta={v} productos={productos} onGuardar={(d,p,m,sa,obs,tr2)=>{onEditarVenta(v.id,d,p,m,sa,obs,tr2);setEditandoVentaId(null);}} onCancelar={()=>setEditandoVentaId(null)} />
                : <div style={{padding:"10px 12px",background:"rgba(59,130,246,0.06)",borderRadius:10,border:"0.5px solid rgba(59,130,246,0.2)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,alignItems:"center"}}>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontSize:16}}>🛒</span>
                        <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{v.fechaKey||v.dia}</span>
                      </div>
                      <span style={{fontSize:15,fontWeight:700,color:"#3b82f6"}}>{fmt(v.neto)}</span>
                    </div>
                    <div style={{fontSize:13,color:"var(--color-text-primary)",marginBottom:2,paddingLeft:22}}>{v.detalle.map(d=>`${d.nombre} ×${d.cantidad}`).join(" · ")}</div>
                    <div style={{fontSize:11,color:"var(--color-text-secondary)",paddingLeft:22,marginBottom:6}}>
                      {(()=>{
                        const esMixto=(Number(v.montoTrans)||0)>0&&(Number(v.montoEfec)||0)>0;
                        if(esMixto) return `Mixto · ef ${fmt(v.montoEfec)} + tr ${fmt(v.montoTrans)}`;
                        return v.pago;
                      })()}{v.desc>0?` · desc. ${fmt(v.desc)}`:""}{v.saldoAplicado>0?` · saldo apl. ${fmt(v.saldoAplicado)}`:""}{v.obs?` · ${v.obs.replace(/\s*\[Mixto:[^\]]*\]/g,"")}`:""}</div>
                    <div style={{display:"flex",justifyContent:"flex-end",gap:6}}>
                      <button style={{...s.btn,fontSize:11,padding:"3px 8px"}} onClick={()=>setEditandoVentaId(v.id)}>Editar</button>
                      <button style={{...s.btnDanger,fontSize:11,padding:"3px 8px"}} onClick={()=>{if(window.confirm(`¿Eliminar venta de ${fmt(v.neto)}?`))onEliminarVenta(v.id);}}>Eliminar</button>
                    </div>
                  </div>
              }
            </div>
            );
            });})()}
          </div>
          </details>

          {/* Envases colapsable */}
          <details style={{marginTop:6}}> 
            <summary style={{cursor:"pointer",listStyle:"none",display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--color-background-tertiary)",borderRadius:8,padding:"10px 14px",marginBottom:4}}>
              <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>🫧 Envases</span>
              <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>▾</span>
            </summary>
            <div style={{marginTop:4}}>
              {/* Editor unificado: el mismo ♻️ Envases de todas las listas */}
              <div style={{...s.card,margin:"0 0 10px",paddingTop:2}}>
                <PieEnvases c={cliente} ventas={ventas} onEditar={(id,cambios)=>onEditar(cambios)}
                  izquierda={<span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Ajustar fijos y prestados</span>} />
              </div>
              {(()=>{
                const pkEnv={"Sifón 1.5L":"sifon","Bidón 10L":"bidon10","Bidón 20L":"bidon20"};
                const extra={sifon:0,bidon10:0,bidon20:0};
                historial.forEach(v=>{
                  (v.envPrest||[]).forEach(e=>{const k=pkEnv[e.prod];if(k)extra[k]+=Number(e.cant)||0;});
                  (v.envDev||[]).forEach(e=>{const k=pkEnv[e.prod];if(k)extra[k]-=Number(e.cant)||0;});
                });
                // Sumar ajuste manual
                const aj=cliente.envAjuste||{};
                const exTotal={sifon:extra.sifon+(aj.sifon||0),bidon10:extra.bidon10+(aj.bidon10||0),bidon20:extra.bidon20+(aj.bidon20||0)};
                const hab={sifon:cliente.sifon||0,bidon10:cliente.bidon10||0,bidon20:cliente.bidon20||0};
                const total={sifon:hab.sifon+exTotal.sifon,bidon10:hab.bidon10+exTotal.bidon10,bidon20:hab.bidon20+exTotal.bidon20};
                const hayExtra=exTotal.sifon!==0||exTotal.bidon10!==0||exTotal.bidon20!==0;
                return (<>
                  <div style={{...s.card,margin:"0 0 10px",background:"var(--color-background-tertiary)"}}>
                    <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8}}>📦 En poder del cliente ahora</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {total.sifon>0&&<div style={s.metricCard}><div style={s.metricLabel}>Sifón</div><div style={{...s.metricVal,color:exTotal.sifon>0?"var(--color-text-warning)":exTotal.sifon<0?"var(--color-text-success)":"var(--color-text-primary)"}}>{total.sifon}</div></div>}
                      {total.bidon10>0&&<div style={s.metricCard}><div style={s.metricLabel}>10L</div><div style={{...s.metricVal,color:exTotal.bidon10>0?"var(--color-text-warning)":exTotal.bidon10<0?"var(--color-text-success)":"var(--color-text-primary)"}}>{total.bidon10}</div></div>}
                      {total.bidon20>0&&<div style={s.metricCard}><div style={s.metricLabel}>20L</div><div style={{...s.metricVal,color:exTotal.bidon20>0?"var(--color-text-warning)":exTotal.bidon20<0?"var(--color-text-success)":"var(--color-text-primary)"}}>{total.bidon20}</div></div>}
                      {cliente.dispenser>0&&<div style={s.metricCard}><div style={s.metricLabel}>Dispenser</div><div style={s.metricVal}>{cliente.dispenser}</div></div>}
                      {!total.sifon&&!total.bidon10&&!total.bidon20&&!cliente.dispenser&&<span style={{fontSize:13,color:"var(--color-text-tertiary)"}}>Sin envases</span>}
                    </div>
                    {hayExtra&&(
                      <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:8,borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:6}}>
                        {(hab.sifon>0||hab.bidon10>0||hab.bidon20>0)&&<span>Habitual: {hab.sifon>0?`Sifón×${hab.sifon} `:""}{hab.bidon10>0?`10L×${hab.bidon10} `:""}{hab.bidon20>0?`20L×${hab.bidon20}`:""} · </span>}
                        {exTotal.sifon!==0&&<span style={{color:exTotal.sifon>0?"var(--color-text-warning)":"var(--color-text-success)"}}>{exTotal.sifon>0?`+${exTotal.sifon} sif. extra`:` −${Math.abs(exTotal.sifon)} sif. devueltos`} </span>}
                        {exTotal.bidon10!==0&&<span style={{color:exTotal.bidon10>0?"var(--color-text-warning)":"var(--color-text-success)"}}>{exTotal.bidon10>0?`+${exTotal.bidon10} 10L extra`:` −${Math.abs(exTotal.bidon10)} 10L devueltos`} </span>}
                        {exTotal.bidon20!==0&&<span style={{color:exTotal.bidon20>0?"var(--color-text-warning)":"var(--color-text-success)"}}>{exTotal.bidon20>0?`+${exTotal.bidon20} 20L extra`:` −${Math.abs(exTotal.bidon20)} 20L devueltos`}</span>}
                      </div>
                    )}
                  </div>
                </>);
              })()}
              <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",margin:"10px 0 6px"}}>Movimientos registrados</div>
              {historial.filter(v=>(v.envPrest||[]).length>0||(v.envDev||[]).length>0).length===0&&
                <p style={{fontSize:13,color:"var(--color-text-tertiary)"}}>Sin movimientos de envases registrados</p>}
              {historial.filter(v=>(v.envPrest||[]).length>0||(v.envDev||[]).length>0).map(v=>(
                <div key={v.id} style={{...s.card,margin:"0 0 8px"}}>
                  <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:4}}>{v.fechaKey||v.dia}</div>
                  {(v.envPrest||[]).map((e,i)=>(
                    <div key={"p"+i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                      <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>+ Prestado: {e.prod}</span>
                      <span style={s.badge("warning")}>×{e.cant}</span>
                    </div>
                  ))}
                  {(v.envDev||[]).map((e,i)=>(
                    <div key={"d"+i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                      <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>← Devuelto: {e.prod}</span>
                      <span style={s.badge("success")}>×{e.cant}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </details>


          <div style={{...s.divider,marginTop:12}}/>
          <details style={{marginTop:4}}>
            <summary style={{fontSize:12,color:"var(--color-text-tertiary)",cursor:"pointer",padding:"4px 0",listStyle:"none",display:"flex",alignItems:"center",gap:4}}>
              ⚙ Opciones avanzadas
            </summary>
            <div style={{marginTop:8}}>
              <button style={{...s.btnDanger,width:"100%",padding:"10px",fontSize:13}} onClick={()=>{if(window.confirm(`¿Eliminar a ${cliente.nombre}? Se borrarán también sus ventas.`))onEliminarCliente();}}>
                Eliminar cliente
              </button>
            </div>
          </details>
        </>}
        {editandoCliente && <FormCliente inicial={cliente} textoGuardar="Guardar cambios" onGuardar={cambios=>{onEditar(cambios);setEditandoCliente(false);}} onEliminarCliente={onEliminarCliente} />}
      </div>
    </div>
  );
}

function FiadosPendientes({clientes,ventas,onCobrar,onVolver,onEditarCliente}) {
  const [pagando,setPagando]=React.useState(null); // clienteId
  const [monto,setMonto]=React.useState('');
  const [pago,setPago]=React.useState('contado');
  const conDeuda=clientes.filter(c=>c.saldo<0).sort((a,b)=>a.saldo-b.saldo);
  const totalDeuda=conDeuda.reduce((a,c)=>a+Math.abs(c.saldo),0);
  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <div style={{flex:1}}>
          <div style={s.headerTitle}>💰 Fiados pendientes</div>
          <div style={{fontSize:11,color:'var(--color-text-danger)'}}>{conDeuda.length} clientes · {fmt(totalDeuda)} total</div>
        </div>
        <HeaderBotones/>
      </div>
      {conDeuda.length===0&&<div style={{padding:40,textAlign:'center',color:'var(--color-text-success)',fontSize:15}}>✅ ¡Sin fiados pendientes!</div>}
      {conDeuda.map(c=>(
        <div key={c.id} style={{...s.card,margin:'6px 14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:'var(--color-text-primary)'}}>{c.nombre}</div>
              <div style={{fontSize:11,color:'var(--color-text-tertiary)'}}>{c.dia}{c.barrio?' · '+c.barrio:''}</div>
            </div>
            <span style={{fontSize:16,fontWeight:700,color:'var(--color-text-danger)'}}>{fmt(Math.abs(c.saldo))}</span>
          </div>
          {pagando===c.id?(
            <div style={{display:'flex',flexDirection:'column',gap:8,paddingTop:8,borderTop:'0.5px solid var(--color-border-tertiary)'}}>
              <div style={{display:'flex',gap:6}}>
                {['contado','transferencia'].map(p=>(
                  <button key={p} style={{flex:1,padding:'7px',fontSize:12,borderRadius:8,border:'0.5px solid var(--color-border-secondary)',background:pago===p?'#185FA5':'var(--color-background-tertiary)',color:pago===p?'#e2eaf4':'var(--color-text-secondary)',cursor:'pointer',fontWeight:pago===p?600:400}}
                    onClick={()=>setPago(p)}>{p==='contado'?'💵 Efectivo':'💳 Transfer.'}</button>
                ))}
              </div>
              <input style={{...s.input}} type='number' placeholder={fmt(Math.abs(c.saldo))+' (total)'} value={monto} onChange={e=>setMonto(e.target.value)} />
              <div style={{display:'flex',gap:6}}>
                <button style={{...s.btn,flex:1}} onClick={()=>{setPagando(null);setMonto('');}}>Cancelar</button>
                <button style={{...s.btnPrimary,flex:2,padding:'9px'}} onClick={()=>{
                  const m=Number(monto)||Math.abs(c.saldo);
                  onCobrar(c.id,m,pago);
                  setPagando(null);setMonto('');
                }}>✓ Confirmar cobro</button>
              </div>
            </div>
          ):(
            <button style={{width:'100%',padding:'9px',background:'#0a2e1f',color:'#4dd9a0',border:'1px solid #4dd9a0',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}
              onClick={()=>{setPagando(c.id);setMonto(String(Math.abs(c.saldo)));setPago('contado');}}>
              💰 Cobrar deuda
            </button>
          )}
          {onEditarCliente&&<PieEnvases c={c} ventas={ventas} onEditar={onEditarCliente} />}
        </div>
      ))}
    </div>
  );
}

function ClientesDormidos({clientes,ventas,onVolver,onSeleccionar,onEditarCliente}) {
  const [semanas,setSemanas]=React.useState(2);
  const hoy=new Date();
  // Última compra real por cliente (ignora cobros y ajustes)
  const ultima={};
  (ventas||[]).forEach(v=>{
    if(v._esCobro||v._esAjuste||v._esAjusteEnvases||v._esCambio||v._esMixtoTrans) return;
    const fk=v.fechaKey; if(!fk) return;
    if(!ultima[v.clienteId]||fk>ultima[v.clienteId]) ultima[v.clienteId]=fk;
  });
  const diasDesde=(fk)=>{ if(!fk) return Infinity; const d=new Date(fk+"T12:00:00"); return Math.floor((hoy-d)/86400000); };
  const lista=(clientes||[])
    .map(c=>{ const fk=ultima[c.id]; return {...c, ultimaFecha:fk, dias:diasDesde(fk)}; })
    .filter(c=>c.dias>=semanas*7)
    .sort((a,b)=>b.dias-a.dias);
  const textoTiempo=(c)=>{
    if(c.dias===Infinity) return "Sin compras registradas";
    const sem=Math.floor(c.dias/7);
    return `Hace ${sem} semana${sem!==1?"s":""}`+(c.ultimaFecha?` · últ. ${c.ultimaFecha}`:"");
  };
  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <div style={{flex:1}}>
          <div style={s.headerTitle}>😴 Clientes dormidos</div>
          <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{lista.length} cliente{lista.length!==1?"s":""} sin comprar hace {semanas}+ semanas</div>
        </div>
        <HeaderBotones/>
      </div>
      <div style={{padding:"10px 14px 4px",display:"flex",gap:6,alignItems:"center"}}>
        <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Mostrar sin comprar hace:</span>
        {[2,3,4,8].map(n=>(
          <button key={n} onClick={()=>setSemanas(n)}
            style={{padding:"5px 10px",fontSize:12,borderRadius:8,cursor:"pointer",border:"0.5px solid var(--color-border-secondary)",
              background:semanas===n?"#185FA5":"var(--color-background-tertiary)",color:semanas===n?"#e2eaf4":"var(--color-text-secondary)",fontWeight:semanas===n?600:400}}>
            {n}+ sem
          </button>
        ))}
      </div>
      {lista.length===0&&<div style={{padding:40,textAlign:"center",color:"var(--color-text-success)",fontSize:15}}>✅ ¡Ningún cliente dormido con ese filtro!</div>}
      {lista.map(c=>(
        <div key={c.id} style={{...s.card,margin:"6px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>onSeleccionar&&onSeleccionar(c)}>
              <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>{c.nombre}</div>
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>
                {c.dia}{c.barrio?" · "+c.barrio:""}{c.calle?` · ${c.calle} ${c.nro||""}`:c.manzana?` · Mz ${c.manzana} L ${c.lote}`:""}
              </div>
              <div style={{fontSize:12,fontWeight:600,color:c.dias>=28?"var(--color-text-danger)":"var(--color-text-warning)",marginTop:4}}>
                ⏳ {textoTiempo(c)}
              </div>
              {c.saldo<0&&<div style={{fontSize:11,color:"var(--color-text-danger)",marginTop:3}}>Debe {fmt(Math.abs(c.saldo))}</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0,alignItems:"center"}}>
              {c.telefono&&<a href={`https://wa.me/54${c.telefono}`} target="_blank" rel="noreferrer" style={{fontSize:22,textDecoration:"none"}} title="WhatsApp">💬</a>}
              {(c.maps||(c.lat&&c.lng))&&<a href={c.maps||`https://www.google.com/maps?q=${c.lat},${c.lng}`} target="_blank" rel="noreferrer" style={{fontSize:22,textDecoration:"none"}} title="Mapa">📍</a>}
            </div>
          </div>
          {onEditarCliente&&<PieEnvases c={c} ventas={ventas} onEditar={onEditarCliente} />}
        </div>
      ))}
    </div>
  );
}
