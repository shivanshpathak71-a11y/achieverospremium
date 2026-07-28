// sync-parmar-maths: syncs Parmar Academy courses (Maths Foundation, GK Batch 4.0, etc.)
// Authenticates with stored credentials and fetches ALL content via:
// 1. folder_contentsv3 API (for folder-wise courses)
// 2. SSR page scraping with auth cookies (for non-folder courses like GK Batch 4.0)
// 3. freecontentv2 API (demo videos, no auth needed)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_COURSE_ID = "82";
const DEFAULT_COURSE_SLUG = "parmar-maths-foundation";
const API_BASE = "https://parmaracademyapi.classx.co.in";
const SSR_BASE = "https://www.parmaracademy.in";

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

// Login to the Appx API and get auth token + userId
async function login(
  email: string,
  password: string,
): Promise<{ token: string; userId: string } | null> {
  const formData = new FormData();
  formData.append("source", "website");
  formData.append("email", email);
  formData.append("password", password);

  const res = await fetch(`${API_BASE}/post/userLogin?extra_details=1`, {
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

// Recursively fetch folder contents using the folder_contentsv3 API
async function fetchFolderContents(
  courseId: string,
  parentId: string,
  token: string,
  userId: string,
): Promise<any[]> {
  const url = `${API_BASE}/get/folder_contentsv3?course_id=${courseId}&parent_id=${parentId}&windowsapp=0&start=0`;
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

  const results = [...data.data];
  for (const item of data.data) {
    const itemType = item.material_type || item.type || "";
    if (itemType === "FOLDER") {
      const subItems = await fetchFolderContents(
        courseId, String(item.id), token, userId,
      );
      item._children = subItems;
    }
  }

  return results;
}

// Fetch free/demo content (no auth needed)
async function fetchFreeContent(courseId: string): Promise<any[]> {
  const res = await fetch(
    `${API_BASE}/get/course_class_freecontentv2?courseid=${courseId}&start=0&folder_wise_course=0`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Client-Service": "Appx",
        "Auth-Key": "appxapi",
        "source": "website",
      },
    },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

// Fetch SSR content page to extract subjects from __NEXT_DATA__
async function fetchSSRSubjects(
  courseId: string,
  token: string,
  userId: string,
): Promise<any[]> {
  const cookie = `appx_token=${token}; appx_userid=${userId}`;
  const res = await fetch(`${SSR_BASE}/courses/${courseId}/content?activeTab=Content`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Cookie": cookie,
    },
    redirect: "manual",
  });

  if (res.status !== 200) return [];
  const html = await res.text();
  const nextData = extractNextData(html);
  if (!nextData) return [];

  const pageProps = nextData.props?.pageProps || {};
  const subjects = pageProps.subjects || [];
  return subjects;
}

// Fetch SSR subject content page to extract chapters and lectures from __NEXT_DATA__
async function fetchSSRChapters(
  courseId: string,
  subjectId: string,
  token: string,
  userId: string,
): Promise<any[]> {
  const cookie = `appx_token=${token}; appx_userid=${userId}`;
  const res = await fetch(`${SSR_BASE}/courses/${courseId}/content/${subjectId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Cookie": cookie,
    },
    redirect: "manual",
  });

  if (res.status !== 200) return [];
  const html = await res.text();
  const nextData = extractNextData(html);
  if (!nextData) return [];

  const pageProps = nextData.props?.pageProps || {};
  const chapters = pageProps.chapters || [];
  return chapters;
}

// Flatten the folder tree into chapters (folders) and lectures (videos/pdfs)
function flattenTree(
  items: any[],
  subjectId: string,
): { chapters: any[]; lectures: any[] } {
  const chapters: any[] = [];
  const lectures: any[] = [];
  let chapterSort = 0;

  for (const item of items) {
    const itemType = item.material_type || item.type || "";
    const itemId = String(item.id);
    const title = item.Title || item.title || item.name || `Item ${itemId}`;

    if (itemType === "FOLDER") {
      const chapterSlug = slugify(title) + "-" + itemId.slice(-6);
      chapters.push({
        subject_id: subjectId,
        slug: chapterSlug,
        title,
        sort_order: chapterSort++,
        source_topic_id: itemId,
      });

      const children = item._children || [];
      let lectureSort = 0;
      for (const child of children) {
        const childType = child.material_type || child.type || "";
        const childId = String(child.id);
        const childTitle = child.Title || child.title || child.name || `Item ${childId}`;
        const lectureSlug = slugify(childTitle) + "-" + childId.slice(-6);

        const videoUrls: string[] = [];
        if (child.video_player_url) videoUrls.push(child.video_player_url);
        if (child.download_url_higher_version) videoUrls.push(child.download_url_higher_version);
        if (child.download_link) videoUrls.push(child.download_link);
        if (child.file_link) videoUrls.push(child.file_link);

        const pdfUrls: string[] = [];
        if (child.pdf_link) pdfUrls.push(child.pdf_link);
        if (child.pdf_link2) pdfUrls.push(child.pdf_link2);
        if (child.study_material_link) pdfUrls.push(child.study_material_link);

        const durationStr = child.duration_in_secs || child.duration || "0";
        const durationSeconds = parseInt(durationStr) || 0;

        const isVideo = childType === "VIDEO";
        const isPdf = childType === "PDF";

        lectures.push({
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
          start_date: child.event_date || null,
          duration_seconds: durationSeconds,
          teacher_name: null,
          sort_order: lectureSort++,
          is_pdf: isPdf,
        });

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

            const subDuration = parseInt(subchild.duration_in_secs || subchild.duration || "0") || 0;
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

// Convert SSR subjects (from __NEXT_DATA__) to chapter format
// Each subject becomes a chapter, and we fetch its content page for lectures
async function processSSRSubjects(
  courseId: string,
  subjects: any[],
  subjectId: string,
  token: string,
  userId: string,
): Promise<{ chapters: any[]; lectures: any[] }> {
  const chapters: any[] = [];
  const lectures: any[] = [];

  for (let sIdx = 0; sIdx < subjects.length; sIdx++) {
    const subj = subjects[sIdx];
    const subjId = String(subj.id || subj.subjectid || subj.subject_id || "");
    const subjTitle = subj.title || subj.subject_name || subj.name || `Subject ${subjId}`;
    const chapterSlug = slugify(subjTitle) + "-" + subjId.slice(-6);

    chapters.push({
      subject_id: subjectId,
      slug: chapterSlug,
      title: subjTitle,
      sort_order: sIdx,
      source_topic_id: `ssr-${subjId}`,
    });

    // Fetch the content page for this subject to get chapters/lectures
    if (subjId) {
      const ssrChapters = await fetchSSRChapters(courseId, subjId, token, userId);
      let lectureSort = 0;
      for (const ch of ssrChapters) {
        const chId = String(ch.id || ch.chapterid || ch.chapter_id || ch.topicid || "");
        const chTitle = ch.title || ch.chapter_name || ch.name || ch.topic_name || `Lecture ${chId}`;
        const lectureSlug = slugify(chTitle) + "-" + chId.slice(-6);

        const videoUrls: string[] = [];
        if (ch.video_player_url) videoUrls.push(ch.video_player_url);
        if (ch.download_url_higher_version) videoUrls.push(ch.download_url_higher_version);
        if (ch.download_link) videoUrls.push(ch.download_link);
        if (ch.file_link) videoUrls.push(ch.file_link);
        if (ch.class_link) videoUrls.push(ch.class_link);

        const pdfUrls: string[] = [];
        if (ch.pdf_link) pdfUrls.push(ch.pdf_link);
        if (ch.pdf_link2) pdfUrls.push(ch.pdf_link2);

        const durationStr = ch.duration_in_secs || ch.duration || "0";
        const durationSeconds = parseInt(durationStr) || 0;

        lectures.push({
          chapter_source_topic_id: `ssr-${subjId}`,
          slug: lectureSlug,
          title: chTitle,
          description: ch.description || null,
          video_url: videoUrls[0] || null,
          pdf_url: pdfUrls[0] || null,
          pdf_urls: pdfUrls.length > 0 ? pdfUrls : null,
          source_video_urls: videoUrls.length > 0 ? videoUrls : null,
          source_class_id: chId,
          is_live: ch.is_live || ch.live_status === 1 || false,
          is_free: ch.is_free || ch.free_flag === 1 || false,
          start_date: ch.start_date || ch.event_date || null,
          duration_seconds: durationSeconds,
          teacher_name: ch.teacher_name || ch.teacherName || null,
          sort_order: lectureSort++,
          is_pdf: false,
        });
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
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Client-Service": "Appx",
          "Auth-Key": "appxapi",
          "source": "website",
        },
      },
    );
    if (!courseRes.ok) throw new Error(`Course API returned ${courseRes.status}`);
    const courseData = await courseRes.json();
    const course = courseData.data?.[0];
    if (!course) throw new Error("Course not found");

    // 2. Build course highlights from features
    const highlights: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const feat = course[`course_feature_${i}`];
      if (feat) highlights.push(feat);
    }

    // 3. Upsert subject
    const sourceBatchId = `parmar-${courseId}`;
    const { data: subjectRow } = await supabase
      .from("subjects")
      .select("id")
      .eq("source_batch_id", sourceBatchId)
      .maybeSingle();

    const courseEnrichment = {
      title: course.course_name || "Parmar Academy Course",
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

    // 4. Try to get credentials and login for full content access
    let chapters: any[] = [];
    let lectures: any[] = [];
    let usedAuth = false;
    let syncMethod = "none";

    const { data: credRow } = await supabase
      .from("sync_credentials")
      .select("*")
      .eq("source", "parmar-gk")
      .maybeSingle();

    if (credRow) {
      const auth = await login(credRow.email, credRow.password);
      if (auth) {
        usedAuth = true;

        // Method 1: Try folder_contentsv3 API (for folder-wise courses)
        const rootItems = await fetchFolderContents(
          courseId, "-1", auth.token, auth.userId,
        );

        let topLevelItems = rootItems;
        if (
          rootItems.length === 1 &&
          (rootItems[0].material_type || rootItems[0].type) === "FOLDER"
        ) {
          topLevelItems = rootItems[0]._children || [];
        }

        if (topLevelItems.length > 0) {
          const flattened = flattenTree(topLevelItems, subjectId);
          chapters = flattened.chapters;
          lectures = flattened.lectures;
          syncMethod = "folder_contentsv3";
        }

        // Method 2: If folder API returned nothing, try SSR page scraping
        if (chapters.length === 0) {
          const ssrSubjects = await fetchSSRSubjects(courseId, auth.token, auth.userId);
          if (ssrSubjects.length > 0) {
            const result = await processSSRSubjects(
              courseId, ssrSubjects, subjectId, auth.token, auth.userId,
            );
            chapters = result.chapters;
            lectures = result.lectures;
            syncMethod = "ssr_scraping";
          }
        }
      }
    }

    // 5. Always fetch free/demo content as a fallback/supplement
    const freeVideos = await fetchFreeContent(courseId);

    // 6. Add free content if no authenticated content was found
    if (freeVideos.length > 0 && chapters.length === 0) {
      const freeChapterGroups = new Map<string, { title: string; videos: any[] }>();
      for (const v of freeVideos) {
        const subjId = String(v.subject || "default");
        const topicId = String(v.topic || "default");
        const groupKey = `free-${subjId}-${topicId}`;
        if (!freeChapterGroups.has(groupKey)) {
          let chapterTitle = "Free Demo";
          const firstTitle = v.Title || "";
          if (firstTitle) {
            if (firstTitle.toLowerCase().includes("solar")) chapterTitle = "Solar System";
            else if (firstTitle.toLowerCase().includes("constitution")) chapterTitle = "Making of Constitution";
            else if (firstTitle.toLowerCase().includes("international")) chapterTitle = "International Organisations";
            else if (firstTitle.toLowerCase().includes("national")) chapterTitle = "National Organizations";
            else chapterTitle = firstTitle.slice(0, 60);
          }
          freeChapterGroups.set(groupKey, { title: chapterTitle, videos: [] });
        }
        freeChapterGroups.get(groupKey)!.videos.push(v);
      }

      const existingChapterTitles = new Set(chapters.map((c) => c.title.toLowerCase()));
      for (const [groupKey, group] of freeChapterGroups) {
        if (!existingChapterTitles.has(group.title.toLowerCase())) {
          const chapterSlug = slugify(group.title) + "-" + groupKey.slice(-6);
          chapters.push({
            subject_id: subjectId,
            slug: chapterSlug,
            title: group.title,
            sort_order: chapters.length,
            source_topic_id: groupKey,
          });

          for (let vIdx = 0; vIdx < group.videos.length; vIdx++) {
            const v = group.videos[vIdx];
            const videoId = String(v.id);
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

            const videoUrl = v.video_player_url || null;
            const lectureSlug = slugify(v.Title || `lecture-${videoId}`) + "-" + videoId.slice(-6);

            lectures.push({
              chapter_source_topic_id: groupKey,
              slug: lectureSlug,
              title: v.Title || `Lecture ${videoId}`,
              description: v.description || null,
              video_url: videoUrl,
              pdf_url: allPdfUrls[0] || null,
              pdf_urls: allPdfUrls.length > 0 ? allPdfUrls : null,
              pdf_names: pdfNames.length > 0 ? pdfNames : null,
              source_video_urls: null,
              source_class_id: videoId,
              is_live: false,
              is_free: true,
              thumbnail_url: v.thumbnail || null,
              duration_seconds: Math.round(Number(v.duration) || 0),
              teacher_name: "Bhutesh Sir",
              sort_order: vIdx,
              is_pdf: false,
            });
          }
        }
      }
      if (syncMethod === "none") syncMethod = "free_content_only";
    }

    // 7. Fetch existing chapters
    const { data: existingChapters } = await supabase
      .from("chapters")
      .select("id, source_topic_id, slug")
      .eq("subject_id", subjectId);

    const chapterMap = new Map<string, string>();
    for (const ch of existingChapters || []) {
      if (ch.source_topic_id) chapterMap.set(ch.source_topic_id, ch.id);
    }

    // 8. Upsert chapters
    const chapterUpserts: any[] = [];
    for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
      const ch = chapters[chIdx];
      ch.sort_order = chIdx;
      if (chapterMap.has(ch.source_topic_id)) {
        chapterUpserts.push({
          id: chapterMap.get(ch.source_topic_id),
          ...ch,
        });
      } else {
        chapterUpserts.push(ch);
      }
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

    // 9. Fetch existing lectures
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

    // 10. Prepare lecture upserts
    const lectureInserts: any[] = [];
    const lectureUpdates: any[] = [];

    for (const lec of lectures) {
      const chId = chapterMap.get(lec.chapter_source_topic_id);
      if (!chId) continue;

      const { chapter_source_topic_id, is_pdf, ...lectureData } = lec;
      const finalData = {
        ...lectureData,
        source_batch_id: sourceBatchId,
        updated_at: new Date().toISOString(),
      };

      if (lectureMap.has(lec.source_class_id)) {
        lectureUpdates.push({
          id: lectureMap.get(lec.source_class_id),
          ...finalData,
        });
      } else {
        lectureInserts.push({
          chapter_id: chId,
          ...finalData,
          is_new: lec.sort_order === 0,
          is_pinned: lec.sort_order === 0,
          watch_count: 0,
        });
      }
    }

    // 11. Bulk insert new lectures
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

    // 12. Update existing lectures
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
        courseId,
        authenticated: usedAuth,
        syncMethod,
        chapters: chapters.length,
        totalLectures: lectures.length,
        freeVideos: freeVideos.length,
        newLectures: newClasses,
        updatedLectures: updatedClasses,
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
