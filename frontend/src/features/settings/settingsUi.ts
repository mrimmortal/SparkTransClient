export type MicrophoneStatusTone = "idle" | "success" | "danger";

export function getMicrophoneStatusTone(status: string): MicrophoneStatusTone {
  const normalized = status.toLowerCase();
  if (normalized.includes("available")) return "success";
  if (normalized.includes("failed") || normalized.includes("denied") || normalized.includes("not supported")) return "danger";
  return "idle";
}
