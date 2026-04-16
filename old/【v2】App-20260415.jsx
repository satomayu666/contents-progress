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
const LS_WQ    = "cp_wq_v1";   // watch queue: string[] of item IDs (max 5)
const LS_DATES = "cp_dates_v6";
 
// ─── Persistent storage (window.storage for Claude Artifacts) ────────────────
async function wsGet(key, fallback) {
  try {
    if (window.storage) {
      const res = await window.storage.get(key);
      if (res && res.value != null) return JSON.parse(res.value);
    }
  } catch {}
  return fallback;
}
async function wsSet(key, value) {
  try { if (window.storage) await window.storage.set(key, JSON.stringify(value)); } catch {}
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
 
// ─── Categories ──────────────────────────────────────────────────────────────
const CATS = {
  article: { label:"WEBサイト", unit:"件",  color:"#B6BF99", order:0 },
  live:    { label:"ライブ映像", unit:"曲",  color:"#D5D29F", order:1 },
  youtube: { label:"YouTube",   unit:"本",  color:"#876560", order:2 },
  radio:   { label:"ラジオ",    unit:"本",  color:"#9DBBBE", order:3 },
  tv:      { label:"TV",        unit:"本",  color:"#B6AA9C", order:4 },
  book:    { label:"本",         unit:"P",   color:"#A493AF", order:5 },
  anime:   { label:"アニメ",    unit:"話",  color:"#899EB4", order:6 },
  drama:   { label:"ドラマ",    unit:"話",  color:"#7C8F5E", order:7 },
  movie:   { label:"映画",       unit:"分",  color:"#D3ABAA", order:8 },
  manga:   { label:"漫画",       unit:"巻",  color:"#D1B7A0", order:9 },
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
// Future: real fetch → querySelector('article,main') → innerText
function simulateArticleFetch(_url) { return { estimatedMin: cjkMin("あ".repeat(3200)) }; }
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
const INP = { width:"100%",padding:"10px 12px",border:`1.5px solid ${G.border}`,borderRadius:9,fontSize:13,outline:"none",fontFamily:F,background:G.surfaceAlt,boxSizing:"border-box",color:G.greyDeep,lineHeight:1.5,letterSpacing:"0.07em" };
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
  // value: string[]   options: {label, key}[]   otherKey: key that triggers free-text
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
              style={{ padding:"6px 12px", borderRadius:99, fontSize:12, fontWeight:600, border:`1.5px solid ${on ? G.greyDeep : G.border}`, background:on ? G.greyDeep : G.surfaceAlt, color:on ? "#fff" : G.greyDark, cursor:"pointer", fontFamily:F, transition:"all .15s" }}>
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
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(34,34,34,0.45)",zIndex:950,display:"flex",alignItems:"flex-end" }}>
      <div style={{ background:G.surface,borderRadius:"22px 22px 0 0",width:"100%",padding:"26px 20px 48px",maxHeight:"70vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize:16,fontWeight:800,color:G.greyDeep,marginBottom:6,display:"flex",alignItems:"center",gap:8 }}>
          <ICONS.pin/> Next View を選んでください
        </div>
        <p style={{ fontSize:12,color:G.greyMid,marginBottom:16,lineHeight:1.6 }}>
          NEXT VIEW ①が進行中になりました。次に見る作品を選んでください。
        </p>
        {queueItems.map(item => {
          const c = CATS[item.category];
          return (
            <button key={item.id} onClick={()=>onSelect(item.id)}
              style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px",marginBottom:8,borderRadius:12,border:`1.5px solid ${G.border}`,background:G.surfaceAlt,cursor:"pointer",textAlign:"left",fontFamily:F }}>
              <CatIco cat={item.category} color={G.greyMid}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,fontWeight:700,color:G.greyDeep,lineHeight:1.4 }}>{item.title}</div>
                <div style={{ fontSize:11,color:G.greyMid,marginTop:3 }}>{c.label}</div>
              </div>
            </button>
          );
        })}
        <button onClick={onDismiss}
          style={{ ...gBt(),width:"100%",justifyContent:"center",padding:"11px",marginTop:4,fontSize:12 }}>
          あとで設定する
        </button>
      </div>
    </div>
  );
}
 
// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ item, onClose, onSave, onDelete }) {
  const c = CATS[item.category];
  const [f, setF] = useState({ ...item });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
 
  const save = () => {
    const cur  = Number(f.current)||0;
    const tot  = Number(f.total)||1;
    const isBinaryCat = ["youtube","tv","radio","live","article"].includes(f.category);
    const newStatus = isBinaryCat ? f.status : resolveStatus(cur, tot);
    const newCompletedAt = resolveCompletedAt(cur, tot, f.completedAt, f.status);
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
      completedAt:       isBinaryCat ? f.completedAt : newCompletedAt,
    });
  };
 
  const isTimed = ["tv","radio","live","movie","youtube"].includes(f.category);
  const isEpBased = ["anime","drama"].includes(f.category);
  // movie uses episodeMin as its duration — no separate current/total grid
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
 
        {showProgress&&(
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
            <div><label style={LBL}>現在 ({c.unit})</label><input type="number" style={INP} value={f.current} onChange={e=>set("current",e.target.value)}/></div>
            <div><label style={LBL}>合計 ({c.unit})</label><input type="number" style={INP} value={f.total} onChange={e=>set("total",e.target.value)}/></div>
          </div>
        )}
        {isEpBased&&<FF label="1話の時間 (分)"><input type="number" style={INP} value={f.episodeMin||""} onChange={e=>set("episodeMin",e.target.value)}/></FF>}
        {(isTimed&&!isEpBased)&&f.category!=="youtube"&&f.category!=="movie"&&(
          <FF label="合計時間 (分)"><input type="number" style={INP} placeholder="例: 120" value={f.totalDurationMin||""} onChange={e=>set("totalDurationMin",e.target.value)}/></FF>
        )}
        {f.category==="movie"&&<FF label="上映時間 (分)"><input type="number" style={INP} value={f.episodeMin||""} onChange={e=>set("episodeMin",e.target.value)}/></FF>}
        {f.category==="youtube"&&(
          <>
            <FF label="動画の長さ (分)"><input type="number" style={INP} placeholder="例: 15" value={f.videoDurationMin||""} onChange={e=>set("videoDurationMin",e.target.value)}/></FF>
            <FF label="URL"><input style={INP} placeholder="https://youtube.com/watch?v=..." value={f.videoUrl||""} onChange={e=>set("videoUrl",e.target.value)}/></FF>
          </>
        )}
        {(f.category==="anime"||f.category==="drama")&&(
          <FF label="配信サービス">
            <MultiSelect options={STREAMING_OPTIONS} value={f.streamingServices||[]} onChange={v=>set("streamingServices",v)} otherKey="other" otherValue={f.streamingOther||""} onOtherChange={v=>set("streamingOther",v)}/>
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
            <FF label="ラジオ局"><input style={INP} placeholder="例: NHK FM" value={f.station||""} onChange={e=>set("station",e.target.value)}/></FF>
            <FF label="放送日時"><input type="datetime-local" style={INP} value={f.airDate||""} onChange={e=>set("airDate",e.target.value)}/></FF>
            <FF label="URL"><input style={INP} placeholder="https://…" value={f.contentUrl||""} onChange={e=>set("contentUrl",e.target.value)}/></FF>
          </>
        )}
        {f.category==="tv"&&(
          <>
            <FF label="テレビ局"><input style={INP} placeholder="例: NHK" value={f.tvStation||""} onChange={e=>set("tvStation",e.target.value)}/></FF>
            <FF label="視聴方法">
              <MultiSelect options={TV_VIEW_OPTIONS} value={f.tvViewMethod||[]} onChange={v=>set("tvViewMethod",v)} otherKey="other" otherValue={f.tvViewOther||""} onOtherChange={v=>set("tvViewOther",v)}/>
            </FF>
            <FF label="OA日時"><input type="datetime-local" style={INP} value={f.airDate||""} onChange={e=>set("airDate",e.target.value)}/></FF>
            <FF label="URL"><input style={INP} placeholder="https://…" value={f.contentUrl||""} onChange={e=>set("contentUrl",e.target.value)}/></FF>
          </>
        )}
        {["radio","tv","book","anime","drama","movie","manga"].includes(f.category)&&f.category!=="radio"&&f.category!=="tv"&&(
          <FF label="URL"><input style={INP} placeholder="https://…" value={f.contentUrl||""} onChange={e=>set("contentUrl",e.target.value)}/></FF>
        )}
        {f.category==="article"&&(
          <FF label="URL">
            <input style={INP} placeholder="https://…" value={f.articleUrl||""} onChange={e=>set("articleUrl",e.target.value)}/>
          </FF>
        )}
 
        <FF label="視聴・読み始めた日">
          <input type="date" style={INP} value={f.startedAt||""} onChange={e=>set("startedAt",e.target.value)}/>
        </FF>
        <FF label="メモ">
          <textarea style={{ ...INP,minHeight:64,resize:"vertical" }} value={f.notes} onChange={e=>set("notes",e.target.value)}/>
        </FF>
 
        {/* Status preview — only for non-binary categories */}
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
 
        <button onClick={save} style={{ ...sBt(c.color),width:"100%",justifyContent:"center",padding:"14px",fontSize:15 }}>保存する</button>
 
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
function AddModal({ onClose, onAdd }) {
  const [f,setF] = useState({ title:"",category:"anime",total:"",episodeMin:"",totalDurationMin:"",videoDurationMin:"",videoUrl:"",articleUrl:"",contentUrl:"",station:"",tvStation:"",tvViewMethod:[],tvViewOther:"",airDate:"",streamingServices:[],streamingOther:"",readingMethod:[],readingSubOther:"",readingOther:"",startedAt:"",notes:"" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const c = CATS[f.category];
 
  const add = () => {
    if(!f.title) return;
    const noProgress = ["youtube","tv","radio","live","article","movie"].includes(f.category);
    // For movie, total = episodeMin (upper duration); for others, use f.total
    const totalVal = f.category==="movie" ? (Number(f.episodeMin)||1) : noProgress ? 1 : Number(f.total)||1;
    const aMeta = f.category==="article" ? simulateArticleFetch(f.notes) : {};
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
      episodeMin:       f.category==="article" ? aMeta.estimatedMin : Number(f.episodeMin)||null,
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
    });
    onClose();
  };
 
  const isEpBased = ["anime","drama"].includes(f.category);
 
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(34,34,34,0.32)",zIndex:900,display:"flex",alignItems:"flex-end" }}>
      <div style={{ background:G.surface,borderRadius:"22px 22px 0 0",width:"100%",padding:"28px 22px 48px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.12)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
          <span style={{ fontSize:17,fontWeight:800,color:G.greyDeep }}>新しいコンテンツ</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:G.greyMid,display:"flex",padding:4 }}><ICONS.close/></button>
        </div>
 
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
 
        <FF label="タイトル"><input style={INP} placeholder="タイトルを入力…" value={f.title} onChange={e=>set("title",e.target.value)}/></FF>
 
        {/* Per-category fields */}
        {!["article","youtube","tv","radio","live","movie"].includes(f.category)&&(
          <FF label={`合計 (${c.unit})`}><input type="number" style={INP} placeholder="例: 24" value={f.total} onChange={e=>set("total",e.target.value)}/></FF>
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
            <FF label="放送日時"><input type="datetime-local" style={INP} value={f.airDate} onChange={e=>set("airDate",e.target.value)}/></FF>
            <FF label="URL（任意）"><input style={INP} placeholder="https://…" value={f.contentUrl} onChange={e=>set("contentUrl",e.target.value)}/></FF>
          </>
        )}
        {f.category==="tv"&&(
          <>
            <FF label="テレビ局（任意）"><input style={INP} placeholder="例: NHK" value={f.tvStation} onChange={e=>set("tvStation",e.target.value)}/></FF>
            <FF label="視聴方法">
              <MultiSelect options={TV_VIEW_OPTIONS} value={f.tvViewMethod} onChange={v=>set("tvViewMethod",v)} otherKey="other" otherValue={f.tvViewOther} onOtherChange={v=>set("tvViewOther",v)}/>
            </FF>
            <FF label="OA日時（任意）"><input type="datetime-local" style={INP} value={f.airDate} onChange={e=>set("airDate",e.target.value)}/></FF>
            <FF label="URL（任意）"><input style={INP} placeholder="https://…" value={f.contentUrl} onChange={e=>set("contentUrl",e.target.value)}/></FF>
          </>
        )}
        {["book","anime","drama","movie","manga"].includes(f.category)&&(
          <FF label="URL（任意）"><input style={INP} placeholder="https://…" value={f.contentUrl} onChange={e=>set("contentUrl",e.target.value)}/></FF>
        )}
        {f.category==="article"&&(
          <FF label="URL">
            <input style={INP} placeholder="https://…" value={f.articleUrl} onChange={e=>set("articleUrl",e.target.value)}/>
          </FF>
        )}
        <FF label="視聴・読み始めた日（任意）">
          <input type="date" style={INP} value={f.startedAt} onChange={e=>set("startedAt",e.target.value)}/>
        </FF>
        <FF label="メモ（任意）">
          <input style={INP} placeholder="メモ…" value={f.notes} onChange={e=>set("notes",e.target.value)}/>
        </FF>
 
        <button onClick={add} style={{ ...sBt(c.color),width:"100%",justifyContent:"center",padding:"14px",fontSize:15 }}>追加する</button>
      </div>
    </div>
  );
}
 
