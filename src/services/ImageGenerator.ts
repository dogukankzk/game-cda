import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateVisitorImage(characterType: string, description: string): Promise<string | null> {
  try {
    const prompt = `A close-up pixel art portrait of a ${characterType}. 
    Context: ${description}. 
    Style: Retro 16-bit RPG video game, colorful, vibrant, fantasy style. 
    The background should be a solid dark color or simple pattern. 
    High contrast, expressive face.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        // responseMimeType is not supported for this model, it returns base64 in inlineData
      }
    });

    // Extract image from response
    // The response structure for image generation usually contains inlineData in the parts
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        const parts = candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    return null;
  } catch (error) {
    console.error("Failed to generate image:", error);
    return null;
  }
}
