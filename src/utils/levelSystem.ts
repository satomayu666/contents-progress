// ============================================================
// ContentsProgress — Level / EXP System
// ============================================================
// フレームワーク非依存の純関数ロジック。
// React / localStorage どちらからも使用可能。
// ============================================================
 
// ────────────────────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────────────────────
 
/** ユーザーの進捗データ */
export type UserProgress = {
  level: number;          // 現在のレベル (1〜100)
  currentExp: number;     // 現レベル内の累積EXP
  totalExp: number;       // 累計EXP（レベルまたぎ込み）
  streakDays: number;     // 現在の連続ログイン日数
  lastActiveDate: string; // 最後にアクティブだった日 YYYY-MM-DD
  obtainedBadges: string[]; // 取得済みバッジID一覧
};
 
/** 称号 */
export type Title = {
  level: number;  // 解放レベル
  name: string;   // 称号名
};
 
/** バッジ */
export type Badge = {
  id: string;       // 一意ID
  name: string;     // バッジ名
  description: string;  // 説明文
  unlockLevel: number;  // 解放に必要なレベル
  icon: string;     // 絵文字アイコン
};
 
/** addExp の戻り値 */
export type AddExpResult = {
  newProgress: UserProgress;
  leveledUp: boolean;         // レベルアップしたか
  levelsGained: number;       // 何レベル上がったか
  newBadges: Badge[];         // 新たに取得したバッジ
  newTitle: string | null;    // 新たに解放された称号名（なければnull）
};
 
// ────────────────────────────────────────────────────────────
// 定数
// ────────────────────────────────────────────────────────────
 
export const MAX_LEVEL = 100;
 
/** ストリーク連続日数ごとのボーナスEXP */
export const STREAK_BONUSES: { days: number; exp: number }[] = [
  { days: 3,  exp: 20  },
  { days: 7,  exp: 50  },
  { days: 14, exp: 100 },
  { days: 30, exp: 200 },
];
 
/** EXP 獲得量の定数 */
export const EXP_REWARDS = {
  ACTION:           10,  // コンテンツを1アクション進めた
  COMPLETE:        100,  // コンテンツを完了した
  FOCUS_START:       5,  // Today's Focusを開始/再開した
  LIGHT_REFLECTION:  5,  // 軽い振り返り記録（将来用）
} as const;
 
// ────────────────────────────────────────────────────────────
// 称号一覧
// ────────────────────────────────────────────────────────────
 
export const TITLES: Title[] = [
  { level: 1,   name: "はじめた人" },
  { level: 5,   name: "コツコツ勢" },
  { level: 10,  name: "習慣ビギナー" },
  { level: 25,  name: "継続の民" },
  { level: 50,  name: "習慣マスター" },
  { level: 75,  name: "コンテンツ探求者" },
  { level: 100, name: "コンテンツの神" },
];
 
// ────────────────────────────────────────────────────────────
// バッジ一覧
// ────────────────────────────────────────────────────────────
 
export const BADGES: Badge[] = [
  {
    id:          "lv1",
    name:        "はじまりの一歩",
    description: "Lv.1 に到達した",
    unlockLevel: 1,
    icon:        "🌱",
  },
  {
    id:          "lv5",
    name:        "コツコツバッジ",
    description: "Lv.5 に到達した",
    unlockLevel: 5,
    icon:        "📚",
  },
  {
    id:          "lv10",
    name:        "習慣の芽",
    description: "Lv.10 に到達した",
    unlockLevel: 10,
    icon:        "🌿",
  },
  {
    id:          "lv25",
    name:        "継続の証",
    description: "Lv.25 に到達した",
    unlockLevel: 25,
    icon:        "🔥",
  },
  {
    id:          "lv50",
    name:        "習慣マスター章",
    description: "Lv.50 に到達した",
    unlockLevel: 50,
    icon:        "⭐",
  },
  {
    id:          "lv75",
    name:        "探求者の紋章",
    description: "Lv.75 に到達した",
    unlockLevel: 75,
    icon:        "🔭",
  },
  {
    id:          "lv100",
    name:        "神の称号",
    description: "Lv.100 に到達した",
    unlockLevel: 100,
    icon:        "👑",
  },
];
 
// ────────────────────────────────────────────────────────────
// 純関数：EXP / レベル計算
// ────────────────────────────────────────────────────────────
 
/**
 * レベルアップに必要なEXPを返す（ゆるやかな指数カーブ）
 * Lv.1→2 に必要: floor(50 * 1^1.5) = 50
 * Lv.50→51に必要: floor(50 * 50^1.5) ≈ 17,677
 */
export function getRequiredExp(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.5));
}
 
/**
 * 累計EXPからレベルと、そのレベル内の現在EXPを計算する。
 * 複数レベルアップにも対応。
 */
export function calculateLevel(totalExp: number): {
  level: number;
  currentExp: number;
} {
  let level = 1;
  let remaining = totalExp;
 
  while (level < MAX_LEVEL) {
    const needed = getRequiredExp(level);
    if (remaining >= needed) {
      remaining -= needed;
      level++;
    } else {
      break;
    }
  }
 
  return { level, currentExp: remaining };
}
 
