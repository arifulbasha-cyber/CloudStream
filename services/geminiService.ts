import { GoogleGenAI, Type } from "@google/genai";
import { FileSystemItem } from "../types";

export const performSmartSearch = async (query: string, files: FileSystemItem[], apiKey: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("No API Key provided");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Prepare file context for the model
  const fileContext = files.map(f => ({
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
    If the user asks for "videos", return all video IDs.
    If the user asks about "rabbits", find files with descriptions or names involving rabbits.
    Only return the IDs as a JSON array of strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as string[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [];
  }
};