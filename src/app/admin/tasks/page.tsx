"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken, getUserData } from "@/lib/auth";
import { getAllUsers, AppUser, getUserInitialsFromName, resolveUserAvatar } from "@/services/usersService";
import { sendMessage, getGroups } from "@/services/chatService";
import { uploadFile } from "@/services/berkasService";

const API_BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

interface Task {
  tugasId?: string; // from API
  id?: string; // fallback
  taskId?: string;
  judul: string;
  deskripsi: string;
  priority: "high" | "medium" | "low";
  assignedTo: string | string[];
  assignedBy?: string | string[];
  deadline: string;
  attachments?: string[] | any[];
  files?: any[];
  fileId?: string;
  fileUrl?: string;
  status: "pending" | "proses" | "tunda" | "selesai";
}

interface Column {
  id: "pending" | "proses" | "tunda" | "selesai";
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: "proses", title: "In Progress", color: "#3b82f6" },
  { id: "tunda", title: "Review", color: "#f59e0b" },
  { id: "selesai", title: "Done", color: "#22c55e" },
];

function getFileIcon(name: string): string {
  const ext = (name || "").split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) return "image";
  if (["pdf"].includes(ext)) return "picture_as_pdf";
  if (["doc", "docx"].includes(ext)) return "description";
  if (["xls", "xlsx", "csv"].includes(ext)) return "table_chart";
  if (["ppt", "pptx"].includes(ext)) return "slideshow";
  if (["zip", "rar", "7z"].includes(ext)) return "folder_zip";
  if (["mp4", "mov", "avi"].includes(ext)) return "videocam";
  if (["mp3", "wav"].includes(ext)) return "audiotrack";
  return "insert_drive_file";
}

function getFileIconColor(name: string): string {
  const ext = (name || "").split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) return "#8b5cf6";
  if (["pdf"].includes(ext)) return "#ef4444";
  if (["doc", "docx"].includes(ext)) return "#3b82f6";
  if (["xls", "xlsx", "csv"].includes(ext)) return "#16a34a";
  if (["ppt", "pptx"].includes(ext)) return "#f97316";
  if (["zip", "rar", "7z"].includes(ext)) return "#64748b";
  return "#94a3b8";
}

