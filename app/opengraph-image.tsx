import { ImageResponse } from "next/og";

export const alt = "Chop Lean: calorie-counted Nigerian meal plans in Lagos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#3D6B1F", color: "white", padding: 72 }}>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>Chop<span style={{ color: "#F6B81A" }}>Lean</span></div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, lineHeight: 1.02, fontWeight: 700, maxWidth: 940 }}>
          <span>Lose weight eating the food you</span><span style={{ color: "#F6B81A", fontStyle: "italic" }}>grew up on.</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#DCEFD2" }}>Calorie-counted Nigerian meals · Delivered chilled in Lagos · Mon, Wed, Fri</div>
      </div>
    ),
    size,
  );
}
