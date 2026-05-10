// Derived metrics computed from aggregate counter docs.
// Aggregate docs only store raw weighted sums; we divide here.
//
// Semantic split between Focus and Productivity:
//   - Focus    = behavioural engagement quality
//                (active vs idle, switching density, session fragmentation).
//                A user who leaves the browser open but does not type / move
//                MUST score low here, even if a session is "long".
//   - Productivity = semantic work value of the time spent
//                (category-aware: dev > productivity > comms > browsing > …)
//                adjusted by anomaly pressure.
//
// We deliberately stop relying on `focusedWorkSeconds / totalSeconds`
// alone for focus, because the agent classifies any 10+ minute session
// with ≤3 app switches as "focused" even when the user is essentially
// idle on a browser tab.

import type {
  BehaviorCounters,
  CategoryBreakdown,
  EmployeeBehaviorDaily,
  EmployeeBehaviorMonthly,
  EmployeeBehaviorWeekly,
  ProductivityDistribution,
} from "./types";

export function safeDiv(a: number, b: number): number {
  if (!b || !isFinite(b)) return 0;
  const v = a / b;
  return isFinite(v) ? v : 0;
}

function clamp01(v: number): number {
  if (!isFinite(v)) return 0;
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  return v;
}

export interface DerivedDailyMetrics {
  productivityScore: number; // 0..100 — semantic work value
  fatigueScore: number; // 0..100
  healthScore: number; // 0..100
  activeHours: number;
  idleHours: number;
  totalHours: number;
  /** Behavioural focus 0..1 — engagement quality, NOT session continuity. */
  focusRatio: number;
  /** Continuity ratio 0..1 — share of time inside focused/deep_focus/collaboration sessions
   *  (this is what the agent classifies; useful for trend, NOT for headline focus). */
  continuityRatio: number;
  /** Active engagement 0..1 — totalActive/totalSeconds (no switch / fragmentation penalty). */
  activeRatio: number;
  fragmentedRatio: number;
  switchPerHour: number;
  sessionCount: number;
  anomalyCount: number;
  /** Average length of one session in seconds. */
  avgSessionSeconds: number;
}

/**
 * Category → semantic productivity weight (0..1).
 * Tuned to match the user-facing definition:
 *   "Productivity = semantic work value, NOT engagement length."
 */
export function categoryProductivityWeight(key: string): number {
  switch ((key || "").toLowerCase()) {
    case "development":
      return 1.0;
    case "productivity":
      return 0.95;
    case "communication":
      return 0.65;
    case "browser":
    case "browsing":
      return 0.4;
    case "system":
      return 0.3;
    case "entertainment":
      return 0.1;
    default:
      return 0.4;
  }
}

function semanticValueFromCategories(cats: CategoryBreakdown): {
  value: number;
  totalSeconds: number;
} {
  let weighted = 0;
  let total = 0;
  for (const [key, raw] of Object.entries(cats || {})) {
    const v = typeof raw === "number" ? raw : 0;
    if (v <= 0) continue;
    total += v;
    weighted += v * categoryProductivityWeight(key);
  }
  return { value: total > 0 ? weighted / total : 0, totalSeconds: total };
}

export function deriveDailyMetrics(
  d: Pick<EmployeeBehaviorDaily, "counters" | "categories">
): DerivedDailyMetrics {
  const c: BehaviorCounters = d.counters;
  const totalSeconds = Math.max(0, c.totalSeconds || 0);
  const activeSeconds = Math.max(0, c.totalActiveSeconds || 0);
  const idleSeconds = Math.max(0, c.totalIdleSeconds || 0);
  const totalHours = totalSeconds / 3600;
  const sessionCount = Math.max(0, c.sessionCount || 0);
  const switchCount = Math.max(0, c.switchCount || 0);

  const activeRatio = clamp01(safeDiv(activeSeconds, totalSeconds));
  const continuityRatio = clamp01(safeDiv(c.focusedWorkSeconds, totalSeconds));
  const switchPerHour = totalHours > 0 ? switchCount / totalHours : 0;
  const avgSessionSeconds = sessionCount > 0 ? totalSeconds / sessionCount : 0;

  // Behavioural-focus penalties.
  //   Switch density:  ≤6 sw/h is healthy, ≥24 sw/h kills focus.
  //   Fragmentation:   sessions <6 min average → linear penalty.
  const switchPenalty = clamp01((switchPerHour - 6) / 18);
  const fragmentPenalty =
    avgSessionSeconds > 0 && avgSessionSeconds < 360
      ? clamp01((360 - avgSessionSeconds) / 360)
      : 0;
  const focusRatio =
    activeRatio * (1 - 0.5 * switchPenalty) * (1 - 0.3 * fragmentPenalty);

  // Semantic productivity score (category-aware) blended with engagement.
  // 70% semantic value, 30% engagement so that a productive app left idle
  // still loses points but not catastrophically.
  const sem = semanticValueFromCategories(d.categories || {});
  const engagementBlend = activeRatio;
  const blended = 0.7 * sem.value + 0.3 * engagementBlend;
  const anomalyAdj = clamp01(1 - 0.04 * (c.anomalyCount || 0));
  const productivityScore = Math.min(100, blended * 100 * (0.6 + 0.4 * anomalyAdj));

  return {
    productivityScore,
    fatigueScore: safeDiv(c.fatigueWeightedSum, totalSeconds),
    healthScore: safeDiv(c.healthWeightedSum, totalSeconds),
    activeHours: activeSeconds / 3600,
    idleHours: idleSeconds / 3600,
    totalHours,
    focusRatio,
    continuityRatio,
    activeRatio,
    fragmentedRatio: clamp01(safeDiv(c.fragmentedWorkSeconds, totalSeconds)),
    switchPerHour,
    sessionCount,
    anomalyCount: Math.max(0, c.anomalyCount || 0),
    avgSessionSeconds,
  };
}

