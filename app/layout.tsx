import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "morrow — 오늘의 할 일",
  description: "작은 루틴이 모여 더 나은 하루가 되는 To-do 앱",
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
