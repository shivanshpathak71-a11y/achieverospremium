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

interface SourceClass {
  classId: string;
  title: string;
  description: string;
  teacherName: string;
  duration: number;
  class_link: string;
  mp4Recordings: { url: string; quality: string }[];
  classPdf: { url?: string }[];
  addedAt: string;
  isLive: boolean;
  topic: { topicName: string; _id: string };
  section?: { sectionName: string };
}

interface SourceClassesResponse {
  state: number;
  data: {
    classes: {
      topicName: string;
      topicId: string;
      classes: SourceClass[];
    }[];
  };
}

interface SourceCourseResponse {
  state: number;
  data: {
    title: string;
    description: string[];
    banner: string;
    facultyDetails: { name: string; designation: string; imageUrl: string };
  };
}

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
    const courseData: SourceCourseResponse = await courseRes.json();

    // 2. Fetch classes grouped by topic
    const classesRes = await fetch(SOURCE_CLASSES_API, {
      headers: { "User-Agent": "ShivanshSync/1.0" },
    });
    if (!classesRes.ok) throw new Error(`Classes API returned ${classesRes.status}`);
    const classesData: SourceClassesResponse = await classesRes.json();

    const topics = classesData.data.classes;

    // 3. Upsert the subject (Selection Batch)
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
        title: courseData.data.title,
        description: courseData.data.description?.join(" ") || null,
        updated_at: new Date().toISOString(),
      }).eq("id", subjectId);
    } else {
      // Try by slug first
      const { data: existing } = await supabase
        .from("subjects")
        .select("id")
        .eq("slug", subjectSlug)
        .maybeSingle();
      if (existing) {
        subjectId = existing.id;
        await supabase.from("subjects").update({
          source_batch_id: SOURCE_BATCH_ID,
          title: courseData.data.title,
          updated_at: new Date().toISOString(),
        }).eq("id", subjectId);
      } else {
        const { data: newSubject, error } = await supabase.from("subjects").insert({
          slug: subjectSlug,
          title: courseData.data.title,
          description: courseData.data.description?.join(" ") || null,
          icon: "GraduationCap",
          color: "teal",
          gradient: "from-teal-500 to-cyan-500",
          sort_order: 0,
          source_batch_id: SOURCE_BATCH_ID,
        }).select("id").single();
        if (error) throw new Error(`Failed to create subject: ${error.message}`);
        subjectId = newSubject.id;
      }
    }

    // 4. Upsert chapters (topics) and lectures (classes)
    let totalClasses = 0;
    let newClasses = 0;
    const chapterSortMap = new Map<string, number>();

    for (let tIdx = 0; tIdx < topics.length; tIdx++) {
      const topic = topics[tIdx];
      const topicId = topic.topicId;
      const chapterSlug = slugify(topic.topicName);

      // Upsert chapter by source_topic_id
      let chapterId: string;
      const { data: chapterRow } = await supabase
        .from("chapters")
        .select("id")
        .eq("source_topic_id", topicId)
        .maybeSingle();

      if (chapterRow) {
        chapterId = chapterRow.id;
        await supabase.from("chapters").update({
          title: topic.topicName,
          sort_order: tIdx,
        }).eq("id", chapterId);
      } else {
        // Try by subject + slug
        const { data: existingCh } = await supabase
          .from("chapters")
          .select("id")
          .eq("subject_id", subjectId)
          .eq("slug", chapterSlug)
          .maybeSingle();
        if (existingCh) {
          chapterId = existingCh.id;
          await supabase.from("chapters").update({
            source_topic_id: topicId,
            title: topic.topicName,
            sort_order: tIdx,
          }).eq("id", chapterId);
        } else {
          const { data: newCh, error: chErr } = await supabase.from("chapters").insert({
            subject_id: subjectId,
            slug: chapterSlug,
            title: topic.topicName,
            sort_order: tIdx,
            source_topic_id: topicId,
          }).select("id").single();
          if (chErr) throw new Error(`Failed to create chapter: ${chErr.message}`);
          chapterId = newCh.id;
        }
      }

      // Upsert lectures (classes) within this chapter
      for (let cIdx = 0; cIdx < topic.classes.length; cIdx++) {
        const cls = topic.classes[cIdx];
        totalClasses++;

        // Pick best video URL: prefer 720p mp4, fallback to 480p, then class_link
        let videoUrl = cls.class_link;
        if (cls.mp4Recordings && cls.mp4Recordings.length > 0) {
          const sorted = [...cls.mp4Recordings].sort((a, b) => {
            const qa = parseInt(a.quality) || 0;
            const qb = parseInt(b.quality) || 0;
            return qb - qa;
          });
          videoUrl = sorted[0].url;
        }

        // Pick PDF URL if available
        let pdfUrl: string | null = null;
        if (cls.classPdf && cls.classPdf.length > 0 && cls.classPdf[0].url) {
          pdfUrl = cls.classPdf[0].url;
        }

        const lectureSlug = slugify(cls.title) + "-" + cls.classId.slice(-6);

        // Check if lecture exists by source_class_id
        const { data: existingLec } = await supabase
          .from("lectures")
          .select("id, source_added_at")
          .eq("source_class_id", cls.classId)
          .maybeSingle();

        if (existingLec) {
          // Update existing lecture
          await supabase.from("lectures").update({
            title: cls.title,
            description: cls.description || null,
            video_url: videoUrl,
            pdf_url: pdfUrl,
            duration_seconds: Math.round(cls.duration || 0),
            teacher_name: cls.teacherName || null,
            sort_order: cIdx,
            source_added_at: cls.addedAt,
            updated_at: new Date().toISOString(),
          }).eq("id", existingLec.id);
        } else {
          // Insert new lecture
          const { error: lecErr } = await supabase.from("lectures").insert({
            chapter_id: chapterId,
            slug: lectureSlug,
            title: cls.title,
            description: cls.description || null,
            video_url: videoUrl,
            pdf_url: pdfUrl,
            duration_seconds: Math.round(cls.duration || 0),
            teacher_name: cls.teacherName || null,
            is_new: true,
            is_pinned: cIdx === 0,
            sort_order: cIdx,
            source_class_id: cls.classId,
            source_added_at: cls.addedAt,
          });
          if (lecErr) {
            console.warn(`Failed to insert lecture "${cls.title}": ${lecErr.message}`);
          } else {
            newClasses++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        subject: courseData.data.title,
        topics: topics.length,
        totalClasses,
        newClasses,
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
