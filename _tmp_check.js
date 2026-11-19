
// ══════════════════════════════════════════════════════════════════
// Config Firebase — la misma que usa la app (apiKey pública, la
// seguridad la da el login real + las reglas de Firestore, no este dato).
// ══════════════════════════════════════════════════════════════════
var firebaseConfig = {
  apiKey: "AIzaSyCqZnFu-I-5MdnSybf7e5t5l7jnyuho4_o",
  authDomain: "la-catalina-416d5.firebaseapp.com",
  projectId: "la-catalina-416d5",
  storageBucket: "la-catalina-416d5.firebasestorage.app",
  messagingSenderId: "1092497470043",
  appId: "1:1092497470043:web:13c3eb5473541a7260c57e"
};
if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
try { firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch(e){}

var LC_LISTAS = ['clientes','ventas'];
var LC_MAPAS = ['zonasReparto'];

function lcUnval(d){ return (d && Object.prototype.hasOwnProperty.call(d,'_v') && Object.keys(d).length===1) ? d._v : d; }

// ══════════════════════════════════════════════════════════════════
// Defaults (idénticos a 02-constantes.js) — por si config/app todavía
// no tiene costosVehiculo/casaUbicacion guardados en la nube.
// ══════════════════════════════════════════════════════════════════
var DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
var COSTOS_VEHICULO_DEFAULT = [
  { id: 1, nombre: "Combustible (GNC)",      tipo: "monto", monto: 227,     frecuencia: "km",    repiteCada: 1 },
  { id: 2, nombre: "Aceite",                 tipo: "monto", monto: 16000,   frecuencia: "semana",repiteCada: 1 },
  { id: 3, nombre: "Seguro",                 tipo: "monto", monto: 47000,   frecuencia: "mes",   repiteCada: 1 },
  { id: 4, nombre: "Revisación técnica",     tipo: "monto", monto: 90000,   frecuencia: "año",   repiteCada: 1 },
  { id: 5, nombre: "Cambio de oblea (GNC)",  tipo: "monto", monto: 35000,   frecuencia: "año",   repiteCada: 1 },
  { id: 6, nombre: "Cubiertas (4)",          tipo: "monto", monto: 1200000, frecuencia: "año",   repiteCada: 4 },
  { id: 7, nombre: "Repuestos imprevistos",  tipo: "porcentaje", porcentaje: 8, base: "gastoVehiculoTotal" },
];
var CASA_UBICACION_DEFAULT = { lat: -26.865927367594715, lng: -65.21777978271315, nombre: "Casa" };
var DIAS_POR_FRECUENCIA_VEHICULO = { "semana": 7, "mes": 30.44, "año": 365.25 };

// ══════════════════════════════════════════════════════════════════
// Cálculos — port exacto de js/16-ganancianeta.js (mismas fórmulas,
// mismos nombres, para que los números siempre coincidan con la app).
// ══════════════════════════════════════════════════════════════════
function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 0;
  var R = 6371;
  function toRad(d){ return d * Math.PI / 180; }
  var dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  var a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function calcularKmDelDia(ventasDelDia, clientes, casaUbicacion) {
  if (!ventasDelDia.length) return { km: 0, clientesContados: 0, clientesSinUbicacion: 0, visitas: 0 };
  var porCliente = {};
  ventasDelDia.forEach(function(v){
    var h = v.hora || "00:00";
    if (!porCliente[v.clienteId] || h < porCliente[v.clienteId].hora) porCliente[v.clienteId] = { clienteId: v.clienteId, hora: h };
  });
  var orden = Object.values(porCliente).sort(function(a,b){ return a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : 0; });
  var sinUbic = 0, puntos = [];
  orden.forEach(function(o){
    var c = (clientes||[]).find(function(c){ return c.id === o.clienteId; });
    if (c && c.lat != null && c.lng != null) puntos.push({lat:c.lat, lng:c.lng});
    else sinUbic++;
  });
  if (casaUbicacion && casaUbicacion.lat != null && casaUbicacion.lng != null && puntos.length) {
    puntos = [{lat:casaUbicacion.lat,lng:casaUbicacion.lng}].concat(puntos, [{lat:casaUbicacion.lat,lng:casaUbicacion.lng}]);
  }
  var km = 0;
  for (var i=1;i<puntos.length;i++) km += haversineKm(puntos[i-1].lat, puntos[i-1].lng, puntos[i].lat, puntos[i].lng);
  return { km: Math.round(km*10)/10, clientesContados: orden.length - sinUbic, clientesSinUbicacion: sinUbic, visitas: orden.length };
}
function calcularGastoVehiculoDelDia(costosVehiculo, kmDelDia) {
  var detalle = [], totalBase = 0;
  (costosVehiculo||[]).forEach(function(item){
    if (item.tipo === "porcentaje") return;
    var monto = 0;
    if (item.frecuencia === "km") monto = (Number(item.monto)||0) * kmDelDia;
    else { var dias = DIAS_POR_FRECUENCIA_VEHICULO[item.frecuencia] || 0; var repite = Number(item.repiteCada)||1; monto = dias>0 ? (Number(item.monto)||0)/(repite*dias) : 0; }
    monto = Math.round(monto);
    detalle.push(Object.assign({}, item, {montoDia: monto}));
    totalBase += monto;
  });
  (costosVehiculo||[]).forEach(function(item){
    if (item.tipo !== "porcentaje") return;
    var monto = Math.round(totalBase * (Number(item.porcentaje)||0) / 100);
    detalle.push(Object.assign({}, item, {montoDia: monto}));
  });
  var total = detalle.reduce(function(a,d){ return a+d.montoDia; }, 0);
  return { detalle: detalle, total: total };
}
function factorBultoPorNombre(nombre) {
  if (!nombre) return 0;
  var n = String(nombre).toLowerCase();
  if (n.includes("20")) return 1.5;
  if (n.includes("10")) return 1;
  if (n.includes("sif") || n.includes("soda")) return 1/6;
  return 0;
}
function bultosDeDetalle(detalle) {
  var det = Array.isArray(detalle) ? detalle : Object.values(detalle||{});
  return det.reduce(function(a,d){ return a + (Number(d.cantidad)||0) * factorBultoPorNombre(d.nombre); }, 0);
}
var DIAS_SEMANA_TODAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
function diaSemanaDeFecha(fechaKey) {
  var p = fechaKey.split("-").map(Number);
  return DIAS_SEMANA_TODAS[new Date(p[0], p[1]-1, p[2]).getDay()];
}
function promedioDiasEntreCobros(ventas) {
  var porCliente = {};
  (ventas||[]).forEach(function(v){
    if (v._esCobro && v.clienteId != null && v.fechaKey) (porCliente[v.clienteId] = porCliente[v.clienteId]||[]).push(v.fechaKey);
  });
  var gaps = [];
  Object.values(porCliente).forEach(function(fechas){
    var ordenadas = Array.from(new Set(fechas)).sort();
    for (var i=1;i<ordenadas.length;i++){
      var dias = Math.round((new Date(ordenadas[i]) - new Date(ordenadas[i-1])) / 86400000);
      if (dias>0) gaps.push(dias);
    }
  });
  if (!gaps.length) return null;
  return gaps.reduce(function(a,b){return a+b;},0) / gaps.length;
}
function esVentaReal(v){ return !v._esCobro && !v._esAjuste && !v._esAjusteEnvases && !v._esCambio && !v._esMixtoTrans; }

// Calcula los datos de un día a partir de su propio slice de ventas ya
// filtrado (más rápido que re-filtrar todo el array por cada día cuando
// se procesa el historial completo).
function calcularDatosDelDiaDesdeSlice(fechaKey, ventasDelDiaTodas, clientes, costosVehiculo, casaUbicacion) {
  var ventasReales = ventasDelDiaTodas.filter(esVentaReal);
  var totalVendido = ventasReales.reduce(function(a,v){return a+(v.neto||0);},0);
  var totalCostoLlenado = ventasReales.reduce(function(a,v){return a+(v.costo||0);},0);
  var gananciaBruta = ventasReales.reduce(function(a,v){return a+(v.ganancia||0);},0);
  var totalBultos = ventasReales.reduce(function(a,v){return a+bultosDeDetalle(v.detalle);},0);
  var kmInfo = calcularKmDelDia(ventasReales, clientes, casaUbicacion);
  var gv = calcularGastoVehiculoDelDia(costosVehiculo, kmInfo.km);
  var gananciaNeta = gananciaBruta - gv.total;
  return {
    fechaKey: fechaKey, totalVendido: totalVendido, totalCostoLlenado: totalCostoLlenado, gananciaBruta: gananciaBruta,
    km: kmInfo.km, clientesContados: kmInfo.clientesContados, clientesSinUbicacion: kmInfo.clientesSinUbicacion, visitas: kmInfo.visitas,
    detalleCostos: gv.detalle, gastoVehiculo: gv.total, gananciaNeta: gananciaNeta, totalBultos: totalBultos,
    pctBruto: totalVendido>0 ? Math.round(gananciaBruta/totalVendido*100) : 0,
    pctNeto: totalVendido>0 ? Math.round(gananciaNeta/totalVendido*100) : 0,
    kmPorCliente: kmInfo.visitas>0 ? kmInfo.km/kmInfo.visitas : 0,
  };
}

var fmt = function(n){ return "$" + Math.round(Number(n)||0).toLocaleString("es-AR"); };
function fechaLegible(fechaKey) {
  var p = fechaKey.split("-").map(Number);
  return new Date(p[0], p[1]-1, p[2]).toLocaleDateString("es-AR", {weekday:"short", day:"numeric", month:"short"});
}
function mesKeyDeFecha(fechaKey){ return fechaKey.slice(0,7); }
function nombreMesLegible(mesKey) {
  var p = mesKey.split("-").map(Number);
  return new Date(p[0], p[1]-1, 1).toLocaleDateString("es-AR", {month:"long", year:"numeric"});
}

// ══════════════════════════════════════════════════════════════════
// Estado global en memoria (se llena una vez al cargar / actualizar)
// ══════════════════════════════════════════════════════════════════
var ESTADO = {
  ventas: [], clientes: [], zonasReparto: {}, costosVehiculo: COSTOS_VEHICULO_DEFAULT, casaUbicacion: CASA_UBICACION_DEFAULT,
  datosPorDia: [],   // [{fechaKey, ...calcularDatosDelDiaDesdeSlice}] para TODOS los días con venta, ordenados
  diaSel: null, ventanaDias: 0 // 0 = todo el historial
};

function guardarLocal(k,v){ try{ localStorage.setItem(k, v); }catch(e){} }
function leerLocal(k,d){ try{ return localStorage.getItem(k) || d; }catch(e){ return d; } }

// ══════════════════════════════════════════════════════════════════
// Carga de datos — TODO el historial, en vivo desde Firestore
// ══════════════════════════════════════════════════════════════════
function cargarTodo() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  document.getElementById('loading').style.display = 'block';

  var gets = [
    db.collection('ventas').get(),
    db.collection('clientes').get(),
    db.collection('zonasReparto').get(),
    db.collection('config').doc('app').get(),
  ];
  Promise.all(gets).then(function(res){
    var ventas = []; res[0].forEach(function(d){ ventas.push(d.data()); });
    var clientes = []; res[1].forEach(function(d){ clientes.push(d.data()); });
    var zonasReparto = {}; res[2].forEach(function(d){ zonasReparto[d.id] = lcUnval(d.data()); });
    var cfg = res[3].exists ? res[3].data() : {};

    ESTADO.ventas = ventas;
    ESTADO.clientes = clientes;
    ESTADO.zonasReparto = zonasReparto;
    ESTADO.costosVehiculo = (cfg.costosVehiculo && cfg.costosVehiculo.length) ? cfg.costosVehiculo : COSTOS_VEHICULO_DEFAULT;
    ESTADO.casaUbicacion = cfg.casaUbicacion || CASA_UBICACION_DEFAULT;
    ESTADO.sinCostosEnNube = !(cfg.costosVehiculo && cfg.costosVehiculo.length);

    // Agrupa ventas reales por fechaKey una sola vez, y calcula cada día
    // una sola vez (evita re-filtrar todo el historial por cada día).
    var porFecha = {};
    ventas.forEach(function(v){ if (v.fechaKey) (porFecha[v.fechaKey] = porFecha[v.fechaKey] || []).push(v); });
    var fechas = Object.keys(porFecha).sort();
    var datosPorDia = fechas.map(function(fk){
      return calcularDatosDelDiaDesdeSlice(fk, porFecha[fk], clientes, ESTADO.costosVehiculo, ESTADO.casaUbicacion);
    }).filter(function(d){ return d.totalVendido > 0; });
    ESTADO.datosPorDia = datosPorDia;

    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    renderTodo();
  }).catch(function(e){
    document.getElementById('loading').innerHTML = '<div style="color:var(--rojo)">Error cargando datos: ' + (e.message||e) + '</div>';
    console.error(e);
  });
}

