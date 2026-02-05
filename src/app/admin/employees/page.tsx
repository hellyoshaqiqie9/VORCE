"use client";

import { useState } from "react";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  avatar?: string;
  status: "active" | "inactive" | "on-leave";
  joinDate: string;
  whatsapp?: string;
  instagram?: string;
  address?: string;
}

const initialEmployees: Employee[] = [
  { id: "1", name: "Andi Pratama", email: "andi.pratama@vorce.id", phone: "+62 812-3456-7890", position: "Senior Developer", department: "Engineering", avatar: "https://i.pravatar.cc/100?img=1", status: "active", joinDate: "2024-01-15", whatsapp: "+62 812-3456-7890" },
  { id: "2", name: "Siti Rahayu", email: "siti.rahayu@vorce.id", phone: "+62 813-2345-6789", position: "UI/UX Designer", department: "Design", avatar: "https://i.pravatar.cc/100?img=5", status: "active", joinDate: "2024-02-20" },
  { id: "3", name: "Budi Hartono", email: "budi.hartono@vorce.id", phone: "+62 814-3456-7890", position: "Backend Developer", department: "Engineering", avatar: "https://i.pravatar.cc/100?img=3", status: "on-leave", joinDate: "2023-11-10" },
  { id: "4", name: "Dewi Lestari", email: "dewi.lestari@vorce.id", phone: "+62 815-4567-8901", position: "HR Manager", department: "Human Resources", avatar: "https://i.pravatar.cc/100?img=9", status: "active", joinDate: "2023-08-05" },
  { id: "5", name: "Rizal Gunawan", email: "rizal.gunawan@vorce.id", phone: "+62 816-5678-9012", position: "QA Engineer", department: "Engineering", avatar: "https://i.pravatar.cc/100?img=7", status: "active", joinDate: "2024-03-01" },
  { id: "6", name: "Anna Lee", email: "anna.lee@vorce.id", phone: "+62 817-6789-0123", position: "Product Manager", department: "Product", avatar: "https://i.pravatar.cc/100?img=10", status: "inactive", joinDate: "2023-06-15" },
];

