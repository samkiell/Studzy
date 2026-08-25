import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-static";
export const alt = "Studzy – Software Engineering Learning Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  let logoSrc = "";
  try {
    const logoData = readFileSync(join(process.cwd(), "public", "favicon.png"));
    logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;
  } catch {
    logoSrc = "";
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #09090B 0%, #171717 50%, #0A0A0A 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt="Studzy Logo"
              width="120"
              height="120"
              style={{
                objectFit: "contain",
                borderRadius: "20px",
              }}
            />
          ) : (
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #0EA5E9, #2563EB)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                fontWeight: 700,
                color: "white",
              }}
            >
              S
            </div>
          )}
          <span
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
            }}
          >
            Studzy
          </span>
        </div>
        <div
          style={{
            fontSize: "28px",
            fontWeight: 500,
            color: "#A1A1AA",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          Software Engineering Learning Platform | OAU
        </div>
        <div
          style={{
            marginTop: "36px",
            padding: "10px 32px",
            borderRadius: "9999px",
            background: "#2563EB",
            color: "#FFFFFF",
            fontSize: "22px",
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
