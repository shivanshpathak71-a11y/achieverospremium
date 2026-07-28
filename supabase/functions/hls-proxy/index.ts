import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Range",
};

const PROXY_BASE = "https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/hls-proxy";

function rewritePlaylist(content: string, baseUrl: string): string {
  const lines = content.split("\n");
  const isMaster = !content.includes("#EXTINF");
  return lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    let resolved: string;
    try {
      resolved = new URL(trimmed, baseUrl).href;
    } catch {
      return line;
    }
    if (!resolved.includes("hranker.com") && !resolved.includes("classx.co.in") && !resolved.includes("appx.co.in")) return line;
    const encoded = encodeURIComponent(resolved);
    return isMaster
      ? `${PROXY_BASE}?u=${encoded}&rewrite=1`
      : `${PROXY_BASE}?u=${encoded}`;
  }).join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const target = url.searchParams.get("u");
  const shouldRewrite = url.searchParams.get("rewrite") === "1";

  if (!target) {
    return new Response(JSON.stringify({ error: "Missing 'u' parameter" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const upstreamHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (compatible; HLSCoordinator/1.0)",
      "Accept": "*/*",
      "Accept-Encoding": "identity",
      "Connection": "keep-alive",
    };
    // classx.co.in CDN requires a Referer/Origin from the AppX platform origin
    if (target.includes("classx.co.in") || target.includes("appx.co.in")) {
      upstreamHeaders["Referer"] = "https://stenoschool.akamai.net.in/";
      upstreamHeaders["Origin"] = "https://stenoschool.akamai.net.in";
    }
    const range = req.headers.get("Range");
    if (range) upstreamHeaders["Range"] = range;

    const upstream = await fetch(target, {
      headers: upstreamHeaders,
      redirect: "follow",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(`Upstream error: ${upstream.status}`, {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";

    // HLS playlists — rewrite internal URLs, return as text
    if (shouldRewrite || contentType.includes("mpegurl") || target.includes(".m3u8")) {
      const text = await upstream.text();
      const rewritten = rewritePlaylist(text, target);
      return new Response(rewritten, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "public, max-age=5",
        },
      });
    }

    // Binary media (segments + MP4s) — stream the body directly without buffering
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": contentType,
      // Long cache for segments — they never change
      "Cache-Control": "public, max-age=86400, immutable",
    };

    // Preserve Content-Length and Content-Range for Range requests (206)
    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    if (contentLength) responseHeaders["Content-Length"] = contentLength;
    if (contentRange) responseHeaders["Content-Range"] = contentRange;
    if (upstream.status === 206) responseHeaders["Accept-Ranges"] = "bytes";
    const ar = upstream.headers.get("accept-ranges");
    if (ar) responseHeaders["Accept-Ranges"] = ar;

    // Stream the upstream body directly — no buffering, avoids memory limits
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (e) {
    return new Response(`Proxy error: ${e.message}`, {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
