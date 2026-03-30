import type { Metadata } from "next";
import { format, parseISO } from "date-fns";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  try {
    const formatted = format(parseISO(date), "MMMM d, yyyy");
    return { title: formatted };
  } catch {
    return { title: "Date Detail" };
  }
}

export default function DateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
