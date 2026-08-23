"use client";

import { useRef, useState, useTransition } from "react";

import { addNote } from "@/actions/notes";
import { RED } from "@/lib/constants";

export default function RehberlikNoteForm({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");

  const submit = (fd: FormData) => {
    setHata("");
    setMesaj("");
    startTransition(async () => {
      try {
        await addNote(fd);
        formRef.current?.reset();
        setMesaj("Not gönderildi ✓");
        setTimeout(() => setMesaj(""), 2500);
      } catch (e) {
        setHata(e instanceof Error ? e.message : "Not kaydedilemedi.");
      }
    });
  };

  return (
    <form
      ref={formRef}
      action={submit}
      className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
    >
      <div className="text-[13px] font-semibold text-slate-700">
        {studentName} için not yaz
      </div>
      <input type="hidden" name="studentId" value={studentId} />

      <input
        name="title"
        placeholder="Başlık (örn. Sınav kaygısı görüşmesi)"
        className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
      />
      <textarea
        required
        name="body"
        rows={5}
        placeholder="Öğrenciye iletmek istediğin notu yaz..."
        className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none resize-none"
      />

      <label className="flex items-center gap-2 text-[12px] text-slate-500">
        <input
          type="checkbox"
          name="visibleToStudent"
          value="on"
          defaultChecked
          className="accent-[#c1272d]"
        />
        Öğrenci panelinde görünsün
      </label>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="text-white text-[13px] font-medium px-4 py-2 rounded-lg disabled:opacity-60"
          style={{ background: RED }}
        >
          {pending ? "Gönderiliyor..." : "Notu Gönder"}
        </button>
        {mesaj && <span className="text-[12px] text-green-600">{mesaj}</span>}
        {hata && <span className="text-[12px] text-red-600">{hata}</span>}
      </div>
    </form>
  );
}
