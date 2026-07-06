// ════════════════════════════════════════════════════════════════════
// ◆  10-gestion.js — GestionClientes, FormCliente
// ════════════════════════════════════════════════════════════════════

function GestionClientes({clientes,onEditar,onEliminar,onNuevo,onVolver,onReordenarTodo,onRegistrarVenta,onVerDetalle,ventas,productos,onGuardarCambio,onIrTab}) {
  const [fotoClienteId,setFotoClienteId] = React.useState(null);
  const fotoCliente = fotoClienteId ? clientes.find(c=>c.id===fotoClienteId) : null;
  const [busqueda,setBusqueda]   = useState("");
  const [filtroDia,setFiltroDia] = useState("todos");
  const [modoNuevo,setModoNuevo] = useState(false);
  const [editandoId,setEditandoId] = useState(null);
  const [cambioId,setCambioId] = useState(null);
  const [productoViejoCambio,setProductoViejoCambio] = useState("Bidón 20L");
  const [productoNuevoCambio,setProductoNuevoCambio] = useState("Bidón 20L");
  const [motivoCambio,setMotivoCambio] = useState("Agua en mal estado");

  // Calcular envases extra por cliente
  const extraEnvases = React.useMemo(()=>{
    const m={};
    const KP={"Sifón 1.5L":"sifon","Bidón 10L":"bidon10","Bidón 20L":"bidon20","Dispenser":"dispenser"};
    (ventas||[]).forEach(v=>{
      if(!m[v.clienteId]) m[v.clienteId]={sifon:0,bidon10:0,bidon20:0,dispenser:0};
      (v.envPrest||[]).forEach(e=>{const k=KP[e.prod];if(k)m[v.clienteId][k]+=Number(e.cant)||0;});
      (v.envDev||[]).forEach(e=>{const k=KP[e.prod];if(k)m[v.clienteId][k]-=Number(e.cant)||0;});
    });
    return m;
  },[ventas]);

  const filtrados = clientes
    .filter(c=>!c._esProspecto)
    .filter(c=>filtroDia==="todos"||c.dia===filtroDia)
    .filter(c=>buscarCliente(c,busqueda)>0)
    .sort((a,b)=>{
    // Con búsqueda activa: primero las coincidencias por DOMICILIO
    if(busqueda.trim()){
      const dif=buscarCliente(b,busqueda)-buscarCliente(a,busqueda);
      if(dif!==0) return dif;
    }
    if(a.dia!==b.dia) return DIAS.indexOf(a.dia)-DIAS.indexOf(b.dia);
    return (a.orden||9999)-(b.orden||9999);
  });

  return (
    <>
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <span style={s.headerTitle}>Gestión de clientes</span>
        <button style={{...s.btn,padding:"6px 12px",fontSize:12,background:"#185FA5",color:"#e2eaf4",border:"none"}}
          onClick={()=>{setModoNuevo(true);setEditandoId(null);}}>
          + Nuevo
        </button>
      </div>

      {onIrTab&&<ClientesTabs activo="todos" onIr={onIrTab}/>}

      {/* Filtros */}
      <div style={{padding:"10px 14px 6px"}}>
        <input style={{...s.input,background:"var(--color-background-info)",border:"0.5px solid var(--color-border-info)"}} placeholder="Buscar por domicilio, nombre o teléfono..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
          {["todos",...DIAS].map(d=>(
            <button key={d} style={{...s.btn,fontSize:11,padding:"3px 10px",
              background:filtroDia===d?"#185FA5":"var(--color-background-tertiary)",
              color:filtroDia===d?"#e2eaf4":"var(--color-text-secondary)",
              border:filtroDia===d?"none":"0.5px solid var(--color-border-secondary)"}}
              onClick={()=>setFiltroDia(d)}>
              {d==="todos"?"Todos":d}
            </button>
          ))}
          <button style={{...s.btn,fontSize:11,padding:"3px 10px",marginLeft:"auto"}}
          onClick={()=>{
            const porDia = {};
            DIAS.forEach(d=>{ porDia[d]=[...clientes].filter(c=>c.dia===d).sort((a,b)=>(a.orden||9999)-(b.orden||9999)); });
            const compactados = clientes.map(c=>{
              const lista = porDia[c.dia];
              const idx = lista.findIndex(x=>x.id===c.id);
              return idx>=0 ? {...c, orden:idx+1} : c;
            });
            if(window.confirm("¿Reordenar todos los clientes eliminando los huecos en la numeración?")) onReordenarTodo(compactados);
          }}>
          ↺ Reordenar
        </button>
        </div>
        <p style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:6}}>
          {filtrados.length} clientes{filtroDia!=="todos"?` · ${filtroDia}`:""}
        </p>
      </div>

      {/* Formulario nuevo cliente */}
      {modoNuevo && (
        <div style={{...s.card,margin:"6px 14px",borderLeft:"3px solid #185FA5"}}>
          <div style={{...s.row,justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>Nuevo cliente</span>
            <button style={{...s.btn,fontSize:11,padding:"3px 10px"}} onClick={()=>setModoNuevo(false)}>Cancelar</button>
          </div>
          <FormCliente
            inicial={{nombre:"",dia:"Martes",barrio:"",manzana:"",lote:"",sector:"",calle:"",nro:"",aclaracion:"",telefono:"",maps:"",notas:"",sifon:0,bidon10:0,bidon20:0,orden:""}}
            onGuardar={(datos)=>{onNuevo(datos);setModoNuevo(false);}}
          />
        </div>
      )}

      {/* Lista */}
      {filtrados.map(c=>(
        <div key={c.id} style={{...s.card,borderLeft:editandoId===c.id?"3px solid #5daaff":"0.5px solid var(--color-border-tertiary)"}}>
          {editandoId===c.id ? (
            <>
              <div style={{...s.row,justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>Editando</span>
                <button style={{...s.btn,fontSize:11,padding:"3px 10px"}} onClick={()=>setEditandoId(null)}>Cancelar</button>
              </div>
              <FormCliente
                inicial={c}
                onGuardar={(datos)=>{onEditar(c.id,datos);setEditandoId(null);}}
              />
            </>
          ) : (
            <>
              <div style={{display:"flex",alignItems:"flex-start",gap:10,cursor:onVerDetalle?"pointer":"default"}}
                onClick={()=>onVerDetalle&&onVerDetalle(c)}>
                {/* Número de orden */}
                <div style={{width:32,height:32,borderRadius:8,background:"var(--color-background-tertiary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"var(--color-text-tertiary)",flexShrink:0}}>
                  {c.orden||"#"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:500,fontSize:14,color:"var(--color-text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nombre}</div>
                  <div style={{fontSize:16,color:"var(--color-text-secondary)",marginTop:2}}>
                    {c.dia} · {c.calle?`${c.calle} ${c.nro||""}`:c.manzana?`Mz ${c.manzana} L ${c.lote}`:""}{c.barrio?` · ${c.barrio}`:""}
                  </div>
                  {c.notas&&<div style={{fontSize:11,color:"var(--color-text-warning)",marginTop:2}}>📝 {c.notas}</div>}
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:5}}>
                    {/* Saldo */}
                    {c.saldo<0&&<span style={s.badge("danger")}>Debe {fmt(Math.abs(c.saldo))}</span>}
                    {c.saldo>0&&<span style={s.badge("success")}>A favor {fmt(c.saldo)}</span>}
                    {/* Envases habituales */}
                    {c.sifon>0&&<span style={s.tag}>Sifón×{c.sifon}</span>}
                    {c.bidon10>0&&<span style={s.tag}>10L×{c.bidon10}</span>}
                    {c.bidon20>0&&<span style={s.tag}>20L×{c.bidon20}</span>}
                    {c.dispenser>0&&<span style={{...s.tag,color:"#5daaff"}}>Disp×{c.dispenser}</span>}
                    {/* Envases extra prestados */}
                    {(()=>{
                      const ex=extraEnvases[c.id]||{};
                      const aj=c.envAjuste||{};
                      const total={sifon:(ex.sifon||0)+(aj.sifon||0),bidon10:(ex.bidon10||0)+(aj.bidon10||0),bidon20:(ex.bidon20||0)+(aj.bidon20||0)};
                      return (<>
                        {total.sifon>0&&<span style={{...s.tag,color:"var(--color-text-warning)",fontWeight:500}}>+{total.sifon} sif extra</span>}
                        {total.bidon10>0&&<span style={{...s.tag,color:"var(--color-text-warning)",fontWeight:500}}>+{total.bidon10} 10L extra</span>}
                        {total.bidon20>0&&<span style={{...s.tag,color:"var(--color-text-warning)",fontWeight:500}}>+{total.bidon20} 20L extra</span>}
                      </>);
                    })()}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0,alignItems:"center"}}>
                  {(c.maps||(c.lat&&c.lng))&&<a href={c.maps||`https://www.google.com/maps?q=${c.lat},${c.lng}`} target="_blank" rel="noreferrer" style={{fontSize:18,textDecoration:"none"}} onClick={e=>e.stopPropagation()}>📍</a>}
                  {c.telefono&&<a href={`https://wa.me/54${c.telefono}`} target="_blank" rel="noreferrer" style={{fontSize:18,textDecoration:"none"}} onClick={e=>e.stopPropagation()}>💬</a>}
                  <span style={{fontSize:18,cursor:"pointer",lineHeight:1}} onClick={e=>{e.stopPropagation();setFotoClienteId(fotoClienteId===c.id?null:c.id);}}>📷</span>
                </div>
              </div>
              <PieEnvases c={c} ventas={ventas} onEditar={onEditar}
                izquierda={<button style={{...s.btnDanger,fontSize:11,padding:"4px 12px"}} onClick={e=>{e.stopPropagation();onEliminar(c.id);}}>Eliminar</button>}>
                {onRegistrarVenta&&<button style={{...s.btn,fontSize:11,padding:"4px 12px",background:"#185FA5",color:"#e2eaf4",border:"none"}} onClick={e=>{e.stopPropagation();onRegistrarVenta(c);}}>📦 Venta</button>}
                <button style={{...s.btn,fontSize:11,padding:"4px 12px"}} onClick={e=>{e.stopPropagation();setCambioId(cambioId===c.id?null:c.id);}}>🔄 Cambio</button>
                <button style={{...s.btn,fontSize:11,padding:"4px 12px"}} onClick={e=>{e.stopPropagation();setEditandoId(c.id);}}>Editar</button>
              </PieEnvases>
              {cambioId===c.id&&(
                <div style={{...s.card,margin:"8px 0 0",border:"1px solid #818cf8"}} onClick={e=>e.stopPropagation()}>
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
                    <button style={{...s.btn,flex:1,fontSize:12}} onClick={()=>setCambioId(null)}>Cancelar</button>
                    <button style={{...s.btnPrimary,flex:2,fontSize:12,padding:"8px"}} onClick={()=>{
                      const vt={id:Date.now(),clienteId:c.id,cliente:c.nombre,
                        dia:c.dia,fechaKey:new Date().toLocaleDateString("en-CA"),fecha:new Date().toLocaleString("es-AR"),
                        detalle:[{nombre:"Cambio de envase",cantidad:1,precio:0,total:0}],
                        pago:"cambio",obs:`Cambio: ${productoViejoCambio} → ${productoNuevoCambio}${motivoCambio.trim()?` · ${motivoCambio.trim()}`:""}`,
                        neto:0,bruto:0,desc:0,costo:0,ganancia:0,pagadoNum:0,saldoDelta:0,
                        envDev:[{prod:productoViejoCambio,cant:1}],envPrest:[{prod:productoNuevoCambio,cant:1}],
                        _esCambio:true,_upd:Date.now()};
                      onGuardarCambio&&onGuardarCambio(vt);
                      setCambioId(null);setMotivoCambio("Agua en mal estado");
                    }}>✓ Registrar cambio</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {filtrados.length===0&&!modoNuevo&&(
        <div style={{textAlign:"center",padding:"40px 20px",color:"var(--color-text-tertiary)",fontSize:14}}>
          No hay clientes{filtroDia!=="todos"?` en ${filtroDia}`:""}.
        </div>
      )}
    </div>
    {/* Modal foto domicilio */}
    {fotoClienteId&&(
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:2000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setFotoClienteId(null)}>
        {fotoCliente&&fotoCliente.foto
          ? <img src={fotoCliente.foto} alt="Domicilio" style={{maxWidth:"100%",maxHeight:"60vh",borderRadius:10,objectFit:"contain",marginBottom:16}} />
          : <div style={{color:"#aaa",fontSize:14,marginBottom:20}}>Sin foto aún · {fotoCliente&&fotoCliente.nombre}</div>
        }
        <div style={{display:"flex",gap:12}} onClick={e=>e.stopPropagation()}>
          <label style={{background:"#185FA5",color:"#e2eaf4",padding:"12px 20px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"center"}}>
            📷 Cámara
            <input type="file" accept="image/*" capture="environment" style={{display:"none"}}
              onChange={async e=>{const f=e.target.files[0];if(!f)return;const b64=await comprimirFoto(f);onEditar(fotoClienteId,{foto:b64});setFotoClienteId(null);}} />
          </label>
          <label style={{background:"#2a3a4a",color:"#e2eaf4",padding:"12px 20px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"center"}}>
            🖼 Galería
            <input type="file" accept="image/*" style={{display:"none"}}
              onChange={async e=>{const f=e.target.files[0];if(!f)return;const b64=await comprimirFoto(f);onEditar(fotoClienteId,{foto:b64});setFotoClienteId(null);}} />
          </label>
          {fotoCliente&&fotoCliente.foto&&<button style={{background:"#3a2020",color:"#e05c5c",padding:"12px 14px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",border:"none"}} onClick={()=>{onEditar(fotoClienteId,{foto:""});setFotoClienteId(null);}}>🗑</button>}
        </div>
        <span style={{color:"#aaa",fontSize:11,marginTop:14}}>Tocá fuera para cerrar</span>
      </div>
    )}
    </>
  );
}

// ── CargaGPSMasiva ────────────────────────────────────────────────────────────
function CargaGPSMasiva({clientes, onActualizar, onVolver}) {
  const sinGPS = React.useMemo(()=>(clientes||[]).filter(c=>!c.lat||!c.lng),[]);
  const [idx, setIdx] = React.useState(0);
  const [latVal, setLatVal] = React.useState("");
  const [lngVal, setLngVal] = React.useState("");
  const [guardados, setGuardados] = React.useState(0);
  const [listo, setListo] = React.useState(false);
  const actualizados = React.useRef([...clientes]);

  const cliente = sinGPS[idx] || null;
  const coordsDelLink = cliente?.maps ? extraerCoordsDeURL(cliente.maps) : null;

  React.useEffect(()=>{
    if(!cliente) return;
    if(coordsDelLink){ setLatVal(String(coordsDelLink.lat)); setLngVal(String(coordsDelLink.lng)); }
    else { setLatVal(""); setLngVal(""); }
  },[idx]);

  const guardarYSiguiente = (omitir=false) => {
    if(!omitir && cliente) {
      const lat=parseFloat(latVal), lng=parseFloat(lngVal);
      if(!isNaN(lat)&&!isNaN(lng)) {
        const i=actualizados.current.findIndex(c=>c.id===cliente.id);
        if(i>=0) actualizados.current[i]={...actualizados.current[i],lat,lng};
        onActualizar([...actualizados.current]);
        setGuardados(g=>g+1);
      }
    }
    setLatVal(""); setLngVal("");
    if(idx+1>=sinGPS.length) setListo(true);
    else setIdx(i=>i+1);
  };

  if(sinGPS.length===0 || listo || !cliente) return (
    <div style={{...s.screen,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:32}}>
      <div style={{fontSize:48}}>✅</div>
      <div style={{fontSize:17,fontWeight:600,color:"var(--color-text-primary)",textAlign:"center"}}>¡GPS cargado!</div>
      <div style={{fontSize:13,color:"var(--color-text-secondary)",textAlign:"center"}}>{guardados} cliente{guardados!==1?"s":""} con GPS guardado.</div>
      <button style={s.btnPrimary} onClick={onVolver}>Ver mapa →</button>
    </div>
  );

  const progreso = Math.round((idx/sinGPS.length)*100);
  const dir = cliente.calle ? `${cliente.calle} ${cliente.nro||""}`.trim()
    : cliente.manzana ? `Mz ${cliente.manzana} L ${cliente.lote||""} · ${cliente.barrio||""}`
    : cliente.barrio||"";
  const latOk = latVal&&lngVal&&!isNaN(parseFloat(latVal))&&!isNaN(parseFloat(lngVal));

  return (
    <div style={{...s.screen,display:"flex",flexDirection:"column"}}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <span style={s.headerTitle}>Cargar GPS · {idx+1}/{sinGPS.length}</span>
      </div>
      <div style={{height:4,background:"var(--color-background-tertiary)"}}>
        <div style={{height:"100%",background:"#185FA5",width:`${progreso}%`,transition:"width 0.3s"}}/>
      </div>
      <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>

        <div style={{...s.card,margin:0}}>
          <div style={{fontSize:16,fontWeight:600,color:"var(--color-text-primary)",marginBottom:2}}>{cliente.nombre}</div>
          <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{cliente.dia} · {dir}</div>
          {cliente.maps&&<div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:2,wordBreak:"break-all"}}>{cliente.maps}</div>}
        </div>

        {coordsDelLink&&(
          <div style={{background:"var(--color-background-success)",borderRadius:10,padding:"10px 14px"}}>
            <div style={{fontSize:13,color:"var(--color-text-success)",fontWeight:600}}>✓ Coordenadas extraídas del link</div>
            <div style={{fontSize:12,color:"var(--color-text-success)"}}>{coordsDelLink.lat.toFixed(5)}, {coordsDelLink.lng.toFixed(5)}</div>
          </div>
        )}

        <div style={{background:"var(--color-background-info)",borderRadius:10,padding:"10px 14px"}}>
          <div style={{fontSize:12,color:"var(--color-text-info)",fontWeight:600,marginBottom:4}}>📋 Cómo obtener las coordenadas:</div>
          <div style={{fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.8}}>
            1. Tocá <b>"Abrir en Maps"</b> abajo<br/>
            2. <b>Mantené presionado</b> el punto del cliente<br/>
            3. Aparecen los números arriba: <b>-26.865, -65.217</b><br/>
            4. Tocá esos números → <b>Copiar</b><br/>
            5. Volvé acá y pegá abajo
          </div>
        </div>

        {cliente.maps&&(
          <button style={{...s.btnPrimary,background:"#1a7a3a",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
            onClick={()=>window.open(cliente.maps,"_blank")}>
            🗺 Abrir en Google Maps
          </button>
        )}

        <div style={{...s.card,margin:0}}>
          <label style={{...s.label,fontSize:12,fontWeight:600}}>Pegá las coordenadas (ej: -26.86590, -65.21780)</label>
          <input style={{...s.input,marginTop:4}} placeholder="-26.86590, -65.21780"
            value={latVal&&lngVal?`${latVal}, ${lngVal}`:latVal}
            onChange={e=>{
              const raw=e.target.value;
              const m=raw.match(/(-?\d+(?:\.\d+)?)[,;\s]+(-?\d+(?:\.\d+)?)/);
              if(m){setLatVal(m[1]);setLngVal(m[2]);}
              else setLatVal(raw);
            }}
          />
          {latOk
            ?<div style={{fontSize:11,color:"#4dd9a0",marginTop:4}}>✓ {latVal}, {lngVal}</div>
            :<div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:4}}>Pegá los dos números separados por coma</div>
          }
        </div>

        <div style={{display:"flex",gap:8}}>
          <button style={{...s.btn,flex:1,padding:"12px",fontSize:13}} onClick={()=>guardarYSiguiente(true)}>Omitir →</button>
          <button style={{...s.btnPrimary,flex:2,opacity:latOk||coordsDelLink?1:0.4}}
            disabled={!latOk&&!coordsDelLink}
            onClick={()=>guardarYSiguiente(false)}>
            Guardar y siguiente →
          </button>
        </div>
        <div style={{fontSize:11,color:"var(--color-text-tertiary)",textAlign:"center"}}>
          {guardados} guardados · {sinGPS.length-idx-1} restantes
        </div>
      </div>
    </div>
  );
}

// ── MapaClientes ──────────────────────────────────────────────────────────────
function MapaClientes({clientes, dia, fecha, ventas, noVisitas, onSeleccionar, onVolver, onActualizar}) {
  const mapRef = React.useRef(null);
  const mapInstRef = React.useRef(null);
  const [leafletOk, setLeafletOk] = React.useState(!!window.L);
  const [filtroDia, setFiltroDia] = React.useState(dia||"todos");
  const [modoCarga, setModoCarga] = React.useState(false);

  const ventasHoy = (ventas||[]).filter(v=>v.fechaKey===fecha);
  const noVisHoy  = (noVisitas||[]).filter(v=>v.fecha===fecha);
  const _coordsURL = (url)=>{
    if(!url) return null; let m;
    m=url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);                 if(m) return {lat:+m[1],lng:+m[2]};
    m=url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);             if(m) return {lat:+m[1],lng:+m[2]};
    m=url.match(/[?&](?:q|ll|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/); if(m) return {lat:+m[1],lng:+m[2]};
    m=url.match(/(-?\d{1,2}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})/); if(m) return {lat:+m[1],lng:+m[2]};
    return null;
  };
  const _getCoords = (c)=>{ if(c.lat&&c.lng) return {lat:c.lat,lng:c.lng}; return _coordsURL(c.maps); };
  const clientesFiltrados = (clientes||[]).filter(c=>{
    if(filtroDia!=="todos" && c.dia!==filtroDia) return false;
    return !!_getCoords(c);
  }).map(c=>{ const co=_getCoords(c); return co?{...c,lat:co.lat,lng:co.lng}:c; });
  const sinCoordenadas = (clientes||[]).filter(c=>(filtroDia==="todos"||c.dia===filtroDia)&&!_getCoords(c)).length;
  const entregadosCount = clientesFiltrados.filter(c=>ventasHoy.some(v=>v.clienteId===c.id)).length;
  const pendientesCount = clientesFiltrados.filter(c=>!ventasHoy.some(v=>v.clienteId===c.id)&&!noVisHoy.some(v=>v.clienteId===c.id)).length;

  // ── TODOS los hooks ANTES de cualquier return condicional ──
  React.useEffect(()=>{
    if(window.L){ setLeafletOk(true); return; }
    const link = document.createElement("link");
    link.rel="stylesheet";
    link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload=()=>setLeafletOk(true);
    document.head.appendChild(script);
  },[]);

  React.useEffect(()=>{
    if(modoCarga) return; // no inicializar mapa en modo carga
    if(!leafletOk || !mapRef.current) return;
    if(mapInstRef.current){ mapInstRef.current.remove(); mapInstRef.current=null; }
    const L = window.L;
    const map = L.map(mapRef.current, {zoomControl:true, scrollWheelZoom:true});
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
      attribution:"© OpenStreetMap", maxZoom:19
    }).addTo(map);
    mapInstRef.current = map;

    const bounds = [];
    clientesFiltrados.forEach(c=>{
      const entregado = ventasHoy.some(v=>v.clienteId===c.id);
      const noVis     = noVisHoy.some(v=>v.clienteId===c.id);
      const color = entregado?"#4dd9a0":noVis?"#f07070":"#5daaff";
      const icon = L.divIcon({
        className:"",
        html:`<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.4)">${c.orden||"·"}</div>`,
        iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-14]
      });
      const marker = L.marker([c.lat,c.lng],{icon}).addTo(map);
      const dir = c.calle ? c.calle+" "+(c.nro||"") : c.manzana ? "Mz "+c.manzana+" L "+(c.lote||"") : c.barrio||"";
      marker.bindPopup(
        `<div style="font-family:sans-serif;min-width:160px">
          <b style="font-size:13px">${c.nombre}</b><br/>
          <span style="font-size:11px;color:#666">${c.dia} · Orden ${c.orden||"-"}</span><br/>
          ${dir}<br/>
          ${entregado?"<span style='color:#059669;font-weight:600'>✓ Entregado</span>":noVis?"<span style='color:#dc2626'>✗ No visitado</span>":"<span style='color:#2563eb'>Pendiente</span>"}
        </div>`
      );
      bounds.push([c.lat, c.lng]);
    });

    if(bounds.length>0) map.fitBounds(bounds,{padding:[30,30]});
    else map.setView([-26.82,-65.2],13);

    return ()=>{ if(mapInstRef.current){ mapInstRef.current.remove(); mapInstRef.current=null; } };
  },[leafletOk, modoCarga, filtroDia, clientesFiltrados.length]);

  // return condicional DESPUÉS de todos los hooks
  if(modoCarga) return (
    <CargaGPSMasiva
      clientes={clientes}
      onActualizar={onActualizar}
      onVolver={()=>setModoCarga(false)}
    />
  );

  return (
    <div style={{...s.screen, display:"flex", flexDirection:"column"}}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <span style={s.headerTitle}>Mapa de clientes</span>
      </div>

      {/* Filtro por día */}
      <div style={{display:"flex",gap:6,padding:"8px 14px",overflowX:"auto",background:"var(--color-background-secondary)",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        {["todos",...DIAS].map(d=>(
          <button key={d}
            style={{...s.btn,padding:"5px 12px",fontSize:12,flexShrink:0,
              background:filtroDia===d?"#185FA5":"var(--color-background-tertiary)",
              color:filtroDia===d?"#e2eaf4":"var(--color-text-secondary)",
              border:filtroDia===d?"none":"0.5px solid var(--color-border-secondary)"}}
            onClick={()=>setFiltroDia(d)}>
            {d==="todos"?"Todos":d}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{display:"flex",background:"var(--color-background-secondary)",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        {[
          {val:clientesFiltrados.length, lbl:"Con GPS",    color:"#5daaff"},
          {val:entregadosCount,          lbl:"Entregados", color:"#4dd9a0"},
          {val:pendientesCount,          lbl:"Pendientes", color:"#f5b942"},
          {val:sinCoordenadas,           lbl:"Sin GPS",    color:"var(--color-text-tertiary)"},
        ].map((item,i)=>(
          <div key={i} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRight:i<3?"0.5px solid var(--color-border-tertiary)":"none"}}>
            <div style={{fontSize:16,fontWeight:600,color:item.color}}>{item.val}</div>
            <div style={{fontSize:9,color:"var(--color-text-secondary)"}}>{item.lbl}</div>
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div style={{display:"flex",gap:14,padding:"6px 14px",background:"var(--color-background-secondary)",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        {[["#4dd9a0","Entregado"],["#5daaff","Pendiente"],["#f07070","No visitado"]].map(([color,lbl])=>(
          <div key={lbl} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:color}}/>
            <span style={{fontSize:10,color:"var(--color-text-secondary)"}}>{lbl}</span>
          </div>
        ))}
      </div>

      {/* Sin clientes con GPS */}
      {leafletOk && clientesFiltrados.length===0 && (
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,padding:32}}>
          <div style={{fontSize:40}}>📍</div>
          <div style={{fontSize:15,fontWeight:500,color:"var(--color-text-primary)",textAlign:"center"}}>Sin clientes con GPS</div>
          <div style={{fontSize:13,color:"var(--color-text-secondary)",textAlign:"center",lineHeight:1.6,maxWidth:280}}>
            Tenés {sinCoordenadas} cliente{sinCoordenadas!==1?"s":""} sin coordenadas.<br/>
            Usá la carga masiva para agregarlas en 10-15 minutos.
          </div>
          <button style={{...s.btnPrimary,maxWidth:260}} onClick={()=>setModoCarga(true)}>
            📍 Iniciar carga de GPS ({sinCoordenadas} clientes)
          </button>
        </div>
      )}

      {/* Cargando Leaflet */}
      {!leafletOk && (
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
          <div style={{fontSize:28}}>🗺</div>
          <div style={{fontSize:13,color:"var(--color-text-secondary)"}}>Cargando mapa...</div>
        </div>
      )}

      {/* Mapa */}
      <div style={{flex:1,position:"relative",display:leafletOk&&clientesFiltrados.length>0?"block":"none"}}>
        <div ref={mapRef} style={{width:"100%",height:"100%",minHeight:400}}/>
        {sinCoordenadas>0 && (
          <button onClick={()=>setModoCarga(true)}
            style={{position:"absolute",bottom:16,right:16,zIndex:1000,background:"#185FA5",color:"#e2eaf4",border:"none",borderRadius:24,padding:"10px 16px",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 3px 12px rgba(0,0,0,0.4)",display:"flex",alignItems:"center",gap:6}}>
            📍 Cargar {sinCoordenadas} faltantes
          </button>
        )}
      </div>
    </div>
  );
}
