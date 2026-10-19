import { requireUser } from "@/lib/auth";
import MessageInbox, { type InboxSearchParams } from "@/components/MessageInbox";

export default async function ParentMessagesPage({ searchParams }: { searchParams: Promise<InboxSearchParams> }) {
  await requireUser(["PARENT"]);
  return <MessageInbox kind="VELI" searchParams={await searchParams} />;
}
