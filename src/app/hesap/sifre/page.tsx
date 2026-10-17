import { requireUser } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import PasswordForm from "./PasswordForm";
import { logoutAction } from "@/app/login/actions";
export default async function PasswordPage() {
  const user = await requireUser(undefined, true);
  return <AuthShell><h1 className="text-xl font-bold mb-4">Şifremi değiştir</h1>{user.mustChangePassword && <p className="mb-4 text-sm">Devam etmek için geçici şifrenizi değiştirin.</p>}<PasswordForm /><form action={logoutAction}><button className="mt-4 text-sm underline">Çıkış yap</button></form></AuthShell>;
}
