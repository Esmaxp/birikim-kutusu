import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState, buttonVariants } from "@/components/ui";
export default function NotFound() { return <main className="mx-auto max-w-xl p-6"><EmptyState icon={SearchX} title="Sayfa bulunamadı" description="Bağlantı değişmiş olabilir. Ana sayfadan devam edebilirsiniz." action={<Link href="/" className={buttonVariants()}>Ana sayfaya dön</Link>} /></main>; }
