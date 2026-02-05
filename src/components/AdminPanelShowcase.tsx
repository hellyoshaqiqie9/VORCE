import React, { useEffect, useState } from 'react';

export default function AdminPanelShowcase() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Magnetic card effect
      const magneticCards = document.querySelectorAll('.magnetic-card');
      magneticCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        
        const distanceX = e.clientX - cardCenterX;
        const distanceY = e.clientY - cardCenterY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        // Only apply effect if cursor is within 200px
        if (distance < 200) {
          const strength = (200 - distance) / 200;
          const moveX = (distanceX / distance) * strength * 15;
          const moveY = (distanceY / distance) * strength * 15;
          const rotateX = (distanceY / distance) * strength * 5;
          const rotateY = -(distanceX / distance) * strength * 5;
          
          (card as HTMLElement).style.transform = `
            translate(${moveX}px, ${moveY}px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg)
            scale(${1 + strength * 0.05})
          `;
        } else {
          // Reset to original position
          const originalTransform = card.getAttribute('data-original-transform') || '';
          (card as HTMLElement).style.transform = originalTransform;
        }
      });
    };

    // Store original transforms
    setTimeout(() => {
      document.querySelectorAll('.magnetic-card').forEach((card) => {
        const style = window.getComputedStyle(card);
        card.setAttribute('data-original-transform', style.transform);
      });
    }, 100);

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="admin-ui-composition animate-on-scroll scale">
      <div className="composition-main">
        {/* Header with Search */}
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center'}}>
          <div>
            <h3 style={{fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--dark)'}}>Dashboard Tim</h3>
            <p style={{fontSize: '13px', color: 'var(--text-light)', margin: 0}}>Ringkasan aktivitas hari ini</p>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <div style={{background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-light)'}}>
              <span className="material-icons" style={{fontSize: '16px'}}>search</span>
              Cari...
            </div>
            <div className="avatar" style={{width: 32, height: 32, fontSize: 12}}>JD</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="admin-stats-grid">
          <div className="admin-card admin-stat-card">
            <div className="admin-icon blue">
              <span className="material-icons">people</span>
            </div>
            <div className="admin-stat-info">
              <span className="label">Hadir Hari Ini</span>
              <div className="value">24<span>/30</span></div>
            </div>
          </div>
          <div className="admin-card admin-stat-card">
            <div className="admin-icon orange">
              <span className="material-icons">assignment</span>
            </div>
            <div className="admin-stat-info">
              <span className="label">Tugas Pending</span>
              <div className="value">12</div>
            </div>
          </div>
          <div className="admin-card admin-stat-card">
            <div className="admin-icon green">
              <span className="material-icons">receipt_long</span>
            </div>
            <div className="admin-stat-info">
              <span className="label">Reimburse</span>
              <div className="value">IDR 12.5jt</div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="admin-content-grid">
          {/* Activity Feed */}
          <div className="admin-card" style={{padding: '16px'}}>
            <h4 style={{fontSize: '14px', margin: '0 0 12px 0', color: 'var(--dark)'}}>Aktivitas Terbaru</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="admin-activity-item">
                <div className="admin-activity-icon" style={{background: '#eff6ff', color: '#3b82f6'}}>
                  <span className="material-icons" style={{fontSize: 18}}>person_add</span>
                </div>
                <div className="admin-activity-content">
                  <p><strong>Jane Doe</strong> bergabung ke tim</p>
                </div>
                <span className="admin-activity-time">Baru saja</span>
              </div>
              <div className="admin-activity-item">
                <div className="admin-activity-icon" style={{background: '#f0fdf4', color: '#22c55e'}}>
                  <span className="material-icons" style={{fontSize: 18}}>check_circle</span>
                </div>
                <div className="admin-activity-content">
                  <p><strong>Project Alpha</strong> selesai</p>
                </div>
                <span className="admin-activity-time">5m</span>
              </div>
              <div className="admin-activity-item">
                <div className="admin-activity-icon" style={{background: '#fff7ed', color: '#f97316'}}>
                  <span className="material-icons" style={{fontSize: 18}}>assignment</span>
                </div>
                <div className="admin-activity-content">
                  <p><strong>5 Tugas</strong> diperbarui</p>
                </div>
                <span className="admin-activity-time">12m</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="admin-card" style={{padding: '16px'}}>
             <h4 style={{fontSize: '14px', margin: '0 0 12px 0', color: 'var(--dark)'}}>Akses Cepat</h4>
             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
               <button className="admin-btn-soft">
                 <span className="material-icons" style={{fontSize: 18}}>add_task</span>
                 Tugas
               </button>
               <button className="admin-btn-soft">
                 <span className="material-icons" style={{fontSize: 18}}>event_note</span>
                 Cuti
               </button>
               <button className="admin-btn-soft">
                 <span className="material-icons" style={{fontSize: 18}}>receipt</span>
                 Klaim
               </button>
               <button className="admin-btn-soft">
                 <span className="material-icons" style={{fontSize: 18}}>badge</span>
                 Izin
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Floating Elements - Absolute Positioned */}
      
      {/* Right Top - Expense Chart */}
      <div className="composition-floater magnetic-card" style={{right: '-30px', top: '100px', transform: 'rotate(6deg)'}}>
        <div className="admin-card" style={{padding: '16px', width: '260px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <span style={{fontSize: '13px', color: 'var(--text-light)'}}>Riwayat Reimburse</span>
            <span style={{
              fontSize: '11px', 
              padding: '4px 10px', 
              background: '#dcfce7', 
              color: '#166534', 
              borderRadius: '12px', 
              fontWeight: 600,
              border: '1px solid #bbf7d0'
            }}>↑ 5%</span>
          </div>
          <div style={{fontSize: '32px', fontWeight: 800, color: 'var(--dark)', marginBottom: '16px', letterSpacing: '-0.5px'}}>$9,380</div>
          <div style={{display: 'flex', gap: '3px', height: '60px', alignItems: 'flex-end', marginBottom: '12px', background: 'var(--gray-50)', padding: '8px', borderRadius: '8px'}}>
            {[50, 90, 70, 120, 85, 110, 95, 130, 75, 140].map((height, i) => (
              <div key={i} style={{
                flex: 1,
                height: `${(height / 140) * 100}%`,
                background: i % 4 === 0 ? '#3b82f6' : i % 4 === 1 ? '#f97316' : i % 4 === 2 ? '#ec4899' : '#22c55e',
                borderRadius: '3px 3px 0 0',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}></div>
            ))}
          </div>
          <div style={{display: 'flex', gap: '12px', fontSize: '11px', flexWrap: 'wrap'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
              <div style={{width: 8, height: 8, borderRadius: '50%', background: '#3b82f6'}}></div>
              <span style={{color: 'var(--text-light)'}}>Transport</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
              <div style={{width: 8, height: 8, borderRadius: '50%', background: '#f97316'}}></div>
              <span style={{color: 'var(--text-light)'}}>Makan</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
              <div style={{width: 8, height: 8, borderRadius: '50%', background: '#ec4899'}}></div>
              <span style={{color: 'var(--text-light)'}}>Kesehatan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Bottom - Category Cards Grid */}
      <div className="composition-floater magnetic-card" style={{right: '30px', bottom: '100px', transform: 'rotate(1deg)'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'}}>
          <div className="admin-card hover-lift" style={{padding: '14px', textAlign: 'center', minWidth: '100px'}}>
            <div style={{width: 36, height: 36, borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px'}}>
              <span className="material-icons" style={{fontSize: 20, color: '#3b82f6'}}>directions_car</span>
            </div>
            <div style={{fontSize: '18px', fontWeight: 700, color: 'var(--dark)'}}>$840</div>
            <div style={{fontSize: '11px', color: 'var(--text-light)', marginTop: '4px'}}>Transportasi</div>
          </div>
          <div className="admin-card hover-lift" style={{padding: '14px', textAlign: 'center', minWidth: '100px'}}>
            <div style={{width: 36, height: 36, borderRadius: '10px', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px'}}>
              <span className="material-icons" style={{fontSize: 20, color: '#f97316'}}>restaurant</span>
            </div>
            <div style={{fontSize: '18px', fontWeight: 700, color: 'var(--dark)'}}>$1,160</div>
            <div style={{fontSize: '11px', color: 'var(--text-light)', marginTop: '4px'}}>Makan</div>
          </div>
          <div className="admin-card hover-lift" style={{padding: '14px', textAlign: 'center', minWidth: '100px'}}>
            <div style={{width: 36, height: 36, borderRadius: '10px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px'}}>
              <span className="material-icons" style={{fontSize: 20, color: '#ec4899'}}>local_hospital</span>
            </div>
            <div style={{fontSize: '18px', fontWeight: 700, color: 'var(--dark)'}}>$2,800</div>
            <div style={{fontSize: '11px', color: 'var(--text-light)', marginTop: '4px'}}>Kesehatan</div>
          </div>
          <div className="admin-card hover-lift" style={{padding: '14px', textAlign: 'center', minWidth: '100px'}}>
            <div style={{width: 36, height: 36, borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px'}}>
              <span className="material-icons" style={{fontSize: 20, color: '#22c55e'}}>more_horiz</span>
            </div>
            <div style={{fontSize: '18px', fontWeight: 700, color: 'var(--dark)'}}>$580</div>
            <div style={{fontSize: '11px', color: 'var(--text-light)', marginTop: '4px'}}>Lainnya</div>
          </div>
        </div>
      </div>

      {/* Left Bottom - Notification Card */}
      <div className="composition-floater magnetic-card" style={{left: '30px', bottom: '140px', transform: 'rotate(-3deg)'}}>
        <div className="admin-card" style={{padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'center', maxWidth: '240px'}}>
          <div style={{width: 40, height: 40, borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <span className="material-icons" style={{fontSize: 22, color: '#f59e0b'}}>notifications_active</span>
          </div>
          <div>
            <strong style={{display: 'block', fontSize: '13px', color: 'var(--dark)', marginBottom: '2px'}}>5 Tugas Baru</strong>
            <span style={{fontSize: '11px', color: 'var(--text-light)'}}>Perlu ditinjau hari ini</span>
          </div>
        </div>
      </div>
    </div>
  );
}
