import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { PreviewProvider } from "@/components/workspace";
export const metadata: Metadata = {
  title: "Diamond Alibi · Development preview",
  applicationName: "Diamond Alibi",
  description: "The stats don't lie. Your teammates might.",
  icons: {
    icon: [
      { url: "/brand/diamond-alibi-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/diamond-alibi-icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/brand/diamond-alibi-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Diamond Alibi",
    statusBarStyle: "black-translucent",
  },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#071A2B",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PreviewProvider>{children}</PreviewProvider>
      </body>
    </html>
  );
}
