type AuthErrorDetails = {
  code?: unknown;
  message?: unknown;
  status?: unknown;
};

export function authErrorMessage(
  cause: unknown,
  fallback: string,
): string {
  if (typeof cause === "object" && cause !== null) {
    const error = cause as AuthErrorDetails;
    const code = typeof error.code === "string" ? error.code : "";
    const message = typeof error.message === "string" ? error.message : "";
    const status = typeof error.status === "number" ? error.status : 0;

    if (
      status === 429 ||
      code.includes("rate_limit") ||
      /email rate limit|too many requests|rate limit/i.test(message)
    ) {
      return "Supabase limitó temporalmente los correos de confirmación. No solicites más enlaces ahora; espera un rato e inténtalo una sola vez. Para pruebas frecuentes, configura un proveedor SMTP propio en Supabase Auth.";
    }

    if (message) return message;
  }

  return fallback;
}
