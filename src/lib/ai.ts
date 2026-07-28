const AI_ENDPOINT = `https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/ai-assistant`;

export type AiAction =
  | "chat"
  | "summarize"
  | "mcqs"
  | "quiz"
  | "flashcards"
  | "revision"
  | "explain"
  | "solve"
  | "plan"
  | "doubt";

interface AiParams {
  action: AiAction;
  lectureTitle?: string;
  chapterTitle?: string;
  subjectTitle?: string;
  userMessage?: string;
  context?: string;
  count?: number;
}

export async function callAi<T = string>(params: AiParams): Promise<{ data: T | null; raw: string; error: string | null }> {
  try {
    const resp = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = await resp.json();
    if (!resp.ok) {
      return { data: null, raw: "", error: json.error || `Request failed (${resp.status})` };
    }
    return { data: json.data, raw: json.raw ?? "", error: json.error ?? null };
  } catch (err) {
    return { data: null, raw: "", error: String(err) };
  }
}
