"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ─── INNER COMPONENT (uses useSearchParams) ──────────
function InviteContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("id") || "";
  const invited = searchParams.get("invited") === "true";

  const [companyName, setCompanyName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Android package & iOS bundle
  const ANDROID_PACKAGE = "com.samamikrosolusi.vorce";
  const IOS_BUNDLE = "com.samamikrosolusi.vorce";
  const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
  const APP_STORE_URL = `https://apps.apple.com/id/app/vorce/id6740043498`;

  // Deep link URI for the mobile app
  const deepLinkUrl = `vorce://invite?id=${encodeURIComponent(companyId)}&invited=true`;
  const intentUrl = `intent://invite?id=${encodeURIComponent(companyId)}&invited=true#Intent;scheme=vorce;package=${ANDROID_PACKAGE};end`;

  // Fetch company info
  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    const fetchCompany = async () => {
      try {
        const res = await fetch(
          `https://asia-southeast2-hora-7394b.cloudfunctions.net/api/api/company/info?id=${encodeURIComponent(companyId)}`
        );
        if (res.ok) {
          const data = await res.json();
          const name = data?.namaPerusahaan || data?.data?.namaPerusahaan || data?.name || "";
          setCompanyName(name);
        }
      } catch {
        // Silently fail – we'll still show the invite page
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [companyId]);

  // Auto-redirect to app on mobile
  useEffect(() => {
    if (!companyId || !invited) return;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Try to open the app via deep link
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
      // Android Intent URL – will open app if installed, or go to Play Store
      window.location.href = intentUrl;
    } else {
      // iOS – try custom scheme, fallback to App Store
      window.location.href = deepLinkUrl;
      setTimeout(() => {
        // If we're still here after 2s, app isn't installed
        window.location.href = APP_STORE_URL;
      }, 2000);
    }

    setRedirectAttempted(true);
  }, [companyId, invited]);

  // Countdown for desktop fallback
  useEffect(() => {
    if (!redirectAttempted) return;
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [redirectAttempted, countdown]);

  // No company ID provided
  if (!companyId) {
    return (
      <div className="invite-page">
        <div className="invite-card error">
          <div className="icon-circle error">
            <span className="material-icons">link_off</span>
          </div>
          <h1>Link Tidak Valid</h1>
          <p>Link undangan ini tidak mengandung kode perusahaan yang valid.</p>
          <a href="https://vorce.id" className="btn primary">
            <span className="material-icons">home</span>
            Kembali ke Beranda
          </a>
        </div>
        <InviteStyles />
      </div>
    );
  }

  return (
    <div className="invite-page">
      <div className="invite-card">
        {/* Header */}
        <div className="brand">
          <img src="/vorceku.png" alt="Vorce" className="brand-logo" />
        </div>

        {/* Company badge */}
        <div className="company-badge">
          <div className="company-icon">
            <span className="material-icons">business</span>
          </div>
          <div className="company-info">
            <span className="company-label">Anda diundang bergabung</span>
            <h2 className="company-name">
              {isLoading ? (
                <span className="skeleton-text">&nbsp;</span>
              ) : (
                companyName || `Perusahaan (${companyId})`
              )}
            </h2>
          </div>
        </div>

        {/* Invitation steps */}
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Buka Vorce App</h3>
              <p>Pastikan aplikasi Vorce sudah terinstall di HP Anda</p>
            </div>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Register / Login</h3>
              <p>Daftar akun baru atau masuk dengan akun Google atau Apple</p>
            </div>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Otomatis Bergabung</h3>
              <p>Anda akan langsung terdaftar sebagai staff di perusahaan ini</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="cta-section">
          <a href={deepLinkUrl} className="btn primary large">
            <span className="material-icons">open_in_new</span>
            Buka di Aplikasi Vorce
          </a>

          <div className="store-buttons">
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="store-btn">
              <img src="/GooglePlayBadge_ID.svg" alt="Get it on Google Play" />
            </a>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="store-btn">
              <svg viewBox="0 0 120 40" className="appstore-badge">
                <rect width="120" height="40" rx="5" fill="#000" />
                <text x="60" y="15" textAnchor="middle" fill="#fff" fontSize="7" fontFamily="Arial">Download on the</text>
                <text x="60" y="28" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="Arial">App Store</text>
              </svg>
            </a>
          </div>

          <div className="divider">
            <span>atau</span>
          </div>

          <div className="manual-code">
            <p>Masukkan kode undangan secara manual di aplikasi:</p>
            <div className="code-box">
              <code>{companyId}</code>
              <button
                className="copy-code"
                onClick={() => {
                  navigator.clipboard.writeText(companyId);
                }}
                title="Salin kode"
              >
                <span className="material-icons">content_copy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer">
          <p>
            Dengan bergabung, Anda menyetujui{" "}
            <a href="/terms">Ketentuan Layanan</a> dan{" "}
            <a href="/privacy">Kebijakan Privasi</a> Vorce.
          </p>
        </div>
      </div>

      <InviteStyles />
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────
function InviteStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

      .invite-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
        font-family: 'Plus Jakarta Sans', sans-serif;
        position: relative;
        overflow: hidden;
      }

      .invite-page::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle at 30% 50%, rgba(118, 105, 254, 0.15) 0%, transparent 50%),
                    radial-gradient(circle at 70% 50%, rgba(69, 165, 209, 0.1) 0%, transparent 50%);
        animation: float 20s linear infinite;
      }

      @keyframes float {
        0% { transform: translate(0, 0) rotate(0deg); }
        50% { transform: translate(-20px, -20px) rotate(180deg); }
        100% { transform: translate(0, 0) rotate(360deg); }
      }

      .invite-card {
        position: relative;
        width: 100%;
        max-width: 480px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 28px;
        overflow: hidden;
        box-shadow: 0 32px 64px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
        animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes cardIn {
        from { opacity: 0; transform: translateY(40px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .invite-card.error {
        text-align: center;
        padding: 48px 32px;
      }

      .icon-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      }

      .icon-circle.error {
        background: #fee2e2;
      }

      .icon-circle .material-icons {
        font-size: 40px;
        color: #ef4444;
      }

      .invite-card h1 {
        font-size: 22px;
        font-weight: 800;
        color: #1e293b;
        margin: 0 0 8px;
      }

      .invite-card > p {
        font-size: 14px;
        color: #64748b;
        line-height: 1.6;
      }

      /* Brand */
      .brand {
        padding: 28px 32px 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .brand-logo {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      /* Company Badge */
      .company-badge {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 24px 24px 0;
        padding: 20px;
        background: linear-gradient(135deg, #f0edff 0%, #e8f4fd 100%);
        border-radius: 16px;
        border: 1px solid rgba(118, 105, 254, 0.15);
      }

      .company-icon {
        width: 52px;
        height: 52px;
        min-width: 52px;
        border-radius: 14px;
        background: linear-gradient(135deg, #7669fe 0%, #45a5d1 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(118, 105, 254, 0.3);
      }

      .company-icon .material-icons {
        font-size: 26px;
        color: white;
      }

      .company-info {
        flex: 1;
        min-width: 0;
      }

      .company-label {
        font-size: 12px;
        font-weight: 600;
        color: #7669fe;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .company-name {
        font-size: 18px;
        font-weight: 800;
        color: #1e293b;
        margin: 4px 0 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .skeleton-text {
        display: inline-block;
        width: 160px;
        height: 20px;
        border-radius: 6px;
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* Steps */
      .steps {
        padding: 24px 32px;
      }

      .step {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .step-number {
        width: 36px;
        height: 36px;
        min-width: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7669fe 0%, #9b8aff 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 15px;
        box-shadow: 0 4px 12px rgba(118, 105, 254, 0.25);
      }

      .step-content h3 {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 2px;
      }

      .step-content p {
        font-size: 12px;
        color: #64748b;
        margin: 0;
        line-height: 1.5;
      }

      .step-line {
        width: 2px;
        height: 20px;
        background: #e2e8f0;
        margin-left: 17px;
      }

      /* CTA Section */
      .cta-section {
        padding: 0 32px 24px;
      }

      .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 14px 24px;
        border-radius: 14px;
        font-size: 15px;
        font-weight: 700;
        text-decoration: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        border: none;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }

      .btn.primary {
        background: linear-gradient(135deg, #7669fe 0%, #5a4fd4 100%);
        color: white;
        box-shadow: 0 8px 24px rgba(118, 105, 254, 0.35);
      }

      .btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(118, 105, 254, 0.45);
      }

      .btn.primary:active {
        transform: translateY(0);
      }

      .btn.large {
        width: 100%;
        padding: 16px 24px;
        font-size: 16px;
      }

      .btn .material-icons {
        font-size: 22px;
      }

      /* Store buttons */
      .store-buttons {
        display: flex;
        gap: 12px;
        margin-top: 16px;
        justify-content: center;
      }

      .store-btn {
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }

      .store-btn:hover {
        transform: scale(1.05);
      }

      .store-btn img,
      .store-btn svg {
        height: 40px;
        border-radius: 6px;
      }

      .appstore-badge {
        height: 40px;
        width: 120px;
      }

      /* Divider */
      .divider {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 24px 0;
      }

      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #e2e8f0;
      }

      .divider span {
        font-size: 12px;
        color: #94a3b8;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* Manual code */
      .manual-code {
        text-align: center;
      }

      .manual-code p {
        font-size: 13px;
        color: #64748b;
        margin: 0 0 12px;
      }

      .code-box {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 14px 20px;
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
      }

      .code-box code {
        font-size: 22px;
        font-weight: 800;
        color: #7669fe;
        letter-spacing: 3px;
        font-family: 'Plus Jakarta Sans', monospace;
      }

      .copy-code {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background: white;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .copy-code:hover {
        background: #7669fe;
        color: white;
        border-color: #7669fe;
      }

      .copy-code .material-icons {
        font-size: 18px;
      }

      /* Footer */
      .card-footer {
        padding: 16px 32px;
        border-top: 1px solid #f1f5f9;
        text-align: center;
      }

      .card-footer p {
        font-size: 11px;
        color: #94a3b8;
        margin: 0;
        line-height: 1.6;
      }

      .card-footer a {
        color: #7669fe;
        text-decoration: none;
        font-weight: 600;
      }

      .card-footer a:hover {
        text-decoration: underline;
      }

      @media (max-width: 520px) {
        .invite-page { padding: 16px; }
        .invite-card { border-radius: 22px; }
        .brand { padding: 24px 24px 0; }
        .company-badge { margin: 20px 20px 0; padding: 16px; }
        .steps { padding: 20px 24px; }
        .cta-section { padding: 0 24px 20px; }
        .card-footer { padding: 14px 24px; }
      }
    `}</style>
  );
}

// ─── MAIN PAGE (with Suspense boundary) ──────────────
export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "4px solid rgba(255,255,255,0.2)",
            borderTopColor: "#7669fe",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
