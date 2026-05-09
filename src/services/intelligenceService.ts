// Intelligence service — read-only Firestore access to the finalized
// intelligence collections written by the Electron agent.
//
// CRITICAL: never compute analytics from raw sessions client-side.
// Always read the aggregate docs.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
  type DocumentSnapshot,
  type Query,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  dailyDocId,
  formatDayKey,
  monthlyDocId,
  weeklyDocId,
} from "@/lib/intelligence/keys";
import type {
  ActivityTimelineEntry,
  AnalyticsSnapshot,
  AnomalyEvent,
  DeviceSession,
  EmployeeBehaviorDaily,
  EmployeeBehaviorMonthly,
  EmployeeBehaviorRolling,
  EmployeeBehaviorWeekly,
  LivePresence,
} from "@/lib/intelligence/types";

function companyCol(companyId: string, name: string) {
  return collection(db, "companies", companyId, name);
}

// ── Live presence ────────────────────────────────────────────────────────
export function subscribeLivePresence(
  companyId: string,
  cb: (rows: LivePresence[]) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(
    companyCol(companyId, "live_presence"),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows: LivePresence[] = snap.docs.map(
        (d) => ({ deviceId: d.id, ...(d.data() as Omit<LivePresence, "deviceId">) })
      );
      cb(rows);
    },
    (err) => onError?.(err as Error)
  );
}

export function subscribeUserPresence(
  companyId: string,
  userId: string,
  cb: (row: LivePresence | null) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(
    companyCol(companyId, "live_presence"),
    where("userId", "==", userId),
    limit(1)
  );
  return onSnapshot(
    q,
    (snap) => {
      const d = snap.docs[0];
      cb(d ? ({ deviceId: d.id, ...(d.data() as Omit<LivePresence, "deviceId">) }) : null);
    },
    (err) => onError?.(err as Error)
  );
}

export async function getDevicePresence(
  companyId: string,
  deviceId: string
): Promise<LivePresence | null> {
  const ref = doc(db, "companies", companyId, "live_presence", deviceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { deviceId, ...(snap.data() as Omit<LivePresence, "deviceId">) };
}

// ── Aggregate docs ───────────────────────────────────────────────────────
export async function getEmployeeDaily(
  companyId: string,
  userId: string,
  d: Date = new Date()
): Promise<EmployeeBehaviorDaily | null> {
  const ref = doc(
    db,
    "companies",
    companyId,
    "employee_behavior_daily",
    dailyDocId(userId, d)
  );
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as EmployeeBehaviorDaily) : null;
}

export async function getEmployeeWeekly(
  companyId: string,
  userId: string,
  d: Date = new Date()
): Promise<EmployeeBehaviorWeekly | null> {
  const ref = doc(
    db,
    "companies",
    companyId,
    "employee_behavior_weekly",
    weeklyDocId(userId, d)
  );
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as EmployeeBehaviorWeekly) : null;
}

export async function getEmployeeMonthly(
  companyId: string,
  userId: string,
  d: Date = new Date()
): Promise<EmployeeBehaviorMonthly | null> {
  const ref = doc(
    db,
    "companies",
    companyId,
    "employee_behavior_monthly",
    monthlyDocId(userId, d)
  );
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as EmployeeBehaviorMonthly) : null;
}

export async function getEmployeeRolling(
  companyId: string,
  userId: string
): Promise<EmployeeBehaviorRolling | null> {
  const ref = doc(db, "companies", companyId, "employee_behavior", userId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as EmployeeBehaviorRolling) : null;
}

// Bulk fetch daily aggregate docs for all users in a company on a given date.
// 1 query (orderBy doc id range), bounded by user count.
export async function listAllEmployeeDaily(
  companyId: string,
  d: Date = new Date()
): Promise<EmployeeBehaviorDaily[]> {
  const dayKey = formatDayKey(d);
  // We can't query by doc-id suffix in Firestore — filter by `date` field.
  const q = query(
    companyCol(companyId, "employee_behavior_daily"),
    where("date", "==", dayKey),
    orderBy("counters.totalActiveSeconds", "desc"),
    limit(500)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as EmployeeBehaviorDaily);
}

// ── Activity timeline (paginated feed) ───────────────────────────────────
export interface ActivityPage {
  items: ActivityTimelineEntry[];
  cursor: QueryDocumentSnapshot | null;
}

