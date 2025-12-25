export type ApiError = {
  message: string;
};

export async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const message = `API ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}
