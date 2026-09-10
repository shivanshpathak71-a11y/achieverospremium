// sync-live-status: lightweight sync that updates is_live / is_blinking / class_link
// for all classes in source batch 6a462e62b927c1a84a8b7879 (Selection Batch 10).
// Runs every 2 minutes via pg_cron so live classes appear in the app quickly.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SOURCE_BATCH_ID = "6a462e62b927c1a84a8b7879";
const SOURCE_CLASSES_API = `https://backend.multistreaming.site/api/courses/${SOURCE_BATCH_ID}/classes?populate=full`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const classesRes = await fetch(SOURCE_CLASSES_API, {
      headers: { "User-Agent": "ShivanshSync/1.0" },
    });
    if (!classesRes.ok) throw new Error(`Classes API returned ${classesRes.status}`);
    const classesData = await classesRes.json();
    const topics = classesData.data.classes;

    // Collect all source_class_ids for this batch
    const allClasses: { classId: string; isLive: boolean; isBlinking: boolean; isChat: boolean; classLink: string | null; startDate: string | null }[] = [];
    for (const topic of topics) {
      for (const cls of topic.classes || []) {
        allClasses.push({
          classId: cls.classId,
          isLive: cls.isLive || false,
          isBlinking: cls.isBlinking || false,
          isChat: cls.isChat || false,
          classLink: cls.class_link || null,
          startDate: cls.startDate || null,
        });
      }
    }

    // Fetch all lectures for this batch that have source_class_id
    const { data: subjectRow } = await supabase
      .from("subjects")
      .select("id")
      .eq("source_batch_id", SOURCE_BATCH_ID)
      .maybeSingle();

    if (!subjectRow) {
      return new Response(
        JSON.stringify({ success: false, error: "Subject not found for batch" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: chapters } = await supabase
      .from("chapters")
      .select("id")
      .eq("subject_id", subjectRow.id);

    const chapterIds = (chapters || []).map((c) => c.id);
    if (chapterIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updatedLive: 0, message: "No chapters found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: lectures } = await supabase
      .from("lectures")
      .select("id, source_class_id, is_live, is_blinking, is_chat, video_url");

    const lectureByClassId = new Map<string, { id: string; is_live: boolean; is_blinking: boolean; is_chat: boolean; video_url: string | null }>();
    for (const lec of lectures || []) {
      if (lec.source_class_id) lectureByClassId.set(lec.source_class_id, lec);
    }

    // Build a set of class IDs that are currently live or blinking in the source
    const sourceLiveClassIds = new Set<string>();
    for (const cls of allClasses) {
      if (cls.isLive || cls.isBlinking) sourceLiveClassIds.add(cls.classId);
    }

    let updatedLive = 0;
    const updates: { id: string; is_live: boolean; is_blinking: boolean; is_chat: boolean; video_url: string | null; start_date: string | null; updated_at: string }[] = [];

    for (const cls of allClasses) {
      const existing = lectureByClassId.get(cls.classId);
      if (!existing) continue;

      const liveUrl = cls.classLink;
      const needsLiveUrl = cls.isLive && liveUrl && existing.video_url !== liveUrl;
      const statusChanged = existing.is_live !== cls.isLive || existing.is_blinking !== cls.isBlinking;
      const chatChanged = existing.is_chat !== cls.isChat;

      if (statusChanged || needsLiveUrl || chatChanged) {
        updates.push({
          id: existing.id,
          is_live: cls.isLive,
          is_blinking: cls.isBlinking,
          is_chat: cls.isChat,
          video_url: cls.isLive && liveUrl ? liveUrl : existing.video_url,
          start_date: cls.startDate,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Also mark any currently-live lectures whose source class is no longer live
    for (const [classId, existing] of lectureByClassId) {
      if (existing.is_live && !sourceLiveClassIds.has(classId)) {
        updates.push({
          id: existing.id,
          is_live: false,
          is_blinking: false,
          is_chat: existing.is_chat,
          video_url: existing.video_url,
          start_date: existing.video_url ? null : null,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Batch update
    for (const upd of updates) {
      const { error } = await supabase
        .from("lectures")
        .update({
          is_live: upd.is_live,
          is_blinking: upd.is_blinking,
          is_chat: upd.is_chat,
          video_url: upd.video_url,
          start_date: upd.start_date,
          updated_at: upd.updated_at,
        })
        .eq("id", upd.id);
      if (error) {
        console.warn(`Live status update failed for ${upd.id}: ${error.message}`);
      } else {
        updatedLive++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalClasses: allClasses.length,
        updatedLive,
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
