/** Read every returned page; never treat an API row cap as a complete roster. */
export async function scoringMetadataPages<T>(
  fetchPage: (
    start: number,
    end: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<{ data: T[]; error: null } | { data: null; error: true }> {
  const rows: T[] = [];
  for (let page = 0; page < 50; page++) {
    const result = await fetchPage(rows.length, rows.length + 199);
    if (result.error || !result.data || result.data.length > 200)
      return { data: null, error: true };
    if (!result.data.length) return { data: rows, error: null };
    rows.push(...result.data);
    if (rows.length > 10000) return { data: null, error: true };
  }
  return { data: null, error: true }; // Pause instead of guessing from truncated metadata.
}
