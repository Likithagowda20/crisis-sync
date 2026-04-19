import type { Metadata } from "next";
import "./globals.css";
import { SocketProvider } from "@/lib/socket";

export const metadata: Metadata = {
  title: "Crisis Sync Dashboard",
  description: "Real-time Crisis Response for Hospitality",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans"
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-slate-50">
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