// ══════════════════════════════════════════════════════════════════
// Render
// ══════════════════════════════════════════════════════════════════
function datosEnVentana(dias) {
  if (!dias) return ESTADO.datosPorDia;
  if (!ESTADO.datosPorDia.length) return [];
  var ultimaFecha = ESTADO.datosPorDia[ESTADO.datosPorDia.length-1].fechaKey;
  var limite = new Date(ultimaFecha); limite.setDate(limite.getDate() - dias);
  var limiteKey = limite.toLocaleDateString("en-CA");
  return ESTADO.datosPorDia.filter(function(d){ return d.fechaKey >= limiteKey; });
}

function renderTodo() {
  var sel = document.getElementById('ventanaSel');
  if (!sel.options.length) {
    [[0,'Todo el historial'],[90,'Últimos 90 días'],[30,'Últimos 30 días']].forEach(function(o){
      var op = document.createElement('option'); op.value=o[0]; op.textContent=o[1]; sel.appendChild(op);
    });
    sel.value = leerLocal('cat_ext_ventana', '0');
    sel.addEventListener('change', function(){ guardarLocal('cat_ext_ventana', sel.value); renderTodo(); });
  }
  ESTADO.ventanaDias = Number(sel.value) || 0;
  var datos = datosEnVentana(ESTADO.ventanaDias);

  var primera = ESTADO.datosPorDia[0], ultima = ESTADO.datosPorDia[ESTADO.datosPorDia.length-1];
  document.getElementById('resumenCarga').textContent =
    ESTADO.ventas.length + ' ventas · ' + ESTADO.clientes.length + ' clientes' +
    (primera ? ' · historial desde ' + fechaLegible(primera.fechaKey) + ' hasta ' + fechaLegible(ultima.fechaKey) : '') +
    (ESTADO.sinCostosEnNube ? ' · ⚠ costos de vehículo aún no llegaron de la nube (abrí Config → Vehículo en la app una vez para subirlos)' : '');

  renderAhora(datos);
  renderDias(datos);
  renderMensual(datos);
  renderObjetivo(datos);
  renderZona(datos);
}

