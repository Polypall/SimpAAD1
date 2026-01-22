
import { GoogleGenAI, Type } from "@google/genai";
import { ShapeConfig, ShapeType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const interpretShapeRequest = async (prompt: string, imageData?: string): Promise<Partial<ShapeConfig>> => {
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: imageData ? 
      { parts: [{ inlineData: { data: imageData.split(',')[1], mimeType: 'image/png' } }, { text: prompt }] } : 
      prompt,
    config: {
      systemInstruction: `You are a CAD design assistant for SimpAAD. 
      Interpret user descriptions or drawings into 3D primitive parameters.
      Always return a JSON object that maps to a Three.js primitive.
      Units are in millimeters. Default color is #3b82f6.
      Support: box (width, height, depth), sphere (radius), cylinder (radius, height), cone (radius, height), torus (radius, tube).`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Type of shape (box, sphere, cylinder, cone, torus)" },
          params: {
            type: Type.OBJECT,
            properties: {
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
              depth: { type: Type.NUMBER },
              radius: { type: Type.NUMBER },
              tube: { type: Type.NUMBER }
            }
          },
          label: { type: Type.STRING }
        },
        required: ["type", "params", "label"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
};
