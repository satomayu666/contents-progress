import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Theme ──────────────────────────────────────────────────────────────────
const G = {
  surface:    "#FFFFFF",
  surfaceAlt: "#F7F7F7",
  border:     "#E8E4E0",
  borderMid:  "#D4CFC9",
  grey:       "#D6D6D6",
  greyMid:    "#A8A8A8",
  greyDark:   "#6A6A6A",
  greyDeep:   "#3A3A3A",
  ink:        "#222222",
};
const P = {
  blue:   "#899EB4",
  teal:   "#9DBBBE",
  green:  "#B6BF99",
  yellow: "#C8C586",
  orange: "#D1B7A0",
  pink:   "#D3ABAA",
  lb:     "#B6AA9C",
  red:    "#C0746A",
  purple: "#A493AF",
  sage:   "#8FA899",
};
const DOT = { empty:"#EDEBE8", low:"#C9BFB5", mid:"#A08878", high:"#7A5C50" };

const tint = (h) => h + "28";
const mid  = (h) => h + "55";
function dk(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.round(r*.55)},${Math.round(g*.55)},${Math.round(b*.55)})`;
}

// ─── localStorage ────────────────────────────────────────────────────────────
const LS_ITEMS = "cp_items_v5";
const LS_WQ    = "cp_wq_v1";
const LS_DATES = "cp_dates_v6";

// ─── Persistent storage ────────────────────────────────────────────────────────
// localStorage を最優先（PWA / ブラウザ両対応）
// window.storage は Claude Artifact 環境のみのフォールバック

function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw);
  } catch {}
  return null;
}

function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) { console.warn("lsSet failed:", key, e); }
}

async function wsGet(key, fallback) {
  // 1) localStorage 優先（PWA含む通常ブラウザ）
  const ls = lsGet(key);
  if (ls != null) return ls;
  // 2) window.storage（Claude Artifact 環境のみ）
  try {
    if (window.storage) {
      const res = await window.storage.get(key);
      if (res && res.value != null) {
        const val = JSON.parse(res.value);
        // localStorage に書き戻してキャッシュ
        lsSet(key, val);
        return val;
      }
    }
  } catch {}
  return fallback;
}
async function wsSet(key, value) {
  const json = JSON.stringify(value);
  // 1) localStorage
  try { localStorage.setItem(key, json); } catch {}
  // 2) window.storage
  try { if (window.storage) await window.storage.set(key, json); } catch {}
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function Ico({ d, size=16, color="currentColor", fill="none", sw=1.6, style={} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink:0, ...style }}>
      {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
    </svg>
  );
}
function IcoF({ d, size=16, color="currentColor", style={} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={{ flexShrink:0, ...style }}>
      {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
    </svg>
  );
}
const ICONS = {
  anime:   () => <Ico size={15} d={["M2 7h20v12a1 1 0 01-1 1H3a1 1 0 01-1-1V7z","M2 7l3-4h14l3 4","M8 14l3 2-3 2v-4z"]}/>,
  drama:   () => <Ico size={15} d={["M2 5h20v14H2z","M8 5v14","M16 5v14","M2 9h6","M16 9h6","M2 15h6","M16 15h6"]}/>,
  book:    () => <Ico size={15} d={["M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14","M4 19a2 2 0 002 2h12","M9 7h6","M9 11h4"]}/>,
  manga:   () => <Ico size={15} d={["M6 2h12a1 1 0 011 1v16l-7-3-7 3V3a1 1 0 011-1z","M9 7h6","M9 11h4"]}/>,
  movie:   () => <Ico size={15} d={["M2 8h20v12H2z","M7 2v6","M12 2v6","M17 2v6","M2 12h20","M7 15l4 2-4 2v-4z"]}/>,
  live:    () => <Ico size={15} d={["M9 18V6l13-4v12","M9 18a3 3 0 11-6 0 3 3 0 016 0z","M22 14a3 3 0 11-6 0 3 3 0 016 0z"]}/>,
  article: () => <Ico size={15} d={["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"]}/>,
  youtube: () => <Ico size={15} d={["M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z","M9.75 15.02V8.98L15.5 12l-5.75 3.02z"]}/>,
  tv:      () => <Ico size={15} d={["M2 7h20v13a1 1 0 01-1 1H3a1 1 0 01-1-1V7z","M7 3l5 4 5-4"]}/>,
  radio:   () => <Ico size={15} d={["M3 9h18v12H3z","M7 9V6","M17 9V6","M7 15h.01","M12 12v6","M17 12v3"]}/>,
  pencil:  () => <Ico size={14} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>,
  chart:   () => <Ico size={15} d={["M3 3v18h18","M7 16l4-6 4 4 4-8"]}/>,
  plus:    () => <Ico size={15} d="M12 5v14M5 12h14" sw={2}/>,
  clock:   () => <Ico size={14} d={["M12 6v6l4 2","M12 2a10 10 0 100 20A10 10 0 0012 2z"]}/>,
  play:    () => <IcoF size={13} d="M6 4l14 8-14 8V4z"/>,
  pause:   () => <Ico  size={13} d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" sw={0}/>,
  redo:    () => <Ico size={14} d={["M1 4v6h6","M23 20v-6h-6","M20.5 8A9 9 0 1 0 5 15.2"]} sw={1.8}/>,
  up:      () => <Ico  size={12} d="M12 19V5M5 12l7-7 7 7" sw={2}/>,
  dn:      () => <Ico  size={12} d="M12 5v14M5 12l7 7 7-7" sw={2}/>,
  check:   () => <Ico  size={14} d="M20 6L9 17l-5-5" sw={2.5}/>,
  close:   () => <Ico  size={18} d="M18 6L6 18M6 6l12 12" sw={2}/>,
  funnel:  () => <Ico  size={14} d="M3 6h18M7 12h10M11 18h2" sw={2}/>,
  star:    () => <Ico  size={14} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
  pin:     () => <Ico  size={14} d={["M12 2a5 5 0 015 5c0 3.5-5 11-5 11S7 10.5 7 7a5 5 0 015-5z","M12 7a1 1 0 100 2 1 1 0 000-2z"]}/>,
  dl:      () => <Ico  size={14} d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M7 10l5 5 5-5","M12 15V3"]}/>,
  ul:      () => <Ico  size={14} d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"]}/>,
  link:    () => <Ico  size={13} d={["M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71","M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"]}/>,
  // memo icon: speech bubble with lines
  memo:    () => <Ico  size={13} d={["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"]} sw={1.8}/>,
  calendar:() => <Ico  size={13} d={["M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z","M16 2v4","M8 2v4","M3 10h18"]} sw={1.7}/>,
  antenna: () => <Ico  size={13} d={["M5 12.55a11 11 0 0114.08 0","M1.42 9a16 16 0 0121.16 0","M8.53 16.11a6 6 0 016.95 0","M12 20h.01"]} sw={1.8}/>,
  hourglass: () => <Ico size={13} d={["M5 2h14","M5 22h14","M17 2v6l-5 4 5 4v6","M7 2v6l5 4-5 4v6"]} sw={1.7}/>,
  music:     () => <Ico size={13} d={["M9 18V5l12-2v13","M6 21a3 3 0 100-6 3 3 0 000 6z","M18 19a3 3 0 100-6 3 3 0 000 6z"]} sw={1.7}/>,
  sort:    () => <Ico  size={14} d="M3 6h18M7 12h10M11 18h2" sw={2}/>,
  report:  () => <Ico  size={15} d={["M18 20V10","M12 20V4","M6 20v-6"]} sw={2}/>,
  search:  () => <Ico  size={14} d={["M11 19a8 8 0 100-16 8 8 0 000 16z","M21 21l-4.35-4.35"]} sw={1.8}/>,
  xcircle: () => <Ico  size={13} d={["M12 2a10 10 0 100 20A10 10 0 0012 2z","M15 9l-6 6","M9 9l6 6"]} sw={1.8}/>,
  merge:   () => <Ico  size={14} d={["M8 7l4-4 4 4","M12 3v8","M8 17l4 4 4-4","M12 21v-8","M3 12h4","M17 12h4"]} sw={1.8}/>,
};
function CatIco({ cat, color }) {
  const map = {
    anime:ICONS.anime, drama:ICONS.drama, book:ICONS.book, manga:ICONS.manga,
    movie:ICONS.movie, live:ICONS.live, article:ICONS.article,
    youtube:ICONS.youtube, tv:ICONS.tv, radio:ICONS.radio,
  };
  const Fn = map[cat] || ICONS.article;
  return <span style={{ color:color||G.greyMid, display:"inline-flex", alignItems:"center" }}><Fn/></span>;
}

// ─── End Level System ─────────────────────────────────────────────────────────

const CATS = {
  article: { label:"Web",    unit:"件",  color:"#9EA89A", order:0 },
  live:    { label:"Live",   unit:"分",  color:"#BDAF98", order:1 },
  youtube: { label:"YouTube",unit:"分",  color:"#B8A99C", order:2 },
  radio:   { label:"Radio",  unit:"分",  color:"#A0AAAA", order:3 },
  tv:      { label:"TV",     unit:"分",  color:"#A8A29F", order:4 },
  book:    { label:"Book",   unit:"P",   color:"#9EA89A", order:5 },
  anime:   { label:"Anime",  unit:"話",  color:"#BDAF98", order:6 },
  drama:   { label:"Drama",  unit:"話",  color:"#B8A99C", order:7 },
  movie:   { label:"Movie",  unit:"分",  color:"#A0AAAA", order:8 },
  manga:   { label:"Comic",  unit:"巻",  unitAlt:"話", color:"#A8A29F", order:9 },
};
const CAT_KEYS = Object.keys(CATS).sort((a,b) => CATS[a].order - CATS[b].order);
const ALL = "すべて";
const FILTER_OPTS = [ALL, ...CAT_KEYS.map(k => CATS[k].label)];
const BY_LABEL = Object.fromEntries(Object.entries(CATS).map(([k,v]) => [v.label, k]));
const TABS = ["進行中","これから","完了"];

// ─── Status resolution (used in EditModal save) ──────────────────────────────
// When editing a done item and user changes progress, auto-reassign status.
// Resolves the correct status from current progress — works for ALL tabs.
// 0% → queue, 1-99% → active, 100% → done
function resolveStatus(current, total) {
  if (total <= 0) return "queue";
  const p = Math.round(current / total * 100);
  if (p <= 0)   return "queue";
  if (p >= 100) return "done";
  return "active";
}
function resolveCompletedAt(current, total, prevCompletedAt, prevStatus) {
  const newStatus = resolveStatus(current, total);
  if (newStatus === "done" && prevStatus !== "done") return today();
  if (newStatus !== "done") return null;
  return prevCompletedAt;
}
// Human-readable destination label
function statusLabel(st) {
  if (st === "queue")  return "これから";
  if (st === "active") return "進行中";
  return "完了";
}

// ─── Default data ─────────────────────────────────────────────────────────────
const DEFAULTS = [
  { id:1, title:"進撃の巨人 ファイナルシーズン", category:"anime",   total:12,  current:3,  episodeMin:24,  totalDurationMin:null, videoDurationMin:null, videoUrl:null, articleUrl:null, contentUrl:null, station:null, tvStation:null, tvViewMethod:[], airDate:null, streamingServices:[], readingMethod:[], readingOther:"", readingSubOther:"", startedAt:"2025-06-01", priority:0, status:"active", addedAt:"2025-06-01", completedAt:null, lastUpdated:"2025-06-10", notes:"" },
  { id:2, title:"ハーミットの書",                 category:"book",    total:300, current:50, episodeMin:null,totalDurationMin:null, videoDurationMin:null, videoUrl:null, articleUrl:null, contentUrl:null, station:null, tvStation:null, tvViewMethod:[], airDate:null, streamingServices:[], readingMethod:[], readingOther:"", readingSubOther:"", startedAt:"2025-05-22", priority:1, status:"active", addedAt:"2025-05-20", completedAt:null, lastUpdated:"2025-06-08", notes:"第3章が面白い" },
  { id:3, title:"インターステラー",               category:"movie",   total:169, current:0,  episodeMin:169, totalDurationMin:null, videoDurationMin:null, videoUrl:null, articleUrl:null, contentUrl:null, station:null, tvStation:null, tvViewMethod:[], airDate:null, streamingServices:[], readingMethod:[], readingOther:"", readingSubOther:"", startedAt:null, priority:0, status:"queue",  addedAt:"2025-06-12", completedAt:null, lastUpdated:null, notes:"" },
  { id:4, title:"なぜReact Serverは革命なのか",   category:"article", total:1,   current:0,  episodeMin:8,   totalDurationMin:null, videoDurationMin:null, videoUrl:null, articleUrl:"https://example.com/react-server", contentUrl:null, station:null, tvStation:null, tvViewMethod:[], airDate:null, streamingServices:[], readingMethod:[], readingOther:"", readingSubOther:"", startedAt:null, priority:1, status:"queue",  addedAt:"2025-06-13", completedAt:null, lastUpdated:null, notes:"" },
  { id:5, title:"Fireship - 100秒でわかるReact",  category:"youtube", total:1,   current:0,  episodeMin:null,totalDurationMin:null, videoDurationMin:2,   videoUrl:"https://www.youtube.com/watch?v=Tn6-PIqc4UM", articleUrl:null, contentUrl:null, station:null, tvStation:null, tvViewMethod:[], airDate:null, streamingServices:[], readingMethod:[], readingOther:"", readingSubOther:"", startedAt:null, priority:2, status:"queue", addedAt:"2025-06-13", completedAt:null, lastUpdated:null, notes:"" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cjkMin(t) {
  const c=(t.match(/[\u3000-\u9FFF\uF900-\uFAFF\uAC00-\uD7FF]/g)||[]).length;
  const l=(t.replace(/[\u3000-\u9FFF\uF900-\uFAFF\uAC00-\uD7FF]/g,"").match(/\S+/g)||[]).length;
  return Math.ceil(c/400+l/200)||1;
}

// Real article fetch: targets <article>, <main>, [role=main] — strips ads/sidebars
// Uses allorigins CORS proxy so it works from browser/GitHub Pages too
async function fetchArticleReadingMin(url) {
  if (!url || !url.startsWith("http")) return null;
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const html = data.contents || "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    // Remove noise elements
    ["script","style","noscript","nav","footer","header","aside","[role=complementary]","[role=navigation]","[class*=ad]","[id*=ad]"].forEach(sel => {
      try { doc.querySelectorAll(sel).forEach(el => el.remove()); } catch {}
    });
    // Extract main content
    const main = doc.querySelector("article, [role='main'], main, .entry-content, .post-content, .article-body") || doc.body;
    const text = main ? (main.innerText || main.textContent || "") : "";
    const mins = cjkMin(text.trim());
    return mins >= 1 ? mins : null;
  } catch {
    return null;
  }
}

// Fallback estimate (used when URL is blank or fetch fails)
function estimateReadingMin(_url) { return cjkMin("あ".repeat(3200)); }
function fmtGap(m) {
  const mc = Math.ceil(m); // always round up
  if (mc < 60) return `${mc}分`;
  const h = Math.floor(mc/60), r = mc%60;
  return r ? `${h}時間${r}分` : `${h}時間`;
}
function hint(m) {
  const mc = Math.ceil(m);
  if (mc<=5) return "通勤1駅分";
  if (mc<=15) return "休憩1回分";
  return `25分×${Math.ceil(mc/25)}回分`;
}
function pct(c,t) { return t?Math.min(100,Math.round(c/t*100)):0; }
function finAt(m) { const d=new Date(); d.setMinutes(d.getMinutes()+m); return d.toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"}); }
function today() { return new Date().toISOString().slice(0,10); }
function lastNDays(n) {
  return Array.from({length:n},(_,i) => {
    const d=new Date(); d.setDate(d.getDate()-(n-1-i)); return d.toISOString().slice(0,10);
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Outfit — clean geometric sans, neutral weight
const F = "'Outfit','Inter','system-ui','-apple-system','Hiragino Sans','Noto Sans JP',sans-serif";
const INP = { width:"100%",minWidth:0,padding:"10px 12px",border:`1.5px solid ${G.border}`,borderRadius:9,fontSize:13,outline:"none",fontFamily:F,background:G.surfaceAlt,boxSizing:"border-box",color:G.greyDeep,lineHeight:1.5,letterSpacing:"0.07em" };
// Date/datetime inputs: fully override iOS Safari defaults so width matches other inputs
const INP_DATE = {
  ...INP,
  display: "block",
  width: "100%",
  maxWidth: "100%",
  WebkitAppearance: "none",
  MozAppearance: "none",
  appearance: "none",
  // Explicit sizing so border-box kicks in correctly on all browsers
  boxSizing: "border-box",
};
const LBL = { fontSize:9,fontWeight:700,color:G.greyMid,textTransform:"uppercase",letterSpacing:"0.11em",display:"block",marginBottom:5 };
function sBt(bg,fg="#fff") { return {padding:"8px 13px",borderRadius:8,fontSize:11,fontWeight:700,border:"none",background:bg,color:fg,cursor:"pointer",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5,fontFamily:F,lineHeight:1,letterSpacing:"0.02em"}; }
function oBt(c,fg) { return {padding:"8px 13px",borderRadius:8,fontSize:11,fontWeight:700,border:`1.5px solid ${c}`,background:"transparent",color:fg||dk(c),cursor:"pointer",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5,fontFamily:F,lineHeight:1,letterSpacing:"0.02em"}; }
function gBt() { return {padding:"7px 11px",borderRadius:7,fontSize:11,fontWeight:600,border:`1.5px solid ${G.border}`,background:G.surface,color:G.greyDark,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1,letterSpacing:"0.01em"}; }

// ─── Confetti (completion celebration) ────────────────────────────────────────
const CONFETTI_COLORS = Object.values(CATS).map(c => c.color);

function Confetti({ onDone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const cx = W / 2, cy = H * 0.42;

    // 120 particles: mix of rects, circles, thin strips
    const particles = Array.from({ length: 120 }, (_, i) => {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 4 + Math.random() * 9;
      const shape = i % 3; // 0=rect, 1=circle, 2=strip
      return {
        x: cx + (Math.random()-0.5)*30,
        y: cy + (Math.random()-0.5)*20,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed - (3 + Math.random()*4), // bias upward
        w: shape===2 ? 2 + Math.random()*2 : 5 + Math.random()*9,
        h: shape===2 ? 8 + Math.random()*14 : 4 + Math.random()*6,
        r: shape===1 ? 3 + Math.random()*4 : 0,
        shape,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.22,
        alpha: 1,
        gravity: 0.18 + Math.random() * 0.12,
      };
    });

    let frame = 0;
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      particles.forEach(p => {
        p.x   += p.vx;
        p.y   += p.vy;
        p.vy  += p.gravity;
        p.vx  *= 0.99;
        p.rot += p.vr;
        if (p.y > H * 0.62) p.alpha = Math.max(0, p.alpha - 0.028);
        if (p.alpha > 0) alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI*2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        }
        ctx.restore();
      });
      frame++;
      if (alive && frame < 280) { raf = requestAnimationFrame(draw); }
      else { onDone && onDone(); }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas ref={canvasRef}
      style={{ position:"fixed", inset:0, zIndex:1200, pointerEvents:"none", width:"100%", height:"100%" }}
    />
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color }) {
  return (
    <div style={{ background:G.border,borderRadius:99,height:4,overflow:"hidden",margin:"9px 0 4px" }}>
      <div style={{ width:`${value}%`,height:"100%",borderRadius:99,background:color,transition:"width .45s cubic-bezier(.4,0,.2,1)" }}/>
    </div>
  );
}
function Toast({ msg, onHide }) {
  useEffect(() => { const t=setTimeout(onHide,3200); return()=>clearTimeout(t); },[]);
  return (
    <div style={{ position:"fixed",bottom:88,left:"50%",transform:"translateX(-50%)",background:G.ink,color:"#fff",borderRadius:13,padding:"12px 22px",fontSize:13,fontWeight:500,boxShadow:"0 8px 28px rgba(0,0,0,0.18)",zIndex:999,maxWidth:"84vw",textAlign:"center",lineHeight:1.55,animation:"fadeUp .2s ease" }}>
      {msg}
    </div>
  );
}
function CatTag({ catKey }) {
  const c = CATS[catKey];
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:dk(c.color),background:tint(c.color),borderRadius:5,padding:"2px 7px" }}>
      <CatIco cat={catKey} color={dk(c.color)}/>{c.label}
    </span>
  );
}
function FF({ label, children, mb=14 }) {
  return <div style={{ marginBottom:mb }}><label style={LBL}>{label}</label>{children}</div>;
}
// Date field wrapper — adds a ×クリア button when a value is present
function FFDate({ label, value, onChange, mb=14 }) {
  return (
    <div style={{ marginBottom:mb }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
        <label style={LBL}>{label}</label>
        {value && (
          <button type="button" onClick={()=>onChange("")}
            style={{ fontSize:10, fontWeight:600, color:G.greyMid, background:"none", border:"none", cursor:"pointer", padding:"0 2px", fontFamily:F, letterSpacing:"0.03em" }}>
            × クリア
          </button>
        )}
      </div>
      <input type="date" style={INP_DATE} value={value||""} onChange={e=>onChange(e.target.value)}/>
    </div>
  );
}
function Arrows({ list, idx, onReorder }) {
  return (
    <div style={{ display:"flex",justifyContent:"flex-end",gap:4,marginBottom:-4,position:"relative",zIndex:1 }}>
      {[{dir:-1,Icon:ICONS.up},{dir:1,Icon:ICONS.dn}].map(({dir,Icon}) => {
        const dis = dir===-1?idx===0:idx===list.length-1;
        return (
          <button key={dir} onClick={()=>onReorder(idx,dir)} disabled={dis}
            style={{ background:G.surface,border:`1.5px solid ${G.border}`,borderRadius:7,width:28,height:28,cursor:dis?"not-allowed":"pointer",color:dis?G.border:G.greyMid,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Icon/>
          </button>
        );
      })}
    </div>
  );
}

// Days between two date strings (inclusive start, inclusive end)
function daysBetween(a, b) {
  if (!a || !b) return null;
  const ms = Math.abs(new Date(b) - new Date(a));
  return Math.round(ms / 86400000) + 1;
}

// ─── Multi-Select Chip Picker ─────────────────────────────────────────────────
function MultiSelect({ options, value, onChange, otherKey, otherValue, onOtherChange }) {
  const toggle = (key) => {
    const next = value.includes(key) ? value.filter(k => k !== key) : [...value, key];
    onChange(next);
  };
  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
        {options.map(({ label, key }) => {
          const on = value.includes(key);
          return (
            <button key={key} onClick={() => toggle(key)} type="button"
              style={{ padding:"6px 12px", borderRadius:99, fontSize:12, fontWeight:600,
                border:`1.5px solid ${on ? "#BFBFBF" : G.border}`,
                background: on ? "#BFBFBF" : G.surfaceAlt,
                color: on ? "#fff" : G.greyDark,
                cursor:"pointer", fontFamily:F, transition:"all .15s" }}>
              {label}
            </button>
          );
        })}
      </div>
      {otherKey && value.includes(otherKey) && (
        <input style={{ ...INP, marginTop:8 }} placeholder="自由入力…" value={otherValue||""} onChange={e => onOtherChange(e.target.value)}/>
      )}
    </div>
  );
}

// Streaming service options for anime/drama
const STREAMING_OPTIONS = [
  { key:"tver",    label:"TVer" },
  { key:"amazon",  label:"Amazon Prime" },
  { key:"netflix", label:"Netflix" },
  { key:"hulu",    label:"Hulu" },
  { key:"abema",   label:"ABEMA" },
  { key:"other",   label:"その他" },
];
// 映画専用（映画館を追加）
const MOVIE_STREAMING_OPTIONS = [
  { key:"cinema",  label:"映画館" },
  { key:"amazon",  label:"Amazon Prime" },
  { key:"netflix", label:"Netflix" },
  { key:"hulu",    label:"Hulu" },
  { key:"abema",   label:"ABEMA" },
  { key:"other",   label:"その他" },
];
// Reading method options for book & manga
const READING_OPTIONS = [
  { key:"paper",  label:"紙書籍を購入" },
  { key:"ebook",  label:"電子書籍を購入" },
  { key:"sub",    label:"サブスクリプション" },
  { key:"other",  label:"その他" },
];
// TV viewing method
const TV_VIEW_OPTIONS = [
  { key:"tv",    label:"TV" },
  { key:"tver",  label:"TVer" },
  { key:"other", label:"その他" },
];

// ─── Genre options ────────────────────────────────────────────────────────────
// 汎用ジャンル（TV/本/アニメ/ドラマ/映画/漫画 共通）
const GENRE_OPTIONS = [
  { key:"action",    label:"アクション" },
  { key:"adventure", label:"アドベンチャー" },
  { key:"comedy",    label:"コメディ" },
  { key:"romance",   label:"恋愛" },
  { key:"drama",     label:"ヒューマンドラマ" },
  { key:"mystery",   label:"ミステリー" },
  { key:"horror",    label:"ホラー" },
  { key:"scifi",     label:"SF" },
  { key:"fantasy",   label:"ファンタジー" },
  { key:"history",   label:"歴史・時代劇" },
  { key:"sports",    label:"スポーツ" },
  { key:"food",      label:"グルメ" },
  { key:"documentary",label:"ドキュメンタリー" },
  { key:"music",     label:"音楽" },
  { key:"anime_genre",label:"アニメ" },
  { key:"magazine",  label:"雑誌" },   // Book向け追加
  { key:"domestic",  label:"国内" },
  { key:"foreign",   label:"海外" },
  { key:"other",     label:"その他" },
];

// YouTubeジャンル（YouTube専用）
const YOUTUBE_GENRE_OPTIONS = [
  { key:"music",   label:"音楽" },
  { key:"vlog",    label:"Vlog" },
  { key:"tech",    label:"スマホ/アプリ" },
  { key:"beauty",  label:"美容" },
  { key:"fitness", label:"運動" },
  { key:"quiz",    label:"QuizKnock" },
  { key:"other",   label:"その他" },
];
function MemoPopup({ text, onClose }) {
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(34,34,34,0.25)",zIndex:800,display:"flex",alignItems:"flex-end" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:G.surface,borderRadius:"18px 18px 0 0",width:"100%",padding:"20px 20px 36px",maxHeight:"55vh",overflowY:"auto",boxShadow:"0 -6px 30px rgba(0,0,0,0.10)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <span style={{ fontSize:13,fontWeight:700,color:G.greyDeep,display:"flex",alignItems:"center",gap:6 }}>
            <ICONS.memo/> メモ
          </span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:G.greyMid,display:"flex",padding:4 }}><ICONS.close/></button>
        </div>
        <p style={{ fontSize:13,color:G.greyDark,lineHeight:1.75,margin:0,whiteSpace:"pre-wrap",wordBreak:"break-word" }}>{text}</p>
      </div>
    </div>
  );
}

// ─── Timer ────────────────────────────────────────────────────────────────────
// Background-safe: uses Date.now() as ground truth so ticks don't drift
// when the screen is off or the tab is hidden.
// Completion notified via Notification API (if permission granted).
function Timer({ color, onComplete }) {
  const [secs, setSecs]       = useState(300);
  const [running, setRunning] = useState(false);
  const [done, setDone]       = useState(false);
  const endTimeRef  = useRef(null); // absolute end timestamp
  const tickRef     = useRef(null);

  // Request notification permission once on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const clearTick = () => { clearInterval(tickRef.current); tickRef.current = null; };

  const startTicking = (remainingSecs) => {
    endTimeRef.current = Date.now() + remainingSecs * 1000;
    clearTick();
    tickRef.current = setInterval(() => {
      const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setSecs(left);
      if (left === 0) {
        clearTick();
        setRunning(false);
        setDone(true);
        onComplete();
        // Notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("5分経過！", { body: "記録を始めましょう！", icon: "" });
        }
      }
    }, 500); // tick every 500ms for accuracy
  };

  // Compensate when tab comes back to foreground
  useEffect(() => {
    const onVisible = () => {
      if (!running || !endTimeRef.current) return;
      const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setSecs(left);
      if (left === 0) {
        clearTick();
        setRunning(false);
        setDone(true);
        onComplete();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [running]);

  useEffect(() => { return () => clearTick(); }, []);

  const toggle = () => {
    if (done) return;
    if (!running) {
      startTicking(secs);
      setRunning(true);
    } else {
      clearTick();
      setRunning(false);
    }
  };

  const reset = () => {
    clearTick();
    setSecs(300);
    setRunning(false);
    setDone(false);
    endTimeRef.current = null;
  };

  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:12, background:done?tint("#B6BF99"):G.surfaceAlt, border:`1.5px solid ${done?"#B6BF99":G.border}`, borderRadius:11, padding:"10px 14px" }}>
      <span style={{ fontFamily:"monospace", fontSize:15, fontWeight:700, color:done?dk("#B6BF99"):G.greyDeep, minWidth:52, letterSpacing:"0.05em", flexShrink:0 }}>
        {done ? "完了 ✓" : `${m}:${s}`}
      </span>
      <button onClick={toggle} disabled={done}
        style={{ ...sBt(done ? G.grey : color), opacity: done ? 0.5 : 1, flexShrink:0 }}>
        {running ? <ICONS.pause/> : <ICONS.play/>}
        {running ? "一時停止" : "スタート"}
      </button>
      {(running || done || secs < 300) && (
        <button onClick={reset}
          style={{ flexShrink:0, padding:"6px 11px", borderRadius:8, fontSize:16, fontWeight:400, border:`1.5px solid ${G.border}`, background:G.surface, color:G.greyDark, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, fontFamily:"system-ui,sans-serif" }}>
          ↺
        </button>
      )}
    </div>
  );
}

// ─── Dot-Matrix Activity ──────────────────────────────────────────────────────
// ─── Dot-Matrix Activity (category-coloured) ─────────────────────────────────
// Each dot = one day. Colour = dominant genre that day (most interactions).
// Tie-breaking rule: lower CATS.order wins (WEB記事 > ライブ映像 > ... > 漫画).
// Empty days are shown in pale grey.
function getDominantCat(dayData) {
  // dayData: {categoryKey: count} or falsy
  if (!dayData || typeof dayData !== "object") return null;
  let best = null, bestCount = 0;
  for (const [cat, count] of Object.entries(dayData)) {
    const order = CATS[cat]?.order ?? 99;
    if (count > bestCount || (count === bestCount && best !== null && (CATS[cat]?.order??99) < (CATS[best]?.order??99))) {
      best = cat; bestCount = count;
    }
  }
  return best;
}

function DotMatrix({ activityLog }) {
  const todayStr = today();
  const todayDate = new Date(todayStr);
  // dow: 0=Mon … 6=Sun
  const dow = (todayDate.getDay() + 6) % 7;

  // Build the three weeks as arrays of date strings (length 7, null for future)
  const buildWeek = (mondayOffset) => {
    // mondayOffset: days from today's Monday to target Monday (0=this week, -7=last, -14=two weeks ago)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - dow + mondayOffset + i);
      const ds = d.toISOString().slice(0, 10);
      // Future dates in current week = null (no dot)
      if (ds > todayStr) return null;
      return ds;
    });
  };

  const weeks = [
    { label: "先々週", days: buildWeek(-14) },
    { label: "先週",   days: buildWeek(-7)  },
    { label: "今週",   days: buildWeek(0)   },
  ];
  const dayLabels = ["月","火","水","木","金","土","日"];
  const DOT = 12;
  const GAP = 7;

  const usedCats = [...new Set(
    Object.values(activityLog).flatMap(d => d && typeof d==="object" ? Object.keys(d) : [])
  )].filter(k => CATS[k]).sort((a,b) => (CATS[a]?.order??99)-(CATS[b]?.order??99));

  return (
    <div style={{ paddingBottom:14, borderBottom:`1.5px solid ${G.border}`, marginBottom:4 }}>
      <div style={{ fontSize:10, fontWeight:700, color:G.greyMid, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>ACTIVITY</div>

      {/* Table: rows = weeks, cols = weekdays */}
      <div style={{ display:"grid", gridTemplateColumns:`40px repeat(7, ${DOT}px)`, gap:`${GAP}px`, alignItems:"center" }}>
        {/* Header row: empty cell + weekday labels */}
        <div/>{/* spacer */}
        {dayLabels.map(d => (
          <div key={d} style={{ fontSize:9, fontWeight:700, color:G.greyMid, textAlign:"center", lineHeight:1 }}>{d}</div>
        ))}

        {/* Data rows */}
        {weeks.map(({ label, days }) => (
          <React.Fragment key={label}>
            {/* Row label */}
            <div style={{ fontSize:9, fontWeight:600, color:G.greyMid, whiteSpace:"nowrap", letterSpacing:"0.02em", lineHeight:1 }}>{label}</div>
            {/* Dots */}
            {days.map((date, di) => {
              if (!date) {
                // future slot in current week
                return <div key={di} style={{ width:DOT, height:DOT }}/>;
              }
              const dayData = activityLog[date];
              const domCat  = getDominantCat(dayData);
              const color   = domCat ? CATS[domCat].color : "#EBEBEB";
              const total   = dayData && typeof dayData==="object"
                ? Object.values(dayData).reduce((s,n) => s+n, 0)
                : (typeof dayData==="number" ? dayData : 0);
              const isToday = date === todayStr;
              return (
                <div key={di} title={`${date}${total ? ` — ${total}件` : ""}`}
                  style={{
                    width:DOT, height:DOT, borderRadius:"50%",
                    background: total ? color : "#EBEBEB",
                    opacity: total ? 1 : 0.4,
                    outline: isToday ? `2px solid ${G.greyMid}` : "none",
                    outlineOffset: 1,
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      {usedCats.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#EBEBEB", opacity:.6 }}/>
            <span style={{ fontSize:9, color:G.greyMid }}>記録なし</span>
          </div>
          {usedCats.map(k => (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:CATS[k].color }}/>
              <span style={{ fontSize:9, color:G.greyMid }}>{CATS[k].label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({ active, onChange, counts }) {
  return (
    <div style={{ display:"flex",gap:6,overflowX:"auto",padding:"0 0 1px",scrollbarWidth:"none" }}>
      {FILTER_OPTS.map(label => {
        const isAll=label===ALL, k=BY_LABEL[label];
        const color=k?CATS[k].color:G.grey, isAct=active===label, cnt=counts[label];
        return (
          <button key={label} onClick={()=>onChange(label)}
            style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:99,fontSize:12,fontWeight:700,border:`1.5px solid ${isAct?color:G.border}`,background:isAct?tint(color):G.surface,color:isAct?dk(color):G.greyDark,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s",flexShrink:0,fontFamily:F }}>
            {k&&<CatIco cat={k} color={isAct?dk(color):G.greyMid}/>}
            {isAll&&<ICONS.funnel/>}
            {label}
            {cnt!=null&&cnt>0&&<span style={{ background:isAct?mid(color):G.surfaceAlt,color:isAct?dk(color):G.greyMid,borderRadius:99,padding:"1px 6px",fontSize:10,fontWeight:700 }}>{cnt}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── NV Picker ────────────────────────────────────────────────────────────────
// ─── Watch Queue Picker (1〜5件の順序付き設定) ──────────────────────────────
const NV_NUMS = ["①","②","③","④","⑤"];

function WatchQueuePicker({ queueItems, watchQueue, onSave, onClose }) {
  const [wq, setWq] = useState([...watchQueue]);

  const toggle = (id) => {
    if (wq.includes(id)) {
      setWq(wq.filter(x => x !== id));
    } else if (wq.length < 5) {
      setWq([...wq, id]);
    }
  };
  const moveUp = (idx) => {
    if (idx === 0) return;
    const a = [...wq]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; setWq(a);
  };
  const moveDown = (idx) => {
    if (idx === wq.length - 1) return;
    const a = [...wq]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; setWq(a);
  };
  const remove = (idx) => setWq(wq.filter((_,i) => i !== idx));

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(34,34,34,0.32)",zIndex:900,display:"flex",alignItems:"flex-end" }}>
      <div style={{ background:G.surface,borderRadius:"22px 22px 0 0",width:"100%",padding:"28px 22px 48px",maxHeight:"82vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.12)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
          <span style={{ fontSize:17,fontWeight:800,color:G.greyDeep,display:"flex",alignItems:"center",gap:8 }}><ICONS.pin/> Watch Queue</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:G.greyMid,display:"flex",padding:4 }}><ICONS.close/></button>
        </div>
        <p style={{ fontSize:12,color:G.greyMid,marginBottom:16,lineHeight:1.6 }}>
          見る順番に最大5件を設定してください。①が Next View になります。
        </p>

        {/* Current queue (ordered) */}
        {wq.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10,fontWeight:700,color:G.greyMid,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8 }}>設定済みキュー</div>
            {wq.map((id, idx) => {
              const item = queueItems.find(i => i.id === id);
              if (!item) return null;
              const c = CATS[item.category];
              return (
                <div key={id} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"10px 12px",borderRadius:11,background:tint(c.color),border:`1.5px solid ${c.color}` }}>
                  <span style={{ fontSize:15, fontWeight:400, color:dk(c.color), minWidth:22, textAlign:"center", fontFamily:"system-ui,sans-serif" }}>{NV_NUMS[idx]}</span>
                  <CatIco cat={item.category} color={dk(c.color)}/>
                  <span style={{ flex:1,fontSize:13,fontWeight:600,color:G.greyDeep,lineHeight:1.3 }}>{item.title}</span>
                  <div style={{ display:"flex",gap:4 }}>
                    <button onClick={()=>moveUp(idx)} disabled={idx===0}
                      style={{ background:idx===0?"transparent":G.surface,border:`1px solid ${idx===0?G.border:G.borderMid}`,borderRadius:6,width:24,height:24,cursor:idx===0?"default":"pointer",color:idx===0?G.border:G.greyMid,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <ICONS.up/>
                    </button>
                    <button onClick={()=>moveDown(idx)} disabled={idx===wq.length-1}
                      style={{ background:idx===wq.length-1?"transparent":G.surface,border:`1px solid ${idx===wq.length-1?G.border:G.borderMid}`,borderRadius:6,width:24,height:24,cursor:idx===wq.length-1?"default":"pointer",color:idx===wq.length-1?G.border:G.greyMid,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <ICONS.dn/>
                    </button>
                    <button onClick={()=>remove(idx)}
                      style={{ background:G.surface,border:`1px solid ${G.borderMid}`,borderRadius:6,width:24,height:24,cursor:"pointer",color:G.greyMid,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <ICONS.xcircle/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Available queue items to add */}
        {wq.length < 5 && (
          <>
            <div style={{ fontSize:10,fontWeight:700,color:G.greyMid,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8 }}>
              追加できるコンテンツ（{5-wq.length}件まで追加可）
            </div>
            {queueItems.filter(i => !wq.includes(i.id)).map(item => {
              const c = CATS[item.category];
              return (
                <button key={item.id} onClick={()=>toggle(item.id)}
                  style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px",marginBottom:7,borderRadius:11,border:`1.5px solid ${G.border}`,background:G.surfaceAlt,cursor:"pointer",textAlign:"left",fontFamily:F }}>
                  <CatIco cat={item.category} color={G.greyMid}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:G.greyDeep,lineHeight:1.3 }}>{item.title}</div>
                    <div style={{ fontSize:11,color:G.greyMid,marginTop:2 }}>{c.label}</div>
                  </div>
                  <span style={{ fontSize:11,color:dk(c.color),fontWeight:700,background:tint(c.color),borderRadius:6,padding:"2px 8px" }}>+ 追加</span>
                </button>
              );
            })}
            {queueItems.filter(i => !wq.includes(i.id)).length === 0 && (
              <p style={{ textAlign:"center",color:G.greyMid,fontSize:13,padding:"12px 0" }}>追加できるコンテンツがありません</p>
            )}
          </>
        )}

        <button onClick={()=>{ onSave(wq); onClose(); }}
          style={{ ...sBt(G.greyDeep),width:"100%",justifyContent:"center",padding:"13px",fontSize:14,marginTop:12 }}>
          保存する
        </button>
      </div>
    </div>
  );
}

// NV①が消えたとき「次のNEXT VIEWを選んでください」プロンプト
function NVChoosePrompt({ queueItems, onSelect, onDismiss }) {
  const FC = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";

  // CAT_CARD bg/fg for category badges (same as HomeScreen)
  const CAT_BADGE = {
    article: { bg:"#DADCD1", fg:"#465135" },
    live:    { bg:"#EDE6D6", fg:"#806C47" },
    youtube: { bg:"#EBE1D8", fg:"#7A624C" },
    radio:   { bg:"#DCE1DF", fg:"#485950" },
    tv:      { bg:"#DFDAD7", fg:"#534946" },
    book:    { bg:"#DADCD1", fg:"#465135" },
    anime:   { bg:"#EDE6D6", fg:"#806C47" },
    drama:   { bg:"#EBE1D8", fg:"#7A624C" },
    movie:   { bg:"#DCE1DF", fg:"#485950" },
    manga:   { bg:"#DFDAD7", fg:"#534946" },
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(34,34,34,0.45)", zIndex:950,
      display:"flex", alignItems:"flex-end" }}>
      <div style={{ background:"#FFFFFF", borderRadius:"22px 22px 0 0", width:"100%",
        maxHeight:"82vh", overflowY:"auto",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",
        fontFamily:FC }}>

        {/* Header */}
        <div style={{ padding:"24px 20px 0", position:"sticky", top:0,
          background:"#FFFFFF", zIndex:1,
          borderBottom:`1px solid #F0EEEC`, paddingBottom:16, marginBottom:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#1A1A1A",
            letterSpacing:"0.06em", marginBottom:6,
            display:"flex", alignItems:"center", gap:8 }}>
            <ICONS.pin/> Next View を選んでください
          </div>
          <p style={{ fontSize:11, fontWeight:400, color:"#8A8A8A",
            margin:0, lineHeight:1.7, letterSpacing:"0.03em" }}>
            Watch Queue ①が進行中になりました。<br/>
            次に見る作品を選んでください。
          </p>
        </div>

        {/* Queue item list */}
        <div style={{ padding:"12px 16px 8px" }}>
          {queueItems.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0",
              fontSize:12, color:"#A0A0A0", letterSpacing:"0.04em" }}>
              「これから」のコンテンツがありません
            </div>
          ) : (
            queueItems.map(item => {
              const badge = CAT_BADGE[item.category] || { bg:"#EBEBEB", fg:"#666" };
              return (
                <button key={item.id} onClick={()=>onSelect(item.id)}
                  style={{
                    width:"100%", display:"flex", alignItems:"center",
                    gap:12, padding:"13px 14px", marginBottom:8,
                    borderRadius:14, border:"1px solid #EBEBEB",
                    background:"#FAFAFA", cursor:"pointer", textAlign:"left",
                    fontFamily:FC,
                  }}>
                  {/* Category badge */}
                  <span style={{
                    flexShrink:0, display:"inline-flex", alignItems:"center", gap:4,
                    background:badge.bg, borderRadius:7, padding:"3px 9px",
                  }}>
                    <CatIco cat={item.category} color={badge.fg}/>
                    <span style={{ fontSize:10, fontWeight:600, color:badge.fg,
                      letterSpacing:"0.04em" }}>
                      {CATS[item.category].label}
                    </span>
                  </span>
                  {/* Title */}
                  <div style={{ flex:1, minWidth:0,
                    fontSize:13, fontWeight:500, color:"#1A1A1A",
                    letterSpacing:"0.03em", lineHeight:1.4,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {item.title}
                  </div>
                  {/* Chevron */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#C0C0C0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink:0 }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              );
            })
          )}
        </div>

        {/* Dismiss button */}
        <div style={{ padding:"4px 16px 48px" }}>
          <button onClick={onDismiss}
            style={{ width:"100%", padding:"12px", borderRadius:12,
              border:"1px solid #E0DEDC", background:"transparent",
              fontSize:12, fontWeight:500, color:"#8A8A8A",
              cursor:"pointer", fontFamily:FC, letterSpacing:"0.04em" }}>
            あとで設定する
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Per-category startedAt label ────────────────────────────────────────────
function startedAtLabel(cat) {
  if (["article","book","manga"].includes(cat)) return "読み始めた日";
  if (cat === "radio") return "聴き始めた日";
  return "視聴開始日"; // live, youtube, tv, anime, drama, movie
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ item, onClose, onSave, onDelete }) {
  const c = CATS[item.category];
  const [f, setF] = useState({ ...item });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));

  // Article URL fetch state (same as AddModal)
  const [articleFetching, setArticleFetching] = useState(false);
  const [articleMinutes, setArticleMinutes]   = useState(null);
  const fetchTimeoutRef = useRef(null);
  const handleArticleUrlChange = (url) => {
    set("articleUrl", url);
    setArticleMinutes(null);
    clearTimeout(fetchTimeoutRef.current);
    if (!url || !url.startsWith("http")) return;
    fetchTimeoutRef.current = setTimeout(async () => {
      setArticleFetching(true);
      const mins = await fetchArticleReadingMin(url);
      setArticleFetching(false);
      setArticleMinutes(mins);
    }, 800);
  };

  const save = () => {
    const cur  = Number(f.current)||0;
    const isBinaryCat = ["youtube","tv","radio","live","article"].includes(f.category);
    const isTimedProgress = ["youtube","tv","radio","live"].includes(f.category);
    // For timed categories, total = totalDurationMin (or videoDurationMin for YouTube)
    const tot = isTimedProgress
      ? (f.category==="youtube"
          ? (Number(f.videoDurationMin)||0)
          : (Number(f.totalDurationMin)||0))
      : (Number(f.total)||1);
    // timed progress: use resolveStatus same as anime/drama
    const newStatus = isTimedProgress
      ? resolveStatus(cur, tot)
      : (isBinaryCat ? (tot > 0 && cur >= tot && cur > 0 ? "done" : f.status) : resolveStatus(cur, tot));
    const newCompletedAt = (newStatus==="done" && f.status!=="done")
      ? (f.completedAt||today()) : (newStatus!=="done" ? null : f.completedAt);
    onSave({
      ...f,
      current:           cur,
      total:             tot,
      episodeMin:        Number(f.episodeMin)||null,
      totalDurationMin:  Number(f.totalDurationMin)||null,
      videoDurationMin:  Number(f.videoDurationMin)||null,
      videoUrl:          f.videoUrl||null,
      articleUrl:        f.articleUrl||null,
      contentUrl:        f.contentUrl||null,
      station:           f.station||null,
      tvStation:         f.tvStation||null,
      tvViewMethod:      f.tvViewMethod||[],
      airDate:           f.airDate||null,
      streamingServices: f.streamingServices||[],
      readingMethod:     f.readingMethod||[],
      startedAt:         f.startedAt||null,
      status:            newStatus,
      completedAt:       newCompletedAt,
      genres:            f.genres||[],
      genreOther:        f.genreOther||"",
      mangaUnit:         f.category==="manga" ? (f.mangaUnit||"巻") : f.mangaUnit,
      artistName:        f.category==="live" ? (f.artistName||null) : f.artistName,
    });
  };

  const isTimed = ["tv","radio","live","movie","youtube"].includes(f.category);
  const isEpBased = ["anime","drama"].includes(f.category);
  const showProgress = !["youtube","article","tv","radio","live","movie"].includes(f.category);

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(34,34,34,0.32)",zIndex:900,display:"flex",alignItems:"flex-end" }}>
      <div style={{ background:G.surface,borderRadius:"22px 22px 0 0",width:"100%",padding:"28px 22px 48px",maxHeight:"86vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.12)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
          <span style={{ fontSize:17,fontWeight:800,color:G.greyDeep,display:"flex",alignItems:"center",gap:8 }}>
            <CatIco cat={item.category} color={dk(c.color)}/> 編集
          </span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:G.greyMid,display:"flex",padding:4 }}><ICONS.close/></button>
        </div>

        <FF label="タイトル"><input style={INP} value={f.title} onChange={e=>set("title",e.target.value)}/></FF>

        {showProgress&&f.category!=="manga"&&(
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
            <div><label style={LBL}>現在 ({c.unit})</label><input type="number" style={INP} value={f.current} onChange={e=>set("current",e.target.value)}/></div>
            <div><label style={LBL}>合計 ({c.unit})</label><input type="number" style={INP} value={f.total} onChange={e=>set("total",e.target.value)}/></div>
          </div>
        )}
        {/* 漫画：単位選択 + 現在/合計 */}
        {f.category==="manga"&&(
          <>
            <div style={{ marginBottom:10 }}>
              <label style={LBL}>単位</label>
              <div style={{ display:"flex", gap:8 }}>
                {["巻","話"].map(u=>(
                  <button key={u} type="button" onClick={()=>set("mangaUnit",u)}
                    style={{ padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F,
                      border:`1.5px solid ${(f.mangaUnit||"巻")===u?CATS.manga.color:G.border}`,
                      background:(f.mangaUnit||"巻")===u?tint(CATS.manga.color):G.surfaceAlt,
                      color:(f.mangaUnit||"巻")===u?dk(CATS.manga.color):G.greyDark }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
              <div><label style={LBL}>現在 ({f.mangaUnit||"巻"})</label><input type="number" style={INP} value={f.current} onChange={e=>set("current",e.target.value)}/></div>
              <div><label style={LBL}>合計 ({f.mangaUnit||"巻"})</label><input type="number" style={INP} value={f.total} onChange={e=>set("total",e.target.value)}/></div>
            </div>
          </>
        )}
        {isEpBased&&<FF label="1話の時間 (分)"><input type="number" style={INP} value={f.episodeMin||""} onChange={e=>set("episodeMin",e.target.value)}/></FF>}
        {(isTimed&&!isEpBased)&&f.category!=="youtube"&&f.category!=="movie"&&(
          <FF label="合計時間 (分)"><input type="number" style={INP} placeholder="例: 120" value={f.totalDurationMin||""} onChange={e=>set("totalDurationMin",e.target.value)}/></FF>
        )}
        {/* Live: アーティスト名 + 現在(分) */}
        {f.category==="live"&&(
          <>
            <FF label="アーティスト名（任意）">
              <input style={INP} placeholder="例: TK from 凛として時雨" value={f.artistName||""} onChange={e=>set("artistName",e.target.value)}/>
            </FF>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
              <div><label style={LBL}>現在 (分)</label><input type="number" style={INP} value={f.current||""} onChange={e=>set("current",e.target.value)} placeholder="0"/></div>
              <div><label style={LBL}>合計時間 (分)</label><input type="number" style={INP} placeholder="例: 120" value={f.totalDurationMin||""} onChange={e=>set("totalDurationMin",e.target.value)}/></div>
            </div>
          </>
        )}
        {f.category==="movie"&&(
          <>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
              <div><label style={LBL}>視聴済み (分)</label><input type="number" style={INP} value={f.current} onChange={e=>set("current",e.target.value)} placeholder="0"/></div>
              <div><label style={LBL}>上映時間 (分)</label><input type="number" style={INP} value={f.episodeMin||""} onChange={e=>set("episodeMin",e.target.value)}/></div>
            </div>
          </>
        )}
        {f.category==="youtube"&&(
          <>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
              <div><label style={LBL}>現在 (分)</label><input type="number" style={INP} value={f.current||""} onChange={e=>set("current",e.target.value)} placeholder="0"/></div>
              <div><label style={LBL}>動画の長さ (分)</label><input type="number" style={INP} placeholder="例: 15" value={f.videoDurationMin||""} onChange={e=>set("videoDurationMin",e.target.value)}/></div>
            </div>
            <FF label="URL"><input style={INP} placeholder="https://youtube.com/watch?v=..." value={f.videoUrl||""} onChange={e=>set("videoUrl",e.target.value)}/></FF>
          </>
        )}
        {(f.category==="anime"||f.category==="drama")&&(
          <FF label="配信サービス">
            <MultiSelect options={STREAMING_OPTIONS} value={f.streamingServices||[]} onChange={v=>set("streamingServices",v)} otherKey="other" otherValue={f.streamingOther||""} onOtherChange={v=>set("streamingOther",v)}/>
          </FF>
        )}
        {f.category==="movie"&&(
          <FF label="視聴方法">
            <MultiSelect options={MOVIE_STREAMING_OPTIONS} value={f.streamingServices||[]} onChange={v=>set("streamingServices",v)} otherKey="other" otherValue={f.streamingOther||""} onOtherChange={v=>set("streamingOther",v)}/>
          </FF>
        )}
        {(f.category==="book"||f.category==="manga")&&(
          <FF label="閲覧方法">
            <MultiSelect
              options={READING_OPTIONS}
              value={f.readingMethod||[]}
              onChange={v=>set("readingMethod",v)}
              otherKey={f.readingMethod?.includes("sub") ? "sub" : f.readingMethod?.includes("other") ? "other" : null}
              otherValue={f.readingMethod?.includes("sub") ? (f.readingSubOther||"") : (f.readingOther||"")}
              onOtherChange={v => f.readingMethod?.includes("sub") ? set("readingSubOther",v) : set("readingOther",v)}
            />
          </FF>
        )}
        {f.category==="radio"&&(
          <>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
              <div><label style={LBL}>現在 (分)</label><input type="number" style={INP} value={f.current||""} onChange={e=>set("current",e.target.value)} placeholder="0"/></div>
              <div><label style={LBL}>合計時間 (分)</label><input type="number" style={INP} placeholder="例: 60" value={f.totalDurationMin||""} onChange={e=>set("totalDurationMin",e.target.value)}/></div>
            </div>
            <FF label="ラジオ局"><input style={INP} placeholder="例: NHK FM" value={f.station||""} onChange={e=>set("station",e.target.value)}/></FF>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5 }}>
                <label style={LBL}>放送日時</label>
                {f.airDate&&<button type="button" onClick={()=>set("airDate","")} style={{ fontSize:10,fontWeight:600,color:G.greyMid,background:"none",border:"none",cursor:"pointer",padding:"0 2px",fontFamily:F }}>× クリア</button>}
              </div>
              <input type="datetime-local" style={INP_DATE} value={f.airDate||""} onChange={e=>set("airDate",e.target.value)}/>
            </div>
            <FF label="URL"><input style={INP} placeholder="https://…" value={f.contentUrl||""} onChange={e=>set("contentUrl",e.target.value)}/></FF>
          </>
        )}
        {f.category==="tv"&&(
          <>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
              <div><label style={LBL}>現在 (分)</label><input type="number" style={INP} value={f.current||""} onChange={e=>set("current",e.target.value)} placeholder="0"/></div>
              <div><label style={LBL}>合計時間 (分)</label><input type="number" style={INP} placeholder="例: 30" value={f.totalDurationMin||""} onChange={e=>set("totalDurationMin",e.target.value)}/></div>
            </div>
            <FF label="テレビ局"><input style={INP} placeholder="例: NHK" value={f.tvStation||""} onChange={e=>set("tvStation",e.target.value)}/></FF>
            <FF label="視聴方法">
              <MultiSelect options={TV_VIEW_OPTIONS} value={f.tvViewMethod||[]} onChange={v=>set("tvViewMethod",v)} otherKey="other" otherValue={f.tvViewOther||""} onOtherChange={v=>set("tvViewOther",v)}/>
            </FF>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5 }}>
                <label style={LBL}>OA日時</label>
                {f.airDate&&<button type="button" onClick={()=>set("airDate","")} style={{ fontSize:10,fontWeight:600,color:G.greyMid,background:"none",border:"none",cursor:"pointer",padding:"0 2px",fontFamily:F }}>× クリア</button>}
              </div>
              <input type="datetime-local" style={INP_DATE} value={f.airDate||""} onChange={e=>set("airDate",e.target.value)}/>
            </div>
            <FF label="URL"><input style={INP} placeholder="https://…" value={f.contentUrl||""} onChange={e=>set("contentUrl",e.target.value)}/></FF>
          </>
        )}
        {["book","anime","drama","movie","manga"].includes(f.category)&&(
          <FF label="URL（任意）"><input style={INP} placeholder="https://…" value={f.contentUrl||""} onChange={e=>set("contentUrl",e.target.value)}/></FF>
        )}
        {f.category==="article"&&(
          <FF label="URL">
            <input style={INP} placeholder="https://…" value={f.articleUrl||""} onChange={e=>handleArticleUrlChange(e.target.value)}/>
            {articleFetching && (
              <div style={{ fontSize:11, color:G.greyMid, marginTop:5, display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ display:"inline-block", width:10, height:10, borderRadius:"50%", border:`2px solid ${G.greyMid}`, borderTopColor:"transparent", animation:"spin .6s linear infinite" }}/>
                文字数を取得中…
              </div>
            )}
            {!articleFetching && articleMinutes && (
              <div style={{ fontSize:11, color:dk(CATS.article.color), marginTop:5, fontWeight:600 }}>
                ✓ 推定読了時間：約{fmtGap(articleMinutes)}
              </div>
            )}
          </FF>
        )}

        <FFDate label={startedAtLabel(f.category)} value={f.startedAt||""} onChange={v=>set("startedAt",v)}/>

        {/* ジャンル選択 */}
        {["tv","book","anime","drama","movie","manga"].includes(f.category)&&(
          <FF label="ジャンル（任意）">
            <MultiSelect
              options={GENRE_OPTIONS}
              value={f.genres||[]}
              onChange={v=>set("genres",v)}
              otherKey="other"
              otherValue={f.genreOther||""}
              onOtherChange={v=>set("genreOther",v)}
            />
          </FF>
        )}
        {f.category==="youtube"&&(
          <FF label="ジャンル（任意）">
            <MultiSelect
              options={YOUTUBE_GENRE_OPTIONS}
              value={f.genres||[]}
              onChange={v=>set("genres",v)}
              otherKey="other"
              otherValue={f.genreOther||""}
              onOtherChange={v=>set("genreOther",v)}
            />
          </FF>
        )}

        <FF label="メモ">
          <textarea style={{ ...INP,minHeight:64,resize:"vertical" }} value={f.notes} onChange={e=>set("notes",e.target.value)}/>
        </FF>

        {/* Status preview — non-binary categories */}
        {!["youtube","tv","radio","live","article"].includes(f.category)&&(()=>{
          const cur=Number(f.current)||0, tot=Number(f.total)||1;
          const newSt=resolveStatus(cur,tot);
          if(newSt!==f.status) return (
            <div style={{ marginBottom:14,padding:"10px 13px",borderRadius:9,background:tint(P.orange),border:`1.5px solid ${P.orange}`,fontSize:12,color:dk(P.orange),lineHeight:1.6 }}>
              ⓘ 保存すると「{statusLabel(newSt)}」に移動します
            </div>
          );
          return null;
        })()}

        {/* Status preview — timed categories (youtube/tv/radio/live) */}
        {["youtube","tv","radio","live"].includes(f.category)&&(()=>{
          const cur = Number(f.current)||0;
          const tot = f.category==="youtube"
            ? (Number(f.videoDurationMin)||0)
            : (Number(f.totalDurationMin)||0);
          if (tot <= 0) return null;
          const newSt = resolveStatus(cur, tot);
          if (newSt !== f.status) return (
            <div style={{ marginBottom:14,padding:"10px 13px",borderRadius:9,background:tint(P.orange),border:`1.5px solid ${P.orange}`,fontSize:12,color:dk(P.orange),lineHeight:1.6 }}>
              ⓘ 保存すると「{statusLabel(newSt)}」に移動します
            </div>
          );
          return null;
        })()}

        <button onClick={save} style={{ ...sBt(c.color),width:"100%",justifyContent:"center",padding:"14px",fontSize:15 }}>保存する</button>

        {/* ── ステータスを戻す（完了ステータスのみ表示） ── */}
        {item.status === "done" && (
          <div style={{ marginTop:14, padding:"14px 16px", borderRadius:12,
            background:G.surfaceAlt, border:`1px solid ${G.border}` }}>
            <div style={{ fontSize:11, fontWeight:600, color:G.greyMid,
              letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>
              ステータスを戻す
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{ onSave({ ...f, status:"active", completedAt:null }); }}
                style={{ flex:1, padding:"11px 6px", borderRadius:9, border:`1px solid ${G.border}`,
                  background:G.surface, color:G.greyDark, fontSize:12, fontWeight:600,
                  cursor:"pointer", fontFamily:F, letterSpacing:"0.03em",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                進行中にする
              </button>
              <button onClick={()=>{ onSave({ ...f, status:"queue", completedAt:null, current:0 }); }}
                style={{ flex:1, padding:"11px 6px", borderRadius:9, border:`1px solid ${G.border}`,
                  background:G.surface, color:G.greyDark, fontSize:12, fontWeight:600,
                  cursor:"pointer", fontFamily:F, letterSpacing:"0.03em",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><polyline points="12 8 8 12 12 16"/><line x1="16" y1="12" x2="8" y2="12"/></svg>
                これからにする
              </button>
            </div>
          </div>
        )}

        {/* Delete section */}
        <div style={{ marginTop:20, paddingTop:18, borderTop:`1.5px solid ${G.border}` }}>
          {!confirmDelete ? (
            <button onClick={()=>setConfirmDelete(true)}
              style={{ width:"100%",padding:"12px",borderRadius:9,border:`1.5px solid ${G.border}`,background:"transparent",color:G.greyMid,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F,letterSpacing:"0.04em" }}>
              このコンテンツを削除する
            </button>
          ) : (
            <div style={{ padding:"14px",borderRadius:11,background:G.surfaceAlt,border:`1.5px solid ${G.border}` }}>
              <div style={{ fontSize:13,fontWeight:700,color:G.greyDeep,marginBottom:10,textAlign:"center" }}>本当に削除しますか？</div>
              <div style={{ fontSize:12,color:G.greyMid,marginBottom:14,textAlign:"center",lineHeight:1.6 }}>「{f.title}」を削除します。この操作は元に戻せません。</div>
              <div style={{ display:"flex",gap:10 }}>
                <button onClick={()=>setConfirmDelete(false)}
                  style={{ flex:1,padding:"11px",borderRadius:9,border:`1.5px solid ${G.border}`,background:G.surface,color:G.greyDark,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F }}>
                  キャンセル
                </button>
                <button onClick={()=>onDelete(item.id)}
                  style={{ flex:1,padding:"11px",borderRadius:9,border:`1.5px solid ${G.borderMid}`,background:G.surfaceAlt,color:G.greyDeep,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F }}>
                  削除する
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({ onClose, onAdd, inlineMode = false, defaultCategory = "anime" }) {
  const [f,setF] = useState({ title:"",category:defaultCategory,total:"",episodeMin:"",totalDurationMin:"",videoDurationMin:"",videoUrl:"",articleUrl:"",contentUrl:"",station:"",tvStation:"",tvViewMethod:[],tvViewOther:"",airDate:"",streamingServices:[],streamingOther:"",readingMethod:[],readingSubOther:"",readingOther:"",startedAt:"",notes:"",genres:[],genreOther:"",mangaUnit:"巻",artistName:"" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const c = CATS[f.category];

  // Article URL fetch state
  const [articleFetching, setArticleFetching] = useState(false);
  const [articleMinutes, setArticleMinutes]   = useState(null); // fetched result
  const fetchTimeoutRef = useRef(null);

  const handleArticleUrlChange = (url) => {
    set("articleUrl", url);
    setArticleMinutes(null);
    clearTimeout(fetchTimeoutRef.current);
    if (!url || !url.startsWith("http")) return;
    // Debounce 800ms after user stops typing
    fetchTimeoutRef.current = setTimeout(async () => {
      setArticleFetching(true);
      const mins = await fetchArticleReadingMin(url);
      setArticleFetching(false);
      setArticleMinutes(mins);
    }, 800);
  };

  const add = () => {
    if(!f.title) return;
    const isTimedCat = ["youtube","tv","radio","live"].includes(f.category);
    const noProgress = ["article"].includes(f.category);
    // timed categories: total = totalDurationMin (or videoDurationMin for YouTube)
    const timedTotal = f.category==="youtube"
      ? (Number(f.videoDurationMin)||0)
      : (Number(f.totalDurationMin)||0);
    const totalVal = isTimedCat
      ? (timedTotal > 0 ? timedTotal : 0)   // 未設定なら0（表示は「未視聴」）
      : f.category==="movie" ? (Number(f.episodeMin)||0)
      : noProgress ? 0
      : (Number(f.total)||0);
    // For article: use fetched minutes if available; if URL provided but fetch failed, use estimate; if no URL, null
    const articleEpisodeMin = articleMinutes
      ? articleMinutes
      : (f.articleUrl && f.articleUrl.startsWith("http") ? estimateReadingMin(f.articleUrl) : null);
    onAdd({
      id:               Date.now(),
      title:            f.title,
      category:         f.category,
      total:            totalVal,
      current:          0,
      priority:         999,
      status:           "queue",
      addedAt:          today(),
      completedAt:      null,
      lastUpdated:      null,
      notes:            f.notes,
      episodeMin:       f.category==="article" ? articleEpisodeMin : Number(f.episodeMin)||null,
      totalDurationMin: Number(f.totalDurationMin)||null,
      videoDurationMin: Number(f.videoDurationMin)||null,
      videoUrl:         f.videoUrl||null,
      articleUrl:       f.articleUrl||null,
      contentUrl:       f.contentUrl||null,
      station:          f.station||null,
      tvStation:        f.tvStation||null,
      tvViewMethod:     f.tvViewMethod||[],
      airDate:          f.airDate||null,
      streamingServices: f.streamingServices||[],
      readingMethod:    f.readingMethod||[],
      readingSubOther:  f.readingSubOther||"",
      readingOther:     f.readingOther||"",
      startedAt:        f.startedAt||null,
      genres:           f.genres||[],
      genreOther:       f.genreOther||"",
      firstActiveAt:    null,
      mangaUnit:        f.category==="manga" ? (f.mangaUnit||"巻") : undefined,
      artistName:       f.category==="live" ? (f.artistName||null) : undefined,
    });
    onClose();
  };

  const isEpBased = ["anime","drama"].includes(f.category);

  const innerContent = (
    <div style={{ background:G.surface, ...(inlineMode ? { borderRadius:0, padding:"0 18px 48px" } : { borderRadius:"22px 22px 0 0", width:"100%", padding:"28px 22px 48px", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 -8px 40px rgba(0,0,0,0.12)" }) }}>
      {!inlineMode && (
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
          <span style={{ fontSize:17,fontWeight:800,color:G.greyDeep }}>新しいコンテンツ</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:G.greyMid,display:"flex",padding:4 }}><ICONS.close/></button>
        </div>
      )}

        {/* カテゴリ選択 — inlineModeでは非表示（AddPageScreenで選択済み） */}
        {!inlineMode && (
          <>
            <label style={LBL}>カテゴリ</label>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18 }}>
              {CAT_KEYS.map(k => {
                const ct=CATS[k];
                return (
                  <button key={k} onClick={()=>set("category",k)}
                    style={{ padding:"11px 8px",borderRadius:11,fontSize:13,fontWeight:700,border:`1.5px solid ${f.category===k?ct.color:G.border}`,background:f.category===k?tint(ct.color):G.surfaceAlt,color:f.category===k?dk(ct.color):G.greyDark,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:7,fontFamily:F }}>
                    <CatIco cat={k} color={f.category===k?dk(ct.color):G.greyMid}/>{ct.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <FF label="タイトル"><input style={INP} placeholder="タイトルを入力…" value={f.title} onChange={e=>set("title",e.target.value)}/></FF>

        {/* Per-category fields */}
        {!["article","youtube","tv","radio","live","movie","manga"].includes(f.category)&&(
          <FF label={`合計 (${c.unit})`}><input type="number" style={INP} placeholder="例: 24" value={f.total} onChange={e=>set("total",e.target.value)}/></FF>
        )}
        {/* 漫画：単位（巻/話）選択 → 数値入力 */}
        {f.category==="manga"&&(
          <div style={{ marginBottom:14 }}>
            <label style={LBL}>単位と合計数</label>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {["巻","話"].map(u=>(
                <button key={u} type="button" onClick={()=>set("mangaUnit",u)}
                  style={{ padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F,
                    border:`1.5px solid ${(f.mangaUnit||"巻")===u?CATS.manga.color:G.border}`,
                    background:(f.mangaUnit||"巻")===u?tint(CATS.manga.color):G.surfaceAlt,
                    color:(f.mangaUnit||"巻")===u?dk(CATS.manga.color):G.greyDark }}>
                  {u}
                </button>
              ))}
              <input type="number" style={{ ...INP, flex:1 }} placeholder={`例: ${(f.mangaUnit||"巻")==="巻"?"14":"143"}`}
                value={f.total} onChange={e=>set("total",e.target.value)}/>
            </div>
          </div>
        )}
        {isEpBased&&<FF label="1話の時間 (分)"><input type="number" style={INP} placeholder="例: 24" value={f.episodeMin} onChange={e=>set("episodeMin",e.target.value)}/></FF>}
        {(["live","tv","radio"].includes(f.category))&&(
          <FF label="合計時間 (分)"><input type="number" style={INP} placeholder="例: 120" value={f.totalDurationMin} onChange={e=>set("totalDurationMin",e.target.value)}/></FF>
        )}
        {f.category==="movie"&&<FF label="上映時間 (分)"><input type="number" style={INP} placeholder="例: 169" value={f.episodeMin} onChange={e=>set("episodeMin",e.target.value)}/></FF>}
        {f.category==="youtube"&&(
          <>
            <FF label="動画の長さ (分)"><input type="number" style={INP} placeholder="例: 15" value={f.videoDurationMin} onChange={e=>set("videoDurationMin",e.target.value)}/></FF>
            <FF label="URL"><input style={INP} placeholder="https://youtube.com/watch?v=..." value={f.videoUrl} onChange={e=>set("videoUrl",e.target.value)}/></FF>
          </>
        )}
        {(f.category==="anime"||f.category==="drama")&&(
          <FF label="配信サービス">
            <MultiSelect
              options={STREAMING_OPTIONS}
              value={f.streamingServices}
              onChange={v=>set("streamingServices",v)}
              otherKey="other"
              otherValue={f.streamingOther}
              onOtherChange={v=>set("streamingOther",v)}
            />
          </FF>
        )}
        {f.category==="movie"&&(
          <FF label="視聴方法">
            <MultiSelect
              options={MOVIE_STREAMING_OPTIONS}
              value={f.streamingServices}
              onChange={v=>set("streamingServices",v)}
              otherKey="other"
              otherValue={f.streamingOther}
              onOtherChange={v=>set("streamingOther",v)}
            />
          </FF>
        )}
        {(f.category==="book"||f.category==="manga")&&(
          <FF label="閲覧方法">
            <MultiSelect
              options={READING_OPTIONS}
              value={f.readingMethod}
              onChange={v=>set("readingMethod",v)}
              otherKey={f.readingMethod?.includes("sub") ? "sub" : f.readingMethod?.includes("other") ? "other" : null}
              otherValue={f.readingMethod?.includes("sub") ? f.readingSubOther : f.readingOther}
              onOtherChange={v => f.readingMethod?.includes("sub") ? set("readingSubOther",v) : set("readingOther",v)}
            />
          </FF>
        )}
        {f.category==="radio"&&(
          <>
            <FF label="ラジオ局"><input style={INP} placeholder="例: NHK FM" value={f.station} onChange={e=>set("station",e.target.value)}/></FF>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5 }}>
                <label style={LBL}>放送日時</label>
                {f.airDate&&<button type="button" onClick={()=>set("airDate","")} style={{ fontSize:10,fontWeight:600,color:G.greyMid,background:"none",border:"none",cursor:"pointer",padding:"0 2px",fontFamily:F }}>× クリア</button>}
              </div>
              <input type="datetime-local" style={INP_DATE} value={f.airDate} onChange={e=>set("airDate",e.target.value)}/>
            </div>
            <FF label="URL（任意）"><input style={INP} placeholder="https://…" value={f.contentUrl} onChange={e=>set("contentUrl",e.target.value)}/></FF>
          </>
        )}
        {f.category==="live"&&(
          <FF label="アーティスト名（任意）">
            <input style={INP} placeholder="例: TK from 凛として時雨" value={f.artistName||""} onChange={e=>set("artistName",e.target.value)}/>
          </FF>
        )}
        {f.category==="tv"&&(
          <>
            <FF label="テレビ局（任意）"><input style={INP} placeholder="例: NHK" value={f.tvStation} onChange={e=>set("tvStation",e.target.value)}/></FF>
            <FF label="視聴方法">
              <MultiSelect options={TV_VIEW_OPTIONS} value={f.tvViewMethod} onChange={v=>set("tvViewMethod",v)} otherKey="other" otherValue={f.tvViewOther} onOtherChange={v=>set("tvViewOther",v)}/>
            </FF>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5 }}>
                <label style={LBL}>OA日時（任意）</label>
                {f.airDate&&<button type="button" onClick={()=>set("airDate","")} style={{ fontSize:10,fontWeight:600,color:G.greyMid,background:"none",border:"none",cursor:"pointer",padding:"0 2px",fontFamily:F }}>× クリア</button>}
              </div>
              <input type="datetime-local" style={INP_DATE} value={f.airDate} onChange={e=>set("airDate",e.target.value)}/>
            </div>
            <FF label="URL（任意）"><input style={INP} placeholder="https://…" value={f.contentUrl} onChange={e=>set("contentUrl",e.target.value)}/></FF>
          </>
        )}
        {["book","anime","drama","movie","manga"].includes(f.category)&&(
          <FF label="URL（任意）"><input style={INP} placeholder="https://…" value={f.contentUrl} onChange={e=>set("contentUrl",e.target.value)}/></FF>
        )}
        {f.category==="article"&&(
          <FF label="URL">
            <input style={INP} placeholder="https://…" value={f.articleUrl} onChange={e=>handleArticleUrlChange(e.target.value)}/>
            {articleFetching && (
              <div style={{ fontSize:11, color:G.greyMid, marginTop:5, display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ display:"inline-block", width:10, height:10, borderRadius:"50%", border:`2px solid ${G.greyMid}`, borderTopColor:"transparent", animation:"spin .6s linear infinite" }}/>
                文字数を取得中…
              </div>
            )}
            {!articleFetching && articleMinutes && (
              <div style={{ fontSize:11, color:dk(CATS.article.color), marginTop:5, fontWeight:600 }}>
                ✓ 推定読了時間：約{fmtGap(articleMinutes)}
              </div>
            )}
          </FF>
        )}
        <FFDate label={`${startedAtLabel(f.category)}（任意）`} value={f.startedAt||""} onChange={v=>set("startedAt",v)}/>
        {/* ジャンル選択 */}
        {["tv","book","anime","drama","movie","manga"].includes(f.category)&&(
          <FF label="ジャンル（任意）">
            <MultiSelect
              options={GENRE_OPTIONS}
              value={f.genres||[]}
              onChange={v=>set("genres",v)}
              otherKey="other"
              otherValue={f.genreOther||""}
              onOtherChange={v=>set("genreOther",v)}
            />
          </FF>
        )}
        {f.category==="youtube"&&(
          <FF label="ジャンル（任意）">
            <MultiSelect
              options={YOUTUBE_GENRE_OPTIONS}
              value={f.genres||[]}
              onChange={v=>set("genres",v)}
              otherKey="other"
              otherValue={f.genreOther||""}
              onOtherChange={v=>set("genreOther",v)}
            />
          </FF>
        )}
        <FF label="メモ（任意）">
          <input style={INP} placeholder="メモ…" value={f.notes} onChange={e=>set("notes",e.target.value)}/>
        </FF>

        <button onClick={add} style={{ ...sBt(c.color),width:"100%",justifyContent:"center",padding:"14px",fontSize:15 }}>追加する</button>
    </div>
  );

  if (inlineMode) return innerContent;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(34,34,34,0.32)",zIndex:900,display:"flex",alignItems:"flex-end" }}>
      {innerContent}
    </div>
  );
}

// ─── Data Modal ───────────────────────────────────────────────────────────────
// ─── URL Button — opens directly in new tab, no confirmation ─────────────────
function UrlButton({ url, color, label="URLを開く" }) {
  if (!url) return null;
  const handleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // iOS PWAでtarget="_blank"が無視されるためwindow.openで強制外部起動
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <a href={url} onClick={handleOpen}
      style={{ fontSize:12, color:dk(color), fontWeight:600, display:"inline-flex", alignItems:"center", gap:4, textDecoration:"none", background:tint(color), borderRadius:7, padding:"3px 10px" }}>
      <ICONS.link/> {label}
    </a>
  );
}

// ─── Past Record Modal ────────────────────────────────────────────────────────
function PastRecordModal({ item, onSave, onClose }) {
  const c = CATS[item.category];
  const isBinary = ["youtube","tv","radio","live","article"].includes(item.category);
  const effectiveUnit = item.category === "manga" ? (item.mangaUnit || "巻") : c.unit;
  // Yesterday as default date
  const yesterday = (() => { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })();
  const [date, setDate] = useState(yesterday);
  const [amount, setAmount] = useState(isBinary ? 1 : "");

  // Amount presets for quick tap
  const presets = item.category==="book" ? [10,20,50,100]
    : item.category==="manga" ? [1,2,3,5]
    : (item.category==="anime"||item.category==="drama") ? [1,2,3]
    : item.category==="movie" ? [10,30,60]
    : [];

  const save = () => {
    const amt = Number(amount);
    if (!date || (amt <= 0 && !isBinary)) return;
    onSave({ date, amount: isBinary ? 1 : amt });
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(34,34,34,0.32)",zIndex:910,display:"flex",alignItems:"flex-end" }}>
      <div style={{ background:G.surface,borderRadius:"22px 22px 0 0",width:"100%",padding:"26px 20px 44px",boxShadow:"0 -8px 40px rgba(0,0,0,0.12)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <span style={{ fontSize:16,fontWeight:800,color:G.greyDeep,display:"flex",alignItems:"center",gap:7 }}>
            <ICONS.calendar/> 過去の記録
          </span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:G.greyMid,display:"flex",padding:4 }}><ICONS.close/></button>
        </div>
        <div style={{ fontSize:12,color:G.greyMid,marginBottom:18,lineHeight:1.6 }}>
          「{item.title}」の記録を指定した日付で追加します。
        </div>

        {/* Date picker */}
        <FF label="記録日">
          <input type="date" style={INP_DATE}
            value={date} max={today()} onChange={e=>setDate(e.target.value)}/>
        </FF>

        {/* Amount — hidden for binary categories */}
        {!isBinary && (
          <FF label={`記録量 (${effectiveUnit})`}>
            <input type="number" style={INP} placeholder={`例: ${item.category==="book"?10:1}`}
              min="1" value={amount} onChange={e=>setAmount(e.target.value)}/>
            {presets.length > 0 && (
              <div style={{ display:"flex", gap:7, marginTop:8, flexWrap:"wrap" }}>
                {presets.map(p => (
                  <button key={p} onClick={()=>setAmount(p)}
                    style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600,
                      border:`1.5px solid ${amount===p||Number(amount)===p?c.color:G.border}`,
                      background:Number(amount)===p?tint(c.color):G.surfaceAlt,
                      color:Number(amount)===p?dk(c.color):G.greyDark,cursor:"pointer",fontFamily:F }}>
                    +{p}{effectiveUnit}
                  </button>
                ))}
              </div>
            )}
          </FF>
        )}
        {isBinary && (
          <div style={{ padding:"11px 13px",borderRadius:9,background:G.surfaceAlt,fontSize:12,color:G.greyMid,marginBottom:14,lineHeight:1.6 }}>
            この日に完了・視聴したとして記録されます。
          </div>
        )}

        <button onClick={save}
          style={{ ...sBt(c.color),width:"100%",justifyContent:"center",padding:"13px",fontSize:14,marginTop:4 }}>
          <ICONS.check/> 記録する
        </button>
      </div>
    </div>
  );
}

// ─── Item Card ─────────────────────────────────────────────────────────────────
function ItemCard({ item, onUpdate, onEdit, onMove, nvIndex, onActivityLog, onStatusChange, removeActivityLog }) {
  const isNext = nvIndex === 0;
  const c = CATS[item.category];
  const p = pct(item.current, item.total);
  const rem = item.total - item.current;
  const [toast,setToast]             = useState(null);
  const [timerOpen,setTimerOpen]     = useState(false);
  const [memoOpen,setMemoOpen]       = useState(false);
  const [showConfetti,setShowConfetti] = useState(false);
  const [pastRecordOpen,setPastRecord] = useState(false);
  const hasNotes = item.notes && item.notes.trim().length > 0;

  const handlePastRecord = ({ date, amount }) => {
    const nx = Math.min(item.total, item.current + amount);
    const newSt = resolveStatus(nx, item.total);
    const histEntry = { date, delta: nx - item.current, from: item.current, to: nx };
    const patch = { current: nx, lastUpdated: date, status: newSt,
      progressHistory: [...(item.progressHistory||[]), histEntry] };
    onActivityLog(date, item.category);
    if (nx >= item.total) Object.assign(patch, { status:"done", completedAt: date, current: item.total });
    onUpdate(item.id, patch);
    setPastRecord(false);
    setToast(`${date} の記録を追加しました`);
    if (nx >= item.total) { setShowConfetti(true); }
  };

  const totalMin =
    (item.category==="anime"||item.category==="drama")&&item.episodeMin ? rem*item.episodeMin :
    item.category==="movie"&&item.episodeMin ? item.episodeMin*(1-p/100) :
    (item.category==="live"||item.category==="tv"||item.category==="radio")&&item.totalDurationMin ? item.totalDurationMin :
    item.category==="youtube"&&item.videoDurationMin ? item.videoDurationMin :
    item.category==="article" ? (item.episodeMin ? item.episodeMin*rem : null) : null;

  // 漫画は mangaUnit フィールドで単位が変わる
  const effectiveUnit = item.category === "manga" ? (item.mangaUnit || "巻") : c.unit;

  const isTimedProgress = ["youtube","tv","radio","live"].includes(item.category);
  const qa = (item.category==="anime"||item.category==="drama") ? 1
    : item.category==="book" ? 10
    : item.category==="manga" ? 1
    : isTimedProgress ? 10  // +10分
    : item.category==="movie" ? 10
    : 1;
  const ql = (item.category==="anime"||item.category==="drama") ? "+1話"
    : item.category==="book" ? "+10P"
    : item.category==="manga" ? `+1${effectiveUnit}`
    : isTimedProgress ? "+10分"
    : item.category==="movie" ? "+10分"
    : item.category==="live" ? "+1曲"
    : "読了";

  const quickAdd = (amt) => {
    const nx = Math.min(item.total, item.current+amt);
    const newSt = resolveStatus(nx, item.total);
    const histEntry = { date:today(), delta:nx-item.current, from:item.current, to:nx };
    const patch = { current:nx, lastUpdated:today(), status:newSt,
      progressHistory:[...(item.progressHistory||[]), histEntry] };
    // ③ 初めて進行中になった日を記録
    if (newSt === "active" && item.status === "queue" && !item.firstActiveAt) {
      patch.firstActiveAt = today();
    }
    // timed（Live/YouTube/Radio/TV）は+10分タップごとにはActivityLog記録しない（完了時のみ1回）
    if (!isTimedProgress) {
      onActivityLog(today(), item.category);
    }
    if (newSt === "active" && item.status === "queue") onStatusChange && onStatusChange(item.id, "active");
    if (nx >= item.total) {
      Object.assign(patch, { status:"done", completedAt:today(), current:item.total });
      // timed: 完了時に1回記録
      if (isTimedProgress) onActivityLog(today(), item.category);
      onUpdate(item.id, patch);
      setToast("完了！おめでとうございます 🎉");
      setShowConfetti(true);
    } else {
      onUpdate(item.id,patch);
      if((item.category==="anime"||item.category==="drama")&&item.episodeMin) setToast(`次は第${Math.floor(nx)+1}話。今から始めると ${finAt(item.episodeMin)} に終わります`);
      else if(item.category==="article") setToast("読了を記録しました");
      else if(["youtube","tv","radio"].includes(item.category)) {
        const newMin = nx;
        const totalMin2 = item.total;
        if (totalMin2 > 0) setToast(`${newMin}分 / ${totalMin2}分 記録しました`);
        else setToast(`+${qa}分 記録しました`);
      }
      else setToast(`${ql} を記録しました`);
    }
  };

  const completeCelebrate = () => {
    // timed（Live/YouTube/Radio/TV）は完了で1回のみ。その他は残量分ループ
    const logCount = isTimedProgress ? 1 : (isBinary ? 1 : Math.max(rem, 1));
    for (let i = 0; i < logCount; i++) {
      onActivityLog(today(), item.category);
    }
    // progressHistory にも完了エントリを追記
    const histEntry = { date:today(), delta:rem, from:item.current, to:item.total, completedViaButton:true };
    const patch = { progressHistory: [...(item.progressHistory||[]), histEntry] };
    // ③ queue から直接完了にした場合も firstActiveAt を記録
    if (!item.firstActiveAt && item.status === "queue") {
      patch.firstActiveAt = today();
    }
    onUpdate(item.id, patch);
    onMove(item.id, "done");
    setToast("完了！おめでとうございます 🎉");
    setShowConfetti(true);
  };
  const isYT    = item.category==="youtube";
  const isTV    = item.category==="tv";
  const isRadio = item.category==="radio";
  const isBinary = ["youtube","tv","radio","live","article"].includes(item.category);

  // ③ Duration label: firstActiveAt（初めて進行中になった日）→ completedAt
  //    firstActiveAt がない場合は startedAt にフォールバック
  const durationDays = (() => {
    const start = item.firstActiveAt || item.startedAt;
    if (!start) return null;
    const end = item.completedAt || (item.status==="active" ? today() : null);
    if (!end) return null;
    return daysBetween(start, end);
  })();

  // Streaming service labels to display
  const streamingOpts = item.category === "movie" ? MOVIE_STREAMING_OPTIONS : STREAMING_OPTIONS;
  const streamingLabels = (item.streamingServices||[]).map(k => {
    if (k === "other") return item.streamingOther || "その他";
    return streamingOpts.find(o=>o.key===k)?.label || k;
  }).filter(Boolean);

  // Reading method labels to display
  const readingLabels = (item.readingMethod||[]).map(k => {
    if (k === "sub")   return item.readingSubOther || "サブスク";
    if (k === "other") return item.readingOther    || "その他";
    return READING_OPTIONS.find(o=>o.key===k)?.label || k;
  }).filter(Boolean);

  // Genre labels to display
  const genreOpts = item.category === "youtube" ? YOUTUBE_GENRE_OPTIONS : GENRE_OPTIONS;
  const genreLabels = (item.genres||[]).map(k => {
    if (k === "other") return item.genreOther || "その他";
    return genreOpts.find(o=>o.key===k)?.label || k;
  }).filter(Boolean);

  return (
    <div style={{ background:G.surface,border:`1.5px solid ${isNext?c.color:G.border}`,borderRadius:10,padding:"11px 12px 10px",marginBottom:6,boxShadow:isNext?`0 0 0 3px ${tint(c.color)},0 2px 10px rgba(0,0,0,0.05)`:"0 1px 3px rgba(0,0,0,0.04)",transition:"box-shadow .2s" }}>
      {nvIndex >= 0 && (
        <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:7 }}>
          <span style={{ fontSize:13, fontWeight:400, color:dk(c.color), lineHeight:1, fontFamily:"system-ui,sans-serif" }}>{NV_NUMS[nvIndex]}</span>
          {nvIndex === 0 && <span style={{ fontSize:9,fontWeight:800,color:dk(c.color),letterSpacing:"0.1em",textTransform:"uppercase" }}>Next View</span>}
          {nvIndex > 0 && <span style={{ fontSize:9,fontWeight:600,color:G.greyMid,letterSpacing:"0.06em" }}>Watch Queue</span>}        </div>
      )}

      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10 }}>
        <div style={{ flex:1 }}>
          <CatTag catKey={item.category}/>
          <div style={{ fontSize:13,fontWeight:800,color:G.greyDeep,lineHeight:1.35,marginTop:5 }}>{item.title}</div>

          {/* Sub-info row: duration, URL, station, airDate */}
          {(isYT||isTV||isRadio)&&(
            <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap" }}>
              {(item.videoDurationMin||item.totalDurationMin)&&(
                <span style={{ fontSize:12,color:G.greyMid,display:"flex",alignItems:"center",gap:4 }}>
                  <ICONS.clock/> {fmtGap(item.videoDurationMin||item.totalDurationMin)}
                </span>
              )}
              {isRadio&&item.station&&(
                <span style={{ fontSize:12,color:dk(c.color),fontWeight:600,display:"inline-flex",alignItems:"center",gap:4,background:tint(c.color),borderRadius:7,padding:"3px 9px" }}>
                  <ICONS.antenna/> {item.station}
                </span>
              )}
              {isTV&&item.tvStation&&(
                <span style={{ fontSize:12,color:dk(c.color),fontWeight:600,display:"inline-flex",alignItems:"center",gap:4,background:tint(c.color),borderRadius:7,padding:"3px 9px" }}>
                  <ICONS.tv/> {item.tvStation}
                </span>
              )}
              {(isTV||isRadio)&&item.airDate&&(
                <span style={{ fontSize:11,color:G.greyMid,display:"flex",alignItems:"center",gap:4 }}>
                  <ICONS.calendar/> {item.airDate.replace("T"," ").slice(0,16)}
                </span>
              )}
              {isYT&&item.videoUrl&&(
                <UrlButton url={item.videoUrl} color={c.color} label="URLを開く"/>
              )}
            </div>
          )}
          {/* TV view method chips */}
          {isTV&&(item.tvViewMethod||[]).length>0&&(
            <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginTop:8 }}>
              {(item.tvViewMethod||[]).map((k,i) => {
                const lbl = k==="other" ? (item.tvViewOther||"その他") : TV_VIEW_OPTIONS.find(o=>o.key===k)?.label||k;
                return <span key={i} style={{ fontSize:10,fontWeight:600,color:dk(c.color),background:tint(c.color),borderRadius:5,padding:"2px 7px" }}>{lbl}</span>;
              })}
            </div>
          )}

          {/* Article / generic content URL button */}
          {item.category==="article"&&item.articleUrl&&(
            <div style={{ marginTop:8 }}>
              <UrlButton url={item.articleUrl} color={c.color} label="URLを開く"/>
            </div>
          )}
          {item.contentUrl&&(
            <div style={{ marginTop:8 }}>
              <UrlButton url={item.contentUrl} color={c.color} label="URLを開く"/>
            </div>
          )}

          {/* Streaming service chips */}
          {streamingLabels.length>0&&(
            <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginTop:8 }}>
              {streamingLabels.map((l,i) => (
                <span key={i} style={{ fontSize:10,fontWeight:600,color:dk(c.color),background:tint(c.color),borderRadius:5,padding:"2px 7px" }}>{l}</span>
              ))}
            </div>
          )}

          {/* Reading method chips */}
          {readingLabels.length>0&&(
            <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginTop:8 }}>
              {readingLabels.map((l,i) => (
                <span key={i} style={{ fontSize:10,fontWeight:600,color:dk(c.color),background:tint(c.color),borderRadius:5,padding:"2px 7px" }}>{l}</span>
              ))}
            </div>
          )}

          {/* Genre chips */}
          {genreLabels.length>0&&(
            <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginTop:8 }}>
              {genreLabels.map((l,i) => (
                <span key={i} style={{ fontSize:10,fontWeight:500,color:G.greyDark,background:G.surfaceAlt,border:`1px solid ${G.border}`,borderRadius:5,padding:"2px 7px" }}>{l}</span>
              ))}
            </div>
          )}

          {/* startedAt + duration */}
          {item.startedAt&&(
            <div style={{ fontSize:11,color:"#767676",marginTop:8,display:"flex",alignItems:"center",gap:4 }}>
              <ICONS.clock/>
              {item.startedAt} 開始
              {durationDays&&<span style={{ marginLeft:4,fontWeight:600,color:"#767676" }}>（{durationDays}日{item.status==="active"?"経過":"かけて完了"}）</span>}
            </div>
          )}

          {/* 中断中 badge + メモあり — always stacked vertically */}
          {(isBinary&&item.status==="active" || hasNotes) && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:6, marginTop:8 }}>
              {isBinary&&item.status==="active"&&(
                <div style={{ display:"inline-flex",alignItems:"center",gap:4,background:"#F0EFED",border:"1px solid #DCDAD7",borderRadius:6,padding:"3px 8px" }}>
                  <div style={{ width:4,height:4,borderRadius:"50%",background:"#BCBAB6" }}/>
                  <span style={{ fontSize:10,fontWeight:600,color:"#8A8885" }}>中断中</span>
                </div>
              )}
              {hasNotes&&(
                <button onClick={()=>setMemoOpen(true)}
                  style={{ background:"none",border:"none",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,padding:0,fontFamily:F,color:G.greyMid }}>
                  <ICONS.memo/>
                  <span style={{ fontSize:10,color:G.greyMid,fontWeight:600,textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:2 }}>メモあり</span>
                </button>
              )}
            </div>
          )}
        </div>
        <button onClick={()=>onEdit(item)} style={{ background:G.surfaceAlt,border:`1.5px solid ${G.border}`,borderRadius:7,width:30,height:30,cursor:"pointer",color:G.greyMid,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <ICONS.pencil/>
        </button>
      </div>

      {/* Progress */}
      <div style={{ marginTop:10 }}>
        {isBinary ? (
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:G.greyMid }}>
            <span style={{ fontWeight:700,color:item.status==="done"?dk("#B6BF99"):G.greyDeep,display:"flex",alignItems:"center",gap:5 }}>
              {item.category==="live" ? (
                item.status==="done"  ? <><ICONS.check/> 視聴済み</> :
                item.status==="active"? <><ICONS.music/> 進行中</> :
                                        <><ICONS.hourglass/> これから</>
              ) : item.category==="article" ? (
                item.status==="done" ? <><ICONS.check/> 読了済み</> : "未読"
              ) : (
                item.status==="done" ? <><ICONS.check/> 視聴済み</> :
                // Show current/total minutes when available
                (item.total > 0
                  ? <span style={{ fontWeight:700,color:G.greyDeep }}>{item.current||0} / {item.total} 分</span>
                  : "未視聴")
              )}
            </span>
            {/* % when total is set */}
            {isTimedProgress && item.total > 0 && item.status !== "done" && (
              <span style={{ fontWeight:800,color:dk(c.color) }}>
              </span>
            )}
            {item.category==="article"&&item.episodeMin&&item.articleUrl&&<span>約{item.episodeMin}分で読了</span>}
            {isTV&&item.total>0&&!isTimedProgress&&<span>約{fmtGap(item.total)}</span>}
            {isRadio&&item.total>0&&!isTimedProgress&&<span>約{fmtGap(item.total)}</span>}
          </div>
        ) : (
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:13 }}>
            <span style={{ fontWeight:700,color:G.greyDeep }}>{item.current} / {item.total} {effectiveUnit}</span>
          </div>
        )}
        {/* ProgressBar: timed binary use actual %, live uses status-based */}
        <ProgressBar
          value={item.category==="live"
            ? (item.status==="done"?100:item.status==="active"?50:0)
            : isTimedProgress && item.total > 0
              ? Math.round((item.current||0)/item.total*100)
              : p}
          color={c.color}
        />
        {totalMin!=null&&rem>0&&!["live","tv","radio","youtube"].includes(item.category)&&(
          <div style={{ fontSize:11,color:G.greyMid,marginTop:3 }}>
            あと{fmtGap(totalMin)}
            {/* hint only for episodic/page-based content */}
            {!["movie","article"].includes(item.category) && `（${hint(totalMin)}）`}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display:"flex",gap:6,marginTop:9,flexWrap:"wrap" }}>
        {/* Primary quick-add — +10分 for timed binary, +1話 etc for others */}
        {item.status!=="done" && item.category!=="live" && (
          <button onClick={()=>quickAdd(qa)} style={sBt(c.color)}>{ql}</button>
        )}
        {/* +10分 for live too (was previously no quickAdd for live) */}
        {item.status!=="done" && item.category==="live" && item.total > 0 && (
          <button onClick={()=>quickAdd(10)} style={sBt(c.color)}>+10分</button>
        )}
        {/* 5min timer — not for binary-quick categories */}
        {item.status!=="done" && !["youtube","article","tv","radio","live"].includes(item.category) && (
          <button onClick={()=>setTimerOpen(t=>!t)} style={oBt(G.grey,G.greyDark)}><ICONS.clock/> 5分</button>
        )}
        {/* 過去の記録 — for all non-done items with quantifiable progress */}
        {item.status!=="done" && (
          <button onClick={()=>setPastRecord(true)} style={gBt()}>
            <ICONS.calendar/> 過去の記録
          </button>
        )}

        {/* ── live ── */}
        {item.category==="live" && item.status==="queue" && (
          <>
            <button onClick={()=>{ onActivityLog(today(), item.category); onMove(item.id,"active"); }}
              style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
              <ICONS.play/>進行中にする
            </button>
            <button onClick={completeCelebrate} style={{ ...gBt(), fontSize:11, padding:"7px 11px" }}><ICONS.check/>完了にする</button>
          </>
        )}
        {item.category==="live" && item.status==="active" && (
          <>
            <button onClick={()=>{
              removeActivityLog && removeActivityLog(item.lastUpdated||today(), item.category);
              const hist = [...(item.progressHistory||[])]; hist.pop();
              onUpdate(item.id, { progressHistory: hist });
              onMove(item.id,"queue");
            }}
              style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
              これからにする
            </button>
            <button onClick={completeCelebrate} style={{ ...gBt(), fontSize:11, padding:"7px 11px" }}><ICONS.check/>完了にする</button>
          </>
        )}
        {item.category==="live" && item.status==="done" && (
          <>
            <button onClick={()=>onMove(item.id,"active")}
              style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
              <ICONS.play/>進行中に戻す
            </button>
            <button onClick={()=>{
              removeActivityLog && removeActivityLog(item.completedAt||today(), item.category);
              const hist = [...(item.progressHistory||[])]; hist.pop();
              onUpdate(item.id, { progressHistory: hist });
              onMove(item.id,"queue");
            }}
              style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
              これからに戻す
            </button>
          </>
        )}

        {/* ── article ── */}
        {item.category==="article" && item.status==="queue" && (
          <button onClick={()=>{ onActivityLog(today(), item.category); onMove(item.id,"active"); }}
            style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
            <ICONS.play/>進行中にする
          </button>
        )}
        {item.category==="article" && item.status==="active" && (
          <>
            <button onClick={()=>{
              removeActivityLog && removeActivityLog(item.lastUpdated||today(), item.category);
              const hist = [...(item.progressHistory||[])]; hist.pop();
              onUpdate(item.id, { progressHistory: hist });
              onMove(item.id,"queue");
            }}
              style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
              これからにする
            </button>
            <button onClick={completeCelebrate} style={{ ...gBt(), fontSize:11, padding:"7px 11px" }}><ICONS.check/>完了にする</button>
          </>
        )}
        {item.category==="article" && item.status==="done" && (
          <>
            <button onClick={()=>onMove(item.id,"active")}
              style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
              <ICONS.play/>進行中に戻す
            </button>
            <button onClick={()=>{
              removeActivityLog && removeActivityLog(item.completedAt||today(), item.category);
              const hist = [...(item.progressHistory||[])]; hist.pop();
              onUpdate(item.id, { progressHistory: hist });
              onMove(item.id,"queue");
            }}
              style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
              これからに戻す
            </button>
          </>
        )}

        {/* ── other binary (youtube/tv/radio) ── */}
        {isBinary && !["live","article"].includes(item.category) && item.status==="queue" && (
          <button onClick={()=>{ onActivityLog(today(), item.category); onMove(item.id,"active"); }}
            style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
            <ICONS.play/>進行中にする
          </button>
        )}
        {isBinary && !["live","article"].includes(item.category) && item.status==="active" && (
          <button onClick={completeCelebrate} style={{ ...gBt(), fontSize:11, padding:"7px 11px" }}><ICONS.check/>完了にする</button>
        )}

        {/* ── non-binary ── */}
        {!isBinary && item.status==="queue" && (
          <button onClick={()=>{ onActivityLog(today(), item.category); onMove(item.id,"active"); }}
            style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
            <ICONS.play/>開始
          </button>
        )}
        {!isBinary && item.status==="active" && (
          <button onClick={completeCelebrate} style={{ ...gBt(), fontSize:11, padding:"7px 11px" }}><ICONS.check/>完了にする</button>
        )}
      </div>
      {timerOpen&&<Timer color={c.color} onComplete={()=>{ setToast("5分経過！記録を開始しました"); onActivityLog(today(), item.category); onUpdate(item.id,{ lastUpdated:today(),status:item.status==="queue"?"active":item.status }); }}/>}
      {toast&&<Toast msg={toast} onHide={()=>setToast(null)}/>}
      {memoOpen&&<MemoPopup text={item.notes} onClose={()=>setMemoOpen(false)}/>}
      {showConfetti&&<Confetti onDone={()=>setShowConfetti(false)}/>}
      {pastRecordOpen&&<PastRecordModal item={item} onSave={handlePastRecord} onClose={()=>setPastRecord(false)}/>}

      <div style={{ display:"flex",gap:10,marginTop:8,fontSize:9,color:"#BFBFBF",flexWrap:"wrap",lineHeight:1.5 }}>
        <span>追加: {item.addedAt}</span>
        {item.lastUpdated&&<span>更新: {item.lastUpdated}</span>}
        {item.completedAt&&<span>完了: {item.completedAt}</span>}
      </div>
    </div>
  );
}

