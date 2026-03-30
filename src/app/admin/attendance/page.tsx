"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import ArchiveModal from "@/components/Admin/ArchiveModal";
import { getAccessToken, getUserData } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { fetchAbsensiData, ApiAbsensi } from "@/services/absensiService";
import { getAllUsers, AppUser } from "@/services/usersService";

const MAPBOX_TOKEN = "pk.eyJ1IjoiaGVsbHlvc2hhcWlxaWUiLCJhIjoiY200OWw2a2tlMDRkdDJpcjF1Y2d2cGl1NyJ9.h_Hs-sARvb30CHyRaTclOA";
const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

interface Employee {
  id: string;
  name: string;
  initials: string;
  position: string;
  checkIn: string;
  checkOut?: string;
  status: "on-time" | "late" | "absent";
  lat: number;
  lng: number;
  avatar: string;
  location: string;
  shift: "pagi" | "siang" | "malam";
  photo?: string;
  address?: string;
}

/**
 * Resolve user name from users directory.
 * Checks by email, userId, or displayName fields.
 */
function resolveNameFromUsers(item: ApiAbsensi, usersMap: Map<string, AppUser>): string {
  // 1. Try matching by email
  if (item.email) {
    const byEmail = usersMap.get(item.email.toLowerCase());
    if (byEmail?.name) return byEmail.name;
  }
  // 2. Try matching by id as userId
  if (item.id) {
    const byId = usersMap.get(item.id);
    if (byId?.name) return byId.name;
  }
  // 3. Fallback to displayName from attendance API itself
  if (item.displayName && item.displayName !== "Unknown") return item.displayName;
  // 4. Extract from email
  if (item.email) return item.email.split("@")[0];
  return "Unknown";
}

/**
 * Convert API response to Employee format, enriched with users directory data
 */
function mapApiToEmployee(item: ApiAbsensi, index: number, usersMap: Map<string, AppUser>): Employee {
  const name = resolveNameFromUsers(item, usersMap);
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // Resolve avatar from users directory
  const userByEmail = item.email ? usersMap.get(item.email.toLowerCase()) : undefined;
  const avatarUrl = userByEmail?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=100`;
  const photoUrl = userByEmail?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=400`;

  // Parse check-in/check-out times
  let checkIn = "-";
  let checkOut: string | undefined;
  if (item.waktuMasuk) {
    const d = new Date(item.waktuMasuk);
    checkIn = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  if (item.waktuPulang) {
    const d = new Date(item.waktuPulang);
    checkOut = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  // Determine status
  let status: "on-time" | "late" | "absent" = "on-time";
  const s = (item.status || "").toLowerCase();
  if (s === "alpha" || s === "absent" || s === "tidak hadir") {
    status = "absent";
  } else if (s === "izin" || s === "sakit") {
    status = "absent"; 
  } else if (item.waktuMasuk) {
    const checkInHour = new Date(item.waktuMasuk).getHours();
    const checkInMinute = new Date(item.waktuMasuk).getMinutes();
    if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0)) {
      status = "late";
    }
  }

  // Determine shift based on check-in time
  let shift: "pagi" | "siang" | "malam" = "pagi";
  if (item.waktuMasuk) {
    const hour = new Date(item.waktuMasuk).getHours();
    if (hour >= 20 || hour < 6) shift = "malam";
    else if (hour >= 12) shift = "siang";
  }

  // Spread employees on map around Jakarta center
  const baseLat = -6.2088;
  const baseLng = 106.8456;
  const lat = baseLat + (Math.random() - 0.5) * 0.04;
  const lng = baseLng + (Math.random() - 0.5) * 0.06;

  return {
    id: item.id || `emp-${index}`,
    name,
    initials,
    position: "-",
    checkIn,
    checkOut,
    status,
    lat,
    lng,
    avatar: avatarUrl,
    location: item.lokasiMasuk || "-",
    shift,
    photo: photoUrl,
    address: item.lokasiPulang || item.lokasiMasuk || "-",
  };
}

/**
 * Get today's date range in ISO format
 */
function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}


