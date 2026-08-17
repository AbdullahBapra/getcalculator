import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export default function PoweredBy({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? "py-2 text-center text-xs text-zinc-400 dark:text-zinc-600" : "mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600"}>
      Powered by{" "}
      <Link href={SITE_URL} target={compact ? "_blank" : undefined} rel={compact ? "noopener noreferrer" : undefined} className="font-medium text-teal-600 hover:underline dark:text-teal-400">
        {SITE_NAME}
      </Link>
    </p>
  );
}
