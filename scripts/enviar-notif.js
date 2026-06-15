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
function horaArg() {
  const ahora = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return ahora.getUTCHours();
}
function ahoraMinArg() {
  const a = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return a.getUTCHours() * 60 + a.getUTCMinutes();
}
function fechaArgHoy() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
// ── Enviar push ───────────────────────────────────────────────────────────────
async function enviar(sub, payload) {
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    console.log('✅ Notificación enviada:', payload.title);
  } catch (err) {
    console.error('❌ Error enviando push:', err.statusCode, err.message);
    if (err.statusCode === 410 || err.statusCode === 404) {
      await db.collection('lc2').doc('push_sub').delete();
      console.log('⚠ Suscripción expirada, borrada de Firestore. El usuario debe abrir la app una vez para renovarla.');
    }
  }
}
// ── Leer suscripción guardada ────────────────────────────────────────────────
async function getSub() {
  const doc = await db.collection('lc2').doc('push_sub').get();
  if (!doc.exists) { console.log('Sin suscripción push registrada.'); return null; }
  try { return JSON.parse(doc.data().sub); } catch { return null; }
}
// ── Recordatorios de la AGENDA (corre en cada ejecución) ─────────────────────
const VENTANA_MIN = 20;
async function checkRecordatorios(sub) {
  const hoy      = fechaArgHoy();
  const ahoraMin = ahoraMinArg();
  let clientes = null;
  try {
    const cfg = await db.collection('lc2').doc('config').get();
    if (!cfg.exists) return;
    const recordatorios = cfg.data().recordatorios || [];
    if (!recordatorios.length) { console.log('Sin recordatorios.'); return; }

    // log de enviados (para no repetir)
    const logSnap = await db.collection('lc2').doc('push_log').get();
    const log = logSnap.exists ? (logSnap.data().enviados || {}) : {};
    let cambioLog = false;

    for (const r of recordatorios) {
      if (r.confirmado) continue;
      if (r.fecha !== hoy) continue;
      if (!r.hora) continue;
      const [h, m] = r.hora.split(':').map(Number);
      const recMin = h * 60 + m;
      if (recMin > ahoraMin) continue;                 // todavía no es la hora
      if (ahoraMin - recMin > VENTANA_MIN) continue;   // ya pasó hace rato
      const clave = (r.id || (r.fecha + r.hora)) + '_' + r.fecha;
      if (log[clave]) continue;

      // nombre del cliente (solo si hace falta)
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

      await enviar(sub, {
        title: r.tipo === 'cobro' ? '💰 Recordatorio de cobro' : '🏠 Recordatorio de visita',
        body: cuerpo, tag: clave, requireInteraction: true,
      });
      log[clave] = Date.now();
      cambioLog = true;
    }
    if (cambioLog) await db.collection('lc2').doc('push_log').set({ enviados: log }, { merge: true });
  } catch (e) { console.error('Error leyendo recordatorios:', e.message); }
}
// ── Verificar transferencias pendientes ──────────────────────────────────────
async function checkTransferencias(sub) {
  const hoy = fechaArgHoy();
  let pendientes = 0;
  try {
    const meta = await db.collection('lc2').doc('ventas_meta').get();
    if (!meta.exists) return;
    const n = meta.data().n || 0;
    for (let i = 0; i < n; i++) {
      const doc = await db.collection('lc2').doc(`vt_${i}`).get();
      if (!doc.exists) continue;
      (doc.data().d || []).forEach(v => {
        if (v.fechaKey === hoy && v.pago === 'transferencia' && !v.transConfirmada) pendientes++;
      });
    }
  } catch (e) { console.error('Error leyendo ventas:', e.message); return; }
  if (pendientes > 0) {
    await enviar(sub, {
      title: '💳 Transferencias sin confirmar',
      body: `Tenés ${pendientes} transferencia${pendientes > 1 ? 's' : ''} pendiente${pendientes > 1 ? 's' : ''} de hoy.`,
      tag: 'trans-pendientes',
      requireInteraction: true,
    });
  } else {
    console.log('Sin transferencias pendientes.');
  }
}
// ── Verificar mantenimiento de vehículo ─────────────────────────────────────
async function checkMantenimiento(sub) {
  try {
    const doc = await db.collection('lc2').doc('config').get();
    if (!doc.exists) return;
    const mantVeh = doc.data().mantVeh || [];
    const hoy = new Date(fechaArgHoy() + 'T12:00:00');
    for (const m of mantVeh) {
      if (!m.proximaFechaISO) continue;
      const prox = new Date(m.proximaFechaISO + 'T12:00:00');
      const dias = Math.round((prox - hoy) / (1000 * 60 * 60 * 24));
      if (dias === 3 || dias === 2 || dias === 1 || dias === 0) {
        const labels = {
          aceite: 'Cambio de aceite', preventivo: 'Mantenimiento preventivo',
          embrague: 'Cambio de embrague', reparacion: 'Reparación', otro: 'Mantenimiento',
        };
        const tipo = labels[m.tipo] || m.tipo || 'Mantenimiento';
        const cuando = dias === 0 ? 'HOY' : `en ${dias} día${dias > 1 ? 's' : ''}`;
        await enviar(sub, {
          title: '🔧 Vencimiento de mantenimiento',
          body: `${tipo} vence ${cuando}${m.descripcion ? ' — ' + m.descripcion : ''}.`,
          tag: `mant-${m.proximaFechaISO}`,
          requireInteraction: false,
        });
      }
    }
  } catch (e) { console.error('Error leyendo mantenimiento:', e.message); }
}
// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const hora = horaArg();
  console.log(`Hora Argentina: ${hora}:00`);
  const sub = await getSub();
  if (!sub) return;

  // Recordatorios de la agenda — SIEMPRE (en cada corrida)
  await checkRecordatorios(sub);

  if (hora === 7)  await checkMantenimiento(sub);
  if (hora === 13) await checkTransferencias(sub);
  if (hora === 18) await enviar(sub, {
    title: '🚚 La Catalina — 18:00 hs',
    body: '¿Ya revisaste todas las entregas del día?',
    tag: 'cierre-18', requireInteraction: false,
  });
  if (hora === 19) await checkTransferencias(sub);
  if (hora === 20) await enviar(sub, {
    title: '⏰ Son las 20:00 hs — La Catalina',
    body: 'Hora de cerrar la planilla. Los pendientes quedarán como no visitados.',
    tag: 'cierre-20', requireInteraction: true,
  });
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
