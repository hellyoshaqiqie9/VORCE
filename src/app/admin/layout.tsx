"use client";

import Sidebar from "@/components/Admin/Sidebar";
import TopBar from "@/components/Admin/TopBar";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      // Skip check for login page itself
      if (pathname === "/admin") {
        setIsLoading(false);
        return;
      }

      if (!isAuthenticated()) {
        console.log("Admin layout: Not authenticated, redirecting to /admin");
        router.push("/admin");
      } else {
        console.log("Admin layout: Authenticated");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Admin layout: Error checking auth", error);
      setIsLoading(false);
    }
  }, [router, pathname]);

  // If on the login page, render without sidebar/topbar
  if (pathname === "/admin") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Montserrat, sans-serif" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className={`admin-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar collapsed={sidebarCollapsed} />
      
      {/* Toggle Button */}
      <button 
        className="sidebar-toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <span className="material-icons">
          {sidebarCollapsed ? "chevron_right" : "chevron_left"}
        </span>
      </button>

      <main className="main-content">
        <TopBar />
        <div className="content-wrapper">
          {children}
        </div>
      </main>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #fafafa;
          font-family: 'Montserrat', Arial, sans-serif;
          position: relative;
        }

        .main-content {
          margin-left: 260px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          transition: margin-left 0.3s ease;
        }

        .sidebar-collapsed .main-content {
          margin-left: 0;
        }

        .content-wrapper {
          padding: 32px;
          flex: 1;
        }

        .sidebar-toggle {
          position: fixed;
          left: 248px;
          top: 80px;
          z-index: 1001;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .sidebar-toggle:hover {
          background: #0066FF;
          color: white;
          border-color: #0066FF;
        }

        .sidebar-toggle .material-icons {
          font-size: 18px;
        }

        .sidebar-collapsed .sidebar-toggle {
          left: 16px;
        }

        @media (max-width: 1024px) {
          .main-content {
            margin-left: 0;
          }
          .sidebar-toggle {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
