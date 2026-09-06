/** A failed batch must be retried by the supervisor, not spun on in this run. */
export async function runImageBatches(
  runBatch: () => Promise<{ completed: number; failed: number }>,
  drain: boolean,
): Promise<void> {
  do {
    const { completed, failed } = await runBatch();
    if (failed > 0 || completed === 0) return;
  } while (drain);
}
