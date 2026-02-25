"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { loginWithGoogle, isAuthenticated } from "@/lib/auth";

export default function AdminLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated()) {
      router.push("/admin/dashboard");
      return;
    }
    setIsChecking(false);
  }, [router]);

  const handleGoogleLogin = async () => {
    if (isLoading) return; // Prevent double-click

    setIsLoading(true);
    setError(null);

    const result = await loginWithGoogle();

    if (result.success) {
      router.push("/admin/dashboard");
    } else {
      setError(result.error || "Login gagal. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="admin-login-page">
        <div className="login-container">
          <div className="login-header">
            <div className="loading-spinner" />
            <p style={{ color: '#666', marginTop: '16px' }}>Memuat...</p>
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      {/* Background decoration */}
      <div className="bg-decoration">
        <div className="bg-circle bg-circle-1" />
        <div className="bg-circle bg-circle-2" />
        <div className="bg-circle bg-circle-3" />
      </div>

      <div className="login-container">
        {/* Logo & Header */}
        <div className="login-header">
          <div className="logo-badge">
            <Image 
              src="/vorce-logo.svg" 
              alt="Vorce Logo" 
              width={52} 
              height={52}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1>Masuk ke <span className="brand-text">Vorce</span></h1>
          <p>Akses dashboard admin untuk mengelola bisnis Anda</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="material-icons">error_outline</span>
            <div>
              <strong>Login Gagal</strong>
              <p>{error}</p>
            </div>
            <button 
              className="error-close"
              onClick={() => setError(null)}
              aria-label="Tutup"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          className={`btn-google ${isLoading ? 'btn-loading' : ''}`}
          onClick={handleGoogleLogin}
          disabled={isLoading}
          id="google-signin-button"
        >
          {isLoading ? (
            <>
              <div className="loading-spinner-small" />
              <span>Memproses login...</span>
            </>
          ) : (
            <>
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Masuk dengan Google</span>
            </>
          )}
        </button>

        {/* Info */}
        <div className="login-info">
          <span className="material-icons">info</span>
          <p>Gunakan akun Google yang terdaftar sebagai admin Vorce untuk melanjutkan.</p>
        </div>

        {/* Divider */}
        <div className="divider">
          <span>atau</span>
        </div>

        {/* Back to Website */}
        <a href="/" className="btn-back">
          <span className="material-icons">arrow_back</span>
          Kembali ke Website
        </a>

        {/* Footer */}
        <div className="login-footer">
          <p>© 2025 Vorce — PT. Sama Mikro Solusi</p>
          <div className="footer-links">
            <a href="/privacy">Privasi</a>
            <span>·</span>
            <a href="/terms">Ketentuan</a>
          </div>
        </div>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .admin-login-page {
    font-family: 'Plus Jakarta Sans', 'Montserrat', Arial, sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0a0a1a;
    position: relative;
    overflow: hidden;
    padding: 24px;
  }

  /* Background Decoration */
  .bg-decoration {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .bg-circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.4;
  }

  .bg-circle-1 {
    width: 500px;
    height: 500px;
    background: #7857FF;
    top: -150px;
    right: -100px;
    animation: floatBg 8s ease-in-out infinite;
  }

  .bg-circle-2 {
    width: 400px;
    height: 400px;
    background: #0066FF;
    bottom: -100px;
    left: -100px;
    animation: floatBg 10s ease-in-out infinite reverse;
  }

  .bg-circle-3 {
    width: 300px;
    height: 300px;
    background: #FF6B35;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.15;
    animation: floatBg 12s ease-in-out infinite;
  }

  @keyframes floatBg {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(20px, -20px); }
  }

  /* Login Container */
  .login-container {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 48px 40px;
    border-radius: 28px;
    width: 100%;
    max-width: 440px;
    position: relative;
    z-index: 1;
    animation: fadeInUp 0.6s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Header */
  .login-header {
    text-align: center;
    margin-bottom: 36px;
  }

  .logo-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(120, 87, 255, 0.15), rgba(0, 102, 255, 0.1));
    border: 1px solid rgba(120, 87, 255, 0.2);
    margin-bottom: 24px;
    animation: fadeInUp 0.6s ease-out 0.1s both;
  }

  .login-header h1 {
    font-size: 26px;
    color: #ffffff;
    margin-bottom: 8px;
    font-weight: 700;
    letter-spacing: -0.5px;
    animation: fadeInUp 0.6s ease-out 0.2s both;
  }

  .brand-text {
    background: linear-gradient(135deg, #7857FF, #0066FF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .login-header p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    line-height: 1.5;
    animation: fadeInUp 0.6s ease-out 0.3s both;
  }

  /* Error Message */
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    padding: 14px 16px;
    border-radius: 14px;
    font-size: 13px;
    margin-bottom: 24px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    animation: shake 0.4s ease-in-out;
  }

  .error-message .material-icons {
    font-size: 20px;
    color: #ef4444;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .error-message div {
    flex: 1;
  }

  .error-message strong {
    display: block;
    color: #fca5a5;
    font-weight: 600;
    margin-bottom: 2px;
    font-size: 13px;
  }

  .error-message p {
    margin: 0;
    color: rgba(252, 165, 165, 0.8);
    font-size: 12px;
    line-height: 1.4;
  }

  .error-close {
    background: none;
    border: none;
    color: rgba(252, 165, 165, 0.6);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
  }

  .error-close:hover {
    color: #fca5a5;
  }

  .error-close .material-icons {
    font-size: 18px;
    color: inherit;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    50% { transform: translateX(6px); }
    75% { transform: translateX(-3px); }
  }

  /* Google Button */
  .btn-google {
    width: 100%;
    padding: 16px 24px;
    background: #ffffff;
    color: #1f1f1f;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Plus Jakarta Sans', 'Montserrat', sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    animation: fadeInUp 0.6s ease-out 0.4s both;
    position: relative;
    overflow: hidden;
  }

  .btn-google::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(120, 87, 255, 0.05), rgba(0, 102, 255, 0.05));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .btn-google:hover:not(:disabled)::before {
    opacity: 1;
  }

  .btn-google:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(120, 87, 255, 0.25);
  }

  .btn-google:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-google:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-loading {
    background: rgba(255, 255, 255, 0.9);
  }

  .google-icon {
    flex-shrink: 0;
  }

  /* Loading Spinners */
  .loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(120, 87, 255, 0.2);
    border-top-color: #7857FF;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto;
  }

  .loading-spinner-small {
    width: 20px;
    height: 20px;
    border: 2.5px solid rgba(120, 87, 255, 0.2);
    border-top-color: #7857FF;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Info */
  .login-info {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 20px;
    padding: 14px 16px;
    background: rgba(120, 87, 255, 0.06);
    border: 1px solid rgba(120, 87, 255, 0.1);
    border-radius: 12px;
    animation: fadeInUp 0.6s ease-out 0.5s both;
  }

  .login-info .material-icons {
    font-size: 18px;
    color: #7857FF;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .login-info p {
    margin: 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    line-height: 1.5;
  }

  /* Divider */
  .divider {
    display: flex;
    align-items: center;
    margin: 28px 0;
    animation: fadeInUp 0.6s ease-out 0.55s both;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
  }

  .divider span {
    padding: 0 16px;
    color: rgba(255, 255, 255, 0.3);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* Back Button */
  .btn-back {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    animation: fadeInUp 0.6s ease-out 0.6s both;
  }

  .btn-back:hover {
    border-color: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    background: rgba(255, 255, 255, 0.03);
  }

  .btn-back .material-icons {
    font-size: 18px;
  }

  /* Footer */
  .login-footer {
    text-align: center;
    margin-top: 32px;
    animation: fadeInUp 0.6s ease-out 0.65s both;
  }

  .login-footer p {
    color: rgba(255, 255, 255, 0.25);
    font-size: 11px;
    margin-bottom: 6px;
  }

  .footer-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 11px;
  }

  .footer-links a {
    color: rgba(255, 255, 255, 0.35);
    text-decoration: none;
    transition: color 0.3s;
  }

  .footer-links a:hover {
    color: #7857FF;
  }

  .footer-links span {
    color: rgba(255, 255, 255, 0.15);
  }

  /* Mobile Responsive */
  @media (max-width: 480px) {
    .login-container {
      padding: 36px 24px;
      border-radius: 20px;
    }

    .login-header h1 {
      font-size: 22px;
    }

    .logo-badge {
      width: 64px;
      height: 64px;
      border-radius: 18px;
    }
  }
`;