// ─── Data Modal ───────────────────────────────────────────────────────────────
function DataModal({ items, onImport, onMerge, onClose }) {
  const fileRef  = useRef(null);
  const mergeRef = useRef(null);
  const [status, setStatus]       = useState(null);
  const [exportText, setExportText] = useState(null);
 
  // Filename: contents_progress_YYYYMMDDHHII.json
  function exportFilename() {
    const d = new Date();
    const pad = n => String(n).padStart(2,"0");
    return `contents_progress_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}.json`;
  }
 
  const doExport = () => {
    const json = JSON.stringify({ version:3, exportedAt:new Date().toISOString(), items }, null, 2);
    try {
      const blob = new Blob([json],{type:"application/json"}), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = exportFilename();
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      setStatus({ ok:true, msg:"ダウンロードしました！" });
    } catch { setExportText(json); }
  };
 
  const parseFile = (file, cb) => {
    const r = new FileReader();
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        if (!d.items || !Array.isArray(d.items)) throw new Error();
        cb(d.items);
      } catch { setStatus({ ok:false, msg:"⚠️ ファイル形式が正しくありません" }); }
    };
    r.readAsText(file);
  };
 
  const doOverwrite = e => {
    const file = e.target.files[0]; if (!file) return;
    parseFile(file, ni => { onImport(ni); setStatus({ ok:true, msg:`${ni.length}件を上書きインポートしました！` }); });
  };
 
  const doMerge = e => {
    const file = e.target.files[0]; if (!file) return;
    parseFile(file, ni => { onMerge(ni); setStatus({ ok:true, msg:"マージ完了！重複IDはスキップされました。" }); });
  };
 
  const sectionStyle = { border:`1.5px solid ${G.border}`, borderRadius:14, padding:"18px 16px", marginBottom:12 };
 
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(34,34,34,0.32)",zIndex:900,display:"flex",alignItems:"flex-end" }}>
      <div style={{ background:G.surface,borderRadius:"22px 22px 0 0",width:"100%",padding:"28px 22px 48px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.12)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
          <span style={{ fontSize:17,fontWeight:800,color:G.greyDeep }}>データ管理</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:G.greyMid,display:"flex",padding:4 }}><ICONS.close/></button>
        </div>
        {status && <div style={{ background:status.ok?tint(P.green):tint(P.pink),borderRadius:10,padding:"11px 14px",fontSize:13,color:G.greyDeep,marginBottom:16,fontWeight:600,borderLeft:`3px solid ${status.ok?P.green:P.pink}` }}>{status.msg}</div>}
 
        {/* Export */}
        <div style={sectionStyle}>
          <div style={{ fontSize:14,fontWeight:700,color:G.greyDeep,marginBottom:6,display:"flex",alignItems:"center",gap:7 }}><ICONS.dl/> エクスポート</div>
          <p style={{ fontSize:12,color:G.greyMid,margin:"0 0 6px",lineHeight:1.7 }}>全データをJSONで保存。ファイル名に日時が入ります。</p>
          <p style={{ fontSize:11,color:G.borderMid,margin:"0 0 14px",fontFamily:"monospace" }}>{exportFilename()}</p>
          <button onClick={doExport} style={{ ...sBt(G.greyDeep),width:"100%",justifyContent:"center",padding:"12px",marginBottom:exportText?10:0 }}>
            <ICONS.dl/> JSONをエクスポート（{items.length}件）
          </button>
          {exportText && (
            <>
              <div style={{ fontSize:11,color:G.greyMid,marginBottom:6,marginTop:8,fontWeight:600 }}>↓ 全選択してコピーしてください</div>
              <textarea readOnly value={exportText} onClick={e=>e.target.select()} style={{ ...INP,minHeight:90,fontSize:11,fontFamily:"monospace",resize:"none" }}/>
            </>
          )}
        </div>
 
        {/* Overwrite import */}
        <div style={sectionStyle}>
          <div style={{ fontSize:14,fontWeight:700,color:G.greyDeep,marginBottom:6,display:"flex",alignItems:"center",gap:7 }}><ICONS.ul/> インポート（上書き）</div>
          <p style={{ fontSize:12,color:G.greyMid,margin:"0 0 14px",lineHeight:1.7 }}>
            エクスポートしたJSONを読み込みます。<br/>
            <strong style={{ color:G.greyDeep }}>現在のデータはすべて上書きされます。</strong>
          </p>
          <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }} onChange={doOverwrite}/>
          <button onClick={()=>fileRef.current.click()} style={{ ...oBt(G.grey,G.greyDark),width:"100%",justifyContent:"center",padding:"12px" }}>
            <ICONS.ul/> ファイルを選択して上書き
          </button>
        </div>
 
        {/* Merge import */}
        <div style={{ ...sectionStyle, marginBottom:0 }}>
          <div style={{ fontSize:14,fontWeight:700,color:G.greyDeep,marginBottom:6,display:"flex",alignItems:"center",gap:7 }}><ICONS.merge/> インポート（マージ）</div>
          <p style={{ fontSize:12,color:G.greyMid,margin:"0 0 14px",lineHeight:1.7 }}>
            現在のデータに別ファイルのデータを統合します。<br/>
            同じIDのアイテムはスキップ、新しいIDのみ追加されます。<br/>
            <span style={{ color:dk(P.green),fontWeight:600 }}>別端末のデータをまとめるときに便利です。</span>
          </p>
          <input ref={mergeRef} type="file" accept=".json" style={{ display:"none" }} onChange={doMerge}/>
          <button onClick={()=>mergeRef.current.click()} style={{ ...oBt(P.teal,dk(P.teal)),width:"100%",justifyContent:"center",padding:"12px" }}>
            <ICONS.merge/> ファイルを選択してマージ
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ─── URL Button — opens directly in new tab, no confirmation ─────────────────
function UrlButton({ url, color, label="URLを開く" }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ fontSize:12, color:dk(color), fontWeight:600, display:"inline-flex", alignItems:"center", gap:4, textDecoration:"none", background:tint(color), borderRadius:7, padding:"3px 10px" }}>
      <ICONS.link/> {label}
    </a>
  );
}
 
