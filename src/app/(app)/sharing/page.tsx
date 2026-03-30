"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Share2, Loader2, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface SharedByMe {
  id: string;
  sharedWithId: string;
  sharedWithName: string;
  sharedWithEmail: string;
  sharedWithAvatar: string | null;
  createdAt: string;
}

interface SharedWithMe {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerAvatar: string | null;
  createdAt: string;
}

export default function SharingPage() {
  const [email, setEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sharedByMe, setSharedByMe] = useState<SharedByMe[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedWithMe[]>([]);

  const fetchShares = async () => {
    try {
      const res = await fetch("/api/shares");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setSharedByMe(data.sharedByMe);
      setSharedWithMe(data.sharedWithMe);
    } catch {
      toast.error("Failed to load shares");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSharing(true);
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to share");
      }

      toast.success(`Calendar shared with ${email}`);
      setEmail("");
      fetchShares();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to share");
    } finally {
      setSharing(false);
    }
  };

  const handleRevoke = async (shareId: string, name: string) => {
    try {
      const res = await fetch(`/api/shares?id=${shareId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      setSharedByMe((prev) => prev.filter((s) => s.id !== shareId));
      toast.success(`Removed ${name}'s access`);
    } catch {
      toast.error("Failed to revoke share");
    }
  };

  function initials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sharing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your calendar with others so they can view your photos.
        </p>
      </div>

      {/* Share form */}
      <form onSubmit={handleShare} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter email to share with..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={sharing}
          className="flex-1"
        />
        <Button type="submit" disabled={sharing || !email.trim()}>
          {sharing ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Share2 />
          )}
          Share
        </Button>
      </form>

      <Separator />

      {/* Shared by me */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">People with access</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-48 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : sharedByMe.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t shared your calendar with anyone yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {sharedByMe.map((share) => (
              <li
                key={share.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar size="default">
                    {share.sharedWithAvatar && (
                      <AvatarImage src={share.sharedWithAvatar} />
                    )}
                    <AvatarFallback>
                      {initials(share.sharedWithName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{share.sharedWithName}</p>
                    <p className="text-xs text-muted-foreground">
                      {share.sharedWithEmail}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRevoke(share.id, share.sharedWithName)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator />

      {/* Shared with me */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Shared with me</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-48 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : sharedWithMe.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one has shared their calendar with you yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {sharedWithMe.map((share) => (
              <li key={share.id}>
                <Link
                  href={`/calendar/${share.ownerId}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/50"
                >
                  <Avatar size="default">
                    {share.ownerAvatar && (
                      <AvatarImage src={share.ownerAvatar} />
                    )}
                    <AvatarFallback>
                      {initials(share.ownerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {share.ownerName}&apos;s Calendar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {share.ownerEmail}
                    </p>
                  </div>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
