import type { Metadata } from "next";
import { NoInternetView } from "@/components/connection/no-internet-view";

export const metadata: Metadata = {
  title: "Offline | Spurs Business",
  description: "You're not connected to the internet.",
};

export default function OfflinePage() {
  return <NoInternetView />;
}
