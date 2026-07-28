// sync-steno-pitman: syncs Pitman Blueprint course from Steno School (ClassX/AppX platform)
// Uses folder_contentsv3 API to recursively fetch the full folder tree (folder-wise course).
// Content is kept separate from Selection Batch (different source_batch_id).
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

// In-memory token cache (persists across requests within the same isolate)
let cachedToken: { token: string; userId: string; expires: number } | null = null;
const TOKEN_TTL = 25 * 60 * 1000; // 25 minutes

async function login(
  apiBase: string,
  emailOrPhone: string,
  password: string,
): Promise<{ token: string; userId: string } | null> {
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

// Recursively fetch folder contents using the folder_contentsv3 API
async function fetchFolderContents(
  apiBase: string,
  courseId: string,
  parentId: string,
  token: string,
  userId: string,
): Promise<any[]> {
  const url = `${apiBase}/get/folder_contentsv3?course_id=${courseId}&parent_id=${parentId}&windowsapp=0&start=0`;
  const res = await fetch(url, {
    headers: {
      "Client-Service": "Appx",
      "Auth-Key": "appxapi",
      "source": "website",
      "Authorization": token,
      "User-ID": userId,
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  if (!data.data || !Array.isArray(data.data)) return [];

  // For each FOLDER item, recursively fetch its contents
  const results = [...data.data];
  for (const item of data.data) {
    const itemType = item.material_type || item.type || "";
    if (itemType === "FOLDER") {
      const subItems = await fetchFolderContents(
        apiBase, courseId, String(item.id), token, userId,
      );
      item._children = subItems;
    }
  }

  return results;
}

// Flatten the folder tree into chapters (folders) and lectures (videos/pdfs)
function flattenTree(
  items: any[],
  subjectId: string,
  parentFolderTitle: string = "",
): { chapters: any[]; lectures: any[] } {
  const chapters: any[] = [];
  const lectures: any[] = [];
  let chapterSort = 0;

  for (const item of items) {
    const itemType = item.material_type || item.type || "";
    const itemId = String(item.id);
    const title = item.Title || item.title || item.name || `Item ${itemId}`;

    if (itemType === "FOLDER") {
      // Create a chapter for this folder
      const chapterSlug = slugify(title) + "-" + itemId.slice(-6);
      const chapter = {
        subject_id: subjectId,
        slug: chapterSlug,
        title: title,
        sort_order: chapterSort++,
        source_topic_id: itemId,
      };
      chapters.push(chapter);

      // Process children - videos/PDFs become lectures, sub-folders become lectures too
      const children = item._children || [];
      let lectureSort = 0;
      for (const child of children) {
        const childType = child.material_type || child.type || "";
        const childId = String(child.id);
        const childTitle = child.Title || child.title || child.name || `Item ${childId}`;
        const lectureSlug = slugify(childTitle) + "-" + childId.slice(-6);

        // Collect video and PDF URLs
        const videoUrls: string[] = [];
        if (child.video_player_url) videoUrls.push(child.video_player_url);
        if (child.download_url_higher_version) videoUrls.push(child.download_url_higher_version);
        if (child.download_link) videoUrls.push(child.download_link);
        if (child.file_link) videoUrls.push(child.file_link);

        const pdfUrls: string[] = [];
        if (child.pdf_link) pdfUrls.push(child.pdf_link);
        if (child.pdf_link2) pdfUrls.push(child.pdf_link2);
        if (child.study_material_link) pdfUrls.push(child.study_material_link);

        const durationStr = child.duration_in_secs || "0";
        const durationSeconds = parseInt(durationStr) || 0;

        let startDate: string | null = null;
        if (child.event_date) startDate = child.event_date;

        const isVideo = childType === "VIDEO" || childType === "VIDEO";
        const isPdf = childType === "PDF";

        const lecture = {
          chapter_source_topic_id: itemId,
          slug: lectureSlug,
          title: childTitle,
          description: child.description || null,
          video_url: isVideo ? (videoUrls[0] || null) : null,
          pdf_url: pdfUrls[0] || null,
          pdf_urls: pdfUrls.length > 0 ? pdfUrls : null,
          source_video_urls: videoUrls.length > 0 ? videoUrls : null,
          source_class_id: childId,
          is_live: child.live_status === 1 || false,
          is_free: child.free_flag === 1 || false,
          start_date: startDate,
          duration_seconds: durationSeconds,
          teacher_name: null,
          sort_order: lectureSort++,
          is_pdf: isPdf,
        };
        lectures.push(lecture);

        // If this child is also a folder, recursively flatten its children as lectures
        if (childType === "FOLDER" && child._children) {
          for (const subchild of child._children) {
            const subType = subchild.material_type || subchild.type || "";
            const subId = String(subchild.id);
            const subTitle = subchild.Title || subchild.title || subchild.name || `Item ${subId}`;
            const subSlug = slugify(subTitle) + "-" + subId.slice(-6);

            const subVideoUrls: string[] = [];
            if (subchild.video_player_url) subVideoUrls.push(subchild.video_player_url);
            if (subchild.download_url_higher_version) subVideoUrls.push(subchild.download_url_higher_version);
            if (subchild.download_link) subVideoUrls.push(subchild.download_link);
            if (subchild.file_link) subVideoUrls.push(subchild.file_link);

            const subPdfUrls: string[] = [];
            if (subchild.pdf_link) subPdfUrls.push(subchild.pdf_link);
            if (subchild.pdf_link2) subPdfUrls.push(subchild.pdf_link2);
            if (subchild.study_material_link) subPdfUrls.push(subchild.study_material_link);

            const subDuration = parseInt(subchild.duration_in_secs || "0") || 0;
            const subIsVideo = subType === "VIDEO";
            const subIsPdf = subType === "PDF";

            lectures.push({
              chapter_source_topic_id: itemId,
              slug: subSlug,
              title: subTitle,
              description: subchild.description || null,
              video_url: subIsVideo ? (subVideoUrls[0] || null) : null,
              pdf_url: subPdfUrls[0] || null,
              pdf_urls: subPdfUrls.length > 0 ? subPdfUrls : null,
              source_video_urls: subVideoUrls.length > 0 ? subVideoUrls : null,
              source_class_id: subId,
              is_live: subchild.live_status === 1 || false,
              is_free: subchild.free_flag === 1 || false,
              start_date: subchild.event_date || null,
              duration_seconds: subDuration,
              teacher_name: null,
              sort_order: lectureSort++,
              is_pdf: subIsPdf,
            });
          }
        }
      }
    }
  }

  return { chapters, lectures };
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

    // 1. Read credentials
    const { data: credRow } = await supabase
      .from("sync_credentials")
      .select("*")
      .eq("source", "steno-school")
      .maybeSingle();

    if (!credRow) {
      throw new Error("Steno School credentials not found");
    }

    const apiBase = credRow.api_base;
    const courseId = credRow.course_id;

    // 2. Login
    const auth = await login(apiBase, credRow.email, credRow.password);
    if (!auth) {
      throw new Error("Failed to login to Steno School API");
    }

    // 3. Fetch course metadata from SSR
    const course = await fetchCourseMetadata(courseId);
    if (!course) {
      throw new Error("Failed to fetch course metadata");
    }

    // 4. Fetch full folder tree recursively
    const rootItems = await fetchFolderContents(
      apiBase, courseId, "-1", auth.token, auth.userId,
    );

    // The root has a "Home" folder (id=11). Get its contents.
    let topLevelItems = rootItems;
    if (rootItems.length === 1 && (rootItems[0].material_type || rootItems[0].type) === "FOLDER") {
      topLevelItems = rootItems[0]._children || [];
    }

    // 5. Upsert main subject
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

    // 6. Delete old chapters/lectures and recreate from fresh tree
    // (Clean sync approach - avoids stale data from previous syncs)
    const { data: oldChapters } = await supabase
      .from("chapters")
      .select("id")
      .eq("subject_id", subjectId);

    if (oldChapters && oldChapters.length > 0) {
      const oldChapterIds = oldChapters.map((c) => c.id);
      await supabase.from("lectures").delete().in("chapter_id", oldChapterIds);
      await supabase.from("chapters").delete().in("id", oldChapterIds);
    }

    // 7. Flatten the tree into chapters and lectures
    const { chapters, lectures } = flattenTree(topLevelItems, subjectId);

    // 8. Insert chapters
    let newChapters = 0;
    const chapterIdMap = new Map<string, string>();
    for (const ch of chapters) {
      const { data: newCh, error } = await supabase
        .from("chapters")
        .insert(ch)
        .select("id")
        .single();
      if (!error && newCh) {
        chapterIdMap.set(ch.source_topic_id, newCh.id);
        newChapters++;
      }
    }

    // 9. Insert lectures
    let newLectures = 0;
    for (const lec of lectures) {
      const chapterId = chapterIdMap.get(lec.chapter_source_topic_id);
      if (!chapterId) continue;

      const { error } = await supabase.from("lectures").insert({
        chapter_id: chapterId,
        slug: lec.slug,
        title: lec.title,
        description: lec.description,
        video_url: lec.video_url,
        pdf_url: lec.pdf_url,
        pdf_urls: lec.pdf_urls,
        source_video_urls: lec.source_video_urls,
        source_class_id: lec.source_class_id,
        source_batch_id: `steno-${courseId}`,
        is_live: lec.is_live,
        is_free: lec.is_free,
        start_date: lec.start_date,
        duration_seconds: lec.duration_seconds,
        teacher_name: lec.teacher_name,
        sort_order: lec.sort_order,
        is_new: false,
        is_pinned: lec.sort_order === 0,
        watch_count: 0,
      });
      if (!error) newLectures++;
    }

    // 10. Fix stale is_live flags
    await supabase.from("lectures")
      .update({ is_live: false, updated_at: new Date().toISOString() })
      .eq("is_live", true)
      .lt("end_date", new Date().toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        subject: course.course_name,
        courseId,
        topFolders: topLevelItems.length,
        newChapters,
        newLectures,
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
