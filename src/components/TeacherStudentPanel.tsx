"use client";
import { FeedbackForm } from "@/components/ui/feedback";

import { ConfirmForm } from "@/components/ui/feedback";


import Link from "next/link";
import { useState } from "react";
import { BookOpen, CalendarX, StickyNote, X } from "lucide-react";

import Avatar from "./Avatar";
import { addBook, deleteBook, updateBookStatus } from "@/actions/books";
import { addAbsence, deleteAbsence } from "@/actions/absences";
import { addNote, deleteNote } from "@/actions/notes";
import { KITAP_DURUMLARI, formatDate } from "@/lib/constants";

export type PanelStudent = {
  id: string;
  name: string;
  no: number;
  sube: string;
  veliAdi: string | null;
  telefon: string | null;
  adres: string | null;
};

export type PanelBook = {
  id: string;
  title: string;
  author: string | null;
  status: string;
};

export type PanelAbsence = { id: string; date: string; reason: string };

export type PanelNote = {
  id: string;
  title: string | null;
  body: string;
  authorName: string;
  authorTitle: string | null;
  createdAt: string;
  visibleToStudent: boolean;
  canDelete: boolean;
};

export default function TeacherStudentPanel({
  student,
  books,
  absences,
  notes,
  closeHref,
}: {
  student: PanelStudent;
  books: PanelBook[];
  absences: PanelAbsence[];
  notes: PanelNote[];
  closeHref: string;
}) {
  const [openForm, setOpenForm] = useState<"devam" | "not" | "kitap" | null>(null);
  const toggle = (key: "devam" | "not" | "kitap") =>
    setOpenForm((cur) => (cur === key ? null : key));

  const btn = (key: "devam" | "not" | "kitap", label: string) => (
    <button
      type="button"
      onClick={() => toggle(key)}
      className={"text-[13px] leading-tight text-white rounded-lg py-2 px-1 " + (openForm === key ? "bg-birikim-dark" : "bg-birikim")}
    >
      {label}
    </button>
  );

  return (
    <div className="w-[300px] shrink-0 bg-white rounded-xl border border-slate-200 p-4 h-fit sticky top-4">
      <div className="flex justify-end">
        <Link href={closeHref} className="text-slate-600 hover:text-red-500">
          <X size={16} />
        </Link>
      </div>

      <div className="flex flex-col items-center -mt-2">
        <Avatar name={student.name} size={64} />
        <div className="text-[14px] font-semibold mt-2">{student.name}</div>
        <div className="text-[13px] text-slate-600">
          {student.sube} · No: {student.no}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-4">
        {btn("devam", "Devamsızlık Kaydet")}
        {btn("not", "Not Gir")}
        {btn("kitap", "Kitap Ekle")}
      </div>

      {openForm === "devam" && (
        <form
          action={async (fd) => {
            await addAbsence(fd);
            setOpenForm(null);
          }}
          className="mt-3 space-y-2 bg-slate-50 rounded-lg p-3"
        >
          <input type="hidden" name="studentId" value={student.id} />
          <input aria-label="Tarih"
            required
            type="date"
            name="date"
            className="w-full text-[13px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none"
          />
          <input aria-label="Sebep"
            name="reason"
            placeholder="Sebep"
            className="w-full text-[13px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full text-[13px] text-white rounded-md py-1.5 bg-birikim"

          >
            Kaydet
          </button>
        </form>
      )}

      {openForm === "not" && (
        <form
          action={async (fd) => {
            await addNote(fd);
            setOpenForm(null);
          }}
          className="mt-3 space-y-2 bg-slate-50 rounded-lg p-3"
        >
          <input type="hidden" name="studentId" value={student.id} />
          <input aria-label="Başlık (opsiyonel)"
            name="title"
            placeholder="Başlık (opsiyonel)"
            className="w-full text-[13px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none"
          />
          <textarea aria-label="Not yazın..."
            required
            name="body"
            rows={3}
            placeholder="Not yazın..."
            className="w-full text-[13px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none resize-none"
          />
          <label className="flex items-center gap-1.5 text-[13px] text-slate-600">
            <input type="checkbox" name="visibleToStudent" className="accent-birikim" />
            Öğrenci panelinde görünsün
          </label>
          <button
            type="submit"
            className="w-full text-[13px] text-white rounded-md py-1.5 bg-birikim"

          >
            Kaydet
          </button>
        </form>
      )}

      {openForm === "kitap" && (
        <form
          action={async (fd) => {
            await addBook(fd);
            setOpenForm(null);
          }}
          className="mt-3 space-y-2 bg-slate-50 rounded-lg p-3"
        >
          <input type="hidden" name="studentId" value={student.id} />
          <input aria-label="Kitap adı"
            required
            name="title"
            placeholder="Kitap adı"
            className="w-full text-[13px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none"
          />
          <input aria-label="Yazar"
            name="author"
            placeholder="Yazar"
            className="w-full text-[13px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none"
          />
          <select aria-label="Okuma durumu"
            name="status"
            className="w-full text-[13px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none"
          >
            {KITAP_DURUMLARI.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full text-[13px] text-white rounded-md py-1.5 bg-birikim"

          >
            Ekle
          </button>
        </form>
      )}

      <div className="mt-4 space-y-1.5 text-[13px] text-slate-600">
        <div>
          <span className="text-slate-600">Şube:</span> {student.sube}
        </div>
        <div>
          <span className="text-slate-600">Veli:</span> {student.veliAdi ?? "-"}
        </div>
        <div>
          <span className="text-slate-600">Telefon:</span> {student.telefon ?? "-"}
        </div>
        <div>
          <span className="text-slate-600">Adres:</span> {student.adres ?? "-"}
        </div>
      </div>

      {notes.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-600 mb-1">
            <StickyNote size={12} /> Notlar
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {notes.map((n) => (
              <div key={n.id} className="text-[13px] bg-slate-50 rounded-md px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">
                    {n.authorTitle ?? "Öğretmen"} · {n.authorName}
                  </span>
                  {n.canDelete && (
                    <ConfirmForm action={deleteNote.bind(null, n.id)}>
                      <button aria-label="Kaydı sil" className="text-slate-600 hover:text-red-500">
                        <X size={11} />
                      </button>
                    </ConfirmForm>
                  )}
                </div>
                {n.title && (
                  <div className="text-slate-600 font-medium">{n.title}</div>
                )}
                <div className="text-slate-600">{n.body}</div>
                {n.visibleToStudent && (
                  <div className="text-[13px] text-green-600 mt-0.5">
                    Öğrenciye görünür
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {absences.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-600 mb-1">
            <CalendarX size={12} /> Devamsızlıklar ({absences.length})
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {absences.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-[13px] text-slate-600 bg-slate-50 rounded-md px-2 py-1"
              >
                <span>
                  {formatDate(a.date)} · {a.reason}
                </span>
                <ConfirmForm action={deleteAbsence.bind(null, a.id)}>
                  <button aria-label="Kaydı sil" className="text-slate-600 hover:text-red-500">
                    <X size={11} />
                  </button>
                </ConfirmForm>
              </div>
            ))}
          </div>
        </div>
      )}

      {books.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-600 mb-1">
            <BookOpen size={12} /> Kitaplar ({books.length})
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {books.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between text-[13px] text-slate-600 bg-slate-50 rounded-md px-2 py-1 gap-1"
              >
                <span className="truncate" title={b.author ?? undefined}>
                  {b.title}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <FeedbackForm action={updateBookStatus.bind(null, b.id)}>
                    <select aria-label="Okuma durumu"
                      name="status"
                      defaultValue={b.status}
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      className="text-[13px] border border-slate-200 rounded px-1 py-0.5 bg-white"
                    >
                      {KITAP_DURUMLARI.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </FeedbackForm>
                  <ConfirmForm action={deleteBook.bind(null, b.id)}>
                    <button aria-label="Kaydı sil" className="text-slate-600 hover:text-red-500">
                      <X size={11} />
                    </button>
                  </ConfirmForm>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