export default function AttendancePage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [shiftFilter, setShiftFilter] = useState<"all" | "pagi" | "siang" | "malam">("all");
  const [currentTime, setCurrentTime] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingShift, setEditingShift] = useState<"pagi" | "siang" | "malam" | null>(null);

  const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // Fetch users directory (cached globally via usersService)
  const { data: usersData = [] } = useQuery({
    queryKey: ["users-directory"],
    queryFn: () => getAllUsers(),
    staleTime: 10 * 60 * 1000, // 10min cache
  });

  // Build lookup maps: email → user, userId → user
  const usersMap = new Map<string, AppUser>();
  usersData.forEach(u => {
    if (u.email) usersMap.set(u.email.toLowerCase(), u);
    if (u.userId) usersMap.set(u.userId, u);
  });

  // Fetch attendance data from API, enriched with user names
  const { data: employeesData = [], isLoading: isLoadingData, error: queryError, refetch } = useQuery({
    queryKey: ["absensi", startDate, endDate, usersData.length],
    queryFn: async () => {
      const rawData = await fetchAbsensiData(startDate, endDate);
      return rawData.map((item, idx) => mapApiToEmployee(item, idx, usersMap));
    },
    enabled: usersData.length > 0, // Wait for users to load first
  });

  const apiError = queryError ? (queryError as Error).message : null;

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load mapbox-gl dynamically on client side
  useEffect(() => {
    import("mapbox-gl").then((mapboxModule) => {
      const mapbox = mapboxModule.default;
      mapbox.accessToken = MAPBOX_TOKEN;
      setMapboxgl(mapbox);
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxgl || map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [106.845, -6.208],
      zoom: 13,
    });

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxgl]);

  // Resize map when sidebar toggles
  useEffect(() => {
    if (map.current) {
      setTimeout(() => {
        map.current?.resize();
      }, 300);
    }
  }, [sidebarOpen]);

  // Add markers when map is loaded or data changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !mapboxgl) return;

    // Clear existing markers first
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add markers for each employee
    employeesData.forEach((emp) => {
      const el = document.createElement("div");
      el.className = "employee-marker";
      el.innerHTML = `
        <div class="marker-avatar" style="background-image: url('${emp.avatar}')"></div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, className: 'custom-popup', maxWidth: '320px' })
        .setHTML(`
          <div class="map-popup">
            <div class="popup-header">
              <img src="${emp.avatar}" alt="${emp.name}" class="popup-avatar" />
              <h4 class="popup-name">${emp.name}</h4>
              <span class="popup-role">${emp.position}</span>
            </div>
            <div class="popup-divider"></div>
            <div class="popup-body">
              <div class="popup-row">
                <span class="popup-label">Check In</span>
                <span class="popup-value">${emp.checkIn}</span>
              </div>
              <div class="popup-row">
                <span class="popup-label">Location</span>
                <span class="popup-value">${emp.location}</span>
              </div>
              <div class="popup-row">
                <span class="popup-label">Status</span>
                <span class="popup-status ${emp.status}">${emp.status === "on-time" ? "On Time" : emp.status === "late" ? "Late" : "Absent"}</span>
              </div>
            </div>
            <button class="popup-btn">More Details</button>
          </div>
        `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([emp.lng, emp.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Cleanup function
    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
    };
  }, [mapLoaded, mapboxgl, employeesData]);

  const filteredEmployees = employeesData.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShift = shiftFilter === "all" || emp.shift === shiftFilter;
    return matchesSearch && matchesShift;
  });

  const handleEmployeeClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    if (map.current) {
      map.current.flyTo({
        center: [emp.lng, emp.lat],
        zoom: 15,
        duration: 1000,
      });
      markers.current.forEach((marker) => {
        const lngLat = marker.getLngLat();
        if (lngLat.lng === emp.lng && lngLat.lat === emp.lat) {
          marker.togglePopup();
        }
      });
    }
  };

  const handleOpenDetail = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditingShift(emp.shift);
    setShowDetailModal(true);
  };

  const handleUpdateShift = (newShift: "pagi" | "siang" | "malam") => {
    setEditingShift(newShift);
    // In real app, would update backend here
  };

  const handleSaveShift = () => {
    if (selectedEmployee && editingShift) {
      // Would save to backend in real app
      alert(`Shift ${selectedEmployee.name} diubah ke ${editingShift.charAt(0).toUpperCase() + editingShift.slice(1)}`);
      setShowDetailModal(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getShiftLabel = (shift: string) => {
    switch (shift) {
      case "pagi": return "Shift Pagi (08:00 - 17:00)";
      case "siang": return "Shift Siang (13:00 - 21:00)";
      case "malam": return "Shift Malam (21:00 - 05:00)";
      default: return shift;
    }
  };

  return (
    <div className="attendance-wrapper">
      {/* Toggle Sidebar Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <span className="material-icons">
          {sidebarOpen ? "chevron_left" : "menu"}
        </span>
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="header-left">
            <h2>Kehadiran</h2>
            <button className="archive-btn" onClick={() => setShowArchiveModal(true)}>
              <span className="material-icons">inventory_2</span>
              Arsip
            </button>
          </div>
          <span className="time-badge">{currentTime}</span>
        </div>

        <div className="search-box">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Cari pegawai disini..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date Range Picker */}
        <div className="date-range">
          <div className="date-input-group">
            <label>Dari</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="date-input-group">
            <label>Sampai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button className="refresh-btn" onClick={() => refetch()} disabled={isLoadingData}>
            <span className="material-icons">{isLoadingData ? "hourglass_empty" : "refresh"}</span>
          </button>
        </div>

        <div className="shift-filter">
          <button
            className={shiftFilter === "pagi" ? "active" : ""}
            onClick={() => setShiftFilter("pagi")}
          >
            Pagi
          </button>
          <button
            className={shiftFilter === "siang" ? "active" : ""}
            onClick={() => setShiftFilter("siang")}
          >
            Siang
          </button>
          <button
            className={shiftFilter === "malam" ? "active" : ""}
            onClick={() => setShiftFilter("malam")}
          >
            Malam
          </button>
        </div>

        <div className="employee-list">
          {/* Loading State */}
          {isLoadingData && (
            <div className="loading-state">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-item">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-info">
                    <div className="skeleton-line w-70" />
                    <div className="skeleton-line w-50" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoadingData && apiError && (
            <div className="error-state">
              <span className="material-icons">error_outline</span>
              <p>{apiError}</p>
              <button onClick={() => refetch()}>
                <span className="material-icons">refresh</span>
                Coba Lagi
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingData && !apiError && employeesData.length === 0 && (
            <div className="empty-state">
              <span className="material-icons">event_busy</span>
              <p>Tidak ada data kehadiran untuk periode ini.</p>
            </div>
          )}

          {/* Employee Data */}
          {!isLoadingData && !apiError && filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className={`employee-item ${selectedEmployee?.id === emp.id ? "active" : ""}`}
            >
              <div className="emp-main" onClick={() => handleEmployeeClick(emp)}>
                <div className="emp-avatar-wrapper">
                  <img src={emp.avatar} alt={emp.name} className="emp-avatar" />
                  <span className={`status-dot ${emp.status}`}></span>
                </div>
                <div className="emp-info">
                  <span className="emp-name">{emp.name}</span>
                  <span className="emp-position">{emp.position}</span>
                  <div className="emp-tags">
                    <span className={`shift-badge ${emp.shift}`}>
                      {emp.shift.charAt(0).toUpperCase() + emp.shift.slice(1)}
                    </span>
                    <span className={`status-badge ${emp.status}`}>
                      {emp.status === "on-time" ? "Tepat Waktu" : emp.status === "late" ? "Terlambat" : "Tidak Hadir"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="emp-actions">
                <span className="check-time">{emp.checkIn}</span>
                <button className="detail-btn" onClick={() => handleOpenDetail(emp)}>
                  <span className="material-icons">info</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Map Container */}
      <div className="map-area">
        <div ref={mapContainer} className="map-container" />
        
        <div className="map-timer">
          <span className="material-icons">schedule</span>
          <span>00:00:00</span>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="detail-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="detail-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Kehadiran</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Employee Photo Section */}
              <div className="employee-photo-section">
                <div className="photo-container">
                  <img src={selectedEmployee.photo || selectedEmployee.avatar} alt={selectedEmployee.name} />
                  <span className={`photo-status ${selectedEmployee.status}`}>
                    {selectedEmployee.status === "on-time" ? "Tepat Waktu" : selectedEmployee.status === "late" ? "Terlambat" : "Tidak Hadir"}
                  </span>
                </div>
                <h3>{selectedEmployee.name}</h3>
                <p className="position">{selectedEmployee.position}</p>
              </div>

              {/* Shift Section */}
              <div className="info-section">
                <div className="section-header">
                  <span className="material-icons">schedule</span>
                  <h4>Pengaturan Shift</h4>
                </div>
                <div className="shift-options">
                  {(["pagi", "siang", "malam"] as const).map((shift) => (
                    <button
                      key={shift}
                      className={`shift-option ${editingShift === shift ? "active" : ""}`}
                      onClick={() => handleUpdateShift(shift)}
                    >
                      <span className="shift-name">{shift.charAt(0).toUpperCase() + shift.slice(1)}</span>
                      <span className="shift-time">
                        {shift === "pagi" ? "08:00 - 17:00" : shift === "siang" ? "13:00 - 21:00" : "21:00 - 05:00"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance Info */}
              <div className="info-section">
                <div className="section-header">
                  <span className="material-icons">access_time</span>
                  <h4>Waktu Kehadiran</h4>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Jam Masuk</span>
                    <span className="value">{selectedEmployee.checkIn}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Jam Keluar</span>
                    <span className="value">{selectedEmployee.checkOut || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="info-section">
                <div className="section-header">
                  <span className="material-icons">location_on</span>
                  <h4>Lokasi</h4>
                </div>
                <div className="location-info">
                  <p className="location-name">{selectedEmployee.location}</p>
                  <p className="location-address">{selectedEmployee.address}</p>
                  <div className="coordinates">
                    <span>Lat: {selectedEmployee.lat.toFixed(4)}</span>
                    <span>Lng: {selectedEmployee.lng.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowDetailModal(false)}>Batal</button>
              <button className="primary-btn" onClick={handleSaveShift}>
                <span className="material-icons">save</span>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      <ArchiveModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Arsip Kehadiran"
        type="attendance"
      />

      <style jsx global>{`

        .employee-marker {
          width: 46px;
          height: 46px;
          cursor: pointer;
          z-index: 10;
          position: relative;
        }

        .marker-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          border: 3px solid #7c3aed;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .employee-marker:hover .marker-avatar {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6);
        }

        .map-popup {
          padding: 0;
          width: 280px;
          font-family: 'Montserrat', sans-serif;
        }

        .popup-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 28px 24px 20px;
          background: white;
        }

        .popup-avatar {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: 3px solid #7c3aed;
          object-fit: cover;
          margin-bottom: 12px;
        }

        .popup-name {
          color: #1e293b;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .popup-role {
          color: #7c3aed;
          font-size: 13px;
          font-weight: 500;
        }

        .popup-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 0 20px;
        }

        .popup-body {
          padding: 20px 24px;
          background: white;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .popup-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .popup-label {
          color: #64748b;
          font-weight: 500;
        }

        .popup-value {
          color: #1e293b;
          font-weight: 600;
        }

        .popup-status {
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
        }

        .popup-status.on-time {
          background: #dcfce7;
          color: #16a34a;
        }

        .popup-status.late {
          background: #fee2e2;
          color: #dc2626;
        }

        .popup-btn {
          display: block;
          width: calc(100% - 48px);
          margin: 0 24px 24px;
          padding: 14px;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: background 0.2s;
        }

        .popup-btn:hover {
          background: linear-gradient(135deg, #6d28d9 0%, #9333ea 100%);
        }

        .custom-popup .mapboxgl-popup-content {
          padding: 0 !important;
          background: white !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
          border-radius: 16px !important;
          overflow: hidden;
        }

        .custom-popup .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 8px 12px;
          color: #64748b;
        }

        .mapboxgl-popup-content {
          padding: 0 !important;
          background: white !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
          border-radius: 16px !important;
          overflow: hidden;
        }

        .mapboxgl-popup-tip {
          display: none;
        }
      `}</style>

      <ArchiveModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Arsip Kehadiran"
        type="attendance"
      />

      <style jsx>{`
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .archive-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f3e8ff;
          color: #7c3aed;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: background 0.2s;
        }

        .archive-btn:hover {
          background: #e9d5ff;
        }

        .archive-btn .material-icons {
          font-size: 16px;
        }

        .attendance-wrapper {
          display: flex;
          height: calc(100vh - 80px);
          margin: -32px;
          overflow: hidden;
          position: relative;
        }

        .sidebar-toggle {
          position: absolute;
          top: 20px;
          left: ${sidebarOpen ? "350px" : "20px"};
          z-index: 200;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: left 0.3s ease;
        }

        .sidebar-toggle:hover {
          background: #f1f5f9;
        }

        .sidebar {
          width: 340px;
          background: white;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: margin-left 0.3s ease;
          z-index: 150;
          box-shadow: 4px 0 20px rgba(0,0,0,0.1);
        }

        .sidebar.closed {
          margin-left: -340px;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .sidebar-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .time-badge {
          background: #7c3aed;
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 16px 20px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .search-box .material-icons {
          color: #94a3b8;
          font-size: 20px;
        }

        .search-box input {
          flex: 1;
          border: none;
          background: none;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          font-family: 'Montserrat', sans-serif;
        }

        /* Date Range Picker */
        .date-range {
          display: flex;
          gap: 8px;
          padding: 0 20px;
          margin-bottom: 16px;
          align-items: flex-end;
        }

        .date-input-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .date-input-group label {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .date-input-group input {
          padding: 8px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12px;
          font-family: 'Montserrat', sans-serif;
          color: #1e293b;
          background: #f8fafc;
          outline: none;
          width: 100%;
        }

        .date-input-group input:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        .refresh-btn {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #7c3aed;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #7c3aed;
          color: white;
          border-color: #7c3aed;
        }

        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .refresh-btn .material-icons {
          font-size: 18px;
        }

        /* Loading State */
        .loading-state {
          padding: 12px;
        }

        .skeleton-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 12px;
        }

        .skeleton-avatar {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-line {
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-line.w-70 { width: 70%; }
        .skeleton-line.w-50 { width: 50%; }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Error State */
        .error-state {
          text-align: center;
          padding: 40px 24px;
          color: #64748b;
        }

        .error-state .material-icons {
          font-size: 48px;
          color: #ef4444;
          margin-bottom: 12px;
        }

        .error-state p {
          font-size: 13px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .error-state button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
        }

        .error-state button .material-icons {
          font-size: 16px;
          color: white;
          margin-bottom: 0;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 24px;
          color: #94a3b8;
        }

        .empty-state .material-icons {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .empty-state p {
          font-size: 13px;
          line-height: 1.5;
        }

        .shift-filter {
          display: flex;
          gap: 8px;
          padding: 0 20px;
          margin-bottom: 16px;
        }

        .shift-filter button {
          flex: 1;
          padding: 10px;
          background: #f1f5f9;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Montserrat', sans-serif;
        }

        .shift-filter button.active {
          background: #7c3aed;
          color: white;
        }

        .employee-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 12px;
        }

        .employee-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .employee-item:hover {
          background: #f8fafc;
        }

        .employee-item.active {
          background: #f3e8ff;
        }

        .emp-avatar {
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
          border-radius: 50%;
          object-fit: cover;
          aspect-ratio: 1 / 1;
        }

        .emp-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .emp-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .emp-position {
          font-size: 12px;
          color: #94a3b8;
        }

        .emp-time {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .check-time {
          font-size: 12px;
          color: #64748b;
        }

        .arrow {
          font-size: 18px;
          color: #94a3b8;
        }

        .map-area {
          flex: 1;
          position: relative;
        }

        .map-container {
          width: 100%;
          height: 100%;
        }

        .map-timer {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(30, 30, 46, 0.9);
          padding: 10px 20px;
          border-radius: 30px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        .detail-card {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(30, 30, 46, 0.95);
          border-radius: 20px;
          padding: 24px;
          min-width: 320px;
          backdrop-filter: blur(20px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }

        .close-card {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.1);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .card-header img {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 3px solid #7c3aed;
        }

        .card-header h3 {
          color: white;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }

        .card-header .position {
          color: #94a3b8;
          font-size: 13px;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .card-body .info-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #e2e8f0;
          font-size: 14px;
        }

        .card-body .info-row .material-icons {
          font-size: 18px;
          color: #7c3aed;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          line-height: 1;
          white-space: nowrap;
        }

        .status-badge.on-time {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-badge.late {
          background: #fee2e2;
          color: #dc2626;
        }

        .more-details-btn {
          width: 100%;
          padding: 14px;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
        }

        .more-details-btn:hover {
          background: #6d28d9;
        }

        /* New Employee List Styles */
        .emp-main {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          cursor: pointer;
        }

        .emp-avatar-wrapper {
          position: relative;
        }

        .emp-avatar-wrapper .status-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .status-dot.on-time {
          background: #22c55e;
        }

        .status-dot.late {
          background: #ef4444;
        }

        .status-dot.absent {
          background: #94a3b8;
        }

        .emp-tags {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          align-items: center;
        }

        .shift-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          line-height: 1;
        }

        .shift-badge.pagi {
          background: #fef3c7;
          color: #d97706;
        }

        .shift-badge.siang {
          background: #dbeafe;
          color: #2563eb;
        }

        .shift-badge.malam {
          background: #ede9fe;
          color: #7c3aed;
        }

        .emp-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          margin-left: auto;
        }

        .detail-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: #f3e8ff;
          color: #7c3aed;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .detail-btn:hover {
          background: #7c3aed;
          color: white;
        }

        /* Detail Modal Styles */
        .detail-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .detail-modal-card {
          background: white;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0,0,0,0.25);
          display: flex;
          flex-direction: column;
        }

        .detail-modal-card .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .detail-modal-card .modal-header h2 {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .detail-modal-card .close-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .detail-modal-card .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .employee-photo-section {
          text-align: center;
          margin-bottom: 24px;
        }

        .photo-container {
          position: relative;
          display: inline-block;
          margin-bottom: 16px;
        }

        .photo-container img {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #7c3aed;
        }

        .photo-status {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .photo-status.on-time {
          background: #22c55e;
          color: white;
        }

        .photo-status.late {
          background: #ef4444;
          color: white;
        }

        .photo-status.absent {
          background: #94a3b8;
          color: white;
        }

        .employee-photo-section h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .employee-photo-section .position {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .info-section {
          margin-bottom: 20px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 16px;
        }

        .info-section .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .info-section .section-header .material-icons {
          color: #7c3aed;
          font-size: 20px;
        }

        .info-section .section-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .shift-options {
          display: flex;
          gap: 8px;
        }

        .shift-option {
          flex: 1;
          padding: 12px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          text-align: center;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.2s;
        }

        .shift-option:hover {
          border-color: #7c3aed;
        }

        .shift-option.active {
          border-color: #7c3aed;
          background: #f5f3ff;
        }

        .shift-option .shift-name {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .shift-option .shift-time {
          display: block;
          font-size: 11px;
          color: #64748b;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .info-item {
          background: white;
          padding: 12px;
          border-radius: 10px;
        }

        .info-item .label {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .info-item .value {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        .location-info {
          background: white;
          padding: 12px;
          border-radius: 10px;
        }

        .location-name {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .location-address {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 8px 0;
        }

        .coordinates {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: #94a3b8;
          font-family: 'SF Mono', monospace;
        }

        .detail-modal-card .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-shrink: 0;
        }

        .secondary-btn {
          padding: 12px 24px;
          background: #f1f5f9;
          color: #64748b;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
        }

        .primary-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
        }

        .primary-btn:hover {
          background: #6d28d9;
        }

        .primary-btn .material-icons {
          font-size: 18px;
        }
      `}</style>

    </div>
  );
}
