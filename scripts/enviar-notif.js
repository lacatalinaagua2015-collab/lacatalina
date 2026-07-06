// ── La Catalina · Enviador de notificaciones push ────────────────────────────
// Corre desde GitHub Actions según el horario. Lee la suscripción de Firestore
// y envía el push correspondiente al horario actual (hora Argentina UTC-3).
const webpush  = require('web-push');
const admin    = require('firebase-admin');
// ── Inicializar Firebase Admin ────────────────────────────────────────────────
const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SA, 'base64').toString('utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
// ── Configurar VAPID ─────────────────────────────────────────────────────────
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
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
async function getSubs() {
  const doc = await db.collection('lc2').doc('push_subs').get();
  if (!doc.exists) { console.log('Sin suscripciones push registradas.'); return {}; }
  return doc.data() || {};
}
// ── Enviar un mismo aviso a todos los dispositivos suscriptos ───────────────
async function enviarATodos(subsMap, payload) {
  const entries = Object.entries(subsMap || {});
  if (!entries.length) return;
  for (const [deviceId, info] of entries) {
    let sub;
    try { sub = JSON.parse(info.sub); } catch { continue; }
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      console.log(`✅ Notificación enviada (${deviceId}):`, payload.title);
    } catch (err) {
      console.error(`❌ Error enviando push (${deviceId}):`, err.statusCode, err.message);
      if (err.statusCode === 410 || err.statusCode === 404) {
        await db.collection('lc2').doc('push_subs').update({ [deviceId]: admin.firestore.FieldValue.delete() });
        console.log(`⚠ Suscripción de ${deviceId} expirada, borrada. Ese dispositivo debe abrir la app una vez para renovarla.`);
      }
    }
  }
}
// ── Log de enviados (evita repetir el mismo aviso si el cron corre varias veces por hora) ─
async function getLog() {
  const snap = await db.collection('lc2').doc('push_log').get();
  return snap.exists ? (snap.data().enviados || {}) : {};
}
async function guardarLog(log) {
  await db.collection('lc2').doc('push_log').set({ enviados: log }, { merge: true });
}
// ── Recordatorios de la AGENDA (corre en cada ejecución) ─────────────────────
async function checkRecordatorios(subs, cfg, log) {
  const hoy      = fechaArgHoy();
  const ahoraMin = ahoraMinArg();
  const recordatorios = cfg.recordatorios || [];
  if (!recordatorios.length) return false;
  let clientes = null;
  let cambio = false;
  for (const r of recordatorios) {
    if (r.confirmado) continue;
    if (r.fecha !== hoy) continue;
    if (!r.hora) continue;
    const [h, m] = r.hora.split(':').map(Number);
    const recMin = h * 60 + m;
    if (recMin > ahoraMin) continue;
    if (ahoraMin - recMin > VENTANA_MIN) continue;
    const clave = 'agenda_' + (r.id || (r.fecha + r.hora)) + '_' + r.fecha;
    if (log[clave]) continue;

    if (clientes === null) {
      clientes = [];
      try {
        const meta = await db.collection('lc2').doc('clientes_meta').get();
        const nc = meta.exists ? (meta.data().n || 0) : 0;
        for (let i = 0; i < nc; i++) {
          const d = await db.collection('lc2').doc('cl_' + i).get();
          if (d.exists) clientes = clientes.concat(d.data().d || []);
        }
      } catch (e) {}
    }
    const cli = clientes.find(c => c.id === r.clienteId);
    const nombre = (cli && cli.nombre) || r.clienteNombre || '';
    const cuerpo = (nombre ? nombre + ' — ' : '') + (r.motivo || 'Tenés un recordatorio');

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
async function checkCierre(subs, cfg, log) {
  const dia = diaSemanaArg();
  if (!DIAS_REPARTO.includes(dia)) return false; // Lunes/sábado/domingo: no hay reparto

  const hoy = fechaArgHoy();
  const ahoraMin = ahoraMinArg();
  const planKey = `${dia}_${hoy}`;
  const plan = (cfg.planillas || {})[planKey];
  const sinCerrar = !plan || ((!plan.efectivo || plan.efectivo === '') && (!plan.fiado || plan.fiado === ''));
  if (!sinCerrar) return false;

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
// ── Transferencias pendientes (13:00 y 19:00) ────────────────────────────────
async function checkTransferencias(subs, log) {
  const ahoraMin = ahoraMinArg();
  const objetivos = [{ h: 13 * 60, clave: 't13' }, { h: 19 * 60, clave: 't19' }];
  const hoy = fechaArgHoy();
  const objetivo = objetivos.find(o => ahoraMin >= o.h && ahoraMin - o.h <= VENTANA_MIN);
  if (!objetivo) return false;
  const clave = 'trans-' + objetivo.clave + '_' + hoy;
  if (log[clave]) return false;

  let pendientes = 0;
  try {
    const meta = await db.collection('lc2').doc('ventas_meta').get();
    if (!meta.exists) return false;
    const n = meta.data().n || 0;
    for (let i = 0; i < n; i++) {
      const doc = await db.collection('lc2').doc(`vt_${i}`).get();
      if (!doc.exists) continue;
      (doc.data().d || []).forEach(v => {
        if (v.fechaKey === hoy && (v.pago === 'transferencia' || (v.pago === 'mixto' && Number(v.montoTrans) > 0)) && !v.transConfirmada) pendientes++;
      });
    }
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
async function checkMantenimiento(subs, cfg, log) {
  if (horaArg() !== 7) return false;
  const mantVeh = cfg.mantVeh || [];
  if (!mantVeh.length) return false;
  const hoy = new Date(fechaArgHoy() + 'T12:00:00');
  const labels = {
    aceite: 'Cambio de aceite', preventivo: 'Mantenimiento preventivo',
    embrague: 'Cambio de embrague', reparacion: 'Reparación', otro: 'Mantenimiento',
  };
  let cambio = false;
  for (const m of mantVeh) {
    if (!m.proximaFechaISO) continue;
    const prox = new Date(m.proximaFechaISO + 'T12:00:00');
    const dias = Math.round((prox - hoy) / (1000 * 60 * 60 * 24));
    if (dias !== 3 && dias !== 2 && dias !== 1 && dias !== 0) continue;
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

  const cfgSnap = await db.collection('lc2').doc('config').get();
  const cfg = cfgSnap.exists ? cfgSnap.data() : {};
  const log = await getLog();
  let cambioLog = false;

  cambioLog = (await checkRecordatorios(subs, cfg, log)) || cambioLog;
  cambioLog = (await checkCierre(subs, cfg, log))        || cambioLog;
  cambioLog = (await checkTransferencias(subs, log))     || cambioLog;
  cambioLog = (await checkMantenimiento(subs, cfg, log)) || cambioLog;

  if (cambioLog) await guardarLog(log);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
