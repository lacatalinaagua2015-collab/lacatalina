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
  return d.toLocaleDateString("en-CA");
}

function hoyKey() { return new Date().toLocaleDateString("en-CA"); }

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


// ── Acceso con PIN + huella (WebAuthn) — La Catalina ───────────────────────────
const LC_BIO_KEY = "lc_bio_cred";
const LC_PIN_KEY = "lc_pin";
function lcBioSoportado(){ return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create); }
function lcBioEnrolado(){ try { return !!localStorage.getItem(LC_BIO_KEY); } catch { return false; } }
function lcBioRechazado(){ try { return localStorage.getItem("lc_bio_no")==="1"; } catch { return false; } }
function _lcB64ToBuf(b64){ const x=atob(b64); const u=new Uint8Array(x.length); for(let i=0;i<x.length;i++)u[i]=x.charCodeAt(i); return u.buffer; }
function _lcBufToB64(buf){ const u=new Uint8Array(buf); let x=""; for(let i=0;i<u.length;i++)x+=String.fromCharCode(u[i]); return btoa(x); }
async function lcBioRegistrar(){
  if(!lcBioSoportado()) throw new Error("no_soportado");
  const cred = await navigator.credentials.create({ publicKey:{
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rp:{ name:"La Catalina" },
    user:{ id: crypto.getRandomValues(new Uint8Array(16)), name:"usuario", displayName:"Usuario" },
    pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],
    authenticatorSelection:{ authenticatorAttachment:"platform", userVerification:"required" },
    timeout:60000, attestation:"none",
  }});
  if(!cred) throw new Error("cancelado");
  localStorage.setItem(LC_BIO_KEY, _lcBufToB64(cred.rawId));
  localStorage.removeItem("lc_bio_no");
  return true;
}
async function lcBioVerificar(){
  if(!lcBioSoportado() || !lcBioEnrolado()) throw new Error("no_disponible");
  const r = await navigator.credentials.get({ publicKey:{
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    allowCredentials:[{ type:"public-key", id:_lcB64ToBuf(localStorage.getItem(LC_BIO_KEY)) }],
    userVerification:"required", timeout:60000,
  }});
  return !!r;
}

