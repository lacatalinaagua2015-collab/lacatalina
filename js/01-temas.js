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

// ── RELIEVE — gradiente + sombra calculados a partir del color del tema ───
// card/btn/btnPrimary son objetos JS compartidos por toda la app (no clases
// CSS), así que acá directamente les mutamos las propiedades: todo lo que se
// arma con {...s.card} en el próximo render agarra la versión con relieve
// sola, sin tocar ninguna pantalla puntual.
function _generarRelieveLC(vars, modo) {
  const base   = vars["--color-background-tertiary"];
  const baseCard = vars["--color-background-secondary"];
  const accent = vars["--color-accent"];
  const txt    = vars["--color-text-primary"];
  const oscuro = modo === "oscuro";
  const bordeMetal = _ajustarColorLC(base, oscuro?-32:-42);
  const sombraCard = oscuro
    ? "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.35), 0 3px 0 rgba(0,0,0,0.5), 0 5px 8px rgba(0,0,0,0.4)"
    : "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 4px rgba(0,0,0,0.08), 0 2px 0 rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.12)";
  const sombraBtn = oscuro
    ? "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.35), 0 2px 0 rgba(0,0,0,0.5)"
    : "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -2px 3px rgba(0,0,0,0.06), 0 1px 0 rgba(0,0,0,0.15)";
  return {
    card: {
      background:`linear-gradient(180deg, ${_ajustarColorLC(base, oscuro?18:10)} 0%, ${_ajustarColorLC(baseCard, oscuro?-8:-6)} 100%)`,
      border:`1px solid ${bordeMetal}`, borderRadius:10, padding:"10px 14px", margin:"6px 14px",
      boxShadow: sombraCard,
    },
    btn: {
      border:`1px solid ${bordeMetal}`, borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer",
      background:`linear-gradient(180deg, ${_ajustarColorLC(base,oscuro?28:16)} 0%, ${_ajustarColorLC(base,oscuro?6:0)} 45%, ${_ajustarColorLC(base,oscuro?-10:-14)} 100%)`,
      color: txt,
      boxShadow: sombraBtn,
    },
    btnPrimary: {
      background:`linear-gradient(180deg, ${_ajustarColorLC(accent,50)} 0%, ${accent} 45%, ${_ajustarColorLC(accent,-38)} 100%)`,
      color:"#fff", border:`1px solid ${_ajustarColorLC(accent,-48)}`,
      borderRadius:8, padding:"12px 20px", fontSize:14, fontWeight:700, cursor:"pointer", width:"100%",
      boxShadow:`inset 0 1px 0 rgba(255,255,255,0.5), 0 0 14px ${accent}77, 0 3px 0 ${_ajustarColorLC(accent,-48)}`,
    },
  };
}
let FLAT_STYLES_LC = null; // guarda los valores planos originales la primera vez, para poder volver
function aplicarTemaLC(temaId) {
  const tema = TEMAS_LC[temaId]; if(!tema) return;
  const root = document.documentElement;
  Object.entries(tema.vars).forEach(([k,v])=>{ if(k==="body-bg") document.body.style.background=v; else root.style.setProperty(k,v); });
  // Relieve: solo pisa card/btn/btnPrimary si "s" (03-utils.js) ya cargó.
  // La primera llamada (antes de que exista "s") no hace nada acá — por eso
  // 03-utils.js vuelve a llamar a aplicarTemaLC() apenas define "s".
  if(typeof s !== "undefined" && s && s.card){
    if(!FLAT_STYLES_LC) FLAT_STYLES_LC = { card:{...s.card}, btn:{...s.btn}, btnPrimary:{...s.btnPrimary} };
    const origen = tema.relieve ? _generarRelieveLC(tema.vars, tema.modo) : FLAT_STYLES_LC;
    Object.assign(s.card, origen.card);
    Object.assign(s.btn, origen.btn);
    Object.assign(s.btnPrimary, origen.btnPrimary);
  }
}
function getTemaLC() { try { return JSON.parse(localStorage.getItem("lc_tema")||'"oscuro-azul"'); } catch { return "oscuro-azul"; } }
(()=>{ try { aplicarTemaLC(getTemaLC()); } catch{} })();

const { useState } = React;

