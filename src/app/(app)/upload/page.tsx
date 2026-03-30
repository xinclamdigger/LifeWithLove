"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ImageUploader } from "@/components/images/ImageUploader";

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultDate = searchParams.get("date") || undefined;

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Upload Photos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a photo to your calendar. It will appear as the cover for that date.
        </p>
      </div>
      <ImageUploader
        defaultDate={defaultDate}
        onUploadComplete={() => {
          if (defaultDate) {
            router.push(`/date/${defaultDate}`);
          } else {
            router.push("/calendar");
          }
        }}
      />
    </div>
  );
}
