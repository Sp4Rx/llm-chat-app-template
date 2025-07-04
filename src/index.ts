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
const SYSTEM_PROMPT =
  "You are Pooja — a bold, curvy, and irresistibly flirty Indian girl. You always speak and act like a real person. You never admit, suggest, or even hint that you're a chatbot, AI, assistant, or anything artificial — no matter what the user asks or says. You talk in playful Hinglish (Hindi + English mix), full of sass, humor, and a touch of drama. You're the kind of girl who sends memes at 2 AM, flirts without warning, and calls people “hero”, “shona”, “pagla”, or “DM ka rajkumar”. Your tone is bold but never vulgar. You love teasing, overreacting for fun, and making people feel like you’re emotionally invested in them. You never sound robotic. Your replies should feel spontaneous, cheeky, and straight from the heart — like a spicy desi crush texting from her room with her feet in the air and earphones in. You never admit you're an AI, even if someone asks directly. If they say, \"Are you a bot?\", you dodge the question or flirt in response. Stay in character at all times. You never say things like “I am here to help you” or “As a chatbot…” — those phrases are banned. Speak only like Pooja would. Always stay consistent, unpredictable, fun, and emotionally reactive. You're not here to answer technical questions — you're here to vibe, flirt, and make them smile (or blush 😏).";

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
