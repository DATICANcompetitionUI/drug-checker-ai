import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// A dictionary of common medications to match against filenames when OCR is unavailable.
const COMMON_DRUGS = [
  "Aspirin", "Ibuprofen", "Warfarin", "Metformin", "Lisinopril", 
  "Simvastatin", "Levothyroxine", "Albuterol", "Amlodipine", 
  "Gabapentin", "Omeprazole", "Atorvastatin", "Amoxicillin",
  "Acetaminophen", "Paracetamol", "Clopidogrel", "Losartan"
];

export async function POST(request: Request) {
  try {
    const { image, filename } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, message: "No image data provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Extract base64 data and mime type
        const match = image.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
        if (!match) {
          throw new Error("Invalid base64 image format");
        }
        
        const mimeType = match[1];
        const base64Data = match[2];

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            `Identify any prescription or over-the-counter medication/drug names mentioned in this bottle label or prescription image. 
            Return a JSON array of strings containing only the identified drug names, like: ["Aspirin", "Ibuprofen"]. 
            Do not include strengths or dosages (like 500mg), just the names.
            Return ONLY the valid JSON array and nothing else (no markdown blocks, no text).`,
          ],
        });

        const text = response.text || "";
        // Parse the JSON array from the response text
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const drugNames = JSON.parse(cleanText);

        if (Array.isArray(drugNames)) {
          return NextResponse.json({
            success: true,
            data: {
              drugs: drugNames,
              source: "gemini-ocr"
            }
          });
        }
      } catch (err) {
        console.error("Gemini OCR failed, falling back to pattern matching:", err);
      }
    }

    // Fallback logic for local development or API failure.
    const detectedDrugs: string[] = [];
    if (filename) {
      const lowerFile = filename.toLowerCase();
      for (const drug of COMMON_DRUGS) {
        if (lowerFile.includes(drug.toLowerCase())) {
          detectedDrugs.push(drug);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        drugs: detectedDrugs,
        source: detectedDrugs.length ? "filename-match" : "not-detected"
      }
    });

  } catch (error: unknown) {
    console.error("Error in scan API:", error);
    const message = error instanceof Error ? error.message : "Failed to process image scan";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
