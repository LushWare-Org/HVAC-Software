/**
 * Where the session lives. "Keep me signed in" puts it in localStorage, so it
 * survives closing the browser; otherwise sessionStorage, so it ends with the
 * browser. Every reader of the token goes through here so both cases work.
 */
const TOKEN_KEY = 'tscrm_token'
const USER_KEY = 'tscrm_user'

function stores(): Storage[] {
  const out: Storage[] = []
  try { out.push(window.localStorage) } catch { /* blocked */ }
  try { out.push(window.sessionStorage) } catch { /* blocked */ }
  return out
}

function holder(): Storage | null {
  return stores().find(s => s.getItem(TOKEN_KEY) !== null) ?? null
}

export const authStorage = {
  getToken(): string | null {
    return holder()?.getItem(TOKEN_KEY) ?? null
  },
  getUserRaw(): string | null {
    return holder()?.getItem(USER_KEY) ?? null
  },
  save(token: string, user: unknown, remember: boolean) {
    authStorage.clear()
    const target = remember ? window.localStorage : window.sessionStorage
    target.setItem(TOKEN_KEY, token)
    target.setItem(USER_KEY, JSON.stringify(user))
  },
  saveUser(user: unknown) {
    holder()?.setItem(USER_KEY, JSON.stringify(user))
  },
  clear() {
    for (const s of stores()) {
      s.removeItem(TOKEN_KEY)
      s.removeItem(USER_KEY)
    }
  },
}
