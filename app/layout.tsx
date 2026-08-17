import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteChrome from "@/components/layout/SiteChrome";
import { CurrencyProvider } from "@/components/currency/CurrencyContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GetCalculator — Free Online Calculators",
    template: "%s | GetCalculator",
  },
  description:
    "Free online calculators for finance, health, math and everyday life — every result shows the formula and the steps, with no interstitial ads and no account required.",
};

// Runs before first paint (inline, synchronous, first thing in <body>) so the
// correct theme applies immediately — no flash of the wrong theme on load.
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('gc:theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <CurrencyProvider>
          <SiteChrome>{children}</SiteChrome>
        </CurrencyProvider>
      </body>
    </html>
  );
}
