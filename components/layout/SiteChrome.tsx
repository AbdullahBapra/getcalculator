"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CommandPalette from "./CommandPalette";

/** Embed pages (/embed/...) render with no header, nav or footer — just the calculator
 *  and a "Powered by" link — so they look right dropped into someone else's page. */
export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Note: "/embed/" with the trailing slash — NOT "/embed", which would also match
  // the (chromed, indexable) "/embed-calculators" hub page by string prefix.
  const isEmbed = pathname?.startsWith("/embed/");

  if (isEmbed) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CommandPalette />
    </>
  );
}
