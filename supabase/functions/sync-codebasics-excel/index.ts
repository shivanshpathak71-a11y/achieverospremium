// sync-codebasics-excel: syncs the Codebasics "Excel: Mother of Business Intelligence" course.
// The course curriculum is on any lecture page as an accordion sidebar.
// We fetch one lecture page, parse the accordion sections + lecture links,
// and upsert chapters (sections) + lectures (individual lessons).
//
// Each lecture stores source_lecture_url (the codebasics.io lecture page URL).
// At play time, the video-embed edge function scrapes that page to get a fresh
// Gumlet iframe token (tokens expire, so we can't store them).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COURSE_BASE = "https://codebasics.io/courses/bootcamp/1/excel-mother-of-business-intelligence";
const LECTURE_URL = `${COURSE_BASE}/lecture/1131`;
const SOURCE_BATCH_ID = "codebasics-excel-bootcamp-1";
const SUBJECT_SLUG = "excel-mother-of-business-intelligence";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

interface ParsedLecture {
  id: number;
  section: number;
  lecture_num: number;
  title: string;
}

interface ParsedSection {
  section_num: number;
  section_title: string;
  lectures: ParsedLecture[];
}

function parseCurriculum(html: string): ParsedSection[] {
  // Extract lecture links with their text: href="...lecture/ID"...>SECTION.LECTURE: TITLE</a>
  const lecturePattern = /href="https:\/\/codebasics\.io\/courses\/bootcamp\/1\/excel-mother-of-business-intelligence\/lecture\/(\d+)"[^>]*>(.*?)<\/a>/gs;
  const lectures: ParsedLecture[] = [];

  for (const match of html.matchAll(lecturePattern)) {
    const lid = parseInt(match[1], 10);
    const rawText = match[2]
      .replace(/<[^>]+>/g, "")
      .trim()
      .replace(/&amp;/g, "&")
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ");

    const m = rawText.match(/^(\d+)\.(\d+):\s*(.+)/);
    if (m) {
      lectures.push({
        id: lid,
        section: parseInt(m[1], 10),
        lecture_num: parseInt(m[2], 10),
        title: m[3].trim(),
      });
    }
  }

  // Extract section titles from accordion buttons
  const buttonPattern = /<button[^>]*accordion-button[^>]*>(.*?)<\/button>/gs;
  const sectionTitles: Record<number, string> = {};

  for (const match of html.matchAll(buttonPattern)) {
    const text = match[1]
      .replace(/<[^>]+>/g, "")
      .trim()
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ");
    const m = text.match(/^(\d+):\s*(.+)/);
    if (m) {
      sectionTitles[parseInt(m[1], 10)] = m[2].trim();
    }
  }

  // Group lectures by section
  const sectionsMap: Record<number, ParsedSection> = {};
  for (const lec of lectures) {
    if (!sectionsMap[lec.section]) {
      sectionsMap[lec.section] = {
        section_num: lec.section,
        section_title: sectionTitles[lec.section] || `Section ${lec.section}`,
        lectures: [],
      };
    }
    sectionsMap[lec.section].lectures.push(lec);
  }

  return Object.values(sectionsMap).sort((a, b) => a.section_num - b.section_num);
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

    // 1. Fetch a lecture page (any lecture page has the full curriculum sidebar)
    const pageRes = await fetch(LECTURE_URL, {
      headers: { "User-Agent": "ShivanshSync/1.0" },
    });
    if (!pageRes.ok) throw new Error(`Codebasics page returned ${pageRes.status}`);
    const html = await pageRes.text();

    // 2. Parse curriculum
    const sections = parseCurriculum(html);
    if (sections.length === 0) throw new Error("Could not parse any sections from the page");

    // 3. Get subject ID
    const { data: subjectRow, error: subErr } = await supabase
      .from("subjects")
      .select("id")
      .eq("source_batch_id", SOURCE_BATCH_ID)
      .maybeSingle();
    if (subErr || !subjectRow) throw new Error(`Subject not found: ${subErr?.message || "no row"}`);
    const subjectId = subjectRow.id;

    // 4. Fetch existing chapters and lectures
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

    // 5. Upsert chapters (sections -> chapters)
    const chapterUpserts: any[] = [];
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      const sectionId = String(section.section_num);
      const chapterSlug = slugify(section.section_title) + "-" + sectionId;

      if (chapterMap.has(sectionId)) {
        chapterUpserts.push({
          id: chapterMap.get(sectionId),
          subject_id: subjectId,
          slug: chapterSlug,
          title: section.section_title,
          sort_order: sIdx,
          source_topic_id: sectionId,
        });
      } else {
        chapterUpserts.push({
          subject_id: subjectId,
          slug: chapterSlug,
          title: section.section_title,
          sort_order: sIdx,
          source_topic_id: sectionId,
        });
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

    // 6. Upsert lectures (lessons -> lectures)
    const lectureInserts: any[] = [];
    const lectureUpdates: any[] = [];
    let totalLessons = 0;

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      const chapterId = chapterMap.get(String(section.section_num));
      if (!chapterId) continue;

      for (let lIdx = 0; lIdx < section.lectures.length; lIdx++) {
        const lec = section.lectures[lIdx];
        totalLessons++;

        const lessonId = String(lec.id);
        const lectureSlug = slugify(lec.title) + "-" + lessonId;
        const lectureUrl = `${COURSE_BASE}/lecture/${lec.id}`;

        const lectureData = {
          title: lec.title,
          description: null,
          video_url: null, // Gumlet token is fetched at play time via video-embed
          source_lecture_url: lectureUrl,
          source_class_id: lessonId,
          duration_seconds: 0, // Codebasics doesn't expose duration in the sidebar
          teacher_name: "Codebasics",
          sort_order: lIdx,
          is_live: false,
          is_free: false,
          section_name: section.section_title,
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
            is_pinned: lIdx === 0 && sIdx === 0,
            watch_count: 0,
          });
        }
      }
    }

    // 7. Bulk insert new lectures
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

    // 8. Update existing lectures
    let updatedLessons = 0;
    if (lectureUpdates.length > 0) {
      for (const lec of lectureUpdates) {
        const { error: updErr } = await supabase.from("lectures").update(lec).eq("id", lec.id);
        if (updErr) {
          console.warn(`Lecture update warning for ${lec.id}: ${updErr.message}`);
        } else {
          updatedLessons++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        subject: "Excel: Mother of Business Intelligence",
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
