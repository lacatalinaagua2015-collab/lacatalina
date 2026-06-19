// ════════════════════════════════════════════════════════════════════
// ◆  03-utils.js — debounceSave, useLS, calcVenta, comprimirFoto, fmtFechaHoraVenta
// ════════════════════════════════════════════════════════════════════

// ── Muestra la fecha y hora real del teléfono de un registro (ej: "19/6/2026 · 14:30", sin segundos) ──
function fmtFechaHoraVenta(f) {
  if (!f) return "";
  const limpio = String(f).replace(",", " ").replace(/\s+/g, " ").trim();
  const partes = limpio.split(" ");
  const fecha = partes[0] || "";
  let hora = partes[1] || "";
  const hm = hora.split(":");
  if (hm.length >= 2) hora = hm[0].padStart(2, "0") + ":" + hm[1];
  return hora ? (fecha + " · " + hora) : fecha;
}

function debounceSave(fn) {
  _saveQueue = fn;
  if(_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(()=>{
    const f = _saveQueue; _saveQueue = null; _saveTimer = null;
    if(f) f();
  }, 1200);
}
window.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="hidden" && _saveQueue){
    const f=_saveQueue; _saveQueue=null;
    if(_saveTimer){clearTimeout(_saveTimer);_saveTimer=null;}
    f();
  }
});

function useLS(key, fallback) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
    catch { return fallback; }
  });
  const save = (v) => {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  };
  return [val, save];
}

const s = {
  app:{ maxWidth:480, margin:"0 auto", background:"var(--color-background-primary)", minHeight:"100vh", display:"flex", flexDirection:"column" },
  header:{ background:"var(--color-background-secondary)", borderBottom:"0.5px solid var(--color-border-tertiary)", padding:"10px 14px", display:"flex", alignItems:"center", gap:8, position:"sticky", top:0, zIndex:10 },
  headerTitle:{ fontSize:15, fontWeight:500, color:"var(--color-text-primary)", flex:1 },
  backBtn:{ background:"var(--color-background-tertiary)", border:"none", cursor:"pointer", padding:"6px 12px", color:"var(--color-text-secondary)", fontSize:13, borderRadius:8, display:"flex", alignItems:"center", gap:4, fontWeight:500 },
  screen:{ flex:1, paddingBottom:40 },
  card:{ background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"10px 14px", margin:"6px 14px" },
  label:{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:3, display:"block" },
  input:{ width:"100%", padding:"8px 10px", border:"0.5px solid var(--color-border-secondary)", borderRadius:8, fontSize:14, background:"var(--color-background-tertiary)", color:"var(--color-text-primary)", outline:"none", boxSizing:"border-box" },
  inputNum:{ padding:"7px 8px", border:"0.5px solid var(--color-border-secondary)", borderRadius:8, fontSize:14, background:"var(--color-background-tertiary)", color:"var(--color-text-primary)", outline:"none", textAlign:"right", width:"100%", boxSizing:"border-box" },
  btn:{ border:"0.5px solid var(--color-border-secondary)", borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer", background:"var(--color-background-tertiary)", color:"var(--color-text-secondary)" },
  btnPrimary:{ background:"#185FA5", color:"#e2eaf4", border:"none", borderRadius:8, padding:"12px 20px", fontSize:14, fontWeight:500, cursor:"pointer", width:"100%" },
  btnDanger:{ background:"var(--color-background-danger)", color:"var(--color-text-danger)", border:"0.5px solid var(--color-border-danger)", borderRadius:8, padding:"5px 10px", fontSize:12, cursor:"pointer" },
  row:{ display:"flex", gap:8, alignItems:"center" },
  grid2:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 },
  grid3:{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 },
  metricCard:{ background:"var(--color-background-tertiary)", borderRadius:8, padding:"10px 12px" },
  metricLabel:{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:3 },
  metricVal:{ fontSize:17, fontWeight:500, color:"var(--color-text-primary)" },
  badge:(c)=>({ fontSize:10, fontWeight:500, padding:"2px 7px", borderRadius:6, background:`var(--color-background-${c})`, color:`var(--color-text-${c})` }),
  tag:{ fontSize:13, fontWeight:500, color:"var(--color-text-secondary)", background:"var(--color-background-tertiary)", borderRadius:8, padding:"3px 9px" },
  divider:{ borderTop:"0.5px solid var(--color-border-tertiary)", margin:"10px 0" },
  sectionTitle:{ fontSize:10, color:"var(--color-text-tertiary)", padding:"12px 14px 4px", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.07em", display:"block" },
  select:{ width:"100%", padding:"8px 10px", border:"0.5px solid var(--color-border-secondary)", borderRadius:8, fontSize:14, background:"var(--color-background-tertiary)", color:"var(--color-text-primary)", outline:"none", boxSizing:"border-box" },
  tabBar:{ display:"flex", borderBottom:"0.5px solid var(--color-border-tertiary)", padding:"0 14px", gap:4, background:"var(--color-background-secondary)" },
  tab:(a)=>({ padding:"9px 12px", fontSize:13, cursor:"pointer", border:"none", background:"none", color:a?"var(--color-text-primary)":"var(--color-text-tertiary)", fontWeight:a?500:400, borderBottom:a?"2px solid #5daaff":"2px solid transparent" }),
};

function calcVenta(detalle, pago, montoPagado, saldoAplicado, productos) {
  const bruto = detalle.reduce((a,d)=>a+d.total,0);
  const desc = 0; // retención solo en planilla, no afecta el monto de la venta
  const neto = bruto - desc;
  const aPagar = neto - (saldoAplicado||0);
  const pagadoNum = pago==="fiado" ? 0 : (montoPagado!==""&&!isNaN(Number(montoPagado)) ? Number(montoPagado) : aPagar);
  const saldoDelta = pagadoNum - neto;
  const costo = detalle.reduce((a,d)=>{ const p=productos.find(x=>x.nombre===d.nombre); return a+(p?p.costo*d.cantidad:0); },0);
  return { bruto, desc, neto, aPagar, pagadoNum, saldoDelta, costo, ganancia:neto-costo };
}

// Comprime imagen a max 800px y calidad 0.75 antes de guardar
function comprimirFoto(file, maxW=800, quality=0.75) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(file);
  });
}


