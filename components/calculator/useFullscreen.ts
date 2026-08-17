"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Safari (desktop + iOS) still only exposes the vendor-prefixed Fullscreen API — these
// small casts are the standard, safe way to feature-detect both without `any`.
interface PrefixedFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}
interface PrefixedFullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

/** Toggle a specific element (via the returned ref) into true OS-level fullscreen —
 *  matches the "Full Screen Calculator" pattern both competitor sites use for their
 *  keypad/abacus-style tools. Falls back to a no-op on browsers without support. */
export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const el = document.documentElement as PrefixedFullscreenElement;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!(el.requestFullscreen || el.webkitRequestFullscreen));

    function onChange() {
      const doc = document as PrefixedFullscreenDocument;
      const current = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setIsFullscreen(current === ref.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const enter = useCallback(() => {
    const el = ref.current as PrefixedFullscreenElement | null;
    if (!el) return;
    (el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.())?.catch?.(() => {});
  }, []);

  const exit = useCallback(() => {
    const doc = document as PrefixedFullscreenDocument;
    (doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.())?.catch?.(() => {});
  }, []);

  const toggle = useCallback(() => (isFullscreen ? exit() : enter()), [isFullscreen, enter, exit]);

  return { ref, isFullscreen, supported, toggle };
}
