// video-embed: resolves DRM-protected video URLs into playable iframe embed URLs.
//
// Two providers are supported:
//
// 1. VdoCipher (CodeWithHarry): The stored video_url is a VdoCipher API endpoint
//    like https://dev.vdocipher.com/api/videos/{videoId}. To play it, we call the
//    VdoCipher OTP API with the client secret key to get an OTP + playbackInfo,
//    then return the player.vdocipher.com iframe URL.
//
// 2. Gumlet (codebasics.io): The lecture page HTML contains a Gumlet iframe with a
//    signed token. We scrape the lecture page, extract the iframe src, and return it.
//
// The frontend calls this function when it detects a VdoCipher or codebasics video URL,
// and renders the returned URL in an <iframe> instead of a <video> tag.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getVdoCipherSecret(): Promise<string> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data, error } = await supabase.rpc("get_vdocipher_api_secret");
  if (error || !data) return "";
  return data as string;
}

interface EmbedResponse {
  embedUrl: string;
  provider: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { video_url, lecture_url } = await req.json();

    let result: EmbedResponse | null = null;

    // ── VdoCipher (CodeWithHarry) ──
    if (video_url && video_url.includes("vdocipher")) {
      result = await resolveVdoCipher(video_url);
    }

    // ── Gumlet (codebasics.io) ──
    if (!result && lecture_url && lecture_url.includes("codebasics.io")) {
      result = await resolveGumlet(lecture_url);
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Could not resolve video embed URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// Extract the video ID from a VdoCipher API URL and generate OTP
async function resolveVdoCipher(videoUrl: string): Promise<EmbedResponse | null> {
  // URL format: https://dev.vdocipher.com/api/videos/{videoId}
  const match = videoUrl.match(/videos\/([a-f0-9]+)/);
  if (!match) return null;
  const videoId = match[1];

  const apiSecret = await getVdoCipherSecret();
  if (!apiSecret) {
    throw new Error("VDOCIPHER_API_SECRET is not configured. Add the VdoCipher API secret to Supabase Vault with the name 'vdocipher_api_secret'.");
  }

  // Call VdoCipher OTP API
  const otpRes = await fetch(
    `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
    {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Apisecret ${apiSecret}`,
      },
      body: JSON.stringify({ ttl: 300 }),
    },
  );

  if (!otpRes.ok) {
    const text = await otpRes.text();
    throw new Error(`VdoCipher OTP API returned ${otpRes.status}: ${text}`);
  }

  const otpData = await otpRes.json();
  const otp = otpData.otp;
  const playbackInfo = otpData.playbackInfo;

  if (!otp || !playbackInfo) {
    throw new Error("VdoCipher OTP response missing otp or playbackInfo");
  }

  return {
    embedUrl: `https://player.vdocipher.com/v2/?otp=${otp}&playbackInfo=${playbackInfo}`,
    provider: "vdocipher",
  };
}

// Scrape a codebasics.io lecture page and extract the Gumlet iframe src
async function resolveGumlet(lectureUrl: string): Promise<EmbedResponse | null> {
  const pageRes = await fetch(lectureUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ShivanshBot/1.0)" },
  });
  if (!pageRes.ok) {
    throw new Error(`Codebasics page returned ${pageRes.status}`);
  }
  const html = await pageRes.text();

  // Look for the Gumlet iframe src
  const gumletMatch = html.match(
    /src="(https:\/\/play\.gumlet\.io\/embed\/[^"]+)"/,
  );
  if (!gumletMatch) return null;

  // Unescape HTML entities (&amp; -> &)
  const embedUrl = gumletMatch[1].replace(/&amp;/g, "&");

  return {
    embedUrl,
    provider: "gumlet",
  };
}
