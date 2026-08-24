import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConnectLive Partner Portal",
  description: "Venue management dashboard for ConnectLive partners — create incentives and events that appear on the ConnectLive app.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
