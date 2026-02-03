"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AnimatedPhone from "@/components/AnimatedPhone";
import PricingSection from "@/components/PricingSection";
import "./landing.css";

interface ContentData {
  hero: any;
  stats: any[];
  solutions: any;
  benefits: any;
  pricing: any;
  testimonials: any[];
  faq: any;
  cta: any;
  footer: any;
}

// Custom hook for scroll animations
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: string; duration?: number; suffix?: string }) {
  const [count, setCount] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          // Parse the end value
          const numericPart = end.replace(/[^0-9.]/g, '');
          const numericEnd = parseFloat(numericPart) || 0;
          const prefix = end.match(/^[^0-9]*/)?.[0] || '';
          const endSuffix = end.match(/[^0-9]*$/)?.[0] || '';
          
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = numericEnd * easeOutQuart;
            
            if (numericEnd % 1 === 0) {
              setCount(prefix + Math.floor(current) + endSuffix);
            } else {
              setCount(prefix + current.toFixed(1) + endSuffix);
            }
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };
          
          animate();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return <div ref={ref}>{count}{suffix}</div>;
}

// Scroll progress indicator
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = (window.scrollY / totalHeight) * 100;
      setProgress(scrollProgress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <div className="scroll-progress" style={{ width: `${progress}%` }} />;
}

