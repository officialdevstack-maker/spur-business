import "server-only";

import { redirect } from "next/navigation";
import { VtuNotConnectedError } from "@/lib/vtu/client";

export async function withVtuConnection<T>(workspaceId: string, load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof VtuNotConnectedError) redirect(`/w/${workspaceId}/vtu/connect`);
    throw error;
  }
}