// ─── Item Card ─────────────────────────────────────────────────────────────────
function ItemCard({ item, onUpdate, onEdit, onMove, nvIndex, onActivityLog, onStatusChange }) {
  const isNext = nvIndex === 0;
  const c = CATS[item.category];
  const p = pct(item.current, item.total);
  const rem = item.total - item.current;
  const [toast,setToast]             = useState(null);
  const [timerOpen,setTimerOpen]     = useState(false);
  const [memoOpen,setMemoOpen]       = useState(false);
  const [showConfetti,setShowConfetti] = useState(false);
  const hasNotes = item.notes && item.notes.trim().length > 0;
 
  const totalMin =
    (item.category==="anime"||item.category==="drama")&&item.episodeMin ? rem*item.episodeMin :
    item.category==="movie"&&item.episodeMin ? item.episodeMin*(1-p/100) :
    (item.category==="live"||item.category==="tv"||item.category==="radio")&&item.totalDurationMin ? item.totalDurationMin :
    item.category==="youtube"&&item.videoDurationMin ? item.videoDurationMin :
    item.category==="article" ? (item.episodeMin||5)*rem : null;
 
  const qa = (item.category==="anime"||item.category==="drama")?1:item.category==="book"?10:item.category==="manga"?1:item.category==="movie"?10:1;
  const ql = (item.category==="anime"||item.category==="drama")?"+1話":item.category==="book"?"+10P":item.category==="manga"?"+1巻":item.category==="movie"?"+10分":item.category==="live"?"+1曲":item.category==="youtube"||item.category==="tv"||item.category==="radio"?"視聴済み":"読了";
 
  const quickAdd = (amt) => {
    const nx = Math.min(item.total, item.current+amt);
    const newSt = resolveStatus(nx, item.total);
    const patch = { current:nx, lastUpdated:today(), status:newSt };
    onActivityLog(today(), item.category);
    // Notify WQ manager when status becomes active (was queue before)
    if (newSt === "active" && item.status === "queue") onStatusChange && onStatusChange(item.id, "active");
    if (nx >= item.total) {
      Object.assign(patch, { status:"done", completedAt:today(), current:item.total });
      onUpdate(item.id, patch);
      setToast("完了！おめでとうございます 🎉");
      setShowConfetti(true);
    } else {
      onUpdate(item.id,patch);
      if((item.category==="anime"||item.category==="drama")&&item.episodeMin) setToast(`次は第${Math.floor(nx)+1}話。今から始めると ${finAt(item.episodeMin)} に終わります`);
      else if(item.category==="article") setToast("読了を記録しました");
      else if(["youtube","tv","radio"].includes(item.category)) setToast("視聴を記録しました！");
      else setToast(`${ql} を記録しました`);
    }
  };
 
  const completeCelebrate = () => {
    onMove(item.id, "done");
    setToast("完了！おめでとうございます 🎉");
    setShowConfetti(true);
  };
  const isYT    = item.category==="youtube";
  const isTV    = item.category==="tv";
  const isRadio = item.category==="radio";
  const isBinary = ["youtube","tv","radio","live","article"].includes(item.category);
 
  // Duration label: startedAt → completedAt (or today if active)
  const durationDays = (() => {
    if (!item.startedAt) return null;
    const end = item.completedAt || (item.status==="active" ? today() : null);
    if (!end) return null;
    return daysBetween(item.startedAt, end);
  })();
 
  // Streaming service labels to display
  const streamingLabels = (item.streamingServices||[]).map(k => {
    if (k === "other") return item.streamingOther || "その他";
    return STREAMING_OPTIONS.find(o=>o.key===k)?.label || k;
  }).filter(Boolean);
 
  // Reading method labels to display
  const readingLabels = (item.readingMethod||[]).map(k => {
    if (k === "sub")   return item.readingSubOther || "サブスク";
    if (k === "other") return item.readingOther    || "その他";
    return READING_OPTIONS.find(o=>o.key===k)?.label || k;
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
 
          {/* startedAt + duration */}
          {item.startedAt&&(
            <div style={{ fontSize:11,color:G.greyMid,marginTop:8,display:"flex",alignItems:"center",gap:4 }}>
              <ICONS.clock/>
              {item.startedAt} 開始
              {durationDays&&<span style={{ marginLeft:4,fontWeight:600,color:G.greyDark }}>（{durationDays}日{item.status==="active"?"経過":"かけて完了"}）</span>}
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
                  style={{ background:"none",border:"none",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,padding:0,fontFamily:F }}>
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
                item.status==="done" ? <><ICONS.check/> 視聴済み</> : "未視聴"
              )}
            </span>
            {item.category==="article"&&<span>約{item.episodeMin||5}分で読了</span>}
            {isTV&&item.totalDurationMin&&<span>約{fmtGap(item.totalDurationMin)}</span>}
            {isRadio&&item.totalDurationMin&&<span>約{fmtGap(item.totalDurationMin)}</span>}
          </div>
        ) : (
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:13 }}>
            <span style={{ fontWeight:700,color:G.greyDeep }}>{item.current} / {item.total} {c.unit}</span>
            <span style={{ fontWeight:800,color:p===100?dk(P.green):dk(c.color) }}>{p}%</span>
          </div>
        )}
        {/* ProgressBar: live uses status-based value (0/50/100) */}
        <ProgressBar
          value={item.category==="live" ? (item.status==="done"?100:item.status==="active"?50:0) : p}
          color={c.color}
        />
        {totalMin!=null&&rem>0&&!["live","tv","radio","youtube"].includes(item.category)&&(
          <div style={{ fontSize:11,color:G.greyMid,marginTop:3 }}>あと{fmtGap(totalMin)}（{hint(totalMin)}）</div>
        )}
      </div>
 
      {/* Actions */}
      <div style={{ display:"flex",gap:6,marginTop:9,flexWrap:"wrap" }}>
        {/* Primary quick-add — hidden for live and binary-done categories */}
        {item.status!=="done" && item.category!=="live" && (
          <button onClick={()=>quickAdd(qa)} style={sBt(c.color)}>{ql}</button>
        )}
        {/* 5min timer — not for binary-quick categories */}
        {item.status!=="done" && !["youtube","article","tv","radio","live"].includes(item.category) && (
          <button onClick={()=>setTimerOpen(t=>!t)} style={oBt(G.grey,G.greyDark)}><ICONS.clock/> 5分</button>
        )}
 
        {/* ── live ── */}
        {item.category==="live" && item.status==="queue" && (
          <>
            <button onClick={()=>onMove(item.id,"active")}
              style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
              <ICONS.play/>進行中にする
            </button>
            <button onClick={completeCelebrate} style={{ ...gBt(), fontSize:11, padding:"7px 11px" }}><ICONS.check/>完了にする</button>
          </>
        )}
        {item.category==="live" && item.status==="active" && (
          <>
            <button onClick={()=>onMove(item.id,"queue")}
              style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
              これからに戻す
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
            <button onClick={()=>onMove(item.id,"queue")}
              style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
              これからに戻す
            </button>
          </>
        )}
 
        {/* ── article ── */}
        {item.category==="article" && item.status==="queue" && (
          <button onClick={()=>onMove(item.id,"active")}
            style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
            <ICONS.play/>進行中にする
          </button>
        )}
        {item.category==="article" && item.status==="active" && (
          <>
            <button onClick={()=>onMove(item.id,"queue")}
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
            <button onClick={()=>onMove(item.id,"queue")}
              style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
              これからに戻す
            </button>
          </>
        )}
 
        {/* ── other binary (youtube/tv/radio) ── */}
        {isBinary && !["live","article"].includes(item.category) && item.status==="queue" && (
          <button onClick={()=>onMove(item.id,"active")}
            style={{ padding:"7px 11px",borderRadius:8,fontSize:11,fontWeight:600,border:"1.5px solid #DCDAD7",background:"#F0EFED",color:"#8A8885",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F,lineHeight:1 }}>
            <ICONS.play/>進行中にする
          </button>
        )}
        {isBinary && !["live","article"].includes(item.category) && item.status==="active" && (
          <button onClick={completeCelebrate} style={{ ...gBt(), fontSize:11, padding:"7px 11px" }}><ICONS.check/>完了にする</button>
        )}
 
        {/* ── non-binary ── */}
        {!isBinary && item.status==="queue" && (
          <button onClick={()=>onMove(item.id,"active")}
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
 
      <div style={{ display:"flex",gap:10,marginTop:8,fontSize:9,color:G.borderMid,flexWrap:"wrap",lineHeight:1.5 }}>
        <span>追加: {item.addedAt}</span>
        {item.lastUpdated&&<span>更新: {item.lastUpdated}</span>}
        {item.completedAt&&<span>完了: {item.completedAt}</span>}
      </div>
    </div>
  );
}
 
