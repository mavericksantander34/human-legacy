const INTERNAL_ORIGIN = "https://human-legacy.invalid";

export function safeInternalPath(
  path: string | null | undefined,
  fallback = "/cuenta",
) {
  if (!path?.startsWith("/")) return fallback;

  try {
    const url = new URL(path, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
