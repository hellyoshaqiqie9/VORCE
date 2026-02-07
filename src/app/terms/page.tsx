"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../landing.css";

export default function TermsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-page">
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
            <Link href="/#features" className="nav-link">Fitur</Link>
            <Link href="/#pricing" className="nav-link">Harga</Link>
            <Link href="/#testimonials" className="nav-link">Testimoni</Link>
            <Link href="/#faq" className="nav-link">FAQ</Link>
            <div className="nav-actions">
              <Link href="/admin" className="nav-link-login">
                Masuk
              </Link>
              <a href="https://wa.me/6281234567890?text=Halo%20Vorce,%20saya%20ingin%20menghubungi%20sales" className="nav-btn-primary">
                <span>Hubungi Sales</span>
                <div className="btn-shine"></div>
              </a>
            </div>
          </div>

          {/* Mobile Sales Button */}
          <a href="https://wa.me/6281234567890?text=Halo%20Vorce,%20saya%20ingin%20menghubungi%20sales" className="mobile-sales-btn">
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

      {/* Mobile Menu */}
      <div className={`nav-menu mobile-menu ${isMenuOpen ? 'active' : ''}`}>
            <Link href="/#features" className="nav-link" onClick={() => setIsMenuOpen(false)}>Fitur</Link>
            <Link href="/#pricing" className="nav-link" onClick={() => setIsMenuOpen(false)}>Harga</Link>
            <Link href="/#testimonials" className="nav-link" onClick={() => setIsMenuOpen(false)}>Testimoni</Link>
            <Link href="/#faq" className="nav-link" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
            <div className="nav-actions">
              <Link href="/admin" className="nav-link-login" onClick={() => setIsMenuOpen(false)}>
                Masuk
              </Link>
              <a href="https://wa.me/6281234567890?text=Halo%20Vorce,%20saya%20ingin%20menghubungi%20sales" className="nav-btn-primary" onClick={() => setIsMenuOpen(false)}>
                <span>Hubungi Sales</span>
                <div className="btn-shine"></div>
              </a>
            </div>
            
            <button className="nav-toggle" onClick={() => setIsMenuOpen(false)} style={{position: 'absolute', top: '24px', right: '24px', display: 'block'}}>
                <span className={`hamburger active`}>
                    <span></span><span></span><span></span>
                </span>
            </button>
      </div>

      {/* Terms Content */}
      <main className="privacy-content" style={{ paddingTop: '120px', paddingBottom: '80px', minHeight: '100vh', background: 'var(--gray-50)' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Header */}
          <div className="privacy-header" style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="section-badge" style={{ marginBottom: '16px', display: 'inline-flex' }}>
              <span className="badge-icon">📜</span>
              Syarat & Ketentuan
            </span>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '800', color: 'var(--dark)', marginBottom: '16px', lineHeight: '1.2' }}>
              Perjanjian Layanan VORCE
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
              Harap membaca perjanjian layanan ini dengan seksama sebelum menggunakan layanan kami.
            </p>
          </div>

          {/* Content Card */}
          <div className="content-card" style={{ background: 'white', borderRadius: '24px', padding: 'clamp(24px, 5vw, 48px)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Selamat Datang di VORCE</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Terima kasih telah menggunakan layanan kami.
              </p>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Anda dipersilakan untuk membaca Perjanjian Layanan berikut ini dengan seksama sebelum mengakses dan menggunakan layanan VORCE. Dengan mengakses platform dan/atau menggunakan layanan VORCE, Anda dianggap telah membaca, memahami, dan menyetujui seluruh isi Persyaratan Layanan ini.
              </p>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Pengguna yang berusia dibawah 18 tahun harus memperoleh persetujuan dan/atau pengawasan orang tua atau wali Anda.
              </p>
              <div style={{ background: 'var(--admin-orange-bg)', borderLeft: '4px solid var(--admin-orange-text)', padding: '20px', borderRadius: '8px' }}>
                <p style={{ color: 'var(--dark)', lineHeight: '1.6', margin: 0 }}>
                  Akses ke Layanan ini diizinkan sampai batas waktu yang telah ditentukan dan Anda berhak untuk menghentikan dan mengubah layanan dengan pemberitahuan terlebih dahulu. Jika pada kondisi tertentu Layanan tidak dapat diakses dengan alasan apapun, maka hal ini bukan sesuatu yang dapat dipermasalahkan di kemudian hari dan/atau dituntut baik secara perdata dan/atau pidana.
                </p>
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Para Pihak</h2>
              <div style={{ display: 'grid', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary)', marginBottom: '12px' }}>I. Pengendali Data (Data Controller)</h3>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                    <li>Perusahaan Pelanggan (Tenant)</li>
                    <li>Karyawan Perusahaan Pelanggan</li>
                  </ul>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary)', marginBottom: '12px' }}>II. Pemroses Data (Data Processor)</h3>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                    <li>VORCE</li>
                  </ul>
                </div>
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Ruang Lingkup Pemrosesan</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Pemroses Data memproses data pribadi semata-mata atas instruksi Pengendali data untuk penyediaan layanan VORCE, termasuk namun tidak terbatas pada:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {['Data Identitas Karyawan', 'Data presensi & kehadiran', 'Data komunikasi internal', 'Data biometric', 'Transkripsi suara ke teks', 'Optical Character Recognition'].map((item, i) => (
                  <div key={i} style={{ background: 'var(--gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--gray-100)', fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Jenis Data & Subjek Data</h2>
              <div style={{ display: 'grid', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px' }}>I. Subjek Data</h3>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                    <li>Karyawan</li>
                    <li>Kontraktor</li>
                    <li>Personel yang didaftarkan oleh Pengendali Data</li>
                  </ul>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px' }}>II. Jenis Data</h3>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                    <li>Identitas (nama, email, nomor karyawan)</li>
                    <li>Data kehadiran & lokasi</li>
                    <li>Data wajah (FaceID)</li>
                    <li>Dokumen & arsip HR</li>
                    <li>Hasil transkripsi</li>
                    <li>Hasil Optical Character Recognition</li>
                  </ul>
                </div>
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

             <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Kewajiban Pemroses Data</h2>
              <div style={{ background: 'var(--admin-blue-bg)', borderLeft: '4px solid var(--primary)', padding: '20px', borderRadius: '8px' }}>
                <p style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--dark)' }}>Pemroses Data Wajib:</p>
                <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                  <li>Memproses data sesuai instruksi Pengendali Data</li>
                  <li>Menjaga kerahasiaan dan keamanan data</li>
                  <li>Tidak menggunakan data untuk kepentingan pribadi</li>
                  <li>Tidak membagikan data kepada pihak ketiga tanpa persetujuan tertulis</li>
                  <li>Membantu pemenuhan hak subjek data</li>
                </ul>
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Sub-Processor</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Pemrosesan dapat menggunakan sub-processor (misalnya cloud, email, storage) dengan:
              </p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Standar keamanan yang setara</li>
                <li style={{ marginBottom: '8px' }}>Tanggung jawab tetap berada pada Pemroses Data</li>
              </ul>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Pengakhiran dan Penghapusan Data</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Setelah perjanjian berakhir:
              </p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Data dikembalikan atau dihapus sesuai permintaan Pengendali Data</li>
                <li style={{ marginBottom: '8px' }}>Dilakukan dalam jangka waktu yang disepakati</li>
              </ul>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-container" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <img src="/vorce-logo.svg" alt="Vorce Logo" width="40" height="40" />
                  <span className="logo-text" style={{fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: '#ffffff'}}>Vorce</span>
                </div>
              </div>
              <p>Kendali perusahaan dalam genggaman anda</p>
              <div className="footer-social" style={{ display: 'flex', gap: '12px' }}>
                 <a href="#" aria-label="LinkedIn" style={{ background: 'white', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <img src="https://www.svgrepo.com/show/448234/linkedin.svg" alt="LinkedIn" width="24" height="24" />
                </a>
                <a href="#" aria-label="Twitter" style={{ background: 'white', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <img src="https://www.svgrepo.com/show/448253/twitter.svg" alt="Twitter" width="24" height="24" />
                </a>
                <a href="#" aria-label="Instagram" style={{ background: 'white', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <img src="https://www.svgrepo.com/show/448229/instagram.svg" alt="Instagram" width="24" height="24" />
                </a>
                <a href="#" aria-label="YouTube" style={{ background: 'white', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <img src="https://www.svgrepo.com/show/448262/youtube.svg" alt="YouTube" width="24" height="24" />
                </a>
              </div>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Produk</h4>
                <a href="/#features">Fitur</a>
                <a href="/#pricing">Harga</a>
                <a href="/integrasi">Integrasi</a>
                <a href="/api-docs">API Docs</a>
              </div>
              <div className="footer-column">
                <h4>Perusahaan</h4>
                <a href="/tentang-kami">Tentang Kami</a>
                <a href="/karir">Karir</a>
                <a href="/blog">Blog</a>
                <a href="/press-kit">Press Kit</a>
              </div>
               <div className="footer-column">
                <h4>Support</h4>
                <a href="/help-center">Help Center</a>
                <a href="/hubungi-kami">Hubungi Kami</a>
                <a href="/status">Status</a>
                <a href="/security">Security</a>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <a href="/privacy">Kebijakan Privasi</a>
                <a href="/biometric">Klausul Biometrik</a>
                <a href="/terms" style={{ color: 'var(--primary)', fontWeight: '700' }}>Perjanjian Layanan</a>
                <a href="/sop">SOP Penghapusan Data</a>
                <a href="/perangkat-lunak">Perangkat Lunak</a>
                <div style={{fontSize: '12px', color: '#64748B', marginTop: '8px'}}>Versi 1.0.0</div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&#169; PT. Sama Mikro Solusi 2026 - Now. All rights reserved.</p>
            <div className="footer-badges" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src="/DunsRegisteredMark.png" alt="DUNS Registered" style={{ height: '40px', objectFit: 'contain', background: 'white', padding: '4px', borderRadius: '4px' }} />
              <img src="/pse-terdaftar.png" alt="PSE Terdaftar" style={{ height: '35px', objectFit: 'contain', background: 'white', padding: '4px', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
