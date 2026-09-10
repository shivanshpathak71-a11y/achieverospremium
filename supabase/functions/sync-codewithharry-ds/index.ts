// sync-codewithharry-ds: syncs the CodeWithHarry "Ultimate Job Ready Data Science Course"
// The course page is a Next.js SSR app that embeds course JSON in __next_f flight data.
// This function fetches the HTML, extracts the course object, and upserts chapters + lectures.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COURSE_SLUG = "the-ultimate-job-ready-data-science-course";
const COURSE_URL = `https://www.codewithharry.com/courses/${COURSE_SLUG}`;
const SOURCE_BATCH_ID = "cwh-ds-cm97get6l0000dc0rats7r5kc";
const SUBJECT_SLUG = COURSE_SLUG;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Extract the course JSON object from Next.js flight data embedded in the HTML
function extractCourseFromHtml(html: string): any | null {
  const chunkRegex = /self\.__next_f\.push\(\[1,(.*?)\]\)/gs;
  const chunks = [...html.matchAll(chunkRegex)].map((m) => m[1]);

  for (const rawChunk of chunks) {
    if (rawChunk.length < 50000) continue;
    if (!rawChunk.includes("sections") || !rawChunk.includes("lessons")) continue;

    let decoded: string;
    try {
      decoded = JSON.parse(rawChunk);
    } catch {
      continue;
    }

    const cidx = decoded.indexOf('"course":{');
    if (cidx < 0) continue;

    let substr = decoded.slice(cidx + 9);
    // Strip Next.js $D (date) and $ref markers
    substr = substr.replace(/\$D/g, "");
    substr = substr.replace(/"\$[0-9a-f]+"/g, "null");
    substr = substr.replace(/:\s*\$[0-9a-f]+/g, ": null");

    // Track brace depth to find the end of the course object
    let depth = 0;
    let end = 0;
    let inString = false;
    let escape = false;
    for (let j = 0; j < substr.length; j++) {
      const c = substr[j];
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) { end = j + 1; break; }
      }
    }

    try {
      return JSON.parse(substr.slice(0, end));
    } catch {
      continue;
    }
  }
  return null;
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

    // 1. Fetch the course page HTML
    const pageRes = await fetch(COURSE_URL, {
      headers: { "User-Agent": "ShivanshSync/1.0" },
    });
    if (!pageRes.ok) throw new Error(`Course page returned ${pageRes.status}`);
    const html = await pageRes.text();

    // 2. Extract course JSON from flight data
    const course = extractCourseFromHtml(html);
    if (!course) throw new Error("Could not extract course data from page HTML");
    const sections: any[] = course.sections || [];

    // 3. Upsert subject (update enrichment fields)
    const { data: subjectRow } = await supabase
      .from("subjects")
      .select("id")
      .eq("source_batch_id", SOURCE_BATCH_ID)
      .maybeSingle();

    const courseEnrichment = {
      title: course.title,
      description: course.description || null,
      short_description: course.description || null,
      banner_url: course.thumbnail || null,
      price: course.price ?? null,
      discount_price: course.discountPrice ?? null,
      is_free: false,
      is_recorded: true,
      main_category: "Data Science",
      course_highlights: {
        tags: course.tags || [],
        whatYouWillLearn: course.whatYouWillLearn || [],
        requirements: course.requirements || [],
        enrollmentCount: course.enrollmentCount || 0,
        language: course.language || null,
        level: course.level || null,
        instructor: course.instructor || null,
        promoLink: course.promoLink || null,
      },
      updated_at: new Date().toISOString(),
    };

    let subjectId: string;
    if (subjectRow) {
      subjectId = subjectRow.id;
      await supabase.from("subjects").update(courseEnrichment).eq("id", subjectId);
    } else {
      const { data: newSubject, error } = await supabase.from("subjects").insert({
        slug: SUBJECT_SLUG,
        icon: "GraduationCap",
        color: "blue",
        gradient: "from-blue-500 to-cyan-500",
        sort_order: 100,
        source_batch_id: SOURCE_BATCH_ID,
        ...courseEnrichment,
      }).select("id").single();
      if (error) throw new Error(`Failed to create subject: ${error.message}`);
      subjectId = newSubject.id;
    }

    // 4. Fetch existing chapters and lectures in bulk
    const { data: existingChapters } = await supabase
      .from("chapters")
      .select("id, source_topic_id, slug, sort_order")
      .eq("subject_id", subjectId);

    const chapterIds = (existingChapters || []).map((c) => c.id);
    let existingLectures: any[] | null = null;
    if (chapterIds.length > 0) {
      const { data: lecData } = await supabase
        .from("lectures")
        .select("id, source_class_id, slug, sort_order")
        .in("chapter_id", chapterIds);
      existingLectures = lecData;
    }

    const chapterMap = new Map<string, string>();
    for (const ch of existingChapters || []) {
      if (ch.source_topic_id) chapterMap.set(ch.source_topic_id, ch.id);
    }

    const lectureMap = new Map<string, string>();
    for (const lec of existingLectures || []) {
      if (lec.source_class_id) lectureMap.set(lec.source_class_id, lec.id);
    }

    // 5. Prepare chapter upserts (sections -> chapters)
    const chapterUpserts: any[] = [];
    const newChapterSlugs = new Set<string>();

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      const sectionId = String(section.id);
      const chapterSlug = slugify(section.title) + "-" + sectionId;

      if (chapterMap.has(sectionId)) {
        chapterUpserts.push({
          id: chapterMap.get(sectionId),
          subject_id: subjectId,
          slug: chapterSlug,
          title: section.title.trim(),
          sort_order: sIdx,
          source_topic_id: sectionId,
        });
      } else {
        newChapterSlugs.add(chapterSlug);
        chapterUpserts.push({
          subject_id: subjectId,
          slug: chapterSlug,
          title: section.title.trim(),
          sort_order: sIdx,
          source_topic_id: sectionId,
        });
      }
    }

    // 6. Bulk insert new chapters
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

    // 7. Prepare lecture upserts (lessons -> lectures)
    const lectureInserts: any[] = [];
    const lectureUpdates: any[] = [];
    let totalLessons = 0;

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      const chapterId = chapterMap.get(String(section.id));
      if (!chapterId) continue;

      const lessons: any[] = section.lessons || [];
      for (let lIdx = 0; lIdx < lessons.length; lIdx++) {
        const lesson = lessons[lIdx];
        totalLessons++;

        const lessonId = String(lesson.id);
        const lectureSlug = slugify(lesson.title) + "-" + lessonId;

        const lectureData = {
          title: lesson.title.trim(),
          description: null,
          video_url: lesson.url || null,
          source_video_urls: lesson.url ? [lesson.url] : null,
          source_class_id: lessonId,
          duration_seconds: Math.round(lesson.duration || 0),
          teacher_name: course.instructor || "CodeWithHarry",
          sort_order: lIdx,
          is_live: false,
          is_free: false,
          section_name: section.title.trim(),
          source_added_at: lesson.createdAt || null,
          updated_at: new Date().toISOString(),
        };

        if (lectureMap.has(lessonId)) {
          lectureUpdates.push({
            id: lectureMap.get(lessonId),
            ...lectureData,
          });
        } else {
          lectureInserts.push({
            chapter_id: chapterId,
            slug: lectureSlug,
            ...lectureData,
            is_new: true,
            is_pinned: lIdx === 0,
            watch_count: 0,
          });
        }
      }
    }

    // 8. Bulk insert new lectures
    let newLessons = 0;
    if (lectureInserts.length > 0) {
      for (let i = 0; i < lectureInserts.length; i += 50) {
        const batch = lectureInserts.slice(i, i + 50);
        const { error: insErr } = await supabase.from("lectures").insert(batch);
        if (insErr) {
          console.warn(`Lecture insert batch ${i} warning: ${insErr.message}`);
        } else {
          newLessons += batch.length;
        }
      }
    }

    // 9. Bulk update existing lectures
    let updatedLessons = 0;
    if (lectureUpdates.length > 0) {
      for (let i = 0; i < lectureUpdates.length; i += 50) {
        const batch = lectureUpdates.slice(i, i + 50);
        for (const lec of batch) {
          const { error: updErr } = await supabase.from("lectures").update(lec).eq("id", lec.id);
          if (updErr) {
            console.warn(`Lecture update warning for ${lec.id}: ${updErr.message}`);
          } else {
            updatedLessons++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        subject: course.title,
        sections: sections.length,
        totalLessons,
        newLessons,
        updatedLessons,
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
