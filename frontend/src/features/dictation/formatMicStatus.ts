export function formatMicStatus(status: string): string {
  if (status === "capturing") return "Capturing";
  if (status === "starting") return "Starting";
  if (status === "error") return "Needs attention";
  return "Not capturing";
}
