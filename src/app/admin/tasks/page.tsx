"use client";

import { useState, useRef, useEffect } from "react";
import { getAccessToken } from "@/lib/auth";
import { getAllUsers, AppUser, getUserInitialsFromName, resolveUserAvatar } from "@/services/usersService";

const API_BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

interface Task {
  tugasId?: string; // from API
  id?: string; // fallback
  taskId?: string;
  judul: string;
  deskripsi: string;
  priority: "high" | "medium" | "low";
  assignedTo: string;
  assignedBy?: string;
  deadline: string;
  attachments?: string[];
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

export default function TasksPage() {
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
        
        const formattedData = tasksArray.map((t: any, idx: number) => ({
          ...t,
          // Ensure every task has a unique tugasId for drag-and-drop
          tugasId: t.tugasId || t.taskId || t.id || t._id || `task-${idx}-${Date.now()}`,
          taskId: t.taskId || t.tugasId || t.id || t._id,
          status: t.status?.toLowerCase() === 'pending' || !t.status ? 'proses' : t.status.toLowerCase(),
          priority: t.priority?.toLowerCase() || "medium",
          judul: t.judul || t.title || "Tugas Tanpa Judul",
          deskripsi: t.deskripsi || t.description || "",
          deadline: t.deadline || null,
          fileId: t.fileId || t.evidence?.fileId || null,
          fileUrl: t.fileUrl || t.evidence?.fileUrl || t.evidence?.url || (t.fileId ? `https://asia-southeast2-hora-7394b.cloudfunctions.net/api/api/berkas/download/${t.fileId}?category=TUGAS` : null),
        }));
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
        const formattedData = tasksArray.map((t: any, idx: number) => ({
          ...t,
          tugasId: t.tugasId || t.taskId || t.id || t._id || `task-${idx}-${Date.now()}`,
          taskId: t.taskId || t.tugasId || t.id || t._id,
          status: t.status?.toLowerCase() || "pending",
          priority: t.priority?.toLowerCase() || "medium",
          judul: t.judul || t.title || "Tugas Tanpa Judul",
          deskripsi: t.deskripsi || t.description || "",
          deadline: t.deadline || null,
          fileId: t.fileId || t.evidence?.fileId || null,
          fileUrl: t.fileUrl || t.evidence?.fileUrl || t.evidence?.url || (t.fileId ? `https://asia-southeast2-hora-7394b.cloudfunctions.net/api/api/berkas/download/${t.fileId}?category=TUGAS` : null),
        }));
        setTasks(formattedData);
      }
    } catch (e) {
      console.error("Silent refetch failed:", e);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.judul || !newTask.assigneeEmail) return;

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
      status: "pending"
    };
    
    // Store old tasks for rollback
    const previousTasks = [...tasks];
    setTasks(prev => [...prev, newTaskObj]);
    setShowNewTaskModal(false);
    setNewTask({ judul: "", deskripsi: "", priority: "medium", assigneeEmail: "", deadline: "" });

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
          priority: newTaskObj.priority
        })
      });
      
      const result = await res.json().catch(() => null);
      
      if (!res.ok) {
        console.error("API POST Create Error:", result);
        alert(`Gagal membuat tugas: ${result?.message || res.statusText}`);
        setTasks(previousTasks); // Rollback
        return;
      }

      // Background refetch to get real server IDs — NO loading flash
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
                  <label>Prioritas</label>
                  <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🔵 Low</option>
                  </select>
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
              <button className="primary-btn" onClick={handleCreateTask} disabled={!newTask.judul || !newTask.assigneeEmail}>
                Buat Tugas
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
                  {teamMembers.length > 1 && <span className="others"> & {Math.max(1, teamMembers.length - 1)} lainnya</span>}
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
                <div className="attachment-card">
                  <div className="att-left">
                    <span className="material-icons-outlined">snippet_folder</span>
                    <span className="att-name truncate" title={selectedTask.fileId}>File terlampir ({selectedTask.fileId.slice(0, 10)}...)</span>
                  </div>
                  <a className="att-open" href={selectedTask.fileUrl} target="_blank" rel="noreferrer">
                    Buka
                  </a>
                </div>
              )}

              <div className="action-buttons-mobile">
                {selectedTask.status !== "selesai" && (
                  <button className="btn-outline btn-selesai" onClick={() => handleSetStatusSelesai(selectedTask)}>
                    Selesai
                  </button>
                )}
                <button className="btn-outline btn-hapus" onClick={() => handleDeleteTask(selectedTask)} disabled={selectedTask.status !== "selesai"}>
                  Hapus
                </button>
                <button className="btn-fill btn-bagikan" onClick={() => alert("Fitur bagikan ke pesan belum aktif.")}>
                  <span className="material-icons">post_add</span> Bagikan ke pesan
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* 
          1. FIX UI SCALE: Reduced paddings, max-width, smaller font scales
          2. IMPROVE LAYOUT: 4 vertically scrollable columns
          3. COMPACT CARDS: Dense structure
        */
        
        .tasks-container {
          max-width: 1400px;
          margin: 0 auto;
          height: calc(100vh - 64px); /* assuming topnav height */
          display: flex;
          flex-direction: column;
          padding: 16px 24px;
          background: #f8fafc;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-header h1 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .task-count {
          background: #e2e8f0;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
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
          display: flex;
          gap: 16px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 8px;
        }

        .kanban-column {
          flex: 1;
          min-width: 280px;
          max-width: 320px;
          background: #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          max-height: 100%;
        }

        .kanban-column.drop-zone {
          border: 2px dashed #0066FF;
          background: #e0e7ff;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
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
          font-size: 13px;
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
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
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
          padding: 14px;
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
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 6px 0;
          line-height: 1.3;
        }

        .description {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 12px 0;
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
          background: rgba(15, 23, 42, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
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
          width: 100%;
          max-width: 420px; 
          height: 90vh;
          max-height: 800px;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          font-family: 'Inter', system-ui, sans-serif;
        }

        .modal-header-mobile {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }

        .back-btn {
          display: flex; align-items: center; gap: 8px;
          background: none; border: none; cursor: pointer;
          font-weight: 600; font-size: 16px; color: #000;
        }

        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: #000; padding: 4px;
        }

        .modal-content-mobile {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          background: #fff;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .assignee-row {
          display: flex; align-items: center; gap: 8px; justify-content: center;
          margin-bottom: 8px;
        }

        .avatar-handle {
          width: 12px; height: 12px; border-radius: 50%;
        }
        
        .assignee-row strong { font-size: 14px; color: #000; }
        .others { color: #8b5cf6; font-size: 14px; font-weight: 600; }

        .info-card {
          background: #f4f4f4;
          border-radius: 10px;
          padding: 16px;
        }

        .info-row {
          display: flex; align-items: center; justify-content: space-between;
        }

        .icon-info { margin-right: 12px; font-size: 20px; color: #000; }
        .label { flex: 1; font-size: 14px; font-weight: 600; color: #000; }
        .value { font-size: 14px; color: #6b7280; }

        .desc-card {
          background: #f4f4f4;
          border-radius: 10px;
          padding: 16px;
          min-height: 120px;
        }

        .desc-title {
          font-weight: 700; font-size: 14px; color: #000; margin-bottom: 12px;
          line-height: 1.4;
        }

        .desc-body {
          font-size: 14px; color: #000; line-height: 1.5; white-space: pre-wrap;
        }

        .attachment-card {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 16px;
          display: flex; align-items: center; justify-content: space-between;
        }

        .att-left { display: flex; align-items: center; gap: 8px; overflow: hidden; }
        .att-name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .att-open { color: #8b5cf6; font-weight: 600; text-decoration: none; font-size: 14px; }

        .action-buttons-mobile {
          margin-top: 16px;
          display: flex; flex-direction: column; gap: 12px;
        }

        .btn-outline, .btn-fill {
          border-radius: 8px; padding: 12px; font-size: 14px; font-weight: 600;
          cursor: pointer; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;
        }

        .btn-outline { background: #fff; border: 1px solid #e5e7eb; }
        .btn-selesai { color: #8b5cf6; }
        .btn-hapus { color: #ef4444; }
        .btn-hapus:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .btn-fill { background: #8b5cf6; color: #fff; border: none; }
      `}</style>
    </div>
  );
}
