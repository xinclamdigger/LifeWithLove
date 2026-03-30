"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Upload, Share2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/calendar", label: "My Calendar", icon: Calendar },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/sharing", label: "Sharing", icon: Share2 },
];

interface SharedCalendar {
  ownerId: string;
  ownerName: string;
  ownerAvatar: string | null;
}

export function Sidebar() {
  const pathname = usePathname();
  const [sharedCalendars, setSharedCalendars] = useState<SharedCalendar[]>([]);

  useEffect(() => {
    fetch("/api/shares")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sharedWithMe) {
          setSharedCalendars(
            data.sharedWithMe.map((s: { ownerId: string; ownerName: string; ownerAvatar: string | null }) => ({
              ownerId: s.ownerId,
              ownerName: s.ownerName,
              ownerAvatar: s.ownerAvatar,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  function initials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <aside className="hidden md:flex w-56 flex-col border-r bg-card">
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/calendar"
              ? pathname === "/calendar"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {sharedCalendars.length > 0 && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Shared with me
              </p>
            </div>
            {sharedCalendars.map((cal) => {
              const href = `/calendar/${cal.ownerId}`;
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={cal.ownerId}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Avatar size="sm">
                    {cal.ownerAvatar && (
                      <AvatarImage src={cal.ownerAvatar} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {initials(cal.ownerName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{cal.ownerName}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
