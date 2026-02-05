"use client";
import React from 'react';
import EmptyState from "@/components/EmptyState";
import { useParams } from "next/navigation";

export default function GenericPage() {
  const params = useParams();
  const slug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : "Page";
  
  // Format Title: "privasi-pengguna" -> "Privasi Pengguna"
  let formattedTitle = DecodeSlug(slug);

  // Manual overrides for better text
  const overrides: Record<string, string> = {
    "privasi-pengguna": "Privasi Pengguna",
    "kebijakan-vorce": "Kebijakan Layanan",
    "penggunaan-cookie": "Penggunaan Cookie",
    "perangkat-lunak": "Lisensi Perangkat Lunak",
    "tentang-kami": "Tentang Kami",
    "hubungi-kami": "Hubungi Kami",
    "security": "Keamanan Data",
    "keamanan-data": "Keamanan Data",
    "api-docs": "Dokumentasi API",
    "help-center": "Pusat Bantuan",
    "status": "Status Sistem",
    "karir": "Karir",
    "blog": "Blog",
    "press-kit": "Press Kit",
    "versi-1.0.0": "Catatan Rilis Versi 1.0.0"
  };

  if (overrides[slug.toLowerCase()]) {
    formattedTitle = overrides[slug.toLowerCase()];
  }

  return <EmptyState title={formattedTitle} />;
}

function DecodeSlug(slug: string) {
    return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