const departments = ["All", "Engineering", "Design", "Human Resources", "Product", "Marketing", "Finance"];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "Engineering",
    status: "active",
    joinDate: new Date().toISOString().split('T')[0],
  });

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === "All" || emp.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return { bg: "#dcfce7", color: "#16a34a" };
      case "inactive": return { bg: "#f1f5f9", color: "#64748b" };
      case "on-leave": return { bg: "#fef3c7", color: "#d97706" };
      default: return { bg: "#f1f5f9", color: "#64748b" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Aktif";
      case "inactive": return "Tidak Aktif";
      case "on-leave": return "Cuti";
      default: return status;
    }
  };

  const handleViewEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setShowDetailModal(true);
  };

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.position) {
      alert("Mohon lengkapi data yang diperlukan");
      return;
    }

    const employee: Employee = {
      id: Date.now().toString(),
      name: newEmployee.name!,
      email: newEmployee.email!,
      phone: newEmployee.phone || "",
      position: newEmployee.position!,
      department: newEmployee.department || "Engineering",
      status: newEmployee.status as "active" | "inactive" | "on-leave",
      joinDate: newEmployee.joinDate || new Date().toISOString().split('T')[0],
      whatsapp: newEmployee.whatsapp,
      instagram: newEmployee.instagram,
      address: newEmployee.address,
    };

    setEmployees([...employees, employee]);
    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "Engineering",
      status: "active",
      joinDate: new Date().toISOString().split('T')[0],
    });
    setShowAddModal(false);
  };

  const handleDeleteEmployee = () => {
    if (selectedEmployee) {
      setEmployees(employees.filter(e => e.id !== selectedEmployee.id));
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
      setSelectedEmployee(null);
    }
  };

  const handleQuickAction = (action: string, emp: Employee) => {
    switch (action) {
      case "message":
        window.location.href = "/admin/chat";
        break;
      case "call":
        window.location.href = `tel:${emp.phone}`;
        break;
      case "email":
        window.location.href = `mailto:${emp.email}`;
        break;
      case "task":
        window.location.href = "/admin/tasks";
        break;
    }
  };

  return (
    <div className="employees-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Karyawan</h1>
          <span className="emp-count">{employees.length} karyawan</span>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="primary-btn" onClick={() => setShowAddModal(true)}>
            <span className="material-icons">person_add</span>
            Tambah Karyawan
          </button>
        </div>
      </div>

      {/* Department Filter */}
      <div className="filter-section">
        <div className="dept-filters">
          {departments.map(dept => (
            <button
              key={dept}
              className={`dept-btn ${filterDepartment === dept ? "active" : ""}`}
              onClick={() => setFilterDepartment(dept)}
            >
              {dept === "All" ? "Semua" : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Grid */}
      <div className="employee-grid">
        {filteredEmployees.map(emp => (
          <div key={emp.id} className="employee-card" onClick={() => handleViewEmployee(emp)}>
            <div className="card-header">
              {emp.avatar ? (
                <img src={emp.avatar} alt={emp.name} className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
              )}
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(emp.status).bg, color: getStatusColor(emp.status).color }}
              >
                {getStatusLabel(emp.status)}
              </span>
            </div>
            <div className="card-body">
              <h3>{emp.name}</h3>
              <p className="position">{emp.position}</p>
              <p className="department">{emp.department}</p>
            </div>
            <div className="card-actions">
              <button className="action-icon" onClick={(e) => { e.stopPropagation(); handleQuickAction("message", emp); }} title="Kirim Pesan">
                <span className="material-icons">chat</span>
              </button>
              <button className="action-icon" onClick={(e) => { e.stopPropagation(); handleQuickAction("call", emp); }} title="Telepon">
                <span className="material-icons">phone</span>
              </button>
              <button className="action-icon" onClick={(e) => { e.stopPropagation(); handleQuickAction("email", emp); }} title="Email">
                <span className="material-icons">email</span>
              </button>
              <button className="action-icon" onClick={(e) => { e.stopPropagation(); handleQuickAction("task", emp); }} title="Berikan Tugas">
                <span className="material-icons">assignment</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowDetailModal(false)}>
              <span className="material-icons">close</span>
            </button>
            
            <div className="modal-profile">
              {selectedEmployee.avatar ? (
                <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="profile-avatar" />
              ) : (
                <div className="profile-avatar placeholder">
                  {selectedEmployee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
              )}
              <h2>{selectedEmployee.name}</h2>
              <span 
                className="status-badge large"
                style={{ backgroundColor: getStatusColor(selectedEmployee.status).bg, color: getStatusColor(selectedEmployee.status).color }}
              >
                {getStatusLabel(selectedEmployee.status)}
              </span>
            </div>

            <div className="quick-actions">
              <button onClick={() => handleQuickAction("message", selectedEmployee)}>
                <span className="material-icons">chat</span>
              </button>
              <button onClick={() => handleQuickAction("call", selectedEmployee)}>
                <span className="material-icons">phone</span>
              </button>
              <button onClick={() => handleQuickAction("email", selectedEmployee)}>
                <span className="material-icons">email</span>
              </button>
              <button onClick={() => handleQuickAction("task", selectedEmployee)}>
                <span className="material-icons">assignment</span>
              </button>
            </div>

            <div className="profile-details">
              <div className="detail-group">
                <h4>Informasi Pekerjaan</h4>
                <div className="detail-item">
                  <span className="material-icons">work</span>
                  <div>
                    <label>Posisi</label>
                    <span>{selectedEmployee.position}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="material-icons">business</span>
                  <div>
                    <label>Departemen</label>
                    <span>{selectedEmployee.department}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="material-icons">event</span>
                  <div>
                    <label>Bergabung Sejak</label>
                    <span>{new Date(selectedEmployee.joinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <div className="detail-group">
                <h4>Kontak</h4>
                <div className="detail-item">
                  <span className="material-icons">email</span>
                  <div>
                    <label>Email</label>
                    <span>{selectedEmployee.email}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="material-icons">phone</span>
                  <div>
                    <label>Telepon</label>
                    <span>{selectedEmployee.phone}</span>
                  </div>
                </div>
                {selectedEmployee.whatsapp && (
                  <div className="detail-item">
                    <span className="material-icons" style={{color: '#25D366'}}>chat</span>
                    <div>
                      <label>WhatsApp</label>
                      <span>{selectedEmployee.whatsapp}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>
                <span className="material-icons">delete</span>
                Hapus
              </button>
              <button className="edit-btn">
                <span className="material-icons">edit</span>
                Edit Profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Karyawan Baru</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nama Lengkap *</label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    placeholder="email@vorce.id"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Telepon</label>
                  <input
                    type="tel"
                    placeholder="+62 xxx-xxxx-xxxx"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Posisi *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Frontend Developer"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Departemen</label>
                  <select
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                  >
                    {departments.filter(d => d !== "All").map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tanggal Bergabung</label>
                  <input
                    type="date"
                    value={newEmployee.joinDate}
                    onChange={(e) => setNewEmployee({...newEmployee, joinDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newEmployee.status}
                    onChange={(e) => setNewEmployee({...newEmployee, status: e.target.value as "active" | "inactive" | "on-leave"})}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                    <option value="on-leave">Cuti</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+62 xxx-xxxx-xxxx"
                  value={newEmployee.whatsapp || ""}
                  onChange={(e) => setNewEmployee({...newEmployee, whatsapp: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowAddModal(false)}>Batal</button>
              <button className="primary-btn" onClick={handleAddEmployee}>
                <span className="material-icons">person_add</span>
                Tambah Karyawan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <span className="material-icons">warning</span>
            </div>
            <h3>Hapus Karyawan?</h3>
            <p>Apakah Anda yakin ingin menghapus <strong>{selectedEmployee?.name}</strong> dari sistem? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="confirm-actions">
              <button className="secondary-btn" onClick={() => setShowDeleteConfirm(false)}>Batal</button>
              <button className="danger-btn" onClick={handleDeleteEmployee}>
                <span className="material-icons">delete_forever</span>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .employees-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .emp-count {
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 16px;
          min-width: 280px;
        }

        .search-box .material-icons {
          color: #94a3b8;
          font-size: 20px;
        }

        .search-box input {
          border: none;
          outline: none;
          font-size: 14px;
          flex: 1;
          font-family: 'Montserrat', sans-serif;
        }

        .primary-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #0066FF;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.2s;
        }

        .primary-btn:hover {
          background: #0052CC;
          transform: translateY(-2px);
        }

        .filter-section {
          margin-bottom: 24px;
        }

        .dept-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .dept-btn {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: white;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Montserrat', sans-serif;
        }

        .dept-btn:hover {
          border-color: #0066FF;
          color: #0066FF;
        }

        .dept-btn.active {
          background: #0066FF;
          color: white;
          border-color: #0066FF;
        }

        .employee-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .employee-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }

        .employee-card:hover {
          border-color: #e2e8f0;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transform: translateY(-4px);
        }

        .card-header {
          padding: 24px 24px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .avatar-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .status-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.large {
          position: static;
          margin-top: 8px;
          font-size: 12px;
          padding: 6px 14px;
        }

        .card-body {
          padding: 16px 24px;
          text-align: center;
        }

        .card-body h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .card-body .position {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 2px 0;
        }

        .card-body .department {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .card-actions {
          padding: 16px 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .action-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-icon:hover {
          background: #0066FF;
          color: white;
          border-color: #0066FF;
        }

        .action-icon .material-icons {
          font-size: 18px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .detail-modal {
          background: white;
          width: 100%;
          max-width: 480px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.9);
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
        }

        .modal-profile {
          padding: 32px 24px;
          text-align: center;
          background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .profile-avatar {
          width: 100px;
          height: 100px;
          min-width: 100px;
          min-height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid white;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          margin-bottom: 16px;
          aspect-ratio: 1 / 1;
        }

        .profile-avatar.placeholder {
          background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
        }

        .modal-profile h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .quick-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          padding: 0 24px 24px;
        }

        .quick-actions button {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-actions button:hover {
          background: #0066FF;
          color: white;
          border-color: #0066FF;
        }

        .profile-details {
          padding: 0 24px 24px;
        }

        .detail-group {
          margin-bottom: 24px;
        }

        .detail-group h4 {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .detail-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .detail-item .material-icons {
          color: #94a3b8;
          font-size: 20px;
          margin-top: 2px;
        }

        .detail-item div {
          flex: 1;
        }

        .detail-item label {
          font-size: 12px;
          color: #94a3b8;
          display: block;
          margin-bottom: 2px;
        }

        .detail-item span:last-child {
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 12px;
          justify-content: space-between;
        }

        .delete-btn, .edit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          border: none;
          transition: all 0.2s;
        }

        .delete-btn {
          background: #fee2e2;
          color: #dc2626;
        }

        .delete-btn:hover {
          background: #fecaca;
        }

        .edit-btn {
          background: #0066FF;
          color: white;
        }

        .edit-btn:hover {
          background: #0052CC;
        }

        /* Add Modal */
        .add-modal {
          background: white;
          width: 100%;
          max-width: 560px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }

        .form-group input, .form-group select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.2s;
        }

        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .secondary-btn {
          padding: 12px 20px;
          background: #f1f5f9;
          color: #64748b;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
        }

        /* Confirm Modal */
        .confirm-modal {
          background: white;
          width: 100%;
          max-width: 400px;
          border-radius: 20px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
        }

        .confirm-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #fef3c7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .confirm-icon .material-icons {
          font-size: 32px;
          color: #d97706;
        }

        .confirm-modal h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .confirm-modal p {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .confirm-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .danger-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
        }

        .danger-btn:hover {
          background: #b91c1c;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            flex-direction: column;
          }

          .search-box {
            min-width: 100%;
          }

          .primary-btn {
            width: 100%;
            justify-content: center;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
