// sync-parmar-maths: syncs Parmar's Maths Foundation VOD Batch from parmaracademy API
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_COURSE_ID = "82";
const DEFAULT_COURSE_SLUG = "parmar-maths-foundation";
const API_BASE = "https://parmaracademyapi.classx.co.in";
const API_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  "Client-Service": "Appx",
  "Auth-Key": "appxapi",
  "source": "website",
};

// Appx encryption constants (extracted from parmaracademy.in client JS)
const ENC_VALUE = "638udh3829162018";
const ENC_SALT = "fedcba9876543210";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function decryptPdfLink(encrypted: string): string | null {
  if (!encrypted || !encrypted.endsWith("==")) return null;
  try {
    const part = encrypted.split(":")[0];
    const ciphertext = base64ToBytes(part);
    const key = new TextEncoder().encode(ENC_VALUE);
    const iv = new TextEncoder().encode(ENC_SALT);

    // Use Web Crypto API for AES-128-CBC decryption
    const cryptoKey = crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-CBC", length: 128 },
      false,
      ["decrypt"],
    );

    // Web Crypto is async, but we need sync. Use a workaround.
    // Actually, let's use a simple XOR-based approach or do it differently.
    // The appx encryption is AES-128-CBC with PKCS7 padding.
    // We'll need to handle this async.
    return null; // Will handle async below
  } catch {
    return null;
  }
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function decryptPdfLinkAsync(encrypted: string): Promise<string | null> {
  if (!encrypted || !encrypted.endsWith("==")) return null;
  try {
    const part = encrypted.split(":")[0];
    const ciphertext = base64ToBytes(part);
    const key = new TextEncoder().encode(ENC_VALUE);
    const iv = new TextEncoder().encode(ENC_SALT);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-CBC", length: 128 },
      false,
      ["decrypt"],
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      cryptoKey,
      ciphertext,
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Parse course ID + slug from request (defaults to Maths Foundation course 82)
    let courseId = DEFAULT_COURSE_ID;
    let courseSlug = DEFAULT_COURSE_SLUG;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.course_id) courseId = String(body.course_id);
        if (body.course_slug) courseSlug = String(body.course_slug);
      } catch { /* empty body = use defaults */ }
    } else {
      const url = new URL(req.url);
      const qid = url.searchParams.get("course_id");
      const qslug = url.searchParams.get("course_slug");
      if (qid) courseId = qid;
      if (qslug) courseSlug = qslug;
    }

    // 1. Fetch course metadata
    const courseRes = await fetch(
      `${API_BASE}/get/course_by_id?id=${courseId}`,
      { headers: API_HEADERS },
    );
    if (!courseRes.ok) throw new Error(`Course API returned ${courseRes.status}`);
    const courseData = await courseRes.json();
    const course = courseData.data?.[0];
    if (!course) throw new Error("Course not found");

    // 2. Fetch free content (demo videos)
    const contentRes = await fetch(
      `${API_BASE}/get/course_class_freecontentv2?courseid=${courseId}&start=0&folder_wise_course=0`,
      { headers: API_HEADERS },
    );
    if (!contentRes.ok) throw new Error(`Content API returned ${contentRes.status}`);
    const contentData = await contentRes.json();
    const videos = contentData.data || [];

    // 3. Build course highlights from features
    const highlights: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const feat = course[`course_feature_${i}`];
      if (feat) highlights.push(feat);
    }

    // 4. Upsert subject
    const sourceBatchId = `parmar-${courseId}`;
    const { data: subjectRow } = await supabase
      .from("subjects")
      .select("id")
      .eq("source_batch_id", sourceBatchId)
      .maybeSingle();

    const courseEnrichment = {
      title: course.course_name || "Parmar's Maths Foundation VOD Batch",
      description: stripHtml(course.course_description || ""),
      banner_url: course.course_thumbnail || null,
      banner_square_url: course.course_thumbnail || null,
      validity: course.validity ? `${course.validity} ${course.validity_type || "MONTHS"}` : null,
      price: course.price ? Number(course.price) : null,
      discount_price: course.mrp && course.price && Number(course.mrp) > Number(course.price) ? Number(course.price) : null,
      live_classes_count: Number(course.live_class_count) || null,
      recorded_classes_count: Number(course.video_count) || null,
      student_count: null,
      time_table: null,
      faqs: null,
      faculty_details: null,
      course_highlights: highlights.length > 0 ? highlights : null,
      intro_video_id: null,
      main_category: course.exam_category || null,
      updated_at: new Date().toISOString(),
    };

    let subjectId: string;
    if (subjectRow) {
      subjectId = subjectRow.id;
      await supabase.from("subjects").update(courseEnrichment).eq("id", subjectId);
    } else {
      const { data: newSubject, error } = await supabase.from("subjects").insert({
        slug: courseSlug,
        icon: "Sigma",
        color: "#f59e0b",
        gradient: "from-amber-500 to-orange-500",
        sort_order: 2,
        source_batch_id: sourceBatchId,
        ...courseEnrichment,
      }).select("id").single();
      if (error) throw new Error(`Failed to create subject: ${error.message}`);
      subjectId = newSubject.id;
    }

    // 5. Group videos by subject/topic to create chapters
    const chapterGroups = new Map<string, { title: string; videos: any[] }>();
    for (const v of videos) {
      const subjectId_raw = String(v.subject || "default");
      const topicId = String(v.topic || "default");
      const groupKey = `${subjectId_raw}-${topicId}`;
      if (!chapterGroups.has(groupKey)) {
        // Use a meaningful chapter title based on the video titles
        const firstTitle = v.Title || "Unknown";
        let chapterTitle = "General";
        if (firstTitle.toLowerCase().includes("number system")) chapterTitle = "Number System";
        else if (firstTitle.toLowerCase().includes("probability")) chapterTitle = "Probability";
        else if (firstTitle.toLowerCase().includes("strategy") || firstTitle.toLowerCase().includes("how to use")) chapterTitle = "Strategy & Introduction";
        else if (firstTitle.toLowerCase().includes("preparation")) chapterTitle = "Strategy & Introduction";
        chapterGroups.set(groupKey, { title: chapterTitle, videos: [] });
      }
      chapterGroups.get(groupKey)!.videos.push(v);
    }

    // Sort chapters: Strategy first, then Number System
    const chapterList = Array.from(chapterGroups.entries()).sort((a, b) => {
      if (a[1].title.includes("Strategy")) return -1;
      if (b[1].title.includes("Strategy")) return 1;
      return 0;
    });

    // 6. Fetch existing chapters
    const { data: existingChapters } = await supabase
      .from("chapters")
      .select("id, source_topic_id, slug")
      .eq("subject_id", subjectId);

    const chapterMap = new Map<string, string>();
    for (const ch of existingChapters || []) {
      if (ch.source_topic_id) chapterMap.set(ch.source_topic_id, ch.id);
    }

    // 7. Upsert chapters
    const chapterUpserts: any[] = [];
    let chIdx = 0;
    for (const [groupKey, group] of chapterList) {
      const chapterSlug = slugify(group.title) + "-" + groupKey.slice(-6);
      if (chapterMap.has(groupKey)) {
        chapterUpserts.push({
          id: chapterMap.get(groupKey),
          subject_id: subjectId,
          slug: chapterSlug,
          title: group.title,
          sort_order: chIdx,
          source_topic_id: groupKey,
        });
      } else {
        chapterUpserts.push({
          subject_id: subjectId,
          slug: chapterSlug,
          title: group.title,
          sort_order: chIdx,
          source_topic_id: groupKey,
        });
      }
      chIdx++;
    }

    const newChapters = chapterUpserts.filter((c) => !c.id);
    const existingChaptersToUpdate = chapterUpserts.filter((c) => c.id);

    if (newChapters.length > 0) {
      const { data: inserted, error: chErr } = await supabase
        .from("chapters")
        .insert(newChapters)
        .select("id, source_topic_id");
      if (chErr) throw new Error(`Failed to insert chapters: ${chErr.message}`);
      for (const ch of inserted) {
        chapterMap.set(ch.source_topic_id, ch.id);
      }
    }

    if (existingChaptersToUpdate.length > 0) {
      const { error: chErr } = await supabase
        .from("chapters")
        .upsert(existingChaptersToUpdate, { onConflict: "id" });
      if (chErr) console.warn(`Chapter update warning: ${chErr.message}`);
    }

    // 8. Fetch existing lectures
    const chapterIds = Array.from(chapterMap.values());
    let existingLectures: any[] = [];
    if (chapterIds.length > 0) {
      const { data: lecData } = await supabase
        .from("lectures")
        .select("id, source_class_id")
        .in("chapter_id", chapterIds);
      existingLectures = lecData || [];
    }

    const lectureMap = new Map<string, string>();
    for (const lec of existingLectures) {
      if (lec.source_class_id) lectureMap.set(lec.source_class_id, lec.id);
    }

    // 9. Prepare lecture upserts
    const lectureInserts: any[] = [];
    const lectureUpdates: any[] = [];

    for (const [groupKey, group] of chapterList) {
      const chId = chapterMap.get(groupKey);
      if (!chId) continue;

      for (let vIdx = 0; vIdx < group.videos.length; vIdx++) {
        const v = group.videos[vIdx];
        const videoId = String(v.id);

        // Decrypt PDF link
        const pdfUrl = v.pdf_link ? await decryptPdfLinkAsync(v.pdf_link) : null;
        const pdf2Url = v.pdf_link2 ? await decryptPdfLinkAsync(v.pdf_link2) : null;

        const allPdfUrls: string[] = [];
        const pdfNames: { name: string; url: string }[] = [];
        if (pdfUrl) {
          const name = pdfUrl.split("/").pop()?.split("?")[0] || `PDF ${allPdfUrls.length + 1}`;
          allPdfUrls.push(pdfUrl);
          pdfNames.push({ name, url: pdfUrl });
        }
        if (pdf2Url) {
          const name = pdf2Url.split("/").pop()?.split("?")[0] || `PDF ${allPdfUrls.length + 1}`;
          allPdfUrls.push(pdf2Url);
          pdfNames.push({ name, url: pdf2Url });
        }

        // Use the secure player URL as video_url (best available)
        const videoUrl = v.video_player_url || null;

        const lectureSlug = slugify(v.Title || `lecture-${videoId}`) + "-" + videoId.slice(-6);

        const lectureData = {
          title: v.Title || `Lecture ${videoId}`,
          description: v.description || null,
          video_url: videoUrl,
          pdf_url: allPdfUrls[0] || null,
          pdf_urls: allPdfUrls.length > 0 ? allPdfUrls : null,
          pdf_names: pdfNames.length > 0 ? pdfNames : null,
          class_tests: null,
          source_video_urls: null,
          source_class_id: videoId,
          is_live: false,
          thumbnail_url: v.thumbnail || null,
          duration_seconds: Math.round(Number(v.duration) || 0),
          teacher_name: "Bhutesh Sir",
          sort_order: vIdx,
          updated_at: new Date().toISOString(),
        };

        if (lectureMap.has(videoId)) {
          lectureUpdates.push({
            id: lectureMap.get(videoId),
            ...lectureData,
          });
        } else {
          lectureInserts.push({
            chapter_id: chId,
            slug: lectureSlug,
            ...lectureData,
            is_new: vIdx === 0,
            is_pinned: vIdx === 0,
            watch_count: 0,
          });
        }
      }
    }

    // 10. Bulk insert new lectures
    let newClasses = 0;
    if (lectureInserts.length > 0) {
      for (let i = 0; i < lectureInserts.length; i += 50) {
        const batch = lectureInserts.slice(i, i + 50);
        const { error: insErr } = await supabase.from("lectures").insert(batch);
        if (insErr) {
          console.warn(`Lecture insert batch ${i} warning: ${insErr.message}`);
        } else {
          newClasses += batch.length;
        }
      }
    }

    // 11. Update existing lectures
    let updatedClasses = 0;
    if (lectureUpdates.length > 0) {
      for (const lec of lectureUpdates) {
        const { error: updErr } = await supabase.from("lectures").update(lec).eq("id", lec.id);
        if (updErr) {
          console.warn(`Lecture update warning for ${lec.id}: ${updErr.message}`);
        } else {
          updatedClasses++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        subject: course.course_name,
        chapters: chapterList.length,
        totalVideos: videos.length,
        newVideos: newClasses,
        updatedVideos: updatedClasses,
        syncedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
