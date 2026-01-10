import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  // Brand colors
  const brandPrimary = "#d4846a";
  const brandAccent = "#f8ebe4";

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
          {/* Outer ring */}
          <circle cx="20" cy="20" r="16" fill={brandAccent} stroke={brandPrimary} strokeWidth="2" />
          {/* Inner circle */}
          <circle cx="20" cy="20" r="8" fill={brandPrimary} />
          {/* Rays */}
          <line x1="20" y1="4" x2="20" y2="10" stroke={brandPrimary} strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="8" x2="24" y2="12" stroke={brandPrimary} strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="8" x2="16" y2="12" stroke={brandPrimary} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
