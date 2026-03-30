import type { ReactNode } from "react";
import { notFound } from "next/navigation";

export default function AdminExhibitionCategoriesHiddenLayout({
  children,
}: {
  children: ReactNode;
}) {
  void children;
  notFound();
}