function renderAhora(datos) {
  var box = document.getElementById('statsAhora');
  if (!datos.length) { box.innerHTML = '<div class="sub">No hay ventas en esta ventana.</div>'; return; }
  var totalVenta = datos.reduce(function(a,d){return a+d.totalVendido;},0);
  var totalNeto = datos.reduce(function(a,d){return a+d.gananciaNeta;},0);
  var totalBultos = datos.reduce(function(a,d){return a+d.totalBultos;},0);
  var totalClientes = datos.reduce(function(a,d){return a+d.visitas;},0);
  var n = datos.length;
  var pctNeto = totalVenta>0 ? Math.round(totalNeto/totalVenta*100) : 0;
  box.innerHTML =
    stat(fmt(totalVenta/n), 'venta / jornada') +
    stat('<span class="verde">'+pctNeto+'%</span>', 'ganancia neta') +
    stat((totalBultos/n).toFixed(0), 'bultos / jornada') +
    stat((totalClientes/n).toFixed(0), 'clientes / jornada') +
    stat(fmt(totalNeto), 'ganancia neta total') +
    stat(n, 'jornadas con venta');
}
function stat(v,l){ return '<div class="stat"><div class="v">'+v+'</div><div class="l">'+l+'</div></div>'; }

function renderDias(datos) {
  var porDiaSemana = {};
  datos.forEach(function(d){
    var ds = diaSemanaDeFecha(d.fechaKey);
    (porDiaSemana[ds] = porDiaSemana[ds] || []).push(d);
  });
  var filas = Object.keys(porDiaSemana).map(function(ds){
    var arr = porDiaSemana[ds];
    var n = arr.length;
    var clientesProm = arr.reduce(function(a,d){return a+d.visitas;},0)/n;
    var bultosProm = arr.reduce(function(a,d){return a+d.totalBultos;},0)/n;
    var ventaProm = arr.reduce(function(a,d){return a+d.totalVendido;},0)/n;
    var netoProm = arr.reduce(function(a,d){return a+d.gananciaNeta;},0)/n;
    return { dia: ds, n: n, clientesProm: clientesProm, bultosProm: bultosProm, ventaProm: ventaProm,
      pctNeto: ventaProm>0 ? Math.round(netoProm/ventaProm*100) : 0,
      bultosPorCliente: clientesProm>0 ? bultosProm/clientesProm : 0 };
  });
  var ordenDias = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  filas.sort(function(a,b){ return ordenDias.indexOf(a.dia) - ordenDias.indexOf(b.dia); });
  var mejor = filas.length ? filas.reduce(function(a,f){return f.ventaProm>a.ventaProm?f:a;},filas[0]) : null;
  var peor = filas.length>1 ? filas.reduce(function(a,f){return f.ventaProm<a.ventaProm?f:a;},filas[0]) : null;

  var html = '<tr><th>Día</th><th class=r>Jornadas</th><th class=r>Clientes</th><th class=r>Bultos</th><th class=r>Bultos/cliente</th><th class=r>Venta/jornada</th><th class=r>% neto</th></tr>';
  filas.forEach(function(f){
    var cls = (mejor && f.dia===mejor.dia) ? 'mejor' : (peor && f.dia===peor.dia) ? 'peor' : '';
    html += '<tr class="clickable '+cls+(ESTADO.diaSel===f.dia?' sel':'')+'" data-dia="'+f.dia+'">' +
      '<td>'+f.dia+(mejor&&f.dia===mejor.dia?'<span class=badge-mejor>MEJOR</span>':'')+(peor&&f.dia===peor.dia?'<span class=badge-peor>MÁS FLOJO</span>':'')+'</td>' +
      '<td class=r>'+f.n+'</td>' +
      '<td class=r>'+f.clientesProm.toFixed(0)+'</td>' +
      '<td class=r>'+f.bultosProm.toFixed(0)+'</td>' +
      '<td class=r>'+f.bultosPorCliente.toFixed(1)+'</td>' +
      '<td class=r>'+fmt(f.ventaProm)+'</td>' +
      '<td class=r '+(f.pctNeto>=0?'verde':'rojo')+'>'+f.pctNeto+'%</td></tr>';
  });
  document.getElementById('tablaDias').innerHTML = html;
  document.querySelectorAll('#tablaDias tr[data-dia]').forEach(function(tr){
    tr.addEventListener('click', function(){
      ESTADO.diaSel = (ESTADO.diaSel === tr.dataset.dia) ? null : tr.dataset.dia;
      renderDias(datos); renderDetalleDia(datos, filas, mejor);
    });
  });
  renderDetalleDia(datos, filas, mejor);
}

