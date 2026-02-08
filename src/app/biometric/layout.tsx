import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Klausul Biometrik & Face Recognition",
  description: "Klausul Biometrik Vorce menjelaskan penggunaan teknologi pengenalan wajah untuk verifikasi kehadiran. Pelajari bagaimana data biometrik Anda dilindungi.",
  openGraph: {
    title: "Klausul Biometrik & Face Recognition | Vorce",
    description: "Klausul Biometrik Vorce menjelaskan penggunaan teknologi pengenalan wajah untuk verifikasi kehadiran.",
    url: "https://vorce.id/biometric",
  },
  alternates: {
    canonical: "/biometric",
  },
};

export default function BiometricLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
