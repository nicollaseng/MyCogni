import { useMediaQuery } from '@/shared/hooks/use-media-query'

export function useWideScreen(): boolean {
  return useMediaQuery('(min-width: 40rem)')
}
