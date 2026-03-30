import Link from "next/link";
import { UserMenu } from "@/components/layout/UserMenu";
import { Calendar, Upload, Share2 } from "lucide-react";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/calendar" className="text-lg font-bold tracking-tight">
          LifeWithLove
        </Link>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 md:hidden">
          <Link
            href="/calendar"
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Calendar className="h-5 w-5" />
          </Link>
          <Link
            href="/upload"
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Upload className="h-5 w-5" />
          </Link>
          <Link
            href="/sharing"
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Share2 className="h-5 w-5" />
          </Link>
        </nav>

        <UserMenu user={user} />
      </div>
    </header>
  );
}
