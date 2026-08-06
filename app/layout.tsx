import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "morrow — 오늘의 할 일",
  description: "오늘에 집중하는 조용한 할 일 공간, morrow.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
