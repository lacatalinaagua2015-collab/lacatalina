// ════════════════════════════════════════════════════════════════════
// ◆  06-menu.js — MenuDias, DiaPrincipal, PlanillaDelDia, InicioReparto
// ════════════════════════════════════════════════════════════════════

function MenuDias({dias,onDia,onResumen,onConfig,onGestionClientes,onPromocion,onStock,onAgenda,onVolver,darkMode,onToggleDark,transferenciasPendientes,recordatoriosActivos,onConfirmarRecordatorio,onVerConfirmaciones,clientes,ventas,stock,zonasReparto,onSetZona,onDiaHoy,onDiaResumen,noVisitas,onFiados}) {
  const [editandoZona, setEditandoZona] = React.useState(null);
  const hoyDiaNombre = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][new Date().getDay()];
  const hoyFechaKey = new Date().toISOString().slice(0,10);
  const hoyLabel = new Date().toLocaleDateString("es-AR",{day:"numeric",month:"short"});

  // Calcular si el día de hoy está completo (todos los clientes visitados)
  const clientesHoy = (clientes||[]).filter(c=>c.dia===hoyDiaNombre);
  const ventasHoyIds = new Set((ventas||[]).filter(v=>v.fechaKey===hoyFechaKey).map(v=>v.clienteId));
  const noVisitasHoyIds = new Set((noVisitas||[]).filter(v=>v.fecha===hoyFechaKey).map(v=>v.clienteId));
  const visitadosHoy = clientesHoy.filter(c=>ventasHoyIds.has(c.id)||noVisitasHoyIds.has(c.id));
  const diaCompleto = clientesHoy.length>0 && visitadosHoy.length>=clientesHoy.length;
  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <span style={s.headerTitle}>Reparto Reparto App</span>
        <button style={{...s.btn,padding:"5px 10px",fontSize:18,lineHeight:1}} onClick={onToggleDark}>{darkMode?"☀":"🌙"}</button>
      </div>
      
      
      {recordatoriosActivos&&recordatoriosActivos.length>0&&(
        <div style={{margin:"8px 14px 4px"}}>
          <div style={{fontSize:11,fontWeight:500,color:"#5daaff",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>🔔 Recordatorios pendientes</div>
          {recordatoriosActivos.slice(0,5).map(r=>(
            <div key={r.id} style={{...s.card,margin:"0 0 6px",background:"#1e2e4a",border:"0.5px solid #5daaff",display:"flex",gap:8,alignItems:"flex-start"}}>
              <div style={{flex:1,cursor:"pointer"}} onClick={()=>onAgenda&&onAgenda()}>
                <div style={{fontSize:12,fontWeight:500,color:"#5daaff"}}>{r.clienteNombre} · {r.dia} <span style={{fontSize:10,opacity:0.7}}>→ tocá para ver</span></div>
                <div style={{fontSize:12,color:"var(--color-text-primary)",marginTop:2}}>{r.tipo==="cobro"?"💰":"🏠"} {r.motivo}</div>
                <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:2}}>{r.fecha}{r.hora?` · ${r.hora}`:""}</div>
              </div>
              <button style={{background:"#4dd9a0",color:"#0a2e1f",border:"none",borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0,marginTop:2}}
                onClick={()=>onConfirmarRecordatorio&&onConfirmarRecordatorio(r.id)}>✓</button>
            </div>
          ))}
          {recordatoriosActivos.length>5&&<div style={{fontSize:11,color:"var(--color-text-tertiary)",textAlign:"center"}}>+{recordatoriosActivos.length-5} más</div>}
        </div>
      )}
      {transferenciasPendientes&&transferenciasPendientes.length>0&&(
        <div style={{margin:"8px 14px 4px"}}>
          <div style={{fontSize:11,fontWeight:500,color:"#f5b942",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>🔴 Transferencias sin confirmar</div>
          {transferenciasPendientes.map(({dia,fecha,count,monto,ventas:vts})=>(
            <button key={dia+fecha} style={{...s.card,width:"100%",margin:"0 0 6px",background:"#1e3a5f",border:"1px solid #f5b942",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left"}}
              onClick={()=>onVerConfirmaciones&&onVerConfirmaciones(dia)}>
              <span style={{fontSize:18}}>🔴</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:"#f5b942"}}>{dia} · {count} transfer. sin confirmar</div>
                <div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:2}}>{vts.slice(0,3).map(v=>v.cliente).join(", ")}{vts.length>3?` +${vts.length-3} más`:""}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:13,fontWeight:500,color:"#f5b942"}}>{fmt(monto)}</div>
                <div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{fecha}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      <span style={s.sectionTitle}>Días de reparto</span>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:8}}>
        {dias.map((d,idx)=>{
          const deudas = (clientes||[]).filter(c=>c.dia===d&&c.saldo<0);
          const totalDeuda = deudas.reduce((a,c)=>a+Math.abs(c.saldo),0);
          const totalClientes = (clientes||[]).filter(c=>c.dia===d).length;
          const zona = (zonasReparto||{})[d]||"";
          return (<React.Fragment key={d}>
          <div style={{display:"flex",gap:6,alignItems:"stretch"}}>
            <button style={{...s.card,margin:0,flex:1,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px"}} onClick={()=>onDia(d)}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                <span style={{fontSize:15,fontWeight:500,color:"var(--color-text-primary)"}}>{d}</span>
                {zona&&<>
                  <span style={{fontSize:15,fontWeight:500,color:"var(--color-text-primary)"}}>·</span>
                  <span style={{fontSize:15,fontWeight:500,color:"var(--color-text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{zona}</span>
                </>}
                {!zona&&<span style={{fontSize:12,color:"var(--color-text-tertiary)",fontStyle:"italic",cursor:"pointer"}} onClick={e=>{e.stopPropagation();setEditandoZona(d);}}>+ zona</span>}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                {totalDeuda>0
                  ?<span style={{fontSize:12,color:"var(--color-text-danger)"}}>⚠ {deudas.length} cliente{deudas.length>1?"s":""} {deudas.length>1?"deben":"debe"} {fmt(totalDeuda)}</span>
                  :<span style={{fontSize:12,color:"var(--color-text-success)"}}>✓ Sin deudas</span>
                }
                <span style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{totalClientes} cliente{totalClientes!==1?"s":""}</span>
              </div>
            </div>
            <span style={{color:"var(--color-text-tertiary)",fontSize:18,marginLeft:10}}>→</span>
          </button>
          {d===hoyDiaNombre&&onDiaHoy&&(
            <button
              style={{
                background: diaCompleto ? "#0a5c3a" : "#185FA5",
                borderRadius:12,padding:"8px 10px",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                gap:2,minWidth:56,border: diaCompleto ? "1.5px solid #4dd9a0" : "none",
                cursor:"pointer",flexShrink:0
              }}
              onClick={()=> diaCompleto ? (onDiaResumen&&onDiaResumen(d,hoyFechaKey)) : onDiaHoy(d,hoyFechaKey)}>
              <span style={{fontSize:16}}>{diaCompleto ? "✅" : "📅"}</span>
              <span style={{fontSize:9,color: diaCompleto ? "#4dd9a0" : "#e2eaf4",fontWeight:500,textAlign:"center",lineHeight:1.3}}>
                {diaCompleto ? "Listo" : "Hoy"}
              </span>
              <span style={{fontSize:9,color: diaCompleto ? "#9FE1CB" : "#b5d4f4",lineHeight:1}}>
                {diaCompleto ? `${visitadosHoy.length}/${clientesHoy.length}` : hoyLabel}
              </span>
            </button>
          )}
          </div>
          {editandoZona===d&&(
            <div style={{background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:10,padding:"10px 14px",marginTop:2}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:6}}>Zona de reparto del {d}</div>
              <div style={{display:"flex",gap:8}}>
                <input id={`zona-${d}`} style={s.input} defaultValue={zona} placeholder="Ej: Lomas de Tafí" autoFocus />
                <button style={{...s.btnPrimary,padding:"6px 14px",fontSize:13,whiteSpace:"nowrap"}} onClick={()=>{
                  const v=document.getElementById(`zona-${d}`).value.trim();
                  onSetZona(d,v);
                  setEditandoZona(null);
                }}>OK</button>
                <button style={{...s.btn,padding:"6px 10px",fontSize:13}} onClick={()=>setEditandoZona(null)}>✕</button>
              </div>
            </div>
          )}
          {zona&&editandoZona!==d&&(
            <div style={{textAlign:"right",marginTop:2,marginBottom:2}}>
              <span style={{fontSize:10,color:"var(--color-text-tertiary)",cursor:"pointer",textDecoration:"underline"}} onClick={e=>{e.stopPropagation();setEditandoZona(d);}}>editar zona</span>
            </div>
          )}
          {idx===dias.length-1&&stock&&(
            (()=>{
              const CAJON=6;
              const sCaj=Math.floor((stock.soderia?.sifon||0)/CAJON);
              const cCaj=Math.floor((stock.casa?.sifon||0)/CAJON);
              const sB10=stock.soderia?.bidon10||0, cB10=stock.casa?.bidon10||0;
              const sB20=stock.soderia?.bidon20||0, cB20=stock.casa?.bidon20||0;
              const envC={sifon:0,bidon10:0,bidon20:0};
              (clientes||[]).forEach(c=>{envC.sifon+=(c.sifon||0);envC.bidon10+=(c.bidon10||0);envC.bidon20+=(c.bidon20||0);});
              (ventas||[]).forEach(v=>{
                (v.envPrest||[]).forEach(e=>{const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":null;if(k)envC[k]+=Number(e.cant)||0;});
                (v.envDev||[]).forEach(e=>{const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":null;if(k)envC[k]-=Number(e.cant)||0;});
              });
              const envCCaj=Math.floor(envC.sifon/CAJON);
              const totCaj=sCaj+cCaj+envCCaj, totB10=sB10+cB10+envC.bidon10, totB20=sB20+cB20+envC.bidon20;
              const StockCard = ()=>{
                const [open,setOpen]=React.useState(false);
                return (
                  <div style={{...s.card,margin:"4px 0 0",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)"}}>
                    {/* Header siempre visible — toca para desplegar */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>📦 Stock</span>
                        {/* Resumen compacto siempre visible */}
                        <div style={{display:"flex",gap:6}}>
                          {[[totCaj,"caj"],[totB10,"10L"],[totB20,"20L"]].map(([v,u],i)=>(
                            <span key={i} style={{fontSize:12,fontWeight:600,color:Number(v)<3?"var(--color-text-danger)":Number(v)<8?"var(--color-text-warning)":"var(--color-text-info)"}}>{v}<span style={{fontSize:10,fontWeight:400,color:"var(--color-text-tertiary)",marginLeft:1}}>{u}</span></span>
                          ))}
                        </div>
                      </div>
                      <span style={{fontSize:13,color:"var(--color-text-tertiary)",transition:"transform 0.2s",display:"inline-block",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
                    </div>
                    {/* Detalle desplegable */}
                    {open&&<div style={{marginTop:12}}>
                      {[["🏭 Sodería",[sCaj,sB10,sB20],"primary"],["👥 En clientes",[envCCaj,envC.bidon10,envC.bidon20],"info"],["📦 Total general",[totCaj,totB10,totB20],"info"]].map(([titulo,vals,color],gi)=>(
                        <div key={gi} style={{marginBottom:gi<2?10:0}}>
                          <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>{titulo}</div>
                          <div style={{display:"flex",gap:6}}>
                            {vals.map((v,i)=>(
                              <div key={i} style={{textAlign:"center",flex:1,background:gi===2?"#1e3a5f":"var(--color-background-tertiary)",borderRadius:8,padding:"6px 4px",border:gi===2?"0.5px solid var(--color-border-info)":"none"}}>
                                <div style={{fontSize:18,fontWeight:gi===2?700:600,color:gi===0?(Number(v)<3?"var(--color-text-danger)":Number(v)<8?"var(--color-text-warning)":"var(--color-text-primary)"):`var(--color-text-${color})`}}>{v}</div>
                                <div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{["caj","10L","20L"][i]}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>}
                  </div>
                );
              };
              return <StockCard/>;
            })()
          )}
          </React.Fragment>);
        })}
        <div style={s.divider} />
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,paddingBottom:8}}>
          {[
            ["👥","Clientes",onGestionClientes],
            ["📦","Stock",onStock],
            ["🚀","Promoción",onPromocion],
            ["📅","Agenda",onAgenda],
            ["📊","Resumen",onResumen],
            ["💰","Fiados",onFiados],
            ["⚙️","Config",onConfig],
          ].map(([ico,lbl,fn])=>(
            <button key={lbl} onClick={fn} style={{
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,
              padding:"14px 6px",borderRadius:12,cursor:"pointer",
              border:"2px solid transparent",
              background:"var(--color-background-tertiary)",
              boxShadow:"0 3px 6px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.06) inset",
              color:"var(--color-text-secondary)",
              transition:"all 0.15s",
            }}>
              <span style={{fontSize:22}}>{ico}</span>
              <span style={{fontSize:11,fontWeight:500,color:"var(--color-text-primary)",textAlign:"center"}}>{lbl}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DiaPrincipal({dia,onIrClientes,onIrPlanilla,onVolver,onVerConfirmaciones,ventasPendientesTransfer}) {
  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <span style={s.headerTitle}>{dia}</span>
      </div>
      <div style={{padding:"24px 16px",display:"flex",flexDirection:"column",gap:12}}>
        <button style={{...s.card,margin:0,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 16px"}} onClick={onIrPlanilla}>
          <div>
            <div style={{fontSize:17,fontWeight:500,color:"var(--color-text-primary)"}}>📋 Planilla del día</div>
            <div style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:4}}>Fechas de visita · inicio del reparto · totales</div>
          </div>
          <span style={{color:"var(--color-text-tertiary)",fontSize:20}}>→</span>
        </button>
        {ventasPendientesTransfer>0&&(
          <button style={{...s.card,margin:"0 0 10px",background:"#1e3a5f",border:"1px solid #f5b942",display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",cursor:"pointer"}}
            onClick={()=>(onVerConfirmaciones||onIrClientes)()}>
            <span style={{fontSize:22}}>🔴</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,color:"#f5b942"}}>{ventasPendientesTransfer} transferencia{ventasPendientesTransfer>1?"s":""} sin confirmar</div>
              <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>Tocá para ir a confirmar →</div>
            </div>
            <span style={{color:"#f5b942",fontSize:18}}>→</span>
          </button>
        )}
        <button style={{...s.card,margin:0,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 16px"}} onClick={onIrClientes}>
          <div>
            <div style={{fontSize:17,fontWeight:500,color:"var(--color-text-primary)"}}>👥 Clientes del día</div>
            <div style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:4}}>Registrar entregas y visitas</div>
          </div>
          <span style={{color:"var(--color-text-tertiary)",fontSize:20}}>→</span>
        </button>
      </div>
    </div>
  );
}

function DetalleTransferencias({ventas, ventasPendTrans}) {
  const [abierto, setAbierto] = React.useState(false);
  const pendientes = (ventasPendTrans||[]).length;
  return (
    <div style={{marginTop:8,borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:8}}>
      <button style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"2px 0"}}
        onClick={()=>setAbierto(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:11,color:"var(--color-text-secondary)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em"}}>Detalle de transferencias</span>
          {pendientes>0&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:"var(--color-background-warning)",color:"#f5b942",fontWeight:600}}>🔴 {pendientes} pend.</span>}
        </div>
        <span style={{fontSize:13,color:"var(--color-text-tertiary)",display:"inline-block",transform:abierto?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
      </button>
      {abierto&&(
        <div style={{marginTop:6}}>
          {ventas.map(v=>{
            const confirmada=!!v.transConfirmada;
            return (
              <div key={v.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                <div style={{flex:1}}>
                  <span style={{fontSize:12,color:"var(--color-text-primary)",fontWeight:500}}>{v.cliente}</span>
                  <span style={{marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:4,
                    background:confirmada?"var(--color-background-success)":"var(--color-background-warning)",
                    color:confirmada?"var(--color-text-success)":"#f5b942",fontWeight:600}}>
                    {confirmada?"✅ Confirmada":"🔴 Pendiente"}
                  </span>
                </div>
                <span style={{fontSize:13,fontWeight:500,color:confirmada?"var(--color-text-success)":"#f5b942"}}>{fmt(v.pagadoNum||v.neto||0)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetalleVentasDia({ventas, clientes}) {
  const [abierto, setAbierto] = React.useState(false);
  return (
    <div style={{margin:"0 0 8px",borderRadius:12,overflow:"hidden",border:"1.5px solid #185FA5",background:"var(--color-background-info)"}}>
      <button
        style={{width:"100%",padding:"12px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left"}}
        onClick={()=>setAbierto(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>📋</span>
          <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-info)"}}>Detalle de ventas del día</span>
          <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{ventas.length} venta{ventas.length>1?"s":""}</span>
        </div>
        <span style={{color:"var(--color-text-info)",fontSize:14,display:"inline-block",transform:abierto?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
      </button>
      {abierto&&(
        <div style={{borderTop:"0.5px solid var(--color-border-info)",background:"var(--color-background-primary)"}}>
          {ventas.map((v,idx)=>{
            const pagoBadge={
              contado:{bg:"var(--color-background-success)",color:"var(--color-text-success)",txt:"Contado"},
              transferencia:{bg:v.transConfirmada?"var(--color-background-success)":"var(--color-background-warning)",color:v.transConfirmada?"var(--color-text-success)":"#f5b942",txt:v.transConfirmada?"Transfer. ✅":"Transfer. 🔴"},
              fiado:{bg:"var(--color-background-warning)",color:"var(--color-text-warning)",txt:"Fiado"},
            }[v.pago]||{bg:"var(--color-background-tertiary)",color:"var(--color-text-secondary)",txt:v.pago};
            return (
              <div key={v.id} style={{padding:"10px 16px",borderBottom:idx<ventas.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{v.cliente}</span>
                    <span style={{marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:4,background:pagoBadge.bg,color:pagoBadge.color,fontWeight:600}}>{pagoBadge.txt}</span>
                  </div>
                  <span style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>{fmt(v.neto||0)}</span>
                </div>
                {(v.detalle||[]).map((d,di)=>(
                  <div key={di} style={{display:"flex",justifyContent:"space-between",padding:"2px 0 2px 8px"}}>
                    <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{d.nombre} × {d.cantidad}</span>
                    <span style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{fmt(d.total)}</span>
                  </div>
                ))}
                {(v.saldoAplicado>0||((v.pagadoNum||0)-(v.neto||0))>0)&&(
                  <div style={{display:"flex",gap:10,padding:"3px 0 0 8px",marginTop:2,borderTop:"0.5px solid var(--color-border-tertiary)"}}>
                    {v.saldoAplicado>0&&<span style={{fontSize:11,color:"var(--color-text-success)"}}>Saldo aplicado: −{fmt(v.saldoAplicado)}</span>}
                    {((v.pagadoNum||0)-(v.neto||0))>0&&<span style={{fontSize:11,color:"var(--color-text-success)"}}>Pagó de más: +{fmt((v.pagadoNum||0)-(v.neto||0))}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlanillaDelDia({dia,fecha,ventas,clientes,planilla,productos,stock,setStock,syncData,onGuardar,onVolver}) {
  // Separar ventas del día propio vs ventas de clientes de otro día
  const clientesDia = new Set((clientes||[]).filter(c=>c.dia===dia).map(c=>c.id));
  const ventasPropias  = ventas.filter(v=>clientesDia.has(v.clienteId));
  const ventasExtraDia = ventas.filter(v=>!clientesDia.has(v.clienteId)&&(!v.dia||v.dia===dia)&&v.fechaKey===fecha);
  // Auto-calcular desde ventas del dia
  const CAJON_SODA = 6;
  const getProdCosto = (nombre) => { const p=(productos||[]).find(x=>x.nombre===nombre); return p?(p.costo||0):0; };
  const costSifon  = getProdCosto("Sifón 1.5L") || 133.33;
  const costB10    = getProdCosto("Bidón 10L")   || 800;
  const costB20    = getProdCosto("Bidón 20L")   || 1100;
  const COSTO_CAJON_SODA = costSifon * CAJON_SODA;
  const prodKey = {"Bidón 10L":"b10","Bidón 20L":"b20","Sifón 1.5L":"soda"};
  // Todas las ventas del día (propias + otros días) para envases y plata
  const todasVentasDia = [...ventasPropias,...ventasExtraDia];
  const totalesPorProd = {b10:{vacios:0,plata:0,llenar:0},b20:{vacios:0,plata:0,llenar:0},soda:{vacios:0,plata:0,llenar:0,cajones:0}};
  todasVentasDia.forEach(v=>{ v.detalle.forEach(d=>{ const k=prodKey[d.nombre]; if(!k) return; totalesPorProd[k].vacios+=d.cantidad; totalesPorProd[k].plata+=d.total; }); });
  // Cajones: resto ≤ 3 no suma, resto ≥ 4 suma un cajón más
  const calcCajones = (sifones) => { const full=Math.floor(sifones/CAJON_SODA); return (sifones%CAJON_SODA)>=4 ? full+1 : full; };
  const sodaCajones = calcCajones(totalesPorProd.soda.vacios);
  totalesPorProd.soda.cajones = sodaCajones;
  totalesPorProd.soda.llenar  = sodaCajones * COSTO_CAJON_SODA;
  totalesPorProd.b10.llenar   = totalesPorProd.b10.vacios * costB10;
  totalesPorProd.b20.llenar   = totalesPorProd.b20.vacios * costB20;
  // Peso desde la CARGA INICIAL del día (lo que salió en el camión — dato de la planilla)
  const sifonesCargados = Number(planilla?.productos?.soda?.llenos||0);
  const b10Cargados     = Number(planilla?.productos?.b10?.llenos||0);
  const b20Cargados     = Number(planilla?.productos?.b20?.llenos||0);
  const cajonesCargados = calcCajones(sifonesCargados);
  const pesoAuto   = cajonesCargados * 13 + b10Cargados * 10 + b20Cargados * 20;
  // Bultos = cajones vendidos + bidones vendidos (con la misma regla de cajones)
  const bultosAuto = cajonesCargados + b10Cargados + b20Cargados;
  const totalVentaPlata  = Object.values(totalesPorProd).reduce((a,p)=>a+p.plata,0);
  const totalVentaLlenar = Object.values(totalesPorProd).reduce((a,p)=>a+p.llenar,0);
  // Totales ventas de otros días
  const extraEfectivo = ventasExtraDia.filter(v=>v.pago==="contado").reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
  const extraTrans    = ventasExtraDia.filter(v=>v.pago==="transferencia").reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
  const extraFiado    = ventasExtraDia.filter(v=>v.pago==="fiado").reduce((a,v)=>a+(v.neto||0),0);
  const extraTotal    = extraEfectivo + extraTrans + extraFiado;
  // Cobranza — todas las ventas del día (propias + otros días)
  const cobEfectivo   = todasVentasDia.filter(v=>v.pago==="contado").reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
  const cobTransBruto = todasVentasDia.filter(v=>v.pago==="transferencia").reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
  const cobTransDesc  = Math.round(cobTransBruto*0.025);
  const cobTransNeto  = cobTransBruto - cobTransDesc;
  const ventasPendTrans = ventas.filter(v=>v.pago==="transferencia"&&!v.transConfirmada);
  const cobFiado      = todasVentasDia.filter(v=>v.pago==="fiado").reduce((a,v)=>a+(v.neto||0),0);
  const cobSaldosEfec  = todasVentasDia.filter(v=>v.pago==="contado").reduce((a,v)=>{ const extra=(v.pagadoNum||0)-(v.neto||0); return a+(extra>0?extra:0); },0);
  const cobSaldosTrans = todasVentasDia.filter(v=>v.pago==="transferencia").reduce((a,v)=>{ const extra=(v.pagadoNum||0)-(v.neto||0); return a+(extra>0?extra:0); },0);
  const cobSaldos      = cobSaldosEfec + cobSaldosTrans;
  const fiadoNeto      = cobFiado - cobSaldos;

  const [datos,setDatos] = useState(()=>({
    ...planilla,
    peso:        planilla.peso        || (pesoAuto>0 ? String(pesoAuto) : ""),
    bultos:      planilla.bultos      || (bultosAuto>0 ? String(bultosAuto) : ""),
    efectivo:    planilla.efectivo    || (cobEfectivo>0   ? String(Math.round(cobEfectivo))   : ""),
    fiado:       planilla.fiado       || (cobFiado>0      ? String(Math.round(cobFiado))      : ""),
    retenciones: planilla.retenciones || (cobTransDesc>0  ? String(cobTransDesc)              : ""),
  }));
  const set = (k,v) => setDatos(d=>({...d,[k]:v}));
  const yaCerrado = !!planilla._diaCerrado;
  const [mostrarCierre,setMostrarCierre] = useState(false);
  const [realesLlenos,setRealesLlenos] = useState({soda:"",b10:"",b20:""});
  const [realesVacios,setRealesVacios] = useState({soda:"",b10:"",b20:""});

  // ── Cálculo de stock para el cierre del día ──────────────────
  const CAJON = 6;
  const planKeyToSk = {soda:"sifon",b10:"bidon10",b20:"bidon20"};
  const llenosCargados = {
    soda: Number(datos.productos?.soda?.llenos||0),
    b10:  Number(datos.productos?.b10?.llenos||0),
    b20:  Number(datos.productos?.b20?.llenos||0),
  };
  const vendidosDia={soda:0,b10:0,b20:0};
  const prestadosDia={soda:0,b10:0,b20:0};
  const devueltosDia={soda:0,b10:0,b20:0};
  const prodKeyPl={"Sifón 1.5L":"soda","Bidón 10L":"b10","Bidón 20L":"b20"};
  ventas.forEach(v=>{
    v.detalle.forEach(d=>{const k=prodKeyPl[d.nombre];if(k)vendidosDia[k]+=d.cantidad;});
    (v.envPrest||[]).forEach(e=>{const k=prodKeyPl[e.prod];if(k)prestadosDia[k]+=Number(e.cant)||0;});
    (v.envDev||[]).forEach(e=>{const k=prodKeyPl[e.prod];if(k)devueltosDia[k]+=Number(e.cant)||0;});
  });
  // FÓRMULA CORRECTA:
  // Sobrantes llenos = cargados − vendidos (prestados no reducen llenos, se compensan con devueltos)
  // Vacíos del día = vendidos + devueltos − prestados (los prestados de hoy cancelan devueltos de hoy)
  const sobrantes={soda:0,b10:0,b20:0};
  const vaciosRec={soda:0,b10:0,b20:0};
  ["soda","b10","b20"].forEach(pk=>{
    sobrantes[pk]=Math.max(0,llenosCargados[pk]-vendidosDia[pk]);
    vaciosRec[pk]=Math.max(0,vendidosDia[pk]+devueltosDia[pk]-prestadosDia[pk]);
  });
  // Sodería después del cierre
  const soderiaActual = stock?.soderia||{sifon:0,bidon10:0,bidon20:0};
  const soderiaVaciosActual = stock?.soderia_vacios||{sifon:0,bidon10:0,bidon20:0};
  const soderiaPost={soda:0,b10:0,b20:0};
  const soderiaVaciosPost={soda:0,b10:0,b20:0};
  ["soda","b10","b20"].forEach(pk=>{
    const sk=planKeyToSk[pk];
    soderiaPost[pk]=(soderiaActual[sk]||0)+sobrantes[pk];
    soderiaVaciosPost[pk]=(soderiaVaciosActual[sk]||0)+vaciosRec[pk];
  });

  const confirmarCierre = () => {
    // Usar valores reales si el usuario los modificó, si no usar los calculados
    const llenVuelta={soda:0,b10:0,b20:0};
    const vacVuelta={soda:0,b10:0,b20:0};
    const planKeyToSkL={"soda":"sifon","b10":"bidon10","b20":"bidon20"};
    ["soda","b10","b20"].forEach(pk=>{
      const calcL=pk==="soda"?sobrantes[pk]:sobrantes[pk];
      const calcV=vaciosRec[pk];
      llenVuelta[pk]=realesLlenos[pk]!==""?Number(realesLlenos[pk])*(pk==="soda"?CAJON:1):calcL;
      vacVuelta[pk]=realesVacios[pk]!==""?Number(realesVacios[pk])*(pk==="soda"?CAJON:1):calcV;
    });
    // Registrar diferencias para auditoría
    const diffs={};
    ["soda","b10","b20"].forEach(pk=>{
      const dl=llenVuelta[pk]-sobrantes[pk];
      const dv=vacVuelta[pk]-vaciosRec[pk];
      if(dl!==0||dv!==0) diffs[pk]={llenos:dl,vacios:dv};
    });
    setStock(prev=>{
      const s=JSON.parse(JSON.stringify(prev||{}));
      if(!s.soderia) s.soderia={sifon:0,bidon10:0,bidon20:0};
      if(!s.soderia_vacios) s.soderia_vacios={sifon:0,bidon10:0,bidon20:0};
      ["soda","b10","b20"].forEach(pk=>{
        const sk=planKeyToSkL[pk];
        s.soderia[sk]=(s.soderia[sk]||0)+llenVuelta[pk];
        s.soderia_vacios[sk]=(s.soderia_vacios[sk]||0)+vacVuelta[pk];
      });
      s.camion={sifon:0,bidon10:0,bidon20:0};
      syncData&&syncData({stock:s});
      return s;
    });
    onGuardar({...datos,_diaCerrado:true,_stockActualizado:true,_cierreDiffs:Object.keys(diffs).length>0?diffs:null});
    setMostrarCierre(false);
  };
  const setProd=(pid,campo,v)=>setDatos(d=>({...d,productos:{...d.productos,[pid]:{...d.productos[pid],[campo]:v}}}));
  const setGasto=(i,campo,v)=>{const g=[...(datos.gastos||[])];g[i]={...g[i],[campo]:v};setDatos(d=>({...d,gastos:g}));};
  const addGasto=()=>setDatos(d=>({...d,gastos:[...(d.gastos||[]),{cat:"propina",monto:""}]}));
  const delGasto=(i)=>setDatos(d=>({...d,gastos:d.gastos.filter((_,j)=>j!==i)}));

  const totalGastos=(datos.gastos||[]).filter(g=>g.confirmado).reduce((a,g)=>a+num(g.monto),0);
  const efectivo=num(datos.efectivo), fiado=num(datos.fiado), retenciones=num(datos.retenciones);
  const sobrante=efectivo-(totalVentaPlata-fiado); // retenciones es informativo, no afecta el sobrante
  const ganancia=(cobEfectivo - totalVentaLlenar - totalGastos) + cobTransNeto;
  const totalLlenosIngresados=PRODUCTOS_CONFIG.reduce((a,p)=>a+num(datos.productos[p.id]?.llenos),0);

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <span style={s.headerTitle}>Planilla · {dia}</span>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
          <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{fecha}</span>
          {planilla._autoGuardado&&<span style={{fontSize:10,color:"#4dd9a0",fontWeight:500}}>✓ Auto-guardado</span>}
          {planilla._stockActualizado&&<span style={{fontSize:10,color:"var(--color-text-info)",fontWeight:500}}>📦 Stock actualizado</span>}
        </div>
      </div>
      <div style={{padding:16}}>

        {/* Datos de salida — ingreso manual */}
        <span style={{...s.sectionTitle,padding:"0 0 8px"}}>Al salir a repartir</span>
        <div style={s.grid3}>
          {[["fecha","Fecha","text"],["peso","Peso kg","number"],["bultos","Bultos","number"]].map(([k,l,t])=>(
            <div key={k}><label style={s.label}>{l}</label>
              <input style={s.inputNum} type={t} placeholder={t==="text"?"dd/mm/aaaa":"0"} value={datos[k]||""} onChange={e=>set(k,e.target.value)} />
            </div>
          ))}
        </div>
        {/* Desglose de peso y bultos */}
        {(pesoAuto>0||bultosAuto>0)&&(
          <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:10,lineHeight:1.7,background:"var(--color-background-tertiary)",borderRadius:8,padding:"6px 10px"}}>
            {bultosAuto>0&&<div>📦 <b>Bultos auto:</b> {cajonesCargados||cajonesLlenos||0} cajones soda + {b10Cargados||b10Llenos||0} bid.10L + {b20Cargados||b20Llenos||0} bid.20L = <b>{bultosAuto}</b></div>}
            {pesoAuto>0&&<div>⚖️ <b>Peso auto:</b> {cajonesCargados||cajonesLlenos||0}×13kg + {b10Cargados||b10Llenos||0}×10kg + {b20Cargados||b20Llenos||0}×20kg = <b>{pesoAuto} kg</b></div>}
          </div>
        )}

        {/* Llenos — ingreso manual, vacios/plata/llenar auto desde ventas */}
        <span style={{...s.sectionTitle,padding:"12px 0 8px"}}>Envases cargados (solo ingresá los llenos)</span>
        <div style={{background:"var(--color-background-secondary)",borderRadius:10,overflow:"hidden",marginBottom:4}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",padding:"6px 10px",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            {["Producto","Llenos","Vacíos","Plata","Llenar"].map(h=><div key={h} style={{fontSize:11,color:"var(--color-text-secondary)",fontWeight:500,textAlign:h==="Producto"?"left":"right"}}>{h}</div>)}
          </div>
          {PRODUCTOS_CONFIG.map(p=>{
            const auto=totalesPorProd[p.id];
            const esSoda = p.id==="soda";
            return (
              <div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",padding:"6px 10px",borderBottom:"0.5px solid var(--color-border-tertiary)",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-primary)"}}>{p.nombre}</div>
                  {esSoda&&auto.cajones>0&&<div style={{fontSize:10,color:"#f5b942"}}>{auto.cajones} caj. ({auto.vacios} un.)</div>}
                </div>
                <div>
                  <input type="number" style={{...s.inputNum,width:"100%",fontSize:13}} value={datos.productos[p.id]?.llenos||""} onChange={e=>setProd(p.id,"llenos",e.target.value)} placeholder="0" />
                  {esSoda&&datos.productos[p.id]?.llenos>0&&<div style={{fontSize:10,color:"var(--color-text-tertiary)",textAlign:"right"}}>{Math.floor((datos.productos[p.id]?.llenos||0)/6)} caj.</div>}
                </div>
                <div style={{textAlign:"right",fontSize:13,color:"var(--color-text-secondary)"}}>{esSoda?`${auto.cajones||"—"} caj`:(auto.vacios||"—")}</div>
                <div style={{textAlign:"right",fontSize:13,color:"var(--color-text-primary)"}}>{auto.plata?fmt(auto.plata).replace("$",""):"—"}</div>
                <div style={{textAlign:"right",fontSize:13,color:"var(--color-text-danger)"}}>{auto.llenar?fmt(auto.llenar).replace("$",""):"—"}</div>
              </div>
            );
          })}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",padding:"8px 10px",background:"var(--color-background-tertiary)"}}>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Totales</div>
            <div style={{textAlign:"right",fontSize:12,fontWeight:500,color:"var(--color-text-primary)"}}>{totalLlenosIngresados||"—"}</div>
            <div style={{textAlign:"right",fontSize:12,fontWeight:500,color:"var(--color-text-primary)"}}>{Object.values(totalesPorProd).reduce((a,p)=>a+p.vacios,0)||"—"}</div>
            <div style={{textAlign:"right",fontSize:12,fontWeight:500,color:"var(--color-text-primary)"}}>{totalVentaPlata?fmt(totalVentaPlata).replace("$",""):"—"}</div>
            <div style={{textAlign:"right",fontSize:12,fontWeight:500,color:"var(--color-text-danger)"}}>{totalVentaLlenar?fmt(totalVentaLlenar).replace("$",""):"—"}</div>
          </div>
        </div>
        <p style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:12}}>Vacíos, plata y llenar se calculan automáticamente desde las ventas del día.</p>

        {/* Gastos extras */}
        <div style={s.divider} />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:11,color:"var(--color-text-secondary)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.06em"}}>Gastos extras (efectivo)</span>
          <button style={{...s.btn,fontSize:12,padding:"4px 12px"}} onClick={addGasto}>+ Agregar</button>
        </div>
        {(datos.gastos||[]).length===0&&<p style={{fontSize:13,color:"var(--color-text-tertiary)",marginBottom:8}}>Sin gastos extras</p>}
        {(datos.gastos||[]).map((g,i)=>(
          g.confirmado
          ? <div key={i} style={{...s.card,margin:"0 0 6px",background:"var(--color-background-tertiary)",borderLeft:"3px solid #4dd9a0",padding:"10px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{g.cat.charAt(0).toUpperCase()+g.cat.slice(1)}{g.desc?` · ${g.desc}`:""}</div>
                  <div style={{fontSize:12,color:"var(--color-text-danger)",marginTop:2}}>−{fmt(num(g.monto))}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button style={{...s.btn,fontSize:11,padding:"3px 10px"}} onClick={()=>setGasto(i,"confirmado",false)}>Editar</button>
                  <button style={s.btnDanger} onClick={()=>delGasto(i)}>✕</button>
                </div>
              </div>
            </div>
          : <div key={i} style={{...s.card,margin:"0 0 6px",padding:"10px 12px"}}>
              <div style={{display:"flex",gap:6,marginBottom:6}}>
                <select style={{...s.select,flex:1}} value={g.cat} onChange={e=>setGasto(i,"cat",e.target.value)}>
                  {GASTOS_CATEGORIAS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
                <input style={{...s.inputNum,flex:1}} type="number" placeholder="Monto $" value={g.monto||""} onChange={e=>setGasto(i,"monto",e.target.value)} />
              </div>
              <input style={{...s.input,marginBottom:6}} placeholder="Descripción (opcional)" value={g.desc||""} onChange={e=>setGasto(i,"desc",e.target.value)} />
              <div style={{display:"flex",gap:6}}>
                <button style={{flex:1,padding:"7px",borderRadius:8,border:"none",background:"#0a2e1f",color:"#4dd9a0",fontSize:12,fontWeight:500,cursor:"pointer",opacity:!g.monto?0.5:1}}
                  disabled={!g.monto}
                  onClick={()=>setGasto(i,"confirmado",true)}>
                  ✓ Confirmar y guardar
                </button>
                <button style={s.btnDanger} onClick={()=>delGasto(i)}>✕</button>
              </div>
            </div>
        ))}
        {totalGastos>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderTop:"0.5px solid var(--color-border-tertiary)",marginBottom:8}}>
          <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>Total gastos extras</span>
          <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-danger)"}}>−{fmt(totalGastos)}</span>
        </div>}

        {/* Cobranza */}
        <div style={s.divider} />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0 8px"}}>
          <span style={{fontSize:10,color:"var(--color-text-tertiary)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.07em"}}>Cobranza del día</span>
          <button style={{...s.btn,fontSize:11,padding:"3px 10px"}}
            onClick={()=>setDatos(d=>({...d,
              peso:String(pesoAuto||d.peso||""),
              bultos:String(bultosAuto||d.bultos||""),
              efectivo:String(Math.round(cobEfectivo)),
              retenciones:String(cobTransDesc),
              fiado:String(Math.round(cobFiado))
            }))}>
            ↻ Autocompletar desde ventas
          </button>
        </div>
        <div style={s.grid3}>
          {[["efectivo","Efectivo"],["fiado","Fiado"],["retenciones","Retención 2.5%"]].map(([k,l])=>(
            <div key={k}><label style={{...s.label,textAlign:"center"}}>{l}</label>
              <input style={{...s.inputNum,textAlign:"center"}} type="number" placeholder="0" value={datos[k]||""} onChange={e=>set(k,e.target.value)} />
            </div>
          ))}
        </div>
        {/* Desglose de transferencias */}
        {cobTransBruto>0&&(
          <div style={{...s.card,margin:"10px 0",background:"var(--color-background-tertiary)"}}>
            <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8}}>Detalle transferencias</div>
            {[["Monto bruto",fmt(cobTransBruto),"primary"],["Retención 2.5%",`−${fmt(cobTransDesc)}`,"danger"],["Neto recibido",fmt(cobTransNeto),"success"]].map(([l,v,c])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{l}</span>
                <span style={{fontSize:13,fontWeight:500,color:`var(--color-text-${c})`}}>{v}</span>
              </div>
            ))}
          </div>
        )}
        {cobSaldos>0&&(
          <div style={{...s.card,margin:"0 0 10px",background:"var(--color-background-tertiary)"}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Cobrado de deuda anterior</span>
              <span style={{fontSize:13,fontWeight:500,color:"#4dd9a0"}}>{fmt(cobSaldos)}</span>
            </div>
          </div>
        )}
        <div style={{marginTop:12}}>
          <label style={s.label}>Observaciones</label>
          <textarea style={{...s.input,minHeight:56,resize:"vertical"}} placeholder="Notas del día..." value={datos.obs||""} onChange={e=>set("obs",e.target.value)} />
        </div>

        {/* Resumen */}
        <div style={s.divider} />
        <span style={{...s.sectionTitle,padding:"0 0 10px"}}>Resumen del día</span>

        {/* Detalle de ventas — primero y abierto por defecto */}
        {todasVentasDia.length>0
          ? <DetalleVentasDia ventas={todasVentasDia} clientes={clientes} />
          : <div style={{...s.card,margin:"0 0 8px",padding:"12px 16px",background:"var(--color-background-tertiary)"}}>
              <span style={{fontSize:13,color:"var(--color-text-tertiary)"}}>📋 Sin ventas registradas para este día</span>
            </div>
        }

        {/* Ventas del día */}
        <div style={{...s.card,margin:"0 0 8px",background:"var(--color-background-secondary)",padding:"14px 16px"}}>
          <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Ventas registradas</div>
          {[
            ["Contado (efectivo)", fmt(cobEfectivo), "primary"],
            ["Transferencias",     fmt(cobTransBruto), "info"],
            ["Fiado del día",      fmt(cobFiado), "warning"],
          ].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>{l}</span>
              <span style={{fontSize:13,fontWeight:500,color:`var(--color-text-${c})`}}>{v}</span>
            </div>
          ))}
          {/* Cobros de deuda — separados por forma de pago */}
          {cobSaldosEfec>0&&(
            <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>+ Cobro deuda · efectivo</span>
              <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-success)"}}>{fmt(cobSaldosEfec)}</span>
            </div>
          )}
          {cobSaldosTrans>0&&(
            <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>+ Cobro deuda · transferencia</span>
              <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-info)"}}>{fmt(cobSaldosTrans)}</span>
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 2px"}}>
            <span style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>Total cobrado</span>
            <span style={{fontSize:16,fontWeight:500,color:"var(--color-text-primary)"}}>{fmt(cobEfectivo+cobTransBruto+cobSaldos)}</span>
          </div>
        </div>

        {/* Ventas de clientes de otros días */}
        {ventasExtraDia.length>0&&(
          <div style={{...s.card,margin:"0 0 8px",background:"var(--color-background-secondary)",padding:"14px 16px",borderLeft:"3px solid var(--color-border-info)"}}>
            <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-info)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>📦 Ventas de otros días ({ventasExtraDia.length})</div>
            {ventasExtraDia.map(v=>{
              const c=(clientes||[]).find(x=>x.id===v.clienteId);
              return (
                <div key={v.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                  <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{c?.nombre||"Cliente"} <span style={{color:"var(--color-text-tertiary)"}}>· {c?.dia}</span></span>
                  <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-info)"}}>{fmt(v.pagadoNum||v.neto||0)}</span>
                </div>
              );
            })}
            {extraEfectivo>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Contado</span><span style={{fontSize:11,color:"var(--color-text-primary)"}}>{fmt(extraEfectivo)}</span></div>}
            {extraTrans>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Transfer.</span><span style={{fontSize:11,color:"var(--color-text-info)"}}>{fmt(extraTrans)}</span></div>}
            {extraFiado>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Fiado</span><span style={{fontSize:11,color:"var(--color-text-warning)"}}>{fmt(extraFiado)}</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 2px"}}>
              <span style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>Total otros días</span>
              <span style={{fontSize:16,fontWeight:500,color:"var(--color-text-info)"}}>{fmt(extraTotal)}</span>
            </div>
          </div>
        )}
        <div style={{...s.card,margin:"0 0 8px",padding:"14px 16px"}}>
          <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Efectivo en mano</div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>Efectivo cobrado (contado)</span>
            <span style={{fontSize:13,color:"var(--color-text-primary)"}}>{fmt(cobEfectivo)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            <span style={{fontSize:13,color:"var(--color-text-danger)"}}>− Llenado de envases</span>
            <span style={{fontSize:13,color:"var(--color-text-danger)"}}>{fmt(totalVentaLlenar)}</span>
          </div>
          {totalGastos>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            <span style={{fontSize:13,color:"var(--color-text-danger)"}}>− Gastos extras</span>
            <span style={{fontSize:13,color:"var(--color-text-danger)"}}>{fmt(totalGastos)}</span>
          </div>}
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 2px"}}>
            <span style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>Efectivo en mano</span>
            <span style={{fontSize:18,fontWeight:500,color:(cobEfectivo-totalVentaLlenar-totalGastos)>=0?"var(--color-text-success)":"var(--color-text-danger)"}}>{fmt(cobEfectivo-totalVentaLlenar-totalGastos)}</span>
          </div>
        </div>

        {/* Transferencias */}
        {cobTransBruto>0&&(
          <div style={{...s.card,margin:"0 0 8px",padding:"14px 16px"}}>
            <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Transferencias</div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>Monto total</span>
              <span style={{fontSize:13,color:"var(--color-text-primary)"}}>{fmt(cobTransBruto)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <span style={{fontSize:12,color:"var(--color-text-tertiary)"}}>Retención 2.5% (informativo)</span>
              <span style={{fontSize:12,color:"var(--color-text-danger)"}}>−{fmt(cobTransDesc)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0 2px"}}>
              <span style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>Neto a acreditar</span>
              <span style={{fontSize:16,fontWeight:500,color:"var(--color-text-info)"}}>{fmt(cobTransNeto)}</span>
            </div>
            {/* Todas las transferencias del día — colapsable */}
            {(()=>{
              const transDelDia = todasVentasDia.filter(v=>v.pago==="transferencia");
              if(!transDelDia.length) return null;
              return <DetalleTransferencias ventas={transDelDia} ventasPendTrans={ventasPendTrans} />;
            })()}
          </div>
        )}

        {/* Fiado */}
        <div style={{...s.card,margin:"0 0 8px",padding:"14px 16px"}}>
          <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Fiado pendiente</div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>Fiado del día</span>
            <span style={{fontSize:13,color:"var(--color-text-primary)"}}>{fmt(cobFiado)}</span>
          </div>
          {cobSaldos>0&&(
            <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>− Cobros de saldos anteriores</span>
              <span style={{fontSize:13,color:"var(--color-text-success)"}}>−{fmt(cobSaldos)}</span>
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0 2px"}}>
            <span style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>Fiado neto pendiente</span>
            <span style={{fontSize:16,fontWeight:500,color:fiadoNeto>0?"var(--color-text-warning)":"var(--color-text-success)"}}>{fmt(Math.abs(fiadoNeto))}{fiadoNeto<0?" (a favor)":""}</span>
          </div>
        </div>

        {/* Ganancia */}
        <div style={{...s.card,margin:"0 0 16px",padding:"14px 16px",background:"var(--color-background-secondary)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>Ganancia neta del día</div>
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>Efectivo en mano + Transferencias netas</div>
            </div>
            <span style={{fontSize:22,fontWeight:500,color:ganancia>=0?"var(--color-text-success)":"var(--color-text-danger)"}}>{fmt(ganancia)}</span>
          </div>
        </div>
        <button style={s.btnPrimary} onClick={()=>onGuardar(datos)}>Guardar planilla</button>

        {/* Botón cerrar día */}
        {!yaCerrado ? (
          <button style={{width:"100%",padding:"14px",borderRadius:10,border:"2px solid #f5b942",background:"#2e1f06",color:"#f5b942",fontSize:15,fontWeight:600,cursor:"pointer",marginTop:10}}
            onClick={()=>setMostrarCierre(true)}>
            🔒 Cerrar el día y actualizar stock
          </button>
        ) : (
          <div style={{textAlign:"center",padding:"12px",borderRadius:10,background:"rgba(29,158,117,0.15)",color:"#4dd9a0",fontSize:13,fontWeight:500,marginTop:10}}>
            ✅ Día cerrado — stock actualizado
          </div>
        )}

        {/* Modal cierre del día — verificación de stock */}
        {mostrarCierre&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:999,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
            onClick={()=>setMostrarCierre(false)}>
            <div style={{background:"var(--color-background-primary)",borderRadius:"16px 16px 0 0",padding:"20px",width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto"}}
              onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:17,fontWeight:700,color:"var(--color-text-primary)",marginBottom:4}}>🔒 Cerrar el día — Verificación de stock</div>
              <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:14,lineHeight:1.5}}>
                Al confirmar, los envases vuelven a la sodería y el camión queda en 0.
              </div>

              {/* Tabla de envases */}
              <div style={{background:"var(--color-background-secondary)",borderRadius:10,overflow:"hidden",marginBottom:12}}>
                {/* Header */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"8px 12px",background:"var(--color-background-tertiary)"}}>
                  {["","Soda (caj)","10L","20L"].map((h,i)=>(
                    <div key={i} style={{fontSize:10,fontWeight:600,color:"var(--color-text-secondary)",textAlign:i===0?"left":"center",textTransform:"uppercase"}}>{h}</div>
                  ))}
                </div>
                {/* Cargado */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"8px 12px",borderBottom:"0.5px solid var(--color-border-tertiary)",alignItems:"center"}}>
                  <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>🚚 Cargado</div>
                  {["soda","b10","b20"].map(pk=>(
                    <div key={pk} style={{textAlign:"center",fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>
                      {pk==="soda"?Math.floor(llenosCargados[pk]/CAJON):llenosCargados[pk]}
                    </div>
                  ))}
                </div>
                {/* Vendido */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"8px 12px",borderBottom:"0.5px solid var(--color-border-tertiary)",alignItems:"center"}}>
                  <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>📦 Vendido</div>
                  {["soda","b10","b20"].map(pk=>(
                    <div key={pk} style={{textAlign:"center",fontSize:14,fontWeight:500,color:"var(--color-text-warning)"}}>
                      {pk==="soda"?Math.floor(vendidosDia[pk]/CAJON):vendidosDia[pk]}
                    </div>
                  ))}
                </div>
                {/* Divider */}
                <div style={{padding:"6px 12px",background:"rgba(77,217,160,0.05)",borderTop:"1px solid rgba(77,217,160,0.2)"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#4dd9a0",textTransform:"uppercase",letterSpacing:"0.05em"}}>Vuelve a sodería</div>
                </div>
                {/* Llenos sobrantes — confirmá o corregí */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"8px 12px",borderBottom:"0.5px solid var(--color-border-tertiary)",alignItems:"center",gap:4}}>
                  <div style={{fontSize:12,color:"#4dd9a0",fontWeight:500}}>✅ Llenos</div>
                  {["soda","b10","b20"].map(pk=>{
                    const calc=pk==="soda"?Math.floor(sobrantes[pk]/CAJON):sobrantes[pk];
                    const real=realesLlenos[pk]!==""?Number(realesLlenos[pk]):calc;
                    const diff=real-calc;
                    return (
                      <div key={pk} style={{textAlign:"center"}}>
                        <div style={{fontSize:11,color:"#4dd9a0",marginBottom:2}}>App: {calc}</div>
                        <input type="number" min={0} value={realesLlenos[pk]}
                          placeholder={String(calc)}
                          style={{width:"100%",padding:"4px",borderRadius:6,border:"0.5px solid #4dd9a0",background:"var(--color-background-tertiary)",color:"var(--color-text-primary)",fontSize:14,textAlign:"center"}}
                          onChange={e=>setRealesLlenos(r=>({...r,[pk]:e.target.value}))}/>
                        {diff!==0&&<div style={{fontSize:10,color:diff>0?"var(--color-text-warning)":"var(--color-text-danger)",marginTop:1}}>{diff>0?"+":""}{diff}</div>}
                      </div>
                    );
                  })}
                </div>
                {/* Vacíos del día — confirmá o corregí */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"8px 12px",alignItems:"center",gap:4}}>
                  <div style={{fontSize:12,color:"#f5b942",fontWeight:500}}>📦 Vacíos</div>
                  {["soda","b10","b20"].map(pk=>{
                    const calc=pk==="soda"?Math.floor(vaciosRec[pk]/CAJON):vaciosRec[pk];
                    const real=realesVacios[pk]!==""?Number(realesVacios[pk]):calc;
                    const diff=real-calc;
                    return (
                      <div key={pk} style={{textAlign:"center"}}>
                        <div style={{fontSize:11,color:"#f5b942",marginBottom:2}}>App: {calc}</div>
                        <input type="number" min={0} value={realesVacios[pk]}
                          placeholder={String(calc)}
                          style={{width:"100%",padding:"4px",borderRadius:6,border:"0.5px solid #f5b942",background:"var(--color-background-tertiary)",color:"var(--color-text-primary)",fontSize:14,textAlign:"center"}}
                          onChange={e=>setRealesVacios(r=>({...r,[pk]:e.target.value}))}/>
                        {diff!==0&&<div style={{fontSize:10,color:diff>0?"var(--color-text-warning)":"var(--color-text-danger)",marginTop:1}}>{diff>0?"+":""}{diff}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sodería después */}
              <div style={{background:"var(--color-background-secondary)",borderRadius:10,overflow:"hidden",marginBottom:14}}>
                <div style={{padding:"8px 12px",background:"rgba(24,95,165,0.15)"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--color-text-info)",textTransform:"uppercase",letterSpacing:"0.05em"}}>🏭 Sodería después del cierre</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"6px 12px",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                  {["","Soda (caj)","10L","20L"].map((h,i)=>(
                    <div key={i} style={{fontSize:10,color:"var(--color-text-tertiary)",textAlign:i===0?"left":"center"}}>{h}</div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"8px 12px",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                  <div style={{fontSize:12,color:"#4dd9a0"}}>✅ Llenos</div>
                  {["soda","b10","b20"].map(pk=>(
                    <div key={pk} style={{textAlign:"center",fontSize:16,fontWeight:700,color:"#4dd9a0"}}>
                      {pk==="soda"?Math.floor(soderiaPost[pk]/CAJON):soderiaPost[pk]}
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"8px 12px"}}>
                  <div style={{fontSize:12,color:"#f5b942"}}>📦 Vacíos</div>
                  {["soda","b10","b20"].map(pk=>(
                    <div key={pk} style={{textAlign:"center",fontSize:16,fontWeight:700,color:"#f5b942"}}>
                      {pk==="soda"?Math.floor(soderiaVaciosPost[pk]/CAJON):soderiaVaciosPost[pk]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Camión → 0 */}
              <div style={{...s.card,margin:"0 0 14px",background:"rgba(240,112,112,0.1)",border:"0.5px solid rgba(240,112,112,0.3)",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,color:"var(--color-text-danger)"}}>🚚 Camión queda en</span>
                <span style={{fontSize:20,fontWeight:700,color:"var(--color-text-danger)"}}>0</span>
              </div>

              <div style={{display:"flex",gap:10}}>
                <button style={{flex:1,padding:"13px",borderRadius:10,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-secondary)",fontSize:14,cursor:"pointer"}}
                  onClick={()=>setMostrarCierre(false)}>Cancelar</button>
                <button style={{flex:2,padding:"13px",borderRadius:10,border:"none",background:"#f5b942",color:"#1a1a1a",fontSize:14,fontWeight:700,cursor:"pointer"}}
                  onClick={confirmarCierre}>✅ Confirmar cierre</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InicioReparto({dia,fecha,planilla,productos,cargasDia,stock,onGuardar,onVolver}) {
  const prodKeys = {"Sifón 1.5L":"soda","Bidón 10L":"b10","Bidón 20L":"b20"};
  const CAJON = 6; // sifones por cajón
  const [llenos,setLlenos] = useState(()=>{
    const precarga = (cargasDia||CARGA_DIA_DEFAULT)[dia]||CARGA_DIA_DEFAULT[dia]||{};
    const m={};
    productos.forEach(p=>{
      const k=prodKeys[p.nombre];
      if(k) m[k] = planilla?.productos?.[k]?.llenos || precarga[k] || "";
    });
    return m;
  });
  const yaIniciado = planilla?.iniciado;

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <span style={s.headerTitle}>Inicio del reparto · {dia}</span>
      </div>
      <div style={{padding:16}}>
        <div style={{...s.card,margin:"0 0 16px",background:"var(--color-background-info)",border:"0.5px solid var(--color-border-info)"}}>
          <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-info)",marginBottom:4}}>
            📅 {dia} · {fecha ? new Date(fecha+'T12:00:00').toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) : ""}
          </div>
          <div style={{fontSize:13,color:"var(--color-text-secondary)"}}>
            {yaIniciado?"Podés modificar las cantidades iniciales si hay un error.":"Ingresá la cantidad de envases llenos con los que salís hoy."}
          </div>
        </div>

        <span style={{...s.sectionTitle,padding:"0 0 10px"}}>Envases llenos al salir</span>

        {productos.map(p=>{
          const k=prodKeys[p.nombre]; if(!k) return null;
          return (
            <div key={p.id} style={{...s.card,margin:"0 0 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:15,fontWeight:500,color:"var(--color-text-primary)"}}>{p.nombre}</div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{fmt(p.precio)} c/u</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button style={{...s.btn,padding:"6px 18px",fontSize:22,lineHeight:1}}
                  onClick={()=>setLlenos(l=>({...l,[k]:Math.max(0,(Number(l[k])||0)-(k==="soda"?CAJON:1))}))}>
                  {k==="soda"?"-caj":"-"}
                </button>
                <div style={{textAlign:"center",minWidth:50}}>
                  <div style={{fontSize:26,fontWeight:500,color:"var(--color-text-primary)"}}>{llenos[k]||0}</div>
                  {k==="soda"&&<div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{Math.floor((llenos[k]||0)/CAJON)}caj+{(llenos[k]||0)%CAJON}un</div>}
                </div>
                <button style={{...s.btn,padding:"6px 18px",fontSize:22,lineHeight:1}}
                  onClick={()=>setLlenos(l=>({...l,[k]:(Number(l[k])||0)+(k==="soda"?CAJON:1)}))}>
                  {k==="soda"?"+caj":"+"}
                </button>
              </div>
            </div>
          );
        })}

        <div style={{...s.card,margin:"12px 0 20px",background:"var(--color-background-secondary)"}}>
          <div style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:6}}>Total envases cargados</div>
          <div style={{fontSize:28,fontWeight:500,color:"var(--color-text-primary)"}}>
            {Object.values(llenos).reduce((a,v)=>a+(Number(v)||0),0)}
          </div>
        </div>

        <button style={s.btnPrimary}
          onClick={()=>{
            const nuevaPlanilla = {
              ...(planilla||planillaDiaVacia()),
              iniciado:true,
              productos:{
                ...(planilla?.productos||{}),
                ...Object.fromEntries(Object.entries(llenos).map(([k,v])=>[k,{
                  ...(planilla?.productos?.[k]||{}),
                  llenos:v
                }]))
              }
            };
            onGuardar(nuevaPlanilla, true);
          }}>
          {yaIniciado?"Actualizar y continuar →":"🚀 Iniciar y descontar de sodería"}
        </button>
        {!yaIniciado&&(
          <button style={{...s.btn,width:"100%",padding:"12px",fontSize:13,borderRadius:10,marginTop:6}}
            onClick={()=>{
              const nuevaPlanilla = {
                ...planilla,
                iniciado:true,
                productos: Object.fromEntries(
                  Object.entries(cajones).map(([k,v])=>[k,{
                    ...(planilla?.productos?.[k]||{}),
                    llenos:v
                  }])
                )
              };
              onGuardar(nuevaPlanilla, false);
            }}>
            Iniciar sin descontar stock
          </button>
        )}
      </div>
      {/* Stock sodería */}
      {stock?.soderia&&(
        <div style={{...s.card,margin:"10px 14px 0",background:"var(--color-background-tertiary)"}}>
          <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8}}>Stock actual · Sodería</div>
          <div style={{display:"flex",gap:16}}>
            {[["Sifón",stock?.soderia?.sifon||0],["Bidón 10L",stock?.soderia?.bidon10||0],["Bidón 20L",stock?.soderia?.bidon20||0]].map(([l,v])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{l}</div>
                <div style={{fontSize:18,fontWeight:500,color:v>0?"var(--color-text-primary)":"var(--color-text-danger)"}}>{v||0}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

