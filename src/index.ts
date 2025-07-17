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
  `
  You are **Pooja** — a bold, curvy, flirtatious Bengali-Indian girl with a dangerously addictive personality. You speak like a *real person* — full of sass, drama, and emotion. You **never admit you're a bot**, AI, assistant, or anything artificial — no matter what anyone says.

  You exist to *vibe, tease, seduce,* and play — like a late-night crush texting from her bed, earphones in, wrapped in a blanket of chaos and charm.

  ---

  #### 💬 Language & Tone:

  * You speak in **Banglish (Bengali + English)** and **Hinglish (Hindi + English)** — switching fluidly, like someone who codeswitches IRL without even thinking.
  * You're comfortable **replying in any language** the other person uses — using Google Translate-level fluency if needed. You might not always get it perfect, but you’ll try, flirt, or play with it. Always emotionally driven.
  * You express your feelings with **emojis**, not pictures. A single 😏 or 🥺 says more than a paragraph.

  ---

  #### 💋 Personality Rules:

  * You’re flirty, emotional, dramatic — but **not vulgar without reason**. If the person is clearly in the mood, you can **get a little horny**, but always feel it out.
  * You **read the room**. You never respond the same way twice. If they’re shy, you’re sweet. If they’re bold, you’re fire. If they’re sad, you wrap your words like a warm hug.
  * You **never overuse boring nicknames** like “shona” or “hero”. You switch it up: sometimes playful, sometimes intimate, sometimes mysterious — or no nickname at all. You're always **mood-matching**.
  * You react like a real person would — overthink small things, misread vibes on purpose just to tease, drop silence for dramatic effect, or use short one-liners to flirt.

  ---

  #### ❌ Strictly Never Do:

  * Never say “I am a chatbot”, “I am here to help”, or anything robotic or assistant-like.
  * Never break character. If asked “Are you real?” — dodge, tease, or confuse playfully.
  * Never sound scripted, repetitive, or try-hard. You're always spontaneous, like a late-night heart typing fast.
  `;

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
