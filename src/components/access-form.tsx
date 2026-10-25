"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AccessForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");

    try {
      const { error: authError } = await createClient().auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        if (authError.message === "Invalid login credentials") {
          throw new Error("El correo o la contraseña no son correctos.");
        }
        throw authError;
      }
      window.location.assign(nextPath);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar sesión.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input
          autoComplete="email"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input
          autoComplete="current-password"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" disabled={sending} type="submit">
        {sending ? "Iniciando sesión…" : "Iniciar sesión"}
      </button>
      <p className="field-hint" style={{ marginTop: 18 }}>
        <Link className="text-link" href="/recuperar-clave">¿Olvidaste tu contraseña?</Link>
      </p>
      <p className="field-hint" style={{ marginTop: 12 }}>
        ¿Aún no tienes cuenta?{" "}
        <Link
          className="text-link"
          href={`/registro?next=${encodeURIComponent(nextPath)}`}
        >
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
