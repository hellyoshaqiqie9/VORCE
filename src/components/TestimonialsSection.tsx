"use client";

import { useRef, useState, useEffect } from "react";
import content from "@/data/content.json";

export default function TestimonialsSection() {
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
      const scrollAmount = 350; // Lebar card + gap
      scrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
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

          <div style={{ position: 'relative', margin: '0 -20px', padding: '0 20px' }}>
             {/* Scroll Arrows */}
            {showLeftArrow && (
                <button 
                onClick={() => scroll('left')}
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
                style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    zIndex: 10, width: '40px', height: '40px', borderRadius: '50%',
                    background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                >
                <span className="material-icons">chevron_right</span>
                </button>
            )}

            <div 
                ref={scrollRef}
                className="testimonials-grid hide-scrollbar"
                style={{
                    display: 'flex',
                    gap: '24px',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'smooth',
                    padding: '20px 4px 20px 20px', // Extra padding bottom and left
                    marginTop: '40px'
                }}
            >
                {content.testimonials?.map((item: any, index: number) => (
                <div 
                    key={index} 
                    className="testimonial-card animate-on-scroll"
                    style={{ 
                        transitionDelay: `${index * 150}ms`,
                        // Use slightly larger gap subtract (50px instead of 48px) to prevent subpixel layout issues
                        flex: '0 0 calc((100% - 50px) / 3)',
                        minWidth: '300px', 
                        scrollSnapAlign: 'start'
                    }}
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
             
             {/* Scroll Hint Fade (Right Side) */}
            <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px',
                background: 'linear-gradient(to right, transparent, var(--gray-50))',
                pointerEvents: 'none',
                display: showRightArrow ? 'block' : 'none',
                borderRadius: '0 24px 24px 0'
            }}></div>
          </div>
        </div>

        <style jsx global>{`
             .testimonials-grid::-webkit-scrollbar {
                display: none;
            }
            .testimonials-grid {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            
            /* Responsive Card Sizing via CSS to override inline styles if needed, 
               but since we used inline style for flex, we might strictly rely on min-width or specific class */
            
            @media (max-width: 1024px) {
                .testimonials-grid > div {
                    flex: 0 0 calc((100% - 24px) / 2) !important; /* 2 cards */
                }
            }
            
            @media (max-width: 768px) {
                .testimonials-grid > div {
                    flex: 0 0 100% !important; /* 1 card */
                    min-width: 100% !important;
                }
            }
        `}</style>
    </section>
  );
}
