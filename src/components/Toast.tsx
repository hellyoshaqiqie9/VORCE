"use client";

import React, { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for transition out
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success": return "check_circle";
      case "error": return "error";
      case "warning": return "warning";
      case "info":
      default: return "info";
    }
  };

  return (
    <div className={`toast-container ${isVisible ? "animate-in" : "animate-out"}`}>
      <div className={`toast-card ${type}`}>
        <div className="icon-wrapper">
          <span className="material-icons">{getIcon()}</span>
        </div>
        <div className="message-content">
          <p>{message}</p>
        </div>
        <button className="close-toast" onClick={() => setIsVisible(false)}>
          <span className="material-icons">close</span>
        </button>
      </div>

      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          pointer-events: auto;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-in {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        .animate-out {
          transform: translateY(-20px) scale(0.95);
          opacity: 0;
        }

        .toast-card {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 320px;
          max-width: 450px;
          padding: 14px 18px;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .toast-card.success {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.3);
        }
        .toast-card.success .icon-wrapper { color: #22c55e; }

        .toast-card.error {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .toast-card.error .icon-wrapper { color: #ef4444; }

        .toast-card.warning {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.3);
        }
        .toast-card.warning .icon-wrapper { color: #f59e0b; }

        .toast-card.info {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .toast-card.info .icon-wrapper { color: #3b82f6; }

        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-wrapper .material-icons {
          font-size: 24px;
        }

        .message-content {
          flex: 1;
          color: #1e293b;
          font-weight: 500;
          font-size: 14px;
          line-height: 1.5;
        }

        .close-toast {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .close-toast:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .close-toast .material-icons {
          font-size: 18px;
        }
      `}</style>
    </div>
  );
};

export default Toast;
