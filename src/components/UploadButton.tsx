"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Accepted file types for the picker (PDF, image, Word doc).
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.docx";

export default function UploadButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Upload failed.");

      router.push(`/document/${json.documentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setUploading(false);
    } finally {
      // Reset so the same file can be re-selected if needed.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="self-start rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {uploading ? "Uploading…" : "+ Upload a document"}
      </button>

      {error && (
        <p className="rounded-xl border border-tile-red-border bg-tile-red px-4 py-3 text-base">
          {error}
        </p>
      )}
    </div>
  );
}
