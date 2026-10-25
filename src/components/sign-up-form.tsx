"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSending(true);
    try {
      const origin = window.location.origin;
      const { data, error: authError } = await createClient().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (authError) throw authError;
      if (data.session) {
        window.location.assign(nextPath);
        return;
      }
      setMessage("Cuenta creada. Confirma tu correo con el enlace que te enviamos para poder iniciar sesión.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear la cuenta.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="signup-email">Correo electrónico</label>
        <input
          autoComplete="email"
          id="signup-email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div className="field">
        <label htmlFor="signup-password">Contraseña</label>
        <input
          autoComplete="new-password"
          id="signup-password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <span className="field-hint">Usa al menos 8 caracteres.</span>
      </div>
      <div className="field">
        <label htmlFor="confirm-password">Confirmar contraseña</label>
        <input
          autoComplete="new-password"
          id="confirm-password"
          minLength={8}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="button" disabled={sending} type="submit">
        {sending ? "Creando cuenta…" : "Crear cuenta"}
      </button>
      <p className="field-hint" style={{ marginTop: 18 }}>
        ¿Ya tienes cuenta?{" "}
        <Link
          className="text-link"
          href={`/acceso?next=${encodeURIComponent(nextPath)}`}
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
