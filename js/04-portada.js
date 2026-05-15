// ════════════════════════════════════════════════════════════════════
// ◆  04-portada.js — Portada, fechas, SelectorFecha, Setup, SyncBar
// ════════════════════════════════════════════════════════════════════

function Portada({onIngresar}) {
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:32,minHeight:"100vh"}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:"var(--color-background-info)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38}}>💧</div>
      <div style={{textAlign:"center"}}>
        <h1 style={{fontSize:24,fontWeight:500,color:"var(--color-text-primary)",marginBottom:6}}>Reparto App</h1>
        <p style={{fontSize:15,color:"var(--color-text-secondary)"}}>Soda y Agua Tratada · Reparto</p>
      </div>
      <button style={{...s.btnPrimary,width:200,marginTop:8}} onClick={onIngresar}>Ingresar</button>
      {typeof window!=="undefined"&&window.matchMedia&&!window.matchMedia("(display-mode: standalone)").matches&&(
        <div style={{fontSize:12,color:"var(--color-text-tertiary)",textAlign:"center",lineHeight:1.6,marginTop:4,maxWidth:240}}>
          💡 Instalá la app: menú del navegador → "Agregar a pantalla de inicio"
        </div>
      )}
    </div>
  );
}

// ── Generador de fechas por día de semana ────────────────────────────────────
function getFechasDelAnio(diaNombre) {
  const diasSemana = {"Lunes":1,"Martes":2,"Miércoles":3,"Jueves":4,"Viernes":5,"Sábado":6,"Domingo":0};
  const target = diasSemana[diaNombre];
  if(target===undefined) return [];
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const fechas = [];
  const d = new Date(anio,0,1);
  while(d.getDay()!==target) d.setDate(d.getDate()+1);
  while(d.getFullYear()===anio) {
    fechas.push(new Date(d));
    d.setDate(d.getDate()+7);
  }
  return fechas;
}

function formatFecha(d) {
  return d.toLocaleDateString("es-AR",{weekday:"short",day:"numeric",month:"short"});
}

function fechaKey(d) {
  return d.toISOString().slice(0,10);
}

function hoyKey() { return new Date().toISOString().slice(0,10); }

