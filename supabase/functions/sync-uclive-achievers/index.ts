import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COURSE_ID = "92";
const COURSE_URL = "https://uclive.org/new-courses/92-achievers-batch-90";
const SOURCE_BATCH_ID = "uclive-achievers-92";
const SUBJECT_SLUG = "uclive-achievers-batch-90";

interface UcItem {
  id: string;
  Title?: string;
  title?: string;
  material_type?: string;
  duration_in_secs?: string | number;
  event_date?: string;
  free_flag?: string | number;
  pdf_link?: string;
  file_link?: string;
}

interface PageProps {
  course: { course_name?: string; course_description?: string };
  modules?: UcItem[];
  previousLiveCourses?: UcItem[];
  freeVideos?: UcItem[];
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function extractPageProps(html: string): PageProps | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!match) return null;
  try {
    const nextData = JSON.parse(match[1]);
    return nextData.props?.pageProps ?? null;
  } catch {
    return null;
  }
}

function itemTitle(item: UcItem): string {
  return (item.Title || item.title || "Untitled").trim();
}

function duration(item: UcItem): number {
  const value = Number(item.duration_in_secs || 0);
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const pageRes = await fetch(COURSE_URL, {
      headers: { "User-Agent": "ShivanshSync/1.0" },
    });
    if (!pageRes.ok) throw new Error(`UC Live page returned ${pageRes.status}`);

    const pageProps = extractPageProps(await pageRes.text());
    if (!pageProps?.course) throw new Error("Could not extract UC Live course data");

    const { data: existingSubject, error: subjectLookupError } = await supabase
      .from("subjects")
      .select("id")
      .eq("source_batch_id", SOURCE_BATCH_ID)
      .maybeSingle();
    if (subjectLookupError) throw new Error(`Subject lookup failed: ${subjectLookupError.message}`);

    const subjectData = {
      slug: SUBJECT_SLUG,
      title: pageProps.course.course_name || "ACHIEVERS BATCH 9.0",
      description: pageProps.course.course_description || null,
      short_description: "UC Live Achievers Batch 9.0",
      icon: "BookOpen",
      color: "blue",
      gradient: "from-blue-600 to-cyan-500",
      sort_order: 110,
      source_batch_id: SOURCE_BATCH_ID,
      is_free: false,
      is_recorded: true,
      main_category: "English",
      updated_at: new Date().toISOString(),
    };

    let subjectId: string;
    if (existingSubject) {
      subjectId = existingSubject.id;
      const { error } = await supabase.from("subjects").update(subjectData).eq("id", subjectId);
      if (error) throw new Error(`Subject update failed: ${error.message}`);
    } else {
      const { data, error } = await supabase.from("subjects").insert(subjectData).select("id").single();
      if (error || !data) throw new Error(`Subject creation failed: ${error?.message || "no row returned"}`);
      subjectId = data.id;
    }

    const groups = [
      { id: "recorded-videos", title: "Recorded Videos", items: pageProps.previousLiveCourses || [] },
      { id: "free-pdfs", title: "Free PDFs", items: pageProps.freeVideos || [] },
    ];

    let syncedVideos = 0;
    let syncedPdfs = 0;

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      const group = groups[groupIndex];
      const { data: chapter, error: chapterError } = await supabase
        .from("chapters")
        .upsert({
          subject_id: subjectId,
          slug: `${SUBJECT_SLUG}-${group.id}`,
          title: group.title,
          sort_order: groupIndex,
          source_topic_id: `${COURSE_ID}-${group.id}`,
        }, { onConflict: "subject_id,slug" })
        .select("id")
        .single();
      if (chapterError || !chapter) throw new Error(`Chapter sync failed: ${chapterError?.message || "no row returned"}`);

      for (let index = 0; index < group.items.length; index += 1) {
        const item = group.items[index];
        const title = itemTitle(item);
        const isVideo = group.id === "recorded-videos";
        const sourceId = `uclive-${String(item.id)}`;
        const pageUrl = `${COURSE_URL}#${sourceId}`;
        const lecture = {
          chapter_id: chapter.id,
          slug: `${slugify(title)}-${sourceId}`,
          title,
          description: "Synced from UC Live. Playback requires the source platform's authorized session.",
          video_url: null,
          pdf_url: null,
          source_video_urls: [pageUrl],
          source_class_id: sourceId,
          duration_seconds: isVideo ? duration(item) : 0,
          teacher_name: "UC Live",
          sort_order: index,
          is_live: false,
          is_free: Number(item.free_flag || 0) === 1,
          is_new: true,
          is_pinned: index === 0,
          watch_count: 0,
          section_name: group.title,
          source_lecture_url: pageUrl,
          source_added_at: item.event_date || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("lectures").upsert(lecture, { onConflict: "chapter_id,slug" });
        if (error) throw new Error(`Lecture sync failed for ${title}: ${error.message}`);
        if (isVideo) syncedVideos += 1;
        else syncedPdfs += 1;
      }
    }

    return response({
      success: true,
      subject: subjectData.title,
      syncedVideos,
      syncedPdfs,
      note: "UC Live content API requires an authorized session; encrypted media URLs were not copied as playable files.",
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return response({ success: false, error: error instanceof Error ? error.message : "Unknown sync error" }, 500);
  }
});
