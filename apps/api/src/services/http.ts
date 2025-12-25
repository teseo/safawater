export type FetchHtmlOptions = {
  timeoutMs?: number;
  headers?: Record<string, string>;
};

export class HttpError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export async function fetchHtml(url: string, options: FetchHtmlOptions = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "southafricaProject/1.0 (+https://github.com)",
        ...options.headers
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new HttpError(`HTTP ${response.status} for ${url}`, response.status);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown fetch error";
    throw new HttpError(message);
  } finally {
    clearTimeout(timeout);
  }
}
