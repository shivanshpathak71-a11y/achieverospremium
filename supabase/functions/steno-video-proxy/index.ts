// steno-video-proxy: fetches and decrypts playable video URL from Steno School API on-demand
// The AppX platform encrypts video links using AES-128-CBC with fixed key/salt constants.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// AppX platform encryption constants (from the client-side JS)
const AES_KEY = "638udh3829162018"; // 16 bytes = AES-128
const AES_IV = "fedcba9876543210";  // 16 bytes

// In-memory token cache (persists across requests within the same isolate)
let cachedToken: { token: string; userId: string; expires: number } | null = null;
const TOKEN_TTL = 25 * 60 * 1000; // 25 minutes (AppX tokens typically last 30min)

async function login(apiBase: string, emailOrPhone: string, password: string) {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expires) {
    return { token: cachedToken.token, userId: cachedToken.userId };
  }
  const formData = new FormData();
  formData.append("source", "website");
  formData.append("email", emailOrPhone);
  formData.append("password", password);

  const res = await fetch(`${apiBase}/post/userLogin?extra_details=1`, {
    method: "POST",
    body: formData,
    headers: {
      "Client-Service": "Appx",
      "Auth-Key": "appxapi",
      "source": "website",
    },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 200 || !data.data?.token) return null;
  cachedToken = {
    token: data.data.token,
    userId: String(data.data.userid),
    expires: Date.now() + TOKEN_TTL,
  };
  return { token: cachedToken.token, userId: cachedToken.userId };
}

// Decrypt AppX encrypted link using AES-128-CBC
// Format: base64(ciphertext):base64(constant)
// Key and IV are fixed UTF8 strings
async function decryptLink(encryptedPath: string): Promise<string | null> {
  try {
    if (!encryptedPath || !encryptedPath.includes(":")) return null;
    const parts = encryptedPath.split(":");
    const ciphertextBase64 = parts[0];

    // Decode ciphertext from base64
    const ctRaw = atob(ciphertextBase64);
    const ctBytes = new Uint8Array(ctRaw.length);
    for (let i = 0; i < ctRaw.length; i++) ctBytes[i] = ctRaw.charCodeAt(i);

    // Key and IV as UTF8 bytes
    const keyBytes = new TextEncoder().encode(AES_KEY);
    const ivBytes = new TextEncoder().encode(AES_IV);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-CBC" },
      false,
      ["decrypt"],
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: ivBytes },
      cryptoKey,
      ctBytes,
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decrypt failed:", e.message);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get("course_id");
    const videoId = url.searchParams.get("video_id");

    if (!courseId || !videoId) {
      return new Response(
        JSON.stringify({ error: "Missing course_id or video_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: credRow } = await supabase
      .from("sync_credentials")
      .select("*")
      .eq("source", "steno-school")
      .maybeSingle();

    if (!credRow) {
      return new Response(
        JSON.stringify({ error: "Credentials not found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const auth = await login(credRow.api_base, credRow.email, credRow.password);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: "Login failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const res = await fetch(
      `${credRow.api_base}/get/fetchVideoDetailsById?course_id=${courseId}&video_id=${videoId}&ytflag=0&folder_wise_course=1`,
      {
        headers: {
          "Client-Service": "Appx",
          "Auth-Key": "appxapi",
          "source": "website",
          "Authorization": auth.token,
          "User-ID": auth.userId,
        },
      },
    );

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch video details" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const videoData = data.data;

    if (!videoData) {
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Decrypt video URLs (highest quality first)
    const playableUrls: { quality: string; url: string }[] = [];

    const downloadLinks = videoData.download_links || [];
    for (const dl of downloadLinks) {
      if (dl.path) {
        const decrypted = await decryptLink(dl.path);
        if (decrypted && decrypted.startsWith("http")) {
          playableUrls.push({ quality: dl.quality || "unknown", url: decrypted });
        }
      }
    }

    const encryptedLinks = videoData.encrypted_links || [];
    for (const el of encryptedLinks) {
      if (el.path) {
        const decrypted = await decryptLink(el.path);
        if (decrypted && decrypted.startsWith("http")) {
          playableUrls.push({ quality: el.quality || "unknown", url: decrypted });
        }
      }
    }

    if (videoData.file_link) {
      const decrypted = await decryptLink(videoData.file_link);
      if (decrypted && decrypted.startsWith("http")) {
        playableUrls.push({ quality: "default", url: decrypted });
      }
    }
    if (videoData.download_link) {
      const decrypted = await decryptLink(videoData.download_link);
      if (decrypted && decrypted.startsWith("http")) {
        playableUrls.push({ quality: "download", url: decrypted });
      }
    }

    // Decrypt PDF links
    let pdfUrl: string | null = null;
    if (videoData.pdf_link) {
      pdfUrl = await decryptLink(videoData.pdf_link);
      if (pdfUrl && !pdfUrl.startsWith("http")) pdfUrl = null;
    }
    let pdfUrl2: string | null = null;
    if (videoData.pdf_link2) {
      pdfUrl2 = await decryptLink(videoData.pdf_link2);
      if (pdfUrl2 && !pdfUrl2.startsWith("http")) pdfUrl2 = null;
    }

    return new Response(
      JSON.stringify({
        success: true,
        video_id: videoId,
        title: videoData.Title,
        material_type: videoData.material_type,
        playable_urls: playableUrls,
        best_url: playableUrls[0]?.url || null,
        is_hls: playableUrls[0]?.url?.includes(".m3u8") || false,
        pdf_url: pdfUrl,
        pdf_url2: pdfUrl2,
        thumbnail: videoData.thumbnail || null,
        duration: videoData.duration || null,
        duration_in_secs: videoData.duration_in_secs || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
