"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { logout, getUserData } from "@/lib/auth";
import { subscribeMessages, getGroups } from "@/services/chatService";
import { getAccounts, getFolders } from "@/services/inboxService";
import { getUserProfile } from "@/services/profileService";

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadInbox, setUnreadInbox] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const initChat = async () => {
      try {
        const groups = await getGroups();
        if (groups.length > 0) {
          unsubscribe = subscribeMessages(groups[0].id, (messages) => {
             const recent = messages.length > 5 ? 5 : messages.length;
             setUnreadChat(recent);
          });
        }
      } catch (e) {
        console.error("Sidebar chat count error:", e);
      }
    };
    initChat();
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    const fetchInboxCount = async () => {
      try {
        const accounts = await getAccounts();
        if (accounts.length > 0) {
          const folders = await getFolders(accounts[0].emailAddress);
          const inbox = folders.find(f => f.name.toUpperCase() === "INBOX");
          setUnreadInbox(inbox?.unreadMessages || 0);
        }
      } catch (e) {
        console.error("Sidebar inbox count error:", e);
      }
    };
    fetchInboxCount();
    const interval = setInterval(fetchInboxCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => pathname === path ? "active" : "";

  return (
    <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="admin-sidebar-header">
        <div className="admin-logo">
          <Image src="/vorce-logo.svg" alt="Vorce" width={28} height={28} />
          <span>Vorce HR</span>
        </div>
        <span className="material-icons admin-expand-icon">unfold_more</span>
      </div>

      <div className="admin-search-box">
        <span className="material-icons">search</span>
        <input type="text" placeholder="Cari..." />
        <span className="shortcut">⌘F</span>
      </div>

      <nav className="admin-nav-section">
        <Link href="/admin/dashboard" className={`admin-nav-item ${isActive("/admin/dashboard")}`}>
          <span className="material-icons">home</span>
          Beranda
        </Link>
        <Link href="/admin/attendance" className={`admin-nav-item ${isActive("/admin/attendance")}`}>
          <span className="material-icons">location_on</span>
          Kehadiran
        </Link>
        <Link href="/admin/izin" className={`admin-nav-item ${isActive("/admin/izin")}`}>
          <span className="material-icons">event_note</span>
          Izin
        </Link>
        <Link href="/admin/tasks" className={`admin-nav-item ${isActive("/admin/tasks")}`}>
          <span className="material-icons">assignment</span>
          Tugas
        </Link>
        <Link href="/admin/reimburse" className={`admin-nav-item ${isActive("/admin/reimburse")}`}>
          <span className="material-icons">receipt_long</span>
          Reimburse
        </Link>
        <Link href="/admin/archive" className={`admin-nav-item ${isActive("/admin/archive")}`}>
          <span className="material-icons">archive</span>
          Arsip
        </Link>
        <Link href="/admin/berkas" className={`admin-nav-item ${isActive("/admin/berkas")}`}>
          <span className="material-icons">folder</span>
          Berkas
        </Link>

        <Link href="/admin/chat" className={`admin-nav-item ${isActive("/admin/chat")}`}>
          <span className="material-icons">chat</span>
          Pesan
          {unreadChat > 0 && <span className="badge notification">{unreadChat}</span>}
        </Link>
        <Link href="/admin/inbox" className={`admin-nav-item ${isActive("/admin/inbox")}`}>
          <span className="material-icons">email</span>
          Inbox
          {unreadInbox > 0 && <span className="badge notification">{unreadInbox}</span>}
        </Link>
        <Link href="/admin/contacts" className={`admin-nav-item ${isActive("/admin/contacts")}`}>
          <span className="material-icons">contacts</span>
          Kontak
        </Link>
        <Link href="/admin/employees" className={`admin-nav-item ${isActive("/admin/employees")}`}>
          <span className="material-icons">people</span>
          Karyawan
        </Link>
        <Link href="/admin/assets" className={`admin-nav-item ${isActive("/admin/assets")}`}>
          <span className="material-icons">devices</span>
          Kontrol Aset
        </Link>
        <Link href="/admin/recorder" className={`admin-nav-item ${isActive("/admin/recorder")}`}>
          <span className="material-icons">mic</span>
          Perekam
        </Link>
      </nav>


      <div className="admin-nav-divider"></div>

      <nav className="admin-nav-section">
        <div className="admin-nav-label">CMS & Pengaturan</div>
        <Link href="/admin/editor" className={`admin-nav-item ${isActive("/admin/editor")}`}>
          <span className="material-icons">edit_note</span>
          Editor Konten
        </Link>
        <Link href="/admin/company" className={`admin-nav-item ${isActive("/admin/company")}`}>
          <span className="material-icons">business</span>
          Perusahaan
        </Link>
        <Link href="/admin/info" className={`admin-nav-item ${isActive("/admin/info")}`}>
          <span className="material-icons">info</span>
          Info
        </Link>
      </nav>

      <div className="admin-nav-divider"></div>

      <div className="admin-user-section">
        <Link href="/admin/company" className="admin-user-item">
          <div className="admin-user-avatar">AS</div>
          <span>Acme Startup</span>
        </Link>
      </div>

      <div className="admin-sidebar-footer">
        <button onClick={() => { logout(); router.push("/admin"); }} className="admin-logout-btn">
          <span className="material-icons">logout</span>
          Keluar
        </button>

        <div className="admin-back-to-site">
          <Link href="/" className="admin-nav-item">
            <span className="material-icons">arrow_back</span>
            Kembali ke Website
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .admin-sidebar {
          width: 280px;
          height: 100vh;
          background: #ffffff;
          border-right: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          overflow-y: auto;
          z-index: 100;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 2px 0 8px rgba(0,0,0,0.02);
        }

        .admin-sidebar.collapsed {
          transform: translateX(-100%);
        }

        .admin-sidebar-header {
          padding: 24px 28px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .admin-sidebar-header .admin-logo {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .admin-sidebar-header .admin-logo span {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.5px;
        }

        .admin-sidebar-header .admin-expand-icon {
          margin-left: auto;
          color: #94a3b8;
          font-size: 20px;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .admin-sidebar-header .admin-expand-icon:hover {
          color: #64748b;
        }

        .admin-search-box {
          margin: 0 24px 24px;
          position: relative;
        }

        .admin-search-box input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13px;
          font-family: 'Montserrat', sans-serif;
          background: #f8fafc;
          transition: all 0.2s;
          color: #334155;
        }

        .admin-search-box input:focus {
          outline: none;
          border-color: #3b82f6;
          background: #fff;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
        }

        .admin-search-box .material-icons {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 20px;
        }

        .admin-search-box .shortcut {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: #fff;
          border: 1px solid #cbd5e1;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 10px;
          color: #64748b;
          font-weight: 700;
        }

        .admin-nav-section {
          padding: 0 16px;
        }

        .admin-nav-label {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin: 24px 16px 8px;
        }

        .admin-nav-item {
          display: flex !important;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          color: #64748b;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          margin-bottom: 2px;
          width: 100%;
          box-sizing: border-box;
          position: relative;
        }

        .admin-nav-item:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .admin-nav-item.active {
          background: #eff6ff;
          color: #0066FF;
        }
        
        .admin-nav-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 20px;
            background: #0066FF;
            border-radius: 0 4px 4px 0;
            display: none;
        }

        .admin-nav-item .material-icons {
          font-size: 22px;
          color: #94a3b8;
          transition: color 0.2s;
        }

        .admin-nav-item:hover .material-icons {
          color: #64748b;
        }

        .admin-nav-item.active .material-icons {
          color: #0066FF;
        }

        .admin-nav-item .badge {
          margin-left: auto;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 11px;
          color: #64748b;
          font-weight: 700;
        }

        .admin-nav-item .badge.notification {
          background: #ef4444;
          color: white;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-nav-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 16px 32px;
        }

        .admin-user-section {
          padding: 0 16px;
          margin-top: 8px;
        }

        .admin-user-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .admin-user-item:hover {
          background: #fff;
          border-color: #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .admin-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 4px 8px rgba(0, 102, 255, 0.2);
        }

        .admin-sidebar-footer {
          margin-top: auto;
          padding: 24px;
          border-top: 1px solid #f1f5f9;
          background: #fcfcfc;
        }

        .admin-logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
          background: white;
          width: 100%;
          font-family: 'Montserrat', sans-serif;
          border: 1px solid #f1f5f9;
        }

        .admin-logout-btn:hover {
          background: #fef2f2;
          color: #ef4444;
          border-color: #fee2e2;
        }

        .admin-back-to-site {
          margin-top: 12px;
        }
        
        .admin-back-to-site .admin-nav-item {
           font-size: 13px;
        }
      `}</style>
    </aside>
  );
}
