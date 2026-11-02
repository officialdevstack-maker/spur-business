import type { Metadata } from "next";
import { SlowInternetView } from "@/components/connection/slow-internet-view";

export const metadata: Metadata = {
  title: "Slow connection | Spurs Business",
  description: "Your internet connection is slow.",
};

export default function SlowConnectionPage() {
  return <SlowInternetView />;
}
