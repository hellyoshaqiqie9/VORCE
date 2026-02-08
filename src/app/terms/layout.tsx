import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perjanjian Layanan",
  description: "Perjanjian Layanan Vorce mengatur ketentuan penggunaan platform manajemen bisnis kami. Baca syarat dan ketentuan lengkap di sini.",
  openGraph: {
    title: "Perjanjian Layanan | Vorce",
    description: "Perjanjian Layanan Vorce mengatur ketentuan penggunaan platform manajemen bisnis kami.",
    url: "https://vorce.id/terms",
  },
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
