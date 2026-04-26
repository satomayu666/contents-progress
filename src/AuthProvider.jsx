/**
 * AuthProvider.jsx
 *
 * 役割：Googleログイン認証の管理に専念するファイル。
 * ・未ログイン → LoginScreen を表示
 * ・ログイン済み → ContentsProgress を呼び出し、ユーザー情報とSupabase操作関数を渡す
 *
 * Vercel/VSCodeでの利用:
 *   import { createClient } from '@supabase/supabase-js'  (npm install @supabase/supabase-js)
 *   .env.local に VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を設定
 */
 
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import ContentsProgress from "./ContentsProgress";
 
// ─── Supabase client (singleton) ─────────────────────────────────────────────
let _sbClient = null;
function getSupabase() {
  if (_sbClient) return _sbClient;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("[AuthProvider] 環境変数が設定されていません: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
    return null;
  }
  _sbClient = createClient(url, key);
  return _sbClient;
}
 
// ─── Supabase DB helpers ──────────────────────────────────────────────────────
 
export async function sbLoadItems(userId) {
  const sb = getSupabase(); if (!sb) return null;
  const { data, error } = await sb
    .from("contents").select("item_id, data").eq("user_id", userId).order("item_id");
  if (error) { console.error("sbLoadItems:", error); return null; }
  return data.map(row => ({ ...row.data, id: row.item_id }));
}
 
export async function sbSaveItem(userId, item) {
  const sb = getSupabase(); if (!sb) return;
  const { error } = await sb.from("contents").upsert(
    { user_id: userId, item_id: item.id, data: item, updated_at: new Date().toISOString() },
    { onConflict: "user_id,item_id" }
  );
  if (error) console.error("sbSaveItem:", error);
}
 
export async function sbDeleteItem(userId, itemId) {
  const sb = getSupabase(); if (!sb) return;
  const { error } = await sb.from("contents")
    .delete().eq("user_id", userId).eq("item_id", itemId);
  if (error) console.error("sbDeleteItem:", error);
}
 
export async function sbLoadActivityLog(userId) {
  const sb = getSupabase(); if (!sb) return null;
  const { data, error } = await sb
    .from("activity_log").select("log_date, category, count").eq("user_id", userId);
  if (error) { console.error("sbLoadActivityLog:", error); return null; }
  const log = {};
  for (const row of data) {
    if (!log[row.log_date]) log[row.log_date] = {};
    log[row.log_date][row.category] = row.count;
  }
  return log;
}
 
export async function sbUpsertActivityLog(userId, date, category, count) {
  const sb = getSupabase(); if (!sb) return;
  if (count <= 0) {
    await sb.from("activity_log")
      .delete().eq("user_id", userId).eq("log_date", date).eq("category", category);
    return;
  }
  const { error } = await sb.from("activity_log").upsert(
    { user_id: userId, log_date: date, category, count, updated_at: new Date().toISOString() },
    { onConflict: "user_id,log_date,category" }
  );
  if (error) console.error("sbUpsertActivityLog:", error);
}
 
export async function sbLoadWatchQueue(userId) {
  const sb = getSupabase(); if (!sb) return null;
  const { data, error } = await sb
    .from("watch_queue").select("queue_data").eq("user_id", userId).single();
  if (error) { if (error.code !== "PGRST116") console.error("sbLoadWatchQueue:", error); return null; }
  return data?.queue_data ?? [];
}
 
export async function sbSaveWatchQueue(userId, queue) {
  const sb = getSupabase(); if (!sb) return;
  const { error } = await sb.from("watch_queue").upsert(
    { user_id: userId, queue_data: queue, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) console.error("sbSaveWatchQueue:", error);
}
 
// ─── user_progress CRUD ───────────────────────────────────────────────────────
 
/**
 * DB行 → UserProgress オブジェクトへマッピング
 */
function rowToProgress(row) {
  return {
    level:          row.level,
    currentExp:     row.current_exp,
    totalExp:       row.total_exp,
    streakDays:     row.streak_days,
    lastActiveDate: row.last_active_date ?? "",
    obtainedBadges: row.obtained_badges ?? [],
  };
}
 
/**
 * UserProgress オブジェクト → DB行へマッピング
 */
function progressToRow(userId, progress) {
  return {
    user_id:          userId,
    level:            progress.level,
    current_exp:      progress.currentExp,
    total_exp:        progress.totalExp,
    streak_days:      progress.streakDays,
    last_active_date: progress.lastActiveDate || null,
    obtained_badges:  progress.obtainedBadges,
    updated_at:       new Date().toISOString(),
  };
}
 
/**
 * ユーザーのレベル進捗を取得する。
 * レコードが存在しない場合は null を返す。
 */
export async function sbGetUserProgress(userId) {
  const sb = getSupabase(); if (!sb) return null;
  const { data, error } = await sb
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) {
    // PGRST116 = "no rows" → 新規ユーザーなので null を返すだけ
    if (error.code !== "PGRST116") console.error("sbGetUserProgress:", error);
    return null;
  }
  return rowToProgress(data);
}
 
/**
 * 新規ユーザーの初期レコードを INSERT する。
 * 既にレコードがある場合は何もしない（upsert の onConflict で制御）。
 */
