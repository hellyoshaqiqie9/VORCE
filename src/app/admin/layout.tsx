"use client";

import Sidebar from "@/components/Admin/Sidebar";
import TopBar from "@/components/Admin/TopBar";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Providers from "@/components/Providers";
import { isAuthenticated, logout } from "@/lib/auth";
import { getUserProfile } from "@/services/profileService";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isFullBleedPage = pathname === "/admin/chat" || pathname === "/admin/attendance";
  const isNoPageScroll = pathname.startsWith("/admin/tasks") || pathname === "/admin/attendance";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (pathname === "/admin") {
          setIsLoading(false);
          return;
        }

        if (!isAuthenticated()) {
          router.push("/admin");
          return;
        }

        // Verify session with backend if we haven't checked yet
        // OR if this is the initial load
        try {
          await getUserProfile(); // This will throw 401 if invalid
          setIsLoading(false);
        } catch (error: any) {
          if (error.message?.includes("401") || error.message?.includes("login ulang")) {
            logout();
            router.push("/admin");
          } else {
            // Other network errors - maybe keep logged in but show warning?
            // For now, allow entry if it's just a network hiccup
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Admin layout auth check failed", error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (pathname === "/admin") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div
        suppressHydrationWarning
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "Montserrat, sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <Providers>
      <div
        className={`admin-layout ${
          sidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="main-content">
          <TopBar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <div
            className={`content-wrapper ${
              isFullBleedPage ? "no-padding" : ""
            } ${isNoPageScroll ? "no-page-scroll" : ""}`}
          >
            {children}
          </div>
        </main>

        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            background: #fafafa;
          }

          .admin-layout {
            display: flex;
            height: 100vh;
            overflow: hidden;
            background: #fafafa;
            font-family: "Montserrat", Arial, sans-serif;
            position: relative;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }

          .admin-layout input,
          .admin-layout textarea,
          .admin-layout [contenteditable="true"] {
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
          }

          .main-content {
            margin-left: 260px;
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 0;
            transition: margin-left 0.3s ease;
          }

          .sidebar-collapsed .main-content {
            margin-left: 0;
          }

          .content-wrapper {
            padding: 32px;
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            overflow-y: auto;
          }

          .content-wrapper.no-padding {
            padding: 0;
            overflow: hidden;
          }

          .content-wrapper.no-page-scroll {
            overflow: hidden;
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
    </Providers>
  );
}
