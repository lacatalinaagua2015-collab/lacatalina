// ════════════════════════════════════════════════════════════════════
// ◆  01-temas.js — Paletas de temas
// ════════════════════════════════════════════════════════════════════

// ── PALETAS DE TEMAS ─────────────────────────────────────────────────────────
const TEMAS_LC = {
  "oscuro-azul":    { nombre:"Océano Oscuro",   modo:"oscuro", emoji:"🌊", vars:{"--color-background-primary":"#0f1923","--color-background-secondary":"#1a2b3c","--color-background-tertiary":"#253647","--color-background-info":"#1e3a5f","--color-background-success":"#0a2e1f","--color-background-warning":"#2e1f06","--color-background-danger":"#2e0a0a","--color-text-primary":"#e2eaf4","--color-text-secondary":"#7a9ab8","--color-text-tertiary":"#4a6a85","--color-text-info":"#5daaff","--color-text-success":"#4dd9a0","--color-text-warning":"#f5b942","--color-text-danger":"#f07070","--color-border-tertiary":"rgba(255,255,255,0.07)","--color-border-secondary":"rgba(255,255,255,0.13)","--color-border-primary":"rgba(255,255,255,0.22)","--color-accent":"#185FA5","body-bg":"#080f17"} },
  "oscuro-verde":   { nombre:"Bosque Oscuro",   modo:"oscuro", emoji:"🌿", vars:{"--color-background-primary":"#0d1f17","--color-background-secondary":"#162e22","--color-background-tertiary":"#1e3d2d","--color-background-info":"#1a3d2f","--color-background-success":"#0a2e1f","--color-background-warning":"#2e2006","--color-background-danger":"#2e0a0a","--color-text-primary":"#e0f0e8","--color-text-secondary":"#7ab898","--color-text-tertiary":"#4a8565","--color-text-info":"#5dff9a","--color-text-success":"#4dd9a0","--color-text-warning":"#f5b942","--color-text-danger":"#f07070","--color-border-tertiary":"rgba(255,255,255,0.07)","--color-border-secondary":"rgba(255,255,255,0.13)","--color-border-primary":"rgba(255,255,255,0.22)","--color-accent":"#1a8a4a","body-bg":"#060f0a"} },
  "oscuro-violeta": { nombre:"Noche Violeta",   modo:"oscuro", emoji:"🔮", vars:{"--color-background-primary":"#13101f","--color-background-secondary":"#1e1833","--color-background-tertiary":"#2a2045","--color-background-info":"#251a5f","--color-background-success":"#0a2e1f","--color-background-warning":"#2e1f06","--color-background-danger":"#2e0a0a","--color-text-primary":"#ede8f4","--color-text-secondary":"#9a88c8","--color-text-tertiary":"#6a5a95","--color-text-info":"#b87dff","--color-text-success":"#4dd9a0","--color-text-warning":"#f5b942","--color-text-danger":"#f07070","--color-border-tertiary":"rgba(255,255,255,0.07)","--color-border-secondary":"rgba(255,255,255,0.13)","--color-border-primary":"rgba(255,255,255,0.22)","--color-accent":"#7b3fc9","body-bg":"#080610"} },
  "oscuro-rojo":    { nombre:"Carbón Rojo",     modo:"oscuro", emoji:"🔥", vars:{"--color-background-primary":"#1a1010","--color-background-secondary":"#2a1818","--color-background-tertiary":"#3a2020","--color-background-info":"#3a1a1a","--color-background-success":"#0a2e1f","--color-background-warning":"#2e1f06","--color-background-danger":"#3a0a0a","--color-text-primary":"#f4e8e8","--color-text-secondary":"#c88888","--color-text-tertiary":"#956a6a","--color-text-info":"#ff8d8d","--color-text-success":"#4dd9a0","--color-text-warning":"#f5b942","--color-text-danger":"#f07070","--color-border-tertiary":"rgba(255,255,255,0.07)","--color-border-secondary":"rgba(255,255,255,0.13)","--color-border-primary":"rgba(255,255,255,0.22)","--color-accent":"#c93030","body-bg":"#0f0606"} },
  "oscuro-gris":    { nombre:"Pizarra Oscura",  modo:"oscuro", emoji:"⚫", vars:{"--color-background-primary":"#141416","--color-background-secondary":"#1e2024","--color-background-tertiary":"#28292e","--color-background-info":"#1a2235","--color-background-success":"#0a2e1f","--color-background-warning":"#2e2006","--color-background-danger":"#2e0a0a","--color-text-primary":"#e8e8ea","--color-text-secondary":"#8888a0","--color-text-tertiary":"#555565","--color-text-info":"#7aaaff","--color-text-success":"#4dd9a0","--color-text-warning":"#f5b942","--color-text-danger":"#f07070","--color-border-tertiary":"rgba(255,255,255,0.07)","--color-border-secondary":"rgba(255,255,255,0.13)","--color-border-primary":"rgba(255,255,255,0.22)","--color-accent":"#4466cc","body-bg":"#0a0a0c"} },
  "claro-azul":     { nombre:"Cielo Claro",     modo:"claro",  emoji:"☀️", vars:{"--color-background-primary":"#f0f4f8","--color-background-secondary":"#ffffff","--color-background-tertiary":"#e4ecf4","--color-background-info":"#dbeafe","--color-background-success":"#d1fae5","--color-background-warning":"#fef3c7","--color-background-danger":"#fee2e2","--color-text-primary":"#1a2b3c","--color-text-secondary":"#4a6a85","--color-text-tertiary":"#7a9ab8","--color-text-info":"#1d4ed8","--color-text-success":"#065f46","--color-text-warning":"#92400e","--color-text-danger":"#991b1b","--color-border-tertiary":"rgba(0,0,0,0.07)","--color-border-secondary":"rgba(0,0,0,0.13)","--color-border-primary":"rgba(0,0,0,0.22)","--color-accent":"#185FA5","body-bg":"#dde5ed"} },
  "claro-verde":    { nombre:"Primavera",        modo:"claro",  emoji:"🌱", vars:{"--color-background-primary":"#f0f7f3","--color-background-secondary":"#ffffff","--color-background-tertiary":"#e0f0e8","--color-background-info":"#d1fae5","--color-background-success":"#d1fae5","--color-background-warning":"#fef3c7","--color-background-danger":"#fee2e2","--color-text-primary":"#1a2e22","--color-text-secondary":"#3a6a4a","--color-text-tertiary":"#6a9a7a","--color-text-info":"#065f46","--color-text-success":"#065f46","--color-text-warning":"#92400e","--color-text-danger":"#991b1b","--color-border-tertiary":"rgba(0,0,0,0.07)","--color-border-secondary":"rgba(0,0,0,0.13)","--color-border-primary":"rgba(0,0,0,0.22)","--color-accent":"#1a7a3a","body-bg":"#d5ece0"} },
  "claro-naranja":  { nombre:"Arena Cálida",    modo:"claro",  emoji:"🌅", vars:{"--color-background-primary":"#fdf6ee","--color-background-secondary":"#ffffff","--color-background-tertiary":"#f7ece0","--color-background-info":"#fef3c7","--color-background-success":"#d1fae5","--color-background-warning":"#fef3c7","--color-background-danger":"#fee2e2","--color-text-primary":"#2d1f0e","--color-text-secondary":"#7a5a3a","--color-text-tertiary":"#a07a5a","--color-text-info":"#b45309","--color-text-success":"#065f46","--color-text-warning":"#92400e","--color-text-danger":"#991b1b","--color-border-tertiary":"rgba(0,0,0,0.07)","--color-border-secondary":"rgba(0,0,0,0.13)","--color-border-primary":"rgba(0,0,0,0.22)","--color-accent":"#c05a10","body-bg":"#f0e4d5"} },
  "claro-violeta":  { nombre:"Lavanda",          modo:"claro",  emoji:"💜", vars:{"--color-background-primary":"#f5f0fc","--color-background-secondary":"#ffffff","--color-background-tertiary":"#ede4f8","--color-background-info":"#ede9fe","--color-background-success":"#d1fae5","--color-background-warning":"#fef3c7","--color-background-danger":"#fee2e2","--color-text-primary":"#1e1040","--color-text-secondary":"#5a4080","--color-text-tertiary":"#8a70b0","--color-text-info":"#5b21b6","--color-text-success":"#065f46","--color-text-warning":"#92400e","--color-text-danger":"#991b1b","--color-border-tertiary":"rgba(0,0,0,0.07)","--color-border-secondary":"rgba(0,0,0,0.13)","--color-border-primary":"rgba(0,0,0,0.22)","--color-accent":"#6d28d9","body-bg":"#e8ddf5"} },
  "claro-gris":     { nombre:"Minimalista",      modo:"claro",  emoji:"⚪", vars:{"--color-background-primary":"#f8f9fa","--color-background-secondary":"#ffffff","--color-background-tertiary":"#eef0f2","--color-background-info":"#e0e7ff","--color-background-success":"#d1fae5","--color-background-warning":"#fef3c7","--color-background-danger":"#fee2e2","--color-text-primary":"#111827","--color-text-secondary":"#4b5563","--color-text-tertiary":"#9ca3af","--color-text-info":"#3730a3","--color-text-success":"#065f46","--color-text-warning":"#92400e","--color-text-danger":"#991b1b","--color-border-tertiary":"rgba(0,0,0,0.07)","--color-border-secondary":"rgba(0,0,0,0.13)","--color-border-primary":"rgba(0,0,0,0.22)","--color-accent":"#374151","body-bg":"#e5e7eb"} },
};

