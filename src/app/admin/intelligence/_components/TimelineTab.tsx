"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
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
import { EmptyState, LoadingBars } from "./shared";

const PAGE_SIZE = 50;

function timeOnly(d: Date): string {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function dateLabel(d: Date): string {
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Hari ini";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

interface Props {
  companyId: string;
}

export function TimelineTab({ companyId }: Props) {
  const [items, setItems] = useState<ActivityTimelineEntry[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<string>("");

  const loadInitial = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { items, cursor } = await getActivityPage(companyId, { pageSize: PAGE_SIZE });
      setItems(items);
      setCursor(cursor);
      setHasMore(items.length === PAGE_SIZE);
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
    } finally {
      setLoadingMore(false);
    }
  }

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
    <div className="tl">
      <div className="bar">
        <div className="pills">
          <button className={!filter ? "pill active" : "pill"} onClick={() => setFilter("")}>
            Semua
          </button>
          {categoryOptions.map((c) => (
            <button
              key={c}
              className={filter === c ? "pill active" : "pill"}
              style={
                filter === c
                  ? {
                      background: `${categoryColor(c)}20`,
                      color: categoryColor(c),
                      borderColor: `${categoryColor(c)}55`,
                    }
                  : undefined
              }
              onClick={() => setFilter(c)}
            >
              {categoryDisplayName(c)}
            </button>
          ))}
        </div>
        <button onClick={loadInitial} className="refresh">
          <span className="material-icons">refresh</span>
          Muat ulang
        </button>
      </div>

      {loading ? (
        <LoadingBars rows={6} />
      ) : groups.length === 0 ? (
        <EmptyState icon="history_toggle_off" message="Belum ada aktivitas tercatat." />
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
        .tl { display: flex; flex-direction: column; gap: 16px; }
        .bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .pill {
          background: white;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 5px 12px;
          border-radius: 99px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pill:hover { border-color: #c4b5fd; color: #6d28d9; }
        .pill.active { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }

        .refresh {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: white;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 6px 12px;
          border-radius: 8px;
          font-family: inherit;
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
        }
        .refresh:hover { border-color: #c4b5fd; color: #6d28d9; background: #faf5ff; }
        .refresh .material-icons { font-size: 14px; }

        .timeline { display: flex; flex-direction: column; gap: 22px; }
        .day-group { display: flex; flex-direction: column; gap: 10px; }
        .day-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          padding: 0 4px;
        }
        .day-label .material-icons { font-size: 16px; color: #7c3aed; }
        .day-count {
          margin-left: auto;
          background: #f1f5f9;
          color: #475569;
          padding: 2px 9px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 800;
        }
        .day-items {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          overflow: hidden;
        }
        .load-more {
          background: white;
          border: 1px dashed #c4b5fd;
          color: #6d28d9;
          padding: 12px;
          border-radius: 10px;
          font-family: inherit;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }
        .load-more:hover:not(:disabled) { background: #faf5ff; }
        .load-more:disabled { opacity: 0.5; cursor: wait; }
      `}</style>
    </div>
  );
}

function Entry({ item }: { item: ActivityTimelineEntry }) {
  const start = item.startedAt?.toDate?.() ?? new Date();
  const end = item.endedAt?.toDate?.() ?? new Date();
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
        <div className="rdot" style={{ background: categoryColor(item.category) }} />
        <div className="rline" />
      </div>
      <div className="content">
        <div className="row1">
          <span
            className="cat"
            style={{
              background: `${categoryColor(item.category)}1a`,
              color: categoryColor(item.category),
            }}
          >
            {categoryDisplayName(item.category)}
          </span>
          <span className="app">{appDisplayName(item.app)}</span>
          <span className="dur">{formatDuration(item.durationSeconds)}</span>
        </div>
        <div className="row2">
          <span className="user">{userLabel}</span>
          <span
            className="prod"
            style={{
              background: `${productivityColor(item.productivityType)}1a`,
              color: productivityColor(item.productivityType),
            }}
          >
            {productivityDisplayName(item.productivityType)}
          </span>
          <span className="focus" style={{ color: focusColor }}>● Fokus {focus}</span>
        </div>
      </div>
      <span className="material-icons chev">chevron_right</span>
      <style jsx>{`
        .entry {
          display: grid;
          grid-template-columns: 95px 28px 1fr 22px;
          gap: 12px;
          padding: 12px 16px;
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
        .rdot {
          width: 10px; height: 10px;
          border-radius: 50%;
          z-index: 1;
          box-shadow: 0 0 0 3px white, 0 0 0 4px #f1f5f9;
        }
        .rline {
          position: absolute;
          top: 0; bottom: 0;
          width: 2px;
          background: #f1f5f9;
        }

        .content { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .row1 { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .cat {
          padding: 2px 9px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .app { font-weight: 700; color: #0f172a; font-size: 13px; }
        .dur {
          margin-left: auto;
          font-size: 11px;
          color: #6d28d9;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
        }
        .row2 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 11px; }
        .user { color: #475569; font-weight: 600; }
        .prod {
          padding: 1px 7px;
          border-radius: 99px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .focus { color: #94a3b8; font-size: 10px; font-weight: 700; }
        .chev { color: #cbd5e1; }
      `}</style>
    </Link>
  );
}
