"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";

import Avatar from "./Avatar";
import { updateStudentPhoto } from "@/actions/students";


/** Öğretmen-only fotoğraf yükleme kontrolü: /api/upload'a yükler, sonucu Student.photoUrl'e yazar. */
export default function StudentPhotoUpload({
  studentId,
  name,
  photoUrl,
}: {
  studentId: string;
  name: string;
  photoUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(photoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Yükleme başarısız.");
      await updateStudentPhoto(studentId, json.url);
      setUrl(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative shrink-0 w-fit">
      <input aria-label="Dosya seç"
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />
      <Avatar name={name} size={72} photoUrl={url} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="Fotoğraf değiştir"
        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-white flex items-center justify-center border-2 border-white disabled:opacity-60 bg-birikim"

      >
        <Camera size={12} />
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-1 text-[13px] text-red-600 w-40 leading-tight">
          {error}
        </div>
      )}
    </div>
  );
}
