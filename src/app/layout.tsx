import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vorce | Platform Manajemen Bisnis All-in-One",
  description: "Kelola seluruh operasional bisnis Anda dalam satu platform. Dari absensi karyawan hingga pengelolaan aset perusahaan.",
  keywords: "Vorce, manajemen bisnis, HR software, absensi, task management, Indonesia",
  authors: [{ name: "Vorce" }],
  icons: {
    icon: "/vorce-logo.svg",
    shortcut: "/vorce-logo.svg",
    apple: "/vorce-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Google Fonts */}
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
        {/* Favicon */}
        <link rel="icon" href="/assets/uploads/1768209897559_vorce.svg" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
