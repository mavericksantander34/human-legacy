import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PasswordResetRequestForm } from "@/components/password-reset-request-form";
import { SetupNotice } from "@/components/setup-notice";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type RecoverPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const metadata = { title: "Recuperar contraseña" };

export default async function RecoverPasswordPage({
  searchParams,
}: RecoverPasswordPageProps) {
  if (!hasSupabaseConfig()) return <SetupNotice />;
  const params = await searchParams;

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="form-page">
        <section className="form-card">
          <p className="eyebrow">Recuperar acceso</p>
          <h1>Restablecer contraseña</h1>
          <p>
            Indica el correo de tu cuenta. Si existe, enviaremos un enlace para
            que puedas elegir una contraseña nueva.
          </p>
          {params.error && (
            <p className="form-error" role="alert">
              El enlace no se pudo validar o venció. Solicita uno nuevo e inténtalo otra vez.
            </p>
          )}
          <PasswordResetRequestForm />
          <p className="field-hint" style={{ marginTop: 22 }}>
            <Link className="text-link" href="/acceso">Volver a iniciar sesión</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
