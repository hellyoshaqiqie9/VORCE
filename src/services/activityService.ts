import { getAccessToken } from "@/lib/auth";

const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  category?: string;
  icon?: string;
  color?: string;
}

const formatActivityDetails = (text: string): string => {
  if (!text) return "-";
  
  const lowerText = text.toLowerCase();

  // Specific case for faceId uploads
  if (lowerText.includes("mengupload berkas (faceid)")) {
    return "Mengupload Berkas Face Id";
  }

  // Handle other file uploads
  if (lowerText.includes("mengupload berkas")) {
    const match = text.match(/mengupload berkas\s*\(([^)]+)\)/i);
    if (match && match[1]) {
      const category = match[1];
      // Format category: first letter uppercase, rest lowercase (e.g., DOKUMEN -> Dokumen)
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      return `Mengupload Berkas ${formattedCategory}`;
    }
    return "Mengupload Berkas";
  }
  
  return text;
};

export const fetchActivityLogs = async (): Promise<ActivityLog[]> => {
  const token = getAccessToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${BASE_URL}/api/company/log-activity`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil log aktivitas (${res.status})`);
  }

  const result = await res.json();
  const rawData = result.data || result || [];
  
  return (Array.isArray(rawData) ? rawData : []).map((item: any) => ({
    id: item.id || item._id || Math.random().toString(36).substr(2, 9),
    action: item.action || "Aktivitas",
    details: formatActivityDetails(item.details || item.message || item.description || "-"),
    timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
    userName: item.actorName || item.actor || item.userName || item.name || "System",
    userEmail: item.userEmail || item.email || "",
    category: item.category || "General",
  }));
};
