import { NextResponse } from "next/server";

const CACHE = new Map<string, { url: string; ts: number }>();
const TTL = 1000 * 60 * 60 * 24; // 24h

function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function extractFaviconFromHtml(html: string, baseUrl: string): string | null {
  // <link rel="icon"> or <link rel="shortcut icon"> — prefer higher-res PNG/SVG
  const linkRe = /<link[^>]+rel=["'](?:[^"']*\s)?(?:icon|shortcut icon|apple-touch-icon)(?:\s[^"']*)?["'][^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/i;

  const candidates: { href: string; size: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(html)) !== null) {
    const tag = match[0];
    const hrefMatch = hrefRe.exec(tag);
    if (!hrefMatch) continue;
    const href = hrefMatch[1];
    // Prefer larger sizes (sizes="192x192" etc.)
    const sizesMatch = /sizes=["'](\d+)x/i.exec(tag);
    const size = sizesMatch ? parseInt(sizesMatch[1]) : 16;
    candidates.push({ href, size });
  }

  if (candidates.length > 0) {
    // Pick largest, but avoid huge splash icons (>512)
    const best = candidates
      .filter((c) => c.size <= 512)
      .sort((a, b) => b.size - a.size)[0] ?? candidates[0];
    return resolveUrl(best.href, baseUrl);
  }

  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) return NextResponse.json({ error: "url required" }, { status: 400 });

  let origin: string;
  try {
    origin = new URL(rawUrl).origin;
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  // Cache hit
  const cached = CACHE.get(origin);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json({ faviconUrl: cached.url });
  }

  try {
    // 1. Try to parse HTML for <link rel="icon">
    const htmlRes = await fetch(rawUrl, {
      headers: { "User-Agent": "Stack-Base/1.0 favicon-fetcher" },
      signal: AbortSignal.timeout(5000),
    });

    if (htmlRes.ok) {
      const contentType = htmlRes.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        // Only read first 8 KB — favicon links are in <head>
        const reader = htmlRes.body?.getReader();
        let html = "";
        if (reader) {
          let bytes = 0;
          while (bytes < 8192) {
            const { done, value } = await reader.read();
            if (done) break;
            html += new TextDecoder().decode(value);
            bytes += value.byteLength;
          }
          reader.cancel();
        }

        const fromHtml = extractFaviconFromHtml(html, origin);
        if (fromHtml) {
          CACHE.set(origin, { url: fromHtml, ts: Date.now() });
          return NextResponse.json({ faviconUrl: fromHtml });
        }
      }
    }

    // 2. Fallback: try /favicon.ico directly
    const icoUrl = `${origin}/favicon.ico`;
    const icoRes = await fetch(icoUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    });
    if (icoRes.ok) {
      CACHE.set(origin, { url: icoUrl, ts: Date.now() });
      return NextResponse.json({ faviconUrl: icoUrl });
    }
  } catch {
    // network error — return null gracefully
  }

  return NextResponse.json({ faviconUrl: null });
}
