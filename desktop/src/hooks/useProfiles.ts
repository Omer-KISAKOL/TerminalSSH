import { useCallback, useEffect, useState } from 'react'

import type { PublicServerProfile, SaveProfileRequest } from '@shared/contracts/profile'

import { getLastConnectedProfileId } from '@/lib/connection-form'

type UseProfilesResult = {
  profiles: PublicServerProfile[]
  lastConnectedProfileId: string | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  save: (input: SaveProfileRequest) => Promise<PublicServerProfile>
  remove: (id: string) => Promise<void>
}

export function useProfiles(): UseProfilesResult {
  const [profiles, setProfiles] = useState<PublicServerProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const list = await window.desktopApi.profiles.list()
      setProfiles(list)
      setError(null)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Profiller yüklenemedi.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = useCallback(
    async (input: SaveProfileRequest) => {
      const profile = await window.desktopApi.profiles.save(input)
      await refresh()
      return profile
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await window.desktopApi.profiles.remove(id)
      await refresh()
    },
    [refresh],
  )

  return {
    profiles,
    lastConnectedProfileId: getLastConnectedProfileId(profiles),
    isLoading,
    error,
    refresh,
    save,
    remove,
  }
}
