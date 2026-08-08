import { Mistral } from "@mistralai/mistralai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topic, difficulty, count = 5, bookId, profile } = await req.json();

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ error: "Missing MISTRAL_API_KEY" }, { status: 500 });
    }
    
    const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    const p = profile || { learningStyle: "visual", preferredExplanationStyle: "detailed" };

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
  "options": ["string", "string", "string", "string"], // MUST be 4 COMPLETELY DISTINCT options (1 correct, 3 highly plausible but clearly different incorrect distractors). NO overlapping or vaguely similar options.
  "correctAnswer": integer (0 to 3),
  "explanation": "string", // A supportive, encouraging explanation of why the correct answer is right.
  "misconception": "string", // A brief note on what the student might have misunderstood.
  "whyReasonable": "string" // Why the trap distractor seemed plausible (with an empathetic tone).
}
Output absolutely nothing except valid JSON. Do not use markdown blocks (\`\`\`json). Just the raw JSON object.`;

    const userPrompt = `Generate a ${difficulty} difficulty multiple-choice quiz about "${topic}".
The student's learning style is ${p.learningStyle} and they prefer ${p.preferredExplanationStyle} explanations. 
Make sure the explanations are tailored to this style. Write the explanations and misconceptions in a deeply humanized, natural, conversational tone, as if a mentor is talking directly to the student in a personal notebook. Do NOT sound like an AI robot.${contextText}`;

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
    
    // Shuffle options to ensure correctAnswer is randomized
    const questions = parsedData.questions.map((q: any) => {
      if (!q.options || q.correctAnswer === undefined) return q;
      
      const options = [...q.options];
      const correctOptionText = options[q.correctAnswer];
      
      // Fisher-Yates shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      
      return {
        ...q,
        options,
        correctAnswer: options.indexOf(correctOptionText)
      };
    });

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("Mistral Quiz API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
