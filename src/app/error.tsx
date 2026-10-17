"use client";
import { AlertTriangle } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="mx-auto max-w-xl p-6"><EmptyState icon={AlertTriangle} title="Sayfa yüklenemedi" description="Geçici bir sorun oluştu. Lütfen yeniden deneyin." action={<Button onClick={reset}>Yeniden dene</Button>} /></main>; }
