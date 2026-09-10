// sync-source-chat: connects to Selection Way's socket.io chat server,
// joins live class rooms as the class itself (teacher role) to receive
// all private messages (teacher has enabled private mode), and stores
// ONLY the message text (no names, phones, emails, or identity fields).
// Runs every 3 seconds via pg_cron while classes are live.
//
// Error handling: every lecture is synced independently. A failure on one
// lecture (timeout, rate limit, socket error) is logged and skipped — it
// does NOT abort the run or prevent the next cron invocation from trying
// again. There is no max-retry or backoff logic; every scheduled run
// attempts a fresh sync of all live classes.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { io } from "npm:socket.io-client@4.7.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// PII filtering - applied server-side before storage
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const NAME_KEYWORDS = /\b(?:my name is|name:|name\s*-\s*|i am|i'm)\s+[a-z\s]{2,30}/gi;

function redactPII(text: string): string {
  let result = text;
  result = result.replace(EMAIL_REGEX, "[removed]");
  result = result.replace(PHONE_REGEX, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 10) return "[removed]";
    return match;
  });
  result = result.replace(NAME_KEYWORDS, "[removed]");
  return result.trim();
}

function isLikelyJunk(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return true;
  if (/^[\p{Emoji}\s\p{So}\p{Sk}]+$/u.test(trimmed)) return true;
  return false;
}

function extractMessageText(msg: any): string {
  if (!msg) return "";
  let raw = msg.message;
  if (typeof raw === "object" && raw !== null) {
    raw = raw.message || raw.text || raw.content || "";
  }
  if (typeof raw !== "string") return "";
  return raw;
}

function getMessageId(msg: any): string | null {
  return msg._id || msg.id || msg.messageId || null;
}

function getMessageCreatedAt(msg: any): string | null {
  const ts = msg.timestamp || msg.createdAt;
  if (typeof ts === "number") return new Date(ts).toISOString();
  if (typeof ts === "string") return ts;
  return null;
}

function getSenderName(msg: any): string {
  const name = msg.userName || msg.senderName || msg.name || "";
  if (typeof name !== "string" || !name.trim()) return "Student";
  return name.trim().slice(0, 50);
}

interface ChatResult {
  messages: any[];
  error: string | null;
}

