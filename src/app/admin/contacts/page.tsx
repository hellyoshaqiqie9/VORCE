"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers, AppUser } from "@/services/usersService";

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  avatarColor: string;
  avatarUrl?: string;
}

const departments = ["Engineering", "Design", "Marketing", "Management", "HR", "Finance"];

function getDeterministicColor(str: string): string {
  const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#6366f1", "#14b8a6", "#f97316"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ContactsPage() {
  // Fetch real users from API
  const { data: usersData = [], isLoading } = useQuery({
    queryKey: ["users-directory"],
    queryFn: () => getAllUsers(),
    staleTime: 10 * 60 * 1000,
  });

  // Map API users to Contact interface
  const apiContacts: Contact[] = usersData.map((u: AppUser) => ({
    id: u.userId || u.email,
    name: u.name || u.email?.split("@")[0] || "Unknown",
    role: u.role || "Karyawan",
    email: u.email || "",
    phone: "-",
    department: u.groupId || "Umum",
    avatarColor: getDeterministicColor(u.email || u.userId || ""),
    avatarUrl: u.avatar || undefined,
  }));

  // Local contacts added manually (stored in state)
  const [localContacts, setLocalContacts] = useState<Contact[]>([]);
  const contacts = [...localContacts, ...apiContacts];

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [newContact, setNewContact] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    department: "",
  });

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = () => {
    const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleAddContact = () => {
    if (!newContact.email) return;

    // Generate name from email if not provided
    const generatedName = newContact.name || newContact.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const contact: Contact = {
      id: Date.now().toString(),
      name: generatedName,
      role: newContact.role || "Karyawan",
      email: newContact.email,
      phone: newContact.phone || "-",
      department: newContact.department || "Umum",
      avatarColor: getRandomColor(),
    };

    setLocalContacts([contact, ...localContacts]);
    setShowAddModal(false);
    setNewContact({ name: "", role: "", email: "", phone: "", department: "" });
  };

  const handleDeleteContact = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kontak ini?")) {
      setLocalContacts(localContacts.filter(c => c.id !== id));
      setShowDetailModal(false);
      setSelectedContact(null);
    }
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-left">
          <h1>Kontak</h1>
          <span className="contact-count">{contacts.length} kontak</span>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Cari kontak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="primary-btn" onClick={() => setShowAddModal(true)}>
            <span className="material-icons">add</span>
            Tambah Kontak
          </button>
        </div>
      </div>

      <div className="contacts-grid">
        {filteredContacts.map((contact) => (
          <div key={contact.id} className="contact-card" onClick={() => handleViewContact(contact)}>
            <div className="card-header">
              <div className="avatar-lg" style={{ background: contact.avatarColor }}>
                {getInitials(contact.name)}
              </div>
              <button className="more-btn" onClick={(e) => { e.stopPropagation(); }}>
                <span className="material-icons">more_vert</span>
              </button>
            </div>
            <div className="card-body">
              <h3>{contact.name}</h3>
              <span className="role">{contact.role}</span>
              <span className="department">{contact.department}</span>
              <div className="contact-info">
                <div className="info-item">
                  <span className="material-icons">email</span>
                  {contact.email}
                </div>
                <div className="info-item">
                  <span className="material-icons">phone</span>
                  {contact.phone}
                </div>
              </div>
            </div>
            <div className="card-actions">
              <button className="action-btn" title="Email">
                <span className="material-icons">email</span>
              </button>
              <button className="action-btn" title="Telepon">
                <span className="material-icons">call</span>
              </button>
              <button className="action-btn" title="WhatsApp">
                <span className="material-icons">chat</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Kontak Baru</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nama Lengkap <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Jabatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Senior Developer"
                  value={newContact.role}
                  onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Departemen</label>
                <select
                  value={newContact.department}
                  onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                >
                  <option value="">Pilih Departemen</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Nomor Telepon</label>
                <input
                  type="tel"
                  placeholder="+62 812 xxxx xxxx"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowAddModal(false)}>Batal</button>
              <button 
                className="primary-btn" 
                onClick={handleAddContact}
                disabled={!newContact.email}
              >
                <span className="material-icons">add</span>
                Tambah
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Contact Detail Modal */}
      {showDetailModal && selectedContact && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-card detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="contact-profile">
                <div className="avatar-lg" style={{ background: selectedContact.avatarColor }}>
                  {getInitials(selectedContact.name)}
                </div>
                <div>
                  <h2>{selectedContact.name}</h2>
                  <span className="role-text">{selectedContact.role}</span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>Departemen</label>
                <p>{selectedContact.department || "-"}</p>
              </div>
              <div className="detail-group">
                <label>Email</label>
                <p>{selectedContact.email}</p>
              </div>
              <div className="detail-group">
                <label>Nomor Telepon</label>
                <p>{selectedContact.phone || "-"}</p>
              </div>
              <div className="quick-actions">
                <button className="quick-action-btn email">
                  <span className="material-icons">email</span>
                  Email
                </button>
                <button className="quick-action-btn call">
                  <span className="material-icons">call</span>
                  Telepon
                </button>
                <button className="quick-action-btn whatsapp">
                  <span className="material-icons">chat</span>
                  WhatsApp
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="delete-btn" onClick={() => handleDeleteContact(selectedContact.id)}>
                <span className="material-icons">delete</span>
                Hapus
              </button>
              <button className="primary-btn" onClick={() => setShowDetailModal(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .contact-count {
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          color: #64748b;
        }

        .header-actions {
          display: flex;
          gap: 12px;
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
          min-width: 240px;
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
          background: #7b68ee;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: background 0.2s;
        }

        .primary-btn:hover {
          background: #6d5ce7;
        }

        .primary-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }

        .contacts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .contact-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          padding: 24px;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .contact-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .avatar-lg {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 600;
        }

        .more-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .more-btn:hover {
          background: #f1f5f9;
        }

        .card-body h3 {
          font-size: 18px;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .role {
          font-size: 14px;
          color: #64748b;
          display: block;
        }

        .department {
          font-size: 12px;
          color: #7c3aed;
          background: #f3e8ff;
          padding: 2px 8px;
          border-radius: 10px;
          display: inline-block;
          margin: 8px 0 12px;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #475569;
        }

        .info-item .material-icons {
          font-size: 16px;
          color: #94a3b8;
        }

        .card-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .action-btn {
          flex: 1;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f8fafc;
          color: #7c3aed;
          border-color: #7c3aed;
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

        .modal-card {
          background: white;
          width: 100%;
          max-width: 480px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
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

        .required {
          color: #ef4444;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Montserrat', sans-serif;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #7c3aed;
        }

        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          flex-shrink: 0;
        }

        .secondary-btn {
          background: #f1f5f9;
          color: #64748b;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
        }

        .secondary-btn:hover {
          background: #e2e8f0;
        }

        /* Detail Modal */
        .contact-profile {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .role-text {
          font-size: 14px;
          color: #64748b;
        }

        .detail-group {
          margin-bottom: 16px;
        }

        .detail-group label {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 4px;
          display: block;
        }

        .detail-group p {
          font-size: 15px;
          color: #1e293b;
          margin: 0;
        }

        .quick-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .quick-action-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          border: none;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.2s;
        }

        .quick-action-btn.email {
          background: #eff6ff;
          color: #3b82f6;
        }

        .quick-action-btn.call {
          background: #f0fdf4;
          color: #22c55e;
        }

        .quick-action-btn.whatsapp {
          background: #f0fdf4;
          color: #10b981;
        }

        .delete-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          background: #fee2e2;
          color: #dc2626;
          border: none;
        }

        .delete-btn:hover {
          background: #fecaca;
        }
      `}</style>
    </div>
  );
}
