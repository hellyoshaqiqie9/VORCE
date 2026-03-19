"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const plans = [
  {
    id: "starter", name: "Starter",
    memberLimit: 3, baseStorage: 100,
    monthly: { price: 0, coret: 21000, diskon: 100, isFavorit: false },
    yearly: { price: 0, coret: 21000, diskon: 100, isFavorit: false }
  },
  {
    id: "basic", name: "Basic",
    memberLimit: 10, baseStorage: 1000,
    monthly: { price: 69999, coret: 79999, diskon: 13, isFavorit: true },
    yearly: { price: 659999, coret: 789999, diskon: 31, isFavorit: false }
  },
  {
    id: "team", name: "Team",
    memberLimit: 30, baseStorage: 3000,
    monthly: { price: 199999, coret: 229999, diskon: 14, isFavorit: false },
    yearly: { price: 1899999, coret: 2399999, diskon: 35, isFavorit: true } 
  },
  {
    id: "business", name: "Business",
    memberLimit: 100, baseStorage: 10000,
    monthly: { price: 699999, coret: 799999, diskon: 14, isFavorit: false },
    yearly: { price: 6169999, coret: 7999999, diskon: 35, isFavorit: false }
  },
  {
    id: "enterprise", name: "Enterprise",
    memberLimit: 300, baseStorage: 30000,
    monthly: { price: 1999999, coret: 2299999, diskon: 14, isFavorit: false },
    yearly: { price: 17399999, coret: 23999999, diskon: 25, isFavorit: false }
  }
];

const addons = [
  {
    id: "addon-1", name: "+3 GB",
    baseStorage: 3000, 
    monthly: { price: 17999, coret: 24999, diskon: 25, isFavorit: false },
    yearly: { price: 129999, coret: 161999, diskon: 45, isFavorit: false }
  },
  {
    id: "addon-2", name: "+10 GB",
    baseStorage: 10000,
    monthly: { price: 44999, coret: 59999, diskon: 25, isFavorit: false },
    yearly: { price: 431999, coret: 539999, diskon: 45, isFavorit: false }
  },
  {
    id: "addon-3", name: "+30 GB",
    baseStorage: 30000,
    monthly: { price: 134999, coret: 179999, diskon: 35, isFavorit: true },
    yearly: { price: 1299999, coret: 1619999, diskon: 45, isFavorit: true }
  },
  {
    id: "addon-4", name: "+60 GB",
    baseStorage: 60000,
    monthly: { price: 269999, coret: 359999, diskon: 25, isFavorit: false },
    yearly: { price: 2591999, coret: 3239999, diskon: 45, isFavorit: false }
  }
];

const ScrollableGrid = ({ children }: { children: React.ReactNode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

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

  return (
    <div style={{ position: 'relative', margin: '0 -20px', padding: '0 20px' }}>
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
        {children}
      </div>

      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px',
        background: 'linear-gradient(to right, transparent, rgba(248,250,252, 1))',
        pointerEvents: 'none',
        display: showRightArrow ? 'block' : 'none'
      }}></div>
    </div>
  );
};

