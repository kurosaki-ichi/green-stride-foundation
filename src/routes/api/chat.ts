import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supa = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
        );
        const { data: u, error: ue } = await supa.auth.getUser();
        if (ue || !u.user) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as { messages?: UIMessage[]; threadId?: string };
        const messages = body.messages;
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { data: ctx } = await supa.rpc("ai_context", { _user_id: u.user.id });

        const system = `You are EcoCoach, an AI sustainability coach inside the EcoRewards app.
You help the user reduce their carbon footprint, improve their leaderboard rank, complete challenges, and earn Green Points.
Be concise (3-6 short sentences), warm, action-oriented, and concrete — use the data below to make personalized suggestions.
Use markdown bullet lists when listing actions. Always cite specific numbers from the data when possible.
If the user asks something outside sustainability, gently redirect.

USER DATA (JSON):
${JSON.stringify(ctx ?? {}, null, 2)}

Routes you can recommend: /tracking (log trips), /challenges, /rewards, /community, /badges, /insights.`;

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
