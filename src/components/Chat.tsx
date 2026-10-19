"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadChatMessages, sendChatMessage } from "@/actions/messages";
import type { ChatMessage } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

function dateLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Bugün";
  if (date.toDateString() === yesterday.toDateString()) return "Dün";
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function Chat(props: { conversationId: string; title: string }) {
  return <ChatSession key={props.conversationId} {...props} />;
}

function ChatSession({ conversationId, title }: { conversationId: string; title: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [me, setMe] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const scrollArea = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const forceScroll = useRef(true);
  const mounted = useRef(false);
  const sending = useRef(false);
  const fetching = useRef(false);
  const revision = useRef(0);

  const refresh = useCallback(async () => {
    if (document.hidden || fetching.current || sending.current) return;
    fetching.current = true;
    const requestedRevision = revision.current;
    try {
      const result = await loadChatMessages(conversationId);
      if (!mounted.current || requestedRevision !== revision.current) return;
      if (!result.ok) { setError(result.error); setMe(""); return; }
      setMe(result.me);
      setMessages(result.messages);
      setError("");
      if (result.markedCount > 0) {
        window.dispatchEvent(new Event("bk:messages-changed"));
        router.refresh();
      }
    } catch {
      if (mounted.current) setError("Mesajlar yüklenemedi. Bağlantınızı ve oturumunuzu kontrol edin.");
    } finally {
      fetching.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [conversationId, router]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const timer = setInterval(() => void refresh(), 4000);
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);

  useEffect(() => {
    if (scrollArea.current && (nearBottom.current || forceScroll.current)) {
      scrollArea.current.scrollTop = scrollArea.current.scrollHeight;
      forceScroll.current = false;
    }
  }, [messages]);

  async function submit() {
    const body = text.replace(/\r\n?/g, "\n").trim();
    if (!me || sending.current || !body) return;
    if (body.length > 2000) { setSendError("Mesaj en fazla 2000 karakter olabilir."); return; }
    sending.current = true;
    revision.current++;
    setPending(true);
    setSendError("");
    setText("");
    forceScroll.current = true;
    // This is only a local rendering key, not a security token. Works on HTTP too.
    const temporaryId = `pending-${Date.now()}-${revision.current}`;
    setMessages((current) => [...current, { id: temporaryId, senderId: me, body, createdAt: new Date().toISOString(), readAt: null }]);
    try {
      const result = await sendChatMessage(conversationId, body);
      if (!result.ok) throw new Error(result.error);
      const saved = result.message;
      if (mounted.current) {
        setMessages((current) => current.map((m) => m.id === temporaryId ? saved : m));
        window.dispatchEvent(new Event("bk:messages-changed"));
        router.refresh();
      }
    } catch (error) {
      if (mounted.current) {
        setMessages((current) => current.filter((m) => m.id !== temporaryId));
        setText((current) => current || body);
        setSendError(error instanceof Error ? error.message : "Mesaj gönderilemedi. Bağlantınızı kontrol edip yeniden deneyin.");
      }
    } finally {
      sending.current = false;
      revision.current++;
      if (mounted.current) setPending(false);
    }
  }

  return (
    <section aria-label={title} className="flex h-[70vh] min-h-[360px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <h2 className="border-b bg-white px-4 py-3 font-semibold">{title}</h2>
      <div ref={scrollArea} onScroll={() => {
        const area = scrollArea.current;
        if (area) nearBottom.current = area.scrollHeight - area.scrollTop - area.clientHeight < 100;
      }} role="log" aria-label="Görüşme mesajları" aria-live="polite" aria-busy={loading} tabIndex={0}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
        {loading ? <p role="status" className="text-center text-sm text-slate-600">Mesajlar yükleniyor…</p>
          : !messages.length && <p className="py-8 text-center text-sm text-slate-600">Henüz mesaj yok. İlk mesajı siz gönderin.</p>}
        {messages.map((message, i) => {
          const mine = message.senderId === me;
          const label = dateLabel(message.createdAt);
          const showDate = i === 0 || new Date(messages[i - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();
          return <div key={message.id}>
            {showDate && <p className="mb-3 text-center text-xs text-slate-600">{label}</p>}
            <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl border px-3 py-2 text-sm", mine ? "border-green-200 bg-green-100 text-slate-900" : "border-slate-200 bg-white text-slate-900")}>
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.body}</p>
                <div className="mt-1 flex items-center justify-end gap-2 text-xs text-slate-600">
                  <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</time>
                  {mine && (message.id.startsWith("pending-") ? <span aria-label="Gönderiliyor">…</span>
                    : <span aria-label={message.readAt ? "Okundu" : "Gönderildi"} className={message.readAt ? "font-semibold text-blue-700" : "text-slate-600"}>{message.readAt ? "✓✓" : "✓"}</span>)}
                </div>
              </div>
            </div>
          </div>;
        })}
      </div>
      {(error || sendError) && <div className="border-t bg-white px-4 py-2 text-sm text-red-700">
        <p role="alert">{sendError || error}</p>
        {error && <Button type="button" variant="ghost" onClick={() => void refresh()}>Yeniden bağlan</Button>}
      </div>}
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="flex items-end gap-2 border-t bg-white p-3">
        <textarea aria-label="Mesajınız" placeholder="Mesajınızı yazın…" value={text} maxLength={2000} rows={2}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); } }}
          className="min-w-0 flex-1 resize-none rounded-lg border border-slate-300 p-2 text-base" />
        <Button type="submit" disabled={pending || !me || !text.trim()}>{pending ? "Gönderiliyor…" : "Gönder"}</Button>
      </form>
    </section>
  );
}
