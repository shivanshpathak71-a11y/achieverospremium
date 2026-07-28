import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent`;

async function getGeminiKey(): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await supabase.rpc("get_gemini_api_key");
  if (error || !data) return "";
  return data as string;
}

type ChatMessage = { role: "user" | "model"; content: string };

interface Body {
  action: "chat" | "summarize" | "mcqs" | "quiz" | "flashcards" | "revision" | "explain" | "solve" | "plan" | "doubt";
  lectureTitle?: string;
  chapterTitle?: string;
  subjectTitle?: string;
  messages?: ChatMessage[];
  userMessage?: string;
  context?: string;
  count?: number;
  stream?: boolean;
}

const SYSTEM_BASE = `You are an expert AI study assistant for Indian competitive exam preparation (SSC, Banking, Railway, Stenography, CGL, CHSL, etc.). You help students with Reasoning, English, Mathematics, General Knowledge, and all other subjects. Always be clear, concise, and exam-focused. Use simple language. When generating questions, ensure they are exam-relevant and well-structured. Format responses in Markdown. Use LaTeX for math expressions: $inline$ and $$block$$.`;

function buildContents(action: string, body: Body): { systemInstruction: string; contents: ChatMessage[] } {
  const ctx = [body.subjectTitle, body.chapterTitle, body.lectureTitle].filter(Boolean).join(" → ");
  const ctxLine = ctx ? `Context: ${ctx}` : "";

  switch (action) {
    case "summarize":
      return {
        systemInstruction: `${SYSTEM_BASE}\n\nSummarize the lecture into concise, well-structured study notes. Use bullet points, bold key terms, and organize by subtopic. Keep it under 400 words. ${ctxLine}`,
        contents: [{ role: "user", content: body.userMessage || `Summarize the lecture "${body.lectureTitle}" into concise study notes.` }],
      };
    case "mcqs":
      return {
        systemInstruction: `${SYSTEM_BASE}\n\nGenerate ${body.count || 5} multiple-choice questions. Return ONLY a JSON array, no markdown, no explanation. Each item: {"question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..."}. The answer is the 0-based index of the correct option. Make questions exam-level difficulty. ${ctxLine}`,
        contents: [{ role: "user", content: body.userMessage || `Generate ${body.count || 5} MCQs from the topic: "${body.lectureTitle}".` }],
      };
    case "quiz":
      return {
        systemInstruction: `${SYSTEM_BASE}\n\nGenerate a ${body.count || 5}-question practice quiz. Return ONLY a JSON array, no markdown. Each item: {"question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..."}. Mix difficulty levels. ${ctxLine}`,
        contents: [{ role: "user", content: body.userMessage || `Generate a practice quiz for: "${body.lectureTitle}".` }],
      };
    case "flashcards":
      return {
        systemInstruction: `${SYSTEM_BASE}\n\nGenerate ${body.count || 10} flashcards. Return ONLY a JSON array, no markdown. Each item: {"front": "question or term", "back": "answer or definition"}. ${ctxLine}`,
        contents: [{ role: "user", content: body.userMessage || `Make flashcards from the notes on: "${body.lectureTitle}".` }],
      };
    case "revision":
      return {
        systemInstruction: `${SYSTEM_BASE}\n\nCreate daily revision questions. Return ONLY a JSON array, no markdown. Each item: {"question": "...", "answer": "...", "topic": "..."}. Focus on spaced repetition and key concepts. ${ctxLine}`,
        contents: [{ role: "user", content: body.userMessage || `Create ${body.count || 5} daily revision questions for: "${body.lectureTitle}".` }],
      };
    case "explain":
      return {
        systemInstruction: `${SYSTEM_BASE}\n\nExplain the concept in simpler language, as if teaching a beginner. Use analogies, examples, and step-by-step breakdown. ${ctxLine}`,
        contents: [{ role: "user", content: body.userMessage || `Explain the concepts from "${body.lectureTitle}" in simpler language.` }],
      };
    case "solve":
      return {
        systemInstruction: `${SYSTEM_BASE}\n\nSolve the given previous-year question step by step. Show each step clearly with reasoning. End with the final answer highlighted. ${ctxLine}`,
        contents: [{ role: "user", content: body.userMessage || `Solve this previous-year question step by step:\n\n${body.context || body.userMessage || ""}` }],
      };
    case "plan":
      return {
        systemInstruction: `${SYSTEM_BASE}\n\nCreate a personalized daily study schedule. Consider the student's subjects, available time, and exam goals. Return a well-structured plan with time slots, subjects, and specific topics to cover. Use a motivating but practical tone. ${ctxLine}`,
        contents: [{ role: "user", content: body.userMessage || body.context || "Plan my daily study schedule." }],
      };
    case "doubt":
    case "chat":
    default:
      return {
        systemInstruction: `${SYSTEM_BASE}\n\nAnswer the student's question clearly and concisely. Use examples where helpful. If the question is about a specific lecture topic, relate your answer to exam preparation. ${ctxLine}`,
        contents: body.messages && body.messages.length > 0
          ? body.messages
          : [{ role: "user", content: body.userMessage || body.context || "Hello" }],
      };
  }
}

function extractContent(text: string): string {
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

async function streamGemini(body: Body, apiKey: string): Promise<Response> {
  const { systemInstruction, contents } = buildContents(body.action, body);
  const isStructured = ["mcqs", "quiz", "flashcards", "revision"].includes(body.action);

  const resp = await fetch(`${GEMINI_URL}?key=${apiKey}&alt=sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: contents.map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: isStructured ? 0.7 : 0.4,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    return new Response(JSON.stringify({ error: `Gemini error: ${resp.status}`, details: errText }), {
      status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // For structured actions, buffer and parse JSON
  if (isStructured) {
    const fullText = await collectStream(resp);
    const cleaned = extractContent(fullText);
    try {
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify({ data: parsed, raw: fullText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ data: null, raw: fullText, error: "Failed to parse structured response" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // For chat/doubt/summarize/explain/solve/plan with streaming requested
  if (body.stream) {
    // Pipe the SSE stream from Gemini directly to the client
    return new Response(resp.body!.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunk);
        },
      })
    ), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  }

  // Non-streaming: buffer full response
  const fullText = await collectStream(resp);
  return new Response(JSON.stringify({ data: fullText }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function collectStream(resp: Response): Promise<string> {
  let fullText = "";
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;
        try {
          const json = JSON.parse(jsonStr);
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) fullText += text;
        } catch {
          // skip malformed chunk
        }
      }
    }
  }
  return fullText;
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

    const apiKey = await getGeminiKey();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: Body = await req.json();
    return await streamGemini(body, apiKey);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
