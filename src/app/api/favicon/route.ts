import { NextResponse } from "next/server";

// In-memory cache: origin → image data or null (null = use Google Favicon Service)
const CACHE = new Map<string, { data: ArrayBuffer; ct: string; ts: number } | { redirect: true; ts: number }>();
const TTL = 1000 * 60 * 60 * 24; // 24h

function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function extractFaviconFromHtml(html: string, origin: string): string | null {
  const linkRe = /<link[^>]+rel=["'](?:[^"']*\s)?(?:icon|shortcut icon|apple-touch-icon)(?:\s[^"']*)?["'][^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/i;
  const candidates: { href: string; size: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(html)) !== null) {
    const tag = match[0];
    const hrefMatch = hrefRe.exec(tag);
    if (!hrefMatch) continue;
    const href = hrefMatch[1];
    const sizesMatch = /sizes=["'](\d+)x/i.exec(tag);
    const size = sizesMatch ? parseInt(sizesMatch[1]) : 16;
    candidates.push({ href, size });
  }
  if (candidates.length === 0) return null;
  const best = candidates.filter((c) => c.size <= 512).sort((a, b) => b.size - a.size)[0] ?? candidates[0];
  return resolveUrl(best.href, origin);
}

async function fetchImage(url: string): Promise<{ data: ArrayBuffer; ct: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Stack-Base/1.0 favicon-fetcher" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    // Accept any image/* or svg+xml — reject HTML (auth redirect pages)
    if (!ct.startsWith("image/") && !ct.includes("svg")) return null;
    const data = await res.arrayBuffer();
    return { data, ct };
  } catch {
    return null;
  }
}

function imageResponse(data: ArrayBuffer, ct: string) {
  return new Response(data, {
    headers: {
      "Content-Type": ct,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) return new Response(null, { status: 400 });

  let origin: string;
  let hostname: string;
  try {
    const parsed = new URL(rawUrl);
    origin = parsed.origin;
    hostname = parsed.hostname;
  } catch {
    return new Response(null, { status: 400 });
  }

  const googleFavicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

  // Cache hit
  const cached = CACHE.get(origin);
  if (cached && Date.now() - cached.ts < TTL) {
    if ("redirect" in cached) {
      return NextResponse.redirect(googleFavicon);
    }
    return imageResponse(cached.data, cached.ct);
  }

  // 1. Fetch page HTML and look for <link rel="icon">
  try {
    const htmlRes = await fetch(rawUrl, {
      headers: { "User-Agent": "Stack-Base/1.0 favicon-fetcher" },
      signal: AbortSignal.timeout(5000),
    });

    if (htmlRes.ok && (htmlRes.headers.get("content-type") ?? "").includes("text/html")) {
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

      const faviconUrl = extractFaviconFromHtml(html, origin);
      if (faviconUrl) {
        const img = await fetchImage(faviconUrl);
        if (img) {
          CACHE.set(origin, { data: img.data, ct: img.ct, ts: Date.now() });
          return imageResponse(img.data, img.ct);
        }
      }
    }

    // 2. Try /favicon.ico directly
    const icoImg = await fetchImage(`${origin}/favicon.ico`);
    if (icoImg) {
      CACHE.set(origin, { data: icoImg.data, ct: icoImg.ct, ts: Date.now() });
      return imageResponse(icoImg.data, icoImg.ct);
    }
  } catch {
    // network error — fall through to Google
  }

  // 3. Fallback: Google Favicon Service
  CACHE.set(origin, { redirect: true, ts: Date.now() });
  return NextResponse.redirect(googleFavicon);
}
