/**
 * FastAPI ML service base URL.
 * Local: http://localhost:8000
 * Convex Cloud calling a public ML URL: `npx convex env set ML_SERVICE_URL https://...`
 */
export function mlServiceBaseUrl(): string {
  const env = (
    globalThis as unknown as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;
  const raw = env?.ML_SERVICE_URL;
  const base = (raw && raw.length > 0 ? raw : "http://localhost:8000").replace(
    /\/$/,
    ""
  );
  return base;
}
