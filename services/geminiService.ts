import { FileSystemItem } from "../types";

type GenAIResponse = {
  // Keep minimal and resilient parsing: actual schema can vary by API
  candidates?: Array<{ content?: string; output?: string }>;
  // fallback shape
  text?: string;
  [k: string]: any;
};

export const performSmartSearch = async (
  query: string,
  files: FileSystemItem[],
  apiKey: string
): Promise<string[]> => {
  if (!apiKey) {
    console.warn("No API Key provided");
    return [];
  }

  const fileContext = files.map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    description: f.description || "No description provided",
  }));

  const prompt = `
You are an intelligent file system assistant.
User Query: "${query}"

Here is the list of available files:
${JSON.stringify(fileContext)}

Return a list of file IDs that are relevant to the user's query.
Only return the IDs as a JSON array of strings.
`;

  try {
    // REST endpoint: adjust if your account uses a different v1 path or project scoping.
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.5-flash:generateText";

    const res = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // This body shape is intentionally minimal; tweak per the exact API contract you use
        prompt: { text: prompt },
        maxOutputTokens: 512,
        temperature: 0.0,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("GenAI API error:", res.status, text);
      return [];
    }

    const json: GenAIResponse = await res.json();

    // Try common response shapes, then fallback to parsing the raw text content
    let text = "";

    if (json.candidates && json.candidates.length > 0) {
      // some responses nest text in candidates[].content
      text = json.candidates[0].content ?? json.candidates[0].output ?? "";
    } else if (typeof (json as any).output === "string") {
      text = (json as any).output;
    } else if (json.text) {
      text = json.text;
    } else {
      text = JSON.stringify(json);
    }

    // The service expects a JSON array of IDs; parse if possible.
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.every((i) => typeof i === "string")) {
        return parsed as string[];
      }
      // If parsed but not the expected shape, fall through to heuristic
    } catch {
      // not JSON — continue to heuristic below
    }

    // Heuristic fallback: try to extract a JSON array substring
    const match = text.match(/\[(?:[^\]]*)\]/s);
    if (match) {
      try {
        const parsed2 = JSON.parse(match[0]);
        if (Array.isArray(parsed2) && parsed2.every((i) => typeof i === "string")) {
          return parsed2 as string[];
        }
      } catch {
        // ignore
      }
    }

    // If nothing worked, return an empty array or the whole text wrapped as single entry
    console.warn("GenAI response did not contain a JSON array of IDs. Raw response:", text);
    return [];
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [];
  }
};
