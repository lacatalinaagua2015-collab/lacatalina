// ════════════════════════════════════════════════════════════════════
// ◆  14-app.js — Componente App principal
// ════════════════════════════════════════════════════════════════════

// Barra de pestañas del hub de Clientes (Todos · Prospectos · Fiados · Dormidos · Mapa)
function ClientesTabs({activo, onIr}) {
  const tabs = [
    ["todos","👥","Todos","gestionClientes"],
    ["fiados","💰","Fiados","fiadosPendientes"],
    ["dormidos","😴","Dormidos","clientesDormidos"],
    ["mapa","🗺","Mapa","mapaClientes"],
  ];
  return (
    <div style={{display:"flex",gap:4,padding:"8px 8px",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)"}}>
      {tabs.map(([id,ico,lbl,pant])=>(
        <button key={id} onClick={()=>activo!==id&&onIr&&onIr(pant)}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"6px 2px",borderRadius:9,cursor:"pointer",
            border:"none",background:activo===id?"var(--color-background-tertiary)":"transparent",
            borderBottom:activo===id?"2px solid var(--color-accent)":"2px solid transparent"}}>
          <span style={{fontSize:16}}>{ico}</span>
          <span style={{fontSize:10,fontWeight:activo===id?600:400,color:activo===id?"var(--color-text-primary)":"var(--color-text-tertiary)"}}>{lbl}</span>
        </button>
      ))}
    </div>
  );
}

