"use client";

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
import { KITAP_DURUMLARI, RED, RED_DARK, formatDate } from "@/lib/constants";

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
  Planlandı: "bg-slate-50 text-slate-500 border-slate-200",
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
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />
      {value ? (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2 text-[12px] text-slate-600 truncate">
            {icon} {fileName ?? "Yüklendi"}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-slate-300 hover:text-red-500 shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 text-[12px] text-slate-500 border-2 border-dashed border-slate-200 rounded-lg py-2.5 hover:bg-slate-50 disabled:opacity-60"
        >
          {icon} {busy ? "Yükleniyor..." : label}
        </button>
      )}
      {error && <div className="text-[11px] text-red-600 mt-1">{error}</div>}
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
        setKitapFormAcik(false);
        setCoverUrl(null);
        setFileUrl(null);
        setFileName(null);
      } catch (e) {
        setHata(e instanceof Error ? e.message : "Kitap eklenemedi.");
      }
    });
  };

  const sozEkle = (fd: FormData) => {
    setHata("");
    startTransition(async () => {
      try {
        await addQuote(fd);
        setSozFormAcik(false);
      } catch (e) {
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
            <div className="text-[11px] text-slate-400 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Sekmeler */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-6 text-[13px]">
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
                  (active ? "font-semibold" : "border-transparent text-slate-400")
                }
                style={active ? { borderColor: RED, color: RED } : undefined}
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
            className="flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg mb-2"
            style={{
              background:
                (tab === "kitap" ? kitapFormAcik : sozFormAcik) ? RED_DARK : RED,
            }}
          >
            <Plus size={13} /> {tab === "kitap" ? "Kitap Yükle" : "Söz Ekle"}
          </button>
        )}
      </div>

      {hata && (
        <div className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
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
                <input
                  required
                  name="title"
                  placeholder="Kitap adı *"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-300"
                />
                <input
                  name="author"
                  placeholder="Yazar"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-300"
                />
                <select
                  name="status"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
                >
                  {KITAP_DURUMLARI.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <input
                  name="pages"
                  type="number"
                  min={0}
                  placeholder="Sayfa sayısı"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                />
                <select
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

              <textarea
                name="review"
                rows={2}
                placeholder="Kitap hakkındaki düşüncelerim..."
                className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none resize-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UploadField
                  label="Kapak görseli yükle"
                  accept="image/*"
                  icon={<ImagePlus size={14} style={{ color: RED }} />}
                  value={coverUrl}
                  fileName={coverUrl ? "Kapak yüklendi" : null}
                  onUploaded={(url) => setCoverUrl(url)}
                  onClear={() => setCoverUrl(null)}
                />
                <UploadField
                  label="Kitap dosyası yükle (PDF/EPUB)"
                  accept="application/pdf,application/epub+zip"
                  icon={<Upload size={14} style={{ color: RED }} />}
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
                  className="text-white text-[13px] font-medium px-4 py-2 rounded-lg disabled:opacity-60"
                  style={{ background: RED }}
                >
                  {pending ? "Kaydediliyor..." : "Kitabı Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => setKitapFormAcik(false)}
                  className="text-[13px] text-slate-500 px-4 py-2 rounded-lg border border-slate-200"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          )}

          {books.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <BookOpen size={30} className="mx-auto mb-3 text-slate-300" />
              <div className="text-[14px] font-semibold text-slate-600">
                Rafın henüz boş
              </div>
              <p className="text-[12px] text-slate-400 mt-1">
                {readOnly
                  ? "Henüz kitap eklenmemiş."
                  : "İlk kitabını eklemek için “Kitap Yükle”ye dokun."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col"
                >
                  <div className="flex gap-3 p-3">
                    {b.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="w-16 h-24 object-cover rounded-md shrink-0 bg-slate-100"
                      />
                    ) : (
                      <div className="w-16 h-24 rounded-md shrink-0 flex items-center justify-center bg-slate-50 border border-slate-100">
                        <BookOpen size={20} className="text-slate-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-slate-700 leading-tight">
                        {b.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mb-1.5">
                        {b.author ?? "Yazar belirtilmemiş"}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span
                          className={
                            "inline-block text-[10px] px-2 py-0.5 rounded-full border " +
                            (DURUM_RENK[b.status] ?? DURUM_RENK.Planlandı)
                          }
                        >
                          {b.status}
                        </span>
                        {b.addedByTeacher && (
                          <span
                            className="inline-block text-[9px] text-white px-1.5 py-0.5 rounded-full"
                            style={{ background: RED }}
                          >
                            Öğretmen ekledi
                          </span>
                        )}
                      </div>
                      {b.rating ? (
                        <div className="flex items-center gap-0.5 mt-1.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={11}
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
                    <p className="text-[11px] text-slate-500 px-3 pb-2 line-clamp-3">
                      {b.review}
                    </p>
                  )}

                  <div className="mt-auto border-t border-slate-100 px-3 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 min-w-0">
                      {b.pages ? <span>{b.pages} sf.</span> : null}
                      {b.quoteCount > 0 && (
                        <span className="flex items-center gap-0.5">
                          <QuoteIcon size={10} /> {b.quoteCount}
                        </span>
                      )}
                      {b.fileUrl && (
                        <a
                          href={b.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-0.5 hover:underline"
                          style={{ color: RED }}
                        >
                          <FileText size={10} /> Dosya
                        </a>
                      )}
                    </div>

                    {!readOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                        <form action={updateBookStatus.bind(null, b.id)}>
                          <select
                            name="status"
                            defaultValue={b.status}
                            onChange={(e) => e.currentTarget.form?.requestSubmit()}
                            className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-white"
                          >
                            {KITAP_DURUMLARI.map((d) => (
                              <option key={d}>{d}</option>
                            ))}
                          </select>
                        </form>
                        <form action={deleteBook.bind(null, b.id)}>
                          <button
                            className="text-slate-300 hover:text-red-500"
                            title="Kitabı sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        </form>
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

              <textarea
                required
                name="text"
                rows={3}
                placeholder="Sözü buraya yaz..."
                className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none resize-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  name="source"
                  placeholder="Kim söyledi / kaynak"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                />
                <select
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
                <input
                  name="pageNo"
                  type="number"
                  min={0}
                  placeholder="Sayfa no"
                  className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-[12px] text-slate-500">
                <input type="checkbox" name="favorite" className="accent-[#c1272d]" />
                Favorilerime ekle
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="text-white text-[13px] font-medium px-4 py-2 rounded-lg disabled:opacity-60"
                  style={{ background: RED }}
                >
                  {pending ? "Kaydediliyor..." : "Sözü Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => setSozFormAcik(false)}
                  className="text-[13px] text-slate-500 px-4 py-2 rounded-lg border border-slate-200"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          )}

          {quotes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <QuoteIcon size={30} className="mx-auto mb-3 text-slate-300" />
              <div className="text-[14px] font-semibold text-slate-600">
                Henüz kayıtlı söz yok
              </div>
              <p className="text-[12px] text-slate-400 mt-1">
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
                  className="bg-white rounded-xl border border-slate-200 p-4 relative"
                  style={
                    q.favorite
                      ? { borderColor: RED, boxShadow: `0 0 0 1px ${RED}22` }
                      : undefined
                  }
                >
                  <QuoteIcon
                    size={18}
                    className="mb-2 opacity-40"
                    style={{ color: RED }}
                  />
                  <p className="text-[13px] text-slate-700 leading-relaxed italic">
                    “{q.text}”
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-400 min-w-0 truncate">
                      {q.source ?? q.bookTitle ?? "Kaynak belirtilmemiş"}
                      {q.pageNo ? ` · s.${q.pageNo}` : ""}
                      {" · "}
                      {formatDate(q.createdAt)}
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                        <form action={toggleQuoteFavorite.bind(null, q.id)}>
                          <button
                            title={q.favorite ? "Favoriden çıkar" : "Favorilere ekle"}
                            className={
                              q.favorite
                                ? "text-red-500"
                                : "text-slate-300 hover:text-red-400"
                            }
                          >
                            <Heart
                              size={13}
                              className={q.favorite ? "fill-red-500" : ""}
                            />
                          </button>
                        </form>
                        <form action={deleteQuote.bind(null, q.id)}>
                          <button className="text-slate-300 hover:text-red-500">
                            <Trash2 size={13} />
                          </button>
                        </form>
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