// ── ESTILO METÁLICO — versión con relieve de cada uno de los 10 colores ────
// No son temas nuevos con su propia paleta: son los MISMOS 10 colores de
// arriba, con la manija en "metálico" en vez de "clásico". Por eso se arman
// solos acá abajo, copiando los vars de cada uno — si mañana cambiás un
// color en un tema clásico, el metálico lo sigue automáticamente.
function _ajustarColorLC(hex, amt) {
  hex = (hex||"").replace("#","");
  if(hex.length!==6) return "#"+hex;
  const canal = (i) => Math.max(0,Math.min(255, parseInt(hex.substring(i,i+2),16)+amt)).toString(16).padStart(2,"0");
  return "#"+canal(0)+canal(2)+canal(4);
}
Object.keys(TEMAS_LC).forEach(id=>{
  const base = TEMAS_LC[id];
  TEMAS_LC[id+"-metal"] = { nombre:base.nombre, modo:base.modo, emoji:"⚙️", relieve:true, vars:base.vars };
});

// ── RELIEVE — el degradado vive DENTRO de la variable de color ────────────
// Todas las pantallas ya pintan sus tarjetas y botones con
// background:"var(--color-background-tertiary)" (o secondary, o accent).
// Una variable CSS puede contener un degradado igual que un color plano —
// así que en vez de tocar cada pantalla, acá redefinimos esas 3 variables
// para que en vez de un color liso tengan un linear-gradient. Se aplica
// solo, en todos lados, apenas cambia la variable — sin re-render de React.
function _generarRelieveVarsLC(vars, modo) {
  const bgSec  = vars["--color-background-secondary"];
  const bgTer  = vars["--color-background-tertiary"];
  const accent = vars["--color-accent"];
  const oscuro = modo === "oscuro";
  return {
    "--color-background-secondary": `linear-gradient(180deg, ${_ajustarColorLC(bgSec, oscuro?46:34)} 0%, ${_ajustarColorLC(bgSec, oscuro?-22:-20)} 100%)`,
    "--color-background-tertiary":  `linear-gradient(180deg, ${_ajustarColorLC(bgTer, oscuro?54:38)} 0%, ${_ajustarColorLC(bgTer, oscuro?8:2)} 45%, ${_ajustarColorLC(bgTer, oscuro?-26:-30)} 100%)`,
    "--color-accent":               `linear-gradient(180deg, ${_ajustarColorLC(accent,60)} 0%, ${accent} 45%, ${_ajustarColorLC(accent,-45)} 100%)`,
  };
}
// ── SOMBRA GLOBAL — el relieve de verdad ──────────────────────────────────
// Casi toda la app arma sus botones con <button> (los días, los accesos
// rápidos, Clientes/Stock/Config, etc.) y sus campos con <input>/<select>/
// <textarea> — así que una sola regla de CSS con !important le agrega
// bisel, forma, borde y tipografía a TODOS a la vez, sin tocar ninguna
// pantalla puntual. Los botones quedan elevados (relieve hacia afuera);
// los campos de carga quedan hundidos (como una ranura, al revés) — así se
// distingue de un vistazo qué se toca y dónde se escribe.
function _aplicarSombraGlobalLC(tema) {
  let tag = document.getElementById("relieve-global-lc");
  if(!tag){ tag = document.createElement("style"); tag.id = "relieve-global-lc"; document.head.appendChild(tag); }
  if(!tema.relieve){ tag.textContent = ""; return; }
  const oscuro = tema.modo === "oscuro";
  const sombraBtn = oscuro
    ? "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.5), 0 4px 0 rgba(0,0,0,0.75), 0 7px 12px rgba(0,0,0,0.55)"
    : "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -3px 6px rgba(0,0,0,0.14), 0 3px 0 rgba(0,0,0,0.28), 0 5px 10px rgba(0,0,0,0.22)";
  const sombraInput = oscuro
    ? "inset 0 2px 5px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06)"
    : "inset 0 2px 4px rgba(0,0,0,0.18), inset 0 1px 0 rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8)";
  const sombraBadge = oscuro
    ? "0 2px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)"
    : "0 2px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.6)";
  const borde = oscuro ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.35)";
  const bordeInput = oscuro ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.25)";
  const textShadow = oscuro ? "0 1px 1px rgba(0,0,0,0.7)" : "0 1px 0 rgba(255,255,255,0.6)";
  tag.textContent = `
    button:not(.no-relieve){
      box-shadow:${sombraBtn} !important;
      border:1px solid ${borde} !important;
      border-radius:9px !important;
      font-weight:700 !important;
      letter-spacing:0.02em !important;
      text-shadow:${textShadow} !important;
      transition:box-shadow .12s, transform .05s;
    }
    button:not(.no-relieve):active{ transform:translateY(2px); box-shadow:inset 0 2px 4px rgba(0,0,0,0.5) !important; }
    input:not(.no-relieve), select:not(.no-relieve), textarea:not(.no-relieve){
      box-shadow:${sombraInput} !important;
      border:1px solid ${bordeInput} !important;
      border-radius:7px !important;
    }
    span[style*="border-radius: 50%"], span[style*="border-radius:50%"]{
      box-shadow:${sombraBadge} !important;
    }
  `;
}
function aplicarTemaLC(temaId) {
  const tema = TEMAS_LC[temaId]; if(!tema) return;
  const root = document.documentElement;
  // Primero se pisan TODAS las variables con los colores planos de siempre
  // (esto es lo que hace que volver de metálico a clásico también funcione:
  // el degradado queda pisado por el color plano de nuevo).
  Object.entries(tema.vars).forEach(([k,v])=>{ if(k==="body-bg") document.body.style.background=v; else root.style.setProperty(k,v); });
  // Si el tema es metálico, ENCIMA de eso, 3 variables pasan a degradado,
  // más el fondo general de la página.
  if(tema.relieve){
    const rel = _generarRelieveVarsLC(tema.vars, tema.modo);
    Object.entries(rel).forEach(([k,v])=>root.style.setProperty(k,v));
    const bg = tema.vars["body-bg"];
    const oscuro = tema.modo === "oscuro";
    document.body.style.background = `linear-gradient(160deg, ${_ajustarColorLC(bg, oscuro?26:16)} 0%, ${_ajustarColorLC(bg, oscuro?-14:-10)} 100%)`;
  }
  _aplicarSombraGlobalLC(tema);
}
function getTemaLC() { try { return JSON.parse(localStorage.getItem("lc_tema")||'"oscuro-azul"'); } catch { return "oscuro-azul"; } }
(()=>{ try { aplicarTemaLC(getTemaLC()); } catch{} })();

const { useState } = React;
