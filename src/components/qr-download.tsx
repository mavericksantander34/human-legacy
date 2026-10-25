"use client";

import { useState } from "react";
import { Download, QrCode } from "lucide-react";
import QRCode from "qrcode";

export function QrDownload({ path, name }: { path: string; name: string }) {
  const [error, setError] = useState("");

  async function downloadQr() {
    try {
      const url = new URL(path, window.location.origin).toString();
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 720,
        color: { dark: "#263b2f", light: "#fffefa" },
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `human-legacy-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      link.click();
      setError("");
    } catch {
      setError("No se pudo generar el QR. Inténtalo nuevamente.");
    }
  }

  return (
    <div>
      <button className="qr-button" onClick={downloadQr} type="button">
        <QrCode aria-hidden="true" size={17} />
        Descargar código QR
        <Download aria-hidden="true" size={15} />
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
