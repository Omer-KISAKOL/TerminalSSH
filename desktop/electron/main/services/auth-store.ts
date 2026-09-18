import Store from 'electron-store'

import type { AuthSession, AuthUser } from '@shared/contracts/auth'

import { assertCanStoreSecrets, decryptSecret, encryptSecret } from './secret-store'

interface StoredSession {
  accessToken: string
  encryptedRefreshToken: string
  user: AuthUser
}

interface AuthStoreSchema {
  session: StoredSession | null
}

export class AuthStore {
  private readonly store = new Store<AuthStoreSchema>({
    name: 'terminalssh-auth',
    defaults: {
      session: null,
    },
  })

  getSession(): AuthSession | null {
    const stored = this.store.get('session')

    if (!stored) {
      return null
    }

    return {
      accessToken: stored.accessToken,
      refreshToken: decryptSecret(stored.encryptedRefreshToken),
      user: stored.user,
    }
  }

  setSession(session: AuthSession): void {
    assertCanStoreSecrets()

    this.store.set('session', {
      accessToken: session.accessToken,
      encryptedRefreshToken: encryptSecret(session.refreshToken),
      user: session.user,
    })
  }

  clearSession(): void {
    this.store.set('session', null)
  }

  isAuthenticated(): boolean {
    return Boolean(this.getSession())
  }

  getUser(): AuthUser | null {
    return this.getSession()?.user ?? null
  }
}

export const authStore = new AuthStore()
