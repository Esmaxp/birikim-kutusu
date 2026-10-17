"use client";
import { FeedbackForm } from "@/components/ui/feedback";

import { toast } from "sonner";
import { ConfirmForm } from "@/components/ui/feedback";


import { parseUploadUrl } from "@/lib/upload-url";

import { useRef, useState, useTransition } from "react";
import {
  BookOpen,
  FileText,
  Heart,
  ImagePlus,
  Plus,
  Quote as QuoteIcon,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  addBook,
  addQuote,
  deleteBook,
  deleteQuote,
  toggleQuoteFavorite,
  updateBookStatus,
} from "@/actions/books";
import { KITAP_DURUMLARI, formatDate } from "@/lib/constants";

export type CornerBook = {
  id: string;
  title: string;
  author: string | null;
  status: string;
  pages: number | null;
  rating: number | null;
  review: string | null;
  coverUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  quoteCount: number;
  addedByTeacher: boolean;
};

export type CornerQuote = {
  id: string;
  text: string;
  source: string | null;
  pageNo: number | null;
  favorite: boolean;
  bookTitle: string | null;
  createdAt: string;
};

const DURUM_RENK: Record<string, string> = {
  Okundu: "bg-green-50 text-green-700 border-green-200",
  Okunuyor: "bg-amber-50 text-amber-700 border-amber-200",
  Planlandı: "bg-slate-50 text-slate-600 border-slate-200",
};

