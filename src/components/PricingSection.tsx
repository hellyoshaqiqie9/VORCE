"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  memberLimit: number | string;
  baseStorage: number;
  perGBRate: number;
  hasBestValue?: boolean;
  isCustom?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "FREE",
    description: "Untuk proyek kelompok atau perorangan",
    monthlyPrice: 15000,
    yearlyPrice: 180000,
    memberLimit: 10,
    baseStorage: 1,
    perGBRate: 2500
  },
  {
    id: "starter",
    name: "STARTER",
    description: "Untuk perusahaan mikro atau startup",
    monthlyPrice: 223700,
    yearlyPrice: 2684400,
    memberLimit: 50,
    baseStorage: 3,
    perGBRate: 2450
  },
  {
    id: "basic",
    name: "BASIC",
    description: "Untuk perusahaan kecil",
    monthlyPrice: 411620,
    yearlyPrice: 4939440,
    memberLimit: 100,
    baseStorage: 5,
    perGBRate: 2401,
    hasBestValue: true
  },
  {
    id: "standart",
    name: "STANDART",
    description: "Untuk perusahaan menengah",
    monthlyPrice: 586830,
    yearlyPrice: 7041960,
    memberLimit: 150,
    baseStorage: 10,
    perGBRate: 2353
  },
  {
    id: "professional",
    name: "PROFESSIONAL",
    description: "Untuk perusahaan besar",
    monthlyPrice: 754518,
    yearlyPrice: 9054216,
    memberLimit: 200,
    baseStorage: 20,
    perGBRate: 2306
  },
  {
    id: "business",
    name: "BUSINESS",
    description: "Untuk operasional bisnis yang masif",
    monthlyPrice: 900796.38,
    yearlyPrice: 10809556.50,
    memberLimit: 250,
    baseStorage: 35,
    perGBRate: 2259.80
  },
  {
    id: "enterprise",
    name: "ENTERPRISE",
    description: "Solusi lengkap korporasi skala besar",
    monthlyPrice: 1044607.87,
    yearlyPrice: 12535294.41,
    memberLimit: 300,
    baseStorage: 50,
    perGBRate: 2214.61
  },
  {
    id: "ultimate",
    name: "ULTIMATE",
    description: "Tanpa batas untuk kebutuhan tidak terbatas",
    monthlyPrice: 0,
    yearlyPrice: 0,
    memberLimit: "Unlimited",
    baseStorage: 100,
    perGBRate: 2170.31,
    isCustom: true
  }
];

const commonFeatures = [
  "Batalkan kapan saja. Gratis",
  "Gratis biaya training",
  "Enkripsi AES256 & TLS 1.3",
  "24/7 Bantuan pelanggan",
  "Gratis biaya pemeliharaan",
  "Bebas iklan",
  "Manajemen kehadiran & cuti",
  "Manajemen tugas & kinerja",
  "Manajemen reimbursement",
  "Obrolan teks (Chat) & Peta aktivitas",
  "Laporan aktivitas & Kamera lokasi",
  "Perekam suara + Transkripsi",
  "Pencadangan arsip ke email Admin"
];

const yearlyFeatures = [
  "Gratis 30 hari pertama",
  "Gratis merchandise Vorce"
];