/**
 * EXPを加算し、レベルアップ・バッジ取得を処理して新しい UserProgress を返す。
 * 副作用なし（純関数）。
 */
export function addExp(user: UserProgress, amount: number): AddExpResult {
  const prevLevel = user.level;
  const newTotalExp = user.totalExp + amount;
  const { level: newLevel, currentExp: newCurrentExp } = calculateLevel(newTotalExp);
 
  const leveledUp   = newLevel > prevLevel;
  const levelsGained = newLevel - prevLevel;
 
  // 新たに取得したバッジ
  const newBadges = leveledUp
    ? getNewlyUnlockedBadges(prevLevel, newLevel, user.obtainedBadges)
    : [];
 
  // 新たに解放された称号（最後に到達した閾値のもの）
  const newTitle = leveledUp
    ? getNewlyUnlockedTitle(prevLevel, newLevel)
    : null;
 
  const newProgress: UserProgress = {
    ...user,
    level:          newLevel,
    currentExp:     newCurrentExp,
    totalExp:       newTotalExp,
    obtainedBadges: [...user.obtainedBadges, ...newBadges.map(b => b.id)],
  };
 
  return { newProgress, leveledUp, levelsGained, newBadges, newTitle };
}
 
/**
 * レベルアップしているかチェックし、必要なら UserProgress を更新して返す。
 */
export function checkLevelUp(user: UserProgress): UserProgress {
  const { level, currentExp } = calculateLevel(user.totalExp);
  return { ...user, level, currentExp };
}
 
// ────────────────────────────────────────────────────────────
// 称号・バッジ
// ────────────────────────────────────────────────────────────
 
/**
 * 現在のレベルに対応する称号を返す。
 * 到達した中で最も高いレベルの称号を選ぶ。
 */
export function getCurrentTitle(level: number): string {
  const reached = TITLES.filter(t => level >= t.level);
  if (reached.length === 0) return TITLES[0].name;
  return reached[reached.length - 1].name;
}
 
/**
 * 現在のレベルで解放済みのバッジ一覧を返す。
 */
export function getUnlockedBadges(level: number): Badge[] {
  return BADGES.filter(b => b.unlockLevel <= level);
}
 
/**
 * prevLevel→newLevel の間に新たに解放されたバッジのうち、
 * まだ obtainedBadges に含まれていないものを返す。
 */
function getNewlyUnlockedBadges(
  prevLevel: number,
  newLevel: number,
  obtained: string[]
): Badge[] {
  return BADGES.filter(
    b => b.unlockLevel > prevLevel
      && b.unlockLevel <= newLevel
      && !obtained.includes(b.id)
  );
}
 
/**
 * prevLevel→newLevel の間に新たに解放された称号を返す（最後のもの）。
 */
function getNewlyUnlockedTitle(prevLevel: number, newLevel: number): string | null {
  const newly = TITLES.filter(
    t => t.level > prevLevel && t.level <= newLevel
  );
  if (newly.length === 0) return null;
  return newly[newly.length - 1].name;
}
 
// ────────────────────────────────────────────────────────────
// ストリーク
// ────────────────────────────────────────────────────────────
 
/**
 * todayDate (YYYY-MM-DD) を受け取り、ストリークを更新した UserProgress を返す。
 * - 初回 or 同日 → そのまま（同日は加算しない）
 * - 前日ログあり → streakDays + 1
 * - それ以外 → streakDays = 1（リセット）
 * ストリーク到達ボーナスEXPも付与する（1日1回まで）。
 */
export function updateStreak(user: UserProgress, todayDate: string): UserProgress {
  const last = user.lastActiveDate;
 
  // 同日は何もしない
  if (last === todayDate) return user;
 
  let newStreak: number;
 
  if (last) {
    const lastMs  = new Date(last).getTime();
    const todayMs = new Date(todayDate).getTime();
    const diffDays = Math.round((todayMs - lastMs) / 86_400_000);
 
    if (diffDays === 1) {
      // 連続
      newStreak = user.streakDays + 1;
    } else {
      // 途切れ
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }
 
  let updated: UserProgress = {
    ...user,
    streakDays:     newStreak,
    lastActiveDate: todayDate,
  };
 
  // ストリークボーナス（丁度その日数に達したときのみ付与）
  for (const bonus of STREAK_BONUSES) {
    if (newStreak === bonus.days) {
      const result = addExp(updated, bonus.exp);
      updated = result.newProgress;
      break; // 複数ボーナスが同日に重複しないよう最初の1つだけ
    }
  }
 
  return updated;
}
 
// ────────────────────────────────────────────────────────────
// 初期値
// ────────────────────────────────────────────────────────────
 
/** 新規ユーザーの初期 UserProgress */
export function createInitialProgress(): UserProgress {
  return {
    level:          1,
    currentExp:     0,
    totalExp:       0,
    streakDays:     0,
    lastActiveDate: "",
    obtainedBadges: ["lv1"], // Lv.1 は最初から取得済み
  };
}