import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon — same teal-600 ascending-bars mark as the header logo and the
// browser-tab icon (icon.tsx), scaled up. A bit of radius here keeps it from looking
// bare on OS versions that don't auto-round apple-touch-icon.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          background: "#0d9488",
          borderRadius: 40,
        }}
      >
        <div style={{ position: "absolute", left: 45, bottom: 34, width: 22, height: 39, borderRadius: 11, background: "#ffffff" }} />
        <div style={{ position: "absolute", left: 79, bottom: 34, width: 22, height: 62, borderRadius: 11, background: "#ffffff" }} />
        <div style={{ position: "absolute", left: 113, bottom: 34, width: 22, height: 85, borderRadius: 11, background: "#ffffff" }} />
      </div>
    ),
    { ...size }
  );
}