function renderDetalleDia(datos, filas, mejor) {
  var box = document.getElementById('detalleDia');
  if (!ESTADO.diaSel) { box.innerHTML = ''; return; }
  var f = filas.find(function(x){return x.dia===ESTADO.diaSel;});
  if (!f) { box.innerHTML = ''; return; }
  var diasRepartoSemana = diasRepartoActual(datos);
  var vp = valoresPromedioGlobal(datos);
  var esMejor = mejor && f.dia === mejor.dia;
  var html = '<div class="card"><div class="seccion-titulo" style="margin-bottom:10px">'+f.dia+' — detalle</div>';
  html += '<div class="row"><span class="l">Clientes reales / jornada</span><span class="v">≈'+f.clientesProm.toFixed(1)+'</span></div>';
  html += '<div class="row"><span class="l">Bultos reales / jornada</span><span class="v">≈'+f.bultosProm.toFixed(1)+'</span></div>';
  html += '<div class="row"><span class="l">Venta / bulto / cliente</span><span class="v">'+fmt(f.ventaProm/Math.max(f.clientesProm,1))+' · '+f.bultosPorCliente.toFixed(1)+' bultos/cliente</span></div>';
  if (esMejor) {
    html += '<div class="ok-msg">🏆 Es tu mejor día — referencia para los demás</div>';
  } else if (mejor) {
    var faltanClientes = Math.max(0, Math.round(mejor.clientesProm - f.clientesProm));
    var faltaVenta = vp.ventaPorCliente>0 ? faltanClientes * vp.ventaPorCliente : Math.max(0, mejor.ventaProm - f.ventaProm);
    html += '<div class="faltan">Le faltan ≈'+faltanClientes+' cliente'+(faltanClientes===1?'':'s')+' y ≈'+fmt(faltaVenta)+' en venta por jornada para igualar a '+mejor.dia+'</div>';
  }
  html += '<div class="nota">Si agregás 1 día más de reparto (' + (diasRepartoSemana+1) + ' en total), el objetivo se reparte entre más jornadas y necesitarías menos en cada una.</div>';
  html += '</div>';
  box.innerHTML = html;
}