let _catIdSeq = 0;
function nuevoIdCat(){ _catIdSeq = (_catIdSeq + 1) % 1000; return Date.now()*1000 + _catIdSeq; }
function App() {
  const [pantalla, setPantalla]   = useState(()=>{
    const h = window.location.hash.slice(1)||"portada";
    const needsDia = ["diaPrincipal","selectorFechaClientes","selectorFechaPlanilla","inicioReparto","clientes","detalleCliente","venta","planilla"]; // historial does NOT need dia
    const savedDia = (() => { try { return JSON.parse(localStorage.getItem("cat_dia_actual")||'""'); } catch{ return ""; } })();
    if(needsDia.includes(h) && !savedDia) return "portada";
    return h;
  });
  const [diaActual, setDiaActual]   = useLS("cat_dia_actual", "");
  // Reset diaActual when it's invalid
  React.useEffect(()=>{
    if(diaActual && !DIAS.includes(diaActual)) setDiaActual("");
  },[]);
  const [fechaActual, setFechaActual] = useLS("cat_fecha_actual", ""); // ISO date key YYYY-MM-DD
  const [fechaObj, setFechaObj]   = useState(null);
  const [clienteId, setClienteId] = useState(null);
  const [pinOk, setPinOk] = React.useState(false);
  const [noVisitas, setNoVisitas] = useLS("cat_novisitas_v1", []);
  const [prospectos, setProspectos] = useLS("cat_prospectos_v1", []);
  const [recordatorios, setRecordatorios] = useLS("cat_recordatorios_v1", []);
  // recordatorio: {id, clienteId, clienteNombre, fecha, hora, motivo, dia, confirmado}
  const saveRecordatorios = (r) => { setRecordatorios(r); syncData({recordatorios:r}); };
  const recordatoriosActivos = (recordatorios||[]).filter(r=>!r.confirmado); // [{clienteId,dia,fecha,motivo}]
  const [clientes, setClientes]   = useLS("cat_clientes_v3", CLIENTES_INICIALES);
  const [ventasRaw, setVentasRaw] = useLS("cat_ventas_v3", []);
  const normalizarFechaKey = (v) => {
    if(v.fechaKey) return v;
    const fk = v.fecha ? (()=>{
      const parts = v.fecha.split('/');
      if(parts.length>=3){
        const d=parts[0].trim(),m=parts[1].trim(),y=parts[2].split(',')[0].trim();
        if(y.length===4) return y+'-'+m.padStart(2,'0')+'-'+d.padStart(2,'0');
      }
      return '';
    })() : '';
    return {...v, fechaKey:fk};
  };
  const ventas = React.useMemo(()=>(ventasRaw||[]).map(normalizarFechaKey),[ventasRaw]);
  const setVentas = (arg) => setVentasRaw(typeof arg==='function' ? prev=>arg(prev) : arg);
  const [productos, setProductos] = useLS("cat_productos_v3", PRODUCTOS_INICIALES);
  const normStock = (s) => {
    const e = () => ({sifon:0,bidon10:0,bidon20:0,dispenser:0});
    const pick = (o) => ({sifon:o?.sifon||0,bidon10:o?.bidon10||0,bidon20:o?.bidon20||0,dispenser:o?.dispenser||0});
    const base = {soderia:e(),soderia_vacios:e(),casa:e(),camion:e()};
    if(!s||typeof s!=="object") return base;
    if(s.soderia&&typeof s.soderia==="object") {
      return {
        soderia:    pick(s.soderia),
        soderia_vacios: pick(s.soderia_vacios),
        casa:       pick(s.casa),
        camion:     pick(s.camion),
      };
    }
    // formato viejo (plano) → todo a sodería llenos
    return {soderia:pick(s), soderia_vacios:e(), casa:e(), camion:e()};
  };
  const [stockRaw, setStockRaw] = useLS("cat_stock_v4", {soderia:{sifon:0,bidon10:0,bidon20:0,dispenser:0},soderia_vacios:{sifon:0,bidon10:0,bidon20:0,dispenser:0},casa:{sifon:0,bidon10:0,bidon20:0,dispenser:0},camion:{sifon:0,bidon10:0,bidon20:0,dispenser:0}});
  const stockNorm = React.useMemo(()=>normStock(stockRaw), [JSON.stringify(stockRaw)]);
  const setStock = (sOrFn) => {
    if(typeof sOrFn === "function") {
      setStockRaw(prev => normStock(sOrFn(normStock(prev))));
    } else {
      setStockRaw(normStock(sOrFn));
    }
  };
  // Auto-migrate old stock format on first load
  React.useEffect(()=>{
    // Force normalize stock on every mount
    const normalized = normStock(stockRaw);
    if(JSON.stringify(normalized) !== JSON.stringify(stockRaw)) setStockRaw(normalized);
  },[]);
  // Helper: transferir del camión a sodería al cerrar el día
  const cerrarCamion = (sobrLlenos, vacios) => {
    setStock(prev=>{
      const s = JSON.parse(JSON.stringify(normStock(prev)));
      ["sifon","bidon10","bidon20","dispenser"].forEach(k=>{
        s.soderia[k]    = (s.soderia[k]||0) + (sobrLlenos[k]||0);
        s.soderia_vacios[k] = (s.soderia_vacios[k]||0) + (vacios[k]||0);
        s.camion[k]  = Math.max(0, (s.camion[k]||0) - (sobrLlenos[k]||0) - (vacios[k]||0));
      });
      syncData({stock:s});
      return s;
    });
  };
  const [planillas, setPlanillas] = useLS("cat_planillas_v1", {});
  // Cargas de salida por día — declarado acá arriba para que estadoRef pueda incluirlo y viaje a Firebase
  const [cargasDia, setCargasDia] = useLS("cat_cargas_dia_v1", CARGA_DIA_DEFAULT);
  // Firebase — credentials embedded in SDK config above
  const apiKey = "firebase";
  const binId  = "firebase";
  const [syncStatus, setSyncStatus] = useState("idle");
  const [ecToken, setEcToken] = useState(()=>localStorage.getItem('lc_ec_token')||'');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOfflineSync, setPendingOfflineSync] = useState(
    ()=>!!localStorage.getItem("sr_offline_pending")
  );
  const [cloudSetup, setCloudSetup] = useState(false);
  const [darkMode, setDarkMode]   = useLS("cat_darkmode", false);
  const [tabConfig, setTabConfig] = useState("stock");
  const [zonasReparto, setZonasReparto] = useLS("cat_zonas_v1", {});
  const [modalResumenDia, setModalResumenDia] = useState(null); // {dia, fechaKey}
  const [scaleIdx, setScaleIdx]   = useLS("cat_scale_v1", 1); // 0=S 1=M 2=L 3=XL
  const SCALES = [0.82, 1.0, 1.18, 1.36];
  const SCALE_LABELS = ["S","M","L","XL"];

  // Apply dark/light mode toggle over base dark theme
  React.useEffect(()=>{
    if(!darkMode){
      document.body.style.background = "#f0f4f8";
      document.documentElement.style.setProperty("--color-background-primary","#ffffff");
      document.documentElement.style.setProperty("--color-background-secondary","#f4f4f5");
      document.documentElement.style.setProperty("--color-background-tertiary","#e8ecf0");
      document.documentElement.style.setProperty("--color-text-primary","#18181b");
      document.documentElement.style.setProperty("--color-text-secondary","#71717a");
      document.documentElement.style.setProperty("--color-text-tertiary","#a1a1aa");
      document.documentElement.style.setProperty("--color-text-info","#1d4ed8");
      document.documentElement.style.setProperty("--color-text-success","#15803d");
      document.documentElement.style.setProperty("--color-text-warning","#a16207");
      document.documentElement.style.setProperty("--color-text-danger","#b91c1c");
      document.documentElement.style.setProperty("--color-background-info","#dbeafe");
      document.documentElement.style.setProperty("--color-background-success","#dcfce7");
      document.documentElement.style.setProperty("--color-background-warning","#fef9c3");
      document.documentElement.style.setProperty("--color-background-danger","#fee2e2");
      document.documentElement.style.setProperty("--color-border-tertiary","rgba(0,0,0,0.10)");
      document.documentElement.style.setProperty("--color-border-secondary","rgba(0,0,0,0.18)");
    } else {
      document.body.style.background = "#080f17";
      document.documentElement.style.setProperty("--color-background-primary","#0f1923");
      document.documentElement.style.setProperty("--color-background-secondary","#1a2b3c");
      document.documentElement.style.setProperty("--color-background-tertiary","#253647");
      document.documentElement.style.setProperty("--color-text-primary","#e2eaf4");
      document.documentElement.style.setProperty("--color-text-secondary","#7a9ab8");
      document.documentElement.style.setProperty("--color-text-tertiary","#4a6a85");
      document.documentElement.style.setProperty("--color-text-info","#5daaff");
      document.documentElement.style.setProperty("--color-text-success","#4dd9a0");
      document.documentElement.style.setProperty("--color-text-warning","#f5b942");
      document.documentElement.style.setProperty("--color-text-danger","#f07070");
      document.documentElement.style.setProperty("--color-background-info","#1e3a5f");
      document.documentElement.style.setProperty("--color-background-success","#0a2e1f");
      document.documentElement.style.setProperty("--color-background-warning","#2e1f06");
      document.documentElement.style.setProperty("--color-background-danger","#2e0a0a");
      document.documentElement.style.setProperty("--color-border-tertiary","rgba(255,255,255,0.07)");
      document.documentElement.style.setProperty("--color-border-secondary","rgba(255,255,255,0.13)");
    }
  },[darkMode]);

  // Al iniciar, si hay credenciales guardadas, cargar datos de la nube
  const { useEffect } = React;
  useEffect(() => {
    if (!apiKey || !binId) return;
    setSyncStatus("saving");
    setSyncStatus("loading");
    cloudLoad().then(function(data) {
      if(!data) { setSyncStatus("idle"); return; }
      if (data.clientes?.length)   setClientes(data.clientes);
      // ── Ventas: MERGEAR en vez de sobreescribir ──────────────────────────
      // Si el celular tenía ventas no sincronizadas, no las pisamos con Firebase
      if (data.ventas?.length) {
        const ventasLocales = (()=>{ try{ return JSON.parse(localStorage.getItem("cat_ventas_v3")||"[]"); }catch{ return []; } })();
        // ── MERGE INTELIGENTE: por cada venta, quedarse con la versión MÁS NUEVA ──
        // Se compara el sello _upd (última modificación). Si empatan (o son datos
        // viejos sin sello), se prioriza la transferencia YA confirmada para no revivirla.
        const porId = {};
        (data.ventas||[]).forEach(v=>{ porId[v.id] = v; });               // base: lo de la nube
        let cambiosLocales = 0;
        ventasLocales.forEach(v=>{
          const enNube = porId[v.id];
          if(!enNube){ porId[v.id] = v; cambiosLocales++; return; }       // solo en local → la agrego
          const uL = Number(v._upd)||0, uN = Number(enNube._upd)||0;
          const ganaLocal = (uL !== uN)
            ? uL > uN                                                     // gana la más nueva
            : (!!v.transConfirmada && !enNube.transConfirmada);          // empate → no revivir una confirmada
          if(ganaLocal){ porId[v.id] = v; cambiosLocales++; }
        });
        const merged = Object.values(porId);
        setVentasRaw(merged);
        // Si el celular tenía versiones más nuevas que la nube, sincronizarlas ahora
        if(cambiosLocales > 0) {
          console.log("Merge: "+cambiosLocales+" ventas locales más nuevas que Firebase, sincronizando...");
          setTimeout(()=>syncData({ventas:merged}), 2000);
        }
      }
      if (data.planillas)          setPlanillas(data.planillas);
      if (data.stock) {
        const ds = data.stock;
        const normStock = ds.soderia ? ds : {
          soderia:{sifon:ds.sifon||0,bidon10:ds.bidon10||0,bidon20:ds.bidon20||0},
          casa:   {sifon:0,bidon10:0,bidon20:0},
          camion: {sifon:0,bidon10:0,bidon20:0},
        };
        setStock(normStock);
      }
      if (data.productos?.length)  setProductos(data.productos);
      if (data.noVisitas?.length)  setNoVisitas(data.noVisitas);
      if (data.prospectos?.length) setProspectos(data.prospectos);
      if (data.recordatorios?.length) setRecordatorios(data.recordatorios);
      if (data.mantVeh?.length)    localStorage.setItem("cat_mant_vehiculo_v1", JSON.stringify(data.mantVeh));
      if (data.histPrecios?.length) localStorage.setItem("lc_hist_precios", JSON.stringify(data.histPrecios));
      if (data.zonasReparto && Object.keys(data.zonasReparto).length) setZonasReparto(data.zonasReparto);
      if (data.cargasDia && Object.keys(data.cargasDia).length) setCargasDia(data.cargasDia);
      setSyncStatus("saved");
      setTimeout(()=>setSyncStatus("idle"), 2000);
    });
  }, []);

  // Ref siempre actualizado — evita datos viejos en el debounce
  const estadoRef = React.useRef({clientes,ventas,planillas,stock:stockNorm,productos,noVisitas,recordatorios,prospectos,cargasDia});
  React.useEffect(()=>{ estadoRef.current={clientes,ventas,planillas,stock:stockNorm,productos,noVisitas,recordatorios,prospectos,zonasReparto,cargasDia}; });

  // ── AUTO-BACKUP mejorado ────────────────────────────────────────────────
  // Guarda cada 10 minutos (no solo al arrancar) y mantiene los últimos 3 días
  React.useEffect(()=>{
    const hacerBackup = () => {
      try {
        const hoy = new Date().toLocaleDateString("en-CA");
        const payload = JSON.stringify({clientes,ventas,planillas});
        localStorage.setItem("lc_backup_"+hoy, payload);
        localStorage.setItem("lc_ultimo_backup", hoy);
        // Mantener solo los últimos 3 días de backup
        const keys = Object.keys(localStorage).filter(k=>k.startsWith("lc_backup_")).sort().reverse();
        keys.slice(3).forEach(k=>localStorage.removeItem(k));
        console.log("Auto-backup guardado:", hoy, new Date().toLocaleTimeString());
      } catch(e){ console.warn("Auto-backup falló:", e); }
    };
    hacerBackup(); // inmediato al cargar
    const intervalo = setInterval(hacerBackup, 10 * 60 * 1000); // cada 10 minutos
    return () => clearInterval(intervalo);
  },[clientes, ventas, planillas]);

  // ── LIMPIEZA AUTOMÁTICA de ventas antiguas ──────────────────────────────
  // Archiva a Firebase y elimina localmente ventas de más de 3 meses
  React.useEffect(()=>{
    if(!ventas.length) return;
    const hoy = new Date();
    const limite = new Date(hoy.getFullYear(), hoy.getMonth()-3, hoy.getDate());
    const limiteKey = limite.toLocaleDateString("en-CA");
    const viejas = ventas.filter(v=>v.fechaKey && v.fechaKey < limiteKey);
    if(!viejas.length) return;
    // Archivar las viejas en Firebase antes de borrarlas localmente
    if(window.db) {
      const col = window.db.collection("lc2");
      const archivoKey = "archivo_ventas_"+limiteKey;
      col.doc(archivoKey).set({d: viejas, archivadasEl: hoy.toISOString()})
        .then(()=>{
          // Solo borrar localmente si se guardaron en Firebase
          const ventasRecientes = ventas.filter(v=>!v.fechaKey || v.fechaKey >= limiteKey);
          if(ventasRecientes.length < ventas.length) {
            console.log("Limpieza automática: archivadas "+viejas.length+" ventas antiguas en Firebase");
            setVentasRaw(ventasRecientes);
            syncData({ventas: ventasRecientes});
          }
        })
        .catch(e=>console.warn("No se pudieron archivar ventas antiguas:", e));
    }
  },[]); // solo al arrancar

  const syncData = (overrides={}) => {
    if(!window.db) return;
    setSyncStatus("saving");
    const mantVehActual = (() => { try { return JSON.parse(localStorage.getItem("cat_mant_vehiculo_v1")||"[]"); } catch { return []; } })();
    const histPreciosActual = (() => { try { return JSON.parse(localStorage.getItem("lc_hist_precios")||"[]"); } catch { return []; } })();
    const data = { ...estadoRef.current, ...overrides, noVisitas: estadoRef.current.noVisitas||[], prospectos: overrides.prospectos!==undefined ? overrides.prospectos : (estadoRef.current.prospectos||[]), recordatorios: estadoRef.current.recordatorios||[], mantVeh: overrides.mantVeh||mantVehActual, histPrecios: overrides.histPrecios||histPreciosActual, zonasReparto: overrides.zonasReparto||estadoRef.current.zonasReparto||{} };
    estadoRef.current = data;
    debounceSave(() => {
      if(!navigator.onLine) {
        try { localStorage.setItem("sr_offline_pending", JSON.stringify(data)); } catch {}
        setPendingOfflineSync(true);
        setSyncStatus("offline_pending");
        return;
      }
      cloudSave(data).then(function(ok){
        if(ok){
          localStorage.removeItem("sr_offline_pending");
          setPendingOfflineSync(false);
          setSyncStatus("saved");
        } else {
          try { localStorage.setItem("sr_offline_pending", JSON.stringify(data)); } catch {}
          setPendingOfflineSync(true);
          setSyncStatus("offline_pending");
        }
      }).catch(function(){
        try { localStorage.setItem("sr_offline_pending", JSON.stringify(data)); } catch {}
        setPendingOfflineSync(true);
        setSyncStatus("offline_pending");
      });
    });
  };

  // ── MODO OFFLINE ──────────────────────────────────────────────────
  React.useEffect(()=>{
    const goOnline = () => {
      setIsOnline(true);
      const pending = localStorage.getItem("sr_offline_pending");
      if(pending) {
        setSyncStatus("saving");
        try {
          const data = JSON.parse(pending);
          cloudSave(data).then(ok=>{
            if(ok){ localStorage.removeItem("sr_offline_pending"); setPendingOfflineSync(false); setSyncStatus("saved"); setTimeout(()=>setSyncStatus("idle"),2500); }
            else { setSyncStatus("error"); setTimeout(()=>setSyncStatus("offline_pending"),3000); }
          }).catch(()=>{ setSyncStatus("error"); setTimeout(()=>setSyncStatus("offline_pending"),3000); });
        } catch { localStorage.removeItem("sr_offline_pending"); setPendingOfflineSync(false); }
      }
    };
    const goOffline = () => { setIsOnline(false); setSyncStatus("offline"); };
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return ()=>{ window.removeEventListener("online",goOnline); window.removeEventListener("offline",goOffline); };
  },[]);

  // ── NOTIFICACIONES ────────────────────────────────────────────────
  React.useEffect(()=>{
    if(!("Notification" in window)) return;

    // Convierte la VAPID public key de base64url a Uint8Array
    function _vapidToUint8(base64String) {
      const p = (base64String + '===').slice(0, base64String.length + (4 - base64String.length % 4) % 4);
      const raw = window.atob(p.replace(/-/g, '+').replace(/_/g, '/'));
      return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
    }

    // Suscribe al navegador a Web Push y guarda la suscripcion en Firestore
    async function suscribirPush() {
      if (!('PushManager' in window)) return;
      try {
        const sw = await navigator.serviceWorker.ready;
        // Verificar si ya hay suscripcion activa y guardada
        const sub = await sw.pushManager.getSubscription();
        if (sub && localStorage.getItem('lc_push_ok_v1')) return; // ya esta listo

        const VAPID_PUBLIC = 'BLvllGAY5r46Zi6cwHnbfCrQeV-NVnBq-kwrmX8n_UCvqTkVSh1Hserwp1kiQMiRF8LiAiDq_-CY1J8xproao8I';
        const nuevaSub = sub || await sw.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: _vapidToUint8(VAPID_PUBLIC),
        });
        // Guardar suscripcion en Firestore para que GitHub Actions la lea
        if (window.db) {
          await window.db.collection('lc2').doc('push_sub').set({
            sub: JSON.stringify(nuevaSub.toJSON()),
            ts: Date.now(),
          });
          localStorage.setItem('lc_push_ok_v1', '1');
          console.log('✅ Push subscription guardada en Firestore');
        }
      } catch(e) { console.log('Push sub error:', e.message); }
    }

    const pedirPermiso = async () => {
      if (Notification.permission === "default") await Notification.requestPermission();
      if (Notification.permission === "granted") await suscribirPush();
    };
    pedirPermiso();
    const programar18hs = () => {
      const ahora = new Date();
      const hoy18 = new Date(ahora.getFullYear(),ahora.getMonth(),ahora.getDate(),18,0,0);
      let ms = hoy18 - ahora; if(ms<0) ms += 24*60*60*1000;
      return setTimeout(()=>{
        if(Notification.permission==="granted"){
          const hoyKey = new Date().toLocaleDateString("en-CA");
          if(!localStorage.getItem(`notif_cierre_${hoyKey}`)){
            new Notification("🚚 Sistema de Reparto",{body:"Son las 18:00 — ¿Ya cerraste el día?",icon:"/icon-192.png",tag:"cierre-dia"});
            localStorage.setItem(`notif_cierre_${hoyKey}`,"1");
          }
        }
        programar18hs();
      }, ms);
    };
    const t18 = programar18hs();
    const chequearMantenimiento = () => {
      if(Notification.permission!=="granted") return;
      const mantList = (()=>{ try{ return JSON.parse(localStorage.getItem("cat_mant_vehiculo_v1")||"[]"); }catch{ return []; } })();
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      mantList.forEach(m=>{
        if(!m.proximaFechaISO) return;
        const proxFecha = new Date(m.proximaFechaISO+"T12:00:00"); proxFecha.setHours(0,0,0,0);
        const diffDias = Math.round((proxFecha-hoy)/(1000*60*60*24));
        if(diffDias===3||diffDias===2||diffDias===1){
          const nk = `notif_mant_${m.proximaFechaISO}_${m.tipo}`;
          const hoyKey = new Date().toLocaleDateString("en-CA");
          if(!localStorage.getItem(`${nk}_${hoyKey}`)){
            const tipoLabel={aceite:"Cambio de aceite",preventivo:"Mantenimiento preventivo",embrague:"Cambio de embrague",reparacion:"Reparación",otro:"Mantenimiento"}[m.tipo]||m.tipo;
            new Notification("🔧 Vencimiento de mantenimiento",{body:`${tipoLabel} vence en ${diffDias} día${diffDias>1?"s":""}${m.descripcion?" — "+m.descripcion:""}`,icon:"/icon-192.png",tag:nk});
            localStorage.setItem(`${nk}_${hoyKey}`,"1");
          }
        }
      });
    };
    chequearMantenimiento();
    const tMant = setInterval(chequearMantenimiento, 60*60*1000);
    return ()=>{ clearTimeout(t18); clearInterval(tMant); };
  },[]);

  const saveClientes = (v) => { setClientes(v); syncData({clientes:v}); };
  const saveVentas   = (v) => { setVentasRaw(v);   syncData({ventas:v}); };

  // Hooks globales: respaldo COMPLETO descargable + restaurar
  React.useEffect(()=>{
    // Descargar un archivo .json con TODOS los datos
    window._descargarRespaldo = () => {
      const mantVeh = (()=>{ try { return JSON.parse(localStorage.getItem("cat_mant_vehiculo_v1")||"[]"); } catch { return []; } })();
      const histPrecios = (()=>{ try { return JSON.parse(localStorage.getItem("lc_hist_precios")||"[]"); } catch { return []; } })();
      const data = { ...estadoRef.current, mantVeh, histPrecios,
        _respaldo:true, _app:"la-catalina", _fecha:new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const f = new Date().toLocaleDateString("es-AR").replace(/\//g,"-");
      a.href = url; a.download = `respaldo-completo_la-catalina_${f}.json`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
    };
    // Restaurar desde un objeto de datos (ya parseado del .json)
    window._restaurarRespaldo = (data) => {
      if(!data || typeof data!=="object") { alert("El archivo no es un respaldo válido."); return false; }
      try {
        if(data.clientes!==undefined)   setClientes(data.clientes||[]);
        if(data.ventas!==undefined)     setVentasRaw(data.ventas||[]);
        if(data.planillas!==undefined)  setPlanillas(data.planillas||{});
        if(data.stock){
          const ds=data.stock;
          const ns = ds.soderia ? ds : {soderia:{sifon:ds.sifon||0,bidon10:ds.bidon10||0,bidon20:ds.bidon20||0},casa:{sifon:0,bidon10:0,bidon20:0},camion:{sifon:0,bidon10:0,bidon20:0}};
          setStock(ns);
        }
        if(data.productos!==undefined)  setProductos(data.productos||[]);
        if(data.noVisitas!==undefined)  setNoVisitas(data.noVisitas||[]);
        if(data.prospectos!==undefined) setProspectos(data.prospectos||[]);
        if(data.recordatorios!==undefined) setRecordatorios(data.recordatorios||[]);
        if(data.mantVeh!==undefined)    localStorage.setItem("cat_mant_vehiculo_v1", JSON.stringify(data.mantVeh||[]));
        if(data.histPrecios!==undefined) localStorage.setItem("lc_hist_precios", JSON.stringify(data.histPrecios||[]));
        if(data.zonasReparto!==undefined) setZonasReparto(data.zonasReparto||{});
        if(data.cargasDia && Object.keys(data.cargasDia).length) setCargasDia(data.cargasDia);
        // Subir lo restaurado a la nube
        try { cloudSave({ ...estadoRef.current, ...data }); } catch {}
        return true;
      } catch(e){ alert("Error al restaurar: "+e.message); return false; }
    };
    return ()=>{ delete window._descargarRespaldo; delete window._restaurarRespaldo; };
  }, []);

  const savePlanillasCloud = (v) => { setPlanillas(v); syncData({planillas:v}); };
  const saveStock    = (v) => { setStock(v);    syncData({stock:v}); };
  const saveProductos= (v) => {
    // Registrar cambio de precio en historial
    const hoy = new Date().toISOString().slice(0,16);
    const histPrecios = JSON.parse(localStorage.getItem("lc_hist_precios")||"[]");
    histPrecios.push({fecha:hoy, productos:v.map(p=>({nombre:p.nombre,precio:p.precio,costo:p.costo}))});
    localStorage.setItem("lc_hist_precios", JSON.stringify(histPrecios.slice(-50)));
    setProductos(v); syncData({productos:v});
  };
  const saveCargasDia = (v) => { setCargasDia(v); try{localStorage.setItem("cat_cargas_dia_v1",JSON.stringify(v));}catch{} syncData({cargasDia:v}); };
  const saveNoVisitas= (v) => { setNoVisitas(v); try{localStorage.setItem("cat_novisitas_v1",JSON.stringify(v));}catch{} };
  const saveProspectos=(v)=>{ setProspectos(v); try{localStorage.setItem("cat_prospectos_v1",JSON.stringify(v));}catch{} syncData({prospectos:v}); };

  const cliente = clientes.find(c=>c.id===clienteId)||null;
  const irA = (p) => {
    const needsDia = ["diaPrincipal","selectorFechaClientes","selectorFechaPlanilla","inicioReparto","clientes","detalleCliente","venta","planilla"]; // historial does NOT need dia
    if(needsDia.includes(p) && !diaActual) { setPantalla("menu"); window.history.pushState({pantalla:"menu"},'','#menu'); window.scrollTo(0,0); return; }
    setPantalla(p);
    window.scrollTo(0,0);
    window.history.pushState({pantalla:p},'',`#${p}`);
  };

  // Handle back button
  React.useEffect(()=>{
    const handler = (e)=>{
      const p = e.state?.pantalla || "portada";
      const needsDia = ["diaPrincipal","selectorFechaClientes","selectorFechaPlanilla","inicioReparto","clientes","detalleCliente","venta","planilla"]; // historial does NOT need dia
      if(needsDia.includes(p) && !diaActual) { setPantalla("menu"); return; }
      setPantalla(p);
      window.scrollTo(0,0);
    };
    window.addEventListener('popstate', handler);
    return ()=>window.removeEventListener('popstate', handler);
  },[]);

  const updateCliente = (id, cambios) => {
    const nueva = clientes.map(c=>c.id===id?{...c,...cambios}:c);
    saveClientes(nueva);
  };
  const savePlanilla = (dia, datos) => {
    const nueva = {...planillas,[dia]:datos};
    savePlanillasCloud(nueva);
  };
  const getPlanilla = (dia) => planillas[dia]||planillaDiaVacia();

  // Auto-guardado de planilla cuando todos los clientes del día tienen estado
  React.useEffect(()=>{
    if(!diaActual||!fechaActual) return;
    const clientesDia = clientes.filter(c=>c.dia===diaActual);
    if(clientesDia.length===0) return;
    const ventasDia   = ventas.filter(v=>v.dia===diaActual&&v.fechaKey===fechaActual);
    const noVisitasDia= (noVisitas||[]).filter(v=>v.dia===diaActual&&v.fecha===fechaActual);
    const atendidos   = new Set(ventasDia.map(v=>v.clienteId));
    const conEstado   = new Set([...atendidos,...noVisitasDia.map(v=>v.clienteId)]);
    const todosVisitados = clientesDia.every(c=>conEstado.has(c.id));
    if(!todosVisitados) return;
    // Calcular valores automáticos para la planilla
    const CAJON_SODA=6;
    const getProdCosto=(nombre)=>{const p=(productos||[]).find(x=>x.nombre===nombre);return p?(p.costo||0):0;};
    const costSifon=getProdCosto("Sifón 1.5L")||133.33;
    const costB10=getProdCosto("Bidón 10L")||800;
    const costB20=getProdCosto("Bidón 20L")||1100;
    const tots={b10:{vacios:0},b20:{vacios:0},soda:{vacios:0}};
    const prodKey={"Bidón 10L":"b10","Bidón 20L":"b20","Sifón 1.5L":"soda"};
    ventasDia.forEach(v=>v.detalle.forEach(d=>{const k=prodKey[d.nombre];if(k)tots[k].vacios+=d.cantidad;}));
    const sodaCajones=Math.floor(tots.soda.vacios/CAJON_SODA)||0;
    const cobEfectivo=ventasDia.filter(v=>v.pago==="contado").reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
    const cobFiado=ventasDia.filter(v=>v.pago==="fiado").reduce((a,v)=>a+(v.neto||0),0);
    const cobTransBruto=ventasDia.filter(v=>v.pago==="transferencia").reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
    const cobTransDesc=Math.round(cobTransBruto*0.025);
    const planillaKey=`${diaActual}_${fechaActual}`;
    const planillaActual=planillas[planillaKey]||planillaDiaVacia();
    // Solo auto-completar campos vacíos, nunca pisar lo que el usuario editó
    const nueva={
      ...planillaActual,
      fecha:planillaActual.fecha||fechaActual,
      efectivo:planillaActual.efectivo||(cobEfectivo>0?String(Math.round(cobEfectivo)):""),
      fiado:planillaActual.fiado||(cobFiado>0?String(Math.round(cobFiado)):""),
      retenciones:planillaActual.retenciones||(cobTransDesc>0?String(cobTransDesc):""),
      _autoGuardado:true,
    };
    // Solo guardar si cambió algo
    if(JSON.stringify(nueva)!==JSON.stringify(planillaActual)){
      savePlanilla(planillaKey, nueva);
    }
    // CIERRE AUTOMÁTICO DEL STOCK — se ejecuta una sola vez por día
    const camionCerradoKey = `lc_cam_${planillaKey}`;
    if(planillaActual.iniciado && !planillaActual._stockCerrado && !localStorage.getItem(camionCerradoKey)) {
      localStorage.setItem(camionCerradoKey, "1");
      savePlanilla(planillaKey, {...nueva, _stockCerrado:true});
      const prodMap = {"Bidón 10L":"b10","Bidón 20L":"b20","Sifón 1.5L":"soda","Dispenser":"disp"};
      // Cuánto salió en el camión (según planilla de inicio de reparto)
      const llenos = {
        b10: Number(planillaActual.productos?.b10?.llenos||0),
        b20: Number(planillaActual.productos?.b20?.llenos||0),
        soda: Number(planillaActual.productos?.soda?.llenos||0),
        disp: 0,
      };
      // Cuánto se vendió (cada venta = 1 vacío que vuelve en el intercambio)
      const vendidos = {b10:0,b20:0,soda:0,disp:0};
      ventasDia.forEach(v=>v.detalle.forEach(d=>{const k=prodMap[d.nombre];if(k)vendidos[k]+=d.cantidad;}));
      // Préstamos (sin recibir vacío) y devoluciones de deudas anteriores
      const prestados = {b10:0,b20:0,soda:0,disp:0};
      const devueltos = {b10:0,b20:0,soda:0,disp:0};
      ventasDia.forEach(v=>{
        (v.envPrest||[]).forEach(e=>{const k=prodMap[e.prod];if(k)prestados[k]+=Number(e.cant)||0;});
        (v.envDev||[]).forEach(e=>{const k=prodMap[e.prod];if(k)devueltos[k]+=Number(e.cant)||0;});
      });
      setStock(prev=>{
        const s=JSON.parse(JSON.stringify(normStock(prev)));
        ["b10","b20","soda","disp"].forEach(pk=>{
          const sk=pk==="b10"?"bidon10":pk==="b20"?"bidon20":pk==="disp"?"dispenser":"sifon";
          const sorb=Math.max(0, llenos[pk]-vendidos[pk]-prestados[pk]); // sobrantes llenos en camión
          const vacios=vendidos[pk]+devueltos[pk]; // vacíos que vuelven (vendidos + devoluciones)
          s.soderia[sk]=(s.soderia[sk]||0)+sorb;            // sobrantes llenos → sodería (llenos)
          s.soderia_vacios[sk]=(s.soderia_vacios[sk]||0)+vacios;    // vacíos que vuelven → sodería (vacíos)
          s.camion[sk]=Math.max(0,(s.camion[sk]||0)-sorb-vacios); // camión queda en 0
          s.casa[sk]=Math.max(0,(s.casa[sk]||0)-Math.max(0,prestados[pk])); // préstamos salen del depósito
        });
        syncData({stock:normStock(s)});
        return normStock(s);
      });

      // ── Enviar datos del día a Emma Control ──
      if(ecToken && window.enviarAEmmaControl){
        const cobEf=ventasDia.filter(v=>v.pago==="contado").reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
        const cobTr=ventasDia.filter(v=>v.pago==="transferencia").reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
        const totalCob=Math.round(cobEf+cobTr);
        const gastosData=(planillaActual.gastos||[]).filter(g=>g.monto&&Number(g.monto)>0).map(g=>({
          desc:g.desc||'Gasto reparto',
          monto:Number(g.monto),
          cat:g.cat||'Otros',
          metodo:g.metodo||'efectivo',
        }));
        window.enviarAEmmaControl(ecToken, fechaActual, {total:totalCob,efectivo:Math.round(cobEf),transferencia:Math.round(cobTr)}, gastosData);
      }
    }
  }, [ventas, noVisitas, clientes, diaActual, fechaActual, planillas, ecToken]);

  // ── SISTEMA DE NOTIFICACIONES ──────────────────────────────────────────────
  const notifEnviadasRef = React.useRef({});

  // Genera un tono de 3 pulsos con Web Audio API (sin archivos externos)
  const playNotifSound = React.useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [[880,0,0.12],[1100,0.18,0.12],[880,0.36,0.18]].forEach(([freq,t,dur])=>{
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'sine';
        gain.gain.setValueAtTime(0.35, ctx.currentTime+t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+t+dur);
        osc.start(ctx.currentTime+t); osc.stop(ctx.currentTime+t+dur+0.05);
      });
    } catch(e) {}
  }, []);

  // Muestra una notificación nativa (solo una vez por clave por día)
  const showNotif = React.useCallback((titulo, cuerpo, clave) => {
    if(notifEnviadasRef.current[clave]) return;
    notifEnviadasRef.current[clave] = true;
    playNotifSound();
    if('Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, {
        body: cuerpo,
        icon: '/favicon.ico',
        vibrate: [200, 100, 200, 100, 200],
        tag: clave,
      });
    }
  }, [playNotifSound]);

  // Verificador de notificaciones — corre al iniciar y cada 60 segundos
  React.useEffect(() => {
    const horaNotifCierre = localStorage.getItem('lc_hora_notif_cierre') || '18:00';
    const check = () => {
      if(!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const hoy = now.toLocaleDateString("en-CA");

      // 1. Transferencias pendientes a las 13:00 y 19:00
      if(hhmm === '13:00' || hhmm === '19:00') {
        const pendientes = (ventas||[]).filter(v =>
          v.fechaKey === hoy &&
          (v.pago === 'transferencia' || v._esMixtoTrans) &&
          !v.transConfirmada
        );
        if(pendientes.length > 0) {
          showNotif(
            '💳 Transferencias pendientes',
            `Tenés ${pendientes.length} transferencia${pendientes.length > 1 ? 's' : ''} sin confirmar de hoy.`,
            `trans_${hoy}_${hhmm}`
          );
        }
      }

      // 2. Cierre del día a la hora configurada
      if(hhmm === horaNotifCierre && diaActual) {
        const planKey = `${diaActual}_${hoy}`;
        const plan = planillas[planKey];
        const sinCerrar = !plan || (plan.efectivo === '' && plan.fiado === '');
        if(sinCerrar) {
          showNotif(
            '📋 Cierre del día pendiente',
            `Son las ${horaNotifCierre}. Todavía no cerraste la planilla de ${diaActual}.`,
            `cierre_${hoy}`
          );
        }
      }

      // 3. Recordatorios de agenda con hora exacta
      (recordatorios||[]).forEach(r => {
        if(r.confirmado || !r.fecha || !r.hora) return;
        const rHhmm = r.hora.slice(0, 5);
        if(r.fecha === hoy && rHhmm === hhmm) {
          const c = (clientes||[]).find(x => x.id === r.clienteId);
          showNotif(
            `📅 Recordatorio${c ? ' · ' + c.nombre : ''}`,
            r.motivo || 'Recordatorio de agenda',
            `agenda_${r.id || (r.fecha + r.hora)}`
          );
        }
      });
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [ventas, planillas, recordatorios, clientes, diaActual, showNotif]);
  // ── FIN NOTIFICACIONES ─────────────────────────────────────────────────────

  const registrarVenta = (detalle, pago, montoPagado, saldoAplicado, envPrest, envDev, obs, opcionSaldo, montoTrans2, saldoDeltaMixto) => {
    montoTrans2 = Number(montoTrans2)||0; // defensa: siempre número (el desglose mixto depende de esto)
    const c = cliente;
    // Auto-detectar envases prestados (solo si no es cobro de deuda)
    const envAutoDetect = [];
    if(opcionSaldo!=="cobro_deuda" && opcionSaldo!=="cambio_envase") {
      const mapa = {sifon:"Sifón 1.5L", bidon10:"Bidón 10L", bidon20:"Bidón 20L"};
      detalle.forEach(d=>{
        const asignado = d.nombre==="Sifón 1.5L"?(c.sifon||0):d.nombre==="Bidón 10L"?(c.bidon10||0):d.nombre==="Bidón 20L"?(c.bidon20||0):0;
        const extra = d.cantidad - asignado;
        if(extra>0) envAutoDetect.push({prod:d.nombre, cant:String(extra)});
      });
    }
    const envPrestFinal = [...(envPrest||[]).filter(e=>e.prod&&e.cant), ...envAutoDetect.filter(e=>!(envPrest||[]).some(ep=>ep.prod===e.prod))];

    // Pago mixto: guardamos pago real según opción
    const pagoReal = opcionSaldo==="mixto_ef"?"contado":opcionSaldo==="mixto_tr"?"transferencia":pago;
    const obsExtra = montoTrans2>0?` [Mixto: ef $${montoPagado} + tr $${montoTrans2}]`:"";

    // Para pago mixto: el calc usa el TOTAL pagado (ef+tr) asi el saldoDelta refleja lo real
    // La ventaTr solo existe para el flujo de confirmacion de transferencia, sin impacto en saldo
    const montoParaCalc = (opcionSaldo==="mixto_ef" && montoTrans2>0)
      ? String(Number(montoPagado) + montoTrans2)
      : montoPagado;
    const calc = calcVenta(detalle, pagoReal, montoParaCalc, saldoAplicado, productos);
    const nuevaVenta = {
      id:Date.now(), clienteId:c.id, cliente:c.nombre,
      dia:diaActual, fechaKey:new Date().toLocaleDateString("en-CA"), fecha:new Date().toLocaleString("es-AR"),
      detalle, pago:pagoReal, obs:(obs||"")+obsExtra, saldoAplicado:saldoAplicado||0,
      envPrest:envPrestFinal,
      envDev:(envDev||[]).filter(e=>e.prod&&e.cant), ...calc,
      montoTrans:montoTrans2||0, montoEfec:opcionSaldo==="mixto_ef"?Number(montoPagado):0,
      _upd:Date.now(),
      ...(opcionSaldo==="cobro_deuda"?{_esCobro:true,neto:0,bruto:0,costo:0,ganancia:0}:{}),
      ...(opcionSaldo==="cambio_envase"?{_esCambio:true,neto:0,bruto:0,costo:0,ganancia:0}:{}),
    };

    // Si es pago mixto, guardamos la transferencia como venta pendiente de confirmacion
    // saldoDelta=0 porque el saldo ya fue calculado en la venta principal con el total
    let nuevasVentas = [...ventas, nuevaVenta];
    let saldoExtra = calc.saldoDelta;
    if(montoTrans2>0 && opcionSaldo==="mixto_ef") {
      const ventaTr = {
        id:Date.now()+2, clienteId:c.id, cliente:c.nombre,
        dia:diaActual, fechaKey:new Date().toLocaleDateString("en-CA"), fecha:new Date().toLocaleString("es-AR"),
        detalle:[{nombre:"Pago mixto · transferencia",cantidad:1,precio:montoTrans2,total:montoTrans2}],
        pago:"transferencia", obs:"[Parte transfer. de pago mixto]", saldoAplicado:0,
        neto:montoTrans2, bruto:montoTrans2, desc:0, costo:0, ganancia:0,
        pagadoNum:montoTrans2, saldoDelta:0, // sin impacto en saldo
        envPrest:[], envDev:[],
        _esMixtoTrans:true, _mixtoDe:nuevaVenta.id,
        transConfirmada:false, _upd:Date.now(), // aparece como transferencia pendiente de confirmar
      };
      nuevasVentas = [...nuevasVentas, ventaTr];
      // saldoExtra ya es correcto, NO sumamos montoTrans2
    }

    saveVentas(nuevasVentas);
    const nuevosClientes = clientes.map(c2=>c2.id===c.id?{...c2,saldo:c.saldo+saldoExtra}:c2);
    saveClientes(nuevosClientes);
  };


  const renumerarTrasEliminar = (lista, clienteEliminado) => {
    const { dia, orden } = clienteEliminado;
    if(!orden) return lista;
    return lista.map(c =>
      c.dia === dia && (c.orden||0) > orden
        ? {...c, orden: c.orden - 1}
        : c
    );
  };
  const eliminarCliente = (clienteId) => {
    const eliminado = clientes.find(c=>c.id===clienteId);
    if(eliminado){
      const env = {sifon:Number(eliminado.sifon)||0, bidon10:Number(eliminado.bidon10)||0, bidon20:Number(eliminado.bidon20)||0};
      const totalEnv = env.sifon+env.bidon10+env.bidon20;
      if(totalEnv>0){
        const det = [env.sifon&&`${env.sifon} Sifón 1.5L`, env.bidon10&&`${env.bidon10} Bidón 10L`, env.bidon20&&`${env.bidon20} Bidón 20L`].filter(Boolean).join(" · ");
        const devolvio = window.confirm(`"${eliminado.nombre}" tiene envases en su poder:\n${det}\n\n¿Los devolvió?\n\n• Aceptar = SÍ, los devolvió → se suman al stock (Casa)\n• Cancelar = NO → se dan por perdidos`);
        if(devolvio){
          setStock(prev=>{
            const s = JSON.parse(JSON.stringify(prev));
            s.casa.sifon   = (s.casa.sifon||0)   + env.sifon;
            s.casa.bidon10 = (s.casa.bidon10||0) + env.bidon10;
            s.casa.bidon20 = (s.casa.bidon20||0) + env.bidon20;
            syncData({stock:s});
            return s;
          });
        }
      }
    }
    let nc = clientes.filter(c=>c.id!==clienteId);
    if(eliminado) nc = renumerarTrasEliminar(nc, eliminado);
    saveClientes(nc);
    // Si el id corresponde a un PROSPECTO (cliente fantasma), NO borrar el prospecto
    // ni sus ventas/registros: el prospecto y su historial deben sobrevivir.
    const esProspecto = (prospectos||[]).some(p=>p.id===clienteId);
    if(!esProspecto){
      saveVentas(ventas.filter(v=>v.clienteId!==clienteId));
      saveNoVisitas((noVisitas||[]).filter(v=>v.clienteId!==clienteId));
      saveRecordatorios((recordatorios||[]).filter(r=>r.clienteId!==clienteId));
    }
    irA("clientes");
  };

  // ── Unificación de duplicados SEGURA: prioriza el DOMICILIO ──
  // Mismo nombre+día pero domicilios distintos = probablemente personas diferentes → viene desmarcado
  const [dupPreview, setDupPreview] = useState(null);
  const domKeyDup = (c)=>{
    const n=(s)=>(s||"").toString().trim().toLowerCase().replace(/\s+/g," ");
    return n([c.calle,c.nro,c.manzana,c.lote,c.barrio,c.sector].filter(Boolean).join(" "));
  };
  const detectarDuplicados = () => {
    const norm = (s)=>(s||"").toString().trim().toLowerCase().replace(/\s+/g," ");
    const grupos = {};
    (clientes||[]).forEach(c=>{ const k=norm(c.nombre)+"|"+(c.dia||""); (grupos[k]=grupos[k]||[]).push(c); });
    const lista = Object.values(grupos).filter(g=>g.length>1).map(g=>{
      const doms = g.map(domKeyDup);
      const conDom = doms.filter(Boolean);
      // Mismo domicilio solo si TODOS tienen domicilio cargado y todos coinciden
      const mismoDomicilio = conDom.length===doms.length && conDom.length>0 && conDom.every(d=>d===conDom[0]);
      return { miembros:g, mismoDomicilio, sel:mismoDomicilio };
    });
    if(lista.length===0){ window.alert("✅ No se encontraron clientes con el mismo nombre y día."); return; }
    setDupPreview(lista);
  };
  const ejecutarUnificacion = () => {
    const seleccion = (dupPreview||[]).filter(g=>g.sel);
    if(seleccion.length===0){ setDupPreview(null); return; }
    const remap = {};
    const completos = (c)=>Object.values(c).filter(v=>v!==""&&v!==null&&v!==undefined&&v!==0).length;
    const idsAEliminar = new Set();
    const reemplazos = {};
    seleccion.forEach(({miembros})=>{
      const base = miembros.reduce((a,b)=> completos(b)>completos(a)?b:a);
      const merged = {...base, saldo: miembros.reduce((a,c)=>a+(Number(c.saldo)||0),0)};
      miembros.forEach(c=>{ if(c.id!==base.id){ remap[c.id]=base.id; idsAEliminar.add(c.id); } });
      reemplazos[base.id]=merged;
    });
    let fusionados = clientes.filter(c=>!idsAEliminar.has(c.id)).map(c=>reemplazos[c.id]||c);
    // Reparar IDs repetidos si los hubiera (corrupción de datos)
    const usados = new Set();
    fusionados = fusionados.map(c=>{
      let id=c.id;
      if(usados.has(id)){ const nid=nuevoIdCat(); remap[id]=nid; id=nid; }
      usados.add(id);
      return {...c,id};
    });
    const rid = (x)=> remap[x]!==undefined?remap[x]:x;
    const nVentas = (ventasRaw||[]).map(v=>({...v,clienteId:rid(v.clienteId)}));
    const nNoVis  = (noVisitas||[]).map(v=>({...v,clienteId:rid(v.clienteId)}));
    const nRec    = (recordatorios||[]).map(r=>({...r,clienteId:rid(r.clienteId)}));
    setClientes(fusionados);
    setVentasRaw(nVentas);
    setNoVisitas(nNoVis);
    setRecordatorios(nRec);
    syncData({clientes:fusionados, ventas:nVentas, noVisitas:nNoVis, recordatorios:nRec});
    setDupPreview(null);
    window.alert("✅ Listo. Se unificaron "+seleccion.length+" grupo(s). Revisá los saldos por las dudas.");
  };

  const eliminarVenta = (ventaId) => {
    const v = ventas.find(x=>x.id===ventaId); if(!v) return;
    const eraMixta = (Number(v.montoTrans)||0)>0;
    let ajusteSaldoExtra = 0;
    let nv = ventas.filter(x=>{
      if(x.id===ventaId) return false;
      // Cascada: borrar también la parte-transferencia ligada a ESTA venta
      const ligada = x._esMixtoTrans && (
        x._mixtoDe===ventaId ||
        (x._mixtoDe===undefined && eraMixta && x.clienteId===v.clienteId && x.fechaKey===v.fechaKey)
      );
      if(ligada && (Number(x.saldoDelta)||0)!==0) ajusteSaldoExtra += Number(x.saldoDelta);
      return !ligada;
    });
    // Limpieza: partes-transferencia huérfanas (su venta principal ya no existe)
    nv = nv.filter(x=>!(x._esMixtoTrans && x._mixtoDe!==undefined && !nv.some(y=>y.id===x._mixtoDe)));
    saveVentas(nv);
    const c = clientes.find(x=>x.id===v.clienteId);
    if(c){ const nc=clientes.map(x=>x.id===c.id?{...x,saldo:c.saldo-v.saldoDelta-ajusteSaldoExtra}:x); saveClientes(nc); }
  };

  // Limpieza automática: partes-transferencia cuya venta principal ya fue eliminada
  React.useEffect(()=>{
    const huerfanas = ventas.filter(v=>v._esMixtoTrans && v._mixtoDe!==undefined && !ventas.some(x=>x.id===v._mixtoDe));
    if(huerfanas.length>0){
      const ids=new Set(huerfanas.map(v=>v.id));
      saveVentas(ventas.filter(v=>!ids.has(v.id)));
    }
  }, [ventas]);

  const editarVenta = (ventaId, detalle, pago, montoPagado, saldoAplicado, obs, montoTrans2) => {
    const vV = ventas.find(v=>v.id===ventaId); if(!vV) return;
    const c  = clientes.find(x=>x.id===vV.clienteId);
    const esMixto = pago==="mixto";
    const ef = Number(montoPagado)||0, tr = esMixto?(Number(montoTrans2)||0):0;
    const pagoReal = esMixto?"contado":pago;
    // MIXTO: el cálculo usa el TOTAL pagado (ef+tr), igual que al registrar → el saldo queda bien
    const calc = calcVenta(detalle, pagoReal, esMixto?String(ef+tr):montoPagado, saldoAplicado, productos);
    const obsLimpia = (obs||"").replace(/\s*\[Mixto:[^\]]*\]/g,"");
    const obsFinal  = esMixto&&tr>0 ? obsLimpia+` [Mixto: ef $${ef} + tr $${tr}]` : obsLimpia;
    const eraMixta  = (Number(vV.montoTrans)||0)>0;
    let saldoExtra = c ? (c.saldo - vV.saldoDelta + calc.saldoDelta) : 0;
    // Quitar SOLO la parte-transferencia ligada a ESTA venta (no las de otras ventas mixtas del día)
    let nev = ventas.filter(v=>{
      const ligada = v._esMixtoTrans && (
        v._mixtoDe===ventaId ||
        (v._mixtoDe===undefined && eraMixta && v.clienteId===vV.clienteId && v.fechaKey===vV.fechaKey)
      );
      if(ligada && (Number(v.saldoDelta)||0)!==0) saldoExtra -= Number(v.saldoDelta); // compensar partes viejas que tocaban saldo
      return !ligada;
    });
    nev = nev.map(v=>v.id===ventaId?{...vV,detalle,pago:pagoReal,obs:obsFinal,saldoAplicado:saldoAplicado||0,...calc,montoEfec:esMixto?ef:0,montoTrans:tr,_upd:Date.now()}:v);
    if(esMixto&&tr>0){
      const ventaTr = {
        id:Date.now()+2, clienteId:vV.clienteId, cliente:vV.cliente,
        dia:vV.dia, fechaKey:vV.fechaKey, fecha:vV.fecha,
        detalle:[{nombre:"Pago mixto · transferencia",cantidad:1,precio:tr,total:tr}],
        pago:"transferencia", obs:"[Parte transfer. de pago mixto]", saldoAplicado:0,
        neto:tr, bruto:tr, desc:0, costo:0, ganancia:0,
        pagadoNum:tr, saldoDelta:0, envPrest:[], envDev:[],
        _esMixtoTrans:true, _mixtoDe:ventaId, transConfirmada:false, _upd:Date.now(),
      };
      nev = [...nev, ventaTr];
    }
    saveVentas(nev);
    if(c){ const nc=clientes.map(x=>x.id===c.id?{...x,saldo:saldoExtra}:x); saveClientes(nc); }
  };

  if(!pinOk) return <PantallaBloqueoLC onOk={()=>{ setPinOk(true); if(pantalla==="portada") irA("menu"); }} />;

  return (
    <div style={{position:"relative"}}>
    <div style={{...s.app, zoom: SCALES[scaleIdx]}}>
      <SyncBar status={syncStatus} isOnline={isOnline} />
      {pantalla==="portada"        && <Portada onIngresar={()=>irA("menu")} />}
      {pantalla==="menu"           && <MenuDias dias={DIAS} onDia={d=>{setDiaActual(d);irA("diaPrincipal");}} onResumen={()=>irA("resumen")} onConfig={(tab)=>{setTabConfig(tab||"stock");irA("config");}} onGestionClientes={()=>irA("gestionClientes")} onPromocion={()=>irA("promocion")} onStock={()=>irA("stock")} onAgenda={()=>irA("agenda")} onVolver={()=>irA("portada")} darkMode={darkMode} onToggleDark={()=>setDarkMode(!darkMode)} clientes={clientes} ventas={ventas} stock={stockNorm}
          recordatoriosActivos={recordatoriosActivos}
          onConfirmarRecordatorio={(id)=>saveRecordatorios((recordatorios||[]).map(r=>r.id===id?{...r,confirmado:true}:r))}
          onVerConfirmaciones={(dia)=>{if(dia)setDiaActual(dia);irA("confirmacionesDia");}}
          transferenciasPendientes={DIAS.map(dia=>{
            const vts = ventas.filter(v=>v.dia===dia&&v.pago==="transferencia"&&!v.transConfirmada);
            if(!vts.length) return null;
            const fechas = [...new Set(vts.map(v=>v.fechaKey))].sort().reverse();
            return {dia, fecha:fechas[0]||"", count:vts.length, monto:vts.reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0), ventas:vts};
          }).filter(Boolean)} zonasReparto={zonasReparto} onSetZona={(dia,zona)=>{const nz={...zonasReparto,[dia]:zona};setZonasReparto(nz);syncData({zonasReparto:nz});}}
          onDiaHoy={(dia,fechaKey)=>{setDiaActual(dia);setFechaActual(fechaKey);setFechaObj(new Date(fechaKey+"T12:00:00"));irA("inicioReparto");}}
          onDiaResumen={(dia,fechaKey)=>{setDiaActual(dia);setFechaActual(fechaKey);setFechaObj(new Date(fechaKey+"T12:00:00"));irA("planilla");}}
          noVisitas={noVisitas||[]}
          onFiados={()=>irA("fiadosPendientes")}
        onMapaClientes={()=>irA("mapaClientes")}
        onDormidos={()=>irA("clientesDormidos")} />}
      {pantalla==="confirmacionesDia" && <ConfirmacionesDia
          dia={diaActual||"todos los días"}
          ventas={ventas.filter(v=>v.pago==="transferencia"&&(!diaActual||v.dia===diaActual))}
          clientes={clientes}
          onConfirmar={(ventaId)=>{const nv=ventas.map(v=>v.id===ventaId?{...v,transConfirmada:!v.transConfirmada,_upd:Date.now()}:v);saveVentas(nv);}}
          onVolver={()=>irA("menu")} />}
      {pantalla==="diaPrincipal"   && <DiaPrincipal dia={diaActual} onIrClientes={()=>irA("selectorFechaClientes")} onIrPlanilla={()=>irA("selectorFechaPlanilla")} onVolver={()=>irA("menu")} onVerConfirmaciones={()=>irA("confirmacionesDia")} ventasPendientesTransfer={ventas.filter(v=>v.dia===diaActual&&v.pago==="transferencia"&&!v.transConfirmada).length} />}
      {pantalla==="selectorFechaPlanilla" && <SelectorFecha dia={diaActual} planillas={planillas} ventas={ventas} noVisitas={noVisitas} onSeleccionar={(fk,fo)=>{setFechaActual(fk);setFechaObj(fo);irA("planilla");}} onVolver={()=>irA("diaPrincipal")} />}
      {pantalla==="planilla"       && <PlanillaDelDia dia={diaActual} fecha={fechaActual} ventas={ventas.filter(v=>v.fechaKey===fechaActual)} clientes={clientes} planilla={planillas[`${diaActual}_${fechaActual}`]||planillaDiaVacia()} productos={productos} stock={stockNorm} setStock={setStock} syncData={syncData} autoCierre={!!planillas[`${diaActual}_${fechaActual}`]?.iniciado}
        onGuardar={d=>{
          savePlanilla(`${diaActual}_${fechaActual}`,d);
          if(!d._diaCerrado) irA("selectorFechaPlanilla");
          // Si es cierre de d\xc3\xada, no navega: setMostrarCierre(false) vuelve a la planilla normal
        }}
        onAutoGuardar={d=>savePlanilla(`${diaActual}_${fechaActual}`,d)}
        onVolver={()=>irA("selectorFechaPlanilla")} noVisitas={noVisitas} />}
      {pantalla==="selectorFechaClientes" && <SelectorFecha dia={diaActual} planillas={planillas} ventas={ventas} noVisitas={noVisitas} onSeleccionar={(fk,fo)=>{setFechaActual(fk);setFechaObj(fo);irA("inicioReparto");}} onVolver={()=>irA("diaPrincipal")} />}
      {pantalla==="inicioReparto"  && <InicioReparto dia={diaActual} fecha={fechaActual} planilla={planillas[`${diaActual}_${fechaActual}`]||planillaDiaVacia()} productos={productos} cargasDia={cargasDia} stock={stockNorm}
        onGuardar={(p,descontar)=>{
          savePlanilla(`${diaActual}_${fechaActual}`,p);
          if(descontar){
            setStock(prev=>{
              const s=JSON.parse(JSON.stringify(normStock(prev)));
              const soda=Number(p.productos?.soda?.llenos||0);
              const b10=Number(p.productos?.b10?.llenos||0);
              const b20=Number(p.productos?.b20?.llenos||0);
              s.soderia.sifon  =Math.max(0,(s.soderia.sifon||0)-soda);
              s.soderia.bidon10=Math.max(0,(s.soderia.bidon10||0)-b10);
              s.soderia.bidon20=Math.max(0,(s.soderia.bidon20||0)-b20);
              s.camion.sifon   =(s.camion.sifon||0)+soda;
              s.camion.bidon10 =(s.camion.bidon10||0)+b10;
              s.camion.bidon20 =(s.camion.bidon20||0)+b20;
              syncData({stock:normStock(s)}); return normStock(s);
            });
          }
          irA("clientes");
        }} onVolver={()=>irA("selectorFechaClientes")} />}
      {pantalla==="clientes"       && <ListaClientes clientes={clientes.filter(c=>c.dia===diaActual)} dia={diaActual} fecha={fechaActual} ventas={ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual)} todasVentas={ventas} noVisitas={(noVisitas||[]).filter(v=>v.dia===diaActual&&v.fecha===fechaActual)} onEditarCliente={(id,cambios)=>{saveClientes(clientes.map(c=>c.id===id?{...c,...cambios}:c));}} onSeleccionar={c=>{setClienteId(c.id);irA("detalleCliente");}} onNuevoCliente={()=>irA("nuevoCliente")} onVolver={()=>irA("selectorFechaClientes")} onReordenar={lista=>{
          const otros=clientes.filter(c=>c.dia!==diaActual);
          saveClientes([...otros,...lista]);
        }} onRegistrarNoVisita={(clienteId,motivo)=>{const nv=[...(noVisitas||[]).filter(v=>!(v.clienteId===clienteId&&v.dia===diaActual&&v.fecha===fechaActual)),{clienteId,dia:diaActual,fecha:fechaActual,motivo}];saveNoVisitas(nv);}} onQuitarNoVisita={(clienteId)=>{const nv=(noVisitas||[]).filter(v=>!(v.clienteId===clienteId&&v.dia===diaActual&&v.fecha===fechaActual));saveNoVisitas(nv);}}
        onConfirmarTransfer={(clienteId,ventaId)=>{
          const nv=ventas.map(v=>v.id===ventaId?{...v,transConfirmada:!v.transConfirmada,_upd:Date.now()}:v);
          saveVentas(nv);
        }}
        prospectos={(prospectos||[]).filter(p=>p.dia===diaActual&&p.estado==="activo")}
        recordatorios={recordatorios}
        onVerProspecto={(p)=>{setClienteId(p.id);irA("detalleProspecto");}}
        onEditarProspecto={(id,cambios)=>{saveProspectos((prospectos||[]).map(x=>x.id===id?{...x,...cambios}:x));}}
        onEliminarProspecto={(id)=>{if(window.confirm("¿Eliminar este prospecto?"))saveProspectos((prospectos||[]).filter(x=>x.id!==id));}}
        onVentaProspecto={(p)=>{
          if(!clientes.find(c=>c.id===p.id)){
            saveClientes([...clientes,{...p,saldo:0,_esProspecto:true}]);
          }
          setClienteId(p.id);
          irA("venta");
        }}
        onNoEstaProspecto={(id)=>{
          const nv=[...(noVisitas||[]).filter(v=>!(v.clienteId===id&&v.dia===diaActual&&v.fecha===fechaActual)),{clienteId:id,dia:diaActual,fecha:fechaActual,motivo:"noesta"}];
          saveNoVisitas(nv);
        }}
        onAbrirMapa={()=>irA("mapaClientes")}
        onPlanilla={()=>irA("planilla")}
        />}
      {pantalla==="detalleCliente" && cliente && <DetalleCliente cliente={cliente} ventas={ventas.filter(v=>v.clienteId===cliente.id)} noVisitas={(noVisitas||[]).filter(v=>v.clienteId===cliente.id)} dia={diaActual} fecha={fechaActual} productos={productos} onVenta={()=>{const hoyKey=new Date().toLocaleDateString("en-CA");if(fechaActual!==hoyKey)setFechaActual(hoyKey);irA("venta");}} onVolver={()=>irA("clientes")} onEditar={cambios=>updateCliente(cliente.id,cambios)} onEliminarVenta={eliminarVenta} onEditarVenta={editarVenta} onEliminarCliente={()=>eliminarCliente(cliente.id)}
          onNoEstaCliente={()=>{
            const nv=[...(noVisitas||[]).filter(v=>!(v.clienteId===cliente.id&&v.dia===diaActual&&v.fecha===fechaActual)),{clienteId:cliente.id,dia:diaActual,fecha:fechaActual,motivo:"noesta"}];
            saveNoVisitas(nv);
            const clientesDia=clientes.filter(c=>c.dia===diaActual).sort((a,b)=>(a.orden||9999)-(b.orden||9999));
            const ventasIds=new Set(ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual&&!v._esCobro&&!v._esAjuste&&!v._esMixtoTrans).map(v=>v.clienteId));
            const noVMap={};nv.filter(v=>v.dia===diaActual&&v.fecha===fechaActual).forEach(v=>{noVMap[v.clienteId]=v.motivo;});
            const terminados=new Set(clientesDia.filter(c=>ventasIds.has(c.id)||noVMap[c.id]==="noquiso"||noVMap[c.id]==="noesta2").map(c=>c.id));
            const normalPend=clientesDia.filter(c=>!terminados.has(c.id)&&noVMap[c.id]!=="noesta"&&c.id!==cliente.id);
            const noestaPend=clientesDia.filter(c=>noVMap[c.id]==="noesta"&&!terminados.has(c.id)&&c.id!==cliente.id);
            const sig=normalPend[0]||noestaPend[0];
            if(sig){setClienteId(sig.id);irA("detalleCliente");}else irA("clientes");
          }}
          onNoQuiereCliente={()=>{
            const nv=[...(noVisitas||[]).filter(v=>!(v.clienteId===cliente.id&&v.dia===diaActual&&v.fecha===fechaActual)),{clienteId:cliente.id,dia:diaActual,fecha:fechaActual,motivo:"noquiso"}];
            saveNoVisitas(nv);
            const clientesDia=clientes.filter(c=>c.dia===diaActual).sort((a,b)=>(a.orden||9999)-(b.orden||9999));
            const ventasIds=new Set(ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual&&!v._esCobro&&!v._esAjuste&&!v._esMixtoTrans).map(v=>v.clienteId));
            const noVMap={};nv.filter(v=>v.dia===diaActual&&v.fecha===fechaActual).forEach(v=>{noVMap[v.clienteId]=v.motivo;});
            const terminados=new Set(clientesDia.filter(c=>ventasIds.has(c.id)||noVMap[c.id]==="noquiso"||noVMap[c.id]==="noesta2").map(c=>c.id));
            const normalPend=clientesDia.filter(c=>!terminados.has(c.id)&&noVMap[c.id]!=="noesta"&&c.id!==cliente.id);
            const noestaPend=clientesDia.filter(c=>noVMap[c.id]==="noesta"&&!terminados.has(c.id)&&c.id!==cliente.id);
            const sig=normalPend[0]||noestaPend[0];
            if(sig){setClienteId(sig.id);irA("detalleCliente");}else irA("clientes");
          }}
          recordatorios={recordatorios}
          onGuardarRecordatorio={(r)=>saveRecordatorios([...(recordatorios||[]),r])}
          onConfirmarRecordatorio={(id)=>saveRecordatorios((recordatorios||[]).map(r=>r.id===id?{...r,confirmado:true}:r))}
          onCobrarSaldo={(monto,pago)=>{
            const cl=cliente;
            const saldoAntes=cl.saldo||0;
            const saldoDespues=saldoAntes+monto;
            const det=[{nombre:"Cobro de deuda",cantidad:1,precio:0,total:0}];
            const fk=new Date().toLocaleDateString("en-CA");
            const vt={id:Date.now(),clienteId:cl.id,cliente:cl.nombre,dia:diaActual||cl.dia,fechaKey:fk,fecha:new Date().toLocaleString("es-AR"),
              detalle:det,pago,obs:`Cobro de deuda ${fmt(monto)} (${pago})`,saldoAplicado:0,
              neto:0,bruto:0,desc:0,costo:0,ganancia:0,pagadoNum:monto,saldoDelta:monto,envPrest:[],envDev:[],
              saldoAntes,saldoDespues,_esCobro:true,_upd:Date.now()};
            saveVentas([...ventas,vt]);
            saveClientes(clientes.map(x=>x.id===cl.id?{...x,saldo:saldoDespues}:x));
          }}
          onGuardarAjuste={(vt)=>{saveVentas([...ventas,vt]);}}
          onGuardarCambio={(vt)=>{saveVentas([...ventas,vt]);}} />}
      {pantalla==="venta"          && cliente && <NuevaVenta key={`${clienteId}-${ventas.filter(v=>v.clienteId===cliente.id).length}`} cliente={cliente} productos={productos} fecha={fechaActual}
        ventasCliente={ventas.filter(v=>v.clienteId===cliente.id)}
        progressData={(()=>{
          const clientesDia=clientes.filter(c=>c.dia===diaActual);
          const ventasHoy=ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual&&!v._esCobro&&!v._esAjuste&&!v._esMixtoTrans);
          const noVHoy=(noVisitas||[]).filter(v=>v.dia===diaActual&&v.fecha===fechaActual);
          const visitadosIds=new Set([...ventasHoy.map(v=>v.clienteId),...noVHoy.map(v=>v.clienteId)]);
          const montoHoy=ventasHoy.reduce((a,v)=>a+(v.neto||0),0);
          const sifs=ventasHoy.reduce((a,v)=>a+(v.detalle||[]).filter(d=>d.nombre==="Sifón 1.5L").reduce((b,d)=>b+d.cantidad,0),0);
          const b10=ventasHoy.reduce((a,v)=>a+(v.detalle||[]).filter(d=>d.nombre==="Bidón 10L").reduce((b,d)=>b+d.cantidad,0),0);
          const b20=ventasHoy.reduce((a,v)=>a+(v.detalle||[]).filter(d=>d.nombre==="Bidón 20L").reduce((b,d)=>b+d.cantidad,0),0);
          const planillaHoy=planillas[`${diaActual}_${fechaActual}`]||{};
          const stockRestante={
            "Sif":Math.max(0,(Number(planillaHoy.productos?.soda?.llenos)||0)-sifs),
            "10L":Math.max(0,(Number(planillaHoy.productos?.b10?.llenos)||0)-b10),
            "20L":Math.max(0,(Number(planillaHoy.productos?.b20?.llenos)||0)-b20),
          };
          return {visitados:visitadosIds.size,total:clientesDia.length,montoHoy,stock:stockRestante};
        })()}
        onNoEsta={()=>{
          const prev=(noVisitas||[]).find(v=>v.clienteId===clienteId&&v.dia===diaActual&&v.fecha===fechaActual);
          const motivo=prev?.motivo==="noesta"?"noesta2":"noesta";
          const nv=[...(noVisitas||[]).filter(v=>!(v.clienteId===clienteId&&v.dia===diaActual&&v.fecha===fechaActual)),{clienteId,dia:diaActual,fecha:fechaActual,motivo}];
          saveNoVisitas(nv);
          const clientesDia=clientes.filter(c=>c.dia===diaActual).sort((a,b)=>(a.orden||9999)-(b.orden||9999));
          const ventasIds=new Set(ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual&&!v._esCobro&&!v._esAjuste&&!v._esMixtoTrans).map(v=>v.clienteId));
          const noVMap={};nv.filter(v=>v.dia===diaActual&&v.fecha===fechaActual).forEach(v=>{noVMap[v.clienteId]=v.motivo;});
          const terminados=new Set(clientesDia.filter(c=>ventasIds.has(c.id)||noVMap[c.id]==="noquiso"||noVMap[c.id]==="noesta2").map(c=>c.id));
          // 1ro: pendientes normales, 2do: los que no estaban, nunca sale si quedan clientes
          const normalPend=clientesDia.filter(c=>!terminados.has(c.id)&&noVMap[c.id]!=="noesta"&&c.id!==clienteId);
          const noestaPend=clientesDia.filter(c=>noVMap[c.id]==="noesta"&&!terminados.has(c.id)&&c.id!==clienteId);
          const sig=normalPend[0]||noestaPend[0];
          if(sig){setClienteId(sig.id);irA("venta");}else irA("clientes");
        }}
        onNoQuiere={()=>{
          const nv=[...(noVisitas||[]).filter(v=>!(v.clienteId===clienteId&&v.dia===diaActual&&v.fecha===fechaActual)),{clienteId,dia:diaActual,fecha:fechaActual,motivo:"noquiso"}];
          saveNoVisitas(nv);
          const clientesDia=clientes.filter(c=>c.dia===diaActual).sort((a,b)=>(a.orden||9999)-(b.orden||9999));
          const ventasIds=new Set(ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual&&!v._esCobro&&!v._esAjuste&&!v._esMixtoTrans).map(v=>v.clienteId));
          const noVMap={};nv.filter(v=>v.dia===diaActual&&v.fecha===fechaActual).forEach(v=>{noVMap[v.clienteId]=v.motivo;});
          const terminados=new Set(clientesDia.filter(c=>ventasIds.has(c.id)||noVMap[c.id]==="noquiso"||noVMap[c.id]==="noesta2").map(c=>c.id));
          const normalPend=clientesDia.filter(c=>!terminados.has(c.id)&&noVMap[c.id]!=="noesta"&&c.id!==clienteId);
          const noestaPend=clientesDia.filter(c=>noVMap[c.id]==="noesta"&&!terminados.has(c.id)&&c.id!==clienteId);
          const sig=normalPend[0]||noestaPend[0];
          if(sig){setClienteId(sig.id);irA("venta");}else irA("clientes");
        }}
        onGuardar={(...args)=>{
  // Pasa TODOS los argumentos (incluye el desglose del pago mixto: montoTrans2 y saldoDelta)
  registrarVenta(...args);
  // Auto-advance to next pending client (noesta = volver al final, no saltar a ellos)
  const clientesDia = clientes.filter(c=>c.dia===diaActual).sort((a,b)=>(a.orden||9999)-(b.orden||9999));
  const visitadosIds = new Set([
    ...ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual&&!v._esCobro&&!v._esAjuste&&!v._esMixtoTrans).map(v=>v.clienteId),
    ...(noVisitas||[]).filter(v=>v.dia===diaActual&&v.fecha===fechaActual&&(v.motivo==="noquiso"||v.motivo==="noesta2"||v.motivo==="noesta"||v.motivo==="salteado")).map(v=>v.clienteId)
  ]);
  visitadosIds.add(clienteId);
  const siguiente = clientesDia.find(c=>!visitadosIds.has(c.id)&&c.id!==clienteId);
  if(siguiente){ setClienteId(siguiente.id); irA("venta"); }
  else irA("clientes");
}}
        onSaltar={()=>{
          const nv=[...(noVisitas||[]).filter(v=>!(v.clienteId===clienteId&&v.dia===diaActual&&v.fecha===fechaActual)),{clienteId,dia:diaActual,fecha:fechaActual,motivo:"salteado"}];
          saveNoVisitas(nv);
          // Auto-avanzar al siguiente cliente pendiente
          const visitadosIds=new Set([
            ...ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual).map(v=>v.clienteId),
            ...nv.filter(v=>v.fecha===fechaActual&&v.dia===diaActual).map(v=>v.clienteId)
          ]);
          const clientesDia=clientes.filter(c=>c.dia===diaActual);
          const sig=clientesDia.find(c=>!visitadosIds.has(c.id)&&c.id!==clienteId);
          if(sig){setClienteId(sig.id);irA("venta");}else irA("clientes");
        }}
        onVolver={()=>irA("detalleCliente")} />}
      {pantalla==="nuevoCliente"   && <NuevoCliente diaActual={diaActual} onGuardar={(datos)=>{
          const orden=datos.orden;
          let base=clientes;
          if(orden&&clientes.some(c=>c.dia===datos.dia&&(c.orden||0)===Number(orden))){
            base=clientes.map(c=>c.dia===datos.dia&&(c.orden||0)>=Number(orden)?{...c,orden:(c.orden||0)+1}:c);
          }
          const nc=[...base,{...datos,id:nuevoIdCat(),saldo:0,dispenser:datos.dispenser||0}]
            .sort((a,b)=>DIAS.indexOf(a.dia)-DIAS.indexOf(b.dia)||(a.orden||9999)-(b.orden||9999));
          saveClientes(nc);irA("clientes");
        }} onVolver={()=>irA("clientes")} />}
      {pantalla==="detalleProspecto"  && prospectos&&prospectos.find(p=>p.id===clienteId)&&(()=>{
        const prosp=prospectos.find(p=>p.id===clienteId);
        return <DetalleCliente
          cliente={{...prosp,saldo:prosp.saldo||0,tipo:"prospecto"}}
          ventas={ventas.filter(v=>v.clienteId===prosp.id)}
          noVisitas={(noVisitas||[]).filter(v=>v.clienteId===prosp.id)}
          dia={diaActual} fecha={fechaActual} productos={productos}
          onVenta={()=>{
            if(!clientes.find(c=>c.id===prosp.id)){
              saveClientes([...clientes,{...prosp,saldo:0,_esProspecto:true}]);
            }
            saveProspectos((prospectos||[]).map(x=>x.id===prosp.id?{...x,estado:"convertido"}:x));
            irA("venta");
          }}
          onVolver={()=>irA("clientes")}
          onEditar={cambios=>saveProspectos((prospectos||[]).map(x=>x.id===prosp.id?{...x,...cambios}:x))}
          onEliminarCliente={()=>{
            if(window.confirm("¿Eliminar este prospecto?"))
              saveProspectos((prospectos||[]).filter(x=>x.id!==prosp.id));
            irA("clientes");
          }}
          onEliminarVenta={eliminarVenta} onEditarVenta={editarVenta}
          onNoEstaCliente={()=>irA("clientes")} onNoQuiereCliente={()=>irA("clientes")}
        />;
      })()}
      {pantalla==="promocion"       && <React.Fragment><ClientesTabs activo="prospectos" onIr={irA}/><Promocion prospectos={prospectos} clientes={clientes} onSave={saveProspectos} onConvertir={(p)=>{
        const nuevo={...p,id:Date.now(),saldo:0,sifon:0,bidon10:1,bidon20:0};
        saveClientes([...clientes,nuevo]);
        saveProspectos(prospectos.map(x=>x.id===p.id?{...x,estado:"convertido"}:x));
        irA("promocion");
      }} onVolver={()=>irA("menu")} /></React.Fragment>}
      {pantalla==="gestionClientes" && <React.Fragment><ClientesTabs activo="todos" onIr={irA}/><div style={{padding:"8px 12px 0"}}><button onClick={detectarDuplicados} style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid var(--color-border-secondary)",background:"var(--color-background-tertiary)",color:"var(--color-text-primary)",fontWeight:600,cursor:"pointer",fontSize:13}}>🔧 Unificar clientes duplicados</button>
      {dupPreview&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"var(--color-background-secondary)",borderRadius:14,padding:16,width:"100%",maxWidth:440,maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:4,color:"var(--color-text-primary)"}}>🔧 Vista previa de unificación</div>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:10,lineHeight:1.5}}>
              Solo se unifican los grupos que marques. Los que tienen <b>domicilios distintos</b> vienen desmarcados porque probablemente son personas diferentes.
            </div>
            {dupPreview.map((g,i)=>(
              <div key={i} style={{border:"1px solid "+(g.mismoDomicilio?"var(--color-border-secondary)":"#f5b942"),borderRadius:10,padding:"8px 10px",marginBottom:8,background:g.sel?"var(--color-background-info)":"var(--color-background-tertiary)"}}>
                <label style={{display:"flex",gap:8,alignItems:"flex-start",cursor:"pointer"}}>
                  <input type="checkbox" checked={g.sel} onChange={()=>setDupPreview(p=>p.map((x,j)=>j===i?{...x,sel:!x.sel}:x))} style={{marginTop:3,width:16,height:16}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--color-text-primary)"}}>{g.miembros[0].nombre} · {g.miembros[0].dia}</div>
                    {!g.mismoDomicilio&&<div style={{fontSize:11,color:"#f5b942",margin:"3px 0"}}>⚠️ Domicilios distintos o incompletos — verificá antes de marcar</div>}
                    {g.miembros.map(m=>{
                      const nv=(ventasRaw||[]).filter(v=>v.clienteId===m.id).length;
                      return (
                        <div key={m.id} style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:3}}>
                          • {[m.calle?`${m.calle} ${m.nro||""}`.trim():"",m.manzana?`Mz ${m.manzana}${m.lote?` L ${m.lote}`:""}`:"",m.barrio||""].filter(Boolean).join(" · ")||"(sin domicilio)"}
                          <span style={{color:"var(--color-text-tertiary)"}}> · {nv} ventas · saldo {fmt(m.saldo||0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </label>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button style={{flex:1,padding:"11px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-tertiary)",color:"var(--color-text-secondary)",fontSize:13,cursor:"pointer"}} onClick={()=>setDupPreview(null)}>Cancelar</button>
              <button style={{flex:2,padding:"11px",borderRadius:8,border:"none",background:dupPreview.filter(g=>g.sel).length?"#1d9e75":"#3a4a5a",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}} onClick={ejecutarUnificacion}>
                ✓ Unificar marcados ({dupPreview.filter(g=>g.sel).length})
              </button>
            </div>
          </div>
        </div>
      )}</div><GestionClientes clientes={clientes} onReordenarTodo={(lista)=>saveClientes(lista)} onEditar={(id,cambios)=>{saveClientes(clientes.map(c=>c.id===id?{...c,...cambios}:c));}} onEliminar={(id)=>{
        if(window.confirm("¿Eliminar cliente? Se quitará de todas las listas (clientes, ventas, prospectos, no-visitas y recordatorios).")){
          eliminarCliente(id);
          irA("gestionClientes");
        }}} onNuevo={(datos)=>{
        const orden = datos.orden;
        let nuevos;
        if(orden&&clientes.some(c=>c.dia===datos.dia&&c.orden===orden)){
          // Shift all clients with same day and order >= new order
          nuevos = clientes.map(c=>c.dia===datos.dia&&(c.orden||0)>=orden?{...c,orden:(c.orden||0)+1}:c);
        } else { nuevos = [...clientes]; }
        saveClientes([...nuevos,{...datos,id:nuevoIdCat(),saldo:0,dispenser:datos.dispenser||0}].sort((a,b)=>DIAS.indexOf(a.dia)-DIAS.indexOf(b.dia)||(a.orden||9999)-(b.orden||9999)));
      }} onVolver={()=>irA("menu")} onRegistrarVenta={(c)=>{
          setClienteId(c.id);
          // Asegurar que fechaActual esté seteado a hoy
          const hoyKey = new Date().toLocaleDateString("en-CA");
          if(!fechaActual) setFechaActual(hoyKey);
          // Si no hay diaActual, usar el día del cliente como fallback
          if(!diaActual) setDiaActual(c.dia);
          irA("venta");
        }} onVerDetalle={(c)=>{setClienteId(c.id);irA("detalleDesdeGestion");}} ventas={ventas} /></React.Fragment>}
      {pantalla==="detalleDesdeGestion" && cliente && <DetalleCliente cliente={cliente} ventas={ventas.filter(v=>v.clienteId===cliente.id)} noVisitas={(noVisitas||[]).filter(v=>v.clienteId===cliente.id)} dia={diaActual||cliente.dia} fecha={fechaActual} productos={productos} onVenta={()=>{setDiaActual(cliente.dia);const hoy=new Date().toLocaleDateString("en-CA");if(!fechaActual)setFechaActual(hoy);irA("venta");}} onVolver={()=>irA("gestionClientes")} onEditar={cambios=>updateCliente(cliente.id,cambios)} onEliminarVenta={eliminarVenta} onEditarVenta={editarVenta} onEliminarCliente={()=>{eliminarCliente(cliente.id);irA("gestionClientes");}}
          onNoEstaCliente={()=>{}} onNoQuiereCliente={()=>{}}
          recordatorios={recordatorios} onGuardarRecordatorio={(r)=>saveRecordatorios([...(recordatorios||[]),r])} onConfirmarRecordatorio={(id)=>saveRecordatorios((recordatorios||[]).map(r=>r.id===id?{...r,confirmado:true}:r))}
          onCobrarSaldo={(monto,pago)=>{
            if(cliente){
              const saldoAntes=cliente.saldo||0;
              const saldoDespues=saldoAntes+monto;
              const det=[{nombre:"Cobro de deuda",cantidad:1,precio:0,total:0}];
              const fk=fechaActual||new Date().toLocaleDateString("en-CA");
              const vt={id:Date.now(),clienteId:cliente.id,cliente:cliente.nombre,
                dia:diaActual||cliente.dia,fechaKey:fk,fecha:new Date().toLocaleString("es-AR"),
                detalle:det,pago,obs:`Cobro de deuda $${monto.toLocaleString("es-AR")} (${pago})`,saldoAplicado:0,
                neto:0,bruto:0,desc:0,costo:0,ganancia:0,pagadoNum:monto,saldoDelta:monto,envPrest:[],envDev:[],
                saldoAntes,saldoDespues,_esCobro:true,_upd:Date.now()};
              saveVentas([...ventas,vt]);
              saveClientes(clientes.map(x=>x.id===cliente.id?{...x,saldo:saldoDespues}:x));
            }
          }} />}
      {pantalla==="agenda" && <AgendaScreen
        recordatorios={recordatorios||[]}
        clientes={clientes}
        onConfirmar={(id)=>saveRecordatorios((recordatorios||[]).map(r=>r.id===id?{...r,confirmado:true}:r))}
        onEliminar={(id)=>saveRecordatorios((recordatorios||[]).filter(r=>r.id!==id))}
        onNuevo={(datos)=>{
          const c=clientes.find(x=>x.id===datos.clienteId);
          if(!c){alert("Seleccioná un cliente");return;}
          saveRecordatorios([...(recordatorios||[]),{...datos,id:Date.now(),clienteId:c.id,clienteNombre:c.nombre,dia:c.dia,confirmado:false}]);
        }}
        onIrCliente={(clienteId)=>{
          setClienteId(clienteId);
          irA("detalleDesdeGestion");
        }}
        onVolver={()=>irA("menu")}
      />}
      {pantalla==="stock"          && <StockGeneral stock={stockNorm} setStock={(ns)=>{setStock(ns);syncData({stock:ns});}} clientes={clientes} setClientes={saveClientes} ventas={ventas} productos={productos} setProductos={saveProductos} cargasDia={cargasDia} setCargasDia={saveCargasDia} planillas={planillas} onVolver={()=>irA("menu")} onResumen={()=>irA("resumen")} />}
      {pantalla==="resumen"        && <Resumen ventas={ventas} clientes={clientes} productos={productos} planillas={planillas} noVisitas={noVisitas||[]} onVolver={()=>irA("menu")} />}
      {pantalla==="fiadosPendientes" && <React.Fragment><ClientesTabs activo="fiados" onIr={irA}/><FiadosPendientes clientes={clientes} onCobrar={(clienteId,monto,pago)=>{
        const cl=clientes.find(c=>c.id===clienteId);
        if(!cl) return;
        const saldoAntes=cl.saldo||0;
        const saldoDespues=saldoAntes+monto;
        const vt={id:Date.now(),clienteId:cl.id,cliente:cl.nombre,dia:cl.dia,fechaKey:new Date().toLocaleDateString("en-CA"),fecha:new Date().toLocaleString("es-AR"),
          detalle:[{nombre:"Cobro de deuda",cantidad:1,precio:monto,total:monto}],pago,obs:`Cobro de deuda ${fmt(monto)} (${pago})`,
          neto:monto,bruto:monto,desc:0,costo:monto,ganancia:0,pagadoNum:monto,saldoDelta:monto,envPrest:[],envDev:[],saldoAntes,saldoDespues,_esCobro:true,_upd:Date.now()};
        saveVentas([...ventas,vt]);
        saveClientes(clientes.map(c=>c.id===clienteId?{...c,saldo:saldoDespues}:c));
      }} onVolver={()=>irA("menu")} ventas={ventas} onEditarCliente={(id,cambios)=>{saveClientes(clientes.map(c=>c.id===id?{...c,...cambios}:c));}} /></React.Fragment>}
      {pantalla==="clientesDormidos" && <React.Fragment><ClientesTabs activo="dormidos" onIr={irA}/><ClientesDormidos clientes={clientes} ventas={ventas} onVolver={()=>irA("menu")} onSeleccionar={c=>{setClienteId(c.id);setDiaActual(c.dia);irA("detalleCliente");}} onEditarCliente={(id,cambios)=>{saveClientes(clientes.map(c=>c.id===id?{...c,...cambios}:c));}} /></React.Fragment>}
      {/* Modal resumen del día al completarse */}
      {modalResumenDia&&(()=>{
        const {dia,fechaKey}=modalResumenDia;
        const vDia=ventas.filter(v=>v.fechaKey===fechaKey&&v.dia===dia&&!v._esCobro&&!v._esAjuste&&!v._esMixtoTrans);
        const efectivo=vDia.filter(v=>v.pago==="contado").reduce((a,v)=>a+(((Number(v.montoTrans)||0)>0)?(Number(v.montoEfec)||0):(v.pagadoNum||v.neto||0)),0);
        const transTot=vDia.filter(v=>v.pago==="transferencia").reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
        const transConf=vDia.filter(v=>v.pago==="transferencia"&&v.transConfirmada).reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0);
        const transPend=transTot-transConf;
        const fiado=vDia.filter(v=>v.pago==="fiado").reduce((a,v)=>a+(v.neto||0),0);
        const total=efectivo+transTot+fiado;
        return (
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:"var(--color-background-primary)",borderRadius:16,padding:24,width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:14}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:36,marginBottom:6}}>✅</div>
                <div style={{fontSize:17,fontWeight:600,color:"var(--color-text-primary)"}}>¡Día completado!</div>
                <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginTop:2,textTransform:"capitalize"}}>{dia} · {new Date(fechaKey+"T12:00:00").toLocaleDateString("es-AR",{day:"numeric",month:"long"})}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[["💵 Efectivo",efectivo,"success"],["💳 Transferencias",transTot,"info"],transPend>0&&["   🔴 Pendientes de confirmar",transPend,"warning"],["📋 Fiado nuevo",fiado,"warning"]].filter(Boolean).map(([l,v,c])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",borderRadius:8,background:"var(--color-background-secondary)"}}>
                    <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>{l}</span>
                    <span style={{fontSize:14,fontWeight:500,color:`var(--color-text-${c})`}}>{fmt(v)}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",borderRadius:8,background:"var(--color-background-tertiary)",borderTop:"0.5px solid var(--color-border-tertiary)"}}>
                  <span style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)"}}>Total del día</span>
                  <span style={{fontSize:17,fontWeight:700,color:"var(--color-text-success)"}}>{fmt(total)}</span>
                </div>
              </div>
              <button style={{...s.btnPrimary}} onClick={()=>{setModalResumenDia(null);irA("planilla");}}>
                Ver planilla completa →
              </button>
              <button style={{...s.btn,textAlign:"center"}} onClick={()=>setModalResumenDia(null)}>
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}
      {pantalla==="mapaClientes"    && <React.Fragment><ClientesTabs activo="mapa" onIr={irA}/><MapaClientes
        clientes={clientes}
        dia={diaActual}
        fecha={fechaActual}
        ventas={ventas}
        noVisitas={noVisitas}
        onActualizar={saveClientes}
        onSeleccionar={(c)=>{setClienteId(c.id);irA("detalleDesdeGestion");}}
        onVolver={()=>irA("menu")}
      /></React.Fragment>}
      {pantalla==="config"         && <Config productos={productos} setProductos={saveProductos} clientes={clientes} setClientes={saveClientes} ventas={ventas} setVentas={saveVentas} planillas={planillas} setPlanillas={savePlanillasCloud} stock={stockNorm} setStock={(s)=>{const ns=normStock(s);setStockRaw(ns);syncData({stock:ns});}} cargasDia={cargasDia} setCargasDia={saveCargasDia} syncData={syncData} onVolver={()=>irA("menu")} ecToken={ecToken} setEcToken={setEcToken} tabInicial={tabConfig} noVisitas={noVisitas} prospectos={prospectos} />}
    </div>
    {/* Botón flotante de escala — fuera del zoom para que no se afecte */}
    <button
      onClick={()=>setScaleIdx(i=>(i+1)%4)}
      title={`Tamaño: ${SCALE_LABELS[scaleIdx]} — tocá para cambiar`}
      style={{
        position:"fixed", bottom:18, right:18, zIndex:9999,
        width:38, height:38, borderRadius:"50%",
        background:"#185FA5", color:"#e2eaf4",
        border:"none", cursor:"pointer",
        fontSize:12, fontWeight:700,
        boxShadow:"0 2px 10px rgba(0,0,0,0.4)",
        display:"flex", alignItems:"center", justifyContent:"center",
        letterSpacing:"0.02em",
      }}>
      {SCALE_LABELS[scaleIdx]}
    </button>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = {error:null}; }
  static getDerivedStateFromError(e) { return {error:e}; }
  componentDidCatch(e,info) { console.error("App error:", e, info); }
  render() {
    if(this.state.error) return (
      <div style={{padding:40,textAlign:"center",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#0f1923"}}>
        <div style={{fontSize:40,marginBottom:16}}>⚠️</div>
        <div style={{fontSize:18,fontWeight:500,color:"#f07070",marginBottom:8}}>Algo salió mal</div>
        <div style={{fontSize:13,color:"#7a9ab8",marginBottom:20,maxWidth:300}}>{String(this.state.error.message||"Error desconocido")}</div>
        <button style={{background:"#185FA5",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontSize:14,cursor:"pointer"}}
          onClick={()=>{this.setState({error:null});window.location.hash="portada";}}>
          Reiniciar app
        </button>
      </div>
    );
    return this.props.children;
  }
}


// ── Render raíz ──────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ErrorBoundary><App /></ErrorBoundary>);
