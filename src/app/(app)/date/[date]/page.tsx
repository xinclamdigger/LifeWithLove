"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ImagePlus, Camera } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImageCard, type ImageData } from "@/components/images/ImageCard";
import { ImageLightbox } from "@/components/images/ImageLightbox";
import { toast } from "sonner";

export default function DateDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedUserId = searchParams.get("user");
  const isOwner = !sharedUserId;

  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<ImageData | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const formattedDate = (() => {
    try {
      return format(parseISO(date), "EEEE, MMMM d, yyyy");
    } catch {
      return date;
    }
  })();

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userParam = sharedUserId ? `&userId=${sharedUserId}` : "";
    fetch(`/api/images?date=${date}${userParam}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: ImageData[]) => setImages(data))
      .catch((err) => {
        if (err.name !== "AbortError") setImages([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [date, sharedUserId]);

  const handleDelete = async (imageId: string) => {
    const res = await fetch(`/api/images/${imageId}`, { method: "DELETE" });
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image deleted");
    } else {
      toast.error("Failed to delete image");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">{formattedDate}</h1>
        </div>
        {isOwner && (
          <Link href={`/upload?date=${date}`}>
            <Button variant="outline" size="sm">
              <ImagePlus />
              Add Photo
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <Camera className="h-7 w-7 text-rose-400" />
          </div>
          <p className="text-base font-semibold">No moments yet</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            {isOwner
              ? "This day is waiting for its story. Upload a photo to capture the moment."
              : "No photos have been shared for this date yet."}
          </p>
          {isOwner && (
            <Link href={`/upload?date=${date}`} className="mt-5">
              <Button size="sm" className="bg-rose-500 hover:bg-rose-600">
                <Camera className="mr-1.5 h-4 w-4" />
                Capture This Moment
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onView={() => setLightboxImage(image)}
              onDelete={handleDelete}
              isOwner={isOwner}
            />
          ))}
        </div>
      )}

      <ImageLightbox
        image={lightboxImage}
        open={!!lightboxImage}
        onOpenChange={(open) => {
          if (!open) setLightboxImage(null);
        }}
      />
    </div>
  );
}
