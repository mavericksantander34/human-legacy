"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Memorial, MemorialMedia, Visibility } from "@/lib/types";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
]);

function isVisibility(value: string): value is Visibility {
  return value === "public" || value === "unlisted" || value === "private";
}

function makeSlug(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "memorial"}-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function MemorialForm({
  initial,
  existingMedia = [],
}: {
  initial?: Memorial;
  existingMedia?: MemorialMedia[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birth_date ?? "");
  const [deathDate, setDeathDate] = useState(initial?.death_date ?? "");
  const [story, setStory] = useState(initial?.story ?? "");
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? "unlisted");
  const [sharedFileIndexes, setSharedFileIndexes] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdMemorialId, setCreatedMemorialId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (files.length > MAX_FILES) {
      setError(`Puedes subir hasta ${MAX_FILES} archivos por vez.`);
      return;
    }
    const invalidFile = files.find(
      (file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE,
    );
    if (invalidFile) {
      setError("Usa imágenes JPG, PNG o WebP, videos MP4 o documentos PDF de hasta 50 MB.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError("Tu sesión venció. Vuelve a ingresar para guardar el memorial.");
        return;
      }

      const values = {
        full_name: fullName.trim(),
        birth_date: birthDate || null,
        death_date: deathDate || null,
        story: story.trim() || null,
        visibility,
        updated_at: new Date().toISOString(),
      };

      const result = initial
        ? await supabase.from("memorials").update(values).eq("id", initial.id).select("id, slug").single()
        : await supabase.from("memorials").insert({
            ...values,
            owner_id: userData.user.id,
            slug: makeSlug(fullName),
          }).select("id, slug").single();

      if (result.error || !result.data) {
        setError(result.error?.message ?? "No se pudo guardar el memorial.");
        return;
      }
      const memorialId = result.data.id;
      if (!initial) setCreatedMemorialId(memorialId);

      const uploadErrors: string[] = [];
      for (const [index, file] of files.entries()) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${userData.user.id}/${memorialId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("memorial-media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) {
          uploadErrors.push(`${file.name}: ${uploadError.message}`);
          continue;
        }

        const { error: recordError } = await supabase.from("memorial_media").insert({
          memorial_id: memorialId,
          storage_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          is_public: sharedFileIndexes.includes(index) && visibility !== "private",
        });
        if (recordError) {
          const { error: cleanupError } = await supabase.storage
            .from("memorial-media")
            .remove([path]);
          uploadErrors.push(
            `${file.name}: no se pudo guardar el registro del archivo.${
              cleanupError ? ` El archivo temporal tampoco pudo eliminarse (${cleanupError.message}).` : ""
            }`,
          );
        }
      }

      if (uploadErrors.length > 0) {
        setError(
          `El memorial se guardó, pero algunos archivos no: ${uploadErrors.join(" ")}`,
        );
        return;
      }
      router.push(`/cuenta/${memorialId}?guardado=1`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el memorial.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMedia(media: MemorialMedia) {
    setError("");
    try {
      const supabase = createClient();
      const { error: storageError } = await supabase.storage
        .from("memorial-media")
        .remove([media.storage_path]);
      if (storageError) {
        setError(`No se pudo eliminar ${media.file_name}: ${storageError.message}`);
        return;
      }
      const { error: rowError } = await supabase.from("memorial_media").delete().eq("id", media.id);
      if (rowError) {
        setError(`El archivo se quitó del almacenamiento, pero no del listado: ${rowError.message}`);
        return;
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar el archivo.");
    }
  }

  async function toggleMediaVisibility(media: MemorialMedia) {
    setError("");
    if (!media.is_public && visibility === "private") {
      setError("Cambia primero la visibilidad del memorial para poder compartir este archivo.");
      return;
    }

    try {
      const { error: updateError } = await createClient()
        .from("memorial_media")
        .update({ is_public: !media.is_public })
        .eq("id", media.id);
      if (updateError) {
        setError(`No se pudo actualizar ${media.file_name}: ${updateError.message}`);
        return;
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el archivo.");
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="full-name">Nombre de la persona *</label>
        <input
          autoComplete="name"
          id="full-name"
          maxLength={120}
          onChange={(event) => setFullName(event.target.value)}
          required
          value={fullName}
        />
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="birth-date">Fecha de nacimiento</label>
          <input id="birth-date" onChange={(event) => setBirthDate(event.target.value)} type="date" value={birthDate} />
        </div>
        <div className="field">
          <label htmlFor="death-date">Fecha de fallecimiento</label>
          <input id="death-date" onChange={(event) => setDeathDate(event.target.value)} type="date" value={deathDate} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="story">Su historia</label>
        <textarea
          id="story"
          maxLength={10000}
          onChange={(event) => setStory(event.target.value)}
          placeholder="Comparte una historia, una forma de ser o algo que quieras que otras personas recuerden."
          value={story}
        />
        <span className="field-hint">Puedes actualizarla más adelante.</span>
      </div>

      <div className="field">
        <label htmlFor="visibility">Quién puede ver el memorial</label>
        <select
          id="visibility"
          onChange={(event) => {
            if (!isVisibility(event.target.value)) return;
            setVisibility(event.target.value);
            if (event.target.value === "private") setSharedFileIndexes([]);
          }}
          value={visibility}
        >
          <option value="unlisted">Quien tenga el enlace o el QR</option>
          <option value="public">Público y descubrible</option>
          <option value="private">Solo yo, desde mi cuenta</option>
        </select>
        <span className="field-hint">
          El enlace/QR no listado puede abrirlo cualquiera que lo tenga. No es una clave privada.
        </span>
      </div>

      <div className="field">
        <label htmlFor="files">Fotografías, videos o documentos</label>
        <input
          accept=".jpg,.jpeg,.png,.webp,.mp4,.pdf"
          id="files"
          multiple
          onChange={(event) => {
            setFiles(Array.from(event.target.files ?? []));
            setSharedFileIndexes([]);
          }}
          type="file"
        />
        <span className="field-hint">
          Hasta 10 archivos de 50 MB cada uno. Formatos: JPG, PNG, WebP, MP4 y PDF.
          Los archivos son privados al subirlos.
        </span>
      </div>

      {files.length > 0 && visibility !== "private" && (
        <div className="field">
          <span className="field-label">Decide qué archivos compartir</span>
          <span className="field-hint">
            Cada archivo empieza privado. No compartas documentos con información sensible.
          </span>
          {files.map((file, index) => (
            <label className="checkbox-row" key={`${file.name}-${file.lastModified}-${index}`}>
              <input
                checked={sharedFileIndexes.includes(index)}
                onChange={(event) => {
                  setSharedFileIndexes((current) =>
                    event.target.checked
                      ? [...current, index]
                      : current.filter((sharedIndex) => sharedIndex !== index),
                  );
                }}
                type="checkbox"
              />
              <span>{file.name} · {sharedFileIndexes.includes(index) ? "se mostrará" : "privado"}</span>
            </label>
          ))}
        </div>
      )}

      {existingMedia.length > 0 && (
        <div className="field">
          <span className="field-label">Archivos guardados</span>
          {existingMedia.map((media) => (
            <div className="memorial-row" key={media.id}>
              <span>{media.file_name}</span>
              <div className="row-actions">
                <label className="checkbox-row">
                  <input
                    checked={media.is_public}
                    disabled={!media.is_public && visibility === "private"}
                    onChange={() => void toggleMediaVisibility(media)}
                    type="checkbox"
                  />
                  <span>{media.is_public ? "Compartido" : "Privado"}</span>
                </label>
                <button className="text-link" onClick={() => void removeMedia(media)} type="button">
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      {createdMemorialId && (
        <p className="form-success" role="status">
          El memorial ya existe. <Link className="text-link" href={`/cuenta/${createdMemorialId}`}>Administrarlo y completar los archivos</Link>
        </p>
      )}
      <button className="button" disabled={saving || Boolean(createdMemorialId)} type="submit">
        {saving ? "Guardando…" : createdMemorialId ? "Memorial creado" : initial ? "Guardar cambios" : "Crear memorial"}
      </button>
    </form>
  );
}
