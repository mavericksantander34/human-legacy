import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Human Legacy — historias que siguen con nosotros",
    template: "%s | Human Legacy",
  },
  description:
    "Crea un memorial digital para compartir historias, fotografías y recuerdos mediante un código QR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
