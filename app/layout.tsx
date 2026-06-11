import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Fixture & Points Table Manager | Eagle Box Cricket",
  description:
    "A premium internship demo dashboard for managing cricket teams, fixtures, results, standings, and reports."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
