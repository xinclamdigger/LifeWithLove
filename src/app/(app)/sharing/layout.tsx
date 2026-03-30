import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sharing",
};

export default function SharingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
