// sync-steno-pitman: syncs Pitman Blueprint course from Steno School (ClassX/AppX platform)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COURSE_ID = "11";
const SSR_URL = `https://stenoschool.akamai.net.in/new-courses/${COURSE_ID}`;
const API_BASE = "https://stenolearningappapi.akamai.net.in";
const API_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Client-Service": "Appx",
  "Auth-Key": "appxapi",
  "source": "website",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Extract __NEXT_DATA__ JSON from SSR HTML
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Fetch course metadata from SSR page (no auth needed)
    const ssrRes = await fetch(SSR_URL, {
      headers: { "User-Agent": API_HEADERS["User-Agent"] },
    });
    if (!ssrRes.ok) throw new Error(`SSR page returned ${ssrRes.status}`);
    const ssrHtml = await ssrRes.text();
    const nextData = extractNextData(ssrHtml);
    if (!nextData) throw new Error("Failed to extract __NEXT_DATA__ from SSR page");

    const course = nextData.props?.pageProps?.course;
    if (!course) throw new Error("Course data not found in SSR page");

    const apiBase = nextData.props?.pageProps?.api || API_BASE;

    // 2. Try to fetch subjects and classes from the API (may fail without auth)
    let subjects: any[] = [];
    let topicsWithClasses: any[] = [];

    try {
      // Fetch subjects
      const subjectsRes = await fetch(
        `${apiBase}/get/allsubjectfrmlivecourseclass?courseid=${COURSE_ID}`,
        { headers: API_HEADERS },
      );
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        if (subjectsData.status === 200 && Array.isArray(subjectsData.data)) {
          subjects = subjectsData.data;
        }
      }
    } catch (e) {
      console.warn(`Subjects fetch failed: ${e.message}`);
    }

    // 3. Upsert main subject
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
      time_table: null,
      faqs: null,
      faculty_details: course.teacher_name
        ? { name: course.teacher_name, image: course.teacher_image }
        : null,
      course_highlights: null,
      intro_video_id: course.course_demo_video || null,
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
          sort_order: 5,
          source_batch_id: `steno-${COURSE_ID}`,
          ...courseEnrichment,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Failed to create subject: ${error.message}`);
      subjectId = newSubject.id;
    }

    // 4. If we have subjects from the API, create chapters and fetch classes
    let totalClasses = 0;
    let newClasses = 0;
    let syncedPdfs = 0;

    if (subjects.length > 0) {
      // Fetch existing chapters
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

      // For each subject, fetch topics and classes
      for (let sIdx = 0; sIdx < subjects.length; sIdx++) {
        const subj = subjects[sIdx];
        const subjectIdFromApi = subj.subjectid || subj.id || subj.subject_id;

        // Fetch topics for this subject
        let topics: any[] = [];
        try {
          const topicsRes = await fetch(
            `${apiBase}/get/alltopicfrmlivecourseclass?courseid=${COURSE_ID}&subjectid=${subjectIdFromApi}&start=0`,
            { headers: API_HEADERS },
          );
          if (topicsRes.ok) {
            const topicsData = await topicsRes.json();
            if (topicsData.status === 200 && Array.isArray(topicsData.data)) {
              topics = topicsData.data;
            }
          }
        } catch (e) {
          console.warn(`Topics fetch failed for subject ${subjectIdFromApi}: ${e.message}`);
        }

        // For each topic, fetch classes
        for (const topic of topics) {
          const topicId = topic.topicid || topic.id || topic.topic_id;
          const topicName = topic.topicname || topic.name || topic.topic_name;
          const chapterSlug = slugify(topicName) + "-" + String(topicId).slice(-6);

          // Upsert chapter
          let chapterId: string;
          if (chapterMap.has(String(topicId))) {
            chapterId = chapterMap.get(String(topicId))!;
            await supabase.from("chapters").update({
              subject_id: subjectId,
              slug: chapterSlug,
              title: topicName,
              sort_order: sIdx,
              source_topic_id: String(topicId),
              updated_at: new Date().toISOString(),
            }).eq("id", chapterId);
          } else {
            const { data: newCh, error: chErr } = await supabase
              .from("chapters")
              .insert({
                subject_id: subjectId,
                slug: chapterSlug,
                title: topicName,
                sort_order: sIdx,
                source_topic_id: String(topicId),
              })
              .select("id")
              .single();
            if (chErr) {
              console.warn(`Chapter insert failed: ${chErr.message}`);
              continue;
            }
            chapterId = newCh.id;
            chapterMap.set(String(topicId), chapterId);
          }

          // Fetch classes for this topic
          try {
            const classesRes = await fetch(
              `${apiBase}/get/livecourseclassbycoursesubtopconceptapiv3?courseid=${COURSE_ID}&subjectid=${subjectIdFromApi}&topicid=${topicId}&conceptid=0&windowsapp=0&start=0`,
              { headers: API_HEADERS },
            );
            if (classesRes.ok) {
              const classesData = await classesRes.json();
              if (classesData.status === 200 && Array.isArray(classesData.data)) {
                const classes = classesData.data;
                totalClasses += classes.length;

                for (let cIdx = 0; cIdx < classes.length; cIdx++) {
                  const cls = classes[cIdx];
                  const classId = String(cls.classid || cls.id || cls.class_id);
                  const lectureSlug = slugify(cls.title || cls.name || `Class ${cIdx + 1}`) + "-" + classId.slice(-6);

                  // Collect video URLs
                  const allVideoUrls: string[] = [];
                  if (cls.mp4Recordings && cls.mp4Recordings.length > 0) {
                    const sorted = [...cls.mp4Recordings].sort((a, b) =>
                      (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0)
                    );
                    for (const rec of sorted) {
                      if (rec.url) allVideoUrls.push(rec.url);
                    }
                  }
                  if (cls.class_link && !allVideoUrls.includes(cls.class_link)) {
                    allVideoUrls.push(cls.class_link);
                  }

                  // Collect PDF URLs
                  const allPdfUrls: string[] = [];
                  const pdfNames: { name: string; url: string }[] = [];
                  if (cls.classPdf && cls.classPdf.length > 0) {
                    for (const pdf of cls.classPdf) {
                      if (pdf.url) {
                        allPdfUrls.push(pdf.url);
                        pdfNames.push({
                          name: pdf.name || pdf.url.split("/").pop() || `PDF ${pdfNames.length + 1}`,
                          url: pdf.url,
                        });
                      }
                    }
                  }

                  const lectureData = {
                    title: cls.title || cls.name || `Class ${cIdx + 1}`,
                    description: cls.description || null,
                    video_url: allVideoUrls[0] || null,
                    pdf_url: allPdfUrls[0] || null,
                    pdf_urls: allPdfUrls.length > 0 ? allPdfUrls : null,
                    pdf_names: pdfNames.length > 0 ? pdfNames : null,
                    source_video_urls: allVideoUrls.length > 0 ? allVideoUrls : null,
                    source_class_id: classId,
                    is_live: cls.isLive || false,
                    is_free: cls.isFree || false,
                    is_blinking: cls.isBlinking || false,
                    unique_view_count: cls.uniqueViewCount || 0,
                    start_date: cls.startDate || null,
                    end_date: cls.endDate || null,
                    section_name: cls.section?.sectionName || subj.subjectname || subj.name || null,
                    duration_seconds: Math.round(cls.duration || 0),
                    teacher_name: cls.teacherName || null,
                    sort_order: cIdx,
                    source_added_at: cls.addedAt || null,
                    updated_at: new Date().toISOString(),
                  };

                  if (lectureMap.has(classId)) {
                    await supabase.from("lectures").update(lectureData).eq("id", lectureMap.get(classId));
                  } else {
                    await supabase.from("lectures").insert({
                      chapter_id: chapterId,
                      slug: lectureSlug,
                      ...lectureData,
                      is_new: true,
                      is_pinned: cIdx === 0,
                      watch_count: 0,
                    });
                    newClasses++;
                  }
                }
              }
            }
          } catch (e) {
            console.warn(`Classes fetch failed for topic ${topicId}: ${e.message}`);
          }
        }
      }
    }

    // 5. Fix stale is_live flags
    await supabase.from("lectures")
      .update({ is_live: false, updated_at: new Date().toISOString() })
      .eq("is_live", true)
      .lt("end_date", new Date().toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        subject: course.course_name,
        courseId: COURSE_ID,
        subjectsFound: subjects.length,
        totalClasses,
        newClasses,
        updatedClasses: totalClasses - newClasses,
        syncedPdfs,
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