// ─── Report Modal ─────────────────────────────────────────────────────────────
function ReportModal({ items, activityLog, onClose }) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [view,  setView]  = useState("month");
  const [exportDone, setExportDone] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const ITEM_PREVIEW = 4; // show first N items, rest collapsed
 
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
 
  // ── Canvas export (white background) ────────────────────────────────────
  const exportImage = () => {
    const W=600, H=900;
    const c=document.createElement("canvas"); c.width=W; c.height=H;
    const ctx=c.getContext("2d");
    function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fill();}
 
    // White background
    ctx.fillStyle="#FFFFFF"; ctx.fillRect(0,0,W,H);
    // Top accent bar
    const grad=ctx.createLinearGradient(0,0,W,0);
    CONFETTI_COLORS.forEach((col,i)=>grad.addColorStop(i/(CONFETTI_COLORS.length-1),col));
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,5);
 
    const periodLabel=view==="month"?`${year}年${month}月`:view==="year"?`${year}年`:"全期間";
    ctx.fillStyle=G.ink; ctx.font="bold 24px 'Outfit',sans-serif";
    ctx.fillText("Contents Progress", 40, 52);
    ctx.fillStyle=G.greyMid; ctx.font="14px sans-serif";
    ctx.fillText(periodLabel+" 振り返り", 40, 76);
 
    // Summary pills
    [{label:"完了",val:stats.periodItems.length},{label:"活動日",val:`${stats.activeDayCount}日`},{label:"記録",val:`${stats.totalActions}回`}]
      .forEach(({label,val},i)=>{
        const x=40+i*175;
        ctx.fillStyle="#F5F5F5"; rr(x,92,160,52,10);
        ctx.fillStyle=G.greyMid; ctx.font="10px sans-serif"; ctx.fillText(label,x+10,112);
        ctx.fillStyle=G.ink; ctx.font="bold 18px sans-serif"; ctx.fillText(String(val),x+10,132);
      });
 
    // MVP
    if(stats.mvpCount>0){
      const mc=CATS[stats.mvpKey];
      ctx.fillStyle=mc.color+"33"; rr(30,158,W-60,52,12);
      ctx.fillStyle=mc.color; ctx.font="bold 11px sans-serif"; ctx.fillText("MVP ジャンル",50,178);
      ctx.fillStyle=G.ink; ctx.font="bold 18px sans-serif";
      ctx.fillText(`${mc.label}  ×${stats.mvpCount}作品`,50,200);
    }
 
    // Category bar chart
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
 
    // Completed items list
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
    if(stats.periodItems.length>SHOW){
      ctx.fillStyle=G.greyMid; ctx.font="11px sans-serif";
      ctx.fillText(`… 他${stats.periodItems.length-SHOW}件`,40,listY+14+SHOW*24+14);
    }
 
    // Footer
    ctx.fillStyle="#F5F5F5"; rr(30,H-48,W-60,34,10);
    ctx.fillStyle=G.greyMid; ctx.font="11px sans-serif";
    ctx.fillText(`Contents Progress — ${new Date().toLocaleDateString("ja-JP")}`,50,H-26);
 
    const url=c.toDataURL("image/png");
    const a=document.createElement("a"); a.href=url;
    a.download=`cp-report-${periodLabel.replace(/[年月]/g,"")}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setExportDone(true); setTimeout(()=>setExportDone(false),2500);
  };
 
  const periodLabel = view==="month"?`${year}年${month}月`:view==="year"?`${year}年`:"全期間";
  const months = Array.from({length:12},(_,i)=>i+1);
  const years  = Array.from({length:5},(_,i)=>now.getFullYear()-i);
 
  // Section card style (white theme)
  const SC = { background:G.surfaceAlt, borderRadius:14, padding:"14px 16px", marginBottom:12 };
  const SH = { fontSize:10, fontWeight:700, color:G.greyMid, letterSpacing:"0.09em", textTransform:"uppercase", marginBottom:10 };
 
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(34,34,34,0.35)",zIndex:920,display:"flex",alignItems:"flex-end",backdropFilter:"blur(3px)" }}>
      <div style={{ background:G.surface,borderRadius:"24px 24px 0 0",width:"100%",padding:"26px 20px 52px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 -10px 50px rgba(0,0,0,0.15)" }}>
 
        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <span style={{ fontSize:16,fontWeight:800,color:G.greyDeep,display:"flex",alignItems:"center",gap:8,fontFamily:F }}>
            <ICONS.report/> 振り返りレポート
          </span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:G.greyMid,display:"flex",padding:4 }}><ICONS.close/></button>
        </div>
 
        {/* Period selector */}
        <div style={{ display:"flex",gap:6,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
          {["month","year","alltime"].map(v=>(
            <button key={v} onClick={()=>setView(v)}
              style={{ padding:"6px 14px",borderRadius:99,fontSize:12,fontWeight:600,border:`1.5px solid ${view===v?G.greyDeep:G.border}`,background:view===v?G.greyDeep:"transparent",color:view===v?"#fff":G.greyDark,cursor:"pointer",fontFamily:F,transition:"all .15s" }}>
              {v==="month"?"月別":v==="year"?"年別":"全期間"}
            </button>
          ))}
          {view!=="alltime"&&(
            <select value={year} onChange={e=>setYear(Number(e.target.value))}
              style={{ padding:"6px 10px",borderRadius:8,fontSize:12,background:G.surfaceAlt,border:`1.5px solid ${G.border}`,color:G.greyDeep,fontFamily:F,cursor:"pointer",outline:"none" }}>
              {years.map(y=><option key={y} value={y}>{y}年</option>)}
            </select>
          )}
          {view==="month"&&(
            <select value={month} onChange={e=>setMonth(Number(e.target.value))}
              style={{ padding:"6px 10px",borderRadius:8,fontSize:12,background:G.surfaceAlt,border:`1.5px solid ${G.border}`,color:G.greyDeep,fontFamily:F,cursor:"pointer",outline:"none" }}>
              {months.map(m=><option key={m} value={m}>{m}月</option>)}
            </select>
          )}
        </div>
 
        {/* Summary numbers */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12 }}>
          {[
            {label:"完了作品",  val:stats.periodItems.length},
            {label:"アクティブ日", val:`${stats.activeDayCount}日`},
            {label:"記録回数",  val:`${stats.totalActions}回`},
          ].map(({label,val})=>(
            <div key={label} style={{ background:G.surfaceAlt,borderRadius:11,padding:"12px 10px",textAlign:"center" }}>
              <div style={{ fontSize:10,color:G.greyMid,fontWeight:600,letterSpacing:"0.06em",marginBottom:5 }}>{label}</div>
              <div style={{ fontSize:20,fontWeight:700,color:G.ink,lineHeight:1 }}>{val}</div>
            </div>
          ))}
        </div>
 
        {/* MVP */}
        {stats.mvpCount>0 ? (
          <div style={{ ...SC, borderLeft:`4px solid ${CATS[stats.mvpKey].color}`, marginBottom:12 }}>
            <div style={{ fontSize:10,fontWeight:700,color:G.greyMid,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:6 }}>{periodLabel} MVP</div>
            <div style={{ fontSize:17,fontWeight:700,color:G.ink,display:"flex",alignItems:"center",gap:8 }}>
              <CatIco cat={stats.mvpKey} color={CATS[stats.mvpKey].color}/>
              {CATS[stats.mvpKey].label}
              <span style={{ fontSize:13,color:CATS[stats.mvpKey].color,fontWeight:600 }}>×{stats.mvpCount}作品</span>
            </div>
            {stats.trendMsg&&<div style={{ fontSize:12,color:G.greyMid,marginTop:4 }}>{stats.trendMsg}</div>}
          </div>
        ) : (
          <div style={{ ...SC, color:G.greyMid, fontSize:13 }}>{periodLabel}の完了記録がありません</div>
        )}
 
        {/* Category breakdown */}
        <div style={SC}>
          <div style={SH}>カテゴリ別 完了数</div>
          {CAT_KEYS.filter(k=>stats.catCounts[k]>0).length===0
            ? <div style={{ fontSize:12,color:G.greyMid }}>記録なし</div>
            : CAT_KEYS.map(k=>{
              const cnt=stats.catCounts[k]; if(!cnt) return null;
              const max=Math.max(...Object.values(stats.catCounts),1);
              return (
                <div key={k} style={{ marginBottom:8,display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:11,color:G.greyMid,width:62,flexShrink:0,textAlign:"right" }}>{CATS[k].label}</span>
                  <div style={{ flex:1,background:G.border,borderRadius:99,height:8,overflow:"hidden" }}>
                    <div style={{ width:`${cnt/max*100}%`,height:"100%",background:CATS[k].color,borderRadius:99,transition:"width .4s" }}/>
                  </div>
                  <span style={{ fontSize:12,fontWeight:700,color:G.ink,width:20,textAlign:"right" }}>{cnt}</span>
                </div>
              );
            })
          }
        </div>
 
        {/* Completed items list */}
        <div style={SC}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <div style={SH}>完了コンテンツ一覧</div>
            <span style={{ fontSize:11,color:G.greyMid,fontWeight:600 }}>{stats.periodItems.length}件</span>
          </div>
          {stats.periodItems.length===0 ? (
            <div style={{ fontSize:12,color:G.greyMid }}>完了したコンテンツがありません</div>
          ) : (
            <>
              {(showAllItems ? stats.periodItems : stats.periodItems.slice(0,ITEM_PREVIEW)).map(it=>(
                <div key={it.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${G.border}` }}>
                  <CatIco cat={it.category} color={CATS[it.category].color}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:G.greyDeep,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{it.title}</div>
                    <div style={{ fontSize:10,color:G.greyMid,marginTop:2 }}>{CATS[it.category].label}</div>
                  </div>
                  {it.completedAt&&<div style={{ fontSize:10,color:G.greyMid,flexShrink:0 }}>{it.completedAt}</div>}
                </div>
              ))}
              {stats.periodItems.length > ITEM_PREVIEW && (
                <button onClick={()=>setShowAllItems(s=>!s)}
                  style={{ width:"100%",marginTop:8,padding:"7px",background:"none",border:`1px solid ${G.border}`,borderRadius:8,fontSize:12,color:G.greyMid,cursor:"pointer",fontFamily:F,fontWeight:600 }}>
                  {showAllItems ? "折りたたむ ↑" : `残り${stats.periodItems.length-ITEM_PREVIEW}件を表示 ↓`}
                </button>
              )}
            </>
          )}
        </div>
 
        {/* Avg days */}
        <div style={{ ...SC, marginBottom:16 }}>
          <div style={SH}>完了までの平均日数（全期間）</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
            {CAT_KEYS.filter(k=>stats.avgDays[k]!==null).map(k=>(
              <div key={k} style={{ background:G.surface,border:`1.5px solid ${G.border}`,borderRadius:10,padding:"10px" }}>
                <div style={{ fontSize:9,color:CATS[k].color,fontWeight:700,letterSpacing:"0.06em",marginBottom:4 }}>{CATS[k].label}</div>
                <div style={{ fontSize:18,fontWeight:700,color:G.ink,lineHeight:1 }}>{stats.avgDays[k]}<span style={{ fontSize:11,fontWeight:400,color:G.greyMid }}>日</span></div>
              </div>
            ))}
            {CAT_KEYS.filter(k=>stats.avgDays[k]!==null).length===0&&(
              <div style={{ gridColumn:"1/-1",fontSize:12,color:G.greyMid }}>開始日・完了日が記録されたコンテンツがありません</div>
            )}
          </div>
        </div>
 
        {/* Export button */}
        <button onClick={exportImage}
          style={{ ...sBt(exportDone?G.greyDeep:G.greyDeep,"#fff"),width:"100%",justifyContent:"center",padding:"13px",fontSize:13,opacity:exportDone?0.7:1 }}>
          <ICONS.dl/> {exportDone?"ダウンロードしました ✓":"画像としてエクスポート (.png)"}
        </button>
 
      </div>
    </div>
  );
}
 
 
 
