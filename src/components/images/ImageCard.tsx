"use client";

import { Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ImageData {
  id: string;
  date: string;
  url: string;
  thumbnailUrl: string;
  description: string | null;
  location: string | null;
  tags: string[];
  isCover: boolean;
  createdAt: string;
}

interface ImageCardProps {
  image: ImageData;
  onView: () => void;
  onDelete: (id: string) => void;
  isOwner: boolean;
}

export function ImageCard({ image, onView, onDelete, isOwner }: ImageCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <button
        onClick={onView}
        className="block w-full aspect-square cursor-pointer"
      >
        <img
          src={image.thumbnailUrl}
          alt={image.description || ""}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </button>
      <div className="p-2.5 space-y-1">
        {image.description && (
          <p className="text-sm line-clamp-2">{image.description}</p>
        )}
        {image.location && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {image.location}
          </p>
        )}
      </div>
      {isOwner && (
        <Button
          variant="destructive"
          size="icon-xs"
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image.id);
          }}
        >
          <Trash2 />
        </Button>
      )}
      {image.isCover && (
        <span className="absolute top-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
          Cover
        </span>
      )}
    </div>
  );
}
