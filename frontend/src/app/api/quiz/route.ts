import { Mistral } from "@mistralai/mistralai";
import { NextResponse } from "next/server";
import { mockLearningTwin } from "@/lib/mock-data";

export async function POST(req: Request) {
  try {
    const { topic, difficulty, count = 5, bookId } = await req.json();

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ error: "Missing MISTRAL_API_KEY" }, { status: 500 });
    }
    
    const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    const twin = mockLearningTwin;

    let contextText = "";
    if (bookId) {
      try {
        const pyRes = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://127.0.0.1:8001'}/api/books/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document_id: bookId, query: `Summarize the key concepts about ${topic}. Provide exact facts to be tested.` })
        });
        if (pyRes.ok) {
          const pyData = await pyRes.json();
          contextText = `\n\nCRITICAL: You MUST base the questions ONLY on the following textbook material:\n"""\n${pyData.answer}\n"""\n`;
        }
      } catch (e) {
        console.error("Python engine offline, skipping RAG context.");
      }
    }

    const systemPrompt = `You are a strict JSON quiz generator. You MUST output a JSON object with a single root key "questions" containing an array of exactly ${count} objects.
EACH question object MUST have this exact schema:
{
  "id": "unique-string",
  "topic": "string",
  "difficulty": "string",
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctAnswer": integer (0 to 3),
  "explanation": "string",
  "misconception": "string",
  "whyReasonable": "string"
}
Output absolutely nothing except valid JSON. Do not use markdown blocks (\`\`\`json). Just the raw JSON object.`;

    const userPrompt = `Generate a ${difficulty} difficulty multiple-choice quiz about "${topic}".
The student's learning style is ${twin.learningStyle} and they prefer ${twin.preferredExplanationStyle} explanations. 
Make sure the explanations are tailored to this style.${contextText}`;

    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      responseFormat: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Failed to generate quiz content");
    }

    const parsedData = JSON.parse(content as string);
    return NextResponse.json({ questions: parsedData.questions });
  } catch (error: any) {
    console.error("Mistral Quiz API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
