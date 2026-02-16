
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function getStudyAdvice(completedCount: number, totalCount: number) {
  try {
    const prompt = `I am a student preparing for the PTE exam. Today I have completed ${completedCount} out of ${totalCount} tasks. 
    Provide a short, highly motivating 2-sentence study tip or encouragement. Keep it practical and specific to PTE (Pearson Test of English).`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Keep pushing! Every task completed is a step closer to your dream score.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Consistent practice is the key to mastering the PTE. Focus on your weak areas today.";
  }
}
