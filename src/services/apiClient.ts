/**
 * Base API Client for OmniDoctor Backend Services
 */

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMessage = `API Error (${res.status}): ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch {
        // use status text fallback
      }
      throw new Error(errorMessage);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    console.error(`[API Request Failed] ${url}:`, err);
    throw err;
  }
}
