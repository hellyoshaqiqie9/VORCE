import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // Core Metadata
  title: {
    default: "Vorce | Software HR & Manajemen Bisnis All-in-One Indonesia",
    template: "%s | Vorce"
  },
  description: "Vorce adalah platform manajemen bisnis terlengkap di Indonesia. Kelola absensi GPS, presensi Face ID, reimburse OCR, tugas tim, dan arsip digital dalam satu aplikasi. Mulai gratis sekarang!",
  keywords: [
    "Vorce", "software HR zIndonesia", "aplikasi absensi", "absensi GPS", "presensi Face ID", 
    "manajemen karyawan", "HRIS Indonesia", "aplikasi HR", "software manajemen bisnis",
    "task management", "reimburse online", "arsip digital", "payroll Indonesia",
    "attendance software", "employee management", "workforce management"
  ],
  authors: [{ name: "PT. Sama Mikro Solusi", url: "https://vorce.id" }],
  creator: "PT. Sama Mikro Solusi",
  publisher: "Vorce",
  
  // Canonical & Alternates
  metadataBase: new URL("https://vorce.id"),
  alternates: {
    canonical: "/",
    languages: {
      'id-ID': '/',
    },
  },
  
  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/vorceku.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/vorceku.png",
    apple: "/vorceku.png",
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Open Graph
  openGraph: {
    title: "Vorce | Software HR & Manajemen Bisnis All-in-One Indonesia",
    description: "Platform manajemen bisnis terlengkap di Indonesia. Kelola absensi GPS, presensi Face ID, reimburse OCR, tugas tim, dan arsip digital dalam satu aplikasi.",
    url: "https://vorce.id",
    siteName: "Vorce",
    images: [
      {
        url: "https://vorce.id/vorceku.png",
        width: 512,
        height: 512,
        alt: "Vorce Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Vorce | Software HR & Manajemen Bisnis All-in-One Indonesia",
    description: "Platform manajemen bisnis terlengkap di Indonesia. Kelola absensi, tugas tim, dan arsip digital dalam satu aplikasi.",
    images: ["https://vorce.id/vorceku.png"],
    creator: "@vorce_id",
    site: "@vorce_id",
  },
  
  // Verification (add your actual verification codes)
  verification: {
    google: "pTrKF7Sly5cZYCtthX16C5wCW05Benn7bfqBUgxJkJc",
    // yandex: 'yandex-verification-code',
    // bing: 'bing-verification-code',
  },
  
  // Category
  category: "technology",
  
  // Other
  other: {
    'msapplication-TileColor': '#7857FF',
    'theme-color': '#7857FF',
  },
};

// Structured Data (JSON-LD) for Organization
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Vorce",
  "alternateName": "PT. Sama Mikro Solusi",
  "url": "https://vorce.id",
  "logo": "https://vorce.id/vorce-logo.svg",
  "image": "https://vorce.id/vorceku.png",
  "description": "Platform manajemen bisnis terlengkap di Indonesia untuk kelola absensi, tugas tim, dan arsip digital.",
  "foundingDate": "2024",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "ID",
    "addressLocality": "Indonesia"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+62-812-3456-7890",
    "contactType": "customer service",
    "availableLanguage": ["Indonesian", "English"]
  },
  "sameAs": [
    "https://www.linkedin.com/company/vorce",
    "https://twitter.com/vorce_id",
    "https://www.instagram.com/vorce.id",
    "https://www.youtube.com/@vorce"
  ]
};

// Structured Data for Software Application
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Vorce",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, Android, iOS",
  "offers": {
    "@type": "Offer",
    "price": "32000",
    "priceCurrency": "IDR",
    "priceValidUntil": "2027-12-31"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150",
    "bestRating": "5",
    "worstRating": "1"
  },
  "featureList": [
    "Presensi Berbasis GPS",
    "Face ID Anti-Spoofing", 
    "Reimburse dengan OCR",
    "Manajemen Tugas Kanban",
    "Obrolan Tim Real-time",
    "Arsip Digital",
    "Kamera GPS",
    "Perekam Suara & Transkripsi"
  ]
};

// Structured Data for WebSite with Sitelinks Search
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Vorce",
  "url": "https://vorce.id",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://vorce.id/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

// Breadcrumb Schema
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Beranda",
      "item": "https://vorce.id"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Fitur",
      "item": "https://vorce.id/#features"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Harga",
      "item": "https://vorce.id/#pricing"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "FAQ",
      "item": "https://vorce.id/#faq"
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        
        {/* Google Fonts - Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Google Material Icons */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        
        {/* Favicon & Apple Touch Icon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/vorceku.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/vorceku.png" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#7857FF" />
        <meta name="msapplication-TileColor" content="#7857FF" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://vorce.id" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
