/* ─────────────────────────────────────────────────────────────────────────
   La Catalina · DIAGNÓSTICO DE SINCRONIZACIÓN  (v2 — claves corregidas)
   SOLO LECTURA — no escribe, no borra, no sincroniza nada.

   F12 → pestaña Console → pegar todo → Enter.
   ───────────────────────────────────────────────────────────────────────── */
(async function diagnosticoSyncLC2() {
  const L = (...a) => console.log(...a);
  const linea = () => L("─".repeat(58));
  const leer = (k, def) => {
    try {
      return JSON.parse(localStorage.getItem(k) || def);
    } catch {
      return JSON.parse(def);
    }
  };

  L("%c LA CATALINA · DIAGNÓSTICO DE SYNC v2 ", "background:#185FA5;color:#fff;font-weight:bold;padding:2px 6px");
  L("Fecha:", new Date().toLocaleString("es-AR"));

  // ── 1. SESIÓN ────────────────────────────────────────────────────────────
  linea();
  L("1) SESIÓN");
  let u = null;
  try {
    u = firebase.auth().currentUser;
  } catch (e) {
    L("   ✗ Auth no disponible:", e.message);
  }
  if (!u) L("   ✗ SIN SESIÓN → no sube ni baja nada.");
  else if (u.isAnonymous) L("   ✗ Sesión ANÓNIMA → cloudSave/cloudLoad la rechazan.");
  else {
    L("   ✓ Sesión OK · email:", u.email);
    L("     uid:", u.uid);
  }
  try {
    L("   projectId:", firebase.app().options.projectId);
  } catch (e) {}

  // ── 2. INVENTARIO REAL DE CLAVES LOCALES ─────────────────────────────────
  linea();
  L("2) CLAVES 'cat_' EN ESTE DISPOSITIVO (inventario real, sin suponer nombres)");
  const claves = Object.keys(localStorage).filter(k => k.startsWith("cat_")).sort();
  claves.forEach(k => {
    const raw = localStorage.getItem(k) || "";
    let n = "";
    try {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) n = `${v.length} items`;
      else if (v && typeof v === "object") n = `${Object.keys(v).length} claves`;
      else n = String(v).slice(0, 30);
    } catch {
      n = "(no es JSON)";
    }
    L(`   ${k.padEnd(34)} ${String(raw.length).padStart(8)} bytes  ${n}`);
  });

  // detección automática de la clave vigente de cada entidad
  const detectar = base => {
    const cands = claves.filter(k => k.startsWith(`cat_${base}_v`) && !k.includes("tombstone"));
    let mejor = null, mejorN = -1;
    cands.forEach(k => {
      const v = leer(k, "[]");
      const n = Array.isArray(v) ? v.length : (v && typeof v === "object" ? Object.keys(v).length : 0);
      if (n > mejorN) { mejorN = n; mejor = k; }
    });
    return { clave: mejor, n: mejorN, candidatas: cands };
  };
  const dv = detectar("ventas"), dc = detectar("clientes"), dp = detectar("planillas");

  linea();
  L("3) DATOS LOCALES (usando la clave detectada)");
  L("   ventas   :", dv.n, "→", dv.clave, dv.candidatas.length > 1 ? `(otras: ${dv.candidatas.join(", ")})` : "");
  L("   clientes :", dc.n, "→", dc.clave);
  L("   planillas:", dp.n, "→", dp.clave);

  const ventasL = dv.clave ? leer(dv.clave, "[]") : [];
  const porFechaL = {};
  ventasL.forEach(v => { if (v.fechaKey) porFechaL[v.fechaKey] = (porFechaL[v.fechaKey] || 0) + 1; });
  const fL = Object.keys(porFechaL).sort();
  L("   rango de fechas local:", fL.length ? `${fL[0]} → ${fL[fL.length - 1]}` : "(sin ventas)");
  L("   ventas por fecha (últimas 7):", fL.slice(-7).map(f => `${f}: ${porFechaL[f]}`).join(" | ") || "(ninguna)");

  // ── 4. TOMBSTONES ────────────────────────────────────────────────────────
  linea();
  L("4) TOMBSTONES (marcas de borrado)");
  ["ventas", "clientes", "novisitas", "productos", "recordatorios"].forEach(e => {
    const t = leer(`cat_${e}_tombstone_v1`, "[]");
    const ts = t.map(x => x.ts).filter(Boolean).sort();
    L(`   ${e.padEnd(14)} ${String(t.length).padStart(5)}`, ts.length ? `· último: ${new Date(ts[ts.length - 1]).toLocaleString("es-AR")}` : "");
  });

  // ── 5. FIRESTORE ─────────────────────────────────────────────────────────
  linea();
  L("5) FIRESTORE");
  if (!window.db) return L("   ✗ window.db no existe.");
  if (!u || u.isAnonymous) return L("   ✗ Sin sesión válida: no se puede leer.");
  try {
    const [sv, sc, sp, pulse] = await Promise.all([
      window.db.collection("ventas").get(),
      window.db.collection("clientes").get(),
      window.db.collection("planillas").get(),
      window.db.collection("meta").doc("pulse").get()
    ]);
    const ventasN = [];
    sv.forEach(d => ventasN.push(d.data()));
    L("   ventas   :", sv.size);
    L("   clientes :", sc.size);
    L("   planillas:", sp.size);
    L("   último pulso:", pulse.exists ? new Date(pulse.data()._upd).toLocaleString("es-AR") : "(no existe)");

    // ── 6. COMPARACIÓN ─────────────────────────────────────────────────────
    linea();
    L("6) COMPARACIÓN LOCAL vs NUBE (ventas)");
    const idsL = new Set(ventasL.map(v => String(v.id)));
    const idsN = new Set(ventasN.map(v => String(v.id)));
    const soloLocal = [...idsL].filter(i => !idsN.has(i));
    const soloNube = [...idsN].filter(i => !idsL.has(i));
    L("   en ambos                        :", [...idsL].filter(i => idsN.has(i)).length);
    L("   SOLO en este dispositivo        :", soloLocal.length, "(no subieron)");
    L("   SOLO en la nube                 :", soloNube.length, "(no bajaron acá)");

    const tomb = leer("cat_ventas_tombstone_v1", "[]");
    const tombIds = new Set(tomb.map(t => String(t.id)));
    if (soloNube.length) {
      L("     → bloqueadas por tombstone local:", soloNube.filter(i => tombIds.has(i)).length);
      L("     → muestra de las que faltan acá:");
      ventasN.filter(v => !idsL.has(String(v.id))).slice(0, 8)
        .forEach(v => L(`        ${v.fechaKey} · ${v.cliente || v.clienteId} · id ${v.id} · _upd ${v._upd ? new Date(v._upd).toLocaleString("es-AR") : "(sin _upd)"}`));
    }
    if (soloLocal.length) {
      L("     → muestra de las que no subieron:");
      ventasL.filter(v => !idsN.has(String(v.id))).slice(0, 8)
        .forEach(v => L(`        ${v.fechaKey} · ${v.cliente || v.clienteId} · id ${v.id} · _upd ${v._upd ? new Date(v._upd).toLocaleString("es-AR") : "(sin _upd)"}`));
    }

    // diferencias de contenido en las que están en los dos lados
    const mapN = {};
    ventasN.forEach(v => mapN[String(v.id)] = v);
    let distintas = 0, localMasNueva = 0, nubeMasNueva = 0;
    ventasL.forEach(v => {
      const n = mapN[String(v.id)];
      if (!n) return;
      if (JSON.stringify(v) !== JSON.stringify(n)) {
        distintas++;
        const uL = Number(v._upd) || 0, uN = Number(n._upd) || 0;
        if (uL > uN) localMasNueva++; else if (uN > uL) nubeMasNueva++;
      }
    });
    L("   presentes en ambos pero DISTINTAS:", distintas, `(local más nueva: ${localMasNueva} · nube más nueva: ${nubeMasNueva})`);

    linea();
    if (soloNube.length === 0 && soloLocal.length === 0 && distintas === 0)
      L("%c CONCLUSIÓN: ventas idénticas en local y nube. El problema NO está en las ventas.", "color:#4dd9a0;font-weight:bold");
    else if (soloNube.length > 0 && soloLocal.length === 0)
      L("%c CONCLUSIÓN: la nube tiene ventas que este dispositivo no bajó.", "color:#f5b942;font-weight:bold");
    else if (soloLocal.length > 0 && soloNube.length === 0)
      L("%c CONCLUSIÓN: este dispositivo tiene ventas que no subieron.", "color:#f5b942;font-weight:bold");
    else
      L("%c CONCLUSIÓN: hay diferencias en los dos sentidos.", "color:#f07070;font-weight:bold");
  } catch (e) {
    L("   ✗ Error leyendo Firestore:", e.code || "", e.message);
    L("     (si dice 'permission-denied' → el problema son las reglas de Firestore)");
  }

  linea();
  L("Fin. Copiá todo y pasámelo.");
})();