export default function PricingSection() {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [extraStorage, setExtraStorage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const calculateTotalPrice = (plan: Plan) => {
    if (plan.isCustom) return null;

    const basePeriodPrice = period === "month" ? plan.monthlyPrice : plan.yearlyPrice;
    
    // Logic Kalkulasi Storage:
    // User menambah X GB (Bulanan).
    // Jika paket Bulanan: Harga = Base + (ExtraGB * Rate)
    // Jika paket Tahunan: Harga = Base + (ExtraGB * Rate * 12)
    // Rate tiap plan berbeda sesuai tabel.
    
    const durationMultiplier = period === "year" ? 12 : 1;
    const additionalStorageCost = extraStorage * plan.perGBRate * durationMultiplier;

    return basePeriodPrice + additionalStorageCost;
  };

  const getDisplayedStorage = (plan: Plan) => {
    // Menampilkan Total Kuota Storage dalam periode yang dipilih
    // Jika Tahunan, maka Base Storage dikali 12.
    // Extra Storage dari slider juga dikali 12 (karena langganan 12 bulan).
    
    const multiplier = period === "year" ? 12 : 1;
    const totalBase = plan.baseStorage * multiplier;
    const totalExtra = extraStorage * multiplier;
    
    return totalBase + totalExtra;
  };

  return (
    <section className="pricing-section" id="pricing" style={{ padding: '80px 0', background: '#F8FAFC', overflow: 'hidden' }}>
      <div className="container">
        
        {/* Header */}
        <div className="section-header text-center" style={{ marginBottom: '50px' }}>
          <h2 className="section-title" style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
            Harga Transparan, Tanpa Biaya Tersembunyi
          </h2>
          <p className="section-subtitle" style={{ fontSize: '18px', color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
            Pilih paket yang sesuai dengan kebutuhan bisnis Anda. Upgrade kapan saja.
          </p>
        </div>

        {/* Controls Container */}
        <div style={{ maxWidth: '600px', margin: '0 auto 60px' }}>
          
          {/* Segmented Control (Toggle) */}
          <div className="pricing-toggle-container" style={{ 
            background: '#E2E8F0', 
            borderRadius: '99px', 
            padding: '4px', 
            display: 'flex', 
            marginBottom: '40px',
            position: 'relative'
          }}>
             <button 
              onClick={() => setPeriod("month")}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '99px',
                border: 'none',
                background: period === "month" ? 'white' : 'transparent',
                color: period === "month" ? '#0F172A' : '#64748B',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: period === "month" ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
              }}
            >
              30 Hari
            </button>
            <button 
              onClick={() => setPeriod("year")}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '99px',
                border: 'none',
                background: period === "year" ? 'white' : 'transparent',
                color: period === "year" ? '#0F172A' : '#64748B',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: period === "year" ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              365 Hari
            </button>
          </div>

          {/* Storage Slider */}
          <div className="pricing-slider-container" style={{ 
            background: 'white', 
            padding: '24px', 
            borderRadius: '20px', 
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
            border: '1px solid #F1F5F9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <label style={{ fontWeight: 700, color: '#0F172A', fontSize: '15px' }}>
                Tambah Kapasitas Arsip
              </label>
              <span style={{ fontWeight: 800, color: '#7857FF' }}>
                +{extraStorage} GB (Bulanan)
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={extraStorage} 
              onChange={(e) => setExtraStorage(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                appearance: 'none',
                background: `linear-gradient(to right, #7857FF 0%, #7857FF ${(extraStorage/100)*100}%, #E2E8F0 ${(extraStorage/100)*100}%, #E2E8F0 100%)`,
                outline: 'none',
                cursor: 'pointer'
              }}
              className="custom-range"
            />
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
              Geser untuk menambah kapasitas penyimpanan bulanan. Total harga paket akan otomatis menyesuaikan dengan rate per-GB paket masing-masing (dikali 12 untuk paket tahunan).
            </p>
          </div>
        </div>

        {/* Scrollable Container Wrapper */}
        <div style={{ position: 'relative', margin: '0 -20px', padding: '0 20px' }}>
          
          {/* Scroll Arrows */}
          {showLeftArrow && (
            <button 
              onClick={() => scroll('left')}
              className="scroll-btn left"
              style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                zIndex: 10, width: '40px', height: '40px', borderRadius: '50%',
                background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <span className="material-icons">chevron_left</span>
            </button>
          )}
          
          {showRightArrow && (
            <button 
              onClick={() => scroll('right')}
              className="scroll-btn right"
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                zIndex: 10, width: '40px', height: '40px', borderRadius: '50%',
                background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <div className="pulse-ring"></div>
              <span className="material-icons">chevron_right</span>
            </button>
          )}

          {/* Pricing Cards Grid */}
          <div 
            ref={scrollRef}
            className="pricing-grid hide-scrollbar" 
            style={{ 
              display: 'flex', 
              gap: '16px',
              padding: '20px 4px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth'
            }}
          >
            {plans.map((plan) => {
              const totalPrice = calculateTotalPrice(plan);
              const displayedStorage = getDisplayedStorage(plan);
              
              return (
                <div key={plan.id} className="pricing-card" style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px 16px',
                  border: plan.hasBestValue ? '2px solid #7857FF' : '1px solid #E2E8F0',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  minWidth: '240px', 
                  flexShrink: 0,
                  scrollSnapAlign: 'start'
                }}>
                  {plan.hasBestValue && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#7857FF',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '99px',
                      fontSize: '10px',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(120, 87, 255, 0.3)',
                      whiteSpace: 'nowrap'
                    }}>
                      MOST POPULAR
                    </div>
                  )}

                  <div className="card-header" style={{ marginBottom: '16px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                      {plan.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.3, height: '32px', overflow: 'hidden' }}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="card-price" style={{ marginBottom: '20px', textAlign: 'center', minHeight: '40px' }}>
                    {plan.isCustom ? (
                       <span style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
                         Hubungi Kami
                       </span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '2px' }}>
                        <span style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
                           {totalPrice && formatPrice(totalPrice)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Link 
                    href={plan.isCustom ? "https://wa.me/6281234567890?text=Halo%20Vorce,%20saya%20tertarik%20paket%20Ultimate" : "https://wa.me/6281234567890"} 
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      background: plan.isCustom ? '#0F172A' : 'var(--primary, #7857FF)',
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                      marginBottom: '20px',
                      textDecoration: 'none',
                      transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {plan.isCustom ? "Kontak Sales" : "Pilih Paket"}
                  </Link>

                  <div className="card-features" style={{ flex: 1 }}>
                    
                    {/* Dynamic Limits */}
                    <div style={{ paddingBottom: '12px', borderBottom: '1px solid #F1F5F9', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span className="material-icons" style={{ color: '#059669', fontSize: '16px' }}>check_circle</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                          Penyimpanan {displayedStorage} GB
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-icons" style={{ color: '#059669', fontSize: '16px' }}>check_circle</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                          {plan.memberLimit === "Unlimited" ? "Unlimited User" : `Up to ${plan.memberLimit} User`}
                        </span>
                      </div>
                    </div>

                    {/* Yearly Bonus */}
                    {period === 'year' && (
                       <div style={{ paddingBottom: '12px', marginBottom: '12px' }}>
                        {yearlyFeatures.map((feature, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span className="material-icons" style={{ color: '#F59E0B', fontSize: '16px' }}>star</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A' }}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Common Features - Full List (No Slice) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {commonFeatures.map((feature, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                          <span className="material-icons" style={{ color: '#7857FF', fontSize: '14px', marginTop: '1px' }}>check</span>
                          <span style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.3 }}>{feature}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Scroll Hint Fade (Right Side) */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px',
            background: 'linear-gradient(to right, transparent, rgba(248,250,252, 1))',
            pointerEvents: 'none',
            display: showRightArrow ? 'block' : 'none'
          }}></div>

        </div>

      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .custom-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 4px solid #7857FF;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          margin-top: -8px; 
        }
        
        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid #7857FF;
          animation: pulse 2s infinite;
          opacity: 0;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
