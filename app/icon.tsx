import { ImageResponse } from "next/og"

export const size = {
  width: 512,
  height: 512,
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #5f43ef 0%, #2094f3 100%)",
          color: "#ffffff",
          fontWeight: 800,
          fontSize: 220,
          fontFamily: "Arial",
          letterSpacing: "-0.06em",
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
