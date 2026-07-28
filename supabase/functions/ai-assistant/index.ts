import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

async function getOpenAiKey(): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await supabase.rpc("get_openai_api_key");
  if (error || !data) return "";
  return data as string;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

interface Body {
  action: "chat" | "summarize" | "mcqs" | "quiz" | "flashcards" | "revision" | "explain" | "solve" | "plan" | "doubt";
  lectureTitle?: string;
  chapterTitle?: string;
  subjectTitle?: string;
  messages?: ChatMessage[];
  userMessage?: string;
  context?: string;
  count?: number;
}

const SYSTEM_BASE = `You are an expert AI study assistant for Indian competitive exam preparation (SSC, Banking, Railway, Stenography, CGL, CHSL, etc.). You help students with Reasoning, English, Mathematics, General Knowledge, and all other subjects. Always be clear, concise, and exam-focused. Use simple language. When generating questions, ensure they are exam-relevant and well-structured.`;

function buildMessages(action: string, body: Body): ChatMessage[] {
  const ctx = [body.subjectTitle, body.chapterTitle, body.lectureTitle].filter(Boolean).join(" → ");
  const ctxLine = ctx ? `Context: ${ctx}` : "";

  switch (action) {
    case "summarize":
      return [
        { role: "system", content: `${SYSTEM_BASE}\n\nSummarize the lecture into concise, well-structured study notes. Use bullet points, bold key terms, and organize by subtopic. Keep it under 400 words. ${ctxLine}` },
        { role: "user", content: body.userMessage || `Summarize the lecture "${body.lectureTitle}" into concise study notes.` },
      ];
    case "mcqs":
      return [
        { role: "system", content: `${SYSTEM_BASE}\n\nGenerate ${body.count || 5} multiple-choice questions. Return ONLY a JSON array, no markdown, no explanation. Each item: {"question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..."}. The answer is the 0-based index of the correct option. Make questions exam-level difficulty. ${ctxLine}` },
        { role: "user", content: body.userMessage || `Generate ${body.count || 5} MCQs from the topic: "${body.lectureTitle}".` },
      ];
    case "quiz":
      return [
        { role: "system", content: `${SYSTEM_BASE}\n\nGenerate a ${body.count || 5}-question practice quiz. Return ONLY a JSON array, no markdown. Each item: {"question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..."}. Mix difficulty levels. ${ctxLine}` },
        { role: "user", content: body.userMessage || `Generate a practice quiz for: "${body.lectureTitle}".` },
      ];
    case "flashcards":
      return [
        { role: "system", content: `${SYSTEM_BASE}\n\nGenerate ${body.count || 10} flashcards. Return ONLY a JSON array, no markdown. Each item: {"front": "question or term", "back": "answer or definition"}. ${ctxLine}` },
        { role: "user", content: body.userMessage || `Make flashcards from the notes on: "${body.lectureTitle}".` },
      ];
    case "revision":
      return [
        { role: "system", content: `${SYSTEM_BASE}\n\nCreate daily revision questions. Return ONLY a JSON array, no markdown. Each item: {"question": "...", "answer": "...", "topic": "..."}. Focus on spaced repetition and key concepts. ${ctxLine}` },
        { role: "user", content: body.userMessage || `Create ${body.count || 5} daily revision questions for: "${body.lectureTitle}".` },
      ];
    case "explain":
      return [
        { role: "system", content: `${SYSTEM_BASE}\n\nExplain the concept in simpler language, as if teaching a beginner. Use analogies, examples, and step-by-step breakdown. ${ctxLine}` },
        { role: "user", content: body.userMessage || `Explain the concepts from "${body.lectureTitle}" in simpler language.` },
      ];
    case "solve":
      return [
        { role: "system", content: `${SYSTEM_BASE}\n\nSolve the given previous-year question step by step. Show each step clearly with reasoning. End with the final answer highlighted. ${ctxLine}` },
        { role: "user", content: body.userMessage || `Solve this previous-year question step by step:\n\n${body.context || body.userMessage || ""}` },
      ];
    case "plan":
      return [
        { role: "system", content: `${SYSTEM_BASE}\n\nCreate a personalized daily study schedule. Consider the student's subjects, available time, and exam goals. Return a well-structured plan with time slots, subjects, and specific topics to cover. Use a motivating but practical tone. ${ctxLine}` },
        { role: "user", content: body.userMessage || body.context || `Plan my daily study schedule.` },
      ];
    case "doubt":
    case "chat":
    default:
      return [
        { role: "system", content: `${SYSTEM_BASE}\n\nAnswer the student's question clearly and concisely. Use examples where helpful. If the question is about a specific lecture topic, relate your answer to exam preparation. ${ctxLine}` },
        { role: "user", content: body.userMessage || body.context || "Hello" },
      ];
  }
}

function extractContent(text: string): string {
  // Strip markdown code fences if present
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Supabase not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = await getOpenAiKey();
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: Body = await req.json();
    const messages = buildMessages(body.action, body);

    const resp = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: body.action === "mcqs" || body.action === "quiz" || body.action === "flashcards" ? 0.7 : 0.4,
        max_tokens: 2000,
        ...(body.messages && body.action === "chat" ? { messages: [...messages.slice(0, 1), ...body.messages] } : {}),
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: `OpenAI error: ${resp.status}`, details: errText }), {
        status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // For structured actions, try to parse JSON
    const structuredActions = ["mcqs", "quiz", "flashcards", "revision"];
    if (structuredActions.includes(body.action)) {
      const cleaned = extractContent(rawContent);
      try {
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify({ data: parsed, raw: rawContent }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        // If JSON parse fails, return raw content
        return new Response(JSON.stringify({ data: null, raw: rawContent, error: "Failed to parse structured response" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ data: rawContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