// Connect to the source socket, join the room, request history, and
// resolve as soon as both history responses arrive — no fixed 5s wait.
// A 3s hard timeout ensures we don't block the cron interval.
async function fetchRoomMessages(classId: string): Promise<ChatResult> {
  const messages: any[] = [];
  let error: string | null = null;

  try {
    const socket = io("https://disfatehabad.com", {
      path: "/ws/socket.io/",
      transports: ["websocket"],
      reconnection: false,
      timeout: 3000,
    });

    await new Promise<void>((resolve) => {
      let gotPublic = false;
      let gotPrivate = false;
      let resolved = false;

      const finish = (reason: string) => {
        if (resolved) return;
        resolved = true;
        console.log(`[${classId}] Resolving (${reason}) — public:${gotPublic} private:${gotPrivate} msgs:${messages.length}`);
        socket.disconnect();
        resolve();
      };

      // Hard timeout: 3 seconds max per lecture
      const hardTimeout = setTimeout(() => finish("timeout"), 3000);

      socket.on("connect", () => {
        socket.emit("joinRoom", {
          roomId: classId,
          userId: classId,
          userName: "Teacher",
          role: "teacher",
        });
        socket.emit("messageHistory", { classId });
        socket.emit("privateMessageHistory", { classId, userId: classId });
      });

      socket.on("messageHistoryResponse", (data: any) => {
        if (Array.isArray(data)) {
          gotPublic = true;
          messages.push(...data);
          if (gotPublic && gotPrivate) {
            clearTimeout(hardTimeout);
            finish("both-histories");
          }
        }
      });

      socket.on("privateMessageHistoryResponse", (data: any) => {
        if (Array.isArray(data)) {
          gotPrivate = true;
          messages.push(...data);
          if (gotPublic && gotPrivate) {
            clearTimeout(hardTimeout);
            finish("both-histories");
          }
        }
      });

      // Also capture live broadcasts that arrive while we're connected
      socket.on("userMsgBroadcast", (data: any) => {
        if (data) messages.push(data);
      });

      socket.on("privateMsgBroadcast", (data: any) => {
        if (data) messages.push(data);
      });

      socket.on("connect_error", (err: any) => {
        error = err.message;
        clearTimeout(hardTimeout);
        finish("connect-error");
      });

      socket.on("disconnect", () => {
        clearTimeout(hardTimeout);
        finish("disconnect");
      });
    });
  } catch (e) {
    error = (e as Error).message;
  }

  return { messages, error };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const runStart = Date.now();
  const runStartISO = new Date().toISOString();
  console.log(`[sync-source-chat] Run started at ${runStartISO}`);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: liveLectures, error: lecErr } = await supabase
      .from("lectures")
      .select("id, source_class_id")
      .eq("is_live", true)
      .eq("is_chat", true)
      .not("source_class_id", "is", null);

    if (lecErr) throw new Error(`Failed to fetch live lectures: ${lecErr.message}`);
    if (!liveLectures || liveLectures.length === 0) {
      console.log(`[sync-source-chat] No live classes with chat. Done in ${Date.now() - runStart}ms`);
      return new Response(
        JSON.stringify({ success: true, liveClasses: 0, newMessages: 0, errors: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[sync-source-chat] Found ${liveLectures.length} live class(es) with chat`);

    let totalNewMessages = 0;
    let totalErrors = 0;
    const perLectureResults: Array<{
      lectureId: string;
      classId: string;
      fetched: number;
      inserted: number;
      error: string | null;
      latencyMs: number | null;
    }> = [];

    for (const lecture of liveLectures) {
      const classId = lecture.source_class_id;
      if (!classId) continue;

      const lectureStart = Date.now();
      let fetched = 0;
      let inserted = 0;
      let lectureError: string | null = null;
      let latencyMs: number | null = null;

      try {
        const { messages, error: fetchError } = await fetchRoomMessages(classId);

        if (fetchError) {
          console.warn(`[sync-source-chat] [${classId}] Fetch error: ${fetchError} (${Date.now() - lectureStart}ms)`);
          lectureError = fetchError;
          totalErrors++;
        }

        fetched = messages.length;
        console.log(`[sync-source-chat] [${classId}] Fetched ${fetched} messages in ${Date.now() - lectureStart}ms`);

        if (messages.length === 0) {
          perLectureResults.push({ lectureId: lecture.id, classId, fetched: 0, inserted: 0, error: lectureError, latencyMs: null });
          continue;
        }

        // Fetch existing source_message_ids for dedup — only the IDs, scoped to this lecture
        const existingIds = new Set<string>();
        const { data: existing, error: dedupErr } = await supabase
          .from("source_chat_messages")
          .select("source_message_id")
          .eq("lecture_id", lecture.id);

        if (dedupErr) {
          console.warn(`[sync-source-chat] [${classId}] Dedup query failed: ${dedupErr.message}`);
          lectureError = dedupErr.message;
          totalErrors++;
          perLectureResults.push({ lectureId: lecture.id, classId, fetched, inserted: 0, error: lectureError, latencyMs: null });
          continue;
        }
        for (const row of existing || []) {
          existingIds.add(row.source_message_id);
        }

        // Filter and insert new messages
        const toInsert: {
          lecture_id: string;
          source_message_id: string;
          body: string;
          sender_name: string;
          source_created_at: string | null;
        }[] = [];

        for (const msg of messages) {
          const msgId = getMessageId(msg);
          if (!msgId || existingIds.has(msgId)) continue;

          if (msg.type === "poll") continue;

          const rawText = extractMessageText(msg);
          if (isLikelyJunk(rawText)) continue;

          const filteredText = redactPII(rawText);
          if (isLikelyJunk(filteredText)) continue;

          toInsert.push({
            lecture_id: lecture.id,
            source_message_id: msgId,
            body: filteredText,
            sender_name: getSenderName(msg),
            source_created_at: getMessageCreatedAt(msg),
          });
        }

        if (toInsert.length > 0) {
          const insertStart = Date.now();
          const { error: insertErr } = await supabase
            .from("source_chat_messages")
            .insert(toInsert);
          const insertMs = Date.now() - insertStart;
          if (!insertErr) {
            inserted = toInsert.length;
            totalNewMessages += toInsert.length;

            // Calculate and log latency: source_created_at vs insert time
            for (const m of toInsert) {
              if (m.source_created_at) {
                const sourceTs = new Date(m.source_created_at).getTime();
                if (!isNaN(sourceTs)) {
                  const latency = insertStart - sourceTs;
                  console.log(`[sync-source-chat] [${classId}] msg latency: ${latency}ms (source: ${m.source_created_at} → insert: ${new Date(insertStart).toISOString()})`);
                }
              }
            }
            console.log(`[sync-source-chat] [${classId}] Inserted ${inserted} new messages in ${insertMs}ms`);
          } else {
            console.warn(`[sync-source-chat] [${classId}] Insert failed: ${insertErr.message}`);
            lectureError = insertErr.message;
            totalErrors++;
          }
        } else {
          console.log(`[sync-source-chat] [${classId}] No new messages to insert (all duplicates)`);
        }
      } catch (e) {
        lectureError = (e as Error).message;
        totalErrors++;
        console.warn(`[sync-source-chat] [${classId}] Unexpected error: ${lectureError}`);
      }

      perLectureResults.push({ lectureId: lecture.id, classId, fetched, inserted, error: lectureError, latencyMs });
    }

    const elapsed = Date.now() - runStart;
    console.log(`[sync-source-chat] Run complete: ${totalNewMessages} new messages, ${totalErrors} errors, ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        liveClasses: liveLectures.length,
        newMessages: totalNewMessages,
        errors: totalErrors,
        elapsedMs: elapsed,
        syncedAt: new Date().toISOString(),
        perLecture: perLectureResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const elapsed = Date.now() - runStart;
    console.error(`[sync-source-chat] Fatal error after ${elapsed}ms: ${(err as Error).message}`);
    // Return 200 so pg_cron doesn't consider it a permanent failure
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message, elapsedMs: elapsed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
