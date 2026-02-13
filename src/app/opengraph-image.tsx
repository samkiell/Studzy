import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Studzy AI – AI Study Assistant for University Students";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0A0F1C 0%, #111827 50%, #0D1422 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #0EA5E9, #2563EB)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 700,
              color: "white",
            }}
          >
            S
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "white",
            }}
          >
            Studzy AI
          </span>
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#94A3B8",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: 1.4,
          }}
        >
          AI Study Assistant for University Exam Success
        </div>
        <div
          style={{
            marginTop: "40px",
            padding: "12px 32px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #0EA5E9, #2563EB)",
            color: "white",
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          studzy.me
        </div>
      </div>
    ),
    { ...size }
  );
}
