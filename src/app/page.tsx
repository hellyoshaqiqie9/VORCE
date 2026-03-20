"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AnimatedPhone from "@/components/AnimatedPhone";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import LoadingScreen from "@/components/LoadingScreen";
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
  trust: any;
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
    return <LoadingScreen />;
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
              <img src="/vorce-logo.svg" alt="Vorce Logo" width="40" height="40" />
              <span className="logo-text" style={{fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--dark)'}}>Vorce</span>
            </div>
          </Link>
          


          <div className="nav-menu desktop-menu">
            <a href="#features" className="nav-link">Fitur</a>
            <a href="#pricing" className="nav-link">Harga</a>
            <a href="#testimonials" className="nav-link">Testimoni</a>
            <a href="#faq" className="nav-link">FAQ</a>
            <div className="nav-actions">
              <Link href="/admin" className="nav-link-login">
                Masuk
              </Link>
              <a href="https://wa.me/6285835644607?text=Halo%20Vorce,%20saya%20ingin%20menghubungi%20sales" className="nav-btn-primary">
                <span>Hubungi Sales</span>
                <div className="btn-shine"></div>
              </a>
            </div>
          </div>

          {/* Mobile Sales Button - Shows next to hamburger */}
          <a href="https://wa.me/6285835644607?text=Halo%20Vorce,%20saya%20ingin%20menghubungi%20sales" className="mobile-sales-btn">
            Hubungi Sales
          </a>

          <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu - Moved outside nav to avoid backdrop-filter issues */}
      <div className={`nav-menu mobile-menu ${isMenuOpen ? 'active' : ''}`}>
            <a href="#features" className="nav-link" onClick={() => setIsMenuOpen(false)}>Fitur</a>
            <a href="#pricing" className="nav-link" onClick={() => setIsMenuOpen(false)}>Harga</a>
            <a href="#testimonials" className="nav-link" onClick={() => setIsMenuOpen(false)}>Testimoni</a>
            <a href="#faq" className="nav-link" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            <div className="nav-actions">
              <Link href="/admin" className="nav-link-login" onClick={() => setIsMenuOpen(false)}>
                Masuk
              </Link>
              <a href="https://wa.me/6285835644607?text=Halo%20Vorce,%20saya%20ingin%20menghubungi%20sales" className="nav-btn-primary" onClick={() => setIsMenuOpen(false)}>
                <span>Hubungi Sales</span>
                <div className="btn-shine"></div>
              </a>
            </div>
            
            {/* Close Button for UX */}
            <button className="nav-toggle" onClick={() => setIsMenuOpen(false)} style={{position: 'absolute', top: '24px', right: '24px', display: 'block'}}>
                <span className={`hamburger active`}>
                    <span></span><span></span><span></span>
                </span>
            </button>
      </div>

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
            <span className="title-line">Solusi</span>
            <span className="title-line highlight-wrapper">
              <span className="highlight">All-In-One</span>
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
            <span className="title-line">untuk kolaborasi tim.</span>
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
          <div className="hero-trust animate-on-scroll stagger-5" style={{display: 'flex', alignItems: 'center', gap: '16px', marginTop: '40px'}}>
            <div className="trust-avatars" style={{display: 'flex'}}>
              {content.trust?.logos?.slice(0, 5).map((logo: string, i: number) => (
                  <div key={i} style={{
                      width: 48, height: 48, borderRadius: '50%', background: 'white', 
                      border: '3px solid white', 
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginLeft: i > 0 ? -16 : 0, // Overlap
                      zIndex: 10 - i,
                      overflow: 'hidden',
                      position: 'relative'
                  }}>
                    <img src={logo} alt="Client Logo" style={{ width: '65%', height: '65%', objectFit: 'contain' }} />
                  </div>
              ))}
            </div>
            <p style={{ fontSize: '15px', color: '#64748B', margin: 0, fontWeight: 500 }}>{content.hero.trustedBy}</p>
          </div>

          {/* Admin UI Composition has been moved to src/components/AdminPanelShowcase.tsx and removed from here as per request */}
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
          <div className="benefits-content animate-on-scroll from-left" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ alignSelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="section-badge">
                <span className="badge-icon">⚡</span>
                Keunggulan
                </span>
                <h2 className="section-title" style={{textAlign: 'center'}}>{content.benefits?.title}</h2>
                <p className="section-subtitle" style={{textAlign: 'center'}}>{content.benefits?.subtitle}</p>
            </div>

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
                    {item.details && (
                        <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '11px', color: '#64748B', listStyleType: 'disc' }}>
                            {item.details.map((detail: string, i: number) => (
                                <li key={i} style={{ marginBottom: '4px' }}>{detail}</li>
                            ))}
                        </ul>
                    )}
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
      <TestimonialsSection />

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
                  <img src="/vorce-logo.svg" alt="Vorce Logo" width="40" height="40" />
                  <span className="logo-text" style={{fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: '#ffffff'}}>Vorce</span>
                </div>
              </div>
              <p>{content.footer?.description}</p>
              <div className="footer-social" style={{ display: 'flex', gap: '12px' }}>
                {/* Instagram - Gradient */}
                <a href="#" aria-label="Instagram" style={{ background: 'white', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 0C8.741 0 8.333 0.014 7.053 0.072C2.695 0.272 0.273 2.69 0.073 7.052C0.014 8.333 0 8.741 0 12C0 15.259 0.014 15.668 0.072 16.948C0.272 21.306 2.69 23.728 7.052 23.928C8.333 23.986 8.741 24 12 24C15.259 24 15.668 23.986 16.948 23.928C21.302 23.728 23.73 21.31 23.927 16.948C23.986 15.668 24 15.259 24 12C24 8.741 23.986 8.333 23.928 7.053C23.732 2.699 21.311 0.273 16.949 0.073C15.668 0.014 15.259 0 12 0ZM12 2.163C15.204 2.163 15.584 2.175 16.85 2.233C20.102 2.381 21.621 3.913 21.769 7.152C21.827 8.417 21.838 8.797 21.838 12.001C21.838 15.206 21.826 15.585 21.769 16.85C21.62 20.075 20.105 21.621 16.85 21.769C15.584 21.827 15.206 21.839 12 21.839C8.796 21.839 8.416 21.827 7.151 21.769C3.891 21.62 2.38 20.07 2.232 16.849C2.174 15.585 2.162 15.205 2.162 12C2.162 8.796 2.175 8.417 2.232 7.151C2.381 3.924 3.896 2.38 7.151 2.232C8.417 2.175 8.796 2.163 12 2.163ZM12 5.838C8.597 5.838 5.838 8.596 5.838 12C5.838 15.403 8.597 18.163 12 18.163C15.403 18.163 18.162 15.404 18.162 12C18.162 8.597 15.403 5.838 12 5.838ZM12 16C9.791 16 8 14.21 8 12C8 9.791 9.791 8 12 8C14.209 8 16 9.791 16 12C16 14.21 14.209 16 12 16ZM20.25 5.25C20.25 6.078 19.578 6.75 18.75 6.75C17.922 6.75 17.25 6.078 17.25 5.25C17.25 4.422 17.922 3.75 18.75 3.75C19.578 3.75 20.25 4.422 20.25 5.25Z" fill="url(#ig-gradient)"/>
                    <defs>
                      <linearGradient id="ig-gradient" x1="2.162" y1="21.839" x2="21.838" y2="2.163" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FEC053"/>
                        <stop offset="0.33" stopColor="#F2203E"/>
                        <stop offset="0.66" stopColor="#B729A8"/>
                        <stop offset="1" stopColor="#534AD1"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </a>
                
                {/* LinkedIn - Blue */}
                <a href="#" aria-label="LinkedIn" style={{ background: 'white', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452H16.892V14.881C16.892 13.553 16.866 11.848 15.043 11.848C13.193 11.848 12.91 13.291 12.91 14.786V20.452H9.355V9H12.766V10.564H12.813C13.288 9.664 14.45 8.718 16.175 8.718C19.773 8.718 20.447 11.086 20.447 14.067V20.452ZM5.337 7.433C4.195 7.433 3.272 6.509 3.272 5.367C3.272 4.225 4.195 3.3 5.337 3.3C6.478 3.3 7.401 4.225 7.401 5.367C7.4 6.509 6.478 7.433 5.337 7.433ZM7.114 20.452H3.557V9H7.114V20.452ZM22.225 0H1.771C0.792 0 0 0.774 0 1.729V22.271C0 23.227 0.792 24 1.771 24H22.222C23.201 24 24 23.227 24 22.271V1.729C24 0.774 23.201 0 22.222 0H22.225Z" fill="#0077B5"/>
                  </svg>
                </a>



                 {/* YouTube - Red */}
                <a href="#" aria-label="YouTube" style={{ background: 'white', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.498 6.186C23.224 5.155 22.413 4.344 21.382 4.07C19.511 3.567 12 3.567 12 3.567C12 3.567 4.489 3.567 2.618 4.07C1.587 4.344 0.776 5.155 0.502 6.186C0 8.057 0 12 0 12C0 12 0 15.943 0.502 17.814C0.776 18.845 1.587 19.656 2.618 19.93C4.489 20.433 12 20.433 12 20.433C12 20.433 19.511 20.433 21.382 19.93C22.413 19.656 23.224 18.845 23.498 17.814C24 15.943 24 12 24 12C24 12 24 8.057 23.498 6.186ZM9.545 15.568V8.432L15.818 12L9.545 15.568Z" fill="#FF0000"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-links">
              <div className="footer-column animate-on-scroll from-right" style={{transitionDelay: '100ms'}}>
                <h4>Produk</h4>
                {content.footer?.links?.product?.map((item: any, i: number) => (
                  <a key={i} href={item.url}>{item.label}</a>
                ))}
              </div>
              <div className="footer-column animate-on-scroll from-right" style={{transitionDelay: '200ms'}}>
                <h4>Perusahaan</h4>
                {content.footer?.links?.company?.map((item: any, i: number) => (
                  <a key={i} href={item.url}>{item.label}</a>
                ))}
              </div>
              <div className="footer-column animate-on-scroll from-right" style={{transitionDelay: '300ms'}}>
                <h4>Support</h4>
                {content.footer?.links?.support?.map((item: any, i: number) => (
                  <a key={i} href={item.url}>{item.label}</a>
                ))}
              </div>
              <div className="footer-column animate-on-scroll from-right" style={{transitionDelay: '400ms'}}>
                <h4>Legal</h4>
                {content.footer?.links?.legal?.map((item: any, i: number) => (
                  <a key={i} href={item.url}>{item.label}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>{content.footer?.copyright}</p>
            <div className="footer-badges" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src="/DunsRegisteredMark.png" alt="DUNS Registered" style={{ height: '40px', objectFit: 'contain', background: 'white', padding: '4px', borderRadius: '4px' }} />
              <img src="/pse-terdaftar.png" alt="PSE Terdaftar" style={{ height: '35px', objectFit: 'contain', background: 'white', padding: '4px', borderRadius: '4px' }} />
              {/* Other badges kept if needed, or removed if redundant */}
              <span style={{ fontSize: '12px', opacity: 0.7 }}>🔒 SSL Secured</span>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>🇮🇩 Made in Indonesia</span>
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
