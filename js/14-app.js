// ════════════════════════════════════════════════════════════════════
// ◆  14-app.js — Componente App principal
// ════════════════════════════════════════════════════════════════════

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
    const empty = {sifon:0,bidon10:0,bidon20:0};
    const base = {soderia:{...empty},casa:{...empty},camion:{...empty}};
    if(!s||typeof s!=="object") return base;
    if(s.soderia&&typeof s.soderia==="object") {
      return {
        soderia:{sifon:s.soderia?.sifon||0,bidon10:s.soderia?.bidon10||0,bidon20:s.soderia?.bidon20||0},
        casa:   {sifon:s.casa?.sifon||0,bidon10:s.casa?.bidon10||0,bidon20:s.casa?.bidon20||0},
        camion: {sifon:s.camion?.sifon||0,bidon10:s.camion?.bidon10||0,bidon20:s.camion?.bidon20||0},
      };
    }
    // old format
    return {soderia:{sifon:s.sifon||0,bidon10:s.bidon10||0,bidon20:s.bidon20||0},casa:{...empty},camion:{...empty}};
  };
  const [stockRaw, setStockRaw] = useLS("cat_stock_v4", {soderia:{sifon:0,bidon10:0,bidon20:0},casa:{sifon:0,bidon10:0,bidon20:0},camion:{sifon:0,bidon10:0,bidon20:0}});
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
      ["sifon","bidon10","bidon20"].forEach(k=>{
        s.soderia[k] = (s.soderia[k]||0) + (sobrLlenos[k]||0) + (vacios[k]||0);
        s.camion[k]  = Math.max(0, (s.camion[k]||0) - (sobrLlenos[k]||0) - (vacios[k]||0));
      });
      syncData({stock:s});
      return s;
    });
  };
  const [planillas, setPlanillas] = useLS("cat_planillas_v1", {});
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
  const [zonasReparto, setZonasReparto] = useLS("cat_zonas_v1", {});
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
      if (data.ventas?.length)     setVentasRaw(data.ventas);
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
      setSyncStatus("saved");
      setTimeout(()=>setSyncStatus("idle"), 2000);
    });
  }, []);

  // Ref siempre actualizado — evita datos viejos en el debounce
  const estadoRef = React.useRef({clientes,ventas,planillas,stock:stockNorm,productos,noVisitas,recordatorios,prospectos});
  React.useEffect(()=>{ estadoRef.current={clientes,ventas,planillas,stock:stockNorm,productos,noVisitas,recordatorios,prospectos,zonasReparto}; });

  // Auto backup DIARIO a localStorage
  React.useEffect(()=>{
    const ultimoBackup = localStorage.getItem("lc_ultimo_backup");
    const hoy = new Date().toISOString().slice(0,10);
    if(ultimoBackup===hoy) return; // ya se hizo hoy
    try {
      localStorage.setItem("lc_backup_"+hoy, JSON.stringify({clientes,ventas,planillas}));
      localStorage.setItem("lc_ultimo_backup", hoy);
      // Mantener solo el último backup (el de ayer)
      const keys = Object.keys(localStorage).filter(k=>k.startsWith("lc_backup_")).sort().reverse();
      keys.slice(1).forEach(k=>localStorage.removeItem(k));
      console.log("Auto-backup diario guardado:", hoy);
    } catch(e){ console.warn("Auto-backup falló:", e); }
  },[]);

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
    const pedirPermiso = async () => { if(Notification.permission==="default") await Notification.requestPermission(); };
    pedirPermiso();
    const programar18hs = () => {
      const ahora = new Date();
      const hoy18 = new Date(ahora.getFullYear(),ahora.getMonth(),ahora.getDate(),18,0,0);
      let ms = hoy18 - ahora; if(ms<0) ms += 24*60*60*1000;
      return setTimeout(()=>{
        if(Notification.permission==="granted"){
          const hoyKey = new Date().toISOString().slice(0,10);
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
          const hoyKey = new Date().toISOString().slice(0,10);
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
  const [cargasDia, setCargasDia] = useLS("cat_cargas_dia_v1", CARGA_DIA_DEFAULT);
  const saveCargasDia = (v) => { setCargasDia(v); try{localStorage.setItem("cat_cargas_dia_v1",JSON.stringify(v));}catch{} };
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
    if(planillaActual.iniciado && !localStorage.getItem(camionCerradoKey)) {
      localStorage.setItem(camionCerradoKey, "1");
      const prodMap = {"Bidón 10L":"b10","Bidón 20L":"b20","Sifón 1.5L":"soda"};
      // Cuánto salió en el camión (según planilla de inicio de reparto)
      const llenos = {
        b10: Number(planillaActual.productos?.b10?.llenos||0),
        b20: Number(planillaActual.productos?.b20?.llenos||0),
        soda: Number(planillaActual.productos?.soda?.llenos||0),
      };
      // Cuánto se vendió (cada venta = 1 vacío que vuelve en el intercambio)
      const vendidos = {b10:0,b20:0,soda:0};
      ventasDia.forEach(v=>v.detalle.forEach(d=>{const k=prodMap[d.nombre];if(k)vendidos[k]+=d.cantidad;}));
      // Préstamos (sin recibir vacío) y devoluciones de deudas anteriores
      const prestados = {b10:0,b20:0,soda:0};
      const devueltos = {b10:0,b20:0,soda:0};
      ventasDia.forEach(v=>{
        (v.envPrest||[]).forEach(e=>{const k=prodMap[e.prod];if(k)prestados[k]+=Number(e.cant)||0;});
        (v.envDev||[]).forEach(e=>{const k=prodMap[e.prod];if(k)devueltos[k]+=Number(e.cant)||0;});
      });
      setStock(prev=>{
        const s=JSON.parse(JSON.stringify(normStock(prev)));
        ["b10","b20","soda"].forEach(pk=>{
          const sk=pk==="b10"?"bidon10":pk==="b20"?"bidon20":"sifon";
          const sorb=Math.max(0, llenos[pk]-vendidos[pk]-prestados[pk]); // sobrantes llenos en camión
          const vacios=vendidos[pk]+devueltos[pk]; // vacíos que vuelven (vendidos + devoluciones)
          s.soderia[sk]=(s.soderia[sk]||0)+sorb+vacios; // todo vuelve a sodería
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

  if (!apiKey || !binId) {
    return <SetupNube onSetup={(key,id)=>{ setApiKey(key); setBinId(id); setSyncStatus("saved"); }} />;
  }

  const registrarVenta = (detalle, pago, montoPagado, saldoAplicado, envPrest, envDev, obs, opcionSaldo, montoTrans2, saldoDeltaMixto) => {
    const c = cliente;
    // Auto-detectar envases prestados (solo si no es cobro de deuda)
    const envAutoDetect = [];
    if(opcionSaldo!=="cobro_deuda") {
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

    const calc = calcVenta(detalle, pagoReal, montoPagado, saldoAplicado, productos);
    const nuevaVenta = {
      id:Date.now(), clienteId:c.id, cliente:c.nombre,
      dia:diaActual, fechaKey:fechaActual, fecha:new Date().toLocaleString("es-AR"),
      detalle, pago:pagoReal, obs:(obs||"")+obsExtra, saldoAplicado:saldoAplicado||0,
      envPrest:envPrestFinal,
      envDev:(envDev||[]).filter(e=>e.prod&&e.cant), ...calc,
      montoTrans:montoTrans2||0, montoEfec:opcionSaldo==="mixto_ef"?Number(montoPagado):0,
    };

    // Si es pago mixto, también guardamos la parte de transferencia como venta separada
    let nuevasVentas = [...ventas, nuevaVenta];
    let saldoExtra = calc.saldoDelta;
    if(montoTrans2>0 && opcionSaldo==="mixto_ef") {
      // Registrar transferencia como venta separada vinculada
      const nTr = nuevaVenta.neto; // mismo neto para no duplicar
      const ventaTr = {
        id:Date.now()+2, clienteId:c.id, cliente:c.nombre,
        dia:diaActual, fechaKey:fechaActual, fecha:new Date().toLocaleString("es-AR"),
        detalle:[{nombre:"Pago mixto · transferencia",cantidad:1,precio:montoTrans2,total:montoTrans2}],
        pago:"transferencia", obs:"[Parte transfer. de pago mixto]", saldoAplicado:0,
        neto:montoTrans2, bruto:montoTrans2, desc:0, costo:0, ganancia:montoTrans2,
        pagadoNum:montoTrans2, saldoDelta:montoTrans2, // suma al saldo del cliente
        envPrest:[], envDev:[],
      };
      nuevasVentas = [...nuevasVentas, ventaTr];
      saldoExtra += montoTrans2; // la transferencia abona al saldo
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
    let nc = clientes.filter(c=>c.id!==clienteId);
    if(eliminado) nc = renumerarTrasEliminar(nc, eliminado);
    saveClientes(nc);
    const nv = ventas.filter(v=>v.clienteId!==clienteId);
    saveVentas(nv);
    irA("clientes");
  };

  const eliminarVenta = (ventaId) => {
    const v = ventas.find(x=>x.id===ventaId); if(!v) return;
    const nv = ventas.filter(x=>x.id!==ventaId);
    saveVentas(nv);
    const c = clientes.find(x=>x.id===v.clienteId);
    if(c){ const nc=clientes.map(x=>x.id===c.id?{...x,saldo:c.saldo-v.saldoDelta}:x); saveClientes(nc); }
  };

  const editarVenta = (ventaId, detalle, pago, montoPagado, saldoAplicado, obs, montoTrans2) => {
    const vV = ventas.find(v=>v.id===ventaId); if(!vV) return;
    const c  = clientes.find(x=>x.id===vV.clienteId);
    const pagoReal = pago==="mixto"?"contado":pago;
    const calc = calcVenta(detalle, pagoReal, montoPagado, saldoAplicado, productos);
    // Remove old transfer venta if existed (from previous mixto edit)
    let nev = ventas.filter(v=>!(v.obs==="[Parte transfer. de pago mixto]"&&v.clienteId===vV.clienteId&&v.fechaKey===vV.fechaKey));
    nev = nev.map(v=>v.id===ventaId?{...vV,detalle,pago:pagoReal,obs,saldoAplicado:saldoAplicado||0,...calc}:v);
    let saldoExtra = c ? (c.saldo - vV.saldoDelta + calc.saldoDelta) : 0;
    // If mixto, add transfer venta
    if(pago==="mixto"&&montoTrans2>0){
      const ventaTr = {
        id:Date.now()+2, clienteId:vV.clienteId, cliente:vV.cliente,
        dia:vV.dia, fechaKey:vV.fechaKey, fecha:vV.fecha,
        detalle:[{nombre:"Pago mixto · transferencia",cantidad:1,precio:montoTrans2,total:montoTrans2}],
        pago:"transferencia", obs:"[Parte transfer. de pago mixto]", saldoAplicado:0,
        neto:montoTrans2, bruto:montoTrans2, desc:0, costo:0, ganancia:montoTrans2,
        pagadoNum:montoTrans2, saldoDelta:montoTrans2, envPrest:[], envDev:[],
      };
      nev = [...nev, ventaTr];
      saldoExtra += montoTrans2;
    }
    saveVentas(nev);
    if(c){ const nc=clientes.map(x=>x.id===c.id?{...x,saldo:saldoExtra}:x); saveClientes(nc); }
  };

  return (
    <div style={{position:"relative"}}>
    <div style={{...s.app, zoom: SCALES[scaleIdx]}}>
      <SyncBar status={syncStatus} isOnline={isOnline} />
      {pantalla==="portada"        && <Portada onIngresar={()=>irA("menu")} />}
      {pantalla==="menu"           && <MenuDias dias={DIAS} onDia={d=>{setDiaActual(d);irA("diaPrincipal");}} onResumen={()=>irA("resumen")} onConfig={()=>irA("config")} onGestionClientes={()=>irA("gestionClientes")} onPromocion={()=>irA("promocion")} onStock={()=>irA("stock")} onAgenda={()=>irA("agenda")} onVolver={()=>irA("portada")} darkMode={darkMode} onToggleDark={()=>setDarkMode(!darkMode)} clientes={clientes} ventas={ventas} stock={stockNorm}
          recordatoriosActivos={recordatoriosActivos}
          onConfirmarRecordatorio={(id)=>saveRecordatorios((recordatorios||[]).map(r=>r.id===id?{...r,confirmado:true}:r))}
          onVerConfirmaciones={(dia)=>{setDiaActual(dia);irA("confirmacionesDia");}}
          transferenciasPendientes={DIAS.map(dia=>{
            const vts = ventas.filter(v=>v.dia===dia&&v.pago==="transferencia"&&!v.transConfirmada);
            if(!vts.length) return null;
            const fechas = [...new Set(vts.map(v=>v.fechaKey))].sort().reverse();
            return {dia, fecha:fechas[0]||"", count:vts.length, monto:vts.reduce((a,v)=>a+(v.pagadoNum||v.neto||0),0), ventas:vts};
          }).filter(Boolean)} zonasReparto={zonasReparto} onSetZona={(dia,zona)=>{const nz={...zonasReparto,[dia]:zona};setZonasReparto(nz);syncData({zonasReparto:nz});}} />}
      {pantalla==="confirmacionesDia" && <ConfirmacionesDia
          dia={diaActual}
          ventas={ventas.filter(v=>v.dia===diaActual&&v.pago==="transferencia")}
          clientes={clientes}
          onConfirmar={(ventaId)=>{const nv=ventas.map(v=>v.id===ventaId?{...v,transConfirmada:!v.transConfirmada}:v);saveVentas(nv);}}
          onVolver={()=>irA("menu")} />}
      {pantalla==="diaPrincipal"   && <DiaPrincipal dia={diaActual} onIrClientes={()=>irA("selectorFechaClientes")} onIrPlanilla={()=>irA("selectorFechaPlanilla")} onVolver={()=>irA("menu")} onVerConfirmaciones={()=>irA("confirmacionesDia")} ventasPendientesTransfer={ventas.filter(v=>v.dia===diaActual&&v.pago==="transferencia"&&!v.transConfirmada).length} />}
      {pantalla==="selectorFechaPlanilla" && <SelectorFecha dia={diaActual} planillas={planillas} ventas={ventas} noVisitas={noVisitas} onSeleccionar={(fk,fo)=>{setFechaActual(fk);setFechaObj(fo);irA("planilla");}} onVolver={()=>irA("diaPrincipal")} />}
      {pantalla==="planilla"       && <PlanillaDelDia dia={diaActual} fecha={fechaActual} ventas={ventas.filter(v=>v.fechaKey===fechaActual)} clientes={clientes} planilla={planillas[`${diaActual}_${fechaActual}`]||planillaDiaVacia()} productos={productos} stock={stockNorm} setStock={setStock} syncData={syncData} onGuardar={d=>{savePlanilla(`${diaActual}_${fechaActual}`,d);irA("selectorFechaPlanilla");}} onVolver={()=>irA("selectorFechaPlanilla")} />}
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
      {pantalla==="clientes"       && <ListaClientes clientes={clientes.filter(c=>c.dia===diaActual)} dia={diaActual} fecha={fechaActual} ventas={ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual)} todasVentas={ventas} noVisitas={(noVisitas||[]).filter(v=>v.dia===diaActual&&v.fecha===fechaActual)} onSeleccionar={c=>{setClienteId(c.id);irA("detalleCliente");}} onNuevoCliente={()=>irA("nuevoCliente")} onVolver={()=>irA("selectorFechaClientes")} onReordenar={lista=>{
          const otros=clientes.filter(c=>c.dia!==diaActual);
          saveClientes([...otros,...lista]);
        }} onRegistrarNoVisita={(clienteId,motivo)=>{const nv=[...(noVisitas||[]).filter(v=>!(v.clienteId===clienteId&&v.dia===diaActual&&v.fecha===fechaActual)),{clienteId,dia:diaActual,fecha:fechaActual,motivo}];saveNoVisitas(nv);}} onQuitarNoVisita={(clienteId)=>{const nv=(noVisitas||[]).filter(v=>!(v.clienteId===clienteId&&v.dia===diaActual&&v.fecha===fechaActual));saveNoVisitas(nv);}}
        onConfirmarTransfer={(clienteId,ventaId)=>{
          const nv=ventas.map(v=>v.id===ventaId?{...v,transConfirmada:!v.transConfirmada}:v);
          saveVentas(nv);
        }}
        prospectos={(prospectos||[]).filter(p=>p.dia===diaActual&&p.estado==="activo")}
        recordatorios={recordatorios}
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
        />}
      {pantalla==="detalleCliente" && cliente && <DetalleCliente cliente={cliente} ventas={ventas.filter(v=>v.clienteId===cliente.id)} noVisitas={(noVisitas||[]).filter(v=>v.clienteId===cliente.id)} dia={diaActual} fecha={fechaActual} productos={productos} onVenta={()=>irA("venta")} onVolver={()=>irA("clientes")} onEditar={cambios=>updateCliente(cliente.id,cambios)} onEliminarVenta={eliminarVenta} onEditarVenta={editarVenta} onEliminarCliente={()=>eliminarCliente(cliente.id)}
          onNoEstaCliente={()=>{
            const nv=[...(noVisitas||[]).filter(v=>!(v.clienteId===cliente.id&&v.dia===diaActual&&v.fecha===fechaActual)),{clienteId:cliente.id,dia:diaActual,fecha:fechaActual,motivo:"noesta"}];
            saveNoVisitas(nv);
            const clientesDia=clientes.filter(c=>c.dia===diaActual).sort((a,b)=>(a.orden||9999)-(b.orden||9999));
            const ventasIds=new Set(ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual&&!v._esCobro&&!v._esAjuste).map(v=>v.clienteId));
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
            const ventasIds=new Set(ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual&&!v._esCobro&&!v._esAjuste).map(v=>v.clienteId));
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
            const vt={id:Date.now(),clienteId:cl.id,cliente:cl.nombre,dia:diaActual,fechaKey:fechaActual,fecha:new Date().toLocaleString("es-AR"),
              detalle:det,pago,obs:`Cobro de deuda $${monto.toLocaleString("es-AR")} (${pago})`,saldoAplicado:0,
              neto:0,bruto:0,desc:0,costo:0,ganancia:0,pagadoNum:monto,saldoDelta:monto,envPrest:[],envDev:[],
              saldoAntes,saldoDespues,_esCobro:true};
            saveVentas([...ventas,vt]);
            saveClientes(clientes.map(x=>x.id===cl.id?{...x,saldo:saldoDespues}:x));
          }}
          onGuardarAjuste={(vt)=>{saveVentas([...ventas,vt]);}} />}
      {pantalla==="venta"          && cliente && <NuevaVenta cliente={cliente} productos={productos} fecha={fechaActual}
        onNoEsta={()=>{
          const prev=(noVisitas||[]).find(v=>v.clienteId===clienteId&&v.dia===diaActual&&v.fecha===fechaActual);
          const motivo=prev?.motivo==="noesta"?"noesta2":"noesta";
          const nv=[...(noVisitas||[]).filter(v=>!(v.clienteId===clienteId&&v.dia===diaActual&&v.fecha===fechaActual)),{clienteId,dia:diaActual,fecha:fechaActual,motivo}];
          saveNoVisitas(nv);
          const clientesDia=clientes.filter(c=>c.dia===diaActual).sort((a,b)=>(a.orden||9999)-(b.orden||9999));
          const ventasIds=new Set(ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual&&!v._esCobro&&!v._esAjuste).map(v=>v.clienteId));
          const noVMap={};nv.filter(v=>v.dia===diaActual&&v.fecha===fechaActual).forEach(v=>{noVMap[v.clienteId]=v.motivo;});
          const terminados=new Set(clientesDia.filter(c=>ventasIds.has(c.id)||noVMap[c.id]==="noquiso"||noVMap[c.id]==="noesta2").map(c=>c.id));
          // 1ro: pendientes normales, 2do: los que no estaban, nunca sale si quedan clientes
          const normalPend=clientesDia.filter(c=>!terminados.has(c.id)&&noVMap[c.id]!=="noesta"&&c.id!==clienteId);
          const noestaPend=clientesDia.filter(c=>noVMap[c.id]==="noesta"&&!terminados.has(c.id)&&c.id!==clienteId);
          const sig=normalPend[0]||noestaPend[0];
          if(sig){setClienteId(sig.id);irA("detalleCliente");}else irA("clientes");
        }}
        onNoQuiere={()=>{
          const nv=[...(noVisitas||[]).filter(v=>!(v.clienteId===clienteId&&v.dia===diaActual&&v.fecha===fechaActual)),{clienteId,dia:diaActual,fecha:fechaActual,motivo:"noquiso"}];
          saveNoVisitas(nv);
          const clientesDia=clientes.filter(c=>c.dia===diaActual).sort((a,b)=>(a.orden||9999)-(b.orden||9999));
          const ventasIds=new Set(ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual&&!v._esCobro&&!v._esAjuste).map(v=>v.clienteId));
          const noVMap={};nv.filter(v=>v.dia===diaActual&&v.fecha===fechaActual).forEach(v=>{noVMap[v.clienteId]=v.motivo;});
          const terminados=new Set(clientesDia.filter(c=>ventasIds.has(c.id)||noVMap[c.id]==="noquiso"||noVMap[c.id]==="noesta2").map(c=>c.id));
          const normalPend=clientesDia.filter(c=>!terminados.has(c.id)&&noVMap[c.id]!=="noesta"&&c.id!==clienteId);
          const noestaPend=clientesDia.filter(c=>noVMap[c.id]==="noesta"&&!terminados.has(c.id)&&c.id!==clienteId);
          const sig=normalPend[0]||noestaPend[0];
          if(sig){setClienteId(sig.id);irA("detalleCliente");}else irA("clientes");
        }}
        onGuardar={(d,p,m,sa,ep,ed,obs,op)=>{
  registrarVenta(d,p,m,sa,ep,ed,obs,op);
  // Auto-advance to next pending client (noesta = volver al final, no saltar a ellos)
  const clientesDia = clientes.filter(c=>c.dia===diaActual).sort((a,b)=>(a.orden||9999)-(b.orden||9999));
  const visitadosIds = new Set([
    ...ventas.filter(v=>v.fechaKey===fechaActual&&v.dia===diaActual&&!v._esCobro&&!v._esAjuste).map(v=>v.clienteId),
    ...(noVisitas||[]).filter(v=>v.dia===diaActual&&v.fecha===fechaActual&&(v.motivo==="noquiso"||v.motivo==="noesta2"||v.motivo==="noesta")).map(v=>v.clienteId)
  ]);
  visitadosIds.add(clienteId);
  const siguiente = clientesDia.find(c=>!visitadosIds.has(c.id)&&c.id!==clienteId);
  if(siguiente){ setClienteId(siguiente.id); irA("detalleCliente"); }
  else irA("clientes");
}} onVolver={()=>irA("detalleCliente")} />}
      {pantalla==="nuevoCliente"   && <NuevoCliente diaActual={diaActual} onGuardar={(datos)=>{
          const orden=datos.orden;
          let base=clientes;
          if(orden&&clientes.some(c=>c.dia===datos.dia&&(c.orden||0)===Number(orden))){
            base=clientes.map(c=>c.dia===datos.dia&&(c.orden||0)>=Number(orden)?{...c,orden:(c.orden||0)+1}:c);
          }
          const nc=[...base,{...datos,id:Date.now(),saldo:0,dispenser:datos.dispenser||0}]
            .sort((a,b)=>DIAS.indexOf(a.dia)-DIAS.indexOf(b.dia)||(a.orden||9999)-(b.orden||9999));
          saveClientes(nc);irA("clientes");
        }} onVolver={()=>irA("clientes")} />}
      {pantalla==="historial" && <CargaHistorica clientes={clientes} productos={productos} onGuardar={(vts)=>{saveVentas([...ventas,...vts]);irA("menu");}} onVolver={()=>irA("menu")} />}
      {pantalla==="promocion"       && <Promocion prospectos={prospectos} clientes={clientes} onSave={saveProspectos} onConvertir={(p)=>{
        const nuevo={...p,id:Date.now(),saldo:0,sifon:0,bidon10:1,bidon20:0};
        saveClientes([...clientes,nuevo]);
        saveProspectos(prospectos.map(x=>x.id===p.id?{...x,estado:"convertido"}:x));
        irA("promocion");
      }} onVolver={()=>irA("menu")} />}
      {pantalla==="gestionClientes" && <GestionClientes clientes={clientes} onReordenarTodo={(lista)=>saveClientes(lista)} onEditar={(id,cambios)=>{saveClientes(clientes.map(c=>c.id===id?{...c,...cambios}:c));}} onEliminar={(id)=>{
        if(window.confirm("¿Eliminar cliente?")){
          const eliminado=clientes.find(c=>c.id===id);
          let nc=clientes.filter(c=>c.id!==id);
          if(eliminado) nc=renumerarTrasEliminar(nc,eliminado);
          saveClientes(nc);
        }}} onNuevo={(datos)=>{
        const orden = datos.orden;
        let nuevos;
        if(orden&&clientes.some(c=>c.dia===datos.dia&&c.orden===orden)){
          // Shift all clients with same day and order >= new order
          nuevos = clientes.map(c=>c.dia===datos.dia&&(c.orden||0)>=orden?{...c,orden:(c.orden||0)+1}:c);
        } else { nuevos = [...clientes]; }
        saveClientes([...nuevos,{...datos,id:Date.now(),saldo:0,dispenser:datos.dispenser||0}].sort((a,b)=>DIAS.indexOf(a.dia)-DIAS.indexOf(b.dia)||(a.orden||9999)-(b.orden||9999)));
      }} onVolver={()=>irA("menu")} onRegistrarVenta={(c)=>{
          setClienteId(c.id);
          // Asegurar que fechaActual esté seteado a hoy
          const hoyKey = new Date().toISOString().slice(0,10);
          if(!fechaActual) setFechaActual(hoyKey);
          // Si no hay diaActual, usar el día del cliente como fallback
          if(!diaActual) setDiaActual(c.dia);
          irA("venta");
        }} onVerDetalle={(c)=>{setClienteId(c.id);irA("detalleDesdeGestion");}} ventas={ventas} />}
      {pantalla==="detalleDesdeGestion" && cliente && <DetalleCliente cliente={cliente} ventas={ventas.filter(v=>v.clienteId===cliente.id)} noVisitas={(noVisitas||[]).filter(v=>v.clienteId===cliente.id)} dia={diaActual||cliente.dia} fecha={fechaActual} productos={productos} onVenta={()=>{setDiaActual(cliente.dia);const hoy=new Date().toISOString().slice(0,10);if(!fechaActual)setFechaActual(hoy);irA("venta");}} onVolver={()=>irA("gestionClientes")} onEditar={cambios=>updateCliente(cliente.id,cambios)} onEliminarVenta={eliminarVenta} onEditarVenta={editarVenta} onEliminarCliente={()=>{eliminarCliente(cliente.id);irA("gestionClientes");}}
          onNoEstaCliente={()=>{}} onNoQuiereCliente={()=>{}}
          recordatorios={recordatorios} onGuardarRecordatorio={(r)=>saveRecordatorios([...(recordatorios||[]),r])} onConfirmarRecordatorio={(id)=>saveRecordatorios((recordatorios||[]).map(r=>r.id===id?{...r,confirmado:true}:r))}
          onCobrarSaldo={(monto,pago)=>{
            if(cliente){
              const saldoAntes=cliente.saldo||0;
              const saldoDespues=saldoAntes+monto;
              const det=[{nombre:"Cobro de deuda",cantidad:1,precio:0,total:0}];
              const fk=fechaActual||new Date().toISOString().slice(0,10);
              const vt={id:Date.now(),clienteId:cliente.id,cliente:cliente.nombre,
                dia:diaActual||cliente.dia,fechaKey:fk,fecha:new Date().toLocaleString("es-AR"),
                detalle:det,pago,obs:`Cobro de deuda $${monto.toLocaleString("es-AR")} (${pago})`,saldoAplicado:0,
                neto:0,bruto:0,desc:0,costo:0,ganancia:0,pagadoNum:monto,saldoDelta:monto,envPrest:[],envDev:[],
                saldoAntes,saldoDespues,_esCobro:true};
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
      {pantalla==="stock"          && <StockGeneral stock={stockNorm} setStock={(ns)=>{setStock(ns);syncData({stock:ns});}} clientes={clientes} ventas={ventas} productos={productos} planillas={planillas} onVolver={()=>irA("menu")} />}
      {pantalla==="resumen"        && <Resumen ventas={ventas} clientes={clientes} productos={productos} planillas={planillas} noVisitas={noVisitas||[]} onVolver={()=>irA("menu")} />}
      {pantalla==="config"         && <Config productos={productos} setProductos={saveProductos} clientes={clientes} setClientes={saveClientes} ventas={ventas} setVentas={saveVentas} planillas={planillas} setPlanillas={savePlanillasCloud} stock={stockNorm} setStock={(s)=>{const ns=normStock(s);setStockRaw(ns);syncData({stock:ns});}} cargasDia={cargasDia} setCargasDia={saveCargasDia} syncData={syncData} onVolver={()=>irA("menu")} ecToken={ecToken} setEcToken={setEcToken} />}
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
