import type { Metadata } from "next";
import { ConnectionGuard } from "@/components/connection/connection-guard";
import "./globals.css";



export const metadata: Metadata = {
  title: "Spurs Business",
  description: "Manage your Spurs business workspaces.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={` h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ConnectionGuard />
      </body>
    </html>
  );
}