export default function Home() {
  const [content, setContent] = useState<ContentData | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Section animations
  const heroAnim = useScrollAnimation();
  const statsAnim = useScrollAnimation();
  const solutionsAnim = useScrollAnimation();
  const benefitsAnim = useScrollAnimation();
  const pricingAnim = useScrollAnimation();
  const testimonialsAnim = useScrollAnimation();
  const faqAnim = useScrollAnimation();
  const ctaAnim = useScrollAnimation();

  useEffect(() => {
    fetch(`/api/content?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => setContent(data))
      .catch((err) => console.error("Failed to load content", err));

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

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

    // Scroll Animation Observer
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Separate effect for scroll animations that depends on content being loaded
  useEffect(() => {
    if (!content) return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      document.querySelectorAll('.animate-on-scroll').forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [content]);



  if (!content) {
    return (
      <div className="loading-screen">
        <div className="loader-container">
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <span className="loader-text">VORCE</span>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <ScrollProgress />
      
      {/* Animated Background Gradient */}
      <div 
        className="cursor-glow"
        style={{
          left: mousePosition.x - 200,
          top: mousePosition.y - 200,
        }}
      />

      {/* Navigation */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            <div className="logo-container" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <svg width="40" height="40" viewBox="0 0 89 89" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M71.6172 0H17.3828C7.78255 0 0 7.78255 0 17.3828V71.6172C0 81.2174 7.78255 89 17.3828 89H71.6172C81.2174 89 89 81.2174 89 71.6172V17.3828C89 7.78255 81.2174 0 71.6172 0Z" fill="#5A30FF"/>
                <path d="M31.3714 23.1253C29.6478 19.7424 25.5081 18.3972 22.1253 20.1208C18.7424 21.8444 17.3973 25.9841 19.1209 29.367L39.5821 69.5261C41.3057 72.9089 45.4454 74.2541 48.8283 72.5305C52.2111 70.8069 53.5562 66.6672 51.8326 63.2844L31.3714 23.1253Z" fill="white"/>
                <path d="M50.6487 23.134C48.9251 19.7512 44.7855 18.406 41.4026 20.1296C38.0197 21.8532 36.6746 25.9929 38.3982 29.3757L49.2017 50.5797C50.9253 53.9626 55.0649 55.3077 58.4478 53.5841C61.8307 51.8605 63.1758 47.7209 61.4522 44.338L50.6487 23.134Z" fill="white"/>
                <path d="M65.2127 19.1963C69.4368 19.1963 72.8612 22.6206 72.8612 26.8447C72.8612 31.0689 69.4368 34.4933 65.2127 34.4933C60.9886 34.4933 57.5645 31.0689 57.5645 26.8447C57.5645 22.6206 60.9886 19.1963 65.2127 19.1963Z" fill="#F79824"/>
              </svg>
              <span className="logo-text" style={{fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--dark)'}}>Vorce</span>
            </div>
          </Link>
          
          <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <a href="#features" className="nav-link">Fitur</a>
            <a href="#pricing" className="nav-link">Harga</a>
            <a href="#testimonials" className="nav-link">Testimoni</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>

          <div className="nav-actions">
            <Link href="/admin" className="nav-link-login">
              Masuk
            </Link>
            <a href="https://wa.me/6281234567890?text=Halo%20Vorce,%20saya%20ingin%20coba%20Vorce" className="nav-btn-primary">
              <span>Coba Vorce</span>
              <div className="btn-shine"></div>
            </a>
          </div>

          <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-elements">
          <div className="hero-blob blob-1"></div>
          <div className="hero-blob blob-2"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="hero-container">
          <div className="hero-badge animate-on-scroll stagger-1">
            <span className="badge-dot"></span>
            <span>{content.hero?.badge}</span>
          </div>
          
          <h1 className="hero-title animate-on-scroll stagger-2">
            <span className="title-line">Kelola</span>
            <span className="title-line highlight-wrapper">
              <span className="highlight">Operasional bisnis</span>
              <svg className="highlight-underline" viewBox="0 0 300 12">
                <path d="M2 8 Q75 2 150 6 Q225 10 298 4" stroke="url(#gradient)" strokeWidth="3" fill="none"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#5A30FF"/>
                    <stop offset="100%" stopColor="#7B5AFF"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="title-line">dengan Satu Platform</span>
          </h1>
          
          <p className="hero-subtitle animate-on-scroll stagger-3">{content.hero?.subtitle}</p>

          <div className="hero-cta animate-on-scroll stagger-4">
            {/* Play Store Button */}
            <Link href={content.hero?.ctaPrimaryLink || "#"} className="store-badge-link">
              <img 
                src="/GooglePlayBadge_ID.svg" 
                alt="Get it on Google Play" 
                style={{ height: '52px', width: 'auto' }} 
              />
            </Link>

            {/* App Store Button */}
            <Link href={content.hero?.ctaSecondaryLink || "#"} className="store-btn">
               <div className="store-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.68-.83 1.14-1.99 1.03-3.02-1.01.05-2.22.68-2.95 1.54-.64.75-1.16 1.94-1.02 2.98 1.12.09 2.27-.66 2.94-1.5" />
                </svg>
              </div>
               <div className="store-text">
                <span className="store-subtitle">Download di</span>
                <span className="store-title">App Store</span>
              </div>
            </Link>
          </div>
          <div className="hero-trust animate-on-scroll stagger-5">
            <div className="trust-avatars">
              <div className="avatar">JK</div>
              <div className="avatar">AS</div>
              <div className="avatar">RW</div>
              <div className="avatar">+</div>
            </div>
            <p>{content.hero?.trustedBy}</p>
          </div>

          {/* Admin UI Composition */}
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
                   <div className="admin-quick-grid">
                     <div className="admin-quick-card">
                       <span className="material-icons" style={{color: '#f97316'}}>assignment</span>
                       <span>Tugas</span>
                     </div>
                     <div className="admin-quick-card">
                       <span className="material-icons" style={{color: '#22c55e'}}>receipt_long</span>
                       <span>Klaim</span>
                     </div>
                     <div className="admin-quick-card">
                       <span className="material-icons" style={{color: '#3b82f6'}}>event_available</span>
                       <span>Izin</span>
                     </div>
                     <div className="admin-quick-card">
                       <span className="material-icons" style={{color: '#a855f7'}}>insert_chart</span>
                       <span>Laporan</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Floater Cards - Positioned around dashboard */}
            
            {/* Top Right - Laporan Disetujui */}
            <div className="composition-floater magnetic-card" style={{right: '20px', top: '60px', transform: 'rotate(3deg)'}}>
              <div className="admin-card" style={{padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'center', minWidth: '200px'}}>
                <div className="admin-icon green" style={{width: 40, height: 40, fontSize: 20}}>
                  <span className="material-icons">check_circle</span>
                </div>
                <div>
                  <strong style={{display: 'block', fontSize: '14px', color: 'var(--dark)', marginBottom: '2px'}}>Laporan Disetujui</strong>
                  <span style={{fontSize: '12px', color: 'var(--text-light)'}}>Tepat waktu</span>
                </div>
              </div>
            </div>

            {/* Top Left - Reimburse Chart (Featured Light Card) */}
            <div className="composition-floater magnetic-card" style={{left: '-20px', top: '40px', transform: 'rotate(-2deg)'}}>
              <div className="admin-card reimburse-featured" style={{
                padding: '20px', 
                minWidth: '260px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(90, 48, 255, 0.1)',
                boxShadow: '0 20px 50px rgba(90, 48, 255, 0.15)'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                  <span style={{fontSize: '13px', color: 'var(--text-light)', fontWeight: 600}}>Riwayat Reimburse</span>
                  <span className="trend-badge positive" style={{
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
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-container">
          {content.stats?.map((stat: any, index: number) => (
            <div 
              key={index} 
              className="stat-item animate-on-scroll"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="stat-icon-bg">
                <span className="material-icons stat-icon">{stat.icon}</span>
              </div>
              <div className="stat-value">
                <AnimatedCounter end={stat.value} duration={2000} />
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Solutions Section */}
      <section id="features" className="solutions">
        <div className="solutions-container">
          <div className="section-header animate-on-scroll scale">
            <span className="section-badge">
              <span className="badge-icon">✦</span>
              Fitur Lengkap
            </span>
            <h2 className="section-title">{content.solutions?.title}</h2>
            <p className="section-subtitle">{content.solutions?.subtitle}</p>
          </div>

          <div className="solutions-grid">
            {content.solutions?.items?.map((item: any, index: number) => (
              <div 
                key={index} 
                className="solution-card animate-on-scroll"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="card-inner">
                  <div className="solution-icon">
                    <span className="material-icons">{item.icon}</span>
                    <div className="icon-ring"></div>
                  </div>
                  <h3 className="solution-title">{item.title}</h3>
                  <p className="solution-desc">{item.description}</p>
                  <div className="card-arrow">
                    <span className="material-icons">arrow_forward</span>
                  </div>
                </div>
                <div className="card-glow"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="benefits-container">
          <div className="benefits-content animate-on-scroll from-left">
            <span className="section-badge">
              <span className="badge-icon">⚡</span>
              Keunggulan
            </span>
            <h2 className="section-title">{content.benefits?.title}</h2>
            <p className="section-subtitle">{content.benefits?.subtitle}</p>

            <div className="benefits-list">
              {content.benefits?.items?.map((item: any, index: number) => (
                <div 
                  key={index} 
                  className="benefit-item animate-on-scroll from-left"
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="benefit-icon">
                    <span className="material-icons">{item.icon}</span>
                  </div>
                  <div className="benefit-text">
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                  <div className="benefit-check">
                    <span className="material-icons">check_circle</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="benefits-visual animate-on-scroll from-right">
            <AnimatedPhone />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials">
        <div className="testimonials-container">
          <div className="section-header animate-on-scroll scale">
            <span className="section-badge">
              <span className="badge-icon">💬</span>
              Testimoni
            </span>
            <h2 className="section-title">Apa Kata Mereka?</h2>
            <p className="section-subtitle">Cerita sukses dari perusahaan yang telah menggunakan VORCE</p>
          </div>

          <div className="testimonials-grid">
            {content.testimonials?.map((item: any, index: number) => (
              <div 
                key={index} 
                className="testimonial-card animate-on-scroll"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-icons">star</span>
                  ))}
                </div>
                <div className="testimonial-quote">
                  <p>"{item.quote}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">{item.avatar}</div>
                  <div className="author-info">
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                    <span className="company">{item.company}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq">
        <div className="faq-container">
          <div className="section-header animate-on-scroll scale">
            <span className="section-badge">
              <span className="badge-icon">❓</span>
              FAQ
            </span>
            <h2 className="section-title">{content.faq?.title}</h2>
            <p className="section-subtitle">{content.faq?.subtitle}</p>
          </div>

          <div className="faq-list">
            {content.faq?.items?.map((item: any, index: number) => (
              <div 
                key={index} 
                className={`faq-item ${openFaq === index ? 'active' : ''}`}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <div className="faq-question">
                  <span className="faq-number">0{index + 1}</span>
                  <span className="faq-text">{item.question}</span>
                  <div className="faq-toggle">
                    <span className="material-icons">
                      {openFaq === index ? 'remove' : 'add'}
                    </span>
                  </div>
                </div>
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <div className="cta-bg-elements">
          <div className="cta-blob"></div>
          <div className="cta-grid"></div>
        </div>
        <div className="cta-container">
          <h2 className="cta-title animate-on-scroll scale">{content.cta?.title}</h2>
          <p className="cta-subtitle animate-on-scroll scale" style={{transitionDelay: '100ms'}}>{content.cta?.subtitle}</p>
          <a href={content.cta?.buttonLink} className="cta-button animate-on-scroll scale" style={{transitionDelay: '200ms'}}>
            <span className="material-icons">rocket_launch</span>
            <span>{content.cta?.button}</span>
            <div className="btn-particles">
              <span></span><span></span><span></span>
            </div>
          </a>
          <p className="cta-note animate-on-scroll scale" style={{transitionDelay: '300ms'}}>{content.cta?.note}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand animate-on-scroll from-left">
              <div className="footer-logo">
                <div className="logo-container" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <svg width="40" height="40" viewBox="0 0 89 89" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M71.6172 0H17.3828C7.78255 0 0 7.78255 0 17.3828V71.6172C0 81.2174 7.78255 89 17.3828 89H71.6172C81.2174 89 89 81.2174 89 71.6172V17.3828C89 7.78255 81.2174 0 71.6172 0Z" fill="#5A30FF"/>
                    <path d="M31.3714 23.1253C29.6478 19.7424 25.5081 18.3972 22.1253 20.1208C18.7424 21.8444 17.3973 25.9841 19.1209 29.367L39.5821 69.5261C41.3057 72.9089 45.4454 74.2541 48.8283 72.5305C52.2111 70.8069 53.5562 66.6672 51.8326 63.2844L31.3714 23.1253Z" fill="white"/>
                    <path d="M50.6487 23.134C48.9251 19.7512 44.7855 18.406 41.4026 20.1296C38.0197 21.8532 36.6746 25.9929 38.3982 29.3757L49.2017 50.5797C50.9253 53.9626 55.0649 55.3077 58.4478 53.5841C61.8307 51.8605 63.1758 47.7209 61.4522 44.338L50.6487 23.134Z" fill="white"/>
                    <path d="M65.2127 19.1963C69.4368 19.1963 72.8612 22.6206 72.8612 26.8447C72.8612 31.0689 69.4368 34.4933 65.2127 34.4933C60.9886 34.4933 57.5645 31.0689 57.5645 26.8447C57.5645 22.6206 60.9886 19.1963 65.2127 19.1963Z" fill="#F79824"/>
                  </svg>
                  <span className="logo-text" style={{fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: '#ffffff'}}>Vorce</span>
                </div>
              </div>
              <p>{content.footer?.description}</p>
              <div className="footer-social">
                <a href="#" aria-label="LinkedIn"><span className="material-icons">language</span></a>
                <a href="#" aria-label="Twitter"><span className="material-icons">alternate_email</span></a>
                <a href="#" aria-label="Instagram"><span className="material-icons">photo_camera</span></a>
              </div>
            </div>

            <div className="footer-links">
              <div className="footer-column animate-on-scroll from-right" style={{transitionDelay: '100ms'}}>
                <h4>Produk</h4>
                {content.footer?.links?.product?.map((link: string, i: number) => (
                  <a key={i} href="#">{link}</a>
                ))}
              </div>
              <div className="footer-column animate-on-scroll from-right" style={{transitionDelay: '200ms'}}>
                <h4>Perusahaan</h4>
                {content.footer?.links?.company?.map((link: string, i: number) => (
                  <a key={i} href="#">{link}</a>
                ))}
              </div>
              <div className="footer-column animate-on-scroll from-right" style={{transitionDelay: '300ms'}}>
                <h4>Support</h4>
                {content.footer?.links?.support?.map((link: string, i: number) => (
                  <a key={i} href="#">{link}</a>
                ))}
              </div>
              <div className="footer-column animate-on-scroll from-right" style={{transitionDelay: '400ms'}}>
                <h4>Legal</h4>
                {content.footer?.links?.legal?.map((link: string, i: number) => (
                  <a key={i} href="#">{link}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>{content.footer?.copyright}</p>
            <div className="footer-badges">
              <span>🔒 SSL Secured</span>
              <span>🇮🇩 Made in Indonesia</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <button 
        className={`back-to-top ${scrolled ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <span className="material-icons">keyboard_arrow_up</span>
      </button>
    </div>
  );
}
