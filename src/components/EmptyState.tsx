"use client";

import Link from "next/link";
import React from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
}

export default function EmptyState({ title, description = "Halaman ini sedang dalam tahap pengembangan. Kami sedang menyiapkan konten terbaik untuk Anda." }: EmptyStateProps) {
  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "20px",
      marginTop: "80px", // Compensate for fixed navbar
      background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)"
    }}>
      <div style={{
        width: "120px", height: "120px", 
        background: "white", 
        borderRadius: "50%",
        boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
        display: "flex", alignItems: "center", justifyContent: "center", 
        marginBottom: "32px",
        border: "1px solid #F1F5F9"
      }}>
        <span className="material-icons" style={{ fontSize: "56px", color: "#94A3B8" }}>hourglass_empty</span>
      </div>
      
      <h1 style={{ 
        fontSize: "32px", 
        fontWeight: "800", 
        color: "#0F172A", 
        marginBottom: "16px",
        letterSpacing: "-0.03em"
      }}>
        {title}
      </h1>
      
      <p style={{ 
        fontSize: "16px", 
        color: "#64748B", 
        maxWidth: "480px", 
        marginBottom: "40px", 
        lineHeight: "1.6" 
      }}>
        {description}
      </p>
      
      <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/" style={{
            padding: "14px 28px",
            background: "#0F172A",
            color: "white",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.2s",
            boxShadow: "0 10px 20px rgba(15, 23, 42, 0.15)"
          }}>
            Kembali ke Beranda
          </Link>
          <a href="https://wa.me/6285835644607" target="_blank" style={{
            padding: "14px 28px",
            background: "white",
            color: "#0F172A",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.2s",
            border: "1px solid #E2E8F0"
          }}>
            Hubungi Kami
          </a>
      </div>
    </div>
  );
}
