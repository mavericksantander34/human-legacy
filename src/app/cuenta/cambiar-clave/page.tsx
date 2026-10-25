import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SetupNotice } from "@/components/setup-notice";
import { UpdatePasswordForm } from "@/components/update-password-form";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export const metadata = { title: "Elegir nueva contraseña" };

export default function ChangePasswordPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />;

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="form-page">
        <section className="form-card">
          <p className="eyebrow">Recuperar acceso</p>
          <h1>Elige una contraseña nueva</h1>
          <p>Usa al menos 8 caracteres y confirma la contraseña antes de guardarla.</p>
          <UpdatePasswordForm />
          <p className="field-hint" style={{ marginTop: 22 }}>
            <Link className="text-link" href="/recuperar-clave">
              Solicitar otro enlace
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
