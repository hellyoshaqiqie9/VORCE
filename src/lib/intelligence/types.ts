// Firestore intelligence collection types
// Aligned with the finalized Electron agent pipeline.
// DO NOT compute analytics from raw sessions — read aggregate docs.

import type { Timestamp } from "firebase/firestore";

export type PresenceState = "active" | "idle" | "away";

export interface LivePresence {
  deviceId: string;
  companyId: string;
  userId: string;
  userEmail: string;
  userName: string;

  currentApp: string;
  currentCategory: string;
  activeWindow: string;
  executable: string;

  cpuNow: number;
  ramNow: number;
  state: PresenceState;
  healthScore: number;

  sessionId: string | null;
  sessionStartedAt: Timestamp | null;
  lastHeartbeat: Timestamp;
  updatedAt: Timestamp;
}

export type ProductivityType =
  | "deep_focus"
  | "focused"
  | "fragmented"
  | "collaboration"
  | "exploration"
  | "leisure"
  | "general";

export interface DeviceSession {
  sessionId: string;
  companyId: string;
  userId: string;
  deviceId: string;
  app: string;
  category: string;
  windowTitle: string;
  executable: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
  durationSeconds: number;
  switchCount: number;
  cpuAverage: number;
  cpuPeak: number;
  ramAverage: number;
  ramPeak: number;
  idleRatio: number;
  productivityType: ProductivityType;
  focusScore: number;
  anomalyDetected: boolean;
  behaviorTag: string;
  createdAt: Timestamp;
}

export interface ActivityTimelineEntry {
  sessionId: string;
  deviceId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  app: string;
  category: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
  durationSeconds: number;
  productivityType: string;
  focusScore: number;
  createdAt: Timestamp;
}

export type AnomalySeverity = "low" | "medium" | "high" | "critical";
export type AnomalyType =
  | "cpu_spike"
  | "ram_pressure"
  | "high_switching"
  | "prolonged_idle"
  | string;

export interface AnomalyEvent {
  eventId: string;
  deviceId: string;
  companyId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  metricSnapshot: { cpu?: number; ram?: number; switchCount?: number };
  detectedAt: Timestamp;
  createdAt: Timestamp;
}

export interface AnalyticsSnapshot {
  snapshotId: string;
  companyId: string;
  userId: string;
  deviceId: string;
  windowStart: Timestamp;
  windowEnd: Timestamp;
  productivityScore: number;
  fatigueScore: number;
  totalActiveSeconds: number;
  totalIdleSeconds: number;
  switchCount: number;
  dominantCategory: string;
  dominantApp: string;
  createdAt: Timestamp;
}

export interface BehaviorCounters {
  sessionCount: number;
  totalSeconds: number;
  totalActiveSeconds: number;
  totalIdleSeconds: number;
  switchCount: number;
  anomalyCount: number;
  focusedWorkSeconds: number;
  fragmentedWorkSeconds: number;
  productivityWeightedSum: number;
  productivityTotalSeconds: number;
  fatigueWeightedSum: number;
  healthWeightedSum: number;
}

export type CategoryBreakdown = Partial<Record<
  | "development"
  | "productivity"
  | "communication"
  | "browser"
  | "entertainment"
  | "system"
  | "other",
  number
>> & { [key: string]: number | undefined };

export type ProductivityDistribution = Partial<Record<ProductivityType, number>>;

export interface EmployeeBehaviorDaily {
  userId: string;
  companyId: string;
  date: string;
  year: number;
  month: number;
  day: number;
  counters: BehaviorCounters;
  categories: CategoryBreakdown;
  appUsage: Record<string, number>;
  productivityDistribution: ProductivityDistribution;
  lastSessionId: string;
  generatedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DailyTrendEntry {
  sessionCount: number;
  totalSeconds: number;
  totalActiveSeconds: number;
  productivityWeightedSum: number;
  productivityTotalSeconds: number;
}

export interface EmployeeBehaviorWeekly extends EmployeeBehaviorDaily {
  weekKey: string;
  week: number;
  dailyTrend: Record<string, DailyTrendEntry>;
}

export interface WeeklyTrendEntry {
  sessionCount: number;
  totalSeconds: number;
  productivityWeightedSum: number;
  productivityTotalSeconds: number;
}

export interface EmployeeBehaviorMonthly extends EmployeeBehaviorDaily {
  monthKey: string;
  weeklyTrend: Record<string, WeeklyTrendEntry>;
}

export interface EmployeeBehaviorRolling {
  userId: string;
  companyId: string;
  totalSessions: number;
  totalActiveSeconds: number;
  lastSessionId: string;
  lastSessionAt: Timestamp;
  lastFocusScore: number;
  lastCategory: string;
  lastApp: string;
  updatedAt: Timestamp;
}
