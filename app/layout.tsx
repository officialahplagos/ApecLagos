import type { Metadata, Viewport } from "next";
import { InstallApp } from "./components/InstallApp";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.apeclagos.org.ng"),
  title: "APEC Lagos | Elderly Care Provider Platform",
  description:
    "Membership, missing elder alerts, caregiver references, and safeguarding workflows for elderly care providers in Lagos State.",
  applicationName: "APEC Lagos",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "APEC Lagos",
    title: "APEC Lagos | Elderly Care Provider Platform",
    description:
      "Membership, missing elder alerts, caregiver references, and safeguarding workflows for elderly care providers in Lagos State.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/apec-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/icons/apec-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "APEC Lagos",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <InstallApp />
      </body>
    </html>
  );
}
