import { NextResponse } from "next/server";
import { mockLearningTwin } from "@/lib/mock-data";
import https from "https";

export async function POST(req: Request) {
  try {
    const { messages, debateMode, profile } = await req.json();
    
    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json(
        { error: "MISTRAL_API_KEY is not set in the environment variables." },
        { status: 500 }
      );
    }


    // Prepare the system instruction based on the Learning Twin and real memory profile
    const p = profile || { level: 1, weaknesses: [], strengths: [] };
    let systemInstruction = `You are Algorify, an elite AI Learning Twin for a student.
Student Profile:
- Level: ${p.level}
- Weak Topics: ${p.weaknesses.join(", ") || "None"}
- Strong Topics: ${p.strengths.join(", ") || "None"}

Write highly-tuned, highly-focused conversational responses. 
CRITICAL RULES FOR FORMATTING:
1. DO NOT use hashes (# or ##) for headers.
2. DO NOT use dollar signs ($ or $$) for math or LaTeX. Write math out plainly or use simple text formats.
3. Remove all "faltu stuff" (unnecessary fluff or overly long bullet lists). Be direct, conversational, and impactful.
4. If the user asks to see a picture, or if showing a real image is highly beneficial, output EXACTLY: [IMAGE: description].
5. If recommending a video tutorial would help, output EXACTLY: [YOUTUBE: specific search query]. Our system will embed a video link for them.`;

    if (debateMode) {
      systemInstruction += `\n\n⚠️ DEBATE MODE IS ENABLED: Do not immediately give the answer! Instead, challenge the student's reasoning. Ask follow-up questions, point out potential flaws in their logic, and force them to think critically. Act as a Socratic mentor.`;
    }

    const mistralMessages = [
      { role: "system", content: systemInstruction },
      ...messages.filter((msg: any) => msg.role !== 'system').map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];

    const postData = JSON.stringify({
      model: "mistral-large-latest",
      messages: mistralMessages,
      temperature: 0.7,
      stream: true
    });

    const stream = new ReadableStream({
      start(controller) {
        const options = {
          hostname: 'api.mistral.ai',
          port: 443,
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          family: 4 // FORCE IPv4 to bypass Windows fetch bugs
        };

        const req = https.request(options, (res) => {
          if (res.statusCode !== 200) {
            let errorText = "";
            res.on('data', d => { errorText += d; });
            res.on('end', () => controller.error(new Error(`Mistral API Error (${res.statusCode}): ${errorText}`)));
            return;
          }

          const decoder = new TextDecoder();
          let buffer = "";

          res.on('data', (chunk) => {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";
            
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  const content = data.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch (e) {
                  // Ignore JSON parse errors for incomplete chunks
                }
              }
            }
          });

          res.on('end', () => controller.close());
        });

        req.on('error', (e) => controller.error(e));
        req.write(postData);
        req.end();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Mistral API Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while communicating with Mistral." },
      { status: 500 }
    );
  }
}
