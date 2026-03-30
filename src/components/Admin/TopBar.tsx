"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/services/profileService";

export default function TopBar() {
  const pathname = usePathname();

  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUserProfile(),
  });

  const getPageTitle = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment) return "Dashboard";
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="admin-top-bar">
      <div className="admin-breadcrumb">
        <a href="/admin/dashboard">
          <span className="material-icons">home</span>
        </a>
        <span className="separator">/</span>
        <span className="current">
          <span className="icon">
            <span className="material-icons" style={{ fontSize: "14px", color: "white" }}>folder</span>
          </span>
          {pageTitle}
        </span>
      </div>
      <div className="admin-top-actions">
        <button className="admin-icon-btn">
          <span className="material-icons">notifications</span>
          <span className="badge"></span>
        </button>
        <button className="admin-icon-btn">
          <span className="material-icons">help_outline</span>
        </button>
        <Link href="/admin/profile">
          <div className="admin-profile-btn">
            {profile?.photoURL ? (
              <Image src={profile.photoURL} alt="Avatar" width={36} height={36} className="avatar-img" />
            ) : (
              <span className="avatar">{profile?.username ? profile.username.charAt(0).toUpperCase() : "A"}</span>
            )}
          </div>
        </Link>
      </div>

      <style jsx>{`
        .admin-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          background: white;
          border-bottom: 1px solid #f0f0f0;
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .admin-breadcrumb {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }

        .admin-breadcrumb a {
          color: #94a3b8;
          text-decoration: none;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .admin-breadcrumb a:hover {
          color: #475569;
        }

        .admin-breadcrumb .separator {
          color: #cbd5e1;
        }

        .admin-breadcrumb .current {
          color: #1e293b;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-breadcrumb .current .icon {
          width: 24px;
          height: 24px;
          background: #f59e0b;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
        }

        .admin-top-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .admin-icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #f1f5f9;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .admin-icon-btn:hover {
          background: #f8fafc;
          color: #1e293b;
          border-color: #e2e8f0;
        }

        .admin-icon-btn .badge {
          position: absolute;
          top: 8px;
          right: 10px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 1px solid white;
        }

        .admin-profile-btn {
          cursor: pointer;
          padding-left: 8px;
          border-left: 1px solid #f1f5f9;
        }

        .admin-profile-btn .avatar {
          width: 36px;
          height: 36px;
          background: #1e293b;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
        }

        .admin-profile-btn .avatar-img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}
