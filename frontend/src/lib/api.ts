// One small fetch wrapper used by every API call. It:
// 1. prefixes /api/v1 (Vite proxies /api to FastAPI in development),
// 2. attaches the JWT from localStorage as "Authorization: Bearer <token>",
// 3. sends JSON bodies (or FormData for file uploads) correctly,
// 4. turns FastAPI error responses into a readable ApiError,
// 5. on 401 (expired/invalid token) clears the token and tells the app to log out.

const BASE = '/api/v1'
const TOKEN_KEY = 'mockinterview_token'
export const LOGOUT_EVENT = 'mockinterview:logout'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { json?: unknown; body?: BodyInit }

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options
  const finalHeaders = new Headers(headers)

  const token = tokenStore.get()
  if (token) finalHeaders.set('Authorization', `Bearer ${token}`)

  let body = options.body
  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  }
  // For FormData we must NOT set Content-Type: the browser adds the multipart boundary.

  const response = await fetch(BASE + path, { ...rest, headers: finalHeaders, body })

  if (response.status === 401 && token) {
    tokenStore.clear()
    window.dispatchEvent(new Event(LOGOUT_EVENT))
  }
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

// FastAPI errors look like {"detail": "text"} or, for validation errors,
// {"detail": [{"loc": [...], "msg": "..."}]}. Turn both into one readable string.
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((e: { loc?: unknown[]; msg: string }) => {
          const field = e.loc?.[e.loc.length - 1]
          return field ? `${String(field)}: ${e.msg}` : e.msg
        })
        .join('; ')
    }
  } catch {
    // response wasn't JSON (e.g. proxy error when the backend is down)
  }
  return response.status >= 500
    ? 'Server error. Is the backend running?'
    : `Request failed (${response.status})`
}