/** Dosya yükleme kutusu — /api/upload'a POST atar, dönen URL'yi form alanına yazar. */
function UploadField({
  label,
  accept,
  icon,
  value,
  fileName,
  onUploaded,
  onClear,
}: {
  label: string;
  accept: string;
  icon: React.ReactNode;
  value: string | null;
  fileName: string | null;
  onUploaded: (url: string, name: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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
      onUploaded(json.url, json.name);
    } catch (e) {
        toast.error(e instanceof Error ? e.message : "İşlem tamamlanamadı.");
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input aria-label="Dosya seç"
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />
      {value ? (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2 text-[13px] text-slate-600 truncate">
            {icon} {fileName ?? "Yüklendi"}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-slate-600 hover:text-red-500 shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 text-[13px] text-slate-600 border-2 border-dashed border-slate-200 rounded-lg py-2.5 hover:bg-slate-50 disabled:opacity-60"
        >
          {icon} {busy ? "Yükleniyor..." : label}
        </button>
      )}
      {error && <div className="text-[13px] text-red-600 mt-1">{error}</div>}
    </div>
  );
}

export default function BookCorner({
  studentId,
  books,
  quotes,
  readOnly = false,
}: {
  studentId: string;
  books: CornerBook[];
  quotes: CornerQuote[];
  readOnly?: boolean;
}) {
  const [tab, setTab] = useState<"kitap" | "soz">("kitap");
  const [kitapFormAcik, setKitapFormAcik] = useState(false);
  const [sozFormAcik, setSozFormAcik] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [pending, startTransition] = useTransition();

  const okunan = books.filter((b) => b.status === "Okundu").length;
  const sayfaToplam = books
    .filter((b) => b.status === "Okundu")
    .reduce((s, b) => s + (b.pages ?? 0), 0);

  const kitapEkle = (fd: FormData) => {
    setHata("");
    startTransition(async () => {
      try {
        await addBook(fd);
                  toast.success("Kitap eklendi.");
        setKitapFormAcik(false);
        setCoverUrl(null);
        setFileUrl(null);
        setFileName(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "İşlem tamamlanamadı.");
        setHata(e instanceof Error ? e.message : "Kitap eklenemedi.");
      }
    });
  };

  const sozEkle = (fd: FormData) => {
    setHata("");
    startTransition(async () => {
      try {
        await addQuote(fd);
                  toast.success("Söz eklendi.");
        setSozFormAcik(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "İşlem tamamlanamadı.");
        setHata(e instanceof Error ? e.message : "Söz kaydedilemedi.");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Özet kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Toplam Kitap", value: books.length },
          { label: "Okunan", value: okunan },
          { label: "Okunan Sayfa", value: sayfaToplam },
          { label: "Kayıtlı Söz", value: quotes.length },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="text-[22px] font-bold text-slate-800 leading-none">
              {k.value}
            </div>
            <div className="text-[13px] text-slate-600 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Sekmeler */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
        <div className="flex gap-4 text-[13px]">
          {[
            { key: "kitap" as const, label: "Kitaplarım", icon: BookOpen },
            { key: "soz" as const, label: "Beğendiğim Sözler", icon: QuoteIcon },
          ].map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={
                  "flex items-center gap-1.5 py-3 border-b-2 " +
                  (active ? "font-semibold border-birikim text-birikim" : "border-transparent text-slate-600")
                }
                aria-pressed={active}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() =>
              tab === "kitap"
                ? setKitapFormAcik((v) => !v)
                : setSozFormAcik((v) => !v)
            }
            className="flex items-center gap-1.5 text-white text-[13px] font-medium px-3 py-1.5 rounded-lg mb-2 bg-birikim hover:bg-birikim-700"
            aria-expanded={tab === "kitap" ? kitapFormAcik : sozFormAcik}
          >
            <Plus size={13} /> {tab === "kitap" ? "Kitap Yükle" : "Söz Ekle"}
          </button>
        )}
      </div>

      {hata && (
        <div className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {hata}
        </div>
      )}

      {/* ---------------------------------------------------------- KİTAPLAR */}
      {tab === "kitap" && (
        <>
          {!readOnly && kitapFormAcik && (
            <form
              action={kitapEkle}
              className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
            >
              <div className="text-[13px] font-semibold text-slate-700">
                Yeni Kitap
              </div>
              <input type="hidden" name="studentId" value={studentId} />
              <input type="hidden" name="coverUrl" value={coverUrl ?? ""} />
              <input type="hidden" name="fileUrl" value={fileUrl ?? ""} />
              <input type="hidden" name="fileName" value={fileName ?? ""} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input aria-label="Kitap adı *"
                  required
                  name="title"
                  placeholder="Kitap adı *"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-300"
                />
                <input aria-label="Yazar"
                  name="author"
                  placeholder="Yazar"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-300"
                />
                <select aria-label="Okuma durumu"
                  name="status"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
                >
                  {KITAP_DURUMLARI.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <input aria-label="Sayfa sayısı"
                  name="pages"
                  type="number"
                  min={0}
                  placeholder="Sayfa sayısı"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                />
                <select aria-label="Puan"
                  name="rating"
                  defaultValue=""
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
                >
                  <option value="">Puanım (opsiyonel)</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)}
                    </option>
                  ))}
                </select>
              </div>

              <textarea aria-label="Kitap hakkındaki düşüncelerim..."
                name="review"
                rows={2}
                placeholder="Kitap hakkındaki düşüncelerim..."
                className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none resize-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UploadField
                  label="Kapak görseli yükle"
                  accept="image/*"
                  icon={<ImagePlus size={14}  className="text-birikim" />}
                  value={coverUrl}
                  fileName={coverUrl ? "Kapak yüklendi" : null}
                  onUploaded={(url) => setCoverUrl(url)}
                  onClear={() => setCoverUrl(null)}
                />
                <UploadField
                  label="Kitap dosyası yükle (PDF/EPUB)"
                  accept="application/pdf,application/epub+zip"
                  icon={<Upload size={14}  className="text-birikim" />}
                  value={fileUrl}
                  fileName={fileName}
                  onUploaded={(url, name) => {
                    setFileUrl(url);
                    setFileName(name);
                  }}
                  onClear={() => {
                    setFileUrl(null);
                    setFileName(null);
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="text-white text-[13px] font-medium px-4 py-2 rounded-lg disabled:opacity-60 bg-birikim"

                >
                  {pending ? "Kaydediliyor..." : "Kitabı Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => setKitapFormAcik(false)}
                  className="text-[13px] text-slate-600 px-4 py-2 rounded-lg border border-slate-200"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          )}

          {books.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <BookOpen size={30} className="mx-auto mb-3 text-slate-600" />
              <div className="text-[14px] font-semibold text-slate-600">
                Rafın henüz boş
              </div>
              <p className="text-[13px] text-slate-600 mt-1">
                {readOnly
                  ? "Henüz kitap eklenmemiş."
                  : "İlk kitabını eklemek için “Kitap Yükle”ye dokun."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {books.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col"
                >
                  <div className="flex flex-col gap-3 p-4">
                    {parseUploadUrl(b.coverUrl, "image") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={parseUploadUrl(b.coverUrl, "image") ?? undefined}
                        alt={b.title}
                        className="h-52 w-full object-contain rounded-lg bg-slate-50 p-2"
                      />
                    ) : (
                      <div className="h-52 w-full rounded-lg flex flex-col gap-3 items-center justify-center bg-gradient-to-br from-birikim-50 to-birikim-100 border border-birikim-200 p-6 text-center">
                        <BookOpen size={32} className="text-birikim" /><span className="font-semibold text-birikim-900">{b.title}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-slate-700 leading-tight">
                        {b.title}
                      </div>
                      <div className="text-[13px] text-slate-600 mb-1.5">
                        {b.author ?? "Yazar belirtilmemiş"}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span
                          className={
                            "inline-block text-[13px] px-2 py-0.5 rounded-full border " +
                            (DURUM_RENK[b.status] ?? DURUM_RENK.Planlandı)
                          }
                        >
                          {b.status}
                        </span>
                        {b.addedByTeacher && (
                          <span
                            className="inline-block text-[13px] text-white px-1.5 py-0.5 rounded-full bg-birikim"

                          >
                            Öğretmen ekledi
                          </span>
                        )}
                      </div>
                      {b.rating ? (
                        <div className="flex items-center gap-0.5 mt-1.5" role="img" aria-label={`${b.rating} / 5 yıldız`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={
                                i < (b.rating ?? 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {b.review && (
                    <p className="text-[13px] text-slate-600 px-3 pb-2 line-clamp-3">
                      {b.review}
                    </p>
                  )}

                  <div className="mt-auto border-t border-slate-100 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[13px] text-slate-600 min-w-0">
                      {b.pages ? <span>{b.pages} sf.</span> : null}
                      {b.quoteCount > 0 && (
                        <span className="flex items-center gap-0.5">
                          <QuoteIcon size={10} /> {b.quoteCount}
                        </span>
                      )}
                      {parseUploadUrl(b.fileUrl, "document") && (
                        <a
                          href={parseUploadUrl(b.fileUrl, "document") ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 hover:underline text-birikim"

                        >
                          <FileText size={10} /> Dosya
                        </a>
                      )}
                    </div>

                    {!readOnly && (
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
                          <button
                            className="text-slate-600 hover:text-red-500"
                            title="Kitabı sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        </ConfirmForm>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------------ SÖZLER */}
      {tab === "soz" && (
        <>
          {!readOnly && sozFormAcik && (
            <form
              action={sozEkle}
              className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
            >
              <div className="text-[13px] font-semibold text-slate-700">
                Beğendiğim Söz
              </div>
              <input type="hidden" name="studentId" value={studentId} />

              <textarea aria-label="Sözü buraya yaz..."
                required
                name="text"
                rows={3}
                placeholder="Sözü buraya yaz..."
                className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none resize-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input aria-label="Kim söyledi / kaynak"
                  name="source"
                  placeholder="Kim söyledi / kaynak"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                />
                <select aria-label="Kitap"
                  name="bookId"
                  defaultValue=""
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
                >
                  <option value="">Kitap seç (opsiyonel)</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
                <input aria-label="Sayfa no"
                  name="pageNo"
                  type="number"
                  min={0}
                  placeholder="Sayfa no"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-[13px] text-slate-600">
                <input type="checkbox" name="favorite" className="accent-birikim" />
                Favorilerime ekle
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="text-white text-[13px] font-medium px-4 py-2 rounded-lg disabled:opacity-60 bg-birikim"

                >
                  {pending ? "Kaydediliyor..." : "Sözü Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => setSozFormAcik(false)}
                  className="text-[13px] text-slate-600 px-4 py-2 rounded-lg border border-slate-200"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          )}

          {quotes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <QuoteIcon size={30} className="mx-auto mb-3 text-slate-600" />
              <div className="text-[14px] font-semibold text-slate-600">
                Henüz kayıtlı söz yok
              </div>
              <p className="text-[13px] text-slate-600 mt-1">
                {readOnly
                  ? "Henüz söz kaydedilmemiş."
                  : "Okurken beğendiğin cümleleri buraya kaydedebilirsin."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className={"bg-white rounded-xl border p-5 relative " + (q.favorite ? "border-birikim ring-1 ring-birikim-100" : "border-slate-200")}
                >
                  <QuoteIcon
                    size={28}
                    className="mb-3 text-birikim-300"

                  />
                  <p className="text-[13px] text-slate-700 leading-relaxed italic">
                    “{q.text}”
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <div className="text-[13px] text-slate-600 min-w-0 truncate">
                      {q.source ?? q.bookTitle ?? "Kaynak belirtilmemiş"}
                      {q.pageNo ? ` · s.${q.pageNo}` : ""}
                      {" · "}
                      {formatDate(q.createdAt)}
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                        <FeedbackForm action={toggleQuoteFavorite.bind(null, q.id)}>
                          <button
                            title={q.favorite ? "Favoriden çıkar" : "Favorilere ekle"}
                            className={
                              q.favorite
                                ? "text-red-500"
                                : "text-slate-600 hover:text-red-400"
                            }
                          >
                            <Heart
                              size={13}
                              className={q.favorite ? "fill-red-500" : ""}
                            />
                          </button>
                        </FeedbackForm>
                        <ConfirmForm action={deleteQuote.bind(null, q.id)}>
                          <button aria-label="Kaydı sil" className="text-slate-600 hover:text-red-500">
                            <Trash2 size={13} />
                          </button>
                        </ConfirmForm>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