export default function PricingSection() {
  const [period, setPeriod] = useState<"month" | "year">("month");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatStorage = (mb: number) => {
    if (mb >= 1000) {
      return new Intl.NumberFormat("id-ID").format(mb) + " MB";
    }
    return mb + " MB";
  };
  
  const formatGBLabel = (mb: number) => {
      const gb = mb / 1000;
      return `+${gb} GB`;
  }

  return (
    <section className="pricing-section" id="pricing" style={{ padding: '80px 0', background: '#F8FAFC', overflow: 'hidden' }}>
      <div className="container">
        
        {/* Header */}
        <div className="section-header text-center" style={{ marginBottom: '40px' }}>
          <h2 className="section-title" style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
            Paket Layanan
          </h2>
          <p className="section-subtitle" style={{ fontSize: '18px', color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
            Pilih paket dan kapasitas yang sesuai dengan bisnis Anda, tanpa batas fitur.
          </p>
        </div>

        {/* Segmented Control (Toggle) */}
        <div style={{ maxWidth: '400px', margin: '0 auto 40px' }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '99px', 
            border: '1px solid #E2E8F0',
            padding: '4px', 
            display: 'flex', 
            position: 'relative'
          }}>
            <button 
              onClick={() => setPeriod("month")}
              style={{
                flex: 1, padding: '12px', borderRadius: '99px', border: 'none',
                background: period === "month" ? '#F1F5F9' : 'transparent',
                color: period === "month" ? '#0F172A' : '#64748B',
                fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Bulanan
            </button>
            <button 
              onClick={() => setPeriod("year")}
              style={{
                flex: 1, padding: '12px', borderRadius: '99px', border: 'none',
                background: period === "year" ? '#F1F5F9' : 'transparent',
                color: period === "year" ? '#0F172A' : '#64748B',
                fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              Tahunan 
              <span style={{ color: '#EF4444', fontSize: '12px', fontWeight: 800 }}>-40%</span>
            </button>
          </div>
        </div>

        {/* Pricing Grid - Scrolling */}
        <ScrollableGrid>
          {plans.map((plan) => {
            const data = period === "month" ? plan.monthly : plan.yearly;
            const days = plan.id === "starter" ? 30 : (period === "month" ? 30 : 365);
            const totalStorage = plan.id === "starter" ? plan.baseStorage : (period === "month" ? plan.baseStorage : plan.baseStorage * 12);

            return (
              <div key={plan.id} className={`pricing-card ${data.isFavorit ? 'favorit' : ''}`}>
                <div className="card-top">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="badges">
                    <span className="badge-diskon">
                      <span className="material-icons" style={{fontSize: '12px', marginRight: '4px'}}>percent</span>
                      Diskon {data.diskon}%
                    </span>
                    {data.isFavorit && (
                      <span className="badge-favorit">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '4px'}}>
                          <path d="M12 0 L15 9 L24 12 L15 15 L12 24 L9 15 L0 12 L9 9 Z"/>
                        </svg>
                        Favorit
                      </span>
                    )}
                  </div>
                </div>

                <div className="pricing-info">
                  <span className="coret-price">IDR {formatPrice(data.coret)}</span>
                  <div className="main-price">
                    <span className="currency">IDR</span> {data.price === 0 ? "0" : formatPrice(data.price)}
                  </div>
                  <p className="desc-text">Tanpa limitasi fitur & biaya tambahan. Batalkan kapan saja.</p>
                  <Link href="/terms" className="terms-link">Baca perjanjian layanan untuk info lebih lanjut.</Link>
                </div>

                <div className="limits-list">
                  <div className="limit-item">
                    <span className="material-icons">group</span>
                    <span>Up to {plan.memberLimit} kolaborator</span>
                  </div>
                  <div className="limit-item">
                    <span className="material-icons">save</span>
                    <span>{formatStorage(totalStorage)}</span>
                  </div>
                  <div className="limit-item">
                    <span className="material-icons">schedule</span>
                    <span>{days} hari</span>
                  </div>
                </div>

                <button className="ambil-promo-btn">Ambil promo</button>
              </div>
            );
          })}
        </ScrollableGrid>
        
        {/* Penyimpanan + (Add-ons) Section */}
        <div style={{ marginTop: '80px' }}>
          <div className="section-header text-center" style={{ marginBottom: '40px' }}>
            <h2 className="section-title" style={{ fontSize: '30px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
              Penyimpanan +
            </h2>
            <p className="section-subtitle" style={{ fontSize: '15px', color: '#64748B', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Penyimpanan+ akan terintegrasi dengan kapasitas penyimpanan pada paket layanan Anda. Masa aktif dimulai sejak promo diklaim. Batalkan kapan saja. <br/>
              <Link href="/terms" className="terms-link" style={{fontSize: '14px', marginTop: '8px', display: 'inline-block'}}>Baca Perjanjian Layanan untuk informasi lebih lanjut.</Link>
            </p>
          </div>

          <ScrollableGrid>
            {addons.map((addon) => {
              const data = period === "month" ? addon.monthly : addon.yearly;
              const days = period === "month" ? 30 : 365;
              const totalStorage = period === "month" ? addon.baseStorage : addon.baseStorage * 12;

              return (
                <div key={addon.id} className={`pricing-card ${data.isFavorit ? 'favorit' : ''}`}>
                  <div className="card-top">
                    <div className="flex-center">
                      <span className="material-icons" style={{marginRight: '8px'}}>save</span>
                      <h3 className="plan-name" style={{margin: 0}}>{formatGBLabel(totalStorage)}</h3>
                    </div>
                    <div className="badges">
                      <span className="badge-diskon">
                        <span className="material-icons" style={{fontSize: '12px', marginRight: '4px'}}>percent</span>
                        Diskon {data.diskon}%
                      </span>
                      {data.isFavorit && (
                        <span className="badge-favorit">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '4px'}}>
                            <path d="M12 0 L15 9 L24 12 L15 15 L12 24 L9 15 L0 12 L9 9 Z"/>
                          </svg>
                          Favorit
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pricing-info">
                    <span className="coret-price">IDR {formatPrice(data.coret)}</span>
                    <div className="main-price">
                      <span className="currency">IDR</span> {formatPrice(data.price)}
                    </div>
                    <p className="desc-text">Tanpa limitasi fitur & biaya tambahan. Batalkan kapan saja.</p>
                    <Link href="/terms" className="terms-link">Baca perjanjian layanan untuk info lebih lanjut.</Link>
                  </div>

                  <div className="limits-list">
                    <div className="limit-item">
                      <span className="material-icons">schedule</span>
                      <span>{days} hari</span>
                    </div>
                  </div>

                  <button className="ambil-promo-btn">Ambil promo</button>
                </div>
              );
            })}
          </ScrollableGrid>
        </div>

      </div>

      <style jsx global>{`
        .pricing-section {
          
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
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

        .pricing-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          transition: transform 0.2s, box-shadow 0.2s;
          
          /* IMPORTANT: Makes it act exactly like previous slider */
          min-width: 280px; 
          flex-shrink: 0;
          scroll-snap-align: start;
        }

        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
        }

        .pricing-card.favorit {
          background: #F59E0B; /* Orange */
          border: none;
          color: #0F172A; 
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .plan-name {
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .favorit .plan-name {
          color: #0F172A;
        }

        .flex-center {
          display: flex;
          align-items: center;
        }

        .badges {
          display: flex;
          gap: 6px;
        }

        .badge-diskon {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          background: #FEE2E2;
          color: #DC2626;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 800;
        }

        .favorit .badge-diskon {
          background: #111827;
          color: white;
        }

        .badge-favorit {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          background: #111827;
          color: white;
          font-size: 10px;
          font-weight: 800;
          border-radius: 8px;
        }

        .pricing-info {
          margin-bottom: 24px;
        }

        .coret-price {
          font-size: 12px;
          color: #94A3B8;
          text-decoration: line-through;
          display: block;
          margin-bottom: 4px;
        }

        .favorit .coret-price {
          color: rgba(15, 23, 42, 0.6);
        }

        .main-price {
          font-size: 28px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .currency {
          font-size: 16px;
        }

        .desc-text {
          font-size: 11px;
          color: #475569;
          margin: 0 0 4px 0;
          line-height: 1.4;
        }

        .favorit .desc-text {
          color: rgba(15, 23, 42, 0.8);
        }

        .terms-link {
          font-size: 11px;
          color: #3B82F6;
          text-decoration: none;
        }

        .favorit .terms-link {
          color: #111827;
          text-decoration: underline;
        }

        .limits-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .limit-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
        }

        .favorit .limit-item {
          color: #0F172A;
        }

        .limit-item .material-icons {
          font-size: 18px;
          color: #1E293B;
        }

        .ambil-promo-btn {
          margin-top: 24px;
          width: 100%;
          padding: 14px;
          background: #7857FF;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ambil-promo-btn:hover {
          background: #6045E6;
        }

        .favorit .ambil-promo-btn {
          background: #111827;
        }
        
        .favorit .ambil-promo-btn:hover {
          background: #000;
        }
      `}</style>
    </section>
  );
}
