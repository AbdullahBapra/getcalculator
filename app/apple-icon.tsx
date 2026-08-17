import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon — same teal-600 "GC" mark as the header logo and the browser-tab
// icon (icon.tsx), just rendered larger since apple-touch-icon has no rounded corners
// applied by the OS on some versions, so a bit of radius here keeps it from looking bare.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d9488",
          borderRadius: 36,
          color: "#ffffff",
          fontSize: 84,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        GC
      </div>
    ),
    { ...size }
  );
}
