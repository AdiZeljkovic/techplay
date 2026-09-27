// Optional AI-assisted actions. Growth OS works fully without them; nothing
// here runs unless ANTHROPIC_API_KEY is configured AND an implementation is
// added. The registry exists so the UI and API shape are settled.

export interface AssistAction {
  id: string;
  label: string;
  description: string;
  input: "copy" | "campaign" | "article-url";
}

export const ASSIST_ACTIONS: AssistAction[] = [
  { id: "alt-facebook", label: "Alternative Facebook copy", description: "Three variants of a post in TechPlay's voice (no hype, no invented numbers).", input: "copy" },
  { id: "reel-script", label: "Reel script", description: "0–2s hook / 2–7s context / 7–15s information / 15–25s payoff / CTA from a post or article.", input: "copy" },
  { id: "campaign-brief", label: "Campaign brief", description: "Creative brief in the 29-CREATIVE-BRIEFS format from a campaign record.", input: "campaign" },
  { id: "repurpose", label: "Repurpose article", description: "Article → social post, carousel, vertical script, X thread, Discord post, newsletter blurb (18-VIDEO workflow).", input: "article-url" },
];

export function assistConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Implementation point. When added: call the model server-side only, pass the
 * spine's banned-phrase list and fact rules as system context, and return drafts
 * for a human to edit. Never auto-post.
 */
export async function runAssist(): Promise<never> {
  throw new Error("AI assist is not implemented. Growth OS does not require it.");
}
