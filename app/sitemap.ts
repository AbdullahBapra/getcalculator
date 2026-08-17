import type { MetadataRoute } from "next";
import { ALL_CALCULATORS, CATEGORIES } from "@/lib/calculators/registry";
import { UNIT_CATEGORIES, allUnitPairs } from "@/lib/units";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/convert`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/embed-calculators`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  for (const cat of CATEGORIES) {
    entries.push({ url: `${SITE_URL}/${cat.key}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 });
  }
  for (const c of ALL_CALCULATORS) {
    entries.push({ url: `${SITE_URL}/${c.category}/${c.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  }
  for (const uc of UNIT_CATEGORIES) {
    entries.push({ url: `${SITE_URL}/convert/${uc.key}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const p of allUnitPairs()) {
    entries.push({ url: `${SITE_URL}/convert/${p.category}/${p.slug}`, lastModified: now, changeFrequency: "yearly", priority: 0.4 });
  }

  return entries;
}
