import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DAOboard — 실시간 코딩 대시보드",
  description: "Discord 메시지 기반 실시간 코딩 진행상황 대시보드",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
  openGraph: {
    title: "DAOboard — 실시간 코딩 대시보드",
    description: "Discord 연동 실시간 팀 코딩 진행상황 대시보드. 세션, 태스크, 마일스톤을 한눈에.",
    type: "website",
    locale: "ko_KR",
    siteName: "DAOboard",
  },
  twitter: {
    card: "summary",
    title: "DAOboard — 실시간 코딩 대시보드",
    description: "Discord 연동 실시간 팀 코딩 진행상황 대시보드",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('daoboard-theme');document.documentElement.classList.toggle('dark',t!=='light')}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
