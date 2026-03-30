import { ImageResponse } from "next/og"

export const size = {
  width: 180,
  height: 180,
}

export const contentType = "image/png"

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
          background: "#ffffff",
          borderRadius: 28,
          border: "10px solid #5f43ef",
          color: "#1f2937",
          fontWeight: 800,
          fontSize: 74,
          fontFamily: "Arial",
          letterSpacing: "-0.04em",
        }}
      >
        CW
      </div>
    ),
    {
      ...size,
    }
  )
}
