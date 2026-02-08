import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan Privasi Vorce menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda. Pelajari hak-hak Anda sebagai pengguna.",
  openGraph: {
    title: "Kebijakan Privasi | Vorce",
    description: "Kebijakan Privasi Vorce menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.",
    url: "https://vorce.id/privacy",
  },
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