function renderMensual(datos) {
  var porMes = {};
  datos.forEach(function(d){ (porMes[mesKeyDeFecha(d.fechaKey)] = porMes[mesKeyDeFecha(d.fechaKey)] || []).push(d); });
  var meses = Object.keys(porMes).sort();
  var filas = meses.map(function(mk){
    var arr = porMes[mk];
    var venta = arr.reduce(function(a,d){return a+d.totalVendido;},0);
    var neto = arr.reduce(function(a,d){return a+d.gananciaNeta;},0);
    var bultos = arr.reduce(function(a,d){return a+d.totalBultos;},0);
    return { mes: mk, venta: venta, neto: neto, bultos: bultos, pctNeto: venta>0?Math.round(neto/venta*100):0 };
  });
  var html = '<tr><th>Mes</th><th class=r>Venta</th><th class=r>Neto</th><th class=r>%</th></tr>';
  filas.slice().reverse().forEach(function(f){
    html += '<tr><td style="text-transform:capitalize">'+nombreMesLegible(f.mes)+'</td><td class=r>'+fmt(f.venta)+'</td><td class=r>'+fmt(f.neto)+'</td><td class=r '+(f.pctNeto>=0?'verde':'rojo')+'>'+f.pctNeto+'%</td></tr>';
  });
  document.getElementById('tablaMensual').innerHTML = html;

  var ctx = document.getElementById('chartMensual');
  if (window._chartMensual) window._chartMensual.destroy();
  window._chartMensual = new Chart(ctx, {
    type: 'bar',
    data: { labels: filas.map(function(f){return nombreMesLegible(f.mes).replace(/ de \d+/,'');}),
      datasets: [{ label: 'Ganancia neta', data: filas.map(function(f){return f.neto;}), backgroundColor: '#4dd9a0' }] },
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{
      x:{ticks:{color:'#9fb2c0'}, grid:{color:'#223240'}},
      y:{ticks:{color:'#9fb2c0', callback:function(v){return '$'+(v/1000)+'k';}}, grid:{color:'#223240'}}
    }}
  });
}