function PantallaBloqueoLC({onOk}) {
  const pinGuardado = (()=>{ try { return localStorage.getItem(LC_PIN_KEY)||""; } catch { return ""; } })();
  const modoSetup = !pinGuardado;
  const [pin, setPin] = React.useState("");
  const [setupPaso, setSetupPaso] = React.useState(1);
  const [pinTmp, setPinTmp] = React.useState("");
  const [error, setError] = React.useState("");
  const [faseEnrolar, setFaseEnrolar] = React.useState(false);
  const [bioMsg, setBioMsg] = React.useState("");
  const [mostrarPin, setMostrarPin] = React.useState(modoSetup); // setup siempre muestra PIN
  const [fallosBio, setFallosBio] = React.useState(0);
  const puedeBio = lcBioSoportado();
  const bioOn = lcBioEnrolado();

  // Intento automático de huella al montar (solo si ya está enrolada)
  React.useEffect(()=>{
    if(!modoSetup && puedeBio && bioOn){
      lcBioVerificar().then(ok=>{ if(ok) onOk(); }).catch(()=>{ setFallosBio(1); setMostrarPin(true); setBioMsg("Usá tu PIN para entrar."); });
    }
  },[]);

  const finalizar = () => {
    if(puedeBio && !lcBioEnrolado() && !lcBioRechazado()) { setPin(""); setFaseEnrolar(true); }
    else onOk();
  };
  const completar = (valor) => {
    if(valor.length<4) return;
    if(modoSetup){
      if(setupPaso===1){ setPinTmp(valor); setPin(""); setSetupPaso(2); setError(""); }
      else { if(valor===pinTmp){ try{localStorage.setItem(LC_PIN_KEY,valor);}catch(e){} setError(""); finalizar(); }
             else { setError("No coincide, empezá de nuevo"); setPin(""); setPinTmp(""); setSetupPaso(1); } }
    } else {
      if(valor===pinGuardado){ setError(""); finalizar(); }
      else { setError("PIN incorrecto"); setPin(""); if(navigator.vibrate)navigator.vibrate([100,50,100]); }
    }
  };
  const presionar = (d) => { if(pin.length>=4) return; const nuevo=pin+d; setPin(nuevo); setError(""); if(nuevo.length===4) completar(nuevo); };
  const borrar = () => { setPin(p=>p.slice(0,-1)); setError(""); };

  const intentarHuellaDeNuevo = async () => {
    setBioMsg(""); setError("");
    try {
      if(await lcBioVerificar()) onOk();
    } catch(e){
      const nf = fallosBio + 1;
      setFallosBio(nf);
      if(nf >= 3) { setBioMsg("Demasiados intentos. Ingresá tu PIN."); setMostrarPin(true); }
      else { setBioMsg(`No se reconoció. Intentos restantes: ${3-nf}`); }
    }
  };

  const activarHuella = async () => { setBioMsg(""); try { await lcBioRegistrar(); onOk(); } catch(e){ setBioMsg("No se pudo activar. Entrás con tu PIN."); setTimeout(onOk,1200); } };
  const saltarHuella = () => { try{localStorage.setItem("lc_bio_no","1");}catch(e){} onOk(); };

  const titulo = modoSetup ? (setupPaso===1 ? "Creá un PIN de 4 dígitos" : "Repetí el PIN") : "Ingresá tu PIN";
  const btnStyle = (color) => ({ width:72, height:72, borderRadius:"50%", border:"none", cursor:"pointer", fontSize:24, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", background: color || "var(--color-background-secondary,#1a2b3c)", color:"var(--color-text-primary,#e2eaf4)", boxShadow:"0 2px 8px rgba(0,0,0,0.3)" });

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--color-background-primary,#0f1923)",padding:24}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:44,marginBottom:8}}>💧</div>
        <h2 style={{fontSize:20,fontWeight:700,color:"var(--color-text-primary,#e2eaf4)",margin:0}}>La Catalina</h2>
        {mostrarPin && <p style={{fontSize:13,color:"var(--color-text-secondary,#7a9ab8)",marginTop:4}}>{titulo}</p>}
      </div>

      {/* Fase enrolar huella */}
      {faseEnrolar ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,maxWidth:280}}>
          <div style={{fontSize:46}}>👆</div>
          <p style={{fontSize:16,color:"var(--color-text-primary,#e2eaf4)",textAlign:"center",margin:0,fontWeight:600}}>¿Entrar con tu huella la próxima vez?</p>
          <p style={{fontSize:12,color:"var(--color-text-secondary,#7a9ab8)",textAlign:"center",margin:0,lineHeight:1.5}}>Más rápido. Tu PIN sigue funcionando por si lo necesitás.</p>
          <button style={{background:"#185FA5",color:"#fff",border:"none",borderRadius:10,padding:"12px 20px",fontSize:15,fontWeight:600,cursor:"pointer",width:210}} onClick={activarHuella}>Activar huella</button>
          <button style={{background:"none",border:"none",color:"var(--color-text-secondary,#7a9ab8)",fontSize:13,cursor:"pointer"}} onClick={saltarHuella}>Ahora no</button>
        </div>

      /* Esperando huella automática */
      ) : !mostrarPin && bioOn ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <div style={{fontSize:56}}>👆</div>
          <p style={{fontSize:15,color:"var(--color-text-secondary,#7a9ab8)",textAlign:"center"}}>Verificando huella...</p>
          {bioMsg && <p style={{color:"#f5b942",fontSize:13,textAlign:"center"}}>{bioMsg}</p>}
          {fallosBio > 0 && fallosBio < 3 && (
            <button style={{background:"#185FA5",color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontSize:14,cursor:"pointer"}} onClick={intentarHuellaDeNuevo}>Reintentar huella</button>
          )}
          <button style={{background:"none",border:"none",color:"var(--color-text-tertiary,#4a6a85)",fontSize:13,cursor:"pointer",marginTop:8}} onClick={()=>setMostrarPin(true)}>Usar PIN</button>
        </div>

      /* Teclado PIN */
      ) : (
        <>
          <div style={{display:"flex",gap:16,marginBottom:28}}>
            {[0,1,2,3].map(i=>(<div key={i} style={{width:16,height:16,borderRadius:"50%",background:i<pin.length?"#185FA5":"rgba(255,255,255,0.15)",boxShadow:i<pin.length?"0 0 8px rgba(24,95,165,0.6)":"none"}} />))}
          </div>
          {error && <p style={{color:"#f07070",fontSize:13,marginBottom:18,textAlign:"center"}}>{error}</p>}
          {bioMsg && <p style={{color:"#f5b942",fontSize:13,marginBottom:16,textAlign:"center"}}>{bioMsg}</p>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,72px)",gap:12}}>
            {[1,2,3,4,5,6,7,8,9].map(n=>(<button key={n} style={btnStyle()} onClick={()=>presionar(String(n))}>{n}</button>))}
            <div />
            <button style={btnStyle()} onClick={()=>presionar("0")}>0</button>
            <button style={{...btnStyle("rgba(240,112,112,0.15)"),color:"#f07070"}} onClick={borrar}>⌫</button>
          </div>
        </>
      )}
      <p style={{fontSize:11,color:"var(--color-text-tertiary,#4a6a85)",marginTop:24,textAlign:"center"}}>La Catalina</p>
    </div>
  );
}
