"use client";

import { useEffect } from "react";

import { markNoteRead } from "@/actions/notes";

/** Sayfa açıldığında okunmamış notları "okundu" olarak işaretler. */
export default function MarkNotesRead({ noteIds }: { noteIds: string[] }) {
  useEffect(() => {
    if (!noteIds.length) return;
    const timer = setTimeout(() => {
      noteIds.forEach((id) => {
        void markNoteRead(id);
      });
    }, 1200);
    return () => clearTimeout(timer);
    // noteIds referansı her render'da yeni olduğu için içeriğe göre karşılaştırılır
  }, [noteIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
