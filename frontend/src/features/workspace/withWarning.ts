export async function withWarning(context: { setWarning: (message: string) => void }, task: () => Promise<void>) {
  context.setWarning("");
  try {
    await task();
  } catch (error) {
    context.setWarning(error instanceof Error ? error.message : "Action failed");
  }
}