// Extrae coordenadas (lat,lng) de un link/texto de Google Maps. Devuelve {lat,lng} o null.
function extraerCoordsDeURL(url) {
  if(!url || typeof url !== "string") return null;
  let m;
  m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);            if(m) return {lat:+m[1], lng:+m[2]};
  m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);         if(m) return {lat:+m[1], lng:+m[2]};
  m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);        if(m) return {lat:+m[1], lng:+m[2]};
  m = url.match(/(-?\d+\.\d+)[,;\s]+(-?\d+\.\d+)/);        if(m) return {lat:+m[1], lng:+m[2]};
  return null;
}

// ════════════════════════════════════════════════════════════════════
// ◆  PieEnvases — pie de tarjeta de cliente UNIFICADO (todas las listas)
//    Botón ♻️ Envases + botones propios de cada pantalla + panel con Confirmar.
//    Guarda SIEMPRE en c.envAjuste (mecanismo único).
//    Uso: <PieEnvases c={c} ventas={ventas} onEditar={(id,cambios)=>...}
//           izquierda={<botón opcional/>}> {botones derecha opcionales} </PieEnvases>
// ════════════════════════════════════════════════════════════════════
function PieEnvases({c, ventas, onEditar, izquierda, children}) {
  const KEYS=["sifon","bidon10","bidon20","dispenser"];
  const KP={"Sifón 1.5L":"sifon","Bidón 10L":"bidon10","Bidón 20L":"bidon20","Dispenser":"dispenser"};
  const [draft,setDraft]=React.useState(null); // null = panel cerrado
  const calcExtra=()=>{
    const ex={sifon:0,bidon10:0,bidon20:0,dispenser:0};
    (ventas||[]).filter(v=>v.clienteId===c.id).forEach(v=>{
      (v.envPrest||[]).forEach(e=>{const k=KP[e.prod];if(k)ex[k]+=Number(e.cant)||0;});
      (v.envDev||[]).forEach(e=>{const k=KP[e.prod];if(k)ex[k]-=Number(e.cant)||0;});
    });
    return ex;
  };
  const abrir=()=>{
    const ex=calcExtra(), aj=c.envAjuste||{};
    setDraft({
      fijos:Object.fromEntries(KEYS.map(k=>[k,Number(c[k])||0])),
      prest:Object.fromEntries(KEYS.map(k=>[k,(ex[k]||0)+(aj[k]||0)])),
    });
  };
  const confirmar=()=>{
    const ex=calcExtra();
    onEditar(c.id,{
      ...Object.fromEntries(KEYS.map(k=>[k,Math.max(0,draft.fijos[k])])),
      envAjuste:Object.fromEntries(KEYS.map(k=>[k,draft.prest[k]-(ex[k]||0)])),
    });
    setDraft(null);
  };
  const abierto=!!draft;
  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:8}}>
        <div>{izquierda||null}</div>
        <div style={{display:"flex",gap:6}}>
          <button style={{...s.btn,fontSize:11,padding:"4px 10px",background:abierto?"#2e1f06":"var(--color-background-tertiary)",color:abierto?"#f5b942":"var(--color-text-secondary)",border:abierto?"1px solid #f5b942":"0.5px solid var(--color-border-secondary)"}}
            onClick={e=>{e.stopPropagation();abierto?setDraft(null):abrir();}}>♻️ Envases</button>
          {children}
        </div>
      </div>
      {abierto&&(
        <div style={{marginTop:8,background:"var(--color-background-tertiary)",borderRadius:8,padding:"8px 10px"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"grid",gridTemplateColumns:"82px 1fr 1fr 1fr 1fr",gap:4,fontSize:10,color:"var(--color-text-tertiary)",marginBottom:4}}>
            <span></span><span style={{textAlign:"center"}}>Sifón</span><span style={{textAlign:"center"}}>10L</span><span style={{textAlign:"center"}}>20L</span><span style={{textAlign:"center"}}>Disp</span>
          </div>
          {[["fijos","🏠 Fijos"],["prest","📦 Prestados"]].map(([t,l])=>(
            <div key={t} style={{display:"grid",gridTemplateColumns:"82px 1fr 1fr 1fr 1fr",gap:4,alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:11,color:t==="prest"?"var(--color-text-warning)":"var(--color-text-secondary)"}}>{l}</span>
              {KEYS.map(k=>(
                <input key={k} type="number" value={draft[t][k]}
                  onChange={e=>{const n=Math.round(Number(e.target.value)||0);setDraft(d=>({...d,[t]:{...d[t],[k]:n}}));}}
                  style={{...s.inputNum,padding:"6px 2px",fontSize:14,textAlign:"center",
                    fontWeight:t==="prest"&&draft[t][k]!==0?600:400,
                    color:t==="prest"?(draft[t][k]>0?"var(--color-text-warning)":draft[t][k]<0?"var(--color-text-success)":"var(--color-text-primary)"):"var(--color-text-primary)"}} />
              ))}
            </div>
          ))}
          <div style={{fontSize:10,color:"var(--color-text-tertiary)",margin:"2px 0 6px"}}>Prestados = total extra que tiene hoy · 0 = devolvió todo</div>
          <div style={{display:"flex",gap:6}}>
            <button style={{...s.btn,flex:1,fontSize:12}} onClick={e=>{e.stopPropagation();setDraft(null);}}>Cancelar</button>
            <button style={{flex:2,background:"#1d9e75",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:13,fontWeight:600,cursor:"pointer"}}
              onClick={e=>{e.stopPropagation();confirmar();}}>✓ Confirmar</button>
          </div>
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// ◆  FormCliente — formulario de cliente UNIFICADO (crear y editar)
//    Usado en: Nuevo cliente, Editar desde el perfil, Editar en Gestión.
//    Los envases prestados NO van acá: se editan con ♻️ Envases (PieEnvases).
// ════════════════════════════════════════════════════════════════════
function FormCliente({inicial, onGuardar, onEliminarCliente, textoGuardar}) {
  const [datos,setDatos] = React.useState({...(inicial||{})});
  const set = (k,v) => setDatos(d=>({...d,[k]:v}));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={s.grid2}>
        <div>
          <label style={s.label}>Día de reparto</label>
          <select style={s.select} value={datos.dia||"Martes"} onChange={e=>set("dia",e.target.value)}>
            {DIAS.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={s.label}>Número de orden</label>
          <input style={s.input} type="number" min={1} placeholder="ej: 5" value={datos.orden||""} onChange={e=>set("orden",Number(e.target.value)||"")} />
        </div>
      </div>
      <div>
        <label style={s.label}>Nombre y apellido *</label>
        <input style={s.input} placeholder="Nombre completo" value={datos.nombre||""} onChange={e=>set("nombre",e.target.value)} />
      </div>
      <div style={s.grid2}>
        <div><label style={s.label}>Barrio</label><input style={s.input} placeholder="Barrio" value={datos.barrio||""} onChange={e=>set("barrio",e.target.value)} /></div>
        <div><label style={s.label}>Sector</label><input style={s.input} placeholder="Sector" value={datos.sector||""} onChange={e=>set("sector",e.target.value)} /></div>
      </div>
      <div style={s.grid3}>
        <div><label style={s.label}>Manzana</label><input style={s.input} placeholder="Mz" value={datos.manzana||""} onChange={e=>set("manzana",e.target.value)} /></div>
        <div><label style={s.label}>Lote</label><input style={s.input} placeholder="Lote" value={datos.lote||""} onChange={e=>set("lote",e.target.value)} /></div>
        <div><label style={s.label}>Casa/Dpto</label><input style={s.input} placeholder="Casa" value={datos.aclaracion||""} onChange={e=>set("aclaracion",e.target.value)} /></div>
      </div>
      <div style={s.grid2}>
        <div><label style={s.label}>Calle</label><input style={s.input} placeholder="Calle" value={datos.calle||""} onChange={e=>set("calle",e.target.value)} /></div>
        <div><label style={s.label}>Número</label><input style={s.input} placeholder="Nro" value={datos.nro||""} onChange={e=>set("nro",e.target.value)} /></div>
      </div>
      <div>
        <label style={s.label}>Teléfono (sin 0 ni 15)</label>
        <input style={s.input} placeholder="3816559000" value={datos.telefono||""} onChange={e=>set("telefono",e.target.value)} />
      </div>
      <div>
        <label style={s.label}>Link Google Maps</label>
        <input style={s.input} placeholder="https://maps.app.goo.gl/..." value={datos.maps||""} onChange={e=>set("maps",e.target.value)} />
      </div>
      <div>
        <label style={s.label}>Link foto del domicilio (Google Drive, etc)</label>
        <input style={s.input} placeholder="https://..." value={datos.foto||""} onChange={e=>set("foto",e.target.value)} />
      </div>
      <div>
        <label style={s.label}>Notas rápidas (timbre roto, perro, cobrar deuda, etc.)</label>
        <input style={s.input} placeholder="ej: timbre roto, cobrar $2000..." value={datos.notas||""} onChange={e=>set("notas",e.target.value)} />
      </div>
      <label style={{...s.label,marginTop:4}}>Envases habituales asignados</label>
      <div style={s.grid3}>
        {[["sifon","Sifón"],["bidon10","Bidón 10L"],["bidon20","Bidón 20L"]].map(([k,l])=>(
          <div key={k}>
            <label style={{...s.label,textAlign:"center"}}>{l}</label>
            <input style={{...s.input,textAlign:"center"}} type="number" min={0} value={datos[k]||0} onChange={e=>set(k,Number(e.target.value))} />
          </div>
        ))}
      </div>
      <div>
        <label style={s.label}>Dispenser en comodato</label>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button style={{...s.btn,padding:"5px 14px",fontSize:18,lineHeight:1}} onClick={()=>set("dispenser",Math.max(0,(datos.dispenser||0)-1))}>−</button>
          <span style={{fontSize:18,fontWeight:500,minWidth:28,textAlign:"center",color:"var(--color-text-primary)"}}>{datos.dispenser||0}</span>
          <button style={{...s.btn,padding:"5px 14px",fontSize:18,lineHeight:1}} onClick={()=>set("dispenser",(datos.dispenser||0)+1)}>+</button>
          <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>unidades</span>
        </div>
      </div>
      <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>💡 Los envases prestados (extra) se ajustan con el botón ♻️ Envases.</div>
      {/* Saldo */}
      <div style={{...s.card,margin:"4px 0",background:"var(--color-background-tertiary)",padding:"10px 12px"}}>
        <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8}}>Saldo del cliente</div>
        <div style={{display:"flex",gap:8,marginBottom:6}}>
          {[["favor","A favor"],["deuda","Debe"],["cero","Sin saldo"]].map(([v,l])=>(
            <button key={v} style={{flex:1,fontSize:11,padding:"6px 4px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",cursor:"pointer",
              background:datos._tipoSaldo===v?"#185FA5":"var(--color-background-secondary)",
              color:datos._tipoSaldo===v?"#e2eaf4":"var(--color-text-secondary)"}}
              onClick={()=>set("_tipoSaldo",v)}>
              {l}
            </button>
          ))}
        </div>
        {datos._tipoSaldo&&datos._tipoSaldo!=="cero"&&(
          <div>
            <label style={s.label}>{datos._tipoSaldo==="favor"?"Monto a favor ($)":"Monto que debe ($)"}</label>
            <input style={s.input} type="number" min={0} placeholder="0"
              value={datos._montoSaldo||""}
              onChange={e=>set("_montoSaldo",e.target.value)} />
          </div>
        )}
        {(datos.saldo||0)!==0&&<div style={{fontSize:11,color:datos.saldo<0?"var(--color-text-danger)":"var(--color-text-success)",marginTop:4}}>
          Saldo actual: {fmt(datos.saldo)} · {datos.saldo<0?"Debe":"A favor"}
        </div>}
        <div style={{marginTop:6}}>
          <label style={s.label}>O ingresá el saldo directamente (−negativo = debe · +positivo = a favor)</label>
          <input style={s.input} type="number" placeholder="ej: -2500 o 1800"
            value={datos._saldoDirecto??""} onChange={e=>set("_saldoDirecto",e.target.value)} />
        </div>
      </div>
      {datos.foto&&<img src={datos.foto} alt="Domicilio" style={{width:"100%",borderRadius:8,maxHeight:160,objectFit:"cover"}} />}
      <button style={{...s.btnPrimary,marginTop:4,opacity:!datos.nombre?0.45:1}} disabled={!datos.nombre}
        onClick={()=>{
          let saldo = datos.saldo||0;
          if(datos._tipoSaldo==="favor")  saldo =  Math.abs(Number(datos._montoSaldo)||0);
          if(datos._tipoSaldo==="deuda")  saldo = -Math.abs(Number(datos._montoSaldo)||0);
          if(datos._tipoSaldo==="cero")   saldo = 0;
          if(datos._saldoDirecto!==undefined&&datos._saldoDirecto!=="") saldo=Number(datos._saldoDirecto);
          onGuardar({...datos, saldo});
        }}>
        {textoGuardar||"Guardar cliente"}
      </button>
      {onEliminarCliente&&(
        <div style={{marginTop:16,paddingTop:12,borderTop:"0.5px solid var(--color-border-tertiary)"}}>
          <button style={{...s.btnDanger,width:"100%",padding:"10px",fontSize:13}}
            onClick={()=>{if(window.confirm(`¿Eliminar a ${datos.nombre}? Se borrarán también todas sus ventas.`))onEliminarCliente();}}>
            Eliminar cliente permanentemente
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// ◆  buscarCliente — búsqueda UNIFICADA priorizando el DOMICILIO
//    Devuelve: 2 = coincide el domicilio · 1 = coincide nombre/tel/notas · 0 = no
//    Entiende: "juramento 59", "mz f l 28", "policial 3", barrios, sectores...
// ════════════════════════════════════════════════════════════════════
function buscarCliente(c, q) {
  const t = (q||"").trim().toLowerCase();
  if(!t) return 1; // sin búsqueda: todos pasan
  const domicilio = [
    c.calle, c.nro, (c.calle&&c.nro)?`${c.calle} ${c.nro}`:"",
    c.barrio, c.sector, c.aclaracion,
    c.manzana, c.lote,
    c.manzana?`mz ${c.manzana}`:"", c.lote?`l ${c.lote}`:"",
    (c.manzana&&c.lote)?`mz ${c.manzana} l ${c.lote}`:"",
    (c.manzana&&c.lote)?`manzana ${c.manzana} lote ${c.lote}`:"",
  ].filter(Boolean).join(" · ").toLowerCase();
  if(domicilio.includes(t)) return 2;
  if((c.nombre||"").toLowerCase().includes(t)) return 1;
  if(String(c.telefono||"").includes(t)) return 1;
  if((c.notas||"").toLowerCase().includes(t)) return 1;
  return 0;
}
