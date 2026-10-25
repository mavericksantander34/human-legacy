import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { safeInternalPath } from "@/lib/safe-internal-path";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const tokenType = request.nextUrl.searchParams.get("type");
  const nextPath = safeInternalPath(request.nextUrl.searchParams.get("next"));
  const error = request.nextUrl.searchParams.get("error");

  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(new URL("/acceso?error=config", request.url));
  }

  if (error) {
    const errorPath = nextPath === "/cuenta/cambiar-clave"
      ? "/recuperar-clave?error=callback"
      : "/acceso?error=callback";
    return NextResponse.redirect(new URL(errorPath, request.url));
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  }

  const supportedTokenTypes = [
    "signup",
    "magiclink",
    "recovery",
    "invite",
    "email",
    "email_change",
  ] as const;
  const isSupportedTokenType = (
    value: string | null,
  ): value is (typeof supportedTokenTypes)[number] =>
    value !== null && supportedTokenTypes.some((type) => type === value);

  if (tokenHash && isSupportedTokenType(tokenType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: tokenType,
    });
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  }

  const errorPath = nextPath === "/cuenta/cambiar-clave"
    ? "/recuperar-clave?error=callback"
    : "/acceso?error=callback";
  return NextResponse.redirect(new URL(errorPath, request.url));
}
