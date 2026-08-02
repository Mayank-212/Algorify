import { NextResponse } from "next/server";
import https from "https";

export async function POST(req: Request) {
  try {
    const { action, text, selection, profile, bookId } = await req.json();

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ error: "Missing MISTRAL_API_KEY" }, { status: 500 });
    }

    let contextData = "";

    if (bookId) {
      try {
        const pyRes = await fetch("http://127.0.0.1:8001/api/books/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            document_id: bookId, 
            query: `Find specific facts, quotes, or citations relevant to: "${selection || text}".` 
          })
        });
        if (pyRes.ok) {
          const pyData = await pyRes.json();
          contextData = `\n\n--- REQUIRED TEXTBOOK FACTS ---\nYou MUST incorporate the following textbook information directly into your output:\n${pyData.answer}\n-------------------------------\n`;
        }
      } catch (e) {
        console.error("RAG engine offline");
      }
    }

    let sysPrompt = `You are an elite AI Co-Writer. Your goal is to assist the student in writing. Maintain a highly professional but accessible tone. Output ONLY the improved/generated text without conversational filler.`;
    
    if (profile) {
      sysPrompt += `\n\nSTUDENT PROFILE (Adjust vocabulary & analogies to match):\n- Current Level: ${profile.level} XP\n- Strengths: ${profile.strengths.join(", ")}\n- Weaknesses: ${profile.weaknesses.join(", ")}\n`;
    }

    let userPrompt = "";
    if (action === "improve") {
      userPrompt = `Improve this text. Make it more articulate, fix grammar, and elevate the vocabulary.${contextData}\n\nText: "${selection || text}"`;
    } else if (action === "expand") {
      userPrompt = `Expand on this text. Add more detail, examples, and depth.${contextData}\n\nText: "${selection || text}"`;
    } else if (action === "teach") {
      userPrompt = `Explain this text to me as if you are my tutor. Break down the core concepts step by step. Use analogies based on my strengths, and heavily focus on breaking down my weaknesses.${contextData}\n\nText: "${selection || text}"`;
    }

    const postData = JSON.stringify({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt }
      ],
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
    console.error("Mistral CoWriter API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
