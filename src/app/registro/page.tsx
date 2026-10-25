import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SignUpForm } from "@/components/sign-up-form";
import { SetupNotice } from "@/components/setup-notice";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { safeInternalPath } from "@/lib/safe-internal-path";

type SignUpPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  if (!hasSupabaseConfig()) return <SetupNotice />;
  const params = await searchParams;
  const nextPath = safeInternalPath(params.next);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="form-page">
        <section className="form-card">
          <p className="eyebrow">Comienza tu espacio</p>
          <h1>Crear cuenta</h1>
          <p>
            Regístrate con tu correo y una contraseña. Te enviaremos un correo
            para confirmar la dirección antes de iniciar sesión.
          </p>
          <SignUpForm nextPath={nextPath} />
          <p className="field-hint" style={{ marginTop: 22 }}>
            Al crear una cuenta confirmas que tienes autorización para compartir
            el contenido que agregues.{" "}
            <Link className="text-link" href="/">Volver al inicio</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
