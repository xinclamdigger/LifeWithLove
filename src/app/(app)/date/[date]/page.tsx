"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ImagePlus } from "lucide-react";
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImagePlus className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm font-medium">No photos for this date</p>
          {isOwner && (
            <>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a photo to capture this moment
              </p>
              <Link href={`/upload?date=${date}`} className="mt-4">
                <Button size="sm">
                  <ImagePlus />
                  Upload Photo
                </Button>
              </Link>
            </>
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
