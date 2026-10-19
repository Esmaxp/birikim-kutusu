import { requireUser } from "@/lib/auth";
import MessageInbox, { type InboxSearchParams } from "@/components/MessageInbox";

export default async function StudentMessagesPage({ searchParams }: { searchParams: Promise<InboxSearchParams> }) {
  await requireUser(["STUDENT"]);
  return <MessageInbox kind="OGRENCI" searchParams={await searchParams} />;
}
