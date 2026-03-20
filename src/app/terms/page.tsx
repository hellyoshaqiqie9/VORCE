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
              <a href="https://wa.me/6285835644607?text=Halo%20Vorce,%20saya%20ingin%20menghubungi%20sales" className="nav-btn-primary">
                <span>Hubungi Sales</span>
                <div className="btn-shine"></div>
              </a>
            </div>
          </div>

          {/* Mobile Sales Button */}
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
              <a href="https://wa.me/6285835644607?text=Halo%20Vorce,%20saya%20ingin%20menghubungi%20sales" className="nav-btn-primary" onClick={() => setIsMenuOpen(false)}>
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
            
            {/* 1. Pendahuluan */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>1. Pendahuluan</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Perjanjian Layanan ini (“Perjanjian”) merupakan perjanjian yang mengikat secara hukum antara Anda (“Pelanggan” atau “Pengendali Data”) dan VORCE (“Penyedia Layanan” atau “Pemroses Data”).
              </p>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Dengan mengakses atau menggunakan layanan VORCE (“Layanan”), Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan dalam Perjanjian ini.
              </p>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Jika Anda menggunakan Layanan atas nama badan usaha, Anda menyatakan memiliki kewenangan hukum untuk mengikat badan usaha tersebut.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 2. Definisi */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>2. Definisi</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '12px' }}>Dalam Perjanjian ini:</p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}><strong>“Data Pribadi”</strong> adalah informasi yang dapat mengidentifikasi individu</li>
                <li style={{ marginBottom: '8px' }}><strong>“Pengendali Data”</strong> adalah pihak yang menentukan tujuan dan cara pemrosesan data</li>
                <li style={{ marginBottom: '8px' }}><strong>“Pemroses Data”</strong> adalah pihak yang memproses data atas nama Pengendali Data</li>
                <li style={{ marginBottom: '8px' }}><strong>“Subjek Data”</strong> adalah individu yang datanya diproses</li>
                <li style={{ marginBottom: '8px' }}><strong>“Sub-Processor”</strong> adalah pihak ketiga yang ditunjuk oleh Pemroses Data</li>
              </ul>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 3. Kelayakan Pengguna */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>3. Kelayakan Pengguna</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
                Pengguna harus berusia minimal 18 tahun atau telah memperoleh persetujuan dari orang tua atau wali.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 4. Hak Akses dan Ketersediaan Layanan */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>4. Hak Akses dan Ketersediaan Layanan</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                VORCE memberikan hak terbatas, non-eksklusif, dan tidak dapat dialihkan untuk menggunakan Layanan.
              </p>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '12px', fontWeight: '600' }}>VORCE berhak untuk:</p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>Mengubah atau menghentikan Layanan</li>
                <li style={{ marginBottom: '8px' }}>Melakukan pemeliharaan sistem</li>
                <li style={{ marginBottom: '8px' }}>Membatasi akses jika diperlukan</li>
              </ul>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                Layanan disediakan “sebagaimana adanya” tanpa jaminan bebas gangguan atau kesalahan.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 5. Peran dan Tanggung Jawab */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '24px' }}>5. Peran dan Tanggung Jawab</h2>
              <div style={{ display: 'grid', gap: '32px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px' }}>5.1 Pengendali Data</h3>
                  <p style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>Bertanggung jawab atas:</p>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8', margin: 0 }}>
                    <li>Legalitas pengumpulan data</li>
                    <li>Pemberitahuan kepada Subjek Data</li>
                    <li>Dasar hukum pemrosesan</li>
                  </ul>
                </div>
                <div style={{ background: 'rgba(120, 87, 255, 0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(120, 87, 255, 0.1)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px' }}>5.2 Pemroses Data (VORCE)</h3>
                  <p style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>Memproses data:</p>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8', margin: 0 }}>
                    <li>Berdasarkan instruksi Pengendali Data</li>
                    <li>Untuk tujuan penyediaan layanan</li>
                  </ul>
                </div>
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 6. Ruang Lingkup Pemrosesan */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>6. Ruang Lingkup Pemrosesan</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>Meliputi:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                {[
                  'Data identitas', 
                  'Data kehadiran dan lokasi', 
                  'Data komunikasi', 
                  'Data biometrik (Face Recognition)', 
                  'Transkripsi suara', 
                  'OCR'
                ].map((item, i) => (
                  <div key={i} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span style={{ color: 'var(--primary)', fontSize: '18px' }}>✓</span>
                    <span style={{ fontWeight: '600', color: 'var(--dark)', fontSize: '14px' }}>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 7. Jenis dan Subjek Data */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '24px' }}>7. Jenis dan Subjek Data</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--dark)', marginBottom: '12px' }}>7.1 Subjek Data</h3>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                    <li>Karyawan</li>
                    <li>Kontraktor</li>
                    <li>Personel terdaftar</li>
                  </ul>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--dark)', marginBottom: '12px' }}>7.2 Jenis Data</h3>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                    <li>Nama, email, nomor karyawan</li>
                    <li>Lokasi dan kehadiran</li>
                    <li>Data biometrik</li>
                    <li>Dokumen HR</li>
                    <li>Hasil transkripsi dan OCR</li>
                  </ul>
                </div>
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 8. Kewajiban Pemroses Data */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>8. Kewajiban Pemroses Data</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '12px' }}>VORCE wajib:</p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Memproses sesuai instruksi</li>
                <li style={{ marginBottom: '8px' }}>Menjaga kerahasiaan dan keamanan</li>
                <li style={{ marginBottom: '8px' }}>Tidak menyalahgunakan data</li>
                <li style={{ marginBottom: '8px' }}>Membantu pemenuhan hak subjek data</li>
                <li style={{ marginBottom: '8px' }}>Memberitahukan pelanggaran data</li>
              </ul>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 9. Keamanan Data */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>9. Keamanan Data</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '12px' }}>Meliputi:</p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Enkripsi</li>
                <li style={{ marginBottom: '8px' }}>Kontrol akses</li>
                <li style={{ marginBottom: '8px' }}>Monitoring sistem</li>
                <li style={{ marginBottom: '8px' }}>Proteksi akses tidak sah</li>
              </ul>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 10. Sub-Processor */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>10. Sub-Processor</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '12px' }}>Dapat digunakan dengan syarat:</p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Standar keamanan setara</li>
                <li style={{ marginBottom: '8px' }}>Tetap dalam tanggung jawab VORCE</li>
              </ul>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 11. Transfer Data Internasional */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>11. Transfer Data Internasional</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '12px' }}>Dilakukan dengan:</p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Perlindungan memadai</li>
                <li style={{ marginBottom: '8px' }}>Mekanisme legal yang sah (SCC, dll.)</li>
              </ul>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 12. Retensi dan Penghapusan */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>12. Retensi dan Penghapusan</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
                Data disimpan sesuai kebutuhan layanan. Setelah berakhir: dikembalikan atau dihapus.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 13. Hak Subjek Data */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>13. Hak Subjek Data</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '12px' }}>Meliputi:</p>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Akses</li>
                <li style={{ marginBottom: '8px' }}>Koreksi</li>
                <li style={{ marginBottom: '8px' }}>Penghapusan</li>
                <li style={{ marginBottom: '8px' }}>Pembatasan pemrosesan</li>
              </ul>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 14. Batasan Tanggung Jawab */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>14. Batasan Tanggung Jawab</h2>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Tidak bertanggung jawab atas kerugian tidak langsung</li>
                <li style={{ marginBottom: '8px' }}>Batas tanggung jawab sesuai nilai pembayaran</li>
              </ul>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 15. Pengakhiran */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>15. Pengakhiran</h2>
              <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Dapat diakhiri oleh salah satu pihak</li>
                <li style={{ marginBottom: '8px' }}>Akses dihentikan dan data diproses sesuai ketentuan</li>
              </ul>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 16. Hukum yang Berlaku */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>16. Hukum yang Berlaku</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
                Mengikuti yurisdiksi yang ditentukan oleh VORCE.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 17. Perubahan Perjanjian */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>17. Perubahan Perjanjian</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
                Dapat diperbarui dengan pemberitahuan kepada Pelanggan.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 18. Ketentuan Lain */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>18. Ketentuan Lain</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
                Jika ada ketentuan tidak sah, ketentuan lainnya tetap berlaku.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* 19. Pembelian Paket Layanan dan Pembayaran */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--dark)', marginBottom: '24px', padding: '12px 20px', background: 'var(--gray-50)', borderRadius: '12px', borderLeft: '6px solid var(--primary)' }}>
                19. Pembelian Paket Layanan dan Pembayaran
              </h2>
              
              <div style={{ display: 'grid', gap: '40px' }}>
                
                {/* 19.1 & 19.2 */}
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>19.1 Paket Layanan & 19.2 Model Berlangganan</h3>
                  <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                    VORCE menyediakan paket berlangganan dengan fitur, harga, dan batas penggunaan yang berbeda, sebagaimana ditampilkan pada platform. Layanan menggunakan model berlangganan:
                  </p>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                    <li>Bulanan atau tahunan</li>
                    <li>Berlaku sejak pembayaran berhasil</li>
                    <li>Dapat diperpanjang otomatis (auto-renewal)</li>
                  </ul>

                  <div style={{ background: 'rgba(120, 87, 255, 0.05)', padding: '24px', borderRadius: '16px', border: '1px dashed var(--primary)' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px' }}>Add-On Layanan (Penyimpanan+)</h4>
                    <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '12px' }}>
                      VORCE menyediakan layanan tambahan berupa Penyimpanan+ (Storage Add-On):
                    </p>
                    <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8', marginBottom: '12px' }}>
                      <li>Menambah kapasitas penyimpanan di luar paket utama</li>
                      <li>Terintegrasi dengan total kapasitas akun</li>
                      <li>Dapat dibeli dalam bentuk paket tambahan atau berdasarkan penggunaan</li>
                      <li>Masa aktif mengikuti paket utama atau sesuai pembelian</li>
                    </ul>
                    <p style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>Ketentuan tambahan:</p>
                    <ul style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                      <li>Jika kapasitas terlampaui, sistem dapat tetap berjalan dengan mekanisme penggunaan tambahan (overage) atau pembatasan layanan</li>
                      <li>Jika masa aktif berakhir, kapasitas tambahan dapat dinonaktifkan</li>
                      <li>Pelanggan bertanggung jawab atas pengelolaan data yang melebihi kapasitas</li>
                    </ul>
                  </div>
                </div>

                {/* 19.3 & 19.4 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                   <div style={{ background: 'var(--gray-50)', padding: '20px', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--dark)', marginBottom: '12px' }}>19.3 Pembayaran</h3>
                    <ul style={{ paddingLeft: '20px', color: 'var(--text)', lineHeight: '1.6', fontSize: '14px' }}>
                      <li>Mengikuti harga yang berlaku saat pembelian</li>
                      <li>Menggunakan metode pembayaran yang tersedia</li>
                      <li>Bersifat final dan non-refundable (kecuali diwajibkan hukum)</li>
                    </ul>
                  </div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#EF4444', marginBottom: '12px' }}>19.4 Kegagalan Pembayaran</h3>
                    <p style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>VORCE berhak:</p>
                    <ul style={{ paddingLeft: '20px', color: 'var(--text)', lineHeight: '1.6', fontSize: '14px' }}>
                      <li>Menangguhkan layanan</li>
                      <li>Membatasi fitur</li>
                      <li>Mengakhiri layanan</li>
                    </ul>
                  </div>
                </div>

                {/* 19.5 to 19.9 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  {[
                    { t: '19.5 Perubahan Paket', d: 'Upgrade berlaku segera (prorated). Downgrade berlaku periode berikutnya.' },
                    { t: '19.6 Batas Penggunaan', d: 'Jika melebihi batas, layanan dapat dibatasi atau dikenakan biaya tambahan/upgrade.' },
                    { t: '19.7 Pembatalan', d: 'Dapat dilakukan kapan saja dan berlaku hingga akhir periode aktif.' },
                    { t: '19.8 Promo', d: 'Berlaku sesuai syarat dan dapat diubah atau dihentikan sewaktu-waktu.' },
                    { t: '19.9 Pajak', d: 'Harga yang ditampilkan mungkin belum termasuk pajak yang berlaku sesuai regulasi.' }
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '16px', border: '1px solid var(--gray-100)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--dark)', marginBottom: '8px' }}>{item.t}</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: '1.5', margin: 0 }}>{item.d}</p>
                    </div>
                  ))}
                </div>

              </div>
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
                <a href="https://wa.me/6285835644607">Hubungi Kami</a>
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
