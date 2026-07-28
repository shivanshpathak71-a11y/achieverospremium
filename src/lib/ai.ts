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

export type ChatMessage = { role: "user" | "model"; content: string };

interface AiParams {
  action: AiAction;
  lectureTitle?: string;
  chapterTitle?: string;
  subjectTitle?: string;
  userMessage?: string;
  context?: string;
  count?: number;
  messages?: ChatMessage[];
}

interface AiResult<T> {
  data: T | null;
  raw: string;
  error: string | null;
}

export async function callAi<T = string>(params: AiParams): Promise<AiResult<T>> {
  try {
    const resp = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, stream: false }),
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

export async function streamAi(
  params: AiParams,
  onChunk: (text: string) => void,
): Promise<{ error: string | null }> {
  try {
    const resp = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, stream: true }),
    });

    if (!resp.ok) {
      const json = await resp.json().catch(() => ({}));
      return { error: json.error || `Request failed (${resp.status})` };
    }

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
            if (text) onChunk(text);
          } catch {
            // skip malformed chunk
          }
        }
      }
    }
    return { error: null };
  } catch (err) {
    return { error: String(err) };
  }
}
