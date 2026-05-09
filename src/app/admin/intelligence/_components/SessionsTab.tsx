"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import type { ActivityTimelineEntry, LivePresence } from "@/lib/intelligence/types";
import { Avatar, EmptyState, LoadingBars } from "./shared";

const PAGE_SIZE = 60;

interface Props {
  companyId: string;
  presence: LivePresence[]; // for user filter dropdown
}

export function SessionsTab({ companyId, presence }: Props) {
  const [items, setItems] = useState<ActivityTimelineEntry[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userFilter, setUserFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  // unique user list from presence as quick selector
  const userOptions = useMemo(() => {
    const map = new Map<string, { userId: string; label: string }>();
    for (const p of presence) {
      if (!map.has(p.userId)) {
        map.set(p.userId, {
          userId: p.userId,
          label: p.userName || p.userEmail || p.userId,
        });
      }
    }
    return Array.from(map.values());
  }, [presence]);

  useEffect(() => {
    if (!companyId) return;
    let alive = true;
    setLoading(true);
    setCursor(null);
    setItems([]);
    getActivityPage(companyId, {
      pageSize: PAGE_SIZE,
      userId: userFilter || undefined,
    })
      .then(({ items, cursor }) => {
        if (!alive) return;
        setItems(items);
        setCursor(cursor);
        setHasMore(items.length === PAGE_SIZE);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [companyId, userFilter]);

  async function loadMore() {
    if (!companyId || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { items: more, cursor: next } = await getActivityPage(companyId, {
        pageSize: PAGE_SIZE,
        cursor,
        userId: userFilter || undefined,
      });
      setItems((prev) => [...prev, ...more]);
      setCursor(next);
      setHasMore(more.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (i) =>
        i.app?.toLowerCase().includes(s) ||
        i.category?.toLowerCase().includes(s) ||
        i.userName?.toLowerCase().includes(s) ||
        i.userEmail?.toLowerCase().includes(s)
    );
  }, [items, search]);

  return (
    <div className="ses">
      <div className="bar">
        <select
          className="user-sel"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        >
          <option value="">Semua karyawan</option>
          {userOptions.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.label}
            </option>
          ))}
        </select>
        <div className="search">
          <span className="material-icons">search</span>
          <input
            placeholder="Cari aplikasi, kategori, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingBars rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="manage_search" message="Tidak ada sesi ditemukan." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Mulai</th>
                <th>Aplikasi</th>
                <th>Kategori</th>
                <th>Mode</th>
                <th>Fokus</th>
                <th>Durasi</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const start = it.startedAt?.toDate?.() ?? new Date();
                const focus = Math.round(it.focusScore || 0);
                const focusColor = focus >= 70 ? "#10b981" : focus >= 40 ? "#f59e0b" : "#ef4444";
                const userLabel = it.userName || it.userEmail || it.userId;
                return (
                  <tr key={it.sessionId}>
                    <td>
                      <Link
                        href={`/admin/intelligence/employee/${encodeURIComponent(it.userId)}`}
                        className="user-link"
                      >
                        <Avatar name={userLabel} size={26} />
                        <span>{userLabel}</span>
                      </Link>
                    </td>
                    <td className="mono">
                      {start.toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="bold">{appDisplayName(it.app)}</td>
                    <td>
                      <span
                        className="cat"
                        style={{
                          background: `${categoryColor(it.category)}1a`,
                          color: categoryColor(it.category),
                        }}
                      >
                        {categoryDisplayName(it.category)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="prod"
                        style={{
                          background: `${productivityColor(it.productivityType)}1a`,
                          color: productivityColor(it.productivityType),
                        }}
                      >
                        {productivityDisplayName(it.productivityType)}
                      </span>
                    </td>
                    <td className="num" style={{ color: focusColor }}>
                      {focus}
                    </td>
                    <td className="num">{formatDuration(it.durationSeconds)}</td>
                    <td>
                      <Link
                        href={`/admin/intelligence/employee/${encodeURIComponent(it.userId)}`}
                        className="open"
                      >
                        <span className="material-icons">open_in_new</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {hasMore && (
            <div className="load-wrap">
              <button onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Memuat..." : "Muat lebih banyak"}
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .ses { display: flex; flex-direction: column; gap: 14px; }

        .bar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 8px;
        }
        .user-sel {
          padding: 8px 12px;
          border-radius: 9px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-family: inherit;
          font-size: 12px;
          color: #0f172a;
          cursor: pointer;
          font-weight: 600;
          flex: 1;
          min-width: 200px;
          max-width: 320px;
        }
        .search {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          padding: 4px 10px;
          flex: 2;
          min-width: 220px;
        }
        .search .material-icons { color: #94a3b8; font-size: 16px; }
        .search input {
          border: none;
          background: transparent;
          width: 100%;
          font-size: 12px;
          font-family: inherit;
          color: #0f172a;
        }
        .search input:focus { outline: none; }

        .table-wrap {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          overflow: hidden;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th, td {
          padding: 11px 14px;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }
        th {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
          background: #fafbfd;
        }
        tbody tr { transition: background 0.15s; }
        tbody tr:hover { background: #fafbfd; }
        .mono { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #475569; }
        .bold { font-weight: 700; color: #0f172a; }
        .num { font-weight: 700; font-variant-numeric: tabular-nums; }
        .cat, .prod {
          padding: 2px 9px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          display: inline-block;
        }
        .prod { border-radius: 99px; }
        .user-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
          text-decoration: none;
          font-weight: 600;
        }
        .user-link:hover { color: #6d28d9; }
        .open {
          color: #94a3b8;
          text-decoration: none;
        }
        .open:hover { color: #6d28d9; }
        .open .material-icons { font-size: 16px; }

        .load-wrap {
          padding: 14px;
          text-align: center;
          border-top: 1px solid #f1f5f9;
        }
        .load-wrap button {
          background: white;
          border: 1px dashed #c4b5fd;
          color: #6d28d9;
          padding: 8px 24px;
          border-radius: 9px;
          font-family: inherit;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }
        .load-wrap button:hover:not(:disabled) { background: #faf5ff; }
        .load-wrap button:disabled { opacity: 0.5; cursor: wait; }
      `}</style>
    </div>
  );
}