function isImageFile(name: string, url?: string): boolean {
  const ext = (name || url || "").split(".").pop()?.toLowerCase() || "";
  const cleanedExt = ext.split("?")[0];
  return ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(cleanedExt);
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    judul: "",
    deskripsi: "",
    priority: "medium" as "high" | "medium" | "low",
    assigneeEmail: "",
    deadline: "",
  });
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const users = await getAllUsers();
      setTeamMembers(users);
    } catch (e) {
      console.error("Failed to fetch team members:", e);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      console.error("No token found");
      // Redirect or handle unauthorized
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/tugas/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const result = await res.json();
      
      if (res.ok) {
        // Handle both direct array and { data: [...] } structure
        const tasksArray = Array.isArray(result) ? result : (result.data || result.tugas || []);
        fetch('/api/debug_tasks', { method: 'POST', body: JSON.stringify(tasksArray) }).catch(console.error);
        
        const formattedData = tasksArray.map((t: any, idx: number) => {
          const rawAttachments = t.attachments || t.files || t.evidence?.files || [];
          const filesArray = Array.isArray(rawAttachments) ? rawAttachments.map(att => {
             if (att.file && att.file.fileUrl) return { name: att.file.fileName, url: att.file.fileUrl, senderName: att.senderName };
             if (att.fileUrl) return { name: att.fileName || att.name, url: att.fileUrl, senderName: att.senderName };
             if (typeof att === 'string') return { name: "Berkas", url: att };
             return att;
          }) : [];

          return {
            ...t,
            tugasId: t.tugasId || t.taskId || t.id || t._id || `task-${idx}-${Date.now()}`,
            taskId: t.taskId || t.tugasId || t.id || t._id,
            status: t.status?.toLowerCase() === 'pending' || !t.status ? 'proses' : t.status.toLowerCase(),
            priority: t.priority?.toLowerCase() || "medium",
            judul: t.judul || t.title || "Tugas Tanpa Judul",
            deskripsi: t.deskripsi || t.description || "",
            deadline: t.deadline || null,
            files: filesArray,
            fileId: t.fileId || t.evidence?.fileId || null,
            fileUrl: t.fileUrl || t.evidence?.fileUrl || t.evidence?.url || (t.fileId ? `https://asia-southeast2-hora-7394b.cloudfunctions.net/api/api/berkas/download/${t.fileId}?category=TUGAS` : null),
          };
        });
        setTasks(formattedData);
      } else {
        console.error("API Error Response:", result);
        alert(`Gagal mengambil data tugas: ${result.message || res.statusText}`);
        setTasks([]);
      }
    } catch (e: any) {
      console.error("Fetch API Error:", e);
      alert("Terjadi kesalahan koneksi saat mengambil tugas.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getTaskId = (task: Task): string => task.tugasId || task.taskId || task.id || "";

  const handleDragStart = (task: Task) => setDraggedTask(task);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = async (columnId: "pending" | "proses" | "tunda" | "selesai") => {
    if (!draggedTask || draggedTask.status === columnId) {
      setDraggedTask(null);
      return;
    }

    const dragId = getTaskId(draggedTask);
    if (!dragId) { setDraggedTask(null); return; }

    // Save previous state for rollback
    const previousTasks = [...tasks];

    // Optimistic update — only the one matching task
    const updatedTasks = tasks.map(t =>
      getTaskId(t) === dragId ? { ...t, status: columnId } : t
    );
    setTasks(updatedTasks);
    setDraggedTask(null);

    const apiStatusCapitalized = columnId.charAt(0).toUpperCase() + columnId.slice(1);
    const token = getAccessToken();

    // Try multiple endpoint + payload patterns since the API contract is unclear
    const attempts = [
      // Attempt 1: POST /api/tugas/update-status with tugasId (lowercase status)
      {
        url: `${API_BASE_URL}/api/tugas/update-status`,
        method: "POST",
        body: { tugasId: dragId, status: columnId }
      },
      // Attempt 2: POST /api/tugas/update-status with taskId (capitalized status)
      {
        url: `${API_BASE_URL}/api/tugas/update-status`,
        method: "POST",
        body: { taskId: dragId, status: apiStatusCapitalized, fileId: "" }
      },
      // Attempt 3: PATCH /api/tugas/update with tugasId
      {
        url: `${API_BASE_URL}/api/tugas/update`,
        method: "PATCH",
        body: { tugasId: dragId, status: columnId }
      },
      // Attempt 4: POST /api/tugas/update with id
      {
        url: `${API_BASE_URL}/api/tugas/update`,
        method: "POST",
        body: { id: dragId, status: apiStatusCapitalized }
      },
    ];

    let success = false;
    for (const attempt of attempts) {
      try {
        const res = await fetch(attempt.url, {
          method: attempt.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(attempt.body)
        });
        const responseBody = await res.text().catch(() => "");
        
        if (res.ok) {
          console.log("✅ Status update succeeded:", attempt.url, attempt.body);
          success = true;
          break;
        } else {
          console.warn(`❌ Attempt failed (${res.status}):`, attempt.url, attempt.method, attempt.body, responseBody);
        }
      } catch (e) {
        console.warn("Network error on attempt:", attempt.url, e);
      }
    }

    if (!success) {
      console.error("All status update attempts failed — rolling back");
      setTasks(previousTasks);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditingTask({ ...task });
    setShowModal(true);
  };

  // Silent refetch (no loading flash)
  const silentRefetch = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/tugas/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        const tasksArray = Array.isArray(result) ? result : (result.data || result.tugas || []);
        const formattedData = tasksArray.map((t: any, idx: number) => {
          const rawAttachments = t.attachments || t.files || t.evidence?.files || [];
          const filesArray = Array.isArray(rawAttachments) ? rawAttachments.map(att => {
             if (att.file && att.file.fileUrl) return { name: att.file.fileName, url: att.file.fileUrl, senderName: att.senderName };
             if (att.fileUrl) return { name: att.fileName || att.name, url: att.fileUrl, senderName: att.senderName };
             if (typeof att === 'string') return { name: "Berkas", url: att };
             return att;
          }) : [];

          return {
            ...t,
            tugasId: t.tugasId || t.taskId || t.id || t._id || `task-${idx}-${Date.now()}`,
            taskId: t.taskId || t.tugasId || t.id || t._id,
            status: t.status?.toLowerCase() || "pending",
            priority: t.priority?.toLowerCase() || "medium",
            judul: t.judul || t.title || "Tugas Tanpa Judul",
            deskripsi: t.deskripsi || t.description || "",
            deadline: t.deadline || null,
            files: filesArray,
            fileId: t.fileId || t.evidence?.fileId || null,
            fileUrl: t.fileUrl || t.evidence?.fileUrl || t.evidence?.url || (t.fileId ? `https://asia-southeast2-hora-7394b.cloudfunctions.net/api/api/berkas/download/${t.fileId}?category=TUGAS` : null),
          };
        });
        setTasks(formattedData);
      }
    } catch (e) {
      console.error("Silent refetch failed:", e);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.judul || !newTask.assigneeEmail) return;

    let uploadedFileId = "";
    if (newFile) {
      try {
        setIsUploading(true);
        const upRes: any = await uploadFile(newFile, "TUGAS");
        uploadedFileId = upRes?.data?.fileId || upRes?.data?.id || upRes?.fileId || upRes?.id || "";
      } catch (e: any) {
        alert("Gagal mengupload file: " + e.message);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // Optimistic local update
    const tempId = `temp-${Date.now()}`;
    const isoDeadline = newTask.deadline ? new Date(newTask.deadline).toISOString() : new Date().toISOString();
    
    const newTaskObj: Task = {
      tugasId: tempId,
      id: tempId,
      judul: newTask.judul,
      deskripsi: newTask.deskripsi,
      priority: newTask.priority,
      assignedTo: newTask.assigneeEmail,
      deadline: isoDeadline,
      status: "pending",
      fileId: uploadedFileId
    };
    
    // Store old tasks for rollback
    const previousTasks = [...tasks];
    setTasks(prev => [...prev, newTaskObj]);
    setShowNewTaskModal(false);
    setNewTask({ judul: "", deskripsi: "", priority: "medium", assigneeEmail: "", deadline: "" });
    setNewFile(null); // Reset file

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/api/tugas/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          judul: newTaskObj.judul,
          assignedTo: [newTaskObj.assignedTo],
          description: newTaskObj.deskripsi || newTaskObj.judul,
          deskripsi: newTaskObj.deskripsi,
          deadline: isoDeadline,
          priority: newTaskObj.priority,
          fileId: uploadedFileId || undefined
        })
      });
      
      const result = await res.json().catch(() => null);
      
      if (!res.ok) {
        console.error("API POST Create Error:", result);
        alert(`Gagal membuat tugas: ${result?.message || res.statusText}`);
        setTasks(previousTasks); // Rollback
        return;
      }

      // Upload attachment if any
      const createdTaskId = result?.data?.id || result?.id || result?.taskId || result?.data?.taskId || result?.tugasId;
      if (uploadedFileId && createdTaskId) {
        await fetch(`${API_BASE_URL}/api/tugas/add-attachment`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ taskId: createdTaskId, fileId: uploadedFileId })
        }).catch(err => console.error("Failed to add attachment", err));
      }

      // Background refetch to get real server IDs & mapped attachments
      silentRefetch();
    } catch (e) {
      console.error("Fetch API error on create:", e);
      alert("Terjadi kesalahan jaringan saat membuat tugas. Tugas dibatalkan.");
      setTasks(previousTasks); // Rollback
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (task.status !== "selesai") {
      alert("Hanya tugas dengan status 'Selesai' yang bisa dihapus.");
      return;
    }
    
    if (!confirm("Yakin ingin menghapus tugas ini?")) return;

    const dragId = getTaskId(task);
    const token = getAccessToken();
    
    const previousTasks = [...tasks];
    setTasks(tasks.filter(t => getTaskId(t) !== dragId));
    setShowModal(false);

    const attempts = [
      { url: `${API_BASE_URL}/api/tugas/delete`, method: "POST", body: { taskId: dragId } },
      { url: `${API_BASE_URL}/api/tugas/delete/${dragId}`, method: "DELETE", body: null },
      { url: `${API_BASE_URL}/api/tugas/delete`, method: "POST", body: { id: dragId } },
      { url: `${API_BASE_URL}/api/tugas/delete`, method: "DELETE", body: { tugasId: dragId } },
    ];

    let success = false;
    for (const attempt of attempts) {
      try {
        const fetchOpts: RequestInit = {
          method: attempt.method,
          headers: { Authorization: `Bearer ${token}` }
        };
        if (attempt.body) {
          fetchOpts.headers = { ...fetchOpts.headers, "Content-Type": "application/json" };
          fetchOpts.body = JSON.stringify(attempt.body);
        }
        
        const res = await fetch(attempt.url, fetchOpts);
        if (res.ok) {
          success = true;
          break;
        }
      } catch (e) {
        // ignore
      }
    }

    if (!success) {
      alert("Gagal menghapus tugas dari server.");
      setTasks(previousTasks);
      silentRefetch();
    }
  };

  const handleSetStatusSelesai = async (task: Task) => {
    const dragId = getTaskId(task);
    const token = getAccessToken();
    const previousTasks = [...tasks];
    
    // optimistically update
    setTasks(tasks.map(t => getTaskId(t) === dragId ? { ...t, status: "selesai" } : t));
    
    // update current selected task so modal reflects it
    setSelectedTask({ ...task, status: "selesai" });

    const attempts = [
      { url: `${API_BASE_URL}/api/tugas/update-status`, method: "POST", body: { taskId: dragId, status: "Selesai", fileId: task.fileId || "" } },
      { url: `${API_BASE_URL}/api/tugas/update-status`, method: "POST", body: { tugasId: dragId, status: "selesai" } },
      { url: `${API_BASE_URL}/api/tugas/update`, method: "PATCH", body: { tugasId: dragId, status: "selesai" } },
    ];

    let success = false;
    for (const attempt of attempts) {
      try {
        const res = await fetch(attempt.url, {
          method: attempt.method,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(attempt.body)
        });
        if (res.ok) { success = true; break; }
      } catch (e) {}
    }

    if (!success) {
      alert("Gagal mengupdate status tugas.");
      setTasks(previousTasks);
      setSelectedTask(task);
    }
  };

  const handleUploadAdditionalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTask) return;
    try {
      setIsUploading(true);
      const upRes: any = await uploadFile(file, "TUGAS");
      const fileId = upRes?.data?.fileId || upRes?.data?.id || upRes?.fileId || upRes?.id || "";
      if (fileId) {
        const token = getAccessToken();
        const dragId = getTaskId(selectedTask);
        const updateRes = await fetch(`${API_BASE_URL}/api/tugas/add-attachment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ taskId: dragId, fileId })
        });
        if (updateRes.ok) {
          alert("File berhasil ditambahkan");
          silentRefetch();
          if (selectedTask) {
            setSelectedTask({ ...selectedTask, fileId });
          }
        } else {
          alert("Gagal menyimpan file ke tugas.");
        }
      }
    } catch (err: any) {
      alert("Error upload file: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleShareToMessage = async (task: Task) => {
    try {
      const groups = await getGroups();
      const companyId = groups[0]?.id;
      if (!companyId) throw new Error("ID Perusahaan tidak ditemukan.");

      const assigneeName = getUserName(task.assignedTo);
      const shareText = `📌 *MEMBAGIKAN TUGAS*\n\n*Judul:* ${task.judul}\n*Ditugaskan ke:* ${assigneeName}\n*Prioritas:* ${task.priority.toUpperCase()}\n*Tenggat:* ${task.deadline ? new Date(task.deadline).toLocaleDateString("id-ID") : "-"}\n\n_Lihat detail tugas di Dashboard Admin._`;

      await sendMessage(companyId, shareText, "custom", {
        subtype: "task",
        taskId: task.id,
      });
      alert("Tugas berhasil dibagikan ke pesan.");
      router.push("/admin/chat");
    } catch (error: any) {
      alert("Gagal membagikan tugas: " + error.message);
    }
  };

  const getUserInitials = (identifier: any) => {
    const id = Array.isArray(identifier) ? identifier[0] : identifier;
    if (!id || typeof id !== "string") return "U";
    const user = teamMembers.find(m => m.email === id || m.userId === id);
    if (user?.name) return getUserInitialsFromName(user.name);
    return id.substring(0, 2).toUpperCase();
  };

  const getUserName = (identifier: any) => {
    const id = Array.isArray(identifier) ? identifier[0] : identifier;
    if (!id || typeof id !== "string") return "Unknown";
    const user = teamMembers.find(m => m.email === id || m.userId === id);
    return user?.name || id;
  };
  
  const getUserColor = (identifier: any) => {
    const idStr = Array.isArray(identifier) ? identifier[0] : identifier;
    const id = String(idStr || "user");
    // Deterministic color from string
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.floor(Math.abs((Math.sin(hash) * 16777215)) % 16777215).toString(16);
    return "#" + "000000".substring(0, 6 - color.length) + color;
  };

  const getTasksByColumn = (colId: string) => tasks.filter(t => t.status === colId);

  return (
    <div className="tasks-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Manajemen Tugas</h1>
          <span className="task-count">{tasks.length} tugas</span>
        </div>
        <div className="header-actions">
          <button className="primary-btn" onClick={() => setShowNewTaskModal(true)}>
            <span className="material-icons">add</span>
            Tugas Baru
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`kanban-column ${draggedTask ? "drop-zone" : ""}`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(col.id)}
          >
            <div className="column-header">
              <div className="column-title">
                <span className="column-dot" style={{ background: col.color }}></span>
                <h3>{col.title}</h3>
                <span className="count">{getTasksByColumn(col.id).length}</span>
              </div>
            </div>

            <div className="task-list">
              {loading ? (
                <div className="loading-card">Loading tasks...</div>
              ) : (
                getTasksByColumn(col.id).map(task => (
                  <div
                    key={task.tugasId || task.id}
                    className={`task-card ${draggedTask && getTaskId(draggedTask) === getTaskId(task) ? "dragging" : ""}`}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="card-top">
                      <span className={`tag ${task.priority}`}>
                        {task.priority === "high" ? "High" : task.priority === "medium" ? "Medium" : "Low"}
                      </span>
                      {task.deadline && <span className="deadline-tag">{new Date(task.deadline).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}</span>}
                    </div>
                    <h4>{task.judul}</h4>
                    <p className="description">{task.deskripsi}</p>
                    <div className="card-footer">
                      <div className="avatar" style={{backgroundColor: getUserColor(task.assignedTo)}} title={getUserName(task.assignedTo)}>
                        {getUserInitials(task.assignedTo)}
                      </div>
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="attachment-indicator">
                          <span className="material-icons">attach_file</span>
                          {task.attachments.length}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="modal-overlay" onClick={() => setShowNewTaskModal(false)}>
          <div className="task-modal compact-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tugas Baru</h2>
              <button className="close-btn" onClick={() => setShowNewTaskModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Judul Tugas *</label>
                <input 
                  type="text" 
                  value={newTask.judul} 
                  onChange={e => setNewTask({...newTask, judul: e.target.value})} 
                  placeholder="Masukkan judul..." 
                />
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea 
                  rows={2} 
                  value={newTask.deskripsi} 
                  onChange={e => setNewTask({...newTask, deskripsi: e.target.value})} 
                  placeholder="Detail tugas..." 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Lampiran File</label>
                  <input type="file" onChange={e => setNewFile(e.target.files?.[0] || null)} />
                </div>
                <div className="form-group">
                  <label>Tugaskan Ke *</label>
                  <select value={newTask.assigneeEmail} onChange={e => setNewTask({...newTask, assigneeEmail: e.target.value})}>
                    <option value="">Pilih Anggota...</option>
                    {teamMembers.map(m => (
                      <option key={m.email || m.userId} value={m.email}>{m.name || m.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Batas Waktu</label>
                <input type="date" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowNewTaskModal(false)}>Batal</button>
              <button className="primary-btn" onClick={handleCreateTask} disabled={!newTask.judul || !newTask.assigneeEmail || isUploading}>
                {isUploading ? "Mengupload..." : "Buat Tugas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal (Mobile-like UI) */}
      {showModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="task-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-mobile">
              <button className="back-btn" onClick={() => setShowModal(false)}>
                <span className="material-icons">arrow_back</span> Tugas
              </button>
              <div className="header-actions">
                <button className="icon-btn"><span className="material-icons">search</span></button>
                <button className="icon-btn"><span className="material-icons">swap_vert</span></button>
              </div>
            </div>
            
            <div className="modal-content-mobile">
              <div className="assignee-row">
                <div className="avatar-handle" style={{backgroundColor: "#000"}}></div>
                <div className="assignee-text">
                  <strong>{getUserName(selectedTask.assignedTo)}</strong>
                  {Array.isArray(selectedTask.assignedTo) && selectedTask.assignedTo.length > 1 && (
                    <span className="others"> & {selectedTask.assignedTo.length - 1} lainnya</span>
                  )}
                </div>
              </div>

              <div className="info-card">
                <div className="info-row status-row">
                  <span className="material-icons icon-info">info_outline</span>
                  <span className="label">Status</span>
                  <span className="value status-val">
                    {selectedTask.status === 'selesai' ? 'Selesai' : 
                     selectedTask.status === 'tunda' ? 'Tunda' :
                     selectedTask.status === 'proses' ? 'Dikerjakan' : 'Belum Dimulai'}
                  </span>
                </div>
              </div>

              <div className="info-card">
                <div className="info-row date-row">
                  <span className="material-icons icon-info">event</span>
                  <span className="label">Tenggat</span>
                  <span className="value">
                    {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString("id-ID", { day: 'numeric', month: 'numeric', year: 'numeric' }) : "-"}
                  </span>
                </div>
              </div>

              <div className="desc-card">
                <div className="desc-title">{selectedTask.judul}</div>
                <div className="desc-body">
                  {selectedTask.deskripsi || "Tidak ada deskripsi."}
                </div>
              </div>

              {selectedTask.fileId && (
                <div 
                  className="attachment-card" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setPreviewFile({ url: selectedTask.fileUrl || "", name: `File terlampir` })}
                >
                  <div className="att-left">
                    <div className="att-icon-wrapper">
                      <span className="material-icons">snippet_folder</span>
                    </div>
                    <span className="att-name truncate" title={selectedTask.fileId}>Lampiran Kontribusi</span>
                  </div>
                  <button className="att-open">
                    Lihat
                  </button>
                </div>
              )}

              {selectedTask.files && selectedTask.files.map((file: any, i: number) => {
                const url = typeof file === 'string' ? file : (file.url || file.fileUrl || file.link);
                const name = typeof file === 'string' ? `Berkas ${i+1}` : (file.name || file.fileName || `Berkas ${i+1}`);
                if (!url) return null;
                return (
                  <div 
                    key={i} 
                    className="attachment-card" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setPreviewFile({ url, name })}
                  >
                    <div className="att-left">
                      <div className="att-icon-wrapper">
                        <span className="material-icons">attach_file</span>
                      </div>
                      <span className="att-name truncate" title={name}>
                        {name.includes('_') ? name.split('_').slice(1).join('_') || name : name}
                      </span>
                    </div>
                    <button className="att-open">
                      Lihat
                    </button>
                  </div>
                );
              })}

                <div className="info-card">
                <div className="info-row">
                  <span className="material-icons icon-info">upload_file</span>
                  <label style={{ flex: 1, cursor: "pointer", fontWeight: 600, fontSize: "13px", color: isUploading ? "#9ca3af" : "#8b5cf6" }}>
                    {isUploading ? "Sedang mengupload..." : "Upload File Tambahan"}
                    <input type="file" style={{ display: "none" }} onChange={handleUploadAdditionalFile} disabled={isUploading} />
                  </label>
                </div>
              </div>

              <div className="action-buttons-mobile">
                {selectedTask.status !== "selesai" && (
                  <button className="btn-outline btn-selesai" onClick={() => handleSetStatusSelesai(selectedTask)}>
                    Selesai
                  </button>
                )}
                <button className="btn-outline btn-hapus" onClick={() => handleDeleteTask(selectedTask)} disabled={selectedTask.status !== "selesai"}>
                  Hapus
                </button>
                <button className="btn-fill btn-bagikan" onClick={() => handleShareToMessage(selectedTask)}>
                  <span className="material-icons">send</span> Bagikan ke pesan
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ═══ PREVIEW MODAL ═══ */}
      {previewFile && (
        <div className="modal-overlay preview-overlay" onClick={() => setPreviewFile(null)} style={{zIndex: 2100}}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{previewFile.name}</h3>
              <div className="preview-actions">
                <button className="preview-action-btn" title="Buka di tab baru" onClick={() => window.open(previewFile.url, "_blank")}>
                  <span className="material-icons">open_in_new</span>
                </button>
                <button className="preview-action-btn close" onClick={() => setPreviewFile(null)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
            </div>
            <div className="preview-body">
              {isImageFile(previewFile.name, previewFile.url) ? (
                <img src={previewFile.url} alt={previewFile.name} className="preview-image" />
              ) : (
                <div className="preview-fallback">
                  <span className="material-icons" style={{ fontSize: 64, color: getFileIconColor(previewFile.name) }}>
                    {getFileIcon(previewFile.name)}
                  </span>
                  <p>{previewFile.name}</p>
                  <button className="primary-btn" onClick={() => window.open(previewFile.url, "_blank")} style={{ marginTop: '16px' }}>
                    <span className="material-icons">open_in_new</span>
                    Buka File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        /* 
          1. FIX UI SCALE: Reduced paddings, max-width, smaller font scales
          2. IMPROVE LAYOUT: 4 vertically scrollable columns
          3. COMPACT CARDS: Dense structure
        */
        
        .tasks-container {
          flex: 1;
          height: 100%;
          min-height: 0;
          margin: 0;
          padding: 24px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-header h1 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .task-count {
          background: #e2e8f0;
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 11px;
          color: #475569;
          font-weight: 600;
        }

        .primary-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #0066FF;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .primary-btn:hover { background: #0052CC; }
        .primary-btn:disabled { background: #94a3b8; cursor: not-allowed; }
        
        .secondary-btn {
          padding: 8px 16px;
          background: #f1f5f9;
          color: #64748b;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }

        .primary-btn .material-icons { font-size: 16px; }

        .kanban-board {
          flex: 1;
          min-height: 0;
          display: flex;
          gap: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 0;
          align-items: stretch;
        }

        .kanban-column {
          flex: 1 1 280px;
          min-width: 280px;
          max-width: 420px;
          background: #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;
        }

        .kanban-column.drop-zone {
          border: 2px dashed #0066FF;
          background: #e0e7ff;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          flex-shrink: 0;
        }

        .column-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .column-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .column-header h3 {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          margin: 0;
          text-transform: uppercase;
        }

        .count {
          background: #cbd5e1;
          color: #475569;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 12px;
          font-weight: 700;
        }

        .task-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 4px; /* for scrollbar */
        }
        
        /* Custom scrollbar for task list */
        .task-list::-webkit-scrollbar { width: 4px; }
        .task-list::-webkit-scrollbar-track { background: transparent; }
        .task-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        .loading-card {
          font-size: 12px;
          color: #64748b;
          text-align: center;
          padding: 20px;
        }

        .task-card {
          background: white;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          cursor: grab;
          border: 1px solid #f1f5f9;
        }

        .task-card:hover { border-color: #cbd5e1; }
        .task-card.dragging { opacity: 0.5; transform: scale(0.98); }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .tag {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .tag.high { background: #fee2e2; color: #ef4444; }
        .tag.medium { background: #fef3c7; color: #f59e0b; }
        .tag.low { background: #dcfce3; color: #22c55e; }

        .deadline-tag {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
          background: #f1f5f9;
          padding: 3px 6px;
          border-radius: 4px;
        }

        .task-card h4 {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 6px 0;
          line-height: 1.3;
        }

        .description {
          font-size: 11px;
          color: #64748b;
          margin: 0 0 10px 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          color: white;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .attachment-indicator {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
        }

        .attachment-indicator .material-icons {
          font-size: 14px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.52);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }

        .compact-modal {
          background: white;
          width: 100%;
          max-width: 480px; /* More compact modal */
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .close-btn {
          background: none; border: none;
          color: #64748b; cursor: pointer;
          display: flex; align-items: center;
        }
        .close-btn:hover { color: #0f172a; }

        .modal-body { padding: 20px; }

        .form-group { margin-bottom: 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .form-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }

        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 13px;
          transition: border-color 0.2s;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: #0066FF;
          box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.1);
        }

        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          background: #f8fafc;
        }

        /* --- Task Detail Mobile Modal --- */
        .task-detail-modal {
          background: white;
          width: min(92vw, 380px);
          max-height: calc(100vh - 40px);
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          font-family: 'Inter', system-ui, sans-serif;
        }

        .modal-header-mobile {
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }

        .back-btn {
          display: flex; align-items: center; gap: 8px;
          background: none; border: none; cursor: pointer;
          font-weight: 600; font-size: 14px; color: #000;
        }

        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: #000; padding: 4px;
        }
        .back-btn .material-icons,
        .icon-btn .material-icons {
          font-size: 18px;
        }

        .modal-content-mobile {
          flex: 1;
          overflow-y: auto;
          padding: 14px;
          background: #fff;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .assignee-row {
          display: flex; align-items: center; gap: 8px; justify-content: center;
          margin-bottom: 6px;
        }

        .avatar-handle {
          width: 12px; height: 12px; border-radius: 50%;
        }
        
        .assignee-row strong { font-size: 13px; color: #000; }
        .others { color: #8b5cf6; font-size: 12px; font-weight: 600; }

        .info-card {
          background: #f4f4f4;
          border-radius: 10px;
          padding: 12px;
        }

        .info-row {
          display: flex; align-items: center; justify-content: space-between;
        }

        .icon-info { margin-right: 10px; font-size: 18px; color: #000; }
        .label { flex: 1; font-size: 13px; font-weight: 600; color: #000; }
        .value { font-size: 13px; color: #6b7280; }

        .desc-card {
          background: #f4f4f4;
          border-radius: 10px;
          padding: 12px;
          min-height: 100px;
        }

        .desc-title {
          font-weight: 700; font-size: 13px; color: #000; margin-bottom: 8px;
          line-height: 1.4;
        }

        .desc-body {
          font-size: 13px; color: #000; line-height: 1.45; white-space: pre-wrap;
        }

        .attachment-card {
          border: 1px solid #f1f5f9;
          background: #f8fafc;
          border-radius: 12px;
          padding: 10px 12px;
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          transition: all 0.2s;
        }

        .attachment-card:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }

        .att-left { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          overflow: hidden; 
          flex: 1;
        }

        .att-icon-wrapper {
          width: 32px;
          height: 32px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7c3aed;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .att-icon-wrapper .material-icons {
          font-size: 18px;
        }

        .att-name { 
          font-size: 12px; 
          font-weight: 600; 
          color: #334155;
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
        }

        .att-open { 
          color: #7c3aed; 
          font-weight: 700; 
          background: none;
          border: none;
          font-size: 12px; 
          cursor: pointer;
          padding: 4px 8px;
          flex-shrink: 0;
        }

        .action-buttons-mobile {
          margin-top: 12px;
          display: flex; flex-direction: column; gap: 12px;
        }

        .btn-outline, .btn-fill {
          border-radius: 8px; padding: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;
        }

        .btn-outline { background: #fff; border: 1px solid #e5e7eb; }
        .btn-selesai { color: #8b5cf6; }
        .btn-hapus { color: #ef4444; }
        .btn-hapus:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .btn-fill { background: #8b5cf6; color: #fff; border: none; }

        /* Preview Modal */
        .preview-overlay { background: rgba(0,0,0,0.85); }
        .preview-modal { background: white; width: 100%; max-width: 800px; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.3); max-height: 90vh; display: flex; flex-direction: column; }
        .preview-header { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .preview-header h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; margin-right: 12px; }
        .preview-actions { display: flex; gap: 8px; }
        .preview-action-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .preview-action-btn:hover { background: #0066FF; color: white; border-color: #0066FF; }
        .preview-action-btn.close:hover { background: #ef4444; border-color: #ef4444; }
        .preview-body { flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; background: #f8fafc; min-height: 300px; padding: 20px; }
        .preview-image { max-width: 100%; max-height: 60vh; object-fit: contain; }
        .preview-fallback { text-align: center; padding: 40px; }
        .preview-fallback p { font-size: 14px; color: #64748b; margin: 12px 0 4px 0; font-weight: 600; }
      `}</style>
    </div>
  );
}