export default function App() {
  const [items,setItems]             = useState(DEFAULTS);
  const [watchQueue,setWatchQueue]   = useState([]);
  const [activityLog,setActivityLog] = useState({});
  const [loaded, setLoaded]          = useState(false);
  const [nvChooseOpen,setNvChooseOpen] = useState(false);
 
  // ── Load from window.storage on mount ──────────────────────────────────
  useEffect(() => {
    (async () => {
      const savedItems = await wsGet(LS_ITEMS, null);
      if (savedItems && Array.isArray(savedItems) && savedItems.length > 0) setItems(savedItems);
      const savedWQ = await wsGet(LS_WQ, null);
      if (Array.isArray(savedWQ)) setWatchQueue(savedWQ);
      const savedDates = await wsGet(LS_DATES, null);
      if (savedDates && typeof savedDates === "object") setActivityLog(savedDates);
      setLoaded(true);
    })();
  }, []);
 
  // ── Persist on change (after initial load) ─────────────────────────────
  useEffect(() => { if (loaded) wsSet(LS_ITEMS, items); }, [items, loaded]);
  useEffect(() => { if (loaded) wsSet(LS_WQ, watchQueue); }, [watchQueue, loaded]);
  useEffect(() => { if (loaded) wsSet(LS_DATES, activityLog); }, [activityLog, loaded]);
 
  const logActivity = useCallback((date, category) => {
    setActivityLog(prev => {
      const day = prev[date] && typeof prev[date] === "object" ? prev[date] : {};
      return { ...prev, [date]: { ...day, [category]: (day[category]||0) + 1 } };
    });
  }, []);
 
  const [tab,setTab]         = useState(0);
  const [filter,setFilter]   = useState(ALL);
  const [search,setSearch]   = useState("");
  const [sortQueue,setSortQueue] = useState("manual");   // sort key for「これから」
  const [sortDone,setSortDone]   = useState("completedDesc"); // sort key for「完了」
  const [editItem,setEdit]     = useState(null);
  const [addOpen,setAddOpen]   = useState(false);
  const [showHeat,setHeat]     = useState(false);
  const [nvOpen,setNvOpen]     = useState(false);
  const [dataOpen,setData]     = useState(false);
  const [reportOpen,setReport] = useState(false);
  const [showConfetti,setConfetti] = useState(false);
 
  const update   = useCallback((id,patch)=>setItems(p=>p.map(it=>it.id===id?{...it,...patch}:it)),[]);
  const saveEdit  = useCallback((u)=>{setItems(p=>p.map(it=>it.id===u.id?u:it));setEdit(null);},[]);
  const deleteItem = useCallback((id)=>{setItems(p=>p.filter(it=>it.id!==id));setEdit(null);},[]);
  // statusChange: called from ItemCard quickAdd when status becomes active without going through move()
  const statusChange = useCallback((id, st) => {
    if (st === "active") {
      setWatchQueue(prev => {
        const idx = prev.indexOf(id);
        if (idx === -1) return prev;
        const next = prev.filter(x => x !== id);
        if (idx === 0 && next.length === 0) setTimeout(() => setNvChooseOpen(true), 50);
        return next;
      });
    }
  }, []);
  const move = useCallback((id, st) => {
    setItems(p => p.map(it => it.id===id ? {...it, status:st, completedAt:st==="done"?today():null, current:st==="done"?it.total:it.current} : it));
    if (st === "done") {
      setConfetti(true);
    }
    if (st === "active") {
      setWatchQueue(prev => {
        const idx = prev.indexOf(id);
        if (idx === -1) return prev;
        const next = prev.filter(x => x !== id);
        if (idx === 0 && next.length === 0) {
          setTimeout(() => setNvChooseOpen(true), 50);
        }
        return next;
      });
    }
  }, []);
  const addItem  = useCallback((item)=>setItems(p=>[...p,item]),[]);
  const importIt = useCallback((ni)=>{ setItems(ni); setData(false); },[]);
  const mergeIt  = useCallback((ni)=>{
    setItems(prev => {
      const existingIds = new Set(prev.map(i => i.id));
      const toAdd = ni.filter(i => !existingIds.has(i.id));
      return [...prev, ...toAdd];
    });
    setData(false);
  },[]);
  const reorder  = useCallback((listItems,idx,dir)=>{
    const si=idx+dir; if(si<0||si>=listItems.length)return;
    const arr=[...listItems]; [arr[idx],arr[si]]=[arr[si],arr[idx]];
    setItems(prev=>{const ids=arr.map(i=>i.id);return prev.map(it=>{const qi=ids.indexOf(it.id);return qi>=0?{...it,priority:qi}:it;});});
  },[]);
 
  // ── Sort helpers ─────────────────────────────────────────────────
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
    { key:"completedDesc",label:"完了日（新しい順）" },
    { key:"completedAsc", label:"完了日（古い順）" },
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
 
  function applySort(list, sortKey, wqIds) {
    const arr = [...list];
    const catOrder = k => CATS[k]?.order ?? 99;
    if (sortKey === "manual") {
      // WQ items first (in WQ order), then rest by priority
      const wqSet = new Set(wqIds || []);
      const inWq  = (wqIds || []).map(id => arr.find(i => i.id === id)).filter(Boolean);
      const rest  = arr.filter(i => !wqSet.has(i.id)).sort((a,b) => a.priority - b.priority);
      return [...inWq, ...rest];
    }
    switch(sortKey) {
      case "category":      return arr.sort((a,b) => catOrder(a.category) - catOrder(b.category));
      case "updatedDesc":   return arr.sort((a,b) => (b.lastUpdated||"").localeCompare(a.lastUpdated||""));
      case "updatedAsc":    return arr.sort((a,b) => (a.lastUpdated||"").localeCompare(b.lastUpdated||""));
      case "addedDesc":     return arr.sort((a,b) => (b.addedAt||"").localeCompare(a.addedAt||""));
      case "addedAsc":      return arr.sort((a,b) => (a.addedAt||"").localeCompare(b.addedAt||""));
      case "startedDesc":   return arr.sort((a,b) => (b.startedAt||"").localeCompare(a.startedAt||""));
      case "startedAsc":    return arr.sort((a,b) => (a.startedAt||"").localeCompare(b.startedAt||""));
      case "completedDesc": return arr.sort((a,b) => (b.completedAt||"").localeCompare(a.completedAt||""));
      case "completedAsc":  return arr.sort((a,b) => (a.completedAt||"").localeCompare(b.completedAt||""));
      case "durationDesc":  return arr.sort((a,b) => {
        const dur = it => (it.startedAt && it.completedAt) ? daysBetween(it.startedAt, it.completedAt) : (it.startedAt ? daysBetween(it.startedAt, today()) : 0);
        return dur(b) - dur(a);
      });
      case "durationAsc":   return arr.sort((a,b) => {
        const dur = it => (it.startedAt && it.completedAt) ? daysBetween(it.startedAt, it.completedAt) : (it.startedAt ? daysBetween(it.startedAt, today()) : 0);
        return dur(a) - dur(b);
      });
      default: return arr;
    }
  }
 
  const active   = items.filter(i=>i.status==="active").sort((a,b)=>a.priority-b.priority);
  // wqValid computed before queue so manual sort can use it
  const wqValidIds = watchQueue.filter(id => items.find(i => i.id===id && i.status==="queue"));
  const queue    = applySort(items.filter(i=>i.status==="queue"), sortQueue, wqValidIds);
  const done     = applySort(items.filter(i=>i.status==="done"),  sortDone);
  const lists    = [active, queue, done];
  const cur      = lists[tab];
  const wqValid  = wqValidIds; // alias for rest of code
 
  const counts = Object.fromEntries(FILTER_OPTS.map(label => {
    if(label===ALL) return [label, cur.length];
    const k = BY_LABEL[label]; return [label, cur.filter(i=>i.category===k).length];
  }));
 
  // Apply category filter then search
  const catFiltered = filter===ALL ? cur : cur.filter(i => CATS[i.category]?.label===filter);
  const filtered    = search.trim()
    ? catFiltered.filter(i => i.title.toLowerCase().includes(search.trim().toLowerCase()))
    : catFiltered;
 
  const switchTab = (i) => { setTab(i); setFilter(ALL); setSearch(""); };
 
  if (!loaded) {
    return (
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:G.surfaceAlt,fontFamily:F,color:G.greyMid,fontSize:13,gap:8 }}>
        データを読み込み中…
      </div>
    );
  }
 
  return (
    <React.Fragment>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        body { margin:0; background:${G.surfaceAlt}; font-family:'Outfit','Inter','system-ui','-apple-system','Hiragino Sans','Noto Sans JP',sans-serif; letter-spacing:0.07em; }
        ::-webkit-scrollbar { display:none; }
        @keyframes fadeUp { from{opacity:0;transform:translate(-50%,10px);}to{opacity:1;transform:translate(-50%,0);} }
      `}</style>
      <div style={{ minHeight:"100vh",background:G.surfaceAlt,fontFamily:F,maxWidth:480,margin:"0 auto" }}>
 
        {/* ── Header ── */}
        <div style={{ background:G.surface,borderBottom:`1.5px solid ${G.border}`,position:"sticky",top:0,zIndex:100 }}>
          {/* top bar — same horizontal padding as the card list (14px) */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 14px 0" }}>
            {/* Left: 2-line title */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:15, fontWeight:600, color:G.ink, letterSpacing:"0.05em", lineHeight:1.25, whiteSpace:"nowrap" }}>
                Contents Progress
              </div>
              <div style={{ fontSize:10, color:G.greyMid, fontWeight:500, marginTop:3, whiteSpace:"nowrap" }}>
                進行中 {active.length} · 待機 {queue.length} · 完了 {done.length}
              </div>
            </div>
            {/* Right: 3 icon buttons + 追加 */}
            <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
              <button onClick={()=>setReport(true)} title="振り返りレポート"
                style={{ background:"none", border:`1.5px solid ${G.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:G.greyMid, flexShrink:0 }}>
                <ICONS.report/>
              </button>
              <button onClick={()=>setData(true)} title="データ管理 (エクスポート/インポート)"
                style={{ background:"none", border:`1.5px solid ${G.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:G.greyMid, flexShrink:0 }}>
                <ICONS.dl/>
              </button>
              <button onClick={()=>setHeat(s=>!s)} title="アクティビティログ"
                style={{ background:showHeat?G.surfaceAlt:"none", border:`1.5px solid ${showHeat?G.greyMid:G.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:showHeat?G.greyDeep:G.greyMid, flexShrink:0 }}>
                <ICONS.chart/>
              </button>
              <button onClick={()=>setAddOpen(true)}
                style={{ ...sBt(G.greyDeep), padding:"8px 13px", fontSize:12, flexShrink:0 }}>
                <ICONS.plus/> 追加
              </button>
            </div>
          </div>
 
          {showHeat&&<div style={{ padding:"12px 14px 0" }}><DotMatrix activityLog={activityLog}/></div>}
 
          <div style={{ display:"flex", padding:"0 14px" }}>
            {TABS.map((t,i)=>(
              <button key={t} onClick={()=>switchTab(i)}
                style={{ flex:1,background:"none",border:"none",borderBottom:`2.5px solid ${tab===i?G.greyDeep:"transparent"}`,color:tab===i?G.greyDeep:G.greyMid,fontWeight:tab===i?800:500,fontSize:13,padding:"10px 4px",cursor:"pointer",transition:"all .15s",fontFamily:F }}>
                {t} <span style={{ fontSize:11,opacity:.65 }}>({lists[i].length})</span>
              </button>
            ))}
          </div>
        </div>
 
        {/* ── Filter + Search + Sort ── */}
        <div style={{ background:G.surface, borderBottom:`1.5px solid ${G.border}`, padding:"10px 14px 11px", position:"sticky", top:84, zIndex:99 }}>
          <FilterBar active={filter} onChange={setFilter} counts={counts}/>
 
          {/* Search bar */}
          <div style={{ position:"relative", marginTop:9 }}>
            <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:G.greyMid, display:"flex", pointerEvents:"none" }}>
              <ICONS.search/>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="タイトルで検索…"
              style={{ ...INP, paddingLeft:34, paddingTop:8, paddingBottom:8, fontSize:13, background:G.surfaceAlt }}
            />
            {search && (
              <button onClick={()=>setSearch("")}
                style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:G.greyMid, display:"flex", padding:2 }}>
                <ICONS.xcircle/>
              </button>
            )}
          </div>
 
          {/* Sort selector — only for「これから」(tab=1) and「完了」(tab=2) */}
          {(tab===1||tab===2) && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:9 }}>
              <span style={{ color:G.greyMid, display:"flex", flexShrink:0 }}><ICONS.sort/></span>
              <select
                value={tab===1 ? sortQueue : sortDone}
                onChange={e => tab===1 ? setSortQueue(e.target.value) : setSortDone(e.target.value)}
                style={{ flex:1, fontSize:12, color:G.greyDark, background:G.surfaceAlt, border:`1.5px solid ${G.border}`, borderRadius:8, padding:"7px 10px", fontFamily:F, letterSpacing:"0.04em", outline:"none", cursor:"pointer" }}>
                {(tab===1 ? SORT_OPTS_QUEUE : SORT_OPTS_DONE).map(o => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
 
          {tab===1 && queue.length>0 && (
            <button onClick={()=>setNvOpen(true)} style={{ ...oBt(G.grey,G.greyDark), marginTop:9, fontSize:11, padding:"7px 12px", width:"100%", justifyContent:"center" }}>
              <ICONS.pin/> Watch Queue を設定する（{wqValid.length}/5）
            </button>
          )}
        </div>
 
        {/* ── List ── */}
        <div style={{ padding:"14px 14px 104px" }}>
          {filtered.length===0 && (
            <div style={{ textAlign:"center", padding:"68px 20px" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:16, opacity:.35, color:G.greyMid }}>
                {tab===0 ? <ICONS.play/> : tab===1 ? <ICONS.dn/> : <ICONS.check/>}
              </div>
              <div style={{ fontSize:14, lineHeight:1.7, color:G.greyMid }}>
                {search.trim()
                  ? `「${search}」に一致するコンテンツがありません`
                  : filter!==ALL
                    ? `「${filter}」の${TABS[tab]}コンテンツはありません`
                    : tab===0 ? "進行中のコンテンツがありません"
                    : tab===1 ? "「追加」でコンテンツを登録しましょう"
                    : "完了したコンテンツがありません"}
              </div>
            </div>
          )}
          {filtered.map(item => {
            const showArrows = tab===0 || (tab===1 && sortQueue==="manual");
            const lst = tab===0 ? active : queue;
            const idx = showArrows ? lst.indexOf(item) : -1;
            return (
              <div key={item.id}>
                {showArrows && <Arrows list={lst} idx={idx} onReorder={(i,d)=>reorder(lst,i,d)}/>}
                <ItemCard item={item} onUpdate={update} onEdit={setEdit} onMove={move} nvIndex={tab===1 ? wqValid.indexOf(item.id) : -1} onActivityLog={logActivity} onStatusChange={statusChange}/>
              </div>
            );
          })}
          {tab===2 && done.length>0 && (
            <div style={{ textAlign:"center", padding:"10px", fontSize:12, color:dk(P.green), fontWeight:700, letterSpacing:"0.04em", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <ICONS.star/> {done.length}作品を完走しました
            </div>
          )}
        </div>
 
        {editItem && <EditModal item={editItem} onClose={()=>setEdit(null)} onSave={saveEdit} onDelete={deleteItem}/>}
        {addOpen  && <AddModal  onClose={()=>setAddOpen(false)} onAdd={addItem}/>}
        {nvOpen && <WatchQueuePicker queueItems={queue} watchQueue={wqValid} onSave={(wq)=>{setWatchQueue(wq);}} onClose={()=>setNvOpen(false)}/>}
        {nvChooseOpen && <NVChoosePrompt queueItems={queue.filter(i=>!wqValid.includes(i.id))} onSelect={(id)=>{setWatchQueue(prev=>[id,...prev.filter(x=>x!==id)]);setNvChooseOpen(false);}} onDismiss={()=>setNvChooseOpen(false)}/>}
        {dataOpen && <DataModal items={items} onImport={importIt} onMerge={mergeIt} onClose={()=>setData(false)}/>}
        {reportOpen && <ReportModal items={items} activityLog={activityLog} onClose={()=>setReport(false)}/>}
        {showConfetti && <Confetti onDone={()=>setConfetti(false)}/>}
      </div>
    </React.Fragment>
  );
}