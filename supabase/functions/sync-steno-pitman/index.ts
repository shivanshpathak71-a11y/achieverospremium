// sync-steno-pitman: syncs Pitman Blueprint course from Steno School (ClassX/AppX platform)
// Logs in with stored credentials, fetches course metadata + free/demo content,
// and upserts into subjects/chapters/lectures. Content is kept separate from Selection Batch.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SSR_BASE = "https://stenoschool.akamai.net.in";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function extractNextData(html: string): any | null {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

// Login to Steno School API and get auth token + user ID
async function login(
  apiBase: string,
  email: string,
  password: string,
): Promise<{ token: string; userId: string } | null> {
  const formData = new FormData();
  formData.append("source", "website");
  formData.append("email", email);
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

  return {
    token: data.data.token,
    userId: String(data.data.userid),
  };
}

// Fetch course metadata from SSR page (no auth needed)
async function fetchCourseMetadata(courseId: string): Promise<any | null> {
  const res = await fetch(`${SSR_BASE}/new-courses/${courseId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const nextData = extractNextData(html);
  if (!nextData) return null;
  return nextData.props?.pageProps?.course || null;
}

// Fetch free/demo content from the API (requires auth)
async function fetchFreeContent(
  apiBase: string,
  courseId: string,
  token: string,
  userId: string,
): Promise<any[]> {
  const allItems: any[] = [];
  let start = 0;
  const pageSize = 50;

  while (true) {
    const res = await fetch(
      `${apiBase}/get/course_class_freecontentv2?courseid=${courseId}&start=${start}&folder_wise_course=1`,
      {
        headers: {
          "Client-Service": "Appx",
          "Auth-Key": "appxapi",
          "source": "website",
          "Authorization": token,
          "User-ID": userId,
        },
      },
    );

    if (!res.ok) break;
    const data = await res.json();
    if (data.status !== 200 || !Array.isArray(data.data)) break;

    allItems.push(...data.data);
    if (data.data.length < pageSize) break;
    start += pageSize;
  }

  return allItems;
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

    // 1. Read credentials from the database
    const { data: credRow } = await supabase
      .from("sync_credentials")
      .select("*")
      .eq("source", "steno-school")
      .maybeSingle();

    if (!credRow) {
      throw new Error("Steno School credentials not found in sync_credentials table");
    }

    const apiBase = credRow.api_base;
    const courseId = credRow.course_id;

    // 2. Login to get a fresh auth token
    const auth = await login(apiBase, credRow.email, credRow.password);
    if (!auth) {
      throw new Error("Failed to login to Steno School API");
    }

    // 3. Fetch course metadata from SSR page
    const course = await fetchCourseMetadata(courseId);
    if (!course) {
      throw new Error("Failed to fetch course metadata from SSR page");
    }

    // 4. Fetch free/demo content
    const freeContent = await fetchFreeContent(apiBase, courseId, auth.token, auth.userId);

    // 5. Upsert main subject (separate from Selection Batch - different source_batch_id)
    const subjectSlug = "steno-pitman-blueprint";
    const courseEnrichment = {
      title: course.course_name || "Pitman Blueprint (Basic to Advance Steno)",
      description: course.course_description || null,
      short_description: course.exam_name || null,
      banner_url: course.course_thumbnail || course.exam_logo || null,
      banner_square_url: course.exam_logo || null,
      validity: course.validity
        ? `${course.validity} ${course.validity_type || "YEARS"}`
        : null,
      price: course.price ?? null,
      discount_price: course.installment_price ?? course.mrp ?? null,
      live_classes_count: course.live_class_count || 0,
      recorded_classes_count: course.videos_count || 0,
      student_count: course.likes_count || 0,
      faculty_details: course.teacher_name
        ? { name: course.teacher_name, image: course.teacher_image }
        : null,
      main_category: course.exam_category || null,
      is_free: course.is_paid === "0" || false,
      is_recorded: true,
      updated_at: new Date().toISOString(),
    };

    const { data: subjectRow } = await supabase
      .from("subjects")
      .select("id")
      .eq("slug", subjectSlug)
      .maybeSingle();

    let subjectId: string;
    if (subjectRow) {
      subjectId = subjectRow.id;
      await supabase.from("subjects").update(courseEnrichment).eq("id", subjectId);
    } else {
      const { data: newSubject, error } = await supabase
        .from("subjects")
        .insert({
          slug: subjectSlug,
          icon: "PenTool",
          color: "#f59e0b",
          gradient: "from-amber-500 to-yellow-500",
          sort_order: 10,
          source_batch_id: `steno-${courseId}`,
          ...courseEnrichment,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Failed to create subject: ${error.message}`);
      subjectId = newSubject.id;
    }

    // 6. Create chapters from free content, grouped by parent_id (folder)
    // The free content items have parent_id which represents the folder ID.
    // We'll group items by parent_id and create a chapter for each folder.
    const folderMap = new Map<string, any[]>();
    for (const item of freeContent) {
      const parentId = String(item.parent_id || "root");
      if (!folderMap.has(parentId)) {
        folderMap.set(parentId, []);
      }
      folderMap.get(parentId)!.push(item);
    }

    // Fetch existing chapters for this subject
    const { data: existingChapters } = await supabase
      .from("chapters")
      .select("id, source_topic_id, slug, sort_order")
      .eq("subject_id", subjectId);

    const chapterMap = new Map<string, string>();
    for (const ch of existingChapters || []) {
      if (ch.source_topic_id) chapterMap.set(ch.source_topic_id, ch.id);
    }

    const chapterIds = (existingChapters || []).map((c) => c.id);
    let existingLectures: any[] | null = null;
    if (chapterIds.length > 0) {
      const { data: lecData } = await supabase
        .from("lectures")
        .select("id, source_class_id, slug, sort_order")
        .in("chapter_id", chapterIds);
      existingLectures = lecData;
    }

    const lectureMap = new Map<string, string>();
    for (const lec of existingLectures || []) {
      if (lec.source_class_id) lectureMap.set(lec.source_class_id, lec.id);
    }

    let newLectures = 0;
    let updatedLectures = 0;

    // Create chapters and lectures from free content
    let chapterSort = 0;
    for (const [folderId, items] of folderMap) {
      // Map folder IDs to descriptive names based on course structure
      const folderNames: Record<string, string> = {
        "34": "Phase 1 - Basic Shorthand",
        "3923": "Stenonthon Sessions",
        "23": "Phase 2 - Speed Batch",
      };
      const firstItem = items[0];
      const folderName = firstItem?.section_name || folderNames[folderId] || `Folder ${folderId}`;
      const chapterSlug = slugify(folderName) + "-" + folderId.slice(-6);

      let chapterId: string;
      if (chapterMap.has(folderId)) {
        chapterId = chapterMap.get(folderId)!;
        await supabase.from("chapters").update({
          subject_id: subjectId,
          slug: chapterSlug,
          title: folderName,
          sort_order: chapterSort,
          source_topic_id: folderId,
          updated_at: new Date().toISOString(),
        }).eq("id", chapterId);
      } else {
        const { data: newCh, error: chErr } = await supabase
          .from("chapters")
          .insert({
            subject_id: subjectId,
            slug: chapterSlug,
            title: folderName,
            sort_order: chapterSort,
            source_topic_id: folderId,
          })
          .select("id")
          .single();
        if (chErr) {
          console.warn(`Chapter insert failed: ${chErr.message}`);
          continue;
        }
        chapterId = newCh.id;
        chapterMap.set(folderId, chapterId);
      }
      chapterSort++;

      // Create lectures for this chapter
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const classId = String(item.id);
        const lectureSlug = slugify(item.Title || `Class ${i + 1}`) + "-" + classId.slice(-6);

        // Parse duration
        const durationStr = item.duration_in_secs || "0";
        const durationSeconds = parseInt(durationStr) || 0;

        // Parse date
        let startDate: string | null = null;
        if (item.event_date) {
          startDate = item.event_date;
        }

        // Collect video URLs (from player URLs)
        const videoUrls: string[] = [];
        if (item.video_player_url) {
          videoUrls.push(item.video_player_url);
        }
        if (item.download_url_higher_version) {
          videoUrls.push(item.download_url_higher_version);
        }

        // Collect PDF URLs
        const pdfUrls: string[] = [];
        if (item.pdf_link) {
          pdfUrls.push(item.pdf_link);
        }
        if (item.pdf_link2) {
          pdfUrls.push(item.pdf_link2);
        }
        if (item.study_material_link) {
          pdfUrls.push(item.study_material_link);
        }

        const lectureData = {
          title: item.Title || `Class ${i + 1}`,
          description: item.description || null,
          video_url: videoUrls[0] || null,
          pdf_url: pdfUrls[0] || null,
          pdf_urls: pdfUrls.length > 0 ? pdfUrls : null,
          source_video_urls: videoUrls.length > 0 ? videoUrls : null,
          source_class_id: classId,
          is_live: item.live_status === 1 || false,
          is_free: item.free_flag === 1 || false,
          start_date: startDate,
          duration_seconds: durationSeconds,
          teacher_name: null,
          sort_order: i,
          updated_at: new Date().toISOString(),
        };

        if (lectureMap.has(classId)) {
          await supabase.from("lectures").update(lectureData).eq("id", lectureMap.get(classId));
          updatedLectures++;
        } else {
          await supabase.from("lectures").insert({
            chapter_id: chapterId,
            slug: lectureSlug,
            ...lectureData,
            is_new: true,
            is_pinned: i === 0,
            watch_count: 0,
          });
          newLectures++;
        }
      }
    }

    // 7. Fix stale is_live flags
    await supabase.from("lectures")
      .update({ is_live: false, updated_at: new Date().toISOString() })
      .eq("is_live", true)
      .lt("end_date", new Date().toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        subject: course.course_name,
        courseId,
        freeContentItems: freeContent.length,
        folders: folderMap.size,
        newLectures,
        updatedLectures,
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
