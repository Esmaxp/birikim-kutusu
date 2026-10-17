"use client";
import { useRef, useState } from "react";
import { ConfirmDialog } from "./feedback";
/** Keeps the original form action and submitter intact after confirmation. */
export function ActionGuard({ children, operations }: { children: React.ReactNode; operations: string[] }) {
  const bypass = useRef(false);
  const [submission, setSubmission] = useState<{ form: HTMLFormElement; button: HTMLButtonElement | HTMLInputElement | null } | null>(null);
  return <><div onSubmitCapture={(event) => {
    if (bypass.current) { bypass.current = false; return; }
    const form = event.target as HTMLFormElement;
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | HTMLInputElement | null;
    const operation = button?.name === "operation" ? button.value : new FormData(form).get("operation");
    if (operations.includes(String(operation))) { event.preventDefault(); setSubmission({ form, button }); }
  }}>{children}</div><ConfirmDialog open={!!submission} onOpenChange={(open) => { if (!open) setSubmission(null); }} title="Bu değişikliği onaylıyor musunuz?" description="Bu işlem hesabın erişimini veya mevcut davet kodlarını etkileyebilir. Devam etmeden önce seçiminizi kontrol edin." onConfirm={() => {
    if (!submission) return;
    bypass.current = true;
    submission.form.requestSubmit(submission.button);
    setSubmission(null);
  }} /></>;
}
