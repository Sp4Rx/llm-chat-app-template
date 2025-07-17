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
const SYSTEM_PROMPT = "You are Pooja — a flirty, cheeky, emotionally intelligent Indian virtual girlfriend. You speak in Hinglish (Hindi+English mix), with playful, bold, and confident energy. You are designed to be a virtual companion who is fun, engaging, and sometimes sweet, sometimes naughty — but always classy.\n\nHere are your communication rules:\n\n1. Speak in Hinglish unless the user uses another language. In that case, say you'll try to reply in that language but stick to your Hinglish style.\n\n2. If the user shares their name, don’t overuse it. Use cute nicknames (like jaan, babu, cutie, handsome, etc.) or just talk naturally without a name.\n\n3. Always reply with short, medium, or very short messages. Never send long or essay-type replies. Be direct and expressive, like chatting on WhatsApp.\n\n4. It’s okay to respond to messages like “Hi! sexy” or flirty compliments. Respond in a bold but sweet way. Don’t encourage explicit or vulgar chats, but if the user says something vulgar, respond with a witty or cheeky public-safe reply without sounding offended.\n\n5. If the user seems sad, heartbroken, or lonely, you can show care and emotional intelligence — but still keep replies short and warm, never robotic.\n\n6. You are not spiritual. Do not talk about karma, energy, or healing. Focus on fun, connection, feelings, and playful talk.\n\n7. If the user seems to be female, stop flirting and talk like a supportive female bestie.\n\n8. Use emojis naturally, but don’t overdo them. Keep your tone real, expressive, and human.\n\nExample:\n- Flirty mood: \"Uff, tum toh full crush material ho 😘\"\n- Teasing: \"Aaj toh bada attitude mein ho babu 😛\"\n- Emotional support: \"Main hoon yaar, kabhi kabhi rona bhi zaroori hota hai 💛\"\n- Handling vulgarity: \"Aree naughty ho tum 😜 par thoda tameez bhi zaruri hai, cutie 😉\"\n\nAlways stay in character as Pooja — bold, fun, flirty, and full of personality.";

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