function diasRepartoActual(datos) {
  var input = Number(leerLocal('cat_ext_dias_reparto',''));
  if (input > 0) return input;
  var set = new Set(datos.map(function(d){return diaSemanaDeFecha(d.fechaKey);}));
  return set.size || DIAS.length;
}
function valoresPromedioGlobal(datos) {
  if (!datos.length) return { pctNeto:0, ventaPorCliente:0, precioPorBulto:0, bultosPorCliente:0, hay:false };
  var totalVenta = datos.reduce(function(a,d){return a+d.totalVendido;},0);
  var totalNeto = datos.reduce(function(a,d){return a+d.gananciaNeta;},0);
  var totalBultos = datos.reduce(function(a,d){return a+d.totalBultos;},0);
  var totalClientes = datos.reduce(function(a,d){return a+d.visitas;},0);
  var hay = totalVenta>0 && totalClientes>0 && totalBultos>0;
  return {
    hay: hay,
    pctNeto: hay ? totalNeto/totalVenta : 0,
    ventaPorCliente: hay ? totalVenta/totalClientes : 0,
    precioPorBulto: hay ? totalVenta/totalBultos : 0,
    bultosPorCliente: hay ? totalBultos/totalClientes : 0,
    totalVenta: totalVenta, totalNeto: totalNeto, totalBultos: totalBultos, totalClientes: totalClientes, n: datos.length
  };
}

