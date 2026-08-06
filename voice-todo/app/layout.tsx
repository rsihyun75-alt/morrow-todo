import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "留먰빐遊?| Voice Todo",
  description: "Chrome ?뚯꽦 ?몄떇?쇰줈 ?앷컖?????쇱쓣 鍮좊Ⅴ寃?湲곕줉?섎뒗 紐⑤컮??To-do ??,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f0e8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
