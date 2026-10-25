"use client";

import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PasswordResetRequestForm() {
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
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/cuenta/cambiar-clave")}`,
        },
      );
      if (resetError) throw resetError;
      setMessage("Si existe una cuenta para ese correo, recibirás instrucciones para restablecer la contraseña.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo solicitar el restablecimiento.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="reset-email">Correo electrónico</label>
        <input
          autoComplete="email"
          id="reset-email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="button" disabled={sending} type="submit">
        {sending ? "Enviando…" : "Enviar instrucciones"}
      </button>
    </form>
  );
}
