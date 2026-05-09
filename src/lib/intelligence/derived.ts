// Derived metrics computed from aggregate counter docs.
// Aggregate docs only store raw weighted sums; we divide here.

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

export interface DerivedDailyMetrics {
  productivityScore: number; // 0..100
  fatigueScore: number; // 0..100
  healthScore: number; // 0..100
  activeHours: number;
  idleHours: number;
  totalHours: number;
  focusRatio: number; // 0..1
  fragmentedRatio: number;
  switchPerHour: number;
  sessionCount: number;
  anomalyCount: number;
}

export function deriveDailyMetrics(
  d: Pick<EmployeeBehaviorDaily, "counters">
): DerivedDailyMetrics {
  const c: BehaviorCounters = d.counters;
  const totalHours = c.totalSeconds / 3600;
  return {
    productivityScore: safeDiv(c.productivityWeightedSum, c.productivityTotalSeconds),
    fatigueScore: safeDiv(c.fatigueWeightedSum, c.totalSeconds),
    healthScore: safeDiv(c.healthWeightedSum, c.totalSeconds),
    activeHours: c.totalActiveSeconds / 3600,
    idleHours: c.totalIdleSeconds / 3600,
    totalHours,
    focusRatio: safeDiv(c.focusedWorkSeconds, c.totalSeconds),
    fragmentedRatio: safeDiv(c.fragmentedWorkSeconds, c.totalSeconds),
    switchPerHour: totalHours > 0 ? c.switchCount / totalHours : 0,
    sessionCount: c.sessionCount,
    anomalyCount: c.anomalyCount,
  };
}

// Derive the same metrics from a weekly/monthly doc — they share the same counters shape.
export function deriveAggregateMetrics(
  d: Pick<EmployeeBehaviorWeekly | EmployeeBehaviorMonthly, "counters">
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

// Format helpers for UI
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return `${Math.round(seconds || 0)}d`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}

export function formatHours(hours: number): string {
  if (!isFinite(hours) || hours <= 0) return "0j";
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

export function presenceLabel(state: string): string {
  if (state === "active") return "Aktif";
  if (state === "idle") return "Tidak Aktif";
  if (state === "away") return "Tidak Hadir";
  return state || "Tidak Diketahui";
}
