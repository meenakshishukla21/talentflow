type RequestOptions = {
  method?: string
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const config: RequestInit = {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    signal: options.signal
  }

  if (options.body !== undefined) {
    config.body = JSON.stringify(options.body)
  }

  const response = await fetch(url, config)
  if (!response.ok) {
    const text = await response.text()
    try {
      const parsed = JSON.parse(text)
      throw new Error(parsed.message ?? 'Request failed')
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(text || 'Request failed')
      }
      throw error
    }
  }
  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(url: string, options?: Omit<RequestOptions, 'method'>) => request<T>(url, options),
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: 'POST', body }),
  put: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PUT', body }),
  patch: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PATCH', body }),
  del: <T>(url: string) => request<T>(url, { method: 'DELETE' })
}
