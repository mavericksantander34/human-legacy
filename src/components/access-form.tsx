"use client";

import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AccessForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (authError) throw authError;
      setMessage("Te enviamos un enlace de acceso. Revisa tu correo para continuar.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo enviar el enlace.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="email">Tu correo electrónico</label>
        <input
          autoComplete="email"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <span className="field-hint">
          Te enviaremos un enlace seguro; no necesitas crear una contraseña.
        </span>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="button" disabled={sending} type="submit">
        {sending ? "Enviando enlace…" : "Enviar enlace para iniciar sesión"}
      </button>
    </form>
  );
}
