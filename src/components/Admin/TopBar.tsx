"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/services/profileService";
import { useState } from "react";

interface TopBarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function TopBar({ collapsed, onToggle }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUserProfile(),
  });

  const getPageTitle = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment || lastSegment === "admin") return "Dashboard";
    
    // Custom mapping for a more professional localized look
    const titles: Record<string, string> = {
      "chat": "Pesan & Diskusi",
      "attendance": "Monitoring Kehadiran",
      "izin": "Pengajuan Izin",
      "tasks": "Manajemen Tugas",
      "reimburse": "Klaim Biaya",
      "archive": "Arsip Dokumen",
      "employees": "Data Karyawan",
      "profile": "Profil Saya"
    };
    return titles[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Universalized reload as requested
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const getPageIcon = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment || lastSegment === "admin") return "dashboard";

    const icons: Record<string, string> = {
      "chat": "forum",
      "attendance": "how_to_reg",
      "izin": "event_busy",
      "tasks": "assignment",
      "reimburse": "payments",
      "archive": "inventory_2",
      "employees": "badge",
      "profile": "person",
      "dashboard": "dashboard"
    };
    return icons[lastSegment] || "dashboard";
  };

  const pageTitle = getPageTitle(pathname);
  const pageIcon = getPageIcon(pathname);

  return (
    <div className="admin-top-bar" id="admin-topbar">
      <div className="admin-breadcrumb">
        {collapsed && (
          <button className="sidebar-return-btn" onClick={onToggle} title="Show Sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="3" x2="16" y2="21"></line>
            </svg>
          </button>
        )}
        <Link href="/admin/dashboard" className="home-link">
          <span className="material-icons">home</span>
        </Link>
        <span className="separator">/</span>
        <span className="current">
          <span className="icon">
             <span className="material-icons" style={{ fontSize: "14px", color: "white" }}>{pageIcon}</span>
          </span>
          {pageTitle}
        </span>
      </div>

      <div className="admin-top-actions">
        {/* Global Refresh Trigger */}
        <button 
          className={`action-btn ${isRefreshing ? "spin" : ""}`} 
          onClick={handleRefresh}
          title="Segarkan Halaman"
        >
          <span className="material-icons">refresh</span>
          <span className="btn-label">Segarkan</span>
        </button>

        {/* Global Archive Access */}
        <Link href="/admin/archive">
          <button className="action-btn" title="Arsip">
            <span className="material-icons">history</span>
            <span className="btn-label">Arsip</span>
          </button>
        </Link>

        {pathname.includes("/chat") && (
          <button className="action-btn chat-special" title="Pin Penting">
             <span className="material-icons">push_pin</span>
          </button>
        )}

        <div className="vertical-divider"></div>

        <button className="icon-only-btn" title="Notifikasi">
          <span className="material-icons">notifications</span>
          <span className="badge"></span>
        </button>
        
        <Link href="/admin/profile">
          <div className="admin-profile-btn">
            {profile?.photoURL ? (
              <Image src={profile.photoURL} alt="Avatar" width={34} height={34} className="avatar-img" />
            ) : (
              <span className="avatar-placeholder">{profile?.username ? profile.username.charAt(0).toUpperCase() : "A"}</span>
            )}
            <div className="profile-details">
              <span className="user-name">{profile?.username || "Admin"}</span>
              <span className="user-role">{profile?.role || "Administrator"}</span>
            </div>
          </div>
        </Link>
      </div>

      <style jsx>{`
        .admin-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          background: white;
          border-bottom: 1px solid #f1f5f9;
          position: sticky;
          top: 0;
          z-index: 1001;
          height: 64px;
          min-height: 64px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }

        .admin-breadcrumb { display: flex; align-items: center; gap: 12px; }
        .home-link { color: #94a3b8; transition: color 0.2s; }
        .home-link:hover { color: #0066FF; }
        .separator { color: #e2e8f0; font-weight: 300; }
        .current { display: flex; align-items: center; gap: 12px; font-weight: 700; color: #0f172a; font-size: 15px; }
        .current .icon { width: 28px; height: 28px; background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 102, 255, 0.2); }
        .current .icon .material-icons { font-size: 14px; color: white; }

        .admin-top-actions { display: flex; align-items: center; gap: 10px; }


        .action-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .action-btn:hover { background: white; color: #0066FF; border-color: #0066FF; box-shadow: 0 4px 12px rgba(0, 102, 255, 0.05); }
        .action-btn .material-icons { font-size: 18px; }
        .chat-special { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }

        .divider { width: 1px; height: 32px; background: #f1f5f9; margin-left: 8px; }
        .vertical-divider { width: 1px; height: 32px; background: #f1f5f9; margin: 0 8px; }
        .icon-only-btn { width: 40px; height: 40px; border-radius: 12px; border: none; background: transparent; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; transition: background 0.2s; }
        .icon-only-btn:hover { background: #f1f5f9; color: #0f172a; }

        .badge { position: absolute; top: 10px; right: 10px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 2px solid white; }

        .admin-profile-btn { display: flex; align-items: center; gap: 12px; padding: 6px; background: #f8fafc; border-radius: 14px; border: 1px solid #f1f5f9; margin-left: 8px; transition: all 0.2s; }
        .admin-profile-btn:hover { background: white; border-color: #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .avatar-placeholder { width: 34px; height: 34px; background: #1e293b; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; }
        .avatar-img { width: 34px; height: 34px; border-radius: 10px; object-fit: cover; }
        .profile-details { display: flex; flex-direction: column; padding-right: 8px; }
        .user-name { font-size: 13px; font-weight: 700; color: #1e293b; line-height: 1.2; }
        .user-role { font-size: 11px; color: #94a3b8; font-weight: 500; }
        
        .spin .material-icons { animation: spin 1s infinite linear; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 1200px) { .btn-label { display: none; } }
        .sidebar-return-btn {
          background: none;
          border: none;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          border-radius: 8px;
          transition: all 0.2s;
          margin-right: 4px;
        }

        .sidebar-return-btn:hover {
          background: #f1f5f9;
          color: #0066FF;
        }
      `}</style>
    </div>
  );
}