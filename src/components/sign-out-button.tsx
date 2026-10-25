"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function signOut() {
    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) {
        setError(`No se pudo cerrar la sesión: ${signOutError.message}`);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cerrar la sesión.");
    }
  }

  return (
    <div>
      <button className="text-link" onClick={signOut} type="button">
        <LogOut aria-hidden="true" size={15} />
        Cerrar sesión
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
