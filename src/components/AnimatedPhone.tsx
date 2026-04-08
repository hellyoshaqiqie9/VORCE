import { useEffect, useRef, useState } from "react";

export default function AnimatedPhone() {
  const phoneRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scaleFactor = isMobile ? 0.75 : 1;
  
  const brands = [
    { name: "WhatsApp", color: "#25D366", delay: 0, pos: { x: -180, y: -120 }, logo: <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="24" height="24" alt="WA" /> },
    { name: "Telegram", color: "#0088cc", delay: 1, pos: { x: 200, y: -40 }, logo: <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" width="24" height="24" alt="Telegram" /> },
    { name: "MS Teams", color: "#6264A7", delay: 2, pos: { x: 160, y: -120 }, logo: <img src="/Microsoft_Office_Teams_(2019–2025).svg.png" width="24" height="24" object-fit="contain" alt="Teams" /> },
    { name: "Google Map", color: "#EA4335", delay: 3, pos: { x: 190, y: 70 }, logo: <img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg" width="24" height="24" alt="Maps" /> },
    { name: "Trello", color: "#0079BF", delay: 4, pos: { x: 160, y: 180 }, logo: <img src="https://www.vectorlogo.zone/logos/trello/trello-icon.svg" width="24" height="24" alt="Trello" /> },
    { name: "Slack", color: "#4A154B", delay: 5, pos: { x: -180, y: -200 }, logo: <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" width="24" height="24" alt="Slack" /> },
    { name: "Google Drive", color: "#4285F4", delay: 6, pos: { x: -170, y: 0 }, logo: <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" width="24" height="24" alt="Drive" /> },
    { name: "OneDrive", color: "#0078D4", delay: 7, pos: { x: 220, y: -120 }, logo: <img src="/ms-onedrive-svgrepo-com.svg" width="24" height="24" alt="OneDrive" /> },
    { name: "Todoist", color: "#E44332", delay: 8, pos: { x: -160, y: 120 }, logo: <img src="/todoist-icon-svgrepo-com.svg" width="24" height="24" alt="Todoist" /> },
    { name: "WA Business", color: "#128C7E", delay: 9, pos: { x: -220, y: -80 }, logo: <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="24" height="24" alt="WA Biz" /> },
    { name: "Kamera GPS", color: "#34A853", delay: 10, pos: { x: 210, y: -20 }, logo: <span className="material-icons" style={{fontSize: 24, color: '#34A853'}}>camera_alt</span> },
    { name: "Notta.ai", color: "#FF6B6B", delay: 11, pos: { x: 130, y: 250 }, logo: <span className="material-icons" style={{fontSize: 24, color: '#FF6B6B'}}>mic</span> },
    { name: "Fireflies.ai", color: "#FF9500", delay: 12, pos: { x: -120, y: 250 }, logo: <img src="/Fireflies.ai_idjU1WbcfM_1.png" width="24" height="24" alt="Fireflies" style={{borderRadius: '50%'}} /> },
    { name: "Dropbox", color: "#0061FF", delay: 13, pos: { x: -190, y: 200 }, logo: <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" width="24" height="24" alt="Dropbox" /> },
    { name: "Kontak", color: "#5856D6", delay: 8.5, pos: { x: 200, y: -220 }, logo: <span className="material-icons" style={{fontSize: 24, color: '#5856D6'}}>contacts</span> },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (phoneRef.current) {
      observer.observe(phoneRef.current);
    }

    const handleScroll = () => {
      if (!phoneRef.current) return;
      const rect = phoneRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height)));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div ref={phoneRef} className={`svg-phone-container ${isVisible ? 'visible' : ''}`}>
      {brands.map((brand, i) => (
        <div key={i} className="brand-orb" style={{
            ['--start-x' as any]: `${brand.pos.x * scaleFactor}px`,
            ['--start-y' as any]: `${brand.pos.y * scaleFactor}px`,
            ['--anim-delay' as any]: `${brand.delay}s`,
          } as React.CSSProperties}>
          <div className="orb-inner-container">
            <div className="orb-icon" style={{color: brand.color}}>{brand.logo}</div>
            <div className="orb-label">{brand.name}</div>
          </div>
        </div>
      ))}

      <div className="phone-frame" style={{
        width: 280, height: 560,
        position: 'relative',
        marginTop: isMobile ? 0 : 0,
        transformStyle: 'preserve-3d',
        transform: isMobile 
          ? 'none' 
          : `perspective(1000px) rotateY(${(scrollProgress - 0.5) * 10}deg) rotateX(${(scrollProgress - 0.5) * -5}deg)`
      }}>
        {/* Bezel / Body */}
        <div style={{
           position: 'absolute', inset: 0,
           borderRadius: 48,
           background: '#24223E',
           boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
           border: '4px solid #484569',
           zIndex: 0
        }}></div>

        {/* Screen */}
        <div style={{
            position: 'absolute',
            top: 13, left: 13, right: 13, bottom: 13,
            background: '#FAFAFA',
            borderRadius: 36,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            zIndex: 1,
            transform: 'translateZ(0)' /* Hardware accel */
        }}>
            
            <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/vorce-logo.svg" alt="Vorce Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>Vorce</span>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="User" style={{ width: '100%', height: '100%' }} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 80px', scrollbarWidth: 'none' }}>
              
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 12, color: '#64748B', marginBottom: 12, fontWeight: 600 }}>Alat</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="app-btn-white">
                    <span className="material-icons" style={{ color: '#7B5AFF', fontSize: 20 }}>camera_alt</span>
                    <span>Kamera GPS</span>
                  </div>
                  <div className="app-btn-white">
                     <span className="material-icons" style={{ color: '#7B5AFF', fontSize: 20 }}>mic</span>
                     <span>Perekam</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 12, color: '#64748B', marginBottom: 12, fontWeight: 600 }}>Fitur</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { icon: 'folder', label: 'Arsip' },
                    { icon: 'home', label: 'Izin' },
                    { icon: 'bar_chart', label: 'Kinerja' },
                    { icon: 'chat', label: 'Pesan' },
                    { icon: 'receipt', label: 'Reimburse' },
                    { icon: 'task_alt', label: 'Tugas' }
                  ].map((item, idx) => (
                    <div key={idx} className="app-btn-purple">
                      <span className="material-icons" style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</span>
                      <span style={{ fontSize: 10 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 12, color: '#64748B', marginBottom: 12, fontWeight: 600 }}>Log Aktivitas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { title: 'Reimburse baru Rp. 80.000', time: '18:38' },
                    { title: 'Mini Mine menambahkan berkas', time: '18:38' },
                    { title: 'Daffa Rendra mengajukan izin', time: '16:50' },
                    { title: 'Daffa Rendra tambah berkas', time: '16:50' }
                  ].map((log, idx) => (
                    <div key={idx} style={{ background: 'white', padding: 12, borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: 11, color: '#334155', fontWeight: 500, maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.title}</span>
                       <span style={{ fontSize: 10, color: '#94A3B8' }}>{log.time} &gt;</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div style={{ 
              height: 60, background: 'white', borderTop: '1px solid #F1F5F9', 
              display: 'flex', justifyContent: 'space-around', alignItems: 'center',
              position: 'absolute', bottom: 0, left: 0, right: 0
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#7B5AFF' }}>
                <span className="material-icons" style={{ fontSize: 24 }}>grid_view</span>
                <span style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>Beranda</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8' }}>
                <span className="material-icons" style={{ fontSize: 24 }}>place</span>
                <span style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>Kehadiran</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8' }}>
                <span className="material-icons" style={{ fontSize: 24 }}>person</span>
                <span style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>Profil</span>
              </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
              .app-btn-white {
                flex: 1;
                background: white;
                border: 1px solid #F1F5F9;
                border-radius: 12px;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 11px;
                font-weight: 600;
                color: #334155;
                cursor: pointer;
                transition: all 0.2s;
              }
              .app-btn-white:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                border-color: #7B5AFF;
              }

              .app-btn-purple {
                background: #7B5AFF;
                color: white;
                border-radius: 12px;
                height: 64px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 4px 6px rgba(123, 90, 255, 0.2);
              }
              .app-btn-purple:hover {
                background: #6D28D9;
                transform: translateY(-3px);
                box-shadow: 0 8px 15px rgba(123, 90, 255, 0.4);
              }
            `}} />
        </div>
      </div>

      <style jsx>{`
        .svg-phone-container {
          position: relative;
          width: 320px;
          height: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1000px;
          margin-left: 60px; /* Shift phone & brands to right */
        }

        .phone-frame {
          z-index: 10;
          transition: transform 0.1s ease-out;
        }

        .brand-orb {
          position: absolute;
          top: 50%;
          left: 50%;
          /* Start exactly at ZERO (Center) */
          width: 0;
          height: 0;
          z-index: 20;
          pointer-events: none;
        }

        .orb-inner-container {
           position: absolute;
           /* Start Hidden */
           opacity: 0;
           transform: translate(0, 0) scale(0);
           
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 5px;

           /* Total cycle duration 14s for clean looping of 14 items (assuming 1s stagger) 
              Actually to have clear waves, we can do 14s total duration.
           */
           animation: absorbCycle 14s infinite cubic-bezier(0.4, 0, 0.2, 1);
           animation-delay: var(--anim-delay);
        }
        
        @keyframes absorbCycle {
            0% {
                opacity: 0;
                transform: translate(0, 0) scale(0);
            }
            5% {
                /* Appear at Start Position (Offset from center) */
                opacity: 1;
                transform: translate(var(--start-x), var(--start-y)) scale(1);
            }
            35% {
                 /* Float/Hover slightly */
                opacity: 1;
                transform: translate(calc(var(--start-x) + 5px), calc(var(--start-y) - 5px)) scale(1.05);
            }
            45% {
                /* SUCK IN TO CENTER (0,0) - The vanish point */
                opacity: 0;
                transform: translate(0, 0) scale(0.2);
            }
            100% {
                 /* Stay hidden for remainder of cycle */
                opacity: 0;
                transform: translate(0, 0) scale(0);
            }
        }
        
        .orb-icon {
          width: 42px;
          height: 42px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
          border: 2px solid rgba(0,0,0,0.04);
          position: relative;
        }

        .orb-icon::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 14px;
          border: 2px solid var(--orb-color);
          opacity: 0.4;
          animation: pulseBorder 2.5s infinite;
        }

        .orb-label {
          background: rgba(255,255,255,0.98);
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 700;
          color: #333;
          box-shadow: 0 3px 8px rgba(0,0,0,0.1);
          white-space: nowrap;
          border: 1px solid rgba(0,0,0,0.05);
        }

        @keyframes pulseBorder {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        
        @media (max-width: 1024px) {
          .svg-phone-container {
            transform: scale(0.85);
          }
        }
      `}</style>
    </div>
  );
}