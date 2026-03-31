"use client";

/**
 * Static preview page for the storytelling date detail view.
 * Uses mock data to demonstrate the hero image, timeline layout,
 * inline caption editing, and dropzone. Not linked in navigation.
 *
 * Visit: /date/preview
 */

import { useState } from "react";
import { ArrowLeft, ImagePlus, MapPin, Clock, Pencil, Check, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MOCK_IMAGES = [
  {
    id: "1",
    date: "2026-03-15",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=60",
    description: "Morning hike through the valley",
    location: "Yosemite National Park",
    tags: [],
    isCover: true,
    createdAt: "2026-03-15T08:30:00.000Z",
  },
  {
    id: "2",
    date: "2026-03-15",
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=60",
    description: "Golden hour at the lake",
    location: "Mirror Lake",
    tags: [],
    isCover: false,
    createdAt: "2026-03-15T17:45:00.000Z",
  },
  {
    id: "3",
    date: "2026-03-15",
    url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=60",
    description: null,
    location: null,
    tags: [],
    isCover: false,
    createdAt: "2026-03-15T19:20:00.000Z",
  },
];

export default function DateDetailPreview() {
  const coverImage = MOCK_IMAGES.find((img) => img.isCover)!;
  const otherImages = MOCK_IMAGES.filter((img) => !img.isCover);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">Sunday, March 15, 2026</h1>
        </div>
        <Button variant="outline" size="sm">
          <ImagePlus />
          Add Photo
        </Button>
      </div>

      {/* Hero cover image */}
      <div className="group relative rounded-2xl overflow-hidden">
        <img
          src={coverImage.url}
          alt={coverImage.description || ""}
          className="w-full max-h-[50vh] object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-5 pt-16">
          <p className="text-sm text-white">{coverImage.description}</p>
          <p className="flex items-center gap-1.5 text-sm text-white/80 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {coverImage.location}
          </p>
        </div>
        <span className="absolute top-3 left-3 rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-medium text-white">
          Cover
        </span>
      </div>

      {/* Timeline */}
      <div className="relative pl-8 border-l-2 border-rose-200/60 space-y-6 ml-4">
        {otherImages.map((image) => (
          <div key={image.id} className="relative">
            <div className="absolute -left-[41px] top-3 h-3 w-3 rounded-full bg-rose-400 ring-4 ring-background" />
            <div className="group rounded-xl border bg-card overflow-hidden">
              <img
                src={image.url}
                alt={image.description || ""}
                className="w-full max-h-80 object-cover"
              />
              <div className="p-4 space-y-2">
                {image.description ? (
                  <p className="text-sm">{image.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">Add a caption...</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(image.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  {image.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {image.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inline upload */}
      <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 p-6 cursor-pointer hover:border-rose-300/50 hover:bg-muted/10 transition-colors text-center">
        <Upload className="h-5 w-5 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Drop a photo here to add to this day
        </p>
      </div>
    </div>
  );
}
