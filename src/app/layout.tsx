import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Loaded globally (self-hosted via next/font, no runtime Google Fonts
// request) so it's available wherever --font-heading/--font-body reference
// it; only the (workspace) route group's scoped tokens actually use it.
const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "MVCC Data — Reporting Integrity Dashboard",
  description:
    "A reporting-integrity dashboard for NYC's motor-vehicle collision record.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif4.variable}`}
    >
      <body>
        <div
          style={{
            minHeight: "100vh",
            background: "#f8fafc",
            color: "#0f172a",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
