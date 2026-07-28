import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SOURCE_BATCH_ID = "6a462e62b927c1a84a8b7879";
const SOURCE_API_BASE = "https://backend.multistreaming.site/api/courses";
const SOURCE_COURSE_API = `${SOURCE_API_BASE}/${SOURCE_BATCH_ID}`;
const SOURCE_CLASSES_API = `${SOURCE_API_BASE}/${SOURCE_BATCH_ID}/classes?populate=full`;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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

    // 1. Fetch course metadata
    const courseRes = await fetch(SOURCE_COURSE_API, {
      headers: { "User-Agent": "ShivanshSync/1.0" },
    });
    if (!courseRes.ok) throw new Error(`Course API returned ${courseRes.status}`);
    const courseData = await courseRes.json();
    const course = courseData.data;

    // 2. Fetch classes grouped by topic
    const classesRes = await fetch(SOURCE_CLASSES_API, {
      headers: { "User-Agent": "ShivanshSync/1.0" },
    });
    if (!classesRes.ok) throw new Error(`Classes API returned ${classesRes.status}`);
    const classesData = await classesRes.json();
    const topics = classesData.data.classes;

    // 3. Upsert subject
    const subjectSlug = "selection-batch-10";
    const { data: subjectRow } = await supabase
      .from("subjects")
      .select("id")
      .eq("source_batch_id", SOURCE_BATCH_ID)
      .maybeSingle();

    let subjectId: string;
    if (subjectRow) {
      subjectId = subjectRow.id;
      await supabase.from("subjects").update({
        title: course.title,
        description: course.description?.join(" ") || null,
        updated_at: new Date().toISOString(),
      }).eq("id", subjectId);
    } else {
      const { data: newSubject, error } = await supabase.from("subjects").insert({
        slug: subjectSlug,
        title: course.title,
        description: course.description?.join(" ") || null,
        icon: "GraduationCap",
        color: "teal",
        gradient: "from-teal-500 to-cyan-500",
        sort_order: 0,
        source_batch_id: SOURCE_BATCH_ID,
      }).select("id").single();
      if (error) throw new Error(`Failed to create subject: ${error.message}`);
      subjectId = newSubject.id;
    }

    // 4. Fetch existing chapters and lectures in bulk
    const { data: existingChapters } = await supabase
      .from("chapters")
      .select("id, source_topic_id, slug, sort_order")
      .eq("subject_id", subjectId);

    const { data: existingLectures } = await supabase
      .from("lectures")
      .select("id, source_class_id, slug, sort_order")
      .in("chapter_id", existingChapters?.map(c => c.id) || ["00000000-0000-0000-0000-000000000000"]);

    const chapterMap = new Map<string, string>(); // source_topic_id -> chapter uuid
    for (const ch of existingChapters || []) {
      if (ch.source_topic_id) chapterMap.set(ch.source_topic_id, ch.id);
    }

    const lectureMap = new Map<string, string>(); // source_class_id -> lecture uuid
    for (const lec of existingLectures || []) {
      if (lec.source_class_id) lectureMap.set(lec.source_class_id, lec.id);
    }

    // 5. Prepare chapter upserts
    const chapterUpserts: any[] = [];
    const newChapterSlugs = new Set<string>();

    for (let tIdx = 0; tIdx < topics.length; tIdx++) {
      const topic = topics[tIdx];
      const topicId = topic.topicId;
      const chapterSlug = slugify(topic.topicName) + "-" + topicId.slice(-6);

      if (chapterMap.has(topicId)) {
        chapterUpserts.push({
          id: chapterMap.get(topicId),
          subject_id: subjectId,
          slug: chapterSlug,
          title: topic.topicName,
          sort_order: tIdx,
          source_topic_id: topicId,
        });
      } else {
        newChapterSlugs.add(chapterSlug);
        chapterUpserts.push({
          subject_id: subjectId,
          slug: chapterSlug,
          title: topic.topicName,
          sort_order: tIdx,
          source_topic_id: topicId,
        });
      }
    }

    // 6. Bulk upsert chapters (insert new ones first)
    const newChapters = chapterUpserts.filter(c => !c.id);
    const existingChaptersToUpdate = chapterUpserts.filter(c => c.id);

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

    // 7. Prepare lecture upserts in bulk
    const lectureInserts: any[] = [];
    const lectureUpdates: any[] = [];
    let totalClasses = 0;

    for (let tIdx = 0; tIdx < topics.length; tIdx++) {
      const topic = topics[tIdx];
      const chapterId = chapterMap.get(topic.topicId);
      if (!chapterId) continue;

      for (let cIdx = 0; cIdx < topic.classes.length; cIdx++) {
        const cls = topic.classes[cIdx];
        totalClasses++;

        // Collect ALL video URLs (mp4 recordings + HLS class_link)
        const allVideoUrls: string[] = [];
        if (cls.mp4Recordings && cls.mp4Recordings.length > 0) {
          const sorted = [...cls.mp4Recordings].sort((a, b) => {
            const qa = parseInt(a.quality) || 0;
            const qb = parseInt(b.quality) || 0;
            return qb - qa;
          });
          for (const rec of sorted) {
            if (rec.url) allVideoUrls.push(rec.url);
          }
        }
        if (cls.class_link && !allVideoUrls.includes(cls.class_link)) {
          allVideoUrls.push(cls.class_link);
        }

        const videoUrl = allVideoUrls[0] || null;

        // Collect ALL PDF URLs
        const allPdfUrls: string[] = [];
        if (cls.classPdf && cls.classPdf.length > 0) {
          for (const pdf of cls.classPdf) {
            if (pdf.url) allPdfUrls.push(pdf.url);
          }
        }
        const primaryPdfUrl = allPdfUrls[0] || null;

        const lectureSlug = slugify(cls.title) + "-" + cls.classId.slice(-6);

        const lectureData = {
          title: cls.title,
          description: cls.description || null,
          video_url: videoUrl,
          pdf_url: primaryPdfUrl,
          pdf_urls: allPdfUrls.length > 0 ? allPdfUrls : null,
          source_video_urls: allVideoUrls.length > 0 ? allVideoUrls : null,
          is_live: cls.isLive || false,
          duration_seconds: Math.round(cls.duration || 0),
          teacher_name: cls.teacherName || null,
          sort_order: cIdx,
          source_added_at: cls.addedAt,
          updated_at: new Date().toISOString(),
        };

        if (lectureMap.has(cls.classId)) {
          lectureUpdates.push({
            id: lectureMap.get(cls.classId),
            ...lectureData,
          });
        } else {
          lectureInserts.push({
            chapter_id: chapterId,
            slug: lectureSlug,
            ...lectureData,
            is_new: true,
            is_pinned: cIdx === 0,
            watch_count: 0,
          });
        }
      }
    }

    // 8. Bulk insert new lectures
    let newClasses = 0;
    if (lectureInserts.length > 0) {
      // Insert in batches of 50 to avoid payload limits
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

    // 9. Bulk update existing lectures in batches
    let updatedClasses = 0;
    if (lectureUpdates.length > 0) {
      for (let i = 0; i < lectureUpdates.length; i += 50) {
        const batch = lectureUpdates.slice(i, i + 50);
        const { error: updErr } = await supabase.from("lectures").upsert(batch, { onConflict: "id" });
        if (updErr) {
          console.warn(`Lecture update batch ${i} warning: ${updErr.message}`);
        } else {
          updatedClasses += batch.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        subject: course.title,
        topics: topics.length,
        totalClasses,
        newClasses,
        updatedClasses,
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
