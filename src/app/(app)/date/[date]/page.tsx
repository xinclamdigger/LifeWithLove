"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ImagePlus, Camera, MapPin, Clock, Pencil, Check, X, Upload } from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageLightbox } from "@/components/images/ImageLightbox";
import type { ImageData } from "@/components/images/ImageCard";
import { cn } from "@/lib/utils";
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

  const fetchImages = useCallback(() => {
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

  useEffect(() => {
    return fetchImages();
  }, [fetchImages]);

  const handleDelete = async (imageId: string) => {
    const res = await fetch(`/api/images/${imageId}`, { method: "DELETE" });
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image deleted");
    } else {
      toast.error("Failed to delete image");
    }
  };

  const handleUpdateCaption = async (imageId: string, description: string) => {
    const res = await fetch(`/api/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    if (res.ok) {
      const updated = await res.json();
      setImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, ...updated } : img))
      );
      toast.success("Caption updated");
    } else {
      toast.error("Failed to update caption");
    }
  };

  const coverImage = images.find((img) => img.isCover);
  const otherImages = images.filter((img) => !img.isCover);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
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
        <DateDetailSkeleton />
      ) : images.length === 0 ? (
        <EmptyDateState isOwner={isOwner} date={date} />
      ) : (
        <>
          {/* Hero cover image */}
          {coverImage && (
            <HeroImage
              image={coverImage}
              onView={() => setLightboxImage(coverImage)}
              onDelete={isOwner ? handleDelete : undefined}
              onUpdateCaption={isOwner ? handleUpdateCaption : undefined}
            />
          )}

          {/* Timeline of other photos */}
          {otherImages.length > 0 && (
            <div className="relative pl-8 border-l-2 border-rose-200/60 space-y-6 ml-4">
              {otherImages.map((image) => (
                <TimelineItem
                  key={image.id}
                  image={image}
                  onView={() => setLightboxImage(image)}
                  onDelete={isOwner ? handleDelete : undefined}
                  onUpdateCaption={isOwner ? handleUpdateCaption : undefined}
                />
              ))}
            </div>
          )}

          {/* Inline upload dropzone */}
          {isOwner && (
            <InlineUploadZone date={date} onUploadComplete={fetchImages} />
          )}
        </>
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

function HeroImage({
  image,
  onView,
  onDelete,
  onUpdateCaption,
}: {
  image: ImageData;
  onView: () => void;
  onDelete?: (id: string) => void;
  onUpdateCaption?: (id: string, desc: string) => void;
}) {
  return (
    <div className="group relative rounded-2xl overflow-hidden">
      <button onClick={onView} className="block w-full cursor-pointer">
        <img
          src={image.url}
          alt={image.description || ""}
          className="w-full max-h-[50vh] object-cover"
        />
      </button>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-5 pt-16">
        <EditableCaption
          imageId={image.id}
          description={image.description}
          onSave={onUpdateCaption}
          className="text-white"
        />
        {image.location && (
          <p className="flex items-center gap-1.5 text-sm text-white/80 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {image.location}
          </p>
        )}
      </div>
      {onDelete && (
        <Button
          variant="destructive"
          size="icon-xs"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      <span className="absolute top-3 left-3 rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-medium text-white">
        Cover
      </span>
    </div>
  );
}

function TimelineItem({
  image,
  onView,
  onDelete,
  onUpdateCaption,
}: {
  image: ImageData;
  onView: () => void;
  onDelete?: (id: string) => void;
  onUpdateCaption?: (id: string, desc: string) => void;
}) {
  const time = (() => {
    try {
      return format(new Date(image.createdAt), "h:mm a");
    } catch {
      return null;
    }
  })();

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div className="absolute -left-[41px] top-3 h-3 w-3 rounded-full bg-rose-400 ring-4 ring-background" />

      <div className="group rounded-xl border bg-card overflow-hidden">
        <button onClick={onView} className="block w-full cursor-pointer">
          <img
            src={image.url}
            alt={image.description || ""}
            className="w-full max-h-80 object-cover transition-transform group-hover:scale-[1.02]"
          />
        </button>
        <div className="p-4 space-y-2">
          <EditableCaption
            imageId={image.id}
            description={image.description}
            onSave={onUpdateCaption}
          />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </span>
            )}
            {image.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {image.location}
              </span>
            )}
          </div>
        </div>
        {onDelete && (
          <Button
            variant="destructive"
            size="icon-xs"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function EditableCaption({
  imageId,
  description,
  onSave,
  className,
}: {
  imageId: string;
  description: string | null;
  onSave?: (id: string, desc: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(description || "");

  if (!onSave) {
    return description ? (
      <p className={cn("text-sm", className)}>{description}</p>
    ) : null;
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a caption..."
          className="h-8 text-sm bg-background/80"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSave(imageId, value);
              setEditing(false);
            }
            if (e.key === "Escape") {
              setValue(description || "");
              setEditing(false);
            }
          }}
        />
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => {
            onSave(imageId, value);
            setEditing(false);
          }}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => {
            setValue(description || "");
            setEditing(false);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={cn(
        "group/caption flex items-center gap-1.5 text-sm text-left cursor-pointer",
        className
      )}
    >
      <span>{description || "Add a caption..."}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover/caption:opacity-60 transition-opacity shrink-0" />
    </button>
  );
}

function InlineUploadZone({
  date,
  onUploadComplete,
}: {
  date: string;
  onUploadComplete: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setUploading(true);

      try {
        const urlRes = await fetch("/api/images/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            date,
          }),
        });
        if (!urlRes.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, r2Key } = await urlRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!uploadRes.ok) throw new Error("Failed to upload image");

        const recordRes = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ r2Key, date }),
        });
        if (!recordRes.ok) throw new Error("Failed to save image record");

        toast.success("Photo added!");
        onUploadComplete();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [date, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".heic"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors text-center",
        isDragActive
          ? "border-rose-400 bg-rose-50"
          : "border-muted-foreground/20 hover:border-rose-300/50 hover:bg-muted/10",
        uploading && "opacity-50 pointer-events-none"
      )}
    >
      <input {...getInputProps()} />
      <Upload className="h-5 w-5 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">
        {uploading
          ? "Uploading..."
          : isDragActive
            ? "Drop to add photo"
            : "Drop a photo here to add to this day"}
      </p>
    </div>
  );
}

function EmptyDateState({ isOwner, date }: { isOwner: boolean; date: string }) {
  return (
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
  );
}

function DateDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-muted/30 animate-pulse h-64" />
      <div className="pl-8 ml-4 space-y-6">
        <div className="rounded-xl bg-muted/30 animate-pulse h-48" />
        <div className="rounded-xl bg-muted/30 animate-pulse h-48" />
      </div>
    </div>
  );
}