export async function sbCreateUserProgress(userId, progress) {
  const sb = getSupabase(); if (!sb) return;
  const { error } = await sb
    .from("user_progress")
    .insert(progressToRow(userId, progress));
  // 重複エラー（既に存在）は無視
  if (error && error.code !== "23505") {
    console.error("sbCreateUserProgress:", error);
  }
}
 
/**
 * 既存レコードを UPDATE する（楽観更新後の確定保存）。
 */
export async function sbUpdateUserProgress(userId, progress) {
  const sb = getSupabase(); if (!sb) return;
  const { error } = await sb
    .from("user_progress")
    .update(progressToRow(userId, progress))
    .eq("user_id", userId);
  if (error) console.error("sbUpdateUserProgress:", error);
}
 
// ─── デザイン定数（ログイン画面用のみ） ──────────────────────────────────────
const G_AUTH = {
  surface:    "#FFFFFF",
  surfaceAlt: "#F7F7F7",
  border:     "#E8E4E0",
  borderMid:  "#D4CFC9",
  greyMid:    "#A8A8A8",
  greyDeep:   "#3A3A3A",
  ink:        "#222222",
};
const F_AUTH = "'Outfit','Inter','system-ui','-apple-system','Hiragino Sans','Noto Sans JP',sans-serif";
 
// ─── ログイン画面 ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, loading }) {
  return (
    <div style={{
      minHeight:"100vh", background:G_AUTH.surfaceAlt,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"0 32px", fontFamily:F_AUTH,
    }}>
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');`}</style>
 
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:22, fontWeight:700, color:G_AUTH.ink, letterSpacing:"0.05em", marginBottom:8 }}>
          Contents Progress
        </div>
        <div style={{ fontSize:13, color:G_AUTH.greyMid, lineHeight:1.8 }}>
          視聴・読書の進捗を管理するアプリです。<br/>
          Googleアカウントでログインして始めましょう。
        </div>
      </div>
 
      <button
        onClick={onLogin}
        disabled={loading}
        style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:12,
          padding:"13px 24px", borderRadius:12,
          border:`1.5px solid ${G_AUTH.border}`, background:G_AUTH.surface,
          cursor:loading ? "not-allowed" : "pointer",
          fontSize:14, fontWeight:700, color:G_AUTH.greyDeep,
          fontFamily:F_AUTH, letterSpacing:"0.02em",
          boxShadow:"0 2px 12px rgba(0,0,0,0.07)",
          opacity:loading ? 0.6 : 1, transition:"opacity .15s",
          width:"100%", maxWidth:320,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? "ログイン中…" : "Googleでログイン"}
      </button>
 
      <p style={{ fontSize:11, color:G_AUTH.borderMid, marginTop:24, textAlign:"center", lineHeight:1.8 }}>
        ログインするとデータが自動的に<br/>クラウドへ保存・同期されます。
      </p>
    </div>
  );
}
 
// ─── AuthProvider (main export) ───────────────────────────────────────────────
export default function AuthProvider() {
  const [user,        setUser]        = useState(null);
  const [authReady,   setAuthReady]   = useState(false);
  const [loginLoading,setLoginLoading]= useState(false);
 
  // ── 認証状態の監視 ────────────────────────────────────────────────────────
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setAuthReady(true); return; }
 
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
 
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
 
    return () => subscription.unsubscribe();
  }, []);
 
  // ── Googleログイン ────────────────────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    const sb = getSupabase(); if (!sb) return;
    setLoginLoading(true);
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) { console.error("Login error:", error); setLoginLoading(false); }
  }, []);
 
  // ── ログアウト ────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    const sb = getSupabase(); if (!sb) return;
    await sb.auth.signOut();
    setUser(null);
  }, []);
 
  // ── 認証状態確認中 ───────────────────────────────────────────────────────
  if (!authReady) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:G_AUTH.surfaceAlt, fontFamily:F_AUTH, color:G_AUTH.greyMid, fontSize:13 }}>
        読み込み中…
      </div>
    );
  }
 
  // ── 未ログイン → ログイン画面 ─────────────────────────────────────────────
  if (!user) {
    return <LoginScreen onLogin={handleLogin} loading={loginLoading} />;
  }
 
  // ── ログイン済み → ContentsProgress を呼び出す ────────────────────────────
  // ContentsProgress には user と Supabase操作関数群を props として渡す
  return (
    <ContentsProgress
      user={user}
      onLogout={handleLogout}
      // ── Supabase DB 操作関数（ContentsProgress はこれを使ってデータを永続化）──
      sbOps={{
        loadItems:          (uid)           => sbLoadItems(uid),
        saveItem:           (uid, item)     => sbSaveItem(uid, item),
        deleteItem:         (uid, itemId)   => sbDeleteItem(uid, itemId),
        loadActivityLog:    (uid)           => sbLoadActivityLog(uid),
        upsertActivity:     (uid,d,c,n)     => sbUpsertActivityLog(uid,d,c,n),
        loadWatchQueue:     (uid)           => sbLoadWatchQueue(uid),
        saveWatchQueue:     (uid, q)        => sbSaveWatchQueue(uid, q),
        // ── Level / EXP progress ──
        getUserProgress:    (uid)           => sbGetUserProgress(uid),
        createUserProgress: (uid, progress) => sbCreateUserProgress(uid, progress),
        updateUserProgress: (uid, progress) => sbUpdateUserProgress(uid, progress),
      }}
    />
  );
}