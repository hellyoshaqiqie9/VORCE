"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../landing.css";

export default function PrivacyPage() {
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

      {/* Privacy Content */}
      <main className="privacy-content" style={{ paddingTop: '120px', paddingBottom: '80px', minHeight: '100vh', background: 'var(--gray-50)' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Header */}
          <div className="privacy-header" style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="section-badge" style={{ marginBottom: '16px', display: 'inline-flex' }}>
              <span className="badge-icon">🔒</span>
              Keamanan Data
            </span>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '800', color: 'var(--dark)', marginBottom: '16px', lineHeight: '1.2' }}>
              Kebijakan Privasi VORCE
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
              Kami berkomitmen untuk melindungi privasi dan keamanan data Anda.
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
                Perlindungan informasi pribadi Anda merupakan hal yang sangat penting bagi kami. Oleh karena itu, informasi hanya akan dikumpulkan dan disimpan setelah Anda memberikan persetujuan. Penjelasan di bawah ini diharapkan dapat membantu Anda memahami tentang pengumpulan, penyimpanan dan penggunaan informasi tersebut.
              </p>
              <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
                Dengan mengakses VORCE, Anda menerima dan memahami hal-hal yang disampaikan dalam laman kebijakan privasi ini.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Peran Para Pihak</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Dalam penggunaan layanan VORCE:
              </p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}><strong>Perusahaan Pelanggan (Tenant)</strong> bertindak sebagai Pengendali Data (Data Controller).</li>
                <li style={{ marginBottom: '8px' }}><strong>Platform SaaS HR kami</strong> bertindak sebagai Pemroses Data (Data Processor).</li>
              </ul>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '16px' }}>
                Seluruh data karyawan diproses atas instruksi dan untuk kepentingan Perusahaan Pelanggan, sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Pemisahan Data Antar Tenant</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Kami menerapkan arsitektur sistem yang memastikan bahwa:
              </p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Data milik satu Perusahaan tidak dapat diakses oleh Perusahaan lain</li>
                <li style={{ marginBottom: '8px' }}>Setiap tenant memiliki lingkungan data yang terisolasi</li>
                <li style={{ marginBottom: '8px' }}>Akses data dibatasi berdasarkan peran dan otorisasi pengguna</li>
              </ul>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Pengumpulan dan Penggunaan Informasi</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '24px' }}>
                Ketika Anda mendaftar akun VORCE, informasi yang kami kumpulkan meliputi:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {['Nama Pengguna', 'Alamat Email', 'Alamat Tempat Tinggal', 'Nomor Telepon', 'Nomor Ponsel', 'Nomor MAC/Jenis Perangkat'].map((item, i) => (
                  <div key={i} style={{ background: 'var(--gray-50)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--gray-100)', color: 'var(--dark)', fontWeight: '500' }}>
                    {item}
                  </div>
                ))}
              </div>

              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '24px' }}>
                Ketika Anda menggunakan layanan VORCE, informasi sensitif yang kami akses meliputi:
              </p>

              <div className="permission-item" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>camera_alt</span>
                  Kamera
                </h3>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--text)' }}>Aplikasi kami menggunakan akses kamera untuk:</p>
                  <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.6', fontSize: '15px' }}>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Keperluan Face ID pada proses presensi masuk dan pulang:</strong> Hanya digunakan saat pengguna melakukan proses presensi, tidak digunakan secara terus-menerus atau di latar belakang, dan tidak diaktifkan tanpa tindakan atau persetujuan pengguna.
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Mengambil foto atau merekam video menggunakan Kamera GPS:</strong> Hanya digunakan saat pengguna melakukan proses presensi, tidak digunakan secara terus-menerus atau di latar belakang.
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      Data wajah yang diproses digunakan semata-mata untuk verifikasi presensi dan tidak digunakan untuk tujuan lain di luar fungsi tersebut.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="permission-item" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>contacts</span>
                  Kontak
                </h3>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--text)' }}>Aplikasi kami menggunakan akses kontak untuk:</p>
                  <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.6', fontSize: '15px' }}>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Sinkronisasi kontak:</strong> Hanya digunakan saat pengguna melakukan proses presensi, tidak digunakan secara terus-menerus atau di latar belakang.
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Membagikan atau memperbarui arsip nomor kontak baru:</strong> Hanya digunakan saat pengguna melakukan proses presensi.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="permission-item" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>mic</span>
                  Mikrofon
                </h3>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--text)' }}>Aplikasi kami menggunakan akses mikrofon untuk:</p>
                  <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.6', fontSize: '15px' }}>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Merekam suara pengguna:</strong> Hanya aktif saat pengguna menggunakan fitur perekam suara, tidak merekam secara otomatis.
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Melakukan transkripsi suara:</strong> Hanya aktif saat pengguna menggunakan fitur perekam suara.
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Membagikan catatan suara ke fitur chat:</strong> Hanya aktif saat pengguna menggunakan fitur perekam suara.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="permission-item" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>location_on</span>
                  Lokasi
                </h3>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--text)' }}>Aplikasi kami menggunakan akses lokasi untuk:</p>
                  <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.6', fontSize: '15px' }}>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Mendukung proses presensi masuk dan pulang:</strong> Digunakan hanya saat fitur presensi atau berbagi lokasi diaktifkan. Tidak digunakan untuk pelacakan berkelanjutan tanpa sepengetahuan pengguna.
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Membagikan lokasi terbaru pengguna:</strong> Digunakan hanya saat fitur presensi atau berbagi lokasi diaktifkan.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="permission-item" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>folder</span>
                  Penyimpanan & File
                </h3>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--text)' }}>Aplikasi kami menggunakan akses penyimpanan untuk:</p>
                  <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.6', fontSize: '15px' }}>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Membagikan dokumen atau media baru ke fitur chat:</strong> Terbatas pada file yang dipilih secara manual oleh pengguna.
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Membagikan bukti atau lampiran tugas:</strong> Terbatas pada file yang dipilih secara manual oleh pengguna.
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Membagikan dan mengelola arsip berkas baru:</strong> Terbatas pada file yang dipilih secara manual oleh pengguna.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="permission-item">
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>notifications</span>
                  Notifikasi
                </h3>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.6', fontSize: '15px' }}>
                    <li style={{ marginBottom: '8px' }}>Mengirimkan pemberitahuan terbaru dari aktivitas yang terjadi pada akun pengguna.</li>
                    <li style={{ marginBottom: '8px' }}>Memberikan informasi terperinci terkait tugas, pesan, presensi, atau pembaruan sistem.</li>
                  </ul>
                </div>
              </div>
            </section>

             <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

             <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Persetujuan dan Kontrol Pengguna</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Pengguna dapat:
              </p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Menyetujui dan menolak izin tertentu saat diminta</li>
                <li style={{ marginBottom: '8px' }}>Menarik kembali izin saat pengaturan perangkat</li>
                <li style={{ marginBottom: '8px' }}>Tetap menggunakan sebagian fitur aplikasi meskipun izin tertentu dinonaktifkan (dengan keterbatasan fungsi)</li>
              </ul>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            <section style={{ marginBottom: '40px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Penyimpanan dan Retensi Data</h2>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                    <li style={{ marginBottom: '8px' }}>Data disimpan selama hubungan kontraktual antara Platform dan Perusahaan Pelanggan masih berlaku.</li>
                    <li style={{ marginBottom: '8px' }}>Retensi data mengikuti kebijakan internal Perusahaan Pelanggan.</li>
                    <li style={{ marginBottom: '8px' }}>Setelah kontrak berakhir, data dapat dikembalikan atau dihapus sesuai permintaan tertulis.</li>
                  </ul>
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Keamanan Data</h2>
                  <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                    Kami menerapkan langkah teknis dan organisasi yang wajar untuk melindungi data, termasuk:
                  </p>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                    <li style={{ marginBottom: '8px' }}>Pembatasan akses berbasis peran.</li>
                    <li style={{ marginBottom: '8px' }}>Isolasi data antar tenant.</li>
                    <li style={{ marginBottom: '8px' }}>Perlindungan terhadap akses tidak sah.</li>
                  </ul>
                </div>
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Hak Subjek Data</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Karyawan sebagai subjek data berhak untuk:
              </p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Mengakses dan memperbarui data</li>
                <li style={{ marginBottom: '8px' }}>Meminta koreksi atau penghapusan data</li>
                <li style={{ marginBottom: '8px' }}>Mengajukan keberatan atau pemrosesan tertentu</li>
              </ul>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '16px', fontStyle: 'italic', background: 'var(--primary-light-10)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                Permintaan tersebut diproses melalui Perusahaan Pelanggan sebagai Pengendali Data.
              </p>
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
                {/* Social Icons based on JSON (linkedin, twitter, instagram, youtube) */}
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
                <a href="#features">Fitur</a>
                <a href="#pricing">Harga</a>
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
                <a href="/privacy" style={{ color: 'var(--primary)', fontWeight: '700' }}>Kebijakan Privasi</a>
                <a href="/biometric">Klausul Biometrik</a>
                <a href="/terms">Perjanjian Layanan</a>
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
