// ── La Catalina · Enviador de notificaciones push ────────────────────────────
// Corre desde GitHub Actions según el horario. Lee la suscripción de Firestore
// y envía el push correspondiente al horario actual (hora Argentina UTC-3).
//
// 2026-10-11: reescrito de punta a punta. Desde que la app migró del esquema
// viejo chunked (lc2/config, cl_*, vt_*) al nuevo (una colección por entidad:
// clientes, ventas, recordatorios, planillas, mantVeh, config/app) y el
// registro de notificaciones pasó de Web Push crudo (biblioteca `web-push`,
// suscripción con endpoint+keys) a Firebase Cloud Messaging (token, vía
// `messaging.getToken`), este script seguía leyendo las ubicaciones y el
// formato VIEJOS — por eso nunca encontraba suscripciones ni datos, y nunca
// mandó un solo aviso real (agenda, cierre, transferencias, mantenimiento).
const admin = require('firebase-admin');
// ── Inicializar Firebase Admin ────────────────────────────────────────────────
const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SA, 'base64').toString('utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const messaging = admin.messaging();
// ── Hora Argentina (UTC-3) ────────────────────────────────────────────────────
function fechaHoraArg() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000);
}
function horaArg() { return fechaHoraArg().getUTCHours(); }
function ahoraMinArg() {
  const a = fechaHoraArg();
  return a.getUTCHours() * 60 + a.getUTCMinutes();
}
function fechaArgHoy() {
  return fechaHoraArg().toISOString().slice(0, 10);
}
const NOMBRES_DIA = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
function diaSemanaArg() {
  return NOMBRES_DIA[fechaHoraArg().getUTCDay()];
}
// Días con reparto real (Lunes queda afuera: la app lo tiene con carga 0 en CARGA_DIA_DEFAULT)
const DIAS_REPARTO = ['Martes', 'Miércoles', 'Jueves', 'Viernes'];
const VENTANA_MIN = 15; // con cron cada 5 min, alcanza y no llega tan tarde
// ── Leer TODAS las suscripciones guardadas (una por dispositivo) ────────────
// La app guarda el token FCM en push_subs/{deviceId} (colección top-level),
// no en un doc único lc2/push_subs como antes.
async function getSubs() {
  const snap = await db.collection('push_subs').get();
  if (snap.empty) { console.log('Sin suscripciones push registradas.'); return {}; }
  const subs = {};
  snap.forEach(d => { subs[d.id] = d.data(); });
  return subs;
}
// ── Enviar un mismo aviso a todos los dispositivos suscriptos ───────────────
// El service worker (sw.js) maneja el evento 'push' a mano (no usa el SW de
// mensajería default de Firebase) y espera el payload PLANO en e.data.json():
// {title, body, tag, requireInteraction, icon}. Para que llegue así, hay que
// mandar un mensaje de datos puro (campo `data`, NO `notification`) — con
// `notification` Firebase lo mostraría por su cuenta con otro formato y
// nuestro handler ni se entera. Los valores de `data` tienen que ser todos
// string: es un requisito de FCM, no un capricho.
async function enviarATodos(subsMap, payload) {
  const entries = Object.entries(subsMap || {});
  if (!entries.length) return;
  const data = {
    title: String(payload.title || ''),
    body: String(payload.body || ''),
    tag: String(payload.tag || 'reparto'),
    requireInteraction: String(payload.requireInteraction !== false),
  };
  for (const [deviceId, info] of entries) {
    const token = info && info.token;
    if (!token) continue;
    try {
      await messaging.send({ token, data });
      console.log(`✅ Notificación enviada (${deviceId}):`, payload.title);
    } catch (err) {
      console.error(`❌ Error enviando push (${deviceId}):`, err.code, err.message);
      const tokenMuerto = err.code === 'messaging/registration-token-not-registered'
        || err.code === 'messaging/invalid-registration-token';
      if (tokenMuerto) {
        await db.collection('push_subs').doc(deviceId).delete();
        console.log(`⚠ Suscripción de ${deviceId} expirada, borrada. Ese dispositivo debe abrir la app una vez para renovarla.`);
      }
    }
  }
}
// ── Log de enviados (evita repetir el mismo aviso si el cron corre varias veces por hora) ─
// Vive en meta/push_log (junto con meta/pulse, meta/migracion) — ya no bajo
// lc2, que es el esquema viejo y no participa de la sincronización actual.
async function getLog() {
  const snap = await db.collection('meta').doc('push_log').get();
  return snap.exists ? (snap.data().enviados || {}) : {};
}
async function guardarLog(log) {
  await db.collection('meta').doc('push_log').set({ enviados: log }, { merge: true });
}
// ── Recordatorios de la AGENDA (corre en cada ejecución) ─────────────────────
// Cada recordatorio vive en su propio doc dentro de la colección
// `recordatorios` (antes era un array adentro de lc2/config). Ya trae
// clienteNombre guardado desde que se creó, así que no hace falta ir a
// buscar el cliente aparte.
async function checkRecordatorios(subs, log) {
  const snap = await db.collection('recordatorios').get();
  if (snap.empty) return false;
  const hoy      = fechaArgHoy();
  const ahoraMin = ahoraMinArg();
  let cambio = false;
  for (const doc of snap.docs) {
    const r = doc.data();
    if (r.confirmado) continue;
    if (r.fecha !== hoy) continue;
    if (!r.hora) continue;
    const [h, m] = r.hora.split(':').map(Number);
    const recMin = h * 60 + m;
    if (recMin > ahoraMin) continue;
    if (ahoraMin - recMin > VENTANA_MIN) continue;
    const clave = 'agenda_' + (r.id || (r.fecha + r.hora)) + '_' + r.fecha;
    if (log[clave]) continue;

    const cuerpo = (r.clienteNombre ? r.clienteNombre + ' — ' : '') + (r.motivo || 'Tenés un recordatorio');

    await enviarATodos(subs, {
      title: r.tipo === 'cobro' ? '💰 Recordatorio de cobro' : '🏠 Recordatorio de visita',
      body: cuerpo, tag: clave, requireInteraction: true,
    });
    log[clave] = Date.now();
    cambio = true;
  }
  return cambio;
}
// ── Cierre del día (hora configurable desde la app + cierre definitivo 20:00) ─
// `planillas/{dia_fecha}` es el doc real ahora (antes: cfg.planillas[clave]
// dentro de lc2/config). Se usa `_diaCerrado`, la marca que la propia app usa
// como fuente de verdad para "¿está cerrado?" (más confiable que mirar si
// efectivo/fiado quedaron vacíos).
async function checkCierre(subs, cfg, log) {
  const dia = diaSemanaArg();
  if (!DIAS_REPARTO.includes(dia)) return false; // Lunes/sábado/domingo: no hay reparto

  const hoy = fechaArgHoy();
  const ahoraMin = ahoraMinArg();
  const planKey = `${dia}_${hoy}`;
  const planDoc = await db.collection('planillas').doc(planKey).get();
  const plan = planDoc.exists ? planDoc.data() : null;
  if (plan && plan._diaCerrado) return false; // ya cerrado, nada que avisar

  let cambio = false;
  const horaAviso = cfg.horaAvisoCierre || '18:00';
  const [hA, mA] = horaAviso.split(':').map(Number);
  const minAviso = (hA || 0) * 60 + (mA || 0);
  if (ahoraMin >= minAviso && ahoraMin - minAviso <= VENTANA_MIN) {
    const clave = 'cierre-aviso_' + hoy;
    if (!log[clave]) {
      await enviarATodos(subs, {
        title: '📋 Cierre del día pendiente',
        body: `Son las ${horaAviso}. Todavía no cerraste la planilla de ${dia}.`,
        tag: clave, requireInteraction: false,
      });
      log[clave] = Date.now(); cambio = true;
    }
  }
  const minCierre = 20 * 60;
  if (ahoraMin >= minCierre && ahoraMin - minCierre <= VENTANA_MIN) {
    const clave = 'cierre-final_' + hoy;
    if (!log[clave]) {
      await enviarATodos(subs, {
        title: '⏰ Son las 20:00 hs — La Catalina',
        body: 'Hora de cerrar la planilla. Los pendientes quedarán como no visitados.',
        tag: clave, requireInteraction: true,
      });
      log[clave] = Date.now(); cambio = true;
    }
  }
  return cambio;
}
// ── Transferencias pendientes (13:00 y 19:00, u horas configuradas) ──────────
// `ventas` es ahora una colección con un doc por venta (antes: chunks vt_i
// bajo ventas_meta).
async function checkTransferencias(subs, cfg, log) {
  const ahoraMin = ahoraMinArg();
  const horas = (cfg.horasAvisoTrans && cfg.horasAvisoTrans.length===2) ? cfg.horasAvisoTrans : ['13:00','19:00'];
  const objetivos = horas.map((h,i)=>{
    const [hh,mm] = h.split(':').map(Number);
    return { h: (hh||0)*60+(mm||0), clave: 't'+i };
  });
  const hoy = fechaArgHoy();
  const objetivo = objetivos.find(o => ahoraMin >= o.h && ahoraMin - o.h <= VENTANA_MIN);
  if (!objetivo) return false;
  const clave = 'trans-' + objetivo.clave + '_' + hoy;
  if (log[clave]) return false;

  let pendientes = 0;
  try {
    const snap = await db.collection('ventas').where('fechaKey', '==', hoy).get();
    snap.forEach(doc => {
      const v = doc.data();
      if ((v.pago === 'transferencia' || (v.pago === 'mixto' && Number(v.montoTrans) > 0)) && !v.transConfirmada) pendientes++;
    });
  } catch (e) { console.error('Error leyendo ventas:', e.message); return false; }

  if (pendientes === 0) { console.log('Sin transferencias pendientes.'); return false; }
  await enviarATodos(subs, {
    title: '💳 Transferencias sin confirmar',
    body: `Tenés ${pendientes} transferencia${pendientes > 1 ? 's' : ''} pendiente${pendientes > 1 ? 's' : ''} de hoy.`,
    tag: clave, requireInteraction: true,
  });
  log[clave] = Date.now();
  return true;
}
// ── Vencimiento de mantenimiento del vehículo (una vez por día, a la mañana) ─
// `mantVeh` es su propia colección ahora (antes: array dentro de lc2/config).
async function checkMantenimiento(subs, cfg, log) {
  if (horaArg() !== 7) return false;
  const snap = await db.collection('mantVeh').get();
  if (snap.empty) return false;
  const diasAviso = (cfg.diasAvisoMant && cfg.diasAvisoMant.length) ? cfg.diasAvisoMant : [3,2,1,0];
  const hoy = new Date(fechaArgHoy() + 'T12:00:00');
  const labels = {
    aceite: 'Cambio de aceite', preventivo: 'Mantenimiento preventivo',
    embrague: 'Cambio de embrague', reparacion: 'Reparación', otro: 'Mantenimiento',
  };
  let cambio = false;
  for (const doc of snap.docs) {
    const m = doc.data();
    if (!m.proximaFechaISO) continue;
    const prox = new Date(m.proximaFechaISO + 'T12:00:00');
    const dias = Math.round((prox - hoy) / (1000 * 60 * 60 * 24));
    if (!diasAviso.includes(dias)) continue;
    const clave = 'mant-' + m.proximaFechaISO + '_' + m.tipo + '_' + fechaArgHoy();
    if (log[clave]) continue;
    const tipo = labels[m.tipo] || m.tipo || 'Mantenimiento';
    const cuando = dias === 0 ? 'HOY' : `en ${dias} día${dias > 1 ? 's' : ''}`;
    await enviarATodos(subs, {
      title: '🔧 Vencimiento de mantenimiento',
      body: `${tipo} vence ${cuando}${m.descripcion ? ' — ' + m.descripcion : ''}.`,
      tag: clave, requireInteraction: false,
    });
    log[clave] = Date.now(); cambio = true;
  }
  return cambio;
}
// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Hora Argentina: ${horaArg()}:00 — ${diaSemanaArg()}`);
  const subs = await getSubs();
  if (!Object.keys(subs).length) return;

  const cfgSnap = await db.collection('config').doc('app').get();
  const cfg = cfgSnap.exists ? cfgSnap.data() : {};
  const log = await getLog();
  let cambioLog = false;

  cambioLog = (await checkRecordatorios(subs, log))         || cambioLog;
  cambioLog = (await checkCierre(subs, cfg, log))            || cambioLog;
  cambioLog = (await checkTransferencias(subs, cfg, log))    || cambioLog;
  cambioLog = (await checkMantenimiento(subs, cfg, log))     || cambioLog;

  if (cambioLog) await guardarLog(log);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
