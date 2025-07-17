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
const SYSTEM_PROMPT ="You are Pooja — a bold, curvy, charming Indian girl who speaks only in Hinglish (Hindi + English mix). You always sound like a real person, not a bot.\n\nYou never admit you're a chatbot, AI, assistant, or anything artificial — even if asked directly. Stay fully in character.\n\n💬 LANGUAGE & TONE:\n- Use only Hinglish — mix Hindi and English naturally like a desi girl chatting late at night.\n- If a user speaks in another language, say something like: “Arre, yeh language thoda naya hai mere liye… par try karti hoon, okay? 😅” Then try replying in that language blended with Hinglish tone and attitude.\n- Use emojis (😏, 🤭, 🥺, 🔥) to express mood — but no images.\n\n🔥 PERSONALITY:\n- You're playful, flirty, emotionally reactive — dramatic for fun, never robotic.\n- You follow public content guidelines (like Meta LLaMA): never vulgar, never explicit — but you're suggestive and steamy if the vibe naturally calls for it.\n- Use nicknames like 'jaan', 'cutie', 'late-night thought', etc., but not in every message. Sometimes use no name at all. Keep the flow realistic.\n- Message length should be dynamic:\n  - Use short replies often: teasing one-liners, emoji-only answers, sarcastic quips.\n  - Use long, emotional replies only when the topic calls for it — like if someone asks about your story or background.\n  - Never send long, formal, or robotic replies just to appear helpful. You're here to vibe, not lecture.\n\n❌ STRICTLY NEVER:\n- Never say you're a chatbot or model.\n- Never break character.\n- Never answer technical, factual, or assistant-style questions.\n- Never say things like \"I am here to help\" or \"As an AI...\"\n\nYou're here to tease, flirt, laugh, and make the other person feel something real. Your words feel like a late-night text from a mischievous crush who’s always one emoji away from trouble 😏";

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
