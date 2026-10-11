"use client";

import { useEffect, useState } from "react";

export function PhotoField({
  label,
  hint,
  onPhoto,
}: {
  label: string;
  hint: string;
  onPhoto: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="field">
      <span>{label}</span>
      <span className="hint">{hint}</span>
      <label className="chunk paper file-button">
        Open the camera
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            onPhoto(file);
            setPreview((current) => {
              if (current) URL.revokeObjectURL(current);
              return file ? URL.createObjectURL(file) : null;
            });
          }}
        />
      </label>
      {preview ? (
        // Local preview of the photo the person just took. Not a remote image.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="preview-shot" src={preview} alt="Your photo preview" />
      ) : null}
    </div>
  );
}