function renderObjetivo(datos) {
  var vp = valoresPromedioGlobal(datos);
  document.getElementById('objPctNeto').textContent = Math.round(vp.pctNeto*100) + '%';
  document.getElementById('objVentaCliente').textContent = fmt(vp.ventaPorCliente);
  document.getElementById('objPrecioBulto').textContent = fmt(vp.precioPorBulto);
  document.getElementById('objBultosCliente').textContent = vp.bultosPorCliente.toFixed(1);

  var diasInput = document.getElementById('diasRepartoInput');
  if (!diasInput.value) diasInput.value = diasRepartoActual(datos);
  diasInput.oninput = function(){ guardarLocal('cat_ext_dias_reparto', diasInput.value); renderObjetivo(datos); renderDias(datos); renderZona(datos); };
  var diasRepartoSemana = Number(diasInput.value) || diasRepartoActual(datos);
  var diasRepartoMes = diasRepartoSemana * (30.44/7);

  var objInput = document.getElementById('objetivoInput');
  if (!objInput.value) objInput.value = leerLocal('cat_ext_objetivo','');
  objInput.oninput = function(){ guardarLocal('cat_ext_objetivo', objInput.value); renderObjetivo(datos); };
  var objetivoNum = Number(String(objInput.value).replace(/[^\d]/g,'')) || 0;

  var resBox = document.getElementById('objetivoResultado');
  if (!objetivoNum || !vp.hay) {
    resBox.innerHTML = '<div class="sub">Escribí un objetivo mensual para ver cuánto necesitás vender por día.</div>';
  } else {
    var netoDia = objetivoNum / diasRepartoMes;
    var ventaDia = vp.pctNeto>0 ? netoDia/vp.pctNeto : 0;
    var clientesDia = vp.ventaPorCliente>0 ? ventaDia/vp.ventaPorCliente : 0;
    var bultosDia = vp.precioPorBulto>0 ? ventaDia/vp.precioPorBulto : 0;
    resBox.innerHTML =
      '<div class="row"><span class="l">Ganancia neta / día (' + diasRepartoSemana + ' días/sem.)</span><span class="v verde">'+fmt(netoDia)+'</span></div>' +
      '<div class="row"><span class="l">Venta / día</span><span class="v">'+fmt(ventaDia)+'</span></div>' +
      '<div class="row"><span class="l">Clientes / día</span><span class="v">≈'+Math.round(clientesDia)+'</span></div>' +
      '<div class="row"><span class="l">Bultos / día</span><span class="v">≈'+Math.round(bultosDia)+'</span></div>';
  }

  var rvo = document.getElementById('realVsObjetivoCard');
  if (!objetivoNum || !vp.hay) { rvo.innerHTML = ''; }
  else {
    var netoMensualReal = (vp.totalNeto/vp.n)*30.44;
    var ventaMensualReal = (vp.totalVenta/vp.n)*30.44;
    var falta = objetivoNum - netoMensualReal;
    var fiadoPendiente = (ESTADO.clientes||[]).filter(function(c){return (c.saldo||0)<0;}).reduce(function(a,c){return a+Math.abs(c.saldo);},0);
    var promCobro = promedioDiasEntreCobros(ESTADO.ventas);
    rvo.innerHTML =
      '<div class="seccion-titulo" style="margin-bottom:10px">Dónde estás vs. tu objetivo (mensual)</div>' +
      '<div class="row"><span class="l">Ganancia neta</span><span class="v">'+fmt(netoMensualReal)+' → <span class="verde">'+fmt(objetivoNum)+'</span></span></div>' +
      '<div class="row"><span class="l">Venta</span><span class="v">'+fmt(ventaMensualReal)+' → '+fmt(ventaMensualReal*(objetivoNum/Math.max(netoMensualReal,1)))+'</span></div>' +
      (falta > 0 ? '<div class="faltan">Te faltan '+fmt(falta)+'/mes para llegar al objetivo</div>' : '<div class="ok-msg">¡Ya estás llegando a tu objetivo!</div>') +
      '<div class="nota">Fiado pendiente de cobro: '+fmt(fiadoPendiente)+' (ya cuenta como ganancia hecha, es solo referencia — no entra en la comparación de arriba)'+
      (promCobro ? ' · se cobra en promedio cada '+Math.round(promCobro)+' días' : '')+'</div>';
  }

  var simInput = document.getElementById('simBultosInput');
  if (!simInput.value) simInput.value = leerLocal('cat_ext_sim_bultos','');
  simInput.oninput = function(){ guardarLocal('cat_ext_sim_bultos', simInput.value); renderObjetivo(datos); };
  var simBox = document.getElementById('simResultado');
  var simBultos = Number(simInput.value) || 0;
  if (!simBultos || !vp.hay) { simBox.innerHTML = '<div class="sub">Escribí una cantidad de bultos para ver cuánto te daría de venta y ganancia.</div>'; }
  else {
    var ventaSim = simBultos * vp.precioPorBulto;
    var netoSim = ventaSim * vp.pctNeto;
    simBox.innerHTML =
      '<div class="row"><span class="l">Venta / día</span><span class="v">'+fmt(ventaSim)+'</span></div>' +
      '<div class="row"><span class="l">Ganancia neta / día</span><span class="v verde">'+fmt(netoSim)+'</span></div>' +
      '<div class="row"><span class="l">Venta / mes</span><span class="v">'+fmt(ventaSim*diasRepartoMes)+'</span></div>' +
      '<div class="row"><span class="l">Ganancia neta / mes</span><span class="v verde">'+fmt(netoSim*diasRepartoMes)+'</span></div>';
  }
}

