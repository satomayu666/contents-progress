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

// ─── Persistent storage ────────────────────────────────────────────────────────
// Primary: localStorage (works in browser / GitHub Pages)
// Fallback: window.storage (Claude Artifact environment)
async function wsGet(key, fallback) {
  // 1) localStorage (browser / URL版)
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw);
  } catch {}
  // 2) window.storage (Claude Artifact)
  try {
    if (window.storage) {
      const res = await window.storage.get(key);
      if (res && res.value != null) return JSON.parse(res.value);
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

// ─── Level / EXP System ──────────────────────────────────────────────────────

const MAX_LEVEL = 100;

const TITLES = [
  { level:1,   name:"はじめた人" },
  { level:5,   name:"コツコツ勢" },
  { level:10,  name:"習慣ビギナー" },
  { level:25,  name:"継続の民" },
  { level:50,  name:"習慣マスター" },
  { level:75,  name:"コンテンツ探求者" },
  { level:100, name:"コンテンツの神" },
];

const BADGES = [
  { id:"lv1",   name:"はじまりの一歩", description:"Lv.1 に到達した",  unlockLevel:1,   icon:"🌱" },
  { id:"lv5",   name:"コツコツバッジ", description:"Lv.5 に到達した",  unlockLevel:5,   icon:"📚" },
  { id:"lv10",  name:"習慣の芽",       description:"Lv.10 に到達した", unlockLevel:10,  icon:"🌿" },
  { id:"lv25",  name:"継続の証",       description:"Lv.25 に到達した", unlockLevel:25,  icon:"🔥" },
  { id:"lv50",  name:"習慣マスター章", description:"Lv.50 に到達した", unlockLevel:50,  icon:"⭐" },
  { id:"lv75",  name:"探求者の紋章",   description:"Lv.75 に到達した", unlockLevel:75,  icon:"🔭" },
  { id:"lv100", name:"神の称号",       description:"Lv.100 に到達した",unlockLevel:100, icon:"👑" },
];

const STREAK_BONUSES = [
  { days:3,  exp:20  },
  { days:7,  exp:50  },
  { days:14, exp:100 },
  { days:30, exp:200 },
];

const EXP_REWARDS = {
  ACTION:           10,
  COMPLETE:        100,
  FOCUS_START:       5,
  LIGHT_REFLECTION:  5,
};

const LS_PROGRESS = "cp_user_progress_v1";

function getRequiredExp(level) {
  return Math.floor(50 * Math.pow(level, 1.5));
}

function calculateLevel(totalExp) {
  let level = 1, remaining = totalExp;
  while (level < MAX_LEVEL) {
    const needed = getRequiredExp(level);
    if (remaining >= needed) { remaining -= needed; level++; }
    else break;
  }
  return { level, currentExp: remaining };
}

function getCurrentTitle(level) {
  const reached = TITLES.filter(t => level >= t.level);
  return reached.length ? reached[reached.length - 1].name : TITLES[0].name;
}

function getUnlockedBadges(level) {
  return BADGES.filter(b => b.unlockLevel <= level);
}

function addExpPure(user, amount) {
  const prevLevel  = user.level;
  const newTotalExp = user.totalExp + amount;
  const { level: newLevel, currentExp: newCurrentExp } = calculateLevel(newTotalExp);
  const leveledUp   = newLevel > prevLevel;
  const levelsGained = newLevel - prevLevel;
  const newBadges = leveledUp
    ? BADGES.filter(b => b.unlockLevel > prevLevel && b.unlockLevel <= newLevel && !user.obtainedBadges.includes(b.id))
    : [];
  const newTitleUnlocked = leveledUp
    ? (() => { const ts = TITLES.filter(t => t.level > prevLevel && t.level <= newLevel); return ts.length ? ts[ts.length-1].name : null; })()
    : null;
  const newProgress = {
    ...user, level:newLevel, currentExp:newCurrentExp, totalExp:newTotalExp,
    obtainedBadges: [...user.obtainedBadges, ...newBadges.map(b=>b.id)],
  };
  return { newProgress, leveledUp, levelsGained, newBadges, newTitle:newTitleUnlocked };
}

function updateStreakPure(user, todayDate) {
  const last = user.lastActiveDate;
  if (last === todayDate) return user;
  let newStreak = 1;
  if (last) {
    const diffDays = Math.round((new Date(todayDate) - new Date(last)) / 86_400_000);
    newStreak = diffDays === 1 ? user.streakDays + 1 : 1;
  }
  let updated = { ...user, streakDays:newStreak, lastActiveDate:todayDate };
  for (const bonus of STREAK_BONUSES) {
    if (newStreak === bonus.days) {
      updated = addExpPure(updated, bonus.exp).newProgress;
      break;
    }
  }
  return updated;
}

function createInitialProgress() {
  return { level:1, currentExp:0, totalExp:0, streakDays:0, lastActiveDate:"", obtainedBadges:["lv1"] };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(LS_PROGRESS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return createInitialProgress();
}

function saveProgress(p) {
  try { localStorage.setItem(LS_PROGRESS, JSON.stringify(p)); } catch {}
}

// ─── End Level System ─────────────────────────────────────────────────────────

const CATS = {
  article: { label:"Web",    unit:"件",  color:"#9EA89A", order:0 },
  live:    { label:"Live",   unit:"曲",  color:"#BDAF98", order:1 },
  youtube: { label:"YouTube",unit:"本",  color:"#B8A99C", order:2 },
  radio:   { label:"Radio",  unit:"本",  color:"#A0AAAA", order:3 },
  tv:      { label:"TV",     unit:"本",  color:"#A8A29F", order:4 },
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
      genres:            f.genres||[],
      genreOther:        f.genreOther||"",
      mangaUnit:         f.category==="manga" ? (f.mangaUnit||"巻") : f.mangaUnit,
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
            <FF label="動画の長さ (分)"><input type="number" style={INP} placeholder="例: 15" value={f.videoDurationMin||""} onChange={e=>set("videoDurationMin",e.target.value)}/></FF>
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
function AddModal({ onClose, onAdd, inlineMode = false, defaultCategory = "anime" }) {
  const [f,setF] = useState({ title:"",category:defaultCategory,total:"",episodeMin:"",totalDurationMin:"",videoDurationMin:"",videoUrl:"",articleUrl:"",contentUrl:"",station:"",tvStation:"",tvViewMethod:[],tvViewOther:"",airDate:"",streamingServices:[],streamingOther:"",readingMethod:[],readingSubOther:"",readingOther:"",startedAt:"",notes:"",genres:[],genreOther:"",mangaUnit:"巻" });
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
    const noProgress = ["youtube","tv","radio","live","article","movie"].includes(f.category);
    const totalVal = f.category==="movie" ? (Number(f.episodeMin)||1) : noProgress ? 1 : Number(f.total)||1;
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
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
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

  const qa = (item.category==="anime"||item.category==="drama")?1:item.category==="book"?10:item.category==="manga"?1:item.category==="movie"?10:1;
  const ql = (item.category==="anime"||item.category==="drama")?"+1話":item.category==="book"?"+10P":item.category==="manga"?`+1${effectiveUnit}`:item.category==="movie"?"+10分":item.category==="live"?"+1曲":item.category==="youtube"||item.category==="tv"||item.category==="radio"?"視聴済み":"読了";

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
    onActivityLog(today(), item.category);
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
    // ③ 残り全量をその瞬間に終えたとみなす
    const logCount = isBinary ? 1 : Math.max(rem, 1);
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
                item.status==="done" ? <><ICONS.check/> 視聴済み</> : "未視聴"
              )}
            </span>
            {item.category==="article"&&item.episodeMin&&item.articleUrl&&<span>約{item.episodeMin}分で読了</span>}
            {isTV&&item.totalDurationMin&&<span>約{fmtGap(item.totalDurationMin)}</span>}
            {isRadio&&item.totalDurationMin&&<span>約{fmtGap(item.totalDurationMin)}</span>}
          </div>
        ) : (
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:13 }}>
            <span style={{ fontWeight:700,color:G.greyDeep }}>{item.current} / {item.total} {effectiveUnit}</span>
            <span style={{ fontWeight:800,color:p===100?dk(P.green):dk(c.color) }}>{p}%</span>
          </div>
        )}
        {/* ProgressBar: live uses status-based value (0/50/100) */}
        <ProgressBar
          value={item.category==="live" ? (item.status==="done"?100:item.status==="active"?50:0) : p}
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
        {/* Primary quick-add — hidden for live and binary-done categories */}
        {item.status!=="done" && item.category!=="live" && (
          <button onClick={()=>quickAdd(qa)} style={sBt(c.color)}>{ql}</button>
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

      <div style={{ display:"flex",gap:10,marginTop:8,fontSize:9,color:G.borderMid,flexWrap:"wrap",lineHeight:1.5 }}>
        <span>追加: {item.addedAt}</span>
        {item.lastUpdated&&<span>更新: {item.lastUpdated}</span>}
        {item.completedAt&&<span>完了: {item.completedAt}</span>}
      </div>
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────────────────
function ReportModal({ items, activityLog, onClose, inlineMode = false }) {
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
          {[["period","期間で振り返る"],["content","コンテンツ別"]].map(([mode,label])=>(
            <button key={mode} onClick={()=>{ setReportMode(mode); setSelectedItemId(null); }}
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

        {/* ── PERIOD VIEW ── */}
        {reportMode==="period" && <>
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
                <div style={{ fontSize:20,fontWeight:400,color:G.ink,lineHeight:1 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* MVP */}
          {stats.mvpCount>0 ? (
            <div style={{ ...SC, borderLeft:`4px solid ${CATS[stats.mvpKey].color}`, marginBottom:12 }}>
              <div style={{ fontSize:10,fontWeight:700,color:G.greyMid,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:8 }}>{periodLabel} MVP</div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                {/* ③ カテゴリ色背景・枠線なし */}
                <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:CATS[stats.mvpKey].color,borderRadius:6,padding:"4px 10px" }}>
                  <CatIco cat={stats.mvpKey} color="#fff"/>
                  <span style={{ fontSize:12,fontWeight:700,color:"#fff",letterSpacing:"0.03em" }}>{CATS[stats.mvpKey].label}</span>
                </span>
                <span style={{ fontSize:13,color:G.greyDark,fontWeight:500 }}>×{stats.mvpCount}作品</span>
              </div>
              {stats.trendMsg&&<div style={{ fontSize:12,color:G.greyMid,marginTop:6 }}>{stats.trendMsg}</div>}
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
                <div key={k} style={{ background:G.surfaceAlt,borderRadius:10,padding:"10px" }}>
                  {/* ③ カテゴリ色背景・枠線なし */}
                  <div style={{ display:"inline-block",background:CATS[k].color,borderRadius:5,padding:"2px 8px",fontSize:9,fontWeight:700,color:"#fff",letterSpacing:"0.06em",marginBottom:6 }}>{CATS[k].label}</div>
                  <div style={{ fontSize:18,fontWeight:400,color:G.ink,lineHeight:1 }}>{stats.avgDays[k]}<span style={{ fontSize:11,fontWeight:400,color:G.greyMid }}>日</span></div>
                </div>
              ))}
              {CAT_KEYS.filter(k=>stats.avgDays[k]!==null).length===0&&(
                <div style={{ gridColumn:"1/-1",fontSize:12,color:G.greyMid }}>開始日・完了日が記録されたコンテンツがありません</div>
              )}
            </div>
          </div>

          <button onClick={exportImage}
            style={{ ...sBt(exportDone?G.greyDeep:G.greyDeep,"#fff"),width:"100%",justifyContent:"center",padding:"13px",fontSize:13,opacity:exportDone?0.7:1 }}>
            <ICONS.dl/> {exportDone?"ダウンロードしました ✓":"画像としてエクスポート (.png)"}
          </button>
        </>}

        {/* ── CONTENT VIEW ── */}
        {reportMode==="content" && <>
          {!selectedItem ? (
            <>
              <div style={{ fontSize:12,color:G.greyMid,marginBottom:14,lineHeight:1.6 }}>
                コンテンツを選択すると、いつどれだけ進めたかを確認できます。
              </div>
              {itemsWithHistory.length===0 && (
                <div style={{ ...SC, color:G.greyMid, fontSize:13 }}>記録があるコンテンツがありません。<br/>+1話などのボタンで進捗を記録すると履歴が表示されます。</div>
              )}
              {/* Group by status */}
              {["active","queue","done"].map(st => {
                const group = itemsWithHistory.filter(i=>i.status===st);
                if (!group.length) return null;
                const stLabel = st==="active"?"進行中":st==="queue"?"これから":"完了";
                return (
                  <div key={st} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10,fontWeight:700,color:G.greyMid,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:8 }}>{stLabel}</div>
                    {group.map(it => {
                      const cat = CATS[it.category];
                      const hist = it.progressHistory||[];
                      return (
                        <button key={it.id} onClick={()=>setSelectedItemId(it.id)}
                          style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 12px",marginBottom:6,borderRadius:11,border:`1.5px solid ${G.border}`,background:G.surfaceAlt,cursor:"pointer",textAlign:"left",fontFamily:F,transition:"background .15s" }}>
                          <CatIco cat={it.category} color={dk(cat.color)}/>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:13,fontWeight:700,color:G.greyDeep,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{it.title}</div>
                            <div style={{ fontSize:10,color:G.greyMid,marginTop:2 }}>
                              {hist.length>0 ? `${hist.length}回記録` : "記録なし"}
                              {it.completedAt ? ` · 完了: ${it.completedAt}` : ""}
                            </div>
                          </div>
                          <span style={{ fontSize:11,color:G.greyMid }}>›</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {/* Back button */}
              <button onClick={()=>setSelectedItemId(null)}
                style={{ display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",color:G.greyDark,fontSize:12,fontWeight:700,fontFamily:F,marginBottom:14,padding:0 }}>
                ‹ 戻る
              </button>

              {/* Item header */}
              <div style={{ ...SC, borderLeft:`4px solid ${CATS[selectedItem.category].color}` }}>
                <div style={{ marginBottom:8 }}>
                  {/* ③ カテゴリ色背景・枠線なし */}
                  <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:CATS[selectedItem.category].color,borderRadius:6,padding:"4px 10px" }}>
                    <CatIco cat={selectedItem.category} color="#fff"/>
                    <span style={{ fontSize:11,fontWeight:700,color:"#fff",letterSpacing:"0.03em" }}>{CATS[selectedItem.category].label}</span>
                  </span>
                </div>
                <div style={{ fontSize:15,fontWeight:800,color:G.greyDeep,lineHeight:1.3 }}>{selectedItem.title}</div>
                <div style={{ display:"flex",gap:12,marginTop:8,fontSize:11,color:G.greyMid,flexWrap:"wrap" }}>
                  <span>進捗: {selectedItem.current}/{selectedItem.total} {CATS[selectedItem.category].unit}</span>
                  {selectedItem.startedAt&&<span>開始: {selectedItem.startedAt}</span>}
                  {selectedItem.completedAt&&<span>完了: {selectedItem.completedAt}</span>}
                </div>
              </div>

              {/* Progress history timeline */}
              <div style={SC}>
                <div style={SH}>記録履歴</div>
                {(selectedItem.progressHistory||[]).length===0 ? (
                  <div style={{ fontSize:12,color:G.greyMid }}>
                    記録がありません。<br/>
                    <span style={{ fontSize:11,color:G.borderMid }}>+1話などのクイックボタン、または「過去の記録」ボタンで進捗を記録すると、ここに表示されます。</span>
                  </div>
                ) : (
                  // Sort history by date desc
                  [...(selectedItem.progressHistory||[])].sort((a,b)=>b.date.localeCompare(a.date)).map((h,i,arr)=>{
                    const cat = CATS[selectedItem.category];
                    const isLast = i===arr.length-1;
                    return (
                      <div key={i} style={{ display:"flex",gap:10,paddingBottom:isLast?0:12,marginBottom:isLast?0:12,borderBottom:isLast?"none":`1px solid ${G.border}` }}>
                        {/* Timeline dot */}
                        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,width:14 }}>
                          <div style={{ width:10,height:10,borderRadius:"50%",background:cat.color,flexShrink:0,marginTop:2 }}/>
                          {!isLast&&<div style={{ width:1,flex:1,background:G.border,marginTop:4 }}/>}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
                            <div style={{ fontSize:13,fontWeight:700,color:G.greyDeep }}>
                              +{h.delta} {cat.unit}
                            </div>
                            <div style={{ fontSize:10,color:G.greyMid }}>{h.date}</div>
                          </div>
                          <div style={{ fontSize:11,color:G.greyMid,marginTop:2 }}>
                            {h.from}{cat.unit} → {h.to}{cat.unit}
                            {selectedItem.total > 0 && <span style={{ marginLeft:6,color:G.borderMid }}>({Math.round(h.to/selectedItem.total*100)}%)</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mini activity calendar for this item */}
              {(selectedItem.progressHistory||[]).length > 0 && (() => {
                const dates = (selectedItem.progressHistory||[]).map(h=>h.date);
                const uniqueDates = [...new Set(dates)];
                const countByDate = {};
                dates.forEach(d=>{ countByDate[d]=(countByDate[d]||0)+1; });
                return (
                  <div style={SC}>
                    <div style={SH}>記録した日（{uniqueDates.length}日）</div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                      {uniqueDates.sort().map(d=>(
                        <span key={d} style={{ fontSize:11,background:tint(CATS[selectedItem.category].color),color:dk(CATS[selectedItem.category].color),borderRadius:7,padding:"3px 9px",fontWeight:600 }}>
                          {d}
                          {countByDate[d]>1&&<span style={{ marginLeft:4,opacity:.7 }}>×{countByDate[d]}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Export: single item */}
              <button onClick={()=>exportSingleItem(selectedItem)}
                style={{ ...sBt(G.greyDeep,"#fff"),width:"100%",justifyContent:"center",padding:"13px",fontSize:13,marginTop:4 }}>
                <ICONS.dl/> このコンテンツをPNGで出力
              </button>
            </>
          )}

          {/* Export: all items with history (shown in list view) */}
          {!selectedItem && itemsWithHistory.length > 0 && (
            <button onClick={exportAllItems}
              style={{ ...sBt(G.greyDeep,"#fff"),width:"100%",justifyContent:"center",padding:"13px",fontSize:13,marginTop:8 }}>
              <ICONS.dl/> 全コンテンツまとめてPNGで出力（{itemsWithHistory.length}件）
            </button>
          )}
        </>}

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
  bg:        "#F6F6F6",
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

// ─── Shared level color helper ────────────────────────────────────────────────
function lvColor(level) {
  if (level >= 75) return "#C0B6A3";
  if (level >= 50) return "#BDB1A6";
  if (level >= 25) return "#A4ADAF";
  if (level >= 10) return "#9EA89A";
  return "#A8A29F";
}

// ─── LevelPage ────────────────────────────────────────────────────────────────
function LevelPage({ progress, onClose }) {
  const FC = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";
  const { level, currentExp, totalExp, streakDays, obtainedBadges } = progress;
  const reqExp   = level < MAX_LEVEL ? getRequiredExp(level) : 0;
  const pctBar   = level >= MAX_LEVEL ? 100 : Math.min(100, Math.round(currentExp / reqExp * 100));
  const title    = getCurrentTitle(level);
  const color    = lvColor(level);

  return (
    <div style={{ position:"fixed", inset:0, background:"#FFFFFF", zIndex:900,
      overflowY:"auto", fontFamily:FC }}>

      {/* Header */}
      <div style={{ padding:"20px 20px 14px", background:"#FFFFFF",
        borderBottom:"1px solid #F0EEEC", position:"sticky", top:0, zIndex:10,
        display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onClose}
          style={{ background:"none", border:"none", cursor:"pointer", color:"#8A8A8A",
            padding:"4px 0", display:"flex", alignItems:"center", gap:5,
            fontSize:13, fontFamily:FC, fontWeight:500, letterSpacing:"0.03em" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          戻る
        </button>
        <div style={{ fontSize:22, fontWeight:700, color:"#1A1A1A",
          letterSpacing:"0.1em", fontFamily:FC }}>Level</div>
      </div>

      <div style={{ padding:"24px 20px 100px" }}>

        {/* ── Level Card ── */}
        <div style={{ background:"#F6F6F6", borderRadius:22, padding:"28px 24px 24px",
          marginBottom:20, textAlign:"center" }}>
          <div style={{ width:80, height:80, borderRadius:"50%", margin:"0 auto 16px",
            background:color, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 16px ${color}66` }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#fff",
              letterSpacing:"0.1em", textTransform:"uppercase" }}>LV</div>
            <div style={{ fontSize:30, fontWeight:700, color:"#fff", lineHeight:1 }}>{level}</div>
          </div>
          <div style={{ fontSize:17, fontWeight:700, color:"#1A1A1A",
            letterSpacing:"0.06em", marginBottom:6 }}>{title}</div>
          <div style={{ fontSize:11, fontWeight:400, color:"#A0A0A0",
            letterSpacing:"0.04em", marginBottom:18 }}>
            累計 EXP: {totalExp.toLocaleString()}
          </div>
          {level < MAX_LEVEL ? (
            <>
              <div style={{ height:8, background:"#E8E4E0", borderRadius:99,
                overflow:"hidden", marginBottom:6 }}>
                <div style={{ height:"100%", width:`${pctBar}%`, background:color,
                  borderRadius:99, transition:"width .6s ease" }}/>
              </div>
              <div style={{ fontSize:10, color:"#A0A0A0", letterSpacing:"0.04em" }}>
                {currentExp.toLocaleString()} / {reqExp.toLocaleString()} EXP（次のレベルまで）
              </div>
            </>
          ) : (
            <div style={{ fontSize:14, fontWeight:700, color:color,
              letterSpacing:"0.06em" }}>MAX LEVEL 達成 🎉</div>
          )}
        </div>

        {/* ── Streak ── */}
        <div style={{ background:"#F6F6F6", borderRadius:18, padding:"18px 20px",
          marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:28 }}>🔥</div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"#1A1A1A",
              letterSpacing:"0.03em" }}>{streakDays}日連続ログイン</div>
            <div style={{ fontSize:11, fontWeight:400, color:"#A0A0A0",
              letterSpacing:"0.04em", marginTop:2 }}>
              3 / 7 / 14 / 30日でボーナスEXP
            </div>
          </div>
        </div>

        {/* ── EXP 獲得ルール ── */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#8A8A8A",
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>
            EXP 獲得ルール
          </div>
          <div style={{ background:"#F6F6F6", borderRadius:18, overflow:"hidden" }}>
            {[
              ["コンテンツを1アクション進めた",    "+10 EXP"],
              ["コンテンツを完了した",              "+100 EXP"],
              ["Today's Focus を開始/再開した",    "+5 EXP"],
              ["3日連続ログイン",                   "+20 EXP"],
              ["7日連続ログイン",                   "+50 EXP"],
              ["14日連続ログイン",                  "+100 EXP"],
              ["30日連続ログイン",                  "+200 EXP"],
            ].map(([label, exp], i, arr) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"11px 18px",
                borderBottom: i < arr.length-1 ? "1px solid #ECEAE7" : "none" }}>
                <span style={{ fontSize:12, fontWeight:400, color:"#3A3A3A",
                  letterSpacing:"0.03em" }}>{label}</span>
                <span style={{ fontSize:12, fontWeight:700, color,
                  letterSpacing:"0.04em", flexShrink:0, marginLeft:8 }}>{exp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 称号ロードマップ ── */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#8A8A8A",
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>
            称号
          </div>
          <div style={{ background:"#F6F6F6", borderRadius:18, overflow:"hidden" }}>
            {TITLES.map((t, i, arr) => {
              const reached = level >= t.level;
              return (
                <div key={t.level} style={{ display:"flex", alignItems:"center",
                  gap:12, padding:"12px 18px",
                  borderBottom: i < arr.length-1 ? "1px solid #ECEAE7" : "none",
                  opacity: reached ? 1 : 0.4 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
                    background: reached ? color : "#D8D4D0",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:8, fontWeight:800, color:"#fff",
                      letterSpacing:"0.04em" }}>Lv.{t.level}</span>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight: reached ? 700 : 500,
                      color: reached ? "#1A1A1A" : "#A0A0A0",
                      letterSpacing:"0.04em" }}>{t.name}</div>
                    <div style={{ fontSize:10, color:"#B0B0B0",
                      letterSpacing:"0.03em", marginTop:1 }}>
                      {reached ? "✓ 解放済み" : `Lv.${t.level} で解放`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Badge Collection ── */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#8A8A8A",
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>
            バッジコレクション ({obtainedBadges.length}/{BADGES.length})
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {BADGES.map(badge => {
              const got = obtainedBadges.includes(badge.id);
              return (
                <div key={badge.id} style={{
                  background: got ? "#F6F6F6" : "#FAFAFA",
                  borderRadius:16, padding:"16px 10px",
                  textAlign:"center",
                  border:`1.5px solid ${got ? "#E0DEDB" : "#ECEAE7"}`,
                  opacity: got ? 1 : 0.38,
                  transition:"opacity .3s",
                }}>
                  <div style={{ fontSize:28, marginBottom:6,
                    filter: got ? "none" : "grayscale(1)" }}>
                    {badge.icon}
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color:"#2A2A2A",
                    letterSpacing:"0.04em", lineHeight:1.4, marginBottom:3 }}>
                    {badge.name}
                  </div>
                  <div style={{ fontSize:9, fontWeight:400, color:"#A0A0A0",
                    letterSpacing:"0.03em", lineHeight:1.4 }}>
                    {badge.description}
                  </div>
                  {!got && (
                    <div style={{ fontSize:9, fontWeight:600, color:"#C8C4C0",
                      marginTop:5, letterSpacing:"0.04em" }}>
                      Lv.{badge.unlockLevel} で解放
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LevelUpModal ────────────────────────────────────────────────────────────
function LevelUpModal({ newLevel, newBadges, newTitle, onClose }) {
  const FC = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";
  const color = lvColor(newLevel);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
      zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:FC }}>
      <div style={{ background:"#FFFFFF", borderRadius:24, padding:"36px 28px 28px",
        width:"calc(100% - 48px)", maxWidth:320, textAlign:"center",
        boxShadow:"0 12px 48px rgba(0,0,0,0.22)" }}>

        {/* Level circle */}
        <div style={{ width:80, height:80, borderRadius:"50%", margin:"0 auto 18px",
          background:color, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          boxShadow:`0 6px 20px ${color}66` }}>
          <div style={{ fontSize:8, fontWeight:700, color:"#fff",
            letterSpacing:"0.1em", textTransform:"uppercase" }}>LV</div>
          <div style={{ fontSize:30, fontWeight:700, color:"#fff", lineHeight:1 }}>{newLevel}</div>
        </div>

        <div style={{ fontSize:20, fontWeight:700, color:"#1A1A1A",
          letterSpacing:"0.08em", marginBottom:8 }}>Level Up! 🎉</div>

        {newTitle && (
          <div style={{ fontSize:13, fontWeight:500, color:"#6A6A6A",
            letterSpacing:"0.06em", marginBottom:18 }}>
            称号「{newTitle}」を解放！
          </div>
        )}

        {/* New badges */}
        {newBadges && newBadges.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#A0A0A0",
              letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
              New Badge
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
              {newBadges.map(badge => (
                <div key={badge.id} style={{ background:"#F6F6F6", borderRadius:14,
                  padding:"12px 14px", textAlign:"center", minWidth:80 }}>
                  <div style={{ fontSize:26, marginBottom:4 }}>{badge.icon}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:"#2A2A2A",
                    letterSpacing:"0.04em", lineHeight:1.3 }}>{badge.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose}
          style={{ width:"100%", padding:"13px", borderRadius:12, border:"none",
            background:color, color:"#fff", fontSize:14, fontWeight:700,
            cursor:"pointer", fontFamily:FC, letterSpacing:"0.08em" }}>
          やった！
        </button>
      </div>
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────
function HomeScreen({ items, activityLog, onUpdate, onMove, onActivityLog, onEdit, onStatusChange, removeActivityLog, progress, onLevelOpen }) {
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

  // ── Date: "22nd April, 2026" format ──────────────────────────────────
  const now = new Date();
  const day = now.getDate();
  const suffix = day===1||day===21||day===31?"st":day===2||day===22?"nd":day===3||day===23?"rd":"th";
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dateStr = `${day}${suffix} ${monthNames[now.getMonth()]}, ${now.getFullYear()}`;

  // ── Weekly calendar (Mon–Sun of current week) ────────────────────────
  const weekDays = (() => {
    const days = [];
    const d = new Date(now);
    // Move to Monday of this week
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon
    d.setDate(d.getDate() - dow);
    const dayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    for (let i = 0; i < 7; i++) {
      const dd = new Date(d);
      const ymd = `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}`;
      const log = activityLog[ymd];
      // Find dominant category that day for dot color
      let dotColor = null;
      if (log && typeof log === "object") {
        const entries = Object.entries(log).filter(([,v])=>v>0);
        if (entries.length > 0) {
          const top = entries.sort((a,b)=>b[1]-a[1])[0][0];
          dotColor = CAT_CARD[top]?.dotColor || "#B0A898";
        }
      }
      days.push({ date: dd.getDate(), label: dayLabels[i], ymd, dotColor });
      d.setDate(d.getDate()+1);
    }
    return days;
  })();

  // ── Today's Focus: active item closest to completion ─────────────────
  const focusItem = (() => {
    const active = items.filter(i => i.status === "active");
    if (active.length === 0) return null;
    // Sort by % completion descending (closest to done)
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
    Object.entries(CATS).map(([k]) => [k, items.filter(i=>i.category===k).length])
  );

  // ── Status info ───────────────────────────────────────────────────────
  const statusInfo = (st) => {
    if (st==="active") return { label:"進行中", color:"#6D849C" };
    if (st==="queue")  return { label:"これから", color:"#A09890" };
    return { label:"完了", color:"#7C8F5E" };
  };

  return (
    <div style={{ background:"#FFFFFF", minHeight:"100vh", fontFamily:FC,
      display:"flex", flexDirection:"column", padding:"0 0 100px" }}>

      {/* ① Header */}
      <div style={{ padding:"28px 20px 20px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:NEW_G.ink, letterSpacing:"0.1em",
            fontFamily:"'Inter','Noto Sans JP','Hiragino Sans',sans-serif" }}>Home</div>
          <div style={{ fontSize:13, fontWeight:400, color:"#8A8A8A", marginTop:4, letterSpacing:"0.04em" }}>{dateStr}</div>
        </div>
        {/* Level icon — tappable, opens LevelPage */}
        {(() => {
          const lv  = progress?.level ?? 1;
          const col = lvColor(lv);
          return (
            <button onClick={onLevelOpen}
              style={{ width:44, height:44, borderRadius:"50%", border:"none",
                background:col, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                boxShadow:`0 2px 8px ${col}66`, cursor:"pointer", flexShrink:0,
                padding:0 }}>
              <div style={{ fontSize:7, fontWeight:700, color:"rgba(255,255,255,0.85)",
                letterSpacing:"0.08em", textTransform:"uppercase", lineHeight:1 }}>LV</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#fff", lineHeight:1.1 }}>{lv}</div>
            </button>
          );
        })()}
      </div>

      {/* ② Activity Log */}
      <div style={{ padding:"0 20px 20px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#8A8A8A", letterSpacing:"0.1em",
          textTransform:"uppercase", marginBottom:12 }}>Activity Log</div>
        <div style={{ background:"#F6F6F6", borderRadius:20, padding:"14px 10px 12px" }}>
          <div style={{ display:"flex", justifyContent:"space-around", alignItems:"flex-start" }}>
            {weekDays.map(({ date, label, dotColor }) => (
              <div key={label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                {/* Date number — smaller */}
                <div style={{ fontSize:12, fontWeight:600, color:"#2A2A2A", letterSpacing:"-0.02em", lineHeight:1 }}>
                  {date}
                </div>
                {/* Day label */}
                <div style={{ fontSize:9, fontWeight:400, color:"#A0A0A0", letterSpacing:"0.04em" }}>
                  {label}
                </div>
                {/* Activity dot — smaller */}
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

      {/* ③ Today's Focus */}
      <div style={{ padding:"0 20px 20px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#8A8A8A", letterSpacing:"0.1em",
          textTransform:"uppercase", marginBottom:12 }}>Today's Focus</div>

        {focusItem ? (
          <div onClick={()=>onEdit(focusItem)}
            style={{ background:"#F6F6F6", borderRadius:20, padding:"18px 16px 14px",
              cursor:"pointer", position:"relative" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
              {/* Left */}
              <div style={{ flex:1, minWidth:0 }}>
                {/* Title */}
                <div style={{ fontSize:15, fontWeight:700, color:"#1A1A1A",
                  letterSpacing:"0.01em", lineHeight:1.3, marginBottom:4,
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
      {selectedCat && (
        <div onClick={()=>setSelectedCat(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.28)", zIndex:500,
            display:"flex", alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"#FFFFFF", borderRadius:"22px 22px 0 0",
            width:"100%", maxHeight:"80vh", overflowY:"auto",
            padding:"22px 18px 48px",
            boxShadow:"0 -8px 36px rgba(0,0,0,0.10)",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:"50%",
                  background: CAT_CARD[selectedCat].bg,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <CatIco cat={selectedCat} color={CAT_CARD[selectedCat].fg}/>
                </div>
                <span style={{ fontSize:15, fontWeight:700, color:"#1A1A1A",
                  letterSpacing:"0.04em", fontFamily:FC }}>
                  {CATS[selectedCat].label}
                </span>
                <span style={{ fontSize:12, color:"#A0A0A0", fontWeight:400 }}>
                  {items.filter(i=>i.category===selectedCat).length}件
                </span>
              </div>
              <button onClick={()=>setSelectedCat(null)}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"#A0A0A0", fontSize:20, padding:4, lineHeight:1 }}>×</button>
            </div>
            {items.filter(i=>i.category===selectedCat).length === 0 ? (
              <div style={{ fontSize:13, color:"#A0A0A0", textAlign:"center",
                padding:"24px 0", letterSpacing:"0.04em" }}>
                登録されているコンテンツがありません
              </div>
            ) : (
              items.filter(i=>i.category===selectedCat)
                .sort((a,b) => ({active:0,queue:1,done:2}[a.status]??3) - ({active:0,queue:1,done:2}[b.status]??3))
                .map(item => {
                  const st = statusInfo(item.status);
                  return (
                    <div key={item.id} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"11px 0", borderBottom:"1px solid #F0EEEC",
                    }}>
                      <span style={{ fontSize:13, fontWeight:500, color:"#1A1A1A",
                        flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis",
                        whiteSpace:"nowrap", letterSpacing:"0.03em", lineHeight:1.5 }}>
                        {item.title}
                      </span>
                      <span style={{ flexShrink:0, marginLeft:10,
                        fontSize:10, fontWeight:500, color:st.color,
                        border:`1px solid ${st.color}`, borderRadius:6,
                        padding:"2px 8px", letterSpacing:"0.05em", lineHeight:1.6 }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
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
    <div style={{ fontFamily:F2 }}>
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
            {/* Reorder arrows for 進行中 tab */}
            {tab===0 && (
              <div style={{ position:"absolute", top:10, right:10, zIndex:2,
                display:"flex", flexDirection:"column", gap:2 }}
                onClick={e=>e.stopPropagation()}>
                <button
                  onClick={()=>onReorder(active, active.findIndex(i=>i.id===item.id), -1)}
                  disabled={active.findIndex(i=>i.id===item.id)===0}
                  style={{ width:22, height:22, borderRadius:6, border:`1px solid ${NEW_G.border}`,
                    background:NEW_G.surface, cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center", padding:0,
                    opacity:active.findIndex(i=>i.id===item.id)===0 ? 0.3 : 1 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={NEW_G.greyDark} strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
                </button>
                <button
                  onClick={()=>onReorder(active, active.findIndex(i=>i.id===item.id), 1)}
                  disabled={active.findIndex(i=>i.id===item.id)===active.length-1}
                  style={{ width:22, height:22, borderRadius:6, border:`1px solid ${NEW_G.border}`,
                    background:NEW_G.surface, cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center", padding:0,
                    opacity:active.findIndex(i=>i.id===item.id)===active.length-1 ? 0.3 : 1 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={NEW_G.greyDark} strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
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

  // ① フォント: Inter + Noto Sans JP（細め・クリーン）
  const FC = "'Inter','Noto Sans JP','Hiragino Sans',sans-serif";

  const isBinary = ["youtube","tv","radio","live","article"].includes(item.category);
  const isYT    = item.category === "youtube";
  const isTV    = item.category === "tv";
  const isRadio = item.category === "radio";
  const effectiveUnit = item.category === "manga" ? (item.mangaUnit || "巻") : c.unit;

  const qa = item.category==="book"?10:item.category==="manga"?1:(item.category==="anime"||item.category==="drama")?1:item.category==="movie"?10:1;
  const ql = item.category==="book"?"+10P":item.category==="manga"?`+1${effectiveUnit}`:(item.category==="anime"||item.category==="drama")?"+1話":item.category==="movie"?"+10分":item.category==="live"?"+1曲":(isYT||isTV||isRadio)?"視聴済み":"読了";

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
    ? (item.status==="done" ? 100 : item.status==="active" ? 50 : 0)
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
            letterSpacing:"0.02em", fontFamily:FC,
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
                <span style={{ display:"flex", alignItems:"center", gap:4,
                  fontWeight:500, color:item.status==="done"?accentDk:NEW_G.greyDark,
                  letterSpacing:"0.04em", fontFamily:FC }}>
                  {item.category==="live"
                    ? (item.status==="done"?<><ICONS.check/> 視聴済み</>:item.status==="active"?<><ICONS.music/> 進行中</>:<><ICONS.hourglass/> これから</>)
                    : item.status==="done" ? <><ICONS.check/> 完了済み</> : "未視聴・未読"
                  }
                </span>
                {item.category==="article" && item.episodeMin && (
                  <span style={{ fontSize:10, fontWeight:400, color:NEW_G.greyMid,
                    letterSpacing:"0.04em", fontFamily:FC }}>
                    約{item.episodeMin}分で読了
                  </span>
                )}
                {(isTV||isRadio) && item.totalDurationMin && (
                  <span style={{ fontSize:10, fontWeight:400, color:NEW_G.greyMid,
                    letterSpacing:"0.04em", fontFamily:FC }}>
                    約{fmtGap(item.totalDurationMin)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Row 5: Action buttons */}
          {item.status !== "done" && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}
              onClick={e=>e.stopPropagation()}>
              {!isBinary && item.category!=="live" && (
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
          {/* ① 9px / ④ 300 / ② letter-spacing 0.03em */}
          <div style={{ display:"flex", gap:10, fontSize:9, fontWeight:300,
            color:NEW_G.greyLight, flexWrap:"wrap",
            marginTop:4, lineHeight:1.6, letterSpacing:"0.03em", fontFamily:FC }}>
            <span>追加: {item.addedAt}</span>
            {item.lastUpdated && <span>更新: {item.lastUpdated}</span>}
            {item.completedAt && <span>完了: {item.completedAt}</span>}
          </div>
        </div>

        {/* ── Right: progress ring ── */}
        <div style={{ flexShrink:0, paddingTop:2 }}>
          <ProgressRing pct={ringPct} color={c.color} size={60} stroke={4.5}/>
        </div>
      </div>

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
function SettingsScreen({ user, onLogout, syncStatus }) {
  const F2 = "'Outfit','Hiragino Sans','Noto Sans JP',sans-serif";
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div style={{ padding:"24px 18px 40px", fontFamily:F2 }}>
      <div style={{ fontSize:22, fontWeight:700, color:NEW_G.ink, letterSpacing:"0.1em", marginBottom:24 }}>Settings</div>

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

      {/* Logout — only shown when logged in */}
      {user && onLogout && (
        <div style={{ background:NEW_G.surface, borderRadius:18, padding:"18px" }}>
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
              <div style={{ fontSize:13, color:NEW_G.greyDeep, fontWeight:600, marginBottom:12, textAlign:"center", lineHeight:1.6 }}>
                ログアウトしますか？
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setConfirmLogout(false)}
                  style={{ flex:1, padding:"12px", borderRadius:12,
                    border:`1.5px solid ${NEW_G.border}`, background:"transparent",
                    color:NEW_G.greyDark, fontSize:13, fontWeight:600,
                    cursor:"pointer", fontFamily:F2 }}>
                  キャンセル
                </button>
                <button onClick={()=>{ setConfirmLogout(false); onLogout(); }}
                  style={{ flex:1, padding:"12px", borderRadius:12,
                    border:"none", background:"#767676",
                    color:"#fff", fontSize:13, fontWeight:700,
                    cursor:"pointer", fontFamily:F2 }}>
                  ログアウト
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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
    <div style={{ minHeight:"100vh", background:NEW_G.surface, fontFamily:FC }}>
      <div style={{ padding:"28px 20px 18px", position:"sticky", top:0, zIndex:10,
        background:NEW_G.surface, borderBottom:`1px solid ${NEW_G.border}` }}>
      <div style={{ fontSize:22, fontWeight:700, color:NEW_G.ink, letterSpacing:"0.1em",
        fontFamily:"'Inter','Noto Sans JP','Hiragino Sans',sans-serif" }}>
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
    <div style={{ minHeight:"100vh", background:NEW_G.bg, fontFamily:FC }}>
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
function ReportPageScreen({ items, activityLog, F2 }) {
  return (
    <div style={{ minHeight:"100vh", background:"#FFFFFF", fontFamily:F2 }}>
      <div style={{ padding:"24px 18px 14px", background:NEW_G.surface,
        borderBottom:`1px solid ${NEW_G.border}`, position:"sticky", top:0, zIndex:10 }}>
        <div style={{ fontSize:22, fontWeight:700, color:NEW_G.ink, letterSpacing:"0.1em" }}>
          Report
        </div>
      </div>
      <ReportModal items={items} activityLog={activityLog} onClose={()=>{}} inlineMode={true}/>
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

  // ── Level / EXP state ─────────────────────────────────────────────────────
  // 初期値は localStorage から（Supabase 読み込み前の瞬間的な表示用）
  const [userProgress, setUserProgress] = useState(() => loadProgress());
  const [levelOpen, setLevelOpen]     = useState(false);
  const [levelUpData, setLevelUpData] = useState(null); // { newLevel, newBadges, newTitle }
  const progressSaveTimer = useRef(null); // Supabase保存のdebounce用

  // localStorage への永続化（Supabase 保存のfallback兼キャッシュ）
  useEffect(() => { saveProgress(userProgress); }, [userProgress]);

  // Update streak once on mount / when loaded
  useEffect(() => {
    if (!loaded) return;
    setUserProgress(prev => {
      const updated = updateStreakPure(prev, today());
      // ストリーク更新後に Supabase へも同期（debounce 1s）
      if (userId && sbOps?.updateUserProgress) {
        clearTimeout(progressSaveTimer.current);
        progressSaveTimer.current = setTimeout(() => {
          sbOps.updateUserProgress(userId, updated).catch(e => console.error("streak sync:", e));
        }, 1000);
      }
      return updated;
    });
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Supabase から UserProgress を初期ロード（userId 確定後）
  useEffect(() => {
    if (!userId || !sbOps?.getUserProgress) return;
    (async () => {
      try {
        const remote = await sbOps.getUserProgress(userId);
        if (remote) {
          // リモートのデータで上書き（より信頼性が高い）
          setUserProgress(remote);
          saveProgress(remote); // localStorage も更新
        } else {
          // 初回ログイン：localStorage のデータを初期値として INSERT
          const local = loadProgress();
          await sbOps.createUserProgress(userId, local);
        }
      } catch (e) {
        console.error("Progress initial load error:", e);
        // 失敗しても localStorage の値で動作継続（fallback）
      }
    })();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * EXP を加算し、UI を楽観更新してから Supabase に非同期保存。
   * 保存失敗時もUIは正常動作（fallback = localStorage）。
   */
  const grantExp = useCallback((amount) => {
    setUserProgress(prev => {
      const result = addExpPure(prev, amount);
      if (result.leveledUp) {
        setLevelUpData({ newLevel: result.newProgress.level, newBadges: result.newBadges, newTitle: result.newTitle });
      }
      const next = result.newProgress;
      // Supabase へ debounce 付きで非同期保存
      if (userId && sbOps?.updateUserProgress) {
        clearTimeout(progressSaveTimer.current);
        progressSaveTimer.current = setTimeout(() => {
          sbOps.updateUserProgress(userId, next).catch(e => console.error("progress sync:", e));
        }, 800);
      }
      return next;
    });
  }, [userId, sbOps]);

  // ── Sync helpers ─────────────────────────────────────────────────────────
  const markSaving = () => { setSyncStatus("saving"); clearTimeout(syncTimerRef.current); };
  const markSaved  = () => { setSyncStatus("saved");  syncTimerRef.current = setTimeout(()=>setSyncStatus(null), 2500); };
  const markError  = () => { setSyncStatus("error");  syncTimerRef.current = setTimeout(()=>setSyncStatus(null), 4000); };

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (userId && sbOps) {
        const [sbItems, sbLog, sbWQ] = await Promise.all([sbOps.loadItems(userId), sbOps.loadActivityLog(userId), sbOps.loadWatchQueue(userId)]);
        if (sbItems && sbItems.length > 0) setItemsRaw(sbItems);
        else {
          const local = await wsGet(LS_ITEMS, null);
          if (local && Array.isArray(local) && local.length > 0) { setItemsRaw(local); await Promise.all(local.map(it => sbOps.saveItem(userId, it))); }
        }
        if (sbLog && Object.keys(sbLog).length > 0) setActivityLog(sbLog);
        else {
          const local = await wsGet(LS_DATES, null);
          if (local && typeof local === "object") {
            setActivityLog(local);
            for (const [date, cats] of Object.entries(local)) { if (typeof cats==="object") { for (const [cat,count] of Object.entries(cats)) await sbOps.upsertActivity(userId,date,cat,count); } }
          }
        }
        if (sbWQ && sbWQ.length > 0) setWatchQueue(sbWQ);
        else { const local = await wsGet(LS_WQ, null); if (Array.isArray(local)) { setWatchQueue(local); if (local.length>0) await sbOps.saveWatchQueue(userId, local); } }
      } else {
        const si = await wsGet(LS_ITEMS, null); if (si && Array.isArray(si) && si.length>0) setItemsRaw(si);
        const wq = await wsGet(LS_WQ, null); if (Array.isArray(wq)) setWatchQueue(wq);
        const al = await wsGet(LS_DATES, null); if (al && typeof al==="object") setActivityLog(al);
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

  const setItems = useCallback((updater) => {
    setItemsRaw(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      if (loaded) {
        try { localStorage.setItem(LS_ITEMS, JSON.stringify(next)); } catch {}
        if (userId && sbOps) {
          next.forEach(item => { const old=prev.find(p=>p.id===item.id); if(!old||JSON.stringify(old)!==JSON.stringify(item)) dirtyItems.current.add(item.id); });
          prev.forEach(item => { if(!next.find(n=>n.id===item.id)) dirtyItems.current.add(item.id); });
          scheduleFlush(next, watchQueue);
        }
      }
      return next;
    });
  }, [loaded, userId, sbOps, scheduleFlush, watchQueue]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(LS_WQ, JSON.stringify(watchQueue)); } catch {}
    if (userId && sbOps) { dirtyWQ.current=true; scheduleFlush(items, watchQueue); }
  }, [watchQueue, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(LS_DATES, JSON.stringify(activityLog)); } catch {}
    try { if (window.storage) window.storage.set(LS_DATES, JSON.stringify(activityLog)); } catch {}
  }, [activityLog, loaded]);

  // ── Activity log ──────────────────────────────────────────────────────────
  const logActivity = useCallback((date, category) => {
    setActivityLog(prev => {
      const day = prev[date] && typeof prev[date]==="object" ? prev[date] : {};
      const newCount = (day[category]||0)+1;
      if (userId && sbOps) sbOps.upsertActivity(userId,date,category,newCount);
      return { ...prev, [date]: { ...day, [category]: newCount } };
    });
    // +10 EXP per action
    grantExp(EXP_REWARDS.ACTION);
  }, [userId, sbOps, grantExp]);

  const removeActivity = useCallback((date, category) => {
    if (!date) return;
    setActivityLog(prev => {
      const day = prev[date]; if (!day||typeof day!=="object") return prev;
      const cur=day[category]||0, newCount=cur-1;
      if (userId && sbOps) sbOps.upsertActivity(userId,date,category,newCount);
      if (newCount<=0) { const next={...day}; delete next[category]; if(Object.keys(next).length===0){const top={...prev};delete top[date];return top;} return {...prev,[date]:next}; }
      return {...prev,[date]:{...day,[category]:newCount}};
    });
  }, [userId, sbOps]);

  // ── Item callbacks ────────────────────────────────────────────────────────
  const update  = useCallback((id,patch)=>setItems(p=>p.map(it=>it.id===id?{...it,...patch}:it)),[setItems]);
  const saveEdit = useCallback((updated) => {
    setItemsRaw(prev => {
      const old = prev.find(it=>it.id===updated.id);
      if (old) {
        const delta = updated.current - old.current;
        if (delta > 0) {
          for (let i=0;i<delta;i++) setActivityLog(log => { const day=log[today()]&&typeof log[today()]==="object"?log[today()]:{};const cur=day[updated.category]||0;const newCount=cur+1;if(userId&&sbOps)sbOps.upsertActivity(userId,today(),updated.category,newCount);return {...log,[today()]:{...day,[updated.category]:newCount}}; });
          updated = { ...updated, progressHistory:[...(old.progressHistory||[]), {date:today(),delta,from:old.current,to:updated.current,editedViaModal:true}] };
        } else if (delta < 0) {
          const removeDelta=Math.abs(delta), date=old.lastUpdated||today();
          setActivityLog(log => { const day=log[date]&&typeof log[date]==="object"?log[date]:{};const cur=day[updated.category]||0;const next=Math.max(cur-removeDelta,0);if(userId&&sbOps)sbOps.upsertActivity(userId,date,updated.category,next);if(next<=0){const nd={...day};delete nd[updated.category];if(Object.keys(nd).length===0){const tl={...log};delete tl[date];return tl;}return{...log,[date]:nd};}return{...log,[date]:{...day,[updated.category]:next}};});
          const hist=[...(old.progressHistory||[])];let toRemove=removeDelta;
          while(toRemove>0&&hist.length>0){const last=hist[hist.length-1];if(last.delta<=toRemove){hist.pop();toRemove-=last.delta;}else{hist[hist.length-1]={...last,delta:last.delta-toRemove,to:last.to-toRemove};toRemove=0;}}
          updated = { ...updated, progressHistory: hist };
        }
      }
      return prev.map(it=>it.id===updated.id?updated:it);
    });
    setItems(p=>p.map(it=>it.id===updated.id?updated:it));
    setEdit(null);
  }, [setItems, userId, sbOps]);

  const deleteItem = useCallback((id) => {
    setItemsRaw(prev => {
      const target = prev.find(it=>it.id===id);
      if (target) {
        const toRemove={};
        (target.progressHistory||[]).forEach(h=>{if(!h.date)return;if(!toRemove[h.date])toRemove[h.date]={};toRemove[h.date][target.category]=(toRemove[h.date][target.category]||0)+1;});
        const isBinaryDel=["youtube","tv","radio","live","article"].includes(target.category);
        if(isBinaryDel&&target.completedAt){if(!toRemove[target.completedAt])toRemove[target.completedAt]={};toRemove[target.completedAt][target.category]=(toRemove[target.completedAt][target.category]||0)+1;}
        if(Object.keys(toRemove).length>0){
          setActivityLog(log=>{let next={...log};for(const[date,cats]of Object.entries(toRemove)){for(const[cat,removeCount]of Object.entries(cats)){const day=next[date]&&typeof next[date]==="object"?next[date]:{};const cur=day[cat]||0;const newCount=Math.max(cur-removeCount,0);if(userId&&sbOps)sbOps.upsertActivity(userId,date,cat,newCount);if(newCount<=0){const nd={...day};delete nd[cat];if(Object.keys(nd).length===0){delete next[date];}else{next[date]=nd;}}else{next[date]={...day,[cat]:newCount};}}}return next;});
        }
      }
      return prev.filter(it=>it.id!==id);
    });
    setItems(p=>p.filter(it=>it.id!==id));
    setEdit(null);
  }, [setItems, userId, sbOps]);

  const statusChange = useCallback((id,st)=>{
    if(st==="active"){setWatchQueue(prev=>{const idx=prev.indexOf(id);if(idx===-1)return prev;const next=prev.filter(x=>x!==id);if(idx===0&&next.length===0)setTimeout(()=>setNvChooseOpen(true),50);return next;});}
  },[]);

  const move = useCallback((id,st)=>{
    setItems(p=>p.map(it=>{if(it.id!==id)return it;const patch={...it,status:st,completedAt:st==="done"?today():null,current:st==="done"?it.total:it.current};if(st==="active"&&it.status==="queue"&&!it.firstActiveAt)patch.firstActiveAt=today();if(st==="queue")patch.firstActiveAt=null;return patch;}));
    if(st==="done"){
      setConfetti(true);
      grantExp(EXP_REWARDS.COMPLETE); // +100 EXP on completion
    }
    if(st==="active"){
      grantExp(EXP_REWARDS.FOCUS_START); // +5 EXP when starting
      setWatchQueue(prev=>{const idx=prev.indexOf(id);if(idx===-1)return prev;const next=prev.filter(x=>x!==id);if(idx===0&&next.length===0)setTimeout(()=>setNvChooseOpen(true),50);return next;});
    }
  },[setItems, grantExp]);

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
        body { margin:0; background:${NEW_G.bg}; font-family:'Inter','Noto Sans JP','Hiragino Sans',sans-serif; letter-spacing:0.02em; font-size:13px; }
        ::-webkit-scrollbar { display:none; }
        @keyframes fadeUp { from{opacity:0;transform:translate(-50%,10px);}to{opacity:1;transform:translate(-50%,0);} }
        @keyframes spin { to { transform:rotate(360deg); } }
        input[type="date"], input[type="datetime-local"] {
          -webkit-appearance:none; -moz-appearance:none; appearance:none;
          box-sizing:border-box; width:100%; max-width:100%; min-width:0;
        }
        button { letter-spacing:0.02em; }
      `}</style>

      <div style={{ minHeight:"100vh", background:NEW_G.bg, fontFamily:F2, maxWidth:480, margin:"0 auto",
        paddingBottom:90 }}>

        {/* ── Page content ── */}
        <div style={{ overflowY:"auto", height:"100vh", paddingBottom:90 }}>
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
              progress={userProgress}
              onLevelOpen={()=>setLevelOpen(true)}
            />
          )}
          {navTab===1 && (
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
          )}
          {navTab===2 && (
            <AddPageScreen onAdd={(item)=>{ addItem(item); setGlobalToast("コンテンツを追加しました！"); }} onDone={()=>setNavTab(1)} F2={F2}/>
          )}
          {navTab===3 && (
            <ReportPageScreen items={items} activityLog={activityLog} F2={F2}/>
          )}
          {navTab===4 && (
            <SettingsScreen user={user} onLogout={onLogout} syncStatus={syncStatus}/>
          )}
        </div>

        {/* ── Bottom Navigation ── */}
        <div style={{
          position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
          width:"100%", maxWidth:480,
          background:NEW_G.nav,
          borderTop:`1px solid ${NEW_G.border}`,
          display:"flex", alignItems:"center", justifyContent:"space-around",
          padding:"8px 0 calc(8px + env(safe-area-inset-bottom, 0px))",
          zIndex:200,
          boxShadow:"0 -4px 20px rgba(0,0,0,0.06)",
        }}>
          {NAV_ITEMS.map((item, i) => {
            if (item.isAdd) {
              return (
                <button key={i} onClick={()=>handleNavTab(2)}
                  style={{ width:44, height:44, borderRadius:"50%", background:accentColor, border:"none",
                    display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                    boxShadow:`0 2px 10px rgba(118,118,118,0.35)`, flexShrink:0 }}>
                  <NAV_ICONS.add/>
                </button>
              );
            }
            const isActive = navTab === i || (i===3 && showReport);
            return (
              <button key={i} onClick={()=>handleNavTab(i)}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                  background:"none", border:"none", cursor:"pointer", padding:"4px 8px", minWidth:44 }}>
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
      {/* Level Page */}
      {levelOpen && <LevelPage progress={userProgress} onClose={()=>setLevelOpen(false)}/>}
      {/* Level Up Modal */}
      {levelUpData && (
        <LevelUpModal
          newLevel={levelUpData.newLevel}
          newBadges={levelUpData.newBadges}
          newTitle={levelUpData.newTitle}
          onClose={()=>setLevelUpData(null)}
        />
      )}
    </React.Fragment>
  );
}

// ─── Default export (artifact preview) ───────────────────────────────────
export default ContentsProgress;