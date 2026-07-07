// ════════════════════════════════════════════════════════════════════
// ◆  09-promocion.js — Módulo completo de Promoción
// ════════════════════════════════════════════════════════════════════

// ─── MÓDULO PROMOCIÓN ────────────────────────────────────────────────────────

function Promocion({prospectos,onSave,onConvertir,onVolver}) {
  const [diaActivo,setDiaActivo] = useState("");
  const [subVista,setSubVista]   = useState("menu"); // menu | dia | detalle | nuevo | comodato
  const [selId,setSelId]         = useState(null);

  const hoyISO = new Date().toLocaleDateString("en-CA");

  const compras    = (p) => (p.visitas||[]).filter(v=>v.resultado==="compro").length;
  const semanas    = (p) => Math.floor((Date.now()-new Date(p.fechaInicio||hoyISO).getTime())/(7*24*3600*1000));
  const listo      = (p) => compras(p)>=4;
  const visitadoHoy= (p) => (p.visitas||[]).some(v=>v.fecha===hoyISO);

  const porDia = (d) => prospectos.filter(p=>p.dia===d&&p.estado!=="convertido");
  const selP   = prospectos.find(p=>p.id===selId);

  const registrar = (id,resultado) => {
    const nps = prospectos.map(p=>{
      if(p.id!==id) return p;
      const v=[...(p.visitas||[]),{fecha:hoyISO,resultado}];
      return {...p,visitas:v,listoConvertir:v.filter(x=>x.resultado==="compro").length>=4};
    });
    onSave(nps);
  };

  const guardarComodato = (id,cmd) => {
    onSave(prospectos.map(p=>p.id===id?{...p,comodato:{...cmd,fecha:new Date().toLocaleDateString("es-AR")}}:p));
  };

  const agregarProspecto = (datos) => {
    onSave([...prospectos,{...datos,id:Date.now(),estado:"activo",fechaInicio:hoyISO,visitas:[],listoConvertir:false}]);
  };

  const eliminar = (id) => {
    onSave(prospectos.filter(p=>p.id!==id));
  };

  if(subVista==="nuevo") return (
    <PromoNuevo
      diaInicial={diaActivo||"Martes"}
      onGuardar={(d)=>{agregarProspecto(d);setDiaActivo(d.dia);setSubVista("dia");}}
      onVolver={()=>setSubVista(diaActivo?"dia":"menu")}
    />
  );

  if(subVista==="comodato"&&selP) return (
    <PromoComodato
      prospecto={selP}
      onGuardar={(cmd)=>{guardarComodato(selP.id,cmd);setSubVista("detalle");}}
      onVolver={()=>setSubVista("detalle")}
    />
  );

  if(subVista==="detalle"&&selP) return (
    <PromoDetalle
      prospecto={selP}
      listo={listo(selP)}
      comprasCount={compras(selP)}
      semanasCount={semanas(selP)}
      visitadoHoy={visitadoHoy(selP)}
      onRegistrar={(r)=>registrar(selP.id,r)}
      onComodato={()=>setSubVista("comodato")}
      onEditar={(datos)=>onSave(prospectos.map(p=>p.id===selP.id?{...p,...datos}:p))}
      onActualizarEnvases={(id,cambios)=>{
        onSave(prospectos.map(p=>p.id===id?{...p,...cambios}:p));
      }}
      onConvertir={()=>{
        onConvertir({
          nombre:selP.nombre, dia:selP.dia, barrio:selP.barrio||"",
          manzana:selP.manzana||"", lote:selP.lote||"", sector:selP.sector||"",
          calle:selP.calle||"", nro:selP.nro||"", aclaracion:selP.depto||"",
          telefono:selP.telefono||"", maps:selP.maps||"", notas:selP.notas||"",
          sifon:    selP.sifon||selP.comodato?.sifon||0,
          bidon10:  selP.bidon10||selP.comodato?.bidon10||0,
          bidon20:  selP.bidon20||selP.comodato?.bidon20||0,
          dispenser:selP.dispenser||selP.comodato?.dispenser||0,
          orden: undefined,
        });
        setSubVista("dia");
      }}
      onEliminar={()=>{eliminar(selP.id);setSubVista("dia");}}
      onVolver={()=>setSubVista("dia")}
    />
  );

  if(subVista==="dia") {
    const lista = porDia(diaActivo);
    return (
      <div style={s.screen}>
        <HeaderApp titulo={`Promoción · ${diaActivo}`} onVolver={()=>setSubVista("menu")}/>
        <div style={{padding:"8px 14px 4px"}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            <span style={s.badge("info")}>{lista.length} prospectos</span>
            {lista.filter(listo).length>0&&<span style={s.badge("success")}>{lista.filter(listo).length} listos ✓</span>}
            <button style={{...s.btn,fontSize:11,padding:"3px 10px",marginLeft:"auto",background:"#185FA5",color:"#e2eaf4",border:"none"}}
              onClick={()=>setSubVista("nuevo")}>+ Nuevo</button>
          </div>
        </div>
        {lista.length===0&&(
          <div style={{textAlign:"center",padding:"40px 20px",color:"var(--color-text-tertiary)",fontSize:14}}>
            No hay prospectos para {diaActivo}.<br/>
            <span style={{fontSize:12}}>Tocá "+ Nuevo" para agregar uno.</span>
          </div>
        )}
        {lista.map(p=>{
          const c=compras(p), s=semanas(p), vhoy=visitadoHoy(p), lst=listo(p);
          const bc=lst?"#4dd9a0":vhoy?"#5daaff":"var(--color-border-tertiary)";
          return (
            <div key={p.id} style={{...s.card,borderLeft:`3px solid ${bc}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",cursor:"pointer"}}
                onClick={()=>{setSelId(p.id);setSubVista("detalle");}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:500,fontSize:14,color:"var(--color-text-primary)"}}>{p.nombre}</div>
                  <div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:2}}>
                    {p.barrio}{p.calle?` · ${p.calle} ${p.nro||""}`:p.manzana?` · Mz ${p.manzana} L ${p.lote}`:""}
                  </div>
                  {p.fechaInicio&&<div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:1}}>Cargado: {new Date(p.fechaInicio).toLocaleDateString("es-AR")}</div>}
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:5}}>
                    <span style={s.tag}>{s} sem.</span>
                    <span style={{...s.tag,color:"#4dd9a0"}}>{c}/4 compras</span>
                    {lst&&<span style={s.badge("success")}>✓ Listo</span>}
                    {vhoy&&<span style={s.badge("info")}>Visitado hoy</span>}
                    {p.comodato&&<span style={s.badge("warning")}>📋 Comodato</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8,marginLeft:10}}>
                  {p.maps&&<a href={p.maps} target="_blank" rel="noreferrer" style={{fontSize:18,textDecoration:"none"}} onClick={e=>e.stopPropagation()}>📍</a>}
                  {p.telefono&&<a href={`https://wa.me/54${p.telefono}`} target="_blank" rel="noreferrer" style={{fontSize:18,textDecoration:"none"}} onClick={e=>e.stopPropagation()}>💬</a>}
                </div>
              </div>
              <div style={{height:5,borderRadius:3,background:"var(--color-background-tertiary)",marginTop:8}}>
                <div style={{height:5,borderRadius:3,background:lst?"#4dd9a0":"#185FA5",width:`${Math.min(100,c/4*100)}%`}}/>
              </div>
              <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:3}}>{lst?"✓ 4 semanas completadas":`${c}/4 semanas de compra`}</div>
              {!vhoy&&(
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <button style={{flex:1,background:"var(--color-background-warning)",color:"var(--color-text-warning)",border:"0.5px solid var(--color-border-warning)",borderRadius:8,padding:"8px 4px",fontSize:12,fontWeight:500,cursor:"pointer"}}
                    onClick={e=>{e.stopPropagation();registrar(p.id,"noesta");}}>No estaba</button>
                  <button style={{flex:1,background:"var(--color-background-danger)",color:"var(--color-text-danger)",border:"0.5px solid var(--color-border-danger)",borderRadius:8,padding:"8px 4px",fontSize:12,fontWeight:500,cursor:"pointer"}}
                    onClick={e=>{e.stopPropagation();registrar(p.id,"noquiso");}}>No quiso</button>
                  <button style={{flex:2,background:"#185FA5",color:"#e2eaf4",border:"none",borderRadius:8,padding:"8px 4px",fontSize:12,fontWeight:600,cursor:"pointer"}}
                    onClick={e=>{e.stopPropagation();registrar(p.id,"compro");}}>✓ Compró</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Menú principal ─────────────────────────────────────────────────────────
  const activos     = prospectos.filter(p=>p.estado==="activo").length;
  const listos      = prospectos.filter(p=>p.listoConvertir&&p.estado==="activo").length;
  const convertidos = prospectos.filter(p=>p.estado==="convertido").length;
  return (
    <div style={s.screen}>
      <HeaderApp titulo="Promoción" onVolver={onVolver}/>
      <div style={{...s.grid3,padding:"10px 14px 8px",gap:6}}>
        <div style={s.metricCard}><div style={s.metricLabel}>En promoción</div><div style={{...s.metricVal,color:"#5daaff"}}>{activos}</div></div>
        <div style={s.metricCard}><div style={s.metricLabel}>Listos ✓</div><div style={{...s.metricVal,color:"#4dd9a0"}}>{listos}</div></div>
        <div style={s.metricCard}><div style={s.metricLabel}>Convertidos</div><div style={s.metricVal}>{convertidos}</div></div>
      </div>
      <div style={{padding:"0 14px 8px"}}>
        <button style={{...s.btn,width:"100%",fontSize:13,background:"#185FA5",color:"#e2eaf4",border:"none"}}
          onClick={()=>setSubVista("nuevo")}>+ Nuevo</button>
      </div>
      {listos>0&&(
        <div style={{...s.card,margin:"0 14px 6px",background:"#0a2e1f",border:"0.5px solid #4dd9a0"}}>
          <div style={{fontSize:13,color:"#4dd9a0",fontWeight:500}}>✓ {listos} listo{listos>1?"s":""} para convertir</div>
          <div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:2}}>Entrá al día para agregarlos como clientes</div>
        </div>
      )}
      <span style={s.sectionTitle}>Seleccionar día</span>
      <div style={{padding:"0 14px",display:"flex",flexDirection:"column",gap:8}}>
        {DIAS.map(d=>{
          const total=porDia(d).length, lst=porDia(d).filter(listo).length;
          return (
            <button key={d} style={{...s.card,margin:0,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px"}}
              onClick={()=>{setDiaActivo(d);setSubVista("dia");}}>
              <div>
                <div style={{fontSize:15,fontWeight:500,color:"var(--color-text-primary)"}}>{d}</div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>{total} prospectos{lst>0?` · ${lst} listos`:""}</div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {lst>0&&<span style={s.badge("success")}>{lst} ✓</span>}
                <span style={{color:"var(--color-text-tertiary)",fontSize:18}}>→</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EditarProspecto({prospecto:p, onGuardar, onVolver}) {
  const [d,setD] = useState({
    nombre:p.nombre||"", dia:p.dia||"Martes",
    barrio:p.barrio||"", sector:p.sector||"",
    manzana:p.manzana||"", lote:p.lote||"",
    calle:p.calle||"", nro:p.nro||"",
    piso:p.piso||"", depto:p.depto||"",
    telefono:p.telefono||"", maps:p.maps||"",
    notas:p.notas||"", dni:p.dni||"",
    foto:p.foto||"", orden:p.orden||"",
    sifon:p.sifon||0, bidon10:p.bidon10||0,
    bidon20:p.bidon20||0, dispenser:p.dispenser||0,
  });
  const s2=(k,v)=>setD(x=>({...x,[k]:v}));
  return (
    <div style={s.screen}>
      <HeaderApp titulo="Editar prospecto" onVolver={onVolver}/>
      <div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
        <div style={s.grid2}>
          <div><label style={s.label}>Día de visita</label>
            <select style={s.select} value={d.dia} onChange={e=>s2("dia",e.target.value)}>
              {DIAS.map(x=><option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div><label style={s.label}>Orden en promoción</label>
            <input style={s.input} type="number" min={1} placeholder="opcional" value={d.orden||""} onChange={e=>s2("orden",e.target.value)} />
          </div>
        </div>
        <div><label style={s.label}>Familia / Nombre *</label><input style={s.input} placeholder="Apellido y nombre" value={d.nombre} onChange={e=>s2("nombre",e.target.value)} /></div>
        <div><label style={s.label}>Barrio</label><input style={s.input} placeholder="Barrio" value={d.barrio} onChange={e=>s2("barrio",e.target.value)} /></div>
        <div style={s.grid3}>
          <div><label style={s.label}>Sector</label><input style={s.input} placeholder="Sec" value={d.sector} onChange={e=>s2("sector",e.target.value)} /></div>
          <div><label style={s.label}>Manzana</label><input style={s.input} placeholder="Mz" value={d.manzana} onChange={e=>s2("manzana",e.target.value)} /></div>
          <div><label style={s.label}>Lote</label><input style={s.input} placeholder="Lote" value={d.lote} onChange={e=>s2("lote",e.target.value)} /></div>
        </div>
        <div style={s.grid2}>
          <div><label style={s.label}>Calle</label><input style={s.input} placeholder="Calle" value={d.calle} onChange={e=>s2("calle",e.target.value)} /></div>
          <div><label style={s.label}>Número</label><input style={s.input} placeholder="Nro" value={d.nro} onChange={e=>s2("nro",e.target.value)} /></div>
        </div>
        <div style={s.grid2}>
          <div><label style={s.label}>Piso</label><input style={s.input} placeholder="—" value={d.piso} onChange={e=>s2("piso",e.target.value)} /></div>
          <div><label style={s.label}>Depto</label><input style={s.input} placeholder="—" value={d.depto} onChange={e=>s2("depto",e.target.value)} /></div>
        </div>
        <div><label style={s.label}>Teléfono (sin 0 ni 15)</label><input style={s.input} placeholder="3816559000" value={d.telefono} onChange={e=>s2("telefono",e.target.value)} /></div>
        <div><label style={s.label}>D.N.I.</label><input style={s.input} placeholder="00.000.000" value={d.dni} onChange={e=>s2("dni",e.target.value)} /></div>
        <div><label style={s.label}>Link Google Maps</label><input style={s.input} placeholder="https://maps.app.goo.gl/..." value={d.maps} onChange={e=>s2("maps",e.target.value)} /></div>
        <div><label style={s.label}>Link foto del domicilio</label><input style={s.input} placeholder="https://..." value={d.foto} onChange={e=>s2("foto",e.target.value)} /></div>
        {d.foto&&<img src={d.foto} alt="Domicilio" style={{width:"100%",borderRadius:8,maxHeight:180,objectFit:"cover"}} />}
        <div><label style={s.label}>Notas</label><input style={s.input} placeholder="timbre roto, perro, deuda..." value={d.notas} onChange={e=>s2("notas",e.target.value)} /></div>
        <span style={{...s.label,fontSize:13,marginTop:4}}>Envases en comodato</span>
        <div style={s.grid3}>
          {[["sifon","Sifón"],["bidon10","10L"],["bidon20","20L"]].map(([k,l])=>(
            <div key={k}><label style={{...s.label,textAlign:"center"}}>{l}</label>
              <input style={{...s.input,textAlign:"center"}} type="number" min={0} value={d[k]||0} onChange={e=>s2(k,Number(e.target.value))} />
            </div>
          ))}
        </div>
        <div>
          <label style={s.label}>Dispenser</label>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button style={{...s.btn,padding:"5px 14px",fontSize:18,lineHeight:1}} onClick={()=>s2("dispenser",Math.max(0,(d.dispenser||0)-1))}>−</button>
            <span style={{fontSize:18,fontWeight:500,minWidth:28,textAlign:"center",color:"var(--color-text-primary)"}}>{d.dispenser||0}</span>
            <button style={{...s.btn,padding:"5px 14px",fontSize:18,lineHeight:1}} onClick={()=>s2("dispenser",(d.dispenser||0)+1)}>+</button>
          </div>
        </div>
        <button style={{...s.btnPrimary,marginTop:6,opacity:!d.nombre?0.45:1}} disabled={!d.nombre} onClick={()=>onGuardar(d)}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}


function EnvasesProspecto({prospecto:p, onActualizar}) {
  const [editando, setEditando] = useState(false);
  const [vals, setVals] = useState({
    sifon: p.sifon||0, bidon10: p.bidon10||0,
    bidon20: p.bidon20||0, dispenser: p.dispenser||0
  });
  const sv = (k,v) => setVals(x=>({...x,[k]:v}));
  const tiene = vals.sifon>0||vals.bidon10>0||vals.bidon20>0||vals.dispenser>0;

  return (
    <div style={{...s.card,marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:editando?10:0}}>
        <div>
          <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>Envases en comodato</div>
          {!editando&&(
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>
              {vals.sifon>0    && <span style={s.tag}>Sifón ×{vals.sifon}</span>}
              {vals.bidon10>0  && <span style={s.tag}>10L ×{vals.bidon10}</span>}
              {vals.bidon20>0  && <span style={s.tag}>20L ×{vals.bidon20}</span>}
              {vals.dispenser>0 && <span style={{...s.tag,color:"#5daaff"}}>Disp ×{vals.dispenser}</span>}
              {!tiene && <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Sin envases cargados</span>}
            </div>
          )}
        </div>
        <button style={{...s.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>{
          if(editando){ onActualizar({sifon:vals.sifon,bidon10:vals.bidon10,bidon20:vals.bidon20,dispenser:vals.dispenser}); }
          setEditando(!editando);
        }}>
          {editando?"Guardar":"Editar"}
        </button>
      </div>
      {editando&&(
        <>
          <div style={s.grid3}>
            {[["sifon","Sifón"],["bidon10","Bidón 10L"],["bidon20","Bidón 20L"]].map(([k,l])=>(
              <div key={k}>
                <label style={{...s.label,textAlign:"center"}}>{l}</label>
                <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"center"}}>
                  <button style={{...s.btn,padding:"3px 10px",fontSize:16,lineHeight:1}} onClick={()=>sv(k,Math.max(0,(vals[k]||0)-1))}>−</button>
                  <span style={{fontSize:16,fontWeight:500,minWidth:24,textAlign:"center",color:"var(--color-text-primary)"}}>{vals[k]||0}</span>
                  <button style={{...s.btn,padding:"3px 10px",fontSize:16,lineHeight:1}} onClick={()=>sv(k,(vals[k]||0)+1)}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:8}}>
            <label style={s.label}>Dispenser</label>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button style={{...s.btn,padding:"4px 14px",fontSize:18,lineHeight:1}} onClick={()=>sv("dispenser",Math.max(0,(vals.dispenser||0)-1))}>−</button>
              <span style={{fontSize:18,fontWeight:500,minWidth:28,textAlign:"center",color:"var(--color-text-primary)"}}>{vals.dispenser||0}</span>
              <button style={{...s.btn,padding:"4px 14px",fontSize:18,lineHeight:1}} onClick={()=>sv("dispenser",(vals.dispenser||0)+1)}>+</button>
              <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>unidades</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


function PromoDetalle({prospecto:p,listo,comprasCount,semanasCount,visitadoHoy,onRegistrar,onComodato,onConvertir,onEliminar,onVolver,onActualizarEnvases,onEditar}) {
  const [editando,setEditando] = useState(false);
  if(editando) return <EditarProspecto prospecto={p} onGuardar={(datos)=>{onEditar(datos);setEditando(false);}} onVolver={()=>setEditando(false)} />;
  return (
    <div style={s.screen}>
      <HeaderApp titulo="Promoción" onVolver={onVolver}/>
      <div style={{background:"var(--color-background-secondary)",borderRadius:10,margin:"8px 14px 0",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
        <span style={{fontSize:15,fontWeight:600,color:"var(--color-text-primary)"}}>{p.nombre}</span>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button style={{...s.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>setEditando(true)}>Editar</button>
          <button style={{...s.btn,fontSize:11,padding:"4px 10px"}} onClick={onComodato}>📋</button>
        </div>
      </div>
      <div style={{padding:14}}>
        <div style={{...s.card,borderLeft:"3px solid #5daaff",marginBottom:10}}>
          <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>
            {p.dia} · {p.fechaInicio&&<span style={{color:"var(--color-text-tertiary)"}}>Desde {new Date(p.fechaInicio).toLocaleDateString("es-AR")} · </span>}
            {p.barrio||""}{p.sector?` Sec ${p.sector}`:""}{p.manzana?` Mz ${p.manzana} L ${p.lote}`:""}
            {p.calle?` · ${p.calle} ${p.nro||""}`:""}{p.piso?` P${p.piso}`:""}{p.depto?` D${p.depto}`:""}
          </div>
          {p.dni&&<div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>DNI: {p.dni}</div>}
          {p.notas&&<div style={{fontSize:12,color:"var(--color-text-warning)",marginTop:4}}>📝 {p.notas}</div>}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            {p.telefono&&<a href={`https://wa.me/54${p.telefono}`} target="_blank" rel="noreferrer" style={{...s.badge("success"),textDecoration:"none"}}>💬 WhatsApp</a>}
            {p.maps&&<a href={p.maps} target="_blank" rel="noreferrer" style={{...s.badge("info"),textDecoration:"none"}}>📍 Maps</a>}
          </div>
        </div>
        <div style={{...s.grid3,marginBottom:10,gap:6}}>
          <div style={s.metricCard}><div style={s.metricLabel}>Semanas</div><div style={s.metricVal}>{semanasCount}</div></div>
          <div style={{...s.metricCard,background:comprasCount>=4?"#0a2e1f":undefined}}>
            <div style={s.metricLabel}>Compras</div>
            <div style={{...s.metricVal,color:comprasCount>=4?"#4dd9a0":"var(--color-text-primary)"}}>{comprasCount}/4</div>
          </div>
          <div style={s.metricCard}><div style={s.metricLabel}>Visitas tot.</div><div style={s.metricVal}>{(p.visitas||[]).length}</div></div>
        </div>
        <div style={{...s.card,marginBottom:10}}>
          <div style={{height:10,borderRadius:5,background:"var(--color-background-tertiary)",marginBottom:6}}>
            <div style={{height:10,borderRadius:5,background:listo?"#4dd9a0":"#185FA5",width:`${Math.min(100,comprasCount/4*100)}%`,transition:"width 0.4s"}}/>
          </div>
          {listo
            ? <div style={{fontSize:13,color:"#4dd9a0",fontWeight:500}}>✓ Completó 4 semanas de compra</div>
            : <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>Faltan {4-comprasCount} compras más</div>}
        </div>
        {/* Envases del prospecto */}
        <EnvasesProspecto
          prospecto={p}
          onActualizar={(cambios)=>{
            onActualizarEnvases(p.id, cambios);
          }}
        />
        {p.comodato&&(
          <div style={{...s.card,marginBottom:10,background:"var(--color-background-tertiary)"}}>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:4,fontWeight:500}}>📋 Comodato entregado · {p.comodato.fecha}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {p.comodato.sifon>0&&<span style={s.tag}>Sifón ×{p.comodato.sifon}</span>}
              {p.comodato.bidon10>0&&<span style={s.tag}>Bidón 10L ×{p.comodato.bidon10}</span>}
              {p.comodato.bidon20>0&&<span style={s.tag}>Bidón 20L ×{p.comodato.bidon20}</span>}
              {p.comodato.dispenser>0&&<span style={s.tag}>Dispenser ×{p.comodato.dispenser}</span>}
            </div>
          </div>
        )}
        {listo&&(
          <button style={{...s.btnPrimary,marginBottom:10,background:"#0F6E56"}}
            onClick={()=>{if(window.confirm(`¿Convertir a ${p.nombre} en cliente regular de ${p.dia}?

El número de orden en la ruta se asigna después desde Gestión de clientes.`))onConvertir();}}>
            ✓ Convertir a cliente regular de {p.dia}
          </button>
        )}
        {!visitadoHoy&&(
          <>
            <span style={{...s.sectionTitle,padding:"0 0 8px"}}>Registrar visita de hoy</span>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
              <button style={{background:"#0a2e1f",color:"#4dd9a0",border:"0.5px solid #4dd9a0",borderRadius:8,padding:"12px 4px",fontSize:12,fontWeight:500,cursor:"pointer"}}
                onClick={()=>onRegistrar("compro")}>✓ Compró</button>
              <button style={{background:"var(--color-background-warning)",color:"var(--color-text-warning)",border:"0.5px solid var(--color-border-warning)",borderRadius:8,padding:"12px 4px",fontSize:12,fontWeight:500,cursor:"pointer"}}
                onClick={()=>onRegistrar("noesta")}>No estaba</button>
              <button style={{...s.btnDanger,padding:"12px 4px",fontSize:12}}
                onClick={()=>onRegistrar("noquiso")}>No quiso</button>
            </div>
          </>
        )}
        {visitadoHoy&&<div style={{...s.badge("info"),display:"inline-block",marginBottom:12,fontSize:12,padding:"6px 12px"}}>✓ Ya visitado hoy</div>}
        <span style={{...s.sectionTitle,padding:"0 0 8px"}}>Historial</span>
        {(p.visitas||[]).length===0&&<p style={{fontSize:13,color:"var(--color-text-tertiary)"}}>Sin visitas aún</p>}
        {[...(p.visitas||[])].reverse().map((v,i)=>(
          <div key={i} style={{...s.card,margin:"0 0 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{v.fecha}</span>
            <span style={v.resultado==="compro"?s.badge("success"):v.resultado==="noquiso"?s.badge("danger"):s.badge("warning")}>
              {v.resultado==="compro"?"✓ Compró":v.resultado==="noquiso"?"No quiso":"No estaba"}
            </span>
          </div>
        ))}
        <div style={{...s.divider,marginTop:16}}/>
        <button style={{...s.btnDanger,width:"100%",padding:"10px"}}
          onClick={()=>{if(window.confirm(`¿Eliminar a ${p.nombre}?`))onEliminar();}}>
          Eliminar prospecto
        </button>
      </div>
    </div>
  );
}

function PromoNuevo({diaInicial,onGuardar,onVolver}) {
  const [d,setD] = useState({
    nombre:"",dia:diaInicial,barrio:"",sector:"",manzana:"",lote:"",
    calle:"",nro:"",piso:"",depto:"",telefono:"",maps:"",notas:"",dni:"",orden:"",
    sifon:0,bidon10:0,bidon20:0,dispenser:0
  });
  const s2=(k,v)=>setD(x=>({...x,[k]:v}));
  return (
    <div style={s.screen}>
      <HeaderApp titulo="Nuevo prospecto" onVolver={onVolver}/>
      <div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
        <div>
          <label style={s.label}>Día de visita</label>
          <select style={s.select} value={d.dia} onChange={e=>s2("dia",e.target.value)}>
            {DIAS.map(x=><option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label style={s.label}>Orden en promoción (opcional)</label>
          <input style={s.input} type="number" min={1} placeholder="solo para ordenar la lista de promoción" value={d.orden||""} onChange={e=>s2("orden",e.target.value)} />
          <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:3}}>El número de ruta se asigna cuando se convierte en cliente regular</div>
        </div>
        <div><label style={s.label}>Familia / Nombre *</label><input style={s.input} placeholder="Apellido y nombre" value={d.nombre} onChange={e=>s2("nombre",e.target.value)} /></div>
        <div><label style={s.label}>Barrio</label><input style={s.input} placeholder="Barrio" value={d.barrio} onChange={e=>s2("barrio",e.target.value)} /></div>
        <div style={s.grid3}>
          <div><label style={s.label}>Sector</label><input style={s.input} placeholder="Sec" value={d.sector} onChange={e=>s2("sector",e.target.value)} /></div>
          <div><label style={s.label}>Manzana</label><input style={s.input} placeholder="Mz" value={d.manzana} onChange={e=>s2("manzana",e.target.value)} /></div>
          <div><label style={s.label}>Lote</label><input style={s.input} placeholder="Lote" value={d.lote} onChange={e=>s2("lote",e.target.value)} /></div>
        </div>
        <div style={s.grid2}>
          <div><label style={s.label}>Calle</label><input style={s.input} placeholder="Calle" value={d.calle} onChange={e=>s2("calle",e.target.value)} /></div>
          <div><label style={s.label}>Número</label><input style={s.input} placeholder="Nro" value={d.nro} onChange={e=>s2("nro",e.target.value)} /></div>
        </div>
        <div style={s.grid2}>
          <div><label style={s.label}>Piso</label><input style={s.input} placeholder="—" value={d.piso} onChange={e=>s2("piso",e.target.value)} /></div>
          <div><label style={s.label}>Depto</label><input style={s.input} placeholder="—" value={d.depto} onChange={e=>s2("depto",e.target.value)} /></div>
        </div>
        <div><label style={s.label}>Teléfono (sin 0 ni 15)</label><input style={s.input} placeholder="3816559000" value={d.telefono} onChange={e=>s2("telefono",e.target.value)} /></div>
        <div><label style={s.label}>D.N.I.</label><input style={s.input} placeholder="00.000.000" value={d.dni} onChange={e=>s2("dni",e.target.value)} /></div>
        <div><label style={s.label}>Link Google Maps</label><input style={s.input} placeholder="https://maps.app.goo.gl/..." value={d.maps} onChange={e=>s2("maps",e.target.value)} /></div>
        <div><label style={s.label}>Notas</label><input style={s.input} placeholder="timbre roto, perro, deuda..." value={d.notas} onChange={e=>s2("notas",e.target.value)} /></div>
        <span style={{...s.label,fontSize:13,marginTop:4}}>Envases entregados en comodato</span>
        <div style={s.grid3}>
          {[["sifon","Sifón"],["bidon10","Bidón 10L"],["bidon20","Bidón 20L"]].map(([k,l])=>(
            <div key={k}>
              <label style={{...s.label,textAlign:"center"}}>{l}</label>
              <input style={{...s.input,textAlign:"center"}} type="number" min={0} value={d[k]||0} onChange={e=>s2(k,Number(e.target.value))} />
            </div>
          ))}
        </div>
        <div>
          <label style={s.label}>Dispenser</label>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button style={{...s.btn,padding:"5px 14px",fontSize:18,lineHeight:1}} onClick={()=>s2("dispenser",Math.max(0,(d.dispenser||0)-1))}>−</button>
            <span style={{fontSize:18,fontWeight:500,minWidth:28,textAlign:"center",color:"var(--color-text-primary)"}}>{d.dispenser||0}</span>
            <button style={{...s.btn,padding:"5px 14px",fontSize:18,lineHeight:1}} onClick={()=>s2("dispenser",(d.dispenser||0)+1)}>+</button>
            <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>unidades</span>
          </div>
        </div>
        <button style={{...s.btnPrimary,marginTop:4,opacity:!d.nombre?0.45:1}} disabled={!d.nombre}
          onClick={()=>onGuardar(d)}>
          Agregar prospecto
        </button>
      </div>
    </div>
  );
}

function PromoComodato({prospecto:p,onGuardar,onVolver}) {
  const [c,setC] = useState(p.comodato||{sifon:0,bidon10:0,bidon20:0,dispenser:0,aclaracion:"",dni:"",piso:"",depto:""});
  const sc=(k,v)=>setC(x=>({...x,[k]:v}));
  return (
    <div style={s.screen}>
      <HeaderApp titulo={`Comodato · ${p.nombre}`} onVolver={onVolver}/>
      <div style={{padding:14}}>
        <div style={{...s.card,textAlign:"center",marginBottom:10,background:"var(--color-background-tertiary)"}}>
          <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>Soda y Agua Tratada Envasada</div>
          <div style={{fontSize:18,fontWeight:500,color:"#5daaff",margin:"4px 0"}}>LA CATALINA</div>
          <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>De Guillermo Carabajal Ponce</div>
          <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",marginTop:6}}>Comodato — Ficha del cliente</div>
        </div>
        <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:10}}>San Miguel de Tucumán: {new Date().toLocaleDateString("es-AR")}</div>
        {[["Familia",p.nombre],["Barrio",p.barrio],["Sec / Mz / Lote",`${p.sector||"—"} / ${p.manzana||"—"} / ${p.lote||"—"}`],["Calle",p.calle?`${p.calle} ${p.nro||""}`:""]]
          .filter(([,v])=>v).map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{l}</span>
            <span style={{fontSize:13,color:"var(--color-text-primary)",fontWeight:500}}>{v}</span>
          </div>
        ))}
        <div style={{...s.grid2,margin:"10px 0"}}>
          <div><label style={s.label}>Piso</label><input style={s.input} placeholder="—" value={c.piso||""} onChange={e=>sc("piso",e.target.value)} /></div>
          <div><label style={s.label}>Depto</label><input style={s.input} placeholder="—" value={c.depto||""} onChange={e=>sc("depto",e.target.value)} /></div>
        </div>
        <div style={s.divider}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0 10px"}}>
          <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>Producto</span>
          <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>Cantidad</span>
        </div>
        {[["sifon","Sifón 1500cc"],["bidon10","Bidón 10 lts."],["bidon20","Bidón 20 lts."],["dispenser","Dispenser"]].map(([k,l])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            <span style={{fontSize:14,color:"var(--color-text-primary)"}}>{l}</span>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button style={{...s.btn,padding:"4px 14px",fontSize:18,lineHeight:1}} onClick={()=>sc(k,Math.max(0,(c[k]||0)-1))}>−</button>
              <span style={{fontSize:18,fontWeight:500,minWidth:30,textAlign:"center",color:"var(--color-text-primary)"}}>{c[k]||0}</span>
              <button style={{...s.btn,padding:"4px 14px",fontSize:18,lineHeight:1}} onClick={()=>sc(k,(c[k]||0)+1)}>+</button>
              <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Unid.</span>
            </div>
          </div>
        ))}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
          <div><label style={s.label}>Aclaración / Firma</label><input style={s.input} placeholder="Nombre en letra de imprenta" value={c.aclaracion||""} onChange={e=>sc("aclaracion",e.target.value)} /></div>
          <div><label style={s.label}>D.N.I.</label><input style={s.input} placeholder="00.000.000" value={c.dni||""} onChange={e=>sc("dni",e.target.value)} /></div>
        </div>
        <div style={{...s.card,margin:"12px 0",background:"var(--color-background-tertiary)"}}>
          <div style={{fontSize:11,color:"var(--color-text-tertiary)",lineHeight:1.6}}>
            El comodato es un contrato por el cual una parte entrega a la otra gratuitamente una especie, mueble o bien raíz, para que haga uso de ella, con cargo de restituir la misma especie después de terminado el uso.
          </div>
        </div>
        <button style={s.btnPrimary} onClick={()=>onGuardar(c)}>Guardar comodato</button>
      </div>
    </div>
  );
}


