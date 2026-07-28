import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PROXY_BASE = "https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/hls-proxy";

function rewritePlaylist(content: string, baseUrl: string, contentType: string): string {
  const lines = content.split("\n");
  const isMaster = contentType.includes("mpegurl") && !content.includes("#EXTINF");
  const result = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    // Resolve relative URL against baseUrl
    let resolved: string;
    try {
      resolved = new URL(trimmed, baseUrl).href;
    } catch {
      return line;
    }
    // Only proxy hranker.com URLs
    if (!resolved.includes("hranker.com")) return line;
    const encoded = encodeURIComponent(resolved);
    if (isMaster) {
      // Sub-playlist — rewrite its internal segment URLs too
      return `${PROXY_BASE}?u=${encoded}&rewrite=1`;
    }
    // Segment (.ts) or other media file — stream directly
    return `${PROXY_BASE}?u=${encoded}`;
  });
  return result.join("\n");
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
    // Fetch without Origin/Referer headers — the CDN blocks browser Origin
    const upstream = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HLSCoordinator/1.0)",
        "Accept": "*/*",
      },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";

    // HLS playlists (master and media playlists) — rewrite internal URLs
    if (shouldRewrite || contentType.includes("mpegurl") || target.includes(".m3u8")) {
      const text = await upstream.text();
      const rewritten = rewritePlaylist(text, target, contentType);
      return new Response(rewritten, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "public, max-age=10",
        },
      });
    }

    // Binary media (segments, audio, etc.) — stream directly
    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response(`Proxy error: ${e.message}`, {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
