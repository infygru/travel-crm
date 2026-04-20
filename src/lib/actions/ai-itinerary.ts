"use server";

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function enhanceDayDescription(
  context: { title?: string; location?: string; description?: string; items?: { type: string; title: string }[] }
): Promise<string> {
  const itemsList = context.items?.length
    ? `Activities/items: ${context.items.map((i) => `${i.type}: ${i.title}`).join(", ")}`
    : "";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are a luxury travel copywriter. Enhance this day description for a travel itinerary. Make it vivid, evocative, and exciting for the traveler. Return ONLY the enhanced description text, no labels or extra formatting.

Day title: ${context.title ?? "Unnamed Day"}
Location: ${context.location ?? "Unknown"}
Current description: ${context.description ?? "No description yet"}
${itemsList}

Write 2-3 sentences that paint a picture of this day for the traveler.`,
      },
    ],
  });

  const text = message.content[0];
  if (text.type !== "text") throw new Error("Unexpected response type");
  return text.text.trim();
}

export async function autoWriteDay(
  context: { destination?: string; theme?: string; dayNumber: number; prompt?: string }
): Promise<{ title: string; description: string; suggestedItems: string[] }> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You are a luxury travel copywriter. Create content for Day ${context.dayNumber} of a travel itinerary.
Destination: ${context.destination ?? "Unknown"}
Trip theme: ${context.theme ?? "General travel"}
Special request: ${context.prompt ?? "None"}

Return a JSON object (no markdown, no code block) with:
- title: a short evocative day title (5-8 words)
- description: 2-3 sentence description of the day
- suggestedItems: array of 3-5 activity/experience names for this day

Example format: {"title":"...","description":"...","suggestedItems":["...","..."]}`,
      },
    ],
  });

  const text = message.content[0];
  if (text.type !== "text") throw new Error("Unexpected response type");

  const parsed = JSON.parse(text.text.trim());
  return {
    title: parsed.title ?? "",
    description: parsed.description ?? "",
    suggestedItems: parsed.suggestedItems ?? [],
  };
}

export async function enhanceItemDescription(
  context: { type: string; title: string; location?: string; duration?: string; description?: string }
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `You are a luxury travel copywriter. Write a compelling 1-2 sentence description for this travel item. Return ONLY the description text.

Type: ${context.type}
Name: ${context.title}
Location: ${context.location ?? ""}
Duration: ${context.duration ?? ""}
Current description: ${context.description ?? "None"}`,
      },
    ],
  });

  const text = message.content[0];
  if (text.type !== "text") throw new Error("Unexpected response type");
  return text.text.trim();
}