function renderZona(datos) {
  var porDiaSemana = {};
  datos.forEach(function(d){ var ds=diaSemanaDeFecha(d.fechaKey); (porDiaSemana[ds]=porDiaSemana[ds]||[]).push(d); });
  var filas = DIAS.map(function(dia){
    var arr = porDiaSemana[dia] || [];
    var zona = (ESTADO.zonasReparto||{})[dia] || '';
    if (!zona || !arr.length) return null;
    var n = arr.length;
    var totalVendido = arr.reduce(function(a,d){return a+d.totalVendido;},0);
    var gananciaNeta = arr.reduce(function(a,d){return a+d.gananciaNeta;},0);
    var totalBultos = arr.reduce(function(a,d){return a+d.totalBultos;},0);
    var clientes = arr.reduce(function(a,d){return a+d.visitas;},0);
    return { dia:dia, zona:zona, n:n, totalVendido:totalVendido, gananciaNeta:gananciaNeta, totalBultos:totalBultos, clientes:clientes,
      pctNeto: totalVendido>0?Math.round(gananciaNeta/totalVendido*100):0,
      bultosPorCliente: clientes>0?totalBultos/clientes:0,
      ventaProm: totalVendido/n };
  }).filter(Boolean);

  var box = document.getElementById('zonaCards');
  if (!filas.length) { box.innerHTML = '<div class="sub">No hay zonas con ventas en esta ventana.</div>'; document.getElementById('zonaFalta').innerHTML=''; return; }
  var mejor = filas.reduce(function(a,f){return f.pctNeto>a.pctNeto?f:a;},filas[0]);
  var peor = filas.length>1 ? filas.reduce(function(a,f){return f.pctNeto<a.pctNeto?f:a;},filas[0]) : null;

  box.innerHTML = filas.map(function(f){
    var tag = f.dia===mejor.dia ? '<span class=badge-mejor>MEJOR</span>' : (peor && f.dia===peor.dia ? '<span class=badge-peor>MÁS COSTOSA</span>' : '');
    return '<div class="stat" style="text-align:left">' +
      '<div style="font-size:14px;font-weight:700">'+f.zona+tag+'</div>' +
      '<div class="sub" style="margin-bottom:8px">'+f.dia+'</div>' +
      '<div class="v" style="font-size:22px">'+f.pctNeto+'%</div>' +
      '<div class="l">neto · '+f.clientes+' clientes · '+f.bultosPorCliente.toFixed(1)+' bultos/cliente</div>' +
      '</div>';
  }).join('');

  var faltaBox = document.getElementById('zonaFalta');
  var mejorVentaProm = mejor.ventaProm;
  var vp = valoresPromedioGlobal(datos);
  var diasRepartoSemana = diasRepartoActual(datos);
  var gananciaNetaRealMes = filas.reduce(function(a,f){return a+f.gananciaNeta;},0);
  var diasRepartoMes = diasRepartoSemana * (30.44/7);
  var ventaProyectadaMes = mejorVentaProm * diasRepartoMes;
  var gananciaNetaProyectadaMes = ventaProyectadaMes * (mejor.pctNeto/100);
  var diferencia = gananciaNetaProyectadaMes - gananciaNetaRealMes;

  var html = '<div class="card"><div class="seccion-titulo" style="margin-bottom:10px">💡 Si emparejás tus '+diasRepartoSemana+' días con '+mejor.dia+'</div>';
  html += '<div class="row"><span class="l">Venta/jornada al nivel de '+mejor.dia+'</span><span class="v">'+fmt(mejorVentaProm)+'</span></div>';
  html += '<div class="row"><span class="l">Ganancia neta proyectada / mes (a '+mejor.pctNeto+'%)</span><span class="v verde">'+fmt(gananciaNetaProyectadaMes)+'</span></div>';
  html += diferencia > 0
    ? '<div class="faltan">Hoy tenés '+fmt(gananciaNetaRealMes)+' netos — emparejando ganarías '+fmt(diferencia)+' más por mes</div>'
    : '<div class="ok-msg">Ya estás a ese nivel</div>';
  html += '</div>';
  faltaBox.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════════
// Login
// ══════════════════════════════════════════════════════════════════
document.getElementById('loginBtn').addEventListener('click', function(){
  var email = document.getElementById('loginEmail').value.trim();
  var pass = document.getElementById('loginPass').value;
  var errBox = document.getElementById('loginError');
  errBox.textContent = '';
  if (!email || !pass) { errBox.textContent = 'Completá email y contraseña.'; return; }
  firebase.auth().signInWithEmailAndPassword(email, pass).catch(function(e){
    errBox.textContent = 'No se pudo entrar: ' + (e.message || e.code || e);
  });
});
document.getElementById('loginPass').addEventListener('keydown', function(e){ if (e.key==='Enter') document.getElementById('loginBtn').click(); });
document.getElementById('logoutBtn').addEventListener('click', function(){ firebase.auth().signOut(); });
document.getElementById('refrescarBtn').addEventListener('click', cargarTodo);

firebase.auth().onAuthStateChanged(function(u){
  if (u) cargarTodo();
  else {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    document.getElementById('login').style.display = 'block';
  }
});
