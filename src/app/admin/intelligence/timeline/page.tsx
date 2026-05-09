"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { useCompanyId } from "@/lib/intelligence/useCompanyId";
import { getActivityPage } from "@/services/intelligenceService";
import {
  appDisplayName,
  categoryColor,
  categoryDisplayName,
  formatDuration,
  productivityColor,
  productivityDisplayName,
} from "@/lib/intelligence/derived";
import type { ActivityTimelineEntry } from "@/lib/intelligence/types";

const PAGE_SIZE = 50;

function timeOnly(d: Date): string {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function dateLabel(d: Date): string {
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return "Hari ini";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  )
    return "Kemarin";
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

export default function ActivityTimelinePage() {
  const { companyId, loading: cidLoading } = useCompanyId();
  const [items, setItems] = useState<ActivityTimelineEntry[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>(""); // category filter

  const loadInitial = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const { items, cursor } = await getActivityPage(companyId, { pageSize: PAGE_SIZE });
      setItems(items);
      setCursor(cursor);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat timeline");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  async function loadMore() {
    if (!companyId || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { items: more, cursor: next } = await getActivityPage(companyId, {
        pageSize: PAGE_SIZE,
        cursor,
      });
      setItems((prev) => [...prev, ...more]);
      setCursor(next);
      setHasMore(more.length === PAGE_SIZE);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat tambahan");
    } finally {
      setLoadingMore(false);
    }
  }

  // Group by day
  const filtered = filter
    ? items.filter((i) => i.category?.toLowerCase() === filter.toLowerCase())
    : items;

  const groups: { dayKey: string; label: string; items: ActivityTimelineEntry[] }[] = [];
  for (const it of filtered) {
    const d = it.endedAt?.toDate?.() ?? new Date();
    const k = d.toISOString().slice(0, 10);
    let g = groups.find((g) => g.dayKey === k);
    if (!g) {
      g = { dayKey: k, label: dateLabel(d), items: [] };
      groups.push(g);
    }
    g.items.push(it);
  }

  const categoryOptions = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean))
  );

  return (
    <div className="tl-page">
      <header className="page-head">
        <div>
          <h1>Activity Timeline</h1>
          <p>
            Feed sesi dari <code>activity_timeline</code> seluruh perangkat
            perusahaan.
          </p>
        </div>
        <button onClick={loadInitial} className="refresh-btn">
          <span className="material-icons">refresh</span>
          Muat ulang
        </button>
      </header>

      <div className="filter-pills">
        <button className={!filter ? "pill active" : "pill"} onClick={() => setFilter("")}>
          Semua
        </button>
        {categoryOptions.map((c) => (
          <button
            key={c}
            className={filter === c ? "pill active" : "pill"}
            style={
              filter === c
                ? { background: `${categoryColor(c)}20`, color: categoryColor(c), borderColor: `${categoryColor(c)}55` }
                : undefined
            }
            onClick={() => setFilter(c)}
          >
            {categoryDisplayName(c)}
          </button>
        ))}
      </div>

      {error && (
        <div className="error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      {loading || cidLoading ? (
        <div className="placeholder">Memuat aktivitas...</div>
      ) : groups.length === 0 ? (
        <div className="placeholder">
          <span className="material-icons">history_toggle_off</span>
          <p>Belum ada aktivitas tercatat.</p>
        </div>
      ) : (
        <div className="timeline">
          {groups.map((g) => (
            <div key={g.dayKey} className="day-group">
              <div className="day-label">
                <span className="material-icons">today</span>
                {g.label}
                <span className="day-count">{g.items.length} sesi</span>
              </div>
              <div className="day-items">
                {g.items.map((it) => (
                  <Entry key={it.sessionId} item={it} />
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <button className="load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Memuat..." : "Muat lebih banyak"}
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .tl-page { display: flex; flex-direction: column; gap: 24px; }

        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .page-head h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
        .page-head p { font-size: 13px; color: #64748b; margin: 0; }
        .page-head code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }

        .refresh-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: white;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 8px 14px;
          border-radius: 10px;
          font-family: inherit;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .refresh-btn:hover { border-color: #c4b5fd; color: #6d28d9; background: #faf5ff; }
        .refresh-btn .material-icons { font-size: 16px; }

        .filter-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pill {
          background: white;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 6px 14px;
          border-radius: 99px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pill:hover { border-color: #c4b5fd; color: #6d28d9; }
        .pill.active { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }

        .timeline { display: flex; flex-direction: column; gap: 28px; }

        .day-group { display: flex; flex-direction: column; gap: 12px; }
        .day-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          padding: 0 4px;
        }
        .day-label .material-icons { font-size: 18px; color: #7c3aed; }
        .day-count {
          margin-left: auto;
          background: #f1f5f9;
          color: #475569;
          padding: 2px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
        }

        .day-items {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          overflow: hidden;
        }

        .placeholder {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 60px;
          text-align: center;
          color: #64748b;
        }
        .placeholder .material-icons { font-size: 56px; color: #cbd5e1; }
        .placeholder p { margin: 10px 0 0; }

        .load-more {
          background: white;
          border: 1px dashed #c4b5fd;
          color: #6d28d9;
          padding: 14px;
          border-radius: 12px;
          font-family: inherit;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .load-more:hover:not(:disabled) { background: #faf5ff; }
        .load-more:disabled { opacity: 0.5; cursor: wait; }

        .error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 14px 18px;
          border-radius: 12px;
          display: flex;
          gap: 10px;
          align-items: center;
        }
      `}</style>
    </div>
  );
}

function Entry({ item }: { item: ActivityTimelineEntry }) {
  const start = item.startedAt?.toDate?.() ?? new Date();
  const end = item.endedAt?.toDate?.() ?? new Date();
  const cat = item.category;
  const prod = item.productivityType;
  const focus = Math.round(item.focusScore || 0);
  const focusColor = focus >= 70 ? "#10b981" : focus >= 40 ? "#f59e0b" : "#ef4444";
  const userLabel = item.userName || item.userEmail || item.userId;

  return (
    <Link
      href={`/admin/intelligence/employee/${encodeURIComponent(item.userId)}`}
      className="entry"
    >
      <div className="time">
        <div className="t1">{timeOnly(start)}</div>
        <div className="dash">→</div>
        <div className="t1">{timeOnly(end)}</div>
      </div>
      <div className="rail">
        <div className="rail-dot" style={{ background: categoryColor(cat) }} />
        <div className="rail-line" />
      </div>
      <div className="content">
        <div className="row1">
          <span
            className="cat-tag"
            style={{ background: `${categoryColor(cat)}1a`, color: categoryColor(cat) }}
          >
            {categoryDisplayName(cat)}
          </span>
          <span className="app">{appDisplayName(item.app)}</span>
          <span className="duration">{formatDuration(item.durationSeconds)}</span>
        </div>
        <div className="row2">
          <span className="user">{userLabel}</span>
          <span
            className="prod-pill"
            style={{ background: `${productivityColor(prod)}1a`, color: productivityColor(prod) }}
          >
            {productivityDisplayName(prod)}
          </span>
          <div className="focus" title={`Focus score ${focus}/100`}>
            <span style={{ color: focusColor }}>●</span>
            Fokus {focus}
          </div>
        </div>
      </div>
      <span className="material-icons chev">chevron_right</span>

      <style jsx>{`
        .entry {
          display: grid;
          grid-template-columns: 100px 32px 1fr 24px;
          gap: 14px;
          padding: 14px 18px;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
        }
        .entry:last-child { border-bottom: none; }
        .entry:hover { background: #fafbfd; }

        .time { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #64748b; font-weight: 600; }
        .t1 { font-family: 'JetBrains Mono', monospace; }
        .dash { color: #cbd5e1; }

        .rail {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .rail-dot {
          width: 12px; height: 12px;
          border-radius: 50%;
          z-index: 1;
          box-shadow: 0 0 0 4px white, 0 0 0 5px #f1f5f9;
        }
        .rail-line {
          position: absolute;
          top: 0; bottom: 0;
          width: 2px;
          background: #f1f5f9;
        }

        .content { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .row1 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .cat-tag {
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .app { font-weight: 700; color: #0f172a; font-size: 14px; }
        .duration {
          margin-left: auto;
          font-size: 12px;
          color: #6d28d9;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }

        .row2 { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 12px; }
        .user { color: #475569; font-weight: 600; }
        .prod-pill {
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
        }
        .focus { color: #94a3b8; font-size: 11px; }
        .focus span { font-size: 10px; margin-right: 2px; }

        .chev { color: #cbd5e1; }
      `}</style>
    </Link>
  );
}
