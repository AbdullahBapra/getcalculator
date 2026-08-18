import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Same mark used in the header logo — a teal-600 rounded badge with three ascending
// bars, a tiny growth chart standing in for "every calculator here draws its own
// chart to explain the result" — so the browser tab icon matches the on-site brand.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          background: "#0d9488",
          borderRadius: 9,
        }}
      >
        <div style={{ position: "absolute", left: 8, bottom: 6, width: 4, height: 7, borderRadius: 2, background: "#ffffff" }} />
        <div style={{ position: "absolute", left: 14, bottom: 6, width: 4, height: 11, borderRadius: 2, background: "#ffffff" }} />
        <div style={{ position: "absolute", left: 20, bottom: 6, width: 4, height: 15, borderRadius: 2, background: "#ffffff" }} />
      </div>
    ),
    { ...size }
  );
}
