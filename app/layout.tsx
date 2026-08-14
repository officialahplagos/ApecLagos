import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APEC Lagos | Elderly Care Provider Platform",
  description:
    "Membership, missing elder alerts, caregiver references, and safeguarding workflows for elderly care providers in Lagos State.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
