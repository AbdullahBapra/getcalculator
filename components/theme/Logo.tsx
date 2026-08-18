/** The brand mark: a rounded teal badge with three ascending bars — a tiny growth
 *  chart. Every calculator on this site draws its own chart or gauge to explain the
 *  result instead of just printing a number, so the mark is that idea reduced to its
 *  simplest possible shape rather than a literal calculator icon or a generic
 *  checkmark. Reads cleanly from favicon scale up.
 *
 *  The bars grow in from the baseline once on load (pure CSS, see .logo-bar-* in
 *  globals.css — no JS, so it can't hit the requestAnimationFrame mount-gate trap
 *  documented on ResultChart.tsx) and give a little bounce on hover — wrap this in an
 *  element with className "logo-mark" (Header/Footer's <Link> already has it) to get
 *  the hover interaction; the mark still works fine without that wrapper. */
export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="7" fill="#0d9488" />
      <rect className="logo-bar logo-bar-1" x="6" y="13" width="3" height="5" rx="1.5" fill="#ffffff" />
      <rect className="logo-bar logo-bar-2" x="10.5" y="10" width="3" height="8" rx="1.5" fill="#ffffff" />
      <rect className="logo-bar logo-bar-3" x="15" y="7" width="3" height="11" rx="1.5" fill="#ffffff" />
    </svg>
  );
}
