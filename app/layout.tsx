import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "../components/ReduxProvider";

export const metadata: Metadata = {
  title: "Business Management App",
  description: "Deep business management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}