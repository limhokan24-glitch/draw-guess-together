
import { GoogleGenAI } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION } from "../constants";

export async function askGeminiToGuess(imageDataBase64: string, chatHistory: any[]) {
  try {
    // Always initialize GoogleGenAI inside the function to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    
    const imagePart = {
      inlineData: {
        mimeType: 'image/png',
        data: imageDataBase64.split(',')[1], // Remove the data:image/png;base64, prefix
      },
    };

    const textPart = {
      text: "Look at this drawing. What do you think it represents? Keep your response short and fun."
    };

    // Use generateContent with an object containing parts for multi-modal input
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        temperature: 0.8,
      },
    });

    return response.text || "I'm not quite sure what that is yet, keep drawing!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Oops, my vision is a bit blurry right now. Try again in a second!";
  }
}

export async function chatWithGemini(userText: string, chatHistory: { role: string, parts: string }[]) {
  try {
    // Always initialize GoogleGenAI inside the function to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
      },
    });

    // sendMessage expects an object with a message property
    const response = await chat.sendMessage({ message: userText });
    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble connecting to the whiteboard brain!";
  }
}
