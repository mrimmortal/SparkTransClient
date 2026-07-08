import { DomainProfile } from "../../lib/api";

export type DomainProfileFormDraft = {
  initialPrompt: string;
  realtimePrompt: string;
  hotwordsText: string;
};

export const NEW_DOMAIN_PROFILE_NAME = "new_profile";

export function buildAvailableProfileNames({
  domainProfiles,
  activeProfile,
  editingName,
}: {
  domainProfiles: string[];
  activeProfile: string;
  editingName: string;
}): string[] {
  const names = new Set(domainProfiles);
  if (activeProfile) names.add(activeProfile);
  if (editingName) names.add(editingName);
  return Array.from(names).sort((left, right) => left.localeCompare(right));
}

export function createNewDomainProfileDraft(existingNames: string[] = []): { name: string; draft: DomainProfileFormDraft } {
  const existing = new Set(existingNames);
  let name = NEW_DOMAIN_PROFILE_NAME;
  let index = 2;
  while (existing.has(name)) {
    name = `${NEW_DOMAIN_PROFILE_NAME}_${index}`;
    index += 1;
  }

  return {
    name,
    draft: domainProfileToDraft(undefined),
  };
}

export function getNextProfileNameAfterDelete({
  domainProfiles,
  activeProfile,
}: {
  domainProfiles: string[];
  activeProfile: string;
}): string {
  if (domainProfiles.includes(activeProfile)) return activeProfile;
  return domainProfiles[0] || "general";
}

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