// Derive the same metrics from a weekly/monthly doc — they share the same shape.
export function deriveAggregateMetrics(
  d: Pick<EmployeeBehaviorWeekly | EmployeeBehaviorMonthly, "counters" | "categories">
): DerivedDailyMetrics {
  return deriveDailyMetrics(d);
}

// Top-N helper for app/category breakdowns
export function topEntries(
  obj: Record<string, number | undefined>,
  limit = 5
): { key: string; seconds: number }[] {
  return Object.entries(obj || {})
    .filter(([, v]) => typeof v === "number" && (v as number) > 0)
    .map(([key, v]) => ({ key, seconds: v as number }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, limit);
}

export function totalCategorySeconds(cats: CategoryBreakdown): number {
  return Object.values(cats || {}).reduce<number>(
    (acc, v) => acc + (typeof v === "number" ? v : 0),
    0
  );
}

export function categoryPercentages(
  cats: CategoryBreakdown
): { key: string; seconds: number; pct: number }[] {
  const total = totalCategorySeconds(cats);
  return Object.entries(cats || {})
    .filter(([, v]) => typeof v === "number" && v > 0)
    .map(([key, v]) => ({
      key,
      seconds: v as number,
      pct: total ? ((v as number) / total) * 100 : 0,
    }))
    .sort((a, b) => b.seconds - a.seconds);
}

export function productivityPercentages(
  dist: ProductivityDistribution
): { key: string; seconds: number; pct: number }[] {
  const total = Object.values(dist || {}).reduce<number>(
    (acc, v) => acc + (v || 0),
    0
  );
  return Object.entries(dist || {})
    .filter(([, v]) => typeof v === "number" && v > 0)
    .map(([key, v]) => ({
      key,
      seconds: v as number,
      pct: total ? ((v as number) / total) * 100 : 0,
    }))
    .sort((a, b) => b.seconds - a.seconds);
}

// ── App-level intelligence ───────────────────────────────────────────────
// We don't have per-app active-vs-idle splits in the aggregate doc, but we
// can still classify each app on the same axes the dashboard uses: a
// productivity weight (semantic), a category, and an "engagement" hint
// derived from the dominant productivity bucket of the user's day.
//
// The result is good enough to chip badges next to each top app row.

export type AppCategoryKey =
  | "development"
  | "productivity"
  | "communication"
  | "browser"
  | "entertainment"
  | "system"
  | "other";

const APP_CATEGORY_HINTS: Array<[RegExp, AppCategoryKey]> = [
  [/(code|studio|windsurf|cursor|intellij|webstorm|pycharm|rider|sublime|vim|neovim|atom|electron|terminal|cmd|powershell|git|docker)/i, "development"],
  [/(figma|sketch|notion|obsidian|excel|word|powerpoint|outlook|sheets|docs|slides|jira|linear|trello|monday|asana|salesforce|hubspot|zendesk)/i, "productivity"],
  [/(slack|teams|zoom|meet|discord|skype|webex|telegram|whatsapp|signal|gmail|mail)/i, "communication"],
  [/(youtube|netflix|spotify|twitch|tiktok|instagram|facebook|reddit|steam|epic|riot|valorant|league|game)/i, "entertainment"],
  [/(chrome|firefox|edge|brave|opera|safari|vivaldi|arc)/i, "browser"],
  [/(explorer|finder|task[\s_]?manager|registry|control[\s_]?panel|settings|snipping|search)/i, "system"],
];

export function inferAppCategory(appKey: string): AppCategoryKey {
  const k = (appKey || "").toLowerCase();
  for (const [re, cat] of APP_CATEGORY_HINTS) {
    if (re.test(k)) return cat;
  }
  return "other";
}

export interface AppIntelEntry {
  key: string;
  seconds: number;
  pctOfTotal: number;
  category: AppCategoryKey;
  /** Productivity weight 0..100. */
  productiveScore: number;
  /** True when this app pulls focus down (entertainment / passive browsing). */
  distraction: boolean;
  /** True for apps with strong work value. */
  productive: boolean;
}

export function rankAppIntel(
  appUsage: Record<string, number> | undefined,
  totalSeconds: number,
  limit = 8
): AppIntelEntry[] {
  const entries = Object.entries(appUsage || {})
    .filter(([, v]) => typeof v === "number" && (v as number) > 0)
    .map(([key, v]) => {
      const seconds = v as number;
      const category = inferAppCategory(key);
      const weight = categoryProductivityWeight(category);
      return {
        key,
        seconds,
        pctOfTotal: totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0,
        category,
        productiveScore: Math.round(weight * 100),
        distraction: weight <= 0.3,
        productive: weight >= 0.65,
      } as AppIntelEntry;
    })
    .sort((a, b) => b.seconds - a.seconds);
  return entries.slice(0, limit);
}

// Format helpers for UI.
//
// NOTE on the unit suffix: the previous version returned "Nd" for sub-minute
// values where "d" stood for "detik" (Indonesian for "seconds"). In a UI
// shared with users who read English, "55d" reads as "55 days" — wildly
// wrong. We now use "s" (universal) below the minute, "m" between
// minute and hour, and "j m" above the hour.
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s < 60) return `${s}s`;
  const totalMinutes = Math.floor(s / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}

