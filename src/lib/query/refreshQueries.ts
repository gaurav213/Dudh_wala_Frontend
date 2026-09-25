import type { QueryClient } from '@tanstack/react-query'

/** Invalidate and wait so action UIs refresh before the next tap. */
export async function refreshQueries(
  queryClient: QueryClient,
  queryKeys: ReadonlyArray<ReadonlyArray<string>>,
) {
  await Promise.all(
    queryKeys.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [...queryKey] }),
    ),
  )
}