function SelectorFecha({dia,planillas,ventas,noVisitas,onSeleccionar,onVolver}) {
  const fechas = getFechasDelAnio(dia);
  const hoy = hoyKey();
  const [mostrarTodas,setMostrarTodas] = useState(false);

  // Agrupar por mes
  const porMes = {};
  fechas.forEach(f=>{
    const mes = f.toLocaleDateString("es-AR",{month:"long",year:"numeric"});
    if(!porMes[mes]) porMes[mes]=[];
    porMes[mes].push(f);
  });

  const meses = Object.keys(porMes);
  const mesActual = new Date().toLocaleDateString("es-AR",{month:"long",year:"numeric"});
  const [mesAbierto,setMesAbierto] = useState(mesActual);

  const ventasPorFecha = {};
  ventas.filter(v=>v.dia===dia).forEach(v=>{
    const fk = v.fechaKey || v.fecha?.slice(0,10) || "";
    ventasPorFecha[fk] = (ventasPorFecha[fk]||0) + 1;
  });

  const visitasPorFecha = {};
  (noVisitas||[]).filter(v=>v.dia===dia).forEach(v=>{
    visitasPorFecha[v.fecha] = (visitasPorFecha[v.fecha]||0) + 1;
  });

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <span style={s.headerTitle}>Fechas de visita · {dia}</span>
      </div>
      <div style={{padding:"8px 16px"}}>
        <p style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:8}}>Seleccioná la fecha de reparto para comenzar o continuar la jornada.</p>
        {meses.map(mes=>{
          const abierto = mes===mesAbierto;
          return (
            <div key={mes} style={{marginBottom:8}}>
              <button style={{...s.card,margin:0,width:"100%",textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:abierto?"var(--color-background-info)":"var(--color-background-secondary)"}}
                onClick={()=>setMesAbierto(abierto?null:mes)}>
                <span style={{fontSize:14,fontWeight:500,color:abierto?"var(--color-text-info)":"var(--color-text-primary)",textTransform:"capitalize"}}>{mes}</span>
                <span style={{color:"var(--color-text-tertiary)"}}>{abierto?"▲":"▼"}</span>
              </button>
              {abierto&&(
                <div style={{border:"0.5px solid var(--color-border-tertiary)",borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden"}}>
                  {porMes[mes].map(f=>{
                    const fk = fechaKey(f);
                    const planKey = `${dia}_${fk}`;
                    const tienePlanilla = !!planillas[planKey];
                    const nVentas = ventasPorFecha[fk]||0;
                    const nVisitas = visitasPorFecha[fk]||0;
                    const esHoy = fk===hoy;
                    return (
                      <button key={fk} style={{width:"100%",textAlign:"left",padding:"12px 16px",cursor:"pointer",border:"none",borderBottom:"0.5px solid var(--color-border-tertiary)",background:esHoy?"var(--color-background-success)":"var(--color-background-primary)",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                        onClick={()=>onSeleccionar(fk,f)}>
                        <div>
                          <span style={{fontSize:14,fontWeight:esHoy?500:400,color:esHoy?"var(--color-text-success)":"var(--color-text-primary)",textTransform:"capitalize"}}>
                            {formatFecha(f)}{esHoy?" · Hoy":""}
                          </span>
                          <div style={{display:"flex",gap:6,marginTop:4}}>
                            {nVentas>0&&<span style={s.badge("success")}>{nVentas} entregas</span>}
                            {nVisitas>0&&<span style={s.badge("warning")}>{nVisitas} visitas s/venta</span>}
                            {tienePlanilla&&<span style={s.badge("info")}>planilla ✓</span>}
                          </div>
                        </div>
                        <span style={{color:"var(--color-text-tertiary)"}}>→</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {/* Fecha especial al final */}
        <div style={{...s.card,margin:"12px 0 0",background:"var(--color-background-tertiary)"}}>
          <label style={s.label}>📅 Fecha especial (feriado o reparto extra)</label>
          <input type="date" style={{...s.input,fontSize:14,marginTop:4}}
            onChange={e=>{
              if(e.target.value){
                const d=new Date(e.target.value+'T12:00:00');
                onSeleccionar(e.target.value,d);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SetupScreen({onSetup}) {
  React.useEffect(()=>{ onSetup("firebase","firebase"); },[]);
  return <div style={{padding:40,textAlign:"center",color:"var(--color-text-secondary)"}}>Conectando con Firebase...</div>;
}

function SyncBar({status, isOnline}) {
  if(status==="idle") {
    if(!isOnline) return (
      <div style={{background:"#3d2e1e",color:"#f59e0b",textAlign:"center",fontSize:11,padding:"4px",fontWeight:500}}>
        📵 Sin conexión · Los cambios se sincronizan al reconectar
      </div>
    );
    return null;
  }
  if(status==="saved") return (
    <div style={{background:"var(--color-background-success)",color:"var(--color-text-success)",textAlign:"center",fontSize:12,padding:"5px",fontWeight:500}}>
      ✓ Guardado
    </div>
  );
  const cfg = {
    loading:        {bg:"#1e3a5f",                         color:"#5daaff",    txt:"⏳ Cargando datos de la nube..."},
    saving:         {bg:"var(--color-background-warning)",  color:"var(--color-text-warning)", txt:"☁ Guardando..."},
    error:          {bg:"var(--color-background-danger)",   color:"var(--color-text-danger)",  txt:"⚠ Error al guardar en la nube"},
    offline:        {bg:"#3d2e1e", color:"#f59e0b", txt:"📵 Sin conexión — los cambios se guardan localmente"},
    offline_pending:{bg:"#3d2e1e", color:"#f59e0b", txt:"📵 Sin conexión — cambios pendientes de sincronizar"},
  };
  const c = cfg[status]||cfg.saving;
  return (
    <div style={{background:c.bg,color:c.color,textAlign:"center",fontSize:12,padding:"6px",fontWeight:500}}>
      {c.txt}
    </div>
  );
}

function SetupNube({onSetup}) {
  const [paso, setPaso] = useState(1);
  // No API config needed with Firebase
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const conectar = async () => {
    if (!apiKey.trim()) { setError("Pegá tu API Key primero"); return; }
    setCargando(true); setError("");
    try {
      const binId = await cloudCreate(apiKey.trim());
      localStorage.setItem("cat_apikey", JSON.stringify(apiKey.trim()));
      localStorage.setItem("cat_binid",  JSON.stringify(binId));
      onSetup(apiKey.trim(), binId);
    } catch(e) {
      setError("API Key incorrecta o sin conexión. Revisá la clave e intentá de nuevo.");
    }
    setCargando(false);
  };

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:"var(--color-background-primary)",padding:24,display:"flex",flexDirection:"column",gap:16}}>
      <div style={{textAlign:"center",paddingTop:32,paddingBottom:8}}>
        <div style={{fontSize:40,marginBottom:12}}>☁️</div>
        <h1 style={{fontSize:20,fontWeight:500,color:"var(--color-text-primary)",marginBottom:6}}>Configurar guardado en la nube</h1>
        <p style={{fontSize:14,color:"var(--color-text-secondary)",lineHeight:1.6}}>Necesitás hacer esto una sola vez. Después todo se guarda automáticamente.</p>
      </div>

      <div style={{background:"var(--color-background-secondary)",borderRadius:12,padding:16,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:"#185FA5",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,flexShrink:0}}>1</div>
          <div>
            <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>Entrá a jsonbin.io</div>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>Abrí una nueva pestaña y andá a jsonbin.io</div>
            <a href="https://jsonbin.io" target="_blank" rel="noreferrer" style={{fontSize:13,color:"#185FA5",fontWeight:500}}>Abrir jsonbin.io →</a>
          </div>
        </div>
        <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:10,display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:"#185FA5",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,flexShrink:0}}>2</div>
          <div style={{fontSize:14,color:"var(--color-text-primary)"}}>
            <span style={{fontWeight:500}}>Registrate gratis</span>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2,lineHeight:1.6}}>
              Tocá <b>Sign Up</b> · Usá tu email · Confirmá el email si te pide
            </div>
          </div>
        </div>
        <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:10,display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:"#185FA5",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,flexShrink:0}}>3</div>
          <div style={{fontSize:14,color:"var(--color-text-primary)"}}>
            <span style={{fontWeight:500}}>Copiá tu API Key</span>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2,lineHeight:1.6}}>
              Una vez adentro andá a <b>API Keys</b> en el menú → <b>+ Create Access Key</b> → nombrarla <b>reparto-app</b> → copiá la clave larga que aparece
            </div>
          </div>
        </div>
      </div>

      <div>
        <label style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:6,display:"block"}}>Pegá tu API Key acá</label>
        <textarea
          style={{width:"100%",padding:"10px",border:"0.5px solid var(--color-border-secondary)",borderRadius:8,fontSize:13,background:"var(--color-background-secondary)",color:"var(--color-text-primary)",outline:"none",minHeight:70,resize:"none",boxSizing:"border-box",lineHeight:1.5}}
          placeholder="$2b$10$xxxxxxxxxxxxxxxxxx..."
          value={apiKey}
          onChange={e=>setApiKey(e.target.value)}
        />
        {error && <div style={{fontSize:13,color:"var(--color-text-danger)",marginTop:6}}>{error}</div>}
      </div>

      <button
        style={{background:"#185FA5",color:"#fff",border:"none",borderRadius:8,padding:"14px",fontSize:15,fontWeight:500,cursor:"pointer",opacity:cargando?0.7:1}}
        onClick={conectar}
        disabled={cargando}
      >
        {cargando ? "Conectando..." : "Conectar y comenzar"}
      </button>

      <p style={{fontSize:12,color:"var(--color-text-tertiary)",textAlign:"center",lineHeight:1.6}}>
        Tus datos se guardan en tu cuenta privada de JSONBin. Es gratis y seguro. Solo vos tenés acceso.
      </p>
    </div>
  );
}