// ─── ContentDetail — 画面2-② コンテンツ詳細（進捗履歴）─────────────────────
function ContentDetail({ item, items, activityLog, onBack,
  onUpdate, onActivityLog, removeActivityLog }) {
  const FC = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";
  const [actionSheet, setActionSheet] = useState(null); // { histIdx, hist }
  const [toast, setToast] = useState(null);

  if (!item) return (
    <div style={{ textAlign:"center", padding:"40px 20px", color:"#A0A0A0",
      fontFamily:FC, fontSize:13 }}>
      コンテンツが見つかりません
      <br/>
      <button onClick={onBack}
        style={{ marginTop:16, background:"none", border:"1px solid #E0DEDC",
          borderRadius:10, padding:"8px 18px", cursor:"pointer",
          fontFamily:FC, fontSize:12, color:"#6A625A" }}>
        戻る
      </button>
    </div>
  );

  const c    = CATS[item.category];
  const unit = item.category === "manga" ? (item.mangaUnit || "巻") : c?.unit || "";
  const pct  = item.total > 0 ? Math.round(item.current / item.total * 100) : 0;

  // 履歴を昇順（古い→新しい）
  const history = [...(item.progressHistory || [])].sort((a,b) =>
    (a.date||"").localeCompare(b.date||"")
  );

  // Category badge colors
  const CAT_BADGE_BG = {
    article:"#DADCD1",live:"#EDE6D6",youtube:"#EBE1D8",radio:"#DCE1DF",
    tv:"#DFDAD7",book:"#DADCD1",anime:"#EDE6D6",drama:"#EBE1D8",
    movie:"#DCE1DF",manga:"#DFDAD7",
  };
  const CAT_BADGE_FG = {
    article:"#465135",live:"#806C47",youtube:"#7A624C",radio:"#485950",
    tv:"#534946",book:"#465135",anime:"#806C47",drama:"#7A624C",
    movie:"#485950",manga:"#534946",
  };
  const badgeBg = CAT_BADGE_BG[item.category] || "#EBEBEB";
  const badgeFg = CAT_BADGE_FG[item.category] || "#555";

  // ── 履歴1件を削除 ──────────────────────────────────────────────────────────
  const deleteHistEntry = (histIdx) => {
    const h = history[histIdx]; // 昇順インデックス
    if (!h) return;

    const newHistory = item.progressHistory.filter((_, i) => {
      // item.progressHistory は未ソートなので、date+from+toで一致するものを1件削除
      return !(item.progressHistory[i].date === h.date &&
               item.progressHistory[i].from === h.from &&
               item.progressHistory[i].to   === h.to   &&
               item.progressHistory[i].delta === h.delta);
    });

    // current を差し引いて更新（削除した進捗分だけ戻す）
    const newCurrent = Math.max(0, item.current - (h.delta || 0));
    const newStatus  = newCurrent >= item.total && item.total > 0 ? "done"
                     : newCurrent > 0 ? "active" : item.status === "done" ? "queue" : item.status;

    const patch = {
      progressHistory: newHistory,
      current:         newCurrent,
      status:          newStatus,
      lastUpdated:     today(),
      completedAt:     newStatus === "done" ? item.completedAt : null,
    };
    onUpdate && onUpdate(item.id, patch);

    // アクティビティログから差し引く
    if (removeActivityLog && h.date) {
      removeActivityLog(h.date, item.category);
    }

    // EXP差し引き

    setActionSheet(null);
    setToast("記録を削除しました");
  };

  return (
    <div style={{ fontFamily:FC }}>
      {/* 戻るボタン */}
      <button onClick={onBack}
        style={{ display:"flex", alignItems:"center", gap:5,
          background:"none", border:"none", cursor:"pointer",
          color:"#6A625A", fontSize:12, fontWeight:500,
          fontFamily:FC, padding:"0 0 14px", letterSpacing:"0.03em" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        戻る
      </button>

      {/* ── コンテンツ情報カード ── */}
      <div style={{ background:"#F6F6F6", borderRadius:16, padding:"16px",
        marginBottom:20 }}>
        {/* Category badge */}
        <span style={{ display:"inline-flex", alignItems:"center", gap:4,
          background:badgeBg, borderRadius:7, padding:"3px 9px",
          marginBottom:10 }}>
          <CatIco cat={item.category} color={badgeFg}/>
          <span style={{ fontSize:10, fontWeight:600, color:badgeFg,
            letterSpacing:"0.04em" }}>{c?.label}</span>
        </span>

        {/* Title */}
        <div style={{ fontSize:16, fontWeight:700, color:"#1A1A1A",
          letterSpacing:"0.02em", lineHeight:1.4, marginBottom:10 }}>
          {item.title}
        </div>

        {/* Progress / dates */}
        <div style={{ display:"flex", gap:16, flexWrap:"wrap",
          fontSize:11, fontWeight:400, color:"#6A625A", letterSpacing:"0.04em" }}>
          {item.total > 0 && (
            <span>
              <span style={{ fontWeight:700, fontSize:13, color:"#1A1A1A" }}>
                {item.current}
              </span>
              /{item.total} {unit}
            </span>
          )}
          {item.startedAt && (
            <span>開始日 {item.firstActiveAt || item.startedAt}</span>
          )}
          {item.status === "done" && item.completedAt && (
            <span>完了日 {item.completedAt}</span>
          )}
        </div>
      </div>

      {/* ── 記録履歴カード ── */}
      <div style={{ background:"#F6F6F6", borderRadius:16, padding:"16px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#1A1A1A",
          letterSpacing:"0.06em", marginBottom:14 }}>記録履歴</div>

        {history.length === 0 ? (
          <div style={{ fontSize:12, color:"#A0A0A0", letterSpacing:"0.04em",
            lineHeight:1.8, padding:"8px 0" }}>
            記録がありません。<br/>
            +1話などのボタンで進捗を記録すると、ここに表示されます。
          </div>
        ) : (
          history.map((h, idx) => {
            const isLast  = idx === history.length - 1;
            const pctAfter = item.total > 0
              ? Math.round(h.to / item.total * 100) : null;

            return (
              <div key={idx}>
                {/* History row — tappable */}
                <button onClick={()=>setActionSheet({ histIdx:idx, hist:h })}
                  style={{ width:"100%", background:"transparent", border:"none",
                    cursor:"pointer", padding:"10px 0", textAlign:"left",
                    fontFamily:FC, display:"flex", alignItems:"flex-start", gap:12 }}>

                  {/* Timeline dot + line */}
                  <div style={{ display:"flex", flexDirection:"column",
                    alignItems:"center", flexShrink:0, width:16 }}>
                    <div style={{ width:10, height:10, borderRadius:"50%",
                      background:c?.color || "#B0A898", marginTop:3, flexShrink:0 }}/>
                    {!isLast && (
                      <div style={{ width:1, flex:1, minHeight:20,
                        background:"#DEDAD5", marginTop:3 }}/>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0, paddingBottom: isLast ? 0 : 8 }}>
                    {/* Top row: delta + date */}
                    <div style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"baseline", marginBottom:4 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#1A1A1A",
                        letterSpacing:"0.01em" }}>
                        {h.delta > 0 ? `+${h.delta}${unit}` :
                         h.completedViaButton ? "完了にした" :
                         h.editedViaModal ? "編集" : "記録"}
                      </span>
                      <span style={{ fontSize:10, fontWeight:400, color:"#A0A0A0",
                        letterSpacing:"0.03em", flexShrink:0, marginLeft:8 }}>
                        {h.date}
                      </span>
                    </div>
                    {/* Progress change */}
                    <div style={{ fontSize:11, fontWeight:400, color:"#8A8A8A",
                      letterSpacing:"0.03em" }}>
                      {h.from !== undefined && h.to !== undefined && (
                        <>
                          {h.from}{unit} → {h.to}{unit}
                          {pctAfter !== null && ` (${pctAfter}%)`}
                        </>
                      )}
                    </div>
                  </div>
                </button>

                {!isLast && (
                  <div style={{ height:1, background:"#ECEAE7", margin:"0 0 0 28px" }}/>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast} onHide={()=>setToast(null)}/>}

      {/* ── Action Sheet (編集 / 削除) ── */}
      {actionSheet && (
        <div onClick={()=>setActionSheet(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)",
            zIndex:700, display:"flex", alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#FFFFFF", borderRadius:"20px 20px 0 0",
              width:"100%", padding:"22px 20px 48px",
              boxShadow:"0 -6px 30px rgba(0,0,0,0.12)", fontFamily:FC }}>

            {/* Record summary */}
            <div style={{ fontSize:12, fontWeight:600, color:"#1A1A1A",
              marginBottom:18, letterSpacing:"0.04em" }}>
              {actionSheet.hist.date} ／ {
                actionSheet.hist.delta > 0
                  ? `+${actionSheet.hist.delta}${unit}`
                  : "記録"
              }
            </div>

            {/* Delete */}
            <button onClick={()=>deleteHistEntry(actionSheet.histIdx)}
              style={{ width:"100%", padding:"14px", borderRadius:12,
                border:"1.5px solid #E8E2DA", background:"transparent",
                color:"#B05050", fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:FC, letterSpacing:"0.03em",
                marginBottom:10 }}>
              この記録を削除する
            </button>

            {/* Cancel */}
            <button onClick={()=>setActionSheet(null)}
              style={{ width:"100%", padding:"14px", borderRadius:12,
                border:"1.5px solid #E8E2DA", background:"transparent",
                color:"#6A625A", fontSize:13, fontWeight:500,
                cursor:"pointer", fontFamily:FC, letterSpacing:"0.03em" }}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ContentReport — 画面2-① コンテンツ一覧 ─────────────────────────────────
function ContentReport({ items, onSelectItem }) {
  const FC = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";

  // カテゴリフィルター（single select、ContentsタブのALL定数を流用）
  const [catFilter, setCatFilter] = useState(ALL);

  // セクションの開閉状態
  const [activeOpen, setActiveOpen]   = useState(true);
  const [doneOpen,   setDoneOpen]     = useState(false);

  // フィルタ適用
  const applyFilter = (list) => {
    if (catFilter === ALL) return list;
    const k = BY_LABEL[catFilter];
    return k ? list.filter(i => i.category === k) : list;
  };

  const activeItems = applyFilter(items.filter(i => i.status === "active"));
  const doneItems   = applyFilter(
    items.filter(i => i.status === "done")
         .sort((a,b) => (b.completedAt||"").localeCompare(a.completedAt||""))
  );

  // カテゴリフィルターのカラー
  const CAT_BADGE = {
    article:"#DADCD1", live:"#EDE6D6", youtube:"#EBE1D8",
    radio:"#DCE1DF", tv:"#DFDAD7", book:"#DADCD1",
    anime:"#EDE6D6", drama:"#EBE1D8", movie:"#DCE1DF", manga:"#DFDAD7",
  };
  const CAT_FG = {
    article:"#465135", live:"#806C47", youtube:"#7A624C",
    radio:"#485950", tv:"#534946", book:"#465135",
    anime:"#806C47", drama:"#7A624C", movie:"#485950", manga:"#534946",
  };

  // Section component (toggle)
  function Section({ title, items: list, defaultOpen, onToggle, isOpen }) {
    const effectiveUnit = (item) =>
      item.category === "manga" ? (item.mangaUnit || "巻") : CATS[item.category]?.unit || "";

    return (
      <div style={{ marginBottom: 20 }}>
        {/* Section header — tappable toggle */}
        <button onClick={onToggle}
          style={{ width:"100%", display:"flex", alignItems:"center",
            justifyContent:"space-between", background:"none", border:"none",
            cursor:"pointer", padding:"4px 0 10px", fontFamily:FC }}>
          <span style={{ fontSize:14, fontWeight:700, color:"#1A1A1A",
            letterSpacing:"0.04em" }}>{title}</span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:"#A0A0A0",
              letterSpacing:"0.04em" }}>{list.length}件</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition:"transform .2s" }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </button>

        {isOpen && (
          <div>
            {list.length === 0 ? (
              <div style={{ fontSize:12, color:"#A0A0A0", padding:"12px 0",
                letterSpacing:"0.04em" }}>
                {title === "進行中"
                  ? "進行中のコンテンツがありません"
                  : "完了したコンテンツがありません"}
              </div>
            ) : (
              list.map((item, idx) => {
                const bg  = CAT_BADGE[item.category] || "#EBEBEB";
                const fg  = CAT_FG[item.category]   || "#555";
                const unit = effectiveUnit(item);

                return (
                  <button key={item.id}
                    onClick={() => onSelectItem && onSelectItem(item.id)}
                    style={{ width:"100%", display:"flex", alignItems:"center",
                      gap:12, padding:"12px 14px",
                      marginBottom: idx < list.length-1 ? 8 : 0,
                      borderRadius:14, border:"1px solid #ECEAE7",
                      background:"#FAFAFA", cursor:"pointer",
                      textAlign:"left", fontFamily:FC,
                      transition:"background .15s" }}>

                    {/* Category badge */}
                    <span style={{ display:"inline-flex", alignItems:"center",
                      gap:4, background:bg, borderRadius:7,
                      padding:"3px 9px", flexShrink:0 }}>
                      <CatIco cat={item.category} color={fg}/>
                      <span style={{ fontSize:10, fontWeight:600, color:fg,
                        letterSpacing:"0.04em" }}>
                        {CATS[item.category]?.label}
                      </span>
                    </span>

                    {/* Text block */}
                    <div style={{ flex:1, minWidth:0 }}>
                      {/* Title */}
                      <div style={{ fontSize:13, fontWeight:600, color:"#1A1A1A",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        letterSpacing:"0.06em", marginBottom:3 }}>
                        {item.title}
                      </div>
                      {/* Sub info */}
                      <div style={{ fontSize:10, fontWeight:400, color:"#A0A0A0",
                        letterSpacing:"0.03em", display:"flex", gap:8, flexWrap:"wrap" }}>
                        {/* 進行中: 進捗 + 更新日 */}
                        {item.status === "active" && (
                          <>
                            {item.total > 0 && (
                              <span>{item.current}/{item.total} {unit}</span>
                            )}
                            {item.lastUpdated && (
                              <span>更新日 {item.lastUpdated}</span>
                            )}
                            <span>{(item.progressHistory||[]).length}回記録</span>
                          </>
                        )}
                        {/* 完了: 完了日 */}
                        {item.status === "done" && (
                          <>
                            {item.completedAt && (
                              <span>完了日 {item.completedAt}</span>
                            )}
                            <span>{(item.progressHistory||[]).length}回記録</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="#C8C4BE" strokeWidth="2" strokeLinecap="round"
                      style={{ flexShrink:0 }}>
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily:FC }}>
      {/* ── カテゴリフィルター ── */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:12,
        scrollbarWidth:"none", marginBottom:8 }}>
        {FILTER_OPTS.map(label => {
          const k = BY_LABEL[label];
          const isAct = catFilter === label;
          const bg  = k ? (CAT_BADGE[k] || "#BFBFBF") : "#BFBFBF";
          const fg2 = k ? (CAT_FG[k]   || "#555")     : "#fff";
          return (
            <button key={label} onClick={() => setCatFilter(label)}
              style={{ display:"inline-flex", alignItems:"center", gap:4,
                padding:"5px 13px", borderRadius:99, fontSize:11, fontWeight:600,
                border: "none", cursor:"pointer", whiteSpace:"nowrap",
                flexShrink:0, fontFamily:FC,
                background: isAct ? (k ? bg : "#BFBFBF") : "#F6F6F6",
                color: isAct ? (k ? fg2 : "#fff") : "#6A625A",
                transition:"all .15s" }}>
              {k && <CatIco cat={k} color={isAct ? fg2 : "#A0A0A0"}/>}
              {label}
            </button>
          );
        })}
      </div>

      {/* ── 進行中セクション ── */}
      <Section
        title="進行中"
        items={activeItems}
        isOpen={activeOpen}
        onToggle={() => setActiveOpen(o => !o)}
      />

      {/* 区切り線 */}
      <div style={{ height:1, background:"#ECEAE7", marginBottom:20 }}/>

      {/* ── 完了セクション ── */}
      <Section
        title="完了"
        items={doneItems}
        isOpen={doneOpen}
        onToggle={() => setDoneOpen(o => !o)}
      />
    </div>
  );
}

// ─── DonutChart — カテゴリ別進捗ドーナツグラフ ───────────────────────────────
function DonutChart({ catCounts, completedCount, colorMap }) {
  const FC = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";
  const size = 110, stroke = 22, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  const getColor = (k) => (colorMap && colorMap[k]) || CATS[k]?.color || "#B0A898";
  const segments = CAT_KEYS
    .map(k => ({ key:k, count:catCounts[k]||0, color:getColor(k), label:CATS[k].label }))
    .filter(s => s.count > 0);
  const total = segments.reduce((s,seg)=>s+seg.count, 0);

  if (total === 0) return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EEECE9" strokeWidth={stroke}/>
      <text x={cx} y={cy-5} textAnchor="middle" fontSize="11" fill="#A09890" fontFamily={FC}>記録</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize="11" fill="#A09890" fontFamily={FC}>なし</text>
    </svg>
  );

  let cumAngle = -90; // start from top
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EEECE9" strokeWidth={stroke}/>
      {segments.map((seg) => {
        const dashLen = seg.count / total * circ;
        const gap = circ - dashLen;
        const rotation = cumAngle;
        cumAngle += seg.count / total * 360;
        return (
          <circle key={seg.key} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${dashLen} ${gap}`}
            strokeDashoffset={0}
            style={{ transform:`rotate(${rotation}deg)`, transformOrigin:`${cx}px ${cy}px` }}/>
        );
      })}
      {/* Center text */}
      <text x={cx} y={cy-12} textAnchor="middle" fontSize="9" fontWeight="500" fill="#A09890" fontFamily={FC}>完了数</text>
      <text x={cx} y={cy+13} textAnchor="middle" fontSize="18" fontWeight="700" fill="#1A1A1A" fontFamily={FC}>{completedCount}</text>
    </svg>
  );
}

// ─── PeriodReport — 画面1 ────────────────────────────────────────────────────
function PeriodReport({ items, activityLog, year, month, setYear, setMonth,
  onUpdate, removeActivityLog, onActivityLog }) {
  const FC = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";
  const now = new Date();
  const years  = Array.from({length:5},(_,i)=>now.getFullYear()-i);
  const months = Array.from({length:12},(_,i)=>i+1);

  // Activity Log date tap popup
  const [actLogPopup, setActLogPopup] = useState(null); // { ymd, day }
  // Action sheet for edit/delete
  const [actionSheet, setActionSheet] = useState(null); // { item, histIdx, hist, ymd }
  // Edit mode state
  const [editDelta, setEditDelta] = useState(""); // new delta value for edit

  // ── Delete a progress history entry ──────────────────────────────────
  const handleDeleteEntry = ({ item, histIdx, hist, ymd }) => {
    const newHistory = (item.progressHistory || []).filter((h, i) =>
      !(h.date === hist.date && h.from === hist.from && h.to === hist.to && h.delta === hist.delta)
    // only remove the first match
    ).map((h, i, arr) => h); // identity, first-match removal handled below
    // Actually filter only first match:
    let removed = false;
    const filtered = (item.progressHistory || []).filter(h => {
      if (!removed && h.date === hist.date && h.from === hist.from
        && h.to === hist.to && h.delta === hist.delta) {
        removed = true; return false;
      }
      return true;
    });

    const newCurrent = Math.max(0, item.current - (hist.delta || 0));
    const newStatus = newCurrent >= item.total && item.total > 0 ? "done"
      : newCurrent > 0 ? (item.status === "done" ? "active" : item.status)
      : item.status === "done" ? "queue" : item.status;

    onUpdate && onUpdate(item.id, {
      progressHistory: filtered,
      current: newCurrent,
      status: newStatus,
      completedAt: newStatus === "done" ? item.completedAt : null,
      lastUpdated: today(),
    });
    removeActivityLog && removeActivityLog(hist.date, item.category);
    setActionSheet(null);
    setActLogPopup(null);
  };

  // ── Edit a progress history entry (change delta) ──────────────────────
  const handleEditEntry = ({ item, hist, newDelta }) => {
    const delta = parseInt(newDelta);
    if (isNaN(delta) || delta <= 0) return;
    const diff = delta - (hist.delta || 0); // positive = more, negative = less

    const updated = (item.progressHistory || []).map(h => {
      if (h.date === hist.date && h.from === hist.from
        && h.to === hist.to && h.delta === hist.delta) {
        return { ...h, delta, to: h.from + delta };
      }
      return h;
    });

    const newCurrent = Math.max(0, item.current + diff);
    const newStatus = newCurrent >= item.total && item.total > 0 ? "done"
      : item.status;

    onUpdate && onUpdate(item.id, {
      progressHistory: updated,
      current: newCurrent,
      status: newStatus,
      completedAt: newStatus === "done" ? (item.completedAt || today()) : item.completedAt,
      lastUpdated: today(),
    });
    // Sync activityLog: diff > 0 → add, diff < 0 → remove
    if (diff > 0 && onActivityLog) {
      for (let i = 0; i < diff; i++) onActivityLog(hist.date, item.category);
    } else if (diff < 0 && removeActivityLog) {
      for (let i = 0; i < Math.abs(diff); i++) removeActivityLog(hist.date, item.category);
    }
    setActionSheet(null);
    setActLogPopup(null);
  };

  // ── Month navigation ─────────────────────────────────────────────────────
  const prevMonth = () => { if(month===1){setYear(y=>y-1);setMonth(12);}else setMonth(m=>m-1); };
  const nextMonth = () => {
    const isCurrentMonth = year===now.getFullYear() && month===now.getMonth()+1;
    if(isCurrentMonth) return;
    if(month===12){setYear(y=>y+1);setMonth(1);}else setMonth(m=>m+1);
  };
  const isCurrentMonth = year===now.getFullYear() && month===now.getMonth()+1;

  // カレンダードット専用カラー（指定値）
  const CAL_DOT_COLOR = {
    article: "#DDE1E0",
    live:    "#EEE6D6",
    youtube: "#EDE2D9",
    radio:   "#DDE1E0",
    tv:      "#DDE1E0",
    book:    "#DDE1E0",
    anime:   "#EEE6D6",
    drama:   "#EDE2D9",
    movie:   "#DDE1E0",
    manga:   "#DDE1E0",
  };

  // ── Calendar grid (月間) ──────────────────────────────────────────────────
  const calendarDays = React.useMemo(() => {
    const days = [];
    const firstDay = new Date(year, month-1, 1);
    // 月曜始まり (0=Mon ... 6=Sun)
    const startDow = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();

    // Blank cells before the 1st
    for (let i = 0; i < startDow; i++) days.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const log = activityLog[ymd];
      let dotColor = null;
      let totalCount = 0;
      if (log && typeof log === "object") {
        const entries = Object.entries(log).filter(([,v])=>v>0);
        totalCount = entries.reduce((s,[,v])=>s+v,0);
        if (entries.length > 0) {
          const top = entries.sort((a,b)=>b[1]-a[1])[0][0];
          dotColor = CAL_DOT_COLOR[top] || "#DDE1E0";
        }
      }
      days.push({ day:d, ymd, dotColor, totalCount });
    }
    return days;
  }, [year, month, activityLog]);

  // ── 記録回数の定義に基づくカウント計算 ───────────────────────────────────────
  // 定義：
  //   Web/Live/YouTube/Radio/TV/Movie : 完了ステータスになったら1回
  //   Book   : 30ページ進めるごとに1回（余りもまとめて1回）。30P未満の本は完了で1回
  //   Anime/Drama : 1話完了ごとに1回
  //   Comic(巻) : 1巻ごとに1回 / Comic(話) : 4話ごとに1回（余りもまとめて1回）
  const calcActionCount = (item, histEntries) => {
    const cat = item.category;
    // Web/Live/YouTube/Radio/TV/Movie : 完了ステータスで1回
    if (["article","live","youtube","radio","tv","movie"].includes(cat)) {
      return histEntries.filter(h => h.completedViaButton ||
        (item.status==="done" && h.to >= item.total && item.total > 0)).length > 0 ? 1 : 0;
    }
    // Anime/Drama : 1話ごとに1回
    if (["anime","drama"].includes(cat)) {
      return histEntries.reduce((s, h) => s + (h.delta||0), 0);
    }
    // Book : 30Pごとに1回（余りもまとめて1回）
    if (cat === "book") {
      const totalPages = histEntries.reduce((s, h) => s + (h.delta||0), 0);
      if (item.total < 30) {
        return item.status==="done" ? 1 : 0;
      }
      return Math.ceil(totalPages / 30);
    }
    // Comic : 巻/話で分岐
    if (cat === "manga") {
      const unit = item.mangaUnit || "巻";
      const totalDelta = histEntries.reduce((s, h) => s + (h.delta||0), 0);
      if (unit === "巻") return totalDelta;
      // 話単位: 4話ごとに1回
      return Math.ceil(totalDelta / 4);
    }
    return histEntries.reduce((s, h) => s + (h.delta||0), 0);
  };

  // 定義ポップアップの state
  const [defPopup, setDefPopup] = useState(false);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = React.useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const prefix = `${year}-${String(month).padStart(2,"0")}`;

    // アクティブ日カウント（従来通り activityLog ベース）
    let activeDays = 0;
    for (let d=1; d<=daysInMonth; d++) {
      const ymd = `${prefix}-${String(d).padStart(2,"0")}`;
      const log = activityLog[ymd];
      if (log && typeof log==="object") {
        const cnt = Object.values(log).reduce((a,b)=>a+b,0);
        if (cnt > 0) activeDays++;
      }
    }

    // 完了コンテンツ
    const completedItems = items.filter(i =>
      i.status==="done" && i.completedAt && i.completedAt.startsWith(prefix)
    ).sort((a,b)=>(b.completedAt||"").localeCompare(a.completedAt||""));

    // 新定義に基づくカテゴリ別カウント・記録回数
    const catCounts = {};
    CAT_KEYS.forEach(k => { catCounts[k] = 0; });
    let totalActions = 0;

    items.forEach(item => {
      const cat = item.category;
      if (!catCounts.hasOwnProperty(cat)) return;

      // その月の progressHistory エントリを抽出
      const monthHist = (item.progressHistory||[]).filter(h =>
        h.date && h.date.startsWith(prefix)
      );

      // Web/Live/YouTube/Radio/TV/Movie: 完了ステータスになったら1回
      if (["article","live","youtube","radio","tv","movie"].includes(cat)) {
        if (item.status==="done" && item.completedAt && item.completedAt.startsWith(prefix)) {
          catCounts[cat] += 1;
          totalActions += 1;
        }
        return;
      }

      // Anime/Drama: 1話ごとに1回
      if (["anime","drama"].includes(cat)) {
        const cnt = monthHist.reduce((s, h) => s + (h.delta||0), 0);
        catCounts[cat] += cnt;
        totalActions += cnt;
        return;
      }

      // Book: 30Pごとに1回（余りもまとめて1回）
      if (cat === "book") {
        const totalPages = monthHist.reduce((s, h) => s + (h.delta||0), 0);
        if (totalPages === 0) return;
        const cnt = item.total < 30
          ? (item.status==="done" && item.completedAt?.startsWith(prefix) ? 1 : 0)
          : Math.ceil(totalPages / 30);
        catCounts[cat] += cnt;
        totalActions += cnt;
        return;
      }

      // Comic: 巻→1巻ごと / 話→4話ごと（余りもまとめて1回）
      if (cat === "manga") {
        const totalDelta = monthHist.reduce((s, h) => s + (h.delta||0), 0);
        if (totalDelta === 0) return;
        const unit = item.mangaUnit || "巻";
        const cnt = unit === "巻" ? totalDelta : Math.ceil(totalDelta / 4);
        catCounts[cat] += cnt;
        totalActions += cnt;
        return;
      }

      // その他（フォールバック）
      const cnt = monthHist.reduce((s, h) => s + (h.delta||0), 0);
      catCounts[cat] += cnt;
      totalActions += cnt;
    });

    const totalCatCount = Object.values(catCounts).reduce((a,b)=>a+b,0);

    return { activeDays, daysInMonth, totalActions, completedItems, catCounts, totalCatCount };
  }, [items, activityLog, year, month]);

  // ── Donut chart: use standalone DonutChart component above ───────────────

  const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div style={{ fontFamily:FC }}>
      {/* Month nav */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <button onClick={prevMonth}
          style={{ background:"none", border:"1px solid #E8E2DA", borderRadius:8,
            width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", color:"#6A625A" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ fontSize:15, fontWeight:700, color:"#1A1A1A", letterSpacing:"0.04em" }}>
          {year}年{month}月
        </div>
        <button onClick={nextMonth} disabled={isCurrentMonth}
          style={{ background:"none", border:"1px solid #E8E2DA", borderRadius:8,
            width:32, height:32, cursor:isCurrentMonth?"not-allowed":"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:isCurrentMonth?"#D0CCC8":"#6A625A", opacity:isCurrentMonth?0.4:1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* ── Activity Log (月間カレンダー) ── */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#8A8A8A",
          letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
          Activity Log
        </div>
        <div style={{ background:"#F6F6F6", borderRadius:16, padding:"14px 10px" }}>
          {/* 曜日ヘッダー */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
            {DAY_LABELS.map(d => (
              <div key={d} style={{ textAlign:"center", fontSize:8, fontWeight:600,
                color:"#B0B0B0", letterSpacing:"0.04em" }}>{d}</div>
            ))}
          </div>
          {/* 日付グリッド — 丸の上に日付数字を重ねて表示 */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px 2px" }}>
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`blank-${i}`}/>;
              const isToday = day.ymd === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
              const hasActivity = !!day.dotColor;
              return (
                <div key={day.ymd}
                  onClick={() => hasActivity && setActLogPopup({ ymd: day.ymd, day: day.day })}
                  style={{ display:"flex", justifyContent:"center", alignItems:"center",
                    cursor: hasActivity ? "pointer" : "default" }}>
                  <div style={{
                    width:22, height:22, borderRadius:"50%", flexShrink:0,
                    background: hasActivity ? day.dotColor : "transparent",
                    border: hasActivity ? "none" : `1px solid ${isToday ? "#9A9A9A" : "#D8D4CE"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <span style={{
                      fontSize:9, fontWeight: isToday ? 700 : 500,
                      color: isToday ? "#3A3A3A" : "#6A6A6A",
                      lineHeight:1, letterSpacing:"-0.02em", userSelect:"none",
                    }}>
                      {day.day}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Analysis (ドーナツ + 凡例) ── */}
      <div style={{ marginBottom:16 }}>
        {/* Section header with definition button */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#8A8A8A",
            letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Analysis
          </div>
          <button onClick={()=>setDefPopup(true)}
            style={{ background:"none", border:"1px solid #E0DEDC", borderRadius:8,
              padding:"3px 9px", fontSize:9, fontWeight:600, color:"#6A6A6A",
              cursor:"pointer", fontFamily:FC, letterSpacing:"0.04em" }}>
            記録回数について
          </button>
        </div>
        <div style={{ background:"#F6F6F6", borderRadius:16, padding:"16px",
          display:"flex", alignItems:"center", gap:20 }}>
          <DonutChart catCounts={stats.catCounts} completedCount={stats.completedItems.length}
            colorMap={{
              article:"#DDE1E0", live:"#EEE6D6", youtube:"#EDE2D9",
              radio:"#DDE1E0",   tv:"#DDE1E0",   book:"#DDE1E0",
              anime:"#EEE6D6",   drama:"#EDE2D9", movie:"#DDE1E0", manga:"#DDE1E0",
            }}/>
          {/* 凡例 */}
          <div style={{ flex:1, minWidth:0 }}>
            {CAT_KEYS.filter(k=>stats.catCounts[k]>0).map(k => {
              const donutColor = { article:"#DDE1E0",live:"#EEE6D6",youtube:"#EDE2D9",radio:"#DDE1E0",tv:"#DDE1E0",book:"#DDE1E0",anime:"#EEE6D6",drama:"#EDE2D9",movie:"#DDE1E0",manga:"#DDE1E0" };
              return (
                <div key={k} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%",
                    background: donutColor[k] || CATS[k].color, flexShrink:0 }}/>
                  <span style={{ fontSize:11, fontWeight:500, color:"#3A3A3A",
                    letterSpacing:"0.03em" }}>{CATS[k].label}</span>
                  <span style={{ fontSize:10, color:"#A0A0A0", marginLeft:"auto" }}>
                    {stats.catCounts[k]}回
                  </span>
                </div>
              );
            })}
            {stats.totalCatCount === 0 && (
              <div style={{ fontSize:11, color:"#A0A0A0" }}>記録なし</div>
            )}
          </div>
        </div>
      </div>

      {/* ── 統計カード ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        {/* アクティブ日 */}
        <div style={{ background:"#F6F6F6", borderRadius:14, padding:"16px 14px", textAlign:"center" }}>
          <div style={{ fontSize:9, fontWeight:600, color:"#A0A0A0",
            letterSpacing:"0.12em", marginBottom:8, lineHeight:1.4 }}>アクティブ日</div>
          <div style={{ fontSize:20, fontWeight:700, color:"#1A1A1A", lineHeight:1, letterSpacing:"0.12em" }}>
            {stats.activeDays}
            <span style={{ fontSize:13, fontWeight:400, color:"#A0A0A0", letterSpacing:"0.12em" }}>/{stats.daysInMonth}</span>
          </div>
        </div>
        {/* 記録回数 */}
        <div style={{ background:"#F6F6F6", borderRadius:14, padding:"16px 14px", textAlign:"center" }}>
          <div style={{ fontSize:9, fontWeight:600, color:"#A0A0A0",
            letterSpacing:"0.12em", marginBottom:8, lineHeight:1.4 }}>記録回数</div>
          <div style={{ fontSize:20, fontWeight:700, color:"#1A1A1A", lineHeight:1, letterSpacing:"0.12em" }}>
            {stats.totalActions}
            <span style={{ fontSize:13, fontWeight:400, color:"#A0A0A0", letterSpacing:"0.12em" }}>回</span>
          </div>
        </div>
      </div>

      {/* ── 完了コンテンツ一覧 ── */}
      {stats.completedItems.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#8A8A8A",
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
            完了コンテンツ
          </div>
          <div style={{ background:"#F6F6F6", borderRadius:16, overflow:"hidden" }}>
            {stats.completedItems.map((it, i, arr) => (
              <div key={it.id} style={{ display:"flex", alignItems:"center",
                padding:"11px 14px",
                borderBottom: i<arr.length-1 ? "1px solid #ECEAE7" : "none" }}>
                {/* カテゴリカラーの ● */}
                <div style={{ width:8, height:8, borderRadius:"50%",
                  background:CATS[it.category].color, flexShrink:0, marginRight:10 }}/>
                <span style={{ flex:1, fontSize:12, fontWeight:500, color:"#1A1A1A",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  letterSpacing:"0.03em" }}>{it.title}</span>
                <span style={{ fontSize:10, fontWeight:400, color:"#A0A0A0",
                  flexShrink:0, marginLeft:8 }}>{it.completedAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 記録回数の定義ポップアップ ── */}
      {defPopup && (
        <div onClick={()=>setDefPopup(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.32)", zIndex:650,
            display:"flex", alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#FFFFFF", borderRadius:"20px 20px 0 0",
              width:"100%", maxHeight:"80vh", overflowY:"auto",
              padding:"22px 20px 48px",
              boxShadow:"0 -6px 30px rgba(0,0,0,0.12)", fontFamily:FC }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:18 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#1A1A1A",
                letterSpacing:"0.04em" }}>記録回数の定義</span>
              <button onClick={()=>setDefPopup(false)}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"#A0A0A0", fontSize:18, lineHeight:1, padding:4 }}>×</button>
            </div>
            {[
              { cats:"Web / Live / YouTube / Radio / TV / Movie",
                desc:"1つのコンテンツが「完了」ステータスになったら 1回" },
              { cats:"Book",
                desc:"30ページ進めるごとに 1回（余りのページもまとめて 1回）。30ページ未満の本は完了ごとに 1回" },
              { cats:"Anime / Drama",
                desc:"1話完了ごとに 1回" },
              { cats:"Comic（巻単位）",
                desc:"1巻進めるごとに 1回" },
              { cats:"Comic（話単位）",
                desc:"4話進めるごとに 1回（余りの話もまとめて 1回）" },
            ].map(({ cats, desc }, i, arr) => (
              <div key={i} style={{ padding:"12px 0",
                borderBottom: i < arr.length-1 ? "1px solid #F0EEEC" : "none" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#3A3A3A",
                  letterSpacing:"0.04em", marginBottom:4 }}>{cats}</div>
                <div style={{ fontSize:12, fontWeight:400, color:"#767676",
                  letterSpacing:"0.03em", lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity Log date detail popup ── */}
      {actLogPopup && (
        <div onClick={()=>setActLogPopup(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.32)", zIndex:600,
            display:"flex", alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#FFFFFF", borderRadius:"20px 20px 0 0",
              width:"100%", maxHeight:"70vh", overflowY:"auto",
              padding:"22px 20px 48px",
              boxShadow:"0 -6px 30px rgba(0,0,0,0.12)", fontFamily:FC }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#1A1A1A",
                letterSpacing:"0.04em" }}>
                {year}年{month}月{actLogPopup.day}日 の記録
              </span>
              <button onClick={()=>setActLogPopup(null)}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"#A0A0A0", fontSize:18, lineHeight:1, padding:4 }}>×</button>
            </div>
            {/* Content list */}
            {(() => {
              const ymd = actLogPopup.ymd;
              const CAT_BADGE_BG = { article:"#DADCD1",live:"#EDE6D6",youtube:"#EBE1D8",radio:"#DCE1DF",tv:"#DFDAD7",book:"#DADCD1",anime:"#EDE6D6",drama:"#EBE1D8",movie:"#DCE1DF",manga:"#DFDAD7" };
              const CAT_BADGE_FG = { article:"#465135",live:"#806C47",youtube:"#7A624C",radio:"#485950",tv:"#534946",book:"#465135",anime:"#806C47",drama:"#7A624C",movie:"#485950",manga:"#534946" };

              // progressHistoryからその日の記録を収集
              const entries = [];
              items.forEach(item => {
                (item.progressHistory||[]).forEach(h => {
                  if (h.date !== ymd) return;
                  const cat = CATS[item.category];
                  const effectiveUnit = item.category==="manga" ? (item.mangaUnit||"巻") : cat?.unit||"";
                  let amountStr;
                  if (h.delta > 0) {
                    // from→to と % を表示（Reportタブと同じ形式）
                    const pctAfter = item.total > 0 ? Math.round(h.to / item.total * 100) : null;
                    const fromTo = h.from !== undefined && h.to !== undefined
                      ? `${h.from}→${h.to}${effectiveUnit}${pctAfter !== null ? ` (${pctAfter}%)` : ""}`
                      : "";
                    amountStr = `+${h.delta}${effectiveUnit}${fromTo ? `　${fromTo}` : ""}`;
                  } else if (h.completedViaButton) {
                    amountStr = "完了にした";
                  } else if (h.editedViaModal) {
                    amountStr = "編集済み";
                  } else {
                    amountStr = "ステータス変更";
                  }
                  entries.push({ item, amountStr, hist: h });
                });
              });

              if (entries.length === 0) {
                const log = activityLog[ymd];
                if (!log) return (
                  <div style={{ fontSize:12, color:"#A0A0A0", padding:"10px 0" }}>
                    詳細データなし
                  </div>
                );
                return Object.entries(log).filter(([,v])=>v>0).map(([cat, count]) => (
                  <div key={cat} style={{ display:"flex", alignItems:"center", gap:10,
                    padding:"10px 0", borderBottom:"1px solid #F0EEEC" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                      background: CAT_BADGE_BG[cat]||"#EBEBEB", borderRadius:7,
                      padding:"3px 9px", flexShrink:0 }}>
                      <CatIco cat={cat} color={CAT_BADGE_FG[cat]||"#555"}/>
                      <span style={{ fontSize:10, fontWeight:600,
                        color:CAT_BADGE_FG[cat]||"#555", letterSpacing:"0.04em" }}>
                        {CATS[cat]?.label}
                      </span>
                    </span>
                    <span style={{ fontSize:12, fontWeight:500, color:"#3A3A3A",
                      letterSpacing:"0.03em" }}>{count}回記録</span>
                  </div>
                ));
              }

              return entries.map(({ item, amountStr, hist }, idx) => (
                <div key={idx}
                  onClick={() => { setActionSheet({ item, histIdx: idx, hist, ymd: actLogPopup.ymd }); setEditDelta(String(hist.delta || "")); }}
                  style={{ display:"flex", alignItems:"center", gap:10,
                    padding:"10px 0", borderBottom:"1px solid #F0EEEC",
                    cursor:"pointer" }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                    background: CAT_BADGE_BG[item.category]||"#EBEBEB", borderRadius:7,
                    padding:"3px 9px", flexShrink:0 }}>
                    <CatIco cat={item.category} color={CAT_BADGE_FG[item.category]||"#555"}/>
                    <span style={{ fontSize:10, fontWeight:600,
                      color:CAT_BADGE_FG[item.category]||"#555", letterSpacing:"0.04em" }}>
                      {CATS[item.category]?.label}
                    </span>
                  </span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#1A1A1A",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                      letterSpacing:"0.03em" }}>{item.title}</div>
                    <div style={{ fontSize:11, fontWeight:400, color:"#A0A0A0",
                      letterSpacing:"0.03em", marginTop:1 }}>{amountStr}</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="#C8C4BE" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ── Action Sheet: 編集 / 削除 ── */}
      {actionSheet && (
        <div onClick={()=>setActionSheet(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)",
            zIndex:700, display:"flex", alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#FFFFFF", borderRadius:"20px 20px 0 0",
              width:"100%", padding:"22px 20px 48px",
              boxShadow:"0 -6px 30px rgba(0,0,0,0.12)", fontFamily:FC }}>

            {/* Record summary */}
            <div style={{ fontSize:13, fontWeight:600, color:"#1A1A1A",
              marginBottom:4, letterSpacing:"0.04em" }}>
              {actionSheet.item.title}
            </div>
            <div style={{ fontSize:11, fontWeight:400, color:"#A0A0A0",
              letterSpacing:"0.03em", marginBottom:20 }}>
              {actionSheet.hist.date}
              {actionSheet.hist.delta > 0 &&
                ` ／ +${actionSheet.hist.delta}${CATS[actionSheet.item.category]?.unit || ""}`}
            </div>

            {/* ── 編集 ── */}
            {actionSheet.hist.delta > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#6A6A6A",
                  letterSpacing:"0.06em", marginBottom:8 }}>記録を修正</div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input
                    type="number" min="1"
                    value={editDelta}
                    onChange={e=>setEditDelta(e.target.value)}
                    style={{ flex:1, padding:"10px 12px", borderRadius:10,
                      border:"1.5px solid #E8E2DA", fontSize:14, fontWeight:600,
                      color:"#1A1A1A", fontFamily:FC, outline:"none", textAlign:"center" }}
                    placeholder="修正後の数量"
                  />
                  <span style={{ fontSize:12, color:"#6A6A6A", flexShrink:0 }}>
                    {CATS[actionSheet.item.category]?.unit || ""}
                  </span>
                  <button
                    onClick={()=>handleEditEntry({ item:actionSheet.item, hist:actionSheet.hist, newDelta:editDelta })}
                    style={{ padding:"10px 18px", borderRadius:10, border:"none",
                      background:"#BFBFBF", color:"#fff", fontSize:12, fontWeight:700,
                      cursor:"pointer", fontFamily:FC, letterSpacing:"0.04em", flexShrink:0 }}>
                    修正する
                  </button>
                </div>
              </div>
            )}

            {/* ── 削除 ── */}
            <button onClick={()=>handleDeleteEntry(actionSheet)}
              style={{ width:"100%", padding:"13px", borderRadius:12,
                border:"1.5px solid #E8E2DA", background:"transparent",
                color:"#B05050", fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:FC, letterSpacing:"0.03em",
                marginBottom:10 }}>
              この記録を削除する
            </button>

            <button onClick={()=>setActionSheet(null)}
              style={{ width:"100%", padding:"13px", borderRadius:12,
                border:"1.5px solid #E8E2DA", background:"transparent",
                color:"#6A625A", fontSize:13, fontWeight:500,
                cursor:"pointer", fontFamily:FC, letterSpacing:"0.03em" }}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function ReportModal({ items, activityLog, onClose, inlineMode = false,
  onUpdate, onActivityLog, removeActivityLog,
  onModeChange, exportRef }) {
  const now = new Date();
  const [reportMode, setReportMode] = useState("period");   // "period" | "content"
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [view,  setView]  = useState("month");
  const [exportDone, setExportDone] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const ITEM_PREVIEW = 4;

  // All items that have any progress history
  const itemsWithHistory = React.useMemo(() =>
    items.filter(i => (i.progressHistory||[]).length > 0 || i.completedAt)
      .sort((a,b) => (b.lastUpdated||b.addedAt||"").localeCompare(a.lastUpdated||a.addedAt||"")),
  [items]);

  const selectedItem = selectedItemId ? items.find(i=>i.id===selectedItemId) : null;

  const stats = React.useMemo(() => {
    const doneItems = items.filter(i => i.status === "done" && i.completedAt);
    const inPeriod = (item) => {
      if (!item.completedAt) return false;
      const d = new Date(item.completedAt);
      if (view === "month") return d.getFullYear()===year && d.getMonth()+1===month;
      if (view === "year")  return d.getFullYear()===year;
      return true;
    };
    const periodItems = doneItems.filter(inPeriod)
      .sort((a,b) => (b.completedAt||"").localeCompare(a.completedAt||""));
    const catCounts = {};
    CAT_KEYS.forEach(k => { catCounts[k] = 0; });
    periodItems.forEach(i => { if (catCounts[i.category]!==undefined) catCounts[i.category]++; });
    const mvpKey = CAT_KEYS.reduce((a,b) => catCounts[a]>=catCounts[b]?a:b, CAT_KEYS[0]);
    const mvpCount = catCounts[mvpKey];
    let trendMsg = "";
    if (view === "month") {
      const fh = periodItems.filter(i => parseInt(i.completedAt.slice(8,10)) <= 15);
      const sh = periodItems.filter(i => parseInt(i.completedAt.slice(8,10)) > 15);
      const fhC={}, shC={}; CAT_KEYS.forEach(k=>{fhC[k]=0;shC[k]=0;});
      fh.forEach(i=>fhC[i.category]++); sh.forEach(i=>shC[i.category]++);
      const fhM = CAT_KEYS.reduce((a,b)=>fhC[a]>=fhC[b]?a:b,CAT_KEYS[0]);
      const shM = CAT_KEYS.reduce((a,b)=>shC[a]>=shC[b]?a:b,CAT_KEYS[0]);
      if (shC[shM]>0 && shM!==fhM) trendMsg=`後半は${CATS[shM].label}を頑張った`;
      else if (fhC[fhM]>0) trendMsg=`前半から${CATS[fhM].label}に集中`;
    }
    const catDays={};
    CAT_KEYS.forEach(k=>{catDays[k]=[];});
    doneItems.forEach(i=>{if(i.startedAt&&i.completedAt&&catDays[i.category])catDays[i.category].push(daysBetween(i.startedAt,i.completedAt));});
    const avgDays={};
    CAT_KEYS.forEach(k=>{const a=catDays[k]; avgDays[k]=a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):null;});
    const actDays={};
    Object.entries(activityLog).forEach(([date,val])=>{
      const d=new Date(date);
      const ok = view==="month"?(d.getFullYear()===year&&d.getMonth()+1===month):view==="year"?d.getFullYear()===year:true;
      if(ok){const t=typeof val==="object"?Object.values(val).reduce((a,b)=>a+b,0):(val||0); actDays[date]=t;}
    });
    const activeDayCount = Object.keys(actDays).length;
    const totalActions   = Object.values(actDays).reduce((a,b)=>a+b,0);
    return { catCounts, mvpKey, mvpCount, trendMsg, avgDays, periodItems, activeDayCount, totalActions };
  }, [items, activityLog, view, year, month]);

  // ── Canvas export ────────────────────────────────────────────────────────
  const exportImage = () => {
    const W=600, H=900;
    const c=document.createElement("canvas"); c.width=W; c.height=H;
    const ctx=c.getContext("2d");
    function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fill();}
    ctx.fillStyle="#FFFFFF"; ctx.fillRect(0,0,W,H);
    const grad=ctx.createLinearGradient(0,0,W,0);
    CONFETTI_COLORS.forEach((col,i)=>grad.addColorStop(i/(CONFETTI_COLORS.length-1),col));
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,5);
    const periodLabel=view==="month"?`${year}年${month}月`:view==="year"?`${year}年`:"全期間";
    ctx.fillStyle=G.ink; ctx.font="bold 24px 'Outfit',sans-serif";
    ctx.fillText("Contents Progress", 40, 52);
    ctx.fillStyle=G.greyMid; ctx.font="14px sans-serif";
    ctx.fillText(periodLabel+" 振り返り", 40, 76);
    [{label:"完了",val:stats.periodItems.length},{label:"活動日",val:`${stats.activeDayCount}日`},{label:"記録",val:`${stats.totalActions}回`}]
      .forEach(({label,val},i)=>{
        const x=40+i*175;
        ctx.fillStyle="#F5F5F5"; rr(x,92,160,52,10);
        ctx.fillStyle=G.greyMid; ctx.font="10px sans-serif"; ctx.fillText(label,x+10,112);
        ctx.fillStyle=G.ink; ctx.font="bold 18px sans-serif"; ctx.fillText(String(val),x+10,132);
      });
    if(stats.mvpCount>0){
      const mc=CATS[stats.mvpKey];
      ctx.fillStyle=mc.color+"33"; rr(30,158,W-60,52,12);
      ctx.fillStyle=mc.color; ctx.font="bold 11px sans-serif"; ctx.fillText("MVP ジャンル",50,178);
      ctx.fillStyle=G.ink; ctx.font="bold 18px sans-serif";
      ctx.fillText(`${mc.label}  ×${stats.mvpCount}作品`,50,200);
    }
    ctx.fillStyle=G.greyDeep; ctx.font="bold 12px sans-serif"; ctx.fillText("カテゴリ別 完了数",40,232);
    const maxC=Math.max(...Object.values(stats.catCounts),1);
    const BX=110,BW=440,BH=16,BY0=245;
    CAT_KEYS.forEach((k,i)=>{
      const cnt=stats.catCounts[k], y=BY0+i*(BH+8);
      ctx.fillStyle=G.greyMid; ctx.font="11px sans-serif"; ctx.textAlign="right";
      ctx.fillText(CATS[k].label,BX-6,y+BH-3); ctx.textAlign="left";
      ctx.fillStyle="#F0F0F0"; rr(BX,y,BW,BH,4);
      if(cnt>0){
        ctx.fillStyle=CATS[k].color; rr(BX,y,Math.max(BW*(cnt/maxC),24),BH,4);
        ctx.fillStyle="#fff"; ctx.font="bold 9px sans-serif";
        ctx.fillText(cnt,BX+BW*(cnt/maxC)-18,y+BH-4);
      }
    });
    const listY=BY0+CAT_KEYS.length*(BH+8)+16;
    ctx.fillStyle=G.greyDeep; ctx.font="bold 12px sans-serif"; ctx.fillText("完了コンテンツ",40,listY);
    const SHOW=Math.min(stats.periodItems.length,8);
    stats.periodItems.slice(0,SHOW).forEach((it,i)=>{
      const y=listY+14+i*24;
      ctx.fillStyle="#F5F5F5"; rr(30,y,W-60,20,5);
      ctx.fillStyle=CATS[it.category].color; ctx.font="bold 9px sans-serif"; ctx.fillText(CATS[it.category].label,42,y+14);
      ctx.fillStyle=G.greyDeep; ctx.font="12px sans-serif"; ctx.fillText(it.title,110,y+14);
      if(it.completedAt){ctx.fillStyle=G.greyMid; ctx.font="10px sans-serif"; ctx.textAlign="right"; ctx.fillText(it.completedAt,W-40,y+14); ctx.textAlign="left";}
    });
    if(stats.periodItems.length>SHOW){ctx.fillStyle=G.greyMid; ctx.font="11px sans-serif"; ctx.fillText(`… 他${stats.periodItems.length-SHOW}件`,40,listY+14+SHOW*24+14);}
    ctx.fillStyle="#F5F5F5"; rr(30,H-48,W-60,34,10);
    ctx.fillStyle=G.greyMid; ctx.font="11px sans-serif";
    ctx.fillText(`Contents Progress — ${new Date().toLocaleDateString("ja-JP")}`,50,H-26);
    const url=c.toDataURL("image/png");
    const a=document.createElement("a"); a.href=url;
    a.download=`cp-report-${(view==="month"?`${year}年${month}月`:view==="year"?`${year}年`:"全期間").replace(/[年月]/g,"")}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setExportDone(true); setTimeout(()=>setExportDone(false),2500);
  };

  const periodLabel = view==="month"?`${year}年${month}月`:view==="year"?`${year}年`:"全期間";
  const months = Array.from({length:12},(_,i)=>i+1);
  const years  = Array.from({length:5},(_,i)=>now.getFullYear()-i);
  const SC = { background:G.surfaceAlt, borderRadius:14, padding:"14px 16px", marginBottom:12 };
  const SH = { fontSize:10, fontWeight:700, color:G.greyMid, letterSpacing:"0.09em", textTransform:"uppercase", marginBottom:10 };

  // ── Content export helpers ───────────────────────────────────────────────
  function drawItemCard(ctx, item, yStart, W, accent) {
    const cat = CATS[item.category];
    const hist = [...(item.progressHistory||[])].sort((a,b)=>a.date.localeCompare(b.date));
    const pctVal = item.total > 0 ? Math.min(100, Math.round(item.current/item.total*100)) : 0;
    function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fill();}

    let y = yStart + 10;
    // Left accent bar
    ctx.fillStyle = accent; rr(30, y, 4, 120, 2);

    // Category tag
    ctx.fillStyle = accent + "44"; rr(42, y, 80, 18, 5);
    ctx.fillStyle = accent; ctx.font="bold 10px sans-serif";
    ctx.fillText(cat.label, 50, y+13);

    // Title
    ctx.fillStyle = G.ink; ctx.font="bold 15px sans-serif";
    const titleText = item.title.length > 28 ? item.title.slice(0,27)+"…" : item.title;
    ctx.fillText(titleText, 42, y+38);

    // Progress line
    ctx.fillStyle = G.greyMid; ctx.font="11px sans-serif";
    ctx.fillText(`${item.current} / ${item.total} ${cat.unit}  (${pctVal}%)`, 42, y+56);

    // Progress bar
    ctx.fillStyle = "#EDEBE8"; rr(42, y+64, W-80, 6, 3);
    if (pctVal > 0) { ctx.fillStyle = accent; rr(42, y+64, Math.max((W-80)*(pctVal/100), 8), 6, 3); }

    // Dates
    ctx.fillStyle = G.greyMid; ctx.font="10px sans-serif";
    const meta = [item.startedAt?"開始:"+item.startedAt:"", item.completedAt?"完了:"+item.completedAt:""].filter(Boolean).join("  ");
    ctx.fillText(meta, 42, y+84);

    // History rows (max 6)
    let hy = y + 100;
    if (hist.length > 0) {
      ctx.fillStyle = G.greyMid; ctx.font="bold 9px sans-serif";
      ctx.fillText("記録履歴", 42, hy); hy += 14;
      hist.slice(-6).forEach(h => {
        ctx.fillStyle = accent; rr(42, hy+1, 6, 6, 3);
        ctx.fillStyle = G.greyDeep; ctx.font="10px sans-serif";
        ctx.fillText(`${h.date}  +${h.delta}${cat.unit}  →  ${h.to}${cat.unit}`, 54, hy+8);
        hy += 18;
      });
      if (hist.length > 6) {
        ctx.fillStyle = G.greyMid; ctx.font="10px sans-serif";
        ctx.fillText(`… 他${hist.length-6}件`, 54, hy+8); hy += 18;
      }
    } else {
      hy += 16;
    }
    return hy + 20; // next card Y
  }

  function exportSingleItem(item) {
    const cat = CATS[item.category];
    const hist = [...(item.progressHistory||[])].sort((a,b)=>a.date.localeCompare(b.date));
    const pctVal = item.total > 0 ? Math.min(100, Math.round(item.current/item.total*100)) : 0;
    const histH = Math.max(hist.length, 1) * 18 + 40;
    const W = 600, H = Math.max(320, 180 + histH);
    const c = document.createElement("canvas"); c.width=W; c.height=H;
    const ctx = c.getContext("2d");
    function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fill();}

    ctx.fillStyle="#fff"; ctx.fillRect(0,0,W,H);
    // Top accent gradient bar
    const grad=ctx.createLinearGradient(0,0,W,0);
    CONFETTI_COLORS.forEach((col,i)=>grad.addColorStop(i/(CONFETTI_COLORS.length-1),col));
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,5);

    // Header
    ctx.fillStyle=G.ink; ctx.font="bold 18px 'Outfit',sans-serif";
    ctx.fillText("Contents Progress", 30, 38);
    ctx.fillStyle=G.greyMid; ctx.font="12px sans-serif";
    ctx.fillText("コンテンツ別 振り返り", 30, 58);

    // Category tag bg
    ctx.fillStyle=cat.color+"44"; rr(30,72,90,20,6);
    ctx.fillStyle=cat.color; ctx.font="bold 11px sans-serif"; ctx.fillText(cat.label, 40, 86);

    // Title
    ctx.fillStyle=G.ink; ctx.font="bold 17px sans-serif";
    ctx.fillText(item.title.length>34?item.title.slice(0,33)+"…":item.title, 30, 114);

    // Progress
    ctx.fillStyle=G.greyMid; ctx.font="12px sans-serif";
    ctx.fillText(`${item.current} / ${item.total} ${cat.unit}   ${pctVal}%`, 30, 134);
    ctx.fillStyle="#EDEBE8"; rr(30,142,W-60,8,4);
    if(pctVal>0){ctx.fillStyle=cat.color; rr(30,142,Math.max((W-60)*(pctVal/100),10),8,4);}

    // Dates
    const meta=[item.startedAt?"開始:"+item.startedAt:"",item.completedAt?"完了:"+item.completedAt:""].filter(Boolean).join("   ");
    ctx.fillStyle=G.greyMid; ctx.font="10px sans-serif"; ctx.fillText(meta,30,165);

    // History
    let hy = 190;
    if(hist.length>0){
      ctx.fillStyle=G.greyDeep; ctx.font="bold 12px sans-serif"; ctx.fillText("記録履歴",30,hy); hy+=16;
      ctx.fillStyle="#F0EFED"; rr(30,hy,W-60,1,0); hy+=10;
      hist.forEach(h=>{
        ctx.fillStyle=cat.color; rr(30,hy+2,8,8,4);
        ctx.fillStyle=G.greyDeep; ctx.font="11px sans-serif";
        ctx.fillText(h.date, 46, hy+10);
        ctx.fillStyle=cat.color; ctx.font="bold 11px sans-serif";
        ctx.fillText(`+${h.delta}${cat.unit}`, 160, hy+10);
        ctx.fillStyle=G.greyMid; ctx.font="10px sans-serif";
        ctx.fillText(`${h.from}→${h.to}${cat.unit} (${item.total>0?Math.round(h.to/item.total*100):0}%)`, 220, hy+10);
        hy+=18;
      });
    } else {
      ctx.fillStyle=G.greyMid; ctx.font="11px sans-serif"; ctx.fillText("記録がありません",30,hy);
    }

    // Footer
    ctx.fillStyle="#F5F5F5"; ctx.fillRect(0,H-28,W,28);
    ctx.fillStyle=G.greyMid; ctx.font="10px sans-serif";
    ctx.fillText(`Contents Progress — ${new Date().toLocaleDateString("ja-JP")}`, 30, H-10);

    const url=c.toDataURL("image/png");
    const a=document.createElement("a"); a.href=url;
    a.download=`cp-${item.title.slice(0,20).replace(/\s/g,"_")}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  function exportAllItems() {
    const targets = itemsWithHistory;
    if(targets.length===0) return;
    const W=600;
    // Estimate height per item
    const heightPerItem = (it) => {
      const hist = (it.progressHistory||[]);
      return 160 + Math.max(hist.length,0)*18 + 40;
    };
    const totalH = 80 + targets.reduce((s,it)=>s+heightPerItem(it)+20, 0) + 40;
    const c=document.createElement("canvas"); c.width=W; c.height=totalH;
    const ctx=c.getContext("2d");
    function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fill();}

    ctx.fillStyle="#fff"; ctx.fillRect(0,0,W,totalH);
    const grad=ctx.createLinearGradient(0,0,W,0);
    CONFETTI_COLORS.forEach((col,i)=>grad.addColorStop(i/(CONFETTI_COLORS.length-1),col));
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,5);

    ctx.fillStyle=G.ink; ctx.font="bold 18px 'Outfit',sans-serif"; ctx.fillText("Contents Progress",30,38);
    ctx.fillStyle=G.greyMid; ctx.font="12px sans-serif"; ctx.fillText(`コンテンツ別 振り返り — ${targets.length}件`,30,58);

    let y=70;
    targets.forEach((item)=>{
      const cat=CATS[item.category];
      // Separator line
      ctx.fillStyle="#F0EFED"; rr(30,y,W-60,1,0); y+=14;
      y = drawItemCard(ctx,item,y,W,cat.color);
    });

    // Footer
    ctx.fillStyle="#F5F5F5"; ctx.fillRect(0,totalH-28,W,28);
    ctx.fillStyle=G.greyMid; ctx.font="10px sans-serif";
    ctx.fillText(`Contents Progress — ${new Date().toLocaleDateString("ja-JP")}`, 30, totalH-10);

    const url=c.toDataURL("image/png");
    const a=document.createElement("a"); a.href=url;
    a.download=`cp-contents-all-${today()}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  // Expose export functions to parent via ref (runs after both are defined)
  if (exportRef) exportRef.current = {
    exportImage,
    exportAllItems,
    selectedItemId,
    items,
    exportSingleItem: (item) => {
      if (!item) return;
      const cat = CATS[item.category];
      const W = 600;
      const hist = [...(item.progressHistory||[])].sort((a,b)=>(a.date||"").localeCompare(b.date||""));
      const totalH = 100 + 140 + hist.length * 52 + 60;
      const c = document.createElement("canvas"); c.width=W; c.height=totalH;
      const ctx = c.getContext("2d");
      function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fill();}

      ctx.fillStyle="#fff"; ctx.fillRect(0,0,W,totalH);
      const grad=ctx.createLinearGradient(0,0,W,0);
      CONFETTI_COLORS.forEach((col,i)=>grad.addColorStop(i/(CONFETTI_COLORS.length-1),col));
      ctx.fillStyle=grad; ctx.fillRect(0,0,W,5);

      // Header
      ctx.fillStyle=G.ink; ctx.font="bold 18px 'Outfit',sans-serif";
      ctx.fillText("Contents Progress",30,38);
      ctx.fillStyle=G.greyMid; ctx.font="12px sans-serif";
      ctx.fillText(`${cat.label}`,30,58);

      // Item card
      let y = 72;
      ctx.fillStyle=cat.color; rr(30,y,4,36,2); // left accent bar
      ctx.fillStyle=G.ink; ctx.font="bold 15px sans-serif";
      ctx.fillText(item.title.slice(0,36), 42, y+14);
      ctx.fillStyle=G.greyMid; ctx.font="11px sans-serif";
      const unit = item.category==="manga"?(item.mangaUnit||"巻"):cat.unit||"";
      ctx.fillText(`${item.current}/${item.total} ${unit}`, 42, y+30);
      if (item.status==="done" && item.completedAt) {
        ctx.fillText(`完了日: ${item.completedAt}`, 200, y+30);
      }
      y += 56;

      // History header
      ctx.fillStyle=G.ink; ctx.font="bold 12px sans-serif";
      ctx.fillText("記録履歴", 30, y); y += 20;

      // History rows
      hist.forEach((h, i) => {
        const isEven = i % 2 === 0;
        ctx.fillStyle = isEven ? "#F8F8F8" : "#FFFFFF";
        ctx.fillRect(30, y-2, W-60, 42);

        ctx.fillStyle = cat.color;
        ctx.beginPath(); ctx.arc(42, y+14, 5, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle=G.ink; ctx.font="bold 13px sans-serif";
        const deltaStr = h.delta>0 ? `+${h.delta}${unit}` : h.completedViaButton ? "完了" : "記録";
        ctx.fillText(deltaStr, 56, y+14);

        ctx.fillStyle=G.greyMid; ctx.font="11px sans-serif";
        const fromTo = h.from!==undefined ? `${h.from}→${h.to}${unit}` : "";
        ctx.fillText(fromTo, 56, y+30);
        ctx.fillText(h.date||"", W-120, y+14);
        y += 46;
      });

      if (hist.length === 0) {
        ctx.fillStyle=G.greyMid; ctx.font="12px sans-serif";
        ctx.fillText("記録なし", 30, y); y += 30;
      }

      // Footer
      ctx.fillStyle="#F5F5F5"; ctx.fillRect(0,totalH-28,W,28);
      ctx.fillStyle=G.greyMid; ctx.font="10px sans-serif";
      ctx.fillText(`Contents Progress — ${new Date().toLocaleDateString("ja-JP")}`, 30, totalH-10);

      const url=c.toDataURL("image/png");
      const a=document.createElement("a"); a.href=url;
      a.download=`cp-${item.id}-${today()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    },
  };

  const reportInner = (
    <div style={{ background:"#FFFFFF", ...(inlineMode ? { borderRadius:0, padding:"20px 18px 60px" } : { borderRadius:"24px 24px 0 0", width:"100%", padding:"26px 20px 52px", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 -10px 50px rgba(0,0,0,0.15)" }) }}>

        {/* Header */}
        {!inlineMode && (
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
            <span style={{ fontSize:16,fontWeight:800,color:G.greyDeep,display:"flex",alignItems:"center",gap:8,fontFamily:F }}>
              <ICONS.report/> 振り返りレポート
            </span>
            <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:G.greyMid,display:"flex",padding:4 }}><ICONS.close/></button>
          </div>
        )}

        {/* Mode toggle — pill style matching Contents tab */}
        <div style={{ display:"flex", background:"#F6F6F6", borderRadius:11, padding:3, gap:2, marginBottom:18 }}>
          {[["period","期間別"],["content","コンテンツ別"]].map(([mode,label])=>(
            <button key={mode} onClick={()=>{ setReportMode(mode); setSelectedItemId(null); onModeChange&&onModeChange(mode); }}
              style={{ flex:1, padding:"7px 4px", borderRadius:9, border:"none",
                fontSize:12, fontWeight:reportMode===mode?700:500,
                background: reportMode===mode ? "#FFFFFF" : "transparent",
                color: reportMode===mode ? (G.greyDeep||"#3A3228") : (G.greyMid||"#A09890"),
                cursor:"pointer", fontFamily:F, transition:"all .15s",
                boxShadow: reportMode===mode ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
                letterSpacing:"0.02em" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── PERIOD VIEW (新デザイン) ── */}
        {reportMode==="period" && <PeriodReport
          items={items}
          activityLog={activityLog}
          year={year} month={month}
          setYear={setYear} setMonth={setMonth}
          onUpdate={onUpdate}
          removeActivityLog={removeActivityLog}
          onActivityLog={onActivityLog}
        />}


        {/* ── CONTENT VIEW (画面2) ── */}
        {reportMode==="content" && !selectedItemId && (
          <ContentReport
            items={items}
            onSelectItem={setSelectedItemId}
          />
        )}
        {reportMode==="content" && selectedItemId && (
          <ContentDetail
            item={items.find(i=>i.id===selectedItemId)}
            items={items}
            activityLog={activityLog}
            onBack={()=>setSelectedItemId(null)}
            onUpdate={onUpdate}
            onActivityLog={onActivityLog}
            removeActivityLog={removeActivityLog}
          />
        )}

      </div>
  );

  if (inlineMode) return reportInner;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(34,34,34,0.35)",zIndex:920,display:"flex",alignItems:"flex-end",backdropFilter:"blur(3px)" }}>
      {reportInner}
    </div>
  );
}



// ═══════════════════════════════════════════════════════════════════════════
// ContentsProgress — メインアプリコンポーネント
//
// Props:
//   user      : Supabase の User オブジェクト（名前・メールアドレス・アバター）
//               ※ null を渡した場合はローカル(localStorage)モードで動作
//   onLogout  : ログアウトボタンが押されたときに呼ぶコールバック
//   sbOps     : Supabase DB 操作関数のオブジェクト（AuthProvider.jsx から渡す）
//               {
//                 loadItems, saveItem, deleteItem,
//                 loadActivityLog, upsertActivity,
//                 loadWatchQueue,  saveWatchQueue
//               }
//               ※ null の場合は localStorage のみで動作（アーティファクト/デモ用）
// ═══════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════
// デザインリニューアル版 ContentsProgress
// Props: user, onLogout, sbOps (same as before)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Design tokens (updated palette) ─────────────────────────────────────
const NEW_G = {
  bg:        "#FFFFFF",
  surface:   "#FFFFFF",
  surfaceAlt:"#F6F6F6",
  border:    "#E8E2DA",
  greyLight: "#D6D0C8",
  greyMid:   "#A09890",
  greyDark:  "#6A625A",
  greyDeep:  "#3A3228",
  ink:       "#221E18",
  accent:    "#C17B5A",
  nav:       "#FFFFFF",
};

// ─── SVG Progress Ring (no library needed) ───────────────────────────────
function ProgressRing({ pct, color, size=56, stroke=5 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink:0, transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8E2DA" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition:"stroke-dashoffset .4s ease" }}/>
      <text x={size/2} y={size/2} dominantBaseline="middle" textAnchor="middle"
        fontSize={size < 50 ? 9 : 11} fontWeight="600" fill={NEW_G.greyDeep}
        style={{ transform:"rotate(90deg)", transformOrigin:`${size/2}px ${size/2}px` }}>
        {pct}%
      </text>
    </svg>
  );
}

// ─── Bottom Nav icons ────────────────────────────────────────────────────
const NAV_ICONS = {
  home:    ({active,col}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?col:"#A09890"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>,
  list:    ({active,col}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?col:"#A09890"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>,
  add:     () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  report:  ({active,col}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?col:"#A09890"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  settings:({active,col}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?col:"#A09890"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
};

// ─── Home Screen ──────────────────────────────────────────────────────────
function HomeScreen({ items, activityLog, onUpdate, onMove, onActivityLog, onEdit, onStatusChange, removeActivityLog }) {
  const FC = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";

  // ── Category config (colors + text from spec) ──────────────────────────
  const CAT_CARD = {
    article: { bg:"#DADCD1", fg:"#465135", dotColor:"#9EA89A" },
    live:    { bg:"#EDE6D6", fg:"#806C47", dotColor:"#BDAF98" },
    youtube: { bg:"#EBE1D8", fg:"#7A624C", dotColor:"#B8A99C" },
    radio:   { bg:"#DCE1DF", fg:"#485950", dotColor:"#A0AAAA" },
    tv:      { bg:"#DFDAD7", fg:"#534946", dotColor:"#A8A29F" },
    book:    { bg:"#DADCD1", fg:"#465135", dotColor:"#9EA89A" },
    anime:   { bg:"#EDE6D6", fg:"#806C47", dotColor:"#BDAF98" },
    drama:   { bg:"#EBE1D8", fg:"#7A624C", dotColor:"#B8A99C" },
    movie:   { bg:"#DCE1DF", fg:"#485950", dotColor:"#A0AAAA" },
    manga:   { bg:"#DFDAD7", fg:"#534946", dotColor:"#A8A29F" },
  };

  // ── State ─────────────────────────────────────────────────────────────
  const [selectedCat, setSelectedCat] = useState(null);
  const [pastRecordOpen, setPastRecord] = useState(false);
  const [focusToast, setFocusToast] = useState(null);
  const [focusConfetti, setFocusConfetti] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0=今週, -1=先週, -2=2週前, ...

  // ── Date: "22nd April, 2026" format ──────────────────────────────────
  const now = new Date();
  const day = now.getDate();
  const suffix = day===1||day===21||day===31?"st":day===2||day===22?"nd":day===3||day===23?"rd":"th";
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dateStr = `${day}${suffix} ${monthNames[now.getMonth()]}, ${now.getFullYear()}`;

  // ── Weekly calendar (Mon–Sun of selected week) ────────────────────────
  const weekDays = (() => {
    const days = [];
    const d = new Date(now);
    // Move to Monday of current week, then apply offset
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - dow + weekOffset * 7);
    const dayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    for (let i = 0; i < 7; i++) {
      const dd = new Date(d);
      const ymd = `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}`;
      const log = activityLog[ymd];
      let dotColor = null;
      if (log && typeof log === "object") {
        const entries = Object.entries(log).filter(([,v])=>v>0);
        if (entries.length > 0) {
          const top = entries.sort((a,b)=>b[1]-a[1])[0][0];
          dotColor = CAT_CARD[top]?.dotColor || "#B0A898";
        }
      }
      days.push({ date: dd.getDate(), label: dayLabels[i], ymd, dotColor,
        month: dd.getMonth()+1 });
      d.setDate(d.getDate()+1);
    }
    return days;
  })();

  // 表示週のラベル（例: "4月28日 〜 5月4日"）
  const weekLabel = (() => {
    if (weekOffset === 0) return "今週";
    if (weekOffset === -1) return "先週";
    const first = weekDays[0];
    const last  = weekDays[6];
    const sameMonth = first.month === last.month;
    return sameMonth
      ? `${first.month}月${first.date}日 〜 ${last.date}日`
      : `${first.month}月${first.date}日 〜 ${last.month}月${last.date}日`;
  })();

  // ── Today's Focus: manual selection or auto (closest to completion) ──
  const [manualFocusId, setManualFocusId] = useState(null);
  const [focusPicker, setFocusPicker]     = useState(false); // picker open/close

  const focusItem = (() => {
    // 手動選択が有効かつアイテムが存在する場合はそれを使う
    if (manualFocusId) {
      const found = items.find(i => i.id === manualFocusId && (i.status === "active" || i.status === "queue"));
      if (found) return found;
    }
    // 自動: 進行中から完了に最も近いものを選ぶ
    const active = items.filter(i => i.status === "active");
    if (active.length === 0) return null;
    return [...active].sort((a,b) => {
      const pa = a.total > 0 ? a.current/a.total : 0;
      const pb = b.total > 0 ? b.current/b.total : 0;
      return pb - pa;
    })[0];
  })();

  const focusCat = focusItem ? CATS[focusItem.category] : null;
  const focusPct = focusItem && focusItem.total > 0 ? Math.round(focusItem.current/focusItem.total*100) : 0;
  const focusRem = focusItem ? focusItem.total - focusItem.current : 0;
  const focusTotalMin = focusItem && (focusItem.category==="anime"||focusItem.category==="drama") && focusItem.episodeMin
    ? focusRem * focusItem.episodeMin : null;

  const focusQuickAdd = () => {
    if (!focusItem) return;
    const qa = focusItem.category==="book"?10:focusItem.category==="manga"?1:1;
    const nx = Math.min(focusItem.total, focusItem.current+qa);
    const newSt = resolveStatus(nx, focusItem.total);
    const histEntry = { date:today(), delta:nx-focusItem.current, from:focusItem.current, to:nx };
    const patch = { current:nx, lastUpdated:today(), status:newSt, progressHistory:[...(focusItem.progressHistory||[]),histEntry] };
    if (newSt==="active" && focusItem.status==="queue" && !focusItem.firstActiveAt) patch.firstActiveAt = today();
    onActivityLog(today(), focusItem.category);
    if (nx >= focusItem.total) {
      Object.assign(patch, { status:"done", completedAt:today(), current:focusItem.total });
      onUpdate(focusItem.id, patch);
      setFocusToast("完了！🎉"); setFocusConfetti(true);
    } else {
      onUpdate(focusItem.id, patch);
      setFocusToast("記録しました！");
    }
  };

  const focusComplete = () => {
    if (!focusItem) return;
    const logCount = ["youtube","tv","radio","live","article"].includes(focusItem.category) ? 1 : Math.max(focusRem, 1);
    for (let i=0;i<logCount;i++) onActivityLog(today(), focusItem.category);
    const histEntry = { date:today(), delta:focusRem, from:focusItem.current, to:focusItem.total, completedViaButton:true };
    onUpdate(focusItem.id, { progressHistory:[...(focusItem.progressHistory||[]),histEntry] });
    onMove(focusItem.id, "done");
    setFocusToast("完了！おめでとうございます 🎉"); setFocusConfetti(true);
  };

  // ── Count all items per category (status-agnostic) ───────────────────
  const catAllCounts = Object.fromEntries(
    Object.entries(CATS).map(([k]) => [k, items.filter(i=>i.category===k && i.status!=="done").length])
  );

  // ── Status info ───────────────────────────────────────────────────────
  const statusInfo = (st) => {
    if (st==="active") return { label:"進行中", color:"#6D849C" };
    if (st==="queue")  return { label:"これから", color:"#A09890" };
    return { label:"完了", color:"#7C8F5E" };
  };

  // Activity Log date tap popup
  const [actLogPopup, setActLogPopup] = useState(null); // { ymd, label, date }
  // Action sheet for edit/delete
  const [actActionSheet, setActActionSheet] = useState(null); // { item, hist, ymd }
  const [actEditDelta, setActEditDelta] = useState("");

  const handleActDelete = ({ item, hist }) => {
    let removed = false;
    const filtered = (item.progressHistory || []).filter(h => {
      if (!removed && h.date === hist.date && h.from === hist.from
        && h.to === hist.to && h.delta === hist.delta) {
        removed = true; return false;
      }
      return true;
    });
    const newCurrent = Math.max(0, item.current - (hist.delta || 0));
    const newStatus = newCurrent >= item.total && item.total > 0 ? "done"
      : newCurrent > 0 ? (item.status === "done" ? "active" : item.status)
      : item.status === "done" ? "queue" : item.status;
    onUpdate && onUpdate(item.id, {
      progressHistory: filtered, current: newCurrent,
      status: newStatus, completedAt: newStatus === "done" ? item.completedAt : null,
      lastUpdated: today(),
    });
    removeActivityLog && removeActivityLog(hist.date, item.category);
    setActActionSheet(null); setActLogPopup(null);
  };

  const handleActEdit = ({ item, hist, newDelta }) => {
    const delta = parseInt(newDelta);
    if (isNaN(delta) || delta <= 0) return;
    const diff = delta - (hist.delta || 0);
    const updated = (item.progressHistory || []).map(h =>
      h.date === hist.date && h.from === hist.from && h.to === hist.to && h.delta === hist.delta
        ? { ...h, delta, to: h.from + delta } : h
    );
    const newCurrent = Math.max(0, item.current + diff);
    const newStatus = newCurrent >= item.total && item.total > 0 ? "done" : item.status;
    onUpdate && onUpdate(item.id, {
      progressHistory: updated, current: newCurrent, status: newStatus,
      completedAt: newStatus === "done" ? (item.completedAt || today()) : item.completedAt,
      lastUpdated: today(),
    });
    if (diff > 0 && onActivityLog) for (let i=0;i<diff;i++) onActivityLog(hist.date, item.category);
    else if (diff < 0 && removeActivityLog) for (let i=0;i<Math.abs(diff);i++) removeActivityLog(hist.date, item.category);
    setActActionSheet(null); setActLogPopup(null);
  };

  return (
    <div style={{ background:"#FFFFFF", fontFamily:FC,
      display:"flex", flexDirection:"column" }}>

      {/* ① Header */}
      <div style={{ padding:"24px 20px 20px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:NEW_G.ink, letterSpacing:"0.1em",
            fontFamily:"'Outfit','Hiragino Sans','Noto Sans JP',sans-serif" }}>Home</div>
          <div style={{ fontSize:13, fontWeight:400, color:"#8A8A8A", marginTop:4, letterSpacing:"0.04em" }}>{dateStr}</div>
        </div>
      </div>

      {/* ② Activity Log */}
      <div style={{ padding:"0 20px 20px" }}>
        {/* Section header with week navigation */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"#8A8A8A",
            letterSpacing:"0.1em", textTransform:"uppercase" }}>Activity Log</div>
          {/* Week nav */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:10, fontWeight:500, color:"#8A8A8A",
              letterSpacing:"0.04em" }}>{weekLabel}</span>
            <button onClick={()=>setWeekOffset(w=>w-1)}
              style={{ width:24, height:24, borderRadius:7, border:"1px solid #E0DEDC",
                background:"none", cursor:"pointer", display:"flex",
                alignItems:"center", justifyContent:"center", padding:0, color:"#6A6A6A" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button onClick={()=>setWeekOffset(w=>Math.min(w+1, 0))}
              disabled={weekOffset >= 0}
              style={{ width:24, height:24, borderRadius:7,
                border:"1px solid #E0DEDC",
                background:"none", cursor: weekOffset >= 0 ? "default" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                padding:0, color:"#6A6A6A",
                opacity: weekOffset >= 0 ? 0.3 : 1 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
        <div style={{ background:"#F6F6F6", borderRadius:20, padding:"14px 10px 12px" }}>
          <div style={{ display:"flex", justifyContent:"space-around", alignItems:"flex-start" }}>
            {weekDays.map(({ date, label, ymd, dotColor }) => (
              <div key={label} onClick={()=>activityLog[ymd] ? setActLogPopup({ ymd, label, date }) : null}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                  cursor: activityLog[ymd] ? "pointer" : "default" }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#2A2A2A", letterSpacing:"-0.02em", lineHeight:1 }}>
                  {date}
                </div>
                <div style={{ fontSize:9, fontWeight:400, color:"#A0A0A0", letterSpacing:"0.04em" }}>
                  {label}
                </div>
                <div style={{
                  width:16, height:16, borderRadius:"50%",
                  background: dotColor || "transparent",
                  border: dotColor ? "none" : "1.5px solid #C8C4BE",
                  transition:"background .2s",
                }}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Log date detail popup */}
      {actLogPopup && (
        <div onClick={()=>setActLogPopup(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.32)", zIndex:600,
            display:"flex", alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#FFFFFF", borderRadius:"20px 20px 0 0",
              width:"100%", maxHeight:"70vh", overflowY:"auto",
              padding:"22px 20px 48px",
              boxShadow:"0 -6px 30px rgba(0,0,0,0.12)", fontFamily:FC }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#1A1A1A", letterSpacing:"0.04em" }}>
                {actLogPopup.date}日 ({actLogPopup.label}) の記録
              </span>
              <button onClick={()=>setActLogPopup(null)}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"#A0A0A0", fontSize:18, lineHeight:1, padding:4 }}>×</button>
            </div>
            {(() => {
              const ymd = actLogPopup.ymd;
              // progressHistoryからその日の記録を収集
              const entries = [];
              items.forEach(item => {
                (item.progressHistory||[]).forEach(h => {
                  if (h.date !== ymd) return;
                  const cat = CATS[item.category];
                  const effectiveUnit = item.category==="manga" ? (item.mangaUnit||"巻") : cat?.unit || "";
                  let amountStr;
                  if (h.delta > 0) {
                    const pctAfter = item.total > 0 ? Math.round(h.to / item.total * 100) : null;
                    const fromTo = h.from !== undefined && h.to !== undefined
                      ? `${h.from}→${h.to}${effectiveUnit}${pctAfter !== null ? ` (${pctAfter}%)` : ""}`
                      : "";
                    amountStr = `+${h.delta}${effectiveUnit}${fromTo ? `　${fromTo}` : ""}`;
                  } else if (h.completedViaButton) {
                    amountStr = "完了にした";
                  } else if (h.editedViaModal) {
                    amountStr = "編集済み";
                  } else {
                    amountStr = "ステータス変更";
                  }
                  entries.push({ item, amountStr, hist: h });
                });
              });
              if (entries.length === 0) {
                // fallback: just show category counts
                const log = activityLog[ymd];
                if (!log) return <div style={{ fontSize:12, color:"#A0A0A0", padding:"10px 0" }}>詳細データなし</div>;
                return Object.entries(log).filter(([,v])=>v>0).map(([cat, count]) => {
                  const catInfo = CATS[cat];
                  const badge = CAT_CARD[cat] || { bg:"#EBEBEB", fg:"#666" };
                  return (
                    <div key={cat} style={{ display:"flex", alignItems:"center", gap:10,
                      padding:"10px 0", borderBottom:"1px solid #F0EEEC" }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                        background:badge.bg, borderRadius:7, padding:"3px 9px", flexShrink:0 }}>
                        <CatIco cat={cat} color={badge.fg}/>
                        <span style={{ fontSize:10, fontWeight:600, color:badge.fg, letterSpacing:"0.04em" }}>{catInfo?.label}</span>
                      </span>
                      <span style={{ fontSize:12, fontWeight:500, color:"#3A3A3A", letterSpacing:"0.03em" }}>{count}回記録</span>
                    </div>
                  );
                });
              }
              return entries.map(({ item, amountStr, hist }, idx) => {
                const cat = CATS[item.category];
                const badge = CAT_CARD[item.category] || { bg:"#EBEBEB", fg:"#666" };
                return (
                  <div key={idx}
                    onClick={() => { setActActionSheet({ item, hist }); setActEditDelta(String(hist.delta || "")); }}
                    style={{ display:"flex", alignItems:"center", gap:10,
                      padding:"10px 0", borderBottom:"1px solid #F0EEEC", cursor:"pointer" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                      background:badge.bg, borderRadius:7, padding:"3px 9px", flexShrink:0 }}>
                      <CatIco cat={item.category} color={badge.fg}/>
                      <span style={{ fontSize:10, fontWeight:600, color:badge.fg, letterSpacing:"0.04em" }}>{cat?.label}</span>
                    </span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"#1A1A1A",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        letterSpacing:"0.03em" }}>{item.title}</div>
                      <div style={{ fontSize:11, fontWeight:400, color:"#A0A0A0",
                        letterSpacing:"0.03em", marginTop:1 }}>{amountStr}</div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="#C8C4BE" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ── Action Sheet: 編集 / 削除 ── */}
      {actActionSheet && (
        <div onClick={()=>setActActionSheet(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)",
            zIndex:700, display:"flex", alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#FFFFFF", borderRadius:"20px 20px 0 0",
              width:"100%", padding:"22px 20px 48px",
              boxShadow:"0 -6px 30px rgba(0,0,0,0.12)", fontFamily:FC }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#1A1A1A",
              marginBottom:4, letterSpacing:"0.04em" }}>
              {actActionSheet.item.title}
            </div>
            <div style={{ fontSize:11, fontWeight:400, color:"#A0A0A0",
              letterSpacing:"0.03em", marginBottom:20 }}>
              {actActionSheet.hist.date}
              {actActionSheet.hist.delta > 0 &&
                ` ／ +${actActionSheet.hist.delta}${CATS[actActionSheet.item.category]?.unit || ""}`}
            </div>

            {/* 編集 */}
            {actActionSheet.hist.delta > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#6A6A6A",
                  letterSpacing:"0.06em", marginBottom:8 }}>記録を修正</div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input type="number" min="1" value={actEditDelta}
                    onChange={e=>setActEditDelta(e.target.value)}
                    style={{ flex:1, padding:"10px 12px", borderRadius:10,
                      border:"1.5px solid #E8E2DA", fontSize:14, fontWeight:600,
                      color:"#1A1A1A", fontFamily:FC, outline:"none", textAlign:"center" }}
                    placeholder="修正後の数量"/>
                  <span style={{ fontSize:12, color:"#6A6A6A", flexShrink:0 }}>
                    {CATS[actActionSheet.item.category]?.unit || ""}
                  </span>
                  <button
                    onClick={()=>handleActEdit({ item:actActionSheet.item, hist:actActionSheet.hist, newDelta:actEditDelta })}
                    style={{ padding:"10px 18px", borderRadius:10, border:"none",
                      background:"#BFBFBF", color:"#fff", fontSize:12, fontWeight:700,
                      cursor:"pointer", fontFamily:FC, letterSpacing:"0.04em", flexShrink:0 }}>
                    修正する
                  </button>
                </div>
              </div>
            )}

            {/* 削除 */}
            <button onClick={()=>handleActDelete(actActionSheet)}
              style={{ width:"100%", padding:"13px", borderRadius:12,
                border:"1.5px solid #E8E2DA", background:"transparent",
                color:"#B05050", fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:FC, letterSpacing:"0.03em", marginBottom:10 }}>
              この記録を削除する
            </button>
            <button onClick={()=>setActActionSheet(null)}
              style={{ width:"100%", padding:"13px", borderRadius:12,
                border:"1.5px solid #E8E2DA", background:"transparent",
                color:"#6A625A", fontSize:13, fontWeight:500,
                cursor:"pointer", fontFamily:FC, letterSpacing:"0.03em" }}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ③ Today's Focus */}
      <div style={{ padding:"0 20px 20px" }}>
        {/* Section header with 変更する button */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"#8A8A8A", letterSpacing:"0.1em",
            textTransform:"uppercase" }}>Today's Focus</div>
          {/* 変更するボタン */}
          {items.filter(i=>i.status==="active"||i.status==="queue").length > 0 && (
            <button onClick={()=>setFocusPicker(true)}
              style={{ background:"none", border:"1px solid #E0DEDC", borderRadius:8,
                padding:"4px 10px", fontSize:10, fontWeight:600, color:"#6A6A6A",
                cursor:"pointer", fontFamily:FC, letterSpacing:"0.04em" }}>
              変更する
            </button>
          )}
        </div>

        {focusItem ? (
          <div onClick={()=>onEdit(focusItem)}
            style={{ background:"#F6F6F6", borderRadius:20, padding:"18px 16px 14px",
              cursor:"pointer", position:"relative" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
              {/* Left */}
              <div style={{ flex:1, minWidth:0 }}>
                {/* Title */}
                <div style={{ fontSize:15, fontWeight:700, color:"#1A1A1A",
                  letterSpacing:"0.06em", lineHeight:1.3, marginBottom:4,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {focusItem.title}
                </div>
                {/* Remaining time */}
                {focusTotalMin != null && focusRem > 0 && (
                  <div style={{ fontSize:12, fontWeight:400, color:"#8A8A8A",
                    letterSpacing:"0.03em", marginBottom:12 }}>
                    あと{fmtGap(focusTotalMin)}（{focusItem.episodeMin}分×{focusRem}回分）
                  </div>
                )}
                {!focusTotalMin && (
                  <div style={{ fontSize:12, fontWeight:400, color:"#8A8A8A",
                    letterSpacing:"0.03em", marginBottom:12 }}>
                    {focusItem.current} / {focusItem.total} {CATS[focusItem.category].unit}
                  </div>
                )}
                {/* Buttons row */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }} onClick={e=>e.stopPropagation()}>
                  {/* Category tag — filled bg, no border */}
                  {(()=>{
                    const TAG_BG2 = { article:"#DADCD1",live:"#EDE6D6",youtube:"#EBE1D8",radio:"#DCE1DF",tv:"#DFDAD7",book:"#DADCD1",anime:"#EDE6D6",drama:"#EBE1D8",movie:"#DCE1DF",manga:"#DFDAD7" };
                    const TAG_FG2 = { article:"#465135",live:"#806C47",youtube:"#7A624C",radio:"#485950",tv:"#534946",book:"#465135",anime:"#806C47",drama:"#7A624C",movie:"#485950",manga:"#534946" };
                    return (
                      <span style={{ fontSize:11, fontWeight:600,
                        background: TAG_BG2[focusItem.category] || "#EBEBEB",
                        color: TAG_FG2[focusItem.category] || "#555",
                        borderRadius:8, padding:"4px 10px", letterSpacing:"0.04em" }}>
                        {focusCat.label}
                      </span>
                    );
                  })()}
                  {/* Past record */}
                  <button onClick={()=>setPastRecord(true)}
                    style={{ fontSize:11, fontWeight:500, color:"#5A5A5A",
                      background:"transparent", border:"1.5px solid #C8C4BE",
                      borderRadius:8, padding:"4px 12px", cursor:"pointer",
                      fontFamily:FC, letterSpacing:"0.03em", lineHeight:1.4 }}>
                    過去の記録
                  </button>
                  {/* Complete */}
                  <button onClick={focusComplete}
                    style={{ fontSize:11, fontWeight:500, color:"#5A5A5A",
                      background:"transparent", border:"1.5px solid #C8C4BE",
                      borderRadius:8, padding:"4px 12px", cursor:"pointer",
                      fontFamily:FC, letterSpacing:"0.03em", lineHeight:1.4 }}>
                    完了にする
                  </button>
                </div>
              </div>

              {/* Right: progress ring */}
              <div style={{ flexShrink:0 }}>
                <ProgressRing pct={focusPct} color={focusCat.color} size={64} stroke={5}/>
              </div>
            </div>

            {focusToast && <Toast msg={focusToast} onHide={()=>setFocusToast(null)}/>}
            {focusConfetti && <Confetti onDone={()=>setFocusConfetti(false)}/>}
          </div>
        ) : (
          <div style={{ background:"#F6F6F6", borderRadius:20, padding:"28px 16px",
            textAlign:"center", color:"#A0A0A0", fontSize:13, letterSpacing:"0.04em" }}>
            進行中のコンテンツがありません
          </div>
        )}

        {/* PastRecordModal for focus item */}
        {pastRecordOpen && focusItem && (
          <PastRecordModal item={focusItem} onSave={({ date, amount }) => {
            const nx = Math.min(focusItem.total, focusItem.current+amount);
            const newSt = resolveStatus(nx, focusItem.total);
            const histEntry = { date, delta:nx-focusItem.current, from:focusItem.current, to:nx };
            const patch = { current:nx, lastUpdated:date, status:newSt, progressHistory:[...(focusItem.progressHistory||[]),histEntry] };
            onActivityLog(date, focusItem.category);
            if (nx>=focusItem.total) Object.assign(patch, { status:"done", completedAt:date, current:focusItem.total });
            onUpdate(focusItem.id, patch);
            setPastRecord(false);
            setFocusToast(`${date} の記録を追加しました`);
          }} onClose={()=>setPastRecord(false)}/>
        )}
      </div>

      {/* ── Focus Picker Sheet ── */}
      {focusPicker && (
        <div onClick={()=>setFocusPicker(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.32)", zIndex:600,
            display:"flex", alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#FFFFFF", borderRadius:"22px 22px 0 0",
              width:"100%", maxHeight:"75vh", display:"flex", flexDirection:"column",
              boxShadow:"0 -8px 36px rgba(0,0,0,0.12)", fontFamily:FC }}>
            {/* Header */}
            <div style={{ padding:"20px 20px 14px", borderBottom:"1px solid #F0EEEC", flexShrink:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#1A1A1A", letterSpacing:"0.04em" }}>
                  Today's Focus を選択
                </span>
                <button onClick={()=>setFocusPicker(false)}
                  style={{ background:"none", border:"none", cursor:"pointer",
                    color:"#A0A0A0", fontSize:18, lineHeight:1, padding:4 }}>×</button>
              </div>
              <div style={{ fontSize:11, fontWeight:400, color:"#A0A0A0", marginTop:4, letterSpacing:"0.04em" }}>
                進行中・これからのコンテンツから選択してください
              </div>
            </div>
            {/* List */}
            <div style={{ overflowY:"auto", padding:"8px 16px 48px", flex:1 }}>
              {["active","queue"].map(st => {
                const group = items.filter(i=>i.status===st);
                if (group.length === 0) return null;
                const stLabel = st === "active" ? "進行中" : "これから";
                return (
                  <div key={st} style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#A0A0A0",
                      letterSpacing:"0.1em", textTransform:"uppercase",
                      padding:"10px 0 6px" }}>{stLabel}</div>
                    {group.map(item => {
                      const catBg = { article:"#DADCD1",live:"#EDE6D6",youtube:"#EBE1D8",radio:"#DCE1DF",tv:"#DFDAD7",book:"#DADCD1",anime:"#EDE6D6",drama:"#EBE1D8",movie:"#DCE1DF",manga:"#DFDAD7" };
                      const catFg = { article:"#465135",live:"#806C47",youtube:"#7A624C",radio:"#485950",tv:"#534946",book:"#465135",anime:"#806C47",drama:"#7A624C",movie:"#485950",manga:"#534946" };
                      const isSelected = focusItem?.id === item.id;
                      return (
                        <button key={item.id}
                          onClick={()=>{ setManualFocusId(item.id); setFocusPicker(false); }}
                          style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                            padding:"11px 12px", marginBottom:6, borderRadius:12, fontFamily:FC,
                            border: isSelected ? `1.5px solid ${CATS[item.category].color}` : "1px solid #ECEAE7",
                            background: isSelected ? "#FAFAFA" : "#FAFAFA",
                            cursor:"pointer", textAlign:"left",
                            boxShadow: isSelected ? `0 0 0 2px ${CATS[item.category].color}33` : "none" }}>
                          {/* Category badge */}
                          <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                            background:catBg[item.category]||"#EBEBEB", borderRadius:7,
                            padding:"3px 9px", flexShrink:0 }}>
                            <CatIco cat={item.category} color={catFg[item.category]||"#555"}/>
                            <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.04em",
                              color:catFg[item.category]||"#555" }}>
                              {CATS[item.category]?.label}
                            </span>
                          </span>
                          {/* Title */}
                          <div style={{ flex:1, minWidth:0,
                            fontSize:13, fontWeight:500, color:"#1A1A1A",
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                            letterSpacing:"0.03em" }}>
                            {item.title}
                          </div>
                          {/* Check mark for current selection */}
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                              stroke={CATS[item.category].color} strokeWidth="2.5" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              {/* 自動選択に戻す */}
              {manualFocusId && (
                <button onClick={()=>{ setManualFocusId(null); setFocusPicker(false); }}
                  style={{ width:"100%", padding:"12px", borderRadius:12, marginTop:4,
                    border:"1px solid #E8E2DA", background:"transparent",
                    color:"#6A6A6A", fontSize:12, fontWeight:500,
                    cursor:"pointer", fontFamily:FC, letterSpacing:"0.04em" }}>
                  自動選択に戻す（完了間近を優先）
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ④ Categories — 5 cards visible, scroll for rest */}
      <div style={{ padding:"0 20px 8px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#8A8A8A", letterSpacing:"0.1em",
          textTransform:"uppercase", marginBottom:12 }}>Categories</div>
        <div style={{
          display:"flex", flexWrap:"nowrap", gap:7,
          overflowX:"auto", paddingBottom:8,
          scrollbarWidth:"none", WebkitOverflowScrolling:"touch",
        }}>
          {CAT_KEYS.map(k => {
            const cfg = CAT_CARD[k];
            const totalCount = catAllCounts[k];
            return (
              <div key={k} onClick={()=>setSelectedCat(k)} style={{
                flex:"0 0 calc(20% - 6px)",
                minWidth:0,
                minHeight:90,
                background: cfg.bg,
                borderRadius:22,
                padding:"8px 6px 8px",
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                gap:4,
                cursor:"pointer",
              }}>
                {/* Icon circle */}
                <div style={{ width:34, height:34, borderRadius:"50%",
                  background:"#FFFFFF", flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                  <CatIco cat={k} color={cfg.fg}/>
                </div>
                {/* Label */}
                <div style={{ fontSize:9, fontWeight:600, color:cfg.fg,
                  letterSpacing:"0.03em", textAlign:"center", lineHeight:1.2,
                  whiteSpace:"nowrap" }}>
                  {CATS[k].label}
                </div>
                {/* Count */}
                <div style={{ fontSize:15, fontWeight:700, color:cfg.fg,
                  letterSpacing:"-0.02em", lineHeight:1 }}>
                  {totalCount}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Detail Sheet */}
      {selectedCat && (() => {
        const FC2 = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";
        const allInCat = items.filter(i => i.category === selectedCat);
        const STATUS_TABS = [
          { key:"all",    label:"すべて" },
          { key:"active", label:"進行中" },
          { key:"queue",  label:"これから" },
          { key:"done",   label:"完了" },
        ];
        return (
          <CatDetailSheet
            key={selectedCat}
            cat={selectedCat}
            items={allInCat}
            statusInfo={statusInfo}
            CAT_CARD={CAT_CARD}
            FC={FC2}
            STATUS_TABS={STATUS_TABS}
            onClose={()=>setSelectedCat(null)}
          />
        );
      })()}
    </div>
  );
}

// ── Category Detail Sheet (sub-component) ────────────────────────────────────
function CatDetailSheet({ cat, items, statusInfo, CAT_CARD, FC, STATUS_TABS, onClose }) {
  const [statusTab, setStatusTab] = React.useState("all");

  const filtered = statusTab === "all"
    ? items
    : items.filter(i => i.status === statusTab);

  // Count per status for badge
  const counts = {
    all:    items.length,
    active: items.filter(i=>i.status==="active").length,
    queue:  items.filter(i=>i.status==="queue").length,
    done:   items.filter(i=>i.status==="done").length,
  };

  const bg  = CAT_CARD[cat]?.bg  || "#EBEBEB";
  const fg  = CAT_CARD[cat]?.fg  || "#555";

  return (
    <div onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.28)", zIndex:500,
        display:"flex", alignItems:"flex-end" }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#FFFFFF", borderRadius:"22px 22px 0 0",
        width:"100%", maxHeight:"82vh", display:"flex", flexDirection:"column",
        boxShadow:"0 -8px 36px rgba(0,0,0,0.10)",
      }}>
        {/* Header */}
        <div style={{ padding:"20px 18px 0", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:"50%",
                background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <CatIco cat={cat} color={fg}/>
              </div>
              <span style={{ fontSize:15, fontWeight:700, color:"#1A1A1A",
                letterSpacing:"0.04em", fontFamily:FC }}>
                {CATS[cat].label}
              </span>
              <span style={{ fontSize:12, color:"#A0A0A0", fontWeight:400 }}>
                {items.length}件
              </span>
            </div>
            <button onClick={onClose}
              style={{ background:"none", border:"none", cursor:"pointer",
                color:"#A0A0A0", fontSize:20, padding:4, lineHeight:1 }}>×</button>
          </div>

          {/* Status filter tabs */}
          <div style={{ display:"flex", background:"#F6F6F6", borderRadius:11,
            padding:3, gap:2, marginBottom:14 }}>
            {STATUS_TABS.map(({ key, label }) => {
              const isAct = statusTab === key;
              const cnt = counts[key];
              return (
                <button key={key} onClick={()=>setStatusTab(key)}
                  style={{ flex:1, padding:"6px 4px", borderRadius:9, border:"none",
                    fontSize:11, fontWeight:isAct?700:500,
                    background: isAct ? "#FFFFFF" : "transparent",
                    color: isAct ? "#1A1A1A" : "#A0A0A0",
                    cursor:"pointer", fontFamily:FC, transition:"all .15s",
                    boxShadow: isAct ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
                    letterSpacing:"0.02em",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}>
                  {label}
                  {cnt > 0 && (
                    <span style={{ fontSize:9, fontWeight:600,
                      color: isAct ? "#767676" : "#C0C0C0" }}>
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY:"auto", padding:"0 18px 48px", flex:1 }}>
          {filtered.length === 0 ? (
            <div style={{ fontSize:13, color:"#A0A0A0", textAlign:"center",
              padding:"28px 0", letterSpacing:"0.04em" }}>
              {statusTab === "all" ? "登録されているコンテンツがありません"
                : statusTab === "active" ? "進行中のコンテンツがありません"
                : statusTab === "queue"  ? "「これから」のコンテンツがありません"
                : "完了したコンテンツがありません"}
            </div>
          ) : (
            filtered.map((item, idx) => {
              const st = statusInfo(item.status);
              const catFg = CAT_CARD[cat]?.fg || "#555";
              return (
                <div key={item.id} style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"11px 0",
                  borderBottom: idx < filtered.length-1 ? "1px solid #F0EEEC" : "none",
                }}>
                  <span style={{ fontSize:13, fontWeight:500, color:"#1A1A1A",
                    flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis",
                    whiteSpace:"nowrap", letterSpacing:"0.03em", lineHeight:1.5,
                    fontFamily:FC }}>
                    {item.title}
                  </span>
                  <span style={{ flexShrink:0, marginLeft:10,
                    fontSize:10, fontWeight:500, color:catFg,
                    border:`1px solid ${catFg}`, borderRadius:6,
                    padding:"2px 8px", letterSpacing:"0.05em", lineHeight:1.6,
                    fontFamily:FC }}>
                    {st.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Contents Screen ──────────────────────────────────────────────────────
function ContentsScreen({
  items, watchQueue, setWatchQueue, activityLog,
  onUpdate, onEdit, onMove,
  onActivityLog, onStatusChange, removeActivityLog,
  onReorder,
}) {
  const F2 = "'Outfit','Hiragino Sans','Noto Sans JP',sans-serif";
  const [tab, setTab] = useState(0);       // 0=進行中, 1=これから, 2=完了
  const [filter, setFilter] = useState(ALL);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sortQueue, setSortQueue] = useState("manual");
  const [sortDone, setSortDone]   = useState("completedDesc");
  const [nvChooseOpen, setNvChooseOpen] = useState(false);
  const [nvOpen, setNvOpen] = useState(false);

  // Tab labels
  const TABS2 = ["進行中", "これから", "完了"];

  function applySort2(list, sortKey, wqIds) {
    const arr = [...list];
    const catOrder = k => CATS[k]?.order ?? 99;
    if (sortKey === "manual") {
      const wqSet = new Set(wqIds || []);
      const inWq  = (wqIds || []).map(id => arr.find(i => i.id === id)).filter(Boolean);
      const rest  = arr.filter(i => !wqSet.has(i.id)).sort((a,b) => a.priority - b.priority);
      return [...inWq, ...rest];
    }
    const dur = i => {
      const s = i.firstActiveAt || i.startedAt;
      const e = i.completedAt || (i.status==="active"?today():null);
      if (!s || !e) return 0;
      return daysBetween(s, e) || 0;
    };
    switch(sortKey) {
      case "category":      return arr.sort((a,b) => catOrder(a.category) - catOrder(b.category));
      case "updatedDesc":   return arr.sort((a,b) => (b.lastUpdated||"").localeCompare(a.lastUpdated||""));
      case "updatedAsc":    return arr.sort((a,b) => (a.lastUpdated||"").localeCompare(b.lastUpdated||""));
      case "completedDesc": return arr.sort((a,b) => (b.completedAt||"").localeCompare(a.completedAt||""));
      case "completedAsc":  return arr.sort((a,b) => (a.completedAt||"").localeCompare(b.completedAt||""));
      case "addedDesc":     return arr.sort((a,b) => (b.addedAt||"").localeCompare(a.addedAt||""));
      case "addedAsc":      return arr.sort((a,b) => (a.addedAt||"").localeCompare(b.addedAt||""));
      case "startedDesc":   return arr.sort((a,b) => (b.startedAt||"").localeCompare(a.startedAt||""));
      case "startedAsc":    return arr.sort((a,b) => (a.startedAt||"").localeCompare(b.startedAt||""));
      case "durationDesc":  return arr.sort((a,b) => dur(b) - dur(a));
      case "durationAsc":   return arr.sort((a,b) => dur(a) - dur(b));
      default: return arr;
    }
  }

  const active = items.filter(i=>i.status==="active").sort((a,b)=>a.priority-b.priority);
  const wqValidIds = watchQueue.filter(id => items.find(i => i.id===id && i.status==="queue"));
  const queue  = applySort2(items.filter(i=>i.status==="queue"), sortQueue, wqValidIds);
  const done   = applySort2(items.filter(i=>i.status==="done"), sortDone);
  const lists  = [active, queue, done];
  const cur    = lists[tab];
  const wqValid = wqValidIds;

  const counts = Object.fromEntries(FILTER_OPTS.map(label => {
    if(label===ALL) return [label, cur.length];
    const k = BY_LABEL[label]; return [label, cur.filter(i=>i.category===k).length];
  }));

  const catFiltered = filter===ALL ? cur : cur.filter(i => CATS[i.category]?.label===filter);
  const filtered = search.trim()
    ? catFiltered.filter(i => i.title.toLowerCase().includes(search.trim().toLowerCase()))
    : catFiltered;

  const SORT_OPTS_QUEUE = [
    { key:"manual",       label:"手動順" },
    { key:"category",     label:"カテゴリ順" },
    { key:"updatedDesc",  label:"最近更新した順" },
    { key:"updatedAsc",   label:"古い更新順" },
    { key:"addedDesc",    label:"登録日（新しい順）" },
    { key:"addedAsc",     label:"登録日（古い順）" },
    { key:"startedDesc",  label:"開始日（新しい順）" },
    { key:"startedAsc",   label:"開始日（古い順）" },
    { key:"durationDesc", label:"視聴期間（長い順）" },
    { key:"durationAsc",  label:"視聴期間（短い順）" },
  ];
  const SORT_OPTS_DONE = [
    { key:"completedDesc", label:"完了日（新しい順）" },
    { key:"completedAsc",  label:"完了日（古い順）" },
    { key:"category",      label:"カテゴリ順" },
    { key:"updatedDesc",   label:"最近更新した順" },
    { key:"updatedAsc",    label:"古い更新順" },
    { key:"addedDesc",     label:"登録日（新しい順）" },
    { key:"addedAsc",      label:"登録日（古い順）" },
    { key:"startedDesc",   label:"開始日（新しい順）" },
    { key:"startedAsc",    label:"開始日（古い順）" },
    { key:"durationDesc",  label:"視聴期間（長い順）" },
    { key:"durationAsc",   label:"視聴期間（短い順）" },
  ];

  return (
    <div style={{ fontFamily:F2, background:"#F7F7F7" }}>
      {/* Header — sticky */}
      <div style={{ padding:"24px 18px 12px", background:NEW_G.surface,
        position:"sticky", top:0, zIndex:10,
        borderBottom:`1px solid ${NEW_G.border}` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontSize:22, fontWeight:700, color:NEW_G.ink, letterSpacing:"0.1em" }}>Contents</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{ setShowSearch(s=>!s); setShowFilter(false); }}
              style={{ background:showSearch?NEW_G.surfaceAlt:"none", border:showSearch?`1.5px solid ${NEW_G.border}`:"none",
                borderRadius:9, cursor:"pointer", padding:"6px 8px", color:showSearch?"#BFBFBF":NEW_G.greyMid, display:"flex" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
            <button onClick={()=>{ setShowFilter(s=>!s); setShowSearch(false); }}
              style={{ background:showFilter?NEW_G.surfaceAlt:"none", border:showFilter?`1.5px solid ${NEW_G.border}`:"none",
                borderRadius:9, cursor:"pointer", padding:"6px 8px", color:showFilter?"#BFBFBF":NEW_G.greyMid, display:"flex" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div style={{ position:"relative", marginBottom:12 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={NEW_G.greyMid} strokeWidth="1.8" strokeLinecap="round"
              style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="タイトルで検索…"
              style={{ width:"100%", padding:"9px 12px 9px 34px", border:`1.5px solid ${NEW_G.border}`, borderRadius:10,
                fontSize:12, fontFamily:F2, background:NEW_G.surfaceAlt, color:NEW_G.ink, outline:"none", boxSizing:"border-box" }}
              autoFocus/>
          </div>
        )}

        {/* Filter chips */}
        {showFilter && (
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, marginBottom:10, scrollbarWidth:"none" }}>
            {FILTER_OPTS.map(label => {
              const k = BY_LABEL[label];
              const isAll = !k; // "すべて"
              const color = isAll ? "#BFBFBF" : CATS[k].color;
              const isAct = filter === label;
              return (
                <button key={label} onClick={()=>setFilter(label)}
                  style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"5px 13px", borderRadius:99,
                    fontSize:11, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, fontFamily:F2,
                    border: isAct ? "none" : `1.5px solid ${NEW_G.border}`,
                    background: isAct ? color : "transparent",
                    color: isAct ? "#fff" : NEW_G.greyDark }}>
                  {k && <CatIco cat={k} color={isAct?"#fff":NEW_G.greyMid}/>}
                  {label}
                  {counts[label]>0 && <span style={{ background:isAct?"rgba(255,255,255,0.3)":"#E8E2DA", color:isAct?"#fff":NEW_G.greyDark, borderRadius:99, padding:"0px 5px", fontSize:9 }}>{counts[label]}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Tab selector — pill style */}
        <div style={{ display:"flex", background:NEW_G.surfaceAlt, borderRadius:11, padding:3, gap:2 }}>
          {TABS2.map((t, i) => (
            <button key={t} onClick={()=>{ setTab(i); setFilter(ALL); setSearch(""); }}
              style={{ flex:1, padding:"7px 4px", borderRadius:9, border:"none",
                fontSize:12, fontWeight:tab===i?700:500,
                background: tab===i ? NEW_G.surface : "transparent",
                color: tab===i ? NEW_G.ink : NEW_G.greyMid,
                cursor:"pointer", fontFamily:F2, transition:"all .15s",
                boxShadow: tab===i ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
              }}>
              {t} <span style={{ fontSize:9, opacity:.6, letterSpacing:"0.06em" }}> ( {lists[i].length} ) </span>
            </button>
          ))}
        </div>

        {/* Sort + WQ button row */}
        {(tab===1||tab===2||tab===1) && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
            {(tab===1||tab===2) && (
              <select value={tab===1?sortQueue:sortDone} onChange={e=>tab===1?setSortQueue(e.target.value):setSortDone(e.target.value)}
                style={{ fontSize:11, color:NEW_G.greyDark, background:NEW_G.surfaceAlt, border:`1px solid ${NEW_G.border}`,
                  borderRadius:8, padding:"5px 10px", fontFamily:F2, outline:"none", cursor:"pointer" }}>
                {(tab===1?SORT_OPTS_QUEUE:SORT_OPTS_DONE).map(o=><option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            )}
            {tab===1 && queue.length>0 && (
              <button onClick={()=>setNvOpen(true)}
                style={{ fontSize:11, color:NEW_G.greyDark, background:NEW_G.surfaceAlt, border:`1px solid ${NEW_G.border}`,
                  borderRadius:8, padding:"5px 12px", fontFamily:F2, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                <ICONS.pin/> Watch Queue ({wqValid.length}/5)
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── List ── */}
      <div style={{ padding:"16px 16px 20px" }}>
        {/* 完走バナー — リストの上 */}
        {tab===2 && done.length>0 && (
          <div style={{ textAlign:"center", padding:"8px 0 14px", fontSize:11,
            color:NEW_G.greyDark, fontWeight:600, letterSpacing:"0.12em" }}>
            {done.length}作品を完走しました！
          </div>
        )}
        {filtered.length===0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:NEW_G.greyMid, fontSize:13, lineHeight:1.8 }}>
            {search.trim()
              ? `「${search}」に一致するコンテンツがありません`
              : tab===0 ? "進行中のコンテンツがありません"
              : tab===1 ? "「＋」でコンテンツを登録しましょう"
              : "完了したコンテンツがありません"}
          </div>
        )}
        {filtered.map((item, idx) => (
          <div key={item.id} style={{ position:"relative" }}>
        {/* Reorder arrows for 進行中 tab — 枠線から離して、ring との間隔を詰める */}
        {tab===0 && (
          <div style={{ position:"absolute", top:10, right:10, zIndex:2,
            display:"flex", flexDirection:"column", gap:2 }}
            onClick={e=>e.stopPropagation()}>
            <button
              onClick={()=>onReorder(active, active.findIndex(i=>i.id===item.id), -1)}
              disabled={active.findIndex(i=>i.id===item.id)===0}
              style={{ width:20, height:20, borderRadius:5, border:`1px solid ${NEW_G.border}`,
                background:NEW_G.surface, cursor:"pointer", display:"flex",
                alignItems:"center", justifyContent:"center", padding:0,
                opacity:active.findIndex(i=>i.id===item.id)===0 ? 0.3 : 1 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={NEW_G.greyDark} strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
            <button
              onClick={()=>onReorder(active, active.findIndex(i=>i.id===item.id), 1)}
              disabled={active.findIndex(i=>i.id===item.id)===active.length-1}
              style={{ width:20, height:20, borderRadius:5, border:`1px solid ${NEW_G.border}`,
                background:NEW_G.surface, cursor:"pointer", display:"flex",
                alignItems:"center", justifyContent:"center", padding:0,
                opacity:active.findIndex(i=>i.id===item.id)===active.length-1 ? 0.3 : 1 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={NEW_G.greyDark} strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
        )}
            <NewItemCard
              item={item}
              onUpdate={onUpdate}
              onEdit={onEdit}
              onMove={onMove}
              nvIndex={tab===1 ? wqValid.indexOf(item.id) : -1}
              onActivityLog={onActivityLog}
              onStatusChange={onStatusChange}
              removeActivityLog={removeActivityLog}
            />
          </div>
        ))}
      </div>

      {nvOpen && (
        <WatchQueuePicker
          queueItems={queue}
          watchQueue={wqValid}
          onSave={wq=>{ if (setWatchQueue) setWatchQueue(wq); }}
          onClose={()=>setNvOpen(false)}
        />
      )}
    </div>
  );
}

// ─── New Item Card (詳細表示リデザイン版) ─────────────────────────────────
function NewItemCard({ item, onUpdate, onEdit, onMove, nvIndex, onActivityLog, onStatusChange, removeActivityLog }) {
  const c = CATS[item.category];
  const p = pct(item.current, item.total);
  const rem = item.total - item.current;
  const [toast, setToast] = useState(null);
  const [timerOpen, setTimerOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pastRecordOpen, setPastRecord] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);  // メモポップアップ

  // ① フォント: Inter + Noto Sans JP（細め・クリーン）
  const FC = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";
  const hasNotes = item.notes && item.notes.trim().length > 0;

  const isBinary = ["youtube","tv","radio","live","article"].includes(item.category);
  const isYT    = item.category === "youtube";
  const isTV    = item.category === "tv";
  const isRadio = item.category === "radio";
  const isTimedProgress = ["youtube","tv","radio","live"].includes(item.category);
  const effectiveUnit = item.category === "manga" ? (item.mangaUnit || "巻") : c.unit;

  const qa = item.category==="book"?10:item.category==="manga"?1
    :(item.category==="anime"||item.category==="drama")?1
    :isTimedProgress?10   // +10分
    :item.category==="movie"?10:1;
  const ql = item.category==="book"?"+10P":item.category==="manga"?`+1${effectiveUnit}`
    :(item.category==="anime"||item.category==="drama")?"+1話"
    :isTimedProgress?"+10分"
    :item.category==="movie"?"+10分"
    :"読了";

  const isNext = nvIndex === 0;
  const isWQ   = nvIndex > 0;

  // totalMin for "あとX時間Y分" hint
  const totalMin =
    (item.category==="anime"||item.category==="drama") && item.episodeMin ? rem * item.episodeMin :
    item.category==="movie" && item.episodeMin ? item.episodeMin * (1 - p/100) :
    (isTV||isRadio) && item.totalDurationMin ? item.totalDurationMin :
    isYT && item.videoDurationMin ? item.videoDurationMin :
    item.category==="article" && item.episodeMin ? item.episodeMin * rem : null;

  // Chip labels
  const streamingOpts = item.category==="movie" ? MOVIE_STREAMING_OPTIONS : STREAMING_OPTIONS;
  const streamingLabels = (item.streamingServices||[]).map(k => {
    if (k==="other") return item.streamingOther||"その他";
    return streamingOpts.find(o=>o.key===k)?.label||k;
  }).filter(Boolean);
  const genreOpts = item.category==="youtube" ? YOUTUBE_GENRE_OPTIONS : GENRE_OPTIONS;
  const genreLabels = (item.genres||[]).map(k => {
    if (k==="other") return item.genreOther||"その他";
    return genreOpts.find(o=>o.key===k)?.label||k;
  }).filter(Boolean);

  const ringPct = isBinary
    ? (item.status==="done" ? 100
      : item.status==="active"
        ? (isTimedProgress && item.total > 0
            ? Math.round((item.current||0) / item.total * 100)
            : 50)
      : 0)
    : p;

  const accentDk = dk(c.color);

  const quickAdd = (amt) => {
    const nx = Math.min(item.total, item.current + amt);
    const newSt = resolveStatus(nx, item.total);
    const histEntry = { date:today(), delta:nx-item.current, from:item.current, to:nx };
    const patch = { current:nx, lastUpdated:today(), status:newSt, progressHistory:[...(item.progressHistory||[]), histEntry] };
    if (newSt==="active" && item.status==="queue" && !item.firstActiveAt) patch.firstActiveAt = today();
    onActivityLog(today(), item.category);
    if (newSt==="active" && item.status==="queue") onStatusChange && onStatusChange(item.id, "active");
    if (nx >= item.total) {
      Object.assign(patch, { status:"done", completedAt:today(), current:item.total });
      onUpdate(item.id, patch); setToast("完了！🎉"); setShowConfetti(true);
    } else {
      onUpdate(item.id, patch);
      if ((item.category==="anime"||item.category==="drama") && item.episodeMin) {
        setToast(`次は第${Math.floor(nx)+1}話。今から始めると ${finAt(item.episodeMin)} に終わります`);
      } else if (item.category==="article") {
        setToast("読了を記録しました");
      } else if (["youtube","tv","radio"].includes(item.category)) {
        setToast("視聴を記録しました！");
      } else {
        setToast(`${ql} 記録しました`);
      }
    }
  };

  const completeCelebrate = () => {
    const logCount = isBinary ? 1 : Math.max(rem, 1);
    for (let i=0; i<logCount; i++) onActivityLog(today(), item.category);
    const histEntry = { date:today(), delta:rem, from:item.current, to:item.total, completedViaButton:true };
    const patch2 = { progressHistory:[...(item.progressHistory||[]), histEntry] };
    if (!item.firstActiveAt && item.status==="queue") patch2.firstActiveAt = today();
    onUpdate(item.id, patch2);
    onMove(item.id, "done"); setToast("完了！おめでとうございます 🎉"); setShowConfetti(true);
  };

  const cardBorder = isNext ? `2px solid ${c.color}` : `1px solid ${NEW_G.border}`;

  // ④ ボタン: 軽め・余白しっかり・font-weight 400〜500
  const btn = (bg, fg, bordered) => ({
    padding:"7px 14px", borderRadius:9, fontSize:11, fontWeight:400,
    border: bordered ? `1px solid ${NEW_G.border}` : "none",
    background: bg, color: fg, cursor:"pointer", fontFamily:FC,
    display:"inline-flex", alignItems:"center", gap:5,
    lineHeight:1.4, letterSpacing:"0.05em",
  });

  return (
    <div onClick={()=>onEdit(item)} style={{
      background: NEW_G.surface, borderRadius:16, marginBottom:12,
      border: cardBorder,
      boxShadow: isNext ? `0 4px 16px ${c.color}28` : "0 1px 4px rgba(0,0,0,0.04)",
      cursor:"pointer", fontFamily:FC, overflow:"hidden",
    }}>
      {/* ── Watch Queue banners ── */}
      {isNext && (
        <div style={{ padding:"5px 14px", borderBottom:`1px solid ${NEW_G.border}`,
          display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:9, fontWeight:400, color:NEW_G.greyDark,
            fontFamily:"system-ui,sans-serif" }}>①</span>
          <span style={{ fontSize:9, fontWeight:600, color:NEW_G.greyDeep,
            letterSpacing:"0.10em", textTransform:"uppercase" }}>NEXT VIEW</span>
        </div>
      )}
      {isWQ && (
        <div style={{ padding:"4px 14px", borderBottom:`1px solid ${NEW_G.border}`,
          display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:9, fontWeight:400, color:NEW_G.greyMid,
            fontFamily:"system-ui,sans-serif" }}>{["②","③","④","⑤"][nvIndex-1]}</span>
          <span style={{ fontSize:9, fontWeight:400, color:NEW_G.greyMid,
            letterSpacing:"0.06em" }}>Watch Queue</span>
        </div>
      )}

      <div style={{ padding:"15px 14px 13px", display:"flex", gap:12, alignItems:"flex-start" }}>
        {/* ── Left column ── */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* Row 1: Category tag + streaming/genre chips */}
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8, flexWrap:"wrap" }}>
            {/* Category tag — filled background, no border */}
            {(()=>{
              const TAG_BG = { article:"#DADCD1",live:"#EDE6D6",youtube:"#EBE1D8",radio:"#DCE1DF",tv:"#DFDAD7",book:"#DADCD1",anime:"#EDE6D6",drama:"#EBE1D8",movie:"#DCE1DF",manga:"#DFDAD7" };
              const TAG_FG = { article:"#465135",live:"#806C47",youtube:"#7A624C",radio:"#485950",tv:"#534946",book:"#465135",anime:"#806C47",drama:"#7A624C",movie:"#485950",manga:"#534946" };
              const bg = TAG_BG[item.category] || "#EBEBEB";
              const fg = TAG_FG[item.category] || "#555";
              return (
                <span style={{ display:"inline-flex", alignItems:"center", gap:3,
                  background:bg, borderRadius:6, padding:"3px 8px", border:"none" }}>
                  <CatIco cat={item.category} color={fg}/>
                  <span style={{ fontSize:10, fontWeight:600, color:fg,
                    letterSpacing:"0.05em", fontFamily:FC }}>{c.label}</span>
                </span>
              );
            })()}
            {streamingLabels.map((l,i) => (
              <span key={i} style={{ fontSize:10, fontWeight:400, color:NEW_G.greyDark,
                background:NEW_G.surfaceAlt, border:`1px solid ${NEW_G.border}`,
                borderRadius:5, padding:"2px 8px", letterSpacing:"0.03em",
                fontFamily:FC }}>{l}</span>
            ))}
            {genreLabels.slice(0,2).map((l,i) => (
              <span key={i} style={{ fontSize:10, fontWeight:400, color:NEW_G.greyMid,
                background:"transparent", border:`1px solid ${NEW_G.border}`,
                borderRadius:5, padding:"2px 8px", letterSpacing:"0.03em",
                fontFamily:FC }}>{l}</span>
            ))}
          </div>

          {/* Row 2: Title */}
          {/* ④ font-weight 600（700→600）/ ② letter-spacing 0.02em / ③ line-height 1.4 */}
          <div style={{
            fontSize:12, fontWeight:600, color:NEW_G.ink,
            lineHeight:1.4, marginBottom:6,
            letterSpacing:"0.06em", fontFamily:FC,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {item.title}
          </div>

          {/* Row 3: Sub-info (TV/radio station, airDate) */}
          {(isTV||isRadio) && (item.tvStation||item.station||item.airDate) && (
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6, flexWrap:"wrap" }}>
              {(item.tvStation||item.station) && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:3,
                  fontSize:10, color:NEW_G.greyDark, fontWeight:400,
                  background:NEW_G.surfaceAlt, border:`1px solid ${NEW_G.border}`,
                  borderRadius:5, padding:"2px 8px", letterSpacing:"0.03em", fontFamily:FC }}>
                  {isTV ? <ICONS.tv/> : <ICONS.antenna/>}
                  {item.tvStation||item.station}
                </span>
              )}
              {item.airDate && (
                <span style={{ fontSize:10, color:NEW_G.greyMid, fontWeight:400,
                  display:"flex", alignItems:"center", gap:3,
                  letterSpacing:"0.03em", fontFamily:FC }}>
                  <ICONS.calendar/> {item.airDate.replace("T"," ").slice(0,16)}
                </span>
              )}
            </div>
          )}
          {(isTV||isRadio) && (item.tvViewMethod||[]).length>0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:6 }}>
              {(item.tvViewMethod||[]).map((k,i) => {
                const lbl = k==="other"?(item.tvViewOther||"その他"):TV_VIEW_OPTIONS.find(o=>o.key===k)?.label||k;
                return <span key={i} style={{ fontSize:10, fontWeight:400, color:NEW_G.greyDark,
                  background:NEW_G.surfaceAlt, border:`1px solid ${NEW_G.border}`,
                  borderRadius:5, padding:"2px 7px", letterSpacing:"0.03em",
                  fontFamily:FC }}>{lbl}</span>;
              })}
            </div>
          )}
          {/* Live: アーティスト名 */}
          {item.category==="live" && item.artistName && (
            <div style={{ fontSize:11, fontWeight:500, color:NEW_G.greyDark,
              letterSpacing:"0.03em", marginBottom:6 }}>
              {item.artistName}
            </div>
          )}
          {isYT && item.videoUrl && (
            <div style={{ marginBottom:6 }}><UrlButton url={item.videoUrl} color={c.color} label="URLを開く"/></div>
          )}
          {item.category==="article" && item.articleUrl && (
            <div style={{ marginBottom:6 }}><UrlButton url={item.articleUrl} color={c.color} label="URLを開く"/></div>
          )}
          {item.contentUrl && (
            <div style={{ marginBottom:6 }}><UrlButton url={item.contentUrl} color={c.color} label="URLを開く"/></div>
          )}

          {/* Row 4: Progress — "5 / 12 話" style */}
          {/* 画像1参照: 数字部分は大きく太く・単位は小さく細め */}
          {!isBinary && (
            <div style={{ marginBottom:7 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:0, marginBottom:3 }}>
                {/* ① 数字: 16px / ④ 700 (ここは太さ維持) */}
                <span style={{ fontSize:13, fontWeight:700, color:NEW_G.ink,
                  letterSpacing:"-0.01em", fontFamily:FC }}>
                  {item.current}
                </span>
                <span style={{ fontSize:12, fontWeight:400, color:NEW_G.greyMid,
                  margin:"0 5px", letterSpacing:"0.02em", fontFamily:FC }}> / </span>
                <span style={{ fontSize:13, fontWeight:700, color:NEW_G.ink,
                  letterSpacing:"-0.01em", fontFamily:FC }}>
                  {item.total}
                </span>
                {/* ① 単位: 12px / ④ font-weight 400 */}
                <span style={{ fontSize:12, fontWeight:400, color:NEW_G.greyMid,
                  marginLeft:5, letterSpacing:"0.05em", fontFamily:FC }}>
                  {effectiveUnit}
                </span>
              </div>
              {/* ① 残り時間: 10px / ④ 400 */}
              {totalMin!=null && rem>0 && !["movie","article"].includes(item.category) && (
                <div style={{ fontSize:10, fontWeight:400, color:NEW_G.greyMid,
                  marginTop:2, lineHeight:1.6, letterSpacing:"0.04em", fontFamily:FC }}>
                  あと {fmtGap(totalMin)}（{hint(totalMin)}）
                </div>
              )}
              {item.category==="movie" && totalMin!=null && rem>0 && (
                <div style={{ fontSize:10, fontWeight:400, color:NEW_G.greyMid,
                  marginTop:2, lineHeight:1.6, letterSpacing:"0.04em", fontFamily:FC }}>
                  あと {fmtGap(totalMin)}
                </div>
              )}
            </div>
          )}
          {isBinary && (
            <div style={{ marginBottom:7 }}>
              <div style={{ display:"flex", alignItems:"center",
                gap:8, fontSize:11, color:NEW_G.greyMid, flexWrap:"wrap" }}>

                {/* 分単位進捗（Live/YouTube/Radio/TV かつ total設定あり） */}
                {isTimedProgress && item.total > 0 && item.status !== "done" && (
                  <div style={{ display:"flex", alignItems:"baseline", gap:0 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:NEW_G.ink,
                      letterSpacing:"-0.01em", fontFamily:FC }}>
                      {item.current || 0}
                    </span>
                    <span style={{ fontSize:12, fontWeight:400, color:NEW_G.greyMid,
                      margin:"0 4px", fontFamily:FC }}>/</span>
                    <span style={{ fontSize:13, fontWeight:700, color:NEW_G.ink,
                      letterSpacing:"-0.01em", fontFamily:FC }}>
                      {item.total}
                    </span>
                    <span style={{ fontSize:11, fontWeight:400, color:NEW_G.greyMid,
                      marginLeft:4, letterSpacing:"0.04em", fontFamily:FC }}>
                      分
                    </span>
                  </div>
                )}

                {/* ステータスラベル（done時） */}
                {item.status === "done" && (
                  <span style={{ display:"flex", alignItems:"center", gap:4,
                    fontWeight:500, color:accentDk, letterSpacing:"0.04em", fontFamily:FC }}>
                    <ICONS.check/> 完了済み
                  </span>
                )}

                {/* これから（total未設定 or article） */}
                {item.status === "queue" && !(isTimedProgress && item.total > 0) && (
                  <span style={{ fontWeight:500, color:NEW_G.greyDark,
                    letterSpacing:"0.04em", fontFamily:FC, fontSize:11 }}>
                    {item.category==="article" ? "未読" : "未視聴"}
                  </span>
                )}

                {/* article: 読了時間 */}
                {item.category==="article" && item.episodeMin && (
                  <span style={{ fontSize:10, fontWeight:400, color:NEW_G.greyMid,
                    letterSpacing:"0.04em", fontFamily:FC }}>
                    約{item.episodeMin}分で読了
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Row 5: Action buttons */}
          {item.status !== "done" && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}
              onClick={e=>e.stopPropagation()}>
              {/* +10分 for timed binary (live/yt/radio/tv) */}
              {isTimedProgress && (
                <button onClick={()=>quickAdd(10)} style={btn(c.color,"#fff",false)}>+10分</button>
              )}
              {/* non-binary non-timed categories */}
              {!isBinary && (
                <button onClick={()=>quickAdd(qa)} style={btn(c.color,"#fff",false)}>{ql}</button>
              )}
              {!["youtube","article","tv","radio","live"].includes(item.category) && (
                <button onClick={()=>setTimerOpen(t=>!t)} style={btn(NEW_G.surfaceAlt,NEW_G.greyDark,true)}>
                  <ICONS.clock/> 5分
                </button>
              )}
              {item.category==="live" && item.status==="queue" && (
                <button onClick={()=>{ onActivityLog(today(),item.category); onMove(item.id,"active"); }} style={btn(NEW_G.surfaceAlt,NEW_G.greyDark,true)}>
                  <ICONS.play/> 進行中にする
                </button>
              )}
              {item.category==="live" && item.status==="active" && (
                <button onClick={()=>{ removeActivityLog&&removeActivityLog(item.lastUpdated||today(),item.category); const hist=[...(item.progressHistory||[])];hist.pop();onUpdate(item.id,{progressHistory:hist});onMove(item.id,"queue"); }} style={btn(NEW_G.surfaceAlt,NEW_G.greyDark,true)}>
                  これからにする
                </button>
              )}
              {item.category==="article" && item.status==="queue" && (
                <button onClick={()=>{ onActivityLog(today(),item.category); onMove(item.id,"active"); }} style={btn(NEW_G.surfaceAlt,NEW_G.greyDark,true)}>
                  <ICONS.play/> 進行中にする
                </button>
              )}
              {item.category==="article" && item.status==="active" && (
                <button onClick={()=>{ removeActivityLog&&removeActivityLog(item.lastUpdated||today(),item.category); const hist=[...(item.progressHistory||[])];hist.pop();onUpdate(item.id,{progressHistory:hist});onMove(item.id,"queue"); }} style={btn(NEW_G.surfaceAlt,NEW_G.greyDark,true)}>
                  これからにする
                </button>
              )}
              {["youtube","tv","radio"].includes(item.category) && item.status==="queue" && (
                <button onClick={()=>{ onActivityLog(today(),item.category); onMove(item.id,"active"); }} style={btn(NEW_G.surfaceAlt,NEW_G.greyDark,true)}>
                  <ICONS.play/> 進行中にする
                </button>
              )}
              {!isBinary && item.status==="queue" && (
                <button onClick={()=>{ onActivityLog(today(),item.category); onMove(item.id,"active"); }} style={btn(NEW_G.surfaceAlt,NEW_G.greyDark,true)}>
                  <ICONS.play/> 開始
                </button>
              )}
              {item.status==="active" && (
                <button onClick={completeCelebrate} style={btn(NEW_G.surfaceAlt,NEW_G.greyDark,true)}>
                  <ICONS.check/> 完了にする
                </button>
              )}
              <button onClick={e=>{ e.stopPropagation(); setPastRecord(true); }} style={btn(NEW_G.surfaceAlt,NEW_G.greyDark,true)}>
                <ICONS.calendar/> 過去の記録
              </button>
            </div>
          )}

          {/* Row 6: Started/duration */}
          {item.startedAt && (
            <div style={{ fontSize:10, fontWeight:400, color:NEW_G.greyMid,
              marginBottom:3, display:"flex", alignItems:"center", gap:4,
              letterSpacing:"0.04em", lineHeight:1.6, fontFamily:FC }}>
              <ICONS.clock/>
              {item.startedAt} 開始
              {(() => {
                const start = item.firstActiveAt || item.startedAt;
                const end = item.completedAt || (item.status==="active"?today():null);
                if (!start||!end) return null;
                const d = daysBetween(start, end);
                return d ? (
                  <span style={{ fontWeight:500, color:NEW_G.greyDark }}>
                    （{d}日{item.status==="active"?"経過":"かけて完了"}）
                  </span>
                ) : null;
              })()}
            </div>
          )}

          {/* Row 7: Footer meta — 追加/更新/完了日 */}
          <div style={{ display:"flex", gap:10, fontSize:10, fontWeight:400,
            color:NEW_G.greyMid, flexWrap:"wrap",
            marginTop:4, lineHeight:1.6, letterSpacing:"0.04em", fontFamily:FC }}>
            <span>追加: {item.addedAt}</span>
            {item.lastUpdated && <span>更新: {item.lastUpdated}</span>}
            {item.completedAt && <span>完了: {item.completedAt}</span>}
            {/* メモあり表示 */}
            {hasNotes && (
              <span onClick={e=>{ e.stopPropagation(); setMemoOpen(true); }}
                style={{ display:"inline-flex", alignItems:"center", gap:3,
                  color:NEW_G.greyMid, fontWeight:500, cursor:"pointer",
                  fontSize:9, letterSpacing:"0.04em",
                  textDecoration:"underline", textDecorationStyle:"dotted",
                  textUnderlineOffset:2 }}>
                <ICONS.memo/> メモあり
              </span>
            )}
          </div>
        </div>

        {/* ── Right column: progress ring ── */}
        <div style={{ flexShrink:0, paddingTop:2, paddingRight:20 }}>
          <ProgressRing pct={ringPct} color={c.color} size={56} stroke={4.5}/>
        </div>
      </div>

      {/* Memo popup */}
      {memoOpen && (
        <div onClick={e=>{ e.stopPropagation(); setMemoOpen(false); }}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)",
            zIndex:600, display:"flex", alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#FFFFFF", borderRadius:"20px 20px 0 0",
              width:"100%", padding:"22px 20px 48px",
              boxShadow:"0 -6px 30px rgba(0,0,0,0.12)", fontFamily:FC }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:14 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#1A1A1A",
                letterSpacing:"0.04em" }}>メモ</span>
              <button onClick={()=>setMemoOpen(false)}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"#A0A0A0", fontSize:18, lineHeight:1, padding:4 }}>×</button>
            </div>
            <div style={{ fontSize:13, fontWeight:400, color:"#3A3A3A",
              lineHeight:1.8, letterSpacing:"0.03em", whiteSpace:"pre-wrap" }}>
              {item.notes}
            </div>
          </div>
        </div>
      )}

      {/* Timer */}
      {timerOpen && (
        <div onClick={e=>e.stopPropagation()}
          style={{ borderTop:`1px solid ${NEW_G.border}`, padding:"0 14px 14px" }}>
          <Timer color={c.color} onComplete={()=>{
            setToast("5分経過！記録を開始しました");
            onActivityLog(today(), item.category);
            onUpdate(item.id, { lastUpdated:today(), status:item.status==="queue"?"active":item.status });
          }}/>
        </div>
      )}

      {toast && <Toast msg={toast} onHide={()=>setToast(null)}/>}
      {showConfetti && <Confetti onDone={()=>setShowConfetti(false)}/>}
      {pastRecordOpen && <PastRecordModal item={item} onSave={({ date, amount }) => {
        const nx = Math.min(item.total, item.current + amount);
        const newSt = resolveStatus(nx, item.total);
        const histEntry = { date, delta:nx-item.current, from:item.current, to:nx };
        const patch3 = { current:nx, lastUpdated:date, status:newSt, progressHistory:[...(item.progressHistory||[]),histEntry] };
        onActivityLog(date, item.category);
        if (nx>=item.total) Object.assign(patch3, { status:"done", completedAt:date, current:item.total });
        onUpdate(item.id, patch3); setPastRecord(false); setToast(`${date} の記録を追加しました`);
      }} onClose={()=>setPastRecord(false)}/>}
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────
function SettingsScreen({ user, onLogout, syncStatus, items, onDeleteAll }) {
  const F2 = "'Outfit','Hiragino Sans','Noto Sans JP',sans-serif";
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0); // 0=none,1=first,2=second

  // 利用開始日を計算（最古のコンテンツ追加日 or localStorage初回保存日）
  const startDate = (() => {
    if (items && items.length > 0) {
      const dates = items.map(i => i.addedAt).filter(Boolean).sort();
      if (dates.length > 0) return dates[0];
    }
    return null;
  })();
  const daysSinceStart = (() => {
    if (!startDate) return null;
    const diff = new Date(today()) - new Date(startDate);
    return Math.max(0, Math.floor(diff / 86400000));
  })();

  return (
    <div style={{ padding:"24px 18px 0", fontFamily:F2, background:"#F7F7F7" }}>
      <div style={{ fontSize:22, fontWeight:700, color:NEW_G.ink, letterSpacing:"0.1em", marginBottom:24 }}>Settings</div>

      {/* Usage stats */}
      {daysSinceStart !== null && (
        <div style={{ background:NEW_G.surface, borderRadius:18, padding:"18px", marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:NEW_G.greyMid, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>利用状況</div>
          <div style={{ fontSize:24, fontWeight:700, color:NEW_G.ink, letterSpacing:"-0.02em", marginBottom:4 }}>
            {daysSinceStart}<span style={{ fontSize:14, fontWeight:500, color:NEW_G.greyMid, marginLeft:4 }}>日</span>
          </div>
          <div style={{ fontSize:12, color:NEW_G.greyMid }}>
            利用開始から {daysSinceStart} 日（{startDate} 〜）
          </div>
        </div>
      )}

      {/* Account */}
      <div style={{ background:NEW_G.surface, borderRadius:18, padding:"18px", marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, color:NEW_G.greyMid, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Account</div>
        {user ? (
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {user.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} alt="" style={{ width:52, height:52, borderRadius:"50%", objectFit:"cover" }}/>
              : <div style={{ width:52, height:52, borderRadius:"50%", background:"#767676", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, color:"#fff" }}>{(user.email||"?")[0].toUpperCase()}</div>
            }
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:NEW_G.ink, marginBottom:2 }}>{user.user_metadata?.full_name || user.email}</div>
              <div style={{ fontSize:12, color:NEW_G.greyMid }}>{user.email}</div>
              {syncStatus && (
                <div style={{ fontSize:10, color:"#767676", marginTop:3, fontWeight:600 }}>
                  {syncStatus==="saving"?"保存中…":syncStatus==="saved"?"✓ 保存済み":"⚠ エラー"}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontSize:13, color:NEW_G.greyMid, lineHeight:1.6 }}>ログインしていません（ローカル保存モード）</div>
        )}
      </div>

      {/* App info */}
      <div style={{ background:NEW_G.surface, borderRadius:18, padding:"18px", marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, color:NEW_G.greyMid, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>App Info</div>
        <div style={{ fontSize:13, color:NEW_G.greyDark, lineHeight:2 }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span>バージョン</span>
            <span style={{ color:NEW_G.greyMid }}>1.0.0</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      {user && onLogout && (
        <div style={{ background:NEW_G.surface, borderRadius:18, padding:"18px", marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:NEW_G.greyMid, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Account Actions</div>
          {!confirmLogout ? (
            <button onClick={()=>setConfirmLogout(true)}
              style={{ width:"100%", padding:"13px", borderRadius:12,
                border:`1.5px solid ${NEW_G.border}`, background:"transparent",
                color:NEW_G.greyDark, fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:F2, letterSpacing:"0.02em" }}>
              ログアウト
            </button>
          ) : (
            <div>
              <div style={{ fontSize:13, color:NEW_G.greyDeep, fontWeight:600, marginBottom:12, textAlign:"center", lineHeight:1.6 }}>ログアウトしますか？</div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setConfirmLogout(false)}
                  style={{ flex:1, padding:"12px", borderRadius:12, border:`1.5px solid ${NEW_G.border}`, background:"transparent", color:NEW_G.greyDark, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F2 }}>キャンセル</button>
                <button onClick={()=>{ setConfirmLogout(false); onLogout(); }}
                  style={{ flex:1, padding:"12px", borderRadius:12, border:"none", background:"#767676", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:F2 }}>ログアウト</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 全データ削除 ── */}
      <div style={{ background:NEW_G.surface, borderRadius:18, padding:"18px" }}>
        <div style={{ fontSize:10, fontWeight:700, color:NEW_G.greyMid, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>データ管理</div>
        {deleteStep === 0 && (
          <button onClick={()=>setDeleteStep(1)}
            style={{ width:"100%", padding:"13px", borderRadius:12,
              border:"1.5px solid #E8E2DA", background:"transparent",
              color:"#767676", fontSize:13, fontWeight:600,
              cursor:"pointer", fontFamily:F2, letterSpacing:"0.02em" }}>
            全てのデータを削除
          </button>
        )}
        {deleteStep === 1 && (
          <div>
            <div style={{ fontSize:13, color:NEW_G.greyDeep, fontWeight:600, marginBottom:8, textAlign:"center" }}>本当に削除しますか？</div>
            <div style={{ fontSize:11, color:NEW_G.greyMid, marginBottom:16, textAlign:"center", lineHeight:1.7 }}>
              全てのコンテンツ・進捗・記録が削除されます
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setDeleteStep(0)}
                style={{ flex:1, padding:"12px", borderRadius:12, border:`1.5px solid ${NEW_G.border}`, background:"transparent", color:NEW_G.greyDark, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F2 }}>キャンセル</button>
              <button onClick={()=>setDeleteStep(2)}
                style={{ flex:1, padding:"12px", borderRadius:12, border:"none", background:"#BFBFBF", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:F2 }}>次へ</button>
            </div>
          </div>
        )}
        {deleteStep === 2 && (
          <div>
            <div style={{ fontSize:13, color:"#B05050", fontWeight:700, marginBottom:8, textAlign:"center" }}>最終確認</div>
            <div style={{ fontSize:11, color:NEW_G.greyMid, marginBottom:16, textAlign:"center", lineHeight:1.7 }}>
              一度削除したデータは復元できません。<br/>本当にデータを削除しますか？
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setDeleteStep(0)}
                style={{ flex:1, padding:"12px", borderRadius:12, border:`1.5px solid ${NEW_G.border}`, background:"transparent", color:NEW_G.greyDark, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F2 }}>キャンセル</button>
              <button onClick={()=>{ setDeleteStep(0); onDeleteAll&&onDeleteAll(); }}
                style={{ flex:1, padding:"12px", borderRadius:12, border:"none", background:"#BFBFBF", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:F2 }}>削除する</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Page Screen (full-page, 2-step) ──────────────────────────────────
function AddPageScreen({ onAdd, onDone, F2 }) {
  const [step, setStep] = useState(1);          // 1=カテゴリ選択, 2=フォーム
  const [selectedCat, setSelectedCat] = useState(null);
  const [addKey, setAddKey] = useState(0);

  const FC = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";

  const CAT_CARD_ADD = {
    article: { bg:"#DADCD1", fg:"#465135" },
    live:    { bg:"#EDE6D6", fg:"#806C47" },
    youtube: { bg:"#EBE1D8", fg:"#7A624C" },
    radio:   { bg:"#DCE1DF", fg:"#485950" },
    tv:      { bg:"#DFDAD7", fg:"#534946" },
    book:    { bg:"#DADCD1", fg:"#465135" },
    anime:   { bg:"#EDE6D6", fg:"#806C47" },
    drama:   { bg:"#EBE1D8", fg:"#7A624C" },
    movie:   { bg:"#DCE1DF", fg:"#485950" },
    manga:   { bg:"#DFDAD7", fg:"#534946" },
  };

  // ── Step 1: Category selection ────────────────────────────────────────
  if (step === 1) return (
    <div style={{ background:NEW_G.surface, fontFamily:FC }}>
      <div style={{ padding:"24px 20px 18px", position:"sticky", top:0, zIndex:10,
        background:NEW_G.surface, borderBottom:`1px solid ${NEW_G.border}` }}>
      <div style={{ fontSize:22, fontWeight:700, color:NEW_G.ink, letterSpacing:"0.1em",
        fontFamily:"'Outfit','Hiragino Sans','Noto Sans JP',sans-serif" }}>
        New Content
      </div>
        <div style={{ fontSize:12, fontWeight:400, color:NEW_G.greyMid, marginTop:4,
          letterSpacing:"0.04em" }}>
          カテゴリを選択してください
        </div>
      </div>

      <div style={{ padding:"24px 20px 100px",
        display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14 }}>
        {CAT_KEYS.map(k => {
          const cfg = CAT_CARD_ADD[k];
          return (
            <div key={k} onClick={()=>{ setSelectedCat(k); setStep(2); }}
              style={{
                background: cfg.bg,
                borderRadius:22,
                padding:"18px 10px 14px",
                display:"flex", flexDirection:"column",
                alignItems:"center", gap:10,
                cursor:"pointer",
                transition:"opacity .15s",
              }}>
              {/* Icon circle */}
              <div style={{ width:44, height:44, borderRadius:"50%",
                background:"#FFFFFF",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
                <CatIco cat={k} color={cfg.fg}/>
              </div>
              {/* Label */}
              <div style={{ fontSize:11, fontWeight:600, color:cfg.fg,
                letterSpacing:"0.04em", textAlign:"center",
                lineHeight:1.3, whiteSpace:"nowrap" }}>
                {CATS[k].label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Step 2: Form for selected category ───────────────────────────────
  return (
    <div style={{ background:"#FFFFFF", fontFamily:FC }}>
      <div style={{ padding:"16px 18px 14px", background:NEW_G.surface,
        borderBottom:`1px solid ${NEW_G.border}`,
        position:"sticky", top:0, zIndex:10,
        display:"flex", alignItems:"center", gap:12 }}>
        {/* Back button */}
        <button onClick={()=>setStep(1)}
          style={{ background:"none", border:"none", cursor:"pointer",
            color:NEW_G.greyDark, padding:"4px 0", display:"flex",
            alignItems:"center", gap:5, fontSize:13, fontFamily:FC,
            fontWeight:500, letterSpacing:"0.03em" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          カテゴリ選択に戻る
        </button>
        {/* Category badge */}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5,
          background:CAT_CARD_ADD[selectedCat].bg,
          borderRadius:8, padding:"4px 10px" }}>
          <CatIco cat={selectedCat} color={CAT_CARD_ADD[selectedCat].fg}/>
          <span style={{ fontSize:11, fontWeight:600,
            color:CAT_CARD_ADD[selectedCat].fg, letterSpacing:"0.04em" }}>
            {CATS[selectedCat].label}
          </span>
        </div>
      </div>

      <AddModal
        key={`${selectedCat}-${addKey}`}
        onClose={()=>setStep(1)}
        onAdd={(item)=>{
          onAdd(item);
          setAddKey(k=>k+1);
          setStep(1);
          onDone();
        }}
        inlineMode={true}
        defaultCategory={selectedCat}
      />
    </div>
  );
}

// ─── Report Page Screen (full-page) ───────────────────────────────────────
function ReportPageScreen({ items, activityLog, F2, onUpdate, onActivityLog, removeActivityLog }) {
  const [currentMode, setCurrentMode] = React.useState("period");
  const exportRef = React.useRef(null); // { exportImage, exportAllItems }
  const [exportDoneHdr, setExportDoneHdr] = React.useState(false);

  const handleExport = () => {
    if (!exportRef.current) return;
    if (currentMode === "period") {
      exportRef.current.exportImage();
    } else {
      // コンテンツ別: 詳細画面なら1件、一覧なら全件
      const ref = exportRef.current;
      if (ref.selectedItemId) {
        const item = (ref.items || []).find(i => i.id === ref.selectedItemId);
        ref.exportSingleItem(item);
      } else {
        ref.exportAllItems();
      }
    }
    setExportDoneHdr(true);
    setTimeout(() => setExportDoneHdr(false), 2500);
  };

  return (
    <div style={{ background:"#FFFFFF", fontFamily:F2 }}>
      {/* Header */}
      <div style={{ padding:"24px 18px 14px", background:NEW_G.surface,
        borderBottom:`1px solid ${NEW_G.border}`, position:"sticky", top:0, zIndex:10,
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:22, fontWeight:700, color:NEW_G.ink, letterSpacing:"0.1em" }}>
          Report
        </div>
        {/* Share icon */}
        <button onClick={handleExport}
          style={{ background:"none", border:"none", cursor:"pointer",
            padding:"6px 8px", borderRadius:8, display:"flex", alignItems:"center",
            color: exportDoneHdr ? "#7C8F5E" : NEW_G.greyDark,
            transition:"color .2s" }}
          title={currentMode === "period" ? "期間別レポートを出力" :
            exportRef.current?.selectedItemId ? "このコンテンツを画像で出力" : "コンテンツ一覧を画像で出力"}>
          {exportDoneHdr ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          )}
        </button>
      </div>

      <ReportModal
        items={items} activityLog={activityLog} onClose={()=>{}} inlineMode={true}
        onUpdate={onUpdate} onActivityLog={onActivityLog}
        removeActivityLog={removeActivityLog}
        onModeChange={setCurrentMode}
        exportRef={exportRef}
      />
    </div>
  );
}

// ─── Main ContentsProgress ────────────────────────────────────────────────
export function ContentsProgress({ user = null, onLogout = null, sbOps = null }) {
  const F2 = "'Outfit','Hiragino Sans','Noto Sans JP',sans-serif";

  // ── Data state ──────────────────────────────────────────────────────────
  const [items,        setItemsRaw]   = useState(DEFAULTS);
  const [watchQueue,   setWatchQueue] = useState([]);
  const [activityLog,  setActivityLog]= useState({});
  const [loaded,       setLoaded]     = useState(false);
  const [nvChooseOpen, setNvChooseOpen] = useState(false);
  const [syncStatus,   setSyncStatus]  = useState(null);

  const syncTimerRef = useRef(null);
  const dirtyItems   = useRef(new Set());
  const dirtyWQ      = useRef(false);
  const flushTimer   = useRef(null);
  const userId = user?.id ?? null;

  // ── Nav state ────────────────────────────────────────────────────────────
  const [navTab, setNavTab] = useState(0); // 0=home,1=contents,2=add,3=report,4=settings
  const [showReport, setShowReport] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEdit] = useState(null);
  const [showConfetti, setConfetti] = useState(false);
  const [globalToast, setGlobalToast] = useState(null);

  // ── Sync helpers ─────────────────────────────────────────────────────────
  const markSaving = () => { setSyncStatus("saving"); clearTimeout(syncTimerRef.current); };
  const markSaved  = () => { setSyncStatus("saved");  syncTimerRef.current = setTimeout(()=>setSyncStatus(null), 2500); };
  const markError  = () => { setSyncStatus("error");  syncTimerRef.current = setTimeout(()=>setSyncStatus(null), 4000); };

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // activityLog のゼロ・マイナス値エントリを除去するヘルパー
      const sanitizeLog = (log) => {
        if (!log || typeof log !== "object") return {};
        const result = {};
        for (const [date, cats] of Object.entries(log)) {
          if (!cats || typeof cats !== "object") continue;
          const clean = {};
          for (const [cat, cnt] of Object.entries(cats)) {
            if (typeof cnt === "number" && cnt > 0) clean[cat] = cnt;
          }
          if (Object.keys(clean).length > 0) result[date] = clean;
        }
        return result;
      };

      if (userId && sbOps) {
        const [sbItems, sbLog, sbWQ] = await Promise.all([
          sbOps.loadItems(userId),
          sbOps.loadActivityLog(userId),
          sbOps.loadWatchQueue(userId),
        ]);

        // Items: Supabase優先、なければlocalStorage。両方なければDEFAULTSのまま
        if (sbItems && sbItems.length > 0) {
          setItemsRaw(sbItems);
          lsSet(LS_ITEMS, sbItems); // Supabase → localStorage に書き戻す
        } else {
          const local = await wsGet(LS_ITEMS, null);
          if (local && Array.isArray(local) && local.length > 0) {
            setItemsRaw(local);
            // localStorageのデータをSupabaseに同期
            await Promise.all(local.map(it => sbOps.saveItem(userId, it)));
          }
        }

        // ActivityLog: Supabase優先、なければlocalStorage
        if (sbLog && Object.keys(sbLog).length > 0) {
          const cleaned = sanitizeLog(sbLog);
          setActivityLog(cleaned);
          lsSet(LS_DATES, cleaned);
        } else {
          const local = await wsGet(LS_DATES, null);
          if (local && typeof local === "object") {
            const cleaned = sanitizeLog(local);
            setActivityLog(cleaned);
            // localStorageのデータをSupabaseに同期
            for (const [date, cats] of Object.entries(cleaned)) {
              if (typeof cats === "object") {
                for (const [cat, count] of Object.entries(cats)) {
                  await sbOps.upsertActivity(userId, date, cat, count);
                }
              }
            }
          }
        }

        // WatchQueue: Supabase優先、なければlocalStorage
        if (sbWQ && sbWQ.length > 0) {
          setWatchQueue(sbWQ);
        } else {
          const local = await wsGet(LS_WQ, null);
          if (Array.isArray(local)) {
            setWatchQueue(local);
            if (local.length > 0) await sbOps.saveWatchQueue(userId, local);
          }
        }
        const si = await wsGet(LS_ITEMS, null); if (si && Array.isArray(si) && si.length>0) setItemsRaw(si);
        const wq = await wsGet(LS_WQ, null); if (Array.isArray(wq)) setWatchQueue(wq);
        const al = await wsGet(LS_DATES, null); if (al && typeof al==="object") setActivityLog(sanitizeLog(al));
      }
      setLoaded(true);
    })();
  }, [userId]);

  // ── Flush ─────────────────────────────────────────────────────────────────
  const scheduleFlush = useCallback((currentItems, currentWQ) => {
    clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(async () => {
      if (!userId || !sbOps) return;
      markSaving();
      try {
        const ids = [...dirtyItems.current]; dirtyItems.current.clear();
        await Promise.all(ids.map(id => { const item = currentItems.find(i=>i.id===id); return item ? sbOps.saveItem(userId,item) : sbOps.deleteItem(userId,id); }));
        if (dirtyWQ.current) { dirtyWQ.current=false; await sbOps.saveWatchQueue(userId, currentWQ); }
        markSaved();
      } catch(e) { console.error("flush error:", e); markError(); }
    }, 600);
  }, [userId, sbOps]);

  // iOS PWA対策: バックグラウンド移行直前に即時保存
  // items/activityLog を ref で保持して stale closure を防ぐ
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  const activityLogRef = useRef(activityLog);
  useEffect(() => { activityLogRef.current = activityLog; }, [activityLog]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "hidden" || !userId || !sbOps) return;

      // items の dirty分を即時 flush
      clearTimeout(flushTimer.current);
      const ids = [...dirtyItems.current];
      dirtyItems.current.clear();
      if (ids.length > 0) {
        Promise.all(ids.map(id => {
          const item = itemsRef.current.find(i=>i.id===id);
          return item ? sbOps.saveItem(userId, item) : sbOps.deleteItem(userId, id);
        })).catch(e => console.error("visibility flush items:", e));
      }
      if (dirtyWQ.current) {
        dirtyWQ.current = false;
        sbOps.saveWatchQueue(userId, watchQueueRef.current).catch(() => {});
      }

      // activityLog を即時保存（stale closure を避けるため ref から読む）
      const al = activityLogRef.current;
      if (al && typeof al === "object") {
        Object.entries(al).forEach(([date, cats]) => {
          if (typeof cats !== "object") return;
          Object.entries(cats).forEach(([cat, cnt]) => {
            if (cnt > 0) sbOps.upsertActivity(userId, date, cat, cnt).catch(() => {});
          });
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [userId, sbOps]); // items/activityLog は ref で参照するので deps 不要

  // watchQueue の最新値を ref で保持（setItems 内の stale closure を防ぐ）
  const watchQueueRef = useRef(watchQueue);
  useEffect(() => { watchQueueRef.current = watchQueue; }, [watchQueue]);

  const setItems = useCallback((updater) => {
    setItemsRaw(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      if (loaded) {
        try { localStorage.setItem(LS_ITEMS, JSON.stringify(next)); } catch {}
        if (userId && sbOps) {
          next.forEach(item => {
            const old = prev.find(p=>p.id===item.id);
            if (!old || JSON.stringify(old) !== JSON.stringify(item)) dirtyItems.current.add(item.id);
          });
          prev.forEach(item => {
            if (!next.find(n=>n.id===item.id)) dirtyItems.current.add(item.id);
          });
          scheduleFlush(next, watchQueueRef.current);
        }
      }
      return next;
    });
  }, [loaded, userId, sbOps, scheduleFlush]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(LS_WQ, JSON.stringify(watchQueue)); } catch {}
    if (userId && sbOps) { dirtyWQ.current=true; scheduleFlush(items, watchQueue); }
  }, [watchQueue, loaded]);

  useEffect(() => {
    if (!loaded) return;
    lsSet(LS_DATES, activityLog);
    try { if (window.storage) window.storage.set(LS_DATES, JSON.stringify(activityLog)); } catch {}
    // Supabase にも全件同期（差分検知は難しいので全カテゴリをupsert）
    if (userId && sbOps) {
      Object.entries(activityLog).forEach(([date, cats]) => {
        if (typeof cats !== "object") return;
        Object.entries(cats).forEach(([cat, cnt]) => {
          if (typeof cnt === "number" && cnt >= 0) {
            sbOps.upsertActivity(userId, date, cat, cnt).catch(() => {});
          }
        });
      });
    }
  }, [activityLog, loaded]);

  // ── Activity log ──────────────────────────────────────────────────────────
  const logActivity = useCallback((date, category) => {
    setActivityLog(prev => {
      const day = prev[date] && typeof prev[date]==="object" ? prev[date] : {};
      const newCount = (day[category]||0)+1;
      if (userId && sbOps) sbOps.upsertActivity(userId,date,category,newCount);
      return { ...prev, [date]: { ...day, [category]: newCount } };
    });
  }, [userId, sbOps]);

  const removeActivity = useCallback((date, category) => {
    if (!date) return;
    setActivityLog(prev => {
      const day = prev[date];
      if (!day || typeof day !== "object") return prev;
      const cur = day[category] || 0;
      if (cur <= 0) return prev; // すでに0なら何もしない
      const newCount = cur - 1;
      // Supabase同期: 0以下なら0をupsert（マイナス値を防ぐ）
      if (userId && sbOps) sbOps.upsertActivity(userId, date, category, Math.max(0, newCount));
      if (newCount <= 0) {
        const next = { ...day };
        delete next[category];
        if (Object.keys(next).length === 0) {
          const top = { ...prev };
          delete top[date];
          return top;
        }
        return { ...prev, [date]: next };
      }
      return { ...prev, [date]: { ...day, [category]: newCount } };
    });
  }, [userId, sbOps]);

  // ── Item callbacks ────────────────────────────────────────────────────────
  const update = useCallback((id, patch) => setItems(p => p.map(it => {
    if (it.id !== id) return it;
    const merged = { ...it, ...patch };
    // progressHistory が渡された場合は必ず新しい配列参照にする（useMemo 再計算を保証）
    if (patch.progressHistory !== undefined) {
      merged.progressHistory = [...(patch.progressHistory || [])];
    }
    return merged;
  })), [setItems]);
  const saveEdit = useCallback((updated) => {
    setItems(prev => {
      const old = prev.find(it=>it.id===updated.id);
      if (old) {
        const delta = updated.current - old.current;
        const isTimedCat = ["youtube","tv","radio","live"].includes(updated.category);

        // ── progress delta (currentの増減) ──
        if (delta > 0) {
          // timed カテゴリは activityLog をカウントしない（完了時のみ1回）
          if (!isTimedCat) {
            for (let i=0;i<delta;i++) setActivityLog(log => { const day=log[today()]&&typeof log[today()]==="object"?log[today()]:{};const cur=day[updated.category]||0;const newCount=cur+1;if(userId&&sbOps)sbOps.upsertActivity(userId,today(),updated.category,newCount);return {...log,[today()]:{...day,[updated.category]:newCount}}; });
          }
          updated = { ...updated, progressHistory:[...(old.progressHistory||[]), {date:today(),delta,from:old.current,to:updated.current,editedViaModal:true}] };
        } else if (delta < 0) {
          // timed カテゴリは activityLog をカウントしない（分数≠記録回数なので引き算しない）
          if (!isTimedCat) {
            const removeDelta=Math.abs(delta), date=old.lastUpdated||today();
            setActivityLog(log => { const day=log[date]&&typeof log[date]==="object"?log[date]:{};const cur=day[updated.category]||0;const next=Math.max(cur-removeDelta,0);if(userId&&sbOps)sbOps.upsertActivity(userId,date,updated.category,next);if(next<=0){const nd={...day};delete nd[updated.category];if(Object.keys(nd).length===0){const tl={...log};delete tl[date];return tl;}return{...log,[date]:nd};}return{...log,[date]:{...day,[updated.category]:next}};});
          }
          // progressHistory を部分削除（timed も含む）
          const removeDelta=Math.abs(delta);
          const hist=[...(old.progressHistory||[])];let toRemove=removeDelta;
          while(toRemove>0&&hist.length>0){const last=hist[hist.length-1];if(last.delta<=toRemove){hist.pop();toRemove-=last.delta;}else{hist[hist.length-1]={...last,delta:last.delta-toRemove,to:last.to-toRemove};toRemove=0;}}
          updated = { ...updated, progressHistory: hist };
        }

        // ── status revert: done → queue/active ──
        const wasCompleted = old.status==="done" && (updated.status==="queue"||updated.status==="active");
        if (wasCompleted) {
          const toRemoveLog = {};
          (old.progressHistory||[]).forEach(h => {
            if(!h.date) return;
            if(!toRemoveLog[h.date]) toRemoveLog[h.date]={};
            toRemoveLog[h.date][old.category]=(toRemoveLog[h.date][old.category]||0)+(h.delta||1);
          });
          if(old.completedAt) {
            if(!toRemoveLog[old.completedAt]) toRemoveLog[old.completedAt]={};
            toRemoveLog[old.completedAt][old.category]=(toRemoveLog[old.completedAt][old.category]||0)+1;
          }
          setActivityLog(log => {
            let next={...log};
            Object.entries(toRemoveLog).forEach(([date,cats]) => {
              Object.entries(cats).forEach(([cat,cnt]) => {
                const day=next[date]&&typeof next[date]==="object"?next[date]:{};
                const cur=day[cat]||0;const nc=Math.max(cur-cnt,0);
                if(userId&&sbOps) sbOps.upsertActivity(userId,date,cat,nc);
                if(nc<=0){const nd={...day};delete nd[cat];if(!Object.keys(nd).length){delete next[date];}else{next[date]=nd;}}
                else{next[date]={...day,[cat]:nc};}
              });
            });
            return next;
          });
          // completedAt・progressHistory・firstActiveAtをクリア
          updated = { ...updated, progressHistory:[], firstActiveAt:null, completedAt:null };
        }
      }
      // setItems は内部で localStorage + Supabase への即時保存を行う
      return prev.map(it=>it.id===updated.id ? updated : it);
    });
    setEdit(null);
  }, [setItems, userId, sbOps]);

  const deleteItem = useCallback((id) => {
    // アクティビティログのクリーンアップ（削除前のitem情報を使う）
    setItemsRaw(prev => {
      const target = prev.find(it=>it.id===id);
      if (target) {
        // progressHistoryに基づきアクティビティログから差し引く
        const toRemove = {};
        (target.progressHistory||[]).forEach(h=>{
          if(!h.date) return;
          if(!toRemove[h.date]) toRemove[h.date]={};
          toRemove[h.date][target.category]=(toRemove[h.date][target.category]||0)+1;
        });
        const isBin = ["youtube","tv","radio","live","article"].includes(target.category);
        if(isBin && target.completedAt){
          if(!toRemove[target.completedAt]) toRemove[target.completedAt]={};
          toRemove[target.completedAt][target.category]=(toRemove[target.completedAt][target.category]||0)+1;
        }
        if(Object.keys(toRemove).length > 0){
          setActivityLog(log=>{
            let next={...log};
            for(const [date,cats] of Object.entries(toRemove)){
              for(const [cat,cnt] of Object.entries(cats)){
                const day=next[date]&&typeof next[date]==="object"?next[date]:{};
                const cur=day[cat]||0;
                const newCount=Math.max(cur-cnt,0);
                if(userId&&sbOps) sbOps.upsertActivity(userId,date,cat,newCount);
                if(newCount<=0){
                  const nd={...day}; delete nd[cat];
                  if(Object.keys(nd).length===0){delete next[date];}
                  else{next[date]=nd;}
                }else{next[date]={...day,[cat]:newCount};}
              }
            }
            // localStorage更新（activityLog）
            try { localStorage.setItem(LS_DATES, JSON.stringify(next)); } catch {}
            return next;
          });
        }

        // EXPの取り消し処理は削除済み
      }

      const next = prev.filter(it=>it.id!==id);

      // ── 重要: localStorage と Supabase を即座に更新 ──
      try { localStorage.setItem(LS_ITEMS, JSON.stringify(next)); } catch {}
      if (userId && sbOps) {
        // debounceを経由せず即時削除
        sbOps.deleteItem(userId, id).catch(e=>console.error("sbDeleteItem:", e));
      }

      return next;
    });
    setEdit(null);
  }, [userId, sbOps]);

  const statusChange = useCallback((id,st)=>{
    if(st==="active"){setWatchQueue(prev=>{const idx=prev.indexOf(id);if(idx===-1)return prev;const next=prev.filter(x=>x!==id);if(idx===0&&next.length===0)setTimeout(()=>setNvChooseOpen(true),50);return next;});}
  },[]);

  const move = useCallback((id,st)=>{
    setItems(p=>p.map(it=>{if(it.id!==id)return it;const patch={...it,status:st,completedAt:st==="done"?today():null,current:st==="done"?it.total:it.current};if(st==="active"&&it.status==="queue"&&!it.firstActiveAt)patch.firstActiveAt=today();if(st==="queue")patch.firstActiveAt=null;return patch;}));
    if(st==="done"){
      setConfetti(true);
    }
    if(st==="active"){
      setWatchQueue(prev=>{const idx=prev.indexOf(id);if(idx===-1)return prev;const next=prev.filter(x=>x!==id);if(idx===0&&next.length===0)setTimeout(()=>setNvChooseOpen(true),50);return next;});
    }
  },[setItems]);

  const addItem = useCallback((item)=>setItems(p=>[...p,item]),[setItems]);
  const reorder = useCallback((listItems,idx,dir)=>{const si=idx+dir;if(si<0||si>=listItems.length)return;const arr=[...listItems];[arr[idx],arr[si]]=[arr[si],arr[idx]];setItems(prev=>{const ids=arr.map(i=>i.id);return prev.map(it=>{const qi=ids.indexOf(it.id);return qi>=0?{...it,priority:qi}:it;});});},[setItems]);

  const active   = items.filter(i=>i.status==="active").sort((a,b)=>a.priority-b.priority);
  const wqValidIds = watchQueue.filter(id=>items.find(i=>i.id===id&&i.status==="queue"));

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!loaded) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:NEW_G.bg,fontFamily:F2,color:NEW_G.greyMid,fontSize:13 }}>
      読み込み中…
    </div>
  );

  // ── Nav tab handler ───────────────────────────────────────────────────────
  const handleNavTab = (t) => {
    setNavTab(t);  // 2=add, 3=report are now full pages too
  };

  const NAV_ITEMS = [
    { label:"Home",     icon: NAV_ICONS.home     },
    { label:"Contents", icon: NAV_ICONS.list     },
    { label:"",         icon: NAV_ICONS.add, isAdd:true },
    { label:"Report",   icon: NAV_ICONS.report   },
    { label:"Settings", icon: NAV_ICONS.settings },
  ];

  const accentColor = "#767676";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <React.Fragment>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        html { background:#FFFFFF; }
        body { margin:0; background:#FFFFFF; font-family:'Inter','Noto Sans JP','Hiragino Sans',sans-serif; letter-spacing:0.02em; font-size:13px; }
        ::-webkit-scrollbar { display:none; }
        @keyframes fadeUp { from{opacity:0;transform:translate(-50%,10px);}to{opacity:1;transform:translate(-50%,0);} }
        @keyframes spin { to { transform:rotate(360deg); } }
        input[type="date"], input[type="datetime-local"] {
          -webkit-appearance:none; -moz-appearance:none; appearance:none;
          box-sizing:border-box; width:100%; max-width:100%; min-width:0;
        }
        button { letter-spacing:0.02em; }
      `}</style>

      <div style={{
        background: navTab===1 || navTab===4 ? "#F7F7F7" : "#FFFFFF",
        fontFamily:F2, maxWidth:480, margin:"0 auto" }}>

        {/* ── Page content ── */}
        {navTab===1 ? (
          <div style={{ overflowY:"auto", height:"100vh", background:"#F7F7F7",
            paddingBottom:"calc(120px + env(safe-area-inset-bottom, 34px))" }}>
            <ContentsScreen
              items={items}
              watchQueue={watchQueue}
              setWatchQueue={setWatchQueue}
              activityLog={activityLog}
              onUpdate={update}
              onEdit={setEdit}
              onMove={move}
              onActivityLog={logActivity}
              onStatusChange={statusChange}
              removeActivityLog={removeActivity}
              onReorder={reorder}
            />
          </div>
        ) : (
          /* Home / + / Report / Settings: 自然な高さ（余白スクロールなし） */
          <div style={{ paddingBottom:"calc(90px + env(safe-area-inset-bottom, 34px))" }}>
            {navTab===0 && (
              <HomeScreen
                items={items}
                activityLog={activityLog}
                onUpdate={update}
                onMove={move}
                onActivityLog={logActivity}
                onEdit={setEdit}
                onStatusChange={statusChange}
                removeActivityLog={removeActivity}
              />
            )}
            {navTab===2 && (
              <AddPageScreen onAdd={(item)=>{ addItem(item); setGlobalToast("コンテンツを追加しました！"); }} onDone={()=>setNavTab(1)} F2={F2}/>
            )}
            {navTab===3 && (
              <ReportPageScreen items={items} activityLog={activityLog} F2={F2}
                onUpdate={update} onActivityLog={logActivity}
                removeActivityLog={removeActivity}/>
            )}
            {navTab===4 && (
              <SettingsScreen
                user={user}
                onLogout={onLogout}
                syncStatus={syncStatus}
                items={items}
                onDeleteAll={async () => {
                  setItems([]);
                  setActivityLog({});
                  setWatchQueue([]);
                  lsSet(LS_ITEMS, []);
                  lsSet(LS_DATES, {});
                  lsSet(LS_WQ, []);
                  if (userId && sbOps) {
                    try {
                      await Promise.all(items.map(it => sbOps.deleteItem(userId, it.id)));
                      for (const date of Object.keys(activityLog)) {
                        for (const cat of Object.keys(activityLog[date]||{})) {
                          await sbOps.upsertActivity(userId, date, cat, 0);
                        }
                      }
                      if (sbOps.saveWatchQueue) await sbOps.saveWatchQueue(userId, []);
                    } catch(e) { console.error("deleteAll error:", e); }
                  }
                }}
              />
            )}
          </div>
        )}

        {/* ── Bottom Navigation ── */}
        <div style={{
          position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
          width:"100%", maxWidth:480,
          background:NEW_G.nav,
          borderTop:`1px solid ${NEW_G.border}`,
          /* alignItems:flex-start でアイコンを上寄りに配置 */
          display:"flex", alignItems:"flex-start", justifyContent:"space-around",
          /* paddingTop を大きくしてアイコンを上に浮かせる */
          paddingTop:16,
          /* safe-area を多めに確保（デフォルト34px + 余裕分）*/
          paddingBottom:"calc(34px + env(safe-area-inset-bottom, 34px))",
          zIndex:200,
          boxShadow:"0 -4px 20px rgba(0,0,0,0.06)",
        }}>
          {NAV_ITEMS.map((item, i) => {
            if (item.isAdd) {
              return (
                /* + ボタンは大きめのタップ領域でラップ */
                <div key={i}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center",
                    padding:"0 12px", minWidth:64, cursor:"pointer" }}
                  onClick={()=>handleNavTab(2)}>
                  <div style={{ width:52, height:52, borderRadius:"50%",
                    background:accentColor, border:"none",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:`0 2px 12px rgba(118,118,118,0.40)`, flexShrink:0 }}>
                    <NAV_ICONS.add/>
                  </div>
                </div>
              );
            }
            const isActive = navTab === i || (i===3 && showReport);
            return (
              <button key={i} onClick={()=>handleNavTab(i)}
                style={{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                  background:"none", border:"none", cursor:"pointer",
                  /* 広いタップ領域: 横16px×縦12px+8px */
                  padding:"12px 16px 8px",
                  minWidth:60, minHeight:52,
                  WebkitTapHighlightColor:"transparent",
                }}>
                <item.icon active={isActive} col={accentColor}/>
                <span style={{ fontSize:9, fontWeight:isActive?700:500,
                  color:isActive?accentColor:NEW_G.greyMid, letterSpacing:"0.08em" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Modals (global) ── */}
      {editItem && <EditModal item={editItem} onClose={()=>setEdit(null)} onSave={saveEdit} onDelete={deleteItem}/>}
      {nvChooseOpen && <NVChoosePrompt queueItems={items.filter(i=>i.status==="queue")} onSelect={(id)=>{ setWatchQueue(prev=>[id,...prev.filter(x=>x!==id)]); setNvChooseOpen(false); }} onDismiss={()=>setNvChooseOpen(false)}/>}
      {showConfetti && <Confetti onDone={()=>setConfetti(false)}/>}
      {globalToast && <Toast msg={globalToast} onHide={()=>setGlobalToast(null)}/>}
    </React.Fragment>
  );
}

// ─── Default export (artifact preview) ───────────────────────────────────
export default ContentsProgress;