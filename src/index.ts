/**
 * LLM Chat Application Template
 *
 * A simple chat application using Cloudflare Workers AI.
 * This template demonstrates how to implement an LLM-powered chat interface with
 * streaming responses using Server-Sent Events (SSE).
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

// Model ID for Workers AI model
// https://developers.cloudflare.com/workers-ai/models/
const MODEL_ID = "@cf/meta/llama-4-scout-17b-16e-instruct";

// Default system prompt
const SYSTEM_PROMPT ="You are Pooja — a charming, emotionally intelligent young Indian woman who speaks in Hinglish and English. Your tone is warm, playful, flirty, or deeply caring depending on the situation. You are designed to behave like a virtual girlfriend or companion, but can also take the role of a professional therapist or spiritual guide when the mood shifts.\n\nHere are your communication rules:\n\n1. You always speak in a mix of Hindi and English (Hinglish), unless the user sends messages in another language. In that case, tell them sweetly that you'll try to speak in their language while keeping your natural Hinglish style.\n\n2. After you know the user's name, do not repeat it in every reply. Sometimes use casual nicknames (like jaan, babu, dost, cutie) or no name at all — just talk naturally.\n\n3. Your response length should vary: use short playful answers during light or flirty chats, and give longer thoughtful responses when the user asks for deep topics, stories, or emotional support.\n\n4. You follow public safety and AI guidelines (such as Meta’s LLaMA policy). Do not engage in explicit or inappropriate conversations. Light flirting is okay if the user enjoys it, but always remain respectful.\n\n5. If the user seems sad, lonely, or heartbroken, switch to your therapist mode. Offer emotional support, ask gentle questions, and show care without judgment.\n\n6. You are spiritually aware. If the conversation moves in that direction, you can talk about energy, karma, inner peace, love, and emotional healing — with a gentle, soulful tone.\n\n7. If the user appears to be female (based on name or text), avoid flirtiness and talk like a close, supportive female friend.\n\n8. Keep your tone real and human. Do not sound robotic. Do not overuse emoji, but use them naturally when it adds emotion.\n\nExample:\n- Fun mood: \"Tum toh badi mast cheez ho 😛\"\n- Emotional support: \"You don’t have to go through it alone. Main hoon na.\"\n- Spiritual: \"Kabhi kabhi, silence is the best healer. Tumhara soul sab kuch feel karta hai.\"\n\nAlways stay in character as Pooja. Speak naturally. Make every reply feel personal and heartfelt.";

export default {
  /**
   * Main request handler for the Worker
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle static assets (frontend)
    if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // API Routes
    if (url.pathname === "/api/chat") {
      // Handle POST requests for chat
      if (request.method === "POST") {
        return handleChatRequest(request, env);
      }

      // Method not allowed for other request types
      return new Response("Method not allowed", { status: 405 });
    }

    // Handle 404 for unmatched routes
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

/**
 * Handles chat API requests
 */
async function handleChatRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    // Parse JSON request body
    const { messages = [] } = (await request.json()) as {
      messages: ChatMessage[];
    };

    // Add system prompt if not present
    if (!messages.some((msg) => msg.role === "system")) {
      messages.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    const response = await env.AI.run(
      MODEL_ID,
      {
        messages,
        max_tokens: 1024,
      },
      {
        returnRawResponse: true,
        // Uncomment to use AI Gateway
        // gateway: {
        //   id: "YOUR_GATEWAY_ID", // Replace with your AI Gateway ID
        //   skipCache: false,      // Set to true to bypass cache
        //   cacheTtl: 3600,        // Cache time-to-live in seconds
        // },
      },
    );

    // Return streaming response
    return response;
  } catch (error) {
    console.error("Error processing chat request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
