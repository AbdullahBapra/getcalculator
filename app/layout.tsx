import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
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

// Used only for the "GetCalculator" wordmark next to the logo — a geometric sans with
// a slightly technical, numeric feel (its digits are its most distinctive glyphs),
// so the brand name itself echoes "a calculator" instead of just reusing body text.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "GetCalculator — Free Online Calculators",
    template: "%s | GetCalculator",
  },
  description:
    "Free online calculators for finance, health, math and everyday life — every result shows the formula and the steps, with no interstitial ads and no account required.",
};

// viewport-fit=cover lets content draw under the iOS home-indicator/notch area, which
// is required for env(safe-area-inset-bottom) to resolve to anything but 0 — needed so
// the fixed mobile tab bar (MobileTabBar.tsx) pads itself clear of the home indicator
// instead of sitting flush against it.
export const viewport: Viewport = {
  viewportFit: "cover",
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <CurrencyProvider>
          <SiteChrome>{children}</SiteChrome>
        </CurrencyProvider>
      </body>
    </html>
  );
}
