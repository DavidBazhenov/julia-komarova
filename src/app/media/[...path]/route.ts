import { NextResponse } from "next/server";

import { readStoredMedia } from "@/server/storage";

function getContentType(pathname: string): string {
  if (pathname.endsWith(".webp")) {
    return "image/webp";
  }

  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolved = await params;

  try {
    const buffer = await readStoredMedia(resolved.path);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": getContentType(resolved.path.join("/")),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
