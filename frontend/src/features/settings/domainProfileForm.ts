import { DomainProfile } from "../../lib/api";

export type DomainProfileFormDraft = {
  initialPrompt: string;
  realtimePrompt: string;
  hotwordsText: string;
};

export function formatHotwords(hotwords: DomainProfile["hotwords"]): string {
  if (Array.isArray(hotwords)) return hotwords.map((word) => word.trim()).filter(Boolean).join("\n");
  return hotwords?.trim() ?? "";
}

export function domainProfileToDraft(profile: DomainProfile | undefined): DomainProfileFormDraft {
  return {
    initialPrompt: profile?.initial_prompt ?? "",
    realtimePrompt: profile?.initial_prompt_realtime ?? "",
    hotwordsText: formatHotwords(profile?.hotwords),
  };
}

export function buildDomainProfilePayload(draft: DomainProfileFormDraft): DomainProfile {
  const hotwords = draft.hotwordsText
    .split(/[,\n]/)
    .map((word) => word.trim())
    .filter(Boolean);
  return {
    initial_prompt: draft.initialPrompt.trim() || null,
    initial_prompt_realtime: draft.realtimePrompt.trim() || null,
    hotwords: hotwords.length > 0 ? hotwords : null,
  };
}
