
import { parseUploadUrl } from "@/lib/upload-url";
import { initialsOf } from "@/lib/constants";

export default function Avatar({
  name,
  size = 40,
  photoUrl,
}: {
  name: string;
  size?: number;
  photoUrl?: string | null;
}) {
  if (parseUploadUrl(photoUrl, "image")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={parseUploadUrl(photoUrl, "image") ?? undefined}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-birikim-900 bg-birikim-100 font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.34) }}
      aria-hidden
    >
      {initialsOf(name)}
    </div>
  );
}
