// cleanup-old-chat-messages: deletes source_chat_messages rows older than 2 minutes.
// Runs every 1 minute via pg_cron. Logs the count of deleted rows each run.
// This prevents messages from accumulating indefinitely while still giving
// the realtime subscription enough time to deliver them to clients.
//
// Safety: uses source_created_at (the original timestamp from the source server)
// with a fallback to created_at (the database insert timestamp) for rows where
// source_created_at is null. Does NOT interfere with the sync job or realtime
// subscription — rows are only deleted after they've had ample time to be
// delivered to all connected clients.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const runStart = Date.now();
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  console.log(`[cleanup-old-chat-messages] Run started at ${new Date().toISOString()}, cutoff=${cutoff}`);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Count rows that will be deleted (for logging)
    const { count: beforeCount, error: countErr } = await supabase
      .from("source_chat_messages")
      .select("*", { count: "exact", head: true })
      .or(`source_created_at.lt.${cutoff},and(source_created_at.is.null,created_at.lt.${cutoff})`);

    if (countErr) {
      console.warn(`[cleanup-old-chat-messages] Count query failed: ${countErr.message}`);
    }

    // Delete rows older than 2 minutes
    const { error: deleteErr, count: deletedCount } = await supabase
      .from("source_chat_messages")
      .delete({ count: "exact" })
      .or(`source_created_at.lt.${cutoff},and(source_created_at.is.null,created_at.lt.${cutoff})`);

    if (deleteErr) {
      console.error(`[cleanup-old-chat-messages] Delete failed: ${deleteErr.message}`);
      return new Response(
        JSON.stringify({ success: false, error: deleteErr.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const elapsed = Date.now() - runStart;
    const deleted = deletedCount ?? 0;
    console.log(`[cleanup-old-chat-messages] Deleted ${deleted} rows (matched: ${beforeCount ?? "unknown"}) in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        deletedRows: deleted,
        matchedRows: beforeCount ?? null,
        cutoff,
        elapsedMs: elapsed,
        runAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const elapsed = Date.now() - runStart;
    console.error(`[cleanup-old-chat-messages] Fatal error after ${elapsed}ms: ${(err as Error).message}`);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message, elapsedMs: elapsed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
