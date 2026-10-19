import { getCurrentUser } from "@/lib/auth";
import { messageNotificationsFor } from "@/lib/message-notifications";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Oturumunuz sona erdi. Lütfen yeniden giriş yapın." }, { status: 401, headers });
  if (user.mustChangePassword || !["TEACHER", "STUDENT", "PARENT"].includes(user.role)) {
    return Response.json({ error: "Bildirimleri görmek için hesabınızı kontrol edin." }, { status: 403, headers });
  }
  try {
    return Response.json(await messageNotificationsFor(user), { headers });
  } catch {
    return Response.json({ error: "Bildirimler yüklenemedi. Lütfen tekrar deneyin." }, { status: 503, headers });
  }
}
