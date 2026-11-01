"use client";

import { useState } from "react";
import { prepareImage, type PreparedImage } from "@/lib/admin-image";

export function PhotoPicker({
  id,
  label,
  current,
  onChange,
}: {
  id: string;
  label: string;
  current?: string;
  onChange: (image: PreparedImage | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [focus, setFocus] = useState(20);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function prepare(nextFile: File, nextFocus: number) {
    try {
      const image = await prepareImage(nextFile, nextFocus);
      setPreview(image.preview);
      setError("");
      onChange(image);
    } catch {
      setError("This photo couldn't be read. Try a JPG or PNG.");
      onChange(null);
    }
  }

  const shown = preview ?? current;

  return (
    <div className="flex gap-3">
      {shown && (
        // Previews aren't deployed files, so next/image can't size them.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="" className="aspect-[3/4] w-20 shrink-0 rounded object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="label">
          {label}
        </label>
        <input
          id={id}
          type="file"
          accept="image/*"
          className="w-full text-base"
          onChange={(event) => {
            const chosen = event.target.files?.[0] ?? null;
            setFile(chosen);
            if (chosen) void prepare(chosen, focus);
          }}
        />
        {file && (
          <div className="mt-2">
            <label htmlFor={`${id}-focus`} className="text-sm text-muted">
              Move the crop
            </label>
            <input
              id={`${id}-focus`}
              type="range"
              min={0}
              max={100}
              value={focus}
              onChange={(event) => {
                const value = Number(event.target.value);
                setFocus(value);
                void prepare(file, value);
              }}
              className="block w-full accent-mocha"
            />
          </div>
        )}
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    </div>
  );
}