export function formatHours(hours: number): string {
  if (!isFinite(hours) || hours <= 0) return "0m";
  return formatDuration(hours * 3600);
}

// Map sanitized Firestore key → human display name
const APP_DISPLAY: Record<string, string> = {
  code_exe: "VS Code",
  windsurf: "Windsurf",
  chrome: "Chrome",
  firefox: "Firefox",
  msedge: "Edge",
  edge: "Edge",
  discord: "Discord",
  slack: "Slack",
  whatsapp: "WhatsApp",
  spotify: "Spotify",
  notion: "Notion",
  figma: "Figma",
  zoom: "Zoom",
  teams: "Microsoft Teams",
  outlook: "Outlook",
  word: "Word",
  excel: "Excel",
  powerpoint: "PowerPoint",
  explorer: "File Explorer",
  cmd: "Command Prompt",
  powershell: "PowerShell",
  terminal: "Terminal",
};

export function appDisplayName(key: string): string {
  if (!key) return "Tidak diketahui";
  const k = key.toLowerCase();
  if (APP_DISPLAY[k]) return APP_DISPLAY[k];
  return key
    .replace(/_/g, " ")
    .replace(/\.exe$/i, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const CATEGORY_DISPLAY: Record<string, string> = {
  development: "Pengembangan",
  productivity: "Produktivitas",
  communication: "Komunikasi",
  browser: "Browsing",
  browsing: "Browsing",
  entertainment: "Hiburan",
  system: "Sistem",
  other: "Lainnya",
};

export function categoryDisplayName(key: string): string {
  return CATEGORY_DISPLAY[key?.toLowerCase()] || key || "Lainnya";
}

const PRODUCTIVITY_DISPLAY: Record<string, string> = {
  deep_focus: "Fokus Mendalam",
  focused: "Fokus",
  fragmented: "Terpecah",
  collaboration: "Kolaborasi",
  exploration: "Eksplorasi",
  leisure: "Santai",
  general: "Umum",
};

export function productivityDisplayName(key: string): string {
  return PRODUCTIVITY_DISPLAY[key?.toLowerCase()] || key || "Umum";
}

// Color tokens consistent with VORCE theme
export const CATEGORY_COLOR: Record<string, string> = {
  development: "#7c3aed",
  productivity: "#3b82f6",
  communication: "#10b981",
  browser: "#06b6d4",
  browsing: "#06b6d4",
  entertainment: "#f59e0b",
  system: "#94a3b8",
  other: "#64748b",
};

export function categoryColor(key: string): string {
  return CATEGORY_COLOR[key?.toLowerCase()] || "#64748b";
}

export const PRODUCTIVITY_COLOR: Record<string, string> = {
  deep_focus: "#7c3aed",
  focused: "#3b82f6",
  fragmented: "#f59e0b",
  collaboration: "#10b981",
  exploration: "#06b6d4",
  leisure: "#94a3b8",
  general: "#64748b",
};

export function productivityColor(key: string): string {
  return PRODUCTIVITY_COLOR[key?.toLowerCase()] || "#64748b";
}

export const SEVERITY_COLOR: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#7f1d1d",
};

export function severityColor(key: string): string {
  return SEVERITY_COLOR[key?.toLowerCase()] || "#64748b";
}

// Productivity rating thresholds
export function productivityLabel(score: number): string {
  if (score >= 80) return "Sangat Tinggi";
  if (score >= 65) return "Tinggi";
  if (score >= 50) return "Sedang";
  if (score >= 30) return "Rendah";
  return "Sangat Rendah";
}

/** Behavioural focus rating used when displaying focus % alongside its meaning. */
export function focusLabel(ratio: number): string {
  if (ratio >= 0.75) return "Sangat Engaged";
  if (ratio >= 0.55) return "Engaged";
  if (ratio >= 0.35) return "Sebagian Engaged";
  if (ratio >= 0.15) return "Pasif";
  return "Tidak Aktif";
}

export function presenceLabel(state: string): string {
  if (state === "active") return "Aktif";
  if (state === "idle") return "Tidak Aktif";
  if (state === "away") return "Tidak Hadir";
  return state || "Tidak Diketahui";
}
