import { useQuery } from '@tanstack/react-query'
import { farmApi } from '../api/farmApi'
import type { Farm } from '../types/farm'

/**
 * Resolves the current farm owner's active farm, cached under a shared
 * query key so every farm-console page can reuse the same lookup.
 */
export function useMyFarm() {
  const query = useQuery({
    queryKey: ['farm', 'my'],
    queryFn: farmApi.myFarms,
  })

  const farms = query.data ?? []
  const farm: Farm | undefined = farms[0]

  return {
    ...query,
    farm,
    farmId: farm?.id,
  }
}
