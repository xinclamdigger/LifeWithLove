"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ImageData } from "./ImageCard";

interface ImageLightboxProps {
  image: ImageData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({ image, open, onOpenChange }: ImageLightboxProps) {
  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          {image.description || "Image view"}
        </DialogTitle>
        {image.description && (
          <DialogDescription className="sr-only">
            {image.description}
          </DialogDescription>
        )}
        <img
          src={image.url}
          alt={image.description || ""}
          className="w-full max-h-[80vh] object-contain"
        />
        {(image.description || image.location) && (
          <div className="p-4 space-y-1">
            {image.description && (
              <p className="text-sm">{image.description}</p>
            )}
            {image.location && (
              <p className="text-xs text-muted-foreground">{image.location}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
