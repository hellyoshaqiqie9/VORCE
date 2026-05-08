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

            {/* ── 1. Intro ── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Selamat Datang di VORCE</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>Terima kasih telah menggunakan layanan kami.</p>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Perlindungan informasi pribadi Anda merupakan hal yang sangat penting bagi kami. Oleh karena itu, informasi hanya akan dikumpulkan dan disimpan setelah Anda memberikan persetujuan. Penjelasan di bawah ini diharapkan dapat membantu Anda memahami tentang pengumpulan, penyimpanan dan penggunaan informasi tersebut.
              </p>
              <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
                Dengan mengakses VORCE, Anda menerima dan memahami hal-hal yang disampaikan dalam laman kebijakan privasi ini.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* ── 2. Peran Para Pihak ── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Peran Para Pihak</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>Dalam penggunaan layanan VORCE:</p>
              <ol style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}><strong>Perusahaan Pelanggan (Tenant)</strong> bertindak sebagai Pengendali Data (Data Controller).</li>
                <li style={{ marginBottom: '8px' }}><strong>Platform SaaS HR kami</strong> bertindak sebagai Pemroses Data (Data Processor).</li>
              </ol>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '16px' }}>
                Seluruh data karyawan diproses atas instruksi dan untuk kepentingan Perusahaan Pelanggan, sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* ── 3. Pemisahan Data ── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Pemisahan Data Antar Tenant</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>Kami menerapkan arsitektur sistem yang memastikan bahwa:</p>
              <ol style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Data milik satu Perusahaan tidak dapat diakses oleh Perusahaan lain</li>
                <li style={{ marginBottom: '8px' }}>Setiap tenant memiliki lingkungan data yang terisolasi</li>
                <li style={{ marginBottom: '8px' }}>Akses data dibatasi berdasarkan peran dan otorisasi pengguna</li>
              </ol>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* ── 4. Pengumpulan & Penggunaan Informasi ── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Pengumpulan dan Penggunaan Informasi</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Perlindungan informasi pribadi Anda merupakan hal yang sangat penting bagi kami. Oleh karena itu, informasi hanya akan dikumpulkan dan disimpan setelah Anda memberikan persetujuan.
              </p>

              {/* I. Saat Daftar */}
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', marginTop: '24px' }}>I. Ketika Anda mendaftar akun VORCE, informasi yang kami kumpulkan meliputi:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  'A. Nama Pengguna',
                  'B. Alamat Email',
                  'C. Alamat Tempat Tinggal (opsional)',
                  'D. Nomor Telepon (opsional)',
                  'E. Nomor Ponsel',
                  'F. Nomor MAC/Jenis Perangkat',
                  'G. Biometrik Wajah',
                ].map((item, i) => (
                  <div key={i} style={{ background: 'var(--gray-50)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--gray-100)', color: 'var(--dark)', fontWeight: '500', fontSize: '14px' }}>
                    {item}
                    {item.includes('Biometrik') && (
                      <a href="/biometric" style={{ display: 'block', fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>Baca juga Klausul Biometrik →</a>
                    )}
                  </div>
                ))}
              </div>

              {/* II. Saat Menggunakan */}
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dark)', marginBottom: '16px', marginTop: '32px' }}>II. Ketika Anda menggunakan layanan VORCE, informasi yang kami kumpulkan meliputi:</h3>

              {/* A. Kamera */}
              <div className="permission-item" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>camera_alt</span>
                  A. Kamera dan Data Biometrik
                </h4>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--text)' }}>Aplikasi kami menggunakan akses kamera untuk:</p>
                  <ol style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.8', fontSize: '15px' }}>
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Keperluan Face ID pada proses presensi masuk dan pulang:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        <li>Hanya digunakan saat pengguna melakukan proses presensi</li>
                        <li>Tidak digunakan secara terus-menerus atau di latar belakang</li>
                        <li>Tidak diaktifkan tanpa tindakan atau persetujuan pengguna</li>
                      </ul>
                    </li>
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Mengambil foto atau merekam video menggunakan Kamera GPS:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        <li>Hanya digunakan saat pengguna melakukan proses presensi</li>
                        <li>Tidak digunakan secara terus-menerus atau di latar belakang</li>
                        <li>Tidak diaktifkan tanpa tindakan atau persetujuan pengguna</li>
                      </ul>
                    </li>
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Melakukan Optical Character Recognition (OCR):</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        <li>Hanya aktif saat pengguna menggunakan fitur reimburse</li>
                        <li>Tidak merekam secara otomatis atau di latar belakang</li>
                        <li>Digunakan berdasarkan eksplisit dari pengguna</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Data biometrik tidak digunakan untuk:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        {['Periklanan', 'Profiling pengguna', 'Analitik pemasaran', 'Penjualan data', 'Tujuan lain di luar fungsi presensi'].map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>

              {/* B. Kontak */}
              <div className="permission-item" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>contacts</span>
                  B. Kontak
                </h4>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--text)' }}>Aplikasi kami menggunakan akses kontak pada perangkat pengguna untuk:</p>
                  <ol style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.8', fontSize: '15px' }}>
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Sinkronisasi kontak:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        <li>Hanya digunakan saat pengguna melakukan proses presensi</li>
                        <li>Tidak digunakan secara terus-menerus atau di latar belakang</li>
                        <li>Tidak diaktifkan tanpa tindakan atau persetujuan pengguna</li>
                      </ul>
                    </li>
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Membagikan atau memperbarui arsip nomor kontak baru di dalam aplikasi:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        <li>Hanya digunakan saat pengguna melakukan proses presensi</li>
                        <li>Tidak digunakan secara terus-menerus atau di latar belakang</li>
                        <li>Tidak diaktifkan tanpa tindakan atau persetujuan pengguna</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Data kontak tidak digunakan untuk:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        {['Periklanan', 'Profiling pengguna', 'Analitik pemasaran', 'Penjualan data', 'Tujuan lain di luar fungsi presensi'].map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>

              {/* C. Mikrofon */}
              <div className="permission-item" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>mic</span>
                  C. Mikrofon
                </h4>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--text)' }}>Aplikasi kami menggunakan akses mikrofon untuk:</p>
                  <ol style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.8', fontSize: '15px' }}>
                    {[
                      { title: 'Merekam suara pengguna', points: ['Hanya aktif saat pengguna menggunakan fitur perekam suara', 'Tidak merekam secara otomatis atau di latar belakang', 'Digunakan berdasarkan eksplisit dari pengguna'] },
                      { title: 'Melakukan transkripsi suara', points: ['Hanya aktif saat pengguna menggunakan fitur perekam suara', 'Tidak merekam secara otomatis atau di latar belakang', 'Digunakan berdasarkan eksplisit dari pengguna'] },
                      { title: 'Membagikan catatan suara baru ke fitur chat', points: ['Hanya aktif saat pengguna menggunakan fitur perekam suara', 'Tidak merekam secara otomatis atau di latar belakang', 'Digunakan berdasarkan eksplisit dari pengguna'] },
                    ].map((item, i) => (
                      <li key={i} style={{ marginBottom: '12px' }}>
                        <strong>{item.title}:</strong>
                        <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                          {item.points.map((p, j) => <li key={j}>{p}</li>)}
                        </ul>
                      </li>
                    ))}
                    <li>
                      <strong>Data suara tidak digunakan untuk:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        {['Periklanan', 'Profiling pengguna', 'Analitik pemasaran', 'Penjualan data', 'Tujuan lain di luar fungsi presensi'].map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>

              {/* D. Lokasi */}
              <div className="permission-item" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>location_on</span>
                  D. Lokasi
                </h4>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--text)' }}>Aplikasi kami menggunakan akses lokasi untuk:</p>
                  <ol style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.8', fontSize: '15px' }}>
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Mendukung proses presensi masuk dan pulang:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        <li>Digunakan hanya saat fitur presensi atau berbagi lokasi diaktifkan</li>
                        <li>Tidak digunakan untuk pelacakan berkelanjutan tanpa sepengetahuan pengguna</li>
                        <li>Tingkat akurasi lokasi menyesuaikan pengaturan izin pada perangkat pengguna</li>
                      </ul>
                    </li>
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Membagikan lokasi terbaru pengguna sesuai fitur aplikasi:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        <li>Digunakan hanya saat fitur presensi atau berbagi lokasi diaktifkan</li>
                        <li>Tidak digunakan untuk pelacakan berkelanjutan tanpa sepengetahuan pengguna</li>
                        <li>Tingkat akurasi lokasi menyesuaikan pengaturan izin pada perangkat pengguna</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Data lokasi tidak digunakan untuk:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        {['Periklanan', 'Profiling pengguna', 'Analitik pemasaran', 'Penjualan data', 'Tujuan lain di luar fungsi presensi'].map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>

              {/* E. Penyimpanan */}
              <div className="permission-item" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>folder</span>
                  E. Penyimpanan & File
                </h4>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--text)' }}>Aplikasi kami menggunakan akses penyimpanan perangkat untuk:</p>
                  <ol style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.8', fontSize: '15px' }}>
                    {[
                      'Membagikan dokumen atau media baru ke fitur chat',
                      'Membagikan bukti atau lampiran tugas',
                      'Membagikan dan mengelola arsip berkas baru',
                    ].map((title, i) => (
                      <li key={i} style={{ marginBottom: '12px' }}>
                        <strong>{title}:</strong>
                        <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                          <li>Terbatas pada file yang dipilih secara manual oleh pengguna</li>
                          <li>Tidak mengakses file lain di luar yang dipilih</li>
                          <li>Digunakan hanya untuk keperluan fungsional aplikasi</li>
                        </ul>
                      </li>
                    ))}
                    <li>
                      <strong>Data penyimpanan tidak digunakan untuk:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                        {['Periklanan', 'Profiling pengguna', 'Analitik pemasaran', 'Penjualan data', 'Tujuan lain di luar fungsi presensi'].map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>

              {/* F. Notifikasi */}
              <div className="permission-item">
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>notifications</span>
                  F. Notifikasi
                </h4>
                <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px' }}>
                  <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.8', fontSize: '15px' }}>
                    <li style={{ marginBottom: '8px' }}>Mengirimkan pemberitahuan terbaru dari aktivitas yang terjadi pada akun pengguna.</li>
                    <li>Memberikan informasi terperinci terkait tugas, pesan, presensi, atau pembaruan sistem.</li>
                  </ul>
                </div>
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* ── 5. Persetujuan & Kontrol ── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Persetujuan dan Kontrol Pengguna</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>Pengguna dapat:</p>
              <ol style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Menyetujui dan menolak izin tertentu saat diminta</li>
                <li style={{ marginBottom: '8px' }}>Menarik kembali izin saat pengaturan perangkat</li>
                <li style={{ marginBottom: '8px' }}>Tetap menggunakan sebagian fitur aplikasi meskipun izin tertentu dinonaktifkan (dengan keterbatasan fungsi)</li>
              </ol>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* ── 6. Penyimpanan & Retensi Data ── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Penyimpanan dan Retensi Data</h2>
              <ol style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Data disimpan selama hubungan kontraktual antara Platform dan Perusahaan Pelanggan masih berlaku.</li>
                <li style={{ marginBottom: '8px' }}>Retensi data mengikuti kebijakan internal Perusahaan Pelanggan.</li>
                <li style={{ marginBottom: '8px' }}>Setelah kontrak berakhir, data dapat dikembalikan atau dihapus sesuai permintaan tertulis.</li>
              </ol>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* ── 7. Penyimpanan & Retensi Data Wajah ── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Penyimpanan dan Retensi Data Wajah</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                VORCE tidak menyimpan data wajah mentah (raw face image) secara permanen untuk tujuan identifikasi biometrik.
              </p>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Apabila sistem menggunakan template biometrik atau representasi matematis wajah untuk proses pencocokan identitas, data tersebut hanya disimpan selama diperlukan untuk:
              </p>
              <ol style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>Proses autentikasi pengguna</li>
                <li style={{ marginBottom: '8px' }}>Validasi data presensi</li>
                <li style={{ marginBottom: '8px' }}>Keperluan audit internal Perusahaan Pelanggan</li>
                <li style={{ marginBottom: '8px' }}>Data biometrik tidak disimpan tanpa batas waktu</li>
              </ol>
              <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <p style={{ fontWeight: '600', color: 'var(--dark)', marginBottom: '12px' }}>Secara umum:</p>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-light)', lineHeight: '1.8', fontSize: '15px' }}>
                  <li style={{ marginBottom: '8px' }}>Data verifikasi sementara dapat dihapus otomatis setelah proses autentikasi selesai</li>
                  <li style={{ marginBottom: '8px' }}>Template biometrik dapat disimpan selama akun pengguna aktif atau selama hubungan kerja berlangsung</li>
                  <li>Setelah tidak lagi diperlukan, data akan dihapus, dianonimkan, atau dimusnahkan secara aman</li>
                </ul>
              </div>
              <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
                Retensi data mengikuti kebijakan Perusahaan Pelanggan sebagai Pengendali Data dan dilakukan berdasarkan prinsip minimisasi data.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* ── 8. Pembagian Data Biometrik ── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Pembagian Data Biometrik kepada Pihak Ketiga</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                VORCE tidak menjual maupun membagikan data biometrik pengguna kepada pihak ketiga untuk tujuan pemasaran atau komersial. Dalam kondisi tertentu, data dapat diproses oleh penyedia layanan pihak ketiga yang bertindak sebagai sub-pemroses data (sub-processor), seperti:
              </p>
              <ol style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>Penyedia cloud hosting</li>
                <li style={{ marginBottom: '8px' }}>Penyedia infrastruktur keamanan</li>
                <li style={{ marginBottom: '8px' }}>Penyedia layanan autentikasi atau pemrosesan biometrik</li>
                <li style={{ marginBottom: '8px' }}>Pihak ketiga tersebut hanya memproses data atas instruksi VORCE dan wajib menerapkan perlindungan data yang memadai sesuai perjanjian pemrosesan data yang berlaku</li>
                <li style={{ marginBottom: '8px' }}>Apabila pihak ketiga melakukan penyimpanan data biometrik, penyimpanan dilakukan hanya untuk mendukung fungsi autentikasi dan keamanan layanan, dalam jangka waktu terbatas sesuai kebutuhan operasional, serta tidak digunakan untuk kepentingan mereka sendiri</li>
              </ol>
              <div style={{ background: '#fef9ec', border: '1px solid #fde68a', borderRadius: '12px', padding: '20px' }}>
                <p style={{ fontWeight: '700', color: 'var(--dark)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: '#d97706' }}>verified_user</span>
                  Persetujuan Pengguna
                </p>
                <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '10px', fontSize: '15px' }}>
                  Dengan menggunakan fitur presensi berbasis pengenalan wajah pada VORCE, pengguna menyatakan telah memahami dan memberikan persetujuan atas pemrosesan data biometrik sebagaimana dijelaskan dalam Kebijakan Privasi ini.
                </p>
                <p style={{ color: 'var(--text-light)', lineHeight: '1.8', fontSize: '14px' }}>
                  Pengguna dapat menolak atau mencabut izin akses kamera melalui pengaturan perangkat, namun beberapa fitur layanan mungkin tidak dapat digunakan secara optimal.
                </p>
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* ── 9. Keamanan Data ── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Keamanan Data</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>
                Kami menerapkan langkah teknis dan organisasi yang wajar untuk melindungi data, termasuk:
              </p>
              <ol style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Pembatasan akses berbasis peran.</li>
                <li style={{ marginBottom: '8px' }}>Isolasi data antar tenant.</li>
                <li style={{ marginBottom: '8px' }}>Perlindungan terhadap akses tidak sah.</li>
              </ol>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* ── 10. Hak Subjek Data ── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Hak Subjek Data</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '16px' }}>Karyawan sebagai subjek data berhak untuk:</p>
              <ol style={{ paddingLeft: '24px', color: 'var(--text)', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '8px' }}>Mengakses dan memperbarui data</li>
                <li style={{ marginBottom: '8px' }}>Meminta koreksi atau penghapusan data</li>
                <li style={{ marginBottom: '8px' }}>Mengajukan keberatan atau pemrosesan tertentu</li>
              </ol>
              <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '16px', fontStyle: 'italic', background: 'var(--primary-light-10)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                Permintaan tersebut diproses melalui Perusahaan Pelanggan sebagai Pengendali Data.
              </p>
            </section>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '40px 0' }}></div>

            {/* ── 11. Perubahan Kebijakan ── */}
            <section>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--dark)', marginBottom: '16px' }}>Perubahan Kebijakan Privasi</h2>
              <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
                VORCE dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu sesuai perkembangan layanan, teknologi, maupun ketentuan hukum yang berlaku. Setiap perubahan akan diinformasikan melalui aplikasi atau media komunikasi resmi lainnya.
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
                <a href="https://wa.me/6285835644607">Hubungi Kami</a>
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
