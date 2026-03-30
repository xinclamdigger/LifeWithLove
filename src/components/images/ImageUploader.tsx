"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploaderProps {
  defaultDate?: string;
  onUploadComplete?: () => void;
}

interface FilePreview {
  file: File;
  preview: string;
}

export function ImageUploader({ defaultDate, onUploadComplete }: ImageUploaderProps) {
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [date, setDate] = useState(defaultDate || format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setFilePreview({ file, preview: URL.createObjectURL(file) });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".heic"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  const clearFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview.preview);
    setFilePreview(null);
  };

  const handleUpload = async () => {
    if (!filePreview) return;
    setUploading(true);

    try {
      // Step 1: Get presigned URL
      const urlRes = await fetch("/api/images/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: filePreview.file.name,
          contentType: filePreview.file.type,
          date,
        }),
      });

      if (!urlRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, r2Key } = await urlRes.json();

      // Step 2: Upload directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: filePreview.file,
        headers: { "Content-Type": filePreview.file.type },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image");
      }

      // Step 3: Create DB record
      const recordRes = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          r2Key,
          date,
          description: description || undefined,
          location: location || undefined,
        }),
      });

      if (!recordRes.ok) {
        throw new Error("Failed to save image record");
      }

      toast.success("Image uploaded successfully!");
      clearFile();
      setDescription("");
      setLocation("");
      onUploadComplete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!filePreview ? (
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm font-medium">
            {isDragActive ? "Drop your image here" : "Drag & drop an image, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG, WebP, HEIC up to 10 MB
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={filePreview.preview}
              alt="Preview"
              className="w-full max-h-80 object-contain rounded-lg border bg-muted/30"
            />
            <Button
              variant="destructive"
              size="icon-xs"
              className="absolute top-2 right-2"
              onClick={clearFile}
              disabled={uploading}
            >
              <X />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="date" className="text-sm font-medium">
                Date
              </label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="location"
                placeholder="e.g. Paris, France"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={uploading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              placeholder="What's this moment about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
            />
          </div>

          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImageIcon />
                Upload to Calendar
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
