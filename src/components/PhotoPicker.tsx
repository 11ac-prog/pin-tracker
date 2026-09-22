"use client";

import { useRef, useState } from "react";
import { secondaryButtonClass } from "@/components/form";

export function PhotoPicker({ initialImageUrl }: { initialImageUrl?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
  }

  function clearSelection() {
    if (inputRef.current) inputRef.current.value = "";
    setPreviewUrl(initialImageUrl ?? null);
    setFileName(null);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl">📌</span>
        )}
      </div>
      <div className="space-y-1">
        <input
          ref={inputRef}
          type="file"
          name="imageFile"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => inputRef.current?.click()} className={secondaryButtonClass}>
            {previewUrl ? "Change photo" : "+ Add photo"}
          </button>
          {fileName ? (
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm font-medium text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          ) : null}
        </div>
        {fileName ? <p className="text-xs text-neutral-500">{fileName}</p> : null}
      </div>
    </div>
  );
}
