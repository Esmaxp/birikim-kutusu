import { redirect } from "next/navigation";

/**
 * Eski giriş noktası. Öğrenci başına tek bir yer olması için
 * (ogretmen/ogrenci/[studentId] — Deneme Analizi sekmesi) buraya yönlendirilir.
 */
export default async function DenemeDuzenlePageRedirect({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  redirect(`/ogretmen/ogrenci/${studentId}?tab=deneme`);
}
