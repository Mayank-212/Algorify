import { Mistral } from "@mistralai/mistralai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { history, profile } = await req.json();
    
    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ error: "Missing MISTRAL_API_KEY" }, { status: 500 });
    }

    const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

    const systemInstruction = `You are Algorify, an elite AI Learning Twin.
The student just completed a quiz. Here is their profile: ${JSON.stringify(profile)}

Here is their performance history on the quiz:
${JSON.stringify(history, null, 2)}

Generate a highly personalized, deeply insightful, full-fledged study report.
Include:
1. **Overall Assessment**: A brief, encouraging summary of how they did.
2. **Knowledge Gaps**: Deep dive into exactly WHY they got questions wrong based on the specific misconceptions they fell for.
3. **Personalized Action Plan**: What exact topics they should study next and how they should approach them.

Format it beautifully using Markdown (lists, bolding, emojis). Do NOT use LaTeX math formatting, stick to plain text math.`;

    const responseStream = await client.chat.stream({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: "Generate my personalized quiz report and study planner based on my results." }
      ],
      temperature: 0.7,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.data.choices[0].delta.content) {
              const textContent = chunk.data.choices[0].delta.content;
              const textStr = typeof textContent === "string" ? textContent : "";
              controller.enqueue(new TextEncoder().encode(textStr));
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Report Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report." },
      { status: 500 }
    );
  }
}