export async function getActivityPage(
  companyId: string,
  opts: {
    pageSize?: number;
    cursor?: QueryDocumentSnapshot | null;
    userId?: string;
    deviceId?: string;
    since?: Date;
  } = {}
): Promise<ActivityPage> {
  const pageSize = opts.pageSize ?? 50;
  let q: Query = companyCol(companyId, "activity_timeline");
  if (opts.userId) q = query(q, where("userId", "==", opts.userId));
  if (opts.deviceId) q = query(q, where("deviceId", "==", opts.deviceId));
  if (opts.since)
    q = query(q, where("endedAt", ">=", Timestamp.fromDate(opts.since)));

  q = query(q, orderBy("endedAt", "desc"), limit(pageSize));
  if (opts.cursor) q = query(q, startAfter(opts.cursor));

  const snap = await getDocs(q);
  const items = snap.docs.map((d) => d.data() as ActivityTimelineEntry);
  const cursor = snap.docs[snap.docs.length - 1] ?? null;
  return { items, cursor };
}

// ── Anomalies ────────────────────────────────────────────────────────────
export function subscribeRecentAnomalies(
  companyId: string,
  hoursWindow: number,
  cb: (rows: AnomalyEvent[]) => void,
  onError?: (e: Error) => void
): () => void {
  const since = new Date(Date.now() - hoursWindow * 3600 * 1000);
  const q = query(
    companyCol(companyId, "anomaly_events"),
    where("detectedAt", ">=", Timestamp.fromDate(since)),
    orderBy("detectedAt", "desc"),
    limit(200)
  );
  return onSnapshot(
    q,
    (snap) =>
      cb(
        snap.docs.map((d) => ({
          eventId: d.id,
          ...(d.data() as Omit<AnomalyEvent, "eventId">),
        }))
      ),
    (err) => onError?.(err as Error)
  );
}

export async function getAnomaliesPage(
  companyId: string,
  opts: {
    pageSize?: number;
    cursor?: QueryDocumentSnapshot | null;
    severity?: string;
    userId?: string;
    deviceId?: string;
  } = {}
): Promise<{ items: AnomalyEvent[]; cursor: QueryDocumentSnapshot | null }> {
  const pageSize = opts.pageSize ?? 50;
  let q: Query = companyCol(companyId, "anomaly_events");
  if (opts.severity) q = query(q, where("severity", "==", opts.severity));
  if (opts.userId) q = query(q, where("userId", "==", opts.userId));
  if (opts.deviceId) q = query(q, where("deviceId", "==", opts.deviceId));
  q = query(q, orderBy("detectedAt", "desc"), limit(pageSize));
  if (opts.cursor) q = query(q, startAfter(opts.cursor));
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => ({
      eventId: d.id,
      ...(d.data() as Omit<AnomalyEvent, "eventId">),
    })),
    cursor: snap.docs[snap.docs.length - 1] ?? null,
  };
}

// ── Analytics snapshots (intra-day chart) ────────────────────────────────
export async function getSnapshotsForUser(
  companyId: string,
  userId: string,
  since: Date
): Promise<AnalyticsSnapshot[]> {
  const q = query(
    companyCol(companyId, "analytics_snapshots"),
    where("userId", "==", userId),
    where("windowStart", ">=", Timestamp.fromDate(since)),
    orderBy("windowStart", "asc"),
    limit(200)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AnalyticsSnapshot);
}

// ── Device session detail ────────────────────────────────────────────────
export async function getSessionDetail(
  companyId: string,
  sessionId: string
): Promise<DeviceSession | null> {
  const ref = doc(db, "companies", companyId, "device_sessions", sessionId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as DeviceSession) : null;
}

export async function getDeviceSessionsForUser(
  companyId: string,
  userId: string,
  since: Date,
  pageSize = 100
): Promise<DeviceSession[]> {
  const q = query(
    companyCol(companyId, "device_sessions"),
    where("userId", "==", userId),
    where("startedAt", ">=", Timestamp.fromDate(since)),
    orderBy("startedAt", "desc"),
    limit(pageSize)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as DeviceSession);
}

// helper used by hooks to detect whether snapshot is empty without triggering
// an extra getDoc round-trip
export function snapshotExists(s: DocumentSnapshot | null | undefined): boolean {
  return !!s && s.exists();
}
