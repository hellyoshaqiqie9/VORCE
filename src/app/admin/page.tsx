"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Always clear session when visiting login page to force re-login
    localStorage.removeItem("adminLoggedIn");
    setIsChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo credentials: admin@clickdown.com / admin1234
    if (email === "admin@vorce.com" && password === "admin1234") {
      localStorage.setItem("adminLoggedIn", "true");
      router.push("/admin/dashboard");
    } else {
      setShowError(true);
    }
  };

  if (isChecking) {
    return (
      <div className="admin-login-page">
        <div className="login-container">
          <div className="login-header">
            <p>Loading...</p>
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <Image 
              src="/vorce-logo.svg" 
              alt="Vorce Logo" 
              width={48} 
              height={48}
              style={{ objectFit: 'contain' }}
            />
            <span style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Vorce</span>
          </div>
          <h1 style={{ marginTop: '1rem' }}>Admin Panel</h1>
          <p>Masuk untuk mengakses dashboard</p>
        </div>

        {showError && (
          <div className="error-message">
            <span className="material-icons">error</span>
            Email atau password salah
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <span className="material-icons">email</span>
              <input 
                type="email" 
                id="email"
                className="form-control"
                placeholder="admin@vorce.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="material-icons">lock</span>
              <input 
                type="password" 
                id="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" id="remember" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="btn-login">
            <span className="material-icons">login</span>
            Sign In
          </button>
        </form>

        <div className="back-link">
          <a href="/">
            <span className="material-icons">arrow_back</span>
            Back to Website
          </a>
        </div>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .admin-login-page {
    font-family: 'Montserrat', Arial, sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
  }

  .login-container {
    background: rgba(255, 255, 255, 0.95);
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 420px;
    backdrop-filter: blur(10px);
  }

  .login-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .login-header .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .login-header .logo span {
    font-size: 24px;
    font-weight: 700;
    color: #292d34;
  }

  .login-header h1 {
    font-size: 24px;
    color: #292d34;
    margin-bottom: 8px;
  }

  .login-header p {
    color: #666;
    font-size: 14px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #292d34;
    font-size: 14px;
  }

  .input-wrapper {
    position: relative;
  }

  .input-wrapper .material-icons {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    font-size: 20px;
  }

  .form-control {
    width: 100%;
    padding: 14px 15px 14px 50px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 14px;
    font-family: 'Montserrat', sans-serif;
    transition: all 0.3s ease;
  }

  .form-control:focus {
    outline: none;
    border-color: #0066FF;
    box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    font-size: 13px;
  }

  .remember-me {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .remember-me input {
    width: 16px;
    height: 16px;
    accent-color: #0066FF;
  }

  .forgot-password {
    color: #0066FF;
    text-decoration: none;
    font-weight: 500;
  }

  .forgot-password:hover {
    text-decoration: underline;
  }

  .btn-login {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    font-family: 'Montserrat', sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .btn-login:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 102, 255, 0.4);
  }

  .back-link {
    text-align: center;
    margin-top: 25px;
  }

  .back-link a {
    color: #666;
    text-decoration: none;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: color 0.3s ease;
  }

  .back-link a:hover {
    color: #0066FF;
  }

  .error-message {
    background: #fee2e2;
    color: #dc2626;
    padding: 12px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .error-message .material-icons {
    font-size: 16px;
  }
`;
