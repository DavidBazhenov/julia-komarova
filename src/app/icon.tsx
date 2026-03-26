import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default async function Icon() {
  const logoPath = path.join(process.cwd(), "public", "images", "jk-logo.png");
  const logoBuffer = await readFile(logoPath);
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFCEB",
        }}
      >
        <img
          src={logoDataUrl}
          alt="Julia Komarova logo"
          style={{
            width: "88%",
            height: "88%",
            objectFit: "contain",
          }}
        />
      </div>
    ),
    size,
  );
}
