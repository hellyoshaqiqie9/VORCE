import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SOP Penghapusan Data Karyawan",
  description: "Standar Operasional Prosedur penghapusan data karyawan resign di Vorce. Pelajari proses retensi dan penghapusan data sesuai regulasi.",
  openGraph: {
    title: "SOP Penghapusan Data Karyawan | Vorce",
    description: "Standar Operasional Prosedur penghapusan data karyawan resign di Vorce.",
    url: "https://vorce.id/sop",
  },
  alternates: {
    canonical: "/sop",
  },
};

export default function SopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
