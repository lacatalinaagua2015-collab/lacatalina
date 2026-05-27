// ════════════════════════════════════════════════════════════════════
// ◆  05-stock.js — StockGeneral, ConfirmacionesDia
// ════════════════════════════════════════════════════════════════════

function StockGeneral({stock,setStock,clientes,ventas,productos,planillas,onVolver}) {
  const CAJON = 6;
  const [tab, setTab] = React.useState("stock");
  const [guardado, setGuardado] = React.useState(false);

  // ── Stock base editable (Sodería y Casa) ────────────────────────
  const [base, setBase] = React.useState(()=>({
    soderia: {...stock?.soderia||{sifon:0,bidon10:0,bidon20:0,dispenser:0}},
    casa:    {...stock?.casa   ||{sifon:0,bidon10:0,bidon20:0,dispenser:0}},
  }));
  const setB = (lugar,key,val) => setBase(b=>({...b,[lugar]:{...b[lugar],[key]:Number(val)||0}}));
  const [baseVacios, setBaseVacios] = React.useState(()=>({...stock?.soderiaVacios||{sifon:0,bidon10:0,bidon20:0}}));
  const setV = (key,val) => setBaseVacios(b=>({...b,[key]:Number(val)||0}));

  // ── Cierre del día ───────────────────────────────────────────────
  const [cierreLlenos,  setCierreLlenos]  = React.useState({sifon:"",bidon10:"",bidon20:""});
  const [cierreVacios,  setCierreVacios]  = React.useState({sifon:"",bidon10:"",bidon20:""});
  const [cierreGuardado, setCierreGuardado] = React.useState(false);

  const registrarCierre = () => {
    setStock(prev => {
      const s = JSON.parse(JSON.stringify(prev||{}));
      if(!s.soderia) s.soderia = {sifon:0,bidon10:0,bidon20:0};
      if(!s.soderiaVacios) s.soderiaVacios = {sifon:0,bidon10:0,bidon20:0};
      ["sifon","bidon10","bidon20"].forEach(k=>{
        const ll = k==="sifon"
          ? (Number(cierreLlenos[k])||0)*CAJON
          : (Number(cierreLlenos[k])||0);
        const vac = k==="sifon"
          ? (Number(cierreVacios[k])||0)*CAJON
          : (Number(cierreVacios[k])||0);
        s.soderia[k]      = (s.soderia[k]||0) + ll;
        s.soderiaVacios[k]= (s.soderiaVacios[k]||0) + vac;
      });
      s.camion = {sifon:0,bidon10:0,bidon20:0}; // camión queda en 0
      return s;
    });
    setCierreGuardado(true);
    setTimeout(()=>{setCierreGuardado(false);setCierreLlenos({sifon:"",bidon10:"",bidon20:""});setCierreVacios({sifon:"",bidon10:"",bidon20:""});},2500);
  };

  const DIAS_ALL = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const prodKey = {"Sifón 1.5L":"sifon","Bidón 10L":"bidon10","Bidón 20L":"bidon20"};
  const hoy = new Date().toISOString().slice(0,10);
  const ventasHoy = ventas.filter(v=>v.fechaKey===hoy);

  const cargadoHoy = {sifon:0,bidon10:0,bidon20:0};
  DIAS_ALL.forEach(d=>{
    const p = planillas[`${d}_${hoy}`];
    if(p?.productos){
      cargadoHoy.sifon   += Number(p.productos.soda?.llenos||0);
      cargadoHoy.bidon10 += Number(p.productos.b10?.llenos||0);
      cargadoHoy.bidon20 += Number(p.productos.b20?.llenos||0);
    }
  });

  const vendidoHoy = {sifon:0,bidon10:0,bidon20:0};
  ventasHoy.forEach(v=>v.detalle.forEach(d=>{
    const k=prodKey[d.nombre]; if(k) vendidoHoy[k]+=d.cantidad;
  }));

  const enCamionHoy = {
    sifon:   stock?.camion?.sifon   || 0,
    bidon10: stock?.camion?.bidon10 || 0,
    bidon20: stock?.camion?.bidon20 || 0,
  };
  const soCal = {
    sifon:   stock?.soderia?.sifon   || 0,
    bidon10: stock?.soderia?.bidon10 || 0,
    bidon20: stock?.soderia?.bidon20 || 0,
  };

  // ── Envases en clientes ─────────────────────────────────────────
  const envC = {sifon:0,bidon10:0,bidon20:0,dispenser:0};
  clientes.forEach(c=>{
    envC.sifon    +=(c.sifon||0);
    envC.bidon10  +=(c.bidon10||0);
    envC.bidon20  +=(c.bidon20||0);
    envC.dispenser+=(c.dispenser||0);
  });
  ventas.forEach(v=>{
    (v.envPrest||[]).forEach(e=>{
      const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":e.prod==="Dispenser"?"dispenser":null;
      if(k)envC[k]+=Number(e.cant)||0;
    });
    (v.envDev||[]).forEach(e=>{
      const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":e.prod==="Dispenser"?"dispenser":null;
      if(k)envC[k]-=Number(e.cant)||0;
    });
  });

  // ── Total controlado: sodería + casa + camión + clientes ────────
  const totalCtrl = {
    sifon:     (stock?.soderia?.sifon||0)+(stock?.casa?.sifon||0)+enCamionHoy.sifon+envC.sifon,
    bidon10:   (stock?.soderia?.bidon10||0)+(stock?.casa?.bidon10||0)+enCamionHoy.bidon10+envC.bidon10,
    bidon20:   (stock?.soderia?.bidon20||0)+(stock?.casa?.bidon20||0)+enCamionHoy.bidon20+envC.bidon20,
    dispenser: (stock?.soderia?.dispenser||0)+(stock?.casa?.dispenser||0)+envC.dispenser,
  };

  // ── Porcentaje "en la calle" ────────────────────────────────────
  const enLaCalle = {
    sifon:   envC.sifon   + enCamionHoy.sifon,
    bidon10: envC.bidon10 + enCamionHoy.bidon10,
    bidon20: envC.bidon20 + enCamionHoy.bidon20,
  };
  const pct = (enCalle, total) => total>0 ? Math.round(enCalle/total*100) : 0;
  const pctSifon   = pct(enLaCalle.sifon,   totalCtrl.sifon);
  const pctBidon10 = pct(enLaCalle.bidon10, totalCtrl.bidon10);
  const pctBidon20 = pct(enLaCalle.bidon20, totalCtrl.bidon20);

  const guardar = () => {
    setStock({
      soderia:      base.soderia,
      casa:         base.casa,
      soderiaVacios:baseVacios,
      camion:       stock?.camion||{sifon:0,bidon10:0,bidon20:0}
    });
    setGuardado(true);
    setTimeout(()=>setGuardado(false),2000);
  };

  // ── Sub-componentes ─────────────────────────────────────────────
  const Row = ({l,v,color})=>(
    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
      <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>{l}</span>
      <span style={{fontSize:13,fontWeight:500,color:color||"var(--color-text-primary)"}}>{v}</span>
    </div>
  );

  // Barra de porcentaje de campo vs depósito
  const BarraPct = ({label,pctEnCalle,enCalle,total,unit})=>{
    const pctDisp = 100 - pctEnCalle;
    const alertColor = pctEnCalle>75?"var(--color-text-danger)":pctEnCalle>50?"var(--color-text-warning)":"var(--color-text-success)";
    return (
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
          <span style={{fontSize:12,fontWeight:500,color:"var(--color-text-primary)"}}>{label}</span>
          <span style={{fontSize:12,color:alertColor,fontWeight:600}}>{pctEnCalle}% en la calle</span>
        </div>
        <div style={{height:10,borderRadius:6,background:"var(--color-background-tertiary)",overflow:"hidden",display:"flex"}}>
          <div style={{width:`${pctEnCalle}%`,background:pctEnCalle>75?"#f07070":pctEnCalle>50?"#f5b942":"#4dd9a0",borderRadius:"6px 0 0 6px",transition:"width 0.4s"}}/>
          <div style={{flex:1,background:"var(--color-background-secondary)"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
          <span style={{fontSize:10,color:"var(--color-text-tertiary)"}}>En calle: {unit==="caj"?Math.floor(enLaCalle[label==="Soda"?"sifon":label==="Bidón 10L"?"bidon10":"bidon20"]/CAJON):enCalle} {unit}</span>
          <span style={{fontSize:10,color:"var(--color-text-tertiary)"}}>Total: {unit==="caj"?Math.floor(total/CAJON):total} {unit}</span>
        </div>
      </div>
    );
  };

  const InputCamion = ({label,stateKey,stateObj,setFn,esCajon})=>(
    <div style={{...s.card,margin:"0 0 8px",padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:13,color:"var(--color-text-primary)"}}>{label}</span>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button style={{...s.btn,padding:"4px 14px",fontSize:18,lineHeight:1}}
          onClick={()=>setFn(p=>({...p,[stateKey]:String(Math.max(0,(Number(p[stateKey])||0)-1))}))}>−</button>
        <div style={{textAlign:"center",minWidth:40}}>
          <div style={{fontSize:22,fontWeight:500,color:"var(--color-text-primary)"}}>{stateObj[stateKey]||0}</div>
          {esCajon&&<div style={{fontSize:9,color:"var(--color-text-tertiary)"}}>{(Number(stateObj[stateKey])||0)*CAJON} sif</div>}
        </div>
        <button style={{...s.btn,padding:"4px 14px",fontSize:18,lineHeight:1}}
          onClick={()=>setFn(p=>({...p,[stateKey]:String((Number(p[stateKey])||0)+1)}))}>+</button>
      </div>
    </div>
  );

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <span style={s.headerTitle}>📦 Stock</span>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div style={{display:"flex",gap:6,padding:"10px 14px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        {[["stock","📦 Inventario"],["calle","📊 Campo"],["cierre","🔒 Cierre"],["clientes","👥 Clientes"]].map(([t,l])=>(
          <button key={t} style={{...s.btn,flex:1,padding:"7px 2px",fontSize:12,fontWeight:tab===t?600:400,
            background:tab===t?"var(--color-background-secondary)":"transparent",
            borderBottom:tab===t?"2px solid #185FA5":"none",
            borderRadius:tab===t?"8px 8px 0 0":"8px",
            color:tab===t?"var(--color-text-primary)":"var(--color-text-secondary)"}}
            onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      <div style={{padding:14,overflowY:"auto"}}>

        {/* ══════════ TAB: INVENTARIO ══════════ */}
        {tab==="stock"&&(<>

          {/* Total controlado */}
          <div style={{...s.card,margin:"0 0 10px",background:"var(--color-background-info)",border:"1.5px solid #185FA5"}}>
            <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-info)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>
              📦 Total controlado (sodería + casa + camión + clientes)
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
              {[
                ["Soda",   Math.floor(totalCtrl.sifon/CAJON),   "caj", `${totalCtrl.sifon} un`],
                ["10L",    totalCtrl.bidon10,                    "un",  null],
                ["20L",    totalCtrl.bidon20,                    "un",  null],
                ["Disp.",  totalCtrl.dispenser,                  "un",  null],
              ].map(([l,v,u,sub])=>(
                <div key={l} style={{background:"var(--color-background-primary)",borderRadius:8,padding:"8px 4px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginBottom:2}}>{l}</div>
                  <div style={{fontSize:20,fontWeight:500,color:"var(--color-text-info)"}}>{v}</div>
                  <div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{u}{sub?` (${sub})`:""}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
              {[
                ["🏭 Sodería", Math.floor(soCal.sifon/CAJON), soCal.bidon10, soCal.bidon20],
                ["📦 Casa",    Math.floor((stock?.casa?.sifon||0)/CAJON), stock?.casa?.bidon10||0, stock?.casa?.bidon20||0],
                ["🚚 Camión",  Math.floor(enCamionHoy.sifon/CAJON), enCamionHoy.bidon10, enCamionHoy.bidon20],
                ["👥 Clientes",Math.floor(envC.sifon/CAJON), envC.bidon10, envC.bidon20],
              ].map(([lugar,caj,b10,b20])=>(
                <div key={lugar} style={{fontSize:10,color:"var(--color-text-secondary)",background:"var(--color-background-primary)",borderRadius:6,padding:"3px 7px"}}>
                  {lugar}: {caj}caj · {b10} 10L · {b20} 20L
                </div>
              ))}
            </div>
          </div>

          {/* Estado actual calculado */}
          <div style={{...s.card,margin:"0 0 12px",background:"var(--color-background-secondary)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:"0.05em"}}>📊 Estado actual (calculado)</div>
              {(enCamionHoy.sifon>0||enCamionHoy.bidon10>0||enCamionHoy.bidon20>0)&&(
                <button style={{...s.btn,fontSize:10,padding:"3px 8px",color:"var(--color-text-danger)",border:"1px solid var(--color-text-danger)"}}
                  onClick={()=>{ if(window.confirm("¿Limpiar camión? Usalo solo si no hay reparto activo.")){setStock(prev=>({...prev,camion:{sifon:0,bidon10:0,bidon20:0}}));} }}>
                  🔄 Limpiar camión
                </button>
              )}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {[["🏭 Sodería",[Math.floor(soCal.sifon/CAJON),soCal.bidon10,soCal.bidon20]],["🚚 En reparto",[Math.floor(enCamionHoy.sifon/CAJON),enCamionHoy.bidon10,enCamionHoy.bidon20]]].map(([titulo,vals])=>(
                <div key={titulo} style={{flex:1}}>
                  <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginBottom:4}}>{titulo}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {vals.map((v,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",background:"var(--color-background-tertiary)",borderRadius:6,padding:"4px 8px"}}>
                        <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{["Caj","10L","20L"][i]}</span>
                        <span style={{fontSize:14,fontWeight:600,color:v<3?"var(--color-text-danger)":v<8?"var(--color-text-warning)":"var(--color-text-primary)"}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {(cargadoHoy.sifon>0||cargadoHoy.bidon10>0||cargadoHoy.bidon20>0)&&(
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:6,marginTop:4}}>
                Hoy: cargado {Math.floor(cargadoHoy.sifon/CAJON)} caj · {cargadoHoy.bidon10} 10L · {cargadoHoy.bidon20} 20L
                {" / "}vendido {Math.floor(vendidoHoy.sifon/CAJON)} caj · {vendidoHoy.bidon10} 10L · {vendidoHoy.bidon20} 20L
              </div>
            )}
          </div>

          {/* ── Sodería llenos ── */}
          <div style={{...s.card,margin:"0 0 12px"}}>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)"}}>🏭 Sodería (stock base llenos)</div>
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>Modificá solo cuando ajustés físicamente el stock</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
              <div>
                <label style={{...s.label,textAlign:"center",fontSize:11}}>Cajones soda</label>
                <input style={{...s.inputNum,textAlign:"center"}} type="number" min={0}
                  value={Math.floor((base.soderia?.sifon||0)/CAJON)}
                  onChange={e=>{ const caj=Number(e.target.value)||0; const sueltos=(base.soderia?.sifon||0)%CAJON; setB("soderia","sifon",caj*CAJON+sueltos); }} />
                <div style={{fontSize:10,color:"var(--color-text-tertiary)",textAlign:"center",marginTop:2}}>{base.soderia?.sifon||0} sifones</div>
              </div>
              <div>
                <label style={{...s.label,textAlign:"center",fontSize:11}}>Bidón 10L</label>
                <input style={{...s.inputNum,textAlign:"center"}} type="number" min={0} value={base.soderia?.bidon10||0} onChange={e=>setB("soderia","bidon10",e.target.value)} />
              </div>
              <div>
                <label style={{...s.label,textAlign:"center",fontSize:11}}>Bidón 20L</label>
                <input style={{...s.inputNum,textAlign:"center"}} type="number" min={0} value={base.soderia?.bidon20||0} onChange={e=>setB("soderia","bidon20",e.target.value)} />
              </div>
            </div>
            {/* Dispenser sodería */}
            <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:10}}>
              <label style={{...s.label,fontSize:11}}>🧊 Dispenser en sodería</label>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button style={{...s.btn,padding:"5px 16px",fontSize:20,lineHeight:1}} onClick={()=>setB("soderia","dispenser",Math.max(0,(base.soderia?.dispenser||0)-1))}>−</button>
                <span style={{fontSize:22,fontWeight:500,minWidth:36,textAlign:"center",color:"var(--color-text-primary)"}}>{base.soderia?.dispenser||0}</span>
                <button style={{...s.btn,padding:"5px 16px",fontSize:20,lineHeight:1}} onClick={()=>setB("soderia","dispenser",(base.soderia?.dispenser||0)+1)}>+</button>
                <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>unidades</span>
              </div>
            </div>
          </div>

          {/* ── Sodería vacíos ── */}
          <div style={{...s.card,margin:"0 0 12px"}}>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)"}}>📦 Sodería (vacíos en depósito)</div>
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>Modificá solo cuando ajustés físicamente el stock</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <div>
                <label style={{...s.label,textAlign:"center",fontSize:11}}>Cajones soda</label>
                <input style={{...s.inputNum,textAlign:"center"}} type="number" min={0}
                  value={Math.floor((baseVacios.sifon||0)/CAJON)}
                  onChange={e=>{ const caj=Number(e.target.value)||0; const sueltos=(baseVacios.sifon||0)%CAJON; setV("sifon",caj*CAJON+sueltos); }} />
                <div style={{fontSize:10,color:"var(--color-text-tertiary)",textAlign:"center",marginTop:2}}>{baseVacios.sifon||0} sifones</div>
              </div>
              <div>
                <label style={{...s.label,textAlign:"center",fontSize:11}}>Bidón 10L</label>
                <input style={{...s.inputNum,textAlign:"center"}} type="number" min={0} value={baseVacios.bidon10||0} onChange={e=>setV("bidon10",e.target.value)} />
              </div>
              <div>
                <label style={{...s.label,textAlign:"center",fontSize:11}}>Bidón 20L</label>
                <input style={{...s.inputNum,textAlign:"center"}} type="number" min={0} value={baseVacios.bidon20||0} onChange={e=>setV("bidon20",e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Casa / Depósito ── */}
          <div style={{...s.card,margin:"0 0 12px"}}>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)"}}>🏠 Casa / Depósito (promociones)</div>
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>Modificá solo cuando ajustés físicamente el stock</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
              <div>
                <label style={{...s.label,textAlign:"center",fontSize:11}}>Cajones soda</label>
                <input style={{...s.inputNum,textAlign:"center"}} type="number" min={0}
                  value={Math.floor((base.casa?.sifon||0)/CAJON)}
                  onChange={e=>{ const caj=Number(e.target.value)||0; const sueltos=(base.casa?.sifon||0)%CAJON; setB("casa","sifon",caj*CAJON+sueltos); }} />
                <div style={{fontSize:10,color:"var(--color-text-tertiary)",textAlign:"center",marginTop:2}}>{base.casa?.sifon||0} sifones</div>
              </div>
              <div>
                <label style={{...s.label,textAlign:"center",fontSize:11}}>Bidón 10L</label>
                <input style={{...s.inputNum,textAlign:"center"}} type="number" min={0} value={base.casa?.bidon10||0} onChange={e=>setB("casa","bidon10",e.target.value)} />
              </div>
              <div>
                <label style={{...s.label,textAlign:"center",fontSize:11}}>Bidón 20L</label>
                <input style={{...s.inputNum,textAlign:"center"}} type="number" min={0} value={base.casa?.bidon20||0} onChange={e=>setB("casa","bidon20",e.target.value)} />
              </div>
            </div>
            {/* Dispenser casa */}
            <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:10}}>
              <label style={{...s.label,fontSize:11}}>🧊 Dispenser en casa</label>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button style={{...s.btn,padding:"5px 16px",fontSize:20,lineHeight:1}} onClick={()=>setB("casa","dispenser",Math.max(0,(base.casa?.dispenser||0)-1))}>−</button>
                <span style={{fontSize:22,fontWeight:500,minWidth:36,textAlign:"center",color:"var(--color-text-primary)"}}>{base.casa?.dispenser||0}</span>
                <button style={{...s.btn,padding:"5px 16px",fontSize:20,lineHeight:1}} onClick={()=>setB("casa","dispenser",(base.casa?.dispenser||0)+1)}>+</button>
                <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>unidades en tu casa</span>
              </div>
            </div>
          </div>

          <button style={{...s.btnPrimary,background:guardado?"#0F6E56":undefined}} onClick={guardar}>
            {guardado?"✓ Guardado":"Guardar stock base"}
          </button>
        </>)}

        {/* ══════════ TAB: CAMPO (porcentajes) ══════════ */}
        {tab==="calle"&&(<>
          <div style={{...s.card,margin:"0 0 12px",background:"var(--color-background-secondary)"}}>
            <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>
              📊 Envases en la calle vs disponibles
            </div>
            <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:14,lineHeight:1.6}}>
              "En la calle" = clientes + camión. Cuando supera el 70% necesitás restock.
            </div>

            <BarraPct
              label="Soda"
              pctEnCalle={pctSifon}
              enCalle={Math.floor(enLaCalle.sifon/CAJON)}
              total={totalCtrl.sifon}
              unit="caj"
            />
            <BarraPct
              label="Bidón 10L"
              pctEnCalle={pctBidon10}
              enCalle={enLaCalle.bidon10}
              total={totalCtrl.bidon10}
              unit="un"
            />
            <BarraPct
              label="Bidón 20L"
              pctEnCalle={pctBidon20}
              enCalle={enLaCalle.bidon20}
              total={totalCtrl.bidon20}
              unit="un"
            />

            <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:12,marginTop:4}}>
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:6}}>Referencia de colores</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {[["#4dd9a0","0–50%: Stock OK"],["#f5b942","50–75%: Atención"],["#f07070","75–100%: Restock urgente"]].map(([c,l])=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--color-text-secondary)"}}>
                    <div style={{width:10,height:10,borderRadius:3,background:c,flexShrink:0}}/>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detalle numérico */}
          <div style={{...s.card,margin:"0 0 12px"}}>
            <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Detalle numérico</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              {[
                ["🏭 Sodería",     [Math.floor(soCal.sifon/CAJON), soCal.bidon10, soCal.bidon20]],
                ["🏠 Casa",        [Math.floor((stock?.casa?.sifon||0)/CAJON), stock?.casa?.bidon10||0, stock?.casa?.bidon20||0]],
                ["🚚 Camión",      [Math.floor(enCamionHoy.sifon/CAJON), enCamionHoy.bidon10, enCamionHoy.bidon20]],
                ["👥 Clientes",    [Math.floor(envC.sifon/CAJON), envC.bidon10, envC.bidon20]],
                ["🏷 En la calle", [Math.floor(enLaCalle.sifon/CAJON), enLaCalle.bidon10, enLaCalle.bidon20]],
                ["📦 Total",       [Math.floor(totalCtrl.sifon/CAJON), totalCtrl.bidon10, totalCtrl.bidon20]],
              ].map(([titulo,vals])=>(
                <div key={titulo} style={{background:"var(--color-background-secondary)",borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"var(--color-text-tertiary)",marginBottom:4,lineHeight:1.3}}>{titulo}</div>
                  {vals.map((v,i)=>(
                    <div key={i} style={{fontSize:i===0?15:12,fontWeight:i===0?600:400,color:"var(--color-text-primary)"}}>
                      {v}<span style={{fontSize:9,color:"var(--color-text-tertiary)",marginLeft:1}}>{["caj","10L","20L"][i]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Dispenser en campo */}
          {(envC.dispenser>0||totalCtrl.dispenser>0)&&(
            <div style={{...s.card,margin:"0 0 12px",background:"var(--color-background-secondary)"}}>
              <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>🧊 Dispenser</div>
              <div style={{display:"flex",gap:8}}>
                {[["En clientes",envC.dispenser,"info"],["En depósito",(stock?.soderia?.dispenser||0)+(stock?.casa?.dispenser||0),"success"],["Total",totalCtrl.dispenser,"primary"]].map(([l,v,c])=>(
                  <div key={l} style={{flex:1,background:"var(--color-background-tertiary)",borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"var(--color-text-tertiary)",marginBottom:3}}>{l}</div>
                    <div style={{fontSize:20,fontWeight:600,color:`var(--color-text-${c})`}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)}

        {/* ══════════ TAB: CIERRE DEL DÍA ══════════ */}
        {tab==="cierre"&&(<>
          <div style={{...s.card,margin:"0 0 10px",background:"var(--color-background-info)",border:"0.5px solid var(--color-border-secondary)"}}>
            <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-info)",marginBottom:4}}>🔒 Cierre del camión</div>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.6}}>
              Al terminar el reparto ingresá lo que volvió en el camión. Todo suma a sodería y el camión queda en cero.
            </div>
          </div>

          {/* Sobrantes (llenos que volvieron) */}
          <div style={{...s.card,margin:"0 0 12px"}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--color-text-primary)",marginBottom:10}}>📦 Sobrantes llenos (no vendidos)</div>
            <InputCamion label="Cajones soda" stateKey="sifon" stateObj={cierreLlenos} setFn={setCierreLlenos} esCajon={true} />
            <InputCamion label="Bidón 10L" stateKey="bidon10" stateObj={cierreLlenos} setFn={setCierreLlenos} esCajon={false} />
            <InputCamion label="Bidón 20L" stateKey="bidon20" stateObj={cierreLlenos} setFn={setCierreLlenos} esCajon={false} />
            <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:6}}>
              → Estos llenos suman al stock de sodería
            </div>
          </div>

          {/* Vacíos recibidos */}
          <div style={{...s.card,margin:"0 0 12px"}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--color-text-primary)",marginBottom:10}}>🔄 Vacíos recibidos de clientes</div>
            <InputCamion label="Cajones soda vacíos" stateKey="sifon" stateObj={cierreVacios} setFn={setCierreVacios} esCajon={true} />
            <InputCamion label="Bidón 10L vacíos" stateKey="bidon10" stateObj={cierreVacios} setFn={setCierreVacios} esCajon={false} />
            <InputCamion label="Bidón 20L vacíos" stateKey="bidon20" stateObj={cierreVacios} setFn={setCierreVacios} esCajon={false} />
            <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:6}}>
              → Estos vacíos suman a los vacíos de sodería
            </div>
          </div>

          {/* Resumen antes de confirmar */}
          {(Object.values(cierreLlenos).some(v=>Number(v)>0)||Object.values(cierreVacios).some(v=>Number(v)>0))&&(
            <div style={{...s.card,margin:"0 0 12px",background:"var(--color-background-success)",border:"0.5px solid var(--color-border-secondary)"}}>
              <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-success)",marginBottom:6}}>✅ Lo que se va a registrar</div>
              {Number(cierreLlenos.sifon)>0&&<div style={{fontSize:12,color:"var(--color-text-primary)"}}>+ {Number(cierreLlenos.sifon)*CAJON} sifones llenos → sodería</div>}
              {Number(cierreLlenos.bidon10)>0&&<div style={{fontSize:12,color:"var(--color-text-primary)"}}>+ {cierreLlenos.bidon10} bidón 10L llenos → sodería</div>}
              {Number(cierreLlenos.bidon20)>0&&<div style={{fontSize:12,color:"var(--color-text-primary)"}}>+ {cierreLlenos.bidon20} bidón 20L llenos → sodería</div>}
              {Number(cierreVacios.sifon)>0&&<div style={{fontSize:12,color:"var(--color-text-secondary)"}}>+ {Number(cierreVacios.sifon)*CAJON} sifones vacíos → sodería</div>}
              {Number(cierreVacios.bidon10)>0&&<div style={{fontSize:12,color:"var(--color-text-secondary)"}}>+ {cierreVacios.bidon10} bidón 10L vacíos → sodería</div>}
              {Number(cierreVacios.bidon20)>0&&<div style={{fontSize:12,color:"var(--color-text-secondary)"}}>+ {cierreVacios.bidon20} bidón 20L vacíos → sodería</div>}
              <div style={{fontSize:11,color:"var(--color-text-success)",marginTop:6,fontWeight:500}}>🚚 El camión queda en 0</div>
            </div>
          )}

          <button
            style={{...s.btnPrimary,background:cierreGuardado?"#0F6E56":"#185FA5",
              opacity:(Object.values(cierreLlenos).every(v=>!Number(v))&&Object.values(cierreVacios).every(v=>!Number(v)))&&!cierreGuardado?0.45:1}}
            disabled={Object.values(cierreLlenos).every(v=>!Number(v))&&Object.values(cierreVacios).every(v=>!Number(v))&&!cierreGuardado}
            onClick={registrarCierre}>
            {cierreGuardado?"✓ ¡Cierre registrado!":"🔒 Registrar cierre del camión"}
          </button>
        </>)}

        {/* ══════════ TAB: CLIENTES ══════════ */}
        {tab==="clientes"&&(<>
          <div style={{...s.card,margin:"0 0 12px",background:"var(--color-background-secondary)"}}>
            <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Total envases en clientes</div>
            <div style={{display:"flex",gap:8}}>
              {[[Math.floor(envC.sifon/CAJON),"caj",`${envC.sifon} sif`],[envC.bidon10,"10L",null],[envC.bidon20,"20L",null]].map(([v,u,sub])=>(
                <div key={u} style={{flex:1,background:"var(--color-background-tertiary)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:700,color:"var(--color-text-info)"}}>{v}</div>
                  {sub&&<div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{sub}</div>}
                  <div style={{fontSize:10,color:"var(--color-text-secondary)",marginTop:2}}>{u}</div>
                </div>
              ))}
            </div>
          </div>
          {clientes.filter(c=>{
            const vC=ventas.filter(v=>v.clienteId===c.id);
            const ex={sifon:0,bidon10:0,bidon20:0};
            vC.forEach(v=>{
              (v.envPrest||[]).forEach(e=>{const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":null;if(k)ex[k]+=Number(e.cant)||0;});
              (v.envDev||[]).forEach(e=>{const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":null;if(k)ex[k]-=Number(e.cant)||0;});
            });
            return ex.sifon>0||ex.bidon10>0||ex.bidon20>0;
          }).sort((a,b)=>{const dA=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].indexOf(a.dia),dB=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].indexOf(b.dia);return dA!==dB?dA-dB:(a.orden||9999)-(b.orden||9999);}).map(c=>{
            const vC=ventas.filter(v=>v.clienteId===c.id);
            const extra={sifon:0,bidon10:0,bidon20:0};
            vC.forEach(v=>{
              (v.envPrest||[]).forEach(e=>{const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":null;if(k)extra[k]+=Number(e.cant)||0;});
              (v.envDev||[]).forEach(e=>{const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":null;if(k)extra[k]-=Number(e.cant)||0;});
            });
            return (
              <div key={c.id} style={{...s.card,margin:"0 0 8px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{c.nombre}</div>
                    <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{c.dia}</div>
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                    {extra.sifon>0&&<span style={{...s.tag,color:"var(--color-text-warning)"}}>+{extra.sifon} sif</span>}
                    {extra.bidon10>0&&<span style={{...s.tag,color:"var(--color-text-warning)"}}>+{extra.bidon10} 10L</span>}
                    {extra.bidon20>0&&<span style={{...s.tag,color:"var(--color-text-warning)"}}>+{extra.bidon20} 20L</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {clientes.filter(c=>{const vC=ventas.filter(v=>v.clienteId===c.id);const ex={sifon:0,bidon10:0,bidon20:0};vC.forEach(v=>{(v.envPrest||[]).forEach(e=>{const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":null;if(k)ex[k]+=Number(e.cant)||0;});(v.envDev||[]).forEach(e=>{const k=e.prod==="Sifón 1.5L"?"sifon":e.prod==="Bidón 10L"?"bidon10":e.prod==="Bidón 20L"?"bidon20":null;if(k)ex[k]-=Number(e.cant)||0;});});return ex.sifon>0||ex.bidon10>0||ex.bidon20>0;}).length===0&&
            <p style={{textAlign:"center",color:"var(--color-text-tertiary)",padding:"30px 0",fontSize:14}}>No hay clientes con envases prestados extra</p>}
        </>)}

      </div>
    </div>
  );
}

function ConfirmacionesDia({dia,ventas,clientes,onConfirmar,onVolver}) {
  const [abiertos, setAbiertos] = React.useState({});
  const toggleFecha = (fk) => setAbiertos(o=>({...o,[fk]:!o[fk]}));
  const pendientes = ventas.filter(v=>!v.transConfirmada);
  const confirmadas = ventas.filter(v=>v.transConfirmada);
  const porCliente = {};
  pendientes.forEach(v=>{
    if(!porCliente[v.clienteId]) porCliente[v.clienteId]={cliente:clientes.find(c=>c.id===v.clienteId),ventas:[]};
    porCliente[v.clienteId].ventas.push(v);
  });
  const grupos = Object.values(porCliente);
  const totalPendiente = pendientes.reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
  const totalConfirmado = confirmadas.reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
  const confirmadasPorFecha = {};
  confirmadas.forEach(v=>{ const fk=v.fechaKey||"sin fecha"; if(!confirmadasPorFecha[fk])confirmadasPorFecha[fk]=[]; confirmadasPorFecha[fk].push(v); });
  const fechasConf = Object.keys(confirmadasPorFecha).sort().reverse();
  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <span style={s.headerTitle}>Transferencias · {dia}</span>
      </div>
      <div style={{padding:"10px 14px 4px"}}>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <div style={{...s.card,flex:1,margin:0,background:"#1e3a5f",border:"1px solid #f5b942",padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#f5b942",fontWeight:500,textTransform:"uppercase",marginBottom:4}}>🔴 Pendientes</div>
            <div style={{fontSize:18,fontWeight:700,color:"#f5b942"}}>{fmt(totalPendiente)}</div>
            <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{pendientes.length} transfer.</div>
          </div>
          <div style={{...s.card,flex:1,margin:0,background:"#0a2e1f",border:"1px solid #4dd9a0",padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#4dd9a0",fontWeight:500,textTransform:"uppercase",marginBottom:4}}>✓ Confirmadas</div>
            <div style={{fontSize:18,fontWeight:700,color:"#4dd9a0"}}>{fmt(totalConfirmado)}</div>
            <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{confirmadas.length} transfer.</div>
          </div>
        </div>
        {grupos.length===0&&<p style={{textAlign:"center",padding:"20px 0",color:"var(--color-text-tertiary)",fontSize:14}}>✓ No hay transferencias pendientes para {dia}</p>}
        {grupos.map(({cliente:c,ventas:vts})=>(
          <div key={c?.id||Math.random()} style={{...s.card,marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>{c?.nombre||"Cliente desconocido"}</div>
                <div style={{fontSize:14,color:"var(--color-text-secondary)",marginTop:2}}>{c?.calle?`${c.calle} ${c.nro||""}`:c?.manzana?`Mz ${c.manzana} L ${c.lote}`:""}{c?.barrio?` · ${c.barrio}`:""}</div>
              </div>
              {c?.telefono&&<a href={`https://wa.me/54${c.telefono}`} target="_blank" rel="noreferrer" style={{fontSize:20,textDecoration:"none"}}>💬</a>}
            </div>
            {vts.map(v=>(
              <div key={v.id} style={{...s.card,margin:"0 0 6px",background:"var(--color-background-tertiary)",padding:"10px 12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div>
                    <div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{v.fechaKey} · {v.fecha?.slice(-8)||""}</div>
                    <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>{(v.detalle||[]).map(d=>`${d.nombre}×${d.cantidad}`).join(" · ")}</div>
                  </div>
                  <span style={{fontSize:16,fontWeight:500,color:"#f5b942"}}>{fmt(v.pagadoNum||v.neto||0)}</span>
                </div>
                <button style={{width:"100%",padding:"9px",borderRadius:8,border:"none",background:"#185FA5",color:"#e2eaf4",fontSize:13,fontWeight:500,cursor:"pointer"}}
                  onClick={()=>onConfirmar(v.id)}>✓ Confirmar transferencia</button>
              </div>
            ))}
          </div>
        ))}
        {fechasConf.length>0&&(
          <div style={{marginTop:8}}>
            <div style={{fontSize:10,color:"var(--color-text-tertiary)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",margin:"8px 0 6px"}}>✓ Ya confirmadas</div>
            {fechasConf.map(fk=>{
              const vtsFecha=confirmadasPorFecha[fk];
              const totalFecha=vtsFecha.reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
              const open=!!abiertos[fk];
              return (
                <div key={fk} style={{...s.card,margin:"0 0 6px",background:"#0a2e1f",border:"0.5px solid #4dd9a0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>toggleFecha(fk)}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500,color:"#4dd9a0"}}>📅 {fk}</div>
                      <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>{vtsFecha.length} transferencia{vtsFecha.length!==1?"s":""}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:15,fontWeight:600,color:"#4dd9a0"}}>{fmt(totalFecha)}</div>
                      <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginTop:2}}>{open?"▲":"▼"}</div>
                    </div>
                  </div>
                  {open&&<div style={{marginTop:10,borderTop:"0.5px solid rgba(77,217,160,0.2)",paddingTop:8}}>
                    {vtsFecha.map(v=>{
                      const c=clientes.find(x=>x.id===v.clienteId);
                      return (
                        <div key={v.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"0.5px solid rgba(77,217,160,0.15)"}}>
                          <div>
                            <div style={{fontSize:13,color:"var(--color-text-primary)"}}>{c?.nombre||"Cliente"}</div>
                            <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:1}}>{(v.detalle||[]).map(d=>`${d.nombre}×${d.cantidad}`).join(" · ")}</div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                            <div style={{fontSize:13,fontWeight:500,color:"#4dd9a0"}}>{fmt(v.pagadoNum||v.neto||0)}</div>
                            <button style={{fontSize:10,color:"var(--color-text-tertiary)",background:"none",border:"none",cursor:"pointer",padding:"2px 0",textDecoration:"underline"}} onClick={()=>onConfirmar(v.id)}>desmarcar</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
