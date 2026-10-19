"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import type { MessageNotifications as NotificationData } from "@/lib/message-notifications";
import { Button } from "./ui";

export default function MessageNotifications({ onUnreadChange }: { onUnreadChange: (count: number) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationData>({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    let stopped = false;
    let fetching = false;
    let initialized = false;
    let seen = new Set<string>();
    let controller: AbortController | undefined;
    async function refresh() {
      if (stopped || document.hidden || fetching) return;
      fetching = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 15000);
      try {
        const response = await fetch("/api/messages/notifications", { cache: "no-store", signal: controller.signal });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setData({ total: 0, items: [] }); onUnreadChange(0);
            throw new Error("Oturumunuzu kontrol edip yeniden giriş yapın.");
          }
          throw new Error("Bildirimler yüklenemedi. Lütfen tekrar deneyin.");
        }
        const result: NotificationData = await response.json();
        if (stopped) return;
        if (initialized) {
          const fresh = result.items.filter((item) => !seen.has(item.messageId));
          if (fresh.length) {
            const item = fresh[0];
            toast.info(fresh.length === 1 ? `${item.name} yeni bir mesaj gönderdi.` : "Yeni mesajlarınız var.", {
              id: "incoming-messages",
              style: { color: "#1e3a8a" },
              action: { label: "Görüşmeyi aç", onClick: () => router.push(item.href) },
            });
          }
        }
        initialized = true;
        seen = new Set(result.items.map((item) => item.messageId));
        setData(result);
        onUnreadChange(result.total);
        setError("");
      } catch (error) {
        if (!stopped) setError(error instanceof Error && error.name !== "AbortError" ? error.message : "Bildirimler yüklenemedi. Yeniden deneyin.");
      } finally {
        clearTimeout(timeout);
        fetching = false;
        if (!stopped) setLoading(false);
      }
    }
    const refreshNow = () => void refresh();
    refreshRef.current = refreshNow;
    refreshNow();
    const timer = setInterval(refreshNow, 4000);
    const visible = () => { if (!document.hidden) refreshNow(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", refreshNow);
    window.addEventListener("bk:messages-changed", refreshNow);
    return () => {
      stopped = true; controller?.abort(); clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("focus", refreshNow);
      window.removeEventListener("bk:messages-changed", refreshNow);
    };
  }, [onUnreadChange, router]);

  return <Dialog.Root open={open} onOpenChange={(value) => { setOpen(value); if (value) refreshRef.current(); }}>
    <Dialog.Trigger asChild>
      <Button variant="ghost" className="relative shrink-0" aria-label={`Bildirimler${data.total ? `, ${data.total} okunmamış mesaj` : ""}`}>
        <Bell size={20} aria-hidden /><span className="hidden md:inline">Bildirimler</span>
        {data.total > 0 && <span aria-hidden className="rounded-full bg-birikim px-1.5 text-xs text-white">{data.total > 99 ? "99+" : data.total}</span>}
        {error && <span aria-label="Bildirim bağlantısı kesildi" className="text-amber-700">!</span>}
      </Button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/20" />
      <Dialog.Content className="fixed right-3 top-20 z-[60] w-[calc(100%-1.5rem)] max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <Dialog.Title className="font-semibold">Bildirimler</Dialog.Title>
          <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Bildirimleri kapat"><X size={18} /></Button></Dialog.Close>
        </div>
        <Dialog.Description className="px-4 pt-3 text-sm text-slate-600">Okunmamış mesajlarınız. Okumak ve yanıtlamak için bir görüşme seçin.</Dialog.Description>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {error ? <div role="alert" className="p-2 text-sm text-red-700">{error}<Button variant="ghost" onClick={() => refreshRef.current()}>Yeniden dene</Button></div>
            : loading ? <p role="status" className="p-4 text-sm">Bildirimler yükleniyor…</p>
              : !data.items.length ? <p className="p-4 text-sm text-slate-600">Okunmamış mesajınız yok.</p>
                : <ul className="space-y-2">{data.items.map((item) => <li key={item.id}>
                  <Link href={item.href} onClick={() => setOpen(false)} className="block rounded-lg border border-slate-200 p-3 hover:bg-birikim-50">
                    <span className="flex justify-between gap-2 text-sm font-semibold">{item.name}<span className="text-birikim">{item.unread}</span></span>
                    <span className="mt-1 block text-xs text-slate-600">{item.studentName} · {new Date(item.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="mt-1 block truncate text-sm text-slate-700">{item.preview}</span>
                  </Link>
                </li>)}</ul>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
